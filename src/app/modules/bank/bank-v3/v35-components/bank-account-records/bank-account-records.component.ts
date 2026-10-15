import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  effect,
  inject,
  input
} from '@angular/core';
import { bankDataDescriptionComponent } from 'src/app/modules/bank-data/pages/view-bank-data/bankDataDescription';
import { BankDataCommonSearchComponent } from 'src/app/modules/bank-data/pages/view-bank-data/dtBankDataSearch';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { Subject, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  IBankDataAccount,
  IBankDataProviderAccounts,
  IBankDataRes
} from '../../model/bank-v35';

@Component({
  selector: 'app-bank-account-records',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, V3DataTableComponent],
  templateUrl: './bank-account-records.component.html',
  styleUrl: './bank-account-records.component.scss'
})
export class BankAccountRecordsComponent implements OnInit, OnDestroy {
  private currencyPipe = inject(CurrencyPipe);
  private datePipe = inject(DatePipe);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private bankDataService = inject(BankDataService);

  @Output() errorOutput = new EventEmitter<HttpErrorResponse>();

  plaidId = input.required<string>();
  bankDataSubject = input.required<IBankDataRes | undefined>();

  public tableId = DTTableId.bankData;
  additionalPayload = {
    view_from: 'bank',
    filteredBankAccounts: '',
    categoriesList: '',
    filteredDescription: '',
    filteredCategory: '',
    filteredDate: '',
    filteredAmount: ''
  };

  destroy$ = new Subject<boolean>();

  providerAccounts: IBankDataProviderAccounts[] = [];
  categories: {
    [categoryId: string]: string;
  } = {};

  allAccounts: {
    [accountId: string]: IBankDataAccount;
  } = {};

  constructor() {
    effect(() => {
      const data = this.bankDataSubject();
      if (!data) return;

      this.setInitialValues(data);
    });
  }

  ngOnInit(): void {
    this.additionalPayload.filteredBankAccounts = this.plaidId();
    this.dataTableService.setDataFromParent(this.columnFields);
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.getIndex();
    this.getCategories();
    this.bankDataService.searchEvent$
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (search.colId) {
          this.customSearch(search);
        }
      });
  }

  getIndex() {
    const data = this.bankDataSubject();
    if (!data) return;

    this.setInitialValues(data);
  }

  private getCategories(): void {
    this.bankDataService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.success) {
          this.bankDataService.setCategory(res.data);
        }
      });
  }

  setInitialValues(data: IBankDataRes) {
    this.categories = data.categories;
    this.allAccounts = data.accounts;
    this.providerAccounts = data.providerAccounts;
    this.bankDataService.categoriesKeyVal = data.categories;
    this.bankDataService.accounts = data.providerAccounts.reduce(
      (pre: Record<string, IBankDataAccount>, bank) => {
        const val = pre;
        for (let i = 0; i < bank.accounts.length; i += 1) {
          const acc = bank.accounts[i];

          if (acc.status) {
            val[acc.id] = acc;
          }
        }
        return val;
      },
      {}
    );
  }

  onError(err: HttpErrorResponse) {
    this.errorOutput.emit(err);
  }

  customSearch(search: { searchString: string; colId: string }) {
    const { searchString, colId } = search;

    switch (colId) {
      case 'description_custom':
        this.additionalPayload.filteredDescription = searchString;
        break;
      case 'date':
        this.additionalPayload.filteredDate = searchString;
        break;
      case 'amountAmount':
        this.additionalPayload.filteredAmount = searchString;
        break;
      case 'category_id_custom':
        this.additionalPayload.filteredCategory = searchString;
        break;
      case 'account_id':
        this.additionalPayload.filteredBankAccounts =
          this.filterAccounts(searchString);
        break;
      default:
        break;
    }

    this.v3DataTableService.setPostdata(this.additionalPayload);
  }

  filterAccounts(searchString: string) {
    const filteredAcc: string[] = [];

    this.providerAccounts.forEach((prov) => {
      filteredAcc.push(
        ...((prov?.accounts ?? [])
          .map((e: { id: string }) => {
            if (searchString) {
              return e.id === searchString ? e.id : undefined;
            }
            return e.id;
          })
          .filter(Boolean) as string[])
      );
    });

    return filteredAcc.toString();
  }

  getAccountName(id: string): string {
    if (!(id in this.allAccounts)) {
      return '';
    }
    const account = this.allAccounts[id];
    let name = account.short_name ? account.short_name : account.nick_name;
    if (!name) {
      name = account.name?.trim();
    }
    return name as string;
  }

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    bankDataDescription: bankDataDescriptionComponent,
    bankDataSearch: BankDataCommonSearchComponent
  };

  colDefIndex = {
    headerName: '#',
    field: 'checkNumber',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
    headerClass: 'pl-3.5',
    suppressHeaderMenuButton: true,
    sortable: false,
    lockPosition: true,
    cellClass: 'flex justify-center',
    cellRenderer: (params: ICellRendererParams) => {
      if (params && params.node.rowIndex !== undefined) {
        return (params.node.rowIndex ?? 0) + 1;
      }
      return '';
    }
  };

  colDefDescription = {
    headerName: 'Description',
    field: 'description_custom',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'bankDataDescription',
    cellRendererParams: {
      page: 'bank-accounts'
    },
    cellRendererForExport: (params: ICellRendererParams) => {
      let description = 'null';
      if (params?.data?.description_custom) {
        description = params.data.description_custom;
      } else if (params?.value) {
        description = params.value;
      } else if (params?.data?.original_description) {
        description = params.data.original_description;
      }

      return description;
    }
  };

  colDefDate = {
    headerName: 'Date',
    field: 'date',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: (params: ICellRendererParams) =>
      this.datePipe.transform(params?.value, 'MM/dd/yyyy') as string
  };

  colDefCategory = {
    headerName: 'Category',
    field: 'category_id_custom',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    floatingFilterComponent: 'bankDataSearch',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'bankDataDescription',
    cellRendererParams: {
      page: 'bank-accounts'
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      ((params?.data?.category_name_custom as string) || '').replace(
        /&nbsp;/g,
        ''
      )
  };

  colDefAccount = {
    headerName: 'A/C',
    field: 'account_id',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'bankDataSearch',
    filter: 'agTextColumnFilter',
    cellRenderer: (params: ICellRendererParams) => {
      const name = (params?.data?.account_name ?? '') as string;
      return `<span title="${name}">${name}</span>`;
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      (params?.data?.account_name ?? '') as string
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amountAmount',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',

    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  columnDefs = [
    this.colDefDescription,
    this.colDefDate,
    this.colDefCategory,
    this.colDefAccount,
    this.colDefAmount
  ];

  columnFields = [
    {
      id: 'SNo',
      name: '#',
      isDisabled: true,
      colDef: this.colDefIndex,
      isChecked: true
    },
    {
      id: 'description',
      name: 'Description',
      isDisabled: false,
      colDef: this.colDefDescription,
      isChecked: true
    },
    {
      id: 'date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'category',
      name: 'Category',
      isDisabled: false,
      colDef: this.colDefCategory,
      isChecked: true
    },
    {
      id: 'account',
      name: 'A/C',
      isDisabled: false,
      colDef: this.colDefAccount,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    }
  ];

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

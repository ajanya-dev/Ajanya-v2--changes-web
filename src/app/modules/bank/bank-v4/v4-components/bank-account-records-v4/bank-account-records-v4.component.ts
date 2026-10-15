import { GridApi, ICellRendererParams } from '@ag-grid-community/core';
import { DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4AmountFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-amount-floating-filter/v4-amount-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import {
  IBankDataAccount,
  IBankDataProviderAccounts,
  IBankDataRes
} from 'src/app/modules/bank/bank-v3/model/bank-v35';
import {
  buildCategoryTree,
  indentNameByLevel
} from 'src/app/modules/bank-data-v4/services/bank-data-v4-category.util';
import {
  BankDataV4PostdataFilterComponent,
  IBankDataV4FilterOption
} from 'src/app/modules/bank-data-v4/components/txn-postdata-filter/bank-data-v4-postdata-filter.component';
import { BankDataV4TxnCellComponent } from 'src/app/modules/bank-data-v4/components/txn-cell/bank-data-v4-txn-cell.component';
import { IBankDataV4TxnRow } from 'src/app/modules/bank-data-v4/models/bank-data-v4-api.types';

/**
 * v4 port of BankAccountRecordsComponent (bank-v3).
 * Renders the Plaid bank-data records table using app-v4-data-table
 * (instead of the v3 data table) and v4 floating filter components.
 * Logic and additionalPayload are kept identical to the v3 version
 * so behavior matches.
 */
@Component({
  selector: 'app-bank-account-records-v4',
  standalone: true,
  imports: [DatePipe, V4DataTableComponent],
  template: `
    <div class="relative">
      <div
        class="absolute top-0 left-1 h-[40px] flex items-center z-10"
      >
        <h3 class="text-base font-semibold text-v4-main-text-color">
          Bank Records
        </h3>
      </div>
      <app-v4-data-table
        [columnDefs]="columnDefs"
        [tableId]="tableId"
        [defaultDisabledColumn]="['description_custom']"
        [frameworkComponents]="frameworkComponents"
        [additionalPayload]="additionalPayload"
        [deferInitialLoad]="true"
        (gridReadyOutput)="onGridReady($event)"
        (errorOutput)="onError($event)"
      />
    </div>
  `
})
export class BankAccountRecordsV4Component implements OnInit, OnDestroy {
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

  categoriesLoaded = signal(false);
  destroy$ = new Subject<boolean>();

  providerAccounts: IBankDataProviderAccounts[] = [];
  categories: { [categoryId: string]: string } = {};
  allAccounts: { [accountId: string]: IBankDataAccount } = {};
  categoryFilterOpts: IBankDataV4FilterOption[] = [];

  constructor() {
    effect(() => {
      const data = this.bankDataSubject();
      if (!data) return;
      this.setInitialValues(data);
    });
  }

  ngOnInit(): void {
    this.additionalPayload.filteredBankAccounts = this.plaidId();
    this.getIndex();
    this.bankDataService.searchEvent$
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (search.colId) {
          this.customSearch(search);
        }
      });
    this.loadCategories();
  }

  private loadCategories(): void {
    this.bankDataService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const selectBox = res?.success && Array.isArray(res.data?.categories)
          ? this.buildCategorySelectBox(res.data.categories)
          : [];
        this.categoryFilterOpts = selectBox[0]?.values ?? [];
        this.dataTableService.setDataFromParent(
          this.columnFields,
          { selectBox }
        );
        this.v3DataTableService.resetV3DataTablePayload();
        this.v3DataTableService.refreshV3DataTable();
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
        this.categoriesLoaded.set(true);
      });
  }

  getIndex() {
    const data = this.bankDataSubject();
    if (!data) return;
    this.setInitialValues(data);
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

  onGridReady(api: GridApi): void {
    // Table shell is visible immediately; keep the loading overlay until the
    // categories API and the /ag-grid/42 data response have both returned.
    if (!this.categoriesLoaded()) {
      api.showLoadingOverlay();
    }
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
    if (!(id in this.allAccounts)) return '';
    const account = this.allAccounts[id];
    let name = account.short_name ? account.short_name : account.nick_name;
    if (!name) {
      name = account.name?.trim();
    }
    return name as string;
  }

  private buildCategorySelectBox(
    categories: { id: string; name: string; parent_category_id?: string | null }[]
  ) {
    return [{
      id: 'category_id_custom',
      values: buildCategoryTree(categories).map((node) => ({
        value: node.id,
        name: indentNameByLevel(node.name, node.level || 0)
      }))
    }];
  }

  categoryFilterOptions = (): IBankDataV4FilterOption[] => this.categoryFilterOpts;

  onCategoryFilter = (value: string): void => {
    this.additionalPayload.filteredCategory = value;
    this.v3DataTableService.setPostdata(this.additionalPayload);
  };

  getCategoryName = (row: IBankDataV4TxnRow): string =>
    ((row.category_name_custom as string) || '').replace(/&nbsp;/g, '');

  /** Framework components — fully v4 floating filters & cell renderers. */
  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    actionComponent: DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4DateFloatingFilterComponent: V4DateFloatingFilterComponent,
    dateRangeV35Component: V4DateFloatingFilterComponent,
    v4AmountFloatingFilterComponent: V4AmountFloatingFilterComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    bankDataDescription: V3DTCommonFilterComponent,
    bankDataSearch: V4TextFloatingFilterComponent,
    postdataDropdown: BankDataV4PostdataFilterComponent,
    txnCell: BankDataV4TxnCellComponent,
    V3DTCommonFilterComponent
  };

  /* Column Definitions */

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
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { suffixOptionalField: 'original_description' },
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
    floatingFilterComponent: 'v4DateFloatingFilterComponent',
    filter: 'agDateColumnFilter',
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: (params: ICellRendererParams) =>
      this.datePipe.transform(params?.value, 'MM/dd/yyyy') as string
  };

  colDefCategory = {
    headerName: 'Category',
    field: 'category_id_custom',
    minWidth: 160,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponent: 'postdataDropdown',
    floatingFilterComponentParams: {
      getOptions: this.categoryFilterOptions,
      onSelect: this.onCategoryFilter,
      placeholder: 'All'
    },
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'txnCell',
    cellRendererParams: {
      getCategoryName: this.getCategoryName
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      this.getCategoryName(params?.data as IBankDataV4TxnRow)
  };

  colDefAccount = {
    headerName: 'A/C',
    field: 'account_id',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { prefixOptionalField: 'account_name' },
    valueGetter: (params: { data?: { account_name?: string } }) =>
      params?.data?.account_name ?? '',
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
    floatingFilterComponent: 'v4AmountFloatingFilterComponent',
    filter: 'agTextColumnFilter',
    cellClass: 'flex flex-col justify-center items-end pr-3',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { isAmountField: true }
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

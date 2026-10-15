import {
  Component,
  Injector,
  OnDestroy,
  OnInit,
  effect,
  inject
} from '@angular/core';
import { ColDef } from '@ag-grid-community/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { IFilterModel } from 'src/app/models/v3-datatable';
import { Subject, Subscription } from 'rxjs';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { CloudListV35Service } from '../../services/cloud-list-v35.service';
import { CloudAccountDataTableV3ActionComponent } from './cloud-account-data-table-v3-action.component';
import { CloudBankDetailsDataV35Service } from '../../services/cloud-bank-details-data-v35.service';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { CloudAccountDTHeaderComponent } from './cloud-account-dt-header.component';

@Component({
  selector: 'app-cloud-account-data-table-v3',
  templateUrl: './cloud-account-data-table-v3.component.html',
  styleUrls: ['./cloud-account-data-table-v3.component.scss'],
  providers: [TitleCasePipe],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class CloudAccountDataTableV3Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private cloudListV35Service = inject(CloudListV35Service);
  private cloudService = inject(CloudBankService);
  private cloudDetailsV35Service = inject(CloudBankDetailsDataV35Service);
  private injector = inject(Injector);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);

  /**
   * @description Variables
   */
  accountId: string;
  tableId = DTTableId.cloudAccountTransactions;
  destroy$ = new Subject();
  subscriptions: Subscription[] = [];

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'pending', name: 'Pending' },
          { value: 'canceled', name: 'Canceled' },
          { value: 'failed', name: 'Failed' },
          { value: 'settled', name: 'Settled' },
          { value: 'processing', name: 'Processing' }
        ]
      },
      {
        id: 'txn_type',
        values: [
          { value: 'debit', name: 'Debit' },
          { value: 'credit', name: 'Credit' }
        ]
      },
      {
        id: 'transfer_type',
        values: [
          { value: 'ach', name: 'ACH' },
          { value: 'card', name: 'Card' },
          { value: 'bankTransfer', name: 'Bank Transfer' },
          { value: 'internationalWire', name: 'International Wire' },
          { value: 'domesticWire', name: 'Domestic Wire' },
          { value: 'intraTransfer', name: 'Intra Transfer' }
        ]
      }
    ]
  };

  frameWorkComponents = {
    searchBoxComponent: DtSearchBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    dateFilterComponent: DataRangeV35Component,
    V3DTCommonFilterComponent,
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterConfigurations
    );
    this.getAccountChangeEvents();
  }

  onExportData(event: { fileFormat: string; fromDate: Date; toDate: Date }) {
    const { accountId } = this.cloudDetailsV35Service;
    if (accountId) {
      const body: Record<string, string | number> = {
        fromDate: this.transformDate(event.fromDate),
        toDate: this.transformDate(event.toDate),
        type: event.fileFormat,
        purpose: 2,
        dateType: 1
      };
      this.subscriptions.push(
        this.cloudService
          .downloadStatement(body, accountId)
          .subscribe((res) => {
            if (res.success) {
              if (res.url) {
                const urlLoaded = window.open(res?.url);
                if (!urlLoaded) {
                  window.open(res.url);
                }
              } else {
                this.alertService.successAlert({
                  content:
                    'Your bank statement is emailed successfully.Check the email to download the statement'
                });
              }
            }
          })
      );
    }
  }

  transformDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') ?? '';
  }

  /**
   * Subscribing to account change events and changing the ag-grid filter to update the table.
   */
  getAccountChangeEvents() {
    effect(
      () => {
        const accountId = this.cloudListV35Service.selectedAccountSignal()?.id;
        if (accountId) {
          this.initializeV3DataTable({
            account_id: {
              filter: accountId,
              filterType: 'text',
              type: 'equals'
            }
          });
        }
      },
      { injector: this.injector }
    );
  }

  initializeV3DataTable(filterModel: IFilterModel) {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      sortModel: [],
      filterModel
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  colDefAmount: ColDef = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererParams:{
      isAmountField: true
    },
    cellClass: (params) => {
      if (params.data.txn_type === 'credit') {
        return 'text-common-green-color font-medium flex justify-end pr-3 text-end mt-0.5';
      }
      return 'text-common-red-color font-medium flex justify-end pr-3 text-end mt-0.5';
    },
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'balance',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRendererParams:{
      isAmountField: true
    },
    cellRenderer: 'V3DTCommonFilterComponent',
  };
  
  colDefTitle: ColDef = {
    headerName: 'Pay From/To',
    field: 'title',
    headerComponent: CloudAccountDTHeaderComponent, // Custom header component
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefTxnType: ColDef = {
    headerName: 'Transaction Type',
    field: 'txn_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isApplyTitleCase: true
    }
  };

  colDefiTransferType: ColDef = {
    headerName: 'Transfer Type',
    field: 'transfer_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefiStatus: ColDef = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    floatingFilterComponent: 'selectBoxComponent',
    cellClass: (params) => {
      if (params.value === 'failed') return 'font-medium text-common-red-color';

      if (params.value === 'processing')
        return 'font-medium text-common-blue-color';

      if (params.value === 'pending')
        return 'font-medium text-common-yellow-color';

      if (params.value === 'canceled')
        return 'font-medium text-common-red-color';

      if (params.value === 'settled')
        return 'font-medium text-common-green-color';

      return '';
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isApplyTitleCase: true
    }
  };

  colDefDate = {
    headerName: 'Date',
    field: 'txn_date',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'dateFilterComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' }
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    maxWidth: 50,
    minWidth: 50,

    cellRenderer: CloudAccountDataTableV3ActionComponent
  };

  columnDefs = [
    this.colDefTitle,
    this.colDefAmount,
    this.colDefBalance,
    this.colDefTxnType,
    this.colDefiTransferType,
    this.colDefiStatus,
    this.colDefDate,
    this.colDefAction
  ];

  columnFields = [
    {
      id: 'title',
      name: 'Pay From/To',
      isDisabled: false,
      colDef: this.colDefTitle,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'balance',
      name: 'Balance',
      isDisabled: true,
      colDef: this.colDefBalance,
      isChecked: true
    },
    {
      id: 'txn_type',
      name: 'Transaction Type',
      isDisabled: false,
      colDef: this.colDefTxnType,
      isChecked: true
    },
    {
      id: 'transfer_type',
      name: 'Transfer Type',
      isDisabled: false,
      colDef: this.colDefiTransferType,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefiStatus,
      isChecked: true
    },
    {
      id: 'txn_date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'id',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}

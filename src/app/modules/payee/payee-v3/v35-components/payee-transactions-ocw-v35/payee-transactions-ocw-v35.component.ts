import { V3CreatedAtComponent } from './../../../../../shared/v3/dt-cellrenderers/v3-created-at/v3-created-at.component';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { OnDestroy, inject, OnInit, Component } from '@angular/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { DatePipe, NgClass } from '@angular/common';
import { ISelectBoxFilterArray } from '../../../../../models/v3-datatable';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V35PayeeStatusComponent } from './v35-payee-table-status.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { TooltipOnEllipsisComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/tooltip-on-ellipsis/tooltip-on-ellipsis.component';
import { PayeeReceivedTransactionsComponent } from '../payee-received-transactions/payee-received-transactions.component';

@Component({
  selector: 'app-payee-transactions-ocw-v35',
  templateUrl: './payee-transactions-ocw-v35.component.html',
  styleUrls: ['./payee-transactions-ocw-v35.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent,NgClass,PayeeReceivedTransactionsComponent]
})
export class PayeeTransactionsOcwV35Component implements OnInit, OnDestroy {
  /* Injectors */
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private payeeDataService = inject(PayeeDataV35Service);
  private reportService = inject(ReportsService);
  private datePipe = inject(DatePipe);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);

  /* AG Grid Table Number */
  tableId = DTTableId.payeeTransactions;
  cellRendererCheckStatus?: Record<string, ICheckStatus>;
  loading = false;
  subscriptions: Subscription[] = [];
  activeTab = 'send';
  payeeId: string;
  payeeEmail:string | undefined;
  destroy$ = new Subject();
  selectedPayee$ = toObservable(this.payeeDataService.payeeDataSignal);

  /* Induvidual Column Definitions */
  colDefSource: ICoulmnDefFields = {
    headerName: 'Source',
    field: 'source_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefAmount: ICoulmnDefFields = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 100,
    maxWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererParams:{
      isAmountField: true
    },
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefTransferMode = {
    headerName: 'Mode of Transfer',
    field: 'transfer_mode',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    cellRenderer: 'v3ModeOfTransferComponent',
    valueGetter: (params: { data: ICommonTransactionTableData }) =>
      params.data.transfer_type
  };

  colDefReferenceId: ICoulmnDefFields = {
    headerName: 'Reference Id',
    field: 'reference_no',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefStatus: ICoulmnDefFields = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payee_transaction'
    },
    cellRenderer: 'V35PayeeStatusComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: (
      params: ICellRendererParams<ICommonTransactionTableData>
    ) => {
      const status = params.data?.transfer?.status;
      let checkStatus;
      let checkColor;
      if (status || status === 0) {
        checkStatus =
          this.cellRendererCheckStatus?.[status]?.statusShortDescription;
        checkColor = this.cellRendererCheckStatus?.[status]?.color;
      }
      if (checkStatus === 'New') {
        checkStatus = 'Pending';
      }
      return {
        tableType: 'payments-table',
        checkStatus: { value: checkStatus, color: checkColor }
      };
    }
  };

  colDefDescription: ICoulmnDefFields = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 200,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'justify-center',
    cellRenderer: 'TooltipOnEllipsisComponent'
  };


  colDefCreatedTime: ICoulmnDefFields = {
    headerName: 'Updated At',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    cellRenderer: 'V3CreatedAtComponent',
    valueGetter: (params) => params.data.updated_at
  };

  colDefViewButton: ICoulmnDefFields = {
    headerName: 'View',
    field: 'view',
    minWidth: 30,
    sortable: false,
    cellRenderer: 'v3ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 0
    },
    suppressHeaderMenuButton: true
  };

  /* Set Column Definitions */
  columnDefs = [
    this.colDefSource,
    this.colDefAmount,
    this.colDefTransferMode,
    this.colDefStatus,
    this.colDefDescription,
    this.colDefCreatedTime,
    this.colDefReferenceId,
    this.colDefViewButton
  ];

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    searchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    v3StatusComponent: V3StatusComponent,
    v3PayeeNameComponent: V3PayeeNameComponent,
    v3ModeOfTransferComponent: V3ModeOfTransferComponent,
    v3ViewButtonComponent: V3ViewButtonComponent,
    V35PayeeStatusComponent,
    V3DTCommonFilterComponent,
    TooltipOnEllipsisComponent,
    V3CreatedAtComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'PENDING' },
          { value: '1', name: 'PROCESSING' },
          { value: '2', name: 'COMPLETED' },
          { value: '3', name: 'CANCELED' },
          { value: '4', name: 'FAILED' },
          { value: '6', name: 'APPROVAL REQUIRED' },
          { value: '7', name: 'APPROVED' },
          { value: '8', name: 'REJECTED' }
        ]
      },
      {
        id: 'transfer_mode',
        values: [
          { value: '0', name: 'Check' },
          { value: '1', name: 'ACH' },
          { value: '2', name: 'Print' },
          { value: '3', name: 'Mail Check' },
          { value: '4', name: 'Email Check' },
          { value: '5', name: 'International Payment' },
          { value: '6', name: 'Wire' },
          { value: '7', name: 'Virtual Card' },
          { value: '8', name: 'Mail' }
        ]
      },
      {
        id: 'cheques.cheque_status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Printed' },
          { value: '2', name: 'Void' },
          { value: '4', name: 'Printing' },
          { value: '7', name: 'Mailed' },
          { value: '50', name: 'Scheduled' },
          { value: 'emailed', name: 'Emailed' },
          { value: 'eprinted', name: 'E-Printed' },
          { value: 'dd', name: 'DD' },
          { value: 'dd-funding', name: 'DD-FUNDING' },
          { value: 'dd-failed', name: 'DD-FAILED' },
          { value: 'ddw', name: 'DDW' },
          { value: 'dd-depositing', name: 'DD-DEPOSITING' },
          { value: 'dd-depositing-failed', name: 'DD-DEPOSIT-F' },
          { value: 'ddc', name: 'DDC' },
          { value: 'show_posted', name: 'Posted' },
          { value: 'show_un_posted', name: 'Un-Posted' },
          { value: 'unmapped-checks', name: 'Unmapped-checks' },
          { value: 'export', name: 'Exported' },
          { value: 'not-exported', name: 'Not Exported' }
        ]
      }
    ]
  };

  constructor() {
    this.getSelectedPayee();
  }

  ngOnInit() {
    this.getCheckStatus();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
  }

  /**
   * @description ag grid payload setting for getting selected payees transactions only
   * @param customFilterModel
   */
  initializeV3DataTable(customFilterModel: ISelectBoxFilterArray) {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: customFilterModel,
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  toggleAccTab(tab:string){
    this.activeTab  = tab;
    this.getSelectedPayee();
  }

  /**
   * @description getting all latest selected payees and giving corresponding transaction table
   */
  getSelectedPayee() {    
    this.selectedPayee$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if(this.activeTab === 'received'){
          this.payeeEmail = res?.email || '';
        }
        this.payeeEmail = res?.email || '';
        if (res && this.activeTab === 'send') {
          this.payeeId = res.encryptedId || '';
          const customFilterModel = {
            payee_id: {
              filter: this.payeeId,
              filterType: 'text',
              type: 'equals'
            }
          };
          this.initializeV3DataTable(customFilterModel);
        }
      });
  }

  onExportData(event: {
    all: boolean;
    fromDate: Date;
    toDate: Date;
    fileFormat: 'csv' | 'xlsx';
  }) {
    this.loading = true;
    this.reportService
      .individualPayeeReport(this.payeeId, {
        fromDate: this.transformDate(event.fromDate),
        toDate: this.transformDate(event.toDate),
        type: event.fileFormat
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((val) => {
        if (val.success) {
          window.open(val.data.url);
        }
      });
  }

  transformDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') ?? '';
  }

  /**
   * Retrieves the check status and sets the cellRendererCheckStatus.
   * If the check status is present in local storage, it is used.
   * Otherwise, it fetches the check status from API.
   */
  getCheckStatus(): void {
    const checkStatus = this.localStorageService.getItem('check_status');
    if (checkStatus) {
      this.cellRendererCheckStatus = checkStatus;
      return;
    }
    this.subscriptions.push(
      this.checkService.getCheckStatus().subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatus = res.data;
        }
      })
    );
  }

  /**
   * @descripiton unsubscribe the whole subscritions subscribed from this component
   * when the component is destroyed
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import {
  ICoulmnDefFields,
  ISelectBoxFilterArray
} from 'src/app/models/v3-datatable';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CheckService } from 'src/app/shared/service/check/check.service';

// Cell renderers & filter components
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { TooltipOnEllipsisComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/tooltip-on-ellipsis/tooltip-on-ellipsis.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { V35PayeeStatusComponent } from '../../../payee-v3/v35-components/payee-transactions-ocw-v35/v35-payee-table-status.component';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';

// `ICoulmnDefFields` (v3, frozen) narrows lockPosition to boolean; the
// right-pinned Status column needs AG Grid's own 'right' value.
type IV4ColumnDef = Omit<ICoulmnDefFields, 'lockPosition'> & {
  lockPosition?: ColDef['lockPosition'];
};

@Component({
  selector: 'app-payee-send-transactions-v4',
  standalone: true,
  imports: [V4DataTableComponent, V4DataTableEmptyStateComponent],
  templateUrl: './payee-send-transactions-v4.component.html',
  styleUrls: ['./payee-send-transactions-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [V3DataTableService, DatePipe]
})
export class PayeeSendTransactionsV4Component implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private payeeDataService = inject(PayeeDataV35Service);
  private reportService = inject(ReportsService);
  private datePipe = inject(DatePipe);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);
  private destroyRef = inject(DestroyRef);
  private detailPanelService = inject(V4DetailPanelService);

  payeeIdInput = input('', { alias: 'payeeId' });

  tableId = DTTableId.payeeTransactions;
  cellRendererCheckStatus?: Record<string, ICheckStatus>;
  loading = false;
  payeeId = '';
  /**
   * True once a payee id is available to scope the query by. Without one no
   * filter payload is ever set, so the grid renders blank instead of empty —
   * the template shows the empty state directly in that case.
   */
  hasPayeeScope = signal(false);

  selectedPayee$ = toObservable(this.payeeDataService.payeeDataSignal);

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
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererParams: { isAmountField: true },
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefTransferMode: ICoulmnDefFields = {
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
    minWidth: 130,
    maxWidth: 150,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefStatus: IV4ColumnDef = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableName: 'payee_transaction' },
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
    minWidth: 130,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    cellRenderer: 'v4UpdatedAtComponent',
    valueGetter: (params) => params.data.updated_at
  };

  colDefViewButton: ICoulmnDefFields = {
    headerName: 'View',
    field: 'view',
    maxWidth: 100,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    sortable: false,
    cellClass: 'pl-1',
    cellRenderer: 'v4ViewButtonComponent',
    cellRendererParams: (
      params: ICellRendererParams<ICommonTransactionTableData>
    ) => {
      const status = params.data?.transfer?.status;
      let checkStatus;
      if (status || status === 0) {
        checkStatus =
          this.cellRendererCheckStatus?.[status]?.statusShortDescription;
      }
      return {
        tableType: 'payments-table',
        checkStatus: { value: checkStatus },
        viewButtonType: 2,
        onViewClick: (data: ICommonTransactionTableData) => {
          this.detailPanelService.open(data);
        }
      };
    },
    suppressHeaderMenuButton: true
  };

  // View pinned left first; Status owns the right edge; Description sits last
  // among the unpinned columns so the grid's last-column fill gives it the
  // leftover width instead of the icon column.
  columnDefs = [
    this.colDefViewButton,
    this.colDefSource,
    this.colDefAmount,
    this.colDefTransferMode,
    this.colDefReferenceId,
    this.colDefCreatedTime,
    this.colDefDescription,
    this.colDefStatus
  ] as ICoulmnDefFields[];

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    dateRangeV35Component: V4DateFloatingFilterComponent,
    v3ModeOfTransferComponent: V3ModeOfTransferComponent,
    v4ViewButtonComponent: V4ViewButtonComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    V35PayeeStatusComponent,
    V3DTCommonFilterComponent,
    TooltipOnEllipsisComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Completed' },
          { value: 'PAID', name: 'Paid' },
          { value: '3', name: 'Canceled' },
          { value: '4', name: 'Failed' },
          { value: '6', name: 'Approval Required' },
          { value: '7', name: 'Approved' },
          { value: '8', name: 'Rejected' }
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

  ngOnInit(): void {
    this.getCheckStatus();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
    this.initializePayeeFilter();
    this.getSelectedPayee();
  }

  /** Set the default payload synchronously so the grid's initial getTableData() uses the correct filter. */
  private initializePayeeFilter(): void {
    const inputId = this.payeeIdInput();
    if (inputId) {
      this.payeeId = inputId;
    } else {
      const payee = this.payeeDataService.payeeDataSignal();
      if (payee) {
        this.payeeId = payee.encryptedId || payee.id || '';
      }
    }
    if (this.payeeId) {
      this.setPayeeFilterPayload(this.payeeId);
    }
    this.hasPayeeScope.set(!!this.payeeId);
  }

  private getSelectedPayee(): void {
    this.selectedPayee$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          const newPayeeId = res.encryptedId || res.id || '';
          if (newPayeeId === this.payeeId) return;
          this.payeeId = newPayeeId;
          this.setPayeeFilterPayload(this.payeeId);
          this.hasPayeeScope.set(!!this.payeeId);
          this.v3DataTableService.hardRefresh.set(true);
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  private setPayeeFilterPayload(payeeId: string): void {
    const customFilterModel: ISelectBoxFilterArray = {
      payee_id: {
        filter: payeeId,
        filterType: 'text',
        type: 'equals'
      }
    };
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
    this.v3DataTableService.hardRefresh.set(true);
  }

  onExportData(event: {
    all: boolean;
    fromDate: Date;
    toDate: Date;
    fileFormat: 'csv' | 'xlsx';
  }): void {
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => {
        if (val.success) {
          window.open(val.data.url);
        }
      });
  }

  private transformDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') ?? '';
  }

  private getCheckStatus(): void {
    const checkStatus = this.localStorageService.getItem('check_status');
    if (checkStatus) {
      this.cellRendererCheckStatus = checkStatus;
      return;
    }
    this.checkService
      .getCheckStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatus = res.data;
        }
      });
  }
}

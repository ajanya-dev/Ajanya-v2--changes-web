import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { ComponentType } from '@angular/cdk/portal';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params } from '@angular/router';
import { finalize } from 'rxjs';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { IRecieveCheckRow } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4RCSelectBoxComponent } from 'src/app/modules/v4/payments-in/components/v4-rc-select-box/v4-rc-select-box.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { PaymentsInDetailPanelV4Component } from 'src/app/modules/v4/payments-in/components/payments-in-detail-panel-v4/payments-in-detail-panel-v4.component';
import { ReceivedPaymentActionsService } from 'src/app/modules/receive-payments/services/received-payment-actions.service';
import { EditableCellV4Component } from './editable-cell-v4.component';
import { ReceivedStatusV4Component } from './received-status-v4.component';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-payee-received-transactions-v4',
  standalone: true,
  imports: [
    V4DataTableComponent,
    V4DataTableEmptyStateComponent,
    PaymentsInDetailPanelV4Component
  ],
  templateUrl: './payee-received-transactions-v4.component.html',
  styleUrls: ['./payee-received-transactions-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [V3DataTableService, DatePipe]
})
export class PayeeReceivedTransactionsV4Component implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private datePipe = inject(DatePipe);
  private requestPaymentsService = inject(RequestPaymentsService);
  private actionsService = inject(ReceivedPaymentActionsService);
  private destroyRef = inject(DestroyRef);

  payeeEmail = input('');

  isPanelOpen = signal(false);
  selectedRow = signal<IRecieveCheckRow | null>(null);

  tableId = DTTableId.payeeReceiveTransaction;
  cellRendererRePymntsStatus: Params = [];
  columnFields: IDtColumnFields[] = [];

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    dateRangeV35Component: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    addAttachComment: ReceivedStatusV4Component,
    rCSelectBoxComponent: V4RCSelectBoxComponent,
    isEditableComponent: EditableCellV4Component,
    V3DTCommonFilterComponent
  };

  FloatingFilterComponent: Params = {
    selectBox: [
      {
        id: 'received_check_lists.status',
        values: [
          { value: 1, name: 'Email' },
          { value: 14, name: 'Requested' },
          { value: { type: 4, status: 1 }, name: 'GPBL Acpt/Rej' },
          { value: { type: 4, status: 2 }, name: 'GPBL Viewed' },
          { value: { type: 4, status: 3 }, name: 'GPBL Rejected' },
          { value: { type: 4, status: 4 }, name: 'GPBL Accepted' },
          { value: { type: 4, status: 5 }, name: 'GPBL TTP' },
          { value: { type: 4, status: 6 }, name: 'GPBL Printed' },
          { value: { type: 4, status: 7 }, name: 'HTML-FORM-SENDER-FPRINTED' },
          { value: { type: 4, status: 30 }, name: 'GPBL DD' },
          { value: { type: 4, status: 32 }, name: 'DD Rejected' },
          { value: { type: 4, status: 50 }, name: 'DD Initiated' },
          { value: { type: 4, status: 51 }, name: 'DD Completed' },
          { value: { type: 4, status: 52 }, name: 'DD Failed' },
          { value: 5, name: 'ACH' },
          { value: 6, name: 'M-ACH' },
          { value: 10, name: 'Stripe' },
          { value: 11, name: 'Paypal' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'received_check_lists.created_at',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  private currentEmail = '';

  constructor() {
    effect(() => {
      const email = this.payeeEmail();
      if (email && email !== this.currentEmail) {
        this.currentEmail = email;
        this.setEmailFilterPayload(email);
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      ReceivedPaymentActionsService.getActionItems(),
      { actionButton: true, eyeButton: true }
    );
    this.getStatus();
    this.initializeEmailFilter();
    this.columnFields = this.getColumnFields();
  }

  /** Set the default payload synchronously so the grid's initial getTableData() uses the correct filter. */
  private initializeEmailFilter(): void {
    const email = this.payeeEmail();
    if (email) {
      this.currentEmail = email;
      this.setEmailFilterPayload(email);
    }
  }

  private setEmailFilterPayload(email: string): void {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: [],
      payee_email: email
    };
    this.v3DataTableService.hardRefresh.set(true);
  }

  private getStatus(): void {
    this.requestPaymentsService
      .getStatus()
      .pipe(
        finalize(() => {}),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.cellRendererRePymntsStatus = res.data;
          this.requestPaymentsService.setStatusArray(res.data);
        }
      });
  }

  // Column Definitions

  colDefStatus = {
    headerName: 'Status',
    minWidth: 180,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    field: 'received_check_lists.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'rCSelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'addAttachComment',
    cellRendererForExport: (params: Params) => {
      const value =
        this.cellRendererRePymntsStatus[params.data?.received_type]?.[
          params.data?.status
        ];
      return value?.statusShortDescription;
    }
  };

  colDefCheckFromName = {
    headerName: 'Payment From',
    field: 's_bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 135,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { prefixOptionalField: 'check_from_name' },
    cellRendererForExport: (params: ICellRendererParams) =>
      params.data?.check_from_name
        ? params.data?.check_from_name
        : params.data?.bank_account_account_name
  };

  colDefFromEmail = {
    headerName: 'From Email',
    field: 'sender_email',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefFromPhone = {
    headerName: 'From Phone',
    field: 'sender_phone',
    suppressFloatingFilterButton: true,
    minWidth: 129,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayableTo = {
    headerName: 'Payable To',
    field: 'bank_accounts.bank_account_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 110,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => data.data.bank_account_nick_name
  };

  colDefCheckNo = {
    headerName: 'Check No',
    field: 'cheques.cheque_serial_number',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => data.data.cheque_serial_number
  };

  colDefDate = {
    headerName: 'Created At',
    minWidth: 130,
    field: 'received_check_lists.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableId: 0 },
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    cellRendererForExport: (params: ICellRendererParams) =>
      params.data?.created_at
  };

  colDefUpdatedAt = {
    headerName: 'Updated At',
    minWidth: 130,
    field: 'received_check_lists.updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererParams: { type: 'date', isPipeDate: true },
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      this.datePipe.transform(params.data?.updated_at, 'MM/dd/yyyy')
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 200,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { isAmountField: true }
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'received_check_lists.memo',
    suppressFloatingFilterButton: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 250,
    maxWidth: 400,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => data.data.memo
  };

  colDefPrintedBy = {
    headerName: 'Printed By',
    field: 'users.nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 110,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date', filterField: 'print_by_name' },
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.print_by_name
  };

  colDefRefId = {
    headerName: 'Ref Id',
    field: 'get_paid_by_form_check_id',
    suppressFloatingFilterButton: true,
    minWidth: 110,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefEditable = {
    headerName: 'Editable',
    field: 'received_check_lists.is_editable',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    cellRenderer: 'isEditableComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 86,
    maxWidth: 120,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'actionComponent',
    cellRendererParams: { tableVersion: 'v4' },
    suppressHeaderMenuButton: true,
    sortable: false
  };

  // Action pinned left first; Status owns the right edge.
  columnDefs = [
    this.colDefAction,
    this.colDefCheckFromName,
    this.colDefFromEmail,
    this.colDefFromPhone,
    this.colDefPayableTo,
    this.colDefCheckNo,
    this.colDefDate,
    this.colDefUpdatedAt,
    this.colDefAmount,
    this.colDefMemo,
    this.colDefPrintedBy,
    this.colDefRefId,
    this.colDefEditable,
    this.colDefStatus
  ];

  onRowClicked(event: { data: IRecieveCheckRow }): void {
    if (event.data) {
      this.selectedRow.set(event.data);
      this.isPanelOpen.set(true);
    }
  }

  closePanelAndReset(): void {
    this.isPanelOpen.set(false);
    this.selectedRow.set(null);
  }

  getViewAction(env: { selectedRow: IRecieveCheckRow }): void {
    if (env.selectedRow) {
      this.selectedRow.set(env.selectedRow);
      this.isPanelOpen.set(true);
    }
  }

  getActionComp(env: { selectedRow: IRecieveCheckRow; id: string }): void {
    this.actionsService.handleAction(env, this.cellRendererRePymntsStatus, () =>
      this.reloadTable()
    );
  }

  reloadTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  getColumnFields(): IDtColumnFields[] {
    return [
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      },
      {
        id: 'id_status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'id_fromName',
        name: 'Check From Name',
        isDisabled: true,
        colDef: this.colDefCheckFromName,
        isChecked: true
      },
      {
        id: 'id_fromEmail',
        name: 'From Email',
        isDisabled: false,
        colDef: this.colDefFromEmail,
        isChecked: true
      },
      {
        id: 'id_fromPhone',
        name: 'From Phone',
        isDisabled: false,
        colDef: this.colDefFromPhone,
        isChecked: true
      },
      {
        id: 'id_payeeAcNo',
        name: 'Payable To',
        isDisabled: false,
        colDef: this.colDefPayableTo,
        isChecked: true
      },
      {
        id: 'id_checkNo',
        name: 'Check No',
        isDisabled: false,
        colDef: this.colDefCheckNo,
        isChecked: true
      },
      {
        id: 'id_date',
        name: 'Created At',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'id_updated_at',
        name: 'Updated At',
        isDisabled: false,
        colDef: this.colDefUpdatedAt,
        isChecked: true
      },
      {
        id: 'id_amount',
        name: 'Amount',
        isDisabled: true,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'id_memo',
        name: 'Memo',
        isDisabled: true,
        colDef: this.colDefMemo,
        isChecked: true
      },
      {
        id: 'id_printedBy',
        name: 'Printed By',
        isDisabled: false,
        colDef: this.colDefPrintedBy,
        isChecked: true
      },
      {
        id: 'id_refId',
        name: 'Ref Id',
        isDisabled: false,
        colDef: this.colDefRefId,
        isChecked: true
      },
      {
        id: 'id_editable',
        name: 'Editable',
        isDisabled: false,
        colDef: this.colDefEditable,
        isChecked: true
      }
    ] as IDtColumnFields[];
  }
}

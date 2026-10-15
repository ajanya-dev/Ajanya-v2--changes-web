import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DatePipe,NgClass} from '@angular/common';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faMessageDots } from '@fortawesome/pro-regular-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { LoaderCircle } from 'lucide-angular';
import { LoadingOverlayV4Component } from 'src/app/shared/V4/loading-overlay-v4/loading-overlay-v4.component';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { ComponentType } from '@angular/cdk/portal';

import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { SelectedService } from 'src/app/modules/data-table/components/dt-date-range/selected.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import {
  IDefaultPayload,
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import {
  IDtActionCompProp,
  IDtAttachComntArray,
  IDtColumnFields
} from 'src/app/modules/data-table/model/datatable';
import { IConfirmAlert, IFailedAlert } from 'src/app/models/alert';
import {
  IReceivedTypes,
  IRecieveCheckRow
} from 'src/app/modules/receive-payments/model/ReceivePayment';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { PaymentsInStatusV4Component } from 'src/app/modules/v4/payments-in/components/payments-in-status-v4/payments-in-status-v4.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4ViewAuditTrailModalComponent } from 'src/app/shared/modal/v4-view-audit-trail-modal/v4-view-audit-trail-modal.component';
import { V4AccpetRequestModalComponent } from 'src/app/modules/v4/payments-in/modals/v4-accpet-request-modal/v4-accpet-request-modal.component';
import { V4AddProofOfDeliveryModalComponent } from 'src/app/shared/modal/v4-add-proof-of-delivery-modal/v4-add-proof-of-delivery-modal.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4DescriptionComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-description/v4-description.component';
import { EditableIconV4Component } from '../editable-icon-v4/editable-icon-v4.component';
import { V4RCSelectBoxComponent } from '../v4-rc-select-box/v4-rc-select-box.component';
import { PaymentsInDetailPanelV4Component } from '../payments-in-detail-panel-v4/payments-in-detail-panel-v4.component';

export type StatusTabValue =
  | 'all'
  | 'pending'
  | 'new'
  | 'printed'
  | 'rejected'
  | 'canceled'
  | 'requested';

@Component({
  standalone: true,
  selector: 'app-detailed-tab-v4',
  templateUrl: './detailed-tab-v4.component.html',
  styleUrls: ['./detailed-tab-v4.component.scss'],
  providers: [V3DataTableService, DatePipe],
  imports: [
    V4DataTableComponent,
    V3DataTableModule,
    PaymentsInDetailPanelV4Component,
    LoadingOverlayV4Component,
    CommonTabV4Component,
    NgClass
  ]
})
export class DetailedTabV4Component implements OnInit, OnDestroy {
  constructor(library: FaIconLibrary) {
    library.addIcons(faMessageDots);
    effect(() => {
      const selectedDate = this.selectedDate();
      if (selectedDate && this.isReceiveChecksReport()) {
        this.setDefaultDate(selectedDate);
      }
    });
  }

  setDefaultDate(selectedDate: { endDate: string; startDate: string }) {
    const today = new Date().toISOString().split('T')[0];
    const isToday =
      selectedDate.startDate === today && selectedDate.endDate === today;
    this.selectedService.setCustomDateFilterArray({
      colId: 'received_check_lists.created_at',
      fromDate: selectedDate.startDate,
      toDate: selectedDate.endDate,
      dateRangeId: isToday ? 'today' : undefined
    });
    this.colDefDate.floatingFilterComponentParams = {
      tableId: DTTableId.receivePayments
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private alertService = inject(V4AlertService);
  private paymentsService = inject(PaymentsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private selectedService = inject(SelectedService);
  private paymentsV4Service = inject(PaymentsV4Service);

  private datePipe = inject(DatePipe);
  @ViewChild(V4DataTableComponent) dataTable?: V4DataTableComponent;
  // --- Inputs (for use as embedded report component) ---
  isReceiveChecksReport = input(false);
  selectedDate = input<{ endDate: string; startDate: string } | undefined>();

  // --- Signals ---
  activeTab = signal<StatusTabValue>('all');
  requestPaymentDisabled = signal(false);
  printCheckDisabled = signal(false);
  printWhiteCheckDisabled = signal(false);
  runACHDisabled = signal(false);
  isDdDisabled = signal(false);
  createDDSlipDisabled = signal(false);
  isAcceptBtnDisabled = signal(false);
  isRejectBtnDisabled = signal(false);
  isPrintCheckPaperLoading = signal(false);
  isPrintWhitePaperLoading = signal(false);
  isDirectDepositLoading = signal(false);
  isAcceptLoading = signal(false);
  isRejectLoading = signal(false);
  headerButtonLoadingProp = signal<{ isLoading: boolean; btn_id: string }>({
    isLoading: false,
    btn_id: ''
  });

  // --- Side Panel ---
  isPanelOpen = signal(false);

  // --- Full page action loader ---
  readonly LoaderCircleIcon = LoaderCircle;
  isRowActionLoading = signal(false);
  selectedRow = signal<IRecieveCheckRow | null>(null);

  // --- Properties ---
  currentValue: { type: string; status?: string } | string = '';
  subscriptions: Subscription[] = [];
  cellRendererRePymntsStatus: Params = [];
  isAction = true;
  attachCommentList: IDtAttachComntArray[] | undefined;
  tableId = DTTableId.receivePayments;
  statuses: number[];
  // eslint-disable-next-line no-restricted-globals
  backUrl: string = history.state.backUrl;
  status: number;
  checkStatus: number;
  receivedType: number;

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Received Payments',
    ignoreColumns: ['uu_id', 'received_check_lists.is_editable', 'action']
  };

  columnFields: IDtColumnFields[] = [];

  fieldsShownByDefault: string[] = [
    'uu_id',
    'amount',
    'action',
    's_bank_accounts.bank_account_account_name',
    'received_check_lists.status'
  ];

  // --- Status Tabs ---
  statusTabs: ITabItem[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'New', value: 'new' },
    { label: 'Printed', value: 'printed' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Canceled', value: 'canceled' },
    { label: 'Requested', value: 'requested' }
  ];

  // --- Header Elements ---
  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Request Payment',
        id: 'id_req_p',
        toolTip: 'Request new payment',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        type: { style: 'green', name: 'money-action' },
        disabled: this.requestPaymentDisabled()
      },
      {
        toolTip: 'Print',
        isAddIcon: true,
        text: 'Print',
        icon: ['fas', 'print'],
        type: { style: 'blue', name: 'money-action' },
        loading: this.isPrintCheckPaperLoading()
          ? this.isPrintCheckPaperLoading()
          : this.isPrintWhitePaperLoading(),
        disabled: this.printCheckDisabled(),
        floatingBarVariant: 'filled-primary',
        lucideIcon: 'printer',
        menu: [
          {
            id: 'id_printCheck',
            name: 'Print-Check Paper',
            icon: ['fas', 'print'],
            lucideIcon: 'printer',
            toolTip: 'Print on check paper'
          },
          {
            id: 'id_printCheck_white',
            name: 'Print-White Paper',
            icon: ['fas', 'print'],
            lucideIcon: 'printer',
            toolTip: 'Print on white paper'
          }
        ]
      },
      {
        text: 'Run ACH Debit',
        id: 'id_man_ach',
        toolTip: 'Manual ACH',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        type: { style: 'violet', name: 'money-action' },
        disabled: this.runACHDisabled()
      },
      {
        text: 'Direct Deposit',
        id: 'id_dir_d',
        toolTip: 'Direct Deposit',
        isAddIcon: true,
        icon: ['fas', 'bank'],
        type: { style: 'violet', name: 'money-action' },
        disabled: this.isDdDisabled(),
        loading: this.isDirectDepositLoading(),
        floatingBarVariant: 'filled-primary',
        lucideIcon: 'landmark'
      },
      {
        text: 'Create Deposit Slip',
        id: 'deposit-slip',
        toolTip: 'Create deposit slip',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        type: { style: 'violet', name: 'money-action' },
        disabled: this.createDDSlipDisabled(),
        floatingBarVariant: 'filled-primary',
        lucideIcon: 'file-text'
      },
      {
        id: 'id_btnAccept',
        text: 'Accept',
        type: { style: 'general', name: 'money-action' },
        loading: this.isAcceptLoading(),
        customClasses:
          'bg-common-secondary-green-color text-common-green-color',
        toolTip: 'Accept selected item',
        disabled: this.isAcceptBtnDisabled(),
        floatingBarVariant: 'filled-success',
        // Accept/Reject are one decision pair, so they share a bar group and
        // sit together without a divider between them. Without an explicit
        // barGroup the bar falls back to its style heuristic, which reads
        // `filled-danger` as destructive and splits Reject off on its own.
        barGroup: 1,
        lucideIcon: 'circle-check'
      },
      {
        id: 'id_btnReject',
        text: 'Reject',
        loading: this.isRejectLoading(),
        type: { style: 'general', name: 'money-action' },
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Reject selected item',
        disabled: this.isRejectBtnDisabled(),
        floatingBarVariant: 'filled-danger',
        barGroup: 1,
        lucideIcon: 'x'
      }
    ]
  }));

  // --- Framework Components ---
  frameworkComponents: Record<string, ComponentType<unknown>> = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    dateRangeV35Component: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    addAttachComment: PaymentsInStatusV4Component,
    rCSelectBoxComponent: V4RCSelectBoxComponent,
    V4DTCommonFilterComponent,
    v4DescriptionComponent: V4DescriptionComponent
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

  cellRenderer: {
    action: {
      name: string;
      id: string;
      icon: string;
      svg?: string;
      color?: string;
    }[];
  } = {
    action: [
      {
        name: 'Accept',
        id: 'RId_accept',
        icon: 'circle-check',
        color: 'var(--v4-common-green-color)'
      },
      {
        name: 'Reject',
        id: 'RId_reject',
        icon: 'x',
        color: 'var(--v4-common-red-color)'
      },
      {
        name: 'Print',
        id: 'RId_print',
        icon: 'printer',
        color: 'var(--v4-primary-brand-bold-color)'
      },
      {
        name: 'Cancel',
        id: 'RId_cancel',
        icon: 'trash-2',
        color: 'var(--v4-common-red-color)'
      },
      {
        name: 'Audit Trail',
        id: 'RId_audittrail',
        icon: 'history',
        color: 'var(--v4-primary-brand-bold-color)'
      },
      {
        name: 'Mark As Printed',
        id: 'RId_markasprinted',
        icon: 'check',
        color: 'var(--v4-primary-brand-bold-color)'
      },
      {
        name: 'Resend',
        id: 'RId_resend',
        icon: 'send',
        color: 'var(--v4-primary-brand-bold-color)'
      },
      {
        name: 'Add Proof of Delivery',
        id: 'RId_pod',
        icon: 'receipt',
        color: 'var(--v4-primary-brand-bold-color)'
      },
      {
        name: 'Add Attachment',
        id: 'RId_attachment',
        icon: 'paperclip',
        color: 'var(--v4-primary-brand-bold-color)'
      },
      {
        name: 'Add Comment',
        id: 'RId_comment',
        icon: 'message-circle',
        color: 'var(--v4-primary-brand-bold-color)'
      }
    ]
  };

  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: true
  };

  // --- Column Definitions ---
  colDefId = {
    headerName: '',
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
    checkboxSelection: true,
    filter: 'agTextColumnFilter',
    sortable: false,
    floatingFilter: false,
    headerClass: 'pl-3.5',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    cellClass: 'flex justify-center',
    cellRenderer: () => '',
    pinned: 'left'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 180,
    pinned: 'right',
    lockPosition: 'right',
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
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { prefixOptionalField: 'check_from_name' },
    cellStyle: { 'font-weight': '500' },
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
    minWidth: 73,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => data.data.cheque_serial_number
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
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      this.datePipe.transform(params.data?.updated_at, 'MM/dd/yyyy')
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
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    cellRendererForExport: (params: ICellRendererParams) =>
      params.data?.created_at
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V4DTCommonFilterComponent',
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
    cellRenderer: 'v4DescriptionComponent',
    cellRendererParams: { readOnly: true },
    cellRendererForExport: (params: ICellRendererParams) => params.data?.memo
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
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { type: 'date', filterField: 'print_by_name' },
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.print_by_name
  };

  colDefRefId = {
    headerName: 'Ref Id',
    field: 'get_paid_by_form_check_id',
    suppressFloatingFilterButton: true,
    minWidth: 90,
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
    cellRenderer: EditableIconV4Component,
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 86,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    cellRendererParams: { tableVersion: 'v4' },
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    pinned: 'left',
    lockPosition: true
  };

  columnDefs = [
    this.colDefId,
    this.colDefAction,
    this.colDefStatus,
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
    this.colDefEditable
  ];

  ngOnInit(): void {
    this.subscriptions.push(
      this.dataTableService.loadingActionRow.subscribe((rowId) => {
        this.isRowActionLoading.set(!!rowId);
      })
    );
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.getStatus();
    this.getAttachmentStatus();
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.columnFields = this.getColumnFields();
    this.subscriptions.push(
      this.paymentsV4Service.paymentCompleted$.subscribe(() => {
        this.v3DataTableService.refreshV3DataTable();
      })
    );
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params) => {
        const uuid = params.get('openUuid');
        if (!uuid) return;
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
        this.requestPaymentsService.getCheckView(uuid).subscribe((data) => {
          if (!data?.success) return;
          const d = data.data as Partial<{
            encrypted_id: string;
            id: string;
            status: number;
            chequeAmount: string;
            receivedType: number;
            createdAt: string;
            chequeSerialNumber: string;
            chequeMemo: string;
          }>;
          const row: IRecieveCheckRow = {
            uu_id: uuid,
            encrypted_id: d.encrypted_id ?? '',
            id: d.id ?? uuid,
            status: d.status ?? 0,
            amount: d.chequeAmount ?? '',
            received_type: d.receivedType ?? 0,
            receiver_for_user_id: 0,
            receiver_payee_id: '',
            receiver_phone: '',
            sender_email: '',
            created_at: d.createdAt ?? '',
            updated_at: '',
            deleted_at: '',
            encrypted_bankaccount_id: '',
            action: uuid,
            pod_status: 0,
            cheque_serial_number: d.chequeSerialNumber,
            memo: d.chequeMemo
          };
          this.selectedRow.set(row);
          this.isPanelOpen.set(true);
        });
      })
    );
  }

  setFilterPayload(filterValue: string | number) {
    if (filterValue === '') {
      this.v3DataTableService.resetV3DataTablePayload();
      const filterPayloadForGrid: ISelectBoxFilterArray = {};
      return filterPayloadForGrid;
    }
    const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
      filter: filterValue,
      filterType: 'text',
      type: 'equals'
    };
    const filterName = 'received_check_lists.status';
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: { ...selectBoxFilterValues }
    };
    return filterPayloadForGrid;
  }

  getStatus() {
    this.subscriptions.push(
      this.requestPaymentsService.getStatus().subscribe((res) => {
        if (res.success) {
          this.cellRendererRePymntsStatus = res.data;
          this.requestPaymentsService.setStatusArray(res.data);
        }
      })
    );
  }

  onRowSelected(event: {
    api: { getSelectedRows(): IRecieveCheckRow[] };
  }): void {
    const selectedRows = event.api.getSelectedRows();

    // Reset all to disabled (same as V3)
    this.printCheckDisabled.set(true);
    this.printWhiteCheckDisabled.set(true);
    this.isDdDisabled.set(true);
    this.createDDSlipDisabled.set(true);
    this.isRejectBtnDisabled.set(true);
    this.isAcceptBtnDisabled.set(true);

    // Enable buttons based on row status/type (ported from V3)
    selectedRows.forEach((row) => {
      if ([4, 5].includes(row.status)) {
        this.printCheckDisabled.set(false);
        this.printWhiteCheckDisabled.set(false);
      }
      if ([1, 2].includes(row.status)) {
        this.isRejectBtnDisabled.set(false);
        this.isAcceptBtnDisabled.set(false);
      }
      if ([4].includes(row.status) && [4].includes(row.received_type)) {
        this.isRejectBtnDisabled.set(false);
      }
      if ([52].includes(row.status) && row.received_type === 4) {
        this.isAcceptBtnDisabled.set(false);
      }
      if (row.received_type !== 1 && [4, 5].includes(row.status)) {
        this.isDdDisabled.set(false);
      }
      if ([4, 5].includes(row.status) || [1, 4].includes(row.received_type)) {
        this.createDDSlipDisabled.set(false);
      }
    });
  }

  getViewAction(env: { selectedRow: IRecieveCheckRow }): void {
    if (env.selectedRow) {
      this.selectedRow.set(env.selectedRow);
      this.isPanelOpen.set(true);
    }
  }

  /** Reload only on a real change: `reloadTable()` also wipes the row selection. */
  closePanelAndReset(dataChanged = false): void {
    this.isPanelOpen.set(false);
    if (dataChanged) this.reloadTable();
  }

  /** Panel keys → the row-action id that already does the same thing. */
  private static readonly PANEL_ACTION_IDS: Record<string, string> = {
    'panel-print': 'RId_print',
    'panel-accept': 'RId_accept',
    'panel-reject': 'RId_reject'
  };

  /** Panel hands off: close it, then run the tab's existing action for the row. */
  onPanelAction(key: string): void {
    const row = this.selectedRow();
    if (!row?.uu_id) return;

    // Direct Deposit has no row-action entry — it only ever existed as a
    // header (bulk) button, so it goes through the bulk path with one row.
    if (key === 'panel-dd') {
      this.directDepositCheck([row]);
      return;
    }

    const actionId = DetailedTabV4Component.PANEL_ACTION_IDS[key];
    if (actionId) this.runRowAction(row, actionId);
  }

  getActionComp(env: { selectedRow: IRecieveCheckRow; id: string }) {
    if (env?.selectedRow) {
      const hideArr: string[] = [];
      const actionList =
        this.cellRendererRePymntsStatus[env?.selectedRow?.received_type][
          env?.selectedRow?.status
        ];

      hideArr.push(actionList.isItApproveAble === 0 ? 'RId_accept' : '');
      hideArr.push(actionList.isItRejectAble === 0 ? 'RId_reject' : '');
      hideArr.push(actionList.isItPrintAble === 0 ? 'RId_print' : '');
      hideArr.push(actionList.isItCancellAble === 0 ? 'RId_cancel' : '');
      hideArr.push(actionList.isItAuditable === 0 ? 'RId_audittrail' : '');
      hideArr.push(
        actionList.isItPrintmarkAble === 0 ? 'RId_markasprinted' : ''
      );
      hideArr.push(actionList.isItResendAble === 0 ? 'RId_resend' : '');
      hideArr.push(env.selectedRow.pod_status === 1 ? 'RId_pod' : '');

      this.disabledActions(hideArr);

      this.runRowAction(env.selectedRow, env.id);
    }
  }

  /** The row-action dispatch itself — shared by the ⋮ menu and the detail panel. */
  private runRowAction(selectedRow: IRecieveCheckRow, id: string): void {
    switch (id) {
      case 'RId_accept': {
        const response1 = this.confirmMessage(
          'Are you sure you want to accept?'
        );
        response1.afterClosed().subscribe((res) => {
          if (res) {
            this.closePanelAndReset();
            this.acceptAction(selectedRow.uu_id);
          }
        });
        break;
      }
      case 'RId_reject': {
        const response2 = this.confirmMessage(
          'Are you sure you want to reject?'
        );
        response2.afterClosed().subscribe((res) => {
          if (res) {
            this.closePanelAndReset();
            this.rejectAction(selectedRow.uu_id);
          }
        });
        break;
      }
      case 'RId_print':
        this.printAction(selectedRow.uu_id);
        break;

      case 'RId_cancel': {
        const response3 = this.confirmMessage(
          'Are you sure you want to cancel?'
        );
        response3.afterClosed().subscribe((res) => {
          if (res) {
            this.cancelAction(selectedRow.uu_id);
          }
        });
        break;
      }
      case 'RId_markasprinted': {
        const response4 = this.confirmMessage(
          "If you mark this check as printed, you won't be able to print it again"
        );
        response4.afterClosed().subscribe((res) => {
          if (res) {
            this.markAsPrintedAction(selectedRow.uu_id, 1);
          }
        });
        break;
      }
      case 'RId_audittrail':
        this.auditTrail(selectedRow.encrypted_id);
        break;

      case 'RId_resend':
        this.resendAction(
          selectedRow.uu_id,
          selectedRow.encrypted_bankaccount_id
        );
        break;

      case 'RId_attachment':
        this.openAddAttachmentModal(selectedRow.encrypted_id);
        break;

      case 'RId_comment':
        this.openAddCommentModal(selectedRow.encrypted_id);
        break;

      case 'RId_pod':
        this.openAddPodModal(selectedRow.uu_id, selectedRow.encrypted_id);
        break;

      default:
        break;
    }
  }

  headerButtonNavigation(env: {
    id: string;
    selectedRows: IRecieveCheckRow[];
  }): void {
    switch (env.id) {
      case 'id_req_p':
        this.router.navigate(['/manage/payments/main/receive/payer/bank']);
        break;

      case 'id_printCheck':
        this.printSelected(env.selectedRows, 1);
        break;

      case 'id_printCheck_white':
        this.printSelected(env.selectedRows, 2);
        break;

      case 'id_man_ach':
        this.runAchDebit();
        break;

      case 'id_dir_d':
        this.directDepositCheck(env.selectedRows);
        break;

      case 'deposit-slip':
        this.createDepositslip(env.selectedRows);
        break;

      case 'id_btnAccept':
        this.onApproveCheck(env.selectedRows, true);
        break;

      case 'id_btnReject':
        this.onRejectCheck(env.selectedRows, true);
        break;

      case 'id_all':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('');
        break;

      case 'id_e-payments':
        this.router.navigateByUrl('manage/receivedchecks/received-payments');
        break;

      case 'id_pending':
        this.onFilterClicked(1);
        break;

      case 'id_new':
        this.onFilterClicked(4);
        break;

      case 'id_printed':
        this.onFilterClicked(6);
        break;

      case 'id_rejected':
        this.onFilterClicked(3);
        break;

      case 'id_requested':
        this.onFilterClicked(14);
        break;

      case 'id_cancelled':
        this.onFilterClicked(13);
        break;

      case 'id_recurring':
        this.router.navigateByUrl('manage/receivedchecks/recurring');
        break;

      case 'virtual-card':
        this.router.navigateByUrl('/manage/cards/receive');
        break;

      default:
        break;
    }
  }

  handleTabClick(tab: StatusTabValue): void {
    this.activeTab.set(tab);
    this.applyStatusFilter(tab);
  }

  /** Bridges the shared tab component's `string` output to the typed tab handler. */
  onStatusTabChange(value: string): void {
    this.handleTabClick(value as StatusTabValue);
  }

  private applyStatusFilter(tab: StatusTabValue): void {
    // Clear all floating filter UI state and stored filter data
    this.v3DataTableService.switchPaymentTableTab = true;
    const statusMap: Partial<Record<StatusTabValue, number>> = {
      pending: 1,
      new: 4,
      printed: 6,
      rejected: 3,
      canceled: 13,
      requested: 14
    };

    const statusCode = statusMap[tab];

    if (!statusCode) {
      this.v3DataTableService.resetV3DataTablePayload();
    } else {
      const payload: IDefaultPayload = {
        startRow: 0,
        endRow: 50,
        rowGroupCols: [],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys: [],
        sortModel: [],
        filterModel: {
          'received_check_lists.status': {
            filter: statusCode,
            filterType: 'text',
            type: 'equals'
          }
        }
      };
      if (statusCode === 14) {
        payload.filterModel = {};
        payload.received_type = 14;
      }
      this.v3DataTableService.defaultPayload = payload;
    }

    this.v3DataTableService.refreshV3DataTable();
  }

  onFilterClicked(status: number): void {
    const payload: IDefaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: this.setFilterPayload(status),
      sortModel: []
    };
    if (status === 14) {
      payload.filterModel = {};
      payload.received_type = 14;
    } else {
      delete payload.received_type;
    }
    this.v3DataTableService.defaultPayload = payload;
    this.v3DataTableService.refreshV3DataTable();
  }

  runAchDebit() {
    this.subscriptions.push(
      this.requestPaymentsService.achDebit().subscribe((res) => {
        if (res.success) {
          this.router.navigateByUrl('manage/manualach/index');
        }
      })
    );
  }

  reloadTable() {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  directDepositCheck(selctedRows: IRecieveCheckRow[]) {
    if (selctedRows.length === 0) {
      const data = {
        title: 'Error',
        content: 'Please select at least one item',
        doneMsg: 'OK',
        isCancel: false,
        isOk: true
      };
      this.alertService.warningAlert(data);
    } else {
      const response = this.confirmMessage(
        'Are you sure you want to deposit it directly?'
      );
      response.afterClosed().subscribe((res) => {
        if (res) {
          this.closePanelAndReset();
          this.ddAction(selctedRows);
        }
      });
    }
  }

  createDepositslip(rows: IRecieveCheckRow[]) {
    const Ids: string[] = [];
    const itemIds: { ids: string[] } = { ids: [] };
    rows.forEach((el: IRecieveCheckRow) => {
      itemIds.ids.push(el.action);
    });

    if (!rows.length) {
      this.warningAlert('Please select at least one row');
    } else {
      rows.forEach((element: IRecieveCheckRow) => {
        Ids.push(element.encrypted_id);
      });
      this.openDeposit(Ids);
    }
  }

  openDeposit(Ids: string[]): void {
    let depoIds = '';
    Ids.forEach((e, i) => {
      depoIds += i === 0 ? e : `,${e}`;
    });
    this.router.navigate(['/v4/manage/depositslips/create'], {
      queryParams: { Ids: depoIds, referenceType: 2 }
    });
  }

  ddAction(selctedRows: IRecieveCheckRow[]) {
    const uuids: string[] = [];
    selctedRows.forEach((element: IRecieveCheckRow) => {
      uuids.push(element.uu_id);
    });
    const data = { ids: uuids };
    this.isDirectDepositLoading.set(true);
    this.subscriptions.push(
      this.requestPaymentsService
        .directDeposit(data)
        .pipe(
          finalize(() => {
            this.isDirectDepositLoading.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              const alertContent = {
                title: 'Success',
                content: 'Direct Deposit has been initiated.',
                close: true,
                timeout: 3000
              };
              this.reloadTable();
              this.alertService.successAlert(alertContent);
            }
          },
          error: (err) => {
            if (err.error.errorCode === 101) {
              const alert = this.alertService.warningAlert({
                content: err.error.errorMsg,
                doneMsg: 'Add Info Now',
                isCancel: true,
                cancelMsg: 'cancel'
              });
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.achVerificationRequiredAlert();
                }
              });
            }
            if (err.error.errorCode === 423) {
              const alert = this.alertService.warningAlert({
                content: err.error.errorMsg,
                doneMsg: 'See My Banks',
                isCancel: true,
                cancelMsg: 'Cancel'
              });
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.router.navigate(['/v4/manage/bank-accounts/index']);
                }
              });
            }
          }
        })
    );
  }

  achVerificationRequiredAlert(): void {
    const alert = this.alertService.warningAlert({
      content:
        'Some of your bank accounts are not approved for ACH, please apply to proceed.',
      doneMsg: 'See My Banks',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/bank-accounts/index']);
      }
    });
  }

  printSelected(selctedRows: IRecieveCheckRow[], type: number) {
    const uuIds: string[] = [];
    if (selctedRows.length === 0) {
      const data = {
        title: 'Error',
        content: 'Please select at least one item',
        doneMsg: 'OK',
        isCancel: false,
        isOk: true
      };
      this.alertService.warningAlert(data);
    } else {
      selctedRows.forEach((element: IRecieveCheckRow) => {
        uuIds.push(element.uu_id);
      });
      const data = { uuids: uuIds, printType: type };
      this.printSelectedData(data);
    }
  }

  openAddAttachmentModal(id: string) {
    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'request-payments' }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.reloadTable();
      }
    });
  }

  openAddCommentModal(id: string) {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'request-payments', enableDelete: true }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.reloadTable();
      }
    });
  }

  openAddPodModal(id: string, encryptedId: string) {
    const dialogRef = this.dialog.open(V4AddProofOfDeliveryModalComponent, {
      width: '550px',
      maxHeight: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { uuId: id, encryptedId }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.reloadTable();
      }
    });
  }

  onApproveCheck(
    selectedItems: IRecieveCheckRow[] | IRecieveCheckRow,
    isMulti: boolean
  ): void {
    if (!(selectedItems as IRecieveCheckRow[]).length && isMulti) {
      const data = {
        title: 'Error',
        content: 'Please select at least one item',
        doneMsg: 'OK',
        isCancel: false,
        isOk: true
      };
      this.alertService.warningAlert(data);
      return;
    }

    let ids: string[] = [];
    if (isMulti) {
      ids = (selectedItems as IRecieveCheckRow[])?.map(
        (e: IRecieveCheckRow) => e.action
      );
    } else {
      ids.push((selectedItems as IRecieveCheckRow)?.id as string);
    }

    const uuIds: string[] = [];
    (selectedItems as IRecieveCheckRow[]).forEach(
      (element: IRecieveCheckRow) => {
        uuIds.push(element.uu_id);
        this.checkStatus = element.cheque_status as number;
        this.status = element.status;
      }
    );
    const data = { uuids: uuIds, printType: 1 };

    if (this.status === 4 || this.status === 3) {
      if (
        this.onHeaderButtonWarning(
          selectedItems as IRecieveCheckRow[],
          'accept'
        )
      ) {
        this.openFailedAlert(
          (selectedItems as IRecieveCheckRow[]).length === 1
            ? "Selected payment can't be accepted."
            : "Some of the payments can't be accepted."
        );
      }
    } else if (this.checkStatus === 507) {
      this.openFailedAlert('This check has been voided by the payer.');
    } else {
      const alert = this.openConfirmAlert('Are you sure you want to accept?');
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.bulkAcceptAction(data, uuIds);
        }
      });
    }
  }

  onRejectCheck(selectedItems: IRecieveCheckRow[], isMulti: boolean): void {
    if (!selectedItems.length && isMulti) {
      const data = {
        title: 'Error!',
        content: 'Please select at least one item',
        doneMsg: 'OK',
        isCancel: false,
        isOk: true
      };
      this.alertService.warningAlert(data);
      return;
    }

    const uuIds: string[] = [];
    selectedItems.forEach((element: IRecieveCheckRow) => {
      uuIds.push(element.uu_id);
      this.checkStatus = element.cheque_status as number;
      this.status = element.status;
      this.receivedType = element.received_type;
    });
    const data = { uuids: uuIds };

    if (this.status === 3 || (this.status === 4 && this.receivedType !== 4)) {
      if (this.onHeaderButtonWarning(selectedItems, 'reject')) {
        this.openFailedAlert(
          selectedItems.length === 1
            ? "Selected payment can't be rejected."
            : "Some of the payments can't be rejected."
        );
      }
    } else if (this.checkStatus === 507) {
      this.openFailedAlert('This check has been voided by the payer.');
    } else {
      const alert = this.openConfirmAlert('Are you sure you want to reject?');
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.bulkRejectAction(data);
        }
      });
    }
  }

  openConfirmAlert(content: string) {
    const data: IConfirmAlert = {
      title: 'Confirm',
      content,
      cancelMsg: 'Cancel',
      doneMsg: 'OK'
    };
    return this.alertService.confirmAlert(data);
  }

  onHeaderButtonWarning(selectedItems: IRecieveCheckRow[], action: string) {
    const actionList = selectedItems?.map(
      (e) => this.cellRendererRePymntsStatus[e?.received_type][e?.status]
    );
    return actionList.some((status) => {
      switch (action) {
        case 'accept':
          return status.isItApproveAble === 0;
        case 'reject':
          return status.isItRejectAble === 0;
        default:
          return false;
      }
    });
  }

  openFailedAlert(content: string) {
    const data: IFailedAlert = { content };
    return this.alertService.failedAlert(data);
  }

  openWarningAlert(content: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    };
    return this.alertService.warningAlert(data);
  }

  confirmMessage(content: string) {
    const data = {
      title: 'Alert!',
      content,
      doneMsg: 'Yes',
      CancelMsg: 'No,cancel!'
    };
    return this.alertService.confirmAlert(data);
  }

  warningAlert(content: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: 'OK',
      isCancel: false
    };
    return this.alertService.warningAlert(data);
  }

  disabledActions(ids: string[]) {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

  acceptAction(id: string) {
    this.dataTableService.loadingActionRow.next(id);
    this.subscriptions.push(
      this.requestPaymentsService
        .acceptRequest(id)
        .pipe(finalize(() => this.dataTableService.loadingActionRow.next(null)))
        .subscribe((res) => {
          if (res.success) {
            this.reloadTable();
            const data = { uuids: [id], printType: 1 };
            const response = this.acceptSuccess();
            response.afterClosed().subscribe((ModalRes) => {
              switch (ModalRes) {
                case 'id_print':
                  this.printSelectedData(data);
                  break;
                case 'id_later':
                  this.reloadTable();
                  break;
                case 'id_dd':
                  this.ddfromAccept([id]);
                  break;
                default:
                  this.reloadTable();
                  break;
              }
            });
          }
        })
    );
  }

  ddfromAccept(uuid: string[]) {
    if (this.paymentsService.checkForComplianceFreeze()) {
      this.paymentsService.openComplianceFreezeModal();
      return;
    }

    const data = { ids: uuid };
    this.subscriptions.push(
      this.requestPaymentsService.directDeposit(data).subscribe({
        next: (res) => {
          if (res.success) {
            const alertContent = {
              title: 'Success',
              content: 'Direct Deposit has been initiated.',
              close: true,
              timeout: 3000
            };
            this.reloadTable();
            this.alertService.successAlert(alertContent);
          }
        },
        error: (err) => {
          if (err.error.errorCode === 101) {
            const alert = this.alertService.warningAlert({
              content: err.error.errorMsg,
              doneMsg: 'Add Info Now',
              isCancel: true,
              cancelMsg: 'cancel'
            });
            alert.afterClosed().subscribe((res) => {
              if (res) {
                this.achVerificationRequiredAlert();
              }
            });
          }
          if (err.error.errorCode === 423) {
            const alert = this.alertService.warningAlert({
              content: err.error.errorMsg,
              doneMsg: 'See My Banks',
              isCancel: true,
              cancelMsg: 'Cancel'
            });
            alert.afterClosed().subscribe((res) => {
              if (res) {
                this.router.navigate(['/v4/manage/bank-accounts/index']);
              }
            });
          }
        }
      })
    );
  }

  bulkAcceptAction(
    data: { uuids: string[]; printType?: number },
    uuids: string[]
  ) {
    this.isAcceptLoading.set(true);
    this.subscriptions.push(
      this.requestPaymentsService
        .bulkAcceptRequest(data)
        .pipe(
          finalize(() => {
            this.isAcceptLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.reloadTable();
            const response = this.acceptSuccess();
            response.afterClosed().subscribe((ModalRes) => {
              switch (ModalRes) {
                case 'id_print':
                  this.printSelectedData(data);
                  break;
                case 'id_later':
                  this.reloadTable();
                  break;
                case 'id_dd':
                  this.ddfromAccept(uuids);
                  break;
                default:
                  break;
              }
            });
          }
        })
    );
  }

  acceptSuccess() {
    const dialogRef = this.dialog.open(V4AccpetRequestModalComponent, {
      minWidth: '370px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    return dialogRef;
  }

  rejectAction(id: string) {
    this.dataTableService.loadingActionRow.next(id);
    this.subscriptions.push(
      this.requestPaymentsService
        .rejectRequest(id)
        .pipe(finalize(() => this.dataTableService.loadingActionRow.next(null)))
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success',
              content: 'Request rejected',
              close: true,
              timeout: 3000
            };
            this.reloadTable();
            this.alertService.successAlert(data);
          }
        })
    );
  }

  bulkRejectAction(data: { uuids: string[] }) {
    this.isRejectLoading.set(true);
    this.subscriptions.push(
      this.requestPaymentsService
        .bulkRejectRequest(data)
        .pipe(
          finalize(() => {
            this.isRejectLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const alertData = {
              title: 'Success',
              content: 'Request rejected',
              close: true,
              timeout: 3000
            };
            this.reloadTable();
            this.alertService.successAlert(alertData);
          }
        })
    );
  }

  printAction(id: string) {
    this.dataTableService.loadingActionRow.next(id);
    this.subscriptions.push(
      this.requestPaymentsService
        .printRequest(id)
        .pipe(
          finalize(() => {
            this.dataTableService.loadingActionRow.next(null);
          })
        )
        .subscribe(
          (printRes) => {
            this.reloadTable();
            const urlLoaded = window.open(printRes.data);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const popupBlockerMsg = this.alertService.warningAlert({
                content:
                  'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                doneMsg: 'Try Again'
              });
              popupBlockerMsg.afterClosed().subscribe((popupBlockerRes) => {
                if (popupBlockerRes) {
                  window.open(printRes.data);
                  const markAsPrinted = this.markAsPrint();
                  markAsPrinted.afterClosed().subscribe((markAsPrintedRes) => {
                    if (markAsPrintedRes) {
                      this.closePanelAndReset();
                      this.markAsPrintedAction(id, 2);
                    }
                  });
                }
              });
              return;
            }
            const markAsPrinted = this.markAsPrint();
            markAsPrinted.afterClosed().subscribe((markAsPrintedRes) => {
              if (markAsPrintedRes) {
                this.closePanelAndReset();
                this.markAsPrintedAction(id, 2);
              }
            });
          },
          (err) => {
            if (err.error.errorCode === 106) {
              const dref = this.openWarningAlert(err.error.errorMsg);
              dref.afterClosed().subscribe((res) => {
                if (res) {
                  this.closePanelAndReset();
                  this.router.navigate(['v4/manage/verification/index'], {
                    queryParams: { returnUrl: 'v4/manage/payments-in/detailed' }
                  });
                }
              });
            }
          }
        )
    );
  }

  cancelAction(id: string) {
    this.dataTableService.loadingActionRow.next(id);
    this.subscriptions.push(
      this.requestPaymentsService
        .cancelRequest(id)
        .pipe(finalize(() => this.dataTableService.loadingActionRow.next(null)))
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success',
              content: 'Request cancelled',
              close: true,
              timeout: 3000
            };
            this.alertService.successAlert(data);
            this.reloadTable();
          }
        })
    );
  }

  markAsPrintedAction(id: string, mode: number) {
    this.dataTableService.loadingActionRow.next(id);
    this.subscriptions.push(
      this.requestPaymentsService
        .markAsPrintRequest(id)
        .pipe(finalize(() => this.dataTableService.loadingActionRow.next(null)))
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success',
              content: 'Request marked as printed',
              close: true,
              timeout: 3000
            };
            if (mode === 1) {
              this.alertService.successAlert(data);
            }
            this.reloadTable();
          }
        })
    );
  }

  auditTrail(encrypted_id: string) {
    this.dialog.open(V4ViewAuditTrailModalComponent, {
      maxWidth: '1000px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        heading: 'Receive Payment',
        slug: 'request-payments',
        id: encrypted_id
      }
    });
  }

  resendAction(id: string, bankId: string) {
    const alert = {
      title: 'Link not found !',
      content: 'Please add a payment link to the bank account',
      doneMsg: 'Generate a link',
      cancelMsg: 'No, cancel'
    };
    this.dataTableService.loadingActionRow.next(id);
    this.subscriptions.push(
      this.requestPaymentsService
        .resendRequest(id)
        .pipe(
          finalize(() => {
            this.dataTableService.loadingActionRow.next(null);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success',
              content: 'Request resent',
              close: true,
              timeout: 3000
            };
            this.alertService.successAlert(data);
            this.reloadTable();
          }
          if (res.errorCode) {
            const response = this.alertService.confirmAlert(alert);
            response.afterClosed().subscribe((result) => {
              if (result) {
                this.router.navigate(
                  ['v4/manage/payment-links/create', bankId],
                  {
                    queryParams: {
                      redirectUrl: 'v4/manage/payments-in/detailed'
                    }
                  }
                );
              }
            });
          }
        })
    );
  }

  onExportData(filterModel: {
    items: string[];
    fromDate: string | Date;
    toDate: string | Date;
    type: 'csv' | 'pdf';
    received_type: number;
    received_type_status?: number;
  }) {
    this.subscriptions.push(
      this.v3DataTableService
        .exportTable(filterModel, 'request-payments')
        .subscribe((val) => {
          if (val.message) {
            const data = {
              title: 'Success!',
              content: val.message,
              close: false
            };
            this.alertService.successAlert(data);
          } else {
            window.open(val.data.url);
          }
        })
    );
  }

  printSelectedData(data: { uuids: string[]; printType?: number }) {
    this.headerButtonLoadingProp.set({
      isLoading: true,
      btn_id: data.printType === 1 ? 'id_printCheck' : 'id_printCheck_white'
    });
    if (data.printType === 1) {
      this.isPrintCheckPaperLoading.set(true);
    } else {
      this.isPrintWhitePaperLoading.set(true);
    }
    this.dataTableService.loadingActionRow.next('print-loading');
    this.subscriptions.push(
      this.requestPaymentsService
        .printSelected(data)
        .pipe(
          finalize(() => {
            this.isPrintCheckPaperLoading.set(false);
            this.isPrintWhitePaperLoading.set(false);
            this.headerButtonLoadingProp.set({ isLoading: false, btn_id: '' });
            this.dataTableService.loadingActionRow.next(null);
          })
        )
        .subscribe(
          (printRes) => {
            if (printRes.success) {
              setTimeout(() => this.reloadTable(), 2000);
              const urlLoaded = window.open(printRes.data);
              if (
                !urlLoaded ||
                urlLoaded.closed ||
                typeof urlLoaded.closed === 'undefined'
              ) {
                const popupBlockerMsg = this.alertService.warningAlert({
                  content:
                    'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                  doneMsg: 'Try Again'
                });
                popupBlockerMsg.afterClosed().subscribe((popupBlockerRes) => {
                  if (popupBlockerRes) {
                    window.open(printRes.data);
                    const markAsPrinted = this.markAsPrint();
                    markAsPrinted
                      .afterClosed()
                      .subscribe((markAsPrintedRes) => {
                        if (markAsPrintedRes) {
                          this.markAsPrintBulk({ uuids: data.uuids });
                        }
                      });
                  }
                });
              } else {
                const markAsPrinted = this.markAsPrint();
                markAsPrinted.afterClosed().subscribe((res) => {
                  if (res) {
                    this.markAsPrintBulk({ uuids: data.uuids });
                  }
                });
              }
            }
          },
          (err) => {
            if (err.error.errorCode === 106) {
              const dref = this.openWarningAlert(err.error.errorMsg);
              dref.afterClosed().subscribe((res) => {
                if (res) {
                  this.router.navigate(['manage/users/verify-email-phone'], {
                    queryParams: { returnUrl: 'manage/receivedchecks/index' }
                  });
                }
              });
            }
          }
        )
    );
  }

  markAsPrintBulk(data: { uuids: string[] }) {
    this.dataTableService.loadingActionRow.next('mark-as-print');
    this.subscriptions.push(
      this.requestPaymentsService
        .markAsPrintBulkRequest(data)
        .pipe(finalize(() => this.dataTableService.loadingActionRow.next(null)))
        .subscribe((res) => {
          if (res.success) {
            this.reloadTable();
          }
        })
    );
  }

  getAttachmentStatus() {
    this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
      this.attachCommentList = res;
    });
  }

  markAsPrint() {
    const data = {
      title: 'Did you print it correctly?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };
    return this.alertService.confirmAlert(data);
  }

  get isShowingEmptyState(): boolean {
    return !!this.dataTable?.shouldShowCustomEmptyState;
  }

  getColumnFields() {
    const baseFields = [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
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
        isDisabled: true,
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
        isDisabled: false,
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
    return baseFields;
  }

  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/receive']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.requestPaymentsService.setReceivedTypes(
      this.currentValue as IReceivedTypes
    );
  }
}

import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription, finalize } from 'rxjs';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { Params, Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { IConfirmAlert, IFailedAlert } from 'src/app/models/alert';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  IDtActionCompProp,
  IDtAttachComntArray,
  IDtColumnFields
} from 'src/app/modules/data-table/model/datatable';
import { ViewAuditTrailModalComponent } from 'src/app/shared/modal/common-modal/view-audit-trail-modal/view-audit-trail-modal.component';
import {
  IDefaultPayload,
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import {
  IReceivedTypes,
  IRecieveCheckRow
} from 'src/app/modules/receive-payments/model/ReceivePayment';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import {
  IV3CommonButton,
  IV3DtHeaderElements
} from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ComponentType } from '@angular/cdk/portal';
import { DatePipe } from '@angular/common';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { SelectedService } from 'src/app/modules/data-table/components/dt-date-range/selected.service';
import { RCSelectBoxComponent } from '../../components/recieved-check-select-box/rc-select-box.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { RecievedChecksAddAttachmentCommentComponent } from './addAttachmentComment';
import { AcceptRequestComponent } from '../../modals/accept-request/accept-request.component';
import { EditableCellRendererComponent } from './editableCellRendererComponent';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { AddProofOfDeliveryComponent } from '../../modals/add-proof-of-delivery/add-proof-of-delivery.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

/**
 * @description Component for displaying a table of received checks using AgGrid.
 *
 */
@Component({
  selector: 'app-received-checks',
  templateUrl: './received-checks.component.html',
  styleUrls: ['./received-checks.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class ReceivedChecksComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  public selectedService = inject(SelectedService);
  private paymentsService = inject(PaymentsService);

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
  isHidePrintButtons = signal(false);
  isReceiveChecksReport = input(false);
  selectedDate = input<{ endDate: string; startDate: string }>();

  currentValue: { type: string; status?: string } | string = '';
  subscriptions: Subscription[] = [];
  cellRendererRePymntsStatus: Params = [];
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  isAction = true;
  attachCommentList: IDtAttachComntArray[] | undefined;
  public tableId = DTTableId.receivePayments; // Data Table Id
  dateRangeField: string;
  statuses: number[];
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Received Payments',
    ignoreColumns: ['uu_id', 'received_check_lists.is_editable', 'action']
  };

  columnFields: IDtColumnFields[] = [];
  checkStatus: number;
  // eslint-disable-next-line no-restricted-globals
  backUrl: string = history.state.backUrl;
  status: number;
  receivedType: number;
  headerButtons: IV3CommonButton[] = [];
  fieldsShownByDefault: string[] = [
    'uu_id',
    'amount',
    'action',
    's_bank_accounts.bank_account_account_name'
  ];

  /**
   * HEADER ELEMENTS PROPERTIES
   */
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [
      {
        name: 'All',
        id: 'id_all'
      },
      {
        name: 'Pending',
        id: 'id_pending'
      },
      {
        name: 'New',
        id: 'id_new'
      },
      {
        name: 'Printed',
        id: 'id_printed'
      },
      {
        name: 'Rejected',
        id: 'id_rejected'
      },
      {
        name: 'Requested',
        id: 'id_requested'
      },
      {
        name: 'Canceled',
        id: 'id_cancelled'
      },
      {
        name: 'e-Payments',
        id: 'id_e-payments',
        options: { isItButton: true }
      },
      {
        name: 'Recurring',
        id: 'id_recurring',
        options: { isItButton: true }
      },
      {
        name: 'Virtual Card',
        id: 'virtual-card',
        options: { isItButton: true }
      }
    ],
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
        isHidden: !this.isHidePrintButtons(),
        disabled: this.printCheckDisabled(),
        menu: [
          {
            id: 'id_printCheck',
            name: 'Print-Check Paper',
            icon: ['fas', 'print'],
            toolTip: 'Print on check paper'
          },
          {
            id: 'id_printCheck_white',
            name: 'Print-White Paper',
            icon: ['fas', 'print'],
            toolTip: 'Print on white paper'
          }
        ]
      },

      {
        text: 'Print-Check Paper',
        id: 'id_printCheck',
        toolTip: 'Print on check paper',
        isAddIcon: true,
        icon: ['fas', 'print'],
        type: { style: 'blue', name: 'money-action' },
        disabled: this.printCheckDisabled(),
        loading: this.isPrintCheckPaperLoading(),
        isHidden: this.isHidePrintButtons()
      },
      {
        text: 'Print-White Paper',
        id: 'id_printCheck_white',
        toolTip: 'Print on white paper',
        isAddIcon: true,
        icon: ['fas', 'print'],
        type: { style: 'blue', name: 'money-action' },
        disabled: this.printWhiteCheckDisabled(),
        loading: this.isPrintWhitePaperLoading(),
        isHidden: this.isHidePrintButtons()
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
        loading: this.isDirectDepositLoading()
      },
      {
        text: 'Create Deposit Slip',
        id: 'deposit-slip',
        toolTip: 'Create deposit slip',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        type: { style: 'violet', name: 'money-action' },
        disabled: this.createDDSlipDisabled()
      },
      {
        id: 'id_btnAccept',
        text: 'ACCEPT',
        type: { style: 'general', name: 'money-action' },
        loading: this.isAcceptLoading(),
        customClasses:
          'bg-common-secondary-green-color text-common-green-color',
        toolTip: 'Accept selected item',
        disabled: this.isAcceptBtnDisabled()
      },
      {
        id: 'id_btnReject',
        text: 'REJECT',
        loading: this.isRejectLoading(),
        type: { style: 'general', name: 'money-action' },
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Reject selected item',
        disabled: this.isRejectBtnDisabled()
      }
    ],
    videoButton: [
      {
        slug: 'receivepayments'
      }
    ]
  }));

  /**
   * EXTERNAL CHILD COMPONENTS
   */
  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    addAttachComment: RecievedChecksAddAttachmentCommentComponent,
    rCSelectBoxComponent: RCSelectBoxComponent,
    isEditableComponent: EditableCellRendererComponent,
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
          {
            value: { type: 4, status: 7 },
            name: 'HTML-FORM-SENDER-FPRINTED'
          },
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

  /**
   * @description Cell render component
   */
  cellRenderer: {
    action: { name: string; id: string; icon: string; svg?: string }[];
  } = {
    action: [
      {
        name: 'Accept',
        id: 'RId_accept',
        icon: 'fa fa-check'
      },
      {
        name: 'Reject',
        id: 'RId_reject',
        icon: 'fa fa-close'
      },
      {
        name: 'Print',
        id: 'RId_print',
        icon: 'fa fa-print'
      },
      {
        name: 'Cancel',
        id: 'RId_cancel',
        icon: 'fa fa-trash'
      },
      {
        name: 'Audit Trail',
        id: 'RId_audittrail',
        icon: 'fa fa-history'
      },
      {
        name: 'Mark As Printed',
        id: 'RId_markasprinted',
        icon: 'fa fa-check'
      },
      {
        name: 'Resend',
        id: 'RId_resend',
        icon: 'fa fa-paper-plane'
      },
      {
        name: 'Add Proof of Delivery',
        id: 'RId_pod',
        icon: 'fa fa-receipt',
        svg: '/assets/images/pod-icon.svg'
      },
      {
        name: 'Add Attachment',
        id: 'RId_attachment',
        icon: 'fa fa-paperclip'
      },
      {
        name: 'Add Comment',
        id: 'RId_comment',
        icon: 'fa fa-comments'
      }
    ]
  };

  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: true
  };

  constructor() {
    effect(() => {
      const selectedDate = this.selectedDate();
      if (selectedDate && this.isReceiveChecksReport()) {
        this.setDefaultDate(selectedDate);
      }
    });
  }

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.getStatus();
    this.getAttachmentStatus();
    this.checkScreenSize();
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    if (this.isReceiveChecksReport()) {
      this.setDefaultDate(
        this.selectedDate() as { endDate: string; startDate: string }
      );
    } else {
      this.selectedService.setCustomDateFilterArray({
        colId: '',
        fromDate: '',
        toDate: ''
      });
    }

    this.columnFields = this.getColumnFields();
  }

  setDefaultDate(selectedDate: { endDate: string; startDate: string }) {
    const today = new Date().toISOString().split('T')[0];
    const isToday =
      selectedDate.startDate === today && selectedDate.endDate === today;
    this.selectedService.setCustomDateFilterArray({
      colId: 'received_check_lists.created_at',
      fromDate: selectedDate?.startDate as string,
      toDate: selectedDate?.endDate as string,
      dateRangeId: isToday ? 'today' : undefined
    });
    this.colDefDate.floatingFilterComponentParams = { tableId: 3 };
  }

  checkScreenSize() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  handleResize() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 1500) {
      this.isHidePrintButtons.set(true);
    } else {
      this.isHidePrintButtons.set(false);
    }
  }

  /**
   * @description Creates payload object for filtering and returns it.
   * @param filterValue - string representing value to be filtered.
   * @returns filter payload object.
   */
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
      [filterName]: {
        ...selectBoxFilterValues
      }
    };
    return filterPayloadForGrid;
  }

  /**
   * @description Retrieves the status data from the request payments service and updates the component's status variables.
   */
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

  /**
   * @description  Handles the row selection event in the data table.
   * @param event - The event object containing data table parameters.
   */
  onRowSelected(event: { api: { getSelectedRows(): IRecieveCheckRow[] } }) {
    const gridApi = event.api; // all the data table params function get here
    const selectedRows = gridApi.getSelectedRows();
    this.statuses = [];

    this.FloatingFilterComponent.selectBox.forEach(
      (ele: { id: string; values: number[] }) => {
        if (ele?.id === 'check_drafts.status') {
          this.statuses = ele.values;
        }
      }
    );

    this.printCheckDisabled.set(true);
    this.printWhiteCheckDisabled.set(true);
    this.isDdDisabled.set(true);
    this.createDDSlipDisabled.set(true);
    this.isRejectBtnDisabled.set(true);
    this.isAcceptBtnDisabled.set(true);
    this.enabledHeaderButtons(selectedRows);
  }

  /**
   * Determines if the selected rows satisfy the status-based condition.
   *
   * @param {IRecieveCheckRow[]} selectedRows - An array of selected rows from the data table.
   * @returns {string[]} Returns an array of button IDs that are enabled in the table header.
   */
  enabledHeaderButtons(selectedRows: IRecieveCheckRow[]) {
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

  getViewAction(env: { selectedRow: IRecieveCheckRow }) {
    if (env.selectedRow?.uu_id) {
      this.router.navigate([
        'manage/receivedchecks/show',
        env.selectedRow.uu_id
      ]);
    }
  }

  /**
   *
   * @description This function retrieves the action list based on the selected environment's received type and status.
   * It determines which actions should be hidden or shown based on the retrieved action list.
   * Performs the corresponding action based on the selected environment's ID.
   * The actions include accepting, rejecting, printing, canceling, marking as printed, audit trail, resending, adding attachments, and adding comments.
   * @param env - The selected environment object.
   */
  getActionComp(env: { selectedRow: IRecieveCheckRow; id: string }) {
    if (env?.selectedRow) {
      const hideArr: string[] = [];
      const actionList =
        this.cellRendererRePymntsStatus[env?.selectedRow?.received_type][
          env?.selectedRow?.status
        ];

      if (actionList.isItApproveAble === 0) {
        hideArr.push('RId_accept');
      } else {
        hideArr.push('');
      }
      if (actionList.isItRejectAble === 0) {
        hideArr.push('RId_reject');
      } else {
        hideArr.push('');
      }

      if (actionList.isItPrintAble === 0) {
        hideArr.push('RId_print');
      } else {
        hideArr.push('');
      }

      if (actionList.isItCancellAble === 0) {
        hideArr.push('RId_cancel');
      } else {
        hideArr.push('');
      }

      if (actionList.isItAuditable === 0) {
        hideArr.push('RId_audittrail');
      } else {
        hideArr.push('');
      }

      if (actionList.isItPrintmarkAble === 0) {
        hideArr.push('RId_markasprinted');
      } else {
        hideArr.push('');
      }

      if (actionList.isItResendAble === 0) {
        hideArr.push('RId_resend');
      } else {
        hideArr.push('');
      }

      if (env.selectedRow.pod_status === 1) {
        hideArr.push('RId_pod');
      } else {
        hideArr.push('');
      }

      this.disabledActions(hideArr);

      switch (env.id) {
        case 'RId_accept':
          {
            const response1 = this.confirmMessage(
              'Are you sure you want to accept?'
            );
            response1.afterClosed().subscribe((res) => {
              if (res) {
                this.acceptAction(env.selectedRow.uu_id);
              }
            });
          }
          break;
        case 'RId_reject':
          {
            const response2 = this.confirmMessage(
              'Are you sure you want to reject?'
            );
            response2.afterClosed().subscribe((res) => {
              if (res) {
                this.rejectAction(env.selectedRow.uu_id);
              }
            });
          }
          break;

        case 'RId_print':
          this.printAction(env.selectedRow.uu_id);
          break;

        case 'RId_cancel':
          {
            const response3 = this.confirmMessage(
              'Are you sure you want to cancel?'
            );
            response3.afterClosed().subscribe((res) => {
              if (res) {
                this.cancelAction(env.selectedRow.uu_id);
              }
            });
          }
          break;
        case 'RId_markasprinted':
          {
            const response4 = this.confirmMessage(
              "If you mark this check as printed, you won't be able to print it again"
            );
            response4.afterClosed().subscribe((res) => {
              if (res) {
                this.markAsPrintedAction(env.selectedRow.uu_id, 1);
              }
            });
          }
          break;

        case 'RId_audittrail':
          this.auditTrail(env.selectedRow.encrypted_id);
          break;

        case 'RId_resend':
          this.resendAction(
            env.selectedRow.uu_id,
            env.selectedRow.encrypted_bankaccount_id
          );
          break;

        case 'RId_attachment':
          this.openAddAttachmentModal(env.selectedRow.encrypted_id);
          break;

        case 'RId_comment':
          this.openAddCommentModal(env.selectedRow.encrypted_id);
          break;
        case 'RId_pod':
          this.openAddPodModal(
            env.selectedRow.uu_id,
            env.selectedRow.encrypted_id
          );
          break;
        default:
          break;
      }
    }
  }

  /**
   * @description This function performs different navigation and actions based on the provided  object's ID.
   * t handles header button clicks and panel button clicks, such as navigating to specific routes or performing actions like printing, approving, rejecting, etc.
   * @param env - The environment object containing button details and selected rows.
   */
  headerButtonNavigation(env: {
    id: string;
    selectedRows: IRecieveCheckRow[];
  }): void {
    switch (env.id) {
      // HEADER BUTTON CLICKS
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

      // PANEL BUTTON CLICKS

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

  /**
   * @description This function initiates direct deposit for the selected rows or displays a warning if no rows are selected.
   * If rows are selected, a confirmation dialog is displayed to confirm the direct deposit action.
   * If confirmed, the `ddAction()` function is called to initiate the direct deposit action.
   * @param selctedRows - The array of selected rows for direct deposit.
   *
   */
  directDepositCheck(selctedRows: IRecieveCheckRow[]) {

    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }

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
          this.ddAction(selctedRows);
        }
      });
    }
  }

  /**
   * @description This function creates a deposit slip for the selected rows or displays a warning if no rows are selected.
   * @param rows - The array of selected rows for creating a deposit slip.
   */
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

    this.router.navigate(['manage/depositslips/create'], {
      queryParams: { Ids: depoIds, referenceType: 2 }
    });
  }

  /**
   * @description This function initiates the direct deposit action for the selected rows.
   * @param selctedRows - The array of selected rows for direct deposit.
   */
  ddAction(selctedRows: IRecieveCheckRow[]) {
    const uuids: string[] = [];

    selctedRows.forEach((element: IRecieveCheckRow) => {
      uuids.push(element.uu_id);
    });
    const data = {
      ids: uuids
    };
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
                  this.router.navigate(['/manage/bank-accounts/index']);
                }
              });
            }
          }
        })
    );
  }

  /**
   * @description Open ach verification required alert modal.
   */
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
        this.router.navigate(['/manage/bank-accounts/index']);
      }
    });
  }

  /**
   *
   * @description This function initiates the printing of the selected rows based on the specified print type.
   * @param selctedRows - The array of selected rows to be printed.
   * @param type - The print type identifier (1 for regular print, 2 for white print).
   * @returns
   */
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
      const data = {
        uuids: uuIds,
        printType: type
      };
      this.printSelectedData(data);
    }
  }

  /**
   * @description This function opens the add attachment modal for the specified ID.
   * @param id -The encrypted Id of the item for which the attachment modal is being opened.
   */
  openAddAttachmentModal(id: string) {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1000px',

      data: {
        id,
        type: 'request-payments'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.reloadTable();
      }
    });
  }

  /**
   * @description This function opens the add comment modal for the specified ID.
   * @param id -The encrypted Id of the item for which the attachment modal is being opened.
   */
  openAddCommentModal(id: string) {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',

      data: {
        id,
        type: 'request-payments',
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.reloadTable();
      }
    });
  }

  openAddPodModal(id: string, encryptedId: string) {
    this.dialog.open(AddProofOfDeliveryComponent, {
      width: '500px',
      maxHeight: '93%',
      disableClose: true,
      data: {
        uuId: id,
        encryptedId
      }
    });
  }

  /**
   * @description This function handles the action of approving selected checks.
   * @param selectedItems - The selected items to be approved.
   * @param isMulti - Indicates whether multiple items are selected.
   *
   */
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
    const data = {
      uuids: uuIds,
      printType: 1
    };

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

  /**
   * @description This function handles the action of rejecting selected checks.
   * @param selectedItems - The selected items to be rejected.
   * @param isMulti  - Indicates whether multiple items are selected.
   */
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
    const data = {
      uuids: uuIds
    };

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
      doneMsg: 'Ok'
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * @description This function checks if a warning condition exists for the header button action based on the selected items.
   * @param selectedItems - The selected items to check for the warning condition.
   * @param action - The action type ('accept' or 'reject') to check for the warning condition.
   */
  onHeaderButtonWarning(selectedItems: IRecieveCheckRow[], action: string) {
    const actionList = selectedItems?.map(
      (e) => this.cellRendererRePymntsStatus[e?.received_type][e?.status]
    );
    actionList.some((status) => {
      switch (action) {
        case 'accept':
          return status.isItApproveAble === 0;
        case 'reject':
          return status.isItRejectAble === 0;
        default:
          return false;
      }
    });
    return null;
  }

  openFailedAlert(content: string) {
    const data: IFailedAlert = {
      content
    };
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

  /**
   * @description This function performs an action on the selected rows based on the specified type.
   * @param selctedRows The selected rows to perform the action on.
   * @param type - The type of action to perform ('a' for accept, 'r' for reject).
   */
  actionButton(selctedRows: IRecieveCheckRow[], type: string) {
    const m1 = 'Are you sure you want to reject?';
    const m2 = 'Are you sure you want to accept?';
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
      const response = this.confirmMessage(type === 'a' ? m2 : m1);
      response.afterClosed().subscribe((res) => {
        if (res) {
          this.actionDo(selctedRows, type);
        }
      });
    }
  }

  /**
   * @description This function performs the specified action on the selected rows.
   * @param selctedRows - The selected rows to perform the action on.
   * @param type - The type of action to perform ('a' for accept, 'r' for reject).
   * @returns
   */
  actionDo(selctedRows: IRecieveCheckRow[], type: string) {
    const uuIds: string[] = [];
    let checkMisMatch = false;

    const m2 = 'Sorry,Some checks are already processed';
    if (type === 'a') {
      const m1 = "Sorry,You don't have permission to accept this check";
      selctedRows.forEach((element: IRecieveCheckRow) => {
        uuIds.push(element.uu_id);
        if (
          this.cellRendererRePymntsStatus[element.received_type][element.status]
            .isItApproveAble === 0
        ) {
          checkMisMatch = true;
        }
      });

      if (checkMisMatch) {
        this.warningAlert(selctedRows.length === 1 ? m1 : m2);
      } else {
        const data = {
          uuids: uuIds
        };
        this.bulkAcceptAction(data, uuIds);
      }
    } else {
      const m1 = "Sorry,You don't have permission to reject this check";
      selctedRows.forEach((element: IRecieveCheckRow) => {
        uuIds.push(element.uu_id);
        if (
          this.cellRendererRePymntsStatus[element.received_type][element.status]
            .isItRejectAble === 0
        ) {
          checkMisMatch = true;
        }
      });

      if (checkMisMatch) {
        this.warningAlert(selctedRows.length === 1 ? m1 : m2);
      } else {
        const data = {
          uuids: uuIds
        };
        this.bulkRejectAction(data);
      }
    }
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

  /**
   * @description This function executes the accept action for the specified ID.
   * @param id  - The ID of the item to accept.
   */
  acceptAction(id: string) {
    this.subscriptions.push(
      this.requestPaymentsService.acceptRequest(id).subscribe((res) => {
        if (res.success) {
          this.reloadTable();
          const data = {
            uuids: [id],
            printType: 1
          };
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

  /**
   * @description This function initiates a direct deposit for the specified UUID.
   * @param uuid  The UUID of the item to initiate direct deposit.
   */
  ddfromAccept(uuid: string[]) {
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    const data = {
      ids: uuid
    };
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
                this.router.navigate(['/manage/bank-accounts/index']);
              }
            });
          }
        }
      })
    );
  }

  /**
   * @description This function performs a bulk accept action using the provided data and UUIDs.
   * @param data - The data object containing UUIDs to perform the bulk accept action.
   * @param uuids - An array of UUIDs to perform the bulk accept action.
   */
  bulkAcceptAction(
    data: {
      uuids: string[];
      printType?: number;
    },
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

  /**
   *@description This function opens a dialog for accepting success. The dialog displays options such as printing the check and deposit, initiating direct deposit to a bank account, or doing the action later.
   */
  acceptSuccess() {
    const dialogRef = this.dialog.open(AcceptRequestComponent, {
      minWidth: '370px',
      disableClose: true
    });
    return dialogRef;
  }

  rejectAction(id: string) {
    this.subscriptions.push(
      this.requestPaymentsService.rejectRequest(id).subscribe((res) => {
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

  /**
   * @description This function sends a request to the server to initiate the print action for a specific request payment ID.
   * @param id - The ID of the request payment.
   */
  printAction(id: string) {
    this.subscriptions.push(
      this.requestPaymentsService.printRequest(id).subscribe(
        (printRes) => {
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
              this.markAsPrintedAction(id, 2);
            }
          });
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

  cancelAction(id: string) {
    this.subscriptions.push(
      this.requestPaymentsService.cancelRequest(id).subscribe((res) => {
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
    this.subscriptions.push(
      this.requestPaymentsService.markAsPrintRequest(id).subscribe((res) => {
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
    this.dialog.open(ViewAuditTrailModalComponent, {
      maxWidth: '1000px',
      width: '100%',
      data: {
        heading: 'Receive Payment',
        slug: 'request-payments',
        id: encrypted_id
      }
    });
  }

  /**
   * @description This function sends a request to the server to initiate the resend action for a specific request payment ID.
   * @param id - The ID of the request payment.
   * @param bankId - The ID of the bank account.
   */
  resendAction(id: string, bankId: string) {
    const alert = {
      title: 'Link not found !',
      content: 'Please add a payment link to the bank account',
      doneMsg: 'Generate a link',
      cancelMsg: 'No, cancel'
    };
    this.subscriptions.push(
      this.requestPaymentsService.resendRequest(id).subscribe((res) => {
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
              this.router.navigate(['manage/payment-links/create', bankId], {
                queryParams: { redirectUrl: 'manage/receivedchecks' }
              });
            }
          });
        }
      })
    );
  }

  /**
   * method to export table data
   */
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

  /**
   * description This function triggers the printing of the selected request payments based on the provided data.
   * @param data - The data object containing the printType and uuids.
   */
  printSelectedData(data: { uuids: string[]; printType?: number }) {
    this.HeaderButtonLoadingProp.isLoading = true;

    this.HeaderButtonLoadingProp.btn_id =
      data.printType === 1 ? 'id_printCheck' : 'id_printCheck_white';
    this.HeaderButtonLoadingProp.btn_name = 'Loading...';
    if (data.printType === 1) {
      this.isPrintCheckPaperLoading.set(true);
    } else {
      this.isPrintWhitePaperLoading.set(true);
    }
    this.subscriptions.push(
      this.requestPaymentsService
        .printSelected(data)
        .pipe(
          finalize(() => {
            this.isPrintCheckPaperLoading.set(false);
            this.isPrintWhitePaperLoading.set(false);
            this.HeaderButtonLoadingProp.isLoading = false;
            this.HeaderButtonLoadingProp.btn_id = '';
          })
        )
        .subscribe(
          (printRes) => {
            if (printRes.success) {
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
                    markAsPrinted
                      .afterClosed()
                      .subscribe((markAsPrintedRes) => {
                        if (markAsPrintedRes) {
                          const datas = {
                            uuids: data.uuids
                          };
                          this.markAsPrintBulk(datas);
                        }
                      });
                  }
                });
              } else {
                const markAsPrinted = this.markAsPrint();
                markAsPrinted.afterClosed().subscribe((res) => {
                  if (res) {
                    const datas = {
                      uuids: data.uuids
                    };
                    this.markAsPrintBulk(datas);
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
    this.subscriptions.push(
      this.requestPaymentsService
        .markAsPrintBulkRequest(data)
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

  colDefId = {
    headerName: '',
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
    checkboxSelection: true,
    filter: 'agTextColumnFilter',
    sortable: false,
    floatingFilter: true,
    headerClass: 'pl-3.5',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    cellClass: 'flex justify-center',
    cellRenderer: () => ''
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 180,
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
    minWidth: 110,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      prefixOptionalField: 'check_from_name'
    },
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
    cellRendererParams: {
      type: 'date',
      isPipeDate: true
    },
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
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
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    cellRendererForExport: (params: ICellRendererParams) =>
      params.data?.created_at
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
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
      // Only For when Export Table data
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
    minWidth: 65,
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
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  /**
   * SET COLUMN FEILDS
   */
  columnDefs = [
    this.colDefId,
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
    this.colDefEditable,
    this.colDefAction
  ];

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
      },
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      }
    ] as IDtColumnFields[];
    return baseFields;
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

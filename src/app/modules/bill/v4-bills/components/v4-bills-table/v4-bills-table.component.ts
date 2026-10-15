import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  model,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams, RowNode } from '@ag-grid-community/core';
import { Subscription, finalize, skip } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { NewVendorCreditModalComponent } from 'src/app/shared/modal/vendor-credit-modal/new-vendor-credit-modal/new-vendor-credit-modal.component';
import { Router } from '@angular/router';
import { V4ViewAuditTrailModalComponent } from 'src/app/shared/modal/v4-view-audit-trail-modal/v4-view-audit-trail-modal.component';
import { V4ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-thirdparty-import-main-modal/v4-thirdparty-import-main-modal.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { ComponentType } from '@angular/cdk/portal';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4StatusComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-status/v4-status.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faTrash,
  faCreditCard,
  faEnvelopeOpenText,
  faA,
  faR,
  faArrowDownToLine,
  faCircleInfo
} from '@fortawesome/pro-solid-svg-icons';
import {
  faMessageDots,
  faPaperclip,
  faPrint,
  faBan,
  faMoneyBillWave
} from '@fortawesome/pro-regular-svg-icons';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4BulkPaymentService } from 'src/app/modules/v4-bulk-payment/services/v4-bulk-payment.service';
import { BillAttachmentCommentComponent } from './billAttachmentComment';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4AddBillComponent } from '../../modals/v4-add-bill/v4-add-bill.component';
import { IBillRowData } from '../../../model/Bill';
import { V4DataTableComponent } from '../../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { EmailToBillModalComponent } from '../../../modals/email-to-bill-modal/email-to-bill-modal.component';
import { InvoiceBillStateService } from '../../../services/invoice-bill-state.service';
import { V4BillsDetailsPanelComponent } from '../v4-bills-details-panel/v4-bills-details-panel.component';

@Component({
  selector: 'app-v4-bills-table',
  templateUrl: './v4-bills-table.component.html',
  styleUrls: ['./v4-bills-table.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, V4BillsDetailsPanelComponent]
})
export class V4BillsTableComponent implements OnInit, OnDestroy {
  /* Injectors */
  private dataTableService = inject(DataTableService);

  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faTrash,
      faCreditCard,
      faEnvelopeOpenText,
      faA,
      faR,
      faArrowDownToLine,
      faCircleInfo,
      faMessageDots,
      faPaperclip,
      faPrint,
      faBan,
      faMoneyBillWave
    );

    effect(() => {
      const trigger = this.invoiceBillStateService.billSavedTrigger();
      if (trigger > 0) {
        this.refreshDataTable();
      }
    }, { allowSignalWrites: true });
  }

  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private billService = inject(BillService);
  private router = inject(Router);
  private v4BulkPaymentService = inject(V4BulkPaymentService);

  private integrationService = inject(IntegrationService);
  private v3DataTableService = inject(V3DataTableService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);
  private invoiceBillStateService = inject(InvoiceBillStateService);
  private destroyRef = inject(DestroyRef);

  public tableId = DTTableId.bill; // Data Table Id
  printLoading = signal(false);
  deleteLoading = signal(false);
  voidLoading = signal(false);
  payDisable = signal(false);
  voidDisable = signal(false);
  // Distinct payee ids across the currently selected bills. Drives whether
  // Pay routes to the single send modal or the bulk payment center.
  payees = signal<string[]>([]);
  pendingBillsSignal = signal(0);
  isApprovalRequired = signal(true);
  isNoApprovalRequiredBills = signal(true);
  isLoggedAsUser = signal(false);
  isEmailToBillMapped = signal(true);
  mappedEmailToBill = signal('');
  billAutomationEnabled = signal(false);
  isBillAutomationCallDone = signal(false);

  // Detail panel
  isDetailPanelOpen = signal(false);
  selectedBillId = signal('');

  selectedPanelButton = model('id_all');

  private readonly selectedPanelButton$ = toObservable(
    this.selectedPanelButton
  ).pipe(skip(1));

  deselectedColumns: string[] = this.defaultDeselectedColumns();
  selectedRowData: RowNode<ICommonTransactionTableData>[];
  cellRendererCheckStatus?: Record<string, ICheckStatus>;
  subscriptions: Subscription[] = [];
  isPending = false;
  showBillDotComImportBtn = false;
  alertDot = false;
  // pendingBills: number;
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['id_1', 'id']
  };

  isPrintProcessing = false;
  fieldsShownByDefault: string[] = ['payee_name', 'id', 'bill_grand_total'];

  defaultDeselectedColumns() {
    if (window.innerWidth < 768) {
      return [
        'view',
        'status',
        'source_name',
        'source.source',
        'updated_at',
        'reference_no',
        'created_by',
        'description'
      ];
    }
    if (window.innerWidth < 1100) {
      return ['source_name', 'source.source', 'created_by', 'description'];
    }
    return [];
  }

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--v4-common-green-color)',
        type: 'list'
      },
      {
        text: 'Print',
        id: 'multiplePrint',
        isAddIcon: true,
        icon: ['far', 'print'],
        lucideIcon: 'printer',
        type: 'list',
        loading: this.printLoading(),
        disabled: this.voidDisable(),
        floatingBarVariant: 'filled-primary'
      },
      {
        text: 'Pay',
        id: 'id_pay',
        icon: ['far', 'money-bill-wave'],
        lucideIcon: 'banknote',
        isAddIcon: true,
        type: 'list',
        disabled: this.payDisable(),
        floatingBarVariant: 'filled-primary'
      },
      {
        text: 'Void',
        id: 'id_void',
        isAddIcon: true,
        icon: ['far', 'ban'],
        lucideIcon: 'ban',
        type: 'list',
        backGroundInput: 'var(--v4-common-yellow-color)',
        loading: this.voidLoading(),
        disabled: this.voidDisable(),
        floatingBarVariant: 'danger-soft'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        lucideIcon: 'trash-2',
        backGroundInput: 'var(--v4-common-red-color)',
        type: 'list',
        loading: this.deleteLoading(),
        floatingBarVariant: 'filled-danger'
      },
      {
        text: 'Vendor Credit',
        id: 'id_vendor_credit',
        icon: ['fas', 'credit-card'],
        isAddIcon: true,
        type: 'list',
        backGroundInput: 'var(--v4-common-green-color)'
      },
      {
        text: 'Email to Bill',
        id: 'id_email_to_bill',
        icon: ['fas', 'envelope-open-text'],
        isAddIcon: true,
        type: 'list',
        toolTip: 'Turn email invoices into payable bills instantly',
        backGroundInput: 'var(--v4-common-violet-color)',
        customClasses: 'font-extralight p-0',
        isHidden: !this.billAutomationEnabled(),
        disabled: !this.isBillAutomationCallDone()
      },
      {
        id: 'id_approve',
        roundIcon: ['fas', 'a'],
        lucideIcon: 'circle-check',
        text: 'Approve',
        floatingBarVariant: 'success-soft',
        // Approve/Reject are the one genuine boundary in this bar — everything
        // before them acts on a bill, these two decide it. Every other button
        // stays in the default group so Void and Delete sit together.
        barGroup: 2,
        customClasses:
          'bg-v4-badge-success-bg-color text-v4-common-green-color',
        toolTip: 'Accept selected item',
        disabled: this.isApprovalRequired(),
        isHidden: this.isNoApprovalRequiredBills()
      },
      {
        id: 'id_reject',
        roundIcon: ['fas', 'r'],
        lucideIcon: 'circle-x',
        text: 'Reject',
        floatingBarVariant: 'danger-soft',
        barGroup: 2,
        customClasses: 'bg-v4-badge-error-bg-color text-v4-common-red-color',
        toolTip: 'Reject selected item',
        disabled: this.isApprovalRequired(),
        isHidden: this.isNoApprovalRequiredBills()
      }
    ],
    topRightButtons: [
      {
        text: 'Import Bills',
        id: 'import-bills',
        icon: ['fas', 'arrow-down-to-line'],
        type: { name: 'list', style: 'green' },
        backGroundInput: 'transparent',
        customClasses: 'font-extralight p-0',
        disableHoverEffect: false,
        isAddIcon: true
      }
    ],
    pendingItems: {
      id: 'pending-bills',
      itemName: 'Bills',
      pendingCount: this.pendingBillsSignal()
    },
    videoButton: [
      {
        slug: 'bill'
      }
    ]
  }));

  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'bill_status',
        values: [
          { value: 1, name: 'To Pay' },
          { value: 2, name: 'Paid' },
          { value: 3, name: 'Void' },
          { value: 4, name: 'Received' },
          { value: 6, name: 'Rejected' },
          { value: 7, name: 'Imported' },
          { value: 13, name: 'Approval Required' }
        ]
      },
      {
        id: 'status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Completed' },
          { value: '3', name: 'Canceled' },
          { value: '4', name: 'Failed' }
        ]
      }
    ],
    selectDate: [
      { id: 'inv_date', initialRange: 'All Time' },
      { id: 'bills.created_at', initialRange: 'All Time', isPrimary: true },
      { id: 'due_date', initialRange: 'All Time' }
    ]
  };

  actionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  cellRenderer: {
    action: { name: string; id: string; icon: string; color?: string }[];
  } = {
    action: [
      {
        name: 'Print',
        id: 'id_printRow',
        icon: 'printer'
      },
      {
        name: 'Mark As Paid',
        id: 'id_markpaid',
        icon: 'star'
      },
      {
        name: 'Pay',
        id: 'id_paay',
        icon: 'banknote'
      },
      {
        name: 'Void',
        id: 'id_vooid',
        icon: 'ban'
      },
      {
        name: 'Add Comment',
        id: 'id_comment',
        icon: 'message-square'
      },
      {
        name: 'Add Attachment',
        id: 'id_attachment',
        icon: 'paperclip'
      },
      {
        name: 'Audit Trail',
        id: 'id_audittrail',
        icon: 'history'
      },
      {
        name: 'Edit',
        id: 'id_edit',
        icon: 'pencil'
      },
      {
        name: 'Clone Bill',
        id: 'id_clonbill',
        icon: 'copy'
      },
      {
        name: 'Delete',
        id: 'id_Delete',
        icon: 'trash-2',
        color: 'red'
      }
    ]
  };

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    v3PaymentTableActionComponent: V4StatusComponent,
    actionComponent: V4DtActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    dateRangeV35Component: V4DateFloatingFilterComponent,
    addAttachComment: BillAttachmentCommentComponent,
    V3payeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    V3PayeeNameComponent: V4PayeeNameComponent,
    V3DTCommonFilterComponent: V4DTCommonFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent
  };

  colDefId = {
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    cellRenderer: () => ''
  };

  actionField = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 110,
    cellRenderer: 'actionComponent',
    cellRendererParams: { tableVersion: 'v4' },
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    cellClass: 'flex items-center'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'bill_status',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    width: 190,
    maxWidth: 300,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'addAttachComment',
    valueGetter: (params: ICellRendererParams<{ bill_status: string }>) => {
      const value = params?.data?.bill_status;
      switch (value) {
        case '1':
          return 'Pay';
        case '2':
          return 'Paid';
        case '3':
          return 'Voided';
        case '4':
          return '';
        case '5':
          return 'Accepted';
        case '6':
          return 'Rejected';
        case '7':
          return 'Imported';
        case '9':
          return 'Loan Requested';
        case '13':
          return 'Approval required';
        case '14':
          return 'Approved For Printing';
        case '15':
          return 'Denied to print';
        case '16':
          return 'Pay';
        default:
          return '';
      }
    }
  };

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    minWidth: 175,
    maxWidth: 300,
    floatingFilterComponent: 'V3payeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3PayeeNameComponent',
    cellRendererParams: {
      payeeField: 'enc_payeeid'
    }
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'bill_grand_total',
    suppressFloatingFilterButton: true,
    maxWidth: 200,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    },
    minWidth: 150,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col'
  };

  colDefInvoiceNo = {
    headerName: 'Invoice No',
    field: 'inv_no',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 180,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter'
  };

  colDefInvDate = {
    headerName: 'Invoice Date',
    field: 'inv_date',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 160,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,

    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date', prefixOptionalField: 'invoiceDate' }
  };

  colDefDueDate = {
    headerName: 'Due Date',
    field: 'due_date',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 160,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,

    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' }
  };

  colDefBillTo = {
    headerName: 'Bill To',
    field: 'bank_accounts.bank_account_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 220,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.bank_account_nick_name
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'name',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    maxWidth: 180,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefCreatedTime = {
    headerName: 'Created Time',
    field: 'bills.created_at',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 200,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    cellRenderer: 'v4CreatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.created_at
  };

  private toTitleCase(value?: string): string | undefined {
    if (!value) return value;
    return value
      .split(' ')
      .map((word) =>
        word.length <= 3 && word === word.toUpperCase()
          ? word
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
  }

  colDefPaymentStatus = {
    headerName: 'Payment Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 160,
    maxWidth: 200,
    floatingFilterComponent: 'SelectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      table: 'bill_table'
    },
    cellRendererSelector: (params: ICellRendererParams) =>
      params?.data?.status
        ? { component: 'v3PaymentTableActionComponent' }
        : undefined,
    cellClass: 'flex items-center',
    cellRendererParams: (params: ICellRendererParams) => {
      const status = params.data?.transfer?.status;
      let checkStatus;
      let checkColor;
      if (status || status === 0) {
        checkStatus =
          this.cellRendererCheckStatus?.[status]?.statusShortDescription;
        checkColor = this.cellRendererCheckStatus?.[status]?.color;
      }
      checkStatus = this.toTitleCase(checkStatus);
      if (checkStatus === 'New') {
        checkStatus = 'Pending';
      }
      return {
        tableType: 'bill_table',
        checkStatus: { value: checkStatus, color: checkColor }
      };
    }
  };

  columnDefs = [
    this.colDefId,
    this.actionField,
    this.colDefPayee,
    this.colDefBillTo,
    this.colDefAmount,
    this.colDefInvoiceNo,
    this.colDefInvDate,
    this.colDefStatus,
    this.colDefPaymentStatus,
    this.colDefDueDate,
    this.colDefCreatedBy,
    this.colDefCreatedTime,
    this.colDefMemo
  ];

  defaultColumnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Action',
      isDisabled: true,
      colDef: this.actionField,
      isChecked: true
    },
    {
      id: 'payees',
      name: 'Payee',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'bill_to',
      name: 'Bill To',
      isDisabled: false,
      colDef: this.colDefBillTo,
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
      id: 'invoice_date',
      name: 'Invoice Date',
      isDisabled: false,
      colDef: this.colDefInvDate,
      isChecked: true
    },
    {
      id: 'invoice_no',
      name: 'Invoice No',
      isDisabled: false,
      colDef: this.colDefInvoiceNo,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Payment Status',
      isDisabled: false,
      colDef: this.colDefPaymentStatus,
      isChecked: true
    },
    {
      id: 'due_date',
      name: 'Due Date',
      isDisabled: false,
      colDef: this.colDefDueDate,
      isChecked: true
    },
    {
      id: 'bill_status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'created_by',
      name: 'Created By',
      isDisabled: false,
      colDef: this.colDefCreatedBy,
      isChecked: true
    },
    {
      id: 'created_time',
      name: 'Created Time',
      isDisabled: false,
      colDef: this.colDefCreatedTime,
      isChecked: true
    },
    {
      id: 'memo',
      name: 'Memo',
      isDisabled: true,
      colDef: this.colDefMemo,
      isChecked: true
    }
  ];

  // ===============> constructor end <==================//

  ngOnInit(): void {
    this.getCheckDescription();
    this.v3DataTableService.resetV3DataTablePayload();
    this.mangageRowSelectionData();
    this.trackUserLoginStatus();
    this.isPendingStatus();
    this.getOrganizations();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.floatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.refreshDataTable();
    this.getRowSelectionData();
    this.subscriptions.push(
      this.selectedPanelButton$.subscribe((value) => {
        this.applyPanelFilter(value);
      })
    );
  }

  private applyPanelFilter(panelId: string): void {
    switch (panelId) {
      case 'id_all':
        this.v3DataTableService.updateV3DataTableByRemovingFilter = [
          'bill_status'
        ];
        break;
      case 'id_paid':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('2');
        break;
      case 'id_topay':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('1');
        break;
      case 'id_stvoid':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('3');
        break;
      case 'pending-bills':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('13');
        break;
      default:
        break;
    }
  }

  trackUserLoginStatus() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        const enabled = (res as unknown as IHeaderData).enabledPlugins.includes(
          'bill-automation'
        );
        this.billAutomationEnabled.set(enabled);
        this.invoiceBillStateService.setBillAutomationEnabled(enabled);
        this.isLoggedAsUser.set(isUser);
      })
    );
  }

  refreshDataTable() {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  // FIND WHICH HEADER BUTTON IS CLICKED
  headerButtonClick(event: {
    id: string;
    selectedRows: IBillRowData[];
    tableId: string;
  }) {
    const { selectedRows } = event;
    const ids = selectedRows?.map((row: IBillRowData) => row.action) || [];

    switch (event.id) {
      // Panel buttons
      case 'id_new':
        this.onNew();
        break;
      case 'multiplePrint':
        if (!this.isPrintProcessing) this.onMultipleprint(ids);
        break;
      case 'id_void':
        this.markVoid(selectedRows);
        break;
      case 'multipleDelete':
        this.onMultipleDelete(selectedRows);
        break;
      case 'id_quickbooks':
      case 'import-bills':
        this.openImports();
        break;
      case 'id_vendor_credit':
        this.goToVendorCredit();
        break;
      case 'pending-bills':
        this.alertClick();
        break;
      case 'id_pay':
        if (!ids.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select bills for payment'
          });
        } else if (this.billIsPayAble(selectedRows)) {
          this.onHeaderPay(selectedRows, ids);
        } else {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please approve the bill to pay'
          });
        }
        break;
      case 'id_approve':
        if (!ids.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select at least 1 bill to Approve'
          });
        } else {
          this.onMultiApprove(ids);
        }
        break;
      case 'id_reject':
        if (!ids.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select at least 1 bill to Reject'
          });
        } else {
          this.onMultiReject(ids);
        }
        break;

      case 'id_email_to_bill':
        this.onEmailToBill();
        break;

      // filters
      case 'id_all':
        this.v3DataTableService.updateV3DataTableByRemovingFilter = [
          'bill_status'
        ];
        break;
      case 'id_paid':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('2');
        break;
      case 'id_topay':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('1');
        break;
      case 'id_stvoid':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('3');
        break;
      default:
        break;
    }
  }

  /**
   * @description Creates payload object for filtering and returns it.
   * @param filterValue - string representing value to be filtered.
   * @returns filter payload object.
   */
  setFilterPayload(filterValue: string) {
    const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
      filter: filterValue,
      filterType: 'text',
      type: 'equals'
    };
    const filterName = 'bill_status';
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: {
        ...selectBoxFilterValues
      }
    };
    return filterPayloadForGrid;
  }

  // FIND WHICH CELL ACTION BUTTON IS CLICKED
  cellRendererActionClick(event: {
    id: string;
    selectedRow: IBillRowData;
    tableId: string;
  }) {
    if (!event) {
      return;
    }

    const selectedItem = event.selectedRow;
    this.setActionButtonHide(selectedItem);
    if (
      selectedItem?.bill_status === '2' ||
      (this.isLoggedAsUser() &&
        (selectedItem?.bill_status === '13' ||
          selectedItem?.bill_status === '15'))
    ) {
      // Disable Buttons for Paid bills

      this.dataTableService.setActionButtonDisable(true, [
        'id_printRow',
        'id_markpaid',
        'id_paay',
        'id_vooid',
        '',
        'id_attachment',
        '',
        'id_edit',
        'id_clonbill',
        ''
      ]);
    } else if (selectedItem?.bill_status === '3') {
      // Disable Buttons for Void bills
      this.cellRenderer.action.splice(3, 1, {
        name: 'Unvoid',
        id: 'id_unoid',
        icon: 'ban'
      });
      this.dataTableService.setActionButtonDisable(true, [
        '',
        'id_markpaid',
        'id_paay',
        'id_vooid',
        'id_comment',
        'id_attachment',
        '',
        'id_edit',
        'id_clonbill',
        ''
      ]);
    } else if (selectedItem?.bill_status === 4) {
      // Disable Buttons for Received bills

      this.dataTableService.setActionButtonDisable(true, [
        '',
        'id_markpaid',
        'id_paay',
        'id_vooid',
        '',
        'id_attachment',
        '',
        'id_edit',
        'id_clonbill',
        ''
      ]);
    } else if (selectedItem?.bill_status === 5) {
      // Disable Buttons for Approved bills

      this.dataTableService.setActionButtonDisable(true, [
        '',
        '',
        '',
        'id_vooid',
        '',
        '',
        '',
        'id_edit',
        'id_clonbill',
        ''
      ]);
    } else if (selectedItem?.bill_status === 6) {
      // Disable Buttons for Rejected bills

      this.dataTableService.setActionButtonDisable(true, [
        '',
        'id_markpaid',
        'id_paay',
        'id_vooid',
        'id_comment',
        'id_attachment',
        '',
        'id_edit',
        'id_clonbill',
        ''
      ]);
    } else if (
      selectedItem?.bill_status === 7 &&
      selectedItem.isApprovedXero === 0
    ) {
      // Disable Buttons for Imported bills

      this.dataTableService.setActionButtonDisable(true, [
        '',
        'id_markpaid',
        'id_paay',
        '',
        '',
        '',
        '',
        'id_edit',
        'id_clonbill',
        ''
      ]);
    } else if (selectedItem?.bill_status === 7) {
      // Disable Buttons for Imported bills

      this.dataTableService.setActionButtonDisable(true, [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'id_edit',
        'id_clonbill',
        ''
      ]);
    } else if (!selectedItem) {
      return;
    } else {
      // Enable All
      this.dataTableService.setActionButtonDisable(true, [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    }

    if (
      selectedItem?.bill_status !== 3 &&
      this.cellRenderer.action[3].id !== 'id_vooid'
    ) {
      this.cellRenderer.action.splice(3, 1, {
        name: 'Void',
        id: 'id_vooid',
        icon: 'ban'
      });
    }

    switch (event?.id) {
      case 'id_printRow':
        this.singlePrint(selectedItem.action);
        break;

      case 'id_markpaid':
        this.markAsPaid(selectedItem);
        break;

      case 'id_paay':
        this.paySingleBill(selectedItem);
        break;

      case 'id_vooid':
        this.onVoid(selectedItem);
        break;

      case 'id_unoid':
        this.onUnVoid(selectedItem);
        break;

      case 'id_comment':
        this.onAddcomment(selectedItem);
        break;

      case 'id_attachment':
        this.onAddattachment(selectedItem);
        break;

      case 'id_audittrail':
        this.onAuditTrial(selectedItem);
        break;

      case 'id_edit':
        this.onEdit(selectedItem);
        break;

      case 'id_clonbill':
        this.onCloneBill(selectedItem);
        break;

      case 'id_Delete':
        this.onDelete(selectedItem);
        break;

      case 'RId_accept':
        this.onMultiApprove([selectedItem.action]);
        break;
      case 'RId_reject':
        this.onMultiReject([selectedItem.action]);
        break;
      default:
        break;
    }
  }

  isPendingStatus(): void {
    this.subscriptions.push(
      this.billService.isPending().subscribe((res) => {
        if (res.success) {
          // Drives the shared pending-approvals badge, which is only meaningful to
          // users who can actually approve.
          this.pendingBillsSignal.set(
            res.data.billApprovalPermission ? res.data.isApprovalPendingBill : 0
          );
          if (this.billAutomationEnabled()) {
            this.isEmailToBillMapped.set(res.data.isEmailMapped);
            this.mappedEmailToBill.set(res.data.mappedEmail);
            this.isBillAutomationCallDone.set(true);
            this.invoiceBillStateService.setIsEmailToBillMapped(
              res.data.isEmailMapped
            );
            this.invoiceBillStateService.setIsBillAutomationCallDone(true);
          }
          if (
            res.data.isApprovalPendingBill > 0 &&
            res.data.billApprovalPermission
          ) {
            this.isNoApprovalRequiredBills.set(false);
          } else {
            this.isNoApprovalRequiredBills.set(true);
          }
        }
      })
    );
  }

  alertClick() {
    this.v3DataTableService.updateV3DataTable = this.setFilterPayload('13');
  }

  // eye button — open detail side panel
  cellRendererViewEvent(event: {
    id: string;
    selectedRow: IBillRowData;
    tableId: string;
  }) {
    if (event?.selectedRow) {
      this.selectedBillId.set(event.selectedRow.action);
      this.isDetailPanelOpen.set(true);
    }
  }

  onNew() {
    const dialogRef = this.dialog.open(V4AddBillComponent, {
      ...V4AddBillComponent.dialogConfig,
      data: { mode: 'new' }
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.refreshDataTable();
          this.alertService.successAlert({
            content: 'Bill added',
            close: true,
            timeout: 2500
          });
        }
      })
    );
  }

  onEdit(selectedItem: IBillRowData) {
    const alert = this.dialog.open(V4AddBillComponent, {
      ...V4AddBillComponent.dialogConfig,
      data: { billId: selectedItem.action, mode: 'edit' }
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.refreshDataTable();
          this.alertService.successAlert({
            content: 'Bill updated',
            close: true,
            timeout: 2500
          });
        }
      })
    );
  }

  onCloneBill(selectedItem: IBillRowData) {
    const alert = this.dialog.open(V4AddBillComponent, {
      ...V4AddBillComponent.dialogConfig,
      data: { billId: selectedItem.action, mode: 'clone' }
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.refreshDataTable();
          this.alertService.successAlert({
            content: 'Bill added',
            close: true,
            timeout: 2500
          });
        }
      })
    );
  }

  onMultipleprint(ids: string[]): void {
    if (this.isPrintProcessing) {
      return;
    }
    if (!ids?.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select at least 1 Bill'
      });
      return;
    }
    this.printLoading.set(true);
    this.isPrintProcessing = true;
    this.subscriptions.push(
      this.billService
        .bulkPrint(ids)
        .pipe(
          finalize(() => {
            this.printLoading.set(false);
          })
        )
        .subscribe(
          (data) => {
            if (data?.success) {
              this.refreshDataTable();
              const iframe = document.createElement('iframe');
              iframe.srcdoc = data.data.printData;
              iframe.style.visibility = 'hidden';
              document.body.appendChild(iframe);
              iframe.addEventListener('load', () => {
                this.isPrintProcessing = false;
              });
            }
          },
          (error) => {
            if (error) {
              this.isPrintProcessing = false;
            }
          }
        )
    );
  }

  singlePrint(id: string) {
    this.isPrintProcessing = true;
    this.subscriptions.push(
      this.billService
        .printBill(id)
        .pipe(
          finalize(() => {
            this.isPrintProcessing = false;
          })
        )
        .subscribe(
          (data) => {
            if (data?.success) {
              const iframe = document.createElement('iframe');
              iframe.srcdoc = data.data.printData;
              iframe.style.visibility = 'hidden';
              document.body.appendChild(iframe);
              iframe.addEventListener('load', () => {
                this.isPrintProcessing = false;
              });
            }
          },
          (error) => {
            if (error) {
              this.isPrintProcessing = false;
            }
          }
        )
    );
  }

  vendorCredit() {
    this.dialog.open(NewVendorCreditModalComponent, {
      // open modal
      maxWidth: '700px',
      width: '93%',
      disableClose: true
    });
  }

  markVoid(selectedRows: IBillRowData[]): void {
    const itemIds: { ids: string[] } = { ids: [] };

    selectedRows.forEach((val: IBillRowData) => {
      itemIds.ids.push(val.action);
    });

    if (selectedRows.length === 0) {
      const alertData = {
        content: 'Please select a bill to void.'
      };

      this.alertService.warningAlert(alertData);
    } else {
      const alertData = {
        content: 'Are you sure you want to void these bills?'
      };
      const alert = this.alertService.confirmAlert(alertData);
      this.subscriptions.push(
        alert.afterClosed().subscribe((result) => {
          if (result) this.voidprint(itemIds);
        })
      );
    }
  }

  voidprint(itemIds: { ids: string[] }) {
    this.voidLoading.set(true);
    this.subscriptions.push(
      this.billService
        .multiVoid(itemIds)
        .pipe(
          finalize(() => {
            this.voidLoading.set(false);
          })
        )
        .subscribe((res: { message: string; success: boolean }) => {
          if (res.success === true) {
            const alertData = {
              content: 'Bill voided',
              close: true,
              timeout: 2500
            };
            this.refreshDataTable();
            this.alertService.successAlert(alertData);
          }
        })
    );
  }

  onMultipleDelete(selectedRows: IBillRowData[]): void {
    const itemIds: { ids: string[] } = { ids: [] };

    selectedRows.forEach((val: IBillRowData) => {
      itemIds.ids.push(val.action);
    });

    if (selectedRows.length === 0) {
      const alertData = {
        content: 'Please select a bill to delete.'
      };
      this.alertService.warningAlert(alertData);
    } else {
      const alertData = {
        content: 'Are you sure you want to delete these bills?'
      };
      const alert = this.alertService.confirmAlert(alertData);
      this.subscriptions.push(
        alert.afterClosed().subscribe((result) => {
          if (result) this.multipeDelete(itemIds);
        })
      );
    }
  }

  multipeDelete(itemIds: { ids: string[] }) {
    this.deleteLoading.set(true);
    this.subscriptions.push(
      this.billService
        .multiDelete(itemIds)
        .pipe(
          finalize(() => {
            this.deleteLoading.set(false);
          })
        )
        .subscribe((res: { message: string; success: boolean }) => {
          if (res.success === true) {
            const alertData = {
              title: 'Success',
              content: 'Bill deleted.',
              close: true,
              timeout: 2500
            };
            this.refreshDataTable();
            this.alertService.successAlert(alertData);
            this.isPendingStatus();
          }
        })
    );
  }

  openImports() {
    const dialogRef = this.dialog.open(V4ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        type: 'bills'
      }
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) this.refreshDataTable();
      })
    );
  }

  payBills(bills: string[]): void {
    this.billService.billId.set(bills);
    // Multiple distinct payees -> go to the Bulk Payment Center, which fetches
    // the grouped bill data and prefills one row per payee (bank account + check
    // defaults). A single payee keeps the existing single send modal.
    if (this.payees().length > 1) {
      this.router.navigate(['/v4/manage/bulk-payments/index'], {
        queryParams: {
          tab: 'create',
          method: 'manual-entry',
          billId: bills.join(',')
        }
      });
      return;
    }
    this.router.navigate([`/v4/manage/payments/pay/bankaccount/check`], {
      state: { backUrl: this.router.url },
      queryParams: { billId: bills }
    });
  }

  private onHeaderPay(selectedRows: IBillRowData[], ids: string[]): void {
    if (selectedRows.length === 1) {
      this.paySingleBill(selectedRows[0]);
      return;
    }
    const savedRows = selectedRows.filter(
      (r) => r.bill_status?.toString() === '16'
    );
    const unsavedRows = selectedRows.filter(
      (r) => r.bill_status?.toString() !== '16'
    );
    if (savedRows.length && unsavedRows.length) {
      this.confirmPaySavedOnly(savedRows);
      return;
    }
    if (savedRows.length) {
      this.paySavedPayments(savedRows);
      return;
    }
    this.payBills(ids);
  }

  private paySingleBill(row: IBillRowData): void {
    if (row.bill_status?.toString() === '16' && row.zil_payment_uu_id) {
      this.billService.billId.set([row.action]);
      this.router.navigate([`/v4/manage/payments/pay/bankaccount/check`], {
        state: { backUrl: this.router.url },
        queryParams: { billId:  row.zil_payment_uu_id }
      });
    } else {
      this.payees.set([row.payee_id]);
      this.payBills([row.action]);
    }
  }

  private paySavedPayments(savedRows: IBillRowData[]): void {
    if (savedRows.length === 1) {
      this.paySingleBill(savedRows[0]);
      return;
    }
    const uuidList = savedRows
      .map((r) => r.zil_payment_uu_id)
      .filter((id): id is string => !!id);
    this.v4BulkPaymentService.openBulkPaymentModals(uuidList);
  }

  private confirmPaySavedOnly(savedRows: IBillRowData[]): void {
    const ref = this.alertService.confirmAlert({
      title: 'Saved & unsaved payments selected',
      content:
        "Saved and unsaved payments can't be processed together, unsaved bills will be skipped. Do you want to continue with the saved payments?",
      doneMsg: 'Pay Saved Payments',
      cancelMsg: 'Cancel'
    });
    this.subscriptions.push(
      ref.afterClosed().subscribe((result) => {
        if (result) this.paySavedPayments(savedRows);
      })
    );
  }

  markAsPaid(selectedItem: IBillRowData) {
    const itemId = selectedItem.action;

    const alertData = {
      content: 'Are you sure you want to mark this bill as Paid?'
    };
    const alert = this.alertService.confirmAlert(alertData);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) this.markPaid(itemId);
      })
    );
  }

  markPaid(itemId: string) {
    this.subscriptions.push(
      this.billService
        .markAsPaid(itemId)
        .subscribe((res: { message: string; success: boolean }) => {
          if (res.success === true) {
            const alertData = {
              title: 'Success',
              content: 'Marked as paid',
              close: true,
              timeout: 2500
            };
            this.refreshDataTable();
            this.alertService.successAlert(alertData);
          }
        })
    );
  }

  onVoid(selectedItem: IBillRowData) {
    const itemId = selectedItem.action;
    const alertData = {
      content: 'Are you sure you want to void this bill?'
    };
    const alert = this.alertService.confirmAlert(alertData);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) this.makeVoid(itemId);
      })
    );
  }

  makeVoid(itemId: string) {
    this.subscriptions.push(
      this.billService
        .voidBill(itemId)
        .subscribe((res: { message: string; success: boolean }) => {
          if (res.success === true) {
            const alertData = {
              title: 'Success',
              content: 'Bill voided.',
              close: true,
              timeout: 2500
            };
            this.refreshDataTable();
            this.alertService.successAlert(alertData);
            // const gridApi: GridApi = this.dataTableService.gridOptionApi;
            // Set cell value without refreshing data table
            // gridApi?.getRowNode(index)?.setDataValue('bill_status', '3'); // (Column Feild, status)
          }
        })
    );
  }

  onUnVoid(selectedItem: IBillRowData) {
    const itemId = selectedItem.action;
    const alertData = {
      content: 'Are you sure you want to unvoid this bill?'
    };
    const alert = this.alertService.confirmAlert(alertData);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) this.makeUnVoid(itemId);
      })
    );
  }

  makeUnVoid(itemId: string) {
    this.subscriptions.push(
      this.billService
        .UnvoidBill(itemId)
        .subscribe((res: { message: string; success: boolean }) => {
          if (res.success) {
            const alertData = {
              title: 'Success',
              content: 'Bill Unvoided',
              close: true,
              timeout: 2500
            };
            this.refreshDataTable();
            this.alertService.successAlert(alertData);
          }
        })
    );
  }

  onAddcomment(selectedRow: IBillRowData) {
    const alert = this.dialog.open(V4AddCommentCommonModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: { id: selectedRow.action, type: 'bills', enableDelete: true },
      panelClass: 'paddingless-modal-rounded'
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result?.isRefresh) {
          this.refreshDataTable();
        }
      })
    );
  }

  onAddattachment(selectedRow: IBillRowData) {
    const alert = this.dialog.open(V4AddAttachmentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id: selectedRow.action,
        type: 'bills'
      }
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result?.isRefresh) {
          this.refreshDataTable();
        }
        // this.dataTableService.gridOptionApi?.refreshCells({ columns: ['bill_status'], force: true });
      })
    );
  }

  // ON ROW SELECTED
  mangageRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: RowNode<IBillRowData>[]) => {
        const payees = new Set<string>();
        res.forEach((row: RowNode<IBillRowData>) => {
          payees.add(row.data?.payee_id || '');
        });
        this.payees.set(Array.from(payees));
        const payAble = this.billIsPayAble(
          res.map((row) => row.data as IBillRowData)
        );
        if (!payAble) {
          this.voidDisable.set(true);
          this.payDisable.set(true);
        } else {
          this.voidDisable.set(false);
          this.payDisable.set(false);
        }
      });
  }

  // For Approval Required Status
  onMultiApprove(ids: string[]) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to approve these bill(s)?'
    });
    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.billService.multiApprove(ids).subscribe((data) => {
              if (data?.success) {
                this.refreshDataTable();
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Bill(s) Approved',
                  close: true,
                  timeout: 2000
                });
                this.isPendingStatus();
              }
            })
          );
        }
      })
    );
  }

  onMultiReject(ids: string[]) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to reject these bill(s)?'
    });
    this.subscriptions.push(
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.billService.multiReject(ids).subscribe((data) => {
              if (data?.success) {
                this.refreshDataTable();
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Bill(s) Rejected',
                  close: true,
                  timeout: 2000
                });
                this.isPendingStatus();
              }
            })
          );
        }
      })
    );
  }

  // Hide Action Buttons
  setActionButtonHide(selectedItem: IBillRowData): void {
    const billStatus = selectedItem?.bill_status;
    if (!billStatus) return;
    if (billStatus === 13) {
      if (
        this.cellRenderer.action.find(
          (e: { name: string; id: string; icon: string }) =>
            e?.id === 'RId_accept'
        )
      )
        return;
      this.cellRenderer.action.unshift(
        {
          name: 'Approve',
          id: 'RId_accept',
          icon: 'circle-check'
        },
        {
          name: 'Reject',
          id: 'RId_reject',
          icon: 'circle-x'
        }
      );
    } else {
      this.cellRenderer.action.find(
        (
          el: {
            name: string;
            id: string;
            icon: string;
          },
          index: number
          // eslint-disable-next-line array-callback-return
        ) => {
          if (el?.id === 'RId_accept')
            this.cellRenderer.action.splice(index, 2);
        }
      );
    }

    this.dataTableService.setCellRendererAction(this.cellRenderer.action);
  }

  billIsPayAble(selectedRows: IBillRowData[]): boolean {
    let payAble = true;

    const payableStatuses = this.isLoggedAsUser()
      ? [1, 7, 5, 14, 16]
      : [1, 5, 7, 13, 14, 15, 16];
    selectedRows?.forEach((ele: IBillRowData) => {
      const billStatus = parseInt(ele.bill_status.toString(), 10);
      if (!payableStatuses.includes(billStatus) || ele.isApprovedXero === 0) {
        payAble = false;
      }
    });

    return payAble;
  }

  onAuditTrial(selectedItem: IBillRowData) {
    this.dialog.open(V4ViewAuditTrailModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data: {
        heading: 'Bill',
        slug: 'bills',
        id: selectedItem.action
      },
      panelClass: 'paddingless-modal-rounded'
    });
  }

  onDelete(selectedItem: IBillRowData) {
    const itemId = selectedItem.action;

    const alertData = {
      content: 'Are you sure you want to delete this bill permanently?'
    };
    const alert = this.alertService.confirmAlert(alertData);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) this.deleteRow(itemId);
      })
    );
  }

  deleteRow(itemId: string) {
    this.subscriptions.push(
      this.billService.deleteBills(itemId).subscribe((res) => {
        if (res.success === true) {
          const alertData = {
            content: 'Deleted',
            close: true,
            timeout: 2500
          };
          this.refreshDataTable();
          this.alertService.successAlert(alertData);
          this.isPendingStatus();
        }
      })
    );
  }

  goToVendorCredit() {
    this.router.navigate(['manage/vendor-credit/index']);
  }

  //= =====>For Template Responsive
  mobileHeaderRightBtn() {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.toggle('mobile-head-rightshow');

    const ocwOverlay: HTMLElement | null = document.querySelector(
      '.ocw-overlay-righthead'
    );
    if (ocwOverlay) {
      ocwOverlay.style.display = 'block';
    }
  }

  ocwOverlayRightHeadClick(): void {
    const ocwOverlay: HTMLElement | null = document.querySelector(
      '.ocw-overlay-righthead'
    );
    if (ocwOverlay) ocwOverlay.style.display = 'none';

    const actionBtn = document.querySelector('#mobile-header-right-btn');
    actionBtn?.classList.remove('mobile-head-rightshow');

    const allShowBtn = document.getElementById('alertIconline');
    allShowBtn?.classList.toggle('allalertshow');
  }

  onEmailToBill() {
    this.dialog.open(EmailToBillModalComponent, {
      maxWidth: '550px',
      width: '93%',
      disableClose: true,
      data: {
        mappedEmailToBill: this.mappedEmailToBill(),
        isEmailToBillMapped: this.isEmailToBillMapped()
      }
    });
  }

  getOrganizations() {
    this.subscriptions.push(
      this.integrationService.getBillOrgs().subscribe((data) => {
        if (data?.success && data.data?.length) {
          this.showBillDotComImportBtn = true;
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
  }) {
    this.subscriptions.push(
      this.v3DataTableService
        .exportTable(filterModel, 'bills')
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
   * method for getting row selection event
   */
  getRowSelectionData() {
    this.subscriptions.push(
      this.v3DataTableService.v3RowSelectionData$.subscribe({
        next: (res) => {
          this.selectedRowData = res;
          this.getCheckStatus();
        }
      })
    );
  }

  /**
   * Determines the approval status of selected rows and sets the 'isApprovalRequired' flag accordingly.
   */
  getCheckStatus() {
    if (this.selectedRowData.length) {
      this.isApprovalRequired.set(false);
      this.selectedRowData?.forEach((row) => {
        if (row.data?.bill_status !== '13') {
          this.isApprovalRequired.set(true);
        }
      });
    } else {
      this.isApprovalRequired.set(true);
    }
  }

  /**
   * Retrieves the check status and sets the cellRendererCheckStatus.
   * If the check status is present in local storage, it is used.
   * Otherwise, it fetches the check status from API.
   */
  getCheckDescription(): void {
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.dataTableService.selectedCellValueSignal.set(undefined);
  }
}

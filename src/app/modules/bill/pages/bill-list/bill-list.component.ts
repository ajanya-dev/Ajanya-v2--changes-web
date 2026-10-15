import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ICellRendererParams,
  RowNode,
} from '@ag-grid-community/core';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { NewVendorCreditModalComponent } from 'src/app/shared/modal/vendor-credit-modal/new-vendor-credit-modal/new-vendor-credit-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewAuditTrailModalComponent } from 'src/app/shared/modal/common-modal/view-audit-trail-modal/view-audit-trail-modal.component';
import { ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/thirdparty-imports/thirdparty-import-main-modal/thirdparty-import-main-modal.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { ComponentType } from '@angular/cdk/portal';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { BillAttachmentCommentComponent } from './billAttachmentComment';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { AddBillModalComponent } from '../../modals/add-bill-modal/add-bill-modal.component';
import { IBillRowData } from '../../model/Bill';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { EmailToBillModalComponent } from '../../modals/email-to-bill-modal/email-to-bill-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V35PaymentTableActionComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/v35-payment-table-action/v35-payment-table-action.component';
import { BillPaymentService } from '../../services/bill-payment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class BillListComponent implements OnInit, OnDestroy {
  /* Injectors */
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private billService = inject(BillService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private integrationService = inject(IntegrationService);
  private v3DataTableService = inject(V3DataTableService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);
  private billPaymentService = inject(BillPaymentService);
  private destroyRef = inject(DestroyRef);

  public tableId = DTTableId.bill; // Data Table Id
  printLoading = signal(false);
  deleteLoading = signal(false);
  voidLoading = signal(false);
  payDisable = signal(false);
  voidDisable = signal(false);
  pendingBillsSignal = signal(0);
  isApprovalRequired = signal(true);
  isNoApprovalRequiredBills = signal(true);
  isLoggedAsUser = signal(false);
  isEmailToBillMapped = signal(true);
  mappedEmailToBill = signal('');
  billAutomationEnabled = signal(false);
  isBillAutomationCallDone = signal(false);

  payees = signal<string[]>([]);

  selectedPanelButton = signal('id_all');
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
    panelButtons: [
      {
        name: 'All Bills',
        id: 'id_all'
      },
      {
        name: 'Paid Bills',
        id: 'id_paid'
      },
      {
        name: 'Bills To Pay',
        id: 'id_topay'
      },
      {
        name: 'Voided Bills',
        id: 'id_stvoid'
      }
    ],

    buttons: [
      {
        text: 'New',
        id: 'id_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list'
      },
      {
        text: 'Print',
        id: 'multiplePrint',
        isAddIcon: true,
        icon: ['far', 'print'],
        type: 'list',
        loading: this.printLoading(),
        disabled: this.voidDisable()
      },
      {
        text: 'Void',
        id: 'id_void',
        isAddIcon: true,
        icon: ['far', 'ban'],
        type: 'list',
        backGroundInput: 'var(--common-yellow-color)',
        loading: this.voidLoading(),
        disabled: this.voidDisable()
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        loading: this.deleteLoading()
      },
      {
        text: 'Pay',
        id: 'id_pay',
        icon: ['far', 'money-bill-wave'],
        isAddIcon: true,
        type: 'list',
        disabled: this.payDisable()
      },
      {
        text: 'Vendor Credit',
        id: 'id_vendor_credit',
        icon: ['fas', 'credit-card'],
        isAddIcon: true,
        type: 'list',
        backGroundInput: 'var(--common-tertiary-green-color)'
      },
      {
        text: 'Email to Bill',
        id: 'id_email_to_bill',
        icon: ['fas', 'envelope-open-text'],
        isAddIcon: true,
        type: 'list',
        toolTip: 'Turn email invoices into payable bills instantly',
        backGroundInput: 'var(--common-violet-color)',
        customClasses: 'font-extralight p-0',
        isHidden: !this.billAutomationEnabled(),
        disabled: !this.isBillAutomationCallDone()
      },
      {
        id: 'id_approve',
        roundIcon: ['fas', 'a'],
        customClasses:
          'bg-common-secondary-green-color text-common-green-color',
        toolTip: 'Accept selected item',
        disabled: this.isApprovalRequired(),
        isHidden: this.isNoApprovalRequiredBills()
      },
      {
        id: 'id_reject',
        roundIcon: ['fas', 'r'],
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
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
          { value: 1, name: 'To pay' },
          { value: 2, name: 'Paid' },
          { value: 3, name: 'Void' },
          { value: 4, name: 'Received' },
          { value: 6, name: 'Rejected' },
          { value: 7, name: 'Imported' },
          { value: 13, name: 'Approval required' }
        ]
      },
      {
        id: 'status',
        values: [
          { value: '0', name: 'PENDING' },
          { value: '1', name: 'PROCESSING' },
          { value: '2', name: 'COMPLETED' },
          { value: '3', name: 'CANCELED' },
          { value: '4', name: 'FAILED' },
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

  cellRenderer: { action: { name: string; id: string; icon: string }[] } = {
    action: [
      {
        name: 'Print',
        id: 'id_printRow',
        icon: 'fa-solid fa-print'
      },
      {
        name: 'Mark As Paid',
        id: 'id_markpaid',
        icon: 'fa-solid fa-star'
      },
      {
        name: 'Pay',
        id: 'id_paay',
        icon: 'fa-solid fa-money-check-dollar'
      },
      {
        name: 'Void',
        id: 'id_vooid',
        icon: 'fa-solid fa-xmark'
      },
      {
        name: 'Add Comment',
        id: 'id_comment',
        icon: 'fa-solid fa-comments'
      },
      {
        name: 'Add Attachment',
        id: 'id_attachment',
        icon: 'fa-solid fa-paperclip'
      },
      {
        name: 'Audit Trail',
        id: 'id_audittrail',
        icon: 'far fa-history'
      },
      {
        name: 'Edit',
        id: 'id_edit',
        icon: 'fa-solid fa-pen-to-square'
      },
      {
        name: 'Clone Bill',
        id: 'id_clonbill',
        icon: 'fa-solid fa-clone'
      },
      {
        name: 'Delete',
        id: 'id_Delete',
        icon: 'fa-solid fa-trash'
      }
    ]
  };

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    v3PaymentTableActionComponent: V35PaymentTableActionComponent,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    addAttachComment: BillAttachmentCommentComponent,
    V3payeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    V3PayeeNameComponent,
    V3DTCommonFilterComponent
  };

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  actionField = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'bill_status',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,

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
    maxWidth: 120,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    },
    cellClass: 'flex justify-end pr-3 text-end mt-0.5'
  };

  colDefInvoiceNo = {
    headerName: 'Invoice No',
    field: 'inv_no',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter'
  };

  colDefInvDate = {
    headerName: 'Invoice Date',
    field: 'inv_date',
    suppressFloatingFilterButton: true,
    minWidth: 120,
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
    minWidth: 120,
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
    minWidth: 80,
    width: 100,
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
    maxWidth: 400,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefCreatedBy = {
    headerName: 'Created by',
    field: 'name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
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
    minWidth: 120,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.created_at
  };


  colDefPaymentStatus = {
    headerName: 'Payment Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'SelectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      table: 'bill_table'
    },
    cellRenderer: 'v3PaymentTableActionComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: (
      params: ICellRendererParams
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
        tableType: 'bill_table',
        checkStatus: { value: checkStatus, color: checkColor }
      };
    }
  };


  columnDefs = [
    this.colDefId,
    this.colDefPayee,
    this.colDefBillTo,
    this.colDefAmount,
    this.colDefInvoiceNo,
    this.colDefInvDate,
    this.colDefStatus,
    this.colDefPaymentStatus,
    this.colDefMemo,
    this.colDefDueDate,
    this.colDefCreatedBy,
    this.colDefCreatedTime,
    this.actionField
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
      id: 'memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
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
      id: 'action',
      name: 'Action',
      isDisabled: true,
      colDef: this.actionField,
      isChecked: true
    }
  ];

  // ===============> constructor end <==================//

  ngOnInit(): void {
    this.getCheckDescription();
    this.mangageRowSelectionData();
    this.v3DataTableService.resetV3DataTablePayload();
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
  }

  trackUserLoginStatus() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        this.billAutomationEnabled.set((res as unknown as IHeaderData).enabledPlugins.includes('bill-automation'));
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
        this.onHeaderPay(selectedRows, ids);
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
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('');
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
        icon: 'fa-solid fa-xmark'
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
        icon: 'fa-solid fa-xmark'
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
        this.payBills([selectedItem.action]);
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
          
          this.pendingBillsSignal.set(res.data.isApprovalPendingBill);
          if(this.billAutomationEnabled()) {
            this.isEmailToBillMapped.set(res.data.isEmailMapped );
            this.mappedEmailToBill.set(res.data.mappedEmail);
            this.isBillAutomationCallDone.set(true);
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

  // eye button
  cellRendererViewEvent(event: {
    id: string;
    selectedRow: IBillRowData;
    tableId: string;
  }) {
    if (event?.selectedRow) {
      this.router.navigate([`../view/${event.selectedRow.action}`], {
        relativeTo: this.activatedRoute
      });
    }
  }

  onNew() {
    const dialogRef = this.dialog.open(AddBillModalComponent, {
      // open modal
      maxWidth: '725px',
      maxHeight: '95%',
      width: '93%',
      disableClose: true,
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
    const alert = this.dialog.open(AddBillModalComponent, {
      // open modal
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
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
    const alert = this.dialog.open(AddBillModalComponent, {
      // open modal
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
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
    const dialogRef = this.dialog.open(ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
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
    this.billService.billId.set(bills);;
    let billIds = '';
    bills.forEach((e, i) => {
      billIds += i === 0 ? e : `,${e}`;
    });
    if(this.payees().length > 1) {
      this.router.navigate([`/manage/group-payments/main`], {
        queryParams: { billId: billIds }
      });
    }else{
    this.router.navigate([`/manage/payments/main/pay/bankaccount/check`], {
      state: { backUrl: this.router.url },
      queryParams: { billId: billIds }
    });
  }
  }

  onHeaderPay(selectedRows: IBillRowData[], ids: string[]): void {
    if (!ids.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select bills for payment'
      });
      return;
    }
    if (!this.billIsPayAble(selectedRows)) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please approve the bill to pay'
      });
      return;
    }

    // Flow 1: a single bill behaves exactly like the in-row Pay button.
    if (selectedRows.length === 1) {
      this.billPaymentService.paySingleBill(selectedRows[0]);
      return;
    }

    const savedRows = selectedRows.filter((row) =>
      this.billPaymentService.isSavedPayment(row.bill_status)
    );
    const unsavedRows = selectedRows.filter(
      (row) => !this.billPaymentService.isSavedPayment(row.bill_status)
    );

    // Flow 4: mixed selection -> confirm, then pay the saved payments and skip
    // the unsaved bills.
    if (savedRows.length && unsavedRows.length) {
      this.confirmPaySavedOnly(savedRows);
      return;
    }

    // Flow 3: multiple saved payments -> bulk payment screen.
    if (savedRows.length) {
      this.paySavedPayments(savedRows);
      return;
    }

    // Flow 2: multiple unsaved bills -> existing bulk pay flow.
    this.payBills(ids);
  }

  /**
   * Confirms a mixed selection, then pays the saved payments and skips the
   * unsaved bills.
   */
  private confirmPaySavedOnly(
    savedRows: IBillRowData[]
  ): void {
    const alert = this.alertService.confirmAlert({
      title: 'Saved & unsaved payments selected',
      content: `Saved and unsaved payments cant be processed together, unsaved bills will be skipped. Do you want to continue with the saved payments?`,
      doneMsg: 'Pay Saved Payments',
      cancelMsg: 'Cancel'
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.paySavedPayments(savedRows);
        }
      })
    );
  }

  /**
   * Pays saved payments (bill_status 16): a single one follows the in-row Pay
   * flow, several go to the bulk payment screen.
   */
  private paySavedPayments(savedRows: IBillRowData[]): void {
    if (savedRows.length === 1) {
      this.billPaymentService.paySingleBill(savedRows[0]);
      return;
    }
    const uuidList = savedRows
      .map((row) => row.zil_payment_uu_id)
      .filter((uuid): uuid is string => !!uuid);
    this.billPaymentService.payBulkSavedPayments(uuidList);
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
    const alert = this.dialog.open(AddCommentsModalComponent, {
      // open modal
      maxWidth: '700px',
      width: '93%',
      data: { id: selectedRow.action, type: 'bills', enableDelete: true }
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result.refresh) {
          this.refreshDataTable();
        }
      })
    );
  }

  onAddattachment(selectedRow: IBillRowData) {
    const alert = this.dialog.open(AddAttachmentModalComponent, {
      // open modal
      maxWidth: '700px',
      width: '93%',
      data: {
        id: selectedRow.action,
        type: 'bills'
      }
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result.refresh) {
          this.refreshDataTable();
        }
        // this.dataTableService.gridOptionApi?.refreshCells({ columns: ['bill_status'], force: true });
      })
    );
  }


  mangageRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((res:RowNode<IBillRowData>[]) => {
      const payees=new Set<string>();
      res.forEach((row:RowNode<IBillRowData>) => {
        payees.add(row.data?.payee_id || '');
      });
      this.payees.set(Array.from(payees));
      const payAble = this.billIsPayAble(res.map((row) => row.data as IBillRowData));
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
          icon: 'fa fa-check'
        },
        {
          name: 'Reject',
          id: 'RId_reject',
          icon: 'fa-solid fa-xmark'
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
    let payee: string;
    selectedRows?.forEach((ele: IBillRowData) => {
      if (payee === undefined) {
        payee = ele.payee_id;
      }
      const billStatus = parseInt(ele.bill_status.toString(), 10);
      if (
        !payableStatuses.includes(billStatus) ||
        ele.isApprovedXero === 0
      ) {
        payAble = false;
      }
    });

    return payAble;
  }

  onAuditTrial(selectedItem: IBillRowData) {
    this.dialog.open(ViewAuditTrailModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data: {
        heading: 'Bill',
        slug: 'bills',
        id: selectedItem.action
      }
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
        isEmailToBillMapped: this.isEmailToBillMapped(),
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

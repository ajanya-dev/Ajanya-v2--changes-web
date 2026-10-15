import { V3CreatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-created-at/v3-created-at.component';
import { Subscription } from 'rxjs/internal/Subscription';
import { CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
  OnDestroy,
  HostListener,
  Output,
  EventEmitter,
  signal
} from '@angular/core';
import {
  ICoulmnDefFields,
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  ColDef,
  ColGroupDef,
  GridApi,
  ICellRendererParams,
  IRowNode,
  IsRowSelectable,
  RowNode,
  ValueGetterParams
} from '@ag-grid-community/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { MatDialog } from '@angular/material/dialog';
import { ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/thirdparty-imports/thirdparty-import-main-modal/thirdparty-import-main-modal.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { catchError, finalize, mergeMap, tap } from 'rxjs/operators';
import { EMPTY, from, of, throwError } from 'rxjs';
import { CustomCheckExportErrorAlertComponent } from 'src/app/modules/check/components/custom-check-export-error-alert/custom-check-export-error-alert.component';
import { IFailedAlert, ISuccessAlert } from 'src/app/models/alert';
import { CheckService } from 'src/app/shared/service/check/check.service';
import {
  IBankSource,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CheckEmailModalComponent } from 'src/app/modules/check/modal/check-email-modal/check-email-modal.component';
import {
  ICheckData,
  ICheckStatus,
  IMailShippingCalculations,
  IMailShippingPayeeDetails,
  IShippingCostCalculation,
  IShippingType
} from 'src/app/modules/check/model/check';
import { IApiRes } from 'src/app/models/api';
import { CheckMailModalComponent } from 'src/app/modules/check/modal/mail-modals/check-mail-modal/check-mail-modal.component';
import { DirectDepositComponent } from 'src/app/modules/check/modal/direct-deposit/direct-deposit.component';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { V3DescriptionComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-description/v3-description.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PendingCheckApprovalsComponent } from 'src/app/modules/user-management/modals/pending-check-approvals/pending-check-approvals.component';
import { PendingPaymentApprovalsComponent } from 'src/app/modules/user-management/modals/pending-payment-approvals/pending-payment-approvals.component';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V35PaymentTableActionComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/v35-payment-table-action/v35-payment-table-action.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V35PaymentSourceDropdownComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/v35-payment-source-dropdown/v35-payment-source-dropdown.component';
import { IApprovalRequest } from 'src/app/models/user';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { CdkDragEnd, Point, CdkDrag } from '@angular/cdk/drag-drop';
import { ComponentType } from '@angular/cdk/portal';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import {
  DateRange,
  DefaultMatCalendarRangeStrategy,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatDatepickerModule,
  MatRangeDateSelectionModel
} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import {
  faEnvelope,
  faEnvelopes,
  faUpToLine,
  faBan,
  faTrash,
  faPenToSquare,
  faFileMagnifyingGlass
} from '@fortawesome/pro-solid-svg-icons';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { VerifySignatureModalComponent } from 'src/app/modules/check/modal/mail-modals/verify-signature-modal/verify-signature-modal.component';
import { DtEditFieldComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-edit-field/dt-edit-field.component';
import { V3CreatedByComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-created-by/v3-created-by.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { CheckRecurringComponent } from 'src/app/modules/check-recurring/pages/check-recurring/check-recurring.component';
import { ActionItems } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-actions';
import { SubscriptionWarningModalComponent } from 'src/app/modules/subscription/modals/subscription-warning-modal/subscription-warning-modal.component';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from 'src/environments/environment';
import { V3PaymentTypeComponent } from '../../../../../shared/v3/dt-cellrenderers/v3-payment-type/v3-payment-type.component';
import { V3DataTableSelectBoxComponent } from '../../../../../shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtSearchBoxComponent } from '../../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtActionComponent } from '../../../../data-table/components/dt-action/dt-action.component';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { ICommonTransactionTableData } from '../../../../../models/v3-common';
import { V3PaymentsTableService } from './v3-payments-table.service';
import { V3BulkPaymentService } from '../../../../v3-bulk-payment/services/v3-bulk-payment.service';
import { CheckListComponent } from '../../../../check/pages/check-list/check-list.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { ScrollListenerDirective } from '../../../../../directive/scroll-listner.directive';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { QbTransactionsTableComponent } from '../qb-transactions-table/qb-transactions-table.component';
import { NetsuiteFailedPaymentsTableComponent } from '../netsuite-failed-payments-table/netsuite-failed-payments-table.component';
import { SourceFilterCellRendererComponent } from '../source-filter-cell-renderer/source-filter-cell-renderer.component';

interface IFilterItem {
  id: number;
  filterName: string;
}
@Component({
  selector: 'app-v3-payments-table',
  templateUrl: './v3-payments-table.component.html',
  styleUrls: ['./v3-payments-table.component.scss'],
  /**
   * To create a separate instance of 'V3PaymentsTableService' for 'v3-payments-table-component'
   */
  providers: [
    V3PaymentsTableService,
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: DefaultMatCalendarRangeStrategy
    },
    DefaultMatCalendarRangeStrategy,
    MatRangeDateSelectionModel
  ],
  standalone: true,
  imports: [
    MatTooltip,
    CommonModule,
    CommonButtonV35Component,
    RouterLink,
    MatMenuTrigger,
    NgClass,
    MatMenu,
    FaIconComponent,
    CdkDrag,
    NgTemplateOutlet,
    ScrollListenerDirective,
    DemoVideoComponent,
    V3DataTableComponent,
    CheckListComponent,
    WhiteLabelDirective,
    CheckRecurringComponent,
    QbTransactionsTableComponent,
    NetsuiteFailedPaymentsTableComponent,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class V3PaymentsTableComponent implements OnInit, OnDestroy {
  /* Injectors */
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private v3BulkPaymentService = inject(V3BulkPaymentService);
  public v3PaymentsTableService = inject(V3PaymentsTableService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private checkService = inject(CheckService);
  private userProfileService = inject(UserProfileService);
  public paymentService = inject(PaymentsService);
  private localStorageService = inject(LocalStorageService);
  private userService = inject(UserManagementService);
  private headerService = inject(HeaderService);
  private route = inject(ActivatedRoute);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private layoutService = inject(LayoutService);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private commonOnInitService = inject(CommonOnInitService);
  private readonly selectionModel = inject(MatRangeDateSelectionModel<Date>);
  private readonly selectionStrategy = inject(DefaultMatCalendarRangeStrategy<Date>);
  public columnDefs?: (ColDef | ColGroupDef)[];
  public defaultColumnFields?: IDtColumnFields[];

  /* Variables */
  @Input() public commonTransactionTableType: string | undefined = undefined;
  @Input() public isPaymentsButtonShown = true;
  @Input() public dynamicHeaderButtonText = '';
  @Input() public deselectedColumns: string[] = this.defaultDeselectedColumns();
  @Input() public dynamicHeaderText = 'Payments';
  @Input() public dynamicHeaderButtonRoute = '';
  @Input() public isNewPaymenttButtonShown = true;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  faBan = faBan;

  isPaymentsFilterEnabled = true;
  isPluginDataLoaded = false;
  isLoading: boolean;
  selectedRowData: RowNode<ICommonTransactionTableData>[];
  isFloatingButtonPopupShow = false;
  areDifferentPaymentTypesChosen = false;
  err_msg: string;
  cellRendererCheckStatus?: Record<string, ICheckStatus>;
  fieldsShownByDefault: string[] = [
    'status',
    'view',
    'amount',
    'payee_name',
    'id'
  ];

  selectedRowCount: number = 0;
  isZilPaymentLists: boolean = false;
  isChaseAccountPending: boolean = false;

  /**
   * @description To set if only checks are selected or not.
   */
  isCheckSelected = false;
  isWalletCheckPrintSelected = false;
  transferId: string | undefined = '';
  subscriptions: Subscription[] = [];
  isQBDPushBackEnabled = false;
  isPushBackEnable: boolean;
  isQucikBookConnected = 0;
  screenHeight: number;
  screenWidth: number;
  isQucikBookDesktopConnected = 0;
  reprintRequestedTotalCount: number;
  isFreshBooksConnected = false;
  isFreshBooksPushBackEnabled = false;
  checkPrintType: number;
  checkdata: ICheckData = {};
  isMaped = false;
  isPendingChecks: number;
  pendingApprovalCount: number;
  pendingApprovals: IApprovalRequest;
  env = environment;
  bulkPaymentNotification = {
    notificationText: '',
    tooltip: '',
    extendedText: ''
  };

  isQBOnlineLoading = signal(false);
  isQBDesktopLoading = signal(false);
  isNetsuitExportLoading = signal(false);
  isFreshBooksExportLoading = signal(false);
  isAcceptLoading = signal(false);
  isRejectLoading = signal(false);
  isVoidable = signal(true);
  isEditable = signal(false);
  isBulkDeletable = signal(true);
  isVerifiedChecksPluginEnabled = signal(false);
  isEnterpriseMafPluginEnabled = signal(false);
  isApprovalRequiredPayment = signal(false);
  isWalletCheckPrintSelectedForBulkPayment = signal(false);
  isPrintPreviewChecksVisible = signal(false);
  isPrintPreviewChecksLoading = signal(false);
  isImportPaymentsLoading = signal(false);
  importPaymentsDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  isParentCompany = signal(false);
  isReprintRequestCheks = signal(false);
  isClientUser = signal(false);

  /**
   *@description Loaders for print, email and mail options when checks are selected.
   */
  checkOptionsLoaders = {
    printLoading: false,
    sendLoading: false,
    DDLoading: false
  };

  userEmailAndPhoneVerified = false;
  faCircleInfo = faCircleInfo;

  isNetSuiteushBackEnabled = false;
  isNetSuiteConnected = false;
  faExport = faUpToLine;
  faEnvelope = faEnvelope;
  faEnvelopes = faEnvelopes;
  faTrash = faTrash;
  faEdit = faPenToSquare;
  faFileMagnifyGlass = faFileMagnifyingGlass;

  isRowSelectable: IsRowSelectable = (node: IRowNode) => {
    const { data } = node;
    if (data?.status === 'APPROVAL_REQUIRED') {
      return true;
    }
    if (data?.transfer?.status === 807 || data?.transfer?.status === 507) {
      return false;
    }
    if (data?.transfer_type_code === 'check') {
      if (data?.transfer_mode === 'ACH' && data?.transfer_type === 'CHECK') {
        return false;
      }
      if (
        data?.source?.source === 'WALLET' &&
        (data?.status === 'CANCELED' || data?.cheque_status === 807)
      ) {
        return false;
      }
      if (
        data?.source?.source === 'WALLET' &&
        data?.transfer_type === 'CHECK' &&
        data?.status === 'COMPLETED'
      ) {
        return false;
      }
      return (
        ((data?.transfer_mode === 'MAIL CHECK' ||
          data?.transfer_mode === 'EMAIL CHECK') &&
          data.status === 'PROCESSING') ||
        data.status !== 'PROCESSING'
      );
    }
    /* `APPROVED` is a payable state just like `PENDING` (the payment cleared the
    approval policy but has not been processed yet), so it stays selectable. */
    return data?.status === 'PENDING' || data?.status === 'APPROVED';
  };

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

  /* AG Grid Table Number */
  tableId = DTTableId.paymentsTable;

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    searchBoxComponent: DtSearchBoxComponent,
    v3StatusComponent: V3StatusComponent,
    v3PayeeNameComponent: V3PayeeNameComponent,
    v3PaymentTypeComponent: V3PaymentTypeComponent,
    v3UpdatedAtComponent: V3UpdatedAtComponent,
    v3PaymentSourceDropdownComponent: V35PaymentSourceDropdownComponent,
    v3ViewButtonComponent: V3ViewButtonComponent,
    v3PaymentTableActionComponent: V35PaymentTableActionComponent,
    v3PayeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    v3DescriptionComponent: V3DescriptionComponent,
    dateRangeV35Component: DataRangeV35Component,
    V3CreatedAtComponent,
    dtEditFieldComponent: DtEditFieldComponent,
    v3CreatedByComponent: V3CreatedByComponent,
    V3DTCommonFilterComponent,
    sourceFilterCellRendererComponent: SourceFilterCellRendererComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'PENDING' },
          { value: '1', name: 'PROCESSING' },
          { value: '2', name: 'COMPLETED' },
          { value: 'Paid', name: 'PAID' },
          { value: '3', name: 'CANCELED' },
          { value: '4', name: 'FAILED' },
          { value: '6', name: 'APPROVAL REQUIRED' },
          { value: '7', name: 'APPROVED' },
          { value: '8', name: 'REJECTED' },
          { value: '9', name: 'VERIFICATION REQUIRED' },
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
          /* Temporarily Disabled */
          // { value: '5', name: 'International Payment' },
          { value: '6', name: 'Wire' },
          { value: '7', name: 'Virtual Card' },
          { value: '8', name: 'Mail' },
          { value: '10', name: 'Payment Link' },
          { value: '12', name: 'RTP' },
          { value: '13', name: 'International Payment' },
          { value: '14', name: 'Gift Card' }
        ]
      },
      {
        id: 'source_type',
        values: [
          { value: 'WALLET', name: 'WALLET' },
          { value: 'BANK', name: 'BANK' },
          { value: 'CARD', name: 'CARD' }
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
          { value: '11', name: 'Refunded' },
          { value: '50', name: 'Schedule' },
          { value: '807', name: 'Mailed & Voided' },
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
          { value: 'not-exported', name: 'Not Exported' },
          { value: '1002', name: 'Check Cleared' },
          { value: '509', name: 'Email Scheduled' },
          { value: '401', name: 'DD/Scheduled' }
        ]
      },
      {
        id: 'payee_default_payment_method',
        values: [
          { value: '1', name: 'Printable Check' },
          { value: '2', name: 'Mail Check by USPS' },
          { value: '3', name: 'Direct Deposit' },
          { value: '4', name: 'Email Check' }
        ]
      },
      {
        id: 'custom_field_position',
        values: [
          { value: '1', name: 'Dealer' },
          { value: '2', name: 'Manager' },
          { value: '3', name: 'Advisor' },
          { value: '4', name: 'Technician' }
        ]
      }
    ]
  };

  csnhcFloatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'PENDING' },
        ]
      },
      {
        id: 'transfer_mode',
        values: [
          { value: '0', name: 'Check' },
          { value: '2', name: 'Print' },
        ]
      },
      {
        id: 'source_type',
        values: [
          { value: 'BANK', name: 'BANK' },
        ]
      },
      {
        id: 'cheques.cheque_status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Printed' },
          { value: '2', name: 'Void' },
          { value: '4', name: 'Printing' },
          { value: '622', name: 'Reprint Requested' }
        ]
      },
      {
        id: 'payee_default_payment_method',
        values: [
          { value: '1', name: 'Printable Check' }
        ]
      },
      {
        id: 'custom_field_position',
        values: [
          { value: '1', name: 'Dealer' },
          { value: '2', name: 'Manager' },
          { value: '3', name: 'Advisor' },
          { value: '4', name: 'Technician' }
        ]
      }
    ]
  };

  loadingpush: boolean;
  isShowSendDropDown = false;
  isShowPrintDropDown = false;
  isShowQbDropDown = false;
  isImportDown = false;
  isApprovalRequired = false;
  paymentsFilterArray: IFilterItem[] = [
    { id: 0, filterName: 'All' },
    { id: 1, filterName: 'Check' },
    { id: 2, filterName: 'ACH' },
    { id: 3, filterName: 'Wire' },
    { id: 4, filterName: 'Virtual Card' },
    { id: 5, filterName: 'Recurring' }
  ];

  activeFilterIndex: number | undefined = 0;
  isRowEmpty: number;
  isHamaspik: boolean;
  isMultiLevelPluginEnabled: boolean;
  isApprovalPolicyEnabled: boolean;
  isApprovalPolicyEnabledUser = signal(false);
  /** Approval policy is on AND we are logged in as the client (sub) user. */
  isApprovalPolicyClientUser = signal(false);
  approvalListFirstLoaded: boolean;
  freeDragPosition: Point;
  position: { x: number; y: number };
  bankAccountId: string;
  checkNo: string;
  extendPagination = false;
  refresh = false;
  gridReadyApiQueue: GridApi | undefined;
  isWalletCheckMail = signal(false);
  refreshPendingApproval$ = toObservable(this.v3PaymentsTableService.refershPendingApprovalSignal);

  constructor() {
    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.columnDefs = this.getColumnDefs(userPlugins);
    this.defaultColumnFields = this.setDefaulColumns(userPlugins);
  }

  ngOnInit() {
    this.checkForPaginationExtend();
    this.getScreenSize();
    if(this.env.env_id === 'csnhc') {
      this.dataTableService.setDataFromParent(
        undefined,
        this.csnhcFloatingFilterConfigurations
      );
    } else {
      this.dataTableService.setDataFromParent(
        undefined,
        this.floatingFilterConfigurations
      );
    }
    this.checkEnabledPlugins();
    this.getRowSelectionData();
    this.getCheckListData();
    this.getCheckDescription();
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3PaymentsTableService.loadV3PaymentsTableData();
    this.setUserVerificationStatus();
    this.getRowCount();
    this.onSelectCheckTab();
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
    this.setDragPostion();
    this.shippingType();
    this.isParentCompany.set(this.localStorageService.getItem('isParentCompany') === 1);
    this.checkForRefreshPendingApproval();
  }

  checkForRefreshPendingApproval() {
    this.subscriptions.push(
      this.refreshPendingApproval$.subscribe((res) => {
        if (res) {
          this.getCheckListData();
        }
      })
    );
  }

  onGridReadyOutput(event: GridApi) {
    this.gridReadyApiQueue = event;
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize() {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
  }

  checkForPaginationExtend() {
    this.dataTableService.paginationChange$.subscribe(
      (isPaginationExtended) => {
        this.extendPagination = isPaginationExtended;
        if (isPaginationExtended) {
          this.refresh = true;
          setTimeout(() => {
            this.refresh = false;
          });
        }
      }
    );
  }

  /**
   * @description Handles the selection of the 'Check' tab based on the current route path or default screen setting.
   */
  onSelectCheckTab() {
    const pathType = this.route.snapshot.routeConfig?.path;
    const isDefaultScreenCheckList =
      !!this.localStorageService.getItem('defaultPage') &&
      (this.localStorageService.getItem('defaultPage') as string).includes(
        '/manage/payments-table/check'
      );

    if (pathType === 'check' || isDefaultScreenCheckList) {
      this.onFilterClick({ id: 1, filterName: 'Check' });
    }

    if (pathType === 'recurring') {
      this.onFilterClick({ id: 5, filterName: 'Recurring' });
    }

    this.subscriptions.push(
      this.route.queryParamMap.subscribe((param) => {
        if (param.get('tab')) {
          const tabToChange = this.paymentsFilterArray.filter(
            (tab) =>
              tab.filterName.toLowerCase() === param.get('tab')?.toLowerCase()
          )[0];
          if (tabToChange) this.onFilterClick(tabToChange);
        }
      })
    );
  }

  dragEnd($event: CdkDragEnd) {
    this.position = {
      x:
        $event.source.getFreeDragPosition().x > 1194
          ? 1194
          : $event.source.getFreeDragPosition().x,
      y: $event.source.getFreeDragPosition().y
    };
  }

  setDragPostion() {
    this.subscriptions.push(
      this.layoutService.getMessage().subscribe((res) => {
        if (res === false) {
          this.freeDragPosition = { x: this.position.x, y: this.position.y };
        }
      })
    );
  }

  getRowSelectionData() {
    this.subscriptions.push(
      this.v3DataTableService.v3RowSelectionData$.subscribe({
        next: (res) => {
          this.selectedRowData = res;
          this.selectedRowCount = this.selectedRowData.length;
          this.setCheckPaymentOptions();
          this.paymentModeChecker();
          this.mapBankAccount();
          this.getCheckStatus();
          if (this.selectedRowCount === 1) {
            const isEditable = this.isItEditable(
              this.selectedRowData[0].data as ICommonTransactionTableData
            );
            this.isEditable.set(isEditable);
            if (
              this.selectedRowData[0].data?.transfer_type === 'CHECK' &&
              this.selectedRowData[0].data.source.source.toLowerCase() ===
                'wallet' &&
              (this.selectedRowData[0].data.transfer?.status === 1 ||
                this.selectedRowData[0].data.transfer?.status === 1002)
            ) {
              this.isEditable.set(false);
            }
          } else {
            this.isEditable.set(false);
          }
        }
      })
    );
  }

  isItEditable(rowData: ICommonTransactionTableData): boolean {
    const isCheck = ['check', 'checkMail'].includes(rowData.transfer_type_code);
    const editCheckAction = ActionItems.checkActionsItems().find(
      (item) => item.label === 'Edit'
    );

    if (
      !isCheck &&
      (rowData.source?.name === '' || rowData.source?.name === null)
    ) {
      return false;
    }

    if (
      !isCheck &&
      (rowData.status === 'PENDING' || rowData.transfer_type_code === 'check')
    ) {
      return true;
    }

    if (isCheck) {
      if (
        rowData.transfer_type_code === 'checkMail' &&
        rowData.status !== 'PENDING'
      ) {
        return false;
      }
      if (rowData.status === 'CANCELED' || rowData.cheque_status === 807) {
        return false;
      }
      return !editCheckAction?.disableAt[rowData.status]?.includes(
        rowData.transfer_mode
      );
    }

    return false;
  }

  onEditPayment(paymentId: string, checkStatus: number) {
    this.router.navigate([`/manage/payments/main/edit/${paymentId}`], {
      state: { backUrl: this.router.url },
      queryParams: { checkStatus }
    });
  }

  getRowCount() {
    this.v3DataTableService.emptyRowData.subscribe((res) => {
      this.isRowEmpty = res;
    });
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

  /**
   * Determines the approval status of selected rows and sets the 'isApprovalRequired' flag accordingly.
   */
  getCheckStatus() {
    if (this.selectedRowData.length) {
      this.isApprovalRequired = true;
      this.isVoidable.set(true);
      this.isBulkDeletable.set(true);
      this.selectedRowData?.forEach((row) => {
        if (row.data?.status !== 'APPROVAL_REQUIRED') {
          this.isApprovalRequired = false;
        }
        if (
          row.data?.transfer_type === 'CHECK' &&
          row.data.source.source.toLowerCase() === 'wallet' &&
          (row.data.transfer?.status === 1 ||
            [500, 501, 502, 503, 504, 505, 506, 1002].includes(
              row.data.transfer?.status || 0
            ))
        ) {
          this.isVoidable.set(false);
          this.isBulkDeletable.set(false);
        }
        if (
          row.data?.status === 'CANCELED' ||
          row.data?.cheque_status === 807
        ) {
          this.isVoidable.set(false);
        }
      });
    } else {
      this.isApprovalRequired = false;
      this.isVoidable.set(true);
    }
  }

  checkEnabledPlugins() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService.headerData().subscribe((res) => {
        if (res) {
          if (
            res.data.enabledPlugins.includes('enterprise-hamaspik-check-import') || 
            res.data.enabledPlugins.includes('enterprise-steno-agency') ||
            res.data.managedPartner?.approvalPolicy === 1
          ) {
            this.isHamaspik = res.data.enabledPlugins.includes('enterprise-hamaspik-check-import');
            this.isMultiLevelPluginEnabled = res.data.enabledPlugins.includes('enterprise-steno-agency');
            this.isApprovalPolicyEnabled = res.data.managedPartner?.approvalPolicy === 1;
            this.isApprovalPolicyEnabledUser.set(res.data.managedPartner?.approvalPolicy === 1 && !res.data.isLoggedInAsClient);
            this.isApprovalPolicyClientUser.set(res.data.managedPartner?.approvalPolicy === 1 && !!res.data.isLoggedInAsClient);
            this.v3PaymentsTableService.isHamaspik = this.isHamaspik;
            this.v3PaymentsTableService.isMultiLevelPluginEnabled = this.isMultiLevelPluginEnabled;
            if (!this.approvalListFirstLoaded) {
              this.getApprovalRequiredList();
            }
          }
          if (res.data.enabledPlugins.includes('cleared-checks-import')) {
            this.isVerifiedChecksPluginEnabled.set(true);
          }
          if (res.data.enabledPlugins.includes('enterprise-maf')) {
            this.isEnterpriseMafPluginEnabled.set(true);
          }
          if (res.data.enabledPlugins.includes('qb-auto-sub-account-mapping')) {
            this.isPrintPreviewChecksVisible.set(true);
          }
          this.updateNetsuiteFailedPaymentsTab(
            res.data.enabledPlugins.includes('enterprise-wiygul')
          );
          if (this.env.env_id === 'csnhc' && res.data.isLoggedInAsClient) {
            this.isClientUser.set(true);
          }
        }
      })
    );
  }

  /**
   * @description Used check if selected row bank need maping.
   */
  mapBankAccount() {
    this.isMaped = this.selectedRowData.some(
      (rowdata) =>
        rowdata?.data?.third_party_name !== null &&
        rowdata?.data?.source?.name === ''
    );
  }

  /**
   * @description To know Check QuickBookConnected and pushback enabled
   */
  getCheckListData() {
    this.subscriptions.push(
      this.checkService.getCheckListData().subscribe((res) => {
        if (res?.success) {
          this.reprintRequestedTotalCount = res.data?.reprintRequestedTotalCount;
          this.isQucikBookConnected = res.data?.isQucikBookConnected;
          this.isPushBackEnable =
            !!res.data?.isPushBackEnabled?.is_push_back_enable;
          this.isQucikBookDesktopConnected =
            res.data?.isQucikBookDesktopConnected;
          this.isQBDPushBackEnabled = !!res.data?.isQBDPushBackEnabled;
          this.isPendingChecks = res.data.isPending;
          this.v3PaymentsTableService.isPendingChecks = res.data.isPending;
          this.isNetSuiteConnected = !!res.data?.isNetsuiteConnected;
          this.isNetSuiteushBackEnabled = !!res.data?.isNetsuitePushBackEnabled;
          this.isFreshBooksConnected = !!res.data?.isFreshBooksConnected;
          this.isFreshBooksPushBackEnabled =
            !!res.data?.isFreshBooksPushBackEnabled;
          this.updateQbTransactionsTab(res.data.qbShowSelectionPopup);
        }
      })
    );
  }

  /**
   * @description Adds or removes the NetSuite Export Failed Payments tab, which
   * only exists for users on the `enterprise-wiygul` plugin.
   * @param isWiygulPluginEnabled - Whether the plugin is on for this user.
   */
  updateNetsuiteFailedPaymentsTab(isWiygulPluginEnabled: boolean) {
    const tabId = 7;
    const tabExists = this.paymentsFilterArray.some((tab) => tab.id === tabId);

    if (isWiygulPluginEnabled && !tabExists) {
      this.paymentsFilterArray.push({
        id: tabId,
        filterName: 'NetSuite Export Failed Payments'
      });
    } else if (!isWiygulPluginEnabled && tabExists) {
      this.paymentsFilterArray = this.paymentsFilterArray.filter(
        (tab) => tab.id !== tabId
      );
    }
  }

  /**
   * @description Adds or removes QuickBooks Transactions tab based on QuickBooks connection status
   */
  updateQbTransactionsTab(qbShowSelectionPopup: boolean) {
    const qbTabId = 6;
    const qbTabExists = this.paymentsFilterArray.some((tab) => tab.id === qbTabId);

    if (qbShowSelectionPopup && this.isQucikBookConnected && !qbTabExists) {
      this.paymentsFilterArray.push({ id: qbTabId, filterName: 'QuickBooks Transactions' });
    } else if (!this.isQucikBookConnected && qbTabExists) {
      this.paymentsFilterArray = this.paymentsFilterArray.filter(
        (tab) => tab.id !== qbTabId
      );
    }
  }

  removeRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  /**
   * Handles the scroll event on the main container.
   * Updates the visibility of the floating button popup based on the vertical scroll position.
   *
   * @param  event - The scroll event.
   */
  onContainerScroll(event: Event) {
    const mainContainerElement = event.target as HTMLDivElement;
    const verticalScrollPosition = mainContainerElement.scrollTop;
    this.isFloatingButtonPopupShow = verticalScrollPosition > 80;
  }

  /**
   * @description This function checks if the chosen types
   * of payment for Bulk Payment processing are different and
   * if yes, it shows a warning.
   * @returns If there is no `selectedRowData`
   */
  paymentModeChecker() {
    if (!this.selectedRowData) {
      this.areDifferentPaymentTypesChosen = false;
      return;
    }

    const lastSelectedDataIndex = this.selectedRowData.length - 1;
    if (
      this.selectedRowData[0] &&
      this.selectedRowData[lastSelectedDataIndex]
    ) {
      if (
        this.selectedRowData[0].data?.transfer_type !==
        this.selectedRowData[lastSelectedDataIndex].data?.transfer_type
      ) {
        this.areDifferentPaymentTypesChosen = true;
      } else {
        this.areDifferentPaymentTypesChosen = false;
      }
    }
  }

  /**
   * This function displays the text for the floating
   * notification.
   * @returns If there is no `selectedRowData`
   */
  getFloatingNotificationText() {
    if (!this.selectedRowData) {
      this.bulkPaymentNotification.notificationText = '';
    } else if (this.selectedRowData.length === 1) {
      this.bulkPaymentNotification.notificationText = this.selectedRowData[0]
        .data?.payee_name as string;
    } else if (this.selectedRowData.length >= 2) {
      this.bulkPaymentNotification.notificationText = `${this.selectedRowData[0].data?.payee_name}, ${this.selectedRowData[1].data?.payee_name}`;
    } else {
      this.bulkPaymentNotification.notificationText = '';
    }
  }

  /**
   * This function displays the number for the floating
   * notification.
   * @returns If there is no `selectedRowData`
   */
  getFloatingDynamicNumberText() {
    if (!this.selectedRowData || this.selectedRowData.length <= 2) {
      this.bulkPaymentNotification.extendedText = '';
    } else if (this.selectedRowData.length >= 3) {
      this.bulkPaymentNotification.extendedText = ` & ${
        this.selectedRowData.length - 2
      } Others`;
    } else {
      this.bulkPaymentNotification.extendedText = '';
    }
  }

  /**
   * @description Checks if selected row is for check to enable print, mail and email buttons.
   */
  setCheckPaymentOptions() {
    if (this.selectedRowData.length) {
      this.isCheckSelected = true;
      this.isWalletCheckPrintSelected = false;
      this.selectedRowData?.forEach((row) => {
        if (row.data?.transfer_type !== 'CHECK') {
          this.isCheckSelected = false;
        }

        if (row.data?.status === 'APPROVAL_REQUIRED') {
          this.isApprovalRequiredPayment.set(true);
        } else {
          this.isApprovalRequiredPayment.set(false);
        }

        if (
          row.data?.transfer_type === 'CHECK' &&
          row.data.source.source.toLowerCase() === 'wallet'
        ) {
          this.isWalletCheckPrintSelected = true;
          if (row.data.transfer_id) {
            this.transferId = row.data.transfer_id;
          } else {
            this.transferId = undefined;
          }
        }

        if (
          row.data?.transfer_type === 'CHECK' &&
          row.data.source.source.toLowerCase() === 'wallet' &&
          row.data.transfer_mode === 'PRINT'
        ) {
          this.isWalletCheckPrintSelectedForBulkPayment.set(true);
        }
        
        if (row.data?.cheque_status === 622) {
          this.isReprintRequestCheks.set(true);
        } else {
          this.isReprintRequestCheks.set(false);
        }

      });
    } else {
      this.isCheckSelected = false;
      this.isWalletCheckPrintSelected = false;
      this.isWalletCheckPrintSelectedForBulkPayment.set(false);
    }
  }

  goToCheckBulkPayment(checkOption: string): void {
    if (
      (!this.isCheckSelected && !this.selectedRowData) ||
      this.selectedRowData.length === 0
    ) {
      this.alertService.warningAlert({
        content: 'Please select a payment before proceeding.',
        close: false
      });
      return;
    }

    if(this.paymentService.checkForComplianceFreeze()){
      this.paymentService.openComplianceFreezeModal();
      return;
    }

    const checkOptions = [
      'mail',
      'email',
      'Print-Check Paper',
      'Print-White Paper',
      'direct-deposit'
    ];

    // Check if all selected items meet the wallet check mail conditions
    if (
      checkOption === 'mail' &&
      this.selectedRowData &&
      this.selectedRowData.length > 0
    ) {
      const allItemsMeetConditions = this.selectedRowData.every(
        (row) =>
          (row.data?.transfer_type === 'MAIL' ||
            row.data?.transfer_type === 'CHECK') &&
          row.data?.source?.source?.toUpperCase() === 'WALLET' &&
          (row.data?.status === 'PENDING' || row.data?.status === 'APPROVED')
      );
      this.isWalletCheckMail.set(allItemsMeetConditions);
    } else {
      this.isWalletCheckMail.set(false);
    }

    if (
      this.selectedRowData.length >= 1 &&
      !this.isCheckSelected &&
      checkOptions.includes(checkOption) &&
      !this.isWalletCheckMail()
    ) {
      this.alertService.warningAlert({
        content:
          'You can only use this button on a payment where the Type is Check.',
        close: false
      });
      return;
    }

    if (checkOptions.includes(checkOption)) {
      const virtualAccountIds: string[] = [];
      this.selectedRowData?.forEach((row) => {
        if (row.data?.source?.info?.isVirtualAccount === 1) {
          // Only push if the source_id is not already in the array (ensuring uniqueness)
          if (!virtualAccountIds.includes(row.data.source_id)) {
            this.isChaseAccountPending = true;
            virtualAccountIds.push(row.data.source_id);
          }
        }
        // Bank account Rejected Case
        else if (
          row.data?.source?.info?.isVirtualAccount === 0 &&
          row.data?.source?.info?.verifiedBy === 88 &&
          row.data?.source?.info?.verified === 0
        ) {
          if (!virtualAccountIds.includes(row.data.source_id)) {
            virtualAccountIds.push(row.data.source_id);
          }
        }
      });
      if (virtualAccountIds.length > 0) {
        let notification;
        if (this.isChaseAccountPending) {
          notification = this.alertService.infoAlert({
            content:
              'Since you added your Bank account using instant verification, we received a virtual account number. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.',
            doneMsg: 'Update',
            isCancel: true
          });
        } else {
          notification = this.alertService.failedAlert({
            content:
              'Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
            doneMsg: 'Update',
            isCancel: true
          });
        }
        notification.afterClosed().subscribe((res) => {
          this.isChaseAccountPending = false;
          if (res) {
            const confirmationDialog = this.dialog.open(
              VirtualAccountConfirmationModalComponent,
              {
                maxWidth: '1200px',
                width: '100%',
                disableClose: true,
                data: { bankAccountIds: virtualAccountIds }
              }
            );

            confirmationDialog.afterClosed().subscribe((result) => {
              if (result && result.refreshTable) {
                this.v3DataTableService.refreshV3DataTable();
              }
              if (result && result.success) {
                this.processCheckBulkPayment(checkOption);
              }
            });
          }
        });
        // return; // This return should be outside the subscription callback
      } else {
        this.processCheckBulkPayment(checkOption);
      }
    } else {
      this.processCheckBulkPayment(checkOption);
    }
  }

  /**
   *@description Method for print, email and mail options when only checks are selected. Routing numbers may be temporarily for checking chime bank or chime bank.
   * @param checkOption - String to pass in when print, email, or mail options are selected (only for checks) when going to bulk payments section.
   */
  processCheckBulkPayment(checkOption: string): void {
    if (!this.userEmailAndPhoneVerified) {
      this.router.navigateByUrl('/manage/users/verify-email-phone');
      return;
    }

    if (this.isMaped) {
      this.openMappingAlert(this.selectedRowData);
      return;
    }
    let checkMethode: string;
    if (
      checkOption === 'Print-Check Paper' ||
      checkOption === 'Print-White Paper'
    ) {
      checkMethode = 'print';
    } else {
      checkMethode = checkOption;
    }

    if (checkOption === 'mail' || checkOption === 'email') {
      this.checkOptionsLoaders.sendLoading = true;
    } else if (checkOption === 'direct-deposit') {
      this.checkOptionsLoaders.DDLoading = true;
    } else if (checkMethode === 'print') {
      this.checkOptionsLoaders.printLoading = true;
    }
    const paymentsUuidList: string[] = [];
    let checkPaymentsData: IZilPyamentLists[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (
        rowData.data?.uu_id &&
        rowData?.data?.source?.name !== '' &&
        rowData?.data?.source_id !== '' &&
        rowData?.data?.payee_name !== ''
      ) {
        paymentsUuidList.push(rowData.data.uu_id);
      }
    });
    if (
      (checkOption === 'approve' &&
        this.paymentService.isDialogOpen.checkApproveDialog) ||
      (checkOption === 'reject' &&
        this.paymentService.isDialogOpen.checkRejectDialog) ||
      this.isZilPaymentLists
    ) {
      return;
    }
    if (this.isWalletCheckPrintSelected && checkMethode === 'print') {
      this.getCheckIds(paymentsUuidList, checkOption);
      return;
    }
    this.isZilPaymentLists = true;
    this.subscriptions.push(
      this.v3BulkPaymentService
        .zilPaymentLists(paymentsUuidList)
        .pipe(
          finalize(() => {
            this.isZilPaymentLists = false;
          })
        )
        .subscribe((res) => {
          checkPaymentsData =
            res.data?.filter(
              (obj) => obj.transferType === 'CHECK' && obj.sourceType === 'BANK'
            ) || [];
          const chimeBankIds: string[] = [];
          const zilBankIds: string[] = [];
          checkPaymentsData.forEach((item) => {
            const { routingNumber, isItZil } = item.source as IBankSource;
            if (
              routingNumber === '103100195' ||
              routingNumber === '031101279' ||
              routingNumber === '084106768'
            ) {
              chimeBankIds.push(item.referenceNo);
            }

            if (isItZil === 1) {
              zilBankIds.push(item.referenceNo);
            }
          });
          if (
            (zilBankIds.length || chimeBankIds.length) &&
            checkOption !== 'direct-deposit'
          ) {
            this.checkOptionsLoaders = {
              printLoading: false,
              sendLoading: false,
              DDLoading: false
            };
            const isZilBank = zilBankIds.length > 0;
            const ids = isZilBank ? zilBankIds : chimeBankIds;
            if (ids.length === paymentsUuidList.length) {
              const alertContent =
                ids.length > 1
                  ? `Please note that some of the checks cannot be ${checkMethode}ed.The affected check numbers are ${ids.join(
                      ', '
                    )}. Currently, the ${
                      isZilBank ? 'Zil' : 'Neo-bank'
                    } account is only set up for ACH/Direct Deposit.`
                  : `This check cannot be ${checkMethode}ed. Currently, the ${
                      isZilBank ? 'Zil' : 'Neo-bank'
                    } account is only set up for ACH/Direct Deposit.`;

              this.alertService.warningAlert({ content: alertContent });
              return;
            }
            this.alertService.warningAlert({
              content: `Please note that some of the checks cannot be ${checkMethode}ed.The affected check numbers are (${ids.join(
                ', '
              )}). Currently, the ${
                isZilBank ? 'Zil' : 'Neo-bank'
              } account is only set up for ACH/Direct Deposit.`
            });
            return;
          }
          switch (checkOption) {
            case 'Print-White Paper':
              this.processCheckPrint('Print-White Paper');
              break;
            case 'Print-Check Paper':
              this.processCheckPrint('Print-Check Paper');
              break;
            case 'email':
              this.processCheckEmail();
              break;
            case 'mail':
              this.processCheckMail();
              break;
            case 'direct-deposit':
              this.processDD();
              break;
            case 'approve':
              this.isApprovalRequired = false;
              this.managePaymentApprove();
              break;
            case 'reject':
              this.isApprovalRequired = false;
              this.managePaymentReject();
              break;
            default:
              break;
          }
        })
    );
  }

  /**
   * @description Approves checks for selected rows in the data table.
   */
  managePaymentApprove() {
    const checkIdsList: string[] = [];
    const paymentIdsList: string[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (
        rowData.data?.transfer_id &&
        rowData.data?.transfer_type === 'CHECK' &&
        rowData.data.source.source.toLowerCase() === 'bank'
      ) {
        checkIdsList.push(rowData.data.transfer_id);
      } else if (rowData.data?.zilpayment_id) {
        paymentIdsList.push(rowData.data.zilpayment_id);
      }
    });
    if (checkIdsList.length > 0 || paymentIdsList.length > 0) {
      this.paymentService.processPaymentApproval(
        checkIdsList,
        paymentIdsList,
        'approve',
        () => this.isAcceptLoading.set(true), // Set loader after confirmation
        () => this.isAcceptLoading.set(false) // Reset loader after completion
      );
    }
  }

  /**
   * @description Reject checks for selected rows in the data table.
   */
  managePaymentReject() {
    const paymentidList: string[] = [];
    const checkIdsList: string[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (
        rowData.data?.transfer_id &&
        rowData.data?.transfer_type === 'CHECK' &&
        rowData.data.source.source.toLowerCase() === 'bank'
      ) {
        checkIdsList.push(rowData.data.transfer_id);
      } else if (rowData.data?.zilpayment_id) {
        paymentidList.push(rowData.data.zilpayment_id);
      }
    });
    if (checkIdsList.length > 0 || paymentidList.length > 0) {
      this.paymentService.processPaymentApproval(
        checkIdsList,
        paymentidList,
        'reject',
        () => this.isRejectLoading.set(true), // Set loader after confirmation
        () => this.isRejectLoading.set(false) // Reset loader after completion
      );
    }
  }

  /**
   * @description -Processes check printing based on the specified mode.
   * @param mode - The check printing mode, either 'Print-White Paper' or 'Print-Check Paper'.
   */
  processCheckPrint(mode: string) {
    const paymentidList: string[] = [];
    // let checkPaymentsData: IZilPyamentLists[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (rowData.data?.transfer_id) {
        paymentidList.push(rowData.data.transfer_id);
      }
    });
    if (mode === 'Print-White Paper') {
      this.checkPrintType = 6;
    }
    if (mode === 'Print-Check Paper') {
      this.checkPrintType = 4;
    }
    const payloadData = {
      checkId: paymentidList,
      paperType: this.checkPrintType
    };
    if (this.commonOnInitService.isEnterPriseCustomer('enterprise-abc-legal')) {
      this.v3BulkPaymentService.setBulkPaymentCount(0);
      this.enterpriseCheckPrinting(paymentidList);
      return;
    }
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.v3BulkPaymentService
      .checkPrintPayment(payloadData, headerOptions)
      .pipe(
        finalize(() => {
          this.checkOptionsLoaders.printLoading = false;
        }),
        catchError((error) => {
          if (error.error.errorCode === 'plaid_virtual_account') {
            const notification = this.alertService.infoAlert({
              content: error.error.errorMsg,
              doneMsg: 'Update',
              isCancel: true
            });
            notification.afterClosed().subscribe((res) => {
              if (res) {
                const confirmationDialog = this.dialog.open(
                  VirtualAccountConfirmationModalComponent,
                  {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error
                  }
                );
                confirmationDialog.afterClosed().subscribe((resp) => {
                  if (resp.success) {
                    this.processCheckPrint(mode);
                  }
                });
              }
            });
          }
          if(error.error.errorCode === 621){
            const alert = this.alertService.warningAlert({
              content: `${error.error.errorMsg}. Please request re-print approval from your administrator.`,
              doneMsg: 'Request Re-print',
              isCancel: true
            });
            alert.afterClosed().subscribe((res) => {
              if (res) {
                this.v3PaymentsTableService.requestRePrintApproval(paymentidList);
              }
            });
          }
          this.checkPrintError(error, paymentidList);
          return EMPTY;
        })
      )
      .subscribe({
        next: (res) => {
          const urlLoaded = window.open(res.data.url);
          if (
            !urlLoaded ||
            urlLoaded.closed ||
            typeof urlLoaded.closed === 'undefined'
          ) {
            const popupBlockerMsg = this.alertService.warningAlert({
              content:
                'A popup blocker may be preventing the application from opening the pdf file. You may disable popup blocker from your browser settings',
              doneMsg: 'Try Again'
            });
            popupBlockerMsg.afterClosed().subscribe((popupBlockerRes) => {
              if (popupBlockerRes) {
                window.open(res.data.url);
              }
            });
            return;
          }
          this.v3DataTableService.refreshV3DataTable();
          this.removeRowSelectionData();
          if (!urlLoaded) {
            window.open(res.data.url);
          }
        },
        error: (error) => {
          this.checkPrintError(error, paymentidList);
        }
      });
  }

  enterpriseCheckPrinting(paymentidList: string[]) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    this.v3BulkPaymentService.completedPaymentCount = 0;
    this.v3BulkPaymentService.abcEntCheckPrintCountSignal.set(undefined);

    const totalCount = paymentidList.length;
    this.v3BulkPaymentService.isAbcEntCustomer.set(true);
    this.v3BulkPaymentService.setBulkPaymentCount(totalCount);
    this.layoutService.isProgressBarInvoked.next(false);
    let successCount = 0;
    let failCount = 0;

    this.subscriptions.push(
      from(paymentidList)
        .pipe(
          mergeMap((id) => {
            const payloadData = {
              checkId: [id],
              paperType: this.checkPrintType
            };
            return this.v3BulkPaymentService
              .checkPrintPayment(payloadData, headerOptions)
              .pipe(
                tap(() => {
                  successCount += 1;
                  this.v3BulkPaymentService.completedPaymentCount = 1;
                }),
                catchError((error) => {
                  if (error.error.errorCode === 'plaid_virtual_account') {
                    const notification = this.alertService.infoAlert({
                      content: error.error.errorMsg,
                      doneMsg: 'Update',
                      isCancel: true
                    });
                    notification.afterClosed().subscribe((res) => {
                      if (res) {
                        const confirmationDialog = this.dialog.open(
                          VirtualAccountConfirmationModalComponent,
                          {
                            maxWidth: '1200px',
                            width: '100%',
                            disableClose: true,
                            data: error.error
                          }
                        );
                        confirmationDialog.afterClosed().subscribe((res) => {
                          if (res.success) {
                            this.enterpriseCheckPrinting(paymentidList);
                          }
                        });
                      }
                    });
                  }
                  this.checkPrintError(error, paymentidList);
                  failCount += 1;
                  this.v3BulkPaymentService.completedPaymentCount = 1;
                  return throwError(error);
                })
              );
          }, 5),
          finalize(() => {
            this.checkOptionsLoaders.printLoading = false;
            const pendingCount = totalCount - (successCount + failCount);
            this.v3BulkPaymentService.abcEntCheckPrintCountSignal.set({
              total: totalCount,
              success: successCount,
              fail: failCount,
              canceled: pendingCount
            });
          })
        )
        .subscribe({
          next: (res) => {
            if (res && res.data && res.data.url) {
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              document.body.appendChild(iframe);
              iframe.src = res.data.url;
            }
          },
          error: (error: HttpErrorResponse) => {
            this.checkPrintError(error, paymentidList);
          },
          complete: () => {
            this.v3DataTableService.refreshV3DataTable();
            this.removeRowSelectionData();
          }
        })
    );
  }

  checkPrintError(error: HttpErrorResponse, paymentidList: string[]) {
    this.err_msg = error.error.errorMsg;
    const checkId =
      error.error.errorMsg.checkSerialNumber ||
      error.error.errorMsg.chimeSerialNumber;
    const errorMessages: { [key: number]: () => string } = {
      127: () =>
        `Rejected Checks are not allowed to print. <br> Check Numbers - ${checkId}`,
      125: () => {
        const errorMessage =
          paymentidList.length > 1
            ? `These checks cannot be printed. Administrator approval is required before proceeding. <br> Check Number - ${checkId}`
            : `This check cannot be printed. Administrator approval is required before proceeding.`;
        return errorMessage;
      },
      129: () => {
        const errorMessage =
          paymentidList.length > 1
            ? `Some checks are not eligible for printing. <br> Check Numbers - ${checkId}`
            : 'The check is not eligible for printing';
        return errorMessage;
      },
      123: () => {
        const errorMessage =
          paymentidList.length > 1
            ? `Please note that some of the checks cannot be printed.The affected check numbers are ${checkId}. Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
            : `This check cannot be printed. Currently, the Zil account is only set up for ACH/Direct Deposit.`;
        return errorMessage;
      }
    };
    const errorMessage = errorMessages[error.error.errorCode];
    if (errorMessage) {
      this.openWarningAlert(errorMessage());
    }
    return of(false);
  }

  processCheckEmail() {
    const ids: string[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (rowData.data?.transfer_id) {
        ids.push(rowData.data.transfer_id);
      }
    });

    this.subscriptions.push(
      this.checkService
        .getEmails({ ids })
        .pipe(catchError(() => of(false)))
        .subscribe((data) => {
          this.checkOptionsLoaders.sendLoading = false;
          if (data?.success) {
            const emailRows = data.data;
            const dialogRef = this.dialog.open(CheckEmailModalComponent, {
              maxWidth: '93%',
              width: '1232px',
              disableClose: true,
              data: {
                serverData: emailRows
              },
              panelClass: 'modal-overflow-visible'
            });
            dialogRef.afterClosed().subscribe((result) => {
              if (result) {
                this.removeRowSelectionData();
                this.v3DataTableService.refreshV3DataTable();
              }
            });
          }
        })
    );
  }

  /**
   * @description -Processes sending check emails for selected rows.
   */
  processCheckMail() {
    if (this.isWalletCheckMail()) {
      this.v3BulkPaymentService.initBulkPayment(this.getSelectedUuidList());
      this.router.navigate(['/manage/bulk-payments'], {
        state: { data: { hideButton: true }, source: 'wallet' }
      });
      return;
    }
    this.getMailPaperType();
    const selectedCheckId: string[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (rowData.data?.transfer_id) {
        selectedCheckId.push(rowData.data.transfer_id);
      }
    });
    this.subscriptions.push(
      this.checkService
        .getChequeDetails({ ids: selectedCheckId, is_signature: 1 })
        .pipe(
          catchError((err) => {
            this.checkOptionsLoaders.sendLoading = false;
            if (err.error.permissionRequired !== 'check-mail') {
              this.alertService.warningAlert({ content: err?.error.errorMsg });
            }
            return of(err);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.checkdata.chequedata = res.data;
            this.ShippingCalculation();
          }
        })
    );
  }

  processDD() {
    const selectedCheckId: { action: string }[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (rowData.data?.transfer_id) {
        selectedCheckId.push({ action: rowData.data.transfer_id });
      }
    });
    this.subscriptions.push(
      this.checkService
        .getDirectDepostModalData({
          cheques: selectedCheckId.map((c) => c.action)
        })
        .pipe(
          finalize(() => {
            this.checkOptionsLoaders.DDLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openDirectDepositModal(selectedCheckId);
          }
        })
    );
  }

  openDirectDepositModal(checkId: { action: string }[]) {
    const modal = this.dialog.open(DirectDepositComponent, {
      width: '75%',
      maxHeight: '90%',
      data: checkId,
      disableClose: true
    });
    modal.afterClosed().subscribe((res) => {
      if (res.success) {
        this.removeRowSelectionData();
        this.v3DataTableService.refreshV3DataTable();
        this.alertService.successAlert({
          title: 'Payment Success',
          content:
            'Your payment is initiated, please check the status in your records'
        });
      }
    });
  }

  openPendingRequestApprovalModal() {
    if (this.reprintRequestedTotalCount > 0) {
      this.dataTableService.selectedCellValueSignal.set({
        filter: '622',
        field: 'Status',
        payee: undefined
      });
      return;
    }
    const approvalModal: ComponentType<unknown> = this.isApprovalPolicyEnabled
      ? PendingPaymentApprovalsComponent
      : PendingCheckApprovalsComponent;
    this.dialog
      .open(approvalModal, {
        width: '1000px',
        data: this.pendingApprovals
      })
      .afterClosed()
      .subscribe(() => {
        this.v3DataTableService.refreshV3DataTable();
        this.getApprovalRequiredList();
      });
  }

  getApprovalRequiredList() {
    if (this.isHamaspik || this.isMultiLevelPluginEnabled || this.isApprovalPolicyEnabled) {
      this.subscriptions.push(
        this.userService.getPendingApprovalList({ page: 1, perPage: 25 }).subscribe((res) => {
          this.approvalListFirstLoaded = true;
          this.pendingApprovals = res.data;
          this.pendingApprovalCount = this.isMultiLevelPluginEnabled ? (res.data.pagination?.total ?? res.data.zilPayments.length) : res.data.totalCount;
        })
      );
    }
  }

  /**
   *
   * @description -Performs shipping cost calculation and opens the check mail modal.
   */
  ShippingCalculation() {
    if (!this.checkdata?.chequedata?.datas) {
      return;
    }
    const mailShippingCalculationsdata: IMailShippingCalculations = {
      mail_check_ids: [],
      all_check_ids: [],
      shipping_rate_warning: 0,
      sent_to_customer_address: 0,
      Single_mail_options: 3,
      individual_envelope: 0
    };
    this.checkdata.chequedata.datas.forEach((item) => {
      const mailShippingPayeeDetails: IMailShippingPayeeDetails = {
        mail_type: this.getSelectedShippingType(item.payee_country as string),
        check_paper: 7,
        informed_payee_sms: 0,
        informed_payee_email: 0,
        payee_phone: '',
        payee_email: '',
        file_hidden: []
      };
      const ids2 = item.enc_id;
      mailShippingCalculationsdata.mail_check_ids.push(item.enc_id);
      mailShippingPayeeDetails.payee_email = item.payee_email;
      mailShippingPayeeDetails.payee_phone = item.payee_phone;
      mailShippingCalculationsdata[ids2] = mailShippingPayeeDetails;
    });
    this.subscriptions.push(
      this.checkService
        .ShippingCostCalculationGroup(mailShippingCalculationsdata)
        .subscribe((res: IApiRes<IShippingCostCalculation>) => {
          if (res.success)
            this.openCheckMailModal(res.data, mailShippingCalculationsdata);
        })
    );
  }

  /**
   * @description Get mail type based on payee country.
   * @param {string} country - The country of the payee.
   * @returns {number} The type of mail:
   *   - 1 for United States (USA) or any variation thereof ('united states', 'usa', 'us') and empty or null payee country.
   *   - 14 for Canada or 'ca'.
   *   - 17 for all other countries.
   */
  getMailType(country: string): number {
    let mailType = 1;
    if (country) {
      const payeeCountry = country.toLocaleLowerCase();
      if (
        payeeCountry === 'united states' ||
        payeeCountry === 'usa' ||
        payeeCountry === 'us'
      ) {
        mailType = 1;
      } else if (payeeCountry === 'canada' || payeeCountry === 'ca') {
        mailType = 14;
      } else {
        mailType = 17;
      }
    } else {
      mailType = 1;
    }
    return mailType;
  }

  sortedoption(value: string) {
    const USA = ['united states', 'us', 'usa'];
    const ca = ['canada', 'ca'];

    const country = value?.toLowerCase();
    let selectCountry;

    if (USA.includes(country)) {
      selectCountry = 'United States';
    } else if (ca.includes(country)) {
      selectCountry = 'Canada';
    } else {
      selectCountry = value;
    }

    if (selectCountry === 'Canada') {
      return (
        this.checkdata.shipping?.filter(
          (type: IShippingType) => type.country === 'Canada'
        ) || []
      );
    }
    if (selectCountry === 'United States') {
      return (
        this.checkdata.shipping?.filter(
          (type: IShippingType) =>
            type.country !== 'Canada' && type.country !== 'International'
        ) || []
      );
    }

    return (
      this.checkdata.shipping?.filter(
        (type: IShippingType) => type.country === 'International'
      ) || []
    );
  }

  getSelectedShippingType(country: string): number {
    const shippingTypes = this.sortedoption(country);
    // Check if any shipping type has is_default_mailing_type set to true
    const defaultMailingType = shippingTypes.find(
      (type) => type.is_default_mailing_type
    );

    if (defaultMailingType) {
      // If a default mailing type is found, return its id
      return defaultMailingType.id;
    }

    // check for Us shipping type
    const defaultUsShippingType = shippingTypes.find((type) => type.id === 1);
    if (defaultUsShippingType) {
      return defaultUsShippingType.id;
    }

    // Check for Canada shipping type
    const defaultCaShippingType = shippingTypes.find((type) => type.id === 14);
    if (defaultCaShippingType) {
      return defaultCaShippingType.id;
    }

    // Check for international default shipping type
    return shippingTypes[0]?.id;
  }

  openCheckMailModal(
    shippingCostRes: IShippingCostCalculation,
    mailShippingCalculationsdata: IMailShippingCalculations
  ) {
    this.subscriptions.push(
      this.checkService
        .getChequeDetails({ ids: mailShippingCalculationsdata.mail_check_ids })
        .subscribe({
          next: () => {
            this.checkOptionsLoaders.sendLoading = false;
            if (
              this.checkdata.chequedata &&
              shippingCostRes &&
              mailShippingCalculationsdata
            ) {
              const dialog = this.dialog.open(CheckMailModalComponent, {
                maxWidth: '1200px',
                width: '100%',
                minHeight: '380px',
                disableClose: true,
                data: {
                  data: this.checkdata,
                  ShippingCost: shippingCostRes,
                  caldata: mailShippingCalculationsdata,
                  isDisableNavigation: true
                }
              });
              dialog.afterClosed().subscribe(() => {
                this.shippingType();
              });
            }
          },
          error: (err) => {
            if (err.error.errorCode === 2) {
              this.checkOptionsLoaders.sendLoading = false;
              this.checkdata.errorMsg = err.error.errorMsg;
              if (this.checkdata.chequedata) {
                this.checkdata.chequedata.datas.forEach((el) => {
                  this.checkNo = el.cheque_serial_number;
                  if (this.checkNo === this.checkdata.errorMsg) {
                    this.bankAccountId = el.enc_bank_account_id as string;
                  } else if (this.checkdata.errorMsg) {
                    const checkNumbers = this.checkdata.errorMsg.split(',');
                    checkNumbers.forEach((e: string) => {
                      if (this.checkNo === e) {
                        this.bankAccountId = el.enc_bank_account_id as string;
                      }
                    });
                  }
                });
              }
              this.dialog.open(VerifySignatureModalComponent, {
                maxWidth: '440px',
                width: '100%',
                minHeight: '200px',
                disableClose: true,
                data: {
                  ids: { ids: mailShippingCalculationsdata.mail_check_ids },
                  data: this.checkdata,
                  bankAccountId: this.bankAccountId
                }
              });
            }
          }
        })
    );
  }

  getMailPaperType(): void {
    this.subscriptions.push(
      this.checkService.getpaperType().subscribe((res) => {
        this.checkdata.paper = res.data;
      })
    );
  }

  shippingType(): void {
    this.subscriptions.push(
      this.checkService.getShippingType().subscribe((res) => {
        this.checkdata.shipping = res.data;
      })
    );
  }

  /**
   * Retrieves a list of UUIDs from selected row data.
   * @returns An array of UUIDs from the selected row data.
   */
  getSelectedUuidList() {
    const bulkPaymentsUuidList: string[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (
        rowData.data?.uu_id &&
        rowData?.data?.source?.name !== '' &&
        rowData?.data?.source_id !== '' &&
        rowData?.data?.payee_name !== ''
      ) {
        bulkPaymentsUuidList.push(rowData.data.uu_id);
      }
    });
    return bulkPaymentsUuidList;
  }

  openSubscriptionExpiredWarning(): void {
    this.dialog.open(SubscriptionWarningModalComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: {
        content:
          'Your trial period has expired. Please update your subscription to continue.'
      },
      panelClass: 'ocw_alert_wrapper'
    });
  }

  goToBulkPayment(type?: string): void {
    if ((this.selectedRowData?.length ?? 0) < 2) {
      this.alertService.warningAlert({
        content: 'Please select at least two items for multiple payment modes',
        close: false
      });
      return;
    }
    const trialPeriod = this.localStorageService.getItem('trialPeriodEndsIn');
    if (trialPeriod === 0) {
      this.openSubscriptionExpiredWarning();
      return;
    }

    if (this.isMaped) {
      this.openWarningAlert(
        'Bank account of some checks are not mapped. Please map the bank account for further processing.'
      );
    } else {
      this.v3BulkPaymentService.setIsCheckModeSelected(true);
      this.v3BulkPaymentService.checkOption = '';
      this.v3BulkPaymentService.isAllDetailsAPICalled = false;
      this.v3BulkPaymentService.initBulkPayment(this.getSelectedUuidList());
      if (type) {
        this.router.navigate(['/manage/bulk-payments'], {
          queryParams: { page: type }
        });
      } else {
        this.router.navigateByUrl('/manage/bulk-payments');
      }
    }
  }

  getFloatingNotificationTooltip() {
    const { length } = this.selectedRowData;
    if (length <= 2) {
      this.bulkPaymentNotification.tooltip = '';
    } else {
      let remainingNames = '';
      for (let i = 2; i < length; i += 1) {
        remainingNames = `${remainingNames}${i !== 2 ? ',' : ''} ${
          this.selectedRowData[i].data?.payee_name
        }`;
      }
      this.bulkPaymentNotification.tooltip = remainingNames;
    }
  }

  /**
   * @description open third party import modal
   */
  openImport() {
    const dialogRef = this.dialog.open(ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      disableClose: true,
      width: '93%',
      data: {
        type: 'checks'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.from === 'qbonline-import') {
        this.onFilterClick({ id: 6, filterName: 'QuickBooks Transactions' });
      }
      if (res?.success === true) {
        this.dataTableService.setRefreshStatus(true);
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  /**
   * @description Exports selected checks to a specified application.
   * @param {('qbo' | 'qbd' | 'netsuite')} apps - The target application for exporting checks.
   */
  exportChecks(apps: 'qbo' | 'qbd' | 'netsuite' | 'freshbooks'): void {
    if (!this.selectedRowData) {
      const data: ISuccessAlert = {
        title: 'Error',
        content: 'Please select at least one check to proceed',
        close: false
      };
      this.alertService.warningAlert(data);
      return;
    }
    if (this.isLoading) {
      return;
    }

    const selectedCheckIds = this.selectedRowData.map(
      (item) => item?.data?.transfer_id || ''
    );
    const zilPaymentIds = this.selectedRowData.map(
      (item) =>
        (item?.data?.transfer_type_code !== 'check' &&
          item?.data?.zilpayment_id) ||
        ''
    );
    if (selectedCheckIds?.length > 0) {
      switch (apps) {
        case 'qbo':
          this.isQBOnlineLoading.set(true);
          this.exportChecksToQuickbook(selectedCheckIds);
          break;
        case 'qbd':
          this.isQBDesktopLoading.set(true);
          this.exportChecksToQuickbookDesktop(selectedCheckIds);
          break;
        case 'netsuite':
          this.isNetsuitExportLoading.set(true);
          this.exportChecksToNetSuite(
            selectedCheckIds.filter((id) => id !== ''),
            zilPaymentIds.filter((id) => id !== '')
          );
          break;
        case 'freshbooks':
          this.isFreshBooksExportLoading.set(true);
          this.exportChecksToFreshBooks(selectedCheckIds);
          break;
        default:
          break;
      }
    } else {
      this.openWarningAlert(
        'Please select at least one check to proceed',
        'Error',
        'Got it'
      );
      this.isLoading = false;
    }
  }

  /**
   * @description Export data to Quickbook.
   * @param {string[]} selectedCheckIds - Selected check ids.
   */
  exportChecksToQuickbook(selectedCheckIds: string[]) {
    this.isLoading = true;
    this.subscriptions.push(
      this.integrationService
        .exportChecksToQuickbook(selectedCheckIds)
        .pipe(
          catchError((err) => {
            if (err.error.permissionRequired) {
              this.alertService.warningAlert({
                content: "You don't have permission to do this action."
              });
            }
            if (err.error.errorCode === 500) {
              this.openCustomCheckExportErrorAlert(
                Object.entries(err.error.errorMsg).map(([k, v]) => ({
                  [k]: v
                }))
              );
            }
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading = false;
            this.isQBOnlineLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Checks Exported Successfully');
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.hardRefresh.set(true);
          }
        })
    );
  }

  /**
   * @description Open check export custom error.
   */
  openCustomCheckExportErrorAlert(
    errorChecklist: { [key: string]: unknown }[]
  ) {
    return this.dialog.open(CustomCheckExportErrorAlertComponent, {
      maxWidth: '500px',
      minWidth: '500px',
      width: '95%',
      disableClose: true,
      data: errorChecklist,
      panelClass: 'ocw_alert_wrapper'
    });
  }

  /**
   * @description Export data to Quickbook Desktop.
   * @param {string[]} selectedCheckIds - Selected check ids.
   */
  exportChecksToQuickbookDesktop(selectedCheckIds: string[]) {
    this.isLoading = true;
    this.subscriptions.push(
      this.integrationService
        .exportChecksToQuickbookDesktop(selectedCheckIds)
        .pipe(
          catchError((err) => {
            if (err.error.errorCode === 500) {
              this.openCustomCheckExportErrorAlert(
                Object.entries(err.error.errorMsg).map(([k, v]) => ({
                  [k]: v
                }))
              );
            }
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading = false;
            this.isQBDesktopLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data: ISuccessAlert = {
              title: 'Success!',
              content:
                'Checks Exported Successfully. The checks will appear on  your QuickBooks account after one minute of importing.',
              close: false
            };
            this.alertService.successAlert(data);
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.hardRefresh.set(true);
          }
        })
    );
  }

  /**
   * @description Export data to NetSuite.
   * @param {string[]} selectedCheckIds - Selected check ids.
   */
  exportChecksToNetSuite(selectedCheckIds: string[], zilPaymentIds: string[]): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .exportChecksToNetSuite(selectedCheckIds, zilPaymentIds)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.isNetsuitExportLoading.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              const data: ISuccessAlert = {
                title: 'Success!',
                content:
                  'Checks Exported Successfully. The checks will appear on  your NetSuite account after one minute of importing.',
                close: false
              };
              this.alertService.successAlert(data);
            }
          },
          error: (err) => {
            if (err.error.errorCode === 500) {
              this.openCustomCheckExportErrorAlert(
                Object.entries(err.error.errorMsg).map(([k, v]) => ({
                  [k]: v
                }))
              );
            }
          }
        })
    );
  }

  exportChecksToFreshBooks(selectedCheckIds: string[]) {
    this.isFreshBooksExportLoading.set(true);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.integrationService
          .exportFreshBookChecks({ checkIds: selectedCheckIds })
          .pipe(
            finalize(() => {
              this.isFreshBooksExportLoading.set(false);
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                const data: ISuccessAlert = {
                  title: 'Success!',
                  content: 'Checks Exported Successfully.',
                  close: false
                };
                this.alertService.successAlert(data);
                this.v3DataTableService.refreshV3DataTable();
              }
            },
            error: (err) => {
              if (err.error.errorCode === 500) {
                this.openCustomCheckExportErrorAlert(
                  Object.entries(err.error.errorMsg).map(([k, v]) => ({
                    [k]: v
                  }))
                );
              }
            }
          })
      );
    }
  }

  /**
   * @description Open success alert.
   */
  openSuccessAlert(content: string) {
    const data: ISuccessAlert = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  /**
   * @description Open warning alert.
   */
  openWarningAlert(content: string, title?: string, doneMsg: string = 'OK') {
    const data = {
      title: title || 'Error!',
      content,
      doneMsg
    };
    return this.alertService.warningAlert(data);
  }

  /**
   * @description Used to detect the mat menu is closed and change arrow mark position in the case of send button and Print button.
   * @param {string} type - Indicate Button type
   */
  onMatMenuClosed(type: string) {
    if (type === 'send') {
      this.isShowSendDropDown = false;
    } else if (type === 'print') {
      this.isShowPrintDropDown = false;
    } else {
      this.isShowQbDropDown = false;
    }
  }

  onImportPaymentsDateChange(selectedDate: Date): void {
    const { selection } = this.selectionModel;
    const newSelection = this.selectionStrategy.selectionFinished(selectedDate, selection);
    this.selectionModel.updateSelection(newSelection, this);
    this.importPaymentsDateRange = new DateRange<Date>(newSelection.start, newSelection.end);
  }

  importDayforcePayments(menuTrigger: MatMenuTrigger): void {
    if (!this.importPaymentsDateRange.start) return;

    const startDate = this.importPaymentsDateRange.start;
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    menuTrigger.closeMenu();
    this.isImportPaymentsLoading.set(true);
    this.subscriptions.push(
      this.integrationService.importDayforceData({ payPeriodStartDate: formattedDate })
        .pipe(
          finalize(() => {
            this.isImportPaymentsLoading.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: res.data.message || 'Payments imported successfully.'
              } as ISuccessAlert);
              this.importPaymentsDateRange = new DateRange<Date>(null, null);
              this.v3DataTableService.refreshV3DataTable();
            }
          }
        })
    );
  }

  /**
   * @description Method to filter on the basis of payment type.
   * @param item - selected payment type.
   */
  onFilterClick(item: IFilterItem) {
    this.v3DataTableService.v3RowSelectionData = [];
    this.activeFilterIndex = item.id;
    if (this.v3PaymentsTableService.isOldCheckListShown) {
      this.dataTableService.setDataFromParent(
        undefined,
        this.floatingFilterConfigurations
      );
    }
    if (item.id !== 0) {
      this.v3DataTableService.clearStoredData();
    }
    this.v3DataTableService.switchPaymentTableTab = true;
    // Every other tab leaves this off, so reset it here rather than in each case.
    this.v3PaymentsTableService.isNetsuiteFailedPaymentsShown = false;
    let filter;
    switch (item.id) {
      case 0:
        filter = 'transfer_mode';
        if (this.v3PaymentsTableService.isOldCheckListShown) {
          this.v3DataTableService.initialSelectBoxFilter = undefined;
          delete this.v3DataTableService.defaultPayload.filterModel[filter];
        } else {
          this.v3DataTableService.updateV3DataTableByRemovingFilter = [filter];
        }
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 1:
        this.v3PaymentsTableService.isOldCheckListShown = true;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 2:
        if (this.v3PaymentsTableService.isOldCheckListShown) {
          this.v3DataTableService.initialSelectBoxFilter =
            this.setFilterPayload('1');
          this.v3DataTableService.defaultPayload.filterModel =
            this.setFilterPayload('1');
        } else {
          this.v3DataTableService.updateV3DataTable =
            this.setFilterPayload('1');
        }
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 3:
        if (this.v3PaymentsTableService.isOldCheckListShown) {
          this.v3DataTableService.initialSelectBoxFilter =
            this.setFilterPayload('6');
          this.v3DataTableService.defaultPayload.filterModel =
            this.setFilterPayload('6');
        } else {
          this.v3DataTableService.updateV3DataTable =
            this.setFilterPayload('6');
        }
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 4:
        if (this.v3PaymentsTableService.isOldCheckListShown) {
          this.v3DataTableService.initialSelectBoxFilter =
            this.setFilterPayload('7');
          this.v3DataTableService.defaultPayload.filterModel =
            this.setFilterPayload('7');
        } else {
          this.v3DataTableService.updateV3DataTable =
            this.setFilterPayload('7');
        }
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 5:
        this.v3PaymentsTableService.isOldCheckListShown = true;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 6:
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = true;
        break;

      case 7:
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        this.v3PaymentsTableService.isNetsuiteFailedPaymentsShown = true;
        break;

      default:
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
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
    const filterName = 'transfer_mode';
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: {
        ...selectBoxFilterValues
      }
    };
    return filterPayloadForGrid;
  }

  /**
   * @description Method to set the user verification status value from the `UserVerification$` behaviorSubject from user profile service to `this.userEmailAndPhoneVerified.`
   */
  setUserVerificationStatus() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.email_verified !== 0 && res.phone_verified !== 0) {
          this.userEmailAndPhoneVerified = true;
        }
      })
    );
  }

  /**
   * @description Used to show alert message for unmaped checks.
   * @param { RowNode<ICommonTransactionTableData>[]}selectedRow  Selected Row Datas.
   */
  openMappingAlert(selectedRow: RowNode<ICommonTransactionTableData>[]) {
    if (selectedRow.length === 1) {
      this.openWarningAlert(
        'Please map the bank account for further processing.'
      );
    } else {
      this.openWarningAlert(
        'Bank account of some checks are not mapped. Please map the bank account for further processing.'
      );
    }
  }

  openFailedAlert(content: string) {
    const data: IFailedAlert = {
      content
    };
    return this.alertService.failedAlert(data);
  }

  /**
   * @description This method is to delete multiple transactions (of any type)
   * from the payment table.
   */
  bulkDelete() {
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete these payments?',
      cancelMsg: 'No, cancel',
      doneMsg: 'Yes'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        let showError = false;
        let checkIds: string[] = [];
        let nonCheckIds: string[] = [];
        this.selectedRowData?.forEach(
          (row: RowNode<ICommonTransactionTableData>) => {
            if (
              row?.data?.status === 'PENDING' ||
              (row?.data?.transfer_type === 'CHECK' &&
                row?.data.status !== 'FAILED')
            ) {
              if (
                row.data.transfer_type === 'CHECK' &&
                row.data.source.source?.toLowerCase() !== 'wallet'
              ) {
                checkIds.push(row.data.transfer_id);
              } else {
                nonCheckIds.push(row.data.uu_id);
              }
            } else {
              showError = true;
            }
          }
        );
        if (showError) {
          this.openFailedAlert(
            this.selectedRowData.length === 1
              ? "Selected transaction can't be deleted."
              : "Some of the transactions can't be deleted."
          );
          if (this.selectedRowData.length === 1) {
            this.removeRowSelectionData();
            return;
          }
        }
        if (checkIds.length || nonCheckIds.length) {
          this.v3PaymentsTableService.bulkDelete(checkIds, nonCheckIds);
        }
        this.removeRowSelectionData();
        checkIds = [];
        nonCheckIds = [];
      }
    });
  }

  /**
   * @description This method is to delete multiple transactions (of any type)
   * from the payment table.
   */
  bulkVoid() {
    const hasMailedCheck = this.selectedRowData?.some(
      (row: RowNode<ICommonTransactionTableData>) => row?.data?.cheque_status === 7 || row?.data?.cheque_status === 505
    );
    const content = hasMailedCheck
      ? 'These checks are voided only within this platform. They may still be delivered to the payee and could still be presented to the bank. Are you sure you want to void these checks?'
      : 'Are you sure you want to void these payments?';
    const ref = this.alertService.confirmAlert({
      content,
      cancelMsg: 'No, cancel',
      doneMsg: 'Yes'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        let showError = false;
        let checkIds: string[] = [];
        let nonCheckIds: string[] = [];
        this.selectedRowData?.forEach(
          (row: RowNode<ICommonTransactionTableData>) => {
            if (
              row?.data?.status === 'PENDING' ||
              (row?.data?.transfer_type === 'CHECK' &&
                row?.data.status !== 'FAILED')
            ) {
              if (
                row.data.transfer_type === 'CHECK' &&
                row.data.source.source?.toLowerCase() !== 'wallet'
              ) {
                checkIds.push(row.data.transfer_id);
              } else {
                nonCheckIds.push(row.data.uu_id);
              }
            } else {
              showError = true;
            }
          }
        );
        if (showError) {
          this.openFailedAlert(
            this.selectedRowData.length === 1
              ? "Selected transaction can't be voided."
              : "Some of the transactions can't be voided."
          );
          if (this.selectedRowData.length === 1) {
            this.removeRowSelectionData();
            return;
          }
        }
        if (checkIds.length || nonCheckIds.length) {
          this.v3PaymentsTableService.bulkVoid(checkIds, nonCheckIds);
        }
        this.removeRowSelectionData();
        checkIds = [];
        nonCheckIds = [];
      }
    });
  }

  getCheckIds(paymentIds: string[], checkOption: string) {
    // Separate rows with transfer_id from those without
    const rowsWithTransferId: string[] = [];
    const paymentIdsWithoutTransferId: string[] = [];

    this.selectedRowData?.forEach((rowData) => {
      if (rowData.data?.uu_id && paymentIds.includes(rowData.data.uu_id)) {
        if (rowData.data?.transfer_id) {
          rowsWithTransferId.push(rowData.data.transfer_id);
        } else {
          paymentIdsWithoutTransferId.push(rowData.data.uu_id);
        }
      }
    });

    // If all selected rows have transfer_id, directly print without API call
    if (rowsWithTransferId.length > 0 && paymentIdsWithoutTransferId.length === 0) {
      this.printChecks(rowsWithTransferId, checkOption);
      return;
    }

    // If no rows need processing, return early
    if (paymentIdsWithoutTransferId.length === 0) {
      this.checkOptionsLoaders.printLoading = false;
      return;
    }

    const payload = {
      payment_ids: paymentIdsWithoutTransferId
    };

    this.subscriptions.push(
      this.v3BulkPaymentService.processWalletPaymentsMulti(payload).subscribe({
        next: (res) => {
          if (res.success) {
            const response = res;
            if (response?.success && response?.data) {
              const responseData = response.data as Record<
                string,
                {
                  success: boolean;
                  errorMsg?: string;
                  data?: { check_id: string };
                }
              >;
              const successfulCheckIds: string[] = [...rowsWithTransferId];

              // Collect all successful check IDs first
              Object.keys(responseData).forEach((uuid) => {
                const item = responseData[uuid];
                if (item?.success && item?.data?.check_id) {
                  successfulCheckIds.push(item.data.check_id);
                }
              });

              // Check if some checks failed (only count from API processed payments)
              const apiSuccessCount = successfulCheckIds.length - rowsWithTransferId.length;
              const failedCount = paymentIdsWithoutTransferId.length - apiSuccessCount;

              if (failedCount > 0 && successfulCheckIds.length > 0) {
                // Some checks failed - show alert with option to print successful ones
                const alertRef = this.alertService.warningAlert({
                  content: `${failedCount} out of ${paymentIds.length} checks cannot be printed. Do you want to print the ${successfulCheckIds.length} successful check(s)?`,
                  doneMsg: 'Print',
                  isCancel: true
                });
                alertRef.afterClosed().subscribe((result) => {
                  if (result) {
                    this.printChecks(successfulCheckIds, checkOption);
                  } else {
                    this.checkOptionsLoaders.printLoading = false;
                  }
                });
              } else if (successfulCheckIds.length > 0) {
                // All checks successful - proceed to print
                this.printChecks(successfulCheckIds, checkOption);
              } else {
                // No successful checks
                this.alertService.failedAlert({
                  content: 'None of the checks could be processed for printing.'
                });
                this.checkOptionsLoaders.printLoading = false;
              }
            }
          }
        },
        error: (err) => {
          this.alertService.failedAlert({ content: err.error.errorMsg });
          this.checkOptionsLoaders.printLoading = false;
        }
      })
    );
  }

  /**
   * @description Prints the checks with given IDs
   */
  private printChecks(checkIds: string[], checkOption: string) {
    this.checkOptionsLoaders.printLoading = true;
    this.subscriptions.push(
      this.v3BulkPaymentService
        .checkPrintPayment({
          checkId: checkIds,
          paperType: checkOption === 'Print-Check Paper' ? 1 : 6
        })
        .pipe(
          finalize(() => {
            this.checkOptionsLoaders.printLoading = false;
          })
        )
        .subscribe({
          next: (printRes) => {
            const urlLoaded = window.open(printRes.data.url);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const popupBlockerMsg = this.alertService.warningAlert({
                content:
                  'A popup blocker may be preventing the application from opening the pdf file. You may disable popup blocker from your browser settings',
                doneMsg: 'Try Again'
              });
              popupBlockerMsg.afterClosed().subscribe((popupBlockerRes) => {
                if (popupBlockerRes) {
                  window.open(printRes.data.url);
                  this.v3DataTableService.refreshV3DataTable();
                  this.removeRowSelectionData();
                }
              });
              return;
            }
            this.v3DataTableService.refreshV3DataTable();
            this.removeRowSelectionData();
            if (!urlLoaded) {
              window.open(printRes.data.url);
            }
          },
          error: (err) => {
            this.alertService.failedAlert({ content: err.error.errorMsg });
          }
        })
    );
  }

  gotoReconcilePage() {
    this.router.navigate(['/manage/cheque/reconciliation/step1'], {
      queryParams: { page: 'payments' }
    });
  }

  goToBulkPrintPreviewChecks() {
    if (!this.selectedRowData || this.selectedRowData.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one payment.',
        close: false
      });
      return;
    }

    // Check which rows meet the Print Preview conditions
    const eligibleRows: string[] = [];
    const ineligibleReasons: ICommonTransactionTableData[] = [];

    this.selectedRowData.forEach((rowData) => {
      const {data} = rowData;
      if (!data) return;

      const isCheck = data.transfer_type === 'CHECK';
      const isMailCheck = data.transfer_mode === 'MAIL CHECK' || data.transfer_mode === 'EMAIL CHECK';
      const hasValidStatus = data.cheque_status >= 4;

      if (isCheck && isMailCheck && hasValidStatus && data.transfer_id) {
        eligibleRows.push(data.transfer_id);
      } else {
        ineligibleReasons.push(data);
      }
    });

    // If no rows are eligible
    if (eligibleRows.length === 0) {
      this.alertService.failedAlert({
        content:'The selected payments aren’t eligible for print preview. Try selecting different payments.'
      }
      );
      return;
    }

    // If some rows are not eligible
    if (ineligibleReasons.length > 0) {
      this.alertService.failedAlert({
        content:'Some of the selected payments are not eligible for print preview.'
      });
      return;
    }

    // All rows are eligible - show confirmation dialog
    const confirmRef = this.alertService.warningAlert({
      title: 'Confirm Print Preview',
      content: `This will generate a print preview for the selected checks. Would you like to continue?`,
      doneMsg: 'Continue',
      isCancel: true
    });

    confirmRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.processPrintPreviewChecks(eligibleRows);
      }
    });
  }

  private processPrintPreviewChecks(checkIds: string[]) {
    this.isPrintPreviewChecksLoading.set(true);
    this.subscriptions.push(
      this.v3BulkPaymentService
        .processCheckMailPreviewPrint({ checkIds })
        .pipe(finalize(() => this.isPrintPreviewChecksLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              const { url } = res.data;
              if (url) {
                const urlLoaded = window.open(url);
                if (
                  !urlLoaded ||
                  urlLoaded.closed ||
                  typeof urlLoaded.closed === 'undefined'
                ) {
                  const popupBlockerMsg = this.alertService.warningAlert({
                    content:
                      'A popup blocker may be preventing the application from opening the PDF file. You may disable popup blocker from your browser settings.',
                    doneMsg: 'Try Again'
                  });
                  popupBlockerMsg.afterClosed().subscribe((result) => {
                    if (result) {
                      window.open(url);
                    }
                  });
                }
              } else {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Print preview generated successfully.',
                  close: false
                });
              }
            }
          }
        })
    );
  }

  /**
   * @description Handles the re-print check request approval or rejection.It is used for CSNHC enterprise customers.
   * @param mode - The mode of the request. 'approve' for approval and 'reject' for rejection.
   */
  handleReprintCheckRequest(mode: 'approve' | 'reject') {
    const paymentidList: string[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (rowData.data?.transfer_id) {
        paymentidList.push(rowData.data.transfer_id);
      }
    });
    if(paymentidList.length === 0) {
      this.alertService.warningAlert({content: 'Please select at least one check.'});
      return;
    }
    this.v3PaymentsTableService.handleReprintCheckRequest(paymentidList,mode);
  }

  getSelectedCheckIds() {
    const checkIds: string[] = [];
    this.selectedRowData?.forEach((rowData) => {
      if (
        rowData.data?.transfer_id &&
        rowData.data.transfer_type === 'CHECK' &&
        rowData.data.transfer_mode === 'MAIL CHECK' &&
        rowData.data.cheque_status >= 4
      ) {
        checkIds.push(rowData.data.transfer_id);
      }
    });
    return checkIds;
  }

  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  /* Induvidual Column Definitions */
  colDefId: ICoulmnDefFields = {
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
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left'
  };

  colDefSource = {
    headerName: 'Source',
    field: 'source_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 220,
    floatingFilterComponent: 'sourceFilterCellRendererComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      table: 'payment_table'
    },
    cellStyle: { overflow: 'visible' },
    cellRenderer: 'v3PaymentSourceDropdownComponent',
    /**
     * To export table data
     */
    valueGetter: (params: ValueGetterParams<ICommonTransactionTableData>) =>
      params.data?.source.source,
    cellRendererParams: (
      params: ICellRendererParams<ICommonTransactionTableData>
    ) => {
      const status = params.data?.transfer?.status;
      let checkStatus;
      if (status || status === 0) {
        checkStatus =
          this.cellRendererCheckStatus?.[status]?.statusShortDescription;
      }
      if (checkStatus === 'New') {
        checkStatus = 'Pending';
      }
      return {
        checkStatus: { value: checkStatus }
      };
    }
  };

  selectAllPayment(event: boolean) {
    if (event) {
      this.onFilterClick({ id: 0, filterName: 'All' });
    }
  }

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 80,
    maxWidth: 100,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'dtEditFieldComponent'
  };

  colDefPayee: ICoulmnDefFields = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3PayeeNameComponent',
    cellRendererParams: {
      payeeField: 'payee_id'
    }
  };

  colDefTransferMode = {
    headerName: 'Type',
    field: 'transfer_mode',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 140,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: {
      table: 'payment_table'
    },
    cellRenderer: 'v3PaymentTypeComponent',
    cellClass: 'flex',
    valueGetter: (params: ValueGetterParams<ICommonTransactionTableData>) => {
      if(params?.data?.transfer_type === 'CHECK'){
        return params.data.transfer_mode || params.data.transfer_type;
      }
      return params.data?.transfer_type;
    }
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right',
    floatingFilterComponentParams: {
      table: 'payment_table'
    },
    cellRenderer: 'v3PaymentTableActionComponent',
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
        checkStatus: { value: checkStatus, color: checkColor },
        isApprovalPolicyEnabledUser: this.isApprovalPolicyEnabledUser
      };
    }
  };

  colDefDescription: ICoulmnDefFields = {
    headerName: 'Memo',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellRenderer: 'v3DescriptionComponent'
  };

  colDefMailedAddress: ICoulmnDefFields = {
    headerName: 'Payee Address',
    field: 'payee_address',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    sortable: false,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    }
  };

  colDefPayMethod = {
    headerName: 'Default Pay Method',
    field: 'payee_default_payment_method',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    cellRenderer: (params: ICellRendererParams) => {
      const value = params.data?.payee_default_payment_method;
      switch (value) {
        case '1':
          return 'Printable Check';
        case '2':
          return 'Mail Check by USPS';
        case '3':
          return 'Direct Deposit';
        case '4':
          return 'Email Check';
        default:
          return '';
      }
    }
  };

  colDefCreatedBy: ICoulmnDefFields = {
    headerName: 'Created By',
    field: 'created_by',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 100,
    maxWidth: 130,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'v3CreatedByComponent'
  };

  colDefReferenceId = {
    headerName: 'Reference ID',
    field: 'reference_no',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 100,
    maxWidth: 130,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { value: string; getData: boolean }) => {
      if (params.getData) {
        return params.value;
      }
      const style = `
        text-overflow: ellipsis;
        width: 17ch;
        overflow-x: hidden;
      `;
      return `
        <h2 style="${style}">${params.value !== null ? params.value : ''}</h2>
      `;
    }
  };

  colDefCreatedTime = {
    headerName: 'Updated Date',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent',
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellRendererForExport: (params: { data: { updated_at: string } }) =>
      params.data.updated_at
  };

  colDefCreatedAtTime = {
    headerName: 'Created Date',
    field: 'zil_payments.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3CreatedAtComponent',
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellRendererForExport: (params: { data: { created_at: string } }) =>
      params.data.created_at
  };

  colDefPosition = {
    headerName: 'Position',
    field: 'custom_field_position',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 100,
    maxWidth: 130,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefViewButton: ICoulmnDefFields = {
    headerName: 'View',
    field: 'view',
    maxWidth: 100,
    cellRenderer: 'v3ViewButtonComponent',
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
        viewButtonType: 0,
        showApproveRejectOptions:this.reprintRequestedTotalCount > 0
      };
    },
    suppressHeaderMenuButton: true,
    sortable: false,
    cellClass: 'pl-1',
    pinned: 'left',
    lockPosition: true
  };

  getColumnDefs(plugins?: string[]) {
    const columnDefs = [
      this.colDefId,
      this.colDefPayee,
      this.colDefAmount,
      this.colDefDescription,
      this.colDefReferenceId,
      this.colDefPayMethod,
      this.colDefCreatedTime,
      this.colDefSource,
      this.colDefMailedAddress,
      this.colDefTransferMode,
      this.colDefCreatedBy,
      this.colDefStatus,
      this.colDefViewButton,
      this.colDefCreatedAtTime
    ];

    if (plugins && !plugins.includes('enterprise-maf')) {
      return columnDefs.filter((col) => col !== this.colDefMailedAddress);
    }

    // Add position column only when enterprise-bryancohen plugin is enabled
    if (plugins && plugins.includes('enterprise-bryancohen')) {
      columnDefs.splice(4, 0, this.colDefPosition); // Insert after Reference ID
    }

    return columnDefs;
  }

  /**
   * @description Optional. Will be created dynamically in data table if not passed in. For setting the default columns to display while rendering payments table in any component. The 'isChecked' property's default value is true. 'id' property is used for filtering inside data table component, by matching with 'field' property of colDef.
   * @summary Input to data table to choose columns and to set column properties (Filtering logic is in data table)
   */

  setDefaulColumns(plugins?: string[]) {
    let ColumnFields: IDtColumnFields[] = [
      {
        id: 'id',
        name: 'Check Box',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
      {
        id: 'payee_name',
        name: 'Payee',
        isDisabled: true,
        colDef: this.colDefPayee,
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
        id: 'description',
        name: 'Memo',
        isDisabled: false,
        colDef: this.colDefDescription,
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
        id: 'reference_no',
        name: 'Reference ID',
        isDisabled: false,
        colDef: this.colDefReferenceId,
        isChecked: true
      },
      {
        id: 'position',
        name: 'Position',
        isDisabled: false,
        colDef: this.colDefPosition,
        isChecked: true
      },
      {
        id: 'payee_default_payment_method',
        name: 'Default Pay Method',
        isDisabled: false,
        colDef: this.colDefPayMethod,
        isChecked: true
      },
      {
        id: 'updated_at',
        name: 'Updated Date',
        isDisabled: false,
        colDef: this.colDefCreatedTime,
        isChecked: true
      },
      {
        id: 'created_at',
        name: 'Created Date',
        isDisabled: false,
        colDef: this.colDefCreatedAtTime,
        isChecked: true
      },
      {
        id: 'source_name',
        name: 'Source',
        isDisabled: false,
        colDef: this.colDefSource,
        isChecked: true
      },
      {
        id: 'transfer_mode',
        name: 'Type',
        isDisabled: false,
        colDef: this.colDefTransferMode,
        isChecked: true
      },
      {
        id: 'payee_address',
        name: 'Payee Address',
        isDisabled: false,
        colDef: this.colDefMailedAddress,
        isChecked: true
      },
      {
        id: 'status',
        name: 'Status',
        isDisabled: true,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'view',
        name: 'View',
        isDisabled: true,
        colDef: this.colDefViewButton,
        isChecked: true
      }
    ];

    if (plugins && !plugins.includes('enterprise-maf')) {
      ColumnFields = ColumnFields.filter((item) => item.id !== 'payee_address');
    }

    // Add position column only when enterprise-bryancohen plugin is enabled
    if (plugins && plugins.includes('enterprise-bryancohen')) {
      // Position column is already added in the array above
    } else {
      // Remove position column if enterprise-bryancohen plugin is not enabled
      ColumnFields = ColumnFields.filter((item) => item.id !== 'position');
    }

    return ColumnFields;
  }
}

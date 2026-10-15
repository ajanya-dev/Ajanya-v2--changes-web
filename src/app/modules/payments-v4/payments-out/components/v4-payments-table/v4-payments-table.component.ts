import { Subscription } from 'rxjs/internal/Subscription';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  OnDestroy,
  HostListener,
  Output,
  EventEmitter,
  signal,
  model,
  ViewChild
} from '@angular/core';
import {
  ICoulmnDefFields,
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
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
import { ActivatedRoute, Router } from '@angular/router';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { MatDialog } from '@angular/material/dialog';
import { V4ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-thirdparty-import-main-modal/v4-thirdparty-import-main-modal.component';
import { V4CheckReconciliationModalComponent } from 'src/app/shared/modal/v4-check-reconciliation/v4-check-reconciliation-modal.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  catchError,
  filter,
  finalize,
  mergeMap,
  take,
  tap
} from 'rxjs/operators';
import { EMPTY, from, of, throwError } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { IAppState } from 'src/app/store/app-state.model';
import { CustomCheckExportErrorAlertV4Component } from 'src/app/modules/payments-v4/shared/modals/custom-check-export-error-alert-v4/custom-check-export-error-alert-v4.component';
import { IFailedAlert, ISuccessAlert } from 'src/app/models/alert';
import { CheckService } from 'src/app/shared/service/check/check.service';
import {
  IBankSource,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CheckEmailModalV4Component } from 'src/app/modules/check/modal/check-email-modal-v4/check-email-modal-v4.component';
import {
  ICheckData,
  ICheckStatus,
  IMailShippingCalculations,
  IMailShippingPayeeDetails,
  IShippingCostCalculation,
  IShippingType
} from 'src/app/modules/check/model/check';
import { IApiRes } from 'src/app/models/api';
import { CheckMailModalV4Component } from 'src/app/modules/check/modal/mail-modals/check-mail-modal-v4/check-mail-modal.component-v4';
import { DirectDepositV4Component } from 'src/app/modules/check/modal/direct-deposit-v4/direct-deposit-v4.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PendingCheckApprovalsV4Component } from 'src/app/modules/user-management-v4/v4-modals/pending-check-approvals-v4/pending-check-approvals-v4.component';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { IApprovalRequest, IUserVerification } from 'src/app/models/user';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { CdkDragEnd, Point } from '@angular/cdk/drag-drop';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger } from '@angular/material/menu';
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
  faUpToLine,
  faFileMagnifyingGlass,
  faEye
} from '@fortawesome/pro-solid-svg-icons';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { VerifySignatureModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/verify-signature-modal-v4/verify-signature-modal-v4.component';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { ActionItems } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-actions';
import { VirtualAccountConfirmationModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/virtual-account-confirmation-modal-v4/virtual-account-confirmation-modal-v4.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from 'src/environments/environment';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { V4BulkPaymentService } from 'src/app/modules/v4-bulk-payment/services/v4-bulk-payment.service';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4SourceFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-source-floating-filter/v4-source-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { ComponentType } from '@angular/cdk/portal';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PendingPaymentApprovalsV4Component } from 'src/app/modules/user-management-v4/v4-modals/pending-payment-approvals-v4/pending-payment-approvals-v4.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4CheckRecurringComponent } from '../v4-check-recurring/v4-check-recurring.component';
import { V4DTCommonFilterComponent } from './cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4CreatedAtComponent } from './cell-renderers/v4-created-at/v4-created-at.component';
import { V4CreatedByComponent } from './cell-renderers/v4-created-by/v4-created-by.component';
import { V4DescriptionComponent } from './cell-renderers/v4-description/v4-description.component';
import { V4EditFieldComponent } from './cell-renderers/v4-edit-field/v4-edit-field.component';
import { V4PayeeNameComponent } from './cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4PaymentSourceDropdownComponent } from './cell-renderers/v4-payment-source-dropdown/v4-payment-source-dropdown.component';
import { V4PaymentTypeComponent } from './cell-renderers/v4-payment-type/v4-payment-type.component';
import { V4StatusComponent } from './cell-renderers/v4-status/v4-status.component';
import { V4UpdatedAtComponent } from './cell-renderers/v4-updated-at/v4-updated-at.component';
import { V4DtActionComponent } from '../../../../v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { ICommonTransactionTableData } from '../../../../../models/v3-common';
import { V3PaymentsTableService } from '../../../../v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { V3BulkPaymentService } from '../../../../v3-bulk-payment/services/v3-bulk-payment.service';
import { V4CheckListComponent } from '../v4-check-list/v4-check-list.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { V4DataTableComponent } from '../../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { ScrollListenerDirective } from '../../../../../directive/scroll-listner.directive';
import { V4QbTransactionsListComponent } from '../qb-transactions-list/v4-qb-transactions-list.component';
import { ITabItem } from '../../../../../shared/V4/common-tab-v4/common-tab-v4.component';
import { PaymentsV4Service } from '../../../shared/services/payments-v4.service';
import { SendPaymentMode } from '../../../send-payment/models/send-payment.enums';

interface IFilterItem {
  id: number;
  filterName: string;
}

/**
 * Rows opened from this table show the detail panel *below* the v4 chrome,
 * unlike every other opener (which uses the service default, above it).
 */
const PANEL_BACKDROP_Z = { backdropZIndex: 200 };

@Component({
  selector: 'app-v4-payments-table',
  templateUrl: './v4-payments-table.component.html',
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
    CommonModule,
    ScrollListenerDirective,
    DemoVideoComponent,
    V3DataTableComponent,
    V4DataTableComponent,
    V4CheckListComponent,
    WhiteLabelDirective,
    V4CheckRecurringComponent,
    V4QbTransactionsListComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    V3DataTableModule
  ]
})
export class V4PaymentsTableComponent implements OnInit, OnDestroy {
  /* Injectors */
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private v3BulkPaymentService = inject(V3BulkPaymentService);
  public v3PaymentsTableService = inject(V3PaymentsTableService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private checkService = inject(CheckService);
  public paymentService = inject(PaymentsService);
  private localStorageService = inject(LocalStorageService);
  private userService = inject(UserManagementService);
  private route = inject(ActivatedRoute);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private layoutService = inject(LayoutService);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private commonOnInitService = inject(CommonOnInitService);
  private v4BulkPaymentService = inject(V4BulkPaymentService);
  private readonly selectionModel = inject(MatRangeDateSelectionModel<Date>);
  private headerService = inject(HeaderService);
  private readonly selectionStrategy = inject(
    DefaultMatCalendarRangeStrategy<Date>
  );

  public columnDefs?: (ColDef | ColGroupDef)[];
  public defaultColumnFields?: IDtColumnFields[];

  /* Variables */
  /** Live check-list instance (only present on the Check tab). Lets the shared
   *  tab-row host the check import/export strip inline while keeping it wired to
   *  the check-list's own selection. */
  @ViewChild(V4CheckListComponent) checkListComp?: V4CheckListComponent;
  @ViewChild(V4DataTableComponent) dataTable?: V4DataTableComponent;
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

  isPaymentsFilterEnabled = true;
  isPluginDataLoaded = false;
  isLoading: boolean;
  selectedRowData: RowNode<ICommonTransactionTableData>[];
  isFloatingButtonPopupShow = false;
  areDifferentPaymentTypesChosen = false;
  isFieldInvalid = false;
  invalidField = 'source';
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
  pendingApprovalCount = signal(0);
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
  private selectionVersion = signal(0);
  isBulkDeletable = signal(true);
  isVerifiedChecksPluginEnabled = signal(false);
  isEnterpriseMafPluginEnabled = signal(false);
  isApprovalRequiredPayment = signal(false);
  isWalletCheckPrintSelectedForBulkPayment = signal(false);
  isPrintPreviewChecksVisible = signal(false);
  isPrintPreviewChecksLoading = signal(false);
  isImportPaymentsLoading = signal(false);
  isProcessLoading = signal(false);
  importPaymentsDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  isParentCompany = signal(false);
  isReprintRequestCheks = signal(false);
  userPlugins: string[] = [];
  isApprovalPolicyEnabled: boolean;
  /** Set from the header: this account is not offered Direct Deposit. */
  hidesDirectDeposit = signal(false);
  isApprovalPolicyEnabledUser = signal(false);
  /** Approval policy is on AND we are logged in as the client (sub) user. */
  isApprovalPolicyClientUser = signal(false);

  // ── Detail Panel (V4 side drawer) ─────────────────────────────────────────
  private detailPanelService = inject(V4DetailPanelService);
  private recurringRedirect = inject(RecurringRedirectService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private store = inject(Store<IAppState>);

  /**
   *@description Loaders for print, email and mail options when checks are selected.
   */
  checkOptionsLoaders = {
    printLoading: signal(false),
    sendLoading: signal(false),
    DDLoading: signal(false)
  };

  isAnyActionLoading = computed(
    () =>
      this.checkOptionsLoaders.printLoading() ||
      this.checkOptionsLoaders.sendLoading() ||
      this.checkOptionsLoaders.DDLoading() ||
      this.isProcessLoading() ||
      this.isAcceptLoading() ||
      this.isRejectLoading() ||
      this.isPrintPreviewChecksLoading() ||
      this.v3PaymentsTableService.isReprintLoading()
  );

  isNetSuiteushBackEnabled = false;
  isNetSuiteConnected = false;
  faExport = faUpToLine;
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
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4StatusComponent: V4StatusComponent,
    v4PayeeNameComponent: V4PayeeNameComponent,
    v4PaymentTypeComponent: V4PaymentTypeComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    v4PaymentSourceDropdownComponent: V4PaymentSourceDropdownComponent,
    v4ViewButtonComponent: V4ViewButtonComponent,
    v4PayeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    v4DescriptionComponent: V4DescriptionComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    v4EditFieldComponent: V4EditFieldComponent,
    v4CreatedByComponent: V4CreatedByComponent,
    v4DTCommonFilterComponent: V4DTCommonFilterComponent,
    v4SourceFloatingFilterComponent: V4SourceFloatingFilterComponent
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
          { value: '8', name: 'Rejected' },
          { value: '9', name: 'Verification Required' }
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
          { value: '11', name: 'Let Vendor Decide' },
          { value: '13', name: 'International Payment' },
          { value: '14', name: 'Gift Card' }
        ]
      },
      {
        id: 'source_type',
        values: [
          { value: 'WALLET', name: 'Wallet' },
          { value: 'BANK', name: 'Bank' },
          { value: 'CARD', name: 'Card' }
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
          { value: 'dd-funding', name: 'DD-Funding' },
          { value: 'dd-failed', name: 'DD-Failed' },
          { value: 'ddw', name: 'DDW' },
          { value: 'dd-depositing', name: 'DD-Depositing' },
          { value: 'dd-depositing-failed', name: 'DD-Deposit-F' },
          { value: 'ddc', name: 'DDC' },
          { value: 'show_posted', name: 'Posted' },
          { value: 'show_un_posted', name: 'Un-Posted' },
          { value: 'unmapped-checks', name: 'Unmapped-Checks' },
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
        values: [{ value: '0', name: 'Pending' }]
      },
      {
        id: 'transfer_mode',
        values: [
          { value: '0', name: 'Check' },
          { value: '2', name: 'Print' }
        ]
      },
      {
        id: 'source_type',
        values: [{ value: 'BANK', name: 'Bank' }]
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
        values: [{ value: '1', name: 'Printable Check' }]
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

  get filterTabs(): ITabItem[] {
    return this.paymentsFilterArray.map((item) => ({
      label: item.filterName,
      value: item.filterName.toLowerCase().replace(/\s+/g, '-')
    }));
  }

  activeFilter = model<string>('all');

  headerElements = computed<IV3DtHeaderElements>(() => {
    this.selectionVersion();
    const isCSNHC = this.env.env_id === 'csnhc';
    const isReprint = this.reprintRequestedTotalCount > 0;
    const approvalItemName = this.isApprovalPolicyEnabled
      ? 'Payments'
      : 'Checks';

    return {
      buttons: [
        // Bar order: Bulk Pay · Process · Print · Send · Direct Deposit ·
        // Print Mailed Preview · Edit · Delete · Void │ Approve · Reject
        //
        // `barGroup` is explicit here so the bar doesn't fall back to its style
        // heuristic, which reads `filled-danger` as destructive and would strand
        // Delete/Void in a third group behind their own divider. Everything the
        // user *does* to a payment is group 1; the approval decision is group 2,
        // and that single boundary is the only divider drawn. Within a group the
        // sort is stable, so the array order below is the on-screen order.
        {
          id: 'btn_process',
          text: 'Bulk Process',
          lucideIcon: 'circle-play',
          floatingBarVariant: 'primary',
          toolTip: 'Process selected payments through default payment method',
          loading: this.isProcessLoading(),
          disabled:
            this.isWalletCheckPrintSelectedForBulkPayment() ||
            this.isAnyActionLoading(),
          isHidden: isCSNHC
        },
        {
          id: 'btn_print',
          text: 'Print',
          lucideIcon: 'printer',
          floatingBarVariant: 'filled-primary',
          barGroup: 1,
          toolTip: 'Print selected payments',
          loading:
            this.checkOptionsLoaders.printLoading() ||
            this.v3PaymentsTableService.isReprintLoading(),
          disabled: this.isAnyActionLoading(),
          menu: [
            { id: 'btn_print_check_paper', name: 'Print on Check Paper' },
            { id: 'btn_print_white_paper', name: 'Print on White Paper' }
          ]
        },
        {
          id: 'btn_send',
          text: 'Send',
          lucideIcon: 'send',
          floatingBarVariant: 'filled-primary',
          barGroup: 1,
          toolTip: 'Send selected payments',
          loading: this.checkOptionsLoaders.sendLoading(),
          disabled:
            this.isWalletCheckPrintSelected || this.isAnyActionLoading(),
          isHidden: isCSNHC,
          menu: [
            { id: 'btn_send_mail', name: 'Mail' },
            { id: 'btn_send_email', name: 'Email' },
            { id: 'btn_send_group_mail', name: 'Group Mail' }
          ]
        },
        {
          id: 'btn_direct_deposit',
          text: 'Direct Deposit',
          lucideIcon: 'landmark',
          floatingBarVariant: 'filled-primary',
          barGroup: 1,
          toolTip: 'Process direct deposit for selected payments',
          loading: this.checkOptionsLoaders.DDLoading(),
          disabled:
            this.isWalletCheckPrintSelected || this.isAnyActionLoading(),
          isHidden: isCSNHC || this.hidesDirectDeposit()
        },
        {
          id: 'btn_print_mailed_preview',
          text: 'Print Mailed Preview',
          lucideIcon: 'eye',
          floatingBarVariant: 'outline-primary',
          barGroup: 1,
          toolTip: 'Print preview for mailed checks',
          loading: this.isPrintPreviewChecksLoading(),
          disabled: this.isAnyActionLoading(),
          isHidden: !this.isPrintPreviewChecksVisible() || isCSNHC
        },
        {
          id: 'btn_edit',
          text: 'Edit',
          lucideIcon: 'pencil',
          floatingBarVariant: 'outline-primary',
          barGroup: 1,
          toolTip: 'Edit selected payment',
          disabled: !this.isEditable() || this.isAnyActionLoading(),
          isHidden: !this.isEditable()
        },
        {
          id: 'btn_delete',
          text: 'Delete',
          lucideIcon: 'trash-2',
          floatingBarVariant: 'filled-danger',
          barGroup: 1,
          toolTip: 'Delete selected payments',
          disabled:
            !this.selectedRowData?.length ||
            !this.isBulkDeletable() ||
            this.isAnyActionLoading()
        },
        {
          id: 'btn_void',
          text: 'Void',
          lucideIcon: 'ban',
          floatingBarVariant: 'filled-danger',
          barGroup: 1,
          toolTip: 'Void selected payments',
          disabled:
            !this.selectedRowData?.length ||
            !this.isVoidable() ||
            this.isAnyActionLoading(),
          isHidden: isCSNHC
        },
        {
          id: 'btn_approve',
          text: 'Approve',
          lucideIcon: 'circle-check',
          floatingBarVariant: 'filled-success',
          barGroup: 2,
          toolTip: 'Approve selected payments',
          loading: this.isAcceptLoading(),
          disabled:
            !this.isApprovalRequiredPayment() ||
            this.isWalletCheckPrintSelected ||
            this.isAnyActionLoading(),
          isHidden: !(
            this.isPendingChecks &&
            this.isRowEmpty &&
            !this.isHamaspik &&
            !this.isApprovalPolicyClientUser()
          )
        },
        {
          id: 'btn_reject',
          text: 'Reject',
          lucideIcon: 'circle-x',
          floatingBarVariant: 'danger-soft',
          barGroup: 2,
          toolTip: 'Reject selected payments',
          loading: this.isRejectLoading(),
          disabled:
            !this.isApprovalRequiredPayment() || this.isAnyActionLoading(),
          isHidden: !(
            this.isPendingChecks &&
            this.isRowEmpty &&
            !this.isHamaspik &&
            !this.isApprovalPolicyClientUser()
          )
        }
        /** this is for CSNHC enterprise customers */
        // {
        //   id: 'btn_reprint_approve',
        //   text: 'Approve Reprint',
        //   lucideIcon: 'circle-check',
        //   floatingBarVariant: 'success-soft',
        //   toolTip: 'Approve reprint request',
        //   loading: this.v3PaymentsTableService.isAcceptLoading(),
        //   disabled:
        //     this.v3PaymentsTableService.isAcceptLoading() ||
        //     !this.isReprintRequestCheks() ||
        // this.isProcessLoading(),
        //   isHidden: this.reprintRequestedTotalCount <= 0
        // },
        // {
        //   id: 'btn_reprint_reject',
        //   text: 'Reject Reprint',
        //   lucideIcon: 'circle-x',
        //   floatingBarVariant: 'danger-soft',
        //   toolTip: 'Reject reprint request',
        //   loading: this.v3PaymentsTableService.isRejectLoading(),
        //   disabled:
        //     this.v3PaymentsTableService.isRejectLoading() ||
        //     !this.isReprintRequestCheks() ||
        // this.isProcessLoading(),
        //   isHidden: this.reprintRequestedTotalCount <= 0
        // }
      ],
      pendingItems:
        (this.pendingApprovalCount() &&
          (this.isHamaspik || this.isMultiLevelPluginEnabled())) ||
        this.isApprovalPolicyEnabled ||
        isReprint
          ? {
              id: 'btn_pending_approval_info',
              itemName: isReprint ? 'Reprint Checks' : approvalItemName,
              pendingCount: isReprint
                ? this.reprintRequestedTotalCount
                : this.pendingApprovalCount()
            }
          : undefined
    };
  });

  activeFilterIndex: number | undefined = 0;
  isRowEmpty: number;
  isHamaspik: boolean;
  isMultiLevelPluginEnabled = signal(false);
  approvalListFirstLoaded: boolean;
  freeDragPosition: Point;
  position: { x: number; y: number };
  bankAccountId: string;
  checkNo: string;
  extendPagination = false;
  refresh = false;
  gridReadyApiQueue: GridApi | undefined;
  isWalletCheckMail = signal(false);
  refreshPendingApproval$ = toObservable(
    this.v3PaymentsTableService.refershPendingApprovalSignal
  );

  private readonly activeFilter$ = toObservable(this.activeFilter);

  get showImportButtons(): boolean {
    return (
      !this.v3PaymentsTableService.isOldCheckListShown &&
      !this.v3PaymentsTableService.isQbTransactionsShown
    );
  }

  constructor(library: FaIconLibrary) {
    library.addIcons(faEye);
    this.userPlugins = this.localStorageService.getItem('userPlugins');
    this.columnDefs = this.getColumnDefs(this.userPlugins);
    this.defaultColumnFields = this.setDefaulColumns(this.userPlugins);
  }

  /** True while the data-table shows the O17 empty state — parent hides the
   *  filter tabs + import strip so the empty screen takes the full area. */
  get isShowingEmptyState(): boolean {
    return !!this.dataTable?.shouldShowCustomEmptyState;
  }

  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/pay']);
  }

  onEmptyStateLink(key: string): void {
    if (key === 'bulk') {
      this.router.navigate(['/v4/manage/bulk-payments']);
    } else if (key === 'import') {
      this.dialog.open(V4ThirdpartyImportMainModalComponent, {
        panelClass: 'paddingless-modal-rounded',
        width: '900px',
        maxWidth: '95vw'
      });
    }
  }

  onEmptyStateVideo(): void {
    // Onboarding demo video — reuse the existing demo-video affordance if present.
    this.router.navigate(['/v4/manage/send-payment']);
  }

  ngOnInit() {
    this.checkForPaginationExtend();
    this.getScreenSize();
    if (this.env.env_id === 'csnhc') {
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
    this.getRowCount();
    this.onSelectCheckTab();
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
    this.setDragPostion();
    this.shippingType();
    this.isParentCompany.set(
      this.localStorageService.getItem('isParentCompany') === 1
    );
    this.checkForRefreshPendingApproval();
    this.subscriptions.push(
      this.activeFilter$.subscribe((value) => {
        const item = this.paymentsFilterArray.find(
          (f) => f.filterName.toLowerCase().replace(/\s+/g, '-') === value
        );
        if (item) this.onFilterClick(item);
      })
    );
    this.subscriptions.push(
      this.v3DataTableService.resetToDefaultView$.subscribe(() => {
        if (this.hasFiltersApplied()) {
          this.resetToDefaultView();
        }
      })
    );
    // Refresh data table when navigated here with ?refresh= query param
    // (e.g. from payment success modal's "View Payment" button)
    this.subscriptions.push(
      this.route.queryParams.subscribe((params) => {
        if (params.refresh) {
          this.v3DataTableService.refreshV3DataTable();
        }
        if (params.checkId) {
          this.openCheckDetailFromId(params.checkId);
        }
      })
    );
  }

  private openCheckDetailFromId(checkId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { checkId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.checkService
      .getChecksById(checkId)
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.success && res.data) {
          this.detailPanelService.open({
            uu_id: res.data.uuid,
            transfer_id: checkId,
            transfer_type: 'CHECK',
            transfer_type_code: 'CHECK',
            amount: res.data.amount ?? '',
            payee_name: res.data.payee?.payeeName ?? '',
            payee_id: res.data.payee?.payeeId ?? '',
            status: String(res.data.status ?? ''),
            created_at: res.data.date ?? '',
            updated_at: res.data.date ?? '',
            cheque_status: res.data.status ?? 0,
            payee_deleted: 0,
            source_deleted: 0,
            source_name: res.data.bankAccount?.bankAccountName ?? '',
            source_id: res.data.bankAccount?.bankAccountId ?? '',
            reference_no: Number(res.data.serialNumber) || 0,
            transfer_mode: 'CHECK',
            action: '',
            third_party_name: ''
          } as unknown as ICommonTransactionTableData, PANEL_BACKDROP_Z);
        }
      });
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
    const currentFilter = this.activeFilter();
    const isDefaultScreenCheckList =
      !!this.localStorageService.getItem('defaultPage') &&
      (this.localStorageService.getItem('defaultPage') as string).includes(
        '/manage/payments-table/check'
      );

    if (
      pathType === 'check' ||
      (isDefaultScreenCheckList && currentFilter === 'all')
    ) {
      this.router.navigate(['..', 'check'], {
        relativeTo: this.route,
        replaceUrl: true
      });
    }

    if (pathType === 'recurring') {
      this.router.navigate(['..', 'recurring'], {
        relativeTo: this.route,
        replaceUrl: true
      });
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
        if (res === false && this.position) {
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
          this.selectionVersion.update((v) => v + 1);
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

  onEditPayment(paymentId: string) {
    this.paymentsV4Service.openSendModal({
      mode: SendPaymentMode.Edit,
      paymentId
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
      this.headerService.headerData()
        .subscribe((res) => {
          if(res){
            this.hidesDirectDeposit.set(res.data.isRegisteredAfterV2Launch === 1);
            if(res.data.managedPartner?.approvalPolicy === 1){
              this.isApprovalPolicyEnabled = res.data.managedPartner?.approvalPolicy === 1;
              this.isApprovalPolicyEnabledUser.set(res.data.managedPartner?.approvalPolicy === 1 && !res.data.isLoggedInAsClient);
              this.isApprovalPolicyClientUser.set(res.data.managedPartner?.approvalPolicy === 1 && !!res.data.isLoggedInAsClient);
              this.getApprovalRequiredList();
            }
          }
        }
      )
    );

    const pluginsSet = new Set(this.userPlugins);
    if (pluginsSet.size) {
      if (
        pluginsSet.has('enterprise-hamaspik-check-import') ||
        pluginsSet.has('enterprise-steno-agency')
      ) {
        this.isHamaspik = pluginsSet.has('enterprise-hamaspik-check-import');
        this.isMultiLevelPluginEnabled.set(
          pluginsSet.has('enterprise-steno-agency')
        );
        this.v3PaymentsTableService.isHamaspik = this.isHamaspik;
        this.v3PaymentsTableService.isMultiLevelPluginEnabled =
          this.isMultiLevelPluginEnabled();
        if (!this.approvalListFirstLoaded) {
          this.getApprovalRequiredList();
        }
      }
      if (pluginsSet.has('cleared-checks-import')) {
        this.isVerifiedChecksPluginEnabled.set(true);
      }
      if (pluginsSet.has('enterprise-maf')) {
        this.isEnterpriseMafPluginEnabled.set(true);
      }
      if (pluginsSet.has('qb-auto-sub-account-mapping')) {
        this.isPrintPreviewChecksVisible.set(true);
      }
    }
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
          this.reprintRequestedTotalCount =
            res.data?.reprintRequestedTotalCount;
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
   * @description Adds or removes QuickBooks Transactions tab based on QuickBooks connection status
   */
  updateQbTransactionsTab(qbShowSelectionPopup: boolean) {
    const qbTabId = 6;
    const qbTabExists = this.paymentsFilterArray.some(
      (tab) => tab.id === qbTabId
    );

    if (qbShowSelectionPopup && this.isQucikBookConnected && !qbTabExists) {
      this.paymentsFilterArray.push({
        id: qbTabId,
        filterName: 'QuickBooks Transactions'
      });
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

    if (this.paymentService.checkForComplianceFreeze()) {
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
              VirtualAccountConfirmationModalV4Component,
              {
                maxWidth: '1200px',
                width: '100%',
                disableClose: true,
                data: { bankAccountIds: virtualAccountIds },
                panelClass: 'paddingless-modal-rounded'
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
    this.store
      .select(selectUserVerification)
      .pipe(
        tap((verification) => {
          if (verification === null) {
            this.store.dispatch(UserManagementActions.loadUserVerification());
          }
        }),
        filter(
          (verification): verification is IUserVerification =>
            verification !== null
        ),
        take(1)
      )
      .subscribe((verification) => {
        if (
          verification.email_verified !== 0 &&
          verification.phone_verified !== 0
        ) {
          this.executeCheckBulkPayment(checkOption);
        } else {
          this.router.navigateByUrl('/v4/manage/verification/index');
        }
      });
  }

  private executeCheckBulkPayment(checkOption: string): void {
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
      this.checkOptionsLoaders.sendLoading.set(true);
    } else if (checkOption === 'direct-deposit') {
      this.checkOptionsLoaders.DDLoading.set(true);
    } else if (checkMethode === 'print') {
      this.checkOptionsLoaders.printLoading.set(true);
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
            this.checkOptionsLoaders.printLoading.set(false);
            this.checkOptionsLoaders.sendLoading.set(false);
            this.checkOptionsLoaders.DDLoading.set(false);
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
          this.checkOptionsLoaders.printLoading.set(false);
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
                  VirtualAccountConfirmationModalV4Component,
                  {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error,
                    panelClass: 'paddingless-modal-rounded'
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
          if (error.error.errorCode === 621) {
            const alert = this.alertService.warningAlert({
              content: `${error.error.errorMsg}. Please request re-print approval from your administrator.`,
              doneMsg: 'Request Re-print',
              isCancel: true
            });
            alert.afterClosed().subscribe((res) => {
              if (res) {
                this.v3PaymentsTableService.requestRePrintApproval(
                  paymentidList
                );
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
                          VirtualAccountConfirmationModalV4Component,
                          {
                            maxWidth: '1200px',
                            width: '100%',
                            disableClose: true,
                            data: error.error,
                            panelClass: 'paddingless-modal-rounded'
                          }
                        );
                        confirmationDialog.afterClosed().subscribe((resp) => {
                          if (resp.success) {
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
            this.checkOptionsLoaders.printLoading.set(false);
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
          this.checkOptionsLoaders.sendLoading.set(false);
          if (data?.success) {
            const emailRows = data.data;
            const dialogRef = this.dialog.open(CheckEmailModalV4Component, {
              maxWidth: '93%',
              width: '1232px',
              disableClose: true,
              data: {
                serverData: emailRows
              },
              panelClass: [
                'modal-overflow-visible',
                'paddingless-modal-rounded'
              ]
            });
            dialogRef.afterClosed().subscribe((result) => {
              if (result) {
                this.removeRowSelectionData();
                this.v3DataTableService.refreshV3DataTable();
              }
              this.recurringRedirect.redirectPendingToV4Recurring();
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
      // V3 navigated to the bulk payment page here. In V4 the bulk payment flow
      // is modal based (/v4/manage/bulk-payments only holds the Bulk Payment
      // Center), so open the same modals the Process button uses.
      const uuids = this.getSelectedUuidList();
      if (!uuids.length) {
        this.checkOptionsLoaders.sendLoading.set(false);
        this.alertService.warningAlert({
          content: 'No valid payments found to process'
        });
        return;
      }
      this.v4BulkPaymentService.openBulkPaymentModals(uuids, [], {
        onReady: () => {
          this.checkOptionsLoaders.sendLoading.set(false);
        }
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
            this.checkOptionsLoaders.sendLoading.set(false);
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
            this.checkOptionsLoaders.DDLoading.set(false);
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
    const modal = this.dialog.open(DirectDepositV4Component, {
      width: '75%',
      maxHeight: '90%',
      data: checkId,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
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
      this.recurringRedirect.redirectPendingToV4Recurring();
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
      ? PendingPaymentApprovalsV4Component
      : PendingCheckApprovalsV4Component;
    this.dialog
      .open(approvalModal, {
        width: '1000px',
        panelClass: 'paddingless-modal-rounded',
        data: this.pendingApprovals
      })
      .afterClosed()
      .subscribe(() => {
        this.v3DataTableService.refreshV3DataTable();
        this.getApprovalRequiredList();
      });
  }

  getApprovalRequiredList() {
    if (
      this.isHamaspik ||
      this.isMultiLevelPluginEnabled() ||
      this.isApprovalPolicyEnabled
    ) {
      this.subscriptions.push(
        this.userService
          .getPendingApprovalList({ page: 1, perPage: 50 })
          .subscribe((res) => {
            this.approvalListFirstLoaded = true;
            this.pendingApprovals = res.data;
            this.pendingApprovalCount.set(
              this.isMultiLevelPluginEnabled()
                ? (res.data.pagination?.total ?? res.data.zilPayments.length)
                : res.data.totalCount
            );
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
            this.checkOptionsLoaders.sendLoading.set(false);
            if (
              this.checkdata.chequedata &&
              shippingCostRes &&
              mailShippingCalculationsdata
            ) {
              const dialog = this.dialog.open(CheckMailModalV4Component, {
                maxWidth: '1200px',
                width: '100%',
                minHeight: '380px',
                disableClose: true,
                data: {
                  data: this.checkdata,
                  ShippingCost: shippingCostRes,
                  caldata: mailShippingCalculationsdata,
                  isDisableNavigation: true
                },
                panelClass: 'paddingless-modal-rounded'
              });
              dialog.afterClosed().subscribe(() => {
                this.shippingType();
                this.recurringRedirect.redirectPendingToV4Recurring();
              });
            }
          },
          error: (err) => {
            if (err.error.errorCode === 2) {
              this.checkOptionsLoaders.sendLoading.set(false);
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
              this.dialog.open(VerifySignatureModalV4Component, {
                maxWidth: '505px',
                width: '100%',
                minHeight: '200px',
                disableClose: true,
                panelClass: 'paddingless-modal-rounded',
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
    this.alertService.warningAlert({
      content:
        'Your trial period has expired. Please update your subscription to continue.'
    });
  }

  async goToBulkPayment(type?: string): Promise<void> {
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

      const uuids = this.getSelectedUuidList();
      if (!uuids.length) {
        this.alertService.warningAlert({
          content: 'No valid payments found to process'
        });
        return;
      }

      if (!type) this.isProcessLoading.set(true);
      this.v4BulkPaymentService.openBulkPaymentModals(uuids, [], {
        paymentType: type,
        onReady: () => {
          if (!type) this.isProcessLoading.set(false);
        }
      });
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
    const dialogRef = this.dialog.open(V4ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      disableClose: true,
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
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
      (item: RowNode<ICommonTransactionTableData>) =>
        item?.data?.transfer_id ? item?.data?.transfer_id : ''
    );
    const zilPaymentIds = this.selectedRowData.map(
      (item: RowNode<ICommonTransactionTableData>) =>
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
    return this.dialog.open(CustomCheckExportErrorAlertV4Component, {
      maxWidth: '500px',
      minWidth: '500px',
      width: '95%',
      disableClose: true,
      data: errorChecklist,
      panelClass: 'paddingless-modal-rounded'
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
  exportChecksToNetSuite(
    selectedCheckIds: string[],
    zilPaymentIds: string[]
  ): void {
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
              this.v3DataTableService.refreshV3DataTable();
              this.v3DataTableService.hardRefresh.set(true);
              this.removeRowSelectionData();
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

  onImportPaymentsDateChange(selectedDate: Date): void {
    const { selection } = this.selectionModel;
    const newSelection = this.selectionStrategy.selectionFinished(
      selectedDate,
      selection
    );
    this.selectionModel.updateSelection(newSelection, this);
    this.importPaymentsDateRange = new DateRange<Date>(
      newSelection.start,
      newSelection.end
    );
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
      this.integrationService
        .importDayforceData({ payPeriodStartDate: formattedDate })
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

  onHeaderButtonEvent(event: { id: string; selectedRows: unknown[] }): void {
    switch (event.id) {
      case 'btn_print_check_paper':
        this.goToCheckBulkPayment('Print-Check Paper');
        break;
      case 'btn_print_white_paper':
        this.goToCheckBulkPayment('Print-White Paper');
        break;
      case 'btn_send_mail':
        this.goToCheckBulkPayment('mail');
        break;
      case 'btn_send_email':
        this.goToCheckBulkPayment('email');
        break;
      case 'btn_send_group_mail':
        this.goToBulkPayment('group-mail');
        break;
      case 'btn_direct_deposit':
        this.goToCheckBulkPayment('direct-deposit');
        break;
      case 'btn_process':
        this.goToBulkPayment();
        break;
      case 'btn_bulk_pay':
        this.router.navigate(['v4/manage/bulk-payments/index'], {
          queryParams: { page: 'bulk-pay', method: 'manual-entry' }
        });
        break;
      case 'btn_approve':
        this.goToCheckBulkPayment('approve');
        break;
      case 'btn_reject':
        this.goToCheckBulkPayment('reject');
        break;
      case 'btn_edit': {
        const row = this.selectedRowData[0]?.data;
        if (row?.uu_id) {
          this.onEditPayment(row.uu_id);
        }
        break;
      }
      case 'btn_delete':
        this.bulkDelete();
        break;
      case 'btn_void':
        this.bulkVoid();
        break;
      case 'btn_print_mailed_preview':
        this.goToBulkPrintPreviewChecks();
        break;
      case 'btn_reprint_approve':
        this.handleReprintCheckRequest('approve');
        break;
      case 'btn_reprint_reject':
        this.handleReprintCheckRequest('reject');
        break;
      case 'btn_pending_approval_info':
        this.openPendingRequestApprovalModal();
        break;
      default:
        break;
    }
  }

  switchToRecurring(): void {
    const recurringFilter = this.paymentsFilterArray.find((f) => f.id === 5);
    if (recurringFilter) {
      this.onFilterClick(recurringFilter);
    }
  }

  /**
   * @description True when the table isn't already on its default, unfiltered
   * "All" view — i.e. there's actually something for `resetToDefaultView()`
   * to clear.
   */
  private hasFiltersApplied(): boolean {
    const payload = this.v3DataTableService.defaultPayload;
    return (
      this.activeFilterIndex !== 0 ||
      Object.keys(payload?.filterModel ?? {}).length > 0 ||
      !!payload?.payeeIds?.length
    );
  }

  /**
   * @description Clears the tab and every column filter, then remounts the
   * grid so floating filter chips (Payee, Amount, Memo, etc.) drop their own
   * local UI state too. Triggered by re-clicking the already-active
   * "Payments Out" sidebar link.
   */
  resetToDefaultView(): void {
    this.onFilterClick({ id: 0, filterName: 'All' });
    this.v3DataTableService.resetV3DataTablePayload();
    this.refresh = true;
    setTimeout(() => {
      this.refresh = false;
    });
  }

  onFilterClick(item: IFilterItem) {
    this.v3DataTableService.v3RowSelectionData = [];
    this.activeFilterIndex = item.id;
    this.activeFilter.set(item.filterName.toLowerCase().replace(/\s+/g, '-'));
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
    let filterKey: string | undefined;
    switch (item.id) {
      case 0:
        filterKey = 'transfer_mode';
        if (this.v3PaymentsTableService.isOldCheckListShown) {
          this.v3DataTableService.initialSelectBoxFilter = undefined;
          this.v3DataTableService.resetV3DataTablePayload();
        } else {
          this.v3DataTableService.updateV3DataTableByRemovingFilter = [
            filterKey
          ];
        }
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 1:
        this.v3DataTableService.initialSelectBoxFilter = undefined;
        this.v3DataTableService.resetV3DataTablePayload();
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
        this.v3DataTableService.initialSelectBoxFilter = undefined;
        this.v3DataTableService.resetV3DataTablePayload();
        this.v3PaymentsTableService.isOldCheckListShown = true;
        this.v3PaymentsTableService.isQbTransactionsShown = false;
        break;

      case 6:
        this.v3PaymentsTableService.isOldCheckListShown = false;
        this.v3PaymentsTableService.isQbTransactionsShown = true;
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
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to void these payments?',
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
    if (
      rowsWithTransferId.length > 0 &&
      paymentIdsWithoutTransferId.length === 0
    ) {
      this.printChecks(rowsWithTransferId, checkOption);
      return;
    }

    // If no rows need processing, return early
    if (paymentIdsWithoutTransferId.length === 0) {
      this.checkOptionsLoaders.printLoading.set(false);
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
              const apiSuccessCount =
                successfulCheckIds.length - rowsWithTransferId.length;
              const failedCount =
                paymentIdsWithoutTransferId.length - apiSuccessCount;

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
                    this.checkOptionsLoaders.printLoading.set(false);
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
                this.checkOptionsLoaders.printLoading.set(false);
              }
            }
          }
        },
        error: (err) => {
          this.alertService.failedAlert({ content: err.error.errorMsg });
          this.checkOptionsLoaders.printLoading.set(false);
        }
      })
    );
  }

  /**
   * @description Prints the checks with given IDs
   */
  private printChecks(checkIds: string[], checkOption: string) {
    this.checkOptionsLoaders.printLoading.set(true);
    this.subscriptions.push(
      this.v3BulkPaymentService
        .checkPrintPayment({
          checkId: checkIds,
          paperType: checkOption === 'Print-Check Paper' ? 1 : 6
        })
        .pipe(
          finalize(() => {
            this.checkOptionsLoaders.printLoading.set(false);
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
    const dialogRef = this.dialog.open(V4CheckReconciliationModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.v3DataTableService.refreshV3DataTable();
      }
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
      const { data } = rowData;
      if (!data) return;

      const isCheck = data.transfer_type === 'CHECK';
      const isMailCheck = data.transfer_mode === 'MAIL CHECK';
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
        content:
          'The selected payments aren’t eligible for print preview. Try selecting different payments.'
      });
      return;
    }

    // If some rows are not eligible
    if (ineligibleReasons.length > 0) {
      this.alertService.failedAlert({
        content:
          'Some of the selected payments are not eligible for print preview.'
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
    if (paymentidList.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one check.'
      });
      return;
    }
    this.v3PaymentsTableService.handleReprintCheckRequest(paymentidList, mode);
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

  checkValidation(rowData: ICommonTransactionTableData) {
    const sourceType = rowData.source.source;
    const sourceId = rowData.source_id;
    const transferType = rowData.transfer_type_code;

    if (!sourceType || !sourceId || !transferType) {
      if (!transferType) {
        this.invalidField = 'type';
      } else {
        this.invalidField = 'source';
      }
      return true;
    }

    return false;
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
    floatingFilterComponent: 'v4SourceFloatingFilterComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      table: 'payment_table'
    },
    cellRenderer: 'v4PaymentSourceDropdownComponent',
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
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'v4EditFieldComponent'
  };

  colDefPayee: ICoulmnDefFields = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v4PayeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4PayeeNameComponent',
    cellRendererParams: {
      payeeField: 'payee_id'
    }
  };

  colDefTransferMode = {
    headerName: 'Type',
    field: 'transfer_mode',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: {
      table: 'payment_table'
    },
    cellRenderer: 'v4PaymentTypeComponent',
    cellClass: 'flex dt-meta',
    valueGetter: (params: ValueGetterParams<ICommonTransactionTableData>) => {
      if (params?.data?.transfer_type === 'CHECK') {
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
    width: 150,
    maxWidth:300,
    resizable: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    floatingFilterComponentParams: {
      table: 'payment_table'
    },
    cellRenderer: 'v4StatusComponent',
    cellStyle: {
      display: 'flex',
      'align-items': 'center'
    },
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
        isApprovalPolicyEnabledUser: this.isApprovalPolicyEnabledUser,
        onPayButtonClick: (rowData: ICommonTransactionTableData) => {
          this.isFieldInvalid = this.checkValidation(rowData);
          if (
            rowData?.third_party_name !== null &&
            rowData?.source?.name === ''
          ) {
            this.alertService.warningAlert({
              title: 'Error',
              content: 'Please map the bank account for further processing.',
              doneMsg: 'Ok'
            });
            return;
          }

          if (!this.isFieldInvalid) {
            this.router.navigate(
              [`/v4/manage/payments/edit/${rowData.uu_id}`],
              { state: { backUrl: this.router.url } }
            );
          } else {
            this.alertService.warningAlert({
              content: `Please select a ${this.invalidField} for payment`
            });
          }
        }
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
    cellRenderer: 'v4DescriptionComponent'
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
    minWidth: 120,
    maxWidth: 180,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'payment_table'
    },
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'v4CreatedByComponent'
  };

  colDefReferenceId = {
    headerName: 'Reference ID',
    field: 'reference_no',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    maxWidth: 150,
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
        <span style="${style}">${params.value !== null ? params.value : ''}</span>
      `;
    }
  };

  colDefCreatedTime = {
    headerName: 'Updated Date',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4UpdatedAtComponent',
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
    minWidth: 130,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent',
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
        showApproveRejectOptions: this.reprintRequestedTotalCount > 0,
        onViewClick: (data: ICommonTransactionTableData) => {
          this.detailPanelService.open(data, PANEL_BACKDROP_Z);
        }
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
      this.colDefViewButton,
      this.colDefPayee,
      this.colDefAmount,
      this.colDefSource,
      this.colDefCreatedBy,
      this.colDefDescription,
      this.colDefReferenceId,
      this.colDefCreatedAtTime,
      this.colDefPayMethod,
      this.colDefCreatedTime,
      this.colDefMailedAddress,
      this.colDefTransferMode,
      this.colDefStatus
    ];

    if (plugins && !plugins.includes('enterprise-maf')) {
      return columnDefs.filter((col) => col !== this.colDefMailedAddress);
    }

    // Add position column only when enterprise-bryancohen plugin is enabled
    if (plugins && plugins.includes('enterprise-bryancohen')) {
      columnDefs.splice(8, 0, this.colDefPosition); // Insert after Reference ID
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
        id: 'source_name',
        name: 'Source',
        isDisabled: false,
        colDef: this.colDefSource,
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
        id: 'description',
        name: 'Memo',
        isDisabled: false,
        colDef: this.colDefDescription,
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
        id: 'created_at',
        name: 'Created Date',
        isDisabled: false,
        colDef: this.colDefCreatedAtTime,
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

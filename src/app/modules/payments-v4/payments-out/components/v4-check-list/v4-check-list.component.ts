import { faCircleInfo, faPrint } from '@fortawesome/pro-regular-svg-icons';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColDef, GridApi, ICellRendererParams } from '@ag-grid-community/core';
import {
  EMPTY,
  of,
  Subscription,
  firstValueFrom,
  from,
  throwError
} from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  mergeMap,
  take,
  tap,
  debounceTime
} from 'rxjs/operators';
import {
  NgIf,
  NgClass,
  NgFor,
  DatePipe,
  NgTemplateOutlet
} from '@angular/common';
import { environment } from 'src/environments/environment';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NpsService } from 'src/app/shared/service/nps/nps.service';
import {
  IConfirmAlert,
  IFailedAlert,
  IInfoAlert,
  ISuccessAlert
} from 'src/app/models/alert';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-thirdparty-import-main-modal/v4-thirdparty-import-main-modal.component';
import { V4CheckReconciliationModalComponent } from 'src/app/shared/modal/v4-check-reconciliation/v4-check-reconciliation-modal.component';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import {
  IV3DtHeaderElements,
  IV3CommonButton
} from 'src/app/modules/v3-data-table/models/v3-data-table';
import {
  ICoulmnDefFields,
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { ScriptService } from 'src/app/core/services/script.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { IApprovalRequest, IUserVerification } from 'src/app/models/user';
import { PendingCheckApprovalsV4Component } from 'src/app/modules/user-management-v4/v4-modals/pending-check-approvals-v4/pending-check-approvals-v4.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { IApiRes } from 'src/app/models/api';
import {
  faArrowDownToLine,
  faUpToLine,
  faEllipsisV,
  faInfo,
  faMoneyCheck,
  faFileMagnifyingGlass
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';

import { V4WarningAlertComponent } from 'src/app/shared/alert/v4-components/v4-warning-alert/v4-warning-alert.component';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4BankNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-check-list/cell-renderers/v4-bank-name/v4-bank-name.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V4CreatedByComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-by/v4-created-by.component';
import { V4DescriptionComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-description/v4-description.component';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { VirtualAccountConfirmationModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/virtual-account-confirmation-modal-v4/virtual-account-confirmation-modal-v4.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/app-state.model';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { CheckTableList } from 'src/app/modules/check/components/methods/check-methods';
import { CustomCheckExportErrorAlertV4Component } from 'src/app/modules/payments-v4/shared/modals/custom-check-export-error-alert-v4/custom-check-export-error-alert-v4.component';
import {
  ICheckEmailData,
  ICheckListTableRowData,
  ICheckShipingTypes,
  ICheckStatus,
  IChequedata,
  IMailCheck,
  IShipingCheckPaperType,
  IShippingCostCalculation,
  IShippingType
} from 'src/app/modules/check/model/check';
import { V4CheckActivityModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-activity-modal/v4-check-activity-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { CheckEmailModalV4Component } from 'src/app/modules/check/modal/check-email-modal-v4/check-email-modal-v4.component';
import { CheckPrintAdModalComponent } from 'src/app/modules/check/modal/check-print-ad-modal/check-print-ad-modal.component';
import { DirectDepositV4Component } from 'src/app/modules/check/modal/direct-deposit-v4/direct-deposit-v4.component';
import { CheckMailModalV4Component } from 'src/app/modules/check/modal/mail-modals/check-mail-modal-v4/check-mail-modal.component-v4';
import { VerifySignatureModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/verify-signature-modal-v4/verify-signature-modal-v4.component';
import { CheckProcessModalV4Component } from 'src/app/modules/check/modal/process-modal/check-process-modal-v4/check-process-modal-v4.component';
import { V4CheckNumberComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-check-list/cell-renderers/v4-check-number/v4-check-number.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4BankDropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-bank-dropdown-floating-filter/v4-bank-dropdown-floating-filter.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import {
  SendPaymentMode
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import {
  V4SelectDropdownComponent,
  IV4SelectOption
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { V4GroupMailingListComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-group-mailing-list/v4-group-mailing-list.component';
import {
  NEW_CHECK_PAYMENT_OPTIONS,
  V4CheckStatusComponent
} from './cell-renderers/v4-check-status/v4-check-status.component';
import { V4CheckActionComponent } from './cell-renderers/v4-check-action/v4-check-action.component';
import { V4EditFieldComponent } from '../v4-payments-table/cell-renderers/v4-edit-field/v4-edit-field.component';

interface ICheckBoxInterface {
  value: string | number;
  name: string;
}
interface ICheckApprove {
  isPending: number;
  isApprovedForMail: number;
}
@Component({
  selector: 'app-v4-check-list',
  templateUrl: './v4-check-list.component.html',
  styleUrls: ['./v4-check-list.component.scss'],
  standalone: true,
  imports: [
    DemoVideoComponent,
    NgIf,
    MatTooltip,
    NgClass,
    NgFor,
    FormsModule,
    V4DataTableComponent,
    FontAwesomeModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    V3DataTableModule,
    V4SelectDropdownComponent,
    CommonButtonV4Component,
    CommonTabV4Component,
    NgTemplateOutlet,
    V4GroupMailingListComponent
  ]
})
export class V4CheckListComponent implements OnInit, OnDestroy {
  // DATA TABLE VARAIBLES
  public columnDefs!: ICoulmnDefFields[] | null;
  public columnFields: IDtColumnFields[];
  public headerElements: IV3DtHeaderElements;
  /** Set from the header: this account is not offered Direct Deposit. */
  public hidesDirectDeposit = false;
  public tableId: TTableIdValues = DTTableId.check; // Data Table Id
  public v3DataTableService = inject(V3DataTableService);
  @ViewChild(V4DataTableComponent) dataTable?: V4DataTableComponent;

  public frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    v4CheckActionComponent: V4CheckActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    bankAccountComponent: V4BankDropdownFloatingFilterComponent,
    payeeListComponent: V4PayeeMultiSelectFloatingFilterComponent,
    v4CheckStatusComponent: V4CheckStatusComponent,
    dtCellFilterComponent: V4PayeeNameComponent,
    v4BankNameComponent: V4BankNameComponent,
    dtEditFieldComponent: V4EditFieldComponent,
    v3DescriptionComponent: V4DescriptionComponent,
    v3CreatedByComponent: V4CreatedByComponent,
    V3DTCommonFilterComponent: V4DTCommonFilterComponent,
    V3DTCheckNumberComponent: V4CheckNumberComponent,
    v4CreatedAtComponent: V4CreatedAtComponent
  };

  // --------------------------------------->
  FloatingFilterComponent: IDtFloatingFilterProp;
  cellRenderer: IDtCellrendererBtn;
  actionComponentProp: IDtActionCompProp;
  selectedRow: ICheckListTableRowData[];
  subscriptions: Subscription[] = [];
  checkStatus: ICheckBoxInterface[] = [];
  cellRendererCheckStatus: Record<string, ICheckStatus> = {};
  checkImported = false;
  disabled = false;
  checkApproveRjctCurrentData: ICheckApprove;
  checkApprovedForMail = 0;
  isQucikBookConnected = 0;
  rooturl = environment.rootUrl;
  pendingChecks: number;
  loading: boolean;
  bankAccountId: string;
  checkNo: string;
  isHamaspik = false;
  isMultiLevelPluginEnabled = false;
  pendingApprovals: IApprovalRequest;
  exportOptions: string[] = [];
  isShowExportList = false;
  isVerifiedChecksPluginEnabled = signal(false);
  isChaseAccountPending = false;
  /** Pending New-check row loader, cleared when the print flow finalizes. */
  private newCheckOptionDone?: () => void;
  private detailPanelService = inject(V4DetailPanelService);

  faUpToLine = faUpToLine;
  faArrowDownToLine = faArrowDownToLine;
  faEllipsisV = faEllipsisV;
  faInfo = faInfo;
  faCircleInfo = faCircleInfo;
  faPrint = faPrint;
  faMoneyCheck = faMoneyCheck;
  faFileMagnifyGlass = faFileMagnifyingGlass;

  @Input() isFromPaymentsV3 = false;

  selectedCheckPaperType = '1';
  checkDesignTemplate: IV4SelectOption[] = [
    { id: '1', value: '1', name: 'Print Check On Top' },
    { id: '2', value: '2', name: 'Print Check On Middle' },
    { id: '3', value: '3', name: 'Print Check On Bottom' },
    { id: '4', value: '4', name: 'Three Per Page' },
    { id: '5', value: '5', name: 'Wallet Size' }
  ];

  defaultCheckListTab = 'id_all';
  readonly SCHEDULED_CHECK_STATUS = '50';
  checkSubTabs = signal<ITabItem[]>([]);
  activeCheckTab = signal('id_all');
  /** Group Mailings sub-tab is open: its table replaces the check table in this layout. */
  isGroupMailingsActive = signal(false);
  /** Check sub-tab whose filter must be applied once the re-created check grid is ready. */
  private pendingCheckTabId: string | null = null;
  /** True once /checks/user-tabs has resolved (controls the skeleton fallback). */
  subTabsLoaded = signal(false);
  /** Placeholder pill widths (px) shown while the sub-tab config loads on a first visit. */
  readonly subTabSkeletonWidths = [58, 52, 62, 40, 50, 80, 110];
  /** User-dismissed the pending-approvals warning label for this view. */
  panelBtnsMap: { [x: string]: string } = {
    1: 'id_all',
    2: 'id_new',
    4: 'id_mailed',
    6: 'id_imported',
    7: 'id_blank',
    8: 'id_void',
    9: 'id_posted',
    10: 'id_un-posted',
    11: 'id_dd',
    12: 'id_sheduled'
  };

  checkdata: {
    errorMsg: string;
    chequedata: IChequedata;
    shipping: ICheckShipingTypes[];
    paper: IShipingCheckPaperType[];
  };

  err_msg: string;
  errorCode: number;
  ShippingCostRes: IShippingCostCalculation;
  checkDetails: string | IMailCheck[];
  checkAmount: number;

  idlist = {
    mail_type: 1,
    check_paper: 7,
    informed_payee_sms: 0,
    informed_payee_email: 0,
    payee_phone: '',
    payee_email: ''
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caldata: any = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 3
  };

  isPushBackEnable: boolean;
  loadingpush: boolean;

  isUserAchVerified: number;
  totalCheckSum: number = 0;
  totalCheckSumLoading: boolean = false;

  backUrl: string = '/manage/dashboard' as const;
  urlBackState = { backUrl: 'checklist' };

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['action', 'id']
  };

  isQucikBookDesktopConnected = 0;
  isQBDPushBackEnabled = false;
  chequeStatus: number;
  isIndiaBazaarEnabled = false;
  isLegalEnabled = false;

  isFreshBooksConnected = 0;
  isFreshBooksPushBackEnabled = 0;

  isNetSuiteushBackEnabled = false;
  isNetSuiteConnected = false;
  faExport = faUpToLine;
  whiteLabelPayeeName =
    environment.env_id === 'compass' ? 'Print On Check As' : 'Payee';

  whiteLabelPayeeHeaderName =
    environment.env_id === 'compass' ? 'Print On Check As' : 'Payee';

  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private checkService = inject(CheckService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private userManagementService = inject(UserManagementService);
  private recurringRedirect = inject(RecurringRedirectService);
  private npsService = inject(NpsService);
  private integrationService = inject(IntegrationService);
  private scriptService = inject(ScriptService);
  private userService = inject(UserService);
  private localStorageService = inject(LocalStorageService);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private paymentService = inject(PaymentsService);

  private commonOnInitService = inject(CommonOnInitService);
  private v3BulkPaymentService = inject(V3BulkPaymentService);
  private layoutService = inject(LayoutService);
  private datePipe = inject(DatePipe);
  private paymentsV4Service = inject(PaymentsV4Service);
  private store = inject(Store<IAppState>);

  @Output() totalCheckSumChange = new EventEmitter<number>();
  @Output() recurringClick = new EventEmitter<void>();

  constructor() {
    // HEADER ELEMENTS PROPERTIES
    this.headerElements = {
      buttons: (environment.env_id === 'compass'
        ? [
            {
              text: 'Print',
              id: 'print_parent',
              lucideIcon: 'printer',
              floatingBarVariant: 'filled-primary',
              toolTip: 'Print',
              menu: [{ id: 'id_printCheck', name: 'Print on Check Paper' }]
            },
            {
              text: 'Print-Check Paper',
              id: 'id_printCheck',
              lucideIcon: 'printer',
              floatingBarVariant: 'filled-primary',
              toolTip: 'Print your checks on blank check paper.'
            },
            {
              text: 'Mail',
              id: 'id_mail',
              lucideIcon: 'mail',
              floatingBarVariant: 'filled-primary',
              toolTip: 'Mail your checks via USPS or FedEx.'
            },
            {
              text: 'Email',
              id: 'id_email',
              lucideIcon: 'mail',
              floatingBarVariant: 'primary',
              toolTip:
                'E-Mail one time printable PDF Check to your payee directly'
            },
            {
              text: 'Mark as Posted',
              id: 'id_mark_as_cleared',
              lucideIcon: 'circle-check',
              floatingBarVariant: 'filled-success',
              barGroup: 2,
              toolTip:
                'Mark as posted will clear the check from your bank account'
            },
            {
              text: 'Void',
              id: 'id_btnVoid',
              lucideIcon: 'ban',
              floatingBarVariant: 'danger-soft',
              barGroup: 2,
              toolTip: 'Void your check.'
            },
            {
              text: 'Delete',
              id: 'id_btnTrash',
              lucideIcon: 'trash-2',
              floatingBarVariant: 'filled-danger',
              barGroup: 2,
              toolTip: 'Delete your check.'
            }
          ]
        : [
            {
              text: 'Print',
              id: 'print_parent',
              lucideIcon: 'printer',
              floatingBarVariant: 'filled-primary',
              toolTip: 'Print',
              menu: [
                { id: 'id_printCheck', name: 'Print on Check Paper' },
                { id: 'id_printCheck_white', name: 'Print on White Paper' }
              ]
            },
            {
              text: 'Send',
              id: 'send_parent',
              lucideIcon: 'send',
              floatingBarVariant: 'primary',
              toolTip: 'Send',
              menu: [
                { id: 'id_mail', name: 'Mail' },
                { id: 'id_email', name: 'Email' }
              ]
            },
            {
              text: 'ACH / Direct Deposit',
              id: 'id_direct_deposit',
              lucideIcon: 'landmark',
              floatingBarVariant: 'filled-primary',
              toolTip: 'Direct Deposit.'
            },
            {
              text: 'Process',
              id: 'id_processPayment',
              lucideIcon: 'circle-play',
              floatingBarVariant: 'outline-violet',
              toolTip:
                'This will process the check through the default payment method of the payee.'
            },
            {
              text: 'Mark as Posted',
              id: 'id_mark_as_cleared',
              lucideIcon: 'circle-check',
              floatingBarVariant: 'filled-success',
              barGroup: 2,
              toolTip:
                'Mark as posted will clear the check from your bank account'
            },
            {
              text: 'Void',
              id: 'id_btnVoid',
              lucideIcon: 'ban',
              floatingBarVariant: 'danger-soft',
              barGroup: 2,
              toolTip: 'Void your check.'
            },
            {
              text: 'Delete',
              id: 'id_btnTrash',
              lucideIcon: 'trash-2',
              floatingBarVariant: 'filled-danger',
              barGroup: 2,
              toolTip: 'Delete your check.'
            }
          ]) as IV3CommonButton[],
      videoButton: [{ slug: 'check' }]
    };

    // FILTER CUSTOM COMPONENTS
    this.FloatingFilterComponent = CheckTableList.floatingFilterCompProp();

    // CELL RENDERER COMPONENT
    this.cellRenderer = CheckTableList.cellRendererActionBtn();

    // ACTION COMPONENT PROPERTIES
    this.actionComponentProp = {
      actionButton: true,
      eyeButton: true,
      cardButton: true
    };

    // Register action component config so V4DtActionComponent can read its button mode
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );

    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.columnDefs = this.setColumnDefs(environment.env_id, userPlugins);
    this.filterColumnFields(userPlugins);
  }

  /**
   * @description Sets the column definitions for the ag-Grid based on the provided environment ID.
   *
   * @param {string} envId - The environment ID.
   * @returns {typeof this.columnDefs} The filtered column definitions array.
   */
  setColumnDefs(envId: string, userPlugins?: string[]): typeof this.columnDefs {
    const columnDefs = [
      this.colDefId,
      this.colDefAction,
      this.colDefStatus,
      this.colDefAmount,
      this.colDefVendorId,
      this.colDefPayee,
      this.colDefNickName,
      this.colDefBank,
      this.colDefCheckNo,
      this.colDefDate,
      this.colDefCreatedAt,
      this.colDefBy,
      this.colDefPayMethod,
      this.colDefMemo,
      this.colDefNote,
      this.colDefCategory,
      this.colDefPayeeAcNo,
      this.colDefInvoiceNo
    ];

    if (envId !== 'compass') {
      return columnDefs.filter(
        (col) => col !== this.colDefVendorId
      ) as ICoulmnDefFields[];
    }
    // Add position column only when enterprise-bryancohen plugin is enabled
    if (userPlugins && userPlugins.includes('enterprise-bryancohen')) {
      columnDefs.splice(4, 0, this.colDefPosition); // Insert after Reference ID
    }
    return columnDefs as ICoulmnDefFields[];
  }

  // CONSTRUCTOR END
  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.fetchHeaderData();
    this.NpsLoginCredAPI();
    this.getCheckStatus();
    this.getCheckListData();
    this.getCheckPaperType();
    this.shippingType();
    this.paperType();
    this.getHeaderFilters();
    this.checkIfAchVerifiedUser();
    this.dataTableService.destroyPayload = true;
    this.subscribeToFilterChanges();
    this.subscriptions.push(
      this.dataTableService.getRefreshStatus().subscribe((res) => {
        if (res.status && this.isIndiaBazaarEnabled) {
          this.getTotalCheckSum();
        }
        // Covers the first load, where the filter is applied before the grid is ready
        this.syncScheduledDateColumn();
      })
    );
    this.subscriptions.push(
      this.checkService.getTotalCheckSumUpdates().subscribe((total) => {
        if (total !== null) {
          this.totalCheckSum = total;
          this.totalCheckSumChange.emit(this.totalCheckSum);
        }
      })
    );
  }

  private setFilterPayload(filterValue: string): ISelectBoxFilterArray {
    const selectBoxFilterValues: ISelectBoxFilterValues = {
      filter: filterValue,
      filterType: 'text',
      type: 'equals'
    };
    return {
      'cheques.cheque_status': { ...selectBoxFilterValues }
    };
  }

  private setButtonState(
    btnId: string,
    state: { loading?: boolean; disabled?: boolean }
  ): void {
    this.headerElements = {
      ...this.headerElements,
      buttons: this.headerElements.buttons?.map((btn) =>
        btn.id === btnId ? { ...btn, ...state } : btn
      )
    };
  }

  fetchHeaderData() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes('enterprise-hamaspik-check-import')) {
            this.isHamaspik = true;
          }
          if (res.enabledPlugins.includes('enterprise-steno-agency')) {
            this.isMultiLevelPluginEnabled = true;
            this.v3PaymentsTableService.isMultiLevelPluginEnabled = true;
            this.getApprovalRequiredList();
          }
          if (res.personalInfo?.isLegalEnabled === '1') {
            this.isLegalEnabled = true;
            this.enableLegalCheckTemplate();
          }
          if (res.enabledPlugins.includes('cleared-checks-import')) {
            this.isVerifiedChecksPluginEnabled.set(true);
          }
          if (res.enabledPlugins.includes('india-bazaar')) {
            this.isIndiaBazaarEnabled = true;
            this.getTotalCheckSum();
          }
          if (res.enabledPlugins.includes('qb-auto-sub-account-mapping')) {
            if (this.headerElements.buttons) {
              this.headerElements.buttons.push({
                text: 'Print Mailed Preview',
                id: 'id_print_mailed_preview',
                lucideIcon: 'printer',
                floatingBarVariant: 'primary',
                toolTip: 'Print preview for mailed checks'
              });
            }
          }
          if (res.isRegisteredAfterV2Launch === 1) {
            this.hidesDirectDeposit = true;
            this.headerElements = {
              ...this.headerElements,
              buttons: this.headerElements.buttons?.filter(
                (btn) => btn.id !== 'id_direct_deposit'
              )
            };
          }
        }
      })
    );
  }

  enableLegalCheckTemplate() {
    this.checkDesignTemplate.push(
      { id: '100', value: '100', name: 'Legal-Check On Top' },
      { id: '101', value: '101', name: 'Legal-Check On Middle' }
    );
  }

  checkIfAchVerifiedUser(): void {
    this.isUserAchVerified = this.localStorageService.getItem('achEnabled');
    this.subscriptions.push(
      this.userService.achEnabledUser$.subscribe((r) => {
        this.isUserAchVerified = r;
      })
    );
  }

  // NPS Modal API
  NpsLoginCredAPI() {
    this.subscriptions.push(
      this.companySwitchRepo.showIntroModals().subscribe((resp) => {
        const result = resp.data;
        if (result.showNpsModal === 1) {
          this.localStorageService.removeItem('NpsRemind');
          this.npsService.setNPSVal(true);
        } else {
          this.localStorageService.removeItem('NPSVal');
          this.npsService.setNPSVal(false);
        }
      })
    );
  }

  /** Active account id used to scope the cached sub-tabs (map keyed by company). */
  private get activeCompanyId(): string {
    return this.localStorageService.getItem('activeCompanyId') || 'default';
  }

  /** Paint the sub-tab pills immediately from the last cached /checks/user-tabs result. */
  private loadCachedSubTabs(): void {
    const all = this.localStorageService.getItem('v4CheckSubTabs') || {};
    const cached = all[this.activeCompanyId];
    if (cached?.tabs?.length) {
      this.checkSubTabs.set(cached.tabs);
      if (cached.defaultTab) {
        this.activeCheckTab.set(cached.defaultTab);
      }
    }
  }

  /** Persist this account's sub-tab config for an instant paint on the next visit. */
  private cacheSubTabs(tabs: ITabItem[], defaultTab: string): void {
    const all = this.localStorageService.getItem('v4CheckSubTabs') || {};
    all[this.activeCompanyId] = { tabs, defaultTab };
    this.localStorageService.setItem('v4CheckSubTabs', all);
  }

  getHeaderFilters() {
    // Instant paint from cache; the API below reconciles + refreshes the cache.
    this.loadCachedSubTabs();
    this.subscriptions.push(
      this.checkService.getCheckListTabs().subscribe({
        next: (data) => {
          if (data?.success) {
            const defaultTab =
              this.panelBtnsMap[data.data?.defaultCheckListTab as keyof object];
            this.defaultCheckListTab = defaultTab;
            // The pills paint from cache first, so the user may already have opened
            // Group Mailings before this resolves — don't pull them back to the default tab.
            if (!this.isGroupMailingsActive()) {
              this.activeCheckTab.set(defaultTab);
              this.onHeaderBtn({ id: defaultTab });
            }

            const tabs: ITabItem[] = [];
            if (data.data?.tabOrder?.length) {
              data.data.tabOrder.forEach((item) => {
                const name = data.data.tabList[item];
                tabs.push({
                  label: name,
                  value: this.panelBtnsMap[item as unknown as keyof object]
                });
              });
            }
            tabs.push({ label: 'Recurring', value: 'id_recurring' });
            tabs.push({ label: 'Group Mailings', value: 'id_groupMailings' });
            this.checkSubTabs.set(tabs);
            this.cacheSubTabs(tabs, defaultTab);
          }
          this.subTabsLoaded.set(true);
        },
        error: () => this.subTabsLoaded.set(true)
      })
    );
  }

  onCheckTabChange(value: string): void {
    const wasGroupMailings = this.isGroupMailingsActive();
    this.activeCheckTab.set(value);

    if (value === 'id_groupMailings') {
      this.showGroupMailings();
      return;
    }

    // Recurring hands the view over to the parent tab, so this component is torn
    // down anyway and the check table never has to come back.
    if (wasGroupMailings && value !== 'id_recurring') {
      // Coming back from the group mailing table, which owns the shared data-table
      // config; restore ours and let the re-created grid apply the tab filter.
      this.restoreCheckTable(value);
      return;
    }

    this.onHeaderBtn({ id: value });
  }

  /** Swap the check table for the group mailing table without leaving the page. */
  private showGroupMailings(): void {
    this.pendingCheckTabId = null;
    this.isGroupMailingsActive.set(true);
  }

  /**
   * Bring the check table back after the group mailing table was shown. The shared
   * `DataTableService` / `V3DataTableService` state is table-scoped, so re-register the
   * check configuration and drop the group mailing payload before rendering the grid.
   */
  private restoreCheckTable(tabId: string): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.initialSelectBoxFilter = undefined;
    this.v3DataTableService.resetV3DataTablePayload();
    this.pendingCheckTabId = tabId;
    this.isGroupMailingsActive.set(false);
  }

  /**
   * The check grid is re-created when returning from Group Mailings. `v4-data-table`
   * emits `gridReadyOutput` just before it subscribes to the filter streams, so the
   * pending tab filter is applied on the next tick to make sure it is not missed.
   */
  onCheckGridReady(): void {
    if (!this.pendingCheckTabId) return;
    const tabId = this.pendingCheckTabId;
    this.pendingCheckTabId = null;
    setTimeout(() => this.onHeaderBtn({ id: tabId }));
  }

  // Load Check Status
  getCheckStatus(): void {
    if (this.localStorageService.getItem('check_status')) {
      // get status from local storage
      const status = this.localStorageService.getItem('check_status');
      this.cellRendererCheckStatus = status;
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

  // To know Check Approve Reject Data Exist or Not
  getCheckListData() {
    this.checkService.getCheckListData().subscribe(async (res) => {
      if (res?.success) {
        this.checkApproveRjctCurrentData = res.data;
        this.checkApprovedForMail = res.data?.isApprovedForMail;
        this.isQucikBookConnected = res.data?.isQucikBookConnected;
        this.isPushBackEnable =
          !!res.data?.isPushBackEnabled?.is_push_back_enable;
        this.pendingChecks = res.data.checkApprovalTotalCount;
        this.setPendingApprovalBadge();
        this.isQucikBookDesktopConnected =
          res.data?.isQucikBookDesktopConnected;
        this.isQBDPushBackEnabled = !!res.data?.isQBDPushBackEnabled;
        this.isNetSuiteConnected = !!res.data?.isNetsuiteConnected;
        this.isNetSuiteushBackEnabled = !!res.data?.isNetsuitePushBackEnabled;
        this.isFreshBooksConnected = res.data?.isFreshBooksConnected;
        this.isFreshBooksPushBackEnabled =
          res.data?.isFreshBooksPushBackEnabled;

        if (this.isQucikBookConnected && this.isPushBackEnable) {
          this.exportOptions.push('quickbookOnline');
        }
        if (this.isQucikBookDesktopConnected && this.isQBDPushBackEnabled) {
          this.exportOptions.push('quickbookDesktop');
        }
        if (this.isNetSuiteushBackEnabled && this.isNetSuiteConnected) {
          this.exportOptions.push('netsuit');
        }
        if (this.exportOptions.length > 1) {
          this.isShowExportList = true;
        }

        if (res.data.isPending === 1) {
          if (
            this.headerElements.buttons?.find(
              (e: { id?: string }) => e?.id === 'id_approve'
            )
          )
            return;
          if (this.isHamaspik) return;

          if (this.headerElements.buttons) {
            this.headerElements.buttons.push(
              {
                id: 'id_approve',
                text: 'Approve',
                floatingBarVariant: 'filled-success',
                barGroup: 3,
                toolTip: 'Approve Selected Item'
              },
              {
                id: 'id_reject',
                text: 'Reject',
                floatingBarVariant: 'danger-soft',
                barGroup: 3,
                toolTip: 'Reject Selected Item'
              }
            );
          }
        } else {
          const hideArr = (
            await firstValueFrom(this.dataTableService.isDisable)
          ).selectedIds;
          this.disabledActions([...hideArr, 'RId_approve', 'RId_reject']);
          this.headerElements.buttons?.forEach((el, index: number) => {
            if (el?.id === 'id_approve') {
              this.headerElements.buttons?.splice(index, 2);
            }
          });
        }
      }
    });
  }

  // Load Default Check Paper Type
  getCheckPaperType(): void {
    this.subscriptions.push(
      this.checkService.getCheckPaperType().subscribe((res) => {
        if (res?.success) {
          if (!res?.data?.paperType) {
            this.onCheckDesignTemplate('1');
            this.selectedCheckPaperType = '1';
          } else {
            this.selectedCheckPaperType = res?.data?.paperType;
          }
        }
      })
    );
  }

  // FIND WHICH HEADER BUTTON IS CLICKED
  onHeaderBtn(event: {
    id?: string;
    selectedRows?: ICheckListTableRowData[];
  }): void {
    const { selectedRows } = event;

    switch (event?.id) {
      case 'btn_pending_approval_info':
        this.openPendingRequestApprovalModal();
        break;
      case 'btn_check_approval_filter':
        // The v4 status filter only reacts when the field id matches its column.
        this.dataTableService.setMainFilter(
          'userapprovalstatus',
          'cheques.cheque_status'
        );
        break;
      // panel Filters
      case 'id_all':
        this.v3DataTableService.updateV3DataTableByRemovingFilter = [
          'cheques.cheque_status'
        ];
        break;
      case 'id_new':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('0');
        break;
      case 'id_mailed':
        this.v3DataTableService.updateV3DataTable =
          this.setFilterPayload('show_all_mailed');
        break;
      case 'id_imported':
        this.v3DataTableService.updateV3DataTable =
          this.setFilterPayload('third_party');
        break;
      case 'id_blank':
        this.v3DataTableService.updateV3DataTable =
          this.setFilterPayload('show_blank');
        break;
      case 'id_void':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('2');
        break;
      case 'id_posted':
        this.v3DataTableService.updateV3DataTable =
          this.setFilterPayload('show_posted');
        break;
      case 'id_un-posted':
        this.v3DataTableService.updateV3DataTable =
          this.setFilterPayload('show_un_posted');
        break;
      case 'id_dd':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('dd');
        break;
      case 'id_sheduled':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('50');
        break;
      case 'id_recurring':
        this.redirectToCheckRecurring();
        break;
      case 'id_groupMailings':
        this.openGroupMailings();
        break;

      // Buttons

      case 'id_btnNew':
        this.onNewCheck();
        break;
      case 'id_quickpay':
        this.onQuickPay();
        break;
      case 'id_printCheck':
        this.checkVerificationAndExecute(() =>
          this.onMultiPrintCheck(
            selectedRows as ICheckListTableRowData[],
            'check'
          )
        );
        break;
      case 'id_printCheck_white':
        this.checkVerificationAndExecute(() =>
          this.onMultiPrintCheck(
            selectedRows as ICheckListTableRowData[],
            'white_paper'
          )
        );
        break;
      case 'id_mail':
        this.checkVerificationAndExecute(() =>
          this.onMultiMail(selectedRows as ICheckListTableRowData[])
        );
        break;
      case 'id_email':
        this.checkVerificationAndExecute(() =>
          this.onMultiEmail(selectedRows as ICheckListTableRowData[])
        );
        break;
      case 'id_direct_deposit':
        this.checkVerificationAndExecute(() =>
          this.openDirectDepositModal(selectedRows as ICheckListTableRowData[])
        );
        break;
      case 'id_btnVoid':
        this.onVoidMultipleCheck(selectedRows as ICheckListTableRowData[]);
        break;
      case 'id_btnTrash':
        this.onDeleteMultipleChecks(selectedRows as ICheckListTableRowData[]);
        break;
      case 'id_mark_as_cleared':
        this.onMarkAsClearedCheck(selectedRows as ICheckListTableRowData[]);
        break;
      case 'id_approve':
        this.onApproveCheck(selectedRows as ICheckListTableRowData[], true);
        break;
      case 'id_reject':
        this.onRejectCheck(selectedRows as ICheckListTableRowData[], true);
        break;
      case 'id_print_mailed_preview':
        this.goToBulkPrintPreviewChecks();
        break;
      case 'id_processPayment':
        this.onProcessMultipleCheck();
        break;
      default:
        break;
    }
  }

  /**
   * New-check Print menu picked an option. Confirms first, then hands the row
   * to the matching bulk-toolbar flow via onHeaderBtn.
   */
  private onNewCheckOption(
    row: ICheckListTableRowData,
    optionId: string,
    done: () => void
  ): void {
    const optionName =
      NEW_CHECK_PAYMENT_OPTIONS.find((opt) => opt.id === optionId)?.name ?? '';

    this.alertService
      .confirmAlert({
        title: 'Confirm',
        content: `Are you sure you want to continue with "${optionName}" for this check?`,
        doneMsg: 'Yes, Continue'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          done();
          return;
        }
        // The process* handlers read this.selectedRow for the unmapped-bank guard.
        this.selectedRow = [row];
        this.onHeaderBtn({ id: optionId, selectedRows: [row] });
        this.clearNewCheckLoaderWhenSettled(done);
      });
  }

  /**
   * The onHeaderBtn flows are void, so the row loader's end is inferred: the
   * loader covers the wait up to the delivery-method modal, so it stops the
   * moment a modal appears. Mail / Email / ACH fetch first and open theirs in
   * the response callback, hence the wait on the next `afterOpened`. Print has
   * no modal — its finalize calls finishNewCheckOption instead.
   * ponytail: approximation — replace with a real completion signal if the
   * multi-check flows ever expose one.
   */
  private clearNewCheckLoaderWhenSettled(done: () => void): void {
    if (this.dialog.openDialogs.length) {
      done();
      return;
    }
    const openedSub = this.dialog.afterOpened.pipe(take(1)).subscribe(() => {
      this.newCheckOptionDone = undefined;
      done();
    });
    this.subscriptions.push(openedSub);
    // Print settles without a modal — drop the pending wait when it finishes.
    this.newCheckOptionDone = () => {
      openedSub.unsubscribe();
      done();
    };
  }

  /** Stops the New-check row loader once the print flow settles. */
  private finishNewCheckOption(): void {
    this.newCheckOptionDone?.();
    this.newCheckOptionDone = undefined;
  }

  // FIND WHICH CELL ACTION BUTTON IS CLICKED
  onCellActionbtn(event: {
    selectedRow: ICheckListTableRowData;
    id: string;
  }): void {
    const selectedItem = event?.selectedRow;
    this.setActionButtonDisable(selectedItem);
    this.setActionButtonHide(selectedItem);
    switch (event?.id) {
      case 'RId_approve':
        this.onApproveCheck(selectedItem, false);
        break;
      case 'RId_reject':
        this.onRejectCheck(selectedItem, false);
        break;
      case 'RId_print':
        this.checkVerificationAndExecute(() =>
          this.onPrintSingleCheck(selectedItem)
        );
        break;
      case 'RId_edit':
        this.onEditCheck(selectedItem);
        break;
      case 'RId_void':
        this.onVoidSingleCheck(selectedItem);
        break;
      case 'RId_delete':
        this.onSingleDelete(selectedItem);
        break;
      case 'RId_activity':
        this.activityModal(selectedItem);
        break;
      case 'RId_commentCheck':
        this.openAddCommandModal(selectedItem?.id);
        break;
      case 'RId_clone':
        this.onCloneCheck(selectedItem);
        break;
      case 'RId_summary':
        this.onPayeeSummary(selectedItem);
        break;
      case 'RId_attachmentCheck':
        this.openAddAttachmentModal(selectedItem?.id);
        break;
      case 'RId_re_email':
        this.reEmailCheck(selectedItem?.id);
        break;
      case 'RId_forcefullyPrint':
        this.forcefullyPrinted(selectedItem);
        break;
      case 'RId_printReceipt':
        this.downloadProofOfPayment(selectedItem);
        break;
      case 'RId_card':
        this.payByCreditCard(selectedItem);
        break;
      default:
        break;
    }
  }

  handleCheckAction(row: ICheckListTableRowData, label: string): void {
    switch (label) {
      case 'Approve':
        this.onApproveCheck(row, false);
        break;
      case 'Reject':
        this.onRejectCheck(row, false);
        break;
      case 'Print':
        this.checkVerificationAndExecute(() => this.onPrintSingleCheck(row));
        break;
      case 'Edit':
        this.onEditCheck(row);
        break;
      case 'Void':
        this.onVoidSingleCheck(row);
        break;
      case 'Delete':
        this.onSingleDelete(row);
        break;
      case 'Pay by Credit Card':
        this.payByCreditCard(row);
        break;
      case 'Clone This Check':
        this.onCloneCheck(row);
        break;
      case 'Payee Summary':
      case 'Vendor Summary':
        this.onPayeeSummary(row);
        break;
      case 'Audit Activity':
        this.activityModal(row);
        break;
      case 'Add Comment':
        this.openV4AddCommentModal(row?.id);
        break;
      case 'Add Attachment':
        this.openV4AddAttachmentModal(row?.id);
        break;
      case 'Proof of Mail':
        this.downloadProofOfPayment(row);
        break;
      case 'Re-Email this Check':
        this.reEmailCheck(row?.id);
        break;
      case 'Mark as Forcefully Printed':
        this.forcefullyPrinted(row);
        break;
      default:
        break;
    }
  }

  // View Check Action Button
  onCellActionView(event: ISelectedSingleRow): void {
    const selectedItem = event.selectedRow;

    if (selectedItem) {
      this.dataTableService.destroyPayload = false;
      this.detailPanelService.openCheck(selectedItem as ICheckListTableRowData);
    }
  }

  // Imported Check row data action warning button click
  onImportedQuickBookDataAction(event: ISelectedSingleRow): void {
    const checkId = event.selectedRow?.action;
    if (event.selectedRow?.action) {
      this.router.navigate(['/v4/manage/cheque/create/'], {
        queryParams: { id: checkId },
        fragment: 'thirdparty=1'
      });
    }
  }

  // Hide Action Buttons
  setActionButtonHide(selectedItem: ICheckListTableRowData): void {
    if (!selectedItem) {
      return;
    }
    // -----------Approve and Reject-----------------
    const checkStatus = selectedItem?.cheque_status;

    if (checkStatus === 504) {
      if (this.cellRenderer.action.find((e) => e?.id === 'RId_forcefullyPrint'))
        return;
      this.cellRenderer.action.splice(3, 0, {
        name: 'Mark as Forcefully Printed',
        id: 'RId_forcefullyPrint',
        icon: 'fa fa-check'
      });
    } else {
      this.cellRenderer.action.forEach((el, index: number) => {
        if (el?.id === 'RId_forcefullyPrint')
          this.cellRenderer.action.splice(index, 1);
      });
    }
    if (checkStatus === 35 && !this.isHamaspik) {
      if (this.cellRenderer.action.find((e) => e?.id === 'RId_approve')) return;
      this.cellRenderer.action.unshift(
        {
          name: 'approve',
          id: 'RId_approve',
          icon: 'fa fa-check'
        },
        {
          name: 'Reject',
          id: 'RId_reject',
          icon: 'fa fa-ban'
        }
      );
    } else {
      this.cellRenderer.action.forEach((el, index: number) => {
        if (el?.id === 'RId_approve') this.cellRenderer.action.splice(index, 2);
      });
    }
    if (checkStatus >= 500 && checkStatus <= 506) {
      if (this.cellRenderer.action.find((e) => e?.id === 'RId_re_email'))
        return;
      this.cellRenderer.action.splice(3, 0, {
        name: 'Re-Email this Check',
        id: 'RId_re_email',
        icon: 'fa-solid fa-paper-plane'
      });
    } else {
      this.cellRenderer.action.forEach((el, index: number) => {
        if (el?.id === 'RId_re_email') {
          this.cellRenderer.action.splice(index, 1);
        }
      });
    }

    // -----------Payee Summary-----------------

    if (selectedItem) {
      if (!selectedItem.payee_id) {
        this.cellRenderer.action.forEach((el, index: number) => {
          if (el?.id === 'RId_summary') {
            this.cellRenderer.action.splice(index, 1);
          }
        });
      } else if (
        !this.cellRenderer.action.find((e) => e?.id === 'RId_summary')
      ) {
        let beforeIndex: number = -1; // Initialize with a default value
        this.cellRenderer.action.forEach((el, index: number) => {
          if (el?.id === 'RId_clone') {
            beforeIndex = index;
          }
        });

        if (beforeIndex !== -1) {
          // Check if beforeIndex was updated
          this.cellRenderer.action.splice(beforeIndex + 1, 0, {
            name: 'Payee Summary',
            id: 'RId_summary',
            icon: 'fa-solid fa-user'
          });
        }
      }
    }

    this.dataTableService.setCellRendererAction(this.cellRenderer.action);
  }

  // Disable Action Buttons
  async setActionButtonDisable(selectedItem: ICheckListTableRowData) {
    this.dataTableService.isDisable.next({ isDisable: false, selectedIds: [] });
    const actionList =
      this.cellRendererCheckStatus[selectedItem?.cheque_status];
    const hideArr = (await firstValueFrom(this.dataTableService.isDisable))
      .selectedIds;
    if (!actionList) return;

    if (
      actionList.isItPrintAble === 0 ||
      selectedItem.bank_account_nature_type === 2 ||
      selectedItem.create_check_from === 1
    ) {
      hideArr.push(' RId_print');
    } else {
      hideArr.push('');
    }

    if (actionList.isItEditAble === 0 || selectedItem.create_check_from === 1) {
      hideArr.push('RId_edit');
    } else {
      hideArr.push('');
    }
    if (actionList.isItVoidAble === 0 || selectedItem.create_check_from === 1) {
      hideArr.push('RId_void');
    } else {
      hideArr.push('');
    }

    if (
      actionList.isItDeleteAble === 0 ||
      selectedItem.create_check_from === 1
    ) {
      hideArr.push('RId_delete');
    } else {
      hideArr.push('');
    }

    if (selectedItem.create_check_from === 1) {
      hideArr.push('RId_clone');
    } else {
      hideArr.push('');
    }

    this.disabledActions(hideArr);
  }

  activityModal(selectedItem: ICheckListTableRowData): void {
    this.dialog.open(V4CheckActivityModalComponent, {
      width: '70%',
      height: '70vh',
      data: selectedItem.action,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  disabledActions(ids: string[]): void {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

  onRowSelected(event: { api: GridApi; type: string }): void {
    const gridApi = event.api; // all the data table params function get here

    this.selectedRow = gridApi.getSelectedRows();
  }

  // Check Design Template Select Box
  onCheckDesignTemplate(value: string): void {
    const templateType = value;
    this.subscriptions.push(
      this.checkService
        .postCheckPaperType({ paperType: templateType })
        .subscribe((res) => {
          if (res?.success) this.selectedCheckPaperType = templateType;
        })
    );
  }

  // New Check
  onNewCheck(): void {
    this.router.navigateByUrl('/v4/manage/cheque/create');
  }

  // Quick Pay
  onQuickPay(): void {
    this.router.navigate([`/v4/manage/payment-rail/make-payment`], {
      state: this.urlBackState
    });
  }

  onMultiPrintCheck(
    selectedItems: ICheckListTableRowData[],
    type: string
  ): void {
    const virtualAccountIds: string[] = [];
    selectedItems.forEach((el) => {
      if (el.is_virtual_account === 1) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
          this.isChaseAccountPending = true;
        }
      } else if (
        el.is_virtual_account === 0 &&
        el.verified_by === 88 &&
        el.mark_as_verified === 0
      ) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
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
              data: { bankAccountIds: virtualAccountIds }
            }
          );
          confirmationDialog.afterClosed().subscribe((confirmResult) => {
            if (confirmResult && confirmResult.success) {
              this.processMultiPrintCheck(selectedItems, type);
            }
          });
        }
      });
    } else {
      this.processMultiPrintCheck(selectedItems, type);
    }
  }

  // Print Multiple Check
  processMultiPrintCheck(
    selectedItems: ICheckListTableRowData[],
    type: string
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.openWarningAlert('Please select checks to print.');
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'print');

    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length === 1
    ) {
      this.openWarningAlert(
        `This check cannot be printed. ${warning.errorMsg}`
      );
      return;
    }

    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length > 1
    ) {
      this.openWarningAlert(
        `Please note that some of the checks cannot be printed. The affected check numbers are ${warning.checkNums}. ${warning.errorMsg}`
      );
      return;
    }

    if (
      this.checkApprovedForMail === 1 ||
      this.localStorageService.getItem('printMailAdsShowed') === '1'
    ) {
      this.onPrintMultiAction(selectedItems, type);
      return;
    }

    const adAlert = this.openPrintCheckAdsModal();
    this.localStorageService.setItem('printMailAdsShowed', '1');
    adAlert.afterClosed().subscribe((res) => {
      if (res === 'mail') {
        this.onMultiMail(selectedItems);
      } else {
        this.onPrintMultiAction(selectedItems, type);
      }
    });
  }

  Rejectcheckprint(error: HttpErrorResponse) {
    this.openWarningAlert(
      `Rejected Checks are not allowed to print. <br> Check Numbers - ${error.error.errorMsg.checkSerialNumber}`
    );
  }

  Onclickcheck(error: HttpErrorResponse, isSingleCheck = false) {
    this.openWarningAlert(
      isSingleCheck
        ? `This check cannot be printed. Administrator approval is required before proceeding.`
        : `These checks cannot be printed. Administrator approval is required before proceeding. <br> Check Numbers - ${error.error.errorMsg.checkSerialNumber}`
    );
  }

  DdAchcheck(error: HttpErrorResponse) {
    this.openWarningAlert(
      `Some checks are not eligible for printing. <br> Check Number - ${error.error.errorMsg.checkSerialNumber}`
    );
  }

  DdAchchecksingle() {
    this.openWarningAlert('The check is not eligible for printing');
  }

  ApprovalCheck(error: HttpErrorResponse, type: string) {
    this.openWarningAlert(
      `Please note that some of the checks cannot be ${type}. The affected check numbers are ${error.error.errorMsg.chimeSerialNumber}.` +
        `Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
    );
  }

  singleCheck(error: HttpErrorResponse, type: string) {
    this.openWarningAlert(
      `This check cannot be ${type}.Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
    );
  }

  onPrintMultiAction(
    selectedItems: ICheckListTableRowData[],
    type: string
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }
    const checkAmount = selectedItems[0].cheque_amount;

    const itemIds: { checkId: string[]; paperType: string | number } = {
      checkId: [],
      paperType: type === 'check' ? this.selectedCheckPaperType : 6
    };
    itemIds.checkId = selectedItems.map((e) => e.action);

    const printBtnId =
      type === 'check' ? 'id_printCheck' : 'id_printCheck_white';
    this.setButtonState('print_parent', { loading: true, disabled: true });
    this.setButtonState(printBtnId, { loading: true, disabled: true });

    if (this.commonOnInitService.isEnterPriseCustomer('enterprise-abc-legal')) {
      this.v3BulkPaymentService.setBulkPaymentCount(0);
      this.enterpriseCheckPrinting(itemIds);
      return;
    }

    this.subscriptions.push(
      this.checkService
        .printMultiCheck(itemIds)
        .pipe(
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
                      data: error.error
                    }
                  );
                  confirmationDialog
                    .afterClosed()
                    .subscribe((confirmResult) => {
                      if (confirmResult.success) {
                        this.onPrintMultiAction(selectedItems, type);
                      }
                    });
                }
              });
            }
            this.errorCode = error.error.errorCode;
            this.err_msg = error.error.errorMsg;

            if (error.error.errorCode === 127) {
              this.Rejectcheckprint(error);
            }

            if (error.error.errorCode === 125) {
              this.Onclickcheck(error, !(itemIds.checkId?.length > 1));
            }

            if (error.error.errorCode === 129 && selectedItems.length > 1) {
              this.DdAchcheck(error);
            } else if (
              error.error.errorCode === 129 &&
              selectedItems.length === 1
            ) {
              this.DdAchchecksingle();
            }

            if (error.error.errorCode === 123 && selectedItems.length > 1) {
              this.ApprovalCheck(error, 'printed');
            }

            if (error.error.errorCode === 123 && selectedItems.length === 1) {
              this.singleCheck(error, 'printed');
            }

            return of(false);
          }),
          finalize(() => {
            this.finishNewCheckOption();
            this.setButtonState('print_parent', {
              loading: false,
              disabled: false
            });
            this.setButtonState('id_printCheck', {
              loading: false,
              disabled: false
            });
            this.setButtonState('id_printCheck_white', {
              loading: false,
              disabled: false
            });
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<{ url: string }>;
          if (response?.success) {
            if (selectedItems.length === 1) {
              this.scriptService.gtagEventScript('check-printed', {
                amount: checkAmount
              });
            } else {
              this.scriptService.gtagEventScript('check-printed');
            }

            const urlLoaded = window.open(response.data.url);
            this.v3DataTableService.refreshV3DataTable();

            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const dref = this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                'Try Again'
              );
              dref.afterClosed().subscribe(() => {
                window.open(response.data.url);
              });
            }
          }
        })
    );
  }

  /**
   * @description This Function specially created for ABC Enterprise customer
   * @param {Object} selectedCheckList - The list of selected checks and paper type
   */
  enterpriseCheckPrinting(selectedCheckList: {
    checkId: string[];
    paperType: string | number;
  }) {
    this.v3BulkPaymentService.completedPaymentCount = 0;
    this.v3BulkPaymentService.abcEntCheckPrintCountSignal.set(undefined);
    const totalCount = selectedCheckList.checkId?.length;
    this.v3BulkPaymentService.isAbcEntCustomer.set(true);
    this.v3BulkPaymentService.setBulkPaymentCount(totalCount);
    this.layoutService.isProgressBarInvoked.next(false);
    let successCount = 0;
    let failCount = 0;
    this.subscriptions.push(
      from(selectedCheckList.checkId)
        .pipe(
          mergeMap((id) => {
            const payloadData = {
              checkId: [id],
              paperType: selectedCheckList.paperType
            };
            return this.checkService.printMultiCheck(payloadData).pipe(
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
                          data: error.error
                        }
                      );
                      confirmationDialog
                        .afterClosed()
                        .subscribe((confirmResult) => {
                          if (confirmResult.success) {
                            this.enterpriseCheckPrinting(selectedCheckList);
                          }
                        });
                    }
                  });
                }
                failCount += 1;
                this.v3BulkPaymentService.completedPaymentCount = 1;
                return throwError(error);
              })
            );
          }, 5),
          finalize(() => {
            this.finishNewCheckOption();
            this.setButtonState('print_parent', {
              loading: false,
              disabled: false
            });
            this.setButtonState('id_printCheck', {
              loading: false,
              disabled: false
            });
            this.setButtonState('id_printCheck_white', {
              loading: false,
              disabled: false
            });
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
            this.checkPrintError(error, selectedCheckList.checkId);
          },
          complete: () => {
            this.v3DataTableService.refreshV3DataTable();
          }
        })
    );
  }

  checkPrintError(error: HttpErrorResponse, selectedItems: string[]) {
    this.errorCode = error.error.errorCode;
    this.err_msg = error.error.errorMsg;

    if (error.error.errorCode === 127) {
      this.Rejectcheckprint(error);
    }

    if (error.error.errorCode === 125) {
      this.Onclickcheck(error);
    }

    if (error.error.errorCode === 129 && selectedItems.length > 1) {
      this.DdAchcheck(error);
    } else if (error.error.errorCode === 129 && selectedItems.length === 1) {
      this.DdAchchecksingle();
    }

    if (error.error.errorCode === 123 && selectedItems.length > 1) {
      this.ApprovalCheck(error, 'printed');
    }

    if (error.error.errorCode === 123 && selectedItems.length === 1) {
      this.singleCheck(error, 'printed');
    }

    if (
      error.error.permissionType === 'action' &&
      error.error.permissionRequired === 'check-print'
    ) {
      this.alertService.warningAlert({
        content: "You don't have permission to do this action."
      });
    }
  }

  onMultiMail(selectedItems: ICheckListTableRowData[]): void {
    const virtualAccountIds: string[] = [];
    selectedItems.forEach((el) => {
      if (el.is_virtual_account === 1) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
          this.isChaseAccountPending = true;
        }
      } else if (
        el.is_virtual_account === 0 &&
        el.verified_by === 88 &&
        el.mark_as_verified === 0
      ) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
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
              data: { bankAccountIds: virtualAccountIds }
            }
          );
          confirmationDialog.afterClosed().subscribe((confirmResult) => {
            if (confirmResult && confirmResult.success) {
              this.processMultiMail(selectedItems);
            }
          });
        }
      });
    } else {
      this.processMultiMail(selectedItems);
    }
  }

  processMultiMail(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    const ids: { ids: string[] } = { ids: [] };

    selectedItems.forEach((el) => {
      ids?.ids.push(el.action);
    });

    if (!selectedItems.length) {
      this.openWarningAlert(
        'Please select at least one check to mail.',
        'No Checks Selected!',
        'Got it'
      );
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'mail');

    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length === 1
    ) {
      this.openWarningAlert(`This check cannot be mailed. ${warning.errorMsg}`);
      return;
    }
    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length > 1
    ) {
      this.openWarningAlert(
        `Please note that some of the checks cannot be mailed. The affected check numbers are ${warning.checkNums}. ${warning.errorMsg}`
      );
    } else {
      this.setButtonState('id_mail', { loading: true, disabled: true });
      this.setButtonState('send_parent', { loading: true, disabled: true });
      this.subscriptions.push(
        this.checkService
          .getChequeDetails(ids)
          .pipe(
            finalize(() => {
              this.setButtonState('id_mail', {
                loading: false,
                disabled: false
              });
              this.setButtonState('send_parent', {
                loading: false,
                disabled: false
              });
            }),
            catchError((error) => {
              this.errorCode = error.error.errorCode;
              this.err_msg = error.error.errorMsg;

              if (error.error.errorCode === 129 && selectedItems.length > 1) {
                this.openWarningAlert(
                  `Some checks are not eligible for mailing ${
                    error.error.errorMsg.checkSerialNumber === undefined
                      ? ''
                      : `<br> Check Number - ${error.error.errorMsg.checkSerialNumber}`
                  }`
                );
                return of(false);
              }
              if (error.error.errorCode === 129 && selectedItems.length === 1) {
                this.openWarningAlert('The check is not eligible for mailing');
                return of(false);
              }

              if (error.error.errorCode === 123 && selectedItems.length > 1) {
                this.ApprovalCheck(error, 'Mailed');
                return of(false);
              }
              if (error.error.errorCode === 123 && selectedItems.length === 1) {
                this.singleCheck(error, 'Mailed');
                return of(false);
              }

              if (this.errorCode === 2) {
                this.checkdata.errorMsg = this.err_msg;
                selectedItems.forEach((el) => {
                  this.checkNo = el.cheque_serial_number;
                  if (this.checkNo === this.checkdata.errorMsg) {
                    this.bankAccountId = el.bank_accounts_id;
                  } else {
                    const checkNumbers = this.checkdata.errorMsg.split(',');
                    checkNumbers.forEach((e: string) => {
                      if (this.checkNo === e) {
                        this.bankAccountId = el.bank_accounts_id;
                      }
                    });
                  }
                });

                this.dialog.open(VerifySignatureModalV4Component, {
                  maxWidth: '540px',
                  width: '100%',
                  minHeight: '200px',
                  disableClose: true,
                  panelClass: 'paddingless-modal-rounded',
                  data: {
                    ids,
                    data: this.checkdata,
                    bankAccountId: this.bankAccountId
                  }
                });
                return of(false);
              }
              if (this.errorCode === 106) {
                const warningAlert = this.alertService.warningAlert({
                  content: this.err_msg,
                  doneMsg: 'Verify',
                  isCancel: true
                });
                warningAlert.afterClosed().subscribe((response) => {
                  if (response) {
                    this.router.navigate(['/v4/manage/verification/index']);
                  }
                });
              }
              if (!error.error.permissionType) {
                this.openWarningAlert(error.error.errorMsg);
              }
              return of(false);
            })
          )
          .subscribe((res) => {
            const responseData = res as IApiRes<IChequedata>;
            if (responseData.success) {
              this.checkdata.chequedata = responseData.data;
              this.checkDetails = responseData.data.datas;
              this.checkAmount = Number(
                responseData.data.datas[0].cheque_amount
              );
              if (this.checkdata.chequedata) {
                this.ShippingCalculation();
              }
            }
          })
      );
    }
  }

  ShippingCalculation(): void {
    this.caldata.mail_check_ids = [];

    for (let i = 0; i < (this.checkDetails as IMailCheck[]).length; i += 1) {
      const singleCheckDetails = this.checkDetails[i] as IMailCheck;
      const ids2 = singleCheckDetails.enc_id;

      this.caldata.mail_check_ids.push(singleCheckDetails.enc_id);

      if (singleCheckDetails.payee_country === 'Canada') {
        // mail shipping id of canada in staging
        if (this.rooturl === 'https://staging.sebipay.com/api/v4') {
          this.caldata[ids2] = this.getobject(
            singleCheckDetails.payee_email as string,
            singleCheckDetails.payee_email as string,
            21
          );
        } else {
          // mail shipping id of canada in live
          this.caldata[ids2] = this.getobject(
            singleCheckDetails.payee_email as string,
            singleCheckDetails.payee_email as string,
            this.getSelectedShippingType(singleCheckDetails.payee_country)
          );
        }
      } else {
        this.idlist.mail_type = 1;
        this.caldata[ids2] = this.getobject(
          singleCheckDetails.payee_email as string,
          singleCheckDetails.payee_email as string,
          this.getSelectedShippingType(singleCheckDetails.payee_country ?? null)
        );
      }
    }

    this.caldata.mail_check_ids = [...new Set(this.caldata.mail_check_ids)];

    this.subscriptions.push(
      this.checkService
        .ShippingCostCalculationGroup(this.caldata)
        .subscribe((res) => {
          if (res) {
            this.ShippingCostRes = res.data;
            this.openModal();
          }
        })
    );
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
          (type: IShippingType) => type.country === value
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

  getSelectedShippingType(country: string | null): number | null {
    if (!country) {
      return null;
    }

    const shippingTypes = this.sortedoption(country);
    const defaultMailingType = shippingTypes.find(
      (type) => type.is_default_mailing_type
    );

    if (defaultMailingType) {
      return defaultMailingType.id;
    }
    return null;
  }

  getobject(
    payee_email: string,
    payee_phone: string,
    mail_type: number | null
  ) {
    return {
      mail_type,
      check_paper: 7,
      informed_payee_sms: 0,
      informed_payee_email: 0,
      payee_phone,
      payee_email,
      file_hidden: []
    };
  }

  openModal(): void {
    if (this.checkdata && this.ShippingCostRes && this.caldata) {
      const dialog = this.dialog.open(CheckMailModalV4Component, {
        maxWidth: '1200px',
        width: '100%',
        minHeight: '380px',
        disableClose: true,
        data: {
          data: this.checkdata,
          ShippingCost: this.ShippingCostRes,
          caldata: this.caldata,
          isDisableNavigation: true
        },
        panelClass: 'paddingless-modal-rounded'
      });
      dialog.afterClosed().subscribe(() => {
        this.shippingType();
        this.recurringRedirect.redirectPendingToV4Recurring();
      });
    }
  }

  // For Check Mail
  shippingType(): void {
    this.subscriptions.push(
      this.checkService.getShippingType().subscribe((res) => {
        this.checkdata = { ...this.checkdata, shipping: res.data };
      })
    );
  }

  paperType(): void {
    this.subscriptions.push(
      this.checkService.getpaperType().subscribe((res) => {
        this.checkdata = { ...this.checkdata, paper: res.data };
      })
    );
  }
  // ------------

  onMultiEmail(selectedItems: ICheckListTableRowData[]): void {
    const virtualAccountIds: string[] = [];
    selectedItems.forEach((el) => {
      if (el.is_virtual_account === 1) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
          this.isChaseAccountPending = true;
        }
      } else if (
        el.is_virtual_account === 0 &&
        el.verified_by === 88 &&
        el.mark_as_verified === 0
      ) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
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
              data: { bankAccountIds: virtualAccountIds }
            }
          );
          confirmationDialog.afterClosed().subscribe((confirmResult) => {
            if (confirmResult && confirmResult.success) {
              this.processMultiEmail(selectedItems);
            }
          });
        }
      });
    } else {
      this.processMultiEmail(selectedItems);
    }
  }

  processMultiEmail(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.openWarningAlert(
        'Please select checks to email.',
        'Error',
        'Got It'
      );
      return;
    }
    const warning = this.onHeaderButtonWarning(selectedItems, 'email');
    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length === 1
    ) {
      this.openWarningAlert(
        `This check cannot be emailed. ${warning.errorMsg}`
      );
      return;
    }
    if (warning && typeof warning === 'object' && selectedItems.length > 1) {
      this.openWarningAlert(
        `Please note that some of the checks cannot be emailed. The affected check numbers are ${warning.checkNums}. ${warning.errorMsg}`
      );
    } else {
      this.setButtonState('id_email', { loading: true, disabled: true });
      this.setButtonState('send_parent', { loading: true, disabled: true });

      const ids: string[] = selectedItems.map((e) => e.action);
      this.subscriptions.push(
        this.checkService
          .getEmails({ ids })
          .pipe(
            finalize(() => {
              this.setButtonState('id_email', {
                loading: false,
                disabled: false
              });
              this.setButtonState('send_parent', {
                loading: false,
                disabled: false
              });
            }),
            catchError((error) => {
              if (error.error.errorCode === 123 && selectedItems.length > 1) {
                this.ApprovalCheck(error, 'E-mailed');
                return of(false);
              }
              if (error.error.errorCode === 123 && selectedItems.length === 1) {
                this.singleCheck(error, 'E-mailed');
                return of(false);
              }

              if (error.error.errorCode === 129 && selectedItems.length > 1) {
                this.openWarningAlert(
                  `Some checks are not eligible for E-mail <br> Check Number - ${error.error.errorMsg.checkSerialNumber}`
                );
              } else if (
                error.error.errorCode === 129 &&
                selectedItems.length === 1
              ) {
                this.openWarningAlert('The check is not eligible for E-mail');
              }
              return of(false);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.openEmailModal(data.data);
            }
          })
      );
    }
  }

  openEmailModal(emailRows: ICheckEmailData) {
    const dialogRef = this.dialog.open(CheckEmailModalV4Component, {
      maxWidth: '93%',
      width: '1232px',
      disableClose: true,
      data: {
        serverData: emailRows
      },
      panelClass: ['modal-overflow-visible', 'paddingless-modal-rounded']
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.v3DataTableService.refreshV3DataTable();
      this.recurringRedirect.redirectPendingToV4Recurring();
    });
  }

  openDirectDepositModal(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.openWarningAlert(
        'Please select checks to process ACH.',
        'Error',
        'Got It'
      );
      return;
    }

    const cheques = selectedItems.map((item) => item.action);
    this.subscriptions.push(
      this.checkService
        .getDirectDepostModalData({ cheques })
        .subscribe((res) => {
          if (!res?.success) return;
          if (res?.message && !res.data?.length) {
            this.alertService.warningAlert({ content: res.message });
            return;
          }
          const dialogRef = this.dialog.open(DirectDepositV4Component, {
            width: '75%',
            maxHeight: '90%',
            data: selectedItems,
            disableClose: true,
            panelClass: 'paddingless-modal-rounded'
          });
          dialogRef.afterClosed().subscribe((result) => {
            if (result?.success) {
              this.v3DataTableService.refreshV3DataTable();
              this.openSuccessAlert('Successfully done.');
            }
            this.recurringRedirect.redirectPendingToV4Recurring();
          });
        })
    );
  }

  noBankAccountAlert() {
    this.alertService.infoAlert({
      content: 'The bank account is not enabled for international payment'
    });
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
        this.router.navigate(['/v4/manage/bank-accounts']);
      }
    });
  }

  onDeleteMultipleChecks(selectedItems: ICheckListTableRowData[]): void {
    if (!selectedItems.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select checks to delete.',
        doneMsg: 'Got it'
      });
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'delete');

    if (warning && typeof warning === 'boolean') {
      this.alertService.failedAlert({
        content:
          selectedItems.length === 1
            ? "Selected check can't be deleted."
            : "Some of the checks can't be deleted."
      });
      return;
    }

    if (warning && typeof warning === 'object' && warning.errorMsg) {
      this.alertService.failedAlert({
        content: `Some of the checks can't be deleted. Check Numbers - ${warning.checkNums}. ${warning.errorMsg}`
      });
      return;
    }

    const ids = selectedItems.map((e) => e.action);
    const alert = this.alertService.confirmAlert({
      title: 'Confirm',
      content: `Are you sure you want to delete ${
        selectedItems.length === 1 ? 'this' : 'these'
      } ${selectedItems.length === 1 ? 'check' : 'checks'}?`,
      cancelMsg: 'Cancel',
      doneMsg: 'OK'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) this.deleteMultiCheckAction({ ids });
    });
  }

  deleteMultiCheckAction(itemIds: { ids: string[] }): void {
    this.setButtonState('id_btnTrash', { loading: true, disabled: true });
    this.subscriptions.push(
      this.checkService
        .deleteMulitpleCheck(itemIds)
        .pipe(
          finalize(() => {
            this.setButtonState('id_btnTrash', {
              loading: false,
              disabled: false
            });
          })
        )
        .subscribe(
          (res) => {
            if (res?.success) {
              this.getCheckListData();
              this.v3DataTableService.refreshV3DataTable();
              this.alertService.successAlert({
                title: 'Success!',
                content: 'Checks deleted.',
                close: true
              });
            }
          },
          (err: HttpErrorResponse) => {
            if (!err.error.permissionType) {
              this.alertService.warningAlert({
                title: 'Error',
                content: err?.error?.errorMsg,
                doneMsg: 'OK'
              });
            }
          }
        )
    );
  }

  // Void Check
  onVoidMultipleCheck(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select checks to void.',
        doneMsg: 'Got it'
      });
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'void');

    if (warning && typeof warning === 'boolean') {
      this.alertService.failedAlert({
        content:
          selectedItems.length === 1
            ? "Selected check can't be voided."
            : "Some of the checks can't be voided."
      });
      return;
    }

    if (warning && typeof warning === 'object' && warning.errorMsg) {
      this.alertService.failedAlert({
        content: `Some of the checks can't be voided. Check Numbers - ${warning.checkNums}. ${warning.errorMsg}`
      });
      return;
    }

    const ids = selectedItems.map((e) => e.action);
    selectedItems.forEach((e) => {
      this.chequeStatus = e.cheque_status;
    });
    let msg = '';

    if (this.chequeStatus === 504) {
      msg = `The receiver tried to print ${
        selectedItems.length === 1 ? 'this' : 'these'
      } ${
        selectedItems.length === 1 ? 'check' : 'checks'
      }.It might have been printed and marked as not printed. Are you sure you want to void this ${
        selectedItems.length === 1 ? 'check' : 'checks'
      }?`;
    } else {
      msg = `Are you sure you want to void ${
        selectedItems.length === 1 ? 'this' : 'these'
      } ${selectedItems.length === 1 ? 'check' : 'checks'}?`;
    }

    const alert = this.alertService.confirmAlert({
      title: 'Confirm',
      content: msg,
      cancelMsg: 'Cancel',
      doneMsg: 'OK'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) this.voidMultiCheckAction(ids);
    });
  }

  voidMultiCheckAction(ids: string[]): void {
    this.setButtonState('id_btnVoid', { loading: true, disabled: true });
    this.subscriptions.push(
      this.checkService
        .voidmultipleCheck({ ids })
        .pipe(
          finalize(() => {
            this.setButtonState('id_btnVoid', {
              loading: false,
              disabled: false
            });
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (this.isIndiaBazaarEnabled) {
              this.getTotalCheckSum();
            }
            this.getCheckListData();
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({
              title: 'Success!',
              content: 'Checks voided.',
              close: true
            });
          }
        })
    );
  }

  // Mark As Cleared
  onMarkAsClearedCheck(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    const ids = selectedItems.map((e) => e.action);

    if (!selectedItems.length) {
      this.openWarningAlert(
        'Please select at least one check to proceed',
        'Error',
        'Got it'
      );
      return;
    }

    const alert = this.openConfirmAlert(
      `Are you sure you want to mark ${
        selectedItems.length === 1 ? 'this' : 'these'
      }  ${selectedItems.length === 1 ? 'check' : 'checks'} as posted?`
    );
    alert.afterClosed().subscribe((result) => {
      if (result) this.markAsClearedCheckAction(ids);
    });
  }

  redirectToCheckRecurring() {
    this.recurringClick.emit();
  }

  /**
   * The group mailing table is rendered inline in this tab instead of being routed
   * to, so the payments-out layout and the sub-tabs stay in place.
   */
  openGroupMailings() {
    this.activeCheckTab.set('id_groupMailings');
    this.showGroupMailings();
  }

  markAsClearedCheckAction(ids: string[]): void {
    this.setButtonState('id_mark_as_cleared', {
      loading: true,
      disabled: true
    });
    this.subscriptions.push(
      this.checkService
        .markAsClearedCheck({ ids })
        .pipe(
          finalize(() => {
            this.setButtonState('id_mark_as_cleared', {
              loading: false,
              disabled: false
            });
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.getCheckListData();
            this.v3DataTableService.refreshV3DataTable();
            this.openSuccessAlert('Marked as cleared.');
          }
        })
    );
  }

  isIncludedUnMappedChecks(): boolean {
    return this.selectedRow.some(
      (item) =>
        item.bank_account_account_name === null &&
        item.bank_account_nick_name === null
    );
  }

  // Process Multiple Check
  onProcessMultipleCheck() {
    this.checkVerificationAndExecute(() => {
      if (this.isIncludedUnMappedChecks()) {
        this.alertService.warningAlert({
          title: 'Error',
          content: 'Please map the bank account for further processing.',
          doneMsg: 'Ok'
        });
        return;
      }
      this.disabled = true;
      this.setButtonState('id_processPayment', {
        loading: true,
        disabled: true
      });
      this.subscriptions.push(
        this.checkService
          .getCheckListData()
          .pipe(
            catchError((err) => {
              this.disabled = false;
              this.setButtonState('id_processPayment', {
                loading: false,
                disabled: false
              });
              return of(err);
            })
          )
          .subscribe((res) => {
            if (res.data.isApprovedForProcessNow === 1) {
              const ids: string[] = [];
              this.selectedRow.forEach((val) => {
                ids.push(val.action);
              });
              if (this.selectedRow.length === 0) {
                const content = 'Please select at least one check to proceed.';
                this.openWarningAlert(content, 'Error', 'Got it');
                this.disabled = false;
                this.setButtonState('id_processPayment', {
                  loading: false,
                  disabled: false
                });
                return;
              }

              const process = this.dialog.open(CheckProcessModalV4Component, {
                maxWidth: '1010px',
                width: '90%',
                disableClose: true,
                panelClass: 'paddingless-modal-rounded',
                data: {
                  data: ids,
                  RowData: this.selectedRow,
                  status: this.cellRendererCheckStatus
                }
              });
              process.afterClosed().subscribe(() => {
                this.disabled = false;
                this.setButtonState('id_processPayment', {
                  loading: false,
                  disabled: false
                });
                this.getCheckListData();
                this.v3DataTableService.refreshV3DataTable();
              });
            } else {
              this.disabled = false;
              this.setButtonState('id_processPayment', {
                loading: false,
                disabled: false
              });
              this.router.navigate([
                '/v4/manage/cheque/v4-get-restricted-data'
              ]);
            }
          })
      );
    });
  }

  // Header Button Warning Alert
  onHeaderButtonWarning(
    selectedItems: ICheckListTableRowData[],
    action: string
  ) {
    const checkStatus = selectedItems?.map(
      (e) => this.cellRendererCheckStatus[e.cheque_status]
    );

    const fromZilBank: string[] = [];
    const fromWallet: string[] = [];
    selectedItems.forEach((e) => {
      if (
        e.bank_account_nature_type === 2 &&
        ['print', 'email', 'mail'].includes(action)
      ) {
        fromZilBank.push(e.cheque_serial_number);
      } else if (
        e.create_check_from === 1 &&
        ['print', 'email', 'delete', 'void'].includes(action)
      ) {
        fromWallet.push(e.cheque_serial_number);
      }
    });

    const errorMsg = fromZilBank.length
      ? `Currently, the Zil account is only set up for ACH/Direct Deposit.`
      : 'For wallet checks';
    const checkNums = fromZilBank.length ? fromZilBank : fromWallet;

    // eslint-disable-next-line no-restricted-syntax
    for (const status of checkStatus) {
      switch (action) {
        case 'print':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          if (status.isItPrintAble === 0) return true;
          break;

        case 'void':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          if (status.isItVoidAble === 0) return true;
          break;

        case 'delete':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          if (status.isItDeleteAble === 0) return true;
          break;

        case 'approveReject':
          if (status.statusValue !== 35) return true;
          break;

        case 'email':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          break;

        case 'mail':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          break;
        default:
          break;
      }
    }
    return null;
  }

  //= =======>Action Button Click

  onApproveCheck(
    selectedItem: ICheckListTableRowData[] | ICheckListTableRowData,
    isMulti: boolean
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }
    const multipleCheck = selectedItem as ICheckListTableRowData[];
    if (!multipleCheck.length && isMulti) {
      const content = 'Please select at least one check to proceed.';
      this.openWarningAlert(content, 'Error', 'Got it');
      return;
    }

    if (isMulti) {
      if (
        this.onHeaderButtonWarning(
          selectedItem as ICheckListTableRowData[],
          'approveReject'
        )
      ) {
        this.openFailedAlert(
          multipleCheck.length === 1
            ? "Selected check can't be approved."
            : "Some of the checks can't be approved."
        );
        return;
      }
    }

    let ids: string[] = [];
    if (isMulti) {
      ids = multipleCheck?.map((e) => e.action);
    } else {
      ids.push((selectedItem as ICheckListTableRowData)?.id);
    }

    const alert = this.openConfirmAlert(
      'Are you sure you want to approve this check?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.setButtonState('id_approve', { loading: true, disabled: true });

        this.subscriptions.push(
          this.checkService
            .approveCheck({ ids })
            .pipe(
              finalize(() => {
                this.setButtonState('id_approve', {
                  loading: false,
                  disabled: false
                });
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.getCheckListData();
                  this.v3DataTableService.refreshV3DataTable();
                  this.openSuccessAlert('Check approved successfully');
                }
              },
              error: (err) => {
                this.paymentService.handleApprovalPolicyRestriction(err);
              }
            })
        );
      }
    });
  }

  onRejectCheck(
    selectedItems: ICheckListTableRowData[] | ICheckListTableRowData,
    isMulti: boolean
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }
    const multipleCheck = selectedItems as ICheckListTableRowData[];

    if (!multipleCheck.length && isMulti) {
      const content = 'Please select at least one check to proceed.';
      this.openWarningAlert(content, 'Error', 'Got it');
      return;
    }

    if (isMulti) {
      if (this.onHeaderButtonWarning(multipleCheck, 'approveReject')) {
        this.openFailedAlert(
          multipleCheck.length === 1
            ? "Selected check can't be rejected."
            : "Some of the checks can't be rejected."
        );
        return;
      }
    }

    let ids: string[] = [];
    if (isMulti) {
      ids = multipleCheck?.map((e) => e.action);
    } else {
      ids.push((selectedItems as ICheckListTableRowData)?.id);
    }

    const alert = this.openConfirmAlert(
      `Are you sure you want to reject ${
        multipleCheck.length === 1 ? 'this' : 'these'
      } ${multipleCheck.length === 1 ? 'check' : 'checks'}?`
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.setButtonState('id_reject', { loading: true, disabled: true });

        this.subscriptions.push(
          this.checkService
            .rejectCheck({ ids })
            .pipe(
              finalize(() => {
                this.setButtonState('id_reject', {
                  loading: false,
                  disabled: false
                });
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.getCheckListData();
                  this.v3DataTableService.refreshV3DataTable();
                  this.openSuccessAlert('Check rejected successfully');
                }
              },
              error: (err) => {
                this.paymentService.handleApprovalPolicyRestriction(err);
              }
            })
        );
      }
    });
  }

  onPrintSingleCheck(selectedItem: ICheckListTableRowData): void {
    const warning = this.onHeaderButtonWarning([selectedItem], 'print');
    if (warning && typeof warning === 'object' && warning.errorMsg) {
      this.openWarningAlert(
        `This check cannot be printed. ${warning.errorMsg}`
      );
      return;
    }

    if (
      this.checkApprovedForMail === 1 ||
      this.localStorageService.getItem('printMailAdsShowed') === '1'
    ) {
      this.onPrintSingleAction(selectedItem);
      return;
    }

    const adAlert = this.openPrintCheckAdsModal();
    this.localStorageService.setItem('printMailAdsShowed', '1');
    adAlert.afterClosed().subscribe((res) => {
      if (res) {
        this.onPrintSingleAction(selectedItem);
      }
    });
  }

  onPrintSingleAction(selectedItem: ICheckListTableRowData): void {
    if (selectedItem?.is_virtual_account) {
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${selectedItem?.bank_account_account_number}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
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
              data: { bankAccountIds: [selectedItem?.bank_accounts_id] }
            }
          );

          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.processPrintSingleAction(selectedItem);
            }
          });
        }
      });
    } else if (
      selectedItem?.is_virtual_account === 0 &&
      selectedItem?.verified_by === 88 &&
      selectedItem?.mark_as_verified === 0
    ) {
      const notification = this.alertService.failedAlert({
        content:
          'Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
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
              data: { bankAccountIds: [selectedItem?.bank_accounts_id] }
            }
          );

          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.processPrintSingleAction(selectedItem);
            }
          });
        }
      });
    } else {
      this.processPrintSingleAction(selectedItem);
    }
  }

  processPrintSingleAction(selectedItem: ICheckListTableRowData): void {
    const checkAmount = selectedItem.cheque_amount;
    this.subscriptions.push(
      this.checkService
        .printSingleCheck(selectedItem?.id)
        .pipe(
          catchError((error) => {
            if (error.error.errorCode === 127) {
              this.Rejectcheckprint(error);
            }

            if (error.error.errorCode === 125) {
              this.Onclickcheck(error, true);
            }

            if (error.error.errorCode === 129) {
              this.DdAchchecksingle();
            }

            if (error.error.errorCode === 123) {
              this.singleCheck(error, 'printed');
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.scriptService.gtagEventScript('check-printed', {
              amount: checkAmount
            });
            const urlLoaded = window.open(res.data.url);
            this.v3DataTableService.refreshV3DataTable();
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const dref = this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                'Try Again'
              );
              dref.afterClosed().subscribe(() => {
                window.open(res.data.url);
              });
            }
          }
        })
    );
  }

  // Single Edit
  onEditCheck(selectedItem: ICheckListTableRowData): void {
    this.paymentsV4Service.openSendModal({
      mode: SendPaymentMode.Edit,
      paymentId: selectedItem?.uu_id
    });
  }

  // Single Delete
  onSingleDelete(selectedItem: ICheckListTableRowData): void {
    const selectedId = selectedItem.action;
    const alert = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to delete this check?',
      cancelMsg: 'Cancel',
      doneMsg: 'OK'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkService.deleteCheck(selectedId).subscribe((res) => {
            if (res.success === true) {
              this.getCheckListData();
              this.v3DataTableService.refreshV3DataTable();
              this.alertService.successAlert({
                title: 'Success!',
                content: 'Check deleted.',
                close: true
              });
            }
          })
        );
      }
    });
  }

  // Single Void
  onVoidSingleCheck(selectedItem: ICheckListTableRowData): void {
    const selectedId: string = selectedItem.action;
    let msg = '';

    if (selectedItem.cheque_status === 504) {
      msg =
        'The receiver tried to print this check.It might have been printed and marked as not printed. Are you sure you want to void this check?';
    } else {
      msg = 'Are you sure you want to void this check?';
    }

    if (selectedItem.cheque_status === 35) {
      return;
    }

    const alert = this.alertService.confirmAlert({
      title: 'Confirm',
      content: msg,
      cancelMsg: 'Cancel',
      doneMsg: 'OK'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkService.voidCheck(selectedId).subscribe({
            next: (res) => {
              if (res.success === true) {
                this.getCheckListData();
                this.v3DataTableService.refreshV3DataTable();
                this.alertService.successAlert({
                  title: 'Success!',
                  content: 'Check voided.',
                  close: true
                });
              }
            }
          })
        );
      }
    });
  }

  // Clone Check
  onCloneCheck(selectedItem: ICheckListTableRowData): void {
    this.paymentsV4Service.openSendModal({
      mode: SendPaymentMode.Clone,
      paymentId: selectedItem?.uu_id
    });
  }

  // Re email check
  reEmailCheck(checkId: string) {
    this.subscriptions.push(
      this.checkService.reEmailCheck(checkId).subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({
            content: 'Emailed',
            close: true,
            timeout: 1500
          });
        }
      })
    );
  }

  // forcefully printed
  forcefullyPrinted(selectedItem: ICheckListTableRowData): void {
    const selectedId = selectedItem.action;
    const alert = this.openConfirmAlert('You want to set mark as printed?');
    alert.afterClosed().subscribe((result) => {
      if (result) {
        const data = {
          checkId: selectedId
        };
        this.subscriptions.push(
          this.checkService.forcePrinted(data).subscribe((res) => {
            if (res.success === true) {
              this.v3DataTableService.refreshV3DataTable();
              this.openSuccessAlert('Successfully marked as printed');
            }
          })
        );
      }
    });
  }

  onPayeeSummary(selectedItem: ICheckListTableRowData): void {
    const payeeId = selectedItem.payee_id;
    const type = 1;
    this.router.navigate([`v4/manage/transaction-history/${payeeId}/${type}`]);
  }

  unmapedChecks(selectedItems: ICheckListTableRowData[]): boolean {
    let unmaped = true;

    selectedItems.forEach((e) => {
      if (
        ((e.bank_specialization_id === null ||
          e.bank_specialization_id === 0 ||
          e.bank_specialization_id === '') &&
          Number(e.qb_transaction_id) > 1) ||
        (e.third_party === 1 &&
          (e.bank_specialization_id === 0 ||
            e.bank_specialization_id === null ||
            e.bank_specialization_id === ''))
      ) {
        unmaped = false;
      }
    });
    if (!unmaped) {
      if (this.selectedRow.length === 1) {
        const data = {
          title: 'Error',
          content: `Please map the bank account to process the check.`,
          doneMsg: 'Map now',
          cancelMsg: 'Cancel',
          isCancel: true
        };
        const warn = this.alertService.warningAlert(data);
        warn.afterClosed().subscribe((r) => {
          if (r) {
            this.router.navigate(['/v4/manage/cheque/create/'], {
              queryParams: { id: this.selectedRow[0].id },
              fragment: 'thirdparty=1'
            });
          }
        });
      } else {
        this.openWarningAlert(
          'Bank account of some checks are not mapped. Please map the bank account for further processing.'
        );
      }
      return false;
    }
    return true;
  }

  openAddCommandModal(id: string): void {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'checks' }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) this.v3DataTableService.refreshV3DataTable();
    });
  }

  openAddAttachmentModal(id: string): void {
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { id, type: 'checks' }
      }
    );

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  openV4AddCommentModal(id: string): void {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'checks' }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) this.v3DataTableService.refreshV3DataTable();
    });
  }

  openV4AddAttachmentModal(id: string): void {
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { id, type: 'checks' }
      }
    );

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  /**
   * @description Donwoload proof of payment
   *
   * @returns redirect to the pdf web page
   */
  downloadProofOfPayment(rowdData: ICheckListTableRowData) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.checkService.getChecksById(rowdData.id, headerOptions).subscribe({
        next: (res) => {
          if (res?.success) {
            if (res.data) {
              if (res.data?.status && res.data?.status === 7) {
                this.subscriptions.push(
                  this.v3PaymentsTableService
                    .getProofOfPaymentForMailed(res.data.uuid)
                    .subscribe((apiRes) => {
                      if (apiRes) {
                        window.open(apiRes.data, '_blank');
                      }
                    })
                );
                return;
              }

              this.subscriptions.push(
                this.v3PaymentsTableService
                  .getProofOfPayment(res.data.uuid)
                  .subscribe((apiRes) => {
                    if (apiRes) {
                      window.open(apiRes.data, '_blank');
                    }
                  })
              );
            }
          }
        }
      })
    );
  }

  /**
   * @description Handle payment using credit card.
   * Navigate card ach payment method page.
   */
  payByCreditCard(rowdData: ICheckListTableRowData): void {
    const eligibleCheckStatus = [0, 1, 11, 440, 441, 502, 507, 807];
    if (!eligibleCheckStatus.includes(rowdData?.cheque_status)) {
      this.alertService.failedAlert({
        content: 'This action cannot be performed for this transaction.'
      });
      return;
    }
    const selectedPayee = {
      encryptedId: rowdData?.payee_id,
      name: rowdData.payee_name
    };
    const sendData = {
      amount: rowdData.cheque_amount,
      memo: rowdData.cheque_memo,
      invoiceNumber: rowdData.cheque_invoice_number,
      payee: selectedPayee
    };
    this.paymentService.initiatePaymentForm = sendData;
    this.router.navigate(['/v4/manage/payments/pay/card/ach'], {
      state: { backUrl: this.router.url }
    });
  }

  openImport(): void {
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
      if (res?.success === true) {
        this.v3DataTableService.refreshV3DataTable();
        this.checkImported = true;
      }
    });
  }

  openPrintCheckAdsModal() {
    return this.dialog.open(CheckPrintAdModalComponent, {
      maxWidth: '450px',
      width: '93%'
    });
  }

  openInfoAlert(content: string) {
    const data: IInfoAlert = {
      content
    };
    return this.alertService.infoAlert(data);
  }

  openFailedAlert(content: string) {
    const data: IFailedAlert = {
      content
    };
    return this.alertService.failedAlert(data);
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

  openWarningAlert(
    content: string,
    title?: string,
    doneMsg?: string
  ): MatDialogRef<V4WarningAlertComponent, boolean> {
    const data = {
      title: title || 'Error',
      content,
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.warningAlert(data);
  }

  openSuccessAlert(content: string): void {
    const data: ISuccessAlert = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  querySelector(el: string) {
    return document.querySelector(el);
  }

  //= =====>For Template Responsive
  mobileHeaderRightBtn(): void {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.toggle('mobile-head-rightshow');

    const ocwOverlay = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    ocwOverlay.style.display = 'block';
  }

  ocwOverlayRightHeadClick(): void {
    const ocwOverlay = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    ocwOverlay.style.display = 'none';

    const actionBtn = this.querySelector('#mobile-header-right-btn');
    actionBtn?.classList.remove('mobile-head-rightshow');

    const allShowBtn = document.getElementById('alertIconline');
    allShowBtn?.classList.remove('allalertshow');
  }

  getApprovalRequiredList() {
    if (!this.isMultiLevelPluginEnabled) return;
    this.subscriptions.push(
      this.userManagementService
        .getPendingApprovalList({ page: 1, perPage: 50 })
        .subscribe((res) => {
          this.pendingApprovals = res.data;
          this.setPendingApprovalBadge();
        })
    );
  }

  /**
   * Feeds the shared pending-approvals badge. Two independent queues can produce it:
   * the multi-level approval plugin, which opens a review modal, and the standard
   * check-approval queue, which filters the table. The plugin takes precedence when
   * both are active; the id carries the routing.
   */
  private setPendingApprovalBadge() {
    const multiLevelCount =
      this.pendingApprovals?.pagination?.total ??
      this.pendingApprovals?.zilPayments?.length ??
      0;
    const approvalQueueCount =
      !this.isHamaspik && this.checkApproveRjctCurrentData?.isPending === 1
        ? (this.pendingChecks ?? 0)
        : 0;

    let pendingItems;
    if (multiLevelCount) {
      pendingItems = {
        id: 'btn_pending_approval_info',
        itemName: 'Checks',
        pendingCount: multiLevelCount
      };
    } else if (approvalQueueCount) {
      pendingItems = {
        id: 'btn_check_approval_filter',
        itemName: 'Checks',
        pendingCount: approvalQueueCount
      };
    }

    this.headerElements = { ...this.headerElements, pendingItems };
  }

  openPendingRequestApprovalModal() {
    // Ensure we have fresh data before opening (the modal requires it).
    this.subscriptions.push(
      this.userManagementService
        .getPendingApprovalList({ page: 1, perPage: 50 })
        .subscribe((res) => {
          this.pendingApprovals = res.data;
          this.dialog
            .open(PendingCheckApprovalsV4Component, {
              width: '1000px',
              panelClass: 'paddingless-modal-rounded',
              data: this.pendingApprovals
            })
            .afterClosed()
            .subscribe(() => {
              this.getApprovalRequiredList();
            });
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

  get isShowingEmptyState(): boolean {
    return !!this.dataTable?.shouldShowCustomEmptyState;
  }

  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/pay']);
  }

  // --------------------------------------------------Column Definitions----------------------------------------------------------------
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

  colDefStatus = {
    headerName: 'Status',
    minWidth: 140,
    width: 150,
    maxWidth:300,
    pinned: 'right' as const,
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    field: 'cheques.cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'v4CheckStatusComponent',
    cellStyle: {
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'center',
      'align-items': 'flex-start'
    },
    cellRendererParams: () => ({
      checkStatusMap: this.cellRendererCheckStatus,
      showFilter: true,
      isLegalEnabled: this.isLegalEnabled,
      hidesDirectDeposit: this.hidesDirectDeposit,
      onCommentClick: (id: string) => {
        this.openV4AddCommentModal(id);
      },
      onAttachmentClick: (id: string) => {
        this.openV4AddAttachmentModal(id);
      },
      onTrackingClick: (id: string) => {
        this.checkService.getCheckTrackingUrls(id);
      },
      onNewCheckOption: (
        row: ICheckListTableRowData,
        optionId: string,
        done: () => void
      ) => {
        this.onNewCheckOption(row, optionId, done);
      }
    }),
    cellRendererForExport: (params: { data: { cheque_status: number } }) => {
      // Only For when Export Table data
      const value = params?.data?.cheque_status;
      return this.cellRendererCheckStatus[value]?.statusShortDescription;
    }
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'dtEditFieldComponent'
  };

  colDefVendorId = {
    minWidth: 125,
    headerName: 'Vendor Name',
    field: 'payee_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayee: ColDef = {
    minWidth: 175,
    headerName: this.whiteLabelPayeeHeaderName,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'payeeListComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'dtCellFilterComponent',
    cellRendererParams: { type: 'payee' }
  };

  colDefNickName = {
    minWidth: 160,
    headerName:
      environment.env_id === 'compass'
        ? 'Netsuite GL Account'
        : 'Custom Bank Name',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'bankAccountComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => {
      // Only For when Export Table data
      if (params.value === null) return params?.data?.bank_account_nick_name;
      return params?.value;
    },
    cellRenderer: 'v4BankNameComponent'
  };

  colDefBank = {
    minWidth: 120,
    headerName: 'Bank',
    field: 'bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => {
      // Only For when Export Table data
      if (params.value === null) return params?.data?.bank_account_account_name;
      return params?.value;
    }
  };

  colDefCheckNo = {
    minWidth: 70,
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCheckNumberComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => params?.value
  };

  colDefDate = {
    minWidth: 110,
    headerName: 'Issue Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    }
  };

  // Shown only while the Scheduled status filter is applied - see syncScheduledDateColumn()
  colDefScheduleDate = {
    minWidth: 140,
    headerName: 'Scheduled Date',
    field: 'scheduled_checks.schedule_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date',
      isPipeDate: true
    },
    cellRendererForExport: (params: { data: { schedule_date: string } }) =>
      this.formatScheduleDate(params?.data?.schedule_date)
  };

  colDefCreatedAt = {
    minWidth: 130,
    headerName: 'Created On',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'check_list_table'
    },
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefBy = {
    minWidth: 120,
    headerName: 'Initiated By',
    field: 'cheque_created_by_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'v3CreatedByComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) =>
      // Only For when Export Table data
      params?.data?.cheque_created_by_user_name
  };

  colDefMemo = {
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'v3DescriptionComponent'
  };

  colDefNote = {
    minWidth: 60,
    headerName: 'Note',
    field: 'cheque_notes',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    }
  };

  colDefCategory = {
    minWidth: 60,
    headerName: 'Category',
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefPayeeAcNo = {
    minWidth: 130,
    headerName: `${this.whiteLabelPayeeName} A/c No`,
    field: 'cheque_account_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefInvoiceNo = {
    minWidth: 120,
    headerName: 'Invoice No',
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefAction = {
    minWidth: 80,
    headerName: 'Action',
    field: 'action',
    pinned: 'left',
    lockPosition: true,
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    cellRenderer: 'v4CheckActionComponent',
    cellRendererParams: () => ({
      checkStatusMap: this.cellRendererCheckStatus,
      isHamaspik: this.isHamaspik,
      onViewClick: (row: ICheckListTableRowData) => {
        this.dataTableService.destroyPayload = false;
        this.detailPanelService.openCheck(row);
      },
      onActionClick: (row: ICheckListTableRowData, label: string) => {
        this.handleCheckAction(row, label);
      }
    }),
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    }
  };

  colDefPayMethod = {
    headerName: 'Default Payment Method',
    field: 'payee_default_payment_method',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 190,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true,
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

  colDefPosition = {
    headerName: 'Position',
    field: 'custom_field_position',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true
  };

  filterColumnFields(userPlugins?: string[]): void {
    const columnFields = [
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
        isDisabled: false,
        colDef: this.colDefStatus,
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
        id: 'id_vendor_id',
        name: 'Vendor Name',
        isDisabled: true,
        colDef: this.colDefVendorId,
        isChecked: true
      },
      {
        id: 'id_payee',
        name: this.whiteLabelPayeeHeaderName,
        isDisabled: true,
        colDef: this.colDefPayee,
        isChecked: true
      },
      {
        id: 'id_nickname',
        name:
          environment.env_id === 'compass'
            ? 'Netsuite GL Account'
            : 'Custom Bank Name',
        isDisabled: false,
        colDef: this.colDefNickName,
        isChecked: true
      },
      {
        id: 'id_bank',
        name: 'Bank',
        isDisabled: false,
        colDef: this.colDefBank,
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
        name: 'Check Issue Date',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'id_createdAt',
        name: 'Created Date',
        isDisabled: false,
        colDef: this.colDefCreatedAt,
        isChecked: true
      },
      {
        id: 'id_by',
        name: 'By',
        isDisabled: false,
        colDef: this.colDefBy,
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
        id: 'payee_default_payment_method',
        name: 'Default Pay Method',
        isDisabled: false,
        colDef: this.colDefPayMethod,
        isChecked: true
      },
      {
        id: 'id_position',
        name: 'Position',
        isDisabled: false,
        colDef: this.colDefPosition,
        isChecked: true
      },
      {
        id: 'id_note',
        name: 'Note',
        isDisabled: false,
        colDef: this.colDefNote,
        isChecked: false
      },
      {
        id: 'id_category',
        name: 'Category',
        isDisabled: false,
        colDef: this.colDefCategory,
        isChecked: true
      },
      {
        id: 'id_payeeAcNo',
        name: `${this.whiteLabelPayeeName} A/c No`,
        isDisabled: false,
        colDef: this.colDefPayeeAcNo,
        isChecked: true
      },
      {
        id: 'id_invoiceNo',
        name: 'Invoice No',
        isDisabled: false,
        colDef: this.colDefInvoiceNo,
        isChecked: true
      }
    ];

    if (environment.env_id !== 'compass') {
      if (userPlugins && userPlugins.includes('enterprise-bryancohen')) {
        this.columnFields = columnFields.filter(
          (columnField) => columnField.id !== 'id_vendor_id'
        );
      } else {
        this.columnFields = columnFields.filter(
          (columnField) =>
            columnField.id !== 'id_vendor_id' &&
            columnField.id !== 'id_position'
        );
      }
    } else {
      this.columnFields = columnFields;
    }
  }

  /**
   * Exports checks to quickbook
   */
  exportChecksToQuickbook() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.integrationService
          .exportChecksToQuickbook(selectedCheckIds)
          .pipe(
            catchError((err) => {
              if (err.error.errorCode === 500) {
                this.openCustomCheckExportErrorAlert(
                  Object.entries(err.error.errorMsg).map(([k, v]) => ({
                    [k]: v
                  }))
                );
              } else if (err.status === 403) {
                this.openWarningAlert(err.error.errorMsg);
              }

              return EMPTY;
            }),
            finalize(() => {
              this.loadingpush = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.openSuccessAlert('Checks Exported Successfully');
              this.v3DataTableService.refreshV3DataTable();
            }
          })
      );
    } else {
      this.openWarningAlert(
        'Please select at least one check to proceed',
        'Error',
        'Got it'
      );
      this.loadingpush = false;
    }
  }

  openCustomCheckExportErrorAlert(errorChecklist: { [x: string]: unknown }[]) {
    return this.dialog.open(CustomCheckExportErrorAlertV4Component, {
      maxWidth: '500px',
      minWidth: '500px',
      width: '95%',
      disableClose: true,
      data: errorChecklist,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  private checkVerificationAndExecute(callback: () => void): void {
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
          callback();
        } else {
          this.goToVerify();
        }
      });
  }

  showRequested() {
    if (StaticWhiteLabelConditions.zohoSupportChat)
      window.open(StaticWhiteLabelConditions.zohoSupportChat);
    else window.open(StaticWhiteLabelConditions?.helpWebsite, '_blank');
  }

  goToVerify() {
    this.router.navigate(['/v4/manage/verification/index'], {
      queryParams: {
        returnUrl: 'v4/manage/payments-table/check'
      }
    });
  }

  exportChecksToQuickbookDesktop() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
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
              } else if (err.status === 403) {
                this.openWarningAlert(err.error.errorMsg);
              }
              return EMPTY;
            }),
            finalize(() => {
              this.loadingpush = false;
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
            }
          })
      );
    } else {
      this.openWarningAlert(
        'Please select at least one check to proceed',
        'Error',
        'Got it'
      );
      this.loadingpush = false;
    }
  }

  exportChecksToNetSuite() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.netsuiteIntegrationService
          .exportChecksToNetSuite(selectedCheckIds)
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
              this.loadingpush = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              const data: ISuccessAlert = {
                title: 'Success!',
                content:
                  'Checks Exported Successfully. The checks will appear on  your NetSuite account after one minute of importing.',
                close: false
              };
              this.alertService.successAlert(data);
            }
          })
      );
    } else {
      this.openWarningAlert(
        'Please select at least one check to proceed',
        'Error',
        'Got it'
      );
      this.loadingpush = false;
    }
  }

  getTotalCheckSum() {
    this.totalCheckSumLoading = true;
    if (this.isIndiaBazaarEnabled) {
      const persistedPayeeIds = this.checkService.getTotalCheckSumPayeeIds();
      const selectedPayeeIds = Array.from(
        new Set(
          (persistedPayeeIds?.length
            ? persistedPayeeIds
            : (
                this.dataTableService.dataTablePayload as
                  | { payeeIds?: (string | number)[] }
                  | undefined
              )?.payeeIds || []
          ).filter((payeeId) => !!payeeId)
        )
      );
      this.subscriptions.push(
        this.checkService
          .getTotalCheckSum({
            start_date: this.dataTableService.selectedDateRangeChequeCreated
              ?.start
              ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.start, 'yyyy-MM-dd')} 00:00:00`
              : '',
            end_date: this.dataTableService.selectedDateRangeChequeCreated?.end
              ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.end, 'yyyy-MM-dd')} 00:00:00`
              : '',
            payee_ids: selectedPayeeIds
          })
          .pipe(
            catchError((_error) =>
              of({ success: false, data: { total_amount: 0 } })
            ),
            finalize(() => {
              this.totalCheckSumLoading = false;
            })
          )
          .subscribe((res) => {
            if (res?.success) {
              this.totalCheckSum = res.data.total_amount;
              this.totalCheckSumChange.emit(this.totalCheckSum);
            }
          })
      );
    }
  }

  subscribeToFilterChanges(): void {
    this.subscriptions.push(
      this.dataTableService
        .getMainFilter()
        .pipe(debounceTime(300))
        .subscribe((filterData) => {
          if (filterData && (filterData.data || filterData.fieldId)) {
            if (filterData.fieldId === 'agGridFilter' || filterData.data) {
              this.getTotalCheckSum();
            }
          }
        })
    );

    this.subscriptions.push(
      this.dataTableService.getRefreshStatus().subscribe((refreshData) => {
        if (refreshData.status && refreshData.tableId === this.tableId) {
          this.getTotalCheckSum();
        }
      })
    );

    // Status filter added, from the status dropdown or from a panel tab
    this.subscriptions.push(
      this.v3DataTableService.updateV3DataTable$
        .pipe(debounceTime(300))
        .subscribe((res) => {
          const status = res?.['cheques.cheque_status']?.filter;
          this.syncScheduledDateColumn(
            status === undefined ? undefined : String(status)
          );
        })
    );

    // Status filter removed, eg the All tab or clearing the status dropdown
    this.subscriptions.push(
      this.v3DataTableService.updateV3DataTableByRemovingFilter$.subscribe(
        (removedFilters) => {
          this.syncScheduledDateColumn(
            removedFilters?.includes('cheques.cheque_status')
              ? ''
              : undefined
          );
        }
      )
    );
  }

  /**
   * @description Shows the Scheduled Date column only while the check list is filtered
   * by the Scheduled status, otherwise removes it.
   * @param {string} statusFromEvent - Status value when it is already known by the caller.
   */
  private syncScheduledDateColumn(statusFromEvent?: string): void {
    const { gridApi } = this.v3DataTableService;
    if (!gridApi) return; // grid not ready yet, re-run on the next filter/refresh event

    const status =
      statusFromEvent ??
      String(
        this.v3DataTableService.defaultPayload?.filterModel?.[
          'cheques.cheque_status'
        ]?.filter ?? ''
      );

    this.toggleScheduledDateColumn(status === this.SCHEDULED_CHECK_STATUS);
  }

  /**
   * @description Adds the Scheduled Date column right after the Issue Date column or
   * removes it, without touching the user's saved column visibility.
   * @param {boolean} show - Whether the column has to be displayed.
   */
  private toggleScheduledDateColumn(show: boolean): void {
    const { gridApi } = this.v3DataTableService;
    const currentColumnDefs = (gridApi?.getColumnDefs() ?? []) as ColDef[];
    const isColumnShown = currentColumnDefs.some(
      (col) => col.field === this.colDefScheduleDate.field
    );

    if (show === isColumnShown) return;

    let updatedColumnDefs: ColDef[];
    if (show) {
      updatedColumnDefs = [...currentColumnDefs];
      const issueDateIndex = updatedColumnDefs.findIndex(
        (col) => col.field === this.colDefDate.field
      );
      updatedColumnDefs.splice(
        issueDateIndex === -1 ? updatedColumnDefs.length : issueDateIndex + 1,
        0,
        this.colDefScheduleDate as ColDef
      );
    } else {
      this.clearScheduledDateFilter();
      updatedColumnDefs = currentColumnDefs.filter(
        (col) => col.field !== this.colDefScheduleDate.field
      );
    }

    gridApi?.setGridOption('columnDefs', updatedColumnDefs);
    gridApi?.applyColumnState({ state: [{ colId: 'id', pinned: 'left' }] });
  }

  /**
   * @description Removes any date filter applied on the Scheduled Date column, so it does
   * not keep filtering the list once the column is hidden.
   */
  private clearScheduledDateFilter(): void {
    const filterModel = this.v3DataTableService.defaultPayload?.filterModel;

    if (!filterModel?.[this.colDefScheduleDate.field]) return;

    delete filterModel[this.colDefScheduleDate.field];
    this.v3DataTableService.defaultPayload.startRow = 0;
    this.v3DataTableService.defaultPayload.endRow = 50;
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Formats the scheduled date value for export, matching the date only
   * format the cell renderer shows in the grid.
   * @param {string} value - Raw schedule_date value from the row data.
   * @returns {string} The formatted date.
   */
  formatScheduleDate(value?: string): string {
    if (!value) return '';

    return this.datePipe.transform(value, 'MM/dd/yyyy') ?? value;
  }

  onTotalCheckSumChange(totalSum: number): void {
    this.totalCheckSum = totalSum;
  }

  exportChecksToFreshBooks() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.integrationService
          .exportFreshBookChecks({ checkIds: selectedCheckIds })
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
              this.loadingpush = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              const data: ISuccessAlert = {
                title: 'Success!',
                content: 'Checks Exported Successfully.',
                close: false
              };
              this.alertService.successAlert(data);
              this.v3DataTableService.refreshV3DataTable();
            }
          })
      );
    }
  }

  /**
   * @description Handles Print Preview Checks button click.
   * Shows confirmation if all selected rows meet conditions, otherwise shows error.
   */
  goToBulkPrintPreviewChecks(): void {
    if (!this.selectedRow || this.selectedRow.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one check.',
        close: false
      });
      return;
    }

    // Mailed check statuses: 4 (Printing), 7 (Mailed), 807 (Mailed & Voided)
    const mailedCheckStatuses = [4, 7, 807];

    // Check which rows meet the Print Preview conditions
    const eligibleRows: string[] = [];
    const ineligibleReasons: ICheckListTableRowData[] = [];

    this.selectedRow.forEach((row) => {
      const hasValidStatus = mailedCheckStatuses.includes(row.cheque_status);

      if (hasValidStatus && row.id) {
        eligibleRows.push(row.id);
      } else {
        ineligibleReasons.push(row);
      }
    });

    // If no rows are eligible
    if (eligibleRows.length === 0) {
      this.alertService.failedAlert({
        content:
          'The selected checks aren’t eligible for print preview. Try selecting different checks.'
      });
      return;
    }

    // If some rows are not eligible
    if (ineligibleReasons.length > 0) {
      this.alertService.failedAlert({
        content:
          'Some of the selected checks are not eligible for print preview.'
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

  /**
   * @description Processes the print preview API call for the given check IDs.
   */
  private processPrintPreviewChecks(checkIds: string[]): void {
    this.setButtonState('id_print_mailed_preview', {
      loading: true,
      disabled: true
    });
    this.subscriptions.push(
      this.v3BulkPaymentService
        .processCheckMailPreviewPrint({ checkIds })
        .pipe(
          finalize(() => {
            this.setButtonState('id_print_mailed_preview', {
              loading: false,
              disabled: false
            });
          })
        )
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

  ngOnDestroy(): void {
    if (this.dataTableService.destroyPayload) {
      this.dataTableService.dataTablePayload = undefined;
      this.dataTableService.dateRangeNameChequeCreated = undefined;
      this.dataTableService.selectedDateRangeChequeCreated = undefined;
      this.dataTableService.selectedDateRangeCheque = undefined;
      this.dataTableService.dateRangeNameCheque = undefined;
    }
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.checkService.checkTrackingUrls.next(null);
  }
}

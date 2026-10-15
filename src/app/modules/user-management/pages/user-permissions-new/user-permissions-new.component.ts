import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { NgClass, NgOptimizedImage, TitleCasePipe } from '@angular/common';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { UserPermissionBankAccountComponent } from '../../components/user-permission-bank-account/user-permission-bank-account.component';
import { UserPermissionPayeeComponent } from '../../components/user-permission-payee/user-permission-payee.component';
import { UserWhitelistIpComponent } from '../../components/user-whitelist-ip/user-whitelist-ip.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { UserPermissionWalletComponent } from '../../components/user-permission-wallet/user-permission-wallet.component';
import {
  faAddressBook,
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faArrowLeft,
  faBriefcase,
  faBuildingColumns,
  faBuildings,
  faCopy,
  faCreditCard,
  faDollarSign,
  faFile,
  faFileInvoice,
  faFileInvoiceDollar,
  faGearComplex,
  faGlobe,
  faGrid2,
  faHandHoldingDollar,
  faMagnifyingGlass,
  faMoneyBillTrendUp,
  faMoneyCheckDollar,
  faShield,
  faUser,
  faWallet,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';
import {
  AllSelectAccount,
  BankAccountMapping,
  IBankPermissions,
  ICloudBankAccountsInfo,
  ICloudBankPaymentRequests,
  IIntegrationCategory,
  IIntegrationCompany,
  IIntegrationExpenses,
  IPermissionDetails,
  IPermissions,
  IPermissionSendData,
  IQbDeskCompanyList,
  IQbOnlineCompanyList,
  ISelectedPermissionsData,
  ISubSections,
  IUserPermissionList,
  IUsersList
} from 'src/app/models/user';
import { Utils } from 'src/app/data/utils';
import { ClonePermissionModalComponent } from '../../modals/clone-permission-modal/clone-permission-modal.component';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { environment } from 'src/environments/environment';

/**
 * Permissions "Allow All Permissions" deliberately leaves off — each one is a
 * restriction or an approval gate, so granting everything must not switch them
 * on. Shared with the per-module Select All check, which has to exempt exactly
 * the same names: counting a permission that Allow All refuses to set would
 * make a module read as "not fully selected" the moment it is re-verified, and
 * that turns the master checkbox back off on every tab change.
 */
const ALLOW_ALL_EXCLUDED_PERMISSIONS = [
  'is-approval-required-for-printing-bills',
  'only-show-payees-client-account',
  'is-approval-required-for-printing',
  'can-i-see-specific-user-data',
  // The three payee visibility rules are mutually exclusive — the reconciling
  // below leaves `payee-accounts` on and forces the other two off — so Payee
  // can never have every permission set. Counting the ones granting-everything
  // must switch off would leave its Select All permanently unticked.
  'only-show-selected-payees-and-payees-created-by-this-user'
];

@Component({
  standalone: true,
  selector: 'app-user-permissions-new',
  templateUrl: './user-permissions-new.component.html',
  styleUrls: ['./user-permissions-new.component.scss'],
  imports: [
    OcwBackButtonComponent,
    FormsModule,
    NgClass,
    NgOptimizedImage,
    FaIconComponent,
    MatTooltip,
    NgSelectModule,
    NgxMaskDirective,
    ReactiveFormsModule,
    ControlMessageComponent,
    FontAwesomeModule,
    UserPermissionBankAccountComponent,
    UserPermissionPayeeComponent,
    UserWhitelistIpComponent,
    CommonButtonV35Component,
    UserPermissionWalletComponent,
    TitleCasePipe,
    SearchFilterPipe
  ]
})
export class UserPermissionsNewComponent implements OnInit,OnDestroy {
  faArrowLeft = faArrowLeft;
  faBriefcase = faBriefcase;
  faAngleDown = faAngleDown;
  faCopyPaste = faCopy;
  faMagnifyingGlass = faMagnifyingGlass;
  faXmark = faXmark;

  @Input() appendTo = 'ng-select';
  private userService = inject(UserManagementService);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  protected v4AlertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private commmonService = inject(CommonOnInitService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  public userManagementV35Service = inject(UserManagementV35Service);
  private router = inject(Router);

  @Input() clientPermissionId: string;
  @Input() selectedUser: IUsersList;

  @Output() goBack = new EventEmitter<void>();

  types = [
    'Payee',
    'Check',
    'Receive Payment',
    'Recieve',
    'Bill',
    'Check Draft',
    'Business Tools',
    'Wallet',
    'Cloud Bank',
    'User',
    'Other Permission'
  ];

  modulesIcon = {
    'Bank account': faBuildingColumns,
    'Card': faCreditCard,
    'Wallet': faWallet,
    'Cloud Bank': faBuildingColumns,
    'Payee': faAddressBook,
    'Payments': faDollarSign,
    'Receive Payment': faHandHoldingDollar,
    'Invoice': faFileInvoiceDollar,
    'Credit Memo': faFileInvoice,
    'Bill': faFileInvoice,
    'Vendor Credit': faFileInvoice,
    'Check Draft': faMoneyCheckDollar,
    'Deposit Slip': faFile,
    'Cash Expense': faMoneyBillTrendUp,
    'User': faUser,
    'Company': faBuildings,
    'Other permissions': faGearComplex,
    'Whitelist IP': faShield,
    'Integration': faGrid2,
    'Virtual Card' : faCreditCard,
    'International Payment': faGlobe
  };

  bankTabLabels = [
    { value: 'bank', name: 'Bank Account' },
    { value: 'cash', name: 'Cash Account' }
  ];

  subscriptions: Subscription[] = [];
  client_id: string;
  loading = { fetching: true, submiting: false };

  activeIndex: number;
  activeId: string;
  activeListPermission: IPermissions;
  activeListSubSection: ISubSections[] = [];

  isItNewUser: boolean;
  allowAllPermissions: boolean;
  allowViewOnlyPermission: boolean;
  blankCheckActivated: boolean;
  printApprovalActivated: boolean;

  userPermissionList: IUserPermissionList[];
  userBankAccounts: { [key: string]: boolean } = {};
  userDetails: { name: string; status: number };

  // New properties for separated modules
  coreModules: IUserPermissionList[] = [];
  otherModules: IUserPermissionList[] = [];
  combinedPermissionList: IUserPermissionList[] = [];

  bankType: string = 'bank';

  bankAccountList: IBankPermissions = {};
  cashAccountList: { id: string; name: string }[] = [];
  cardsList: { name: string; id: string }[] = [];
  userCards: { [key: string]: boolean } = {};

  userPermissions: { [key: string]: boolean } = {};
  checkAllQB: { [key: string]: boolean } = {};
  allSelectedIndex: { [key: number]: boolean } = {};

  isSelectAll: boolean;
  isSelectAllModel: boolean;
  isSelectAllModeldesk: boolean;

  // Integration
  selectedCategory: string[][] = [];
  categoryListData: IIntegrationCategory[];
  qbOnlineArray: { companyId: string; categoryIds: string[] }[] = [];
  qbOnlinecategories: IQbOnlineCompanyList[];
  isSelectAllCategories: boolean;
  qbOnline: IPermissionDetails[] = [];
  qbDesktop: IPermissionDetails[] = [];
  netSuitePermission: IPermissionDetails[] = [];

  /** Keys the integration module stores its three products under. */
  readonly integrationProducts = [
    'quickbooks-online',
    'quickbooks-desktop',
    'netsuite'
  ];

  selectedCardPermissions: IPermissionDetails[] = [];
  isOnline: boolean;
  isDesktop: boolean;
  isThirdPartyApss = 'all';
  displayname: string;
  selectedExpenses: string[][] = [];
  expensesListData: IIntegrationCategory[];
  qbDesktopArray: { companyId: string; expenseIds: string[] }[] = [];
  qbDeskcategories: IQbDeskCompanyList[];
  isSelectCategory: boolean[];
  isSelectExpenses: boolean[];

  // cloud bank
  isCloudBankSelected = false;
  cloudTransactionLimit = new UntypedFormControl('0.0', [
    Validators.required,
    Validators.min(1)
  ]);

  checkTransactionLimit = new UntypedFormControl('0', [Validators.required]);
  achTransactionLimit = new UntypedFormControl('0', [Validators.required]);
  buttonDisabled = false;
  utils = Utils;
  isTransitionLimitSet = false;
  companyList: IIntegrationCompany[] = [];
  isOnlineCategory = false;
  isDesktopCategory = false;
  desktopCompanyList: IIntegrationCompany[] | undefined;
  moreInofrmationDesktopIndex: number;
  moreInofrmationOnlineIndex: number;
  permissionLength: number;
  cloudBankAccountLists: ICloudBankAccountsInfo;
  checkedCloudBankIds: { [key: string]: boolean } = {};
  cloudBankAccountsEnable: IPermissionDetails;
  selectAllCloudBankAccounts = false;
  enableCheckEmail = false;
  enableBillEmail = false;
  checkedCheckEmail = false;
  checkedBillEmail = false;
  cloudPaymentRequests: ICloudBankPaymentRequests;
  quickbookOnlineEnable: IPermissionDetails;
  quickbookDesktopEnable: IPermissionDetails;

  payeeTypeRestrictions: IPermissionDetails;
  createVirtualCardTypeRestrictions: IPermissionDetails[];
  updateVirtualCardTypeRestrictions: IPermissionDetails[];
  payeeTypes: IPermissionDetails[];
  isSelectPayee = false;
  isVirtualCard = false;

  pageArr: (number | '...')[] = [];
  mode = 1;
  initialPage = 0;
  selectedValue: number;
  totalPage = 0;
  initialCount = 1;
  pseudoI: number;
  faAngleRight = faAngleRight;
  faAngleLeft = faAngleLeft;
  limit = 50;
  selectedPage = 1;
  totalBankAccounts: number;
  totalCashAccounts: number;
  loadBankList = false;
  specificPageInput: number;
  selectAllAccounts = 0;
  permissions: IPermissions | undefined;
  depositSlipBankAccounts: { [key: string]: boolean } = {};
  selectedTab: IUserPermissionList;
  showBankDropDowns: { [key: string]: boolean } = {};
  showPayeeTable: { [key: string]: boolean } = {};
  selectedBanks: { [key: string]: { [key: string]: boolean } } = {};
  onSlectAllPermission: boolean;
  searchInput = '';
  isNoResultFound = false;
  envId = environment.env_id;
  isV4LayoutEnabled = signal(this.userManagementV35Service.isV4LayoutEnabled());

  private get alert() {
    return this.isV4LayoutEnabled() ? this.v4AlertService : this.alertService;
  }
  
  bankAccountTypes: BankAccountMapping = {
    depositslipBankAccountIds: 'depositslip-bank-accounts',
    BillBankAccountIds: 'bill-bank-accounts',
    invoiceBankAccountIds: 'invoice-bank-accounts',
    creditMemoBankAccountIds: 'creditmemo-bank-accounts',
    CheckDraftBankAccountIds: 'checkdraft-bank-accounts',
    CashExpenseBankAccountIds: 'cashexpense-bank-accounts',
    paymentLinkBankAccountIds: 'payment-link-bank-accounts',
    account: 'bankaccount',
    walletIds: 'wallet-accounts',
    virtualCardWalletIds: 'virtualcard-wallet-creation',
    paymentBankAccountIds: 'payment-bank-accounts',
    internationalPaymentWalletIds:'international-payment-wallets'
  };

  selectedUsers: IUsersList[] = [];
  filteredUsers: IUsersList[] = [];

  allSelectBanks = {
    selectAllDepositslipBankAccounts: 'depositslip-bank-accounts',
    selectAllBillBankAccounts: 'bill-bank-accounts',
    selectAllInvoiceBankAccounts: 'invoice-bank-accounts',
    selectAllCreditMemoBankAccounts: 'creditmemo-bank-accounts',
    selectAllCheckDraftBankAccounts: 'checkdraft-bank-accounts',
    selectAllCashExpenseBankAccounts: 'cashexpense-bank-accounts',
    selectAllPaymentLinkBankAccounts: 'payment-link-bank-accounts',
    selectAllBankAccounts: 'bankaccount',
    selectAllPayeeAccounts: 'payee-accounts',
    selectAllWallets: 'wallet-accounts',
    selectAllVirtualCardWallets: 'virtualcard-wallet-creation',
    selectAllPaymentBankAccounts: 'payment-bank-accounts',
    selectAllInternationalPaymentWallets: 'international-payment-wallets'
  };

  payeePermissionTypes = {
    payeeAccountIds: 'payee-accounts'
  };

  tabConfiguration: Record<string, { permissionKey: string[] }> = {
    'Bank account': {
      permissionKey: ['bankaccount']
    },
    Payee: {
      permissionKey: ['payee-accounts']
    },
    'Receive Payment': {
      permissionKey: ['payment-link-bank-accounts']
    },
    Invoice: {
      permissionKey: ['invoice-bank-accounts', 'creditmemo-bank-accounts']
    },
    Bill: {
      permissionKey: ['bill-bank-accounts']
    },
    'Check Draft': {
      permissionKey: ['checkdraft-bank-accounts']
    },
    'Deposit Slip': {
      permissionKey: ['depositslip-bank-accounts']
    },
    'Cash Expense': {
      permissionKey: ['cashexpense-bank-accounts']
    },
    Wallet: {
      permissionKey: ['wallet-accounts']
    },
    'Virtual Card' : {
      permissionKey : ['virtualcard-wallet-creation']
    },
    Payments: {
      permissionKey: ['payment-bank-accounts']
    },
    'International Payment': {
      permissionKey: ['international-payment-wallets']
    }
  };

  ngOnInit(): void {
    this.userManagementV35Service.selectedUser$.subscribe((res) => {
      if (res) {
        this.selectedUser = res;
        this.clientPermissionId = res.client_id;
        this.localStorageService.setItem(
          'clientPermissionId',
          this.clientPermissionId
        );
          this.getUrlParams();
          this.getPermissions();
        }
      });
      this.getPayeesList();
  }

  getSearchedPermissions(value: string) {
    const corePermission = this.coreModules.filter((item) =>
      item.name?.toLowerCase().includes(value.toLowerCase())
    );
    const otherPermission = this.otherModules.filter((item) =>
      item.name?.toLowerCase().includes(value.toLowerCase())
    );
    if (corePermission.length > 0) {
      this.tabChange(corePermission[0], 0, 'core');
      this.isNoResultFound = false;
    } else if (otherPermission.length > 0) {
      this.tabChange(otherPermission[0], 0, 'other');
      this.isNoResultFound = false;
    } else {
      this.isNoResultFound = true;
    }
  }

  goBackToUserActivity() {
    this.goBack.emit();
  }

  getUrlParams(): void {    
    this.client_id = this.clientPermissionId;
    // Check both route fragment and localStorage for new user flag
    this.isItNewUser = this.route.snapshot.fragment === 'new' ;
  }

  openClonePermissionsModal() {
    const dialogRef = this.dialog.open(ClonePermissionModalComponent, {
      maxWidth: '550px',
      width: '93%',
      data: { id: this.client_id, permission: this.permissionLength }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getPermissions();
      }
    });
  }

  onBlur(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value.trim();
    if (inputValue === '') {
      this.checkTransactionLimit.setValue('0');
    }
  }
  
  onBlurAch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value.trim();
    if (inputValue === '') {
      this.achTransactionLimit.setValue('0');
    }
  }

  getPermissions() {
    this.subscriptions.push(
      this.userService.getPermissions(this.initialCount).subscribe((res) => {
        if (res.success) {
          this.totalCashAccounts = res.data.cashAccountCount;
          this.totalBankAccounts = res.data.bankListCount;
          this.setPagination(res.data.bankListCount, res.data.cashAccountCount);
          // Always assign arrays, guard against undefined/null
          if (
            Array.isArray(res.data.permissions.core) &&
            Array.isArray(res.data.permissions.other)
          ) {
            const filteredCoreModules = res.data.permissions.core.filter((module: IUserPermissionList) => module.name === 'bankaccount');
            const showedCoreModules = environment.env_id === 'csnhc' ? filteredCoreModules : res.data.permissions.core;
            const filteredOtherModules = res.data.permissions.other.filter((module: IUserPermissionList) => ['payee', 'check','user'].includes(module.name));
            const showedOtherModules = environment.env_id === 'csnhc' ? filteredOtherModules : res.data.permissions.other;
            this.coreModules = showedCoreModules;
            this.otherModules = showedOtherModules;
            this.combinedPermissionList = [
              ...this.coreModules,
              ...this.otherModules
            ];
          } else if (Array.isArray(res.data.permissions)) {
            // fallback for old structure
            this.combinedPermissionList = res.data.permissions;
            this.coreModules = [];
            this.otherModules = [];
          } else {
            // fallback to empty arrays if nothing is present
            this.combinedPermissionList = [];
            this.coreModules = [];
            this.otherModules = [];
          }
          this.userPermissionList = this.combinedPermissionList;

          this.userDetails = res.data.userDetails;

          // Find bank account permissions from combined list
          const bankList = Array.isArray(this.combinedPermissionList)
            ? this.combinedPermissionList.filter(
                (r: IUserPermissionList) => r.name === 'bankaccount'
              )[0]
            : undefined;
          if (bankList) {
            this.bankAccountList = bankList['sub-sections']?.bankList!;
            this.cashAccountList = bankList['sub-sections']?.cashAccount!;
          }

          // Find credit card permissions from combined list
          const cardListItem = Array.isArray(this.combinedPermissionList)
            ? this.combinedPermissionList.filter(
                (item: IUserPermissionList) => item?.name === 'creditcard'
              )[0]
            : undefined;
          if (cardListItem) {
            this.cardsList = (cardListItem as any)?.creditCards || [];
          }

          /** cloud bank list permissions start */
          const cloudBankPermissions = Array.isArray(
            this.combinedPermissionList
          )
            ? this.combinedPermissionList.filter(
                (permissions: IUserPermissionList) =>
                  permissions.name === 'cloudbank'
              )[0]
            : undefined;
          if (cloudBankPermissions) {
            this.cloudBankAccountLists = (cloudBankPermissions as any)[
              'cloud-bank-accounts'
            ]?.[0];
            this.cloudPaymentRequests = (cloudBankPermissions as any)[
              'cloudbank-payment-request'
            ];
            if ((cloudBankPermissions as any)['cloud-bank-accounts']?.[0]) {
              this.cloudBankAccountLists = (cloudBankPermissions as any)[
                'cloud-bank-accounts'
              ][0];
            }
            if (
              (cloudBankPermissions as any)['cloudbank-accounts-enable']?.[0]
            ) {
              this.cloudBankAccountsEnable = (cloudBankPermissions as any)[
                'cloudbank-accounts-enable'
              ][0];
            }
          }
          /** cloud bank list permissions end */

          const integrationPermission = Array.isArray(
            this.combinedPermissionList
          )
            ? this.combinedPermissionList.filter(
                (permissions: IUserPermissionList) =>
                  permissions.name === 'integration'
              )[0]
            : undefined;
          if (integrationPermission) {
            const integrationPermissions: IPermissionDetails[] =
              (integrationPermission as any)['integration-enable'] || [];
            integrationPermissions?.forEach((element) => {
              if (element?.name === 'enable-qb-desktop-companies') {
                this.quickbookDesktopEnable = element;
              }
              if (element?.name === 'enable-qb-online-companies') {
                this.quickbookOnlineEnable = element;
              }
            });
          }

          for (const [i] of Array.isArray(this.combinedPermissionList)
            ? this.combinedPermissionList.entries()
            : []) {
            this.allSelectedIndex[i] = false;
          }

          /** Payee type restriction */
          const payeePermission = Array.isArray(this.combinedPermissionList)
            ? this.combinedPermissionList.filter(
                (permissions: IUserPermissionList) =>
                  permissions.name === 'payee'
              )[0]
            : undefined;
          if (payeePermission) {
            if ((payeePermission as any)['payeetype-restriction']?.[0]) {
              this.payeeTypeRestrictions = (payeePermission as any)[
                'payeetype-restriction'
              ][0];
            }
            if ((payeePermission as any).payeetype) {
              this.payeeTypes = (payeePermission as any).payeetype;
            }
          }

          /** Virtual card type restriction */
          const virtualCardPermission = Array.isArray(this.combinedPermissionList)
            ? this.combinedPermissionList.filter(
                (permissions: IUserPermissionList) =>
                  permissions.name === 'virtualcard'
              )[0]
            : undefined;
          if (virtualCardPermission?.permissions) {
            this.createVirtualCardTypeRestrictions = virtualCardPermission.permissions['create-card-types'] as IPermissionDetails[];
            this.updateVirtualCardTypeRestrictions = virtualCardPermission.permissions['update-card-types'] as IPermissionDetails[];
          }

          if (this.isItNewUser) {
            this.setNewUserDafaultPermission();
          } else {
            this.setInitialPermissionArray();
          }
          this.getSelectedPermissions();

          // Set initial selected tab: first core module, else first other module
          if (Array.isArray(this.coreModules) && this.coreModules.length > 0) {
            this.tabChange(this.coreModules[0], 0, 'core');
          } else if (
            Array.isArray(this.otherModules) &&
            this.otherModules.length > 0
          ) {
            this.tabChange(this.otherModules[0], 0, 'other');
          } else if (
            Array.isArray(this.combinedPermissionList) &&
            this.combinedPermissionList.length > 0
          ) {
            this.tabChange(this.combinedPermissionList[0], 0, 'combined');
          }
        }
        this.initializeSelectedBanks();
      })
    );
  }

  initializeSelectedBanks() {
    Object.entries(this.bankAccountTypes).forEach(([, value]) => {
      if (!this.selectedBanks[value]) {
        this.selectedBanks[value] = {};
      }
      if (value === 'cashexpense-bank-accounts') {
        this.cashAccountList.forEach((acc) => {
          if (
            this.selectedBanks['cashexpense-bank-accounts']?.[acc.id] ===
            undefined
          ) {
            this.selectedBanks['cashexpense-bank-accounts'][acc.id] = false;
          }
        });
      }
    });
  }

  getSelectedPermissions() {
    this.loading.fetching = true;
    this.subscriptions.push(
      this.userService
        .getSelectedPermissions(this.client_id)
        .pipe(
          finalize(() => {
            this.loading.fetching = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (
              res.data.account.length === 0 &&
              res.data.cloud_bank_accounts.length === 0 &&
              res.data.permission.length === 0
            ) {
              this.permissionLength = 0;
            }
            this.checkTransactionLimit.setValue(res.data.check_amount_limit);
            this.achTransactionLimit.setValue(res.data.ach_amount_limit || '0');
            res.data.permission.forEach((e: { name: string }) => {
              this.userPermissions[e.name] = true;
            });

            res.data.account.forEach((e: string) => {
              this.userBankAccounts[e] = true;
            });

            this.selectedUsers = this.userManagementV35Service.usersDetails.filter((user) => res.data.allowedUserIds?.includes(user.client_id));

            this.qbOnlinecategories = res.data.qbOnlineCompanyIds;
            if (res.data.qbOnlineCompanyIds) {
              res.data.qbOnlineCompanyIds.forEach((ele, index: number) => {
                this.qbOnlineArray.push({
                  companyId: ele.companyId,
                  categoryIds: ele.categoryIds
                });
                this.selectedCategory[index] = ele.categoryIds;
              });
            }

            this.qbDeskcategories = res.data.qbDesktopCompanyIds;
            if (res.data.qbDesktopCompanyIds) {
              res.data.qbDesktopCompanyIds.forEach((ele, index: number) => {
                this.qbDesktopArray.push({
                  companyId: ele.companyId,
                  expenseIds: ele.expenseIds
                });
                this.selectedExpenses[index] = ele.expenseIds;
              });
            }
            res.data?.credit_cards?.forEach((el: string) => {
              this.userCards[el] = true;
            });

            if (this.userPermissions['cloudbank-bank-accounts']) {
              res?.data?.cloud_bank_accounts?.forEach((e: string) => {
                this.checkedCloudBankIds[e] = true;
              });
            }
            this.printApprovalActivated =
              this.userPermissions['is-approval-required-for-printing'];
            if (this.userPermissions['is-approval-required-for-printing']) {
              this.enableCheckEmail = true;
            }
            if (
              this.userPermissions['is-approval-required-for-printing-bills']
            ) {
              this.enableBillEmail = true;
            } 

            const isAllowViewOnlyPermissions = res.data?.permission?.some((e: { name: string }) => e.name === 'allow-view-only-permissions');
            const isAllowAllPermissions = res.data?.permission?.some((e: { name: string }) => e.name === 'allow-all-permissions');

            if (
              isAllowViewOnlyPermissions
            ) {              
              this.allowViewOnlyPermission = true;
            }
            if (
              isAllowAllPermissions
            ) {
              this.allowAllPermissions = true;
              Object.keys(this.allSelectedIndex).forEach((k: string) => {
                this.allSelectedIndex[+k] = true;
              });
            }

            this.processAccountResponse(res.data);
            this.onClickCheckBox(undefined, true);
            this.isSeletedAllCloudBankAccounts();
            this.onPermissionsLoaded();
          }
        })
    );
  }

  protected onPermissionsLoaded(): void {}

  protected onPermissionsSaved(): void {}

  processAccountResponse(res: ISelectedPermissionsData): void {
    (
      Object.entries(this.bankAccountTypes) as [
        keyof BankAccountMapping,
        string
      ][]
    ).forEach(([responseKey, dropdownKey]) => {
      // Check if dropdownKey is included in the permissions
      const isDropdownKeyIncludedInPermissions = res.permission.some(
        (permission) => permission.name === dropdownKey
      );

      // If it's included in permissions, show the dropdown, otherwise hide it
      if (!this.isItNewUser) {
        this.showBankDropDowns[dropdownKey] =
          isDropdownKeyIncludedInPermissions;
      }
      const accountIds = res[responseKey];
      if (accountIds?.length > 0) {
        this.showBankDropDowns[dropdownKey] = true;
        this.selectedBanks[dropdownKey] ??= {};

        // Create an object to store ID mappings with boolean values
        const bankIdMap: { [key: string]: boolean } = {};

        accountIds.forEach((id) => {
          // Set the boolean value to true for each ID
          bankIdMap[id] = true;
        });
        if (dropdownKey === 'cashexpense-bank-accounts') {
          const cashAccountIds = accountIds.filter((id) =>
            this.cashAccountList.some((item) => item.id === id)
          );
          if (cashAccountIds.length > 0) {
            this.showBankDropDowns['cashexpense-bank-accounts'] = true;
            cashAccountIds.forEach((id) => {
              this.selectedBanks['cashexpense-bank-accounts'][id] = true;
            });
          }
        }

        // Update the permissionBankId signal with the new mapping
        this.userManagementV35Service.permissionBankId.update(
          (currentValue) => ({
            ...currentValue,
            [dropdownKey]: {
              ...(currentValue[dropdownKey] || {}),
              ...bankIdMap
            }
          })
        );
      } else {
        this.userManagementV35Service.permissionBankId.update(
          (currentValue) => ({
            ...currentValue,
            [dropdownKey]: {}
          })
        );
      }
    });

    (
      Object.entries(this.payeePermissionTypes) as [
        keyof BankAccountMapping,
        string
      ][]
    ).forEach(([responseKey, dropdownKey]) => {
      // Check if dropdownKey is included in the permissions
      const isDropdownKeyIncludedInPermissions = res.permission.some(
        (permission) => permission.name === dropdownKey
      );

      // If it's included in permissions, show the dropdown, otherwise hide it
      this.showPayeeTable[dropdownKey] = isDropdownKeyIncludedInPermissions;
      const payeeIds = res[responseKey];
      if (payeeIds?.length > 0) {
        this.showPayeeTable[dropdownKey] = true;

        // Create an object to store ID mappings with boolean values
        const payeeIdMap: { [key: string]: boolean } = {};

        payeeIds.forEach((id) => {
          // Set the boolean value to true for each ID
          payeeIdMap[id] = true;
        });

        // Update the permissionPayeeId signal with the new mapping
        this.userManagementV35Service.permissionPayeeId.update(
          (currentValue) => ({
            ...currentValue,
            [dropdownKey]: {
              ...(currentValue[dropdownKey] || {}),
              ...payeeIdMap
            }
          })
        );
      } else {
        this.userManagementV35Service.permissionPayeeId.update(
          (currentValue) => ({
            ...currentValue,
            [dropdownKey]: {}
          })
        );
      }
    });
  }

  selectAllCategory(
    categoryArray: IIntegrationCategory[] | undefined,
    isChecked: boolean,
    index: number
  ) {
    const categories = categoryArray as IIntegrationCategory[];
    if (isChecked) {
      this.selectedCategory[index] = categories.map((category) => category.id);
      this.qbOnlineArray[index].categoryIds = this.selectedCategory[index];
    } else {
      this.selectedCategory[index] = [];
    }
  }

  selectAllExpenses(
    expensesArray: IIntegrationExpenses[] | undefined,
    isChecked: boolean,
    index: number
  ) {
    const expenses = expensesArray as IIntegrationExpenses[];
    if (isChecked) {
      this.selectedExpenses[index] = expenses.map(
        (expense) => expense.encrypted_id
      );
      this.qbDesktopArray[index].expenseIds = this.selectedExpenses[index];
    } else {
      this.selectedExpenses[index] = [];
    }
  }

  goToQbMainPage() {
    this.isThirdPartyApss = 'all';
  }

  /** Default Permissions (Normal) for newly created users */
  setNewUserDafaultPermission() {
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCompassRequirement'
      )
    ) {
      return;
    }
    const newUserDefaultPermissions = [
      'bankaccount-read',
      'payee-read',
      'check-read'
    ];

    for (const item of this.combinedPermissionList) {
      if (item?.permissions?.normal) {
        for (const e of item.permissions.normal) {
          if (newUserDefaultPermissions.includes(e.name)) {
            this.userPermissions[e.name] = true;
          } else {
            this.userPermissions[e.name] = false;
          }
        }
      }
    }

    // A new user gets no integration access by default, but the keys still have
    // to exist for "Allow All Permissions" to be able to switch them on.
    this.setInitialIntegrationPermissions();

    // this.createPermissionArray();
  }

  // --------start qbonilne------//

  showQbOnlineData(item: IUserPermissionList[]) {
    this.onClickCheckBox('online');
    this.qbOnlineArray = [];

    // Find integration module dynamically
    const integrationModule = this.combinedPermissionList.find(
      (module) => module.name === 'integration'
    );
    if (
      integrationModule &&
      (integrationModule as any)['quickbooks-online']?.companyList?.companies
    ) {
      this.companyList = (integrationModule as any)[
        'quickbooks-online'
      ]?.companyList?.companies;
    }

    this.companyList.forEach((elem: IIntegrationCompany) => {
      this.qbOnlineArray.push({ companyId: elem.id, categoryIds: [] });
    });

    this.qbOnlinecategories?.forEach((d: IQbOnlineCompanyList) => {
      this.qbOnlineArray.forEach((d2) => {
        if (d.companyId === d2.companyId) {
          d2.categoryIds = d.categoryIds;
        }
      });
    });

    this.isThirdPartyApss = 'online';
    if (
      integrationModule &&
      (integrationModule as any)['quickbooks-online']?.permissions?.normal
    ) {
      this.qbOnline = (integrationModule as any)[
        'quickbooks-online'
      ]?.permissions?.normal;
    }
  }

  CategorySelect(
    event: string[],
    i: number,
    categoryArray: IIntegrationCategory[] | undefined
  ) {
    const categories = categoryArray as IIntegrationCategory[];
    const selectedCategory = event;
    const totalCategories = categories;
    if (selectedCategory?.length === totalCategories?.length) {
      this.isSelectCategory[i] = true;
    } else {
      this.isSelectCategory[i] = false;
    }

    this.qbOnlineArray[i].categoryIds = event;
    if (event.length !== 0) {
      this.selectedCategory[i] = event;
    }
  }

  // ---------end qbonline---//

  // ----start qbdesktop------//

  showQbDesktopData(item: IUserPermissionList[]) {
    this.onClickCheckBox('desktop');
    this.qbDesktopArray = [];

    // Find integration module dynamically
    const integrationModule = this.combinedPermissionList.find(
      (module) => module.name === 'integration'
    );
    this.desktopCompanyList =
      integrationModule &&
      (integrationModule as any)['quickbooks-desktop']?.companyList?.companies;

    if (this.desktopCompanyList) {
      this.desktopCompanyList.forEach((ele: IIntegrationCompany) => {
        this.qbDesktopArray.push({ companyId: ele.id, expenseIds: [] });
      });
    }

    this.qbDeskcategories?.forEach((d: IQbDeskCompanyList) => {
      this.qbDesktopArray.forEach((d2) => {
        if (d.companyId === d2.companyId) {
          d2.expenseIds = d.expenseIds;
        }
      });
    });

    this.isThirdPartyApss = 'desktop';
    if (
      integrationModule &&
      (integrationModule as any)['quickbooks-desktop']?.permissions?.normal
    ) {
      this.qbDesktop = (integrationModule as any)[
        'quickbooks-desktop'
      ]?.permissions?.normal;
    }
  }

  showNetSuite(item: IUserPermissionList[]): void {
    this.onClickCheckBox('netsuite');
    this.isThirdPartyApss = 'netsuite';

    // Find integration module dynamically
    const integrationModule = this.combinedPermissionList.find(
      (module) => module.name === 'integration'
    );
    if (
      integrationModule &&
      (integrationModule as any).netsuite?.permissions?.normal
    ) {
      this.netSuitePermission = (
        integrationModule as any
      ).netsuite?.permissions?.normal;
    }
  }

  expenseSelect(
    event: string[],
    i: number,
    expensesArray: IIntegrationExpenses[] | undefined
  ) {
    const expenses = expensesArray as IIntegrationExpenses[];
    const selectedExpenses = event;
    const totalExpenses = expenses;
    if (selectedExpenses?.length === totalExpenses?.length) {
      this.isSelectExpenses[i] = true;
    } else {
      this.isSelectExpenses[i] = false;
    }
    this.qbDesktopArray[i].expenseIds = event;
    if (event.length !== 0) {
      this.selectedExpenses[i] = event;
    }
  }

  expandQbCompanyist(
    event: string,
    i: number,
    company: IIntegrationCompany,
    selectedItems: string[]
  ) {
    if (event === 'online') {
      this.isSelectCategory = new Array(this.companyList?.length).fill(false);
      const categories = selectedItems;
      if (categories?.length === company?.categories?.length) {
        this.isSelectCategory[i] = true;
      }
      this.moreInofrmationOnlineIndex =
        this.moreInofrmationOnlineIndex === i ? -1 : i;
    }
    if (event === 'desktop') {
      this.isSelectExpenses = new Array(this.desktopCompanyList?.length).fill(
        false
      );
      const categories = selectedItems;
      if (categories?.length === company?.expenses?.length) {
        this.isSelectExpenses[i] = true;
      }
      this.moreInofrmationDesktopIndex =
        this.moreInofrmationDesktopIndex === i ? -1 : i;
    }
  }
  // ------end qbdesktop-----//

  /** Create an array of all permissions to do diffrent actions */
  setInitialPermissionArray(): void {
    for (const item of this.combinedPermissionList) {
      if (item?.permissions?.normal) {
        for (const e of item?.permissions?.normal!) {
          this.userPermissions[e.name] = false;
        }
      }

      if (item?.hasOwnProperty('sub-sections') && item['sub-sections']?.data) {
        item['sub-sections']?.data?.forEach((subItem: ISubSections) => {
          if (subItem.permissions?.normal) {
            for (const e of subItem.permissions.normal) {
              this.userPermissions[e.name] = false;
            }
          }
        });
      }
    }
    this.setInitialIntegrationPermissions();
    this.createPermissionArray();
  }

  /**
   * Seeds the integration products' permissions. The integration module hangs
   * QuickBooks Online, QuickBooks Desktop and NetSuite off itself rather than
   * under `permissions` or `sub-sections`, so the generic walk above steps past
   * them and their keys never reach `userPermissions` — which is what "Allow
   * All Permissions" and the save payload both iterate. Without this they can
   * only ever be ticked by opening each integration and using its own Select
   * All.
   * @returns {void}
   */
  setInitialIntegrationPermissions(): void {
    const integrationModule = this.combinedPermissionList.find(
      (module) => module.name === 'integration'
    ) as unknown as
      | Record<string, { permissions?: IPermissions } | undefined>
      | undefined;
    if (!integrationModule) {
      return;
    }

    this.integrationProducts.forEach((product) => {
      const permissions = integrationModule[product]?.permissions;
      [permissions?.normal, permissions?.sp, permissions?.ap].forEach((group) =>
        group?.forEach((e: IPermissionDetails) => {
          this.userPermissions[e.name] = false;
        })
      );
    });
  }

  createPermissionArray(): void {
    const accountsPermissions: string[] = Object.values(this.bankAccountTypes);
    for (const item of this.combinedPermissionList) {
      if (item?.permissions?.sp) {
        for (const e of item.permissions.sp) {
          if (this.isItNewUser && accountsPermissions.includes(e.name)) {
            this.userPermissions[e.name] = true;
          } else {
            this.userPermissions[e.name] = false;
          }
        }
      }

      if (item?.permissions?.ap) {
        for (const e of item.permissions.ap) {
          this.userPermissions[e.name] = false;
        }
      }

      if (item?.hasOwnProperty('sub-sections') && item['sub-sections']?.data) {
        item['sub-sections'].data.forEach((subItem: ISubSections) => {
          if (subItem.permissions?.sp) {
            for (const e of subItem.permissions.sp) {
              if (this.isItNewUser && accountsPermissions.includes(e.name)) {
                this.userPermissions[e.name] = true;
              } else {
                this.userPermissions[e.name] = false;
              }
            }
          }
          if (subItem.permissions?.ap) {
            for (const e of subItem.permissions.ap) {
              this.userPermissions[e.name] = false;
            }
          }
        });
      }
    }

    for (const e of this.cashAccountList) {
      this.userBankAccounts[e.id] = false;
    }
  }

  getSelectedBankIds(bankType: string): string[] {
    // Special case for "cashexpense-bank-accounts"
    if (bankType === 'cashexpense-bank-accounts') {
      const permissionBankIds =
        this.userManagementV35Service.permissionBankId()[bankType] || {};
      const selectedBanks = this.selectedBanks[bankType] || {};

      // Merge IDs from both sources and check if any value is true
      const mergedIds = { ...permissionBankIds, ...selectedBanks };

      // Collect all IDs where the value is true
      return Object.entries(mergedIds)
        .filter(([, isSelected]) => isSelected)
        .map(([id]) => id);
    }

    // Default case
    if (!this.userManagementV35Service.permissionBankId()[bankType]) {
      return [];
    }

    return Object.entries(
      this.userManagementV35Service.permissionBankId()[bankType] || {}
    )
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);
  }

  getSelectedPayeeIds(bankType: string): string[] {
    if (!this.userManagementV35Service.permissionPayeeId()[bankType]) {
      return [];
    }

    return Object.entries(
      this.userManagementV35Service.permissionPayeeId()[bankType] || {}
    )
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);
  }

  onSubmit() {
    const hasAnyPermission = Object.values(this.userPermissions).some(
      (value) => value === true
    );

    if (hasAnyPermission) {
      this.savePermission();
    } else {
      const alert = this.alert.warningAlert({
        content:
          'No permissions have been assigned to this user. Would you like to proceed?',
        doneMsg: 'Proceed',
        cancelMsg: 'No',
        isCancel: true
      });
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.savePermission();
        }
      });
    }
  }

  /**
   * @description Validates that when specific permissions are enabled, 
   * the user has selected at least one bank account, payee, wallet, or card
   * @param {IPermissionSendData} body - The permission data to validate
   * @returns {boolean} Returns true if validation passes, false otherwise
   */
  validateRequiredSelections(body: IPermissionSendData): boolean {
    // Map bankAccountTypes keys to body property names
    // const bankAccountTypeToBodyKey: Record<string, keyof IPermissionSendData> = {
    //   'depositslip-bank-accounts': 'depositslipBankAccountIds',
    //   'bill-bank-accounts': 'BillBankAccountIds',
    //   'invoice-bank-accounts': 'invoiceBankAccountIds',
    //   'creditmemo-bank-accounts': 'creditMemoBankAccountIds',
    //   'checkdraft-bank-accounts': 'CheckDraftBankAccountIds',
    //   'cashexpense-bank-accounts': 'CashExpenseBankAccountIds',
    //   'payment-link-bank-accounts': 'paymentLinkBankAccountIds',
    //   bankaccount: 'bankIds',
    //   'wallet-accounts': 'walletIds',
    //   'virtualcard-wallet-creation': 'virtualCardWalletIds',
    //   'payment-bank-accounts': 'paymentBankAccountIds',
    //   // 'international-payment-wallets': 'internationalPaymentWalletIds'
    // };

    // Map bankAccountTypes keys to selectAll property names
    // const bankAccountTypeToSelectAllKey: Record<string, keyof IPermissionSendData> = {
    //   'depositslip-bank-accounts': 'selectAllDepositslipBankAccounts',
    //   'bill-bank-accounts': 'selectAllBillBankAccounts',
    //   'invoice-bank-accounts': 'selectAllInvoiceBankAccounts',
    //   'creditmemo-bank-accounts': 'selectAllCreditMemoBankAccounts',
    //   'checkdraft-bank-accounts': 'selectAllCheckDraftBankAccounts',
    //   'cashexpense-bank-accounts': 'selectAllCashExpenseBankAccounts',
    //   'payment-link-bank-accounts': 'selectAllPaymentLinkBankAccounts',
    //   bankaccount: 'selectAllBankAccounts',
    //   'wallet-accounts': 'selectAllWallets',
    //   'virtualcard-wallet-creation': 'selectAllVirtualCardWallets',
    //   'payment-bank-accounts': 'selectAllPaymentBankAccounts',
    //   // 'international-payment-wallets': 'selectAllInternationalPaymentWallets'
    // };

    // Check bank account permissions
    // const bankAccountEntries = Object.entries(this.bankAccountTypes);
    // const invalidBankPermission = bankAccountEntries.find(([, permissionName]) => {
    //   // Check if permission is enabled in body
    //   if (body.permissionData.includes(permissionName)) {
    //     const bodyKey = bankAccountTypeToBodyKey[permissionName];
    //     const selectAllKey = bankAccountTypeToSelectAllKey[permissionName];
        
    //     if (!bodyKey || !selectAllKey) {
    //       return false;
    //     }

    //     const selectedIds = (body[bodyKey] as string[]) || [];
    //     const selectAllValue = (body[selectAllKey] as number) || 0;

    //     // Check if this is wallet permission
    //     // if (permissionName === 'wallet-accounts' || permissionName === 'virtualcard-wallet-creation' || permissionName === 'international-payment-wallets') {
    //     if (permissionName === 'wallet-accounts' || permissionName === 'virtualcard-wallet-creation') {
    //       return selectAllValue === 0 && selectedIds.length === 0;
    //     }
    //     // For bank account permissions
    //     return selectAllValue === 0 && selectedIds.length === 0;
    //   }

    //   // Special check for bankaccount permissions (read, update, delete)
    //   if (permissionName === 'bankaccount') {
    //     const bankAccountPermissions = ['bankaccount-read', 'bankaccount-update', 'bankaccount-delete'];
    //     const hasBankAccountPermission = bankAccountPermissions.some(permission => 
    //       body.permissionData.includes(permission) && !body.permissionData.includes('bankaccount-view-all')
    //     );
    //     if (hasBankAccountPermission) {
    //       const selectedIds = body.bankIds || [];
    //       const selectAllValue = body.selectAllBankAccounts || 0;
    //       return selectAllValue === 0 && selectedIds.length === 0;
    //     }
    //   }
    //   return false;
    // });

    // if (invalidBankPermission) {
    //   const [, permissionName] = invalidBankPermission;
    //   const displayName = this.getDisplayNameForPermission(permissionName);
    //   const isWallet = permissionName === 'wallet-accounts' || 
    //                    permissionName === 'virtualcard-wallet-creation'; 
    //                   //  permissionName === 'international-payment-wallets';
    //   this.alertService.warningAlert({
    //     content: `${displayName} permission is enabled, but no ${isWallet ? 'wallet' : 'bank account'} is selected. Please select at least one ${isWallet ? 'wallet' : 'bank account'} or disable this permission.`
    //   });
    //   return false;
    // }

    // Check payee permissions
    const payeePermissionName = 'payee-accounts';
    const hasPayeePermission = body.permissionData.includes(payeePermissionName) || 
                               body.permissionData.includes('only-show-selected-payees-and-payees-created-by-this-user');
    
    if (hasPayeePermission) {
      const selectedPayeeIds = body.payeeAccountIds || [];
      const selectAllPayees = body.selectAllPayeeAccounts || 0;
      
      if (selectAllPayees === 0 && selectedPayeeIds.length === 0) {
        this.alert.warningAlert({
          content: 'Payee permission is enabled, but no payee is selected. Please select at least one payee or disable the permission.'
        });
        return false;
      }
    }

    // Check if credit card permissions are enabled but no cards selected
    const creditCardPermissions = ['creditcard-view', 'creditcard-delete', 'creditcard-update'];
    const hasCreditCardPermission = creditCardPermissions.some(permission => 
      body.permissionData.includes(permission)
    );
    
    if (hasCreditCardPermission && !body.permissionData.includes('creditcard-view-all')) {
      const selectedCards = body.creditcardIds || [];

      if (selectedCards.length === 0 && this.cardsList?.length > 0) {
        this.alertService.warningAlert({
          content: 'Credit Card permission is enabled, but no card is selected. Please select at least one card or disable the permission.'
        });
        return false;
      }
    }

    // Check cloud bank permissions
    if (body.permissionData.includes('cloudbank-bank-accounts')) {
      const selectedCloudBanks = body.cloudBankIds || [];
      
      if (selectedCloudBanks.length === 0) {
        this.alert.warningAlert({
          content: 'You have enabled Cloud Bank accounts permission but have not selected any cloud bank accounts. Please select at least one account or disable the permission.'
        });
        return false;
      }
    }

    return true;
  }

  /**
   * @description Gets a user-friendly display name for a permission
   * @param {string} permissionName - The permission name
   * @returns {string} The display name
   */
  getDisplayNameForPermission(permissionName: string): string {
    const displayNames: { [key: string]: string } = {
      'depositslip-bank-accounts': 'Deposit Slip',
      'bill-bank-accounts': 'Bill',
      'invoice-bank-accounts': 'Invoice',
      'creditmemo-bank-accounts': 'Credit Memo',
      'checkdraft-bank-accounts': 'Check Draft',
      'cashexpense-bank-accounts': 'Cash Expense',
      'payment-link-bank-accounts': 'Receive Payment',
      'wallet-accounts': 'Wallet',
      'virtualcard-wallet-creation': 'Virtual Card Wallet',
      'payment-bank-accounts': 'Payment',
      'international-payment-wallets': 'International Payment'
    };

    if (permissionName === 'bankaccount') {
      return 'Bank Account';
    }
    
    return displayNames[permissionName] || permissionName;
  }

  savePermission(): void {
    // empty the varible if qb online company permission is disabled.
    if (!this.userPermissions['enable-qb-online-companies']) {
      this.qbOnlineArray = [];
    }
    //empty the varible if qb desktop company permission is disabled.
    if (!this.userPermissions['enable-qb-desktop-companies']) {
      this.qbDesktopArray = [];
    }

    const body: IPermissionSendData = {
      permissionData: [],
      bankIds: [],
      cloudBankIds: [],
      creditcardIds: [],
      checkAmountLimit: 0,
      selectAllBankAccounts: 0,
      qbOnlineCompanyIds: this.qbOnlineArray,
      qbDesktopCompanyIds: this.qbDesktopArray,
      depositslipBankAccountIds: [],
      invoiceBankAccountIds: [],
      creditMemoBankAccountIds: [],
      BillBankAccountIds: [],
      paymentLinkBankAccountIds: [],
      CheckDraftBankAccountIds: [],
      CashExpenseBankAccountIds: [],
      payeeAccountIds: [],
      walletIds: [],
      virtualCardWalletIds: [],
      paymentBankAccountIds: [],
      selectAllDepositslipBankAccounts: 0,
      selectAllPaymentLinkBankAccounts: 0,
      selectAllInvoiceBankAccounts: 0,
      selectAllCreditMemoBankAccounts: 0,
      selectAllBillBankAccounts: 0,
      selectAllCheckDraftBankAccounts: 0,
      selectAllCashExpenseBankAccounts: 0,
      selectAllPayeeAccounts: 0,
      selectAllWallets: 0,
      selectAllVirtualCardWallets: 0,
      achAmountLimit: 0,
      selectAllPaymentBankAccounts: 0,
      payeeAccounts: [],
      internationalPaymentWalletIds: [],
      selectAllInternationalPaymentWallets: 0,
      allowedUserIds: []
    };

    if (
      (this.isTransitionLimitSet && this.cloudTransactionLimit.invalid) ||
      this.checkTransactionLimit.invalid ||
      this.achTransactionLimit.invalid
    ) {
      this.cloudTransactionLimit.markAsTouched();
      return;
    }

    if (this.payeeTypes && this.payeeTypeRestrictions) {
      this.payeePermission();
    }
    if (!this.isSelectPayeeType()) return;

    for (const item in this.userPermissions) {
      if (this.userPermissions[item]) {
        body.permissionData.push(item);
      }
    }

    for (const item in this.userCards) {
      if (this.userCards[item]) {
        body.creditcardIds.push(item);
      }
    }
    // cloud bank ids
    if (this.userPermissions['cloudbank-bank-accounts']) {
      for (const item in this.checkedCloudBankIds) {
        if (this.checkedCloudBankIds[item]) {
          body.cloudBankIds.push(item);
        }
      }
    }

    (
      Object.entries(this.bankAccountTypes) as [
        keyof BankAccountMapping,
        string
      ][]
    ).forEach(([permissionKey, bodyKey]) => {
      if (permissionKey === 'account') {
        body.bankIds = this.getSelectedBankIds(bodyKey);
      } else if (body.permissionData.includes(bodyKey)) {
        body[permissionKey] = this.getSelectedBankIds(bodyKey);
      } else {
        body[permissionKey] = [];
      }
    });

    (
      Object.entries(this.payeePermissionTypes) as [
        keyof BankAccountMapping,
        string
      ][]
    ).forEach(([permissionKey, bodyKey]) => {
      if (body.permissionData.includes(bodyKey) || this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user']) {
        body[permissionKey] = this.getSelectedPayeeIds(bodyKey);
      } else {
        body[permissionKey] = [];

      }
    });

    // Iterate through all permissions and set values based on conditions
    Object.entries(this.allSelectBanks).forEach(([permissionKey, bodyKey]) => {
      if (this.onSlectAllPermission && this.allowAllPermissions) {
        body[permissionKey as keyof AllSelectAccount] = 1;
      } else {
        // Special handling for wallet accounts
        // eslint-disable-next-line no-lonely-if
        if (bodyKey === 'wallet-accounts' || bodyKey === 'virtualcard-wallet-creation') {
          // Check if all wallets are selected using the allWalletsSelected signal
          const allWalletsSelected = this.userManagementV35Service.allWalletsSelected()[bodyKey];
          if (allWalletsSelected) {
            body[permissionKey as keyof AllSelectAccount] = 1;
          } else {
            body[permissionKey as keyof AllSelectAccount] = 0;
          }
        } else {
          // Check selectAllAccounts and all values in permissionBankId for the given bodyKey
          const permissions =
            this.userManagementV35Service.permissionBankId()[bodyKey];
          const allPermissionsTrue =
            permissions &&
            Object.keys(permissions).length > 0 &&
            Object.values(permissions).every((value) => value === true);
          // Set the value based on the conditions
          if (this.selectAllAccounts && allPermissionsTrue) {
            body[permissionKey as keyof AllSelectAccount] = 1;
          } else if (this.onSlectAllPermission && allPermissionsTrue === false) {
            body[permissionKey as keyof AllSelectAccount] = 0;
          } else if (this.onSlectAllPermission && !permissions) {
            body[permissionKey as keyof AllSelectAccount] = 1;
          } else {
            body[permissionKey as keyof AllSelectAccount] = 0;
          }
        }
      }

      if (this.userManagementV35Service.selectAllPermission()?.[bodyKey]) {
        body[permissionKey as keyof AllSelectAccount] = 1;
      }
    });

    if (this.userPermissions['is-approval-required-for-printing']) {
      body.checkAmountLimit = this.checkTransactionLimit.value;
    }
    
    if (this.userPermissions['is-approval-required-for-ach']) {
      body.achAmountLimit = this.achTransactionLimit.value as number;
    }

    if (this.checkedCheckEmail) {
      body.permissionData.push('enable-check-email-notification');
    }

    if (this.checkedBillEmail) {
      body.permissionData.push('enable-bill-email-notification');
    }

    if(this.userPermissions['can-i-see-specific-user-data']) {
      body.allowedUserIds = this.selectedUsers.map((user) => user.client_id);
    }else{
      this.selectedUsers = [];
    }

    if(body.allowedUserIds.length === 0 && this.userPermissions['can-i-see-specific-user-data']) {
      this.alert.warningAlert({
        content: 'No user selected. Please select at least one user to enable this permission.',
        doneMsg: 'OK',
        cancelMsg: 'Cancel',
        isCancel: true,
      });
      return;
    }

    const indexOfAllowAllPermissions = body.permissionData.indexOf('allow-all-permissions');
    const indexOfAllowViewOnlyPermissions = body.permissionData.indexOf('allow-view-only-permissions');
    
    // Remove both permissions first
    if (indexOfAllowAllPermissions > -1) {
      body.permissionData.splice(indexOfAllowAllPermissions, 1);
    }
    if (indexOfAllowViewOnlyPermissions > -1) {
      body.permissionData.splice(indexOfAllowViewOnlyPermissions, 1);
    }
    
    // Add the appropriate permission based on conditions
    if (this.allowViewOnlyPermission) {
      body.permissionData.push('allow-view-only-permissions');
    } else if (this.allowAllPermissions) {
      body.permissionData.push('allow-all-permissions');
    }

    if (this.userPermissions['payee-accounts'] || this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user']) {
      // Filter payeeAccounts to only include actually selected payees
      const selectedPayeeIds = this.userManagementV35Service.permissionPayeeId();
      const allPayeeLimits = this.userManagementV35Service.permissionPayeeLimit();
      
      // Get the current permission name for payee-accounts
      const payeePermissionName = 'payee-accounts';
      const currentSelectedPayees = selectedPayeeIds[payeePermissionName] || {};
      
      // Filter limit data to only include selected payees
      const filteredPayeeLimits = allPayeeLimits.filter(limitItem => 
        currentSelectedPayees[limitItem.id] === true
      );
      
      body.payeeAccounts = filteredPayeeLimits;
    } else if (this.userPermissions['only-show-payees-client-account']) {
      this.userManagementV35Service.permissionPayeeLimit.set([]);
      this.userManagementV35Service.permissionPayeeId.set({});
    }

    // Validate that required selections are made when permissions are enabled
    if (environment.env_id !== 'compass' && environment.env_id !== 'csnhc' && !this.validateRequiredSelections(body) ) {
      return;
    }

    this.loading.submiting = true;
    this.subscriptions.push(
      this.userService
        .createPermissions(body, this.client_id)
        .pipe(
          finalize(() => {
            this.loading.submiting = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alert.successAlert({
              content: this.isItNewUser
                ? 'User permission added successfully'
                : 'User permission updated successfully'
            });
            this.onPermissionsSaved();
            if(this.isItNewUser){
              this.router.navigate(this.isV4LayoutEnabled() ? ['/v4/manage/manage-users/index'] : ['/manage/manage-users/index']);
            }
          }
        })
    );
  }

  onClickCheckBox(type?: string,isAllSelected?: boolean): void {    
    let allChecked: boolean[] = [];
    const permissions: IPermissions = { normal: [], ap: [], sp: [] };

    let currentPermission: IUserPermissionList | undefined;

    if (this.combinedPermissionList[this.activeIndex]?.name === 'integration') {
      if (type === 'online') {
        currentPermission =
          this.combinedPermissionList[this.activeIndex]['quickbooks-online'];
      } else if (type === 'desktop') {
        currentPermission =
          this.combinedPermissionList[this.activeIndex]['quickbooks-desktop'];
      } else if (type === 'netsuite') {
        currentPermission =
          this.combinedPermissionList[this.activeIndex].netsuite;
      }
    } else if (
      this.combinedPermissionList[this.activeIndex]?.name !== 'integration'
    ) {
      currentPermission = this.combinedPermissionList[this.activeIndex];
    }
    
    /** card permisions start */
    const cardPermissions = (allChecked: boolean[]) => {
      for (const el of this.cardsList) {
        allChecked.push(this.userCards[el.id] ? true : false);
      }

      return allChecked;
    };

    if (this.activeId === 'creditcard' && this.userPermissions['creditcard-view-all']) {
      this.userPermissions['creditcard-view'] = true;
    }

    if (this.activeId === 'creditcard' && !this.userPermissions['creditcard-view-all']) {
      allChecked = cardPermissions(allChecked);
    }
    /** card permisions end */

    const currentTab = this.tabConfiguration[this.selectedTab?.displayName];

    if (currentTab?.permissionKey && type) {
      this.userManagementV35Service.selectAllPermission.update((value) => ({
        ...value,
        [type]: undefined
      }));
      if (type === 'cashexpense-bank-accounts') {
        allChecked = this.cashAccountList.map(
          (e) => !!this.selectedBanks[type][e.id]
        );
        allChecked = Object.values(this.bankAccountList).flatMap((v) =>
          v.accounts.map((e) => !!this.selectedBanks[type][e.id])
        );
      } else if (type === 'payee-accounts') {
        const isChecked = computed(() => {
          const permission =
            this.userManagementV35Service.permissionPayeeId()?.[type];
          return permission
            ? Object.values(permission).every((value) => value === true)
            : false;
        });

        allChecked.push(isChecked());
      } else {
        const isChecked = computed(() => {
          const permission =
            this.userManagementV35Service.permissionBankId()?.[type];
          return permission
            ? Object.values(permission).every((value) => value === true)
            : false;
        });

        allChecked.push(isChecked());
      }
    }

    if (
      currentPermission?.hasOwnProperty('sub-sections') &&
      currentPermission['sub-sections']?.data
    ) {
      for (const e of currentPermission['sub-sections'].data) {
        permissions.ap.push(...e.permissions?.ap);
        permissions.sp.push(...e.permissions?.sp);
        permissions.normal.push(...e.permissions?.normal);
      }
    }

    if (currentPermission?.hasOwnProperty('permissions')) {
      permissions.ap.push(...currentPermission.permissions?.ap!);
      permissions.sp.push(...currentPermission.permissions?.sp!);
      permissions.normal.push(...currentPermission.permissions?.normal!);
    }

    // Exempt in all three groups, not just `sp`: these are the permissions
    // Allow All refuses to set, so counting them here would make the module
    // read as incomplete and switch the master checkbox off on tab change.
    const countTowardsSelectAll = (group: IPermissionDetails[]) => {
      for (const e of group) {
        if (!ALLOW_ALL_EXCLUDED_PERMISSIONS.includes(e.name)) {
          allChecked.push(this.userPermissions[e.name] ? true : false);
        }
      }
    };

    countTowardsSelectAll(permissions?.normal);
    countTowardsSelectAll(permissions?.sp);
    countTowardsSelectAll(permissions?.ap);

    if(environment.env_id !== 'csnhc') {
      for (const e of this.createVirtualCardTypeRestrictions) {
        allChecked.push(this.userPermissions[e.name] ? true : false);
      }
      
      for (const e of this.updateVirtualCardTypeRestrictions) {
        allChecked.push(this.userPermissions[e.name] ? true : false);
      }
    } 

    if (
      this.allowAllPermissions &&
      (this.selectedTab?.displayName === 'Integration' || this.selectedTab?.displayName === 'Whitelist IP')
    ) {
      allChecked.push(true);
    }
    
    if (!allChecked.includes(false) && allChecked.includes(true)) {
      this.allSelectedIndex[this.activeIndex] = true;
      if (this.activeIndex === 0) {
        this.selectAllAccounts = 1;
      }
    } else {
      this.allSelectedIndex[this.activeIndex] = false;
      if (this.activeIndex === 0) {
        this.selectAllAccounts = 0;
      }
    }
    const permission = this.userManagementV35Service.selectAllPermission();
    if (
      typeof permission === 'boolean' &&
      allChecked.includes(false) &&
      currentTab?.permissionKey
    ) {
      currentTab?.permissionKey.forEach((item) => {
        this.userManagementV35Service.indexPermission.set({ [item]: false });
      });
    }
    this.checkVirtualCardPermissions();
    this.checkIfAllSelected(isAllSelected);
    this.checkViewOnlyPermissionsSelected(isAllSelected);
    if(this.userPermissions['check-directdeposit'] && !this.userPermissions['receivedcheck-manual-ach']) {
      this.userPermissions['receivedcheck-manual-ach'] = true;
    }
  }

  onRowClicked(event: string) {
    if (event) {
      this.onClickCheckBox(event);
    }
  }

  selectAll(checked: boolean, type?: string) {
    this.selectAllAccounts = checked ? 1 : 0;
    const checkAllPermission = (permissions: IPermissions) => {
      for (const e of permissions?.normal) {
        this.userPermissions[e.name] = checked;
      }

      for (const e of permissions?.sp) {
        this.userPermissions[e.name] = checked;
        if (this.userPermissions[e.name] === true) {
          if (e.name === 'is-approval-required-for-printing') {
            this.enableCheckEmail = true;
          }
          if (e.name === 'is-approval-required-for-printing-bills') {
            this.enableBillEmail = true;
          }
        } else {
          this.enableCheckEmail = false;
          this.enableBillEmail = false;
        }
        if (this.userPermissions['payee-accounts'] === true) {
          this.userPermissions['only-show-payees-client-account'] = false;
          this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user'] = false;
        }
        if(checked && this.userPermissions['can-i-see-other-user-data']) {
          this.userPermissions['can-i-see-specific-user-data'] = false;
        }else if(checked && this.userPermissions['can-i-see-specific-user-data']) {
          this.userPermissions['can-i-see-other-user-data'] = false;
        }
      }

      for (const e of permissions?.ap) {
        this.userPermissions[e.name] = checked;
      }
    };

    this.selectAllVirtualCardPermissions(checked);

    if (type) {
      if (type === 'online') {
        this.permissions =
          this.combinedPermissionList[this.activeIndex][
            'quickbooks-online'
          ]?.permissions;
      } else if (type === 'desktop') {
        this.permissions =
          this.combinedPermissionList[this.activeIndex][
            'quickbooks-desktop'
          ]?.permissions;
      } else if (type === 'netsuite') {
        this.permissions =
          this.combinedPermissionList[this.activeIndex].netsuite?.permissions;
      }
    } else {
      this.permissions =
        this.combinedPermissionList[this.activeIndex]?.permissions;
    }

    if (this.permissions) {
      checkAllPermission(this.permissions);
    }

    if (this.activeId === 'creditcard') {
      for (const e of this.cardsList) {
        this.userCards[e.id] = checked;
      }
    } else if (this.activeListSubSection?.length) {
      for (const e of this.activeListSubSection) {
        if (e.permissions) {
          checkAllPermission(e.permissions);
        }
      }
    }

    const currentTab = this.tabConfiguration[this.selectedTab?.displayName];

    if (!currentTab) {
      return;
    }

    const { permissionKey } = currentTab;

    permissionKey.forEach((key) => {
      if (checked === false && !this.userPermissions[key]) {
        this.clearBankAccounts(key);
        if (key === 'payee-accounts') {
          this.showPayeeTable[key] = false;
          this.clearPayeeAccounts('payee-accounts');
        }
        this.showBankDropDowns[key] = false;
      } else {
        this.showBankDropDowns[key] = true;
        if (key === 'payee-accounts') {
          this.showPayeeTable[key] = true;
        }
        if (key === 'cashexpense-bank-accounts') {
          this.updateBankAccounts('cashexpense-bank-accounts');
        }
        this.userManagementV35Service.indexPermission.set({ [key]: true });
      }
      this.userManagementV35Service.selectAllPermission.update((value) => ({
        ...value,
        [key]: checked
      }));
    });

    this.blankCheckActivated = this.userPermissions['check-create'];
    this.printApprovalActivated =
      this.userPermissions['is-approval-required-for-printing'];

    this.checkIfAllSelected();
  }

  clearBankAccounts(permissionKey: string): void {
    // Check if the permissionKey exists in selectedBanks and set all values to false
    if (this.selectedBanks[permissionKey]) {
      Object.keys(this.selectedBanks[permissionKey]).forEach((accountId) => {
        this.selectedBanks[permissionKey][accountId] = false;
      });
    }

    // Update permissionBankId corresponding to the given permissionKey
    if (this.userManagementV35Service.permissionBankId()[permissionKey]) {
      const currentBankIds =
        this.userManagementV35Service.permissionBankId()[permissionKey];

      // Create a new object with all values set to false
      const updatedBankIds: { [key: string]: boolean } = {};
      Object.keys(currentBankIds).forEach((id) => {
        updatedBankIds[id] = false;
      });

      // Update the permissionBankId signal with the updated values
      this.userManagementV35Service.permissionBankId.update((currentValue) => ({
        ...currentValue,
        [permissionKey]: updatedBankIds
      }));
    }
  }

  clearPayeeAccounts(permissionKey: string) {
    if (this.userManagementV35Service.permissionPayeeId()[permissionKey]) {
      const currentPayeeIds =
        this.userManagementV35Service.permissionPayeeId()[permissionKey];

      // Create a new object with all values set to false
      const updatedPayeeIds: { [key: string]: boolean } = {};
      Object.keys(currentPayeeIds).forEach((id) => {
        updatedPayeeIds[id] = false;
      });

      // Update the permissionPayeeId signal with the updated values
      this.userManagementV35Service.permissionPayeeId.update(
        (currentValue) => ({
          ...currentValue,
          [permissionKey]: updatedPayeeIds
        })
      );
    }
  }

  updateBankAccounts(permissionKey: string): void {
    // Initialize the permission key object if it doesn't exist
    if (!this.selectedBanks[permissionKey]) {
      this.selectedBanks[permissionKey] = {};
    }

    // Update all accounts under this permission key
    if (this.selectedBanks[permissionKey]) {
      Object.keys(this.selectedBanks[permissionKey]).forEach((accountId) => {
        this.selectedBanks[permissionKey][accountId] = true;
      });
    }
  }

  checkIfAllSelected(isAllSelected?: boolean): void {    
    if(isAllSelected) return;
    
    setTimeout(() => {
      if (
        !Object.values(this.allSelectedIndex).includes(false) &&
        Object.values(this.allSelectedIndex).includes(true)
      )
        this.allowAllPermissions = true;
      else this.allowAllPermissions = false;
    }, 100);
  }

  checkViewOnlyPermissionsSelected(isAllSelected?: boolean): void {
    if(isAllSelected) return;
    
    // Get all permissions that match read/view/see pattern
    const viewOnlyPermissions = Object.keys(this.userPermissions).filter(key => /(read|view|see)/.test(key));
    
    if (viewOnlyPermissions.length === 0) {
      this.allowViewOnlyPermission = false;
      return;
    }
    
    // Check if all view-only permissions are true and all other permissions are false
    const allViewOnlyTrue = viewOnlyPermissions.every(key => this.userPermissions[key] === true);
    const allOtherFalse = Object.keys(this.userPermissions)
      .filter(key => !/(read|view|see)/.test(key))
      .every(key => this.userPermissions[key] === false);
    
    // Set allowViewOnlyPermission to true only if all view-only permissions are true AND all other permissions are false
    this.allowViewOnlyPermission = allViewOnlyTrue && allOtherFalse;
  }

  // when the cloud bank accounts is not enabled cloud bank account will be unchecked
  onClickCheckCloudBankAccounts() {
    if (
      this.activeId === 'cloudbank' &&
      this.userPermissions['cloudbank-bank-accounts']
    ) {
      this.cloudBankAccountLists?.accounts?.forEach((ele) => {
        this.checkedCloudBankIds[ele.id] = this.selectAllCloudBankAccounts;
      });
    } else {
      this.selectAllCloudBankAccounts = false;
      this.cloudBankAccountLists?.accounts?.forEach((ele) => {
        this.checkedCloudBankIds[ele.id] = false;
      });
    }
  }

  // using this function we can check the select all check box for cloud bank accounts.
  isSeletedAllCloudBankAccounts() {
    let trueCount = 0;
    for (const key in this.checkedCloudBankIds) {
      if (this.checkedCloudBankIds[key] === true) {
        trueCount += 1;
      }
    }
    if (trueCount === this.cloudBankAccountLists?.accounts?.length) {
      this.selectAllCloudBankAccounts = true;
    } else {
      this.selectAllCloudBankAccounts = false;
    }
  }

  onClickAllowAllPermissions(checked: boolean): void {
    this.onSlectAllPermission = checked;
    if(checked){
      this.allowViewOnlyPermission = false;
    }
    for (const i of Object.keys(this.userPermissions)) {
      if (!ALLOW_ALL_EXCLUDED_PERMISSIONS.includes(i)) {
        this.userPermissions[i] = checked;
      }
    }

    for (const i of Object.keys(this.userBankAccounts)) {
      this.userBankAccounts[i] = checked;
    }

    // Used to set the whole data selection in payload
    this.selectAllAccounts = checked ? 1 : 0;

    // when the cloud bank accounts is not enabled cloud bank account will be unchecked
    if (this.userPermissions['cloudbank-bank-accounts']) {
      this.cloudBankAccountLists?.accounts?.forEach((ele) => {
        this.checkedCloudBankIds[ele.id] = checked;
      });
    } else {
      this.cloudBankAccountLists?.accounts?.forEach((ele) => {
        this.checkedCloudBankIds[ele.id] = false;
      });
    }
    this.selectAllCloudBankAccounts = checked;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [k] of Object.entries(this.allSelectedIndex)) {
      this.allSelectedIndex[k as unknown as number] = checked;
    }

    this.blankCheckActivated = this.userPermissions['check-create'];
    this.printApprovalActivated =
      this.userPermissions['is-approval-required-for-printing'];

    Object.entries(this.bankAccountTypes).forEach(([, value]) => {
      this.userManagementV35Service.selectAllPermission.update((item) => ({
        ...item,
        [value]: checked
      }));
      if (value === 'cashexpense-bank-accounts') {
        this.updateBankAccounts('cashexpense-bank-accounts');
      }
      this.showBankDropDowns[value] = checked;
      if (!checked) {
        this.clearBankAccounts(value);
      }
    });

    Object.entries(this.payeePermissionTypes).forEach(([, value]) => {
      this.userManagementV35Service.selectAllPermission.update((item) => ({
        ...item,
        [value]: checked
      }));
      this.showPayeeTable[value] = checked;
      if (!checked) {
        this.clearPayeeAccounts('payee-accounts');
      }
    });
    for (const e of this.cardsList) {
      this.userCards[e.id] = checked;
    }

    if (this.userPermissions['payee-accounts'] === true) {
      this.userPermissions['only-show-payees-client-account'] = false;
      this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user'] = false;
    }

    if (this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user'] === true) {
      this.userPermissions['payee-accounts'] = false;
      this.userPermissions['only-show-payees-client-account'] = false;
    }

    this.selectAllVirtualCardPermissions(checked);

  }

  onClickViewOnlyPermissions(checked: boolean) {
    this.allowViewOnlyPermission = checked;
    if(checked){
      this.allowAllPermissions = false;
    }

    const removedViewPermissions = ['can-i-see-specific-user-data'];
    for (const key of Object.keys(this.userPermissions)) {
      if (/(read|view|see)/.test(key) && !removedViewPermissions.includes(key)) {
        this.userPermissions[key] = checked;
      } else {
        this.userPermissions[key] = false;
      }
    }

    this.selectAllAccounts = 0;
    this.selectAllCloudBankAccounts = false;
    this.blankCheckActivated = false;
    this.printApprovalActivated = false;

    Object.entries(this.bankAccountTypes).forEach(([, value]) => {
      this.userManagementV35Service.selectAllPermission.update((item) => ({
        ...item,
        [value]: false
      }));
      this.showBankDropDowns[value] = false;
      this.clearBankAccounts(value);
    });

    Object.entries(this.payeePermissionTypes).forEach(([, value]) => {
      this.userManagementV35Service.selectAllPermission.update((item) => ({
        ...item,
        [value]: false
      }));
      this.showPayeeTable[value] = false;
      this.clearPayeeAccounts('payee-accounts');
    });

    (Array.isArray(this.combinedPermissionList) ? this.combinedPermissionList : []).forEach((_, i) => {
      this.allSelectedIndex[i] = false;
    });

  }

    // Update tabChange to accept a source type
  tabChange(
    item: IUserPermissionList,
    i: number,
    source: 'core' | 'other' | 'combined' = 'combined'
  ): void {
    
    this.selectedTab = item;
    if (source === 'core') {
      this.activeIndex = i;
    } else if (source === 'other') {
      this.activeIndex = this.coreModules.length + i;
    } else {
      this.activeIndex = i;
    }
    this.activeId = item.name;
    this.activeListPermission = item.permissions!;

    if (item?.name === 'payee') {
      this.isSelectPayee = true;
    } else {
      this.isSelectPayee = false;
    }
    
    if (item?.name === 'virtualcard') {
      this.isVirtualCard = true;
    } else {
      this.isVirtualCard = false;
    }

    this.isThirdPartyApss = 'all';

    if (item.displayName === 'Integration') {
      this.isSelectAll = true;
    } else {
      this.isSelectAll = false;
    }

    if (item['sub-sections']?.data) {
      this.activeListSubSection = item['sub-sections'].data;
    } else {
      this.activeListSubSection = [];
    }

    // Opening a tab must not re-derive the two master checkboxes. They are
    // derived from allSelectedIndex, which onClickCheckBox only ever refreshes
    // for the module being opened — so one module that legitimately cannot read
    // as fully selected latches them off, and since no later tab change
    // revisits that entry they can never come back on. Guarded exactly as the
    // initial load guards itself in getPermissions(): a master the user has
    // switched on stays on until they switch it off or change a permission.
    this.onClickCheckBox(
      undefined,
      this.allowAllPermissions || this.allowViewOnlyPermission
    );
  }

  // To disable check create permission check box when blank check checked.
  onClickSpecialPermission(item: IPermissionDetails, checked: boolean): void {
    if (item.name === 'can-make-blank-check') {
      if (checked) {
        this.userPermissions['check-create'] = true;
        this.blankCheckActivated = true;
      } else {
        this.userPermissions['check-create'] = false;
        this.blankCheckActivated = false;
      }
    }
    if (item.name === 'can-this-user-approve-other-user-printing-request') {
      if (checked) {
        this.userPermissions['can-i-see-other-user-data'] = true;
        this.togglePermission(
          'can-this-user-approve-other-user-printing-request'
        );
      } else {
        this.userPermissions['can-i-see-other-user-data'] = false;
      }
    }
    if (item.name === 'is-approval-required-for-printing') {
      if (checked) {
        this.printApprovalActivated = true;
        this.enableCheckEmail = true;
        this.togglePermission('is-approval-required-for-printing');
      } else {
        this.printApprovalActivated = false;
        this.enableCheckEmail = false;
      }
    }
    if (item.name === 'is-approval-required-for-printing-bills') {
      if (checked) {
        this.enableBillEmail = true;
      } else {
        this.enableBillEmail = false;
      }
    }
    
    if (checked && item.name === 'payee-accounts') {
      this.togglePermission('payee-accounts');
    }

    if (checked && item.name === 'only-show-payees-client-account') {
      this.togglePermission('only-show-payees-client-account');
    }

    if (checked && item.name === 'only-show-selected-payees-and-payees-created-by-this-user') {
      this.togglePermission('only-show-selected-payees-and-payees-created-by-this-user');
    }

    if (checked && item.name === 'can-i-see-specific-user-data' && this.userPermissions['can-i-see-other-user-data']) {
      this.userPermissions['can-i-see-other-user-data'] = false;
    }
    if (checked && item.name === 'can-i-see-other-user-data' && this.userPermissions['can-i-see-specific-user-data']) {
      this.userPermissions['can-i-see-specific-user-data'] = false;
    }

    Object.entries(this.bankAccountTypes).forEach(([, value]) => {
      if (item.name === value) {
        this.showBankDropDowns[value] = checked;
      }
    });

    Object.entries(this.payeePermissionTypes).forEach(([, value]) => {
      if (item.name === value) {
        this.showPayeeTable[value] = checked;
      }
    });

  }

  isBankAccount(itemName: string): boolean {
    return Object.values(this.bankAccountTypes).includes(itemName);
  }

  /**
   * Used to set one permission at a time.
   * Both permissions cannot be active simultaneously.
   * @param {('is-approval-required-for-printing'|'can-this-user-approve-other-user-printing-request' | 'payee-accounts')} permission - The permission to toggle
   */
  togglePermission(
    permission:
      | 'is-approval-required-for-printing'
      | 'can-this-user-approve-other-user-printing-request'
      | 'payee-accounts'
      | 'only-show-payees-client-account'
      | 'only-show-selected-payees-and-payees-created-by-this-user'
  ) {
    if (permission === 'is-approval-required-for-printing') {
      if (
        this.userPermissions[
          'can-this-user-approve-other-user-printing-request'
        ]
      ) {
        this.userPermissions[
          'can-this-user-approve-other-user-printing-request'
        ] = false;
        this.userPermissions['can-i-see-other-user-data'] = false;
      }
    } else if (this.userPermissions['is-approval-required-for-printing']) {
      this.userPermissions['is-approval-required-for-printing'] = false;
      this.printApprovalActivated = false;
      this.enableCheckEmail = false;
    }

    if (permission === 'payee-accounts') {
      if (this.userPermissions['only-show-payees-client-account']) {
        this.userPermissions['only-show-payees-client-account'] = false;
      }
      if (this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user']) {
        this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user'] = false;
      }
    }

    if (permission === 'only-show-payees-client-account') {

      if (this.userPermissions['payee-accounts']) {
        this.userPermissions['payee-accounts'] = false;
        this.showPayeeTable['payee-accounts'] = false;
      }
      if (this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user']) {
        this.userPermissions['only-show-selected-payees-and-payees-created-by-this-user'] = false;
      }
    }

    if (permission === 'only-show-selected-payees-and-payees-created-by-this-user') {
      if (this.userPermissions['payee-accounts']) {
        this.userPermissions['payee-accounts'] = false;
        this.showPayeeTable['payee-accounts'] = false;
      }
      if (this.userPermissions['only-show-payees-client-account']) {
        this.userPermissions['only-show-payees-client-account'] = false;
      }
    }
  }

  checkTranslimit() {
    if (!this.isTransitionLimitSet) {
      this.cloudTransactionLimit.setValue('0');
    } else {
      this.cloudTransactionLimit.setValue('');
    }
  }

  /**
   * @description Remove payee type permission when untick payee restriction permission.
   * @param {boolean} checked
   */
  onClickPayeeRestriction(checked: boolean): void {
    if (!checked) {
      this.payeeTypes.forEach((el) => {
        this.userPermissions[el.name] = checked;
      });
    }
  }

    /**
   * @description Remove payee type permission when untick payee restriction permission.
   */
    checkVirtualCardPermissions(): void {  
      if(environment.env_id === 'csnhc') return;
        if (this.userPermissions['virtualcard-create']) {
          // Check if all values are false or undefined
          const allFalseOrUndefined = this.createVirtualCardTypeRestrictions.every((el) => 
            this.userPermissions[el.name] === false || this.userPermissions[el.name] === undefined
          );
          if (allFalseOrUndefined) {
            // If all are false or undefined, set all to true
            this.userPermissions[this.createVirtualCardTypeRestrictions[0].name] = true;
          } 
        }
        if (this.userPermissions['virtualcard-update-settings']) {
          const allUpdateFalseOrUndefined = this.updateVirtualCardTypeRestrictions.every((el) => 
            this.userPermissions[el.name] === false || this.userPermissions[el.name] === undefined
          ); 
          if (allUpdateFalseOrUndefined) {
            this.userPermissions[this.updateVirtualCardTypeRestrictions[0].name] = true;
          }
        }
    }


  selectAllVirtualCardPermissions(checked: boolean): void {
    if(environment.env_id === 'csnhc') return;
    this.createVirtualCardTypeRestrictions.forEach((item) => {
      this.userPermissions[item.name] = checked;
    });
    this.updateVirtualCardTypeRestrictions.forEach((item) => {
      this.userPermissions[item.name] = checked;
    });
  }
  

  /**
   * @description Remove some permissions based on condtions.
   * This function is specifically created for Bryan Cohen Enterprise customer.
   */
  payeePermission(): void {
    if (
      (!this.userPermissions['payee-create'] &&
        !this.userPermissions['payee-update']) ||
      !this.userPermissions['payee-type-restriction']
    ) {
      this.userPermissions[this.payeeTypeRestrictions?.name] = false;
      this.payeeTypes.forEach((el) => {
        this.userPermissions[el?.name] = false;
      });
    }
  }

  /**
   * @description Checks if at least one payee type permission is selected when giving permission to create or update a payee.
   * This function is specifically created for Bryan Cohen Enterprise customer.
   * @returns {boolean} Returns true if at least one payee type permission is selected, otherwise false.
   */
  isSelectPayeeType(): boolean {
    let isSelectPayeeType = true;
    const isPayeeRestriction = this.userPermissions['payee-type-restriction'];
    const isCustomerType = this.userPermissions['payeetype-customer'];
    const isVendorType = this.userPermissions['payeetype-vendor'];
    const isEmployeeType = this.userPermissions['payeetype-employee'];
    if (this.commmonService.isBrayanCohenCustomer()) {
      if (
        isPayeeRestriction &&
        !isCustomerType &&
        !isVendorType &&
        !isEmployeeType
      ) {
        this.alert.warningAlert({
          content: 'Please select atleast one payee type.'
        });
        isSelectPayeeType = false;
      }
    }
    return isSelectPayeeType;
  }

  selectBankType(type: string): void {
    this.bankType = type;
    this.mode = 1;
    this.initialCount = 1;
    this.initialPage = 0;
    this.selectedPage = 1;
    this.setPagination(this.totalBankAccounts, this.totalCashAccounts);
  }

  setPagination(totalBankAccount: number, totalCashAccount: number): void {
    if (this.bankType === 'bank') {
      this.totalPage = Math.ceil(totalBankAccount / this.limit);
    } else {
      this.totalPage = Math.ceil(totalCashAccount / this.limit);
    }
    this.paginationArray();
  }

  onPrevious() {
    if (this.initialPage > 0) {
      this.initialPage -= 1;
      this.gotoPage(this.initialPage);
    }
  }

  onNext() {
    if (this.initialPage < this.totalPage - 1) {
      this.initialPage += 1;
      this.gotoPage(this.initialPage);
    }
  }

  /**
   * @description  Navigating to a specific page.
   * @param {number} item - The page number to navigate to.
   */
  gotoPage(item: number) {
    if (item > this.totalPage) return;
    this.selectedPage = item;
    if (item >= 0) {
      this.initialPage = item;
      if (item < this.initialCount + 3) {
        this.mode = 1;
        this.paginationArray();
      } else if (item >= this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item + 1;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }
    this.getNextBankAccount(item);
  }

  /**
   * @description populates the `pageArr` array based on the current mode.
   * It creates an array representing the pagination buttons to be displayed.
   */
  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  getNextBankAccount(page: number) {
    this.loadBankList = true;
    this.subscriptions.push(
      this.userService
        .getPermissions(page)
        .pipe(
          finalize(() => {
            this.loadBankList = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const bankList = res.data.permissions.filter(
              (r: IUserPermissionList) => r.name === 'bankaccount'
            )[0];
            this.bankAccountList = bankList['sub-sections']?.bankList;
            this.cashAccountList = bankList['sub-sections']?.cashAccount;
            for (const [_k, v] of Object.entries(this.bankAccountList)) {
              for (const e of v.accounts) {
                if (
                  this.selectAllAccounts === 1 ||
                  this.userBankAccounts[e.id] === false
                ) {
                  this.userBankAccounts[e.id] = this.selectAllAccounts === 1;
                }
                Object.entries(this.bankAccountTypes).forEach(([, value]) => {
                  if (!this.selectedBanks[value]) {
                    this.selectedBanks[value] = {};
                  }
                  if (value === 'cashexpense-bank-accounts') {
                    this.cashAccountList.forEach((item) => {
                      if (
                        this.selectAllAccounts === 1 ||
                        !this.selectedBanks[value][item.id]
                      ) {
                        this.selectedBanks[value][item.id] =
                          this.selectAllAccounts === 1;
                      }
                    });
                    if (
                      this.selectAllAccounts === 1 ||
                      this.selectedBanks[value][e.id] === false
                    ) {
                      this.selectedBanks[value][e.id] =
                        this.selectAllAccounts === 1;
                    }
                  }
                });
              }
            }
          }
        })
    );
  }

  isUserSelected(userSelected: IUsersList): boolean {
    return this.selectedUsers?.some((user) => user?.id?.toString() === userSelected?.id?.toString());
  }

  shouldDisable(item: IPermissionDetails){
    return (item.name === 'can-i-see-other-user-data' && this.userPermissions['can-i-see-specific-user-data']) || (item.name === 'can-i-see-specific-user-data' && this.userPermissions['can-i-see-other-user-data']);
  }

  clearItem(userId: string) {
    this.selectedUsers = this.selectedUsers.filter(
      (selected) => selected.client_id !== userId
    );
  }

  getPayeesList(): void {
    this.filteredUsers = this.userManagementV35Service.usersDetails.filter(
      (user) => user.client_id !== this.clientPermissionId
    );
  }

  ngOnDestroy(): void {
    this.userManagementV35Service.permissionBankId.set({});
    this.userManagementV35Service.permissionPayeeId.set({});
    this.userManagementV35Service.permissionPayeeLimit.set([]);
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}

import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-restricted-syntax */
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  inject,
  computed
} from '@angular/core';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import {
  AllSelectAccount,
  BankAccountMapping,
  IPermissions,
  ISelectedPermissionsData,
  ISubSections,
  IUserPermissionList
} from 'src/app/models/user';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Utils } from 'src/app/data/utils';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import {
  faArrowLeft,
  faBriefcase,
  faAngleDown,
  faAngleRight,
  faAngleLeft
} from '@fortawesome/pro-solid-svg-icons';
import { NgxMaskDirective } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { NgClass, NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ClonePermissionModalComponent } from '../../modals/clone-permission-modal/clone-permission-modal.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { OcwBackButtonComponent } from '../../../../shared/components/ocw-back-button/ocw-back-button.component';
import {
  IIntegrationCategory,
  IIntegrationCompany,
  IIntegrationExpenses,
  IPermissionSendData,
  IQbDeskCompanyList,
  IQbOnlineCompanyList,
  IBankPermissions,
  ICloudBankAccountsInfo,
  IPermissionDetails,
  ICloudBankPaymentRequests
} from '../../../../models/user';
import { UserPermissionBankAccountComponent } from '../../components/user-permission-bank-account/user-permission-bank-account.component';
import { UserPermissionPayeeComponent } from '../../components/user-permission-payee/user-permission-payee.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { UserWhitelistIpComponent } from '../../components/user-whitelist-ip/user-whitelist-ip.component';
import { UserPermissionWalletComponent } from '../../components/user-permission-wallet/user-permission-wallet.component';

@Component({
  selector: 'app-user-permissions',
  templateUrl: './user-permissions.component.html',
  styleUrls: ['./user-permissions.component.scss'],
  standalone: true,
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
    TitleCasePipe
  ]
})
export class UserPermissionsComponent implements OnInit, OnDestroy {
  faArrowLeft = faArrowLeft;
  faBriefcase = faBriefcase;
  faAngleDown = faAngleDown;

  @Input() appendTo = 'ng-select';
  private userService = inject(UserManagementService);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private commmonService = inject(CommonOnInitService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  public userManagementV35Service = inject(UserManagementV35Service);

  @Input() clientPermissionId: string;

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

  bankType: string = 'bank';

  bankAccountList: IBankPermissions = {};
  cashAccountList: { id: string; name: string }[] = [];
  cardsList: { name: string; id: string }[] = [];
  userCards: { [key: string]: boolean } = {};

  userPermissions: { [key: string]: boolean } = {};
  checkAllQB: { [key: string]: boolean } = {};
  allSelectedIndex: { [key: number]: boolean } = {};
  permissionType: { [key: string]: string | number | null } = {};

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
  payeeTypes: IPermissionDetails[];
  isSelectPayee = false;

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
  bankAccountTypes: BankAccountMapping = {
    depositslipBankAccountIds: 'depositslip-bank-accounts',
    BillBankAccountIds: 'bill-bank-accounts',
    invoiceBankAccountIds: 'invoice-bank-accounts',
    creditMemoBankAccountIds: 'creditmemo-bank-accounts',
    CheckDraftBankAccountIds: 'checkdraft-bank-accounts',
    CashExpenseBankAccountIds: 'cashexpense-bank-accounts',
    paymentLinkBankAccountIds: 'payment-link-bank-accounts',
    account: 'bankaccount',
    walletIds:'wallet-accounts',
    virtualCardWalletIds: 'virtualcard-wallet-creation',
    paymentBankAccountIds: 'payment-bank-accounts',
    internationalPaymentWalletIds:'international-payment-wallets'
  };

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
    selectAllWallets:'wallet-accounts',
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
    Payments: {
      permissionKey: ['payment-bank-accounts']
    }
  };

  ngOnInit(): void {
    this.localStorageService.setItem('clientPermissionId', this.clientPermissionId);
    this.permissionType = this.localStorageService.getItem('userPermission');
    this.getUrlParams();
    this.getPermissions();
  }

  getUrlParams(): void {
    this.client_id = this.route.snapshot.params?.id;
    this.isItNewUser = this.route.snapshot.fragment === 'new';
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

  getPermissions() {
    this.subscriptions.push(
      this.userService.getPermissions(this.initialCount).subscribe((res) => {
        if (res.success) {
          this.totalCashAccounts = res.data.cashAccountCount;
          this.totalBankAccounts = res.data.bankListCount;
          this.setPagination(res.data.bankListCount, res.data.cashAccountCount);
          this.userPermissionList = res.data.permissions;
          this.userDetails = res.data.userDetails;
          const bankList = res.data.permissions.filter(
            (r: IUserPermissionList) => r.name === 'bankaccount'
          )[0];
          this.bankAccountList = bankList['sub-sections']?.bankList!;
          this.cashAccountList = bankList['sub-sections']?.cashAccount!;
          const cardListItem = res.data.permissions.filter(
            (item: IUserPermissionList) => item?.name === 'creditcard'
          )[0];
          this.cardsList = cardListItem?.creditCards;

          /** cloud bank list permissions start */
          const cloudBankPermissions = res.data.permissions.filter(
            (permissions: IUserPermissionList) =>
              permissions.name === 'cloudbank'
          )[0];
          this.cloudBankAccountLists =
            cloudBankPermissions['cloud-bank-accounts'][0];
          this.cloudPaymentRequests =
            cloudBankPermissions['cloudbank-payment-request'];

          // To enable the cloud bank account
          if (cloudBankPermissions['cloud-bank-accounts'][0]) {
            this.cloudBankAccountLists =
              cloudBankPermissions['cloud-bank-accounts'][0];
          }
          if (cloudBankPermissions['cloudbank-accounts-enable'][0]) {
            this.cloudBankAccountsEnable =
              cloudBankPermissions['cloudbank-accounts-enable'][0];
          }
          /** cloud bank list permissions end */

          const integrationPermission = res?.data?.permissions?.filter(
            (permissions: IUserPermissionList) =>
              permissions.name === 'integration'
          )[0];
          if (integrationPermission) {
            const integrationPermissions: IPermissionDetails[] =
              integrationPermission['integration-enable'];
            integrationPermissions?.forEach((element) => {
              if (element?.name === 'enable-qb-desktop-companies') {
                this.quickbookDesktopEnable = element;
              }
              if (element?.name === 'enable-qb-online-companies') {
                this.quickbookOnlineEnable = element;
              }
            });
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for (const [i] of this.userPermissionList.entries()) {
            this.allSelectedIndex[i] = false;
          }

          /** Payee type restriction */
          const payeePermission = res.data.permissions.filter(
            (permissions: IUserPermissionList) => permissions.name === 'payee'
          )[0];
          if (payeePermission['payeetype-restriction']) {
            this.payeeTypeRestrictions =
              payeePermission['payeetype-restriction'][0];
          }
          if (payeePermission.payeetype) {
            this.payeeTypes = payeePermission.payeetype;
          }

          if (this.isItNewUser) {
            this.setNewUserDafaultPermission();
          } else {
            this.setInitialPermissionArray();
          }
          this.getSelectedPermissions();
          this.tabChange(this.userPermissionList[0], 0);
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
            res.data.permission.forEach((e: { name: string }) => {
              this.userPermissions[e.name] = true;
            });

            res.data.account.forEach((e: string) => {
              this.userBankAccounts[e] = true;
            });

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

            this.processAccountResponse(res.data);
            this.onClickCheckBox();
            this.isSeletedAllCloudBankAccounts();
          }
        })
    );
  }

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
      if(!this.isItNewUser){
        this.showBankDropDowns[dropdownKey] = isDropdownKeyIncludedInPermissions;
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
        if(dropdownKey === 'cashexpense-bank-accounts'){
          const cashAccountIds = accountIds.filter((id) =>
            this.cashAccountList.some((item) => item.id === id)
          );          
          if(cashAccountIds.length > 0){
            this.showBankDropDowns['cashexpense-bank-accounts'] = true;
            cashAccountIds.forEach(id => {
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
      }else{
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
      }else{
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
    for (const item of this.userPermissionList) {
      if (item?.permissions?.normal) {
        for (const e of item.permissions.normal) {
          this.userPermissions[e.name] = true;
        }
      }

      if (item?.hasOwnProperty('sub-sections') && item['sub-sections']?.data) {
        item['sub-sections'].data.forEach((subItem: ISubSections) => {
          if (subItem.permissions?.normal) {
            for (const e of subItem.permissions.normal) {
              this.userPermissions[e.name] = true;
            }
          }
        });
      }
    }
    Object.entries(this.bankAccountTypes).forEach(([, value]) => {
        this.showBankDropDowns[value] = true;
    });
    this.createPermissionArray();
  }

  // --------start qbonilne------//

  showQbOnlineData(item: IUserPermissionList[]) {
    this.onClickCheckBox('online');
    this.qbOnlineArray = [];
    if (item[13]['quickbooks-online']?.companyList?.companies) {
      this.companyList = item[13]['quickbooks-online']?.companyList?.companies;
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
    if (item[13]['quickbooks-online']?.permissions?.normal) {
      this.qbOnline = item[13]['quickbooks-online']?.permissions?.normal;
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
    this.desktopCompanyList =
      item[13]['quickbooks-desktop']?.companyList?.companies;
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
    if (item[13]['quickbooks-desktop']?.permissions?.normal) {
      this.qbDesktop = item[13]['quickbooks-desktop']?.permissions?.normal;
    }
  }

  showNetSuite(item: IUserPermissionList[]): void {
    this.onClickCheckBox('netsuite');
    this.isThirdPartyApss = 'netsuite';
    if (item[13].netsuite?.permissions?.normal) {
      this.netSuitePermission = item[13].netsuite?.permissions?.normal;
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
    for (const item of this.userPermissionList) {
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
    this.createPermissionArray();
  }

  createPermissionArray(): void {
    const accountsPermissions: string[] = Object.values(this.bankAccountTypes);
    for (const item of this.userPermissionList) {
      if (item?.permissions?.sp) {
        for (const e of item.permissions.sp) {
          if(this.isItNewUser && accountsPermissions.includes(e.name)){
            this.userPermissions[e.name] = true;
          }else{                
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
              if(this.isItNewUser && accountsPermissions.includes(e.name)){
                this.userPermissions[e.name] = true;
              }else{                
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
    if (bankType === "cashexpense-bank-accounts") {
      const permissionBankIds = this.userManagementV35Service.permissionBankId()[bankType] || {};
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
      const alert = this.alertService.warningAlert({
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
      selectAllWallets:0,
      selectAllVirtualCardWallets: 0,
      achAmountLimit:0,
      selectAllPaymentBankAccounts: 0,
      payeeAccounts: [],
      internationalPaymentWalletIds: [],
      selectAllInternationalPaymentWallets: 0,
      allowedUserIds: []
    };

    if (
      (this.isTransitionLimitSet && this.cloudTransactionLimit.invalid) ||
      this.checkTransactionLimit.invalid
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
      if (
        permissionKey === 'account'
      ) {        
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
      if (body.permissionData.includes(bodyKey)) {
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

      if(this.userManagementV35Service.selectAllPermission()?.[bodyKey]){
        body[permissionKey as keyof AllSelectAccount] = 1;
      }
    });

    if (this.userPermissions['is-approval-required-for-printing']) {
      body.checkAmountLimit = this.checkTransactionLimit.value;
    }

    if (this.checkedCheckEmail) {
      body.permissionData.push('enable-check-email-notification');
    }

    if (this.checkedBillEmail) {
      body.permissionData.push('enable-bill-email-notification');
    }
   
    if (this.userPermissions['payee-accounts']) {
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
            this.alertService.successAlert({
              content: this.isItNewUser
                ? 'User permission added successfully'
                : 'User permission updated successfully'
            });
          }
        })
    );
  }

  onClickCheckBox(type?: string): void {
    let allChecked: boolean[] = [];
    const permissions: IPermissions = { normal: [], ap: [], sp: [] };

    let currentPermission: IUserPermissionList | undefined;

    if (this.userPermissionList[this.activeIndex]?.name === 'integration') {
      if (type === 'online') {
        currentPermission =
          this.userPermissionList[this.activeIndex]['quickbooks-online'];
      } else if (type === 'desktop') {
        currentPermission =
          this.userPermissionList[this.activeIndex]['quickbooks-desktop'];
      } else if (type === 'netsuite') {
        currentPermission = this.userPermissionList[this.activeIndex].netsuite;
      }
    } else if (
      this.userPermissionList[this.activeIndex]?.name !== 'integration'
    ) {
      currentPermission = this.userPermissionList[this.activeIndex];
    }

    /** card permisions start */
    const cardPermissions = (allChecked: boolean[]) => {
      for (const el of this.cardsList) {
        allChecked.push(this.userCards[el.id] ? true : false);
      }

      return allChecked;
    };

    if (this.activeId === 'creditcard') {
      allChecked = cardPermissions(allChecked);
    }
    /** card permisions end */

    const currentTab = this.tabConfiguration[this.selectedTab.displayName];

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

    for (const e of permissions?.normal) {
      allChecked.push(this.userPermissions[e.name] ? true : false);
    }

    for (const e of permissions?.sp) {
      allChecked.push(this.userPermissions[e.name] ? true : false);
    }
    for (const e of permissions?.ap) {
      allChecked.push(this.userPermissions[e.name] ? true : false);
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
    this.checkIfAllSelected();
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
        if(this.userPermissions['payee-accounts'] === true){
          this.userPermissions['only-show-payees-client-account'] = false;
        }
      }

      for (const e of permissions?.ap) {
        this.userPermissions[e.name] = checked;
      }
    };

    if (type) {
      if (type === 'online') {
        this.permissions =
          this.userPermissionList[this.activeIndex][
            'quickbooks-online'
          ]?.permissions;
      } else if (type === 'desktop') {
        this.permissions =
          this.userPermissionList[this.activeIndex][
            'quickbooks-desktop'
          ]?.permissions;
      } else if (type === 'netsuite') {
        this.permissions =
          this.userPermissionList[this.activeIndex].netsuite?.permissions;
      }
    } else {
      this.permissions = this.userPermissionList[this.activeIndex]?.permissions;
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

    const currentTab = this.tabConfiguration[this.selectedTab.displayName];

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
      const currentBankIds = this.userManagementV35Service.permissionBankId()[permissionKey];
  
      // Create a new object with all values set to false
      const updatedBankIds: { [key: string]: boolean } = {};
      Object.keys(currentBankIds).forEach((id) => {
        updatedBankIds[id] = false;
      });
  
      // Update the permissionBankId signal with the updated values
      this.userManagementV35Service.permissionBankId.update((currentValue) => ({
        ...currentValue,
        [permissionKey]: updatedBankIds,
      }));
    }
  }
  
  clearPayeeAccounts(permissionKey: string){
    if (this.userManagementV35Service.permissionPayeeId()[permissionKey]) {
      const currentPayeeIds = this.userManagementV35Service.permissionPayeeId()[permissionKey];
  
      // Create a new object with all values set to false
      const updatedPayeeIds: { [key: string]: boolean } = {};
      Object.keys(currentPayeeIds).forEach((id) => {
        updatedPayeeIds[id] = false;
      });
  
      // Update the permissionPayeeId signal with the updated values
      this.userManagementV35Service.permissionPayeeId.update((currentValue) => ({
        ...currentValue,
        [permissionKey]: updatedPayeeIds,
      }));
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

  checkIfAllSelected(): void {
    setTimeout(() => {
      if (
        !Object.values(this.allSelectedIndex).includes(false) &&
        Object.values(this.allSelectedIndex).includes(true)
      )
        this.allowAllPermissions = true;
      else this.allowAllPermissions = false;
    }, 100);
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
    const unSelectedPermission = [
      'is-approval-required-for-printing-bills',
      'only-show-payees-client-account',
      'is-approval-required-for-printing'
    ];
    for (const i of Object.keys(this.userPermissions)) {
      if (!unSelectedPermission.includes(i)) {
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
      if(!checked){
        this.clearBankAccounts(value);
      }
    });

    Object.entries(this.payeePermissionTypes).forEach(([, value]) => {
      this.userManagementV35Service.selectAllPermission.update((item) => ({
        ...item,
        [value]: checked
      }));
      this.showPayeeTable[value] = checked;
      if(!checked){
        this.clearPayeeAccounts('payee-accounts');
      }
    });
  }

  onClickViewOnlyPermissions(checked: boolean){
    this.allowViewOnlyPermission = checked;

    for (const key of Object.keys(this.userPermissions)) {
      if (/(read|view)/.test(key)) {
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
        [value]: false,
      }));
      this.showBankDropDowns[value] = false;
      this.clearBankAccounts(value);
    });
  
    Object.entries(this.payeePermissionTypes).forEach(([, value]) => {
      this.userManagementV35Service.selectAllPermission.update((item) => ({
        ...item,
        [value]: false,
      }));
      this.showPayeeTable[value] = false;
      this.clearPayeeAccounts('payee-accounts');
    });
  }

  tabChange(item: IUserPermissionList, i: number): void {
    this.selectedTab = item;
    if (item?.name === 'cloudbank') {
      this.isCloudBankSelected = true;
    } else {
      this.isCloudBankSelected = false;
    }

    if (item?.name === 'payee') {
      this.isSelectPayee = true;
    } else {
      this.isSelectPayee = false;
    }

    this.isThirdPartyApss = 'all';

    if (item.displayName === 'Integration') {
      this.isSelectAll = true;
    } else {
      this.isSelectAll = false;
    }
    this.activeIndex = i;
    this.activeId = item.name;
    this.activeListPermission = item.permissions!;

    if (item['sub-sections']?.data) {
      this.activeListSubSection = item['sub-sections'].data;
    } else {
      this.activeListSubSection = [];
    }



    this.onClickCheckBox();
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

    if(checked && item.name === 'payee-accounts'){
      this.togglePermission('payee-accounts');
    }

    if(checked && item.name === 'only-show-payees-client-account'){
      this.togglePermission('only-show-payees-client-account');
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

    if (permission === 'payee-accounts' && this.userPermissions['only-show-payees-client-account']) {
      this.userPermissions['only-show-payees-client-account'] = false;
    }
    
    if (permission === 'only-show-payees-client-account' && this.userPermissions['payee-accounts']) {
      this.userPermissions['payee-accounts'] = false;
      this.showPayeeTable['payee-accounts'] = false;
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
        this.alertService.warningAlert({
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

  ngOnDestroy(): void {
    this.userManagementV35Service.permissionBankId.set({});
    this.userManagementV35Service.permissionPayeeId.set({});
    this.userManagementV35Service.permissionPayeeLimit.set([]);
    this.subscriptions.forEach((s: Subscription) => {
      s.unsubscribe();
    });
  }
}

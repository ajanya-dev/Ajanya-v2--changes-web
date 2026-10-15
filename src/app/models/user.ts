import { FormControl } from '@angular/forms';

/**  USER MANAGEMENT START */
export type UserActivityTypes =
  | 'All'
  | 'Check'
  | 'Bill'
  | 'Cash Expense'
  | 'Deposit Slip'
  | 'Received Checklist'
  | 'Invoice'
  | 'Direct deposit'
  | 'ACH'
  | 'Wire'
  | 'Virtual Card'
  | 'Check Mail'
  | 'Wallet'
  | 'Bank Account';
export type StatusActions = 'resend' | 'delete' | 'approve';

export interface IUserInfo {
  userId: number;
  encrypted_id: string;
  userName: string;
  name: string;
  email: string;
  status: number;
  email_verified: number;
  phone_verified: number;
  created_at: string;
  adpMarketPlaceUser: number;
  passwordUpdated: number;
}

export interface IUsersList {
  client_email: string;
  client_nick_name?: string;
  client_id: string;
  client_name: string;
  client_type: number;
  company_name: string;
  created_at: string;
  formatted_created_at: string;
  client_last_login: string;
  id: number;
  status: number;
  profile_pic?: string;
  has_permission: number;
}

export interface IUserActivity {
  activities: { [key in UserActivityTypes]: IActivityTypeResponse | IActivityTypeDetails[] };
  createdById: string;
  createdForId: string;
  created_counts: { [key in UserActivityTypes]: number };
  name: string;
  total_created: number;
}
export interface ILoginPayload {
  username: string;
  password: string;
  recaptcha?: string | undefined;
}

export interface IRegisterPayload {
  name: string;
  username: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  coupon_code?: string | number;
  phone_no?: string;
  extraData?: unknown;
  recaptcha?: string | undefined;
  countryCode?: string;
  termsAndCondition?: boolean;
  adminRfCode?: string;
  utmParams?: Record<string, string>;
}

export interface IUserVerification {
  email: string;
  email_verified: number | null;
  phone: string;
  phone_verified: number | null;
  emailOTPSent: number;
  phoneOTPSent: number;
  personaVerification: string;
  kycStatus: number;
  kybStatus: number;
}

export interface IActivityTypeDetails {
  amount: number;
  bank_name: string;
  currentStatus: string;
  date: string;
  id: string;
  memo: string;
  referenceId: string;
  referenceNumber: string;
  status: string;
  source?: string;
  source_name?: string;
  uu_id?: string;
}

export interface IActivityTypeResponse {
  data: IActivityTypeDetails[];
  pagination: IPaginationResponse;
}

export interface IPaginationResponse {
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
  per_page: number;
  total: number;
}

export interface IUserActivityPaginationPayload {
  pagination: {
    [K in Exclude<UserActivityTypes, 'All'>]: {
      page: number;
      per_page: number;
    }
  }
}

export interface IPersonaVerificationStatus {
  inquiryId: string;
  status: string;
}

export interface IUserRoute {
  status: string;
  currentStatus: string;
  referenceId: string;
  invoice_status: number;
  is_mailed: number;
  referenceNumber: string;
  date: string;
  bank_name: string;
  amount: string;
  type: string;
  memo: string;
  styleClass?: string;
  uu_id?:string;
}

/**  USER MANAGEMENT END */

/**  USER PERMISSION START  */
export interface IUserPermissionList {
  displayName: string;
  name: string;
  permissions?: IPermissions;
  'sub-sections'?: {
    data: ISubSections[];
    bankList?: IBankPermissions;
    cashAccount?: { id: string; name: string }[];
  };
  'quickbooks-online'?: IQuickbooksData;
  'quickbooks-desktop'?: IQuickbooksData;
  'integration-enable'?: IPermissionDetails[];
  'netsuite'?: INetSuiteData;
}

export interface IUserPermissionModules {
  core: IUserPermissionList[];
  other: IUserPermissionList[];
}

export interface IQuickbooksData {
  displayName: string;
  name: string;
  permissions: IPermissions;
  companyList: IIntegrationCompanyList;
}

export interface INetSuiteData {
  displayName: string;
  name: string;
  permissions: IPermissions;
}

export interface IIntegrationCompanyList {
  companies: IIntegrationCompany[];
  companyCount: number;
}

export interface IIntegrationCompany {
  id: string;
  companyName: string;
  categories?: IIntegrationCategory[];
  expenses?: IIntegrationExpenses[];
}

export interface IIntegrationCategory {
  name: string;
  id: string;
}

export interface IIntegrationExpenses {
  name: string;
  id: string;
  encrypted_id: string;
}
export interface IPermissions {
  ap: IPermissionDetails[];
  normal: IPermissionDetails[];
  sp: IPermissionDetails[];
  'create-card-types'?: IPermissionDetails[];
  'update-card-types'?: IPermissionDetails[];
}

export interface IPermissionDetails {
  category_type: string;
  description: string | null;
  display_name: string;
  group_id: number | null;
  id: number;
  name: string;
  permission_order: number | null;
}

export interface IUserCategory {
  permissionData: string[];
  bankIds: string[];
  qbOnlineCompanyIds: [
    {
      companyId: string;
      categoryIds: [];
    }
  ];
  qbDesktopCompanyIds: [
    {
      companyId: string;
      expenseIds: [];
    }
  ];
}

export interface ISubSections {
  displayName: string;
  name: string;
  permissions: IPermissions;
}

export interface IBankPermissions {
  [key: string]: {
    accounts: { id: string; name: string }[];
    bankName: string;
    totalAccounts: number;
  };
}
/** cloud bank account list permission start */
export interface ICloudBankAccountsInfo {
  displayName: string;
  name: string;
  accounts: { id: string; name: string }[];
}
/** cloud bank account list permission end */

/**  USER PERMISSION END  */
export interface IReasonForClosing {
  createdAt?: string;
  id?: string;
  reason: string;
  updatedAt?: string;
}

export interface IReasonData {
  message: string;
  password: string;
}

export interface IDeleteAccount {
  message: { message: string; 'restore-date': string };
  success: boolean;
}

export interface IApproveUser {
  success: boolean;
  data: IApproveUserData[];
}

export interface IApproveUserData {
  message: string;
  userId: string;
}

export interface ISelectedPermissionsData {
  permission: IPermission[];
  account: string[];
  qbOnlineCompanyIds: IQbOnlineCompanyList[];
  qbDesktopCompanyIds: IQbDeskCompanyList[];
  cloud_bank_accounts: string[];
  check_amount_limit: number;
  credit_cards: string[];
  depositslipBankAccountIds: string[];
  invoiceBankAccountIds:string[];
  creditMemoBankAccountIds:string[];
  BillBankAccountIds:string[];
  paymentLinkBankAccountIds:string[];
  CheckDraftBankAccountIds:string[];
  CashExpenseBankAccountIds:string[];
  payeeAccountIds:string[];
  walletIds:string[];
  virtualCardWalletIds: string[];
  ach_amount_limit:number;
  paymentBankAccountIds:string[];
  internationalPaymentWalletIds:string[];
  allowedUserIds:string[];
}

export interface IPermission {
  name: string;
}

export interface IQbOnlineCompanyList {
  companyId: string;
  categoryIds: string[];
}

export interface IQbDeskCompanyList {
  companyId: string;
  expenseIds: string[];
}

export interface IGetWhiteListIp {
  id: string;
  ipAddress: string;
  name: string;
}

export interface ISetNewPasswordForm {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export interface IPermissionSendData {
  permissionData: string[];
  bankIds: string[];
  cloudBankIds: string[];
  qbOnlineCompanyIds: IQbOnlineSendData[];
  qbDesktopCompanyIds: IQbDeskSendData[];
  creditcardIds: string[];
  checkAmountLimit: number;
  selectAllBankAccounts: number;
  depositslipBankAccountIds:string[];
  invoiceBankAccountIds:string[];
  creditMemoBankAccountIds:string[];
  BillBankAccountIds:string[];
  paymentLinkBankAccountIds:string[];
  CheckDraftBankAccountIds:string[];
  CashExpenseBankAccountIds:string[];
  payeeAccountIds:string[],
  selectAllDepositslipBankAccounts:number,
  selectAllPaymentLinkBankAccounts:number,
  selectAllInvoiceBankAccounts:number,
  selectAllCreditMemoBankAccounts:number,
  selectAllCheckDraftBankAccounts:number,
  selectAllCashExpenseBankAccounts:number,
  selectAllBillBankAccounts:number,
  selectAllPayeeAccounts:number,
  selectAllWallets:number,
  selectAllVirtualCardWallets: number,
  virtualCardWalletIds: string[]
  account?:string[],
  paymentBankAccountIds:string[],
  walletIds:string[],
  achAmountLimit:number,
  selectAllPaymentBankAccounts:number,
  payeeAccounts: IPayeeLimit[],
  internationalPaymentWalletIds:string[],
  selectAllInternationalPaymentWallets:number,
  allowedUserIds:string[]
}

export interface IQbOnlineSendData {
  companyId: string;
  categoryIds: string[];
}

export interface IQbDeskSendData {
  companyId: string;
  expenseIds: string[];
}
export interface ICloudBankPaymentRequests {
  displayName: string;
  name: string;
  permissions: {
    ap: [];
    normal: {
      category_type: string;
      description: string;
      display_name: string;
      group_id: null;
      id: number;
      name: string;
      permission_order: null;
    }[];
    sp: [];
  };
}

export interface ICloneConfirmPermision {
  from: IfromClonePermission;
  permission: number;
  to: IUsersList[];
}

export interface IfromClonePermission {
  forEach(arg0: (cloneUserValues: IUsersList) => void): unknown;
  client_email: string;
  client_id: string;
  client_name: string;
  client_type: number;
  company_name: string;
  created_at: string;
  formatted_created_at: string;
  client_last_login: string;
  has_permission: number;
  id: number;
  profile_pic: string;
  status: number;
  user_id: number;
}

export interface IOverallData {
  bankAccountCount: number;
  walletBalance: string;
  cloudbankBalance: string;
  creditCardCount: number;
  cloudbankExist: number;
  payeeCount: number;
  checkMailExist: number;
  hasWalletFunding: boolean;
  hasWalletTransfer: boolean;
  hasWalletWithdrawal: boolean;
  hasTransacted: boolean;
}

export interface ICreatePermission {
  permissionData: string[];
  bankIds: string[];
  cloudBankIds: string[];
  creditcardIds: string[];
  checkAmountLimit: number;
}

export interface IAddPolicyData {
  name: string;
  criteriaType: string;
  criteriaOperator: string;
  criteriaValue: string;
  approvalType: string;
  approverData: IApproverData[];
}

export interface IApproverData {
  userId: string;
  username: string;
}

export interface IApprovers {
  id: number;
  client_id: string;
  client_name: string;
  client_email: string;
  client_nick_name: string;
  status: number;
  client_type: number;
  company_name?: string;
  created_at: string;
  profile_pic?: string;
  user_id: number;
  has_permission: number;
}

export interface IExistingRules {
  name: string;
  criteriaType: string;
  criteriaOperator: string;
  criteriaValue: string;
  approvalType: string;
  approverData: IApproverData[];
  id: string;
}

export interface IMultiLevel {
  approvalType: 'or' | 'and';
  approvers: IApproverData[];
}

export interface IMultiLevelApprovalData {
  submitterUserId: string;
  levels: IMultiLevel[];
}

export interface IAddMultiLevelPolicyData {
  name: string;
  criteriaType: 'submitter_two_level';
  approvalType?: 'or' | 'and';
  approvalRequiredData: IMultiLevelApprovalData;
}

export interface IMultiLevelExistingRule extends IAddMultiLevelPolicyData {
  id: string;
  criteriaOperator?: string;
  criteriaValue?: string;
}

export interface IApprovalPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface IApprovalRequest {
  totalCount: number;
  zilPayments: IZilPayment[];
  checks: ICheck[];
  pagination?: IApprovalPagination;
  checksPagination?: IApprovalPagination;
}

export interface IZilPayment {
  id: string;
  referenceNo: string;
  transferId: string;
  payee: string;
  amount: string;
  createdBy: string;
  createdAt: string;
  canApprove: boolean;
  uuId?:string;
}

export interface ICheck {
  id: string;
  checkNo?: string;
  payee: string;
  amount: string;
  createdAt: string;
}

export type UserType = 'User' | 'Accountant' | 'Clerk' | 'Approver';

export interface IUserForm {
  userType: FormControl<UserType | null>;
  name: FormControl<string | null>;
  nickName: FormControl<string | null>;
  companyName: FormControl<string | null>;
}

export interface IEditUserFormBody {
  name: string;
  nickName: string;
  clientType: number;
  companyName: string;
}

export type BankAccountMapping = {
  [K in keyof Pick<IPermissionSendData, 
    | 'BillBankAccountIds'
    | 'invoiceBankAccountIds'
    | 'creditMemoBankAccountIds'
    | 'CheckDraftBankAccountIds'
    | 'CashExpenseBankAccountIds'
    | 'paymentLinkBankAccountIds'
    |'depositslipBankAccountIds'
    |'account'
    |'walletIds'
    | 'virtualCardWalletIds'
    |'paymentBankAccountIds'
    |'internationalPaymentWalletIds'
  >]: string;
};

export type AllSelectAccount = {
  [K in keyof Pick<IPermissionSendData, 
    | 'selectAllDepositslipBankAccounts'
    | 'selectAllPaymentLinkBankAccounts'
    | 'selectAllInvoiceBankAccounts'
    | 'selectAllCreditMemoBankAccounts'
    | 'selectAllBillBankAccounts'
    | 'selectAllCheckDraftBankAccounts'
    | 'selectAllCashExpenseBankAccounts'
    |'selectAllBankAccounts'
    |'selectAllPayeeAccounts'
    |'selectAllWallets'
  >]: string;
};

export interface IActivityExportPayload {
  type: string;
  export_type: string;
  fromDate?: string;
  toDate?: string;
}

export interface IAccountsPermission {
  [key: string]: IAccountsPermissionData
}

export interface IAccountsPermissionData {
  data: {id:string,name:string}[]
  pagination: Pagination
}

export interface Pagination {
  current_page: number
  last_page: number
  from: number
  to: number
  per_page: number
  total: number
}

export interface IAccountsPermissionPayload {
  pagination: {
      [x: string]: {
          page: number;
          per_page: number;
      };
  };
}

export interface IPayeeLimit {
  id: string;
  limit: number;
  frequency: number;
}


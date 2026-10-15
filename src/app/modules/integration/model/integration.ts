import { SafeResourceUrl } from '@angular/platform-browser';

export interface IQuickBookDesktop {
  version5Link: string;
  version4Link: number;
  payeeAddressSpecialSetting: number;
  enableOcwStyleStub: number;
  videoLink: string;
}

export type GustoCompanyType = 'fetched' | 'imported' | null;

export interface IGustoSelectedCompany {
  id: string;
  type: GustoCompanyType;
  companyName?: string;
  contractorId?: string;
}
export interface IQuickBookDesktopImportRequest {
  importTime: number;
  markAsPrintLater: boolean;
  importBill: string;
  importCheck: string;
  importPayroll: string;
  company_id: any;
  accounts: string[];
  fromDate?: string;
  toDate?: string;
}
export interface IIntegration {
  title: string;
  icon: string;
  routerLink: string;
  styles?: {
    width?: string;
    display?: string;
    flex?: string;
    img?: { width?: string };
  };
  comingSoon?: boolean;
  id: string;
}

export interface ICyberSourceCardAddRequestModel {
  access_key: string;
  amount: string;
  consumer_id?: string;
  currency?: string;
  customer_ip_address: string;
  id: string;
  locale?: string;
  profile_id: string;
  reference_number: number | string;
  signature: string;
  signed_date_time: string;
  signed_field_names?: string;
  transaction_type: string;
  transaction_uuid: string;
  unsigned_field_names?: string;
}

export interface IConnectedThirdPartyData {
  module: IConnectStatus;
  connected: number;
  companies: IConnectedCompanyList[];
  providerCode: string;
  id: string;
  isPushBackEnabledInSua?: number;
  provider?: IHubSpotProvider;
}

export interface IConnectStatus {
  id: string;
  name: string;
  moduleCode: string;
  logoUrl: string;
  status: string;
  freshbooksExport: number;
  isConnected: number;
  freshbooksPushBackEnable:number;
}

export interface IConnectedCompanyList {
  companyId: string;
  companyName: string;
  lastUpdated: string;
  runPayroll: number;
  uuid?: string;
  status: string;
  id?: string;
  company_id?: string;
  company_name?: string;
  last_run?: string;
}

export interface IFreshBookSettings {
  freshbook_webhook: number;
  fb_push_back_enable: number;
  xero_webhook: number;
  fb_export:number;
}

export interface IFreshBookExpenseDetails {
  categoryId: string;
  description: string;
  amount: string;
}

export interface IFreshBookExportsData {
  companyId: string;
  fbCategory: {name: string, id: string};
  formValue: IFreshBookExpenseDetails[];
  FBOTotal: number;
}

export interface IQBBankMapDuplicate {
  id: string;
  quickBookId: number;
  quickBookAccount: string;
  OcwbankAccount: string;
  OcwbankAccountNickName: string;
  QBCompanyName: string;
  realmId: string;
}

export interface ISageBusinessData {
  module: IConnectStatus;
  connected: number;
  companies: IConnectedCompanyList[];
  providerCode: string;
}

export interface IMappingBankAccount {
  id: string;
  thirdPartyId: string;
  thirdPartyName: string;
  bankAccount: string;
  type: string;
  isMapped: number;
  bankAccountName: string;
  bankAccountNick: string;
  company: string;
}

export interface IQBOPushBackEnable {
  isQucikBookConnected: number;
  isPushBackEnabled: number;
  isPushBackEnabledInSua: number;
  isLocationEnabled: number;
  showWarning: number;
}

/***************** QuickBooks Desktop push back interfaces ********************/

export interface IpushBackEnableBody {
  isQucikBookDesktopConnected: number;
  isPushBackEnabled: number;
  isPushBackEnabledInSua: number;
}

export interface IQBDCompanyDetails {
  companyId: string;
  companyName: string;
  qbBankName: string;
  qbBankId: string;
  expenses: IExpense[];
  customers: ICustomer[];
  classes: IClass[];
}

export interface IExpense {
  name: string;
  id: string;
}

export interface ICustomer {
  name: string;
  id: string;
}

export interface IClass {
  name: string;
  id: string;
}

export interface IBankAccountMappingData {
  bankAccountName: string;
  bankAccountNick: string;
  company: string;
  id: string;
  isMapped: number;
  thirdPartyId: string;
  thirdPartyName: string;
  type: string;
}

export interface IADPPayrollComponentConfig {
  hideBack: boolean;
  companyId: string | undefined;
  isSubComponent: boolean;
  companyName?: string;
}

export interface INewBankAcItem {
  id: string;
  bankId: string;
  bankAccountName: string;
  bankAccountNickName: string;
  bankAccountNumber: string;
  address: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountPhone: string | undefined;
  bankAccountEmail: string | undefined;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAccountVerified: string | undefined;
  is_neo_bank: boolean;
}

export interface IADPSetupRequest {
  companyId: string | undefined;
  cardId: string | undefined;
  bankaccountId: string | undefined;
  mode: string;
  automateType: number;
  automateAmount: string | number | undefined;
  isFromGettingStarted?: boolean | undefined;
  automate?: number;
}

export interface IWaveImportedCompany {
  companyId: string;
  companyName: string;
  lastUpdated: string;
  runPayroll: number;
  status: string;
}

export interface IWaveImportedFromCompany {
  name: string;
  completed: boolean;
  list: IWaveImportedStatus[];
}

export interface IWaveImportedStatus {
  name: string;
  value: string;
  completed: boolean;
  checked: boolean;
}

// netsuite starts
export interface INetSuite {
  success: boolean;
  data: INetSuiteData;
}

export interface INetSuiteData {
  linkToken: string;
  userOriginId: string;
}

export interface INetSuiteConnected {
  success: boolean;
  data: INetSuiteConnectedData;
}
export interface INetSuiteConnectedData {
  connected: number;
  companies: INetSuiteCompanyDetails[];
  syncStatus: number;
}
export interface INetSuiteCompanyDetails {
  companyId: string;
  companyName: string;
}

export interface INetSuiteImportedStatus {
  name: string;
  value: string;
  completed: boolean;
  checked: boolean;
}

export interface INetSuiteImportedFromCompany {
  name: string;
  completed: boolean;
  list: IWaveImportedStatus[];
}

export interface IImportTransactionCompany {
  type: number;
  code: string;
  importTime?: { value: number; name: string };
  companyIds: string[];
}

export interface IFreeAgentData {
  linkToken: string;
  userOriginId: string;
}

export interface IConnectiontData {
  id: string;
  connected: number;
}

export interface IIntegrationData {
  pageCount: number;
  data: ItableData[];
}

export interface ILocation {
  id: string;
  name: string;
}
export interface ItableData {
  id: string;
  totalAmount: string;
  contactName: string;
  balance: string;
}

export interface IBillOrg {
  id: string;
  orgId: string;
  orgName: string;
  createdAt: string;
  updatedAt: string;
}

export interface IQbdCompanyInfo {
  companies: IQbCompanyList[];
  companyCount: number;
}

export interface IQbCompanyList {
  id: string;
  companyName: string;
}

export interface IQbdBankAccountInfo {
  id: string;
  account_name: string;
}

export interface IQBDData {
  version5Link: string;
  version4Link: string;
  payeeAddressSpecialSetting: number;
  enableOcwStyleStub: number;
  downloadFilter: number;
  check: number;
  billPayment: number;
  payroll: number;
  defaultTimeSpan: number;
  fromDate: string;
  videoLink: string;
  pushBackEnable: number;
  allowExport: boolean;
  duplication: number;
  mapping_data: IQBBankMapDuplicate[];
}

export interface IQBOImportData {
  realmId: string;
  companyName: string;
  bankAccounts:{id:number, name:string}[]
}

export interface IQBOSettingsData {
  downloadFilter: number;
  check: string;
  billPayment: string;
  refund: string;
  expense: string;
  importSettings: { 
    showSelectionPopup: boolean;
    autoSkipTextEnabled: boolean;
    importTimestampField:string;
    skipTexts:string[];
  };
}

export interface IImportForm {
  name: string;
  completed: boolean;
  list: IImportedFromList[];
}

export interface IImportedFromList {
  checked?: boolean;
  name: string;
  value: string;
  completed: boolean;
}

export interface IThirdPartyTransactionBody {
  importTime: string | { value: number; name: string };
  companyId: string[];
  importStatus?: string | number;
  importBill?: number;
  type?: number;
  invoice_status?: string;
  markAsPrintLater?: string;
  bill_status?: string;
}

export interface IXeroSettings {
  freshbook_webhook: number;
  xero_webhook: number;
}

export interface IPayPeriodData {
  data: IPayPeriodDataData;
  dbPayrun: string[];
}

interface IPayPeriodDataData {
  pay_date: string;
  pay_period_start_date: string;
  pay_period_end_date: string;
  processing_period: string;
  payroll_run_id: string;
}

export interface IbankAccountList {
  company: string;
  thirdPartyName: string;
  isMapped: string;
  mapAcc: string;
  id: string;
  bankAccountNick: string;
}

export interface IQuickbookLinks {
  title: string;
  icon: string;
  routerLink: string;
  styles: {
    width: string;
    display: string;
    flex: string;
    img: {
      width: string;
    };
  };
}

export interface IquickBookDesktopFile {
  id: string;
  nick_name: string;
  companyName: string;
  status: number;
}

export interface IQuickBookOnlineData {
  companies: IQbConnectedCompany[];
  companyCount: number;
  autoDownloading: number;
  printRegularVoucher: number;
  pushBackEnable: number;
  allowExport: boolean;
  downloadFilter: number;
  check: string;
  billPayment: string;
  refund: string;
  expense: string;
  autoExportEnable: number;
  locationEnable: number;
  skipNumber: any;
  duplication: number;
  mapping_data: MappingDaum[];
  showWarning: number;
  autoImportPermission:number;
  autoPayeeUpdate:number;
  importSettings: { 
    showSelectionPopup: boolean;
    autoSkipTextEnabled: boolean;
    importTimestampField:string;
    skipTexts:string[];
  };
}

export interface IQbConnectedCompany {
  realmId: string;
  companyName: string;
  status: string;
  data: IQBBankData[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface MappingDaum {
  id: string;
  quickBookId: number;
  quickBookAccount: string;
  OcwbankAccount: string;
  OcwbankAccountNickName: string;
  QBCompanyName: string;
  realmId: string;
}

export interface ICompanyBankAccounts {
  accountNickName: string;
  bankAccount: string;
  duplicated: number;
  id: string;
  isMapped: number;
  quickBookId: string;
  quickBookName: string;
}

export interface IOrgs {
  id: string;
  orgId: string;
  orgName: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDisconnectingState {
  [key: string]: boolean;
}

export interface ISelectedEvent {
  selectedRow?: { [key: string]: any };
  selectedRows?: { [key: string]: any }[];
  id?: string;
  tableId?: number;
}

export interface IGustobankAccount {
  OcwAccountName: string;
  OcwAccountNickName: string;
  companyId: string;
  companyName: string;
  id: string;
  isMapped: number;
}

export interface IgusoImportedData {
  ein: string;
  entity_type: string;
  pay_schedule_type: string;
  join_date: string;
  is_suspended: boolean;
  company_status: string;
  id: number;
  uuid: string;
  name: string;
  trade_name: string;
  is_partner_managed: boolean;
  tier: string;
  locations: IgusoImportedLocation[];
  compensations: IgusoImportedCompensations;
  primary_signatory: IgusoImportedPrimarySignatory;
  primary_payroll_admin: IgusoImportedPrimaryPayrollAdmin;
}

export interface IgusoImportedLocation {
  id: number;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  active: boolean;
}

export interface IgusoImportedCompensations {
  hourly: IgusoImportedHourly[];
  fixed: IgusoImportedFixed[];
  paid_time_off: IgusoImportedPaidTimeOff[];
}

export interface IgusoImportedHourly {
  name: string;
  multiple: number;
}

export interface IgusoImportedFixed {
  name: string;
}

export interface IgusoImportedPaidTimeOff {
  name: string;
}

export interface IgusoImportedPrimarySignatory {
  uuid: string;
  first_name: string;
  middle_initial: any;
  last_name: string;
  phone: string;
  email: string;
  home_address: IgusoImportedHomeAddress;
}

export interface IgusoImportedHomeAddress {
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IgusoImportedPrimaryPayrollAdmin {
  first_name: string;
  last_name: string;
  phone: any;
  email: string;
}

export interface IPayrollEvent {
  payrollId: string;
  selectedCompanyId: string;
}

export interface IGustoFetchedCompany {
  companyId: string;
  companyName: string;
  lastUpdated: string;
  runPayroll: number;
  status: string;
  id: string;
}

export interface IgustoallCompanies {
  id: string;
  name: string;
}

export interface ICompanyDetailsItemADP {
  companyName?: string;
  connectionStatus?: number;
  connectionStatusDescription?: string;
  id?: string;
  isOnboarded?: number;
  method: number;
  automateAmount?: string;
  bankAccountId?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  cardId?: string;
  cardName?: string;
}

export interface IConnectADP {
  redirectUrl: string;
  success: boolean;
}

export interface IgetConnectionUrl {
  success: boolean;
  redirectUrl: string;
}

export interface IcreateGustoCompanies {
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  company: {
    name: string;
  };
}

export interface IMyGustoCompanies {
  success: boolean;
  data: IgusoImportedData[];
}

export interface IGustoBankMappedData {
  success: boolean;
  data: IGustobankAccount[];
}

export interface IResponseURL {
  success: boolean;
  data: string;
}

export interface IMappingBankAccountRes {
  success: boolean;
  data: IMappingBankAccount[];
}

export interface IgetPayrollCheckDataRes {
  success?: boolean;
  fileLink?: SafeResourceUrl;
}

export interface IGetPayrollCheckDataParams {
  path: string;
  demo: number;
  sign: number;
  micr: number;
}

export interface IPayrollCheckValidateData {
  total_pages: number;
  per_check_fee?: number;
  total_cost: number;
  already_charged?: boolean;
  current_balance?: number;
}

export interface IPayrollCheckValidateRes {
  success: boolean;
  errorMsg?: string;
  errorCode?: IPayrollCheckValidateData;
  data: IPayrollCheckValidateData;
}

export interface IgetZapierDataRes {
  success: boolean;
  data: {
    connectLink: string;
  };
}

export interface IpostQuickBookOnlineData {
  autoDownloading?: string;
  printRegularVoucher?: string;
  pushBackEnable?: string;
  autoExportEnable?: string;
  locationEnable?: string;
  check?: string;
  billPayment?: string;
  expense?: string;
  refund?: string;
  downloadFilter?: string;
  showWarning?: string;
  skipNumber?: string;
}

export interface IupdateQuickBookDesktopData {
  autoDownloading?: number;
  printRegularVoucher?: number;
  pushBackEnable?: number;
  autoExportEnable?: number;
  locationEnable?: number;
  check?: number;
  billPayment?: number;
  expense?: number;
  refund?: number;
  downloadFilter?: number;
  showWarning?: number;
  skipNumber?: number;
  payeeAddressSpecialSetting?: number;
  enableOcwStyleStub?: number;
  defaultTimeSpan?: number;
}

export interface ImapQbDesktopBankAcc {
  bankAccountId: string;
  qbId: string;
}

export interface IQBCompanyData {
  companyName: string;
  company_id: string;
  status: number;
  data: IQBCompanyDataEntry[];
}

export interface IQBCompanyDataEntry {
  id: string;
  quickBookId: string;
  quickBookName: string;
  bankAccount: string;
  accountNickName: string;
  isMapped: number;
  duplicated: number;
}

export interface IQBBankData {
  OcwbankAccount: string;
  OcwbankAccountNickName: string;
  QBCompanyName: string;
  duplicated: number;
  id: string;
  isMapped: number;
  quickBookAccount: string;
  quickBookId: number;
  classMappingId:string;
  locationMappingId:string;
  OcwbankAccountId:string;
}

export interface IFileData {
  companyName: string;
  id: string;
  nick_name: string;
  status: number;
}

export interface IQBDuplicateMapDialogData {
  type?: string;
  data: IQBBankMapDuplicate[];
}

export interface IGustoCompanyData {
  ein: string;
  entity_type: string;
  pay_schedule_type: string;
  join_date: string;
  funding_type: string;
  is_suspended: boolean;
  company_status: string;
  id: string;
  uuid: string;
  name: string;
  trade_name: string;
  is_partner_managed: boolean;
  tier: string;
  locations: IComapanyLocation[];
  compensations: ICompensations;
  primary_signatory: IPrimarySignatory;
  primary_payroll_admin: IPrimaryPayrollAdmin;
}

export interface IComapanyLocation {
  id: number;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  active: boolean;
}

export interface ICompensations {
  hourly: IHourly[];
  fixed: IFixed[];
  paid_time_off: IPaidTimeOff[];
}

export interface IHourly {
  name: string;
  multiple: number;
}

export interface IFixed {
  name: string;
}

export interface IPaidTimeOff {
  name: string;
}

export interface IPrimarySignatory {
  uuid: string;
  first_name: string;
  middle_initial: unknown;
  last_name: string;
  phone: string;
  email: string;
  home_address: IHomeAddress;
}

export interface IHomeAddress {
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IPrimaryPayrollAdmin {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

export interface IIntgrationApps {
  title: string;
  icon: string;
  routerLink: string;
  styles: {
    display: string;
    flex: string;
    img: {
      width: string;
      height?: string;
    };
  };
  id: string;
  comingSoon?: boolean;
  preventAccessToWhiteLabels?: boolean;
}

export interface IGustoPaymentsList {
  contractor_payments: IGustoContractPayments[];
  total: {
    reimbursements: string;
    wages: string;
  };
}

export interface IGustoPayment {
  contractor_uuid: string;
  date: string;
  uuid: string;
  bonus: string;
  hours: string;
  may_cancel: boolean;
  payment_method: string;
  reimbursement: string;
  hourly_rate: string;
  status: string;
  wage: string;
  wage_type: string;
  wage_total: string;
}

export interface IGustoContractPayments {
  contractor_uuid: string;
  reimbursement_total: string;
  wage_total: string;
  payments: IGustoPayment[];
}

export interface IQboDetails {
  realmId: string
  companyName: string
  qbBankName: string
  qbBankId: string
  classMappingId: string
  locationMappingId: string
}

// =================== SALESFORCE INTEGRATION INTERFACES ===================

export interface ISalesforceAccount {
  id: string;                    // Encrypted account ID
  instanceUrl: string;           // Salesforce instance URL
  orgId: string;                 // Salesforce organization ID
  username: string;              // Salesforce username
  connectionStatus: number;      // 1 = Connected, 0 = Disconnected
  isConnected: boolean;          // Connection status boolean
  status: number;                // Account status (1 = Active)
  tokenExpiresAt: string | null; // ISO 8601 timestamp
  settings: object | null;       // Account settings
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}

export interface ISalesforceContact {
  id: string;                   // Encrypted contact ID
  salesforceContactId: string;  // Salesforce contact ID
  firstName: string | null;
  lastName: string | null;
  fullName: string;             // Computed full name
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  mailingStreet: string | null;
  mailingCity: string | null;
  mailingState: string | null;
  mailingPostalCode: string | null;
  mailingCountry: string | null;
  fullAddress: string | null;   // Computed full address
  accountName: string | null;   // Associated Salesforce account name
  title: string | null;
  department: string | null;
  description: string | null;
  lastSyncedAt: string | null;  // ISO 8601 timestamp
  syncStatus: number;           // 0 = Pending, 1 = Synced, 2 = Failed
}

export interface ISalesforceIssueCheckResponse {
  mappingId: string;
  payeeId: string;
  contactId: string;
  isNewPayee: boolean;
  isNewMapping: boolean;
}

export interface ISalesforceAuthUrlResponse {
  authorizationUrl: string;
}

export interface ISalesforceSyncContactsResponse {
  totalSynced: number;
}

export interface ISalesforceContactsMeta {
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
  from: number;
  to: number;
}

export interface ISalesforceContactsResponse {
  success: boolean;
  data: ISalesforceContact[];
  meta: ISalesforceContactsMeta;
}

// =================== HUBSPOT INTEGRATION INTERFACES ===================
export interface IHubSpotProvider {
  id: number;
  name: string;
  code: string;
  logo: string;
}
export interface IHubSpotCompany {
  id: string;
  company_id: string;
  company_name: string;
  last_run: string;
}
export interface IHubSpotDetailsResponse {
  provider: IHubSpotProvider;
  companies: IConnectedCompanyList[];
}
export interface IHubSpotConnectResponse {
    redirectUrl: string;
}
export interface IHubSpotCallbackResponse {
  success: boolean;
  message: string;
}
export interface IHubSpotAddCompanyResponse {
  success: boolean;
  message: string;
}
export interface IHubSpotCompaniesResponse {
  success: boolean;
  companies: IHubSpotCompanies[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}
export interface IHubSpotCompanies {
  id: string;
  hubspotId: string | null;
  portalId: string | number | null;
  name: string;
  domain: string | null;
  industry: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  website: string | null;
  ownerId: string | number | null;
  fullAddress: string | null;
  payeeId: string | null;
  payee?: IPayee | null;
  isActive: boolean;
  createdAt: string;       
  updatedAt: string;
}
export interface IPayee {
  id: string;
  name: string;
}

// =================== CLIO INTEGRATION INTERFACES ===================
export interface IClioProvider {
  id: number;
  name: string;
  code: string;
  logo: string;
}
export interface IClioContacts {
  id: string;
  clioId: string | null;
  name: string;
  domain: string | null;
  industry: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  website: string | null;
  fullAddress: string | null;
  payeeId: string | null;
  payee?: IPayee | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface IClioContactsResponse {
  success: boolean;
  companies: IClioContacts[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}
export interface IClioAddCompanyResponse {
  success: boolean;
  message: string;
}

// =================== SLACK INTEGRATION INTERFACES ===================
export interface ISlackAccount {
  success: boolean,
  total_employees: number,
  employees_with_email: number,
  employees: ISlackEmployee[]
}
export interface ISlackEmployee {
  id: string;
  slack_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  title: string;
  phone: string;
  avatar: string;
  department: string | null;
  is_admin: boolean;
  is_owner: boolean;
  is_bot?: boolean;
  deleted?: boolean;
  workspace_name: string;
  payee_id: string | null;
  has_payee: boolean;
}
export interface ISlackIssueCheckResponse {
  payeeId: string;
  employeeId: string;
  isNewPayee: boolean;
}

// =================== JOBBER INTEGRATION INTERFACES ===================
export interface IJobberProvider {
  id: number;
  name: string;
  code: string;
  logo: string;
}
export interface IJobberDetailsResponse {
  provider: IJobberProvider;
  companies: IConnectedCompanyList[];
  connected: boolean;
}
export interface IJobberConnectResponse {
  success: boolean;
  redirectUrl: string;
}
export interface IJobberCallbackResponse {
  success: boolean;
  message: string;
}
export interface IJobberAddCompanyResponse {
  success: boolean;
  message: string;
}
export interface IJobberCustomersResponse {
  success: boolean;
  customers: IJobberCustomers[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}
export interface IJobberCustomers {
  id: string;
  jobberId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  fullAddress: string | null;
  payeeId: string | null;
  payee?: IPayee | null;
  isActive: boolean;
  createdAt: string;       
  updatedAt: string;
}

/**
 * Module card state for the QuickBooks Payroll integration.
 */
export interface IQuickbooksPayrollModule {
  name: string;
  moduleCode: string;
  logoUrl: string;
  status: string;
  isConnected: number;
}

/**
 * A company connected through QuickBooks Payroll.
 * `lastUpdated` stays null until the first successful import for that company.
 */
export interface IQuickbooksPayrollCompany {
  /**
   * Intuit realmId, used for fetching pay runs and importing their checks.
   */
  companyId: string;
  companyName: string;
  lastUpdated: string | null;
  status: string;
}

/**
 * Payload of the QuickBooks Payroll details endpoint.
 */
export interface IQuickbooksPayrollDetails {
  module: IQuickbooksPayrollModule;
  connected: number;
  companies: IQuickbooksPayrollCompany[];
  providerCode: string;
}

/**
 * Response of the QuickBooks Payroll connect endpoint. `data.url` is the Intuit
 * authorization URL; on failure only `errorMsg` is returned.
 */
export interface IQuickbooksPayrollConnect {
  success: boolean;
  data?: { url: string };
  errorMsg?: string;
}

/**
 * A company / bank account mapping row on the QuickBooks Payroll mapping page.
 * `isMapped` is 0 until a bank account is mapped to the company.
 */
/**
 * Response of the QuickBooks Payroll write actions (map, delete mapping,
 * remove company). `message` carries the success text, `errorMsg` the failure
 * text.
 */
export interface IQuickbooksPayrollActionRes {
  success: boolean;
  message?: string;
  errorMsg?: string;
}

export interface IQuickbooksPayrollBankMapping {
  id: string;
  companyId: string;
  companyName: string;
  OcwAccountName: string;
  OcwAccountNickName: string;
  isMapped: number;
}

import { IBillingAddress } from '../modules/cloud-bank/model/cloudbank';

export interface IBankAccountsState {
  bankAccounts: IBankDropdown[];
  pageNo: number;
  isFilterOn: boolean;
  searchTerm: string;
  searchIds: string[];
  bankAccountsFiltered: IBankDropdown[];
  filteredPageNo: number;
  isLoading: boolean;
  isBankAccountsByIdsLoading: boolean;
  isError: boolean;
  context?: {
    fromDepositSlip?:boolean;
    forPaymentLink?: boolean;
    forInvoice?: boolean;
    forCreditMemo?: boolean;
    forBill?: boolean;
    forCheckDraft?: boolean;
    forCashExpense?: boolean;
    forPayment?: boolean;
  };

  isReload?:boolean;
  /** total number of unfiltered bank accounts reported by the API */
  totalCount?: number;
  /** total number of bank accounts matching the current search term */
  filteredTotalCount?: number;
}

export interface IBank {
  bankRoutingNumber: number;
  bankAccountNumber: number;
  bankAccountName: string;
  bankAccountNickName: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: number;
  bankAccountPhone: string;
  bankAccountEmail: string;
  bankAccountType: string;

  bankName: string;
  bankAddress1: string;
  bankCity: string;
  bankState: string;
  bankZip: number;
  checkSerialNumber: number;
  bankIdentity: number;
  allowDuplicate?: number;

  financialNumber?: string;
  transitNumber?: string;
  country?: string;

  wireRoutingNumberRequired?: number;
  wireRoutingNumber?: string | number;
}

export interface IBankDatas {
  AccountType: string;
  bankAccountAccountNumber: number;
  bankAccountAccountName: string;
  bankAccountAccountAddressLine1: string;
  bankAccountAccountAddressLine2: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: number;
  bankAccountPhone: string;
  bankAccountEmail: string;
  bankAccountNickName: string;
  bankAddress1: string;
  bankCity: string;
  bankName: string;
  bankRoutingNumber: string;
  bankState: string;
  bankZip: string;
  countryBank: number;
  id: string;
  uuId: string;
  accountType: number;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankIdentity: string;
  validationError: {
    success: boolean;
    error: {
      bank_account_nick_name: string[];
      bank_account_zip: string[];
      bank_account_account_name: string;
      bank_zip: string;
      bank_account_account_number: string;
      bank_routing_number: string;
      bank_account_type: string;
      bank_account_address_line_1: string;
      bank_state: string;
      bank_city: string;
      bank_address_1: string;
      bank_account_email: string;
      bank_account_phone: string;
      bank_account_state: string;
      bank_account_city: string;
      bank_name: string;
      bank_account_address_line_2: string;
    };
  };
}

export interface IBankDropdown {
  bankId?: string;
  accountNumber: number | string;
  fullAccountNumber?: number | string;
  achApplicationStatus?: number;
  bankName: string;
  cashAccount?: number;
  id: any;
  isItZil?: number;
  mAch?: number;
  name?: string;
  nickName: string;
  routingNumber?: number;
  transit_no?:string;
  status?: any;
  statusDescription?: string;
  verifiedBy?: string | number;
  bankAccountStatus?: number;
  verified?: number;
  cardId?: string;
  isPositivePayEnabled?: boolean;
  loading?: boolean;
  isRtpAllowed?:boolean;
  isVirtualAccount?: number;
  achSettings?:{
    dailyAmountLimits: number;
  }
  /**
   * It's possible to have 0, 1, 2 as values here.
   *
   * `0 - Not applied and verified.`
   *
   * `1 - Applied and not verified.`
   *
   * `0 - Applied and verified.`
   */
  payrollVerified?: 0 | 1 | 2;
  country?: 'Canada' | 'United States' | 'USA';
  isFavorite?: 0 | 1;
}

export interface IBankQrCode {
  bank_account_name: string;
  id: string;
  logo_url: string;
  name: string;
  payment_url: string;
  short_url: string;
}

export interface ICheckSerialNo {
  serialNo: number;
}

export interface IBankAccounts {
  accountNumber: string;
  bankName: string;
  cashAccount: number;
  id: string;
  isItZil: number;
  mAch: number;
  name: string;
  nickName: string;
  routingNumber: string;
  status: string;
  statusDescription: string;
  verified: number;
}

export interface IRequestPayment {
  id: string;
  uuId: string;
  checkId: string;
  getPaidByFormCheckId: string;
  receivedType: number;
  senderForUserId: string;
  senderByUserId: string;
  receiverForUserId: number;
  receiverByUserId: number;
  receiverPayeeId: number;
  receiverBankAccountId: number;
  receiverEmail: string;
  receiverPhone: string;
  senderEmail: string;
  senderPhone: string;
  amount: string;
  memo: string;
  isEditable: number;
  printByName: string;
  status: number;
  checkFromName: string;
  bankaccountAccountName: string;
  chequeSerialNumber: number;
  receivableType: string;
  receivabeld: number;
  createdAt: string;
  deletedAt: string;
  updatedAt: string;
  chequeIssueDate: string;
  printByNickName: string;
  getPaidByFormCheckRefId: number;
  receivable: {
    customerName: string;
    id: number;
  };
  encryptedId: string;
}

export interface IBankAuditTrial {
  formattedCreatedAt: string;
  status: string;
  userName: string;
  deviceName: string;
  note: string;
}

export interface IBankAccountEditDetails {
  id: string;
  bankId: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankAccountCountry: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2?: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAccountEmail: string;
  nextCheckNumber: number;
  bankAccountNickName: string;
  bankAccountPhone: string;
  bankAccountVerified: number;
  hasTemplate: boolean;
  bankAccountType: number;
  verifyBankAcStatus: number;
  payrollVerified: 0 | 1;
  vb: number;
  routingNumber:number;
  transit_no:string;
  /** Canadian bank: transit number, returned separately from the composite `routingNumber`. */
  transitNumber?: string | null;
  /** Canadian bank: financial institute number, returned separately from the composite `routingNumber`. */
  financialInstituteNumber?: string | null;
}

export interface IConfirmMicroDeposit {
  amount1: number;
  amount2: number;
  bankAccountId: string;
}

export interface IUpdateRemitance {
  amount: number | undefined;
  items: IRemittanceDetails[];
  remittanceType: number | undefined;
}

export interface IRemittanceDetails {
  invoiceNumber?: string;
  itemName?: string;
  itemDescription?: string;
  itemQuantity?: string;
  itemUnitCost?: string;
  totalSingleRow?: number;
  invoiceDate?: string;
  grossAmount?: string;
  discountAmount?: string;
  netAmount?: string | number;
  thisPayment?: number;
  remittanceType?: number;
}

export interface IRemittanceModalData {
  remitance?: IRemittanceDetails[] | undefined;
  remittanceType?: number | undefined;
  paymentTotal?: number | undefined;
  grandTotal?: number | undefined;
  format?: boolean | undefined;
  insert?: boolean;
  amount?: number;
  isNotCheck?: boolean;
  /** True when the modal is opened from a payment in edit mode. */
  isPaymentEdit?: boolean;
}
export interface IRemittanceData {
  remitance: IRemittanceDetails[] | undefined;
  total: number;
  format: boolean;
  insert: boolean;
  isNotCheck: boolean;
  hideSwitchFormat?: boolean;
}

export interface IBankData {
  bank_account_account_name: string;
  bank_account_account_name2: string;
  bank_account_nick_name: string;
  bank_account_account_number: string;
  bank_account_address_line_1: string;
  bank_account_address_line_2?: string;
  id: number;
  bank_account_phone: string;
  bank_account_email: string;
  bank_account_city: string;
  bank_account_state: string;
  bank_account_zip: string;
  bank_name: string;
  bank_routing_number: string;
  mark_as_verified?: number;
  verified_by: number | null;
  yoddle_account_id?: number;
  yodlee_detail?: {
    yd_account_id: string;
  };
  plaid_detail?:{
    plaid_account_id:string;
  };
  bank_account_bank_id: number;
  bank_account_nature_type: number;
  encrypted_routingNumber: string;
  encrypted_bankacc_id: string;
  truncatedBankAccNumber: string;
  encrypted_bankid: string;
  paidLink: IPaidLink;
  ach_application_status?: number | string;
  is_neo_bank: boolean;
  pk?: unknown;
  routingNumber?: string;
  bankName?: string;
  bank_account_country: 'Canada' | 'United States' | 'USA';
  is_favorite?: 0 | 1;
  fractional_no:string;
  transit_no:string;
  is_virtual_account?: number;
  is_positive_pay_enabled?: 0 | 1;
}

export interface IPaidLink {
  id: string;
  short_url: string;
  payment_option: string;
}

export interface IBusinessDetails {
  id: string;
  userId: number;
  businessName: string;
  businessdba?: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessCountry: string;
  businessDescription?: string;
  website?: string;
  entityType: string;
  industryType: string;
  formationDate: string;
  businessIdType?: string;
  ein: string;
  businessPhoneNumber?: string;
  status: number;
  attachments: IAttachments[];
  owners: IOwner[];
}

export interface IAttachments {
  key: 'formation' | 'ownerShip' | 'supportingDocument';
  value: string;
}

export interface IOwner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  ownershipPercentage: number;
  fullSsn: string;
  birthDate?: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/** generate ai logo */

export interface IAILogoGeneratePayload {
  numberOfImages: number;
  size: string;
}

export interface IGetRoutingNumber {
  address: string;
  city: string;
  name: string;
  routingNumber: number;
  state: string;
  telephone: string;
  zip: number;
}

export interface ICloneFormBody {
  bankAccountAccountName: string;
  bankAccountAddressLine_1: string;
  bankAccountAddressLine_2: string;
  bankAccountCity: string;
  bankAccountEmail: string;
  bankAccountNickName: string;
  bankAccountNumber: string;
  bankAccountPhone: string;
  bankAccountState: string;
  bankAccountType: string;
  bankAccountZip: string;
  bankCity: string;
  bankFractionalNumber: string;
  bankName: string;
  bankRoutingNumber: string;
  bankState: string;
  bankStreetAddress: string;
  bankZip: number;
  chequeSerialNumber: string;
  country: string;
  finantialInstNumber: string;
  transitNumber: string;
}

export interface IBankEditForm {
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountCity: string;
  bankAccountCountry: string;
  bankAccountEmail: string;
  bankAccountName: string;
  bankAccountNickName: string;
  bankAccountNumber: string;
  bankAccountPhone: string;
  bankAccountState: string;
  bankAccountType: number;
  bankAccountZip: string;
  checkNumber: number;
  bankId:string;
  bankRoutingNumber:string;
  bankName:string;
  bankAddress1:string;
  bankCity:string;
  bankState:string;
  bankZip:string;
  transitNumber:string;
}

export interface IMicroDepositData {
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  routingNumber: string;
  kycKybInfo: IKycKybInfo;
}

export interface IKycKybInfo {
  kycStatus: boolean;
  kybRecords: IKybRecord[];
}

export interface IKybRecord {
  business_name: string;
  enc_id: string;
  status_description: string;
  source_name: string;
}

export interface IBankCreateRes {
  id: string;
  bankId: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNickName: string;
  bankAccountNumber: string;
  address: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountPhone: string;
  bankAccountEmail: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAccountVerified: string;
  is_neo_bank: boolean;
  bankAccountType: string;
  userName: string;
  phoneNumber: string;
  routingNumber: number;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
}

export interface IPositivepayData {
  bank_accounts_count: number;
  bank_id: number;
  bank_routing_number: string;
  bank_name: string;
  real_bank_name: string;
  id: string;
  ftp_driver: string | null;
  is_eligible:number;
  is_verified: number;
}

export interface ISwiftResponseData {
  routingNumber: string;
  bankName: string;
  type: string;
  paymentMethods: Array<string>;
  address: IBillingAddress;
}

export interface IsetNewBankData {
  bankAccountId?: string | undefined;
  bankAccountNickName?: string | undefined;
}

export interface IMicroDepositQrLinks {
  govId: IDocumentInfo | undefined;
  bankStatement: IDocumentInfo | undefined;
  businessInfo: IDocumentInfo | undefined;
  otherInfo: IDocumentInfo | undefined;
}

export interface IUploadFromPhoneResponse {
  data: IUploadFromPhoneData;
  id?: string;
  link?: string;
  timer: IUploadFromPhoneTimer;
  success: boolean;
  errorMsg: number;
}

export interface IUploadFromPhoneTimer {
  success: boolean;
  diff: number;
}

export interface IUploadFromPhoneData {
  id: string;
  link: string;
  phoneNumber: string;
  uuid: string;
  timer: number;
}

export interface IMicroDepositCalledApiRes {
  govId: IUploadFromPhoneResponse | undefined;
  bankStatement: IUploadFromPhoneResponse | undefined;
  businessInfo: IUploadFromPhoneResponse | undefined;
  otherInfo: IUploadFromPhoneResponse | undefined;
}

export interface IMicroDepositPusherResponse {
  state: number;
  document_info: IDocumentInfo[];
  created_for_id: string;
}

export interface IDocumentInfo {
  document_type: string;
  document_id: string;
  document_name: string;
}

export interface IBankAcItem {
  accountNumber: string;
  accountName?: string;
  bankAccountId: string;
  bankName?: string;
  bizId?: string;
  country: string;
  id: string;
}


export interface IBankValidation {
  success: boolean
  id: string
  address: IAddress
  cheque: ICheque
  bank_name: string
  bank_account_id: string
  cheque_sno: string
}

export interface IAddress {
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  country: string
}

export interface ICheque {
  bank_account_id: number
  cheque_serial_number: string
  account_name: string
  bank_account: IBankData;
}

export interface IAddBankPayload {
  bankAccountNickName: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountCity: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAddress1: string;
  bankCity: string;
  bankState: string;
  bankName: string;
  checkSerialNumber: string;
  bankRoutingNumber: string;
  bankZip: string;
  bankAccountType?: string;
  transitNumber: string;
  financialNumber: string;
  country: string;
  bankIdentity: string;
  allowDuplicate?: string;
}

export interface IConfirmVirtualAccount {
  bankAccountNumber: string;
  bankId: string ;
  bankRoutingNumber: string;
  bankName: string;
  bankAddress1?: string | null;
  bankCity: string;
  bankState: string;
  bankZip: string;
}

export interface IImportedBanksUpdates {
  bank_account_account_number: number
  bank_account_address_line_1: string
  bank_account_address_line_2: string
  bank_account_city: string
  bank_account_state: string
  bank_account_zip: string|number
  errors: {[key:string]:string[]}
}

export interface IUploadPodFromPhonePayload {
  requestType: string;
  documentType: string[];
  encryptedId: string;
  uu_id: string;
}
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { V35Colors } from 'src/app/shared/v3/v35-dropdown/models/v35-common-dropdown-selector.interface';
import {
  ICloudAccountDetails2,
  ICloudBankAccountDetailsAirwallex
} from '../../cloud-bank/model/cloudbank';
import { IExistingCreditCards } from '../../../models/payment-switch-board';
import { IBankDropdown, IRemittanceDetails } from '../../../models/bank';
import { ICategoryDropdown } from '../../category/model/category';
import { ICheckDetails, ICheckDetailsData, IExpenseDetails2 } from '../../check/model/check';
import {
  IPayeeDropdown,
  IPayeeViewBank
} from '../../payee/payee-v2/model/payee';
import { IWalletData } from '../../../models/wallet';
import { ICloudAccount } from '../../../data/data/internal-transfer';

export type TPaymentSource = 'card' | 'bankaccount' | 'cloud' | 'wallet' | 'WALLET';
export type TReceivePaymentDestination =
  | 'debit_pull'
  | 'check_deposit'
  | 'bank';
export type TPaymentDestination = 'email' | 'sms' | 'payer';
export type TPaymentProcessingContext =
  | 'save'
  | 'update'
  | 'pay'
  | 'updateAndPay';

export interface IRecurringDetails {
  is_recurring_value: number;
  recurring: {
    count: string;
    end_select: string;
    frequency: string;
    start_date: string;
  };
}

export interface IPaymentFeeDetails {
  originalAmount: number | string;
  serviceFeeWithoutAdditionalFee: number | string;
  additionalFee: number | string;
  serviceFee: number | string;
  totalAmount: number;
  sameDayFee?: {
    title: string;
    fee: number;
  };
  /** charged when the payee is texted about the payment */
  smsFee?: {
    title: string;
    fee: number;
  };
  cardAchFee?: {
    fee?: string;
    title?: string;
  };
  attachmentFee?: {
    fee: number;
    title: string;
  }
}

export interface IPaymentFeeDetailsItem {
  calcFeeRequest?: ICalcPaymentFeeRequest;
  feeDetails?: IPaymentFeeDetails;
  isLoading: boolean;
  isError: boolean;
  isShow: boolean;
  apiSubscription?: Subscription;
  transactionFeeSubscription?: Subscription;
  sameDayFee?: {
    title: string;
    fee: number;
  };
  cardAchFee?: {
    fee?: string;
    title?: string;
  };
}

export interface ICalcPaymentFeeRequest {
  amount: number;
  mode: number;
  fee1Label?: string;
  fee2Label?: string;
  shippingType?: string;
  isSameDay?: boolean;
}

export interface IPayFromItem {
  label: string;
  shortLabel: string;
  id: TPaymentSource | TReceivePaymentDestination;
  sourceType?: string;
  fontawsomeIconClass?: string;
  fontawesomeIconDataV35?: {
    icon: IconProp;
    color?: V35Colors;
  };
  fontawesomeIconDataV4?: {
    lucideIcon: string;
    color?: string;
  };
  img?: string;
  payOptions?: IPayAsItem[];
  isHide?: boolean;
  isDisable?: boolean;
}

export interface ICheckActionList {
  label: string;
  icon: string;
  disableAt: {
    [key: string]: string[];
    COMPLETED: string[];
    PENDING: string[];
    PROCESSING: string[];
    CANCELED: string[];
    FAILED: string[];
    SCHEDULED: string[];
  };
}

export interface IReceivePayItem {
  label: string;
  id: TReceivePaymentDestination;
  fontawsomeIconClass?: string;
  fontawesomeIconDataV35?: {
    icon: IconProp;
    color?: V35Colors;
  };
  img?: string;
  payOptions?: IPayAsItem[];
}

export interface IPayAsItem {
  label: string;
  id: string;
  fontawsomeIconClass?: string;
  fontawesomeIconDataV35?: {
    icon: IconProp;
    color?: V35Colors;
  };
  img?: string;
  isHide?: boolean;
  isDisable?: boolean;
  toolTip?: string;
  isSelectable?: boolean;
  extraId?: string;
}

export interface ITransferToItem {
  label: string;
  dropDownLabel?: string;
  fontawsomeIconClass?: string;
  img?: string;
  transferComponent: number;
  fontAWesomeV35IconData?: {
    icon: IconProp;
    colorVariable: V35Colors;
  };
}
export interface ISendPaymentContext {
  source: IPayFromItem;
  method: IPayAsItem;
}

export interface ICloudtoGiftForm {
  behalfOf?: string;
  type: string;
  accountId: string;
  session_key: string;
  contactEmail: string;
  contactPhone: string;
  payee: string;
  amount: number;
  memo: string;
  payeeIdNumber?: string;
  isBehalfOf: number;
  card: {
    nickName: string;
  };
}

export interface ICloudtoCheckForm {
  type: string;
  accountId: string;
  session_key: string;
  payee: string;
  amount: number;
  memo: string;
  payeeIdNumber?: string;
}

export interface ICLoudtoDebitForm {
  type: string;
  payee: string;
  session_key: string;
  accountId: string;
  amount: number;
  memo: string;
  payeeIdNumber?: string;
}

export interface ICloudToAchForm {
  behalfOf?: string | null | undefined;
  type: string;
  accountId: string;
  session_key: string;
  payee: string | undefined;
  payeeBankAccount: string | undefined;
  amount: string;
  memo: string;
  isBehalfOf: number;
  payeeIdNumber?: string | null | undefined;
}

export interface ICloudToWireForm {
  behalfOf?: number;
  type: string;
  accountId: string;
  session_key: string;
  payee: string;
  internationalPayeeBankAccount: string;
  payeeBankAccount: string;
  amount: number;
  memo: string;
  payeeIdNumber?: string;
  isBehalfOf: number;
}

export interface IQBOExportsData {
  realmId: string;
  qbBankId: string;
  formValue: IQBOExportsFormBody[];
  QBOTotal: number;
  locationId?: string;
  hasQboExportData: boolean;
}

export interface IQBDExportsData {
  companyId: string;
  qbdBankId: string;
  formValue: IQBDExportsFormBody[];
  QBDTotal: number;
}

export interface IQBOExportsFormBody {
  categoryId?: string;
  description?: string;
  customerId?: string | null;
  classId?: string | null;
  amount?: string;
}

export interface IQBDExportsFormBody {
  expenseId?: string;
  description?: string;
  customerId?: string;
  classId?: string;
  amount?: string;
}

export interface IFreshBookExportsData {
  attachFreshbooksExpenseToCheck: string;
  companyId: string;
  categoryId: string;
  description: string;
  amount: string;
}

export interface IPaymentExportsOptions {
  isQBOPushBack: boolean;
  isQBDPushBack: boolean;
  isNetsuitePushBack: boolean;
  isQBDPushBackPermitted?: boolean;
  isQBOPushBackPermitted?: boolean;
  isNetSuitePushBackPermitted?: boolean;
  isFreshBooksPushBack: boolean;
  isFreshBooksPushBackPermitted?: boolean;
}
export type IAcc =
  | IBankDropdown
  | ICloudAccountDetails2
  | IExistingCreditCards
  | IWalletData;
export interface IDefaultPayment {
  payFrom: IPayFromItem | undefined;
  payAs: IPayAsItem | undefined;
  memo: string;
  paymentAc: IAcc | undefined;
}

export interface ICheckPaymentsForm {
  amount: string;
  payee: IPayeeDropdown;
  bankAc: IBankDropdown;
  memo: string;
  issueDate: string;
  category: ICategoryDropdown;
  invoiceNumber: string;
  checkNumber: string;
  noAmount: boolean;
  noSign: boolean;
  noPayee: boolean;
  noDate: boolean;
}

export interface IPaymentConfig {
  mode?: 'EDIT' | 'CREATE' | 'CLONE';
  type1?: 'RECEIVE' | 'PAY';
  type2?: string;
  type3?: string;
  id?: string;
  paymentDetails?: IPaymentDetails;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentFormValue?: any;
  checkDetails?: ICheckDetailsData;
  memo?: string;
}

/**
 * The delivery a check went out on. `method` names it (`print`, `mail`, `email`,
 * direct deposit); for a print, `type` is the paper code it was printed on.
 */
export interface IPaymentMethodSummary {
  method: string;
  methodLabel?: string;
  type?: number | string | null;
  typeLabel?: string | null;
}

export interface IPaymentDetails {
  id: string;
  sourceId: string;
  sourceType: string;
  amount: string;
  payeeId: string;
  payee_name?: string;
  transferId: string;
  transferTypeCode: string;
  transferType: string;
  transferMode: string;
  source:
    | IBankDropdown
    | IWalletData
    | IExistingCreditCards
    | ICloudAccount
    | unknown;
  transfer: ICheckDetails;
  referenceNo: string;
  status: string;
  description: string;
  payee: IPayeeDropdown;
  createdAt: string;
  category: ICategoryDropdown;
  payeeBankAccount: string;
  updatedAt: string;
  zilpaymentId: string;
  source_deleted: number;
  payee_deleted: number;
  credit_card_service_fee: number;
  billInfo?: string;
  metadata: { shippingType: string ,sentToCustomAddress?:number,customShippingTo?:string, paymentMethod?:string,customShippingFrom?:string,sentWithAttachment?:number};
  /** How a check went out, as `GET /zil-payments/{uuid}` reports it. */
  paymentMethod?: IPaymentMethodSummary | null;

  signatureUrl?:string;
  payment_receipt_id?:string;
  hasQboExportData:number
  netsuiteDetails?: IExpenseDetails2[];
  is_payee_bank_verification_held?: number;
  is_micro_deposit_initiated?:number
}

export interface IUpdatePaymentBody {
  amount?: number;
  paymentDueDate?: string;
  payee?: string;
  category?: string;
  payeeBankAccount?: string | number;
  referenceNo?: string;
  description?: string;
  sourceType?: TPaymentSource;
  sourceId?: string;
  transferType?: string;
  payeeIdNumber?: string;
  commentIds?: string[];
  attachmentIds?: string[];
  items?: IRemittanceDetails[];
  remittanceType?: number | undefined;
  payeeEmail?: string | undefined;
  bills?: string[];
  shippingType?: string;
  otp_and_docs_preview_section_in_credit_card?:number;
  session_key?:string;
  email_otp_session_key?:string;
  phone_otp_session_key?:string;
  document_preview_agree?:number,
  otp_type?:string;
  paymentMethod?:string;
  // NetSuite export fields
  attachNetsuiteExpenseToCheck?: string;
  netsuiteExpenseDetails?: IQBDExportsFormBody[] | string;
  netsuiteBankId?: string;
  customShippingTo?:string;
  sentToCustomAddress?:number;
  customShippingFrom?:string;
  achRecurring?:number;
  sentWithAttachment?:number;
  /** Notify the payee by text, and the number to use. */
  send_sms?: boolean;
  payee_phone?: string;
}

export interface ISavePaymentBody {
  amount?: number;
  paymentDueDate?: string;
  payee?: string;
  category?: string;
  payeeBankAccount?: string | number;
  referenceNo?: string;
  description?: string;
  sourceType?: TPaymentSource;
  sourceId?: string;
  transferType?: string;
  payeeIdNumber?: string;
  commentIds?: string[];
  attachmentIds?: string[];
  items?: IRemittanceDetails[];
  remittanceType?: number | undefined;
  payeeEmail?: string;
  // NetSuite export fields
  attachNetsuiteExpenseToCheck?: string;
  netsuiteExpenseDetails?: IQBDExportsFormBody[] | string;
  netsuiteBankId?: string;
}

export interface IEnablePaymentsMethods {
  isCloudBankEnabled: number;
  internationalWireEnabled: number;
  debitPullEnabled: number;
  debitPushEnabled: number;
  checkDepositEnabled: number;
  isVirtualCardSendEnabled: number;
  isCheckMailSendEnabled: number;
  isInternationalPaymentEnabled: number;
  isPaymentWireTransferEnabled: number;
  isPayrollWireTransferEnabled: number;
  isPaymentRtpTransferEnabled:number;
  isPayrollRtpTransferEnabled: number;
  isCardRailPaymentWireTransferEnabled:number;
  paymentLimit: {
    virtualCardSend: string;
    checkMailSend: string;
  };
}

export interface IPaymentSuccessData {
  title?: string;
  paymentReceived?: string;
  content?: string;
  type?: string;
  sourceType?: TPaymentSource;
  id?: string;
}

export interface ICardPaymentReqDocRes {
  card?: string;
  invoices?: string[];
  certificate?: string;
  authDoc?: string;
  cardReverse?: string;
}

export interface IACHCloudForm {
  amount: FormControl<number | null>;
  memo: FormControl<string | null>;
  payeeBankAc: FormControl<null | undefined | IPayeeViewBank>;
  behalfOf: FormControl<string | null>;
  payeeEmail: FormControl<string | null>;
  cloud: FormControl<ICloudBankAccountDetailsAirwallex | null>;
  payee: FormControl<IPayeeDropdown | null | undefined>;
  payeeIdNumber: FormControl<string | null | undefined>;
  category?: FormControl<string | null>;
  // industryType: FormControl<number | string | null>;
}

/** Interface of Debit card details */
export interface IDebitCardDetails {
  cardNumber: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  address: Address;
  pull: IDebitCardPull;
  push: IDebitCardPush;
  usageType: string;
}

export interface Address {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IDebitCardPull {
  enabled: boolean;
}

export interface IDebitCardPush {
  enabled: boolean;
}
export interface IInterBankCloudForm {
  amount: FormControl<string | null>;
  memo: FormControl<string | null>;
  payeeBankAc: FormControl<null | undefined | IPayeeViewBank>;
  cloud: FormControl<ICloudBankAccountDetailsAirwallex | undefined>;
  payee: FormControl<IPayeeDropdown | undefined>;
  payeeIdNumber: FormControl<string | null>;
  payeeEmail: FormControl<string | null>;
}

export interface IInterBankCloudData {
  accountId: string | undefined;
  payee: string | undefined;
  amount: string | null | undefined;
  memo: string | null | undefined;
  type: string;
  session_key: string;
  all_attachments: string[];
  all_comments: string[];
  quickPay: number;
  payeeBankAccount: string | undefined;
  isBehalfOf: number;
}

export interface IpayeeTypeDetails {
  id: string;
  createdAt: string;
  customerAccountNumber: string;
  customerBankAccountId: string;
  customerCompanyName: string;
  customerDefaultPayMethod: string;
  customerFirstName: string;
  customerLastName: string;
  customerMiddleName: string;
  customerNote: string;
  customerType: string;
  deletedAt: string;
  employeeAccountNumber: string;
  employeeBankAccountId: string;
  employeeDefaultPayMethod: string;
  employeeDob: string;
  employeeFillingStatus: string;
  employeeFirstName: string;
  employeeHourlyRate: string;
  employeeLastName: string;
  employeeMiddleName: string;
  employeeNote: string;
  employeeOvertimeRate: string;
  employeePaymentSchedule: string;
  employeeSsn: string;
  employeeType: string;
  employeeYtdEarning: string;
  employeeYtdTax: string;
  payee: {
    payeeId: string;
    payeeAccountNumber: string;
    payeeMobilePhone: string;
  };
  updatedAt: string;
  vendor1099: string;
  vendorAccountNumber: string;
  vendorBankAccountId: string;
  vendorCompanyName: string;
  vendorDefaultPayMethod: string;
  vendorFirstName: string;
  vendorLastName: string;
  vendorMiddleName: string;
  vendorNote: string;
  vendorPaymentTerms: string;
  vendorTaxId: string;
  vendorType: string;
}
export interface IpayeeEditData {
  amount?: string | null;
  attachmentIds?: string[] | null;
  bankAc?: IBankDropdown | null;
  category?: ICategoryDropdown | null;
  checkNumber?: number | null;
  chequeInvoiceNumber?: string | null;
  commentIds?: string[] | null;
  issueDate?: string | null;
  memo?: string | null;
  noAmount?: boolean | null;
  noDate?: boolean | null;
  noPayee?: boolean | null;
  noSign?: boolean | null;
  payee?: IPayeeDropdown | null;
  payeeIdNumber?: string;
  remittance?: IRemittanceDetails[] | null;
  remittance_type?: number | null;
}

export interface ICloudBankDetailsRes {
  id: string;
  accountId: string;
  payeeId: string;
  accountNumber: string;
  routingNumber: string;
  amount: 10;
  feeAmount: 0;
  totalAmount: 10;
  status: string;
  description: string;
  txnType: string;
  beneficiaryName: string;
  transferType: string;
  transferDate: string;
  transactionId: null | string;
  transactionStatus: null | string;
}

export interface IPaymentBody {
  type?: string | undefined;
  walletId?: string | undefined;
  amount?: string | null | undefined;
  bankaccountId?: string | undefined;
  send_sms?: boolean | null | undefined;
  payee_phone?: string | null | undefined;
  cardId?: string | undefined;
  payees: {
    id?: string | undefined;
    amount?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    memo?: string | null | undefined;
    bankAccount?: string | undefined;
    invoiceNumber?: string | null | undefined;
    bills?: string[];
    payeeIdNumber?: string | undefined;
    category?: string | undefined;
  }[];
  mode: string;
  commentIds: string[];
  attachmentIds: string[];
  items: IRemittanceDetails[] | undefined;
  /** Omitted entirely when the payment carries no remittance line items. */
  remittanceType?: number | undefined;
  documents?: ICardPaymentReqDocRes;
  isSameDay?: number;
  achRecurring?: number;
  three_ds_data?: ThreeDSPayload;
  session_key?:string;
  otp_type?:string;
  email_otp_session_key?:string;
  phone_otp_session_key?:string;
  document_preview_agree?:number
  payee_email?:string;
  category?:string
}

export type ThreeDSPayload = {
  xid: string;
  cavv: string;
  eci: string;
  cardholder_auth: string;
  three_ds_version: string;
  directory_server_id: string;
  cardholder_info: string;
}

export interface IPaymentsProofPayload {
  type?: 'email' | 'sms' | 'link' | 'download' | ['email'] | ['sms'] | ['email', 'sms'] |['link'] | ['download'];
  email?: string;
  phone?: string;
  is_signed_receipt?: boolean;
  is_signature_request?: boolean;
  memo?: string;
  payerName?: string;
  payeeName?: string;
  logo?: FormData | string;
  attachment_ids?: string[];
  /** Section shared via /send-audit-log: audit_log | comments | attachments | remittance. */
  share_type?: string | string[];
  recipient_name?: string;
}

export interface IPodDetails {
  file_name: string;
  user_name: string;
  proof_type: string;
  file_path: string;
  proof_id: number;
  page_count: number;
  created_at: string;
  id: number;
  description: string;
  formated_date: string;
  encrypted_id: string;
  public_url: string;
}

export interface ICardTransactionDocsPayload {
  user_id: string;
  amount: string;
  invoiceNumber: string;
  memo: string;
  paymentType: string;
  authSign: string;
  cardId: string;
  payee_phone: string;
  payees: {
    id?: string | undefined;
    amount?: string | null | undefined;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    memo?: string | null | undefined;
    bankAccount?: string | undefined;
    invoiceNumber?: string | null | undefined;
    bills?: string[];
    payeeIdNumber?: string | undefined;
  }[]; // Consider creating a more specific interface for payees
  mode: string;
  isSameDay: number;
  email_otp_session_key: string;
  phone_otp_session_key: string;
  companyId?: string;
  companyType?: string;
  payrollId?: string;
  zil_payment_uuid?: string;
  payee_email?: string;
}
export interface IBusinessBanksResponse {
  success: boolean;
  data: { label: string; value: string }[];
}

export interface ITransactionLimits {
  monthly_amount_limit: number;
  amount_spent_this_month: number;
  monthly_transaction_limit: number;
  transaction_count_this_month: number;
}

export interface IBusinessDataList {
  business_banks: IDataList[]
  relationships: IDataList[]
  beneficiary_document_types: IDataList[],
  bicfi_banks: { label: string; value: string }[]
}

export interface IDataList {
  label: string
  value: string
}
export interface IAttachmentFee {
  total_page_count: number
  total_pdf_attachment_count: number
  per_page_fee: number
  total_attachment_fee: number
}


export interface IMaintenance {
  id: number;
  appPlatform: string;
  appName: string;
  description: string;
  status: 'enabled' | 'scheduled' | 'disabled';
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}


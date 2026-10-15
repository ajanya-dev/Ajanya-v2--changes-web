//......Payment track interface...........//

import { IKycKybInfo } from "src/app/models/bank";
import { IPlaidCallBackResAccount } from "src/app/shared/plaid/service/plaid.service";

export interface IPaymentDetails {
  id: string;
  sourceId: string;
  sourceType: string;
  amount: string;
  amount_in_words: string;
  payeeId: string;
  transferId: string;
  transferType: string;
  transferMode: string;
  from: IPaymentSendDetails;
  referenceNo: string;
  status: string;
  description: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  statements: IPaymentStatements;
  payee: IPayee;
  from_wallet: { walletName: string };
  payee_bank_details: IPayeeBankDetails;
}

export interface IPaymentSendDetails {
  bank_name: string;
  bankNickName: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAccountCountry: string;
}

export interface IPaymentStatements {
  PROCESSING: IProcessingStatus[];
  REFUNDED: IRefundedStatus[];
  CANCELED: ICancelStatus[];
  COMPLETED: ICompletedStatus[];
  FAILED: IFailStatus[];
  PENDING: IPendingStaus[];
}

export interface IProcessingStatus {
  description: string;
  created_at: string;
  update_at: string;
  index: number;
}

export interface IRefundedStatus {
  description: string;
  created_at: string;
  update_at: string;
  index: number;
}
export interface ICancelStatus {
  description: string;
  created_at: string;
  update_at: string;
  index: number;
}
export interface ICompletedStatus {
  description: string;
  created_at: string;
  update_at: string;
  index: number;
}
export interface IFailStatus {
  description: string;
  created_at: string;
  update_at: string;
  index: number;
}
export interface IPendingStaus {
  description: string;
  created_at: string;
  update_at: string;
  index: number;
}

export interface IPayee {
  payeeId?: string;
  payeeName: string;
  payeeNickName: string;
}

export interface IPayeeBankDetails {
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountCity: string;
  bankAccountCountry: string;
  bankAccountNumber: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankNickName: string;
  bank_name: string;
}

export interface ICloudCardFullDetails {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface ICloudCardTransactions {
  id: string;
  txnType: string;
  title: string;
  amount: string;
  transferType: string;
  subType: string;
  description: string;
  balance: string;
  status: string;
  accountId: string;
  businessId: string;
  programId: string;
  personId: string;
  familyId: string;
  parentTransferId: string;
  parentTxnId: string;
  reviewCode: string;
  reviewMessage: string;
  intrabank?: any;
  ach?: any;
  card: {
    id: string;
    transferId: string;
    label: string;
    merchant: {
      merchantName: string;
      merchantCity: string;
      merchantState: string;
      merchantCountry: string;
      postalCode: string;
      merchantCategory: string;
      merchantCategoryCode: string;
      merchantId: string;
    };
    authMethod: string;
    wallet: string;
    authId: string;
    localTransactionAmount: string;
    localTransactionCurrency: string;
    currencyConversionRate: string;
    rewardAmount: string;
  };
  domesticWire?: any;
  internationalWire?: any;
  digitalCheck?: any;
  physicalCheck?: any;
  debitCard?: any;
  solidCard?: any;
  crossBorder?: any;
  buy?: any;
  sell?: any;
  enrichedData?: any;
  createdAt: Date;
  modifiedAt: Date;
  txnDate: Date;
  metadata?: any;
}

export interface ICloudCardDetailsRes {
  success: boolean;
  data: ICloudCardDetails;
  transaction_info: ITransactionInfo;
}

export interface ICloudCardDetails {
  name: string;
  email: string;
  cardNickName: string;
  cardType: string;
  label: string;
  expiryMonth: string;
  expiryYear: string;
  last4: string;
  cardStatus: string;
  availableBalance: string;
  description: string;
  cardHolder: ICardHolder;
}

export interface ICardHolder {
  billingAddress: IBillingAddress;
  name: string;
}

export interface IBillingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ITransactionInfo {
  sender: ISenderTxnDetails;
  behalf_of: string;
  reference_id: string;
}

export interface ISenderTxnDetails {
  sender_account_name: string;
  sender_name: string;
}

// virtual Card

export interface IVcnVirtualCardInfo {
  card: IVirtualCardCard;
  details: IDetails;
}

export interface IVirtualCardCard {
  id: string;
  cardHolder: IVirtualCardHolder;
  currency: string;
  last4: string;
  expiry: string;
  status: string;
  valid_starting_on: string;
  valid_ending_on: string;
  created_at: string;
  updated_at: string;
  card_number: string;
  cvc: string;
  available_balance: number;
  transactions_max: number;
  per_transaction_min: number;
  per_transaction_max: number;
}

export interface IVirtualCardHolder {
  name: string;
  email: string;
  address: IAddress;
}

export interface IAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IDetails {
  sender_name: string;
}

export interface ISendCards {
  success: boolean;
  data: IVirtualSendCard[];
  total: number;
}

export interface IVirtualSendCard {
  id: string;
  cardHolder: ISendCardHolder;
  currency: string;
  last4: string;
  expiry: string;
  status: string;
  valid_starting_on: string;
  valid_ending_on: string;
  created_at: string;
  updated_at: string;
  card_amount: string;
}

export interface ISendCardHolder {
  name: string;
  email: string;
  address: ISendAddress;
}

export interface ISendAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IPaymentMetaData {
  amount: string;
  documentType: 'invoice' | 'card' | 'cardReverse';
  cardLast4: string;
  cardNickName: string;
  uuid?:string;
}

export interface IMicroDepositMetaData {
  documentType: string[];
  bankAccountNumber: string;
  kycKybInfo: IKycKybInfo;
}

export interface IExternalPayeePayload {
  user_id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  payee_nickname?: string | null;
  payee_phone?: string | null;
  customer_account_number?: string | null;
  vendor_account_number?: string | null;
  employee_account_number?: string | null;
  payee_company_name?: string | null;
  payee_email?: string | null;
  payee_address_line1?: string | null;
  payee_address_line2?: string | null;
  payee_city?: string | null;
  payee_state?: string | null;
  payee_country?: string | null;
  payee_zip?: string | null;
  employee_ssn_number?: string | null;
  vendor_ein_number?: string | null;
  add_payee_bank: number;
  payee_name: string;
}

export interface IWalletCardData {
  card: IWalletCard
  available_limit_amount: string
  total_limit_amount: string
  initial_limit_amount: string
  card_info: IWalletCardInfo
}

export interface IWalletCard {
  card_type: string
  expiry_month: string
  expiry_year: string
  limit_amount: string
  last4: string
  name_on_card: string
  master_card_id: string
  card_status: string
  holder: IWalletCardHolder
  created_at: string
  updated_at: string
  sender:string
}

export interface IWalletCardHolder {
  name: string
  address1: string
  address2: string
  city: string
  state: string
  country: string
  zip: string
}

export interface IWalletCardInfo {
  secretKey: string
  token: ICardToken
  expiryMonth: string
  expiryYear: string
  provider: string
}

export interface ICardToken {
  message: string
  error: string
  statusCode: number
  encryptedPan: {iv:string;data:string}
  encryptedCvc: {iv:string;data:string}
}

export interface IGiftCardTransactions {
  amount: string
  txn_date: string
  description: string
  merchant_name: string
  merchant_city: string
  merchant_state: string
  merchant_country: string
  merchant_category_code: string
  merchant_category: string
  status: string
}

export interface IBillingAddressPayload{
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

export interface IVcnCardHolderUpdatePayload{
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null ;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip_code?: string | null;
}

export interface IOutsidePersonaEnquiryData {
  inquiryId: string
  inquiryType: string
  status: string
  user_id: number
  session_token: string
  failed_inquiry_count: number
  maximum_allowed_attempt: number
}

export interface IPlayedPayload {
user_id?: string;
email?: string;
ref_id?: string;
ref_type?: string;
}
export interface IBankDetails {
  request_id: string;
  bank_account_id: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_name: string;
}

export interface IExternalMicroDepositPayload {
  request_id: string;
  bank_account_id: string;
  amount1: number;
  amount2: number;
}

export interface IDocumentVerificationData {
  requested_document_types: {[key: string]: string};
  link: string;
}

export interface IPayeeBankVerificationInfo {
  scenario: number | null;
  expires_at: string | null;
  account_number: string | null;
  routing_number: string | null;
  payee_name: string | null;
  payor_name: string | null;
  amount: string | null;
  payment_method: number | null;
  payment_reference: string | null;
  account_type: string | null;
  bank_account_id: string | null;
  micro_deposit_pending?: boolean;
  micro_deposit_status?: number;
}

export interface IPayeeBankVerificationSavePayload {
  token: string;
  account_name: string;
  routing_number: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  plaid_account_id?: string;
  plaid_provider_id?: string;
}

export type PayeeBankVerificationType = 'plaid' | 'instant' | 'md';

export interface IPayeeBankVerificationSaveRes {
  message: string;
  type: PayeeBankVerificationType;
}

export interface IPayeeVerificationPlaidVerifyAccount {
  full_account_number: string;
  routing_number: string;
  account_number_last4: string;
  account_name: string;
  plaid_account_id: string;
  institution_id: string;
  account_sub_type: string;
}

export interface IPayeeVerificationPlaidVerifyPayload {
  token: string;
  selectedBankId: string;
  accounts: IPlaidCallBackResAccount[];
}
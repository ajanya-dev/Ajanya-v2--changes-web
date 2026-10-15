import { FormControl } from '@angular/forms';
import { SafeResourceUrl } from '@angular/platform-browser';
import { IPayeeDropdown } from '../modules/payee/payee-v2/model/payee';
import { IInternationalPayeeAccount } from '../modules/cloud-bank/cloud-bank-v2/model/internationalPayments';

export interface IWalletsStates {
  wallets: IWalletData[];
  pageNo: number;
  isFilterOn: boolean;
  searchTerm: string;
  searchIds: string[];
  walletsFiltered: IWalletData[];
  filteredPageNo: number;
  isLoading: boolean;
  isWalletsByIdsLoading: boolean;
  isError: boolean;
  isPermissionDenied: boolean;
  walletUploadPrompt?: number;
  totalCount?: number;
  /**
   * How many rows a full page holds, learned from page 1 rather than assumed —
   * the request sends no limit, so the server is the only one who knows it.
   */
  pageSize?: number;
  /** False once a page came back short or empty: there is no next page to ask for. */
  hasMore: boolean;
  /** The same, for the search results — they page separately from the full list. */
  filteredHasMore: boolean;
  /** Optional context to control how wallets are fetched/filtered */
  context?: {
    /** When true, fetch only international payment eligible wallets */
    internationalPaymentWallets?: boolean;
  };
  disablePermission?: boolean;
}

export interface IWalletRoot {
  success: boolean;
  data: IWalletData[];
  totalCurrentBalance: string;
  totalAvailableBalance: string;
  totalCount?: number;
  walletUploadPrompt?: number;
}

export interface IWalletData {
  displayName?: string;
  id: string;
  cardId?: string;
  uuId: string;
  availableBalance: string;
  currentBalance: string;
  bankAccount_id?: string;
  walletName: string;
  walletType: number;
  bankAccountName?: string;
  bankAccountNickName?: string;
  bankAccountNumber: string;
  bankAccountNatureType?: number;
  isFavorite?: 0 | 1;
  logo?: string;
  fundType?: string;
  /** The wallet's own return address, as `GET /wallets` now carries it. */
  address?: IWalletAddress;
}

/** The sender a cheque drawn on this wallet prints. */
export interface IWalletAddress {
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface IOnBoardingPayeeWalletDetails {
  availableBalance: string;
  currentBalance: string;
  walletName: string;
  lastPaymentBy: string;
  transactions: {
    amount: string;
    createdAt: string;
    paymentFrom: string;
    transferType: string;
  }[];
}

export interface IStatus {
  name: string;
  short_name: string;
  subject_type: number;
}

export interface IWalletSettings {
  isWalletBypassingEnabled: boolean;
  isAutoWithdrawalEnabled: boolean;
  isAutoPullDisabled: boolean;
  autoWithdrawalBankAccountId: string;
  session_key: string;
}

export interface IWalletTransactionStatements {
  date: string;
  status: string;
  note: string;
}

export interface IRechargeCredits {
  amount: number;
  comment: string;
  fromWallet: string;
}
export interface ITransferFunds {
  amount: number;
  comment: number;
  fromWallet: string;
  toWallet: string;
}

export interface IWidthdrawFunds {
  amount: number;
  comment: string;
  fromWallet: string;
  isSameDay: number;
  session_key: string;
  toBankAccountId: string;
  transfer_method?: string;
  customToAddressId?: string | null;
  shippingType?: string | null;
}

export interface IFundWallet {
  bankAccount?: string;
  amount: number;
  comment: string;
  transactionType: string;
  accountType?: string;
  totalAmount: number;
  digitalSignature?: string;
  bankHolderName?: string;
  wireType?: string;
  chain?: string;
  fromAddress?: string;
  transactionHash?: string;
}
export interface IFundWalletResponse {
  success: boolean;
  message?: string;
  data: IFundWalletResponseData;
}

export interface IFundWalletResponseData {
  client_secret: string;
  amount: string;
  transaction_fee: string;
  total: number;
  user_details: IUserDetails;
  cards: ICard[];
  applicationUniqueId?: string;
}

export interface IUserDetails {
  name: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
}

export interface ICard {
  id: string;
  brand: string;
  country: string;
  exp_month: number;
  exp_year: number;
  last4: string;
  user_details: IUserDetails2;
}

export interface IUserDetails2 {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  line1: string;
  line2: string;
  postal_code: string;
  state: string;
}

export interface IWalletDetailsData {
  created_at: string;
  description: string;
  credit: string;
  debit: string;
  initial_balance: string;
  current_balance: string;
  bank_account_id: number;
  status: number;
  reason: string;
  uu_id: string;
  id: number;
  transaction_type: number;
  check_no?: string;
  payee_name?: string;
  is_it_withdrawn: unknown;
  subject_type: number;
  wallet_name: string;
  transaction_amount: string;
  subject_type_short_name: string;
  type: string;
}

export interface IWithdrawFundForm {
  fromWallet: FormControl<string | null>;
  toBankAccountId: FormControl<string | null>;
  amount: FormControl<number | null>;
  comment: FormControl<string | null>;
  isSameDay: FormControl<number | null>;
  selectedWithdrawMethod: FormControl<string | null>;
}

export interface IFundWalletForm {
  bankAccount: FormControl<string | null>;
  bankHolderName: FormControl<string | null>;
  toWallet: FormControl<string | null>;
  amount: FormControl<number | null>;
  comment: FormControl<string | null>;
  transactionType: FormControl<string | null>;
  accountType: FormControl<string | null>;
  totalAmount: FormControl<number | null>;
  digitalSignature: FormControl<string | null>;
  chain: FormControl<string | null>;
  fromAddress: FormControl<string | null>;
  receiving_crypto_address: FormControl<string | null>;
  transactionHash: FormControl<string | null>;
}

export interface IRechargeWalletForm {
  fromWallet: FormControl<string | null>;
  amount: FormControl<number | null>;
  comment: FormControl<string | null>;
}

export interface IWalletSettingForm {
  isWalletBypassingEnabled: FormControl<boolean | null>;
  isAutoWithdrawalEnabled: FormControl<boolean | null>;
  autoWithdrawalBankAccountId: FormControl<string | null>;
  isAutoPullDisabled: FormControl<boolean | null>;
}

export interface IWalletAchRequest {
  transferRequest: IWalletTransferRequest;
  achTransactions: IWalletAchTransaction[];
}

export interface IWalletTransferRequest {
  id: number;
  uu_id: string;
  reference_type: number;
  reference_id: string;
  transfer_request_type: number;
  sender_id: number;
  receiver_id: string;
  initiator_id: number;
  initiator_email: string;
  receiver_email: string;
  sender_bank_account_id: number;
  receiver_bank_account_id: number;
  from_wallet: string;
  to_wallet: string;
  amount: string;
  description: string;
  addenda_description: string;
  receiver_account_number: string;
  receiver_routing_number: string;
  receiver_account_type: string;
  sender_bank_account_number: string;
  sender_bank_routing_number: string;
  sender_bank_account_type: string;
  sender_payee_id: string;
  receiver_payee_id: string;
  priority: string;
  sender_name: string;
  receiver_name: string;
  pay_to_info: string;
  check_id: string;
  status_description: string;
  progress_status: string;
  ip_address: string;
  customer_reference_number: string;
  hold_transfer: number;
  ach_push_trace_number: string;
  ach_pull_trace_number: string;
  ach_pull_return_reason_code: string;
  ach_pull_return_reason_description: string;
  ach_push_return_reason_code: string;
  ach_push_return_reason_description: string;
  custom_meta_data: { [key: string]: string };
  created_at: string;
  updated_at: string;
}

export interface IWalletAchTransaction {
  id: number;
  pull_or_push: number;
  ach_transaction_ref_id: string;
  note: string;
  banking_ach_trace_number: string;
  uwrt_id: number;
  wallet_txn_status: number;
  return_code: string;
  return_code_description: string;
  status: string;
}

export interface IWalletAchSignalState {
  walletAchTransferRequests: IWalletTransferRequest | undefined;
  walletAchTransaction: IWalletAchTransaction[];
  walletAchloading: boolean;
}

export interface IWithdrawFundFee {
  amount: string;
  transfer_method: string;
  transfer_fee: number;
  transfer_amount: number;
}

export interface IKybRecords {
  id: string;
  name: string;
  status:
    | 'pending'
    | 'onReview'
    | 'approved'
    | 'submitted'
    | 'error'
    | 'completed'
    | 'rejected';
}

export interface IWalletOnBoard {
  wallet_id: string;
  onboard_id: string;
  business_id: string;
  status:
    | 'pending'
    | 'onReview'
    | 'approved'
    | 'submitted'
    | 'error'
    | 'completed'
    | 'rejected';
}

export interface ICardOnBoardingStatus {
  status:
    | 'No Application'
    | 'Pending'
    | 'In Review'
    | 'Approved'
    | 'Rejected'
    | 'Suspended';
  physical_card_enabled: boolean;
  virtual_card_enabled: boolean;
  gift_card_enabled: boolean;
  gift_card_count: number;
  virtual_card_count: number;
  physical_card_count: number;
  total_created_card_count: number;
  active_user_kyb_records: IKybRecords[];
  wallet_onboard: IWalletOnBoard | null;
  received_card_count: number;
}

export interface ICreateGiftCard {
  walletId: string;
  cardType: string;
  limitAmount: number;
  cardLimitType: string;
  payeeId: string;
  payeeEmail?: string;
  payeePhone?: string;
  session_key?: string;
}

export interface IAddFund {
  cardId: string;
  amount: number;
}

export interface ICreateNewCard {
  programType: number;
  walletId: string;
  businessId: string;
  cardType: string;
  label: string;
  nameOnCard: string;
  limitAmount: number;
  limitInterval: string;
  restrictionSettings: IRestrictionSettings;

  // Optional properties for physical cards
  shippingAddress?: IShippingAddress;
  billingAddress?: IShippingAddress;
}

export interface ICardList {
  id: string;
  cardType: string;
  label: string;
  last4: string;
  cardStatus: string;
  limitAmount: string;
  limitInterval: string;
  nameOnCard: string;
}

export interface IGiftCardList {
  id: string;
  masterCardId: string;
  cardProgramIssuingRecordId: string;
  cardType: string;
  label: string;
  last4: string;
  cardStatus: string;
  limitAmount: string;
  limitInterval: string;
  nameOnCard: string;
  cardIssueType: string;
}

export interface IWalletCardsDetails {
  walletCards: {
    [id: string]: ICardList[];
  };
  selectedCard: ICardList | undefined;
  cardNumber: string;
  cardExpiry: string;
  cardSecurity: string;
  cardPinURL: SafeResourceUrl;
  cardLoading: boolean;
  cardNumberLoading: boolean;
  cardExpiryLoading: boolean;
  cardSecurityLoading: boolean;
  cardPinLoading: boolean;
  cardStatusLoading: boolean;
  setCardPinLoading: boolean;
  showPinInput: boolean;
}

export interface IGiftCardsDetails {
  giftCards: {
    [id: string]: IGiftCardList[];
  };
  selectedGiftCard: IGiftCardList | undefined;
  cardNumber: string;
  cardExpiry: string;
  cardSecurity: string;
  cardBalance: string;
  cardLoading: boolean;
  cardNumberLoading: boolean;
  cardExpiryLoading: boolean;
}

export interface ICardRestrictionDetails {
  cardId: string;
  masterCardId: string;
  restrictionLoading: boolean;
  allowedMerchantName: string[];
  allowedMerchantId?: string[];
  allowedMerchantCategoryCode: string[];
  allowedMerchantCountry: string[];
  allowedMerchantCity: string[];
  allowedTime: TimeRestriction;
  validTill: string;
}

export interface IEncryptedData {
  iv: string;
  data: string;
}

export interface ITokenData {
  encryptedPan: IEncryptedData;
  encryptedCvc: IEncryptedData;
}

export interface IShowCardData {
  secretKey: string;
  token: ITokenData;
  expiryMonth: string;
  expiryYear: string;
  provider: string;
}

export interface IMCCCode {
  mcc_code: string;
  mcc_description: string;
}

export interface ITime {
  from: string;
  to: string;
}

export interface TimeRestriction {
  timezone: string;
  times: ITime[];
}

export interface CardRules {
  countries: string[];
  merchantCategories: string[];
  merchantNames: string[];
  cities: string[];
  timeRestrictions: TimeRestriction;
}

export interface IRestrictionSettings {
  allowed_merchant_country?: string[];
  allowed_merchant_category_code?: string[];
  allowed_merchant_names?: string[];
  allowed_merchant_city?: string[];
  allowed_merchant_id?: string[];
  allowed_time?: TimeRestriction;
  valid_till?: string;
}

interface IShippingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  method?: string;
}

export interface ICardRestrictionData extends IRestrictionSettings {
  card_id: string;
  master_card_id: string;
}

export interface ICardRestrictionSettings {
  settings: IRestrictionSettings;
}

export interface ICardInfoData {
  subTitle: string;
  features: {
    icon: string;
    text: string;
  }[];
  message: string;
}
export interface IGiftCardExcelResponse {
  success: boolean;
  data: IGiftCardResponseData;
}

export interface IGiftCardResponseData {
  // Define indexed access with numeric strings returning IGiftCardRows
  [key: string]: IGiftCardRows | string;
  batch_id: string;
}

export interface IGiftCardRows {
  firstname: string;
  lastname: string;
  email: string;
  phone: number | null;
  amount: number;
  type: string;
  batch_id: string;
  id: string;
  status: number;
  created_for_id: number;
  created_by_id: number;
  errors: { [key: string]: string[] } | null;
  // UI-specific properties
  isEditing?: boolean;
  editData?: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: number;
    amount?: number;
    type?: string;
  };
  // Track which fields are being edited
  editingFields?: {
    firstname?: boolean;
    lastname?: boolean;
    email?: boolean;
    phone?: boolean;
    amount?: boolean;
    type?: boolean;
  };
}

export interface IInternationalPayment {
  selectedWallet: IWalletData | null;
  selectedCurrency: IInternationalCountry | null;
  selectedAmount: {
    amount: number;
    totalAmount: number;
    exchangeRate: number;
    quoteId: string;
    isReceivingAmount: number;
  } | null;
  selectedRecipient:
    | (IPayeeDropdown & { bank: IInternationalPayeeAccount | null })
    | null;
  recipientType: string | null;
  version: string | null;
}

export interface IWalletInternationaPaymentCreate {
  quote_id: string;
  amount: string;
  sending_amount: string;
  receiving_amount: string;
  sending_fee: string;
  receiving_fee: string;
  sending_currency_code: string;
  receiving_currency_code: string;
  fx_rate: IFxRate;
  customer_exchange_rate:string;
  version:string;
  state:string;
}

export interface IFxRate {
  rate: string;
  base_currency_code: string;
  counter_currency_code: string;
  type: string;
}

export interface IWalletInternationaPaymentAcceptPayload {
  payeeId: string;
  payeeInternationalBankaccountId: string;
  walletId: string;
  quoteId: string;
  amount: number;
  sourceOfCash?: string;
  purpose: string;
  purpose_category?: string;
  memo?: string;
  payeeEmail?: string;
  payeePhone?: string;
  country?: string;
  businessId?: string;
  sourceOfCashName?: string;
  type: string;
  bills?: string[];
  version?: string;
  isProceedPayment?: '0' | '1';
}

export interface IInternationalPaymentHistory {
  status: number;
  transaction_id: string;
  created_at: string;
  from: string;
  to: string;
  sending_currency_code: string;
  receiving_currency_code: string;
  amount_sent: string;
  amount_recieved: string;
}

export interface IWalletWalletRainCardDialogPaylod {
  walletId: string;
  businessId: string;
  relatedWallets?: string[];
}

export interface IInternationalCountry {
  countryCode: string;
  currency: string;
  iban: number;
  business_banks?: { label: string; value: string }[];
  flag?: string | null;
  is_enabled:number
}

export interface ICryptoWalletFunding {
  wallet_id: string
  amount: string
  receiving_crypto_address: string
  from_address: string
  transaction_hash: string
}

export interface ICryptoChainList {
  id: number
  chain: string
  deposit_address: string
  name: string
  is_active: boolean
  qr_code: string
  created_at: string
  updated_at: string
}
export interface ICountriesCache {
  [key: string]: IInternationalCountry;
}

export interface IStatementResponse {
  url: string;
  message: string;
  emailed: boolean;
}

export interface IAttachmentFile {
  file_name: string;
  user_name: string;
  attachable_type: string;
  file_path: string;
  attachable_id: number;
  page_count: number;
  created_at: string;
  id: number;
  formated_date: string;
  encrypted_id: string;
  public_url: string;
  status: string | null;
}

export interface IComment {
  user_name: string;
  commentable_id: number;
  comments: string;
  commentable_type: string;
  created_at: string;
  id: number;
  formated_date: string;
  user: string;
  encrypted_id: string;
  status: string | null;
}

export interface IPayeeAddressDetails {
  is_existing: boolean;
  payee_details: IPayeeDetails;
  existing_beneficiary_details: IBeneficiaryDetails[];
}

export interface IPayeeDetails {
  payee_name: string;
  payee_email: string;
  payee_phone: string;
  address: IAddress;
}
export interface IBeneficiaryDetails {
  id: number;
  encrypted_id: string;
  bank_name: string;
  json_data: IJsonData;
  address: IAddress;
}

export interface IJsonData {
  business_legal_name: string;
  branch_code: string;
  organisation_id_number: string;
  relationship: string;
  country_of_incorporation: string;
  date_of_incorporation: string; // ISO date string
  beneficiary_given_name: string | null;
  beneficiary_family_name: string | null;
  routing_or_sort_code?: string | null; // optional since not always present
  id_type: string;
  po_box?: string;
  date_of_birth?: string;
}

export interface IAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
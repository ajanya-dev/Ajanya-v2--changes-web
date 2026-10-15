import { ICloudAccount } from 'src/app/data/data/internal-transfer';
import { SafeResourceUrl } from '@angular/platform-browser';
import { IAirWallexTransactionStatement } from 'src/app/data/data/cloud-bank';
import { IInternationalPayeeAccount } from '../cloud-bank-v2/model/internationalPayments';
import { IPayeeViewBank } from '../../payee/payee-v2/model/payee';

export type TWireType = 'domestic' | 'international';
export interface ICloudAccountDetails {
  id: string;
  trans_id: string;
  txnType: string;
  title: string;
  amount: string;
  transferType: string;
  transferId: string;
  subType: string;
  description: string;
  accountId: string;
  fdicbankaccount_account_id: number;
  businessId: string;
  programId: string;
  personId: string;
  balance: string;
  card?: string;
  createdAt: string;
  txnDate: string;
  status: string;
  digitalCheck: unknown;
  physicalCheck?: string;
  parentTxnId: string;
  reviewCode: string;
  reviewMessage: string;
  s_date: string;
  created_at: string;
  updated_at: string;
  account_name: string;
  account_label: string;
}

export interface ICloudAccountDetails2 {
  title?: string;
  id: string;
  businessId: string;
  label: string;
  routingNumber: string;
  accountNumber: string;
  status: string;
  type: string;
  programId: string;
  isVerified: boolean;
  verifiedAt: string;
  acceptedTerms: boolean;
  interest: string;
  fees: string;
  currency: string;
  availableBalance: string;
  sponsorBankName: string;
  createdAt: string;
  modifiedAt: string;
  pendingDebit: string;
  pendingCredit: string;
  createdPersonId: string;
  cardId?: string;
  accountInterestFrequency: string;
  metadata?: ICloudMetadataDetails;
  config: ICloudAccountConfig;
  familyId: string;
  isChecked?: boolean;
  accountName?: string;
  ocwBankAccountId: string;
}

export interface IGetAccountDetailsData {
  account: ICloudAccountDetails2;
  holderName: string;
  businessAddress: ICardBillingAddressDetails;
}

export interface IAirWallexAccDetails {
  id: string;
  accountType: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  accountStatus: string;
}

export interface ICloudAccountConfig {
  card: {
    virtual: {
      enabled: boolean;
      count: string;
    };
    physical: {
      enabled: boolean;
      count: string;
    };
  };
  send: ISend;
  receive: IReceive;
  limits: ILimits;
  fallback: {
    received: boolean;
  };
  incoming: {
    achPull: ICloudBankAchPull;
  };
}

export interface ICloudBankAchPull {
  enabled: boolean;
  allowedOriginators: boolean;
  blockedOriginators: boolean;
}

export interface ICloudPdfDetails {
  success: boolean;
  data?: string;
  url?: string;
}

export interface ICloudBankLimit {
  data: ICloudBankLimitData;
}

export interface ICloudBankLimitData {
  limits: ILimits;
  availableLimits: IAvailableLimits;
}

export interface ILimits {
  receive: IReceive;
  send: ISend;
}

export interface IReceive {
  daily: string;
  monthly: string;
  intrabank: IIntrabank;
  ach: IAch;
  check: ICheck;
  debitCard: IDebitCard;
}

export interface IIntrabank {
  daily: string;
  monthly: string;
}

export interface IAch {
  daily: string;
  monthly: string;
}

export interface ICheck {
  daily: string;
  monthly: string;
}

export interface IDebitCard {
  daily: string;
  monthly: string;
  enabled: boolean;
}

export interface ISend {
  daily: string;
  monthly: string;
  intrabank: IIntrabank2;
  ach: IAch2;
  domesticWire: IDomesticWire;
  internationalWire: IInternationalWire;
  check: ICheck2;
  card: ICard;
  debitCard: IDebitCard2;
}

export interface IIntrabank2 {
  daily: string;
  monthly: string;
}

export interface IAch2 {
  daily: string;
  monthly: string;
}

export interface IDomesticWire {
  daily: string;
  monthly: string;
}

export interface IInternationalWire {
  daily: string;
  monthly: string;
}

export interface ICheck2 {
  daily: string;
  monthly: string;
}

export interface ICard {
  daily: string;
  monthly: string;
}

export interface IDebitCard2 {
  daily: string;
  monthly: string;
  enabled: boolean;
}

export interface IAvailableLimits {
  receive: IReceive2;
  send: ISend2;
}

export interface IReceive2 {
  daily: string;
  monthly: string;
  intrabank: IIntrabank3;
  ach: IAch3;
  check: ICheck3;
  debitCard: IDebitCard3;
}

export interface IIntrabank3 {
  daily: string;
  monthly: string;
}

export interface IAch3 {
  daily: string;
  monthly: string;
}

export interface ICheck3 {
  daily: string;
  monthly: string;
}

export interface IDebitCard3 {
  daily: string;
  monthly: string;
}

export interface ISend2 {
  daily: string;
  monthly: string;
  intrabank: IIntrabank4;
  ach: IAch4;
  domesticWire: IDomesticWire2;
  internationalWire: IInternationalWire2;
  check: ICheck4;
  card: ICard2;
  debitCard: IDebitCard4;
}

export interface IIntrabank4 {
  daily: string;
  monthly: string;
}

export interface IAch4 {
  daily: string;
  monthly: string;
}

export interface IDomesticWire2 {
  daily: string;
  monthly: string;
}

export interface IInternationalWire2 {
  daily: string;
  monthly: string;
}

export interface ICheck4 {
  daily: string;
  monthly: string;
}

export interface ICard2 {
  daily: string;
  monthly: string;
}

export interface IDebitCard4 {
  daily: string;
  monthly: string;
}

export interface ICardDetailsCloudBank {
  id: string;
  cardStatus: string;
  cardType: string;
  currency: string;
  expiryMonth: string;
  expiryYear: string;
  label: string;
  last4: string;
  limitAmount: string;
  limitInterval: string;
  shipping: ICardShippingDetails;
  cardholder: ICardholderDetails;
  activatedAt: string;
  createdAt: string;
  modifiedAt: string;
  createdPersonId: string;
  metadata: ICloudMetadataDetails;
  bin: string;
  allowedCategories: string;
  availableLimit: string;
  blockedCategories: string;
  embossingPerson: string;
  embossingBusiness: string;
  theme: string;
  atmAccess: boolean;
  allowedMerchants: string;
  blockedMerchants: string;
  walletId: string;
  familyId: string;
}

export interface ICardShippingDetails {
  id: string;
  shippingAddress: ICardShippingAddressDetails;
  eta: string;
  deliveryStatus: string;
  createdAt: string;
  modifiedAt: string;
  deliveryPartner: string;
  trackingNumber: string;
  trackingUrl: string;
}

export interface ICardShippingAddressDetails {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ICardholderDetails {
  id: string;
  personId: string;
  billingAddress: ICardBillingAddressDetails;
  createdAt: string;
  modifiedAt: string;
  name: string;
}

export interface ICardBillingAddressDetails {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ICloudMetadataDetails {
  createdForId: number;
  partnerId: string;
}
export interface IWireBankSelected {
  wireType: TWireType;
  selectedBankAc?: IPayeeViewBank;
  selectedInternationalBankAc?: IInternationalPayeeAccount;
}

export interface IpaymentSettings {
  allowedPullLimit?: number;
  allowedPushLimit?: number;
  checkDepositEnabled?: number;
  checkDepositLimit?: string;
  cryptoEnabled?: number;
  debitPullEnabled?: number;
  debitPushEnabled?: number;
  internationalWireEnabled?: number;
  internationalWireLimit?: number;
  numberOfEmployees?: number;
  payrollEnabled?: number;
}

export interface ICloudBankPhoneNumberLookup {
  callerName: string;
  countryCode: string;
  phoneNumber: string;
  nationalFormat: string;
  carrier: string;
  addOns: string;
  url: string;
}

export interface IPhoneDetailsUpdater {
  phone: string;
  countryCode: string;
}

export interface ICreateCard {
  cardType: string;
  label: string;
  accountId: string;
  limitAmount: number;
  limitInterval: string;
  nameOnCard: string;
  embossingBusinessName?: string;
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  shippingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  blockedCategories?: string[];
  allowedCategories?: string[];
}

export interface IAccountDetail {
  selectedAccountType: string;
  selectAccountName: string;
}

export interface IMccCode {
  mcc: string;
  description: string;
  combined_description: string;
  irs_description: string;
  irs_reportable: string;
}

export interface ICardUpdate {
  cardLabel: string;
  limitAmount: string;
  limitInterval: string;
  blockedCategories?: string[];
  allowedCategories?: string[];
}

export interface ICradDetailsDropDown {
  cardStatus: string;
  cardType: string;
  expiryMonth: string;
  expiryYear: string;
  id: string;
  label: string;
  last4: string;
}
export interface IFundData {
  total_fund_in: string;
  total_fund_out: number;
  total_card_spend: number;
  total_cash_back: number;
}

export interface ICloudCardCount {
  physicalCard: number;
  virtualCard: number;
  totalCard: number;
  accounts: number;
  cardSpend: number;
  lastUsed: ILastUsedDetails;
  notification: ICloudNotification[];
}

export interface ILastUsedDetails {
  date: string;
  difference: number;
}

export interface ICloudNotification {
  notification_type: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface ISelectedAccountDetails {
  accountId?: string;
  businessId?: string;
  accountItem?: string;
  acountName?: string;
  type?: number;
  balance?: number;
  accountStatus?: string;
  transferToId?: string;
  cloud?:
    | ICloudAccount
    | ICloudAccountDetails2
    | ICloudBankAccountDetailsAirwallex
    | string;
}

export interface ICloudCardData {
  cards: ICardList[];
}

export interface ICardList {
  id: string;
  cardType: string;
  label: string;
  expiryMonth: string;
  expiryYear: string;
  last4: string;
  cardStatus: 'inactive' | 'active' | 'pendingActivation';
  active: boolean;
  isChecked: boolean;
}

export interface ICardList2 {
  id: string;
  cardType: string;
  label: string;
  last4: string;
  cardStatus: string;
  limitAmount: string;
  limitInterval: string;
  nameOnCard: string;
}

export interface ICardInsideData {
  id: string;
  cardStatus: string;
  cardType: string;
  currency: string;
  expiryMonth: string;
  expiryYear: string;
  label: string;
  last4: string;
  limitAmount: string;
  limitInterval: string;
  shipping: unknown;
  cardholder: ICardholderData;
  activatedAt: string;
  createdAt: string;
  modifiedAt: string;
  createdPersonId: string;
  metadata: IMetadata;
  bin: string;
  allowedCategories: string[];
  availableLimit: string;
  blockedCategories: string[];
  embossingPerson: string;
  embossingBusiness: string;
  theme: string;
  atmAccess: boolean;
  allowedMerchants: unknown;
  blockedMerchants: unknown;
  walletId: string;
  familyId: string;
}

export interface ICardholderData {
  id: string;
  personId: string;
  billingAddress: IBillingAddress;
  createdAt: string;
  modifiedAt: string;
  name: string;
}

export interface IBillingAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IMetadata {
  createdForId: number;
  partnerId: string;
}

export interface IOtpRes {
  success: boolean;
  code?: string;
  errorCode?: string;
  errorMsg?: string;
  session_key?: string;
  expiredIn?: number;
  createdAt?: number;
  message?: string;
}

export interface IRevealSuccessData {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface IShowCardData {
  card_info: string;
  pin: string;
}

export interface IVgsShowCardToken {
  id: string;
  showToken: string;
}

export interface IOtpGetData {
  success: boolean;
  code: string;
  errorCode: string;
  errorMsg: string;
  session_key: string;
  expiredIn: number;
  createdAt: number;
}

export interface IBusiness {
  id: string;
  business_name: string;
}

export interface IAllCardData {
  id: string;
  cardType: string;
  label: string;
  limitAmount?: string;
  limitInterval?: string;
  expiryMonth: number;
  expiryYear: number;
  last4: number;
  cardStatus: string;
  businessId?: string;
  accountId?: string;
}

export interface IPaymentRequests {
  id: number;
  created_for_id: number;
  created_by_id: number;
  amount: string;
  account_id: string;
  description: string;
  payment_type: string;
  payee_id: string;
  payee_bank_account_id?: string;
  status: number;
  transfer_id?: number;
  payload_data: string;
  error_message: string;
  created_at: string;
  updated_at: string;
  name: string;
  payee_name?: string;
  action: string;
}

export interface ICloudAccountData {
  accounts: ICloudAccountList[];
  totalBalance: number;
}

export interface ICloudAccountList {
  id: string;
  name: string;
  accountNumber: string;
  accNumber: string;
  balance: string;
}

export interface ICloudAccountStatementList {
  month: number;
  year: number;
  createdAt: string;
}

export interface ICloudContactSettings {
  internationalWireEnabled: number;
  internationalWireLimit: number;
  debitPullEnabled: number;
  debitPushEnabled: number;
  payrollEnabled: number;
  numberOfEmployees: number;
  allowedPushLimit: number;
  allowedPullLimit: number;
  cryptoEnabled: number;
  checkDepositEnabled: number;
  checkDepositLimit: string;
  config: {
    enable_bulk_import_ach: string;
    enable_bulk_import_domestic_wire: string;
    enable_bulk_import_check: string;
    enable_bulk_import_gif_card: string;
    enable_pay_with_phone: string;
    enable_pay_with_qr_code: string;
    enable_pay_with_sms: string;
    enable_notification_settings: string;
    maximum_allowed_personal_checking: string;
  };
  site_settings: {
    bulk_payment_enabled: {
      ach: string;
      domesticWire: string;
      check: string;
      giftCard: string;
    };
    pay_with_phone: string;
    pay_with_qr_code: string;
  };
  defaultReceivingAccount: string;
}

export interface ICloudBankAccountDetails {
  canCreateBusiness: boolean;
  totalBalance: number;
  holderName: string;
  accounts: Record<
    string,
    {
      business_info: {
        business_name: string;
      };
      account: ICloudAccountDetails2[];
    }
  >;
  closedAccounts: [];
}

export interface ICloudBankAccountDetailsAirwallex {
  id: string;
  accountType: string;
  accountName: string;
  accountNickName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  accountStatus: string;
  localBankAccountId?: string;
  availableBalance?: string;
}

export interface IGroupedCloudAccount {
  businessName: string;
  accounts: ICloudBankAccountDetailsAirwallex[];
}

export interface ICardTokenData {
  id: string;
  debitCardToken: string;
  isDebitCardAvailable: number;
  contact: IContactDetails;
}

export interface ICreateNewCard {
  accountId: string;
  cardType: string;
  label: string;
  limitAmount: number;
  limitInterval: string;
}

export interface ICloudTransactionDetails {
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
  intrabank: boolean;
  ach: {
    transferId: string;
    contactId: string;
    name: string;
    routingNumber: string;
    type: string;
    bankName: string;
    traceNumber: string;
    authId: string;
  };
  card: string;
  domesticWire: DomesticWireDetails;
  internationalWire: string;
  digitalCheck: string;
  physicalCheck: string;
  debitCard: string;
  solidCard: string;
  crossBorder: string;
  buy: string;
  sell: string;
  enrichedData: {
    merchant: {
      name: string;
      email: string;
      phone: string;
      website: string;
      logo: string;
      address: string;
      location: string;
    };
    chartOfAccounts: string[];
    labels: string[];
  };
  createdAt: string;
  modifiedAt: string;
  txnDate: string;
  metadata: unknown;
  fallbackTransferId: string;
  fallbackTxnId: string;
  formatted_date: string;
}

export interface ICloudAccountTableRow extends ICloudAccountDetails {
  action: string;
  merchant: unknown;
}

export interface ICloudAccountTableRowData {
  id: number;
  trans_id: string;
  txnType: string;
  title: string;
  amount: string;
  transferType: string;
  transferId: string;
  subType: string;
  description: string;
  accountId: string;
  fdicbankaccount_account_id: number;
  businessId: string;
  programId: string;
  personId: string;
  balance: string;
  card: unknown;
  createdAt: string;
  txnDate: string;
  status: string;
  digitalCheck: unknown;
  physicalCheck: string;
  parentTxnId: string;
  reviewCode: string;
  reviewMessage: string;
  s_date: string;
  created_at: string;
  updated_at: string;
  account_name: string;
  account_label: string;
  action: string;
  merchant: unknown;
}

export interface ICloudSendPaymentPayload {
  type: string;
  accountId?: string;
  contact?: string;
  amount: string | number;
  memo: string;
  ach?: {
    account: {
      accountNumber: string;
      routingNumber: string;
      accountType: string;
      bankName: string;
    };
  };
}

export interface ICloudSendPaymentPayloadAirwallex {
  accountId: string;
  amount: number;
  description: string;
  payeeId: string;
  payeeBankAccount: string;
  transferType: string;
  payeeEmail: string;
  isSameDay?:number;
}

export interface ICloudInternationalPayloadAirwallex {
  accountId: string;
  amount: number;
  description: string;
  payeeId: string;
  payeeInternationalBankAccount: string;
  payeeEmail: string;
}

export interface ICloudReceivePaymentPayload {
  type: 'debit_pull' | 'check' | 'ach';
  accountId: string;
  contactId?: string;
  amount?: string;
  memo?: string;
}

export interface ICloudGetTypes {
  industries: {
    key: string;
    value: string;
  }[];
  entityType: {
    key: string;
    value: string;
  }[];
  occupation: {
    key: string;
    value: string;
  }[];
}

export interface ICloudGetContactDetails {
  id: string;
  accountId: string;
  name: string;
  label: string;
  email: string;
  phone: string;
  status: string;
  type: string;
  programId: string;
  createdAt: string;
  modifiedAt: string;
  intrabank?: Record<string, unknown>;
  ach?: Record<string, unknown>;
  wire?: Record<string, unknown>;
  check?: Record<string, unknown>;
  card?: Record<string, unknown>;
  debitCard?: Record<string, Record<string, unknown>>;
  crossBorder?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ICloudUpdateContact {
  contact_id: string;
  contact_name: string;
  contact_email: string;
}

/** Interface of contact details  */
export interface IContactDetails {
  id: string;
  accountId: string;
  name: string;
  label: string;
  email: string;
  phone: string;
  status: string;
  type: string;
  programId: string;
  createdAt: string;
  modifiedAt: string;
  intrabank: unknown;
  ach: unknown;
  wire: IContactDetailsWire;
  check: IContactDetailsCheck;
  card: IContactDetailsCard;
  debitCard: IContactDetailsDebitCard;
  crossBorder: unknown;
  metadata: unknown;
}

export interface IContactDetailsWire {
  domestic: unknown;
  international: IContactWireInternational;
}

export interface IContactWireInternational {
  accountNumber: string;
  bankIdentifierType: string;
  bankIdentifierCode: string;
  accountType: string;
  beneficiaryBank: string;
  beneficiaryAddress: IContactWireBeneficiaryAddress;
  beneficiaryBankAddress: IContactWireInternationalBeneficiaryBankAddress;
  correspondentBank: string;
  correspondentBankIdentifierCode: string;
  correspondentBankAddress: IContactWireInternationalCorrespondentBankAddress;
}

export interface IContactWireBeneficiaryAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IContactWireInternationalBeneficiaryBankAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IContactWireInternationalCorrespondentBankAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IContactDetailsCheck {
  address: IContactDetailsCheckAddress;
}

export interface IContactDetailsCheckAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IContactDetailsCard {
  address: IContactDetailsCardAddress;
}

export interface IContactDetailsCardAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IContactDetailsDebitCard {
  cardNumber: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  address: IContactDebitCardAddress;
  pull: IContactDebitCardPull;
  push: IContactDebitCardPush;
  usageType: string;
}

export interface IContactDebitCardAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface DomesticWireDetails {
  transferId: string;
  contactId: string;
  name: string;
  routingNumber: string;
  address: DomesticWireAddress;
  imad: string;
  omad: string;
  bankName: string;
}

export interface DomesticWireAddress {
  addressType: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface IContactDebitCardPull {
  enabled: boolean;
}

export interface IContactDebitCardPush {
  enabled: boolean;
}

export interface IClouListTableRow {
  id: number;
  account_id: string;
  person_id: string;
  business_id: string;
  is_it_first_personal_account: number;
  is_it_first_business_account: number;
  account_name: string;
  account_number: string;
  routing_number: string;
  account_label: string;
  account_type: string;
  business_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ICloudAccountStatus {
  success: boolean;
  status:
    | 'No Application'
    | 'Pending'
    | 'In Review'
    | 'Approved'
    | 'Rejected'
    | 'Suspended';
}

export interface ICloudCardsDetails {
  accountCards: {
    [id: string]: ICardList2[];
  };
  selectedCard: ICardList2 | undefined;
  cardNumberURL: SafeResourceUrl;
  cardExpiryURL: SafeResourceUrl;
  cardSecurityURL: SafeResourceUrl;
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

export interface IAirwallexTransactionDetails {
  accountTransactions: {
    [id: string]: IAirWallexTransactionStatement[];
  };
  transactionLoading: boolean;
}

export interface IAirwallexAccountsDetails {
  accounts: IGroupedCloudAccount[];
  selectedAccount: ICloudBankAccountDetailsAirwallex | undefined;
  accountLoading: boolean;
}

export interface IAirwallexAccountsBalanceSignal {
  accountBalance: {
    [id: string]: number;
  };
  balanceLoading: boolean;
}

export interface ICloudAirwallexAccountInfo {
  account_name?: string;
  account_number?: string;
  routing_number?: string;
  ach_routing_number?: string;
  wire_routing_number?: string;
  swift_code?: string;
  account_type?: string;
  bank_details?: ICloudAirwallexAccountInfoBankDetails;
  account_holder?: ICloudAirwallexAccountInfoAccountHolder;
  url?: string;
}

export interface ICloudAirwallexAccountInfoBankDetails {
  zip: string;
  city: string;
  name: string;
  state: string;
  address: string;
  country: string;
}

export interface ICloudAirwallexAccountInfoAccountHolder {
  holder_name: string;
  business_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IBusinessList {
  id: string;
  name: string;
}

export interface IShippingTypes {
  carrier: string;
  carrier_code: string;
  cost: string;
  name: string;
}

export interface IVerifiedBankList {
  id: string;
  accountName: string;
  fullAccountNumber: string;
  routingNumber: string;
  name?: string;
  vb?: number;
  mav: number;
  eligibility: number;
  provider_id: string;
}

export interface IApplicationStatus {
  id: string;
  plexe_onboarding_id: string;
  created_for_id: string;
  plexe_customer_id: string;
  plexe_application_id: string;
  application_status: number;
  loan_enabled: number;
  document_requested: number;
}

export interface IApplicationDetails {
  offerId: string;
  facilityLimit: number;
  creditLimit: number;
  cashFlowLimit: number;
  receivableLimit: number;
  balance: number;
  availableBalance: number;
  weeklyRepayment: number;
}

export interface IApplicationData {
  name: string;
  address: string;
  city: string;
  dateOfBirth: string;
  cardNumber: string;
  issuingState: string;
  expiryDate: string;
}

export interface IPrimaryBankData {
  isConnected: boolean;
  archived: boolean;
  enabled: unknown;
  slug: string;
  accountType: string;
  accountHolder: string;
  available: string;
  balance: string;
  bsb: string;
  id: string;
  accountNumber: string;
  name: string;
  institutionName: string;
  institutionId: string;
  selected: boolean;
  requestId: string;
  accountId: string;
  routingNumber: string;
  isPrimary: boolean;
}

export interface IAgreementData {
  companyName: string;
  guarantors: string;
  facilityLimit: number;
  establishmentFee: string;
  drawFee: string;
  bankAccounts: IBankAccount[];
  platformAgreementHTML: string;
  platformAgreementSignCondition1: string;
  platformAgreementSignCondition2: string;
}

export interface IBankAccount {
  name: string;
  accountNumber: string;
  routingNumber: string;
}

export interface IRequiredDocument {
  label: string;
  details: string;
  submittedDate: string;
  submitted: boolean;
  locations: ILocation[];
  id: string;
}

export interface ILocation {
  location: string;
  fileType: string;
  fileName: string;
  internalLocation: string;
  missingTransaction: boolean;
  date: string;
}

export interface ICalculationData {
  advanceRate: number;
  totalRepayment: number;
  repayment: number;
  advanceFee: number;
  weeks: number;
  amount: number;
  percentOfIncome: number;
  terms: number;
  fixedRepaymentCalculation: boolean;
}

export interface ICalcSendData {
  amount: number;
  percentOfIncome: number;
  terms: number;
  fixedRepaymentCalculation: boolean;
}

export interface IRequiredDocumentFile {
  docId: string;
  file?: File;
  label: string;
  locations?: ILocation[];
}
export interface ILoanData {
  advanceRate: number;
  amount: number;
  percentOfIncome: number;
  otp: string;
  terms: number;
  fixedRepaymentCalculation: boolean;
}

export interface IInitialWithdrawelData {
  primaryBank: IPrimaryBank;
  contactNumber: string;
  advanceRate: number;
  applicationId: string;
  firstRepayment: string;
  isfixed: boolean;
  id: string;
  isFirstAdavnce: unknown;
  loanId: string;
  percentageOfIncome: number;
  totalRepayment: number;
  weeklyForecastIncome: number;
  weeklyRepayment: number;
  weeks: number;
  withdrawAmount: number;
  otp: unknown;
  calculation: unknown;
}

export interface IPrimaryBank {
  name: string;
  accountNumber: string;
  routingNumber: string;
}

export interface IOtpResponse {
  success: boolean;
  data: IData;
  errorMsg?: string;
}

export interface IData {
  errors: unknown;
  data: string;
  success: boolean;
  message: string;
}

export interface ITransactionData {
  rows: ITransactionList[];
  count: number;
}

export interface ITransactionList {
  date: string;
  description: string;
  type: string;
  amount: string;
  isCredit: boolean;
  balance: string;
}

export interface IWithdrawData {
  rows: IWithdrawList[];
  count: number;
}

export interface IWithdrawList {
  terms: number;
  name: string;
  advanceRate: number;
  lastRepaymentDate: string;
  lastRepaymentDay: string;
  nextRepaymentDay: string;
  nextRepaymentValue: number;
  remaining: number;
  amount: string;
  type: string;
}

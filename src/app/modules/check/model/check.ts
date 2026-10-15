import { FormControl } from '@angular/forms';
import { IBank } from '../../../models/bank';
import { INetSuiteExportsFormBody } from '../../integration/netsuite/model/netsuite';
import { IPayee } from '../../outside/model/outside';
import { IFreshBookExpenseDetails } from '../../integration/model/integration';

export type TCheckSendingMethod =
  | 'printCheck'
  | 'printWhiteCheck'
  | 'mail'
  | 'email'
  | 'save'
  | 'update'
  | 'ach';

export interface ICreateCheck {
  serialNo: number;
  id: string;
}

export interface ICreateNewCheck {
  success: boolean;
  data: {
    id: string;
    serialNo: number;
  };
}

export interface IUpdateCheck {
  success: boolean;
  data: {
    id: string;
  };
}

export interface INewCheck {
  checkSerialNo: number;
  amount: string;
  checkIssueDate: any;
  scheduleDate?: string | null;
  bankAccount: string;
  payee: string;
  accountNo: string;
  note: string;
  memo: string;
  category: string;
  invoiceNo: number | string;
  no_amount: number;
  no_sign: number;
  no_payee: number;
  no_date: number;
  isVendorCreditApplied: number;
  vendorCredit: number;
  commentIds: string[];
  attachmentIds: string[];
  attachRemittanceToCheck: string;
  remittance_type?: number;
  remittance: any;
  categoryDetails: any;
  expenseDetails: IExpenseDetails1[] | string;
  realmId: string | undefined;
  locationId: string | undefined;
  mappingId: string;
  attachCategoryToCheck: string;
  attachExpenseToCheck: string;
  companyId: string;
  qbBankId: string;
  warning: number;
  checkNumberWarning: number;
  bills: string[];
  quickbook: number | null;
  isMapping: number | null;
  permission_action?: number;
  isCloned: number;
  customElements: { [key: string]: string | number }[];
  attachNetsuiteExpenseToCheck: string;
  netsuiteExpenseDetails:  INetSuiteExportsFormBody[] | string;
  netsuiteBankId: string;
  freshbookCompanyId: string;
  attachFreshbooksExpenseToCheck: string;
  freshbookExpenseDetails:IFreshBookExpenseDetails[];
  /**
   * Delivery options saved against the check as it is written. Each is stored
   * as its own `cheque_meta_datas` row, keyed by transfer type — 1 mail,
   * 2 email, 3 direct deposit. Omitting one leaves whatever is already stored
   * for it alone, on create and on update alike.
   *
   * `GET /zil-payments/{uuid}` hands each back under `transfer` in snake case
   * (`mailing_details`, `echeck_details`, `direct_deposit_details`,
   * `print_details`), which is what reopens the payment on its delivery tile.
   */
  mailingDetails?: IMailingDetails;
  echeckDetails?: IEcheckDetails;
  directDepositDetails?: IDirectDepositDetails;
  printDetails?: IPrintDetails;
}

/**
 * The paper a printed check was saved for — `printMultiCheck.paperType`. A
 * saved print check has nothing else to say which tile it was on, so without
 * this it reopens as a bare check with no delivery.
 */
export interface IPrintDetails {
  paper_type: number | string;
}

/**
 * What an emailed check is sent with, saved on the check so the send form and a
 * reopened payment both start from what the user actually chose.
 */
export interface IEcheckDetails {
  /** Where the check is emailed, and the address the notice goes to. */
  payee_email?: string;
  sms_checkbox?: boolean;
  /** Only read when `sms_checkbox` is on. */
  phone?: string;
  /** Write the emailed address / notified phone back onto the payee record. */
  save_payee_email?: 0 | 1;
  save_payee_phone?: 0 | 1;
  /** Encrypted attachment ids sent with the e-check. */
  file_hidden?: string[];
  /** Display name for those attachments. */
  fileName?: string;
  is_group_echeck?: boolean;
  /** The send API requires this when `is_group_echeck` is on. */
  group_echeck_email?: string;
  /** `YYYY-MM-DD` or `''`; empty is stored as null. */
  schedule_date?: string;
  recurring_include_check?: boolean;
  emailCheckRecurring?: 0 | 1;
  /** `0` send now, `1` recurring, `2` scheduled — the send API's own scale. */
  is_recurring_value?: 0 | 1 | 2;
  /**
   * The schedule itself. Absent from the contract's field list and from its send
   * example, but `email-checks/` refuses `is_recurring_value: 1` without
   * `recurring.frequency` — so a recurring e-check carries it.
   */
  recurring?: Record<string, unknown>;
}

/** What a direct deposit is submitted with, saved the same way. */
export interface IDirectDepositDetails {
  payee_email?: string;
  /** `'1'` deposits to the payee's bank, `'0'` keeps it in their wallet. */
  wallet_bypassing?: string;
  /** The payee's bank account id, or `'0'` for the Master Wallet. */
  payee_account?: string;
  payee_phone?: string;
  send_sms?: 0 | 1;
  /** Write the notified email/phone back onto the payee record. */
  save_payee_email?: 0 | 1;
  save_payee_phone?: 0 | 1;
  file_hidden?: string[];
  /** Same shape the send API takes: `frequency`, `start_date`, `end_select`… */
  recurring?: Record<string, unknown>;
  /** `0` send now, `1` recurring, `2` scheduled. */
  is_recurring_value?: 0 | 1 | 2;
  is_same_day?: 0 | 1;
}

/**
 * The mailing options a check carries, shared by create, update, validate and
 * the pre-create cost preview. `sent_to_customer_address` picks the
 * destination: `0` mails to the payee and reads `mail_type`; `1` mails to a
 * typed address and reads `custom_address_shipping_type` plus both address ids.
 */
export interface IMailingDetails {
  sent_to_customer_address: 0 | 1;
  /** Shipping type when mailing to the payee — `GET /cheques/get-shipping-type`. */
  mail_type?: number;
  /** Required when `sent_to_customer_address` is 1. */
  custom_address_shipping_type?: number | string;
  /** The book rows' plain `dec_id`; `''` reads as not selected. */
  shipping_from?: string | number;
  shipping_to?: string | number;
  /** Stored as-is, capital `S` included — the API's own key. */
  Single_mail_options?: number;
  individual_envelope?: 0 | 1;
  /** Paper type; the API defaults to 7 when missing or 0. */
  check_paper?: number;
  /** Encrypted attachment ids, for the mailing fee and for storage. */
  file_hidden?: string[];
  informed_payee_email?: 0 | 1;
  informed_payee_sms?: 0 | 1;
  payee_email?: string;
  payee_phone?: string;
  /** Write the notified email/phone back onto the payee record. */
  save_payee_email?: 0 | 1;
  save_payee_phone?: 0 | 1;
  bank_account_id?: string;
  /** The two "proceed anyway" acknowledgements, in this API's own names. */
  shipping_rate_warning?: 0 | 1;
  fedex_cutoff_time_warning?: 0 | 1 | 2;
  /** Schedule and recurring. Dates are `YYYY-MM-DD`; `''` is stored as null. */
  schedule_date?: string;
  recurring_include_check?: boolean;
  frequency?: number;
  start_date?: string;
  end_select?: number;
  count?: number | string;
  until?: string;
  all_check_ids?: string[];
}

export interface ICheckDetailsData {
  id: string;
  bankAccount: ICheckDetailsBankAccount;
  payee: ICheckDetailsPayee;
  category: ICheckDetailsCategory;
  thirdParty: any[];
  isVendorCreditApplied: number;
  bankName: string;
  isNoPayee: number;
  isNoDate: number;
  isNoSign: number;
  isNoAmount: number;
  amount: string;
  date: string;
  scheduleDate: string;
  memo: any;
  serialNumber: string;
  accountNumber: string;
  invoiceNumber: string;
  createCheckFrom: number;
  amountInWord: string;
  payeeCompanyName: string;
  payeeAddress1: string;
  payeeAddress2: string;
  payeeCity: string;
  payeeState: string;
  payeeZip: string;
  payeeCountry: string;
  payeeEmail: string;
  payeePhone: string;
  status: number;
  template: string;
  voucherId: number;
  remittanceTotalAmount: number;
  remittance: any[];
  remittance_type: number;
  isImportedCheck: number;
  isImportedFromQb: number;
  loadSerialNumber: number;
  providerType: number;
  categoryDetails: any[];
  qboCompany: IQboCompany;
  qboBankAccount: IQboBankAccount;
  expenseDetails: IExpenseDetails2[];
  netsuiteDetails: IExpenseDetails2[];
  qbdCompany: IQbdCompany;
  qbdBankAccount: IQbdBankAccount;
  customElements: { [key: string]: string | number }[];
  locationId: string | undefined;
  customFromAddress: ICheckCustomAddress;
  customToAddress: ICheckCustomAddress;
  uuid: string;
  netsuiteBankAccount:{id:string,name:string}
  payment_receipts_id: string;
  signatureUrl: string;
  zilPaymentStatus: string;
  podStatus: number;
  check_mailing_group ?: {check_mailing_group_check_ids:string[],check_mailing_group_name:string,check_mailing_group_id:string};
  freshbookCompany: {companyId: string, companyName: string};
  attachFreshbooksExpenseToCheck: string;
  freshbookExpenseDetails: IFreshBookExpenseDetails[];
  preview_file:string;
}

export interface IQboCompany {
  realmId: string;
}

export interface IQboBankAccount {
  id: string;
}

export interface IQbdCompany {
  companyId: string;
  companyName: string;
}

export interface IQbdBankAccount {
  id: string;
  name: string;
}

export interface ICheckDetailsBankAccount {
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
}

export interface ICheckCustomAddress {
  name:string;
  company_name:string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ICheckDetailsPayee {
  payeeId: string;
  payeeName: string;
  payeeNickName: string;
}

export interface ICheckDetailsCategory {
  categoryId: string;
  categoryName: string;
}

export interface IExpenseDetails1 {
  expenseId?: string;
  description?: any;
  customerId?: string;
  classId?: string;
  amount?: string;
}

export interface IExpenseDetails {
  expenseId: number;
  description: string;
  customerId: number;
  classId: number;
  amount: string;
  className: string;
  customerName: string;
  expenseName: string;
}

export interface IExpenseDetails2 {
  expenseId: string;
  description: string;
  customerId: string;
  classId: string;
  amount: string;
  className: string;
  customerName: string;
  expenseName: string;
  locationId: string;
  locationName: string;
}

export interface IFreshBookDetails {
  categoryId: string;
  categoryName: string;
  companyId: string;
  companyName: string;
  description: string;
  amount: string;
}

export interface IQuickBookBody {
  realmIds: string[];
  importTime: string;
  importBill: number;
  importCheck?: number;
  importRefundReceipt?: number;
  importExpense?: number;
  markAsPrintLater?: number;
  checkIds?: { [realmId: string]: string[] };
  billPaymentIds?: { [realmId: string]: string[] };
  refundReceiptIds?: { [realmId: string]: string[] };
  expenseIds?: { [realmId: string]: string[] };
  bankAccountIds?: { [realmId: string]: string[] };
}

export interface IAchRow {
  payeeNickName: string;
  bankNickName: string;
  bankAccountId: string;
  bankAccountList: any;
  check: string;
  checkAmount: string;
  importCheck: number;
  checkedText: boolean;
  chequeId: string;
  cost: number;
  disabledText: string;
  email: string;
  phone: string;
  existingAttach: number;
  payFrom: string;
  payTo: string;
  addedAttachments: number;
  attachments: string[];
}

export interface ISvbACHCompleteTransaction {
  type: 'wallet';
  mode: '1';
  walletId: string;
  amount: number;
  payees: [
    {
      id: string;
      amount: string;
      email: string;
      bankAccount: string | null;
      name?: string;
      bills: string[];
    }
  ];
}

export interface ISvbCardCompleteTransaction {
  mode: '1';
  cardId: string;
  amount: string;
  payees: [
    {
      id: string;
      amount: string;
      email: string;
      invoiceNumber: string;
      category: string;
      memo: string;
      bills: string[];
    }
  ];
}

export interface ICheckMailAttachment {
  check_id: string;
  checked: boolean;
  created_at: string;
  fileName: string;
  formated_date: string;
  id: string;
  pageCount: number;
  user_name: string;
}

export interface IImportCheckData {
  bankAccountId: string;
  bankAccountName: string;
  catagoryName: string;
  chequeAccountNumber: string;
  chequeAmount: string;
  chequeInvoiceNumber: string;
  chequeMemo: string;
  chequeNotes: string;
  chequeSerialNumber: string;
  date: string;
  id: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCity: string;
  payeeCompanyName: string;
  payeeCountry: string;
  payeeEmail: string;
  payeeId: string;
  payeeName: string;
  payeeNickName: string;
  payeePhone: string;
  payeeState: string;
  payeeZip: string;
  selected?: boolean;
  paymentMethod: string;
}

export interface IImportEqChecksData {
  id: string;
  payeeId: string;
  bankAccountId: string;
  date: string;
  mailType: string;
  settlementAgent: string;
  bankAccountNumber: number;
  checkSerialNumber: number;
  amount: string;
  memo: string;
  spFileNumber: string;
  payeeName: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCity: string;
  payeeState: string;
  payeeCountry: string;
  payeeZip: string;
  createdForId: number;
  createdById: number;
}

export interface IAttachmentFromPhoneCheckDetails {
  checkId: string;
  chequeAmount: string;
  chequeSerialNumber: string;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
  bankAccountBankId: string;
  chequeMemo: string;
  chequeStatus: number;
  payeeId: string;
}

export interface IQBExpenseListItem {
  expenseId: string;
  description: string;
  customerId: string;
  classId: string;
  amount: number;
}

export interface IQBExpenseListItem2 {
  expenseObj: { id: string; name: string };
  description: string;
  customerObj: { id: string; name: string };
  classObj: { id: string; name: string };
  amount: string;
}

export interface ICustomRestrictions {
  enable_custom_elements: string;
  custom_elements_limit: string;
}
export interface ICustomData {
  bank_account_id: number;
  custom_elements: ICustomElement[];
}

export interface ICustomElement {
  id: number;
  custom_element: string;
}

export interface IDesignData {
  bankAccountId: string;
  templateLogo: string;
  templateSignature: string;
  qrCodeToken: string;
  bankAccountAddress: string;
  bankAccountNumber: string;
  bankAccountPhone: string;
  bankAccountRouting: string;
  bankAccountIsVerified: number;
  bankName: string;
  bankAccountName: string;
  checkSerialNumber: number;
  fractionalNo: string;
  template: number;
  templateOptions: ITemplateOption[];
  checkDesign: string;
}

export interface ITemplateOption {
  name: string;
  id: number;
}

export interface ICanvasStaticElement {
  id: string;
  name: string;
  type: string;
  sub_items?: ICanvasSubItem[];
  checked?: boolean;
  showSubItem?: boolean;
}

export interface ICanvasSubItem {
  name: string;
  type: string;
  wLine?: string;
  woLine?: string;
  checked?: boolean;
  days?: number | string;
  id?: string;
}

export interface ICanvasDynamicElement {
  id?: string;
  name: string;
  type: string;
  checked?: boolean;
  txt?: number | number;
}

export interface ICanvasDynamicRemittance {
  name: string;
  type: string;
  txt: string;
  pos: ICanvasPos;
}

export interface ICanvasPos {
  top: number;
  left: number;
}

export interface ICheckStatus {
  id: number;
  statusValue: number;
  statusShortDescription: string;
  statusFullDescription: string;
  isItPrintAble: number;
  isItEditAble: number;
  isItDeleteAble: number;
  isItVoidAble: number;
  color: string;
}

export interface ICheckAttachmentData {
  id: string;
  fileName: string;
  user_name: string;
  check_id: number;
  pageCount: number;
  created_at: string;
  file_name: string;
  encrypted_id: string;
  formated_date: string;
  billAttach: string;
  status?: string;
  all_attachment_status?: {
    status_text: string;
  };
  checked?: boolean;
}

export interface IDirectDepositData {
  bankAccountId: string;
  chequeId: string;
  payTo: string;
  payFrom: string;
  bankNickName: string;
  email: string;
  phone: string;
  check: string;
  checkAmount: string;
  cost: number;
  checkedText: boolean;
  disabledText: string;
  bankAccountList: IDirectDepositBankAccountList[];
  payeeNickName: string;
  addedAttachments: number;
  attachments: string[];
  isAutoAttachmentEnabled: number;
  existingAttach: number;
}

export interface IDirectDepositBankAccountList {
  value: number;
  displayName: string;
  selected: boolean;
}

export interface IMailCheck {
  cheque_amount?: string;
  cheque_serial_number: string;
  country?: string;
  enc_payee_id?: string;
  enc_id: string;
  enc_bank_account_id?: string;
  informed_payee_email?: boolean;
  informed_payee_sms?: boolean;
  is_exisiting_attach?: number;
  payee_email?: string;
  payee_name?: string;
  payee_country?: string;
  payee_phone?: string;
  shippingFee?: string;
  subtotal?: string;
  total?: string;
  zip?: string;
  mail_type:number;
  attachments?: string[];
  payee_zip?: string;
  isSelectedForPayment?: boolean;
}

export interface IPayeeEdit {
  PayeeCompanyName?: string;
  PayeePhone?: string;
  address_line_1: string;
  address_line_2: string;
  checkNo: string;
  city: string;
  country: string;
  enc_id: string;
  name: string;
  payeeEmail?: string;
  state: string;
  zip: string;
}

/** For shipping cost calculation */

export interface IShippingCostCalculation {
  total: string;
  single_items: { [key: string]: number | string };
  subTotal: string;
  group_shipping_fee: string;
  page_cost: string;
  subtotal: string;
  /** Its own line since the quote started itemising it out of `total`. */
  attachment_fee?: string;
}

export interface IShipingCheckPaperType {
  id: number;
  name: string;
  amount: string;
  description: string;
}

export interface ICheckCustomMetaData {
  check_id: string;
  mail_type: number;
  settlement_agent: string;
  sp_file_number: string;
}

export interface ICheckShipingTypes {
  id: number;
  name: string;
  amount: string;
  country?: string;
  carrier_id: number;
  is_default_mailing_type:boolean;
  page_count_limit: number;
  short_code: string;
}

export interface IMailShippingCalculations {
  mail_check_ids: string[];
  all_check_ids: string[];
  shipping_rate_warning: number;
  sent_to_customer_address: number;
  Single_mail_options: number;
  individual_envelope : number;
  fedex_cutoff_time_warning? : number;
  [key: string]: IMailShippingCalculations | any;
}

export interface IMailShippingPayeeDetails {
  mail_type: number;
  check_paper: number;
  informed_payee_sms: number;
  informed_payee_email: number;
  payee_phone?: string;
  payee_email?: string;
  file_hidden: string[];
}

export interface ICheckData {
  paper?: IShipingCheckPaperType[];
  chequedata?: IChequedata;
  shipping?: ICheckShipingTypes[];
  errorMsg?: string;
}

export interface IChequedata {
  datas: (IMailCheck & { cost: number })[];
  message: ImailCheckMessage;
}
export interface ImailCheckMessage {
  non_mailiable_checks: any[];
  user_sms_enabled: boolean;
  is_auto_attachment_enabled: number;
  has_pdf_attachment?: boolean;
}

export interface ICheckDetails {
  id: string;
  bankAccount: IBank;
  payee: IPayee;
  category: unknown;
  chequeSerialNumber: string;
  chequeAmount: string;
  chequeIssueDate: string;
  chequeStatus: number;
  memo: string;
  chequeCreatedByName: string;
  chequeCreatedByUserName: string;
  createdAt: string;
  verified: unknown;
  qbTransactionId: unknown;
  chequeNotes: unknown;
  chequeAccountNumber: unknown;
  chequeInvoiceNumber: unknown;
  thirdParty: unknown;
  noPayee: number;
  noDate: number;
  templateFileName: string;
  newDesign: unknown;
  templateSignature: string;
  markAsVerified: unknown;
  clients: unknown;
  shipping:ICheckMailShipping;
  ach_pull_trace_number:string;
  ach_push_trace_number:string;
  sending_amount: number
  receiving_amount: number
  sending_currency_code: string
  receiving_currency_code: string
  payee_id: string
  wallet_id: string
  iban_or_account_number: unknown
  international_payee_bank_id: string
  status: string
  provider_status: string
  payee_bank_info: IPayeeBankInfo
  payee_info: IPayeeInfo;
  check_mail_record: ICheckMailRecord;
  walletCheck?: {clearing_file:string};
  source_of_cash?: string;
  source_of_cash_name?: string;
  purpose?: string;
  purpose_name?: string;
  receiver_account_number?: string;
}

export interface ICheckMailRecord {
  id: number;
  uu_id: string;
  subject_type: number;
  subject_id: number | null;
  transfer_request_id: number;
  initiator_id: number;
  sender_id: number;
  receiver_id: number;
  initiator_email: string;
  amount: string;
  status: number;
  uwrt_id: number;
  description: string;
  sender_name: string;
  sender_address1: string;
  sender_address2: string;
  sender_city: string;
  sender_state: string;
  sender_zip: string;
  sender_country: string;
  receiver_name: string;
  receiver_address1: string;
  receiver_address2: string;
  receiver_city: string;
  receiver_state: string;
  receiver_zip: string;
  receiver_country: string;
  check_issue_date: string | null;
  carrier: string | null;
  carrier_type: string | null;
  carrier_tracking_number: string | null;
  created_at: string;
  updated_at: string;
  clearing_file: string | null;
  preview_file: string | null;
  subject_type_description: {
    short_name: string;
    description: string;
  };
}

export interface IPayeeBankInfo {
  beneficiary_bank_address_line_1: string
  beneficiary_bank_address_line_2: string
  beneficiary_bank_city: string
  beneficiary_bank_state: string
  beneficiary_bank_zip: string
  beneficiary_bank_country: string
  account_number: string
  bank_name: string
  currency: string
  swift_or_bic: string
  ifsc: string
  organisation_id_number: string
  relationship: string
  branch_code: string
  business_legal_name: string
}

export interface IPayeeInfo {
  beneficiary_type: string
  payee_name: string
  payee_email: string
  payee_phone: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  country: string
}

export interface IMailSingleShippingAddress {
  id: number;
  name: string;
  company_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  note: string;
  enc_id: string;
}

export interface IMailBulkShippingAddress {
  name: string;
  id: string;
  country: string;
  dec_id: number;
  countryName?: string;
}
export interface IMultipleCheckImportEqStep1 {
  template: { id: string; templateName: string }[];
  sampleFileUrl: string;
}

export interface IMultipleCheckImportEqStep2 {
  header: Record<string, string>;
  fileHeader: unknown[];
  checksData: Record<string, string | Record<string, string>>[];
  template: string[];
}

export interface IMultipleCheckImportEqStep4 {
  header: Record<string, string>;
  rows: Record<string, string>[];
}

export interface ICheckPayee {
  success: boolean;
  data: ICheckPayeeSummary[];
  other: IOtherDetails;
  cash_expenses: ICashExpenseSummary;
}

export interface ICashExpenseSummary {
  total_expense_all_time: string;
  total_expense_last_year: string;
  total_expense_this_year: string;
  total_expense_this_month: string;
}

export interface ICheckPayeeSummary {
  id: string;
  memo?: string;
  date: string;
  status: number;
  amount: string;
  account: string;
}

export interface IOtherDetails {
  total_paid_in_month: string;
  total_paid_in_year: string;
  total_paid_in_last_year?: string;
  total_paid: string;
  last_catagory_id: string;
  check_account_number: string;
}

export interface IMultiCheckImport {
  header: { [key: string]: string }[];
  fileHeader: unknown[];
  chequeData: IChequeDetails[];
  template: unknown[];
}

export interface IHamaspikCheckImport {
  header: Record<string, string>[];
  fileHeader: unknown[];
  chequeData: IChequeDetails[];
  template: string[];
}

export interface IChequeDetails {
  date: string;
  checkNumber: string;
  amount: string;
  memo: string;
  notes: string;
  categoryName: string;
  payeeAccount: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCompany: string;
  payeeEmail: string;
  payeeInvoice: string;
  payeeName: string;
  payeeNickName: string;
  payeePhone: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface ICheckTemplate {
  bankAccountId: string;
  templateLogo: string;
  templateSignature: string;
  qrCodeToken: string;
  bankAccountAddress: string;
  bankAccountNumber?: string;
  bankAccountPhone: string;
  bankAccountRouting: string;
  bankAccountIsVerified?: number;
  bankName: string;
  bankAccountName: string;
  checkSerialNumber: number;
  fractionalNo: number;
  template: number;
  templateOptions: {
    name: string;
    id: number;
  }[];
  checkDesign: string;
}

export interface ICheckListTableRowData {
  bank_account_account_name: string;
  bank_account_nick_name: string;
  bank_account_account_number: string;
  cheque_status: number;
  verified: unknown;
  bank_name: string;
  id: string;
  qb_transaction_id: string;
  cheque_created_by_name: string;
  create_check_from: number;
  bank_specialization_id: number | string;
  payee_name: string;
  payee_nick_name: string;
  cheque_amount: string;
  cheque_issue_date: string;
  cheque_serial_number: string;
  cheque_memo: string;
  cheque_notes: unknown;
  cheque_account_number: string;
  cheque_invoice_number: string;
  catagory_name: string;
  third_party: unknown;
  created_at: string;
  no_payee: number;
  no_date: number;
  payee_id: string;
  template_file_name: string;
  new_design: number;
  template_signature: string;
  mark_as_verified: number;
  bank_account_nature_type: number;
  trackingUrl: string;
  carrier: string;
  mailedUsing: string;
  shortCode: string;
  software_type: string;
  bank_accounts_id: string;
  account_name: string;
  clients: unknown;
  bank_account: string;
  action: string;
  cheque_created_by_user_name: string;
  is_virtual_account: number;
  verified_by: number;
  bank_account_status: number;
  uu_id?: string;
}

export interface IShippingType {
  carrier_id: number;
  amount: string;
  country?: string;
  id: number;
  name: string;
  is_default_mailing_type:boolean
}

export const USPS_FIRST_CLASS_MAILED_TYPE = 1;

export interface ICheckMailTrackDetails {
  trackingUrl: string;
  carrier: string;
  carrierLogo: string;
  mailedUsing: string;
  trackingData: ICheckTrackingData;
  mailedAttachments: IMailedAttachment[]
  mailedType: number;
  trackingCode: string;
  payee: {
    payeeEmail: string
    payeePhone: string
  }
}

export interface IMailedAttachment {
  id: string
  checkId: string
  date: string
  user: string
  fileName: string
  pages: number
}

export interface ICheckTrackingData {
  success: boolean;
  data: ICheckTrackingDetails;
}

export interface ICheckTrackingDetails {
  carrierLogo: string;
  status: string;
  lastUpdated: string;
  trackingCode: string;
  details: ICheckTrackingInfo[];
  estimatedDeliveryDate: Date;
}

export interface ICheckTrackingInfo {
  object: string;
  message: string;
  description: string;
  status: string;
  statusDetail: string;
  Date: string;
  source: string;
  carrierCode: string;
  trackingLocation: ITrackingLocation;
}

export interface ITrackingLocation {
  object: string;
  city: string;
  state?: string;
  country: string;
  zip?: string;
}
export interface IAchBody {
  data: object;
  recurring: object;
  isRecurringValue: string | number;
  isSameDay: number;
}

export interface ICheckSummary {
  count: 0;
  amount: string;
  account_name: null | string;
  bank_account: null | string;
}

export interface IGroupCheckRowData {
  name: string;
  id: string;
  created_at: string;
  created_at1: string;
}
export interface IMultiCheckEditData {
  bankAccount: IMultiBankAccount;
  payee: IMultiPayee;
  category: IMultiCategory;
  amount: string;
  notes: unknown;
  memo: string;
  chequeIssueDate: string;
  groupId: string;
  groupName: string;
}

export interface IMultiBankAccount {
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
}

export interface IMultiPayee {
  payeeId: string;
  payeeName: string;
  payeeNickName: string;
}

export interface IMultiCategory {
  categoryId: string;
  categoryName: string;
}

export interface IProcessCheck{
  success: boolean
  processable_data: IProcessableData
}

export interface IProcessableData {
  printableChecks: IPrintableCheck[]
  emailChequeIds: IPrintableCheck[]
  mailChequeIds: IPrintableCheck[]
  ddChequeIds: IPrintableCheck[]
  printableCheck: string
  printableCheckIds: string[]
}

export interface IPrintableCheck {
  checkId: string
  method: string
  settings: unknown
}

export interface IProcessCheckPayload{
  processCheckTemplete: number
  data: ICheckProcessIds[]
}

export interface ICheckProcessIds{
  checkId: string
  payMethod: string | number
  payeeEmail: string
}

export interface ICheckProcessModalData{
  data: string[]
  RowData: ICheckListTableRowData[]
  status: ICheckStatus
}

export interface ICheckProcessData{
  id: string
  chequeAmount: string
  chequeNo: string
  payee: ICheckProcessPayee
  paymentMethod: string | number
  errorMsg?:unknown
}

export interface ICheckProcessPayee {
  payeeId: string
  payeeName: string
  payeeEmail: string
}

export interface ICheckProcessError {
  success: boolean
  errorMsg: ErrorMsg
  errorCode: number
}

export interface ErrorMsg {
  values: ICheckProcessErrorValue[]
  warning_checks: string
}

export interface ICheckProcessErrorValue {
  checkNo: string
  errorMsg: string
  checkId: string
}

export interface IQBDExportsForm {
  expense: FormControl<INameIdModel | null>;
  description: FormControl<string | undefined>;
  customer: FormControl<INameIdModel | null>;
  class: FormControl<INameIdModel | null>;
  amount: FormControl<string | undefined>;
}

interface INameIdModel {
  name: string;
  id: string;
}

export interface ICheckListTabs {
  tabOrder: number[];
  tabList: {[key:string]: string};
  defaultCheckListTab: number;
}


export interface ICheckListData {
  isPending: 1 | 0;
  isApprovedForMail: number;
  isApprovedForProcessNow: number;
  userTabs: IUserTabs;
  isQucikBookConnected: number;
  isPushBackEnabled: IIsPushBackEnabled;
  checkApprovalTotalCount: number;
  isQucikBookDesktopConnected: number;
  isQBDPushBackEnabled: number;
  isNetsuiteConnected: number;
  isNetsuitePushBackEnabled: number;
  isFreshBooksConnected: number;
  isFreshBooksPushBackEnabled: number;
  qbShowSelectionPopup: boolean;
  reprintRequestedTotalCount:number;
}

export interface IUserTabs {
  defaultTabNumber: number;
  order: IOrder[];
}

export interface IOrder {
  name: string;
  number: number;
}

export interface IIsPushBackEnabled {
  is_push_back_enable: number;
  show_warning: number;
}

export interface ICheckEmailData {
  email: IEmailArray[];
  user_notification_sms_enabled: boolean;
  enable_email_template: string;
  is_auto_attachment_enabled: number;
}

export interface IEmailArray {
  cheque_serial_number: string;
  cheque_amount: string;
  cheque_status: number;
  payee_name: string;
  payee_email: string;
  bank_account_account_name: string;
  bank_account_nick_name: string;
  payee_phone: string;
  existing_attach: number;
  added_attachments: number;
  attachments: string[];
  success: boolean;
  enc_cheque_id: string;
  enc_payee_id: string;
  enc_bank_account_id: string;
  subfee: string;
  account_name: string;
  bank_account: string;
}

interface ICheckMailShipping {
  carrier: string;
  carrier_type: string;
  carrier_tracking_number: string;
  carrier_tracking_url: string;
}

export interface IMailingSettingsActivities{
  formattedCreatedAt:string;
  status:string;
  userName:string;
  note:string;
  ip_address:string
}

export interface IReconciliationData {
  header: string[][]
  fileHeader: unknown[]
  chequeData: IReconciliationCheckData[]
}

export interface IReconciliationCheckData {
  date: IReconciliationCheckDate
  checkNumber: number
  amount: number
}

export interface IReconciliationCheckDate {
  date: string
  timezone_type: number
  timezone: string
}

export interface IReconciliationCheckStep3Data {
  header: {[key: string]: string}[];
  rows: IReconciliationCheckStep3Rows[]
}

export interface IReconciliationCheckStep3Rows {
  id: string
  createdForId: number
  createdById: number
  bankAccountId: string
  amount: number
  checkSerialNumber: number
  date: string
  selected:boolean
}

export interface ShippingIdList {
  mail_type: number | null;
  check_paper: number;
  informed_payee_sms: number;
  informed_payee_email: number;
  payee_phone: string;
  payee_email: string;
  file_hidden: any[];
}

export interface ICustomShippingToCarrierDetails {
  carrier: string;
  carrier_tracking_number: string;
  carrier_type: string;
}

export interface IQuickBookOnlineChecksResponse {
  type: string;
  items: IQuickBookOnlineChecksItem[];
  pagination: IQBOnlinePagination;
}

export interface IQBOnlinePagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface IQuickBookOnlineChecksItem {
  id: string;
  realmId: string;
  companyName: string;
  type: string;
  docNumber: string;
  totalAmt: number;
  txnDate: string;
  accountRef: string;
  memo: string;
  type_description: string;
  payeeName: string;
  bankName: string;
}
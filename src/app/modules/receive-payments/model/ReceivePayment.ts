import { IDocumentInfo } from 'src/app/models/bank';

export interface INewReceivePayment {
  amount: string;
  directLink: string;
  editable: number;
  endSelect: string;
  link: string;
  memo: string;
  payerEmail: string;
  payerId: string;
  paymentMethod: number;
  recurring: number | null;
  requestEmail: string;
  requestPaymentType: string;
  requestPhone: string;
  senderBankAccount: string;
  /** `yyyy-MM-dd`, or '' when the request does not recur. */
  startDate: string | number;
  /** Payment count when the recurrence ends after N, '' otherwise. */
  months: number | string;
  invoice_number?: string;
  frequency?: string;
  cheque_date?: string;
}

export interface IMetaData {
  metaData: { [key: string]: string };
}

export interface IReceivePaymentSmsBank {
  amount: string;
  directLink: string;
  editable: number;
  endSelect: string;
  link: string;
  memo: string;
  paymentMethod: number;
  recurring: number | null;
  requestPaymentType: string;
  requestPhone: string;
  senderBankAccount: string;
  startDate: number;
  months: number;
  invoice_number: string;
  frequency: string;
  cheque_date?: string;
}

export interface IRecieveCheckRow {
  id: number | string;
  uu_id: string;
  check_id?: number;
  get_paid_by_form_check_id?: number;
  received_type: number;
  sender_for_user_id?: number;
  sender_by_user_id?: number;
  receiver_for_user_id: number;
  receiver_by_user_id?: number;
  receiver_payee_id: string;
  receiver_bank_account_id?: number;
  receiver_email?: string;
  receiver_phone: string;
  sender_email: string;
  sender_phone?: string;
  sender_address_line_1?: string;
  sender_city?: string;
  sender_state?: string;
  sender_zip?: string;
  amount: string;
  memo?: string;
  is_editable?: number;
  printed_by?: number;
  status: number;
  receivable_type?: string;
  receivable_id?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  cheque_serial_number?: string;
  cheque_status?: number;
  cheque_issue_date?: string;
  bank_account_id?: number;
  bank_account_account_name?: string;
  bank_account_nick_name?: string;
  check_from_name?: string;
  print_by_name?: string;
  print_by_nick_name?: string;
  get_paid_by_form_check_ref_id?: number;
  encrypted_bankaccount_id: string;
  receivable?: IReceivableCheck;
  encrypted_id: string;
  action: string;
  pod_status: number;
}

export interface IReceivableCheck {
  id: number;
  uu_id: string;
  requested_type?: string;
  payee_id: number;
  email?: string;
  customer_name: string;
  mobile_no?: string;
  amount: string;
  memo?: string;
  editable?: number;
  requested_method?: number;
  requestable_type: unknown;
  requestable_id: string;
  created_for_id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  status: number;
  link_id: string;
  advanced_link: unknown;
  source_id?: number;
  source_type?: string;
  source_name?: string;
  transfer_id?: number;
  transfer_type?: string;
  transfer_mode?: number;
  reference_no?: string;
  description?: string;
  category_id: string;
  payment_due_date: string;
  payee_account_no?: string;
}

export interface IPanelButtons {
  text: string;
  id: string;
  toolTip: string;
  isAddIcon: boolean;
  icon: string[];
  type: string;
  width: string;
  menu: IPanelButtons[];
}

export interface IReceivedTypes {
  type: string;
  status?: string;
}

export interface IPodPusherResponse {
  state: number;
  document_info: IDocumentInfo[];
  created_for_id: string;
}
export interface IReceiveCheckActivityLog {
  ipAddress: string;
  note: string;
  userName: string;
  status: string;
  userFormatedActivityDate: string;
}

export interface IReceiveCheckDetails {
  uuid: string;
  chequeSerialNumber: string;
  chequeIssueDate: string;
  chequeStatus: number;
  chequeAmount: string;
  chequeMemo: string;
  chequeNote: string;
  chequeInvoiceNumber: string;
  chequeAccountNumber: string;
  address: string;
  payeeName: string;
  payeeCompanyName: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCity: string;
  payeeState: string;
  payeeZip: string;
  bankName: string;
  chequeId: string;
  status: number;
  receivedType: number;
  amounyInWords: string;
  metaData: IMetaData[];
  customField1: string;
  customField2: string;
  customField3: string;
  referenceId: string;
  recurringMetaData: IRecurringMetaData;
  account_details: IReceivedCheckAccountDetails;
}

export interface IRecurringMetaData {
  startDate: string;
  endDate: string;
  isUnlimited: number;
  total: number;
  status: number;
  rruleFreq: string;
  rruleInterval: number;
  completed: number;
}

export interface IReceivedCheckAccountDetails {
  bankAccountAccountName: string;
  bankAccountAccountNumber: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountAddress: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAccountRoutingNumber: string;
}

export interface IReceivePaymentsStatus {
  id: number;
  receivedType: number;
  receivedTypeDescription: string;
  statusValue: number;
  statusShortDescription: string;
  statusFullDescription: string;
  color: string;
  isItApproveAble: number;
  isItPrintAble: number;
  isItRejectAble: number;
  isItCancellAble: number;
  isItResendAble: number;
  isItPrintmarkAble: number;
}

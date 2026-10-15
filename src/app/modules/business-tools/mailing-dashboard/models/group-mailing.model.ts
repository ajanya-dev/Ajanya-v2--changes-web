export interface IGroupMailingRecord {
  id: string;
  name: string;
  shipping_type: number;
  created_for_id: number;
  total_cost: string;
  status: number;
  total_item: number;
  tracker_shipment_id: string | null;
  tracker_id: string | null;
  tracking_code: string | null;
  is_individual_envelope: number;
  created_for_name: string;
  shipment_name: string;
  created_at: string;
}

export interface IGroupMailingDetailData {
  group_name?: string;
  group_id: string;
  count_group_items: number;
  count_attachment: number;
  sender_info: ISenderInfo;
  shipment_name: string;
  tracking_link: string;
  is_individual_envelope: number;
}

export interface ISenderInfo {
  sender: string;
  receiver: string;
}

export interface IGroupMailingDetailRecord {
  id: string;
  group_mailing_id: string;
  recipient_name: string;
  recipient_address: string;
  document_title: string;
  status: number;
  tracking_code: string | null;
  shipped_date: string | null;
  delivered_date: string | null;
  cost: string;
  created_at: string;
}

export interface IGroupMailingActivityLog {
  description: string;
  created_at: string;
  note: string;
  ip: string;
  user_name?: string;
  status?: string;
}

export interface IGroupMailingAttachment {
  id: string;
  file_name: string;
  page_count: number;
}

export enum GroupMailingStatus {
  NEW = 0,
  MAILED = 1,
  CANCELLED = 2,
  PENDING = 11,
  FAILED = 12
}

export enum GroupMailingDetailsStatus {
  NEW = '0',
  PRINTED = '1',
  VOID = '2',
  ARCHIVED = '3',
  PRINTING = '4',
  MAILED = '7',
  SCHEDULE = '50',
  EMAILED = 'emailed',
  E_PRINTED = 'eprinted',
  REQUESTED = 'requested',
  DD = 'dd',
  DD_FUNDING = 'dd-funding',
  DD_FAILED = 'dd-failed',
  DDW = 'ddw',
  DD_DEPOSITING = 'dd-depositing',
  DD_DEPOSIT_FAILED = 'dd-depositing-failed',
  DDC = 'ddc',
  POSTED = 'show_posted',
  UN_POSTED = 'show_un_posted',
  APPROVAL_REQUIRED = 'userapprovalstatus',
  UNMAPPED_CHECKS = 'unmapped-checks',
  EXPORTED = 'export',
  NOT_EXPORTED = 'not-exported',
  BLANK = 'show_blank',
  IMPORTED = 'third_party'
}

export enum GroupMailingType {
  BULK = 0,
  INDIVIDUAL = 1
}

export interface IGroupMailingRawDetails {
  cheque_serial_number: string;
  cheque_status: number;
  created_at: string;
  cheque_memo: string;
  cheque_amount: string;
  payee_name: string;
  bank_account_account_name: string;
  attachments: IGroupMailingAttachment[];
}

export interface IMailingDashboardReport {
  shipping_types: ShippingType[]
  total_groups: number
}

export interface ShippingType {
  id: number
  name: string
  check_mail_count: number
  group_check_mail_count: number
  total_count: number
}

export interface IMultipleCheckMailStep1 {
  sampleFileUrl: string;
  sampleZipFileUrl: string;
}

export interface IMultipleCheckMailStep2 {
  header: string[][];
  chequeData: IChequeData[];
}

export interface IMailErrorMsg {
  payeeName: string;
  payeeNickName: string;
  payeeCompany: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCity: string;
  payeeState: string;
  payeeZip: string;
  payeePhone: string;
  payeeEmail: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankAccountNickName: string;
  amount: number;
  shippingType: string;
  invoiceNumber: string;
  memo: string;
  category: string;
  checkDate: string;
  attachment: string;
  customField: string;
  validationError: { [key: string]: string };
  row_number: number;
}

export interface IChequeData {
  bank_routing_number: string;
  bank_account_number: string;
  bank_account_nick_name: string;
  amount: string;
  payee_name: string;
  payee_nickname: string;
  payee_company: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_country: string;
  payee_phone: string;
  payee_email: string;
  mail_type:string;
  invoice_number: string;
  memo: string;
  category: string;
  check_date: string;
  attachment: string;
  custom_field: string;
  validation_error?: {
    [key: string]: string;
  };
  row_number?: number;
  attachment_id?: string | null;
  row_id?: string | null;
  isEditing?: boolean;
  isDeleting?: boolean;
  batch_id: string;
}

export interface IMailBatchData {
  id: string;
  file_name: string;
  status: number;
  items_count: number;
  created_at: string;
  created_for_name: string;
  sent_to_customer_address: number;
  shipping_from: string | null;
  shipping_to: string | null;
  name: string | null;
}

export interface ICheckDetailData {
  bank_account_account_name: string;
  bank_account_nick_name: string;
  cheque_status: number;
  verified: null | string;
  bank_name: string;
  id: string;
  qb_transaction_id: null | string;
  cheque_created_by_name: string;
  create_check_from: number;
  bank_specialization_id: number;
  payee_name: string;
  payee_nick_name: string;
  cheque_amount: string;
  cheque_issue_date: string;
  cheque_serial_number: string;
  cheque_memo: string;
  cheque_notes: null | string;
  cheque_account_number: null | string;
  cheque_invoice_number: string;
  catagory_name: null | string;
  created_at: string;
  cheque_created_by_id: number;
  no_payee: number;
  error_log: string;
}

export interface IAttachmentItem {
  mail_type: string;
  check_paper: number;
  informed_payee_sms: number;
  informed_payee_email: number;
  payee_phone: string;
  payee_email: string;
  file_hidden: string[];
}

export interface IMailPayload {
  batch_id: string;
  sent_to_customer_address: number;
  mail_check_ids: string[];
  [key: string]: string | number | string[] | IAttachmentItem | undefined;
}

export enum BulkMailStatus {
  NEW = '0',
  PRINTED = '1',
  VOID = '2',
  ARCHIVED = '3',
  PRINTING = '4',
  MAILED = '7',
  REFUNDED = '11',
  SCHEDULE = '50',
  MAILED_AND_VOIDED = '807',
  EMAILED = 'emailed',
  E_PRINTED = 'eprinted',
  REQUESTED = 'requested',
  DD = 'dd',
  DD_FUNDING = 'dd-funding',
  DD_FAILED = 'dd-failed',
  DDW = 'ddw',
  DD_DEPOSITING = 'dd-depositing',
  DD_DEPOSITING_FAILED = 'dd-depositing-failed',
  DDC = 'ddc',
  POSTED = 'show_posted',
  UN_POSTED = 'show_un_posted',
  APPROVAL_REQUIRED = 'userapprovalstatus',
  UNMAPPED_CHECKS = 'unmapped-checks',
  EXPORTED = 'export',
  NOT_EXPORTED = 'not-exported',
  BLANK = 'show_blank',
  IMPORTED = 'third_party',
  EMAIL_RECURRING = '508',
  EMAIL_SCHEDULED = '509',
  CHECK_CLEARED = '1002',
  DD_SCHEDULED = '401',
}

export interface IGroupMailingLogs {
  activities: IGroupMailingLogsActivity[];

}
export interface IGroupMailingLogsActivity {
  id: string;
  status: string;
  note: {
    batch_name: string | null;
    row_count: number;
    created_at: string;
  };
  user_name: string;
  display_name: string;
  created_at: string;
  formatted_date: string;
}
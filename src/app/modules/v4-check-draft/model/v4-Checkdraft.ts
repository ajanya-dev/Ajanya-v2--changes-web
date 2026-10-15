export interface INewCheckDraft {
  payeeId: string;
  payeeCheckId: string;
  bankaccountId: string;
  amount: string;
  chequeSerialNumber: number;
  checkIssueDate: string;
  categoryId: string;
  ac: string;
  Inv: string;
  Note: string;
  memo: string;
  isThisNeedPermission: boolean;
  sendPermissionEmail: number;
  permissionEmail: string;
  permissionSms: number;
  permissionPhone: string;
  allAttachments: string[];
  allComments: string[];
  invoiceNumber: string[];
  itemName: string[];
  itemDescription: string[];
  itemQuantity: string[];
  itemUnitCost: string[];
  totalSingleRow: string[];
  attachRemittanceToCheck: number;
}

export interface IImportStep2 {
  header: string[][];
  fileHeader: never;
  CheckdraftData: ICheckdraftData[];
}

export interface ICheckdraftData {
  date: IDate;
  checkDraftSerialNumber: number;
  amount: number;
  memo: string;
  notes: string;
  categoryName: string;
  payeeAccount: number;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCompany: string;
  payeeEmail: string;
  payeeInvoiceNumber: number;
  payeeName: string;
  payeeNickName: string;
  payeePhone: number;
  city: string;
  state: string;
  country: string;
  zip: number;
  payeeAccountType: string;
  payeeRoutingNumber: number;
  payeeAccountNumber: number;
}

export interface IDate {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface IImportStep4 {
  id: string;
  payeeId: string;
  bankAccountId: string;
  amount: string;
  date: string;
  ac: string;
  invoiceNumber: string;
  memo: string;
  categoryId: string;
  notes: string;
  routingNumber: number;
  accountNumber: number;
  accountType: string;
  userId: number;
  createdForId: number;
  createdById: number;
  checkDraftSerialNumber: number;
  payeeCheckId: string;
  ipAddress: string;
  payeeEmail: string;
  payeeName: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCity: string;
  payeeState: string;
  payeeZip: string;
  payeeCountry: string;
  payeePhone: string;
  payeeCompanyName: string;
  payeeNickName: string;
  categoryName: string;
  bankAccountName: string;
  selected: boolean;
}

export interface ICheckDraftTableRow {
  payee_name: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_company_name: string;
  payee_phone: string;
  payee_email: string;
  bank_account_account_name: string;
  bank_account_nick_name: string;
  bank_account_id: string;
  check_issue_date: string;
  ac: string;
  inv: string;
  memo: string;
  cheque_serial_number: number;
  id: string;
  amount: string;
  created_at: string;
  status: number;
  name: string;
  nick_name: string;
  cheque_status: number;
  clients: unknown;
  action: string;
  created_by_name: string;
  check_id: string;
  index: string;
}

export interface ICheckDraftMultiPrint {
  printData: string;
  url: string;
}

export interface ICheckDraftView {
  check_no: number;
  bank_account_name: string;
  payee_name: string;
  amount: string;
  check_date: string;
  ac_no: string;
  inv_no: string;
  memo: string;
  note: string;
}

export interface ICheckDraftActivityLog {
  formattedCreatedAt: string;
  userName: string;
  status: string;
  note: string;
  ipAddress: string;
  deviceName: string;
}

export interface ICheckDraftAttachments {
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
  status: unknown;
}

export interface ICheckDraftComments {
  user_name: string;
  commentable_id: number;
  comments: string;
  commentable_type: string;
  created_at: string;
  id: number;
  formated_date: string;
  user: string;
  encrypted_id: string;
  status: string;
}

export interface ICheckDraftRecurringView {
  details: {
    bank_account_name: string;
    payee_name: string;
    amount: string;
    created_date: string;
    ac: string;
    inv: string;
    memo: string;
    note: string;
    ending_date: string;
    total: number;
    paid: number;
  };
  job: {
    id: string;
    date: string;
    processed: number;
    status: number;
    check_id: number;
    notes: string;
  }[];
}

export interface IPayeeSingleBankData {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  bankName: string;
  isAllowWire: number;
  bankAccountFirstName: string;
  bankAccountLastName: string;
  bankAccountAddress1: string;
  bankAccountAddress2: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAccountCountry: string;
  bankingInstituteName: string;
  bankingInstituteAddressLine1: string;
  bankingInstituteAddressLine2: string;
  bankingInstituteCity: string;
  bankingInstituteState: string;
  bankingInstituteZip: string;
  bankingInstituteCountry: string;
  defaultDDAccount?: number;
  defaultCDAccount?: number;
  /** 1 = holder legal name already verified, 2 = not verified. */
  verified?: number;
}

export interface ICheckDraftPayeeSummary {
  lastTenTransaction: IPayeeLastTransactions[];
  payeeSummary: IPayeeCheckDraftSummary;
}

export interface IPayeeLastTransactions {
  memo: string;
  accountName: string;
  cd_id: string;
  date: string;
  amount: string;
}

export interface IPayeeCheckDraftSummary {
  paidTotalInMonth: string;
  paidTotalInYear: string;
  paidTotalInAllTime: string;
}

export interface ICheckDraftCloneData {
  chequeSerialNumber: number;
  payeeId: string;
  payeeCheckId: string;
  bankaccountId: string;
  amount: string;
  checkIssueDate: string;
  categoryId: string;
  ac: string;
  Inv: string;
  Note: string;
  memo: string;
  isThisNeedPermission: number;
  invoiceNumber: string[];
  itemName: string[];
  itemDescription: string[];
  itemQuantity: string[];
  itemUnitCost: string[];
  totalSingleRow: string[];
}

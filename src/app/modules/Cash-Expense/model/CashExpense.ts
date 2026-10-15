export interface INewCashExpense {
  ceBankAccount: string;
  payeeId: string;
  ceAmount: number;
  transactionDate: string;
  categoryId: string;
  ceSerialNumber: number;
  cashexpAccountNumber: string;
  cashexpInvoiceNo: string;
  transactionType: string;
  ceMemo: string;
  fullTotalAmount: number; //used for update
  attachRemittance: string;
  remittance: any;
  all_attachments: string[];
  all_comments: string[];
}

export interface ICashAccount {
  cash_account_name: string;
  balance: number;
  nickname: string;
}

export interface ICashExpenseDetails {
  cashExpenseId: string;
  bankAccount: IBankAccount;
  bankName: string;
  bankCity: string;
  bankState: string;
  bankZip: string;
  grandTotal: string | number;
  transactionDate: string;
  serialNo: number;
  memo: string;
  transactionType: number | string;
  cashExpAccountNo: string;
  cashExpInvoiceNo: string;
  category: ICategory;
  payee: IPayee;
  remittance: IRemittance[];
}

export interface IRemittance {
  invoiceNumber: string;
  itemDescription: string;
  itemName: string | null;
  itemQuantity: string;
  itemUnitCost: string;
  totalSingleRow: string;
}

export interface IBankAccount {
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
  bankAccountAddressLine1: string;
  bankAccountAddressLine2: string;
  bankAccountCity: string;
  bankAccountState: string;
  bankAccountZip: string;
  bankAccountPhone: string;
}

export interface ICategory {
  catogryId: string;
  catogryName: string;
}

export interface ICategoryData {
  catagory_name: string;
  catagory_type: number;
  category_status: number;
  id: string;
  index: string;
}

export interface IPayee {
  payeeId: string;
  payeeName: string;
  payeeNickName: string;
}

export interface ICashexpensePayeeSummary {
  rows: IRow[];
  summary: ISummary;
}

export interface IRow {
  id: string;
  date: string;
  memo: string;
  amount: string;
  account: string;
}

export interface ISummary {
  total_paid_in_month: string;
  total_paid_in_year: string;
  total_paid_all: string;
  payee_account_number: string;
  payee_category: string;
}

export interface ICashExpenseActivity {
  formattedCreatedAt: string;
  userName: string;
  status: string;
  note: string;
  ipAddress: string;
  deviceName: string;
}

export interface ICashexpenseComments {
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

export interface ICashexpenseAttachments {
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
  status: string;
}

export interface ICashExpenseData {
  id: string;
  signature_url: string;
  signed_ip_address: string;
  signed_date: string;
  bankAccountName: string;
  serialNo: string;
  payeeName: string;
  transactionDate: string;
  grandTotal: string;
  catogryName: string;
  cashExpAccountNo: string;
  cashExpInvoiceNo: string;
  transactionType: string;
  memo: string;
  isPrint: boolean;
  payee:{
    payeeId: string;
  }
}

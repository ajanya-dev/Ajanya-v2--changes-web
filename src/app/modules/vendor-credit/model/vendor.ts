export interface IVendorData {
  id: string;
  bankAccount: IVendorBankAccount;
  payee: IPayee;
  category: IVendorCategory;
  creditNo: string;
  accountNo: string;
  amount: string;
  credit_date: string;
  memo: string;
  balance: string;
  bill: {billId: string, invNo: string};
}

export interface IVendorCreditRowData {
  bank_account_account_number: string;
  id: number;
  payee_name: string;
  credit_no: string;
  account_no: string;
  amount: string;
  credit_date: string;
  memo: string;
  balance: string;
  bank_account_id: number;
  status: number;
  payee_nick_name: string;
  nick_name: string;
  name: string;
  clients: string;
  action: string;
}

export interface IVendorBankAccount {
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
}

export interface IPayee {
  payeeId: string;
  payeeName: string;
  payeeNickName: string;
}

export interface IVendorCategory {
  categoryId: string;
  categoryName: string;
}

export interface IVendorUpdateBody {
  accountNo: string;
  amount: string;
  bank_accountId: string;
  categoryId: string;
  creditDate: string;
  creditNo: string;
  memo: string;
  payeeId?: string;
  isBill: number;
  billId?:string;
}


export interface IVendorViewData {
  is_bill: number;
  billInvNo?: string;
  payeeName: string;
  payeeNickName: string;
  creditDate: string;
  creditNumber: string;
  total: string;
  balance: string;
  encryptedId: string;
  payments: IVendorPayment[];
  billId?: string;
  memo?: string;
  nick_name?: string;
  payeeEncryptedId?: string;
  payee_encrypted_id?: string;
}

export interface IVendorPayment {
  paymentDate: string;
  amount: string;
  paymentReference: string;
  referenceType: number;
}
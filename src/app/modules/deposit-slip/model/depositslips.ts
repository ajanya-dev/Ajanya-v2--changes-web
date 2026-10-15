import { IPayeeDropdown } from "../../payee/payee-v2/model/payee";

export interface IItems {
  id: string;
  name: string;
}

export interface ICashRow {
  amount: string;
  denominations: {
    value: number;
    count: number;
  }[];
  payeeName: string;
  misc: string;
  checkType: string;
}

export interface ICheckRow {
  checkFrom: IPayeeDropdown;
  amount: string;
  payeeName: string;
  misc: string;
  checkType: string;
  checkTo: string;
  referenceId: string;
}

export interface INewSaveSlipBody {
  type: number;
  depositslipAccountId: string;
  depositDate: string;
  dsStart: string;
  comments: string;
  refId: string;
  referenceType: string;
  check: ICheckRow[];
  cash: ICashRow[];
  commentIds?: string[];
  attachmentIds?: string[];
  payeeId?:string;
}

export interface INewBlankDepositSlip {
  comments: string;
  depositDate: string;
  depositslipAccountId: string;
  dsStart: string;
  refId: string;
  commentIds?: string[];
  attachmentIds?: string[];
  payeeId:string;
}

export interface IRouteData {
  mode: 'create' | 'edit' | 'clone';
  title: string;
}

export interface ICheckDeposit {
  amount: string;
  bankAccountId: string;
  bankAccountNickName: string;
  checkFrom: string;
  checkTo: number;
  chequeSerialNumber: number;
  id: string;
  memo: string;
  referenceId: string;
  bankAccountName?: string;
}

export interface IViewCheckdraftItems {
  amount: string;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
  chequeSerialNumber: number;
  id: string;
  inv: string;
  memo: string;
  payeeName: string;
}

export interface IViewReceivedPayments {
  amount: string;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
  chequeSerialNumber: number;
  id: string;
  memo: string;
  payeeName: string;
  uuid: string;
}

export interface IDepositSlip {
  bankAccount: IBankAccount;
  refId: string;
  total_items: number;
  memo: string;
  verified: number;
  depositDate: string;
  cash: ICashRow[];
  check: ICheckDeposit[];
  payeeId?:string
  payeeName?: string;
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
}


export interface IDepositSlipLastTransaction {
  id: number;
  amount: string;
  createdBy: string;
  depositDate: string;
  from: string;
  memo: string;
  refId: string
}

export interface IDepositSlipRowData {
  action: string;
  status: number;
  total_amount: string;
  payee_name: string;
  ref_id: string;
  bank_account_nick_name: string;
  bank_account_account_name: string;
  comments: string;
  'depositslips.created_at': string;
}
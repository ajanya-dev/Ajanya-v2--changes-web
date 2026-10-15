import { HttpErrorResponse } from '@angular/common/http';
import { IMailShippingCalculations } from '../../check/model/check';
import {
  IPayeeBankDetails,
  IPayeeDropdown
} from '../../payee/payee-v2/model/payee';

import { IWalletData } from '../../../models/wallet';
import { ICardPaymentReqDocRes } from '../../payments/model/payments';

export interface IZilPyamentLists {
  id: string;
  sourceId: string;
  sourceType: string;
  amount: string;
  payeeId: string;
  transferId: string;
  transferType: string;
  transferTypeCode: string;
  transferMode: string;
  source: IBankSource | ICardSource | IWalletData;
  transfer: IZilTransfer;
  referenceNo: string;
  status: string;
  description: string;
  payee: IPayee;
  createdAt: string;
  updatedAt: string;
  zilpaymentId: string;
  payeeBankAccount: string;
  payeeDefaultPaymentMethod?: string;
  payeeDefaultBankAccount?: string;
  /** Wallet check delivery, e.g. 'check_print' / 'check_email' (may come as a `{ method }` summary). */
  paymentMethod?: string | { method?: string; type?: number | string };
  metadata?: {
    shippingType?: string;
    paymentMethod?: string;
  };
}

export interface IZilTransfer {
  id: string;
  chequeInvoiceNumber: string;
}

export interface IBankSource {
  id: string;
  accountNumber: string;
  bankName: string;
  cashAccount: number;
  name: string;
  nickName: string;
  routingNumber: string;
  status: number;
  statusDescription: string;
  verified: number;
  mAch: number;
  isItZil: number;
  achApplicationStatus: number;
  verifiedBy: unknown;
  isVirtualAccount: number;
  bankAccountStatus: number;
}

export interface ICardSource {
  bgColor: string;
  card: string;
  cardId: string;
  isLatest: number;
  nickName: string;
}

export interface IPayee {
  id: string;
  name: string;
  nickName: string;
  compunknown: unknown;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  payeeTypeId: number;
  typeDetails: TypeDetails;
  encryptedId: string;
  createdAt: string;
}
export interface TypeDetails {
  id: string;
  payee: Payee2;
  customerAccountNumber?: string;
  customerBankAccountId: unknown;
  customerDefaultPayMethod: string;
  customerFirstName: unknown;
  customerMiddleName: unknown;
  customerLastName: unknown;
  customerType: unknown;
  customerCompunknownName: unknown;
  customerNote: unknown;
  vendorAccountNumber: unknown;
  vendorBankAccountId: unknown;
  vendorDefaultPayMethod: unknown;
  vendorFirstName: unknown;
  vendorMiddleName: unknown;
  vendorLastName: unknown;
  vendorType: unknown;
  vendorPaymentTerms: unknown;
  vendorTaxId: unknown;
  vendor1099: unknown;
  vendorCompunknownName: unknown;
  vendorNote: unknown;
  employeeAccountNumber: unknown;
  employeeBankAccountId: unknown;
  employeeDefaultPayMethod: unknown;
  employeeFirstName: unknown;
  employeeMiddleName: unknown;
  employeeLastName: unknown;
  employeeDob: unknown;
  employeeSsn: string;
  employeeType: unknown;
  employeeHourlyRate: unknown;
  employeePaymentSchedule: unknown;
  employeeFillingStatus: unknown;
  employeeOvertimeRate: unknown;
  employeeYtdEarning: unknown;
  employeeYtdTax: unknown;
  employeeNote: unknown;
  createdAt: string;
  updatedAt: string;
  deletedAt: unknown;
}
export interface Payee2 {
  payeeAccountNumber: unknown;
  payeeId: string;
  payeeMobilePhone: string;
}
export interface ICheckMailResponse {
  cheque_amount: string;
  cheque_issue_date: string;
  cheque_serial_number: string;
  payee_name: string;
  payee_email: string;
  payee_country: string;
  payee_zip: string;
  template_file_name: string;
  new_design: number;
  template_signature: string;
  mark_as_verified: number;
  payee_phone: string;
  is_exisiting_attach: number;
  added_attachments: number;
  attachments: string[];
  enc_id: string;
  enc_bank_account_id: string;
  enc_payee_id: string;
  account_name: unknown;
  bank_account: unknown;
  cost: number | string;
  toAddressValidity: IAddressValidity;
  fromAddressValidity: IAddressValidity;
  comments?: string[];
}

export interface IAddressValidity {
  data: {
    enc_payee_id: string;
    id: string;
    payee_id: number;
  };
  success: boolean;
}

export interface IMessage {
  non_mailiable_checks: unknown[];
  user_sms_enabled: boolean;
  is_auto_attachment_enabled: number;
}

export interface ICheckMailData {
  datas: ICheckMailResponse[];
  message: IMessage;
}

export interface Data {
  total: string;
  single_items: string[];
  subtotal: string;
  group_shipping_fee: string;
}

export interface SingleItems {
  '6VoW41Y3354589l': number;
  v1byeVrvvbeOQgr: number;
  Japb4kk66g4Y1Ew: number;
}
/** Email check interfaces */
export interface IEmailCheckData {
  email: IEchecks[];
  user_notification_sms_enabled?: boolean;
  enable_email_template?: string;
  is_auto_attachment_enabled?: number;
}

export interface IEchecks {
  bank_account_account_name: string;
  bank_account_nick_name: string;
  cheque_amount: string;
  cheque_serial_number: string;
  cheque_status: number;
  enc_bank_account_id: string;
  enc_cheque_id: string;
  enc_payee_id: string;
  existing_attach: number;
  payee_email: string;
  payee_name: string;
  payee_phone: string;
  success: boolean;
  checked: boolean;
  subfee: number;
  added_attachments: number;
  attachments: string[];
}

export interface IEmailFormBody {
  checkId: string;
  payee_email: string;
  checked: boolean;
  payee_phone: string;
  attachments: string;
  comments?: string[];
}
export interface CheckPrintFormBody {
  payee: string;
  amount: number;
  memo: string;
  checkId: number;
  paperType: string;
  invoiceNo: number;
}

export interface IBulkPaymentFormArrayValue {
  mail?: IMailFormArrayValue[];
  email?: IEmailFormArrayValue[];
  print?: IPrintFormArrayValue[];
  mail2?: IMail2FormArrayValue[];
  ach?: IAchFormArrayValue[];
  wire?: IWireFormArrayValue[];
  card?: ICardFormArrayValue[];
  dd?: ICheckDDFormArrayValue[];
  walletPrint?: IWalletPrintFormArrayValue[];
  walletEmail?: IWalletPrintFormArrayValue[];
}

export interface IPaymentSummaryData {
  payee: string;
  amount: string;
  type: string;
  success?: IResponse | HttpErrorResponse | { success: boolean; error?: { errorMsg?: string } };
  uuid?: string;
}

export interface IResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: unknown;
  response_code?: number;
}

export interface ICheckPrintResponse {
  url?: string;
}

interface IMailFormArrayValue {
  amount: string;
  checkNo: string;
  checkPaper: string;
  cost: string;
  country: string;
  enc_id: string;
  informed_payee_email: boolean;
  informed_payee_sms: boolean;
  is_existing_attach: number;
  mailNowPayLoad: IMailShippingCalculations;
  payee: string;
  shippingType: string;
  sms: string;
  sourceType: string;
}

interface IEmailFormArrayValue {
  added_attachments: number;
  attachments: unknown;
  bank_name: string;
  checkId: string;
  checked: boolean;
  cheque_amount: string;
  cheque_serial_number: string;
  cost: number;
  existingAttach: unknown;
  existingAttachments: unknown;
  payee_email: string;
  payee_name: string;
  payee_phone: string;
}

interface IPrintFormArrayValue {
  amount: string;
  checkId: string;
  invoiceNo: string;
  memo: string;
  paperType: string;
  payee: string;
}

interface IAchFormArrayValue {
  amount: string;
  email: string;
  from: string;
  payeeAcc: string;
  uuid: string;
  payee: IPayeeDropdown;
  payeeBanks: IPayeeBankDetails;
}

interface IWireFormArrayValue {
  amount: string;
  email: string;
  from: string;
  isWireEnabled: number;
  payeeAcc: string;
  uuid: string;
  payee: IPayeeDropdown;
  payeeBanks: IPayeeBankDetails;
}

interface ICardFormArrayValue {
  amount: string;
  email: string;
  from: string;
  uuid: string;
  payee: IPayeeDropdown;
}

interface IMail2FormArrayValue {
  amount: string;
  email: string;
  from: string;
  uuid: string;
  invoice: string;
  payee: IPayeeDropdown;
  memo: string;
}

export interface IRequiredDocumentRes {
  success: boolean;
  documents: IRequiredDocument[];
}

export interface IRequiredDocument {
  uuid: string;
  cardId: string;
  required_docs: [
    ('invoice' | undefined)?,
    ('card' | undefined)?,
    ('authDoc' | undefined)?
  ];
}

export interface IRequiredDocsValue {
  requiredDocs?: IRequiredDocument;
  addedDocs?: ICardPaymentReqDocRes;
}

export interface IAchSentData {
  mail_check_id?: string;
  payee_email?: string;
  wallet_bypassing?: '0' | '1';
  payee_account?: string;
  file_hidden?: string;
  payee_phone?: string;
  send_sms?: 1 | 0;
}

export interface ICheckDDFormArrayValue {
  mail_check_id: string;
  payee_email: string;
  payee_account: string;
  amount: string;
  payee: {
    name: string;
  };
}

interface IWalletPrintFormArrayValue {
  payee: string;
  amount: string;
  memo: string;
  uuid: string;
  invoiceNo: string;
}

import { IExistingCreditCards } from './payment-switch-board';
import { TPaymentSource } from '../modules/payments/model/payments';
import { IWalletData } from './wallet';

export interface ICommonTransactionTableData {
  uu_id: string;
  source_name: string;
  amount: string;
  reference_no: number;
  description?: string;
  status: string;
  created_at: string;
  transfer_mode: string;
  transfer_type: string;
  payee_name: string;
  payee_id: string;
  updated_at: string;
  source: ISource;
  action: string;
  checkId?: string;
  account_id?: string;
  source_id: string;
  transfer_id: string;
  transfer_type_code: string;
  id?: string;
  processed_date?: string;
  zilpayment_id?: string;
  third_party_name: string;
  gross_pay?: number;
  transaction_id?: string;
  transfer?: {
    id: string;
    chequeSerialNumber: string;
    status: number;
    receiver_account_number?: string;
  };
  txnDate?: string;
  service_fee?: string;
  cheque_status: number;
  payee_deleted: number;
  source_deleted: number;
  created_by?: {
    name: string;
    email: string;
    nick_name: string;
    id: string;
  };
  bill_status?:string;
  processed_amount?: string;
  isVirtualAccount?: number;
  zil_payment_uu_id?: string;
  reprint_cycle?: number;
  additional_fee?: number;
  can_mark_as_settled?: number;
  is_user_settled?: number;
  user_settled_at?: string;
  is_micro_deposit_initiated:number
}

export interface ISource {
  source: TPaymentSource;
  name: string;
  source_id?: string;
  info?: ISourceInformation;
  uuId: string;
  cardId: string;
  id: string;
}

export interface ISourceInformation {
  id?: string;
  accountNumber?: string;
  bankName?: string;
  cashAccount?: number;
  name?: string;
  nickName?: string;
  routingNumber?: string;
  status: unknown;
  statusDescription?: string;
  verified?: number;
  mAch?: number;
  isItZil?: number;
  achApplicationStatus?: number;
  verifiedBy: unknown;
  uuId?: string;
  availableBalance?: string;
  currentBalance?: string;
  bankAccount_id: unknown;
  walletName?: string;
  walletType?: number;
  bankAccountName: unknown;
  bankAccountNickName: unknown;
  bankAccountNumber?: string;
  bankAccountNatureType: unknown;
  cardId?: string;
  card?: string;
  bgColor?: string;
  isLatest?: number;
  isVirtualAccount?: number;
  bankAccountStatus?: number;
}

export interface IDynamicPaymentFields {
  uuid: string;
  sourceType: string;
  sourceId: string | IExistingCreditCards | IWalletData;
  transferType: string;
}

export interface IDtFilteredCols {
  table_id: number;
  table_slug: any;
  column_size: any;
  column_order: { [key: string]: number };
  column_visibility: string[];
}

export interface ICommentsAndAttachmentsCount {
  id: string;
  attachment: number;
  comment: number;
}

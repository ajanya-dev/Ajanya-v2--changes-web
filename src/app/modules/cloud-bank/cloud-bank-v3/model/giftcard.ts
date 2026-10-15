export interface IGiftCardData {
  success: boolean;
  total: number;
  data: IGiftCardList[];
}

export interface IGiftCardList {
  id: string;
  nickName: string;
  accountId: string;
  contactId: string;
  cardStatus: string;
  expiryYear: number;
  expiryMonth: number;
  last4: unknown;
}

export interface IGiftCardDetails {
  name: string;
  email: string;
  cardNickName: string;
  cardHolder: ICardHolderData;
  cardType: string;
  label: string;
  expiryMonth: string;
  expiryYear: string;
  last4: string;
  cardStatus: string;
  availableLimit: string;
  limitAmount: string;
  limitInterval: string;
}

export interface ICardHolderData {
  billingAddress: IBillingAddress;
  name: string;
}

export interface IBillingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IGiftCardStatmentList {
  id: string;
  transferId: string;
  transactionId: string;
  transactionStatus: string;
  amount: string;
  created_at: string;
  updated_at: string;
}

export interface ICardStatementList {
  description: string;
  changes: {
    card_status: string;
    limit_amount: string;
    limit_interval: string;
  };
  created_at: string;
  user: string;
  ip: string;
  deviceName: string;
}

export interface ICloudTransactionTableRow {
  txn_date: string;
  title: string;
  description: string;
  txn_type: string;
  amount: string;
  balance: string;
  transfer_type: string;
  status: string;
  id: string;
  account_id: string;
  fed_trace_number: string;
  imad: string;
}

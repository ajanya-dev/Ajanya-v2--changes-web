export interface ISendRecievedVirtualCardInfo {
  id: string;
  cardHolder: ICardHolder;
  currency: string;
  last4: string;
  expiry: string;
  card_amount: string;
  status: string;
  valid_starting_on: string;
  valid_ending_on: string;
  created_at: string;
  updated_at: string;
  card_number: string;
  cvc: string;
  available_balance: number;
  transactions_max: number;
  per_transaction_min: number;
  per_transaction_max: number;
}

export interface ICardHolder {
  name: string;
  email: string;
  address: IAddress;
}

export interface IAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// virtual card send and receive cards
export interface ISendReceiveVirtualCard {
  id: string;
  cardHolder: ISendReceiveCardHolder;
  currency: string;
  last4: string;
  expiry: string;
  card_amount: string;
  status: string;
  valid_starting_on: string;
  valid_ending_on: string;
  created_at: string;
  updated_at: string;
}

export interface ISendReceiveCardHolder {
  name: string;
  email: string;
  address: ISendReceiveAddress;
}

export interface ISendReceiveAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IVirtualCardTxn {
  card_id: string;
  response: string;
  card_number: string;
  merchant: IMerchant;
  billing_amount: string;
  billing_currency_code: string;
  transaction_date_time: string;
  issuer_response: string;
  bank_net_reference_num: string;
  txn_ref_number: string;
  description?: string;
  txn_date?: string;
  status?: string;
}

export interface IMerchant {
  merchant_id: string;
  merchant_name: string;
  merchant_city: string;
  merchant_state: string;
  merchant_currency_code: string;
  merchant_amount: string;
  merchant_category_code: string;
  merchant_category: string;
}

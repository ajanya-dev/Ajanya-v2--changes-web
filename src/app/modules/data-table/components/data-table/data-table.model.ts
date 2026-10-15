export interface IPaymentLinksTableRes {
  id: string;
  name: string;
  bank_account_account_name: string;
  short_url: string;
  bank_account_nick_name: string;
  is_active: number;
  redirect_url: string;
  form_templete_id: number;
  bank_name: string;
  payment_option_as_array: { [key: string]: { status: string; id: string } };
  bank_account: string;
  enid: string;
  link: string;
}

export interface IPaymentLinksCustomTableRes {
  id: string;
  created_at: string;
  amount: string;
  slugurl: string;
  nickname: string;
  months: number;
  is_recurring: number;
  start_date: string;
  created_at_formated: string;
  transaction_count: number;
  is_single_use: number;
}

export type TPaymentLinksCRUpdateData = Omit<
  IPaymentLinksCustomTableRes,
  'is_recurring' | 'start_date'
> & {
  isRecurring: boolean;
  startDate: string;
};

export interface IPaymentLinksListItem {
  id: string;
  name: string;
  shortUrl: string;
  isActive: number;
  redirectUrl: string | null;
  enid: string;
  link: string;
  logoUrl: string | null;
  companyName: string | null;
  stripeCredentials: string | null;
  paypalCredentials: string | null;
  bitpayCredentials: string | null;
  stripeCheckoutCredentials: string | null;
  isPaused: number | null;
  expiryStatus:string | null;
  paymentOptionAsArray: Record<
    `${number}`,
    { status: number | string; id: number | string }
  > | null;
  bankAccount: {
    bankAccountId: string;
    bankAccountAccountName: string | null;
    bankAccountNickName: string | null;
    bankName: string;
    bankAccount: string;
  };
  isArchived?: boolean;
}

export type SelectedPaymentLink = IPaymentLinksListItem & {
  creditCardFormToken: string | null;
};

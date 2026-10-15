export interface ICheckRecurringPayeeDetails {
  heading: string;
  payeeName: string;
  payeeEmail: string;
  address: {
    payeeName: string;
    addressLine1: string;
    payeeCity: string;
    payeeState: string;
    payeeZip: string;
    payeeCountry: string;
  };
}

export interface ICheckRecurringAch {
  status: string;
  amount: string;
  frequency: string;
  startDate: string;
  endDate: string;
  ofPay: number;
  ofPaid: number;
  ofLeft: string;
  payingFrom: string;
  memo: string;
  isItUnlimited: number;
  isItSendOrReceived: number;
  completedCount: number;
  failedCount: number;
  isBankDeleted: boolean;
  isPayeeDeleted: boolean;
}

export interface ICheckRecurringEventDetails {
  recurringDate: string;
  id: string;
  checkId: string;
  amount: string;
  status: string;
  canRetry: boolean;
}

export interface ICheckMailingRecurringJob {
  enc_id: string;
  date: string;
  status: string;
  canRetry: boolean;
}

export interface ICheckMailingRecurringDetails {
  checks: IRecurringCheck;
  job: ICheckMailingRecurringJob[];
  cancelledDate: string;
  isBankDeleted: boolean;
  isPayeeDeleted: boolean;
}

export interface IRecurringCheck {
  status: string;
  rrule_freq: string;
  remaining: number;
  completed: number;
  is_it_unlimited: number;
  total: number;
  start_date: string;
  cheque_serial_number: string;
  cheque_issue_date: string;
  cheque_account_number: string;
  cheque_invoice_number: string;
  cheque_memo: string;
  cheque_notes: string;
  cheque_amount: string;
  bank_account_account_name: string;
  bank_account_account_number: string;
  payee_name: string;
  payee_email: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_country: string;
  encrypted_id: string;
}

export interface IAchRecurringTableRow {
  id: string;
  recurring_base_data_id: number;
  created_for_id: number;
  created_by_id: number;
  recurring_for_id: number;
  sender_id: number;
  receiver_id: number;
  sender_payee_id: number;
  receiver_payee_id: unknown;
  sender_bank_account_id: number;
  receiver_bank_account_id: unknown;
  rrule: {
    FREQ: string;
    INTERVAL: number;
    DTSTART: string;
    WKST: string;
  };
  start_date: string;
  end_date: string;
  is_it_unlimited: number;
  total: number;
  completed: number;
  remaining: number;
  timezone: string;
  rrule_freq: string;
  rrule_interval: number;
  status: number;
  deleted_at: unknown;
  created_at: string;
  updated_at: string;
  recurrable_type: string;
  status_details: string;
  payee_details: unknown;
  bank_details: unknown;
  is_it_is_send_or_received: number;
  doner_payee_details: unknown;
  doner_bank_account_details: unknown;
  recurring_base_data: {
    id: number;
    recurrable_type: string;
    recurrable_id: number;
    amount: string;
    memo: string;
    json_data: {
      check_id: number;
      sender_bank_account_id: number;
      sender_payee_id: number;
      amount: string;
      memo: string;
      sender_id: number;
      receiver_id: number;
      created_for_id: number;
      created_by_id: number;
      directDepositData: {
        checkId: string;
        payeeEmail: string;
        payeeAccount: string;
        isReceiverWalletByPassingEnabled: string;
        attachments: string[];
      };
      recurring: {
        frequency: number;
        start_date: string;
        end_select: string;
        count: number;
      };
    };
    deleted_at: string;
    created_at: string;
    updated_at: string;
  };
  from: string;
  payment_type: number;
}

export interface ICheckRecurringAuditTrialTable {
  date: string;
  status: string;
  ip: string;
  ipOrLocation?: string;
  by?: string;
  note: string;
}

export interface IGiftCardRecurringDetails {
  status: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string;
  ofPay: number;
  ofPaid: number;
  ofLeft: number | string;
  nameOnCard: string;
  rechargeType: string;
  failedCount: number;
  completedCount: number;
  isItUnlimited: number;
  isItSendOrReceived: number;
  isPayeeDeleted: boolean;
  isCardCancelled: boolean;
  cardType: string;
}

export interface ICheckRecurringTableRow {
  id: number;
  check_id: number;
  created_for_id: number;
  rrule: string;
  start_date: string;
  end_date: string;
  is_it_unlimited: number;
  total: number;
  completed: number;
  check_timezone: string;
  remaining: number;
  rrule_freq: string;
  rrule_interval: number;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  payee_name: string;
  bank_account_account_name: string;
  encrypted_id: string;
  action: string;
}

export interface ICheckAchRecurringComments {
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

export interface IGiftCardRecurringComment {
  id: number;
  comments: string;
  user_name: string;
  commentable_id: number;
  commentable_type: string;
  created_at: string;
  /** Both are returned by /gift-card-recurring/{id}/comments but were not typed. */
  formated_date?: string;
  encrypted_id?: string;
}

export interface IGiftCardRecurringTableRow {
  action: string;
  name_on_card: string;
  amount: number;
  rrule_freq: string;
  rrule_interval: number;
  start_date: string;
  end_date: string;
  card_type: string;
  total: number;
  completed: number;
  remaining: number;
  is_it_unlimited: number;
  status: number;
}

export interface IGatPaidCheckRecurring {
  id: number;
  check_id: string;
  created_for_id: number;
  rrule: string;
  start_date: string;
  end_date?: string;
  is_it_unlimited: number;
  total: number;
  completed: number;
  check_timezone: string;
  remaining: string;
  rrule_freq: string;
  rrule_interval: number;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  cheque_amount: string;
  memo: string;
  payee_name: string;
  encrypted_id: string;
}

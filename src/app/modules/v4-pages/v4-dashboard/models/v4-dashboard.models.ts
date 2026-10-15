export interface IWalletDetails {
  current_wallet_balance: string;
  growth_or_loss_percentage: {
    previous_balance: string;
    current_balance: string;
    percentage: string;
  };
}

export interface IRecentTransaction {
  id: string;
  uu_id: string;
  amount: string;
  status: number;
  status_description: string;
  created_at: string;
  updated_at?: string;
  received_type?: number;
  transfer_mode: number;
  transfer_mode_name: string;
  reference_no: string;
  description: string;
  payee_name: string;
  payee_nick_name: string;
  transaction_type: string;
  type: string;
  transfer_type?: string;
  check_status?: number;
  check_from_name?: string;
  sender_email?: string;
  sender_phone?: string;
  sender_address_line_1?: string;
  sender_city?: string;
  sender_state?: string;
  sender_zip?: string;
  source: {
    source: string;
    name: string;
    source_id: string;
  };
  invoice_data?: {
    paid: string;
    is_emailed: number;
    is_mailed: number;
    balance: string;
  };
}

export interface IDashboardTransaction {
  id: number;
  title: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  method: string;
  reference: string;
}

export interface IScheduledPayment {
  payee_name: string;
  amount: string;
  payment_type: string;
  start_date: string;
  end_date: string;
}

export interface IScheduledPaymentsCount {
  scheduled_payments: IScheduledPayment[];
  ach_scheduled_count: number;
  email_check_scheduled_count: number;
  mailed_check_scheduled_count: number;
  total_scheduled_count: number;
}

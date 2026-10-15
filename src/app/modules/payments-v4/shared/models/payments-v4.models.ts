export interface IPaymentOutQuickCards {
  total: { amount: number; count: number };
  processing: { amount: number; count: string };
  completed_today: { amount: number; count: string };
  group_payments_count?: number;
}

export interface IPayablesStats {
  total_sent: number;
  active_vendors: number;
  pending_bills: number;
  scheduled_payments: number;
}

export interface IReceivablesStats {
  total_received: number;
  active_customers: number;
  outstanding_invoices: number;
  payment_links: number;
}

export interface IPaymentShortCutsDetails {
  id: number;
  created_for_id: number;
  payment_shortcuts: IPaymentShortcuts;
  created_at: string;
  updated_at: string;
}

interface IPaymentShortcuts {
  check?: boolean;
  bill?: boolean;
  invoice?: boolean;
  bank?: boolean;
  payee?: boolean;
}

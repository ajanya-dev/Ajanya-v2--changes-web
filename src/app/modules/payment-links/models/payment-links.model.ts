export type BannerDataInput = {
  amount: number;
  companyName: string;
  logo?: File | string;
};

export type PaymentsDetailsInput = {
  companyNameNeeded: boolean;
  creditCard: boolean;
  card: boolean;
  paypal: boolean;
  bitpay: boolean;
  stripe: boolean;
};

export type PaymentLinksMethods =
  | 'CHECK'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PAYPAL'
  | 'BITPAY'
  | 'STRIPE';

  export interface IPaymentData {
    stripe_payments: IPayment[];
    paypal_payments: IPayment[];
    bitpay_payments: IPayment[];
    stripe_checkout_payments: IPayment[];
  }
  
  export interface IPayment {
    id: number;
    nickName: string;
    uuid: string;
    credentialType: string;   // "sandbox" | "live"
  }

  export interface IPaymentLinkAuditTrail {
    id: string;
    user: string;
    action: string;       // e.g. "Paused", "Unpaused", "Created"
    changes: string[];
    ipAddress: string;
    deviceInfo: string;
    userAgent: string;
    createdAt: string;     // ISO date string
    formattedDate: string; // pre-formatted e.g. "08/07/2026 - 10:45 am"
  }

  export function getChangedFields(changes: string[]): string {
    return changes.length ? changes.join(', ') : '-';
  }

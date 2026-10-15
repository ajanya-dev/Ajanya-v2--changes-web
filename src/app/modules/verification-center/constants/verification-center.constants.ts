export const VERIFICATION_CARDS = {
  CHECK: 'check',
  CREDIT_CARD: 'payByCreditCard',
  DIGITAL_PAYMENT: 'digitalPayment',
  BOOK_A_DEMO: 'bookDemo'
} as const;

export type CardTypes = 'check' | 'card' | 'payment' | 'demo';

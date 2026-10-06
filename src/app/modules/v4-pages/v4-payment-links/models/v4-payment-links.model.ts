export type PaymentLinkStatus = 'active' | 'paused' | 'expired';

export function getPaymentLinkStatus(
  item: { isPaused: number | null; expiryStatus: string | null }
): PaymentLinkStatus {
  if (item.expiryStatus === 'expired') return 'expired';
  if (item.isPaused === 1) return 'paused';
  return 'active';
}

export const STATUS_CONFIG: Record<PaymentLinkStatus, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: 'Active', color: 'var(--v4-badge-success-text-color)', bg: 'var(--v4-badge-success-bg-color)', dot: 'var(--v4-common-green-color)' },
  paused: { label: 'Disabled', color: 'var(--v4-badge-error-text-color)', bg: 'var(--v4-badge-error-bg-color)', dot: 'var(--v4-common-red-color)' },
  expired: { label: 'Expired', color: 'var(--v4-badge-error-text-color)', bg: 'var(--v4-badge-error-bg-color)', dot: 'var(--v4-common-red-color)' }
};

export type PaymentLinksMethods =
  | 'CHECK'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PAYPAL'
  | 'BITPAY'
  | 'STRIPE';

export const PAYMENT_METHOD_CONFIG: Record<PaymentLinksMethods, { label: string; color: string; bg: string; iconBg: string; iconText: string; iconChar: string }> = {
  CHECK: { label: 'CHECK', color: 'text-v4-main-text-color', bg: 'bg-v4-tertiary-background-color', iconBg: 'bg-[#00a5b2]', iconText: 'text-[#004a7c]', iconChar: '✓' },
  CREDIT_CARD: { label: 'CREDIT CARD', color: 'text-v4-main-text-color', bg: 'bg-v4-tertiary-background-color', iconBg: 'bg-[#1A1F71]', iconText: 'text-white', iconChar: 'C' },
  DEBIT_CARD: { label: 'DEBIT CARD', color: 'text-v4-main-text-color', bg: 'bg-v4-tertiary-background-color', iconBg: 'bg-[#635BFF]', iconText: 'text-white', iconChar: 'D' },
  PAYPAL: { label: 'PAYPAL', color: 'text-v4-main-text-color', bg: 'bg-v4-tertiary-background-color', iconBg: 'bg-[#003087]', iconText: 'text-white', iconChar: 'P' },
  BITPAY: { label: 'BITPAY', color: 'text-v4-main-text-color', bg: 'bg-v4-tertiary-background-color', iconBg: 'bg-[#1A3B5D]', iconText: 'text-white', iconChar: 'B' },
  STRIPE: { label: 'STRIPE CHECKOUT', color: 'text-v4-main-text-color', bg: 'bg-v4-tertiary-background-color', iconBg: 'bg-[#635BFF]', iconText: 'text-white', iconChar: 'S' }
};

export type V4PaymentLinkTab = 'sub-links' | 'dynamic-iframe' | 'ecommerce';

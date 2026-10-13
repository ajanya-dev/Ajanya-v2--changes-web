export type StepStatus =
  | 'completed'
  | 'current'
  | 'locked'
  | 'pending'
  | 'under-review'
  | 'action-required';

/** Backend-raised compliance cases that reopen an approved business step. */
export type ActionCaseKind = 'edd' | 'rerun' | 'missing';

export type VerificationStepKey = 'account-setup' | 'bank-verification' | 'business-verification';

export const COMPLETION_LABELS = [
  { label: 'Email Verified', key: 'isEmailVerificationDone' },
  { label: 'Phone Verified', key: 'isPhoneVerificationDone' },
  { label: 'Business Verified', key: 'isKybStatusDone' }
] as const;

import { computed, effect, Injectable, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import type { IPayeeBankDetails, IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import type { IDefaultPayment, IPaymentDetails, IPaymentFeeDetails } from 'src/app/modules/payments/model/payments';
import type { IWalletData, IWalletInternationaPaymentCreate } from 'src/app/models/wallet';
import {
  PaymentMethod,
  PaymentSource,
  SendPaymentMode,
  SendPaymentStep
} from '../models/send-payment.enums';
import type {
  IPaymentMethodConfig,
  IPaymentSourceConfig,
  ISendPaymentForm,
  SourceAccount
} from '../models/send-payment.models';
import { SendPaymentTypeConfig } from '../models/payment-type-config';

/** Signal-based state for the Send Payment flow. Scoped per modal instance. */
@Injectable()
export class SendPaymentStateService {
  // ── Core selections ──
  readonly mode = signal<SendPaymentMode>(SendPaymentMode.Create);
  /** ID of the check being edited — set when loading a payment in Edit mode */
  readonly currentCheckId = signal<string>('');
  /** Raw payment details loaded during Edit/Clone — used by export check */
  readonly paymentDetails = signal<IPaymentDetails | null>(null);
  /** Set from the header: approval policy is on for this user (see send-payments-main) */
  readonly isApprovalPolicyEnabled = signal(false);

  /**
   * True when an already-approved payment is opened for editing under an active
   * approval policy. The payment has already passed approval, so its details
   * must not be modified — only the Confirm Payment action stays available.
   */
  readonly isApprovedReadOnly = computed(
    () =>
      this.isApprovalPolicyEnabled() &&
      this.mode() === SendPaymentMode.Edit &&
      this.paymentDetails()?.status?.toLowerCase() === 'approved'
  );
  readonly selectedSource = signal<PaymentSource | null>(null);
  readonly selectedMethod = signal<PaymentMethod | null>(null);
  readonly selectedSourceAccount = signal<SourceAccount | null>(null);
  readonly selectedPayee = signal<IPayeeDropdown | null>(null);
  readonly selectedPayeeBank = signal<IPayeeBankDetails | null>(null);
  /** Increment to force PaymentsPayeeBankListComponent to reload after an external bank edit */
  readonly bankListReloadTrigger = signal(0);
  /** Increment to trigger inline payee edit from the right panel */
  readonly triggerPayeeEdit = signal(0);
  readonly amount = signal<number>(0);
  readonly noAmountActive = signal(false);
  readonly noPayeeActive = signal(false);

  readonly shippingType = signal<string | null>(null);
  /** Tracks the user's "Insert to check" choice from the remittance modal. */
  readonly remittanceInsertToCheck = signal(false);
  /** Form snapshot after edit prefill; used to skip updateCheck when nothing has changed. */
  readonly editFormSnapshot = signal<Record<string, unknown> | null>(null);

  // ── Fee state ──
  readonly feeDetails = signal<IPaymentFeeDetails | null>(null);
  readonly feeLoading = signal(false);
  readonly feeError = signal(false);
  readonly feeLabels = signal<{ fee1Label: string; fee2Label?: string }>({ fee1Label: 'Transaction fee' });

  // ── International quote state (set by InternationalDetailsComponent) ──
  readonly internationalQuote = signal<IWalletInternationaPaymentCreate | null>(null);
  readonly internationalQuoteLoading = signal(false);
  readonly internationalCurrencyName = signal<string>('');

  // ── Delivery tracking ──
  /** Tracks mail delivery success via CheckService.checkMailEvents */
  readonly mailDeliverySuccess = signal(false);
  readonly mailEmailInfo = signal<
    | {
        emailType?: 'immediate' | 'recurring' | 'scheduled';
        scheduledDate?: string;
        recurringDetails?: {
          frequency: string;
          startDate: string;
          endCriteria: string;
        };
      }
    | undefined
  >(undefined);
  /** Emitted when the entire post-payment delivery phase completes */
  readonly deliveryComplete$ = new Subject<'done' | 'new'>();

  // ── UI state ──
  readonly submitting = signal(false);
  readonly showButtonLoader = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(false);

  // ── Payment sources config ──
  readonly paymentSources = signal<IPaymentSourceConfig[]>(
    SendPaymentTypeConfig.getPaymentSources()
  );

  // ── Disabled method IDs (populated from PaymentTypeAccessService) ──
  readonly disabledMethodIds = signal<Set<string>>(new Set());

  // ── Default payment (loaded from backend for gear icon & auto-select) ──
  readonly defaultPayment = signal<IDefaultPayment | null>(null);
  /** Incremented when defaults are updated via the gear-icon modal so the form can re-apply memo */
  readonly defaultPaymentUpdated = signal(0);

  // ── KYC/KYB status ──
  readonly userKycStatus = signal<number | null>(null);
  readonly userKybStatus = signal<number | null>(null);

  // ── User email/phone verification status ──
  readonly isUserVerified = signal(true);

  // ── Computed: sources locked by verification level ──
  readonly verificationLockedSources = computed<Set<PaymentSource>>(() => {
    // Unverified (email/phone not done) → lock Wallet + CreditCard
    if (!this.isUserVerified()) {
      return new Set([PaymentSource.Wallet, PaymentSource.CreditCard]);
    }
    const kybStatus = this.userKybStatus();
    // Approved (2) or Under Review (1) → allow Wallet + CreditCard
    if (kybStatus === 2 || kybStatus === 1) return new Set();
    // Not started (0), failed (3), or null → lock
    return new Set([PaymentSource.Wallet, PaymentSource.CreditCard]);
  });

  // ── Computed: methods locked by verification level ──
  readonly verificationLockedMethods = computed<Set<PaymentMethod>>(() => {
    if (!this.isUserVerified()) {
      // Unverified → only CheckPrint allowed, lock everything else
      return new Set([
        PaymentMethod.Check,
        PaymentMethod.CheckMail,
        PaymentMethod.CheckEmail,
        PaymentMethod.ACH,
        PaymentMethod.SameDayACH,
        PaymentMethod.Wire,
        PaymentMethod.VirtualCard,
        PaymentMethod.RTP,
        PaymentMethod.InternationalPayment,
        PaymentMethod.LetPayeeChoose
      ]);
    }
    return new Set();
  });

  // ── Card maintenance message ──
  readonly cardMaintenanceMessage = signal<string>('');

  // ── Computed: KYC banner for credit card ──
  readonly creditCardKycMessage = computed<string | null>(() => {
    const source = this.selectedSource();
    const kycStatus = this.userKycStatus();
    if (source !== PaymentSource.CreditCard) return null;

    if (kycStatus === null || kycStatus === undefined) {
      return 'Please verify your identity to proceed with credit card payment. Contact support for further details.';
    }
    if (kycStatus === 1) {
      return 'Your application for personal verification is under review, hence you can\'t proceed with credit card payment. Please contact support for further details.';
    }
    if (kycStatus === 3) {
      return 'Your personal verification has failed, hence you can\'t proceed with credit card payment. Please contact support for further details.';
    }
    return null;
  });

  readonly isCreditCardBlocked = computed<boolean>(() => {
    return !!this.creditCardKycMessage();
  });

  isInternationalAmountOverWalletBalance(amount: number): boolean {
    if (
      this.selectedSource() !== PaymentSource.Wallet ||
      this.selectedMethod() !== PaymentMethod.InternationalPayment
    ) {
      return false;
    }
    const wallet = this.selectedSourceAccount() as IWalletData | null;
    if (!wallet || amount <= 0) return false;
    const balance = Number(
      String(wallet.availableBalance ?? '0').replace(/[$,]/g, '')
    );
    return !isNaN(balance) && amount > balance;
  }

  readonly internationalInsufficientBalance = computed<boolean>(() =>
    this.isInternationalAmountOverWalletBalance(this.amount())
  );

  // True when the current source/method combo blocks frozen payees:
  // Bank → ACH/SameDayACH/LetPayeeChoose; Wallet/CreditCard → all except RTP/International; Cloud → never.
  // International Payment is exempt to match the v3 international flow, which never blocks frozen payees.
  readonly isFreezeBlockedRail = computed<boolean>(() => {
    const source = this.selectedSource();
    const method = this.selectedMethod();
    if (!source) return false;
    if (source === PaymentSource.CloudBank) return false;
    if (method === PaymentMethod.RTP) return false;
    if (method === PaymentMethod.InternationalPayment) return false;
    if (source === PaymentSource.BankAccount) {
      return (
        method === PaymentMethod.ACH ||
        method === PaymentMethod.SameDayACH ||
        method === PaymentMethod.LetPayeeChoose
      );
    }
    return true;
  });

  constructor() {
    effect(() => {
      if (!this.submitting()) this.showButtonLoader.set(false);
    }, { allowSignalWrites: true });
  }

  // ── Computed: current progressive disclosure step ──
  readonly currentStep = computed<SendPaymentStep>(() => {
    if (this.amount() <= 0) return SendPaymentStep.Amount;
    if (!this.selectedPayee()) return SendPaymentStep.Payee;
    if (!this.selectedSource()) return SendPaymentStep.Source;
    if (!this.selectedMethod()) return SendPaymentStep.Method;
    if (!this.selectedSourceAccount()) return SendPaymentStep.SourceAccount;
    return SendPaymentStep.Details;
  });

  // ── Computed: available methods for selected source ──
  readonly availableMethods = computed<IPaymentMethodConfig[]>(() => {
    const source = this.selectedSource();
    if (!source) return [];

    const sourceConfig = this.paymentSources().find((s) => s.id === source);
    if (!sourceConfig) return [];

    const disabledIds = this.disabledMethodIds();
    return sourceConfig.methods.map((method) => {
      const isSelectable = method.isSelectable && !disabledIds.has(method.id);
      return {
        ...method,
        isSelectable,
        processingTime: SendPaymentTypeConfig.getProcessingTime(source, method.id) || method.processingTime
      };
    });
  });

  // ── Computed: section visibility flags ──
  readonly showPayeeSection = computed(() => this.amount() > 0 || this.noAmountActive() || !!this.selectedPayee());

  readonly showSourceSection = computed(() => !!this.selectedPayee());

  readonly showMethodSection = computed(() => !!this.selectedPayee());

  readonly showSourceAccountSection = computed(
    () => !!this.selectedSource()
  );

  readonly showDetailsSection = computed(
    () => !!this.selectedPayee() && !!this.selectedSourceAccount() && !!this.selectedMethod()
  );

  readonly showFeeSection = computed(
    () => !!this.feeDetails() || this.feeLoading()
  );

  // ── Computed: active details component type based on source + method ──
  readonly activeDetailsType = computed<string | null>(() => {
    const source = this.selectedSource();
    const method = this.selectedMethod();
    if (!source || !method) return null;

    const map: Record<string, string> = {
      [`${PaymentSource.BankAccount}:${PaymentMethod.Check}`]: 'check',
      [`${PaymentSource.BankAccount}:${PaymentMethod.ACH}`]: 'ach',
      [`${PaymentSource.BankAccount}:${PaymentMethod.SameDayACH}`]: 'ach',
      [`${PaymentSource.BankAccount}:${PaymentMethod.Wire}`]: 'wire',
      [`${PaymentSource.BankAccount}:${PaymentMethod.VirtualCard}`]: 'virtual-card',
      [`${PaymentSource.BankAccount}:${PaymentMethod.RTP}`]: 'rtp',
      [`${PaymentSource.BankAccount}:${PaymentMethod.InternationalPayment}`]: 'international',
      [`${PaymentSource.BankAccount}:${PaymentMethod.LetPayeeChoose}`]: 'let-payee-choose',
      [`${PaymentSource.Wallet}:${PaymentMethod.LetPayeeChoose}`]: 'let-payee-choose',
      [`${PaymentSource.Wallet}:${PaymentMethod.CheckMail}`]: 'check-mail',
      [`${PaymentSource.Wallet}:${PaymentMethod.CheckPrint}`]: 'check-print',
      [`${PaymentSource.Wallet}:${PaymentMethod.CheckEmail}`]: 'check-email',
      [`${PaymentSource.Wallet}:${PaymentMethod.ACH}`]: 'ach',
      [`${PaymentSource.Wallet}:${PaymentMethod.SameDayACH}`]: 'ach',
      [`${PaymentSource.Wallet}:${PaymentMethod.Wire}`]: 'wire',
      [`${PaymentSource.Wallet}:${PaymentMethod.VirtualCard}`]: 'virtual-card',
      [`${PaymentSource.Wallet}:${PaymentMethod.RTP}`]: 'rtp',
      [`${PaymentSource.Wallet}:${PaymentMethod.InternationalPayment}`]: 'international',
      [`${PaymentSource.CreditCard}:${PaymentMethod.Check}`]: 'check-mail',
      [`${PaymentSource.CreditCard}:${PaymentMethod.CheckMail}`]: 'check-mail',
      [`${PaymentSource.CreditCard}:${PaymentMethod.CheckPrint}`]: 'check-print',
      [`${PaymentSource.CreditCard}:${PaymentMethod.ACH}`]: 'ach',
      [`${PaymentSource.CreditCard}:${PaymentMethod.SameDayACH}`]: 'ach',
      [`${PaymentSource.CreditCard}:${PaymentMethod.Wire}`]: 'wire',
      [`${PaymentSource.CreditCard}:${PaymentMethod.VirtualCard}`]: 'virtual-card',
      [`${PaymentSource.CreditCard}:${PaymentMethod.RTP}`]: 'rtp',
      [`${PaymentSource.CreditCard}:${PaymentMethod.LetPayeeChoose}`]: 'let-payee-choose'
    };

    return map[`${source}:${method}`] ?? null;
  });

  // ── Actions ──

  selectSource(source: PaymentSource): void {
    this.selectedSource.set(source);
    // Reset downstream selections
    this.selectedMethod.set(null);
    this.selectedSourceAccount.set(null);
    this.feeDetails.set(null);
  }

  selectMethod(method: PaymentMethod): void {
    this.selectedMethod.set(method);
    this.feeDetails.set(null);
  }

  selectSourceAccount(account: SourceAccount): void {
    this.selectedSourceAccount.set(account);
  }

  selectPayee(payee: IPayeeDropdown | null): void {
    const prevId = this.selectedPayee()?.id;
    this.selectedPayee.set(payee);
    // Only reset payee bank when actually switching to a different payee.
    // Re-selecting the same payee (e.g. after inline edit) preserves bank selection.
    if (payee?.id !== prevId) {
      this.selectedPayeeBank.set(null);
    }
    this.feeDetails.set(null);
  }

  setAmount(amount: number): void {
    this.amount.set(amount);
    if (amount <= 0) {
      this.feeDetails.set(null);
    }
  }

  /**
   * Pre-populate state from existing payment data (Edit/Clone).
   * Sets all signals without triggering cascade resets.
   */
  prePopulate(data: {
    source: PaymentSource;
    method: PaymentMethod;
    account: SourceAccount;
    payee: IPayeeDropdown;
    amount: number;
  }): void {
    this.selectedPayee.set(data.payee);
    this.amount.set(data.amount);
    this.selectedSource.set(data.source);
    this.selectedMethod.set(data.method);
    this.selectedSourceAccount.set(data.account);
  }

  /** Reset all state to initial values */
  reset(): void {
    this.mode.set(SendPaymentMode.Create);
    this.currentCheckId.set('');
    this.selectedSource.set(null);
    this.selectedMethod.set(null);
    this.selectedSourceAccount.set(null);
    this.selectedPayee.set(null);
    this.amount.set(0);
    this.noAmountActive.set(false);
    this.noPayeeActive.set(false);
    this.feeDetails.set(null);
    this.feeLoading.set(false);
    this.feeError.set(false);
    this.mailDeliverySuccess.set(false);
    this.mailEmailInfo.set(undefined);
    this.paymentDetails.set(null);
    this.submitting.set(false);
    this.showButtonLoader.set(false);
    this.saving.set(false);
    this.loading.set(false);
    this.remittanceInsertToCheck.set(false);
    this.editFormSnapshot.set(null);
  }

  /** Builds a canonical snapshot of form values for edit-mode change detection. */
  buildEditSnapshot(form: FormGroup<ISendPaymentForm>): Record<string, unknown> {
    const f = form.getRawValue();
    return {
      amount: f.amount,
      memo: f.memo,
      issueDate: f.issueDate,
      invoiceNumber: f.invoiceNumber,
      checkNumber: f.checkNumber,
      payeeIdNumber: f.payeeIdNumber,
      noAmount: f.noAmount,
      noSign: f.noSign,
      noPayee: f.noPayee,
      noDate: f.noDate,
      categoryId: (f.category as { id?: string } | null)?.id ?? null,
      payeeId: this.selectedPayee()?.id ?? null,
      sourceId: (this.selectedSourceAccount() as { id?: string } | null)?.id ?? null,
      commentIds: JSON.stringify(f.commentIds ?? []),
      attachmentIds: JSON.stringify(f.attachmentIds ?? []),
      remittance: JSON.stringify(f.remittance ?? []),
      remittanceType: f.remittanceType
    };
  }

  /** True when a snapshot exists and the form hasn't changed since edit load. */
  isEditFormUnchanged(form: FormGroup<ISendPaymentForm>): boolean {
    const snapshot = this.editFormSnapshot();
    if (!snapshot) return false;
    const current = this.buildEditSnapshot(form);
    return Object.keys(snapshot).every(
      (key) => snapshot[key] === current[key]
    );
  }
}

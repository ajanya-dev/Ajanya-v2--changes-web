import { Component, inject, signal, output, type Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  LucideAngularModule,
  X,
  Paperclip,
  TriangleAlert,
  ArrowRight,
  Wallet
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CheckPreviewV4Component } from 'src/app/shared/V4/for-side-drawer/check-preview-v4/check-preview-v4.component';
import { SendPaymentTypeConfig } from 'src/app/modules/payments-v4/send-payment/models/payment-type-config';
import {
  PaymentSource,
  PaymentMethod
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import type { IReceiveCheckDetails } from 'src/app/modules/receive-payments/model/ReceivePayment';
import type { IPaymentConfirmationV4Data } from 'src/app/modules/payments-v4/shared/modals/payment-confirmation-modal-v4/payment-confirmation-modal-v4.component';

/**
 * What this modal renders on top of the shared confirmation payload: the check
 * preview, the per-attachment delivery list and the pre-computed totals. They
 * live here rather than on the shared interface because only this modal reads
 * them.
 */
export interface IConfirmPaymentModalData extends IPaymentConfirmationV4Data {
  attachments?: { id: string; name: string; pageCount?: number }[];
  attachmentsChannel?: 'mail' | 'email' | 'ach' | null;
  attachmentsDefaultChecked?: boolean;
  attachmentsChecked?: string[];
  checkPreviewData?: unknown;
  /**
   * The check design, as a signal: the dialog opens at once and the design
   * arrives after it. Absent on callers that do not preview a check.
   */
  checkPreviewTemplateSignal?: Signal<string | null>;
  checkPreviewLoadingSignal?: Signal<boolean>;
  mailingCost?: number;
  /** What that charge is called. The endpoint names it on the rails that have one. */
  mailingCostLabel?: string;
  serviceFeeDisplay?: string;
  /** What that fee is for. Defaults to the generic name when nobody says. */
  serviceFeeLabel?: string;
  total?: number;
  payeeEmail?: string;
  walletFallback?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-confirm-payment-modal',
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CheckPreviewV4Component
  ],
  styleUrls: ['./confirm-payment-modal.component.scss'],
  templateUrl: './confirm-payment-modal.component.html'
})
export class ConfirmPaymentModalComponent {
  readonly data: IConfirmPaymentModalData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmPaymentModalComponent>);

  readonly XIcon = X;
  readonly PaperclipIcon = Paperclip;
  readonly WarningIcon = TriangleAlert;
  readonly ArrowRightIcon = ArrowRight;
  readonly WalletIcon = Wallet;

  readonly isProcessing = signal(false);
  readonly confirmed = output<void>();

  /** A request rather than a payment; the copy and the hero flip with it. */
  get isReceive(): boolean {
    return this.data.mode === 'receive';
  }

  get title(): string {
    return this.isReceive ? 'Confirm Payment Request' : 'Confirm Payment';
  }

  get actionButtonText(): string {
    if (this.isReceive) {
      return 'Send Request';
    }
    // A card is not sent from here — it goes on to the authorization gates, and
    // "Confirm Payment" on a button that only opens another one reads as the
    // last step when it is the second of five.
    return this.data.source === PaymentSource.CreditCard
      ? 'Continue'
      : 'Confirm Payment';
  }

  get hasRecurringDetails(): boolean {
    return !!this.data.recurringDetails?.is_recurring_value;
  }

  get formattedFrequency(): string {
    const frequency = this.data.recurringDetails?.recurring?.frequency;
    if (!frequency) return '';
    const labels: Record<string, string> = {
      1: 'Daily',
      2: 'Weekly',
      3: 'Monthly',
      5: 'Biweekly',
      6: 'Bimonthly',
      7: 'Quarterly'
    };
    return labels[frequency] ?? `Every ${frequency} days`;
  }

  get formattedStartDate(): string {
    const start = this.data.recurringDetails?.recurring?.start_date;
    return start ? new Date(start).toLocaleDateString() : '';
  }

  get formattedPayUntil(): string {
    const recurring = this.data.recurringDetails?.recurring;
    if (!recurring?.count || !recurring?.end_select) return '';
    if (recurring.end_select !== '1') return 'No end date';
    const count = parseInt(recurring.count, 10);
    return `${count} payment${count > 1 ? 's' : ''}`;
  }

  private readonly shippingTimings: Record<string, string> = {
    USPS_FIRST_CLASS_MAIL: '1-5 business days',
    USPS_FIRST_CLASS_WITH_TRACKING: '1-5 business days',
    USPS_PRIORITY_MAIL: '1-3 business days',
    FEDEX_NEXT_DAY_PM: '1 business day',
    USPS_EXPRESS_MAIL: '2 business days',
    'First Class Canada': '1-5 business days',
    'Fed Ex Overnight': '1 business day',
    'Fed Ex Overnight Canada': '1 business day',
    'First class international': '7-21 business days',
    'Fed Ex International': '3-5 business days'
  };

  get shippingType(): string {
    return this.data.shippingType
      ? this.data.shippingType.replace(/_/g, ' ')
      : '';
  }

  private timingFor(shippingType: string): string {
    if (!shippingType) return '';
    if (this.shippingTimings[shippingType])
      return this.shippingTimings[shippingType];
    const norm = (s: string) => s.toUpperCase().replace(/[\s_]+/g, '_');
    const key = norm(shippingType);
    const hit = Object.entries(this.shippingTimings).find(
      ([k]) => norm(k) === key
    );
    return hit ? hit[1] : '';
  }

  get estimatedTime(): string {
    // A mailed cheque leaves when it is posted and arrives when the carrier
    // brings it, and the two tables that answer for it are keyed differently and
    // maintained by hand — so it says nothing here rather than a figure it
    // cannot stand behind.
    if (this.data.method === PaymentMethod.CheckMail) {
      return '';
    }

    const carrierTiming = this.timingFor(this.data.shippingType ?? '');
    if (carrierTiming) return carrierTiming;
    if (this.data.processingTimeOverride)
      return this.data.processingTimeOverride;
    if (this.data.source && this.data.method) {
      return SendPaymentTypeConfig.getProcessingTime(
        this.data.source,
        this.data.method
      );
    }
    return '';
  }

  get isCheckMethod(): boolean {
    return (
      this.data.method === PaymentMethod.Check ||
      this.data.method === PaymentMethod.CheckMail ||
      this.data.method === PaymentMethod.CheckPrint ||
      this.data.method === PaymentMethod.CheckEmail
    );
  }

  get checkData(): IReceiveCheckDetails | null {
    return (this.data.checkPreviewData as IReceiveCheckDetails | null) ?? null;
  }

  get checkTemplateJson(): string | null {
    return this.data.checkPreviewTemplateSignal?.() ?? null;
  }

  get checkPreviewLoading(): boolean {
    return this.data.checkPreviewLoadingSignal?.() ?? false;
  }

  get sourceLabel(): string {
    switch (this.data.source) {
      case PaymentSource.Wallet:
        return 'Wallet';
      case PaymentSource.CreditCard:
        return 'Credit Card';
      default:
        return 'Bank Account';
    }
  }

  get paymentMethodLabel(): string {
    if (this.data.paymentMethodLabelOverride)
      return this.data.paymentMethodLabelOverride;
    switch (this.data.method) {
      case PaymentMethod.ACH:
        return 'ACH / Direct Deposit';
      case PaymentMethod.SameDayACH:
        return 'Same Day ACH';
      case PaymentMethod.Wire:
        return 'Wire Transfer';
      case PaymentMethod.VirtualCard:
        return 'Virtual Card';
      case PaymentMethod.RTP:
        return 'Real Time Instant Payment';
      case PaymentMethod.InternationalPayment:
        return 'International Payment';
      case PaymentMethod.CheckMail:
        return 'Check · Mail';
      case PaymentMethod.CheckPrint:
        return 'Check · Print';
      case PaymentMethod.CheckEmail:
        return 'Check · Email (eCheck)';
      case PaymentMethod.Check:
        return 'Check';
      case PaymentMethod.LetPayeeChoose:
        return 'Let The Vendor Decide';
      default:
        return String(this.data.paymentMethod ?? '');
    }
  }

  get formattedAmount(): string {
    const num = Number(this.data.amount);
    return Number.isNaN(num) ? String(this.data.amount) : num.toFixed(2);
  }

  get mailingCost(): number {
    return Number(this.data.mailingCost) || 0;
  }

  get showFees(): boolean {
    return Number(this.data.amount) > 0;
  }

  get totalDisplay(): number {
    if (this.data.total != null) return Number(this.data.total);
    return Number(this.data.amount) + this.mailingCost;
  }

  get showUnverifiedBankWarning(): boolean {
    // With no bank account at all there is nothing to verify — the wallet
    // notice is the one that applies, and both at once contradict each other.
    return this.data.isPayeeBankVerified === false && !this.showWalletFallbackNotice;
  }

  /**
   * An ACH with no payee bank account still goes out — the money is credited to
   * the payee's wallet. Unsaid, the user has no way to know where it landed.
   */
  get showWalletFallbackNotice(): boolean {
    return this.data.walletFallback === true;
  }

  onConfirm(): void {
    this.isProcessing.set(true);
    this.confirmed.emit();
  }

  onCancel(): void {
    if (this.isProcessing()) return;
    this.dialogRef.close(false);
  }
}

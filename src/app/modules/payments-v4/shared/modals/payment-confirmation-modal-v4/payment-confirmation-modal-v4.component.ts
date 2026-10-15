import { Component, inject, OnInit, ViewEncapsulation, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X, CircleCheckBig, Info, TriangleAlert } from 'lucide-angular';
import { IRecurringDetails } from 'src/app/modules/payments/model/payments';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { SendPaymentTypeConfig } from 'src/app/modules/payments-v4/send-payment/models/payment-type-config';
import { PaymentSource, PaymentMethod } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';

export interface IPaymentConfirmationV4Data {
  mode: 'send' | 'receive';
  amount: string | number;
  // Receive payment fields
  from?: string;
  toBankAccount?: string;
  date?: string;
  // Send payment fields
  accNumber?: string;
  bankName?: string;
  payeeName?: string;
  paymentMethod?: string;
  type?: string;
  shippingType?: string;
  recurringDetails?: IRecurringDetails;
  /** Typed source for processing time lookup */
  source?: PaymentSource;
  /** Typed method for processing time lookup */
  method?: PaymentMethod;
  /** Overrides source+method time lookup (e.g. Bank+Check sub-delivery methods) */
  processingTimeOverride?: string;
  /** Overrides the computed payment method label (e.g. "White Check Print") */
  paymentMethodLabelOverride?: string;
  /** False when the payor bank requires the payee bank to be verified and it isn't — shows a warning. */
  isPayeeBankVerified?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-payment-confirmation-modal-v4',
  templateUrl: './payment-confirmation-modal-v4.component.html',
  styleUrls: ['./payment-confirmation-modal-v4.component.scss'],
  imports: [
    CommonModule,
    CommonButtonV4Component,
    LucideAngularModule
  ],
  encapsulation: ViewEncapsulation.None
})
export class PaymentConfirmationModalV4Component implements OnInit {
  data: IPaymentConfirmationV4Data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PaymentConfirmationModalV4Component>);

  readonly XIcon = X;
  readonly CircleCheckIcon = CircleCheckBig;
  readonly InfoIcon = Info;
  readonly WarningIcon = TriangleAlert;
  isProcessing = signal(false);
  confirmed = output<void>();

  /** Shipping type display string for Check Mail methods */
  private readonly shippingTimings: Record<string, string> = {
    'USPS_FIRST_CLASS_MAIL': '1-5 business days',
    'USPS_FIRST_CLASS_WITH_TRACKING': '1-5 business days',
    'USPS_PRIORITY_MAIL': '1-3 business days',
    'FEDEX_NEXT_DAY_PM': '1 business day',
    'USPS_EXPRESS_MAIL': '2 business days',
    'First Class Canada': '1-5 business days',
    'Fed Ex Overnight': '1 business day',
    'Fed Ex Overnight Canada': '1 business day',
    'First class international': '7-21 business days',
    'Fed Ex International': '3-5 business days'
  };

  estimatedTime = '';
  shippingType = '';

  ngOnInit() {
    if (this.data.mode === 'send') {
      this.getEstimatedTime();
    }
  }

  getEstimatedTime() {
    // Explicit override takes priority (e.g. Bank+Check sub-delivery methods)
    if (this.data.processingTimeOverride !== undefined) {
      this.estimatedTime = this.data.processingTimeOverride;
      return;
    }

    // If a shipping type is specified (Check Mail), use the shipping-specific timing
    if (this.data.shippingType) {
      this.shippingType = this.data.shippingType.replace(/_/g, ' ');
      this.estimatedTime = this.shippingTimings[this.data.shippingType] ?? '';
      return;
    }

    // Use the centralized config for source+method processing times
    if (this.data.source && this.data.method) {
      this.estimatedTime = SendPaymentTypeConfig.getProcessingTime(
        this.data.source,
        this.data.method
      );
      return;
    }

    this.estimatedTime = '';
  }

  get hasRecurringDetails(): boolean {
    return !!this.data?.recurringDetails?.is_recurring_value;
  }

  get formattedFrequency(): string {
    if (!this.data?.recurringDetails?.recurring?.frequency) return '';
    const { frequency } = this.data.recurringDetails.recurring;
    switch (frequency) {
      case '1':
        return 'Daily';
      case '2':
        return 'Weekly';
      case '3':
        return 'Monthly';
      case '5':
        return 'Biweekly';
      case '6':
        return 'Bimonthly';
      case '7':
        return 'Quarterly';
      default:
        return `Every ${frequency} days`;
    }
  }

  get formattedStartDate(): string {
    if (!this.data?.recurringDetails?.recurring?.start_date) return '';
    return new Date(
      this.data.recurringDetails.recurring.start_date
    ).toLocaleDateString();
  }

  get formattedPayUntil(): string {
    if (
      !this.data?.recurringDetails?.recurring?.count ||
      !this.data?.recurringDetails?.recurring?.end_select
    )
      return '';
    const count = parseInt(this.data.recurringDetails.recurring.count, 10);
    const endSelect = this.data.recurringDetails.recurring.end_select;
    if (endSelect === '1') {
      return `${count} payment${count > 1 ? 's' : ''}`;
    }
    return 'No end date';
  }

  get sourceLabel(): string {
    switch (this.data.source) {
      case PaymentSource.Wallet: return 'Wallet';
      case PaymentSource.CreditCard: return 'Credit Card';
      default: return 'Bank Account';
    }
  }

  get paymentMethodLabel(): string {
    if (this.data.paymentMethodLabelOverride) {
      return this.data.paymentMethodLabelOverride;
    }
    switch (this.data.method) {
      case PaymentMethod.ACH: return 'ACH / Direct Deposit';
      case PaymentMethod.SameDayACH: return 'Same Day ACH';
      case PaymentMethod.Wire: return 'Wire Transfer';
      case PaymentMethod.VirtualCard: return 'Virtual Card';
      case PaymentMethod.RTP: return 'Real Time Instant Payment';
      case PaymentMethod.InternationalPayment: return 'International Payment';
      case PaymentMethod.CheckMail: return 'Check Mail';
      case PaymentMethod.CheckPrint: return 'Check Print';
      case PaymentMethod.CheckEmail: return 'Check Email';
      case PaymentMethod.Check: return 'Check';
      case PaymentMethod.LetPayeeChoose: return 'Let The Vendor Decide';
      default: return String(this.data.paymentMethod ?? '');
    }
  }

  get formattedAmount(): string {
    const num = Number(this.data.amount);
    return isNaN(num) ? String(this.data.amount) : num.toFixed(2);
  }

  get actionButtonText(): string {
    return this.data.mode === 'receive' ? 'Send Request' : 'Confirm Payment';
  }

  /** Shows the "payee has not verified this bank account" warning on the confirmation modal. */
  get showUnverifiedBankWarning(): boolean {
    return this.data?.isPayeeBankVerified === false;
  }

  /**
   * ACH and Wire transfers are temporarily unavailable from June 23 to June 25
   * due to scheduled maintenance. Surface a notice for those payment methods so
   * the user is informed before confirming.
   */
  get showAchWireMaintenanceNotice(): boolean {
    // if (this.data.mode !== 'send') return false;
    // const achWireMethods = [
    //   PaymentMethod.ACH,
    //   PaymentMethod.SameDayACH,
    //   PaymentMethod.Wire
    // ];
    // if (this.data.method && achWireMethods.includes(this.data.method)) {
    //   return true;
    // }
    // const method = this.data.paymentMethod?.toLowerCase() ?? '';
    // return method.includes('ach') || method.includes('wire');
    return false;
  }

  get infoMessage(): string {
    if (this.data.mode === 'receive') {
      return 'Payment request will be sent to the customer';
    }
    switch (this.data.source) {
      case PaymentSource.Wallet: return 'Payment will be processed from your wallet';
      case PaymentSource.CreditCard: return 'Payment will be processed from your credit card';
      default: return 'Payment will be processed from your bank account';
    }
  }

  onConfirm() {
    if(this.data.mode === 'receive') {
      this.dialogRef.close(true);
    } else {
      this.isProcessing.set(true);
      this.confirmed.emit();
    }
  }

  onCancel() {
    if(this.isProcessing()) return;
    this.dialogRef.close(false);
  }
}

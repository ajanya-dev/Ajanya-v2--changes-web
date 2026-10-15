import { Component, Injector, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, CircleCheckBig, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { Router } from '@angular/router';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PaymentMethod } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import {
  IRecurringRedirectInfo,
  RecurringRedirectService
} from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';

export interface IPaymentSuccessV4Data {
  mode: 'send' | 'receive' | 'saved' | 'approval_required';
  amount: string | number;
  // Send fields
  payeeName?: string;
  paymentMethod?: string;
  paymentMethodLabelOverride?: string;
  bankName?: string;
  sourceAccountDisplay?: string;
  processingTime?: string;
  emailType?: 'immediate' | 'recurring' | 'scheduled';
  referenceId?: string;
  // Receive fields
  from?: string;
  toBankAccount?: string;
  recurring?: string;
  duration?: string;
  showPermissionWarningModal?: boolean;
}

export type PaymentSuccessResult = 'done' | 'navigate' | 'new';

@Component({
  standalone: true,
  selector: 'app-payment-success-modal-v4',
  templateUrl: './payment-success-modal-v4.component.html',
  styleUrls: ['./payment-success-modal-v4.component.scss'],
  imports: [CommonModule, CommonButtonV4Component, LucideAngularModule],
  encapsulation: ViewEncapsulation.None
})
export class PaymentSuccessModalV4Component{
  data: IPaymentSuccessV4Data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<PaymentSuccessModalV4Component>);
  private router = inject(Router);
  private injector = inject(Injector);
  private recurringRedirect = inject(RecurringRedirectService);

  /** Set when the completed payment was recurring/scheduled (email/mail/ACH). */
  readonly recurringInfo: IRecurringRedirectInfo | null =
    this.recurringRedirect.consume();

  readonly CircleCheckIcon = CircleCheckBig;
  readonly XIcon = X;

  private readonly methodLabels: Record<string, string> = {
    [PaymentMethod.Check]: 'Check',
    [PaymentMethod.ACH]: 'ACH / Direct Deposit',
    [PaymentMethod.SameDayACH]: 'Same Day ACH',
    [PaymentMethod.Wire]: 'Wire Transfer',
    [PaymentMethod.VirtualCard]: 'Virtual Card',
    [PaymentMethod.RTP]: 'Real Time Instant Payment',
    [PaymentMethod.InternationalPayment]: 'International Payment',
    [PaymentMethod.CheckMail]: 'Check Mail',
    [PaymentMethod.CheckPrint]: 'Check Print',
    [PaymentMethod.CheckEmail]: 'Check Email',
    [PaymentMethod.LetPayeeChoose]: 'Let The Vendor Decide',
  };

  get paymentMethodLabel(): string {
    if (this.data.paymentMethodLabelOverride) {
      return this.data.paymentMethodLabelOverride;
    }
    const method = this.data.paymentMethod ?? '';
    return this.methodLabels[method] ?? method;
  }

  get formattedAmount(): string {
    const num = Number(this.data.amount);
    return Number.isNaN(num) ? String(this.data.amount) : num.toFixed(2);
  }

  get title(): string {
    if (this.data.mode === 'saved') {
      return 'Payment Saved!';
    }
    if (this.data.mode === 'approval_required') {
      return 'Administrator approval is required';
    }
    if (this.data.mode === 'receive') {
      return 'Payment Request Sent!';
    }
    if (this.recurringInfo) {
      return this.recurringInfo.isRecurring
        ? 'Recurring Payment Set Up!'
        : 'Payment Scheduled!';
    }
    return 'Payment Successful!';
  }

  get subtitle(): string {
    if (this.recurringInfo) {
      return this.recurringInfo.isRecurring
        ? 'Your recurring payment has been set up successfully. You can manage it from the recurring list.'
        : 'Your payment has been scheduled successfully. You can manage it from the recurring list.';
    }
    if (this.data.mode === 'saved') {
      return 'Your payment has been saved successfully. You can view and manage it from the payments table.';
    }
    if (this.data.mode === 'approval_required') {
      return 'Your payment has been saved successfully. But requires administrator approval for processing.';
    }
    if (this.data.mode === 'send') {
      const payee = this.data.payeeName || 'Recipient';
      const method = this.paymentMethodLabel || 'Payment';
      if (this.data.emailType === 'recurring') {
        return `Recurring payment of $${this.formattedAmount} to ${payee} via ${method} has been scheduled.`;
      }
      if (this.data.emailType === 'scheduled') {
        return `Payment of $${this.formattedAmount} to ${payee} via ${method} has been scheduled.`;
      }
      return `Payment of $${this.formattedAmount} sent to ${payee} via ${method}.`;
    }
    return `Payment request sent${this.data.from ? ` to ${  this.data.from}` : ''}. You'll receive the funds once they complete the payment.`;
  }

  get referenceId(): string {
    return this.data.referenceId || '';
  }

  get processingTime(): string {
    return this.data.processingTime ?? '';
  }

  get hasProcessingTime(): boolean {
    return !!this.data.processingTime;
  }

  get processingTimeLabel(): string {
    if (this.data.emailType === 'recurring' || this.data.emailType === 'scheduled') {
      return 'Schedule';
    }
    return 'Processing Time';
  }

  /**
   * Navigates to the relevant payments table, which must not serve cached rows
   * now that a payment has been created.
   *
   * The flag is set *before* navigating so the destination table's own first
   * load is the authoritative one. Refreshing after navigation instead fires a
   * second request and rebuilds the grid a second time — visible as the table
   * flickering a moment after it has already appeared.
   */
  onViewPayment() {
    const { router } = this;

    let route = '/v4/manage/payments-out/detailed';
    let queryParams: Record<string, number> | undefined;
    if (this.data.mode === 'receive') {
      route = '/v4/manage/payments-in/detailed';
    } else if (this.recurringInfo) {
      route = '/v4/manage/payments-out/detailed/recurring';
      queryParams = {
        tab: this.recurringRedirect.tabIndex(this.recurringInfo.delivery)
      };
    } else if (this.data.paymentMethod === 'international-payment') {
      route = '/v4/manage/international-payment/index';
    }

    import('../../services/payments-v4.service').then((m) => {
      this.injector.get(m.PaymentsV4Service).paymentCompleted$.next();

      this.injector.get(V3DataTableService).hardRefresh.set(true);
      this.dialogRef.close('navigate');
      router.navigate([route], queryParams ? { queryParams } : {});
    });
  }

  onNewPayment() {
    this.dialogRef.close('new');
  }
}

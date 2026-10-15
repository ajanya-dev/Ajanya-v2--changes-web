import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialogClose, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faXmark,
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { finalize, take } from 'rxjs';
import { SubscriptionRenewPaymentModalComponent } from '../subscription-renew-payment-modal/subscription-renew-payment-modal.component';
import { ILatestInvoice } from '../../model/subscription';

@Component({
  selector: 'app-subscription-renew-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    MatDialogClose,
    FaIconComponent,
    CommonModule,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './subscription-renew-modal.component.html',
  styleUrl: './subscription-renew-modal.component.scss'
})
export class SubscriptionRenewModalComponent implements OnInit {
  injectedData = inject<ILatestInvoice>(MAT_DIALOG_DATA);
  private subscriptionService = inject(SubscriptionService);
  private dialog = inject(MatDialog);

  isLoading = signal(false);
  isInvoicePayable = signal(true);

  faXmark = faXmark;
  faExclamationTriangle = faExclamationTriangle;
  faInfoCircle = faInfoCircle;

  isSyncMode = computed(() => this.injectedData.mode === 'sync');

  modalTitle = computed(() =>
    this.isSyncMode() ? 'Outstanding Invoice' : 'Subscription Renewal Payment'
  );

  alertHeading = computed(() =>
    this.isSyncMode() ? 'Invoice Payment Required' : 'Payment Required'
  );

  alertSubtext = computed(() =>
    this.isSyncMode() ? 'Your invoice payment is overdue and requires immediate attention.' : 
  'Your subscription renewal payment is overdue. Service access may be interrupted until payment is completed.'
  );

  payButtonText = computed(() => (this.isSyncMode() ? 'Pay Now' : 'Pay Now'));

  ngOnInit(): void {
    if(this.injectedData.mode === 'sync') {
      this.checkInvoiceStatus();
    }
  }

  renewInvoicePayment() {
    const isSyncMode = this.injectedData.mode === 'sync';
    const payload = {
      is_renewal: isSyncMode ? 0 : 1,
      redirect_url: `https://${window.location.host}/manage/subscription/dashboard?type=${this.injectedData.mode}`,
      invoice_id: isSyncMode ? this.injectedData.invoice_id : null,
      mode: this.injectedData.mode
    };

    this.isLoading.set(true);
    this.subscriptionService
      .renewInvoicePayment(payload)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1)
      )
      .subscribe((res) => {  
        if (res?.success && res?.data?.url) {
          // Close current modal and open payment modal
          this.dialog.closeAll();
          this.openPaymentModal(res.data.url);
        }
      });
  }

  private openPaymentModal(paymentUrl: string) {
    const paymentData = {
      invoice_id: this.injectedData.invoice_id,
      payment_url: paymentUrl,
      amount: this.injectedData.amount,
      invoice_number: this.injectedData.invoice_number,
      due_date: this.injectedData.due_date
    };

    this.dialog.open(SubscriptionRenewPaymentModalComponent, {
      data: paymentData,
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
    });
  }

  private checkInvoiceStatus() {
    this.subscriptionService.checkInvoiceStatus(this.injectedData.invoice_id)
    .pipe(finalize(() => this.isLoading.set(false)), take(1))
    .subscribe((res) => {
      if(res?.success && !res?.data?.is_payable) {
        this.isInvoicePayable.set(false);
      }
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { LucideAngularModule, X, TriangleAlert, Info } from 'lucide-angular';
import { finalize, take } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ILatestInvoice } from 'src/app/modules/subscription/model/subscription';
import { V4SubscriptionRenewPaymentModalComponent } from '../v4-subscription-renew-payment-modal/v4-subscription-renew-payment-modal.component';

@Component({
  selector: 'app-v4-subscription-renew-modal',
  standalone: true,
  imports: [
    CommonButtonV4Component,
    LucideAngularModule,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './v4-subscription-renew-modal.component.html',
  styleUrl: './v4-subscription-renew-modal.component.scss'
})
export class V4SubscriptionRenewModalComponent {
  private dialogRef = inject(MatDialogRef<V4SubscriptionRenewModalComponent>);
  injectedData = inject<ILatestInvoice>(MAT_DIALOG_DATA);
  private subscriptionService = inject(SubscriptionService);
  private dialog = inject(MatDialog);
  private v4AlertService = inject(V4AlertService);

  readonly XIcon = X;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly InfoIcon = Info;

  isLoading = signal(false);

  close(): void {
    this.dialogRef.close(false);
  }

  renewInvoicePayment(): void {
    const isSyncMode = this.injectedData.mode === 'sync';
    const payload = {
      is_renewal: isSyncMode ? 0 : 1,
      redirect_url: `https://${window.location.host}/v4/manage/user-profile/index?tab=myPlan&type=${this.injectedData.mode}`,
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
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data?.url) {
            this.dialog.closeAll();
            this.openPaymentModal(res.data.url);
          }
        },
        error: (err) => {
          this.dialogRef.close(false);
          this.v4AlertService.warningAlert({
            content: err?.error?.errorMsg || 'Something went wrong. Please try again.'
          });
        }
      });
  }

  private openPaymentModal(paymentUrl: string): void {
    const paymentData = {
      invoice_id: this.injectedData.invoice_id,
      payment_url: paymentUrl,
      amount: this.injectedData.amount,
      invoice_number: this.injectedData.invoice_number,
      due_date: this.injectedData.due_date
    };

    this.dialog.open(V4SubscriptionRenewPaymentModalComponent, {
      data: paymentData,
      width: '600px',
      maxWidth: '93%',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }
}

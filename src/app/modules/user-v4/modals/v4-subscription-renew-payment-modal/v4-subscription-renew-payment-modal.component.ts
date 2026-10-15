import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideAngularModule, X } from 'lucide-angular';

interface PaymentModalData {
  invoice_id: string;
  payment_url: string;
  amount: string;
  invoice_number: string;
  due_date: string;
}

@Component({
  selector: 'app-v4-subscription-renew-payment-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './v4-subscription-renew-payment-modal.component.html',
  styleUrl: './v4-subscription-renew-payment-modal.component.scss'
})
export class V4SubscriptionRenewPaymentModalComponent {
  private dialogRef = inject(
    MatDialogRef<V4SubscriptionRenewPaymentModalComponent>
  );

  injectedData = inject<PaymentModalData>(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);

  readonly XIcon = X;

  safePaymentUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(
      this.injectedData.payment_url
    );

  close(): void {
    this.dialogRef.close(false);
  }
}

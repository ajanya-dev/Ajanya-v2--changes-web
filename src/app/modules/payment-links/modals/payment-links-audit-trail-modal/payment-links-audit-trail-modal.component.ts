import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { Subject, finalize, takeUntil } from 'rxjs';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { IPaymentLinkAuditTrail, getChangedFields } from '../../models/payment-links.model';

export interface PaymentLinksAuditTrailModalData {
  id: string;
}

@Component({
  selector: 'app-payment-links-audit-trail-modal',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './payment-links-audit-trail-modal.component.html',
  styleUrl: './payment-links-audit-trail-modal.component.scss'
})
export class PaymentLinksAuditTrailModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<PaymentLinksAuditTrailModalComponent>);
  private paymentLinkApiService = inject(PaymentLinkService);
  data: PaymentLinksAuditTrailModalData = inject(MAT_DIALOG_DATA);

  faXmark = faXmark;
  faSpinner = faSpinner;

  auditList: IPaymentLinkAuditTrail[] = [];
  isLoading = signal(false);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.isLoading.set(true);
    this.paymentLinkApiService
      .getAuditTrail(this.data.id)
      .pipe(finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.auditList = res.data;
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  getChangedFields = getChangedFields;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

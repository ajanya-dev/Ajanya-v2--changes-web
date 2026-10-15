import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import {
  IPaymentLinkAuditTrail,
  getChangedFields
} from 'src/app/modules/payment-links/models/payment-links.model';

export interface V4AuditTrailModalData {
  id: string;
}

@Component({
  selector: 'app-v4-payment-links-audit-trail-modal',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip, CommonButtonV4Component],
  templateUrl: './audit-trail-modal.component.html'
})
export class V4PaymentLinksAuditTrailModalComponent implements OnInit {
  private dialogRef = inject(
    MatDialogRef<V4PaymentLinksAuditTrailModalComponent>
  );
  private paymentLinkService = inject(PaymentLinkService);
  private destroyRef = inject(DestroyRef);
  data: V4AuditTrailModalData = inject(MAT_DIALOG_DATA);

  auditTrailList: IPaymentLinkAuditTrail[] = [];
  loading = signal(false);

  getChangedFields = getChangedFields;

  ngOnInit(): void {
    this.loading.set(true);
    this.paymentLinkService
      .getAuditTrail(this.data.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.auditTrailList = res.data;
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}

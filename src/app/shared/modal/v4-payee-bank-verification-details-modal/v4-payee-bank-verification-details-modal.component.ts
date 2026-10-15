import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, Send, TriangleAlert, X } from 'lucide-angular';
import { finalize, take } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IPayeeBankVerificationModalData } from 'src/app/models/payee-bank-verification';
import { PayeeBankVerificationService } from 'src/app/shared/service/payee-bank-verification/payee-bank-verification.service';
import { MaskAccountPipe } from 'src/app/pipes/mask-account.pipe';

@Component({
  selector: 'app-v4-payee-bank-verification-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    MaskAccountPipe
  ],
  templateUrl: './v4-payee-bank-verification-details-modal.component.html',
  styleUrls: ['./v4-payee-bank-verification-details-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4PayeeBankVerificationDetailsModalComponent implements OnInit {
  private verificationService = inject(PayeeBankVerificationService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(
    MatDialogRef<V4PayeeBankVerificationDetailsModalComponent>
  );

  public data: IPayeeBankVerificationModalData = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly SendIcon = Send;

  sendingReminder = signal(false);
  canSendReminder = signal(false);

  ngOnInit(): void {
    this.canSendReminder.set(!!this.data.paymentDetails.isResendButtonEnabled);
  }

  sendReminder(): void {
    this.sendingReminder.set(true);
    this.verificationService
      .resendPayeeBankVerification(this.data.uuId)
      .pipe(
        finalize(() => this.sendingReminder.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: res.data?.message || 'Verification reminder sent.'
          });
          this.dialogRef.close(true);
        } else {
          this.alertService.failedAlert({
            content: res.errorMsg || 'Failed to send reminder'
          });
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}

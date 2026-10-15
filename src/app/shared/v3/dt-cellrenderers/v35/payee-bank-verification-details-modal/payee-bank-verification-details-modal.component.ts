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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPaperPlane,
  faSpinner,
  faTriangleExclamation,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, take } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IPayeeBankVerificationModalData } from 'src/app/models/payee-bank-verification';
import { PayeeBankVerificationService } from 'src/app/shared/service/payee-bank-verification/payee-bank-verification.service';
import { MaskAccountPipe } from 'src/app/pipes/mask-account.pipe';

@Component({
  selector: 'app-payee-bank-verification-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatDialogClose,
    CommonButtonV35Component,
    MaskAccountPipe
  ],
  templateUrl: './payee-bank-verification-details-modal.component.html',
  styleUrls: ['./payee-bank-verification-details-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayeeBankVerificationDetailsModalComponent implements OnInit {
  private verificationService = inject(PayeeBankVerificationService);
  private alertService = inject(AlertService);
  private dialogRef = inject(
    MatDialogRef<PayeeBankVerificationDetailsModalComponent>
  );

  public data: IPayeeBankVerificationModalData = inject(MAT_DIALOG_DATA);

  faXmark = faXmark;
  faTriangleExclamation = faTriangleExclamation;
  faPaperPlane = faPaperPlane;
  faSpinner = faSpinner;

  sendingReminder = signal(false);
  canSendReminder = signal(false);

  ngOnInit(): void {
    this.canSendReminder.set(!!this.data.paymentDetails.isResendButtonEnabled);
  }

  /**
   * Sends the payee bank verification reminder for this ZilPayment.
   * On success, shows the returned message and closes the modal.
   */
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
        }
      );
  }

  close(): void {
    this.dialogRef.close();
  }
}

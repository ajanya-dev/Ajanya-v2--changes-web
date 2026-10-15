import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IBankData } from 'src/app/models/bank';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { LucideAngularModule, X, ShieldCheck, ChartPie } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-connect-bank-account-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './connect-bank-account-v4.component.html',
  styleUrls: ['./connect-bank-account-v4.component.scss']
})
export class ConnectBankAccountV4Component {
  readonly XIcon = X;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly ChartPieIcon = ChartPie;

  private dialogRef = inject(MatDialogRef<ConnectBankAccountV4Component>);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private plaidHelperService = inject(PlaidHelperService);
  private destroyRef = inject(DestroyRef);
  private verificationMessageService = inject(VerificationMessageService);

  dialogData: {
    alertType: 'balance' | 'record';
    account: IBankData;
  } = inject(MAT_DIALOG_DATA);

  onContinue(): void {
    const verificationDetails: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');

    if (verificationDetails.verification === 0) {
      this.verifyEmailAndMobile();
      return;
    }

    this.plaidHelperService
      .openPlaidModal({
        isVerify: true,
        selectedBankId: this.dialogData.account.encrypted_bankacc_id,
        isV4: true
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.dialogRef.close({ success: true });
          }
        }
      });
  }

  private verifyEmailAndMobile(): void {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: '/v4/manage/bank-accounts/index'
          }
        });
        this.dialogRef.close({ success: false });
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

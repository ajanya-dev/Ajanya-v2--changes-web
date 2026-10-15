import { Component, inject, OnDestroy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBuildingColumns,
  faChartPieSimpleCircleDollar,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';
import { IBankData } from 'src/app/models/bank';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-connect-bank-account-modal',
  standalone: true,
  imports: [FontAwesomeModule, MatDialogModule, CommonButtonV35Component],
  templateUrl: './connect-bank-account-modal.component.html',
  styleUrl: './connect-bank-account-modal.component.scss'
})
export class ConnectBankAccountModalComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<ConnectBankAccountModalComponent>);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);
  private plaidHelperService = inject(PlaidHelperService);

  faBuildingColumns = faBuildingColumns;
  faChartPieSimpleCircleDollar = faChartPieSimpleCircleDollar;
  faXmark = faXmark;
  destroy$ = new Subject();

  dialogData: {
    alertType: 'balance' | 'record';
    account: IBankData;
  } = inject(MAT_DIALOG_DATA);

  onContinue() {
    const verificationDetails: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');
    if (verificationDetails.verification === 0) {
      this.verifyEmailAndMobile();
      return;
    }

    this.plaidHelperService.openPlaidModal({ isVerify: true,selectedBankId:this.dialogData.account.encrypted_bankacc_id })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {        
        if (res?.success) {
          this.dialogRef.close({ success: true });
        }
      }
    });
  }

  verifyEmailAndMobile() {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: 'manage/bank-accounts/index'
          }
        });
        this.dialogRef.close({ success: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

import { OnDestroy, Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { Router } from '@angular/router';
import { AddBusinessModalComponent } from 'src/app/modules/common-verification/components/add-business-modal/add-business-modal.component';
import {
  IAddBizData,
  CVSourceType
} from 'src/app/modules/common-verification/model/common-verification';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { NgClass, NgIf } from '@angular/common';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';

@Component({
  selector: 'app-subscription-kyc-required-warning-modal',
  templateUrl: './subscription-kyc-required-warning-modal.component.html',
  styleUrls: ['./subscription-kyc-required-warning-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgClass, NgIf]
})
export class SubscriptionKycRequiredWarningModalComponent implements OnDestroy {
  private personaHelperService = inject(PersonaHelperService);
  private dialogRef = inject(
    MatDialogRef<SubscriptionKycRequiredWarningModalComponent>
  );

  private router = inject(Router);
  private verificationService = inject(CommonVerificationService);
  private dialog = inject(MatDialog);

  subscriptions: Subscription[] = [];
  kycKybStatus: { kycStatus: number; kybStatus: number };
  loading = false;

  submit(): void {
    this.getUserKysKybStatus();
  }

  getUserKysKybStatus() {
    this.loading = true;
    this.subscriptions.push(
      this.verificationService
        .applicationStatus()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.kycKybStatus = res.data;
            if (this.kycKybStatus?.kycStatus !== null) {
              this.addBusinessModal();
            } else if (environment.isV4Persona) {
              this.personaHelperService.openModal(
                'kyc',
                CVSourceType.subscription
              );
            } else {
              this.router.navigate(['/manage/users/verify-user-id'], {
                queryParams: { type: CVSourceType.subscription }
              });
            }
            this.dialogRef.close();
          }
        })
    );
  }

  addBusinessModal() {
    this.dialog.open<AddBusinessModalComponent, IAddBizData>(
      AddBusinessModalComponent,
      {
        maxWidth: '95%',
        width: '950px',
        height: '750px',
        data: { sourceType: CVSourceType.other }
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}

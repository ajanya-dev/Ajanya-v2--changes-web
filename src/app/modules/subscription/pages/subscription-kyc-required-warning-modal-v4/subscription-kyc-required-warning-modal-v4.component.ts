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
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, ShieldCheck, X } from 'lucide-angular';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-subscription-kyc-required-warning-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  template: `
    <div class="font-funnel p-6 text-center">
      <!-- Close -->
      <div class="flex justify-end -mt-2 -mr-2 mb-2">
        <button
          type="button"
          class="text-v4-tertiary-text-color hover:text-v4-main-text-color transition-colors"
          (click)="dialogRef.close()"
        >
          <i-lucide [img]="XIcon" [size]="20"></i-lucide>
        </button>
      </div>

      <!-- Icon -->
      <div class="flex justify-center mb-4">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center"
          style="
            background-color: var(--v4-badge-warning-bg-color);
            color: var(--v4-badge-warning-text-color);
          "
        >
          <i-lucide [img]="ShieldCheckIcon" [size]="32"></i-lucide>
        </div>
      </div>

      <!-- Body -->
      <h2
        class="text-lg font-semibold text-v4-main-text-color mb-2"
      >
        Verification Required
      </h2>
      <p class="text-sm text-v4-secondary-text-color max-w-[36ch] mx-auto mb-6">
        Please complete identity verification to activate your subscription and
        start using all features.
      </p>

      <!-- Actions -->
      <div class="flex gap-3 justify-center">
        <app-common-button-v4
          class="flex-1"
          [type]="{ style: 'outline', name: 'main' }"
          text="Cancel"
          [width]="'100%'"
          (clickEvent)="dialogRef.close()"
        />
        <app-common-button-v4
          class="flex-1"
          [type]="{ style: 'primary', name: 'main' }"
          text="Verify Now"
          [width]="'100%'"
          [loading]="loading"
          (clickEvent)="submit()"
        />
      </div>
    </div>
  `
})
export class SubscriptionKycRequiredWarningModalV4Component
  implements OnDestroy
{
  private personaHelperService = inject(PersonaHelperService);
  dialogRef = inject(
    MatDialogRef<SubscriptionKycRequiredWarningModalV4Component>
  );
  
  private router = inject(Router);
  private verificationService = inject(CommonVerificationService);
  private dialog = inject(MatDialog);

  readonly ShieldCheckIcon = ShieldCheck;
  readonly XIcon = X;

  subscriptions: Subscription[] = [];
  loading = false;

  submit(): void {
    this.loading = true;
    this.subscriptions.push(
      this.verificationService
        .applicationStatus()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            const status = res.data;
            if (status?.kycStatus !== null) {
              this.dialog.open<AddBusinessModalComponent, IAddBizData>(
                AddBusinessModalComponent,
                {
                  maxWidth: '95%',
                  width: '950px',
                  height: '750px',
                  data: { sourceType: CVSourceType.other }
                }
              );
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}

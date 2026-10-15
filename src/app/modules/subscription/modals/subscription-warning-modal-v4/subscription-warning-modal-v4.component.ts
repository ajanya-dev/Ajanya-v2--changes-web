import { Component, Inject, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogRef
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LucideAngularModule, TriangleAlert } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal';

@Component({
  selector: 'app-subscription-warning-modal-v4',
  standalone: true,
  imports: [MatDialogActions, LucideAngularModule, CommonButtonV4Component],
  template: `
    <div class="text-center font-funnel px-8 pt-8 pb-7">
      <!-- Icon -->
      <div class="flex justify-center mb-5">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color"
        >
          <lucide-icon [img]="TriangleAlertIcon" [size]="32"></lucide-icon>
        </div>
      </div>

      <!-- Body -->
      <div class="text-center mb-7">
        <h2
          class="text-lg font-semibold font-funnel text-v4-main-text-color mb-2"
        >
          Subscription Required
        </h2>
        <p
          class="text-sm font-peridot text-v4-secondary-text-color max-w-[40ch] mx-auto break-words"
          [innerHTML]="content"
        ></p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-center">
        <app-common-button-v4
          class="flex-1"
          [type]="{ style: 'outline', name: 'main' }"
          text="Cancel"
          [width]="'100%'"
          (clickEvent)="cancel()"
        />
        <app-common-button-v4
          class="flex-1"
          [type]="{ style: 'primary', name: 'main' }"
          text="Upgrade Now"
          [width]="'100%'"
          (clickEvent)="upgradeNow()"
        />
      </div>
    </div>
  `
})
export class SubscriptionWarningModalV4Component {
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<SubscriptionWarningModalV4Component>);
  private modalService = inject(CustomDoubleSideModalService);

  readonly TriangleAlertIcon = TriangleAlert;
  content = 'You need to subscribe to any plans to use this feature.';

  constructor(@Inject(MAT_DIALOG_DATA) data: { content: string }) {
    if (data?.content) {
      this.content = data.content;
    }
  }

  upgradeNow(): void {
    this.dialog.closeAll();
    this.modalService.closeAll();
    this.router.navigate(['/v4/manage/subscription/plan']);
  }

  cancel(): void {
    this.dialogRef.close(false);
    this.paymentsService.isPaymentProcessingSubject.next(false);
  }
}

import { Component, inject, ViewEncapsulation } from '@angular/core';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LucideAngularModule, ShieldCheck, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-business-verification-required-modal',
  templateUrl: './business-verification-required-modal.component.html',
  styleUrls: ['./business-verification-required-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class BusinessVerificationRequiredModalComponent {
  readonly ShieldCheckIcon = ShieldCheck;
  readonly XIcon = X;

  private dialogRef = inject(
    MatDialogRef<BusinessVerificationRequiredModalComponent>
  );

  private router = inject(Router);
  private data: { description?: string; noNavigation?: boolean } =
    inject(MAT_DIALOG_DATA, {
      optional: true
    }) || {};

  readonly description =
    this.data?.description ||
    'Wallet and credit card payments require business verification. We will bring you back to complete this payment and keep your current inputs.';

  verifyBusiness() {
    this.dialogRef.close(true);
    if (this.data.noNavigation) return;
    this.router.navigate(['/v4/manage/verification']);
  }
}

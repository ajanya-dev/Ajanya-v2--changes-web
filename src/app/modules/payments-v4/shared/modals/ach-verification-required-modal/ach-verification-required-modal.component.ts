import { Component, inject, ViewEncapsulation } from '@angular/core';
import {
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { LucideAngularModule, CircleAlert, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

export interface AchVerificationRequiredModalData {
  bankName: string;
  accountNumber: string;
  method?: string;
}

@Component({
  selector: 'app-ach-verification-required-modal',
  templateUrl: './ach-verification-required-modal.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class AchVerificationRequiredModalComponent {
  readonly AlertCircleIcon = CircleAlert;
  readonly XIcon = X;

  private dialogRef = inject(
    MatDialogRef<AchVerificationRequiredModalComponent>
  );

  private data: AchVerificationRequiredModalData = inject(MAT_DIALOG_DATA, {
    optional: true
  }) || { bankName: '', accountNumber: '', method: '' };

  readonly bankName = this.data?.bankName || '';
  readonly accountNumber = this.data?.accountNumber || '';
  readonly method = this.data?.method || '';

  get methodDescription(): string {
    switch (this.method) {
      case 'wire':
        return 'before making wire transfers';
      case 'virtual-card':
        return 'before sending virtual cards';
      case 'let-payee-choose':
        return 'before making this payment';
      default:
        return 'before making ACH payments';
    }
  }

  get bankLabel(): string {
    const name = this.bankName || 'Bank Account';
    const acct = this.accountNumber ? ` (${this.accountNumber})` : '';
    return `Bank: ${name}${acct}`;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  verifyNow(): void {
    this.dialogRef.close({ verify: true });
  }
}

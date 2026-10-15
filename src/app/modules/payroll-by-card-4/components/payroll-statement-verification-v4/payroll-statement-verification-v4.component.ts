import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';

/**
 * Represents Payroll Account statement Verification component.
 */
@Component({
  selector: 'app-payroll-statement-verification-v4',
  templateUrl: './payroll-statement-verification-v4.component.html',
  styleUrls: ['./payroll-statement-verification-v4.component.scss'],
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component]
})
export class PayrollStatementVerificationV4Component {
  private payrollService = inject(PayrollService);
  public dialogRef = inject(MatDialogRef);
  public dialogData: {
    bankAccountId: string;
    companyId: string;
    companyType: number;
  } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  statementFile = new FormControl<File | null>(null, Validators.required);
  private destroyRef = inject(DestroyRef);
  loading = false;

  /**
   * to be called on the change event of the file input from template.
   */
  fileInputChange(event: Event & { target: HTMLInputElement }) {
    this.statementFile.markAllAsTouched();
    if (event.target.files?.length) {
      this.statementFile.setValue(event.target.files[0]);
    } else {
      this.statementFile.setValue(null);
    }
  }

  /**
   * Submit method.
   * Submitting the file and related data to the API. and closes the modal.
   */
  submit() {
    if (this.statementFile.valid) {
      const formData = new FormData();
      formData.append('statement', this.statementFile.value as File);
      formData.append('companyId', this.dialogData.companyId);
      formData.append(
        'companyType',
        this.dialogData.companyType ? 'manual' : 'merge'
      );

      this.loading = true;
      this.payrollService
        .verifyPayrollStatement(this.dialogData.bankAccountId, formData)
        .pipe(
          finalize(() => {
            this.loading = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialogRef.close({ success: true });
            }
          },
          error: () => {
            this.dialogRef.close({ success: false });
          }
        });
    }
  }
}

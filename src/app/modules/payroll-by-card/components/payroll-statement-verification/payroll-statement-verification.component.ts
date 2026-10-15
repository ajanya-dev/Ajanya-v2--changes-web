import { Component, inject, OnDestroy } from '@angular/core';
import { FormControl, Validators, FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { finalize, Subject, takeUntil } from 'rxjs';
import { PayrollService } from '../../services/payroll.service';
import { NgIf } from '@angular/common';

/**
 * Represents Payroll Account statement Verification component.
 */
@Component({
  selector: 'app-payroll-statement-verification',
  templateUrl: './payroll-statement-verification.component.html',
  styleUrls: ['./payroll-statement-verification.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FormsModule, NgIf]
})
export class PayrollStatementVerificationComponent implements OnDestroy {
  private payrollService = inject(PayrollService);
  private dialogRef = inject(MatDialogRef);
  public dialogData: {
    bankAccountId: string;
    companyId: string;
    companyType: number;
  } = inject(MAT_DIALOG_DATA);

  statementFile = new FormControl<File | null>(null, Validators.required);
  destroy$ = new Subject<boolean>();
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
          takeUntil(this.destroy$)
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

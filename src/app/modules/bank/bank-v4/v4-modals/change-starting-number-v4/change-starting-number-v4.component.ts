import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { IBankData } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  selector: 'app-change-starting-number-v4',
  templateUrl: './change-starting-number-v4.component.html',
  styleUrls: ['./change-starting-number-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeStartingNumberV4Component {
  readonly XIcon = X;

  private dialogRef = inject(MatDialogRef<ChangeStartingNumberV4Component>);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  private dialogData: IBankData = inject(MAT_DIALOG_DATA);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  checkNumber = new FormControl('', [Validators.required]);

  submit(): void {
    this.checkNumber.markAllAsTouched();
    if (this.checkNumber.invalid) {
      return;
    }

    const processedData = {
      newValue: this.checkNumber.value as string
    };

    this.loading.set(true);
    this.bankAccService
      .changeStartinNo(this.dialogData.encrypted_bankacc_id, processedData)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({ content: 'Updated' });
            this.dialogRef.close(processedData);
          }
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

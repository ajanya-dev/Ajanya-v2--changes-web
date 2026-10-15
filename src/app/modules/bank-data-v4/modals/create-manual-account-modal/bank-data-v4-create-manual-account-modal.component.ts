import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  BankDataV4ApiService,
  IBankDataV4ManualAccountPayload,
  TBankDataV4ManualAccountType
} from '../../services/bank-data-v4-api.service';

@Component({
  selector: 'app-bank-data-v4-create-manual-account-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4SelectDropdownComponent
  ],
  templateUrl: './bank-data-v4-create-manual-account-modal.component.html'
})
export class BankDataV4CreateManualAccountModalComponent {
  readonly XIcon = X;
  private fb = inject(FormBuilder);
  private dialogRef =
    inject<MatDialogRef<BankDataV4CreateManualAccountModalComponent>>(
      MatDialogRef
    );

  private api = inject(BankDataV4ApiService);
  private alertService = inject(V4AlertService);

  readonly accountTypeOptions: IV4SelectOption[] = [
    { id: 'cash', name: 'Cash', value: 'cash' },
    { id: 'checking', name: 'Checking', value: 'checking' },
    { id: 'savings', name: 'Savings', value: 'savings' },
    { id: 'credit', name: 'Credit Card', value: 'credit' },
    { id: 'investment', name: 'Investment', value: 'investment' },
    { id: 'loan', name: 'Loan', value: 'loan' }
  ];

  form = this.fb.nonNullable.group({
    account_name: ['', [Validators.required]],
    account_type: ['', [Validators.required]],
    balance: ['', [Validators.required]],
    institution_name: ['']
  });

  isSaving = signal(false);

  onAccountTypeChange(value: string): void {
    this.form.controls.account_type.setValue(value);
    this.form.controls.account_type.markAsTouched();
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: IBankDataV4ManualAccountPayload = {
      account_name: raw.account_name.trim(),
      account_type: raw.account_type as TBankDataV4ManualAccountType,
      balance: parseFloat(raw.balance) || 0,
      institution_name: raw.institution_name.trim() || 'Manual Account',
      source: 'manual'
    };

    this.isSaving.set(true);
    this.api
      .createManualAccount(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Account created successfully'
          });
          this.dialogRef.close({ success: true });
        }
      });
  }
}

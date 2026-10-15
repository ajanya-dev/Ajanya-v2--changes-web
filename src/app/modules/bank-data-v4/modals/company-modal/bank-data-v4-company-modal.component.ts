import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankDataV4ApiService } from '../../services/bank-data-v4-api.service';

export interface IBankDataV4CompanyModalData {
  mode: 'new' | 'edit';
  company?: { id: string; name: string };
}

@Component({
  selector: 'app-bank-data-v4-company-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './bank-data-v4-company-modal.component.html'
})
export class BankDataV4CompanyModalComponent {
  readonly XIcon = X;

  private fb = inject(FormBuilder);

  private dialogRef =
    inject<MatDialogRef<BankDataV4CompanyModalComponent>>(MatDialogRef);

  private api = inject(BankDataV4ApiService);

  private alertService = inject(V4AlertService);

  private data = inject<IBankDataV4CompanyModalData>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data?.mode === 'edit';

  form = this.fb.nonNullable.group({
    name: [
      this.data?.company?.name ?? '',
      [Validators.required, Validators.maxLength(50)]
    ]
  });

  isSaving = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = this.form.controls.name.value.trim();
    if (!name) return;

    this.isSaving.set(true);

    const { company } = this.data;
    if (this.isEditMode && company) {
      this.api
        .updateCompany({ id: company.id, name })
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Company updated' });
            this.dialogRef.close({
              success: true,
              data: res.data ?? { id: company.id, name }
            });
          }
        });
    } else {
      this.api
        .addCompany(name)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Company added' });
            this.dialogRef.close({ success: true, data: res.data });
          }
        });
    }
  }
}

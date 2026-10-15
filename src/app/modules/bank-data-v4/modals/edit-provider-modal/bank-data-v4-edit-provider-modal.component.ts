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

export interface IBankDataV4EditProviderModalData {
  provider: { providerId: string; providerName: string };
}

@Component({
  selector: 'app-bank-data-v4-edit-provider-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './bank-data-v4-edit-provider-modal.component.html'
})
export class BankDataV4EditProviderModalComponent {
  readonly XIcon = X;

  private fb = inject(FormBuilder);
  private dialogRef =
    inject<MatDialogRef<BankDataV4EditProviderModalComponent>>(MatDialogRef);

  private api = inject(BankDataV4ApiService);
  private alertService = inject(V4AlertService);
  private data = inject<IBankDataV4EditProviderModalData>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    name: [this.data?.provider?.providerName ?? '', [Validators.required]]
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
    this.api
      .updateProvider({ id: this.data.provider.providerId, name })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res: { success?: boolean }) => {
        if (res?.success) {
          this.alertService.successAlert({ content: 'Bank name updated' });
          this.dialogRef.close({ success: true });
        }
      });
  }
}

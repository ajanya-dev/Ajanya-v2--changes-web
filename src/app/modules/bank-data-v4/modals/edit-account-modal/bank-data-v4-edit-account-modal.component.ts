import { Component, inject, OnInit, signal } from '@angular/core';
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
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IBankDataAccount } from 'src/app/modules/bank/bank-v3/model/bank-v35';
import { BankDataV4ApiService } from '../../services/bank-data-v4-api.service';

export interface IBankDataV4EditAccountModalData {
  account: IBankDataAccount;
  providerName: string;
  companies: { id: string; name: string }[];
}

@Component({
  selector: 'app-bank-data-v4-edit-account-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4SelectDropdownComponent
  ],
  templateUrl: './bank-data-v4-edit-account-modal.component.html'
})
export class BankDataV4EditAccountModalComponent implements OnInit {
  readonly XIcon = X;

  private fb = inject(FormBuilder);
  private dialogRef =
    inject<MatDialogRef<BankDataV4EditAccountModalComponent>>(MatDialogRef);

  private api = inject(BankDataV4ApiService);
  private alertService = inject(V4AlertService);
  private data = inject<IBankDataV4EditAccountModalData>(MAT_DIALOG_DATA);

  providerName = this.data?.providerName ?? '';
  originalAccountName = signal('');
  isLoading = signal(true);
  isSaving = signal(false);
  selectedCompanyId = signal<string | null>(null);

  companyOptions: IV4SelectOption[] = [];

  form = this.fb.nonNullable.group({
    nick_name: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.companyOptions = (this.data?.companies ?? []).map(
      (c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
        value: c.id
      })
    );
    this.loadAccountData();
  }

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const body = {
      id: this.data.account.id,
      nick_name: this.form.controls.nick_name.value.trim(),
      company: this.selectedCompanyId()
    };

    this.api
      .updateBank(body)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res: { success?: boolean }) => {
        if (res?.success) {
          this.alertService.successAlert({ content: 'Account updated' });
          this.dialogRef.close({ success: true });
        }
      });
  }

  private loadAccountData(): void {
    this.api
      .getAccountData(this.data.account.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: {
          data?: { nickName?: string; accountName?: string; company?: string };
        }) => {
          const d = res?.data;
          if (d) {
            this.originalAccountName.set(d.accountName ?? '');
            this.form.controls.nick_name.setValue(d.nickName ?? '');
            if (d.company) {
              this.selectedCompanyId.set(d.company);
            }
          }
        },
        error: () => this.isLoading.set(false)
      });
  }
}

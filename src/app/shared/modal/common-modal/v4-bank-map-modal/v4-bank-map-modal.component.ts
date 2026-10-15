import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';
import { IInvoiceRowData } from 'src/app/modules/invoices/model/invoice';
import { IBankDropdown } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

enum ThirdpartyProviderCode {
  'xero' = 2,
  'zoho_books' = 3,
  'sage_business' = 5
}

interface IBankMapData {
  id: string;
  tableId: unknown;
  selectedRow: IInvoiceRowData;
}

@Component({
  selector: 'app-v4-bank-map-modal',
  templateUrl: './v4-bank-map-modal.component.html',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatDialogClose,
    BankAcDropdownV4Component,
    CommonButtonV4Component
  ]
})
export class V4BankMapModalComponent {
  readonly dialogData: IBankMapData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<V4BankMapModalComponent>);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(V4AlertService);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;

  selectedBankAccount: IBankDropdown | null = null;
  isDisabled = signal(true);
  isUpdating = signal(false);

  onChangeBank(bank: IBankDropdown | null | undefined): void {
    if (!bank?.id) {
      this.selectedBankAccount = null;
      this.isDisabled.set(true);
      return;
    }
    this.selectedBankAccount = bank;
    const providerType =
      this.dialogData.selectedRow.third_party_invoice?.provider_type;

    if (this.dialogData.selectedRow.status === 16) {
      this.isDisabled.set(false);
      return;
    }

    if (providerType === 3 || providerType === 2 || providerType === 5) {
      this.invoiceService
        .Bankchecking(
          bank.id,
          this.dialogData.selectedRow.action,
          'invoice',
          ThirdpartyProviderCode[providerType as number]
        )
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isDisabled.set(false)),
          catchError((error) => {
            if (error.error?.errorCode === 600) {
              this.alertService
                .confirmAlert({ content: error.error.errorMsg })
                .afterClosed()
                .subscribe((res) => {
                  if (!res) {
                    this.isDisabled.set(true);
                    this.selectedBankAccount = null;
                    this.sharedService.setNewBankCreatedData();
                  } else {
                    this.isDisabled.set(false);
                  }
                });
            }
            return of(false);
          })
        )
        .subscribe();
    } else {
      this.isDisabled.set(false);
    }
  }

  update(): void {
    if (this.isDisabled() || !this.selectedBankAccount) return;
    const row = this.dialogData.selectedRow;
    const bankId = this.selectedBankAccount.id;
    const accountStatusCodes = [15, 17];

    this.isUpdating.set(true);

    if (row.status === 16) {
      const formData = new FormData();
      formData.append('bankAccountId', bankId);
      formData.append('invoiceId', row.action);
      this.invoiceService
        .mapNetSuiteAccountInvoice(formData)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isUpdating.set(false))
        )
        .subscribe((res) => {
          if (res.success) this.onSuccess();
        });
    } else if (accountStatusCodes.includes(row.status)) {
      const formData = new FormData();
      formData.append('bankAccountId', bankId);
      formData.append('invoiceId', row.action);
      this.invoiceService
        .mapAccountingInvoice(formData)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isUpdating.set(false))
        )
        .subscribe((res) => {
          if (res.success) this.onSuccess();
        });
    } else {
      const formData = new FormData();
      formData.append('bank_account', bankId);
      formData.append('invoice_id', row.action);
      this.invoiceService
        .mapBankAccountInvoice(formData)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isUpdating.set(false))
        )
        .subscribe((res) => {
          if (res.success) this.onSuccess();
        });
    }
  }

  private onSuccess(): void {
    this.alertService.successAlert({
      content: 'Bank account mapped successfully.',
      close: true
    });
    this.dialogRef.close({ success: true });
  }
}

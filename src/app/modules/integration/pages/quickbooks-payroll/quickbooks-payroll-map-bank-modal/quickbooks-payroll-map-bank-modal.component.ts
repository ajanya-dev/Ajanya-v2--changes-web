import { Component, inject } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

/**
 * Data the mapping page passes into the modal.
 */
interface IQuickbooksPayrollMapBankModalData {
  id: string;
  companyName: string;
  editMode: boolean;
}

/**
 * Maps an OCW bank account to a QuickBooks Payroll company. The same endpoint
 * backs both Map Now and edit.
 */
@Component({
  selector: 'app-quickbooks-payroll-map-bank-modal',
  templateUrl: './quickbooks-payroll-map-bank-modal.component.html',
  styleUrls: ['./quickbooks-payroll-map-bank-modal.component.scss'],
  standalone: true,
  imports: [
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class QuickbooksPayrollMapBankModalComponent {
  data = inject<IQuickbooksPayrollMapBankModalData>(MAT_DIALOG_DATA);
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private dialogRef = inject(
    MatDialogRef<QuickbooksPayrollMapBankModalComponent>
  );

  loading = false;
  bankAccount = new UntypedFormControl('', Validators.required);

  /**
   * Maps or updates the bank account and alerts with the message returned by
   * the API.
   */
  submit(): void {
    if (this.loading) {
      return;
    }
    this.bankAccount.markAsTouched();
    if (this.bankAccount.invalid) {
      return;
    }
    this.loading = true;
    this.integrationService
      .mapQuickbooksPayrollBankAccount({
        id: this.data.id,
        bankAccountId: this.bankAccount.value
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message ?? '',
            close: true
          });
          this.dialogRef.close({ success: true });
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }

  /**
   * Keeps the selected bank account id on the control.
   * @param ev Selected bank account.
   */
  bankDropDownChange(ev: { id: string }): void {
    this.bankAccount.setValue(ev?.id ?? '');
  }
}

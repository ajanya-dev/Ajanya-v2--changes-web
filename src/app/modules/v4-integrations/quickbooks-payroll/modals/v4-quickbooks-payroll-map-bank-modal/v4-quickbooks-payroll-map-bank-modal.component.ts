import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IBankDropdown } from 'src/app/models/bank';
import { IQuickbooksPayrollBankMapping } from 'src/app/modules/integration/model/integration';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

/**
 * Maps an OCW bank account to a QuickBooks Payroll company. The same endpoint
 * backs both Map Now and edit.
 */
@Component({
  selector: 'app-v4-quickbooks-payroll-map-bank-modal',
  standalone: true,
  templateUrl: './v4-quickbooks-payroll-map-bank-modal.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    V4ControlMessageComponent
  ]
})
export class V4QuickbooksPayrollMapBankModalComponent implements OnInit {
  private dialogRef = inject(
    MatDialogRef<V4QuickbooksPayrollMapBankModalComponent>
  );
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly data: { bank: IQuickbooksPayrollBankMapping; mode?: 'edit' } =
    inject(MAT_DIALOG_DATA);

  loading = false;
  editmode = false;

  mapForm = new FormGroup({
    bankAccount: new FormControl('', Validators.required)
  });

  ngOnInit(): void {
    this.editmode = this.data.mode === 'edit';
  }

  /**
   * Keeps the selected bank account id on the control.
   * @param ev Selected bank account.
   */
  bankDropDownChange(ev: IBankDropdown | null | undefined): void {
    this.mapForm.controls.bankAccount.setValue(ev?.id ?? '');
  }

  /**
   * Maps or updates the bank account and alerts with the message returned by
   * the API.
   */
  submit(): void {
    this.mapForm.markAllAsTouched();
    if (this.mapForm.invalid || this.loading) return;

    this.loading = true;
    this.integrationService
      .mapQuickbooksPayrollBankAccount({
        id: this.data.bank.id,
        bankAccountId: this.mapForm.value.bankAccount as string
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message ?? '',
            close: true
          });
          this.dialogRef.close(true);
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }
}

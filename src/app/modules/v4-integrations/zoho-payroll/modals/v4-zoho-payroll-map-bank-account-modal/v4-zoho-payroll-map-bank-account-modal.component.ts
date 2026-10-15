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
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { IBankDropdown } from 'src/app/models/bank';
import { IMappingBankAccount } from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-zoho-payroll-map-bank-account-modal',
  standalone: true,
  templateUrl: './v4-zoho-payroll-map-bank-account-modal.component.html',
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
export class V4ZohoPayrollMapBankAccountModalComponent implements OnInit {
  private dialogRef = inject(
    MatDialogRef<V4ZohoPayrollMapBankAccountModalComponent>
  );

  private destroyRef = inject(DestroyRef);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);

  readonly data: { bank: IMappingBankAccount; mode?: 'edit' } =
    inject(MAT_DIALOG_DATA);

  readonly providerCode = 'zoho_payroll' as const;

  loading = false;
  editmode = false;

  mapForm = new FormGroup({
    bankAccount: new FormControl('', Validators.required)
  });

  ngOnInit(): void {
    this.editmode = this.data.mode === 'edit';
  }

  bankDropDownChange(ev: IBankDropdown | null | undefined): void {
    this.mapForm.controls.bankAccount.setValue(ev?.id ?? '');
  }

  submit(): void {
    this.mapForm.markAllAsTouched();
    if (this.mapForm.invalid || this.loading) return;

    const postData = {
      bank_account: this.mapForm.value.bankAccount as string,
      id: this.data.bank.id
    };

    this.loading = true;
    this.integrationService
      .mapBankAccount(postData, this.providerCode)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: this.editmode
              ? 'Bank account mapping updated.'
              : 'Bank account mapped successfully.',
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }
}

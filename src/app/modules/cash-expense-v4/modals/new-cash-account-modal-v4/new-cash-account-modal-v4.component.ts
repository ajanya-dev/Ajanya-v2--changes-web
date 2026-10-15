import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, finalize, of } from 'rxjs';

import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { ICashAccount } from 'src/app/modules/Cash-Expense/model/CashExpense';

@Component({
  selector: 'app-new-cash-account-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    CommonInputFieldV4Component,
    CommonAmountInputV4Component
  ],
  templateUrl: './new-cash-account-modal-v4.component.html',
  styleUrls: ['./new-cash-account-modal-v4.component.scss']
})
export class NewCashAccountModalV4Component {
  private cashExpenseService = inject(CashExpenseService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<NewCashAccountModalV4Component>);
  private destroyRef = inject(DestroyRef);

  isSaving = signal(false);

  cashForm = new FormGroup({
    cashAccountName: new FormControl('', [
      Validators.required,
      Validators.minLength(5)
    ]),
    cashAccountNickName: new FormControl('', [Validators.required]),
    cashAccountStartingBalance: new FormControl('', [Validators.required])
  });

  submit(): void {
    this.cashForm.markAllAsTouched();
    if (this.cashForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    const body: ICashAccount = {
      cash_account_name: this.cashForm.value.cashAccountName || '',
      balance: Number(this.cashForm.value.cashAccountStartingBalance) || 0,
      nickname: this.cashForm.value.cashAccountNickName || ''
    };

    this.cashExpenseService
      .AddCashAccount(body)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            title: 'Success!',
            content: 'Cash Account Added.',
            close: true
          });
          this.dialogRef.close({
            success: true,
            id: res.data.id,
            name: body.cash_account_name
          });
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  numberOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      return false;
    }
    return true;
  }
}

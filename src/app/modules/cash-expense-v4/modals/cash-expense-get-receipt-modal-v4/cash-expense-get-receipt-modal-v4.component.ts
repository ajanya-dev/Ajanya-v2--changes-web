import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';

import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

interface IReceiptModalData {
  cashExpenseId: string;
}

@Component({
  selector: 'app-cash-expense-get-receipt-modal-v4',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './cash-expense-get-receipt-modal-v4.component.html'
})
export class CashExpenseGetReceiptModalV4Component implements OnInit {
  data: IReceiptModalData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<CashExpenseGetReceiptModalV4Component>);
  private cashExpenseService = inject(CashExpenseService);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  receiptType = signal<'sms' | 'email'>('sms');
  smsLoading = signal(false);
  emailLoading = signal(false);

  smsForm = new FormGroup({
    payee_phone: new FormControl('', [Validators.required, Validators.minLength(10)])
  });

  emailForm = new FormGroup({
    payeeEmail: new FormControl('', [Validators.required, ValidationService.emailValidator])
  });

  smsCost = signal('$0.00');

  ngOnInit(): void {
    this.loadPayeeDetails();

    // Update SMS cost when phone changes
    this.smsForm.controls.payee_phone.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.smsCost.set(val && this.receiptType() === 'sms' ? '$0.50' : '$0.00');
      });
  }

  private loadPayeeDetails(): void {
    this.cashExpenseService
      .getCashExpensesById(this.data.cashExpenseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          const payeeId = data?.payee?.payeeId;
          if (payeeId) {
            this.payeeService
              .showPayee(payeeId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((payeeRes) => {
                if (payeeRes.success) {
                  this.emailForm.patchValue({ payeeEmail: payeeRes.data.email || '' });
                  this.smsForm.patchValue({ payee_phone: payeeRes.data.phone || '' });
                }
              });
          }
        }
      });
  }

  setReceiptType(type: 'sms' | 'email'): void {
    this.receiptType.set(type);
    this.smsCost.set(
      type === 'sms' && this.smsForm.controls.payee_phone.value ? '$0.50' : '$0.00'
    );
  }

  sendSMS(): void {
    this.smsForm.markAllAsTouched();
    if (this.smsForm.invalid) {
      if (this.smsForm.controls.payee_phone.value &&
        this.smsForm.controls.payee_phone.value.length < 10) {
        this.alertService.warningAlert({ content: 'Please enter a valid phone number' });
      }
      return;
    }

    this.smsLoading.set(true);
    this.cashExpenseService
      .sendSignOnReceiptSMS(this.data.cashExpenseId, {
        sms: this.smsForm.controls.payee_phone.value!
      })
      .pipe(
        finalize(() => this.smsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ content: res.data, close: true });
          this.dialogRef.close({ success: true });
        }
      });
  }

  sendEmail(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;

    this.emailLoading.set(true);
    this.cashExpenseService
      .sendSignOnReceiptEmail(this.data.cashExpenseId, {
        email: this.emailForm.controls.payeeEmail.value!
      })
      .pipe(
        finalize(() => this.emailLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ content: res.data, close: true });
          this.dialogRef.close({ success: true });
        } else {
          this.alertService.warningAlert({ content: res.errorMsg || 'Failed to send email' });
        }
      });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

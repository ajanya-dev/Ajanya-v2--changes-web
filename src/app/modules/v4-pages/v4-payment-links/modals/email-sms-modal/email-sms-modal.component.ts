import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

interface EmailSmsModalData {
  link: string;
  amount: number;
  bankName: string;
  slugUrl: string;
  id: string;
  type: 'email' | 'sms';
}

@Component({
  selector: 'app-email-sms-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    MatTooltipModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './email-sms-modal.component.html'
})
export class EmailSmsModalComponent {
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<EmailSmsModalComponent>);
  private destroyRef = inject(DestroyRef);
  public data = inject<EmailSmsModalData>(MAT_DIALOG_DATA);

  isSubmit = signal(false);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, ValidationService.emailValidator]),
    phone: new FormControl('', [Validators.required, ValidationService.phoneNumberValidator]),
    message: new FormControl(''),
    shortUrl: new FormControl(this.data.slugUrl)
  });

  get isEmail() {
    return this.data.type === 'email';
  }

  submit() {
    const controlToReset = this.isEmail ? 'phone' : 'email';
    this.form.controls[controlToReset].clearValidators();
    this.form.controls[controlToReset].updateValueAndValidity();

    if (!this.isEmail) {
      this.form.controls.phone.setValue(this.phoneNumberMask(this.form.value.phone as string));
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSubmit.set(true);
    const payload: Record<string, unknown> = { shortUrl: this.form.value.shortUrl };

    if (this.isEmail) {
      payload['email'] = this.form.value.email;
      payload['message'] = this.form.value.message;
    } else {
      payload['phone'] = this.form.value.phone;
    }

    const service$ = this.isEmail
      ? this.paymentLinkService.emailLink(payload, this.data.id)
      : this.paymentLinkService.smsLink(payload, this.data.id);

    service$
      .pipe(finalize(() => this.isSubmit.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.data });
          this.dialogRef.close(true);
        }
      });
  }

  private phoneNumberMask(phone: string): string {
    const num = String(phone);
    return `(${num.substring(0, 3)}) ${num.substring(3, 6)}-${num.substring(6, 10)}`;
  }

  addMessage(type: 'amount' | 'bank') {
    let msg = this.form.value.message || '';
    msg += type === 'bank' ? ` ${this.data.bankName}` : ` ${this.data.amount}`;
    this.form.controls.message.patchValue(msg);
  }
}

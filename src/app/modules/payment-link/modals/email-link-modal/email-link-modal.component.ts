import { Component, inject, OnDestroy, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { finalize, Subscription } from 'rxjs';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

interface IInjectdata {
  link: string;
  amount: number;
  bankName: string;
  slugUrl: string;
  id: string;
  type: string;
}

@Component({
  selector: 'app-email-link-modal',
  templateUrl: './email-link-modal.component.html',
  styleUrls: ['./email-link-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FaIconComponent
  ]
})
export class EmailLinkModalComponent implements OnDestroy {
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<EmailLinkModalComponent>);
  public injectedData: IInjectdata = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  faXmark = faXmark;
  isSubmit = signal(false);

  emailLinkForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      ValidationService.emailValidator
    ]),
    phone: new FormControl('', [
      Validators.required,
      ValidationService.phoneNumberValidator
    ]),
    message: new FormControl(''),
    shortUrl: new FormControl(this.injectedData.slugUrl)
  });

  submit() {
    const isEmail = this.injectedData.type === 'email';
    const form = this.emailLinkForm;
    const controlToReset = isEmail ? 'phone' : 'email';

    form.controls[controlToReset].clearValidators();
    form.controls[controlToReset].updateValueAndValidity();
    delete form.value[controlToReset];

    if (!isEmail) {
      delete form.value.message;
      form.controls.phone.setValue(
        this.phoneNumberMask(form.value.phone as string)
      );
    }

    form.markAllAsTouched();
    if (form.invalid) return;
    this.isSubmit.set(true);
    const service = isEmail ? 'emailLink' : 'smsLink';
    this.subscriptions.push(
      this.paymentLinkService[service](form.value, this.injectedData.id)
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({ content: res.data });
            this.dialogRef.close(true);
          }
        })
    );
  }

  phoneNumberMask(phone: string) {
    const num = String(phone);

    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);

    const number = `(${num1}) ${num2}-${num3}`;
    return number;
  }

  addMessage(type: 'amount' | 'bank') {
    let currentMsg = this.emailLinkForm.value.message;
    if (type === 'bank') {
      currentMsg += ` ${this.injectedData.bankName}`;
    } else {
      currentMsg += ` ${this.injectedData.amount}`;
    }
    this.emailLinkForm.controls.message.patchValue(currentMsg as string);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

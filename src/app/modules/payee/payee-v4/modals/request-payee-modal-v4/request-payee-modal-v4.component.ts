import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';

interface IPayeeRequestData {
  payeeEmail: string;
  payeePhone: string;
  payeeType: string;
}

@Component({
  selector: 'app-request-payee-modal-v4',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component
  ],
  templateUrl: './request-payee-modal-v4.component.html',
  styleUrls: ['./request-payee-modal-v4.component.scss']
})
export class RequestPayeeModalV4Component implements OnInit {
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<RequestPayeeModalV4Component>);
  private destroyRef = inject(DestroyRef);
  private payeeData: IPayeeRequestData = inject(MAT_DIALOG_DATA);

  loading = signal(false);

  form = new FormGroup({
    payeeEmail: new FormControl(''),
    payeePhone: new FormControl(''),
    emailCheck: new FormControl(false),
    phoneCheck: new FormControl(false)
  });

  ngOnInit(): void {
    this.setPayeeData();
    this.watchCheckboxChanges();
  }

  close() {
    this.dialogRef.close();
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { emailCheck, phoneCheck, payeeEmail, payeePhone } =
      this.form.value;
    const payload = {
      payee_id: this.payeeData?.payeeType ?? '',
      payee_email: emailCheck ? payeeEmail : null,
      payee_phone: phoneCheck ? payeePhone : null,
      permission_email: emailCheck ? 1 : 0,
      permission_sms: phoneCheck ? 1 : 0
    };

    this.loading.set(true);
    this.payeeService
      .requestPayeeAdd(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res?.success) {
          if (payload.permission_email && !payload.permission_sms) {
            this.alertService.successAlert({
              content: 'Email sent successfully.',
              close: true
            });
          } else if (payload.permission_sms && !payload.permission_email) {
            this.alertService.successAlert({
              content: 'SMS sent successfully.',
              close: true
            });
          } else {
            this.alertService.successAlert({
              content: 'Email and SMS sent successfully.',
              close: true
            });
          }
          this.dialogRef.close({ success: true });
        }
      });
  }

  private setPayeeData() {
    const { payeeEmail = '', payeePhone = '' } = this.payeeData ?? {};

    if (payeeEmail) {
      this.form.controls.payeeEmail.setValue(payeeEmail);
      this.form.controls.emailCheck.setValue(true);
    }

    if (payeePhone) {
      this.form.controls.payeePhone.setValue(payeePhone);
      if (!payeeEmail) {
        this.form.controls.phoneCheck.setValue(true);
      }
    }

    if (!payeeEmail && !payeePhone) {
      this.form.controls.emailCheck.setValue(true);
    }

    this.updateEmailValidation(this.form.controls.emailCheck.value!);
    this.updatePhoneValidation(this.form.controls.phoneCheck.value!);
  }

  private watchCheckboxChanges() {
    this.form.controls.emailCheck.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checked) => this.updateEmailValidation(checked!));

    this.form.controls.phoneCheck.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checked) => this.updatePhoneValidation(checked!));
  }

  private updateEmailValidation(checked: boolean) {
    const ctrl = this.form.controls.payeeEmail;
    if (checked) {
      ctrl.enable();
      ctrl.setValidators([Validators.required, ValidationService.emailValidator]);
    } else {
      ctrl.disable();
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  private updatePhoneValidation(checked: boolean) {
    const ctrl = this.form.controls.payeePhone;
    if (checked) {
      ctrl.enable();
      ctrl.setValidators([Validators.required, ValidationService.phoneMinLength]);
    } else {
      ctrl.disable();
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }
}

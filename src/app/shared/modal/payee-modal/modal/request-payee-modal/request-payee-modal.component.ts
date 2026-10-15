import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { NewPhoneInputComponent } from '../../../../components/new-phone-input/new-phone-input.component';

interface IPayeeRequestData {
  payeeEmail: string;
  payeePhone: string;
  payeeType: string;
}

/**
 * @description Modal component for requesting payee to add bank account (in add payee modal).
 */
@Component({
  selector: 'app-request-payee-modal',
  templateUrl: './request-payee-modal.component.html',
  styleUrls: ['./request-payee-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FaIconComponent,
    CommonButtonV35Component,
    NewPhoneInputComponent,
    MatDialogClose
  ]
})
export class RequestPayeeModalComponent implements OnInit, OnDestroy {
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private matDilogRef = inject(MatDialogRef<RequestPayeeModalComponent>);
  private payeeData: IPayeeRequestData = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  loading = false;
  faXmark = faXmark;

  requestpayeeForm = new FormGroup({
    payeeEmail: new FormControl(''),
    payeePhone: new FormControl(''),
    emailCheck: new FormControl(false),
    phoneCheck: new FormControl(false)
  });

  ngOnInit(): void {
    this.setPayeeData();
    this.obserVableChange();
  }

  /**
   * @description Updates the `requestPayeeForm` with data from `this.payeeData` (from dialog data).
   */
  setPayeeData() {
    // Destructure payeeData to avoid repeated null checks
    const { payeeEmail = '', payeePhone = '' } = this.payeeData ?? {};

    // Handle email setting
    if (payeeEmail) {
      this.requestpayeeForm.get('payeeEmail')?.setValue(payeeEmail);
      this.requestpayeeForm.get('emailCheck')?.setValue(true);
    }

    // Handle phone setting
    if (payeePhone) {
      this.requestpayeeForm.get('payeePhone')?.setValue(payeePhone);

      // Only set phone check to true if email is not already checked
      const isEmailChecked = this.requestpayeeForm.get('emailCheck')?.value;
      if (!isEmailChecked) {
        this.requestpayeeForm.get('phoneCheck')?.setValue(true);
      }
    }

    // Fallback: If no email or phone, default to email check
    if (!payeeEmail && !payeePhone) {
      this.requestpayeeForm.get('emailCheck')?.setValue(true);
    }

    const isEmailChecked = this.requestpayeeForm.controls.emailCheck.value;
    const isPhoneChecked = this.requestpayeeForm.controls.phoneCheck.value;
    this.handleEmailFieldValidation(isEmailChecked as boolean);
    this.handlePhoneFieldValidation(isPhoneChecked as boolean);
  }

  obserVableChange() {
    this.subscriptions.push(
      this.requestpayeeForm.controls.emailCheck.valueChanges.subscribe(
        (res) => {
          this.handleEmailFieldValidation(res as boolean);
        }
      )
    );
    this.subscriptions.push(
      this.requestpayeeForm.controls.phoneCheck.valueChanges.subscribe(
        (res) => {
          this.handlePhoneFieldValidation(res as boolean);
        }
      )
    );
  }

  private handleEmailFieldValidation(isChecked: boolean): void {
    const payeeEmailControl = this.requestpayeeForm.get('payeeEmail');

    if (payeeEmailControl) {
      if (isChecked) {
        payeeEmailControl.enable();
        payeeEmailControl.setValidators([
          Validators.required,
          ValidationService.emailValidator
        ]);
      } else {
        payeeEmailControl.disable();
        payeeEmailControl.clearValidators();
      }
      payeeEmailControl.updateValueAndValidity();
    }
  }

  private handlePhoneFieldValidation(isChecked: boolean): void {
    const payeePhoneControl = this.requestpayeeForm.get('payeePhone');

    if (payeePhoneControl) {
      if (isChecked) {
        payeePhoneControl.enable();
        payeePhoneControl.setValidators([
          Validators.required,
          ValidationService.phoneMinLength
        ]);
      } else {
        payeePhoneControl.disable();
        payeePhoneControl.clearValidators();
      }
      payeePhoneControl.updateValueAndValidity();
    }
  }

  /**
   * @description Method invoked when submit is clicked in template.
   * Creates payload data and submits it to `requestPayeeAdd` method of payee service.
   */
  onSubmit() {
    this.requestpayeeForm.markAllAsTouched();
    if (this.requestpayeeForm.invalid) {
      return;
    }

    const formValue = this.requestpayeeForm.value;
    const isEmailChecked = formValue.emailCheck;
    const isPhoneChecked = formValue.phoneCheck;
    const payload = {
      payee_id: this.payeeData ? this.payeeData.payeeType : '',
      payee_email: isEmailChecked ? formValue.payeeEmail : null,
      payee_phone: isPhoneChecked ? formValue.payeePhone : null,
      permission_email: isEmailChecked ? 1 : 0,
      permission_sms: isPhoneChecked ? 1 : 0
    };

    this.loading = true;
    this.subscriptions.push(
      this.payeeService
        .requestPayeeAdd(payload)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
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
                content: 'Sms sent successfully.',
                close: true
              });
            } else {
              this.alertService.successAlert({
                content: 'Email and Sms sent successfully.',
                close: true
              });
            }
            this.matDilogRef.close({ success: true });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}

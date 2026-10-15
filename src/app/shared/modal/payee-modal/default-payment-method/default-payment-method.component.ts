import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { addPayeeData } from 'src/app/data/data/payee';
import { IPayeeDetails } from 'src/app/modules/payee/payee-v2/model/payee';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { NgFor, NgStyle } from '@angular/common';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Modal component for updating default payment method.
 */
@Component({
  selector: 'app-default-payment-method',
  templateUrl: './default-payment-method.component.html',
  styleUrls: ['./default-payment-method.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    ControlMessageComponent,
    NgFor,
    NgStyle,
    FontAwesomeModule,
    CommonButtonV35Component
  ]
})
export class DefaultPaymentMethodComponent implements OnInit, OnDestroy {

  public data: { payeeId: string } = inject(MAT_DIALOG_DATA);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<DefaultPaymentMethodComponent>);
  private fb = inject(FormBuilder);

  subscriptions: Subscription[] = [];
  DefaultPayMethods = addPayeeData.loadDefaultPayMethod();
  submitting = false;
  payeeData: IPayeeDetails;
  updateForm: FormGroup;
  faXmark = faXmark;

  ngOnInit(): void {
    this.initForm();
    this.getPayeeEditData();
  }

  /**
   * @description Initializes update form.
   */
  initForm() {
    this.updateForm = this.fb.group({
      payeeTypeId: ['', Validators.required],
      defaultPaymentMethod: ['', Validators.required]
    });
  }

  /**
   * @description Gets payee edit data and sets it to `this.payeeData`.
   */
  getPayeeEditData() {
    this.subscriptions.push(
      this.payeeService
        .getPayeeEditData(this.data?.payeeId)
        .subscribe((data) => {
          if (data?.success) {
            this.payeeData = data.data;
            this.updateForm.controls.payeeTypeId.setValue(
              data.data?.payeeTypeId?.toString()
            );
          }
        })
    );
  }

  /**
   * @description Method to submit the data to `updatePaymentMethod` method of payee service.
   */
  submit() {
    if (this.updateForm.invalid) {
      return;
    }

    const body = {
      id: this.data?.payeeId,
      ...this.updateForm.value
    };

    this.submitting = true;
    this.subscriptions.push(
      this.payeeService
        .updatePaymentMethod(body)
        .pipe(finalize(() => {(this.submitting = false);}))
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              content: 'Default payment method updated'
            });
            this.dialogRef.close({ success: true });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

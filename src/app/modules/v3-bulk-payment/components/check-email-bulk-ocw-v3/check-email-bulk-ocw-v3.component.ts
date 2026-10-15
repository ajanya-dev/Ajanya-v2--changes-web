import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { IEchecks } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { MatDialog } from '@angular/material/dialog';
import { CheckAddAttachmentModalComponent } from 'src/app/modules/check/modal/check-add-attachment-modal/check-add-attachment-modal.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { EmailMessageModalComponent } from 'src/app/modules/check/modal/email-message-modal/email-message-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatBadge } from '@angular/material/badge';
import { NewPhoneInputComponent } from '../../../../shared/components/new-phone-input/new-phone-input.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

/**
 * @description Component for check email in bulk payments.
 */
@Component({
  selector: 'app-check-email-bulk-ocw-v3',
  templateUrl: './check-email-bulk-ocw-v3.component.html',
  styleUrls: ['./check-email-bulk-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    MatTooltip,
    NewPhoneInputComponent,
    MatBadge,
    AsyncPipe,
    DecimalPipe,
    ControlMessageComponent,
    MatCheckboxModule,
    FontAwesomeModule
  ]
})
export class CheckEmailBulkOcwV3Component implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);
  private _dialog = inject(MatDialog);
  private _alertService = inject(AlertService);

  isAPILoaded = false;
  subscription: Subscription[] = [];
  dynamicForm: FormGroup;
  attachments: { [key: string]: string[] | string } = {};
  autoAttachmentForCheckMail = false;
  totalAmount = 0;

  faCircleQuestion = faCircleQuestion;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
    this.v3BulkPaymentService.isBulkPayProcessing = true;
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkEmailFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('checkEmailFormArray') as FormArray;
  }

  /**
   * @description Method to create check email form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  checkEmailFormBody(data: IEchecks, checked?: boolean) {
    const phone = data.payee_phone?.replace(/[^0-9]/g, '');    
    let payeePhone = data.payee_phone;
    if (phone?.length === 10) {
      payeePhone = `+1${phone}`;
    } else if (phone && !phone.includes('+') && phone.length > 0) {
      payeePhone = `+${phone}`;
    }
    if(payeePhone.length <3){
      payeePhone = '';
    }
    return this.formBuilder.group({
      checkId: data.enc_cheque_id,
      payee_name: data.payee_name,
      bank_name: data.bank_account_nick_name
        ? data.bank_account_nick_name
        : data.bank_account_account_name,
      payee_email: [
        data.payee_email ? data.payee_email : '',
        [Validators.required, ValidationService.emailValidator]
      ],
      checked: data.payee_phone?.length === 10 ? checked : false,
      payee_phone: [payeePhone, [ValidationService.phoneMinLength]],
      cheque_serial_number: data.cheque_serial_number,
      existingAttach: data.existing_attach,
      cheque_amount: data.cheque_amount,
      cost:
        payeePhone?.length === 10
          ? Number(data.subfee) + 0.5
          : data.subfee,
      added_attachments: data.added_attachments,
      existingAttachments: [data.attachments],
      attachments: [data.attachments]
    });
  }

  /**
   * @description Method to set the data to the form.
   */
  setFormData() {
    let checkIdList: string[] = [];
    this.subscription.push(
      this.v3BulkPaymentService.checkEmailPayments.subscribe((data) => {
        checkIdList = [];
        const checkEmailPayments = data;
        checkEmailPayments?.forEach((rowData) => {
          checkIdList.push(rowData?.transferId);
        });
        this.v3BulkPaymentService
          .getCheckEmailDetails({ ids: checkIdList })
          .pipe(finalize(() => (this.isAPILoaded = true)))
          .subscribe({
            next: (res) => {
              res?.data?.email?.forEach((checkData) => {
                this.getFormControl().push(
                  this.checkEmailFormBody(
                    checkData,
                    res?.data?.user_notification_sms_enabled
                  )
                );
                this.checkTheExistingAttachments(checkData.enc_cheque_id);
                /** auto attachment along with Echeck is enable/disable value */
                if (res?.data?.is_auto_attachment_enabled === 1) {
                  this.autoAttachmentForCheckMail = false;
                } else {
                  this.autoAttachmentForCheckMail = true;
                }
                this.countTotal();
              });
            }
          });
      })
    );
  }

  /**
   * @description Opens modal window for attachments and updates submitted data.
   * @param checkId - ID of the check.
   */
  openAttachmentModal(checkId: string) {
    const emailForm = this.dynamicForm.get('checkEmailFormArray') as FormArray;
    this.checkTheExistingAttachments(checkId);
    const dialogRef = this._dialog.open(CheckAddAttachmentModalComponent, {
      width: '600px',
      maxWidth: '93%',
      data: {
        checkId,
        acceptFormats: '.pdf',
        attachId: this.attachments[checkId]
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.attachments[data.checkId] = data.ids;
        // this.attachments.fileName = data?.fileName;
        emailForm.controls.forEach((res) => {
          if (
            this.attachments.hasOwnProperty(data.checkId) &&
            data.checkId === res.value.checkId
          ) {
            res.patchValue({
              attachments: this.attachments[res.value.checkId]
            });
          }
        });
      }
    });
  }

  /***
   * @description Method to check for existing attachments when opening attachment modal.
   * @param checkId - ID of check
   */
  checkTheExistingAttachments(checkId: string) {
    const emailForm = this.dynamicForm.get('checkEmailFormArray') as FormArray;
    emailForm?.controls?.forEach((emailData) => {
      if (
        emailData.value.added_attachments > 0 &&
        Object.keys(this.attachments).length === 0 &&
        emailData.value.checkId === checkId
      ) {
        //when it open first time this will work.
        this.attachments[emailData.value.checkId] =
          emailData.value.existingAttachments;
      }
      if (
        emailData.value.added_attachments > 0 &&
        Object.keys(this.attachments).length > 0 &&
        emailData.value.checkId === checkId
      ) {
        //It will check the attachments based on the check id, when it open first time.
        if (!this.attachments.hasOwnProperty(emailData.value.checkId)) {
          this.attachments[emailData.value.checkId] =
            emailData.value.existingAttachments;
        }
      }
    });
  }

  /**
   * @description Opens modal window for email message.
   * @param checkId - ID of check.
   */
  openEmailMessage(checkId: string) {
    this._dialog.open(EmailMessageModalComponent, {
      maxWidth: '93%',
      width: '700px',
      data: { checkId }
    });
  }

  /**
   * @description Method to calculate the total cost.
   */
  countTotal() {
    const emailForm = this.dynamicForm.get('checkEmailFormArray') as FormArray;
    let smsCharge = 0;
    this.totalAmount = 0;
    emailForm?.controls?.forEach((e) => {
      if (e.value.cost) {
        smsCharge += Number(e.value.cost);
      }
    });
    this.totalAmount = smsCharge;
  }

  /**
   * @description Method for phone input validation.
   * @param i - index
   */
  phoneCheck(i: number) {
    const emailForm = this.dynamicForm.get('checkEmailFormArray') as FormArray;
    if (emailForm.controls[i]?.value?.checked) {
      if (!this.phoneNumIsValid(true, i)) {
        const subfee = emailForm.controls[i]?.value?.cost;
        emailForm.controls[i].patchValue({ cost: Number(subfee) - 0.5 });
        emailForm.controls[i].patchValue({ checked: false });
        (
          emailForm.controls[i] as FormGroup
        ).controls.payee_phone?.clearValidators();
      }
    }
  }

  /**
   * @description Method to show warning if the phone number criterions are not met when checking the checkbox input.
   * @param event - checkbox input event.
   * @param index - index
   */
  showPhoneNumWarning(event: any, index: number) {
    const emailForm = this.dynamicForm.get('checkEmailFormArray') as FormArray;
    if (emailForm?.controls[index]?.value?.payee_phone?.length === undefined) {
      this._alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      emailForm.controls[index].patchValue({ checked: false });
      return;
    }
    if (!this.phoneNumIsValid(event.target.checked, index)) {
      this._alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      emailForm.controls[index].patchValue({ checked: false });
      return;
    }
    if (
      this.phoneNumIsValid(event.target.checked, index) &&
      event.target.checked
    ) {
      const subfee = emailForm.controls[index]?.value?.cost;
      emailForm.controls[index].patchValue({ cost: Number(subfee) + 0.5 });
    } else if (
      this.phoneNumIsValid(event.target.checked, index) &&
      !event.target.checked
    ) {
      const subfee = emailForm.controls[index]?.value?.cost;
      emailForm.controls[index].patchValue({ cost: Number(subfee) - 0.5 });
    }

    if (!event.target.checked) {
      (
        emailForm.controls[index] as FormGroup
      ).controls.payee_phone.setValidators(ValidationService.phoneMinLength);
    }
    this.countTotal();
  }

  /**
   * @description Method for phone number validation.
   * @param val - boolean
   * @param index - index
   * @returns boolean indicating valid or invalid.
   */
  phoneNumIsValid(val: boolean, index: number) {
    const emailForm = this.dynamicForm.get('checkEmailFormArray') as FormArray;
    if (
      val &&
      ((emailForm.controls[index] as FormGroup).controls.payee_phone.errors ||
        (emailForm.controls[index].value.payee_phone === (null || '') &&
          emailForm.controls[index].value.payee_phone?.length !== 10))
    ) {
      return false;
    }
    return true;
  }

  onSelectAddress(isOneAddress: boolean) {
    if (isOneAddress) {
      (
        this.dynamicForm.get('checkEmailFormArray') as FormArray
      ).controls.forEach((el) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_email.clearValidators();
        formGroup.controls.payee_phone.clearValidators();
        formGroup.controls.payee_email.updateValueAndValidity();
        formGroup.controls.payee_phone.updateValueAndValidity();
        formGroup.controls.payee_email.markAsUntouched();
        formGroup.controls.payee_phone.markAsUntouched();
        formGroup.controls.payee_email.disable();
        formGroup.controls.payee_phone.disable();
        if (formGroup.controls.checked.value) {
          const subfee = formGroup.controls.cost.value;
          formGroup.controls.cost.setValue(Number(subfee) - 0.5);
        }
        formGroup.controls.checked.setValue(false);
        formGroup.controls.checked.disable();
      });
      const Allsms = document.getElementById(`sms`) as HTMLInputElement;
      Allsms.checked = false;
      this.countTotal();
    } else {
      (
        this.dynamicForm.get('checkEmailFormArray') as FormArray
      ).controls.forEach((el) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_email.setValidators([
          Validators.required,
          ValidationService.emailValidator
        ]);
        formGroup.controls.payee_email.updateValueAndValidity();
        formGroup.controls.payee_email.enable();
        formGroup.controls.payee_phone.enable();
        formGroup.controls.payee_email.markAllAsTouched();
        formGroup.controls.checked.enable();
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}

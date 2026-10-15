import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Subscription, finalize } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { MatBadge } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import {
  LucideAngularModule,
  Mail,
  ChevronDown,
  Landmark,
  Paperclip,
  MessageSquarePlus,
  CircleHelp
} from 'lucide-angular';

import {
  IEchecks,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { V4BulkPaymentService } from 'src/app/modules/v4-bulk-payment/services/v4-bulk-payment.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { EmailMessageModalV4Component } from 'src/app/modules/check/modal/email-message-modal-v4/email-message-modal-v4.component';
import { V4CheckAddAttachmentModalComponent } from 'src/app/modules/check/modal/v4-check-add-attachment-modal/v4-check-add-attachment-modal.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

/**
 * @description V4 component for check email in bulk payment modal.
 */
@Component({
  selector: 'app-v4-check-email-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DecimalPipe,
    MatTooltip,
    MatBadge,
    LucideAngularModule,
    PhoneInputV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './v4-check-email-bulk.component.html',
  styleUrl: './v4-check-email-bulk.component.scss'
})
export class V4CheckEmailBulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private v4BulkPaymentService = inject(V4BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);

  /** Payments data from parent (check-mode-select grouping). */
  payments = input<IZilPyamentLists[]>([]);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;
  private readonly LOADER_KEY = 'check-email-bulk';
  private _isAPILoaded = false;
  get isAPILoaded(): boolean {
    return this._isAPILoaded;
  }
  set isAPILoaded(value: boolean) {
    this._isAPILoaded = value;
    if (value) {
      this.v4BulkPaymentService.markChildReady(this.LOADER_KEY);
    }
  }
  totalAmount = 0;
  autoAttachmentForCheckMail = false;

  /** Attachment tracking per check: { [checkId]: string[] } */
  attachments: { [key: string]: string[] | string } = {};

  readonly MailIcon = Mail;
  readonly ChevronDownIcon = ChevronDown;
  readonly LandmarkIcon = Landmark;
  readonly PaperclipIcon = Paperclip;
  readonly MessageSquarePlusIcon = MessageSquarePlus;
  readonly CircleHelpIcon = CircleHelp;

  ngOnInit(): void {
    this.v4BulkPaymentService.registerChildLoading(this.LOADER_KEY);
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkEmailFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for check email entries.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('checkEmailFormArray') as FormArray;
  }

  /**
   * @description Creates a form group for a single check email payment.
   */
  checkEmailFormBody(data: IEchecks, checked?: boolean): FormGroup {
    return this.formBuilder.group({
      checkId: [data.enc_cheque_id],
      payee_name: [data.payee_name],
      bank_name: [
        data.bank_account_nick_name
          ? data.bank_account_nick_name
          : data.bank_account_account_name
      ],
      payee_email: [
        data.payee_email ? data.payee_email : '',
        [Validators.required, ValidationService.emailValidator]
      ],
      checked: [data.payee_phone?.length === 10 ? checked : false],
      payee_phone: [data.payee_phone, [ValidationService.phoneMinLength]],
      cheque_serial_number: [data.cheque_serial_number],
      existingAttach: [data.existing_attach],
      cheque_amount: [data.cheque_amount],
      cost: [
        data.payee_phone?.length === 10
          ? Number(data.subfee) + 0.5
          : data.subfee
      ],
      added_attachments: [data.added_attachments],
      existingAttachments: [data.attachments],
      attachments: [data.attachments]
    });
  }

  /**
   * @description Uses the payments input to fetch email details from API and populate the form.
   */
  setFormData(): void {
    const checkEmailPayments = this.payments();
    if (!checkEmailPayments?.length) {
      this.isAPILoaded = true;
      return;
    }

    const checkIdList = checkEmailPayments
      .map((rowData) => rowData?.transferId)
      .filter(Boolean);

    this.subscription.push(
      this.v3BulkPaymentService
        .getCheckEmailDetails({ ids: checkIdList })
        .pipe(finalize(() => {this.isAPILoaded = true;}))
        .subscribe({
          next: (res) => {
            res?.data?.email?.forEach((checkData: IEchecks) => {
              this.getFormControl().push(
                this.checkEmailFormBody(
                  checkData,
                  res?.data?.user_notification_sms_enabled
                )
              );
              this.checkTheExistingAttachments(checkData.enc_cheque_id);

              if (res?.data?.is_auto_attachment_enabled === 1) {
                this.autoAttachmentForCheckMail = false;
              } else {
                this.autoAttachmentForCheckMail = true;
              }

              this.countTotal();
            });
          }
        })
    );
  }

  /**
   * @description Calculates the total cost across all email check rows.
   */
  countTotal(): void {
    const emailForm = this.getFormControl();
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
   * @description Handles SMS checkbox toggle. Adjusts cost and validates phone.
   */
  showPhoneNumWarning(event: Event, index: number): void {
    const emailForm = this.getFormControl();
    const target = event.target as HTMLInputElement;

    if (emailForm?.controls[index]?.value?.payee_phone?.length === undefined) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      emailForm.controls[index].patchValue({ checked: false });
      return;
    }

    if (!this.phoneNumIsValid(target.checked, index)) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      emailForm.controls[index].patchValue({ checked: false });
      return;
    }

    if (this.phoneNumIsValid(target.checked, index) && target.checked) {
      const subfee = emailForm.controls[index]?.value?.cost;
      emailForm.controls[index].patchValue({ cost: Number(subfee) + 0.5 });
    } else if (
      this.phoneNumIsValid(target.checked, index) &&
      !target.checked
    ) {
      const subfee = emailForm.controls[index]?.value?.cost;
      emailForm.controls[index].patchValue({ cost: Number(subfee) - 0.5 });
    }

    if (!target.checked) {
      (emailForm.controls[index] as FormGroup).get('payee_phone')
        ?.setValidators(ValidationService.phoneMinLength);
    }

    this.countTotal();
  }

  /**
   * @description Method for phone input validation on input change.
   */
  phoneCheck(index: number): void {
    const emailForm = this.getFormControl();
    if (emailForm.controls[index]?.value?.checked) {
      if (!this.phoneNumIsValid(true, index)) {
        const subfee = emailForm.controls[index]?.value?.cost;
        emailForm.controls[index].patchValue({ cost: Number(subfee) - 0.5 });
        emailForm.controls[index].patchValue({ checked: false });
        (emailForm.controls[index] as FormGroup).get('payee_phone')?.clearValidators();
      }
    }
  }

  /**
   * @description Validates the phone number for a given row.
   */
  phoneNumIsValid(val: boolean, index: number): boolean {
    const emailForm = this.getFormControl();
    const phoneControl = (emailForm.controls[index] as FormGroup).get('payee_phone');
    const phone = phoneControl?.value as string | null | undefined;

    if (val) {
      phoneControl?.updateValueAndValidity();
      if (phoneControl?.errors || !phone) {
        return false;
      }
    }
    return true;
  }

  /**
   * @description Opens attachment modal for a check row.
   */
  openAttachmentModal(checkId: string): void {
    this.checkTheExistingAttachments(checkId);
    const dialogRef = this.dialog.open(V4CheckAddAttachmentModalComponent, {
      disableClose: true,
      maxWidth: '1010px',
      width: '630px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        checkId,
        acceptFormats: '.pdf',
        attachId: this.attachments[checkId]
      }
    });

    dialogRef.afterClosed().subscribe((data: { checkId: string; ids: string[]; fileName: string }) => {
      if (data) {
        this.attachments[data.checkId] = data.ids;
        const emailForm = this.getFormControl();
        emailForm.controls.forEach((res) => {
          if (
            Object.prototype.hasOwnProperty.call(this.attachments, data.checkId) &&
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

  /**
   * @description Checks for existing attachments when opening attachment modal.
   */
  checkTheExistingAttachments(checkId: string): void {
    const emailForm = this.getFormControl();
    emailForm?.controls?.forEach((emailData) => {
      if (
        emailData.value.added_attachments > 0 &&
        Object.keys(this.attachments).length === 0 &&
        emailData.value.checkId === checkId
      ) {
        this.attachments[emailData.value.checkId] =
          emailData.value.existingAttachments;
      }
      if (
        emailData.value.added_attachments > 0 &&
        Object.keys(this.attachments).length > 0 &&
        emailData.value.checkId === checkId
      ) {
        if (!Object.prototype.hasOwnProperty.call(this.attachments, emailData.value.checkId)) {
          this.attachments[emailData.value.checkId] =
            emailData.value.existingAttachments;
        }
      }
    });
  }

  /**
   * @description Gets the attachment count for a specific check.
   */
  getAttachmentCount(checkId: string): number {
    if (this.attachments && this.attachments[checkId]) {
      return (this.attachments[checkId] as string[])?.length || 0;
    }
    return 0;
  }

  /**
   * @description Opens modal window for email message/comment.
   */
  openEmailMessage(checkId: string): void {
    this.dialog.open(EmailMessageModalV4Component, {
      maxWidth: '93%',
      width: '700px',
      data: { checkId },
      panelClass:'paddingless-modal-rounded'
    });
  }

  /**
   * @description Handles "Send to Custom Email" toggle.
   */
  onSelectAddress(isOneAddress: boolean): void {
    const formArray = this.getFormControl();
    if (isOneAddress) {
      formArray.controls.forEach((el) => {
        const formGroup = el as FormGroup;
        formGroup.get('payee_email')?.clearValidators();
        formGroup.get('payee_phone')?.clearValidators();
        formGroup.get('payee_email')?.updateValueAndValidity();
        formGroup.get('payee_phone')?.updateValueAndValidity();
        formGroup.get('payee_email')?.markAsUntouched();
        formGroup.get('payee_phone')?.markAsUntouched();
        formGroup.get('payee_email')?.disable();
        formGroup.get('payee_phone')?.disable();
        if (formGroup.get('checked')?.value) {
          const subfee = formGroup.get('cost')?.value;
          formGroup.get('cost')?.setValue(Number(subfee) - 0.5);
        }
        formGroup.get('checked')?.setValue(false);
        formGroup.get('checked')?.disable();
      });
      this.countTotal();
    } else {
      formArray.controls.forEach((el) => {
        const formGroup = el as FormGroup;
        formGroup.get('payee_email')?.setValidators([
          Validators.required,
          ValidationService.emailValidator
        ]);
        formGroup.get('payee_email')?.updateValueAndValidity();
        formGroup.get('payee_email')?.enable();
        formGroup.get('payee_phone')?.enable();
        formGroup.get('payee_email')?.markAllAsTouched();
        formGroup.get('checked')?.enable();
      });
    }
  }

  ngOnDestroy(): void {
    this.v4BulkPaymentService.markChildReady(this.LOADER_KEY);
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}

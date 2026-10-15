/* eslint-disable no-param-reassign, eqeqeq, no-restricted-syntax, @typescript-eslint/naming-convention, no-underscore-dangle, no-plusplus, @typescript-eslint/no-shadow, no-prototype-builtins, no-nested-ternary */
import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import {
  AbstractControl,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup
} from '@angular/forms';
import {
  DatePipe,
  NgClass,
  DecimalPipe,
  NgOptimizedImage,
  CurrencyPipe
} from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { of } from 'rxjs';
import { finalize, catchError, filter, take } from 'rxjs/operators';
// import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { MatTooltip } from '@angular/material/tooltip';
import { ScriptService } from 'src/app/core/services/script.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Utils } from 'src/app/data/utils';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { IEvent } from 'src/app/modules/invoices/model/invoice';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment } from '@fortawesome/pro-solid-svg-icons';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { RefillCreditRechargeModalV4Component } from 'src/app/modules/v4-refill-credit/modals/refill-credit-recharge-modal-v4/refill-credit-recharge-modal-v4.component';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { V4CheckAddAttachmentModalComponent } from '../v4-check-add-attachment-modal/v4-check-add-attachment-modal.component';
import { EmailMessageModalV4Component } from '../email-message-modal-v4/email-message-modal-v4.component';
import { LastTransactionModalV4Component } from '../mail-modals/last-transaction-modal-v4/last-transaction-modal-v4.component';
import { PhoneInputV4Component } from '../../../../shared/V4/v4-phone-input/v4-phone-input.component';
import { CommonInputFieldV4Component } from '../../../../shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from '../../../../shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import {
  EmailRow,
  CheckEmailDialogData,
  EmailChecksData,
  ApiErrorResponse,
  EmailFormControls
} from './check-email-modal-v4.type';

@Component({
  selector: 'app-check-email-modal',
  templateUrl: './check-email-modal-v4.component.html',
  styleUrls: ['./check-email-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    NgOptimizedImage,
    LucideAngularModule,
    ReactiveFormsModule,
    MatTooltip,
    PhoneInputV4Component,
    MatDialogActions,
    NgClass,
    DecimalPipe,
    MatCheckboxModule,
    TruncatePipe,
    CommonButtonV4Component,
    FontAwesomeModule,
    CurrencyPipe,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    V4DatePickerComponent
  ],
  providers: [DatePipe]
})
export class CheckEmailModalV4Component implements OnInit {
  faComment = faComment;
  public data: CheckEmailDialogData = inject(MAT_DIALOG_DATA);
  private headerservice = inject(HeaderService);
  public dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private recurringRedirect = inject(RecurringRedirectService);
  private fb = inject(FormBuilder);
  public alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<CheckEmailModalV4Component>);
  private router = inject(Router);
  private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private refillCredit = inject(RefillCreditService);
  private datePipe = inject(DatePipe);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  emailChecksData = {} as EmailChecksData;
  totalAmount = signal(0);
  attachments: Record<string, string[] | string> = {};

  emailForm!: FormGroup<EmailFormControls>;
  isSingleCheck = signal(false);
  skipprocess = signal(false);

  emailErrors = signal<EmailRow[]>([]);

  phoneverified = 0;
  emailverified = 0;
  isSubscribed = 0;
  currentCredit = signal('');
  isCreditLoading = signal(false);

  submitting = signal(false);
  autoAttachmentForCheckMail = signal(false);
  utils = Utils;
  allSmsChecked = signal(false);
  isSendToOneAddress = false;

  frequencyOptions = [
    { label: 'Daily', value: '1' },
    { label: 'Weekly', value: '2' },
    { label: 'Monthly', value: '3' },
    { label: 'Bi-Weekly', value: '5' },
    { label: 'Bi-Monthly', value: '6' },
    { label: 'Quarterly', value: '7' }
  ];

  frequencyDropdownConfig = {
    placeholder: 'Select Frequency',
    displayField: 'label',
    outputField: 'value'
  };

  trialPeriodEndsIn: number;

  // Recurring and Schedule properties
  recurring = signal(false);
  scheduleIt = signal(false);
  selectedType = signal('email now');
  mindate: string | null;
  startdatevalid = signal(false);
  position = new FormControl('above');
  sendToOneAddressEmail = new FormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  ngOnInit(): void {
    if (this.data.type === 'Checkprocess') {
      this.skipprocess.set(true);
    }

    if (this.data.data) {
      this.initEmailForm();
      this.getEmails();
    } else if (this.data.serverData) {
      // GET data before opening modal
      this.initEmailForm();
      this.emailChecksData = this.data.serverData;
      this.getTrialPeriodEnd();

      /** auto attachment along with Echeck is enable/disable value */
      if (this.emailChecksData?.is_auto_attachment_enabled === 1) {
        this.autoAttachmentForCheckMail.set(false);
      } else {
        this.autoAttachmentForCheckMail.set(true);
      }
    }
    this.mailcredit();
    this.getCreditCheckData();

    if (this.data.needRecurring) {
      this.mailTypeChange('recurring');
      this.selectedType.set('recurring');
    }

    // Set minimum date for scheduling
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    this.mindate = this.datePipe.transform(futureDate, 'yyyy-MM-dd');
    this.emailForm.get('scheduleDate')?.setValue(this.mindate);
    this.emailForm.get('start_date')?.setValue(this.mindate);
  }

  getTrialPeriodEnd() {
    this.trialPeriodEndsIn =
      this.localStorageService.getItem('trialPeriodEndsIn');
    if (this.trialPeriodEndsIn === 0) {
      this.pushEmailRow(
        this.emailChecksData?.email,
        this.emailChecksData?.user_notification_sms_enabled
      );
    } else {
      this.pushEmailRow(this.emailChecksData?.email, false);
    }
  }

  initEmailForm() {
    this.emailForm = this.fb.group({
      emails: this.fb.array([]),
      scheduleDate: [''],
      recurring_include_check: [true],
      frequency: ['1'],
      start_date: [''],
      end_select: [1],
      count: [1],
      until: ['']
    }) as FormGroup<EmailFormControls>;
  }

  get fEmails() {
    return this.emailForm.controls.emails;
  }

  get isInTrialPeriod(): boolean {
    return this.trialPeriodEndsIn > 0;
  }

  getSmsCharge(): number {
    return 0.5;
   // return this.isInTrialPeriod ? 0 : 0.5;
  }

  pushEmailRow(emailArr: EmailRow[], checked: boolean) {
    emailArr.forEach((data: EmailRow) => {
      if (data.success) {
        const phone = data.payee_phone?.replace(/[^0-9]/g, '');
        if (phone?.length === 10) {
          data.payee_phone = `+1${phone}`;
        } else if (!phone.includes('+')) {
          data.payee_phone = `+${phone}`;
        }
        const isSmsEligible = data.payee_phone?.length === 12;
        const rowChecked = isSmsEligible ? checked : false;
        this.fEmails.push(
          this.fb.group({
            checkId: data.enc_cheque_id,
            payee_name: data.payee_name,
            bank_name: data.bank_account_nick_name
              ? data.bank_account_nick_name
              : data.bank_account_account_name,
            payee_email: [
              data.payee_email,
              [Validators.required, ValidationService.emailValidator]
            ],
            checked: rowChecked,
            payee_phone: [data.payee_phone, [ValidationService.phoneMinLength]],
            cheque_serial_number: data.cheque_serial_number,
            existingAttach: data.existing_attach,
            cheque_amount: data.cheque_amount,
            cost: isSmsEligible
              ? Number(data.subfee) + (rowChecked ? this.getSmsCharge() : 0)
              : data.subfee,
            added_attachments: data.added_attachments,
            existingAttachments: [data.attachments]
          })
        );
      } else {
        this.emailErrors.update((prev) => [...prev, data]);
      }
    });
    this.countTotal();
    this.addPhoneValidator();
    this.allselectbox();
  }

  allselectbox() {
    const allChecked = this.fEmails.controls.every(
      (el: AbstractControl) => el.value.checked
    );
    this.allSmsChecked.set(allChecked);

    if (!allChecked) {
      this.fEmails.controls.forEach((el: AbstractControl) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_phone.clearValidators();
        formGroup.controls.payee_phone.updateValueAndValidity();
      });
    }
  }

  addPhoneValidator() {
    this.fEmails.controls.forEach((row: AbstractControl) => {
      if (row.value.checked) {
        (row as FormGroup).controls.payee_phone.setValidators(
          ValidationService.phoneMinLength
        );
      }
    });
  }

  getEmails() {
    if ((this.data.data ?? []).length <= 1) this.isSingleCheck.set(true);
    const ids: string[] = (this.data.data ?? []).map((e) => e.action);

    this.checkService
      .getEmails({ ids })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data?.success) {
            this.emailChecksData = data.data;
            /** auto attachment along with Echeck is enable/disable value */
            if (this.emailChecksData?.is_auto_attachment_enabled === 1) {
              this.autoAttachmentForCheckMail.set(false);
            } else {
              this.autoAttachmentForCheckMail.set(true);
            }
            this.getTrialPeriodEnd();
          }
        },
        error: (err) => {
          this.dialogRef.close(err.error);
        }
      });
  }

  checkAllSms(event: IEvent) {
    const { checked } = event.target;

    if (!checked) {
      this.fEmails.controls.forEach((el: AbstractControl, i: number) => {
        const formGroup = el as FormGroup;
        if (formGroup.controls.checked.value) {
          const subfee = this.emailForm.get(['emails', i, 'cost'])?.value;
          this.emailForm
            .get(['emails', i, 'cost'])
            ?.setValue(Number(subfee) - this.getSmsCharge());
        }
        formGroup.controls.checked.setValue(false);
        formGroup.controls.payee_phone.clearValidators();
        formGroup.controls.payee_phone.updateValueAndValidity();
      });
      this.allSmsChecked.set(false);
      this.countTotal();
      return;
    }

    this.fEmails.controls.forEach((el: AbstractControl) => {
      const formGroup = el as FormGroup;
      formGroup.controls.payee_phone.setValidators([
        ValidationService.phoneMinLength
      ]);
      formGroup.controls.payee_phone.updateValueAndValidity();
      formGroup.controls.payee_phone.enable();
    });

    const isRowValid = (i: number) =>
      this.fEmails.controls[i].value.payee_phone?.length !== undefined &&
      this.phoneNumIsValid(true, i);

    const validIndexes: number[] = [];
    const invalidIndexes: number[] = [];
    this.fEmails.controls.forEach((_el, i: number) => {
      if (isRowValid(i)) validIndexes.push(i);
      else invalidIndexes.push(i);
    });

    if (validIndexes.length === 0) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number on at least one row'
      });
      this.fEmails.controls.forEach((el: AbstractControl) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_phone.clearValidators();
        formGroup.controls.payee_phone.updateValueAndValidity();
      });
      event.target.checked = false;
      this.allSmsChecked.set(false);
      return;
    }

    validIndexes.forEach((i) => {
      const formGroup = this.fEmails.controls[i] as FormGroup;
      if (!formGroup.controls.checked.value) {
        const subfee = this.emailForm.get(['emails', i, 'cost'])?.value;
        this.emailForm
          .get(['emails', i, 'cost'])
          ?.setValue(Number(subfee) + this.getSmsCharge());
      }
      formGroup.controls.checked.setValue(true);
    });

    invalidIndexes.forEach((i) => {
      const formGroup = this.fEmails.controls[i] as FormGroup;
      if (formGroup.controls.checked.value) {
        const subfee = this.emailForm.get(['emails', i, 'cost'])?.value;
        this.emailForm
          .get(['emails', i, 'cost'])
          ?.setValue(Number(subfee) - this.getSmsCharge());
      }
      formGroup.controls.checked.setValue(false);
      formGroup.controls.payee_phone.clearValidators();
      formGroup.controls.payee_phone.updateValueAndValidity();
    });

    this.allSmsChecked.set(true);
    this.countTotal();
  }

  countTotal() {
    let smsCharge = 0;
    this.fEmails.controls.forEach((e: AbstractControl) => {
      if (e.value.cost) {
        smsCharge += Number(e.value.cost);
      }
    });

    this.totalAmount.set(smsCharge);
  }

  showPhoneNumWarning(event: IEvent, index: number) {
    const phoneControl = (this.fEmails.controls[index] as FormGroup).controls
      .payee_phone;
    if (event.target.checked) {
      phoneControl.setValidators([ValidationService.phoneMinLength]);
      phoneControl.updateValueAndValidity();
    }

    if (this.fEmails.controls[index].value.payee_phone?.length === undefined) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      this.emailForm.get(['emails', index, 'checked'])?.setValue(false);
      phoneControl.clearValidators();
      phoneControl.updateValueAndValidity();
      return;
    }
    if (!this.phoneNumIsValid(event.target.checked, index)) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      this.emailForm.get(['emails', index, 'checked'])?.setValue(false);
      phoneControl.clearValidators();
      phoneControl.updateValueAndValidity();
      return;
    }
    if (
      this.phoneNumIsValid(event.target.checked, index) &&
      event.target.checked
    ) {
      const subfee = this.emailForm.get(['emails', index, 'cost'])?.value;
      this.emailForm
        .get(['emails', index, 'cost'])
        ?.setValue(Number(subfee) + this.getSmsCharge());
    } else if (
      this.phoneNumIsValid(event.target.checked, index) &&
      !event.target.checked
    ) {
      this.allSmsChecked.set(false);
      const subfee = this.emailForm.get(['emails', index, 'cost'])?.value;
      this.emailForm
        .get(['emails', index, 'cost'])
        ?.setValue(Number(subfee) - this.getSmsCharge());
    }

    if (!event.target.checked) {
      (
        this.fEmails.controls[index] as FormGroup
      ).controls.payee_phone.setValidators(ValidationService.phoneMinLength);
    }
    this.countTotal();
  }

  phoneCheck(i: number) {
    if (this.emailForm.get(['emails', i, 'checked'])?.value) {
      if (!this.phoneNumIsValid(true, i)) {
        this.allSmsChecked.set(false);
        const subfee = this.emailForm.get(['emails', i, 'cost'])?.value;
        this.emailForm
          .get(['emails', i, 'cost'])
          ?.setValue(Number(subfee) - this.getSmsCharge());
        this.emailForm.get(['emails', i, 'checked'])?.setValue(false);
        this.emailForm.get(['emails', i, 'payee_phone'])?.clearValidators();
      }
      this.countTotal();
    }
  }

  onSubmit() {
    this.emailForm.markAllAsTouched();
    if (!this.emailForm.valid && !this.isSendToOneAddress) {
      return;
    }
    if (this.isSendToOneAddress && this.sendToOneAddressEmail.invalid) {
      this.sendToOneAddressEmail.markAllAsTouched();
      return;
    }

    // Validate dates for schedule and recurring
    if (this.scheduleIt()) {
      if (new Date(this.emailForm.value.scheduleDate ?? '') < new Date()) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select a valid date',
          doneMsg: 'OK'
        });
        return;
      }
    }

    if (this.recurring()) {
      if (new Date(this.emailForm.value.start_date ?? '') < new Date()) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select a valid date',
          doneMsg: 'OK'
        });
        return;
      }
      if (new Date(this.emailForm.value.until ?? '') < new Date()) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select a valid date',
          doneMsg: 'OK'
        });
        return;
      }
      if (
        (this.emailForm.value.count == null ||
          this.emailForm.value.count <= 0) &&
        this.emailForm.value.end_select === 1
      ) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select a valid count',
          doneMsg: 'OK'
        });
        return;
      }
      if (
        (this.emailForm.value.until == null ||
          this.emailForm.value.until === '') &&
        this.emailForm.value.end_select === 2
      ) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select specific date',
          doneMsg: 'OK'
        });
        return;
      }
    }

    let confirmMessage = 'Do you want to send this email?';
    if (this.scheduleIt()) {
      confirmMessage = 'Do you want to schedule this email?';
    } else if (this.recurring()) {
      confirmMessage = 'Do you want to set this as recurring email?';
    }

    const dRef = this.alertService.confirmAlert({
      content: confirmMessage
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.sendEmail();
      }
    });
  }

  sendEmail() {
    const checkAmount = this.fEmails.value[0].cheque_amount;
    const emailCount = this.data?.serverData?.email
      ? this.data?.serverData?.email
      : this.data.data;
    const mail_check_ids: string[] = [];
    const payee_email: Record<string, string> = {};
    const sms_checkbox: Record<string, boolean> = {};
    const phone: Record<string, string> = {};
    const file_hidden = this.attachments;

    this.fEmails.controls.forEach((e: AbstractControl) => {
      mail_check_ids.push(e.value.checkId);
      payee_email[e.value.checkId] = e.value.payee_email;
      sms_checkbox[e.value.checkId] = e.value.checked;
      phone[e.value.checkId] = e.value.payee_phone;
    });

    const emailMemobody = this.createEmailMemobody();
    const body = {
      mail_check_ids,
      payee_email,
      sms_checkbox,
      phone,
      file_hidden,
      is_group_echeck: this.isSendToOneAddress,
      group_echeck_email: this.sendToOneAddressEmail?.value,
      ...emailMemobody
    };
    this.submitting.set(true);

    if (this.data.type === 'Checkprocess') {
      this.checkService
        .sendEmail(body)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.submitting.set(false);
          }),
          catchError((error) => {
            if (error.error.errorCode === 'plaid_virtual_account') {
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if (res) {
                  const confirmationDialog = this.dialog.open(
                    VirtualAccountConfirmationModalComponent,
                    {
                      maxWidth: '1200px',
                      width: '100%',
                      disableClose: true,
                      data: error.error
                    }
                  );
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                      this.sendEmail();
                    }
                  });
                }
              });
            }
            return of(false);
          })
        )
        .subscribe({
          next: (data) => {
            if (data?.success) {
              this.scriptService.gtagEventScript('check-emailed');

              let successMessage = 'Emailed';
              if (this.scheduleIt()) {
                successMessage = 'Email Scheduled successfully';
              } else if (this.recurring()) {
                successMessage =
                  'Your email has been set for recurring, You can manage them on recurring list';
              }

              this.alertService.successAlert({
                content: successMessage,
                close: true,
                timeout: 1500
              });
              if (this.recurring() || this.scheduleIt()) {
                this.recurringRedirect.mark('email', this.recurring());
              }
              this.dialogRef.close({
                success: true,
                checkData: this.data.processData,
                rowData: this.data.rowData,
                status: this.data.status,
                emailType: this.recurring()
                  ? 'recurring'
                  : this.scheduleIt()
                    ? 'scheduled'
                    : 'immediate',
                scheduledDate: this.scheduleIt()
                  ? this.datePipe.transform(
                      this.emailForm.controls.scheduleDate.value,
                      'MM/dd/yyyy'
                    ) ?? this.emailForm.controls.scheduleDate.value
                  : undefined,
                recurringDetails: this.recurring()
                  ? this.buildRecurringDetails()
                  : undefined
              });
              if (this.data.processData) {
                this.data.processData.processable_data.emailChequeIds = [];
              }
            }
          },
          error: (err) => this.insufficientBalanceError(err)
        });
    } else {
      this.checkService
        .sendEmail(body)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.submitting.set(false);
          }),
          catchError((error) => {
            if (error.error.errorCode === 'plaid_virtual_account') {
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if (res) {
                  const confirmationDialog = this.dialog.open(
                    VirtualAccountConfirmationModalComponent,
                    {
                      maxWidth: '1200px',
                      width: '100%',
                      disableClose: true,
                      data: error.error
                    }
                  );
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                      this.sendEmail();
                    }
                  });
                }
              });
            }
            return of(false);
          })
        )
        .subscribe({
          next: (data) => {
            if (data?.success) {
              if (!this.data.hideSuccessAlert) {
                let successMessage = 'Emailed';
                if (this.scheduleIt()) {
                  successMessage = 'Email Scheduled successfully';
                } else if (this.recurring()) {
                  successMessage =
                    'Your email has been set for recurring, You can manage them on recurring list';
                }

                this.alertService.successAlert({
                  content: successMessage,
                  close: true,
                  timeout: 1500
                });
              }
              if (this.recurring() || this.scheduleIt()) {
                this.recurringRedirect.mark('email', this.recurring());
              }
              this.dialogRef.close({
                success: true,
                emailType: this.recurring()
                  ? 'recurring'
                  : this.scheduleIt()
                    ? 'scheduled'
                    : 'immediate',
                scheduledDate: this.scheduleIt()
                  ? this.datePipe.transform(
                      this.emailForm.controls.scheduleDate.value,
                      'MM/dd/yyyy'
                    ) ?? this.emailForm.controls.scheduleDate.value
                  : undefined,
                recurringDetails: this.recurring()
                  ? this.buildRecurringDetails()
                  : undefined
              });
              if (emailCount?.length == 1) {
                this.scriptService.gtagEventScript('check-emailed', {
                  amount: checkAmount
                });
              } else {
                this.scriptService.gtagEventScript('check-emailed');
              }
            }
            if (this.data?.paymentMethod !== 'wallet_check_email') {
              this.headerservice.setHeaderValueChanged(true);
            }
          },
          error: (err) => this.insufficientBalanceError(err)
        });
    }
  }

  insufficientBalanceError(err: ApiErrorResponse) {
    if (err.error.errorCode === 102) {
      const url = `/manage/refill-credit/show-refillform`;
      const content = `Insufficient Balance. <br><b>Total cost : ${this.totalAmount()}</b> <br><a href= '${url}' >Click to refill</a>`;
      this.alertService.warningAlert({ content });
    }
  }

  phoneNumIsValid(val: boolean, index: number) {
    const phoneControl = (this.fEmails.controls[index] as FormGroup).controls
      .payee_phone;
    const phoneValue = this.fEmails.controls[index].value.payee_phone;

    if (
      val &&
      (phoneControl.errors || (!phoneValue && phoneValue?.length !== 12))
    ) {
      return false;
    }
    return true;
  }

  openAttachmentModal(checkId: string) {
    this.checkTheExistingAttachments(checkId);

    const dialogRef = this.dialog.open(V4CheckAddAttachmentModalComponent, {
      disableClose: true,
      width: '630px',
      maxWidth: '1010px',
      data: {
        checkId,
        acceptFormats: '*',
        attachId: this.attachments[checkId]
      },
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.attachments[data.checkId] = data.ids;
        this.attachments.fileName = data.fileName;
        this.fEmails.controls.forEach((emailData: AbstractControl) => {
          if (emailData.value.checkId === checkId) {
            emailData.value.existingAttachments = data.ids;
          }
        });
      }
    });
  }

  /** *
   * when the attachment open the existing attachments will be checked.
   * @param checkId  string
   */
  checkTheExistingAttachments(checkId: string) {
    this.fEmails.controls?.forEach((emailData: AbstractControl) => {
      if (
        emailData.value.added_attachments > 0 &&
        Object.keys(this.attachments).length === 0 &&
        emailData.value.checkId === checkId
      ) {
        // when it open first time this will work.
        this.attachments[emailData.value.checkId] =
          emailData.value.existingAttachments;
      }
      if (
        emailData.value.added_attachments > 0 &&
        Object.keys(this.attachments).length > 0 &&
        emailData.value.checkId === checkId
      ) {
        // It will check the attachments based on the check id, when it open first time.
        if (!this.attachments.hasOwnProperty(emailData.value.checkId)) {
          this.attachments[emailData.value.checkId] =
            emailData.value.existingAttachments;
        }
      }
    });
  }

  onEditCheck() {
    if (!this.data.data || this.data.data.length > 1) return;
    const checkId = this.data.data[0].action;
    this.dialogRef.close(false);
    this.router.navigate(['/manage/cheque/create'], {
      queryParams: { id: checkId }
    });
  }

  openEmailMessage(checkId: string) {
    this.dialog.open(EmailMessageModalV4Component, {
      maxWidth: '93%',
      width: '700px',
      data: { checkId },
      panelClass: 'paddingless-modal-rounded'
    });
  }

  lastTransaction() {
    this.dialog.open(LastTransactionModalV4Component, {
      maxWidth: '1010px',
      width: '93%',
      data: this.data.data?.[0]?.action,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  numberOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  skip() {
    if (this.data.processData) {
      this.data.processData.processable_data.emailChequeIds = [];
    }
    this.dialogRef.close({
      success: true,
      checkData: this.data.processData,
      rowData: this.data.rowData,
      status: this.data.status
    });
  }

  formatePhoneNum(phone: string): string {
    const num = phone;

    if (num?.includes('(')) {
      // on update if phone number not changed.
      const num1 = num.substring(1, 4);
      const num2 = num.substring(6, 9);
      const num3 = num.substring(10, 14);
      return `(${num1}) ${num2}-${num3}`;
    }

    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);
    return num ? `(${num1}) ${num2}-${num3}` : '';
  }

  onSelectAddress(isOneAddress: boolean) {
    if (isOneAddress) {
      // Reset recurring and schedule states when switching to single address mode
      this.recurring.set(false);
      this.scheduleIt.set(false);
      this.selectedType.set('email now');

      this.fEmails.controls.forEach((el, index) => {
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
          const subfee = this.emailForm.get(['emails', index, 'cost'])?.value;
          formGroup.controls.cost.setValue(Number(subfee) - this.getSmsCharge());
        }
        formGroup.controls.checked.setValue(false);
        formGroup.controls.checked.disable();
      });
      this.allSmsChecked.set(false);
      this.countTotal();
    } else {
      this.fEmails.controls.forEach((el: AbstractControl) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_email.setValidators([
          Validators.required,
          ValidationService.emailValidator
        ]);
        formGroup.controls.payee_email.updateValueAndValidity();
        formGroup.controls.payee_email.enable();
        formGroup.controls.payee_phone.enable();
        formGroup.controls.checked.enable();
        formGroup.controls.payee_email.markAllAsTouched();
      });
    }
  }

  mailcredit() {
    this.isCreditLoading.set(true);
    this.refillCredit
      .getCurrentCredit()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: { success: boolean; data: { credit: string } }) => {
        this.currentCredit.set(res.data.credit);
        this.isCreditLoading.set(false);
      });
  }

  getCreditCheckData() {
    this.headerservice
      .headerData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isSubscribed = res.data.isSubscribed || 0;
        this.phoneverified = res.data.userInfo.phone_verified || 0;
        this.emailverified = res.data.userInfo.email_verified || 0;
      });
  }

  openRechargeModal() {
    if (!this.isSubscribed) {
      const alertData = {
        content: 'Kindly subscribe to a plan.',
        isCancel: true,
        doneMsg: 'Subscribe Now',
        cancelMsg: 'Not Now'
      };
      const alert = this.alertService.warningAlert(alertData);
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.goToSubscription();
        }
      });
      return;
    }
    const dRef = this.dialog.open(RefillCreditRechargeModalV4Component, {
      width: '450px',
      maxWidth: '93%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res?.add) {
        this.getCredit();
      }
    });
  }

  getCredit() {
    this.refillCredit
      .getCurrentCredit()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isCreditLoading.set(false);
        })
      )
      .subscribe((data) => {
        if (data?.success) {
          this.currentCredit.set(String(data.data.credit));
        }
      });
  }

  /**
   * @description Navigates to the subscription page based on the user verification status.
   *
   * If both the email and phone are verified, it navigates to the subscription page.
   *
   * If either the email or phone is not verified, it navigates to the verify email and phone page.
   */
  goToSubscription(): void {
    if (this.emailverified === 1 && this.phoneverified === 1) {
      this.onNavigation(['manage/subscription'], {
        state: { returnUrl: this.router.url }
      });
    } else {
      this.onNavigation(['/manage/users/verify-email-phone'], {
        queryParams: { returnUrl: '/manage/refill-credit/show-refillform' }
      });
    }
  }

  onNavigation(path: string[], extras?: NavigationExtras) {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => {
        this.dialogRef.close();
      });

    this.router.navigate(path, extras).catch(() => {
      this.dialogRef.close();
    });
  }

  mailTypeChange(type: string) {
    if (type === 'recurring') {
      this.recurring.set(true);
      this.scheduleIt.set(false);
      this.emailForm.controls.scheduleDate.setValue('');
      this.emailForm.get('end_select')?.setValue(1);
      this.cd.detectChanges();
      this.Recurring({ target: { value: 'transaction' } } as IEvent);
    } else if (type === 'schedule-it') {
      this.scheduleIt.set(true);
      this.recurring.set(false);
    } else {
      this.recurring.set(false);
      this.scheduleIt.set(false);
    }
  }

  Recurring(event: IEvent) {
    if (event.target.value === 'transaction') {
      this.emailForm.controls.count.enable();
      this.emailForm.controls.until.disable();
      this.emailForm.controls.until.setValue(null);
      this.emailForm.controls.end_select.setValue(1);
    } else if (event.target.value === 'Specific-date') {
      this.emailForm.controls.count.setValue(0);
      this.emailForm.controls.count.disable();
      this.emailForm.controls.until.enable();
      this.emailForm.controls.end_select.setValue(2);
    } else if (event.target.value === 'until') {
      this.emailForm.controls.until.disable();
      this.emailForm.controls.count.setValue(null);
      this.emailForm.controls.count.disable();
      this.emailForm.controls.end_select.setValue(3);
    }
  }

  private buildRecurringDetails(): {
    frequency: string;
    startDate: string;
    endCriteria: string;
  } {
    const data = this.emailForm.getRawValue();
    const freqLabel =
      this.frequencyOptions.find((f) => f.value === data.frequency)?.label ??
      '';
    const startDate =
      this.datePipe.transform(data.start_date, 'MM/dd/yyyy') ??
      data.start_date ??
      '';

    let endCriteria: string;
    switch (data.end_select) {
      case 1:
        endCriteria = `${data.count ?? 0} occurrences`;
        break;
      case 2: {
        const untilFormatted =
          this.datePipe.transform(data.until, 'MM/dd/yyyy') ??
          data.until ??
          '';
        endCriteria = `Until ${untilFormatted}`;
        break;
      }
      default:
        endCriteria = 'Until canceled';
        break;
    }

    return { frequency: freqLabel, startDate, endCriteria };
  }

  createEmailMemobody() {
    const data = this.emailForm.getRawValue();
    return {
      schedule_date: data.scheduleDate,
      recurring_include_check: data.recurring_include_check,
      emailCheckRecurring: this.recurring() || this.scheduleIt() ? 1 : 0,
      is_recurring_value: this.recurring() ? 1 : this.scheduleIt() ? 2 : 0,
      recurring: this.recurring()
        ? {
            frequency: (data.frequency ?? '').toString(),
            start_date: data.start_date,
            end_select: (data.end_select ?? 0).toString(),
            count: (data.count ?? 0).toString(),
            until: data.end_select === 2 ? data.until : null
          }
        : this.scheduleIt()
          ? {
              schedule_date: data.scheduleDate
            }
          : undefined
    };
  }
}

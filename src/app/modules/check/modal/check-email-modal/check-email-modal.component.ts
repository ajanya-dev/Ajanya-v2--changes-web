import { Component, OnDestroy, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize, catchError, filter, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  NgIf,
  NgFor,
  NgClass,
  DecimalPipe,
  NgOptimizedImage,
  CurrencyPipe
} from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { ScriptService } from 'src/app/core/services/script.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Utils } from 'src/app/data/utils';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { faCircleDollar, faCircleQuestion, faEnvelope, faMessage, faMoneyCheck, faPaperclip } from '@fortawesome/pro-solid-svg-icons';
import { IEvent } from 'src/app/modules/invoices/model/invoice';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CheckAddAttachmentModalComponent } from '../check-add-attachment-modal/check-add-attachment-modal.component';
import { EmailMessageModalComponent } from '../email-message-modal/email-message-modal.component';
import { LastTransactionModalComponent } from '../mail-modals/last-transaction-modal/last-transaction-modal.component';
import { NewPhoneInputComponent } from '../../../../shared/components/new-phone-input/new-phone-input.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { DemoVideoComponent } from '../../../../shared/components/demo-video/demo-video.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { RefillCreditRechargeModalComponent } from 'src/app/modules/refill-credit/modals/refill-credit-recharge-modal/refill-credit-recharge-modal.component';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';

interface EmailRow {
  bank_account_account_name: string;
  bank_account_nick_name: string;
  cheque_amount: string;
  cheque_serial_number: string;
  cheque_status: number;
  enc_bank_account_id: string;
  enc_cheque_id: string;
  enc_payee_id: string;
  existing_attach: number;
  payee_email: string;
  payee_name: string;
  payee_phone: string;
  success: boolean;
  checked: boolean;
  subfee: number;
  added_attachments: number;
  attachments: string[];
}
@Component({
  selector: 'app-check-email-modal',
  templateUrl: './check-email-modal.component.html',
  styleUrls: ['./check-email-modal.component.scss'],
  standalone: true,
  imports: [
    DemoVideoComponent,
    MatDialogClose,
    NgIf,
    NgFor,
    FormsModule,
    NgOptimizedImage,
    FontAwesomeModule,
    ReactiveFormsModule,
    MatTooltip,
    ControlMessageComponent,
    NewPhoneInputComponent,
    MatDialogActions,
    NgClass,
    DecimalPipe,
    MatCheckboxModule,
    TruncatePipe,
    CommonButtonV35Component,
    CurrencyPipe
  ]
})
export class CheckEmailModalComponent implements OnInit, OnDestroy {
  public data = inject(MAT_DIALOG_DATA);
  private headerservice = inject(HeaderService);
  public dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private recurringRedirect = inject(RecurringRedirectService);
  private fb = inject(UntypedFormBuilder);
  public alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<CheckEmailModalComponent>);
  private router = inject(Router);
  private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private refillCredit = inject(RefillCreditService);
  private datePipe = inject(DatePipe);
  private cd = inject(ChangeDetectorRef);

  subscriptions: Subscription[] = [];

  emailChecksData: any = {};
  totalAmount = 0;
  attachments: any = {};

  emailForm: UntypedFormGroup;
  isSingleCheck = false;
  skipprocess = false;

  emailErrors: any[] = [];

  phoneverified = 0;
  emailverified = 0;
  isSubscribed = 0;
  currentCredit: string;
  isCreditLoading  =  signal(false);

  submitting = false;
  autoAttachmentForCheckMail = false;
  utils = Utils;
  isSendToOneAddress = false;
  trialPeriodEndsIn: number;

  // Recurring and Schedule properties
  recurring = false;
  scheduleIt = false;
  selectedType = 'email now';
  mindate: string | null;
  startdatevalid = false;
  position = new FormControl('above');
  sendToOneAddressEmail = new FormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  faCircleQuestion = faCircleQuestion;
  faMoneyCheck = faMoneyCheck;
  faMessage = faMessage;
  faEnvelope = faEnvelope;
  facircleDollar = faCircleDollar;
  faAttachment = faPaperclip;

  ngOnInit(): void {
    if (this.data.type === 'Checkprocess') {
      this.skipprocess = true;
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
        this.autoAttachmentForCheckMail = false;
      } else {
        this.autoAttachmentForCheckMail = true;
      }
    }
    this.mailcredit();
    this.getCreditCheckData();

    if (this.data.needRecurring) {
      this.mailTypeChange('recurring');
      this.selectedType = 'recurring';
    }

    // Set minimum date for scheduling
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    this.mindate = this.datePipe.transform(futureDate, 'yyyy-MM-dd');
    this.emailForm.get('scheduleDate')?.setValue(this.mindate);
    this.emailForm.get('start_date')?.setValue(this.mindate);
  }

  getTrialPeriodEnd(){
    this.trialPeriodEndsIn = this.localStorageService.getItem('trialPeriodEndsIn');
    if(this.trialPeriodEndsIn === 0) {
      this.pushEmailRow(
        this.emailChecksData?.email,
        this.emailChecksData?.user_notification_sms_enabled
      );
    } else {
      this.pushEmailRow(
        this.emailChecksData?.email,
        false
      );
    }
  }

  initEmailForm() {
    this.emailForm = this.fb.group({
      emails: this.fb.array([]),
      scheduleDate: [''],
      recurring_include_check: true,
      frequency: [1],
      start_date: [''],
      end_select: [1],
      count: [1],
      until: ['']
    });
  }

  get fEmails() {
    return <UntypedFormArray>this.emailForm.controls.emails;
  }

  get isInTrialPeriod(): boolean {
    return this.trialPeriodEndsIn > 0;
  }

  getSmsCharge(): number {
    return 0.5;
   // return this.isInTrialPeriod ? 0 : 0.5;
  }

  pushEmailRow(emailArr: any[], checked: boolean) {
    emailArr.forEach((data: EmailRow) => {
      if (data.success) {
        const phone = data.payee_phone?.replace(/[^0-9]/g, '');
        if (phone?.length === 10) {
          data.payee_phone = '+1' + phone;
        } else if (!phone.includes('+')) {
          data.payee_phone = '+' + phone;
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
        this.emailErrors.push(data);
      }
    });
    this.countTotal();
    this.addPhoneValidator();
    this.allselectbox();
  }

  allselectbox() {
    const Allsms = document.getElementById(`sms`) as HTMLInputElement;
    let j = 0;
    for (const property in this.emailForm.value.emails) {
      if (this.emailForm.value.emails[property].checked == false) {
        j += 1;
      }
    }

    if (j == 0) {
      Allsms.checked = true;
      // this.indexofmail = this.emailForm.value.emails.length;
    } else {
      Allsms.checked = false;
      this.fEmails.controls.forEach((el) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_phone.clearValidators();
        formGroup.controls.payee_phone.updateValueAndValidity();
      });
    }
  }

  addPhoneValidator() {
    this.fEmails.controls.forEach((row) => {
      if (row.value.checked) {
        (row as UntypedFormGroup).controls.payee_phone.setValidators(
          ValidationService.phoneMinLength
        );
      }
    });
  }

  getEmails() {
    if (this.data.data.length <= 1) this.isSingleCheck = true;
    const ids: string[] = this.data.data.map((e: any) => e.action);

    this.subscriptions.push(
      this.checkService.getEmails({ ids }).subscribe(
        (data) => {
          if (data?.success) {
            this.emailChecksData = data.data;
            /** auto attachment along with Echeck is enable/disable value */
            if (this.emailChecksData?.is_auto_attachment_enabled === 1) {
              this.autoAttachmentForCheckMail = false;
            } else {
              this.autoAttachmentForCheckMail = true;
            }
            this.getTrialPeriodEnd();
          }
        },
        (err) => {
          this.dialogRef.close(err.error);
        }
      )
    );
  }

  checkAllSms(event: IEvent) {
    const checked = event.target.checked;

    if (checked) {
      this.fEmails.controls.forEach((el) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_phone.setValidators([
          ValidationService.phoneMinLength
        ]);
        formGroup.controls.payee_phone.updateValueAndValidity();
        formGroup.controls.payee_phone.enable();
        formGroup.controls.payee_phone.markAllAsTouched();
      });
    } else {
      this.fEmails.controls.forEach((el) => {
        const formGroup = el as FormGroup;
        formGroup.controls.payee_phone.clearValidators();
        formGroup.controls.payee_phone.updateValueAndValidity();
      });
    }

    let index = -1;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _row of this.fEmails.controls) {
      index++;
      if (this.fEmails.controls[index].value.payee_phone?.length == undefined) {
        this.alertService.warningAlert({
          content: `Please enter valid phone number on row ${index + 1}`
        });
        event.target.checked = false;
        this.fEmails.controls.forEach((el) => {
          const formGroup = el as FormGroup;
          formGroup.controls.payee_phone.clearValidators();
          formGroup.controls.payee_phone.updateValueAndValidity();
        });
        return;
      }
      if (!this.phoneNumIsValid(checked, index)) {
        this.alertService.warningAlert({
          content: `Please enter valid phone number on row ${index + 1}`
        });
        event.target.checked = false;
        this.fEmails.controls.forEach((el) => {
          const formGroup = el as FormGroup;
          formGroup.controls.payee_phone.clearValidators();
          formGroup.controls.payee_phone.updateValueAndValidity();
        });
        return;
      }
    }

    const smsCharge = this.getSmsCharge();

    if (this.phoneNumIsValid(checked, index) && event.target.checked) {
      this.fEmails.controls.forEach((e, i: number) => {
        if (!e.value.checked) {
          const subfee = this.emailForm.get(['emails', i, 'cost'])?.value;
          this.emailForm
            .get(['emails', i, 'cost'])
            ?.setValue(Number(subfee) + smsCharge);
        }
      });
    }

    if (this.phoneNumIsValid(checked, index) && !event.target.checked) {
      this.fEmails.controls.forEach((e, i: number) => {
        if (e.value.checked) {
          const subfee = this.emailForm.get(['emails', i, 'cost'])?.value;
          this.emailForm
            .get(['emails', i, 'cost'])
            ?.setValue(Number(subfee) - smsCharge);
        }
      });
    }

    this.fEmails.controls.forEach((e) =>
      (e as UntypedFormGroup).controls.checked.setValue(checked)
    );
    this.countTotal();
  }

  countTotal() {
    let smsCharge = 0;
    this.totalAmount = 0;
    this.fEmails.controls.forEach((e) => {
      if (e.value.cost) {
        smsCharge += Number(e.value.cost);
      }
    });

    this.totalAmount = smsCharge;
  }

  showPhoneNumWarning(event: any, index: number) {
    if (this.fEmails.controls[index].value.payee_phone?.length === undefined) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      this.emailForm.get(['emails', index, 'checked'])?.setValue(false);
      return;
    }
    if (!this.phoneNumIsValid(event.target.checked, index)) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      this.emailForm.get(['emails', index, 'checked'])?.setValue(false);
      return;
    }
    const smsCharge = this.getSmsCharge();
    if (
      this.phoneNumIsValid(event.target.checked, index) &&
      event.target.checked
    ) {
      const subfee = this.emailForm.get(['emails', index, 'cost'])?.value;
      this.emailForm
        .get(['emails', index, 'cost'])
        ?.setValue(Number(subfee) + smsCharge);
    } else if (
      this.phoneNumIsValid(event.target.checked, index) &&
      !event.target.checked
    ) {
      const Allsms = document.getElementById(`sms`) as HTMLInputElement;
      Allsms.checked = false;
      const subfee = this.emailForm.get(['emails', index, 'cost'])?.value;
      this.emailForm
        .get(['emails', index, 'cost'])
        ?.setValue(Number(subfee) - smsCharge);
    }

    if (!event.target.checked) {
      (
        this.fEmails.controls[index] as UntypedFormGroup
      ).controls.payee_phone.setValidators(ValidationService.phoneMinLength);
    }
    this.countTotal();
  }

  phoneCheck(i: number) {
    if (this.emailForm.get(['emails', i, 'checked'])?.value) {
      if (!this.phoneNumIsValid(true, i)) {
        const Allsms = document.getElementById(`sms`) as HTMLInputElement;
        Allsms.checked = false;
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
    if (this.scheduleIt) {
      if (new Date(this.emailForm.value.scheduleDate) < new Date()) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select a valid date',
          doneMsg: 'OK'
        });
        return;
      }
    }

    if (this.recurring) {
      if (new Date(this.emailForm.value.start_date) < new Date()) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select a valid date',
          doneMsg: 'OK'
        });
        return;
      }
      if (new Date(this.emailForm.value.until) < new Date()) {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'please select a valid date',
          doneMsg: 'OK'
        });
        return;
      }
      if (
        (this.emailForm.value.count <= 0 || this.emailForm.value.count === '') &&
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
    if (this.scheduleIt) {
      confirmMessage = 'Do you want to schedule this email?';
    } else if (this.recurring) {
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
    const payee_email: any = {};
    const sms_checkbox: any = {};
    const phone: any = {};
    const file_hidden = this.attachments;

    this.fEmails.controls.forEach((e) => {
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
    this.submitting = true;

    if (this.data.type === 'Checkprocess') {
      this.subscriptions.push(
        this.checkService
          .sendEmail(body)
          .pipe(
            finalize(() => {
              this.submitting = false;
            }),
            catchError((error) => {
              if (error.error.errorCode === "plaid_virtual_account"){
                const notification = this.alertService.infoAlert({
                  content: error.error.errorMsg,
                  doneMsg: 'Update',
                  isCancel: true
                });
                notification.afterClosed().subscribe((res) => {
                  if(res){
                    const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                      maxWidth: '1200px',
                      width: '100%',
                      disableClose: true,
                      data: error.error
                    });
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
          .subscribe(
            (data) => {
              if (data?.success) {
                this.scriptService.gtagEventScript('check-emailed');

                let successMessage = 'Emailed';
                if (this.scheduleIt) {
                  successMessage = 'Email Scheduled successfully';
                } else if (this.recurring) {
                  successMessage = 'Your email has been set for recurring, You can manage them on recurring list';
                }

                this.alertService.successAlert({
                  content: successMessage,
                  close: true,
                  timeout: 1500
                });
                if (this.recurring || this.scheduleIt) {
                  this.recurringRedirect.mark('email', this.recurring);
                }
                this.dialogRef.close({
                  success: true,
                  checkData: this.data.processData,
                  rowData: this.data.rowData,
                  status: this.data.status
                });
                this.data.processData.processable_data.emailChequeIds = [];
              }
            },
            (err) => this.insufficientBalanceError(err)
          )
      );
    } else {
      this.subscriptions.push(
        this.checkService
          .sendEmail(body)
          .pipe(
            finalize(() => {
              this.submitting = false;
            }),
            catchError((error) => {
              if (error.error.errorCode === "plaid_virtual_account"){
                const notification = this.alertService.infoAlert({
                  content: error.error.errorMsg,
                  doneMsg: 'Update',
                  isCancel: true
                });
                notification.afterClosed().subscribe((res) => {
                  if(res){
                    const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                      maxWidth: '1200px',
                      width: '100%',
                      disableClose: true,
                      data: error.error
                    });
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
          .subscribe(
            (data) => {
              if (data?.success) {
                if (!this.data.hideSuccessAlert) {
                  let successMessage = 'Emailed';
                  if (this.scheduleIt) {
                    successMessage = 'Email Scheduled successfully';
                  } else if (this.recurring) {
                    successMessage = 'Your email has been set for recurring, You can manage them on recurring list';
                  }

                  this.alertService.successAlert({
                    content: successMessage,
                    close: true,
                    timeout: 1500
                  });
                }
                if (this.recurring || this.scheduleIt) {
                  this.recurringRedirect.mark('email', this.recurring);
                }
                this.dialogRef.close(true);
                if (emailCount?.length == 1) {
                  this.scriptService.gtagEventScript('check-emailed', {
                    amount: checkAmount
                  });
                } else {
                  this.scriptService.gtagEventScript('check-emailed');
                }
              }
              if(this.data?.paymentMethod !== 'wallet_check_email'){
                this.headerservice.setHeaderValueChanged(true);
              }
            },
            (err) => this.insufficientBalanceError(err)
          )
      );
    }
  }

  insufficientBalanceError(err: any) {
    if (err.error.errorCode === 102) {
      const url = `/manage/refill-credit/show-refillform`;
      const content = `Insufficient Balance. <br><b>Total cost : ${this.totalAmount}</b> <br><a href= '${url}' >Click to refill</a>`;
      this.alertService.warningAlert({ content });
    }
  }

  phoneNumIsValid(val: boolean, index: number) {
    const phoneControl = (this.fEmails.controls[index] as UntypedFormGroup).controls.payee_phone;
    const phoneValue = this.fEmails.controls[index].value.payee_phone;
    
    if (val && (phoneControl.errors || (!phoneValue && phoneValue?.length !== 12))) {
      return false;
    }
    return true;
  }

  openAttachmentModal(checkId: string) {
    this.checkTheExistingAttachments(checkId);

    const dialogRef = this.dialog.open(CheckAddAttachmentModalComponent, {
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
        this.attachments.fileName = data?.fileName;
        this.fEmails.controls.forEach((emailData) => {
          if(emailData.value.checkId === data.checkId){
            emailData.value.existingAttachments = data.ids;
          }
        });

      }
    });
  }

  /***
   * when the attachment open the existing attachments will be checked.
   * @param checkId  string
   */
  checkTheExistingAttachments(checkId: string) {
    this.fEmails.controls?.forEach((emailData) => {
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

  onEditCheck() {
    if (this.data?.length > 1) return;
    const checkId = this.data[0].action;
    this.dialogRef.close(false);
    this.router.navigate(['/manage/cheque/create'], {
      queryParams: { id: checkId }
    });
  }

  openEmailMessage(checkId: string) {
    this.dialog.open(EmailMessageModalComponent, {
      maxWidth: '93%',
      width: '700px',
      data: { checkId }
    });
  }

  lastTransaction() {
    this.dialog.open(LastTransactionModalComponent, {
      maxWidth: '1010px',
      width: '93%',
      data: this.data[0].action
    });
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  skip() {
    this.data.processData.processable_data.emailChequeIds = [];
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
      //on update if phone number not changed.
      const num1 = num.substring(1, 4);
      const num2 = num.substring(6, 9);
      const num3 = num.substring(10, 14);
      return '(' + num1 + ') ' + num2 + '-' + num3;
    }

    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);
    return num ? '(' + num1 + ') ' + num2 + '-' + num3 : '';
  }

  onSelectAddress(isOneAddress: boolean) {
    if (isOneAddress) {
      // Reset recurring and schedule states when switching to single address mode
      this.recurring = false;
      this.scheduleIt = false;
      this.selectedType = 'email now';
      
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
      const Allsms = document.getElementById(`sms`) as HTMLInputElement;
      Allsms.checked = false;
      this.countTotal();
    } else {
      this.fEmails.controls.forEach((el) => {
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
    this.subscriptions.push(
      this.refillCredit.getCurrentCredit().subscribe((res: {success: boolean, data: {credit: string}}) => {
        this.currentCredit = res.data.credit;
        this.isCreditLoading.set(false);
      })
    );
  }

  getCreditCheckData(){
    this.subscriptions.push(
      this.headerservice.headerData().subscribe((res) => {
        this.isSubscribed = res.data.isSubscribed || 0;
        this.phoneverified = res.data.userInfo.phone_verified || 0;
        this.emailverified = res.data.userInfo.email_verified || 0;
      })
    )
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
    const dRef = this.dialog.open(RefillCreditRechargeModalComponent, {
      width: '450px',
      maxWidth: '93%',
      autoFocus: false,
      disableClose: true,
    });

    dRef.afterClosed().subscribe((res) => {
      if(res?.add){
        this.getCredit();
      }
    });
  }

  getCredit() {
    this.subscriptions.push(
      this.refillCredit
        .getCurrentCredit()
        .pipe(
          finalize(() => {
            this.isCreditLoading.set(false);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.currentCredit = String(data.data.credit);
          }
        })
    );
  }



    /**
   * @description Navigates to the subscription page based on the user verification status.
   *
   * If both the email and phone are verified, it navigates to the subscription page.
   *
   * If either the email or phone is not verified, it navigates to the verify email and phone page.
   */
    goToSubscription(): void {
      if (
        this.emailverified === 1 &&
        this.phoneverified === 1
      ) {
        this.onNavigation(['manage/subscription'], {
          state: { returnUrl: this.router.url }
        });
      } else {
        this.onNavigation(['/manage/users/verify-email-phone'], {
          queryParams: { returnUrl: '/manage/refill-credit/show-refillform' }
        });
      }
    }

    onNavigation(path:string[], extras?:NavigationExtras){
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        take(1)
      ).subscribe(() => {
        this.dialogRef.close();
      });
      
      this.router.navigate(path, extras).catch(() => {
        this.dialogRef.close();
      });
    }

  mailTypeChange(type: string) {
    if (type === 'recurring') {
      this.recurring = true;
      this.scheduleIt = false;
      this.emailForm.value.scheduleDate = '';
      this.emailForm.get('end_select')?.setValue(1);
      this.cd.detectChanges();
      this.Recurring({target: {value: 'transaction'}} as IEvent);
    } else if (type === 'schedule-it') {
      this.scheduleIt = true;
      this.recurring = false;
    } else {
      this.recurring = false;
      this.scheduleIt = false;
    }
  }

  Recurring(event: IEvent) {
    const specdate = document.getElementById(
      'specific_date_value'
    ) as HTMLInputElement;
    const transaction = document.getElementById(
      'transaction_count'
    ) as HTMLInputElement;

    if (event.target.value === 'transaction') {
      transaction.disabled = false;
      specdate.disabled = true;
      this.emailForm.value.until = null;
      this.emailForm.get('end_select')?.setValue(1);
      specdate.disabled = true;
    } else if (event.target.value === 'Specific-date') {
      this.emailForm.controls.count.patchValue('');
      this.emailForm.value.count = 0;
      specdate.disabled = false;
      transaction.disabled = true;
      this.emailForm.get('end_select')?.setValue(2);
    } else if (event.target.value === 'until') {
      specdate.disabled = true;
      transaction.disabled = true;
      this.emailForm.get('end_select')?.setValue(3);
      this.emailForm.value.count = '';
    }
  }

  createEmailMemobody() {
    const data = this.emailForm.value;
    return {
      schedule_date: data.scheduleDate,
      recurring_include_check: data.recurring_include_check,
      emailCheckRecurring: this.recurring || this.scheduleIt ? 1 : 0,
      is_recurring_value: this.recurring ? 1 : this.scheduleIt ? 2 : 0,
      recurring: this.recurring ? {
        frequency: data.frequency.toString(),
        start_date: data.start_date,
        end_select: data.end_select.toString(),
        count: data.count.toString(),
        until: data.end_select === 2 ? data.until : null
      } : this.scheduleIt ? {
        schedule_date: data.scheduleDate
      } : undefined
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }

}

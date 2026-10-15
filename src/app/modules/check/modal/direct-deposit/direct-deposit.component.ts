import { faCircleDollar } from '@fortawesome/pro-regular-svg-icons';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { NavigationEnd, NavigationExtras, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, finalize, take } from 'rxjs/operators';
import {
  IAchBody,
  IAchRow,
  IDirectDepositData
} from 'src/app/modules/check/model/check';
import { NgStyle, CurrencyPipe, NgClass, DatePipe } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { HttpHeaders } from '@angular/common/http';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IApiResWithMsg } from 'src/app/models/api';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendarAlt,
  faCircleInfo,
  faEnvelope,
  faExclamationTriangle,
  faMessage,
  faMoneyCheck,
  faPaperclip,
  faSync,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { RefillCreditRechargeModalComponent } from 'src/app/modules/refill-credit/modals/refill-credit-recharge-modal/refill-credit-recharge-modal.component';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { IWarningAlert, IInfoAlert } from '../../../../models/alert';
import { IAchSentData } from '../../../v3-bulk-payment/model/v3-bulk-payment';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { CheckAddAttachmentModalComponent } from '../check-add-attachment-modal/check-add-attachment-modal.component';

enum ProcessType {
  process = 0,
  recurring,
  sheduling
}

interface IDirectDepositAttachments {
  [key: string]: string | string[] | string[][];
}

interface IAchForm {
  checkId: FormControl<string | null>;
  payTo: FormControl<string | null>;
  payFrom: FormControl<string | null>;
  email: FormControl<string | null>;
  phone: FormControl<string | null>;
  existingAttach: FormControl<number | null>;
  check: FormControl<string | null>;
  checkAmount: FormControl<string | number | null>;
  cost: FormControl<number | null>;
  walletBypassing: FormControl<string | null>;
  bankNickName: FormControl<string | null>;
  payeeNickName: FormControl<string | null>;
  payee_account: FormControl<string | null>;
  addedAttachments: FormControl<number | null>;
  existingAttachments: FormControl<string[][] | null>;
  sms: FormControl<boolean | null>;
}

@Component({
  selector: 'app-direct-deposit',
  templateUrl: './direct-deposit.component.html',
  styleUrls: ['./direct-deposit.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatTooltip,
    MatDialogActions,
    NgStyle,
    CurrencyPipe,
    FontAwesomeModule,
    NewPhoneInputComponent,
    NgClass,
    DatePipe,
    CommonButtonV35Component,
    MatTooltipModule,
    MatRadioGroup,
    MatRadioButton,
    CommonInputFieldComponent,
    V35ControlMessageComponent
  ]
})
export class DirectDepositComponent implements OnInit, OnDestroy {
  private paymentsService = inject(PaymentsService);
  public data: Params = inject(MAT_DIALOG_DATA);
  public dialog = inject(MatDialog);
  public dialogRef = inject(MatDialogRef<DirectDepositComponent>);
  private checkService = inject(CheckService);
  private recurringRedirect = inject(RecurringRedirectService);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private refillService = inject(RefillCreditService);
  private headerService = inject(HeaderService);
  private datePipe = inject(DatePipe);

  faXmark = faXmark;
  faSync = faSync;
  faCalendar = faCalendarAlt;
  faExclamationTriangle = faExclamationTriangle;
  faCircleInto = faCircleInfo;
  faEnvelope = faEnvelope;
  faMessage = faMessage;
  faCircleDollar = faCircleDollar;
  faPaperclip = faPaperclip;
  faMoneycheck = faMoneyCheck;

  directDepositData: IApiResWithMsg<IDirectDepositData[]>;
  subscriptions: Subscription[] = [];
  showAlertBody = false;
  loading = false;
  btnType = '';
  multiCheck = false;
  datas: Params;
  skipprocess = false;
  isPayeeBankAccExist: number[] = [];
  payeeBankAcc: number[] = [];
  grandCheckCost = 0;
  grandCheckAmount = 0;
  samedayAchText = `Great! Your ACH request will be processed on the same day. This process will have a fee of $9.99.
  You should initiate the payment before 9.45 AM PST (11.45 AM CST) to ensure same-day processing.
  If initiated any later than that, it will be processed on the next business day but will still be considered as 'same-day ACH' with the same fee.`;

  isSameDayAch = false;
  attachments: IDirectDepositAttachments = {};

  DDForm = this.fb.group({
    achData: this.fb.array<FormGroup<IAchForm>>([])
  });

  emailForm = this.fb.group({
    emails: this.fb.array([])
  });

  submitting = false;
  attachmentsMessage = '';
  autoAttachmentForAch = false;
  recurringAdded = signal<boolean>(false);
  schedulingAdded = signal<boolean>(false);
  phoneverified = 0;
  emailverified = 0;
  isSubscribed = 0;
  currentCredit: string;
  isCreditLoading = signal(false);
  isLoading = signal(false);
  selectedType = signal<string>('process');
  minDate: Date | string;
  selectedDate: Date | string;
  reccuringForm: FormGroup;

  frequencyOptions = [
    { value: '3', label: 'Monthly' },
    { value: '6', label: 'Bimonthly' },
    { value: '7', label: 'Quarterly' },
    { value: '5', label: 'Biweekly' },
    { value: '2', label: 'Weekly' },
    { value: '1', label: 'Daily' }
  ];

  paymentOptions = [
    { value: 'process', label: 'Process Now' },
    { value: 'schedule', label: 'Schedule Payment' },
    { value: 'recurring', label: 'Recurring Payment' }
  ];

  ngOnInit(): void {
    if (this.data.type === 'Checkprocess') {
      /** Check process */

      this.skipprocess = true;
      this.datas = this.data.data;
    } else {
      this.datas = this.data;
    }

    this.isLoading.set(true);
    this.loadACHData();
    this.mailcredit();
    this.getCreditCheckData();
    this.initRecurringForm();
    this.getFormValueChanges();
  }
  
  initRecurringForm(): void {
    this.reccuringForm = this.fb.group({
      frequency: new FormControl('3', Validators.required),
      start_date: new FormControl<string|null>(null, Validators.required),
      end_select: new FormControl('3'),
      count: new FormControl<number|null|string>(1)
    });
    this.setMinDate();
  }

  setMinDate(): void {
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate = this.datePipe.transform(
      this.minDate,
      'yyyy-MM-dd'
    ) as string;
    this.reccuringForm.controls.start_date.setValue(this.minDate);
    this.selectedDate = this.minDate;
  }

  get fAchData() {
    return this.DDForm.controls.achData;
  }

  pushAchRow(achArr: IAchRow[] | IDirectDepositData[]): void {
    (achArr as IAchRow[]).forEach((data: IAchRow) => {
      let { phone } = data;

      if (data.phone && !data.phone.startsWith('+')) {
        phone = `+1${data.phone}`;
      }

      const form = this.fb.group<IAchForm>({
        checkId: new FormControl(data.chequeId),
        payTo: new FormControl(data.payTo),
        payFrom: new FormControl(data.payFrom),
        email: new FormControl(data.email, [
          Validators.required,
          ValidationService.emailValidator
        ]),
        existingAttach: new FormControl(data.existingAttach),
        check: new FormControl(data.check),
        checkAmount: new FormControl(data.checkAmount),
        phone: new FormControl(phone, ValidationService.phoneMinLength),
        cost: new FormControl(data.cost),
        walletBypassing: new FormControl('1'),
        sms: new FormControl(false),
        bankNickName: new FormControl(data.bankNickName),
        payeeNickName: new FormControl(data.payeeNickName),
        payee_account: new FormControl(
          this.getSelectedBankAcc(data.bankAccountList) as string
        ),
        addedAttachments: new FormControl(data.addedAttachments),
        existingAttachments: new FormControl([data.attachments])
      });

      this.subscriptions.push(
        form.controls.sms.valueChanges.subscribe((val) => {
          form.controls.phone.setValidators(ValidationService.phoneMinLength);
          form.controls.phone.updateValueAndValidity();

          if (!val) {
            form.controls.cost.setValue((form.value.cost || 0) - 0.5);
            this.grandCheckCost -= 0.5;
            return;
          }

          form.controls.phone.setValidators([
            Validators.required,
            ValidationService.phoneMinLength
          ]);
          form.controls.phone.updateValueAndValidity();

          if (form.controls.phone.invalid) {
            this.alertService.warningAlert({
              content: 'Please provide a valid phone number'
            });
            form.controls.sms.setValue(false, { emitEvent: false });
            form.controls.phone.setValidators(ValidationService.phoneMinLength);
            form.controls.phone.updateValueAndValidity();
            return;
          }

          form.controls.cost.setValue((form.value.cost || 0) + 0.5);
          this.grandCheckCost += 0.5;
        })
      );
      this.fAchData.push(form);
      this.grandCheckCost += Number(data.cost);
      this.grandCheckAmount += Number(data.checkAmount);
    });
    this.isPayeeBankAccExist = this.payeeBankAcc.filter((e) => e !== 0);
  }

  getSelectedBankAcc(bankAccountList: { selected: boolean; value: number }[]) {
    for (let i = 0; i < bankAccountList.length; i += 1) {
      const item = bankAccountList[i];

      this.payeeBankAcc.push(item.value);
      if (item.selected || item.value === 0) {
        return item.value.toString();
      }
    }
    return undefined;
  }

  loadACHData(): void {
    if (this.datas.length > 1) this.multiCheck = true;
    const cheques: string[] = this.datas.map(
      (e: { action: string }) => e.action
    );

    this.subscriptions.push(
      this.checkService
        .getDirectDepostModalData({ cheques })
        .pipe(
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.directDepositData = res;
            this.pushAchRow(res.data);
            if (res?.data[0]?.isAutoAttachmentEnabled === 1) {
              this.autoAttachmentForAch = false;
            } else {
              this.autoAttachmentForAch = true;
            }
            if (res?.message !== '') {
              this.showAlertBody = true;
              const alert = this.getElement('#alert');
              alert.innerText = res.message;
            }
          }
        })
    );
  }

  directDepositBody(
    type: string | number,
    data?: { recurring?: unknown; sheduling?: string }
  ) {
    this.btnType = type as string;
    const achBody: IAchBody = {
      data: {},
      recurring: {},
      isRecurringValue: '',
      isSameDay: 0
    };
    const achSentData: IAchSentData[] = [];

    this.fAchData.controls.forEach((e) => {
      const achData: IAchSentData = {};
      achData.mail_check_id = e.value.checkId as string;
      achData.payee_email = e.value.email as string;
      achData.wallet_bypassing = !e.value.walletBypassing ? '0' : '1';
      achData.payee_account = e.value.payee_account as string;
      achData.payee_phone = e.value.phone as string;
      achData.send_sms = e.value.sms ? 1 : 0;
      achData.file_hidden = this.attachments[
        e.value.checkId as string
      ] as string;
      achSentData.push(achData);
    });

    achBody.isRecurringValue = ProcessType[type as number];
    achBody.data = achSentData;

    if (data?.recurring) achBody.recurring = data?.recurring;
    else achBody.recurring = { schedule_date: data?.sheduling };

    if (type === 'process') {
      achBody.isSameDay = this.isSameDayAch ? 1 : 0;
    }
    this.onSubmit(achBody);
  }

  onSubmit(achBody: IAchBody) {
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.checkService
        .postDirectDepostModalData(achBody, headerOptions)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              if (this.recurringAdded() || this.schedulingAdded()) {
                this.recurringRedirect.mark('ach', this.recurringAdded());
              }
              /** check process */

              if (this.data?.processData?.processable_data?.ddChequeIds) {
                this.data.processData.processable_data.ddChequeIds = [];
                this.dialogRef.close({
                  success: true,
                  processData: this.data.processData,
                  rowData: this.data.rowData
                });
              } else {
                this.dialogRef.close({ success: true });
              }
            }
          },
          error: (error) => {
            if (error.error?.errorCode === 101) {
              const alert = this.openInfoAlert(
                error.error.errorMsg,
                'Add Info Now'
              );
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.dialogRef.close({
                    success: false,
                    addInfoClicked: true
                  });
                  this.achVerificationRequiredAlert();
                } else {
                  this.dialogRef.close({
                    success: false,
                    addInfoClicked: false
                  });
                }
              });
            }
            if (error.error?.errorCode === 504) {
              if (error.error?.id) {
                this.openVerifyBanks(error.error?.errorMsg, error.error?.id);
              } else {
                this.openVerifyBanks(error.error?.errorMsg);
              }
            }
            if (
              !error.error?.errorCode &&
              error.error?.errorType !== 'subscription'
            ) {
              this.alertService.warningAlert({
                content: error.error?.errorMsg
              });
            }
          }
        })
    );
  }

  /**
   * Method for navigate to banks list if there is more than one unverified banks.
   */
  openVerifyBanks(msg: string, bankId?: string) {
    const ref = this.alertService.warningAlert({
      content: msg,
      doneMsg: bankId ? 'Verify Now' : 'See My Banks',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        if (bankId) {
          this.paymentsService.openBankVerifyModal(bankId);
          return;
        }
        this.paymentsService.isPaymentProcessingSubject.next(false);
        this.dialogRef.close({ success: false });
        this.router.navigate(['/manage/bank-accounts/index']);
      }
    });
  }

  addAttachmentToAchEmail(checkId: string) {
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

    dialogRef.afterClosed().subscribe((checkAddAttachmentResponseData) => {
      if (checkAddAttachmentResponseData) {
        const checkId = checkAddAttachmentResponseData.checkId;
        const attachmentIds = checkAddAttachmentResponseData.ids;

        // Update the attachments object
        this.attachments[checkId] = attachmentIds;

        // Find the corresponding form control and update existingAttach
        this.fAchData.controls?.forEach((achData) => {
          if (achData.value.checkId === checkId) {
            // Update the message based on attachment status
            if (attachmentIds && attachmentIds.length > 0) {
              this.attachmentsMessage = 'You have attachments with this check';
            }
          }
        });
      }
    });
  }

  /**
   * when the attachment open the existing attachments will be checked.
   * @param checkId  string
   */
  checkTheExistingAttachments(checkId: string) {
    this.fAchData.controls?.forEach((achData) => {
      if (
        (achData.value.addedAttachments ?? 0) > 0 &&
        Object.keys(this.attachments).length === 0 &&
        achData.value.checkId === checkId
      ) {
        /** when it open first time this will work. */

        this.attachments[achData.value.checkId] = achData.value
          .existingAttachments as string[][];
      } else if (
        (achData.value.addedAttachments ?? 0) > 0 &&
        Object.keys(this.attachments).length > 0 &&
        achData.value.checkId === checkId
      ) {
        /** It will check the attachments based on the check id, when it open first time. */

        if (
          !Object.prototype.hasOwnProperty.call(
            this.attachments,
            achData.value.check as string
          )
        ) {
          this.attachments[achData.value.checkId] = achData.value
            .existingAttachments as string[][];
        }
      }
    });
  }

  achVerificationRequiredAlert(): void {
    const alert = this.alertService.warningAlert({
      content:
        'Some of your bank accounts are not approved for ACH, please apply to proceed.',
      doneMsg: 'See My Banks',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/bank-accounts/index']);
      }
    });
  }

  validateForm() {
    let isValid = true;
    this.fAchData.controls.forEach((e) => {
      if (e.value.checkAmount === 0) {
        isValid = false;
      } else {
        isValid = true;
      }
    });

    if (!isValid) {
      this.openWarningAlert();
    }

    return isValid;
  }

  onProcess(): void {
    this.fAchData.markAllAsTouched();

    if (!this.validateForm()) {
      return;
    }

    if (!this.DDForm.valid) return;
    if (this.recurringAdded()) {
      this.onRecurringProcess();
    } else if (this.schedulingAdded()) {
      if (this.selectedDate < this.minDate) return;
      this.directDepositBody('sheduling', { sheduling: this.selectedDate as string });
    } else {
      this.directDepositBody('process');
    }
  }

  onRecurringProcess(): void {
    this.reccuringForm.markAllAsTouched();
    if (this.reccuringForm.invalid) return;

    if (this.reccuringForm.controls.start_date.value < this.minDate) {
      return;
    }

    if (this.reccuringForm.invalid) {
      return;
    }
    if (
      this.reccuringForm.controls.end_select.value === '1' &&
      this.reccuringForm.controls.count.value === ''
    ) {
      return;
    }
    if (this.reccuringForm.controls.end_select.value === '3') {
      this.reccuringForm.controls.count.setValue(null);
    }
    this.directDepositBody('recurring', { recurring: this.reccuringForm.value });
  }

  /** skip check process */

  skip() {
    // this.dialogRef.close();
    if (!this.data.processData) return;

    if (this.data?.processData?.processable_data?.ddChequeIds) {
      this.data.processData.processable_data.ddChequeIds = [];
    }
    this.dialogRef.close({
      success: true,
      processData: this.data.processData,
      rowData: this.data.rowData
    });
  }

  openWarningAlert() {
    const data: IWarningAlert = {
      content: 'Amount should be minimum $1.00'
    };
    return this.alertService.warningAlert(data);
  }

  getElement(el: string): HTMLElement {
    return document.querySelector(el) as HTMLElement;
  }

  openInfoAlert(content: string, doneMsg: string, cancelMsg?: string) {
    const data: IInfoAlert = {
      title: false,
      content,
      isCancel: true,
      doneMsg,
      cancelMsg
    };
    return this.alertService.infoAlert(data);
  }

  checkAllSms(ev: Event & { target: HTMLInputElement }) {
    const event = ev;

    if (!event.target.checked) {
      for (
        let i = 0;
        i < this.DDForm.controls.achData.controls.length;
        i += 1
      ) {
        const form = this.DDForm.controls.achData.controls[i];

        if (form.controls.sms.value === true) {
          form.controls.sms.setValue(false);
        }
      }
      return;
    }

    let broken = false;

    for (let i = 0; i < this.DDForm.controls.achData.controls.length; i += 1) {
      const form = this.DDForm.controls.achData.controls[i];

      if (form.controls.sms.value === false) {
        form.controls.phone.setValidators([
          Validators.required,
          ValidationService.phoneMinLength
        ]);
        form.controls.phone.updateValueAndValidity();

        if (form.controls.phone.invalid) {
          broken = true;
          form.controls.phone.setValidators(ValidationService.phoneMinLength);
          form.controls.phone.updateValueAndValidity();
          this.alertService.warningAlert({
            content: `Please provide a valid phone number in row ${i + 1}`
          });
          break;
        }
      }
    }

    if (broken) {
      event.target.checked = false;
      return;
    }

    for (let i = 0; i < this.DDForm.controls.achData.controls.length; i += 1) {
      const form = this.DDForm.controls.achData.controls[i];

      form.controls.sms.setValue(true, { emitEvent: false });
      form.controls.cost.setValue((form.value.cost || 0) + 0.5);
      form.controls.phone.updateValueAndValidity();
      this.grandCheckCost += 0.5;
    }
  }

  mailcredit() {
    this.isCreditLoading.set(true);
    this.subscriptions.push(
      this.refillService
        .getCurrentCredit()
        .pipe(finalize(() => this.isCreditLoading.set(false)))
        .subscribe((res: { success: boolean; data: { credit: string } }) => {
          this.currentCredit = res.data.credit;
        })
    );
  }

  getCreditCheckData() {
    this.subscriptions.push(
      this.headerService.headerData().subscribe((res) => {
        this.isSubscribed = res.data.isSubscribed || 0;
        this.phoneverified = res.data.userInfo.phone_verified || 0;
        this.emailverified = res.data.userInfo.email_verified || 0;
      })
    );
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
      disableClose: true
    });

    dRef.afterClosed().subscribe((res) => {
      if (res?.add) {
        this.getCredit();
      }
    });
  }

  getCredit() {
    this.subscriptions.push(
      this.refillService
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

  changePaymentType(type: string) {
    this.selectedType.set(type);
    this.fAchData.markAllAsTouched();

    if (!this.validateForm()) {
      return;
    }

    if (!this.DDForm.valid) return;

    if (type === 'recurring') {
      this.recurringAdded.set(true);
      this.schedulingAdded.set(false);
      this.selectedDate = this.minDate;
    } else if (type === 'schedule') {
      this.recurringAdded.set(false);
      this.schedulingAdded.set(true);
      this.initRecurringForm();
    }else {
      this.recurringAdded.set(false);
      this.schedulingAdded.set(false);
      this.selectedDate = this.minDate;
      this.initRecurringForm();
    }
  }

  getFormValueChanges() {
    this.reccuringForm.controls.end_select.valueChanges.subscribe((value) => {
      if (value === '1') {
        this.reccuringForm.controls.count.addValidators(Validators.required);
      } else {
        this.reccuringForm.controls.count.clearValidators();
      }
      this.reccuringForm.controls.count.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

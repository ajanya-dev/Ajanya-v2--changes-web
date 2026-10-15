import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NewBankAccountModalComponent } from 'src/app/shared/bank-modal/modals/new-bank-account-modal/new-bank-account-modal.component';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DatePipe } from '@angular/common';
import {
  INewReceivePayment,
  IReceivePaymentSmsBank
} from 'src/app/modules/receive-payments/model/ReceivePayment';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown, IBankQrCode } from 'src/app/models/bank';
import { EditRecurringModaleV3Component } from '../edit-recurring-modale-v3/edit-recurring-modale-v3.component';
import { GetPaidByLinkComponent } from 'src/app/modules/payment-link/pages/get-paid-by-link/get-paid-by-link.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IPaymentConfig } from 'src/app/modules/payments/model/payments';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { BankAcDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { NgxMaskDirective } from 'ngx-mask';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { MemoInputComponent } from '../../../../../../shared/components/memo-input/memo-input.component';
import { ControlMessageComponent } from '../../../../../../shared/components/control-message/control-message/control-message.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { faWallet, faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

type TRequestPayementForm = {
  months?: FormControl<string | null>;
  requestPaymentType: FormControl<string | null>;
  requestPhone: FormControl<string | null>;
  amount: FormControl<string | null>;
  senderBankAccount: FormControl<string | null>;
  bank?: FormControl<string | null>;
  memo: FormControl<string | null>;
  paymentMethod: FormControl<number | null>;
  directLink: FormControl<string | null>;
  link: FormControl<string | null>;
  recurring: FormControl<boolean | number | null>;
  editable: FormControl<boolean | number | null>;
  startDate?: FormControl<string | null>;
  endSelect?: FormControl<string | null>;
  invoiceNumber: FormControl<string | null>;
  frequency: FormControl<string | null>;
  cheque_date: FormControl<string | null>;
};

/**
 * @description this component is used request payment using sms service
 */
@Component({
  selector: 'app-receive-sms-bank-v3',
  templateUrl: './receive-sms-bank-v3.component.html',
  styleUrls: ['./receive-sms-bank-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    ControlMessageComponent,
    MemoInputComponent,
    V35ControlMessageComponent,
    FaIconComponent,
    NgxMaskDirective,
    BankAcDropdownV3Component,
    MatCheckbox,
    MatTooltip,
    CommonButtonV35Component
  ]
})
export class ReceiveSmsBankV3Component implements OnInit, OnDestroy {
  @Output() success = new EventEmitter();
  @Input() paymentConfig: IPaymentConfig;
  @Output() qrCodeEvent = new EventEmitter<
    { qrCode: string; bank: string; paymentId: string } | false
  >();

  requestPaymentForm!: FormGroup;
  subscriptions: Subscription[] = [];
  selectedId: string | null = '';
  /**
   * @description Variable to store the generated QR code link.
   */
  qrCodeLink: string;
  /**
   * @description flag to indicate whether QR code is scannable or not
   */
  isScan = false;
  selectedDate: string | null;
  paymentLink: string;
  getPaymentId: string;
  selectedBankName: string;
  savedData: { formValue: FormGroup | null; bankAccountId: string };
  minDate: string | null;
  loading = false;
  /**
   * @description Flag to indicate whether QR code generation is in progress or not, and display the loader.
   */
  qrLoading = false;
  isNumberMasked = false;
  paymentAmount: number;
  selectedBank: IBankDropdown;
  faWallet = faWallet;
  faCircleQuestion = faCircleQuestion;
  today!: string;

  utils = Utils;

  public dialog = inject(MatDialog);
  private bankService = inject(BankService);
  private _alertService = inject(AlertService);
  private router = inject(Router);
  private _sharedService = inject(SharedService);
  private paymentsService = inject(PaymentsService);
  private datePipe = inject(DatePipe);

  ngOnInit(): void {
    this.today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;
    this.initFormGroup();
    this.observeRecurring();
  }

  /** Used for observing recurring form field in RequestPaymentForm
   * - so we can change other values those depends on its value
   */
  observeRecurring() {
    this.subscriptions.push(
      this.requestPaymentForm.controls.recurring.valueChanges.subscribe(
        (val) => {
          if (this.requestPaymentForm.controls.startDate?.value === '' && val) {
            this.openRecurringDialog();
          } else if (!val) {
            this.requestPaymentForm.controls.startDate.setValue('');
            this.requestPaymentForm.controls.months.setValue('');
            this.requestPaymentForm.controls.endSelect.setValue('1');
            this.requestPaymentForm.controls.frequency?.setValue('3');
          }
        }
      )
    );
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initFormGroup() {
    if (this.paymentConfig.paymentFormValue.requestPaymentType) {
      this.paymentConfig.paymentFormValue.requestPaymentType = 'sms';
    }
    this.requestPaymentForm = new FormGroup<TRequestPayementForm>({
      requestPaymentType: new FormControl('sms', Validators.required),
      requestPhone: new FormControl('', [
        Validators.required,
        Validators.minLength(10)
      ]),
      amount: new FormControl('0.00', [
        Validators.required,
        Validators.min(0.01)
      ]),
      senderBankAccount: new FormControl('', Validators.required),
      bank: new FormControl(),
      memo: new FormControl('', [
        Validators.required,
        Validators.maxLength(150)
      ]),
      paymentMethod: new FormControl(2),
      directLink: new FormControl(''),
      link: new FormControl(''),
      recurring: new FormControl(false),
      editable: new FormControl(false),
      startDate: new FormControl(''),
      endSelect: new FormControl('1'),
      months: new FormControl('2'),
      frequency: new FormControl(''),
      invoiceNumber: new FormControl(null, Validators.required),
      cheque_date: new FormControl(this.today, [Validators.required])
    });
    this.setCommonFormValues();
  }

  setCommonFormValues() {
    this.requestPaymentForm?.valueChanges.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = {
        ...this.paymentConfig.paymentFormValue,
        ...formValueChanges
      };
    });
    if (this.paymentConfig.paymentFormValue) {
      this.requestPaymentForm?.patchValue(this.paymentConfig.paymentFormValue);
      if (this.paymentConfig.paymentFormValue.bank?.id) {
        this.getQRcode(this.paymentConfig.paymentFormValue.bank?.id);
      }
    }
  }

  /**
   * @description  Opens a dialog to add a new bank account
   */
  addNewBankAccount(): void {
    const dialogRef = this.dialog.open(NewBankAccountModalComponent, {
      width: '510px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((createdBankId) => {
      if (createdBankId != null) {
        if (createdBankId) {
          this._sharedService.setNewBankCreatedData({
            bankAccountId: createdBankId.id
          });
          this.selectedId = createdBankId.id;
          this.requestPaymentForm.controls.senderBankAccount.setValue(
            createdBankId.id
          );
          this.getQRcode(createdBankId.id);
        }
      }
    });
  }

  /**
   * - Opening a modale for editing options when checking recurring option
   */
  openRecurringDialog() {
    const dialogRef = this.dialog.open(EditRecurringModaleV3Component, {
      width: '400px',
      disableClose: true,
      data: {
        endSelect: this.requestPaymentForm.controls.endSelect?.value,
        months: this.requestPaymentForm.controls.months?.value,
        startDate: this.requestPaymentForm.controls.startDate?.value,
        frequency: this.requestPaymentForm.controls.frequency?.value
      }
    });

    dialogRef.afterClosed().subscribe({
      next: (val: {
        endSelect: string;
        startDate: string;
        months?: string;
        frequency?: string;
      }) => {
        if (val) {
          this.requestPaymentForm.controls.endSelect?.setValue(val.endSelect);
          this.requestPaymentForm.controls.startDate?.setValue(val.startDate);
          if (val.months) {
            this.requestPaymentForm.controls.months?.setValue(val.months);
          }
          if (val.endSelect === '1') {
            this.requestPaymentForm.controls.months?.setValue('');
          }
          if (val.frequency) {
            this.requestPaymentForm.controls.frequency?.setValue(val.frequency);
          }
        } else if (
          !val &&
          this.requestPaymentForm.controls.startDate?.value === ''
        ) {
          this.requestPaymentForm.controls.recurring.setValue(false);
        }
      }
    });
  }

  openSuccessAlert() {
    const successAlertData = {
      title: 'Success',
      content: 'Successfully Created',
      close: true,
      timeout: 1500
    };
    this._alertService.successAlert(successAlertData);
  }

  /**
   * Handles the event when the selected bank changes.
   * Retrieves the QR code by calling the getQRcode function with the bank ID.
   * Sets the selected ID and updates the value of the sender bank account in the request payment form.
   *
   * @param event - The event object containing the ID of the selected bank.
   */
  onChangeBank(event: IBankDropdown) {
    const previousVal =
      this.requestPaymentForm.controls.senderBankAccount.value;
    if (event?.id === previousVal || !event?.id) return;
    if (event) {
      this.selectedBank = event;
      this.getQRcode(event.id);
      this.selectedId = event.id;
      this.requestPaymentForm.controls.senderBankAccount.setValue(event.id);
    } else {
      this.isScan = false;
      this.requestPaymentForm.controls.senderBankAccount.setValue('');
    }
  }

  onRemoveBank() {
    this.requestPaymentForm.controls.senderBankAccount.setValue('');
    this.requestPaymentForm.controls.senderBankAccount.markAsTouched();
    this.qrCodeEvent.emit(false);
  }

  /** For Generating QR code if there is none when selecting a bank
   * - opens when selecting a bank , submitting a form and adding a bank account
   */
  getQRcode(id: string) {
    this.isScan = false;
    const alert = {
      title: 'Link not found !',
      content: 'Please add a payment link to the bank account',
      doneMsg: 'Generate a link',
      cancelMsg: 'No, cancel'
    };
    this.qrLoading = true;
    this.subscriptions.push(
      this.bankService
        .qetQrCode(id)
        .pipe(
          finalize(() => {
            this.qrLoading = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              const qrCodeDetails: IBankQrCode = res.data[0];
              this.generateQRCode(qrCodeDetails.payment_url, qrCodeDetails.id);
              this.paymentLink = qrCodeDetails.payment_url;
              this.requestPaymentForm.controls.link.setValue(qrCodeDetails.id);
              this.getPaymentId = qrCodeDetails.id;
              this.selectedBankName = qrCodeDetails.bank_account_name;
            }
          },
          (err) => {
            if (err.error.errorCode == 110) {
              this.qrCodeEvent.emit();
              this.requestPaymentForm.controls.link.setValue('');
              const response = this._alertService.confirmAlert(alert);
              response.afterClosed().subscribe((result) => {
                if (result) {
                  const dialogRef = this.dialog.open(GetPaidByLinkComponent, {
                    data: { selectedBankId: this.selectedId }
                  });
                  dialogRef.afterClosed().subscribe({
                    next: (res) => {
                      if (res) {
                        this.getQRcode(this.selectedId as string);
                      }
                    }
                  });
                }
              });
            }
          }
        )
    );
  }

  /**
   * @description Creat QrCode link and emit to parent component.
   * @param {string} url - QRCode link
   * @param {string} id - QRCode id.
   */
  generateQRCode(url: string, id: string) {
    this.isScan = true;
    this.qrCodeLink = `https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr?cht=qr&chl=${url}&chs=300x300`;
    this.qrCodeEvent.emit({
      qrCode: this.qrCodeLink,
      bank: this.selectedBank?.nickName,
      paymentId: id
    });
  }

  alert(msg: string) {
    const warningAlertData = {
      title: 'Error',
      content: msg
    };
    this._alertService.warningAlert(warningAlertData);
  }

  /**
   * Clears the input based on the provided value.
   * If the value is '1', the months control in the request payment form is disabled and its value is set to empty.
   * If the value is '2', the months control is enabled and its value is set to 1.
   *
   * @param value - The value to determine the action to be performed.
   */
  clearInput(value: string) {
    if (value === '1') {
      this.requestPaymentForm.controls.months.patchValue('');
      this.requestPaymentForm.controls.months.disable();
    } else if (value === '2') {
      this.requestPaymentForm.controls.months.enable();
      this.requestPaymentForm.controls.months.patchValue(1);
    }
  }

  /**
   * Creates a body object for receiving payment based on the values in the request payment form.
   *
   * @returns The body object for receiving payment.
   */
  createReceivePaymentBody(): IReceivePaymentSmsBank {
    const data = this.requestPaymentForm.value;
    return {
      amount: data.amount,
      directLink: data.directLink,
      editable: data.editable,
      endSelect: data.endSelect,
      link: data.link,
      memo: data.memo,
      paymentMethod: data.paymentMethod,
      recurring: data.recurring,
      requestPaymentType: data.requestPaymentType,
      requestPhone: data.requestPhone,
      senderBankAccount: data.senderBankAccount,
      startDate: data.startDate,
      months: data.months,
      invoice_number: data.invoiceNumber,
      frequency: data.frequency,
      cheque_date: data.cheque_date
    };
  }

  /**
   * Submits the payment request form.
   *
   * This function performs the following steps:
   * 1. Sets the payment amount based on the value in the amount field of the form.
   * 2. Marks all form controls as touched.
   * 3. Checks if the form is invalid and returns if it is.
   * 4. Checks if the link field is empty and returns after getting the QR code if there is a selected ID.
   * 5. Sets the recurring value based on the form control value, and checks if the start date is valid if recurring is enabled.
   * 6. Sets the editable value based on the form control value.
   * 7. Sets the direct link value based on the payment link.
   * 8. Applies phone number masking if the request phone field is not empty and the number is not already masked.
   * 9. Initiates the payment request by calling the bank service's requestPayment method.
   * 10. Handles the success and error responses from the requestPayment call.
   * 11. Resets the isNumberMasked flag to false.
   */
  submit() {
    this.paymentAmount = this.requestPaymentForm.value.amount;
    this.requestPaymentForm.markAllAsTouched();
    if (this.requestPaymentForm.invalid) {
      return;
    }

    if (this.requestPaymentForm.controls.link.value === '') {
      if (this.selectedId) {
        this.getQRcode(this.selectedId);
      }
      return;
    }

    if (!this.requestPaymentForm.controls.recurring.value) {
      this.requestPaymentForm.controls.recurring.setValue(0);
    } else {
      this.requestPaymentForm.controls.recurring.setValue(1);
      if (
        this.minDate &&
        this.requestPaymentForm.controls.startDate.value < this.minDate
      ) {
        return;
      }
    }

    if (!this.requestPaymentForm.controls.editable.value) {
      this.requestPaymentForm.controls.editable.setValue(0);
    } else {
      this.requestPaymentForm.controls.editable.setValue(1);
    }

    this.requestPaymentForm.controls.directLink.setValue(this.paymentLink);

    if (
      this.requestPaymentForm.controls.requestPhone.value != '' &&
      !this.isNumberMasked
    ) {
      this.requestPaymentForm.controls.requestPhone.setValue(
        this.phoneNumberMask(
          this.requestPaymentForm.controls.requestPhone.value
        )
      );
    }

    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.bankService
        .requestPayment(this.createReceivePaymentBody() as INewReceivePayment)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.success.emit({
                title: 'Payment Requested',
                paymentReceived: this.requestPaymentForm.controls.amount.value,
                content:
                  'You have requested the payment, Please check the status in your records',
                type: 'receive'
              });
            }
          },
          error: (err) => {
            if (err.error.errorCode === 106) {
              const dref = this.openWarningAlert(err.error.errorMsg);
              dref.afterClosed().subscribe((res) => {
                if (res) {
                  this.router.navigate(['/manage/users/verify-email-phone'], {
                    queryParams: {
                      returnUrl: 'manage/payments/main/receive/payer/bank'
                    }
                  });
                }
              });
            }
          }
        })
    );
    this.isNumberMasked = false;
  }

  /**
   * - Used For Masking phone number when sending data to backend
   */
  phoneNumberMask(phone: string) {
    const num = String(phone);

    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);

    const number = '(' + num1 + ') ' + num2 + '-' + num3;
    this.isNumberMasked = true;
    return number;
  }

  openWarningAlert(content: string) {
    const warningAlertData = {
      title: 'Error',
      content: content,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    };
    return this._alertService.warningAlert(warningAlertData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}

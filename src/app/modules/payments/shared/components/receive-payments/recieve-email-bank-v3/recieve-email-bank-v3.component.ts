import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { IBankDropdown, IBankQrCode } from 'src/app/models/bank';
import { GetPaidByLinkComponent } from 'src/app/modules/payment-link/pages/get-paid-by-link/get-paid-by-link.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { EditRecurringModaleV3Component } from '../edit-recurring-modale-v3/edit-recurring-modale-v3.component';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { IApiRes } from 'src/app/models/api';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IPaymentConfig } from 'src/app/modules/payments/model/payments';
import { INewReceivePayment } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { BankAcDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MemoInputComponent } from '../../../../../../shared/components/memo-input/memo-input.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { faWallet, faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

type TRequestPayementForm = {
  months: FormControl<string | null>;
  requestPaymentType: FormControl<string | null>;
  requestEmail: FormControl<string | null>;
  amount: FormControl<string | null>;
  senderBankAccount: FormControl<string | null>;
  bank?: FormControl<string | null>;
  memo: FormControl<string | null>;
  paymentMethod: FormControl<number | null>;
  directLink: FormControl<string | null>;
  link: FormControl<string | null>;
  recurring: FormControl<boolean | number | null>;
  editable: FormControl<boolean | number | null>;
  startDate: FormControl<string | null>;
  endSelect: FormControl<'1' | '2' | null>;
  invoiceNumber: FormControl<string | null>;
  frequency: FormControl<string | null>;
  cheque_date: FormControl<string | null>;
};

interface IGetQrCodeResponse {
  bank_account_name: string;
  logo_url: any;
  short_url: string;
  id: string;
  name: string;
  payment_url: string;
}

interface ISubmitResponse {
  id: string;
  uu_id: string;
  attachment: string;
}

/**
 * @description this component is used request payment using email service
 */
@Component({
  selector: 'app-recieve-email-bank-v3',
  templateUrl: './recieve-email-bank-v3.component.html',
  styleUrls: ['./recieve-email-bank-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    V35ControlMessageComponent,
    MemoInputComponent,
    FaIconComponent,
    BankAcDropdownV3Component,
    MatCheckbox,
    MatTooltip,
    CommonButtonV35Component
  ]
})
export class RecieveEmailBankV3Component implements OnInit, OnDestroy {
  @Output() success = new EventEmitter();
  @Input() paymentConfig: IPaymentConfig;
  @Output() qrCodeEvent = new EventEmitter<
    { qrCode: string; bank: string; paymentId: string } | false
  >();

  private _bankService = inject(BankService);
  private _alertService = inject(AlertService);
  private _router = inject(Router);
  private _matDialog = inject(MatDialog);
  private paymentsService = inject(PaymentsService);
  private datePipe = inject(DatePipe);

  loading = false;
  qrLoading = false;
  subscriptions: Subscription[] = [];
  reqPaymentf!: FormGroup<TRequestPayementForm>;
  paymentLink!: string;
  selectedBankName: string;
  selectedId: string;
  qrCodeLink = '';
  editRecurring = false;
  selectedBank: IBankDropdown;
  faWallet = faWallet;
  faCircleQuestion = faCircleQuestion;
  today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;

  ngOnInit() {
    this.initForm();
    this.observeRecurring();
  }

  /** Used for observing recurring form field in RequestPaymentForm
   * - so we can change other values those depends on its value
   */
  observeRecurring() {
    this.subscriptions.push(
      this.reqPaymentf.controls.recurring.valueChanges.subscribe((val) => {
        if (this.reqPaymentf.controls.startDate?.value === '' && val) {
          this.openRecurringDialog();
        } else if (!val) {
          this.reqPaymentf.controls.startDate.setValue('');
          this.reqPaymentf.controls.months.setValue('');
          this.reqPaymentf.controls.endSelect.setValue('1');
          this.reqPaymentf.controls.frequency?.setValue('3');
        }
      })
    );
  }

  /**
   * - Opening a modale for editing options when checking recurring option
   */
  openRecurringDialog() {
    const dialogRef = this._matDialog.open(EditRecurringModaleV3Component, {
      width: '400px',
      disableClose: true,
      data: {
        endSelect: this.reqPaymentf.controls.endSelect?.value,
        months: this.reqPaymentf.controls.months?.value,
        startDate: this.reqPaymentf.controls.startDate?.value,
        frequency: this.reqPaymentf.controls.frequency?.value
      }
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe({
        next: (val: {
          endSelect: '1' | '2';
          startDate: string;
          months?: string;
          frequency?: string;
        }) => {
          if (val) {
            this.reqPaymentf.controls.endSelect?.setValue(val.endSelect);
            this.reqPaymentf.controls.startDate?.setValue(val.startDate);

            if (val.months) {
              this.reqPaymentf.controls.months?.setValue(val.months);
            }

            if (val.endSelect === '1') {
              this.reqPaymentf.controls.months?.setValue('');
            }
            if (val.frequency) {
              this.reqPaymentf.controls.frequency?.setValue(val.frequency);
            }
          } else if (
            !val &&
            this.reqPaymentf.controls.startDate?.value === ''
          ) {
            this.reqPaymentf.controls.recurring.setValue(false);
          }
        }
      })
    );
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    if (this.paymentConfig.paymentFormValue.requestPaymentType) {
      this.paymentConfig.paymentFormValue.requestPaymentType = 'email';
    }
    this.reqPaymentf = new FormGroup<TRequestPayementForm>({
      requestPaymentType: new FormControl('email', Validators.required),
      requestEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator
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
      invoiceNumber: new FormControl(null, [Validators.required]),
      cheque_date: new FormControl(this.today, [Validators.required])
    });
    this.setCommonFormValues();
  }

  setCommonFormValues() {
    this.reqPaymentf?.valueChanges.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = {
        ...this.paymentConfig.paymentFormValue,
        ...formValueChanges
      };
    });
    if (this.paymentConfig.paymentFormValue) {
      this.reqPaymentf?.patchValue(this.paymentConfig.paymentFormValue);
      if (this.paymentConfig.paymentFormValue.bank?.id) {
        this.getQRcode(this.paymentConfig.paymentFormValue.bank?.id);
      }
    }
  }

  /**
   * @description This function is triggered when a bank is selected from the dropdown.
   * @param event -The selected bank details from the bank dropdown component.
   */
  selectBank(event: IBankDropdown) {
    const previousVal = this.reqPaymentf.controls.senderBankAccount.value;
    if (event?.id === previousVal || !event?.id) return;
    if (event) {
      this.selectedBank = event;
      this.selectedId = event.id;
      this.getQRcode(event.id);
      this.reqPaymentf.controls.senderBankAccount.setValue(event.id);
    }
  }

  /**
   * @description This function is called to clear the selected bank and associated details in the payment form.
   */
  clearBank() {
    this.reqPaymentf.controls.senderBankAccount.setValue('');
    this.reqPaymentf.controls.senderBankAccount.markAsTouched();
    this.qrCodeEvent.emit(false);
  }

  /**
   * Submits the payment request form.
   *
   * This function performs the following steps:
   * 1. Marks all form controls as touched.
   * 2. Checks if the form is invalid and returns if it is.
   * 3. Sets the recurring value based on the form control value.
   * 5. Checks if the link field is empty and gets the QR code if it is.
   * 6. Sets the direct link value based on the payment link.
   * 7. Initiates the submission by calling the requestPayment method of the bank service.
   * 8. Handles the success and error responses from the requestPayment call by calling the corresponding functions.
   */
  submit() {
    // Pre Submission Operations

    this.reqPaymentf.markAllAsTouched();
    if (this.reqPaymentf.invalid) {
      return;
    }

    if (!this.reqPaymentf.controls.recurring.value) {
      this.reqPaymentf.controls.recurring.setValue(0);
    } else {
      this.reqPaymentf.controls.recurring.setValue(1);
    }

    if (!this.reqPaymentf.controls.editable.value) {
      this.reqPaymentf.controls.editable.setValue(0);
    } else {
      this.reqPaymentf.controls.editable.setValue(1);
    }

    if (this.reqPaymentf.controls.link.value === '') {
      this.getQRcode(this.selectedId);
      return;
    }

    this.reqPaymentf.controls.directLink.setValue(this.paymentLink);

    // Starts Submission
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    const value = this.reqPaymentf.value;
    this.subscriptions.push(
      this._bankService
        .requestPayment({
          ...value,
          invoice_number: value.invoiceNumber
        } as unknown as INewReceivePayment)
        .subscribe({
          next: (res) => {
            this.onSubmitNext(res);
          },
          error: (err) => {
            this.onSubmitError(err);
          }
        })
    );
  }

  /**
   * @description Handles the response after submitting the payment request form successfully.
   * @param res -the response object from the spi
   */
  onSubmitNext(res: IApiRes<ISubmitResponse[]>) {
    this.loading = false;
    this.paymentsService.isPaymentProcessingSubject.next(false);
    if (res.success) {
      this.success.emit({
        title: 'Payment Requested',
        paymentReceived: this.reqPaymentf.controls.amount.value,
        content:
          'You have requested the payment , please check the status in your records',
        type: 'receive'
      });
    }
  }

  /**
   * @description Handles the error after submitting the payment request form failed.
   * @param err -the error object from the spi
   */
  onSubmitError(err: HttpErrorResponse) {
    this.loading = false;
    this.paymentsService.isPaymentProcessingSubject.next(false);
    if (err.error.errorCode === 106) {
      const dref = this.warningAlert(err.error.errorMsg);
      dref.afterClosed().subscribe((res) => {
        if (res) {
          this._router.navigate(['/manage/users/verify-email-phone'], {
            queryParams: {
              returnUrl: 'manage/payments/main/receive/payer/bank'
            }
          });
        }
      });
    }
  }

  /** For Generating QR code if there is none when selecting a bank
   * - opens when selecting a bank , submitting a form and adding a bank account
   */
  getQRcode(id: string) {
    this.qrLoading = true;
    this.subscriptions.push(
      this._bankService
        .qetQrCode(id)
        .pipe(
          finalize(() => {
            this.qrLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.onQrCodeNext(res);
          },
          error: (err) => {
            this.onQrCodeError(err);
          }
        })
    );
  }

  /**
   * @description Handles the response after successfully retrieving the QR code details.
   * @param res -The response object from the API.
   */
  onQrCodeNext(res: IApiRes<IGetQrCodeResponse[]>) {
    this.qrLoading = false;
    if (res.success) {
      const qrCodeDetails: IBankQrCode = res.data[0];
      this.generateQRCode(qrCodeDetails.payment_url, qrCodeDetails.id);
      this.paymentLink = qrCodeDetails.payment_url;
      this.reqPaymentf.controls.link.setValue(qrCodeDetails.id);
      this.selectedBankName = qrCodeDetails.bank_account_name;
    }
  }

  /**
   * @description Handles the error response when the QR code is not found.
   * @param err -The error object from the API.
   */
  onQrCodeError(err: HttpErrorResponse) {
    const alertData = {
      title: 'Link not found !',
      content: 'Please add a payment link to the bank account',
      doneMsg: 'Generate a link',
      cancelMsg: 'No, cancel'
    };
    this.qrCodeEvent.emit();
    this.qrLoading = false;
    if (err.error.errorCode == 110) {
      this.reqPaymentf.controls.link.setValue('');
      const response = this._alertService.confirmAlert(alertData);
      response.afterClosed().subscribe({
        next: (result) => {
          if (result) {
            const dialogRef = this._matDialog.open(GetPaidByLinkComponent, {
              data: { selectedBankId: this.selectedId }
            });
            dialogRef.afterClosed().subscribe({
              next: (res) => {
                if (res) {
                  this.getQRcode(this.selectedId);
                }
              }
            });
          }
        }
      });
    }
  }

  /**
   * @description Creat QrCode link and emit to parent component.
   * @param {string} url - QRCode link
   * @param {string} id - QRCode id.
   */
  generateQRCode(url: string, id: string) {
    this.qrCodeLink = `https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr?cht=qr&chl=${url}&chs=300x300`;
    this.qrCodeEvent.emit({
      qrCode: this.qrCodeLink,
      bank: this.selectedBank?.nickName,
      paymentId: id
    });
  }

  warningAlert(content: string) {
    const warningAlertData = {
      title: 'Erro',
      content: content,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    };
    return this._alertService.warningAlert(warningAlertData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

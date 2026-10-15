import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown, IBankQrCode } from 'src/app/models/bank';
import {
  IPayeeDetailsEvent,
  IPayeeEditedData,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { AddEmailPayeeModalComponent } from 'src/app/shared/modal/process-modal/add-email-payee-modal/add-email-payee-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DatePipe } from '@angular/common';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IPayerBankForm } from 'src/app/modules/payments/shared/components/receive-payments/model/bank-form';
import { IPaymentConfig } from 'src/app/modules/payments/model/payments';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { GetPaidByLinkComponent } from 'src/app/modules/payment-link/pages/get-paid-by-link/get-paid-by-link.component';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { Router } from '@angular/router';
import { INewReceivePayment } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faWallet, faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { EditRecurringModaleV3Component } from '../edit-recurring-modale-v3/edit-recurring-modale-v3.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { BankAcDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { MemoInputComponent } from '../../../../../../shared/components/memo-input/memo-input.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';

@Component({
  selector: 'app-recieve-payer-bank-v3',
  templateUrl: './recieve-payer-bank-v3.component.html',
  styleUrls: ['./recieve-payer-bank-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    V35ControlMessageComponent,
    MemoInputComponent,
    PayeeDropdownV3Component,
    FaIconComponent,
    BankAcDropdownV3Component,
    MatCheckbox,
    MatTooltip,
    CommonButtonV35Component
  ]
})
export class RecievePayerBankV3Component
  implements OnInit, OnDestroy, OnChanges
{
  private payeeService = inject(PayeeService);
  private bankService = inject(BankService);
  private matDialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() success = new EventEmitter();
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() qrCodeEvent = new EventEmitter<
    { qrCode: string; bank: string; paymentId: string } | false
  >();

  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() paymentConfig: IPaymentConfig;

  requestForm: FormGroup<IPayerBankForm>;
  loading: boolean;
  subscriptions: Subscription[] = [];
  payeeDetails: IViewPayee | undefined;
  utils = Utils;
  selectedPayee: IViewPayee;
  selectedBank: IBankDropdown;
  submitting: boolean;
  paymentLink: string;
  selectedBankName: string;
  selectedId: string;
  isQRCodeLoad = false;
  qrCodeLink: string;
  isUserVerified = true;

  faWallet = faWallet;
  faCircleQuestion = faCircleQuestion;
  today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;

  ngOnInit(): void {
    this.initForm();
    this.checkIsUserVerified();
  }

  checkIsUserVerified() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.email_verified === 0 || res.phone_verified === 0) {
          this.isUserVerified = false;
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
      }
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    if (this.paymentConfig.paymentFormValue.requestPaymentType) {
      this.paymentConfig.paymentFormValue.requestPaymentType = 'payee';
    }
    this.requestForm = new FormGroup<IPayerBankForm>({
      amount: new FormControl('0.00', [
        Validators.required,
        Validators.min(0.1)
      ]),
      payee: new FormControl('', [Validators.required]),
      bank: new FormControl(),
      payerId: new FormControl(''),
      senderBankAccount: new FormControl('', [Validators.required]),
      memo: new FormControl('', [
        Validators.required,
        Validators.maxLength(150)
      ]),
      cheque_date:new FormControl(this.today, [Validators.required]),
      payeeBankAc: new FormControl(''),
      payeeEmail: new FormControl('', [Validators.required]),
      requestPaymentType: new FormControl('payee', [Validators.required]),
      paymentMethod: new FormControl(2),
      link: new FormControl(''),
      directLink: new FormControl(''),
      recurring: new FormControl(false),
      editable: new FormControl(false),
      startDate: new FormControl(''),
      endSelect: new FormControl('1'),
      months: new FormControl(''),
      frequency: new FormControl(''),
      invoiceNumber: new FormControl(null, [Validators.required])
    });
    this.observeRecurring();
    this.setCommonFormValues();
  }

  setCommonFormValues() {
    this.requestForm?.valueChanges.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = {
        ...this.paymentConfig.paymentFormValue,
        ...formValueChanges
      };
    });
    if (this.paymentConfig.paymentFormValue) {
      this.requestForm?.patchValue(this.paymentConfig.paymentFormValue);
      if (this.paymentConfig.paymentFormValue.bank?.id) {
        this.getQRCode(this.paymentConfig.paymentFormValue.bank?.id);
      }
    }
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /** Used for observing recurring form field in RequestPaymentForm
   * - so we can change other values those depends on its value
   */
  observeRecurring() {
    this.subscriptions.push(
      this.requestForm.controls.recurring.valueChanges.subscribe((val) => {
        if (this.requestForm.controls.startDate?.value === '' && val) {
          this.requestForm.controls.months.setValue('');
          this.openRecurringDialog();
        } else if (!val) {
          this.requestForm.controls.startDate.setValue('');
          this.requestForm.controls.months.setValue('');
          this.requestForm.controls.endSelect.setValue('1');
          this.requestForm.controls.frequency?.setValue('3');
        }
      })
    );
  }

  /**
   * - Opening a modale for editing options when checking recurring option
   */
  openRecurringDialog() {
    const dialogRef = this.matDialog.open(EditRecurringModaleV3Component, {
      width: '400px',
      disableClose: true,
      data: {
        endSelect: this.requestForm.controls.endSelect?.value,
        months: this.requestForm.controls.months?.value,
        startDate: this.requestForm.controls.startDate?.value,
        frequency: this.requestForm.controls.frequency?.value
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
            this.requestForm.controls.endSelect?.setValue(val.endSelect);
            this.requestForm.controls.startDate?.setValue(val.startDate);
            if (val.months) {
              this.requestForm.controls.months?.setValue(val.months);
            }
            if (val.endSelect === '1') {
              this.requestForm.controls.months?.setValue('');
            }
            if (val.frequency) {
              this.requestForm.controls.frequency?.setValue(val.frequency);
            }
          } else if (
            !val &&
            this.requestForm.controls.startDate?.value === ''
          ) {
            this.requestForm.controls.recurring.setValue(false);
          }
        }
      })
    );
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   */
  payeeSelect(event: IViewPayee) {
    const previousValue = this.requestForm.controls.payerId.value;
    if (
      event?.id === previousValue ||
      !event?.id ||
      event?.name === 'Payee Name'
    ) {
      return;
    }
    if (event) {
      this.requestForm.controls.payerId.setValue(event?.id);
      this.getPayeeDetails(event?.id);
      this.selectedPayee = event;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
    }
  }

  /**
   * @description This function is triggered when a bank is selected from the dropdown.
   * @param event -The selected bank details from the bank dropdown component.
   */
  bankSelect(event: IBankDropdown) {
    const previousValue = this.requestForm.controls.senderBankAccount.value;
    if (event?.id === previousValue || !event?.id) {
      return;
    }
    this.requestForm.controls.senderBankAccount.setValue(event.id);
    this.selectedBank = event;
    this.selectedId = event?.id;
    this.getQRCode(event?.id);
    if (!event) {
      this.qrCodeEvent.emit(false);
    }
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string) {
    this.payeeDetails = undefined;
    this.subscriptions.push(
      this.payeeService.showPayee(payeeId).subscribe((res) => {
        if (res?.success) {
          this.payeeDetails = res.data;
          if (this.changedInfo?.selectedPayeeDetails?.id) {
            this.payeeDetailsEvents.emit({
              payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
              isMoreDetailsLoading: false
            });
          } else {
            this.payeeDetailsEvents.emit({
              payeeDropdownDetails: this.payeeDetails
                ? this.payeeDetails
                : this.selectedPayee,
              isMoreDetailsLoading: false
            });
          }
          if (res.data.email === null || res.data.email === '') {
            this.alertService
              .warningAlert({
                title: 'Error',
                content: 'Please add email address to selected Payee',
                doneMsg: 'Add Now',
                isCancel: true
              })
              .afterClosed()
              .subscribe((response) => {
                if (response) {
                  this.addEmailToPayee(this.payeeDetails);
                }
              });
            return;
          }
          this.requestForm.controls.payeeEmail.setValue(res.data.email);
        }
      })
    );
  }

  onRemoveBank(event?: boolean) {
    this.requestForm.controls.senderBankAccount.setValue('');
    if (!event) {
      this.requestForm.controls.senderBankAccount.markAsTouched();
    }
    this.qrCodeEvent.emit(false);
  }

  onRemovePayee() {
    this.requestForm.controls.payeeEmail.setValue('');
    this.requestForm.controls.payeeEmail.markAsTouched();
    this.requestForm.controls.payerId.setValue('');
    this.requestForm.controls.payerId.markAsTouched();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
  }

  /**
   * Opens the "AddEmailPayeeModalComponent" dialog for adding an email to a payee.
   *
   * @param viewPayeeData -The data of the selected payee.
   */
  addEmailToPayee(viewPayeeData: IViewPayee | undefined) {
    const dialogRef = this.matDialog.open(AddEmailPayeeModalComponent, {
      disableClose: true,
      data: viewPayeeData,
      width: '550px'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getPayeeDetails(this.selectedPayee.id);
      }
    });
  }

  /** For Generating QR code if there is none when selecting a bank
   * - opens when selecting a bank , submitting a form and adding a bank account
   */
  getQRCode(id: string) {
    const alertData = {
      title: 'Link not found !',
      content: 'Please add a payment link to the bank account',
      doneMsg: 'Generate a link',
      cancelMsg: 'No, cancel'
    };
    this.isQRCodeLoad = true;
    this.subscriptions.push(
      this.bankService
        .qetQrCode(id)
        .pipe(
          finalize(() => {
            this.isQRCodeLoad = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              const qrCodeDetails: IBankQrCode = res.data[0];
              this.generateQRCode(qrCodeDetails.payment_url, qrCodeDetails.id);
              this.paymentLink = qrCodeDetails.payment_url;
              this.requestForm.controls.link.setValue(qrCodeDetails.id);
              this.selectedBankName = qrCodeDetails.bank_account_name;
            }
          },
          (err) => {
            this.loading = false;
            this.qrCodeEvent.emit();
            this.paymentsService.isPaymentProcessingSubject.next(false);
            if (err.error.errorCode === 110) {
              this.requestForm.controls.link.setValue('');
              const response = this.alertService.confirmAlert(alertData);
              response.afterClosed().subscribe({
                next: (result) => {
                  if (result) {
                    const dialogRef = this.matDialog.open(
                      GetPaidByLinkComponent,
                      {
                        data: { selectedBankId: this.selectedId }
                      }
                    );
                    dialogRef.afterClosed().subscribe({
                      next: (res) => {
                        if (res) {
                          this.getQRCode(this.selectedId);
                        }
                      }
                    });
                  }
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
    this.qrCodeLink = `https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr?cht=qr&chl=${url}&chs=300x300`;
    this.qrCodeEvent.emit({
      qrCode: this.qrCodeLink,
      bank: this.selectedBank?.nickName,
      paymentId: id
    });
  }

  /**
   * @description Completes the transaction by requesting the payment.
   */
  completeRequest() {
    if (this.payeeDetails && !this.payeeDetails?.email) {
      this.alertService
        .warningAlert({
          content: 'Please add email address to selected Payee',
          doneMsg: 'Add Now',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.addEmailToPayee(this.payeeDetails);
          }
        });
      return;
    }

    if (!this.isUserVerified) {
      this.router.navigate(['/manage/users/verify-email-phone'], {
        queryParams: {
          returnUrl: 'manage/payments/main/receive/payer/bank'
        }
      });
      return;
    }

    if (this.requestForm.invalid || this.isQRCodeLoad) {
      this.requestForm.markAllAsTouched();
      return;
    }

    if (!this.requestForm.controls.recurring.value) {
      this.requestForm.controls.recurring.setValue(0);
    } else {
      this.requestForm.controls.recurring.setValue(1);
    }

    if (!this.requestForm.controls.editable.value) {
      this.requestForm.controls.editable.setValue(0);
    } else {
      this.requestForm.controls.editable.setValue(1);
    }

    if (this.requestForm.controls.link.value === '') {
      this.getQRCode(this.selectedId);
      return;
    }

    this.requestForm.controls.directLink.setValue(this.paymentLink);
    const requestFormBody = {
      ...this.requestForm.value,
      invoice_number: this.requestForm.value.invoiceNumber
    };
    const successData = {
      title: 'Payment Requested',
      paymentReceived: this.requestForm.controls.amount.value,
      content:
        'You have requested the payment , please check the status in your records',
      type: 'receive'
    };
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.bankService
        .requestPayment(requestFormBody as INewReceivePayment)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          })
        )
        .subscribe(() => {
          this.success.emit(successData);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscriptions) => {
      subscriptions.unsubscribe();
    });
  }
}

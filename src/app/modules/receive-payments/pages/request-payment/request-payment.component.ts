import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { DatePipe, NgIf, NgClass } from '@angular/common';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { AddEmailPayeeModalComponent } from 'src/app/shared/modal/process-modal/add-email-payee-modal/add-email-payee-modal.component';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { INewReceivePayment } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { Utils } from 'src/app/data/utils';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { ScriptService } from 'src/app/core/services/script.service';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { IBankQrCode } from 'src/app/models/bank';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgxMaskDirective } from 'ngx-mask';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { AddPayeeModalComponent } from '../../../../shared/modal/payee-modal/add-payee-modal/add-payee-modal.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { DemoVideoComponent } from '../../../../shared/components/demo-video/demo-video.component';
import { DropDownPayeeComponent } from '../../../../shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { PaymentPreviewModalComponent } from '../../modals/payment-preview-modal/payment-preview-modal.component';

/**
 * @description Component for requesting payments.
 */
@Component({
  selector: 'app-request-payment',
  templateUrl: './request-payment.component.html',
  styleUrls: ['./request-payment.component.scss'],
  standalone: true,
  imports: [
    DemoVideoComponent,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    NgIf,
    DropDownPayeeComponent,
    ControlMessageComponent,
    NgxMaskDirective,
    DropDownBankComponent,
    MatCheckbox,
    MatTooltip,
    NgClass
  ]
})
export class RequestPaymentComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private fb = inject(UntypedFormBuilder);
  private payeeService = inject(PayeeService);
  private bankService = inject(BankService);
  private alertService = inject(AlertService);
  private requestPayment = inject(RequestPaymentsService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private sharedService = inject(SharedService);
  private paymentLinkService = inject(PaymentLinkService);
  private scriptService = inject(ScriptService);
  private bankModalService = inject(BankModalService);

  reqPaymentf!: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  selectedPayee: IViewPayee | any;
  selectedId!: any;
  /**
   * @description used for storing generated QR code link
   */
  qrCodeLink!: string;
  isScan = false;
  selectedBankId = '';
  selectedDate!: any;
  paymentLink!: string;
  getPaymentId!: string;
  selectedBankName: string;
  savedData: any;
  minDate: any;
  maxDate: Date;
  loading = false;
  createdAttachments: any[] = [];
  isNumberMasked = false;
  paymentAmount: number;

  utils = Utils;

  ngOnInit(): void {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const ddd = String(futureDate.getDate()).padStart(2, '0');
    const mmm = String(futureDate.getMonth()).padStart(2, '0'); //January is 0!
    const yyyyy = futureDate.getFullYear();

    this.minDate = this.datePipe.transform(
      new Date(yyyyy, Number(mmm), Number(ddd)),
      'yyyy-MM-dd'
    );

    this.initFormGroup();

    const data: any = this.requestPayment.getRequestPaymentDatA();
    this.savedData = JSON.parse(data);

    if (this.savedData?.formValue) {
      this.reqPaymentf.patchValue(this.savedData?.formValue);

      if (this.savedData.payerId) {
        this.sharedService.setNewPayeeCreatedData(
          this.savedData.payerId ? { payeeId: this.savedData.payerId } : ''
        );
        this.selectPayeeData(this.savedData.payerId);
      }
      if (this.savedData.bankAccountId) {
        this.sharedService.setNewBankCreatedData({
          bankAccountId: this.savedData.bankAccountId
        });

        this.getQRcode(this.savedData.bankAccountId);
      }
    }
    this.requestPayment.setRequestPaymentDatA('');

    // this.maxDate = new Date(2030, 0, 1);
  }

  /**
   * @description  Initialize the form group for requesting payments.
   */
  initFormGroup() {
    this.reqPaymentf = this.fb.group({
      requestPaymentType: ['payee', Validators.required],
      senderBankAccount: ['', Validators.required],
      requestEmail: [''],
      requestPhone: [''],
      amount: ['', Validators.required],
      memo: ['', [Validators.required, Validators.maxLength(150)]],
      editable: '',
      recurring: [''],
      startDate: [''],
      endSelect: '1',
      months: new UntypedFormControl({ value: '', disabled: true }),
      paymentMethod: 2,
      payerId: ['', Validators.required],
      payerEmail: [''],
      link: [''],
      directLink: [''],
      attachmentIds: this.fb.array([])
    });
    this.reqPaymentf.controls.startDate.patchValue(this.minDate);
  }

  /**
   * @description Opens a dialog to add a new payee and handles the dialog result.
   */
  addNewPayee(): void {
    const dialogRef = this.dialog.open(AddPayeeModalComponent, {
      width: '750px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.sharedService.setNewPayeeCreatedData({ payeeId: result.id });
        this.reqPaymentf.controls.payerId.setValue(result.id);
        this.selectPayeeData(result.id);
      }
    });
  }

  /**
   * @description Opens a dialog to edit payee and handles the dialog result.
   */
  editPayee() {
    const dialogRef = this.dialog.open(AddPayeeModalComponent, {
      width: '750px',
      disableClose: true,
      data: { edit: true, id: this.selectedPayee.id }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.sharedService.setNewPayeeCreatedData({ payeeId: result.id });
        this.reqPaymentf.controls.payerId.setValue(result.id);
        this.selectPayeeData(result.id);
      }
    });
  }

  /**
   * @description Opens a dialog to add a bank and handles the dialog result.
   */
  addNewBankAccount() {
    if(this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBank().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((result) => {
              if (result?.success) {
                this.sharedService.setNewBankCreatedData({
                  bankAccountId: result.id
                });
                this.selectedBankId = result.id;
                this.reqPaymentf.controls.senderBankAccount.setValue(
                  result.id
                );
                this.getQRcode(result.id);
              }
            })
          );
        }
      })
    );
  }

  getDate(env: any) {
    this.selectedDate = this.datePipe.transform(env.target.value, 'yyyy-MM-dd');
  }

  myDateFilter() {
    const day = new Date().getDay();
    return day;
  }

  openSuccessAlert() {
    const data = {
      title: 'Success',
      content: 'Successfully Created',
      close: true,
      timeout: 1500
    };
    this.alertService.successAlert(data);
  }

  /**
   * @description Handles the change event of the radio button and updates the form controls accordingly.
   * @param value - The value of the selected radio button.
   */
  changeRadio(value: string) {
    this.reqPaymentf.markAsTouched();
    if (value === 'payee') {
      this.reqPaymentf.controls.payerId.addValidators(Validators.required);
      this.reqPaymentf.controls.payerId.updateValueAndValidity();
      this.reqPaymentf.controls.payerId.markAsUntouched();

      this.reqPaymentf.controls.requestEmail.clearValidators();
      this.reqPaymentf.controls.requestEmail.setValue('');
      this.reqPaymentf.controls.requestEmail.updateValueAndValidity();

      this.reqPaymentf.controls.requestPhone.clearValidators();
      this.reqPaymentf.controls.requestPhone.setValue('');
      this.reqPaymentf.controls.requestPhone.updateValueAndValidity();
    } else if (value === 'email') {
      this.reqPaymentf.controls.requestEmail.addValidators([
        Validators.required,
        ValidationService.emailValidator
      ]);
      this.reqPaymentf.controls.requestEmail.markAsUntouched();
      this.selectedPayee = undefined;
      this.reqPaymentf.controls.payerId.clearValidators();
      this.reqPaymentf.controls.payerId.setValue('');
      this.reqPaymentf.controls.payerId.updateValueAndValidity();

      this.reqPaymentf.controls.requestPhone.clearValidators();
      this.reqPaymentf.controls.requestPhone.setValue('');
      this.reqPaymentf.controls.requestPhone.updateValueAndValidity();
    } else {
      this.reqPaymentf.controls.requestPhone.addValidators([
        Validators.required,
        ValidationService.phoneNumberValidator
      ]);
      this.reqPaymentf.controls.requestPhone.markAsUntouched();
      this.selectedPayee = undefined;

      this.reqPaymentf.controls.payerId.clearValidators();
      this.reqPaymentf.controls.payerId.setValue('');
      this.reqPaymentf.controls.payerId.updateValueAndValidity();

      this.reqPaymentf.controls.requestEmail.clearValidators();
      this.reqPaymentf.controls.requestEmail.setValue('');
      this.reqPaymentf.controls.requestEmail.updateValueAndValidity();
    }
  }

  /**
   * @description Handles the change event when selecting a payee from the dropdown.
   * Updates the form controls with the selected payee data.
   * @param env - The selected payee object or undefined.
   */
  onChange(env: any) {
    if (env != undefined && env?.name !== 'Payee Name') {
      this.selectPayeeData(env.id);
      this.reqPaymentf.controls.payerId.setValue(env.id);
    } else {
      this.selectedPayee = env;
      this.reqPaymentf.controls.payerId.setValue('');
    }
  }

  /**
   * @description Handles the change event when selecting a bank account from the dropdown.
   * Updates the form controls with the selected bank account data.
   * @param event - The selected bank account object or undefined.
   */
  onChangeBank(event: any) {
    if (event != undefined) {
      this.getQRcode(event.id);
      this.selectedBankId = event.id;
      this.reqPaymentf.controls.senderBankAccount.setValue(event.id);
    } else {
      this.isScan = false;
      this.reqPaymentf.controls.senderBankAccount.setValue('');
    }
  }

  /**
   *
   * @description Retrieves the payee data for the given payee ID and updates the form controls accordingly.
   * @param id - The ID of the payee.
   */
  selectPayeeData(id: string) {
    this.reqPaymentf.controls.payerEmail.setValue('');
    this.subscriptions.push(
      this.payeeService.showPayee(id).subscribe((res) => {
        this.selectedPayee = res.data;

        if (
          this.selectedPayee.email == null ||
          this.selectedPayee.email == undefined ||
          this.selectedPayee.email === ''
        ) {
          this.failWaring();
        } else {
          this.reqPaymentf.controls.payerEmail.setValue(
            this.selectedPayee.email
          );
        }
      })
    );
  }

  /**
   * @description  Retrieves the QR code for the specified bank account ID and updates the form controls and payment link.
   * @param id - The ID of the bank account.
   */
  getQRcode(id: string) {
    this.isScan = false;
    const alert = {
      title: 'Link not found !',
      content: 'Please add a payment link to the bank account',
      doneMsg: 'Generate a link',
      cancelMsg: 'No, cancel'
    };
    this.subscriptions.push(
      this.bankService
        .qetQrCode(id)
        // .pipe(
        //   catchError((_err) => {
        //     return of(false);
        //   })
        // )
        .subscribe(
          (res) => {
            if (res.success) {
              const qrCodeDetails: IBankQrCode = res.data[0];
              this.generateQRcode(qrCodeDetails.payment_url);
              this.paymentLink = qrCodeDetails.payment_url;
              this.reqPaymentf.controls.link.setValue(qrCodeDetails.id);
              this.getPaymentId = qrCodeDetails.id;
              this.selectedBankName = qrCodeDetails.bank_account_name;
            }
          },
          (err: any) => {
            if (err.error.errorCode == 110) {
              this.reqPaymentf.controls.link.setValue('');
              const response = this.alertService.confirmAlert(alert);
              response.afterClosed().subscribe((result) => {
                if (result) {
                  this.requestPayment.setRequestPaymentDatA(
                    JSON.stringify({
                      formValue: this.reqPaymentf.value,
                      payerId: this.selectedPayee?.id,
                      bankAccountId: this.selectedBankId
                    })
                  );
                  this.router.navigate([
                    'manage/payment-links/create',
                    this.selectedBankId
                  ]);
                } else {
                  this.selectedId = 'Select Bank Account';
                }
              });
            }
          }
        )
    );
  }

  /**
   * @description Generates a QR code image using the specified URL and updates the QR code display.
   * @param url  - The URL to be encoded into the QR code.
   */
  generateQRcode(url: string) {
    this.isScan = true;
    // document.getElementById("lineId")?.classList.remove("line");
    // document.getElementById("lineId")?.classList.add("line");
    this.qrCodeLink =
      'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' +
      url +
      '&choe=UTF-8';
  }

  alert(msg: string) {
    const data = {
      title: 'Error',
      content: msg
    };
    this.alertService.warningAlert(data);
  }

  /**
   * @description  Retrieves the print payment link and opens it in a hidden iframe for printing.
   */
  clickToPrint() {
    this.subscriptions.push(
      this.paymentLinkService
        .getPrintPaymentLink(this.getPaymentId)
        .subscribe((res: any) => {
          if (res.success) {
            const iframes = document.querySelectorAll('iframe');
            for (const item of iframes) {
              if (item.id?.includes('print-iframe')) {
                item?.parentNode?.removeChild(item);
              }
            }
            const iframe = document.createElement('iframe');
            iframe.id = 'reqpay-print-iframe';
            iframe.srcdoc = res.data.printData;
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
          }
        })
    );
  }

  openAttachment() {
    const data: any = {
      id: 0,
      type: 'request-payments',
      existingData: this.createdAttachments
    };

    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1350px',
      data
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.createdAttachments = [];
      if (result.listData) {
        result.listData.forEach((e: any) => {
          this.createdAttachments.push(e);
        });
      }
    });
  }

  clearInput(value: any) {
    if (value === '1') {
      this.reqPaymentf.controls.months.patchValue('');
      this.reqPaymentf.controls.months.disable();
    } else if (value === '2') {
      this.reqPaymentf.controls.months.enable();
      this.reqPaymentf.controls.months.patchValue(1);
    }
  }

  /**
   * @description Creates the body object for the receive payment request.
   * @returns -The body object for the receive payment request.
   */
  createReceivePaymentBody(): INewReceivePayment {
    const data = this.reqPaymentf.value;
    return {
      amount: data.amount,
      directLink: data.directLink,
      editable: data.editable,
      endSelect: data.endSelect,
      link: data.link,
      memo: data.memo,
      payerEmail: data.payerEmail,
      payerId: data.payerId,
      paymentMethod: data.paymentMethod,
      recurring: data.recurring,
      requestEmail: data.requestEmail,
      requestPaymentType: data.requestPaymentType,
      requestPhone: data.requestPhone,
      senderBankAccount: data.senderBankAccount,
      startDate: data.startDate,
      months: data.months
    };
  }

  /**
   * @description Submits the payment request.
   */
  submit() {
    this.paymentAmount = this.reqPaymentf.value.amount;
    this.reqPaymentf.markAllAsTouched();
    if (this.reqPaymentf.invalid) {
      return;
    }

    if (
      this.reqPaymentf.value.payerEmail === '' &&
      this.reqPaymentf.controls.payerId.value !== ''
    ) {
      this.failWaring();
      return;
    }

    if (this.reqPaymentf.controls.link.value === '') {
      this.getQRcode(this.selectedBankId);
      return;
    }

    if (!this.reqPaymentf.controls.recurring.value) {
      this.reqPaymentf.controls.recurring.setValue(0);
    } else {
      this.reqPaymentf.controls.recurring.setValue(1);
      if (this.reqPaymentf.controls.startDate.value < this.minDate) {
        return;
      }
    }

    if (!this.reqPaymentf.controls.editable.value) {
      this.reqPaymentf.controls.editable.setValue(0);
    } else {
      this.reqPaymentf.controls.editable.setValue(1);
    }

    this.reqPaymentf.controls.directLink.setValue(this.paymentLink);

    if (
      this.reqPaymentf.controls.requestPhone.value != '' &&
      !this.isNumberMasked
    ) {
      this.reqPaymentf.controls.requestPhone.setValue(
        this.phoneNumberMask(this.reqPaymentf.controls.requestPhone.value)
      );
    }

    if (this.createdAttachments) {
      this.createdAttachments.forEach((el: any) => {
        this.reqPaymentf.value.attachmentIds.push(el.encrypted_id);
      });
    }

    const msg = {
      title: 'Success',
      content: 'Payment Requested',
      close: true
    };
    this.loading = true;
    this.subscriptions.push(
      this.bankService
        .requestPayment(this.createReceivePaymentBody())
        .pipe(
          catchError((err) => {
            if (err.error.errorCode === 106) {
              const dref = this.openWarningAlert(err.error.errorMsg);
              dref.afterClosed().subscribe((res) => {
                if (res) {
                  this.router.navigate(['manage/users/verify-email-phone'], {
                    queryParams: {
                      returnUrl: 'manage/receivedchecks/requestcheck'
                    }
                  });
                }
              });
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          this.loading = false;
          if (res.success) {
            this.scriptService.gtagEventScript('payment-request', {
              amount: this.paymentAmount
            });
            this.alertService.successAlert(msg);
            setTimeout(() => {
              this.router.navigateByUrl('manage/receivedchecks/index');
            }, 1000);
          }
        })
    );
  }

  /**
   * @description Previews the payment request.
   */
  preview() {
    this.reqPaymentf.markAllAsTouched();
    if (this.reqPaymentf.invalid) {
      return;
    }

    if (
      this.reqPaymentf.value.payerEmail === '' &&
      this.reqPaymentf.controls.payerId.value !== ''
    ) {
      this.failWaring();
      return;
    }

    if (!this.reqPaymentf.controls.recurring.value) {
      this.reqPaymentf.controls.recurring.setValue(0);
    } else {
      this.reqPaymentf.controls.recurring.setValue(1);
      if (this.reqPaymentf.controls.startDate.value < this.minDate) {
        return;
      }
    }

    if (!this.reqPaymentf.controls.editable.value) {
      this.reqPaymentf.controls.editable.setValue(0);
    } else {
      this.reqPaymentf.controls.editable.setValue(1);
    }

    if (
      this.reqPaymentf.controls.requestPhone.value != '' &&
      !this.isNumberMasked
    ) {
      this.reqPaymentf.controls.requestPhone.setValue(
        this.phoneNumberMask(this.reqPaymentf.controls.requestPhone.value)
      );
    }
    this.loading = true;
    this.subscriptions.push(
      this.bankService
        .requestPaymentPreview(this.createReceivePaymentBody())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.dialog.open(PaymentPreviewModalComponent, {
              maxWidth: '650px',
              width: '93%',
              autoFocus: false,
              data: {
                data: res.data
              }
            });
          }
        })
    );
  }

  /**
   * @description Applies a phone number mask to the given phone number.
   * @param phone - The phone number to apply the mask to.
   * @returns - The phone number with the mask applied.
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

  AddEmailToPayee(data: any) {
    const dialogRef = this.dialog.open(AddEmailPayeeModalComponent, {
      disableClose: true,
      data: data,
      width: '550px'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.selectPayeeData(this.selectedPayee.id);
      }
    });
  }

  failWaring() {
    const data = {
      title: 'Error',
      content: 'Please add email address to selected client',
      doneMsg: 'OK'
    };

    const response = this.alertService.warningAlert(data);
    response.afterClosed().subscribe((res) => {
      if (res) {
        this.AddEmailToPayee(this.selectedPayee);
      }
    });
  }

  /**
   * @description Validates whether the input event allows only amount-related characters.
   * @param event -The input event.
   * @returns -True if the event allows amount-related characters, false otherwise.
   */
  amountOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      // for '.'
      return true;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  amountOnlyWithoutSign(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) {
      // for '.'
      return false;
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  getAddress(state: any, city: any, zip: any) {
    return (
      (state != null ? state : '') +
      ' ' +
      (city != null ? city : '') +
      ' ' +
      (zip != null ? zip : '')
    );
  }

  openWarningAlert(content: string) {
    const data = {
      title: 'Error',
      content: content,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    };
    return this.alertService.warningAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}

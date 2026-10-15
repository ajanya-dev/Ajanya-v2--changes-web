import { HttpHeaders } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IAccountDetails } from 'src/app/data/data/cloud-bank';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { NgxMaskDirective } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { NgIf, NgStyle, NgFor, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-pay-with-zil',
  templateUrl: './pay-with-zil.component.html',
  styleUrls: ['./pay-with-zil.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    PhoneInputComponent,
    ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule,
    NgStyle,
    NgSelectModule,
    NgFor,
    NgxMaskDirective,
    CurrencyPipe
  ]
})
export class PayWithZilComponent implements OnInit, OnDestroy {
  loading = false;
  phone = new UntypedFormControl('', [Validators.required]);
  otp = new UntypedFormControl('');
  subscription: Subscription[] = [];
  uuId: string;
  isOtpGenerated = false;
  isAccounts = false;
  sendForm: UntypedFormGroup;
  accounts: { accountNumber: string; id: string; name: string }[] = [];
  token: string;
  utils = Utils;
  isPaymentInfo = false;
  isPaymentCompleted = false;
  accountDetails: IAccountDetails;
  amount: number;
  showTimer = false;
  btnDisable = false;
  display: string;
  error: {
    message: string;
    code: number;
  };
  isShowErrorMessage = false;
  isOtpSend = false;
  phoneNumber: string;
  paymentDetails: { amount: string; id: string; transferredAt: string };

  constructor(
    private _cloudService: CloudBankService,
    private _route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.uuId = this._route?.snapshot?.params?.uuId;
    this.getAccountDetails();
    this.initForm();
  }

  initForm(): void {
    this.sendForm = this.fb.group({
      accountId: ['', Validators.required],
      amount: ['', Validators.required],
      memo: ['', Validators.required]
    });
  }

  getAccountDetails(): void {
    this.subscription.push(
      this._cloudService
        .getAccountDetailsOutside(this.uuId)
        .subscribe((res) => {
          this.accountDetails = res?.data;
        })
    );
  }

  submit(): void {
    if (this.phone.invalid) {
      this.phone.markAllAsTouched();
      return;
    }

    if (!this.isOtpGenerated) {
      this.verifyLink();
    } else {
      this.verifyOtp();
    }
  }

  phoneNumChange(event: {
    dialCode: string;
    fullPhoneNo: string;
    phone: string;
  }): void {
    this.phone.setValue(event?.fullPhoneNo);
    setTimeout(() => {
      this.markAsUntouched();
    }, 2000);
    if (this.phoneNumber !== undefined) {
      if (this.phoneNumber !== event?.fullPhoneNo) {
        this.isOtpGenerated = false;
      }
    }
  }

  verifyLink(requestType?: 'resend'): void {
    const paylodBody = {
      phone: this.phone?.value
    };
    this.phoneNumber = this.phone?.value;
    if (requestType) {
      this.isOtpSend = true;
    } else {
      this.loading = true;
    }
    this.subscription.push(
      this._cloudService
        .verifyLink(this.uuId, paylodBody)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.isOtpSend = false;
          })
        )
        .subscribe(
          (res) => {
            if (res?.success) {
              this.otp.setValue('');
              this.otp.setValidators(Validators.required);
              this.otp.updateValueAndValidity();
              this.isOtpGenerated = true;
              this.showTimer = false;
            } else {
              this.isOtpGenerated = false;
              this.showTimer = false;
              this.otp.clearValidators();
              this.otp.updateValueAndValidity();
            }
          },
          (err) => {
            if (err?.error?.errorCode !== 147) {
              this.errorMessages(err?.error?.errorCode, err?.error?.errorMsg);
              this.showTimer = false;
            } else if (err?.error?.errorCode === 147) {
              this.intervell(30 - err?.error?.errorMsg?.Time);
            }
          }
        )
    );
  }

  markAsUntouched(): void {
    this.otp.markAsUntouched();
  }

  errorMessages(errCode: number, errMsg: string): void {
    this.error = { code: errCode, message: errMsg };
    this.showErrorMessage().then((isError) => {
      this.isShowErrorMessage = isError;
    });
  }

  verifyOtp(): void {
    setTimeout(() => {
      this.markAsUntouched();
    }, 2000);
    if (this.phone.invalid) {
      this.phone.markAllAsTouched();
      return;
    }
    if (this.otp.invalid) {
      this.otp.markAllAsTouched();
      return;
    }
    this.loading = true;
    const payloadBody = {
      phone: this.phone?.value,
      otp: this.otp?.value
    };
    this.subscription.push(
      this._cloudService
        ?.verifyOtp(payloadBody)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(
          (res) => {
            this.isAccounts = true;
            this.isPaymentInfo = true;
            this.token = res?.data?.token;
            this.getAllAcconts(res?.data?.token);
          },
          (err) => {
            if (err?.error?.errorCode) {
              this.errorMessages(err?.error?.errorCode, err?.error?.errorMsg);
            }
            if (err?.error?.errorCode === 147) {
              this.intervell(30 - err?.error?.errorCode?.errorMsg?.Time);
            }
          }
        )
    );
  }

  getAllAcconts(token: string): void {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'pay-with-zil-token': token
      })
    };
    this.subscription.push(
      this._cloudService
        .payWithZilAccounts(httpOptions)
        .subscribe((res: any) => {
          this.accounts = res?.data?.accounts;
        })
    );
  }

  onSubmit(): void {
    if (this.sendForm.invalid) {
      this.sendForm.markAllAsTouched();
      return;
    }
    this.amount = this.sendForm?.controls?.amount?.value;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'pay-with-zil-token': this.token
      })
    };
    this.loading = true;
    const formValues = this.sendForm?.value;
    const payloadBody = {
      accountId: formValues?.accountId,
      amount: formValues?.amount,
      memo: formValues?.memo
    };
    this.subscription.push(
      this._cloudService
        ?.sendPaymentPayWithZil(this.uuId, payloadBody, httpOptions)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res: any) => {
          if (res?.success) {
            this.paymentDetails = res?.data;
            this.isPaymentCompleted = true;
            this.sendForm.reset();
            return;
            this._alertService.successAlert({
              content: 'Payment sent successfully!'
            });
          }
        })
    );
  }

  back(): void {
    this.isOtpGenerated = false;
  }

  // timer section
  intervell(sec: number) {
    this.showTimer = true;
    this.btnDisable = true;

    let value: number[] = [];
    const timer = setInterval(() => {
      value = this.countDown(sec);
      sec--;
      this.display = `${Math.floor(value[2]) < 10 ? '0' : ''}${
        isNaN(Math.floor(value[2])) ? '00' : Math.floor(value[2])
      }:${Math.floor(value[1]) < 10 ? '0' : ''}${
        isNaN(Math.floor(value[1])) ? '00' : Math.floor(value[1])
      }:${Math.floor(value[0]) < 10 ? '0' : ''}${isNaN(Math.floor(value[0])) ? '00' : Math.floor(value[0])}`;
      if (sec < 0) {
        clearInterval(timer);
        this.showTimer = false;
        this.btnDisable = false;
      }
    }, 1000);
  }

  countDown(val: number) {
    const arr: number[] = [];
    let second = val;
    while (second > 59) {
      arr.push(second % 60);
      second = second / 60;
    }
    arr.push(second);
    return arr;
  }

  showErrorMessage(): Promise<boolean> {
    this.isShowErrorMessage = true;
    return new Promise((resolve) => {
      let isError = true;
      setTimeout(() => {
        isError = false;
        resolve(isError);
      }, 3000);
    });
  }

  resndOtp(requestType: 'resend'): void {
    this.verifyLink(requestType);
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el?.unsubscribe());
  }
}

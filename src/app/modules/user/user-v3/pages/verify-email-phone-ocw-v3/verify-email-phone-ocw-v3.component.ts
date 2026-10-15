import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import data from 'src/app/data/data/country-list-json/country-list-code.json';
import { CommonModule, Location, NgIf } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { ICountryModel, IOtpResponse } from 'src/app/models/common';
import { IUserVerification } from 'src/app/models/user';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { IAppState } from 'src/app/store/app-state.model';
import { Store } from '@ngrx/store';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NewPhoneInputComponent } from '../../../../../shared/components/new-phone-input/new-phone-input.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { StepperV35Component } from '../../../../../shared/v3/common-components/stepper-v35/stepper-v35.component';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faMobile } from '@fortawesome/pro-thin-svg-icons';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-verify-email-phone-ocw-v3',
  templateUrl: './verify-email-phone-ocw-v3.component.html',
  styleUrls: ['./verify-email-phone-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    CommonBackButtonV35Component,
    StepperV35Component,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NewPhoneInputComponent,
    CommonButtonV35Component,
    FontAwesomeModule,
    CommonModule
  ]
})
export class VerifyEmailPhoneOcwV3Component implements OnInit, OnDestroy {
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  subscriptions: Subscription[] = [];
  verifyMobileMail = true;
  emailOTPSent = false;
  phoneOTPSent = false;
  emailOTPAlreadySent = false;
  phoneOTPAlreadySent = false;
  currenCountryPhoneLength = {} as { min: number; max: number };

  userForm = new FormGroup({
    emailAddress: new FormControl<string>('', [
      ValidationService.emailValidator
    ]),
    phoneNumber: new FormControl<string>('', [
      Validators.required,
      ValidationService.customMinLength(
        this.currenCountryPhoneLength?.min ?? 10
      )
    ])
  });

  requestOtp: FormGroup;
  message: string;
  displayEmailTimer: string;
  displayPhoneTimer: string;
  emailVerified: boolean | null = null;
  phoneVerified: boolean | null = null;
  showTimer = false;
  resendLoader = false;
  countryList: Array<ICountryModel> = data as Array<ICountryModel>;
  loading = true;
  initialIndex = 0;
  directPlancode: string;
  returnUrl: string;
  phoneNumber: string;
  sourceType: CVSourceType;
  bankAccountId: string;
  btnDisable = false;
  btnDisable1 = false;
  btnDisable2 = false;
  requiredMessage = '';
  currentTabOfStepper: number;
  currentCountryCode = '';
  isOTPPasted = false;
  isPhillipinesPhone = signal(false);

  faEnvolope = faEnvelope;
  faMobile = faMobile;

  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private userService = inject(UserProfileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private gettingStartedService = inject(GettingStartedService);
  private localStorageService = inject(LocalStorageService);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private store = inject(Store<IAppState>);
  ngOnInit(): void {
    this.sourceType = this.route.snapshot.queryParams?.type;
    this.bankAccountId = this.route.snapshot.queryParams?.bankAccountId;

    this.initVerify();
    this.verifyOtp();
    this.setUserData();

    this.directPlancode = this.route.snapshot.queryParams?.plancode;
    this.returnUrl = this.route.snapshot.queryParams?.returnUrl;
    this.currentTabOfStepper = 0;
    this.subscriptions.push(
      this.store.select(selectUserVerification).subscribe((res) => {
        this.currentTabOfStepper = res?.email_verified ?? 0;
        this.emailOTPSent = res?.emailOTPSent === 1;
        this.phoneOTPSent = res?.phoneOTPSent === 1;
        if (this.emailOTPSent) {
          this.requestOtpEmail();
        }
        if (this.phoneOTPSent) {
          this.requestOTPPhoneNumber();
        }
      })
    );

    if (environment.env_id === 'compass-sandbox') {
      this.phoneVerified = true;
      this.localStorageService.setItem('phoneVerified', '1');
    }
  }

  initVerify() {
    const payee = this.payeeOnboardingService.userDetailsSignal();
    const payeeOnboarding = this.payeeOnboardingService.payeeOnboardingSignal();
    if (payee?.phone && payeeOnboarding.initiatorId) {
      this.userForm.controls.emailAddress.setValue(payee.phone);
    }
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currentCountryCode = event.code;
    this.currenCountryPhoneLength = event.length;
    this.userForm.controls.phoneNumber.setValidators([
      Validators.required,
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.userForm.controls.phoneNumber.updateValueAndValidity();
  }

  countryCodeChange(event: { code: string; updateLocalStorage: boolean }) {
    this.currentCountryCode = event.code;
  }

  verifyOtp() {
    this.requestOtp = this.fb.group({
      otp: ['', [Validators.required]]
    });
  }

  requestOtpEmail() {
    const userFormData = this.userForm.value;
    this.subscriptions.push(
      this.userService
        .requestVerifyEmailOTP(userFormData.emailAddress as string)
        .pipe(
          finalize(() => {
            this.resendLoader = false;
          }),
          catchError((err) => {
            if (err.error.success === false && err.error.errorCode) {
              this.btnDisable = true;
              this.btnDisable1 = true;
              this.showTimer = true;
              this.emailOTPAlreadySent = true;
              this.interval(err.error.errorMsg);
            }
            return of(false);
          })
        )
        .subscribe((res: IOtpResponse) => {
          if (res.success) {
            this.emailOTPAlreadySent = false;
            this.emailOTPSent = true;
            this.localStorageService.setItem('emailOTPSent', 1);
            this.verifyMobileMail = false;
            this.message = res.message;
            this.alertService.successAlert({
              title: 'Success',
              content: 'OTP Sent Successfully',
              close: true
            });
          }
          if (res.timer?.diff) {
            this.btnDisable = true;
            this.showTimer = true;
            this.interval(res.timer.diff);
          }
          this.btnDisable1 = false;
        })
    );
  }

  requestOTPPhoneNumber() {
    const userData = this.userForm.value;
    this.isPhillipinesPhone.set(userData.phoneNumber?.startsWith('+63') ?? false);
    this.subscriptions.push(
      this.userService
        .requestVerifyPhoneOTP(
          userData.phoneNumber as string,
          this.localStorageService.getItem('selected_dial_code') ??
            (this.currentCountryCode as string)
        )
        .pipe(
          finalize(() => {
            this.resendLoader = false;
          }),
          catchError((err) => {
            if (err.error.success === false && err.error.errorCode) {
              this.btnDisable = true;
              this.btnDisable1 = true;
              this.showTimer = true;
              this.phoneOTPAlreadySent = true;
              this.interval(err.error.errorMsg);
            }
            return of(false);
          })
        )
        .subscribe((res: IOtpResponse) => {
          if (res.success) {
            this.phoneOTPAlreadySent = false;
            this.phoneOTPSent = true;
            this.localStorageService.setItem('emailOTPSent', 0);
            this.localStorageService.setItem('phoneOTPSent', 1);
            this.verifyMobileMail = false;
            this.message = res.message;
            this.alertService.successAlert({
              title: 'Success',
              content: 'OTP Sent Successfully',
              close: true
            });
          }
          if (res.timer?.diff) {
            this.btnDisable = true;
            this.showTimer = true;
            this.interval(res.timer.diff);
          }
          this.btnDisable1 = false;
        })
    );
  }

  countDown(val: number) {
    const arr: Array<number> = [];
    let n = val;
    while (n > 59) {
      arr.push(n % 60);
      n /= 60;
    }

    arr.push(n);
    return arr;
  }

  interval(sec: number) {
    let seconds = sec;
    if (this.emailOTPSent || this.emailOTPAlreadySent) {
      let value: Array<number>;
      const timer = setInterval(() => {
        value = this.countDown(seconds);
        seconds -= 1;
        this.displayEmailTimer = `${Math.floor(value[2]) < 10 ? '0' : ''}${
          Number.isNaN(Math.floor(value[2])) ? '00' : Math.floor(value[2])
        }:${Math.floor(value[1]) < 10 ? '0' : ''}${
          Number.isNaN(Math.floor(value[1])) ? '00' : Math.floor(value[1])
        }:${Math.floor(value[0]) < 10 ? '0' : ''}${Math.floor(value[0])}`;
        if (seconds < 0) {
          clearInterval(timer);
          this.showTimer = false;
          this.btnDisable = false;
        }
      }, 1000);
    }
    if (this.phoneOTPSent || this.phoneOTPAlreadySent) {
      let value: Array<number>;
      const timer = setInterval(() => {
        value = this.countDown(seconds);
        seconds -= 1;
        this.displayPhoneTimer = `${Math.floor(value[2]) < 10 ? '0' : ''}${
          Number.isNaN(Math.floor(value[2])) ? '00' : Math.floor(value[2])
        }:${Math.floor(value[1]) < 10 ? '0' : ''}${
          Number.isNaN(Math.floor(value[1])) ? '00' : Math.floor(value[1])
        }:${Math.floor(value[0]) < 10 ? '0' : ''}${Math.floor(value[0])}`;
        if (seconds < 0) {
          clearInterval(timer);
          this.showTimer = false;
          this.btnDisable = false;
        }
      }, 1000);
    }
  }

  onRequestEmailVerificationOTP() {
    this.userForm.controls.emailAddress.markAsTouched();
    if (this.userForm.controls.emailAddress.invalid) {
      return;
    }
    this.btnDisable1 = true;
    this.requestOtpEmail();
  }

  onRequestPhoneVerificationOTP() {
    this.userForm.controls.phoneNumber.markAsTouched();
    if (this.userForm.controls.phoneNumber.invalid) {
      return;
    }
    this.btnDisable1 = true;
    this.localStorageService.setItem(
      'selected_dial_code',
      this.currentCountryCode
    );
    this.requestOTPPhoneNumber();
  }

  resendOTPPhoneNumber() {
    // The old code is dead the moment a new one is asked for.
    this.clearOtpInputs();
    this.resendLoader = true;
    this.requestOTPPhoneNumber();
  }

  resendOTPEmail() {
    // Same reason as resendOTPPhoneNumber().
    this.clearOtpInputs();
    this.resendLoader = true;
    this.requestOtpEmail();
  }

  setUserData() {
    this.subscriptions.push(
      this.userService.UserVerification$.subscribe(
        (res: IUserVerification) => {
          if (res.email_verified === 0) {
            this.userForm.controls.emailAddress.setValidators([
              Validators.required,
              ValidationService.emailValidator
            ]);
            this.requestOtp.controls.otp.updateValueAndValidity();
            this.emailVerified = false;
          } else if (res.email_verified === 1) {
            this.emailVerified = true;
            this.userForm.controls.emailAddress.clearValidators();
            this.userForm.controls.emailAddress.updateValueAndValidity();
          }

          if (res.phone_verified === 0) {
            this.userForm.controls.phoneNumber.setValidators([
              Validators.required,
              ValidationService.customMinLength(
                this.currenCountryPhoneLength?.min ?? 10
              )
            ]);
            this.userForm.controls.phoneNumber.updateValueAndValidity();
            this.phoneVerified = false;
            if (environment.env_id === 'compass-sandbox') {
              this.phoneVerified = true;
            }
          } else if (res.phone_verified === 1) {
            this.phoneVerified = true;
            this.userForm.controls.phoneNumber.clearValidators();
            this.userForm.controls.phoneNumber.updateValueAndValidity();
          }
          if (this.emailVerified !== null) this.loading = false;

          this.userForm.patchValue({
            emailAddress: res?.email,
            phoneNumber: res?.phone
          });
          this.phoneNumber = res?.phone;
        },
        () => {
          this.loading = false;
        }
      )
    );
  }

  submitEmailOtp() {
    const otpStr = this.otpConcat('input.otp-box');

    this.otpInputCheck();
    if (otpStr.length !== 5) {
      return;
    }
    this.btnDisable2 = true;
    const sendingData = {
      email: this.userForm.controls.emailAddress.value as string,
      otp: otpStr
    };

    this.subscriptions.push(
      this.userService
        .verifyEmailOtp(sendingData)
        .pipe(
          catchError(() => {
            this.btnDisable2 = false;
            return of(false);
          })
        )
        .subscribe((res: IOtpResponse) => {
          if (res.success === true) {
            this.gettingStartedService.getGettingStartedData();
            this.emailVerified = true;
            this.btnDisable2 = false;
            this.showTimer = false;
            this.currentTabOfStepper += 1;
            this.message = res.message;
            this.store.dispatch(
              UserManagementActions.manualUpdateUserVerification({
                verificationState: {
                  email_verified: 1,
                  email: this.userForm.controls.emailAddress.value as string,
                  phone_verified: 0,
                  phone: this.userForm.controls.phoneNumber.value as string,
                  emailOTPSent: 0
                }
              })
            );
            this.localStorageService.setItem('emailVerified', 1);
            this.localStorageService.setItem('emailOTPSent', 0);
            this.alertService.successAlert({
              title: 'Success',
              content: 'Email Verified Successfully',
              close: true
            });
            this.gettingStartedService.updatedGettingStartedData = 0;
            if (this.localStorageService.getItem('phoneVerified') === '1') {
              this.router.navigateByUrl('/manage/verification/index');
            }
            this.displayEmailTimer = '';
          }
        })
    );
  }

  submitMobileOtp() {
    const otpStr = this.otpConcat('input.otp-box');

    this.otpInputCheck();
    if (otpStr.length !== 5) {
      return;
    }
    this.btnDisable2 = true;
    const sendingData = {
      phone: this.userForm.controls.phoneNumber.value as string,
      otp: otpStr
    };

    this.subscriptions.push(
      this.userService
        .verifyPhoneOTP(sendingData)
        .pipe(
          catchError(() => {
            this.btnDisable2 = false;
            return of(false);
          })
        )
        .subscribe((res: IOtpResponse) => {
          if (res.success === true) {
            this.localStorageService.updateNestedData('gettingStartedData', 'verification', 1);
            this.gettingStartedService.getGettingStartedData();
            this.gettingStartedService.updatedGettingStartedData = 1;
            this.btnDisable2 = false;
            this.showTimer = false;
            this.message = res.message;
            this.currentTabOfStepper += 1;
            this.store.dispatch(
              UserManagementActions.manualUpdateUserVerification({
                verificationState: {
                  email_verified: 1,
                  email: this.userForm.controls.emailAddress.value as string,
                  phone_verified: 1,
                  phone: this.userForm.controls.phoneNumber.value as string,
                  phoneOTPSent: 0
                }
              })
            );
            this.localStorageService.setItem('phoneVerified', 1);
            this.localStorageService.setItem('phoneOTPSent', 0);
            if (this.directPlancode) {
              this.router.navigate(['/manage/subscription/plan'], {
                queryParams: { plancode: this.directPlancode }
              });
            } else if (this.returnUrl) {
              this.router.navigate([this.returnUrl], {
                queryParams: {
                  type: this.sourceType,
                  bankAccountId: this.bankAccountId
                }
              });
            } else if (window.history.length > 1) {
              this.location.back();
            } else {
              this.router.navigateByUrl('/manage/verification/index');
            }
            this.displayPhoneTimer = '';
          }
        })
    );
  }

  cursorFocusChange(
    event: KeyboardEvent,
    prev: HTMLInputElement,
    curr: HTMLInputElement,
    next: HTMLInputElement
  ) {
    this.isOTPPasted = false;
    const length = String(curr.value.length);
    const maxlength = curr.getAttribute('maxlength');
    if (length === maxlength && next !== null) {
      next.focus();
    } else if (event.key === 'Backspace' && prev !== null) {
      prev.focus();
      prev.select();
    }
    this.autoVerifyWhenComplete();
  }

  otpInputCheck(inputBoxPosition?: number): void {
    const otpStr = this.otpConcat('input.otp-box');
    if (this.isOTPPasted) {
      this.requiredMessage = '';
      return;
    }
    if (inputBoxPosition) {
      if (inputBoxPosition !== otpStr.length) {
        this.requiredMessage = 'Please enter the OTP';
      } else {
        this.requiredMessage = '';
      }
    } else if (otpStr.length !== 5) {
      this.requiredMessage = 'Please enter the OTP';
    } else {
      this.requiredMessage = '';
    }
  }

  otpConcat(elementSelector: string): string {
    let otpStr = '';
    const inputArr: NodeListOf<HTMLInputElement> =
      document.querySelectorAll(elementSelector);
    inputArr.forEach((e: HTMLInputElement) => {
      otpStr += e.value;
    });
    return otpStr;
  }

  goBack() {
    if (this.returnUrl) {
      this.router.navigate([this.returnUrl]);
    } else {
      this.router.navigateByUrl(`manage/verification/steps`);
    }
  }

  /**
   * @description Function allows user to paste otp on the field. Codes copied
   * from SMS or email often carry spaces, dashes or a newline, so only the
   * digits are kept; verifies once every box is filled.
   * @param event - event occured on the field
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!digits) return;

    const boxes = this.getOtpBoxes();
    const code = digits.slice(0, boxes.length);
    code.split('').forEach((digit, index) => {
      boxes[index].value = digit;
    });
    if (code.length >= boxes.length) {
      this.isOTPPasted = true;
    }
    this.requiredMessage = '';
    boxes[Math.min(code.length, boxes.length) - 1]?.focus();

    this.autoVerifyWhenComplete();
  }

  /** The step and code last sent by auto-verify, so a stray keyup cannot resend it. */
  private lastAutoSubmittedOtp = '';

  /**
   * @description Verifies as soon as every OTP box holds a digit, the same as
   * pressing Verify, for whichever step (email or phone) is on screen. The
   * boxes are read on keyup, which also fires for keys that change nothing,
   * so a code is auto-submitted only once per step.
   */
  private autoVerifyWhenComplete(): void {
    if (this.btnDisable2) return;
    const boxes = this.getOtpBoxes();
    if (!boxes.length || !boxes.every((box) => /^\d$/.test(box.value))) return;

    const isPhoneStep =
      !!this.emailVerified && !this.phoneVerified && this.phoneOTPSent;
    const otp = boxes.map((box) => box.value).join('');
    const attempt = `${isPhoneStep ? 'phone' : 'email'}:${otp}`;
    if (attempt === this.lastAutoSubmittedOtp) return;
    this.lastAutoSubmittedOtp = attempt;

    if (isPhoneStep) {
      this.submitMobileOtp();
    } else {
      this.submitEmailOtp();
    }
  }

  private getOtpBoxes(): HTMLInputElement[] {
    return Array.from(
      document.querySelectorAll<HTMLInputElement>('input.otp-box')
    );
  }

  /**
   * @description Empties the OTP boxes and returns the caret to the first one.
   * Also drops lastAutoSubmittedOtp, so the same digits typed against a new
   * code still trigger the auto-verify.
   * @returns {void}
   */
  private clearOtpInputs(): void {
    const boxes = this.getOtpBoxes();
    for (let i = 0; i < boxes.length; i += 1) {
      boxes[i].value = '';
    }
    this.lastAutoSubmittedOtp = '';
    boxes[0]?.focus();
  }

  ngOnDestroy() {
    this.localStorageService.setItem('phoneOTPSent', 0);
    this.localStorageService.setItem('emailOTPSent', 0);
    this.localStorageService.removeItem('autoClickPlan');
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

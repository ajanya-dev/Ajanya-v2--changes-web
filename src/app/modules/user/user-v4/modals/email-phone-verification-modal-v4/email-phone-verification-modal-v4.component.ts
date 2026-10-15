import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  signal,
  ViewChildren
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import {
  LucideAngularModule,
  Mail,
  Phone,
  X,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-angular';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IUserVerification } from 'src/app/models/user';
import { IOtpResponse } from 'src/app/models/common';
import { IAppState } from 'src/app/store/app-state.model';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';

type SubStep = 'email' | 'phone';
type StepState = 'completed' | 'active' | 'locked';
type VerificationStatus = 'idle' | 'verifying' | 'success';

@Component({
  selector: 'app-email-phone-verification-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    PhoneInputV4Component,
    CommonButtonV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './email-phone-verification-modal-v4.component.html',
  styleUrl: './email-phone-verification-modal-v4.component.scss'
})
export class EmailPhoneVerificationModalV4Component implements OnInit {
  // Lucide icons
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly Lock = Lock;
  readonly Loader2 = Loader2;
  readonly AlertCircle = AlertCircle;
  readonly ChevronUp = ChevronUp;
  readonly ChevronDown = ChevronDown;

  // Services
  private dialogRef = inject(
    MatDialogRef<EmailPhoneVerificationModalV4Component>
  );

  private userService = inject(UserProfileService);
  private alertService = inject(V4AlertService);
  private gettingStartedService = inject(GettingStartedService);
  private localStorageService = inject(LocalStorageService);
  private store = inject(Store<IAppState>);
  private destroyRef = inject(DestroyRef);

  // OTP ViewChildren references
  @ViewChildren('emailOtpInput') emailOtpInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  @ViewChildren('phoneOtpInput') phoneOtpInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  // State signals
  loading = signal(true);
  currentStep = signal<SubStep>('email');
  expandedStep = signal<SubStep | null>(null);
  verificationStatus = signal<VerificationStatus>('idle');

  // Form controls for validation display
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  phoneControl = new FormControl('', [Validators.required]);

  // Email state
  email = signal('');
  emailVerified = signal(false);
  isEditingEmail = signal(false);
  emailCodeSent = signal(false);
  emailCountdown = signal(0);
  isSendingEmail = signal(false);
  emailOtpError = signal<string | null>(null);
  /**
   * Failures of the "send the code" step, shown in this modal instead of a
   * second alert dialog on top of it. Separate from emailOtpError, which only
   * renders once the OTP boxes are on screen.
   */
  emailSendError = signal<string | null>(null);
  emailOtpValues = signal<string[]>(['', '', '', '', '']);
  emailResendMessage = signal<string | null>(null);

  // Phone state
  phoneNumber = signal('');
  savedPhoneNumber = signal('');
  phoneVerified = signal(false);
  isEditingPhone = signal(false);
  phoneCodeSent = signal(false);
  phoneCountdown = signal(0);
  isSendingPhone = signal(false);
  phoneOtpError = signal<string | null>(null);
  /** Phone-side counterpart of emailSendError. */
  phoneSendError = signal<string | null>(null);
  phoneOtpValues = signal<string[]>(['', '', '', '', '']);
  phoneResendMessage = signal<string | null>(null);
  currentCountryCode = signal('+1');
  currenCountryPhoneLength = signal<{ min: number; max: number }>({
    min: 10,
    max: 10
  });

  // Timer intervals
  private emailTimerInterval: ReturnType<typeof setInterval> | null = null;
  private phoneTimerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadVerificationStatus();
  }

  // --- Step state helpers ---
  getEmailState(): StepState {
    if (this.emailVerified()) return 'completed';
    if (this.currentStep() === 'email') return 'active';
    return 'locked';
  }

  getPhoneState(): StepState {
    if (this.phoneVerified()) return 'completed';
    if (this.currentStep() === 'phone') return 'active';
    return 'locked';
  }

  isEmailExpanded(): boolean {
    const state = this.getEmailState();
    if (state === 'locked') return false;
    return this.expandedStep() === null
      ? state === 'active'
      : this.expandedStep() === 'email';
  }

  isPhoneExpanded(): boolean {
    const state = this.getPhoneState();
    if (state === 'locked') return false;
    return this.expandedStep() === null
      ? state === 'active'
      : this.expandedStep() === 'phone';
  }

  toggleStep(step: SubStep): void {
    const state =
      step === 'email' ? this.getEmailState() : this.getPhoneState();
    if (state === 'locked' || state === 'completed') return;

    if (
      (step === 'email' && this.isEmailExpanded()) ||
      (step === 'phone' && this.isPhoneExpanded())
    ) {
      this.expandedStep.set('none' as SubStep);
    } else {
      this.expandedStep.set(step);
    }
  }

  // --- Load initial verification data via direct API call ---
  private loadVerificationStatus(): void {
    this.userService
      .checkEmailAndPhoneVerified()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: IApiRes<IUserVerification> | IApiResMesssage) => {
          const res = response as IApiRes<IUserVerification>;
          if (res?.success && res.data) {
            const data = res.data as IUserVerification;
            this.email.set(data.email || '');
            this.phoneNumber.set(data.phone || '');
            this.savedPhoneNumber.set(data.phone || '');
            this.emailControl.setValue(data.email || '', { emitEvent: false });
            this.phoneControl.setValue(data.phone || '', { emitEvent: false });

            if (data.email_verified === 1) {
              this.emailVerified.set(true);
              if (data.phone_verified === 1) {
                this.phoneVerified.set(true);
              }
              this.currentStep.set('phone');
            } else {
              this.currentStep.set('email');
            }
          }
        }
      });
  }

  // --- Close modal ---
  closeModal(): void {
    if (this.verificationStatus() !== 'idle') return;
    this.clearTimers();
    this.dialogRef.close({
      emailVerified: this.emailVerified(),
      phoneVerified: this.phoneVerified()
    });
  }

  // --- Email handlers ---
  startEditEmail(): void {
    this.isEditingEmail.set(true);
  }

  cancelEditEmail(): void {
    this.isEditingEmail.set(false);
  }

  updateEmail(): void {
    const emailVal = this.email();
    if (!this.isValidEmail(emailVal)) {
      this.emailSendError.set('Please enter a valid email address.');
      return;
    }
    this.isEditingEmail.set(false);
    this.emailCodeSent.set(false);
    this.emailCountdown.set(0);
    this.clearEmailTimer();
  }

  sendEmailCode(): void {
    // A fresh attempt starts without the previous failure on screen.
    this.emailSendError.set(null);
    this.emailControl.markAsTouched();
    if (this.emailControl.invalid) return;

    const emailVal = this.email();
    this.isSendingEmail.set(true);
    this.userService
      .requestVerifyEmailOTP(emailVal)
      .pipe(
        finalize(() => this.isSendingEmail.set(false)),
        catchError((err) => {
          if (err.error?.success === false && err.error?.errorCode) {
            const countdown = typeof err.error.errorMsg === 'number' ? err.error.errorMsg : 60;
            this.emailCodeSent.set(true);
            this.startEmailCountdown(countdown);
            this.emailSendError.set('OTP already sent.');
          } else {
            this.emailSendError.set(
              err.error?.errorMsg ||
                err.error?.message ||
                'Something went wrong. Please try again.'
            );
          }
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IOtpResponse | null) => {
        if (res?.success) {
          this.emailCodeSent.set(true);
          this.localStorageService.setItem('emailOTPSent', 1);
          this.alertService.successAlert({
            title: 'Success',
            content: 'OTP Sent Successfully',
            close: true
          });
          if (res.timer?.diff) {
            this.startEmailCountdown(res.timer.diff);
          }
        } else if (res) {
          this.emailSendError.set(
            res.message || 'Something went wrong. Please try again.'
          );
        }
      });
  }

  resendEmailCode(): void {
    if (this.emailCountdown() > 0) return;
    // The old code is dead the moment a new one is asked for, so it must not
    // stay in the boxes to be submitted against the fresh OTP.
    this.clearOtpInputs('email');
    this.emailResendMessage.set(`A new OTP was sent to ${this.email()}.`);
    this.sendEmailCode();
  }

  verifyEmail(): void {
    this.emailOtpError.set(null);
    const otpStr = this.emailOtpValues().join('');

    if (otpStr.length !== 5) {
      this.emailOtpError.set(
        'Please enter all 5 digits of the verification code'
      );
      return;
    }
    if (!/^\d{5}$/.test(otpStr)) {
      this.emailOtpError.set('Please enter numbers only');
      return;
    }

    this.verificationStatus.set('verifying');
    const sendingData = { email: this.email(), otp: otpStr };

    this.userService
      .verifyEmailOtp(sendingData)
      .pipe(
        catchError(() => {
          this.verificationStatus.set('idle');
          // The digits stay on screen: a rejected code is usually one wrong
          // digit, and clearing would make the user retype the whole thing.
          this.emailOtpError.set('Invalid OTP. Please try again.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IOtpResponse | null) => {
        if (res?.success) {
          this.verificationStatus.set('success');
          this.emailVerified.set(true);
          this.clearEmailTimer();

          this.gettingStartedService.getGettingStartedData();
          this.store.dispatch(
            UserManagementActions.manualUpdateUserVerification({
              verificationState: {
                email_verified: 1,
                email: this.email(),
                phone_verified: 0,
                phone: this.phoneNumber(),
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

          // Auto-advance to phone after success animation
          setTimeout(() => {
            this.verificationStatus.set('idle');
            this.currentStep.set('phone');
            this.expandedStep.set(null);
            this.emailOtpValues.set(['', '', '', '', '']);
            this.emailOtpError.set(null);
            this.emailCodeSent.set(false);
            this.emailResendMessage.set(null);
          }, 1500);
        } else if (res) {
          this.verificationStatus.set('idle');
          this.emailOtpError.set(
            res.message || 'Invalid code. Please try again.'
          );
        }
      });
  }

  // --- Phone handlers ---
  countryChange(event: {
    isOpen: boolean;
    length?: { min?: number; max?: number };
    code?: string;
  }): void {
    if (event.code) {
      this.currentCountryCode.set(event.code);
    }
    if (event.length) {
      this.currenCountryPhoneLength.set({
        min: event.length.min ?? 10,
        max: event.length.max ?? 10
      });
    }
  }

  countryCodeChange(event: {
    code: string;
    updateLocalStorage?: boolean;
  }): void {
    this.currentCountryCode.set(event.code);
  }

  startEditPhone(): void {
    this.isEditingPhone.set(true);
  }

  cancelEditPhone(): void {
    this.isEditingPhone.set(false);
    this.phoneNumber.set(this.savedPhoneNumber());
  }

  updatePhone(): void {
    const phone = this.phoneNumber();
    if (!phone || phone.length < this.currenCountryPhoneLength().min) {
      this.phoneSendError.set('Please enter a valid phone number.');
      return;
    }
    this.isEditingPhone.set(false);
    this.savedPhoneNumber.set(phone);
    this.phoneCodeSent.set(false);
    this.phoneCountdown.set(0);
    this.clearPhoneTimer();
  }

  sendPhoneCode(): void {
    // A fresh attempt starts without the previous failure on screen.
    this.phoneSendError.set(null);
    this.phoneControl.markAsTouched();
    if (!this.isPhoneValid()) {
      this.phoneControl.setErrors({ required: true });
      return;
    }

    const phone = this.phoneNumber();
    this.isSendingPhone.set(true);
    this.localStorageService.setItem(
      'selected_dial_code',
      this.currentCountryCode()
    );

    this.userService
      .requestVerifyPhoneOTP(phone, this.currentCountryCode())
      .pipe(
        finalize(() => this.isSendingPhone.set(false)),
        catchError((err) => {
          if (err.error?.success === false && err.error?.errorCode) {
            const countdown = typeof err.error.errorMsg === 'number' ? err.error.errorMsg : 60;
            this.phoneCodeSent.set(true);
            this.startPhoneCountdown(countdown);
            this.phoneSendError.set('OTP already sent.');
          }
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IOtpResponse | null) => {
        if (res?.success) {
          this.phoneCodeSent.set(true);
          this.localStorageService.setItem('phoneOTPSent', 1);
          this.alertService.successAlert({
            title: 'Success',
            content: 'OTP Sent Successfully',
            close: true
          });
          if (res.timer?.diff) {
            this.startPhoneCountdown(res.timer.diff);
          }
        } else if (res) {
          this.phoneSendError.set(
            res.message || 'Something went wrong. Please try again.'
          );
        }
      });
  }

  resendPhoneCode(): void {
    if (this.phoneCountdown() > 0) return;
    // Same reason as resendEmailCode().
    this.clearOtpInputs('phone');
    this.phoneResendMessage.set(`A new OTP was sent to ${this.phoneNumber()}.`);
    this.sendPhoneCode();
  }

  verifyPhone(): void {
    this.phoneOtpError.set(null);
    const otpStr = this.phoneOtpValues().join('');

    if (otpStr.length !== 5) {
      this.phoneOtpError.set(
        'Please enter all 5 digits of the verification code'
      );
      return;
    }
    if (!/^\d{5}$/.test(otpStr)) {
      this.phoneOtpError.set('Please enter numbers only');
      return;
    }

    this.verificationStatus.set('verifying');
    const sendingData = { phone: this.phoneNumber(), otp: otpStr };

    this.userService
      .verifyPhoneOTP(sendingData)
      .pipe(
        catchError(() => {
          this.verificationStatus.set('idle');
          // Same reason as verifyEmail(): the digits stay for the retry.
          this.phoneOtpError.set('Invalid OTP. Please try again.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IOtpResponse | null) => {
        if (res?.success) {
          this.verificationStatus.set('success');
          this.phoneVerified.set(true);
          this.clearPhoneTimer();

          this.localStorageService.updateNestedData(
            'gettingStartedData',
            'verification',
            1
          );
          this.gettingStartedService.getGettingStartedData();
          this.gettingStartedService.updatedGettingStartedData = 1;
          this.store.dispatch(
            UserManagementActions.manualUpdateUserVerification({
              verificationState: {
                email_verified: 1,
                email: this.email(),
                phone_verified: 1,
                phone: this.phoneNumber(),
                phoneOTPSent: 0
              }
            })
          );
          this.localStorageService.setItem('phoneVerified', 1);
          this.localStorageService.setItem('phoneOTPSent', 0);

          this.alertService.successAlert({
            title: 'Success',
            content: 'Phone Verified Successfully',
            close: true
          });

          // Close modal after success animation
          setTimeout(() => {
            this.verificationStatus.set('idle');
            this.clearTimers();
            this.dialogRef.close({
              emailVerified: true,
              phoneVerified: true
            });
          }, 1500);
        } else if (res) {
          this.verificationStatus.set('idle');
          this.phoneOtpError.set(
            res.message || 'Invalid code. Please try again.'
          );
        }
      });
  }

  // --- OTP input handling ---
  onOtpInput(type: 'email' | 'phone', index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    const boxCount = this.getOtpValues(type).length;

    // Keyboard "paste code" suggestions and SMS autofill can type the whole
    // code into one box instead of firing a paste event.
    if (value.length >= boxCount) {
      this.fillOtp(type, value);
      return;
    }

    input.value = value;
    const values = [...this.getOtpValues(type)];
    values[index] = value;
    this.setOtpValues(type, values);

    // Auto-focus next input
    if (value && index < boxCount - 1) {
      const nextRef = this.getOtpRef(type, index + 1);
      nextRef?.nativeElement.focus();
    }

    this.autoVerifyWhenComplete(type);
  }

  onOtpKeydown(
    type: 'email' | 'phone',
    index: number,
    event: KeyboardEvent
  ): void {
    if (event.key === 'Backspace') {
      const values =
        type === 'email'
          ? [...this.emailOtpValues()]
          : [...this.phoneOtpValues()];
      if (!values[index] && index > 0) {
        const prevRef = this.getOtpRef(type, index - 1);
        prevRef?.nativeElement.focus();
        prevRef?.nativeElement.select();
      }
    }
  }

  onOtpPaste(type: 'email' | 'phone', event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digits = pastedText.replace(/\D/g, '');
    if (digits.length > 0) {
      this.fillOtp(type, digits);
    }
  }

  /**
   * Spreads digits across the boxes from the first one, focuses the next empty
   * box (or the last), and verifies once every box is filled. The box count is
   * the length of the values signal, which the template's inputs mirror.
   */
  private fillOtp(type: 'email' | 'phone', digits: string): void {
    const boxCount = this.getOtpValues(type).length;
    const code = digits.slice(0, boxCount);
    const values = Array.from({ length: boxCount }, (_, i) => code[i] ?? '');
    values.forEach((digit, i) => {
      const ref = this.getOtpRef(type, i);
      if (ref) ref.nativeElement.value = digit;
    });
    this.setOtpValues(type, values);

    const focusIndex = Math.min(code.length, boxCount - 1);
    this.getOtpRef(type, focusIndex)?.nativeElement.focus();

    this.autoVerifyWhenComplete(type);
  }

  /**
   * Verifies on its own once every box holds a digit, the same as pressing
   * Verify OTP. Skipped while a verification is already running.
   */
  private autoVerifyWhenComplete(type: 'email' | 'phone'): void {
    if (this.verificationStatus() !== 'idle') return;
    const values = this.getOtpValues(type);
    if (!values.every((digit) => /^\d$/.test(digit))) return;
    if (type === 'email') {
      this.verifyEmail();
    } else {
      this.verifyPhone();
    }
  }

  private getOtpValues(type: 'email' | 'phone'): string[] {
    return type === 'email' ? this.emailOtpValues() : this.phoneOtpValues();
  }

  private setOtpValues(type: 'email' | 'phone', values: string[]): void {
    if (type === 'email') {
      this.emailOtpValues.set(values);
      this.emailOtpError.set(null);
    } else {
      this.phoneOtpValues.set(values);
      this.phoneOtpError.set(null);
    }
  }

  /**
   * Empties one section's OTP boxes and puts the caret back in the first one.
   * Only a resend calls this — a rejected code stays in the boxes so the user
   * can correct the digit they got wrong. Both the signal and the DOM inputs
   * are reset: the boxes are uncontrolled (`[value]` is a one-time binding,
   * not ngModel), so clearing the signal alone would leave the digits on
   * screen.
   * @param type - Which section to clear.
   */
  private clearOtpInputs(type: 'email' | 'phone'): void {
    const boxCount = this.getOtpValues(type).length;
    this.setOtpValues(type, Array.from({ length: boxCount }, () => ''));
    for (let i = 0; i < boxCount; i += 1) {
      const ref = this.getOtpRef(type, i);
      if (ref) ref.nativeElement.value = '';
    }
    this.getOtpRef(type, 0)?.nativeElement.focus();
  }

  private getOtpRef(
    type: 'email' | 'phone',
    index: number
  ): ElementRef<HTMLInputElement> | null {
    const list = type === 'email' ? this.emailOtpInputs : this.phoneOtpInputs;
    if (!list) return null;
    const arr = list.toArray();
    return arr[index] || null;
  }

  // --- Validation helpers ---
  isEmailValid(): boolean {
    return this.emailControl.valid;
  }

  isPhoneValid(): boolean {
    const phone = this.phoneNumber();
    return !!phone && phone.length >= this.currenCountryPhoneLength().min;
  }

  onEmailInput(event: Event): void {
    const {value} = (event.target as HTMLInputElement);
    this.email.set(value);
    this.emailControl.setValue(value, { emitEvent: false });
  }

  onPhoneChange(value: string): void {
    this.phoneNumber.set(value);
    this.phoneControl.setValue(value, { emitEvent: false });
    if (!value || value.length < this.currenCountryPhoneLength().min) {
      this.phoneControl.setErrors({ required: true });
    } else {
      this.phoneControl.setErrors(null);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // --- Timer helpers ---
  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private startEmailCountdown(seconds: number): void {
    this.clearEmailTimer();
    this.emailCountdown.set(seconds);
    this.emailTimerInterval = setInterval(() => {
      const current = this.emailCountdown();
      if (current <= 1) {
        this.emailCountdown.set(0);
        this.clearEmailTimer();
      } else {
        this.emailCountdown.set(current - 1);
      }
    }, 1000);
  }

  private startPhoneCountdown(seconds: number): void {
    this.clearPhoneTimer();
    this.phoneCountdown.set(seconds);
    this.phoneTimerInterval = setInterval(() => {
      const current = this.phoneCountdown();
      if (current <= 1) {
        this.phoneCountdown.set(0);
        this.clearPhoneTimer();
      } else {
        this.phoneCountdown.set(current - 1);
      }
    }, 1000);
  }

  private clearEmailTimer(): void {
    if (this.emailTimerInterval) {
      clearInterval(this.emailTimerInterval);
      this.emailTimerInterval = null;
    }
  }

  private clearPhoneTimer(): void {
    if (this.phoneTimerInterval) {
      clearInterval(this.phoneTimerInterval);
      this.phoneTimerInterval = null;
    }
  }

  private clearTimers(): void {
    this.clearEmailTimer();
    this.clearPhoneTimer();
  }
}

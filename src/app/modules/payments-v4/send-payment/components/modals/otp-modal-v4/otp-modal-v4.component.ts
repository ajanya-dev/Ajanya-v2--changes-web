/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  DestroyRef,
  OnInit,
  Renderer2,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpHeaders } from '@angular/common/http';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { finalize, Subscription, timer } from 'rxjs';
import { NgClass } from '@angular/common';
import { LucideAngularModule, X, Mail, Phone, ShieldCheck } from 'lucide-angular';

import { Utils } from 'src/app/data/utils';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * Data shape for 2-step card payment OTP (paymentId present = card mode).
 * Data shape for single-step OTP (no paymentId = simple mode: international, interceptor 112).
 */
export interface IOtpModalV4Data {
  // ── Card mode (2-step: email → phone) ──
  errorData?: any;
  amount?: number;
  paymentId?: string;
  processBody?: any;
  // ── Single-step mode (international payment, interceptor 112, etc.) ──
  session_key?: string;
  errorMsg?: string;
  mode?: string;
  // ── Optional display-only override for the header subtitle ──
  subtitle?: string;
}

export interface IOtpModalV4Result {
  success: boolean;
  emailSessionKey: string;
  phoneSessionKey: string;
}

@Component({
  selector: 'app-otp-modal-v4',
  templateUrl: './otp-modal-v4.component.html',
  standalone: true,
  imports: [
    NgClass,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class OtpModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<OtpModalV4Component>);
  readonly data: IOtpModalV4Data = inject(MAT_DIALOG_DATA);
  private cloudBankService = inject(CloudBankService);
  private cybersourceService = inject(CybersourceService);
  private paymentsService = inject(PaymentsService);
  private renderer = inject(Renderer2);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly utils = Utils;

  /** true = credit card 2-step flow, false = single-step flow */
  get isCardMode(): boolean {
    return !!this.data.paymentId;
  }

  step = signal(1);
  submitting = signal(false);
  isResendDisabled = signal(true);
  sendingResend = signal(false);

  sessionKey = '';
  emailSessionKey = '';
  phoneSessionKey = '';
  errorMessage = '';

  countdownTimer = 120;
  formattedTime = '02:00';
  otpError = '';

  /**
   * Failure of the action that sends the OTP, shown in this modal instead of a
   * second alert dialog on top of it. Separate from `otpError`, which belongs to
   * the six boxes and only exists once the OTP step is reached.
   */
  actionError = '';

  private countdownSubscription?: Subscription;

  ngOnInit(): void {
    if (this.isCardMode) {
      this.sessionKey = this.data.errorData?.session_key ?? '';
      this.errorMessage = this.data.errorData?.errorMsg ?? '';
    } else {
      this.sessionKey = this.data.session_key ?? '';
      this.errorMessage = this.data.errorMsg ?? '';
    }
    this.startCountdown();
  }

  startCountdown(): void {
    this.isResendDisabled.set(true);
    this.countdownTimer = 120;
    this.updateFormattedTime();
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = timer(0, 1000).subscribe(() => {
      if (this.countdownTimer > 0) {
        this.countdownTimer -= 1;
        this.updateFormattedTime();
      } else {
        this.isResendDisabled.set(false);
        this.countdownSubscription?.unsubscribe();
      }
    });
  }

  private updateFormattedTime(): void {
    const minutes = Math.floor(this.countdownTimer / 60);
    const seconds = this.countdownTimer % 60;
    this.formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  submitOtp(): void {
    let otpStr = '';
    const inputArr = document.querySelectorAll<HTMLInputElement>('input.otp_box_v4');
    inputArr.forEach((e) => {
      if (e.value === '') {
        this.renderer.setStyle(e, 'border-color', 'var(--common-red-color)');
      } else {
        this.renderer.setStyle(e, 'border-color', '');
      }
      otpStr += e.value;
    });

    if (otpStr.length !== 6) {
      this.otpError = 'Please enter the 6-digit OTP';
      return;
    }

    this.otpError = '';
    this.actionError = '';
    this.submitting.set(true);

    this.cloudBankService
      .confirmOtp(
        { session_key: this.sessionKey, otp: otpStr },
        new HttpHeaders({ isDisable422: 'true' })
      )
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res?.success) {
            if (!this.isCardMode) {
              // Single-step: international payment, interceptor 112, etc.
              this.dialogRef.close(true);
            } else if (this.step() === 1) {
              // Card step 1: email verified — trigger phone OTP
              this.emailSessionKey = this.sessionKey;
              this.triggerPhoneOtp();
            } else {
              // Card step 2: phone verified — done
              this.phoneSessionKey = this.sessionKey;
              this.dialogRef.close({
                success: true,
                emailSessionKey: this.emailSessionKey,
                phoneSessionKey: this.phoneSessionKey
              } as IOtpModalV4Result);
            }
          } else {
            this.otpError = res?.errorMsg ?? 'OTP verification failed. Please try again.';
          }
        },
        error: (err: any) => {
          this.otpError = err?.error?.errorMsg ?? 'OTP verification failed. Please try again.';
        }
      });
  }

  private triggerPhoneOtp(): void {
    this.submitting.set(true);
    const body = {
      ...this.data.processBody,
      otp_type: 'phone',
      session_key: this.sessionKey,
      email_otp_session_key: this.emailSessionKey,
      phone_otp_session_key: ''
    };

    this.paymentsService
      .processCardPayment(this.data.paymentId!, body)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.step.set(2);
          this.clearOtpInputs();
          this.startCountdown();
        },
        error: (err: any) => {
          if (err?.error?.errorCode === '112') {
            this.sessionKey = err.error.session_key ?? this.sessionKey;
            this.errorMessage = err.error.errorMsg ?? this.errorMessage;
            this.step.set(2);
            this.clearOtpInputs();
            this.startCountdown();
          } else {
            this.actionError =
              err?.error?.errorMsg ?? 'Failed to trigger phone OTP.';
          }
        }
      });
  }

  resendOtp(): void {
    if (this.isResendDisabled() || this.sendingResend()) return;

    // Clearing on the click, not on the response: the old code is dead the
    // moment a new one is asked for, and leaving it in the boxes lets a
    // stale digit string be submitted against the fresh OTP.
    this.clearOtpInputs();
    this.otpError = '';
    this.actionError = '';

    this.sendingResend.set(true);
    const body = {
      otp_type: this.isCardMode
        ? (this.step() === 1 ? 'email' : 'phone')
        : (this.data.mode ?? 'email'),
      session_key: this.sessionKey,
      email_otp_session_key: this.emailSessionKey || '',
      phone_otp_session_key: '',
      resend_otp: 1
    };

    this.cybersourceService
      .capturePayment(body)
      .pipe(
        finalize(() => this.sendingResend.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: (err: any) => {
          if (err?.error?.errorCode === '112') {
            this.sessionKey = err.error.session_key ?? this.sessionKey;
            this.startCountdown();
          }
        }
      });
  }

  onOtpKeyDown(eve: KeyboardEvent, prevEl: HTMLInputElement): void {
    const target = eve.target as HTMLInputElement;
    if (eve.key === 'Backspace') {
      eve.preventDefault();
      if (target.value) {
        this.renderer.setProperty(target, 'value', '');
      } else if (prevEl !== target) {
        this.renderer.setProperty(prevEl, 'value', '');
        prevEl.focus();
      }
      this.otpError = '';
    }
  }

  onOtpInput(currentEl: HTMLInputElement, nextEl: HTMLInputElement): void {
    const digits = currentEl.value.replace(/\D/g, '');
    if (digits.length >= 6) {
      // Keyboard "paste code" suggestions and SMS autofill type the whole
      // code into one box instead of firing a paste event.
      this.fillOtpBoxes(digits, 0);
    } else {
      if (currentEl.value.length > 1) {
        this.renderer.setProperty(currentEl, 'value', currentEl.value.slice(-1));
      }
      if (currentEl.value && nextEl !== currentEl) {
        nextEl.focus();
        nextEl.select();
      }
    }
    this.otpError = '';
    this.autoSubmitWhenComplete();
  }

  onOtpPaste(event: ClipboardEvent): void {
    // Handled here instead of letting the browser drop the whole string into
    // this box, which onOtpInput would then cut down to its last digit. Codes
    // copied from SMS or email often carry spaces, dashes or a newline, so
    // only the digits are kept.
    event.preventDefault();
    this.otpError = '';
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!digits) return;
    const boxes = this.getOtpBoxes();
    this.fillOtpBoxes(digits, boxes.indexOf(event.target as HTMLInputElement));
    this.autoSubmitWhenComplete();
  }

  /**
   * Writes digits into the boxes from `startIndex` — or from the first box
   * when a full code arrives — and focuses the last box written.
   */
  private fillOtpBoxes(digits: string, startIndex: number): void {
    const boxes = this.getOtpBoxes();
    const start = digits.length >= boxes.length ? 0 : Math.max(0, startIndex);
    const written = digits.slice(0, boxes.length - start).split('');
    written.forEach((digit, offset) => {
      const box = boxes[start + offset];
      this.renderer.setProperty(box, 'value', digit);
      this.renderer.setStyle(box, 'border-color', '');
    });
    boxes[start + written.length - 1]?.focus();
  }

  private getOtpBoxes(): HTMLInputElement[] {
    return Array.from(
      document.querySelectorAll<HTMLInputElement>('input.otp_box_v4')
    );
  }

  /**
   * Submits as soon as all six boxes hold a digit, the same as pressing
   * Verify. Skipped while a request is in flight so it never double-submits.
   */
  private autoSubmitWhenComplete(): void {
    if (this.submitting()) return;
    const boxes = this.getOtpBoxes();
    const isComplete =
      boxes.length === 6 && boxes.every((e) => /^\d$/.test(e.value));
    if (isComplete) this.submitOtp();
  }

  clearOtpInputs(): void {
    this.otpError = '';
    const inputArr = document.querySelectorAll<HTMLInputElement>('input.otp_box_v4');
    inputArr.forEach((e) => {
      this.renderer.setProperty(e, 'value', '');
      this.renderer.setStyle(e, 'border-color', '');
    });
  }
}

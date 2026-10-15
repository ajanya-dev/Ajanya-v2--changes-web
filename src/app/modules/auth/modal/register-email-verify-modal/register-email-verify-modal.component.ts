import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  QueryList,
  Renderer2,
  ViewChildren,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faRotateRight, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { finalize, timer, Subscription } from 'rxjs';

import { Utils } from 'src/app/data/utils';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';

export interface IRegisterEmailVerifyModalData {
  email: string;
  phone:string;
  logoPath: string;
  initialTimerSeconds?: number;
  envId?:string;
}

@Component({
  selector: 'app-register-email-verify-modal',
  templateUrl: './register-email-verify-modal.component.html',
  styles: [
    `
      .timer-ring-progress {
        transition: stroke-dashoffset 1s linear;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatDialogClose, FaIconComponent, CommonButtonV35Component]
})
export class RegisterEmailVerifyModalComponent {
  private dialogRef = inject(MatDialogRef<RegisterEmailVerifyModalComponent>);
  readonly data: IRegisterEmailVerifyModalData = inject(MAT_DIALOG_DATA);
  private authV3Service = inject(AuthV3Service);
  private renderer = inject(Renderer2);
  private destroyRef = inject(DestroyRef);

  readonly faRotateRight = faRotateRight;
  readonly faXmark = faXmark;
  readonly utils = Utils;

  readonly logoPath = this.data.logoPath || 'assets/main/app_logo.svg';

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  readonly otpSlots = [0, 1, 2, 3, 4] as const;
  private readonly otpLength = this.otpSlots.length;

  submitting = signal(false);
  resending = signal(false);
  otpError = signal('');
  /** The code last sent by auto-submit, so a stray keystroke cannot resend it. */
  private lastAutoSubmittedOtp = '';
  remainingSeconds = signal(0);
  private countdownSubscription?: Subscription;
  private readonly totalTimerSeconds = this.data.initialTimerSeconds ?? 60;
  readonly ringCircumference = 43.98;
  ringDashoffset = computed(() => {
    const total = this.totalTimerSeconds || 1;
    const progress = this.remainingSeconds() / total;
    return this.ringCircumference * (1 - progress);
  });
  isResendDisabled = computed(() => this.remainingSeconds() > 0);
  formattedTime = computed(() => {
    const total = this.remainingSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  });

  constructor() {
    this.startCountdown(this.data.initialTimerSeconds ?? 60);
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  private startCountdown(seconds: number): void {
    this.countdownSubscription?.unsubscribe();
    this.remainingSeconds.set(seconds);
    if (seconds <= 0) return;
    this.countdownSubscription = timer(1000, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const next = this.remainingSeconds() - 1;
        this.remainingSeconds.set(next > 0 ? next : 0);
      });
  }

  private collectOtp(): string {
    return this.otpBoxes
      .toArray()
      .map((ref) => ref.nativeElement.value)
      .join('');
  }

  private clearOtpInputs(): void {
    this.otpBoxes.forEach((ref) => {
      this.renderer.setProperty(ref.nativeElement, 'value', '');
    });
    this.lastAutoSubmittedOtp = '';
    this.otpBoxes.first?.nativeElement.focus();
  }

  onOtpInput(index: number): void {
    const inputs = this.otpBoxes.toArray();
    const current = inputs[index].nativeElement;
    if (current.value.length > 1) {
      this.renderer.setProperty(current, 'value', current.value.slice(-1));
    }
    if (current.value && index < inputs.length - 1) {
      inputs[index + 1].nativeElement.focus();
      inputs[index + 1].nativeElement.select();
    }
    this.otpError.set('');
    this.autoSubmitWhenComplete();
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    const inputs = this.otpBoxes.toArray();
    const current = inputs[index].nativeElement;
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (current.value) {
        this.renderer.setProperty(current, 'value', '');
      } else if (index > 0) {
        const prev = inputs[index - 1].nativeElement;
        this.renderer.setProperty(prev, 'value', '');
        prev.focus();
      }
      this.otpError.set('');
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputs[index - 1].nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < inputs.length - 1) {
      event.preventDefault();
      inputs[index + 1].nativeElement.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(
      /\D/g,
      ''
    );
    if (!pasted) return;
    const inputs = this.otpBoxes.toArray();
    inputs.forEach((ref, idx) => {
      this.renderer.setProperty(ref.nativeElement, 'value', pasted[idx] ?? '');
    });
    const lastFilled = Math.min(pasted.length, inputs.length) - 1;
    if (lastFilled >= 0) {
      inputs[Math.min(lastFilled, inputs.length - 1)].nativeElement.focus();
    }
    this.otpError.set('');
    this.autoSubmitWhenComplete();
  }

  /**
   * Verifies as soon as every box holds a digit, the same as pressing Verify.
   * The box count is whatever the template rendered from `otpSlots`. Skipped
   * while a request is in flight, and a code already sent this way is not sent
   * again: a rejected code stays in the boxes, so without that guard every
   * keystroke on a full set of boxes would resubmit it.
   */
  private autoSubmitWhenComplete(): void {
    if (this.submitting()) return;
    const isComplete = this.otpBoxes
      .toArray()
      .every((ref) => /^\d$/.test(ref.nativeElement.value));
    if (!isComplete) return;
    const otp = this.collectOtp();
    if (otp === this.lastAutoSubmittedOtp) return;
    this.lastAutoSubmittedOtp = otp;
    this.submitOtp();
  }

  submitOtp(): void {
    if (this.submitting()) return;
    const otp = this.collectOtp();
    if (otp.length !== this.otpLength) {
      this.otpError.set(`Please enter the ${this.otpLength}-digit OTP`);
      return;
    }

    this.otpError.set('');
    this.submitting.set(true);

    this.authV3Service
      .verifyPreRegistrationEmailOtp(this.data.email, otp)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.dialogRef.close(true);
          } else {
            this.showOtpError(res?.errorMsg);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.showOtpError(err?.error?.errorMsg);
        }
      });
  }

  private showOtpError(message?: string): void {
    // The digits stay on screen: a rejected code is usually one wrong digit,
    // and clearing would make the user retype the whole thing.
    this.otpError.set(message || 'Invalid OTP. Please check and try again.');
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  resendOtp(): void {
    if (this.isResendDisabled() || this.resending()) return;
    this.resending.set(true);
    this.otpError.set('');
    // Clearing on the click, not on the response: the old code is dead the
    // moment a new one is asked for, and leaving it in the boxes lets a
    // stale digit string be submitted against the fresh OTP.
    this.clearOtpInputs();

    this.authV3Service
      .sendPreRegistrationEmailOtp(this.data.email,this.data.phone,this.data.envId||'zilmoney')
      .pipe(
        finalize(() => this.resending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next:(res) => {
        const diff = res?.timer?.diff ?? 60;
        this.startCountdown(diff);
        this.clearOtpInputs();
      },
      error: (err: HttpErrorResponse) => {
        this.showOtpError(err?.error?.errorMsg);
      }
    });
  }
}

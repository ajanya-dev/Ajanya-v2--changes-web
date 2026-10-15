import {
  Component,
  DestroyRef,
  OnInit,
  Renderer2,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule, X, ShieldCheck } from 'lucide-angular';
import { Subscription, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Utils } from 'src/app/data/utils';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';

interface IOtpReportModalData {
  type?: string;
  errorMsg?: string;
  mode?: string;
  session_key?: string;
}

@Component({
  selector: 'app-otp-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  template: `
    <div>
      <!-- Header -->
      <div
        class="flex justify-between items-center px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold text-v4-main-text-color font-funnel">
            OTP Verification
          </h1>
          <h2 class="text-xs text-v4-subtle-text-color">
            Enter the code sent to you
          </h2>
        </div>
        <div
          role="button"
          tabindex="0"
          (click)="dialogRef.close(false)"
          (keydown.enter)="dialogRef.close(false)"
          (keydown.space)="dialogRef.close(false); $event.preventDefault()"
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon [img]="XIcon" [size]="20" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <!-- Body -->
      <div
        class="px-6 py-6 space-y-5"
        [style.pointer-events]="btnDisable() ? 'none' : null"
      >
        <!-- Icon + Message -->
        <div class="flex flex-col items-center text-center space-y-3">
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center bg-v4-brand-tint"
          >
            <lucide-icon
              [img]="ShieldCheckIcon"
              [size]="24"
              style="color: var(--v4-primary-brand-bold-color)"
            />
          </div>

          <p
            class="text-sm text-v4-subtle-text-color leading-relaxed max-w-[340px]"
          >
            {{
              data.type === 'card-transaction'
                ? data.errorMsg
                : 'A verification link has been sent to your registered email address and phone number. Please click the link to generate your OTP.'
            }}
          </p>

          <span
            class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-v4-brand-tint"
            style="color: var(--v4-primary-brand-bold-color)"
          >
            <lucide-icon [img]="ShieldCheckIcon" [size]="14" />
            Secure Verification
          </span>
        </div>

        <!-- OTP Inputs -->
        <div class="flex items-center justify-center gap-2">
          <input
            #box1
            type="number"
            maxlength="1"
            class="otp_box_v4"
            (paste)="onOtpPaste($event)"
            (keypress)="utils.numberOnly($event, 'numeric')"
            (keydown)="onOtpKeyDown($event, box1)"
            (input)="onOtpInput(box1, box2)"
            (click)="box1.select()"
          />
          <input
            #box2
            type="number"
            maxlength="1"
            class="otp_box_v4"
            (paste)="onOtpPaste($event)"
            (keypress)="utils.numberOnly($event, 'numeric')"
            (keydown)="onOtpKeyDown($event, box1)"
            (input)="onOtpInput(box2, box3)"
            (click)="box2.select()"
          />
          <input
            #box3
            type="number"
            maxlength="1"
            class="otp_box_v4"
            (paste)="onOtpPaste($event)"
            (keypress)="utils.numberOnly($event, 'numeric')"
            (keydown)="onOtpKeyDown($event, box2)"
            (input)="onOtpInput(box3, box4)"
            (click)="box3.select()"
          />
          <span class="text-v4-subtle-text-color font-bold px-0.5">-</span>
          <input
            #box4
            type="number"
            maxlength="1"
            class="otp_box_v4"
            (paste)="onOtpPaste($event)"
            (keypress)="utils.numberOnly($event, 'numeric')"
            (keydown)="onOtpKeyDown($event, box3)"
            (input)="onOtpInput(box4, box5)"
            (click)="box4.select()"
          />
          <input
            #box5
            type="number"
            maxlength="1"
            class="otp_box_v4"
            (paste)="onOtpPaste($event)"
            (keypress)="utils.numberOnly($event, 'numeric')"
            (keydown)="onOtpKeyDown($event, box4)"
            (input)="onOtpInput(box5, box6)"
            (click)="box5.select()"
          />
          <input
            #box6
            type="number"
            maxlength="1"
            class="otp_box_v4"
            (paste)="onOtpPaste($event)"
            (keypress)="utils.numberOnly($event, 'numeric')"
            (keydown)="onOtpKeyDown($event, box5)"
            (input)="onOtpInput(box6, box6)"
            (click)="box6.select()"
          />
        </div>

        @if (otpValidationError()) {
          <p class="text-v4-common-red-color text-xs text-center mt-2">
            {{ otpValidationError() }}
          </p>
        }

        <div class="flex justify-center items-center gap-2 text-xs mt-3">
          <span class="text-v4-subtle-text-color">Didn't receive OTP?</span>
          <button
            type="button"
            class="font-medium"
            [class]="
              isResendDisabled() || sendResendOtp()
                ? 'text-v4-subtle-text-color cursor-not-allowed'
                : 'text-v4-primary-brand-color cursor-pointer hover:underline'
            "
            [disabled]="isResendDisabled() || sendResendOtp()"
            (click)="resendOtp()"
          >
            {{ sendResendOtp() ? 'Sending...' : 'Resend' }}
          </button>
          @if (isResendDisabled()) {
            <span class="text-v4-subtle-text-color">({{ formattedTime }})</span>
          }
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex justify-end gap-3 px-6 py-4 bg-v4-secondary-background-color border-t border-v4-border-color"
      >
        <app-common-button-v4
          width="120px"
          [type]="{ style: 'outline', name: 'main' }"
          text="Cancel"
          (clickEvent)="dialogRef.close(false)"
        />
        <app-common-button-v4
          width="120px"
          [type]="{ style: 'primary', name: 'main' }"
          text="Verify"
          [loading]="btnDisable()"
          [disabled]="btnDisable()"
          (clickEvent)="submit()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      /* Hide number input spinners */
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type='number'] {
        -moz-appearance: textfield;
      }
      .otp_box_v4 {
        @apply w-11 h-12 text-center border border-v4-border-color bg-v4-secondary-background-color
             rounded-lg text-v4-main-text-color text-lg font-semibold
             transition-colors duration-150 outline-none;
        &:focus {
          @apply border-v4-primary-brand-color;
        }
      }
    `
  ]
})
export class OtpModalV4Component implements OnInit {
  readonly data: IOtpReportModalData = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<OtpModalV4Component>);
  private cloudAccService = inject(CloudBankService);
  private cybersourceService = inject(CybersourceService);
  private renderer = inject(Renderer2);
  private destroyRef = inject(DestroyRef);

  utils = Utils;
  readonly XIcon = X;
  readonly ShieldCheckIcon = ShieldCheck;

  countdownTimer = 120;
  formattedTime = '02:00';

  btnDisable = signal(false);
  otpValidationError = signal('');
  isResendDisabled = signal(true);
  sendResendOtp = signal(false);

  private countdownSubscription?: Subscription;

  ngOnInit(): void {
    this.startCountdown();
  }

  startCountdown(): void {
    this.isResendDisabled.set(true);
    this.countdownTimer = 120;
    this.updateFormattedTime();
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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

  resendOtp(): void {
    if (this.isResendDisabled() || this.sendResendOtp()) return;

    // Clearing on the click, not on the response: the old code is dead the
    // moment a new one is asked for, and leaving it in the boxes lets a
    // stale digit string be submitted against the fresh OTP.
    this.clearOtpInputs();

    const body = {
      otp_type: this.data.mode,
      session_key: this.data.session_key,
      email_otp_session_key: '',
      phone_otp_session_key: '',
      resend_otp: 1
    };

    this.sendResendOtp.set(true);
    this.cybersourceService
      .capturePayment(body)
      .pipe(
        finalize(() => this.sendResendOtp.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: (err) => {
          if (err.error.errorCode === '112') {
            this.data.session_key = err.error.session_key;
            this.startCountdown();
          }
        }
      });
  }

  submit(): void {
    let otpStr = '';
    const inputArr =
      document.querySelectorAll<HTMLInputElement>('input.otp_box_v4');
    inputArr.forEach((e) => {
      if (e.value === '') {
        this.renderer.setStyle(
          e,
          'border',
          '1px solid var(--v4-common-red-color)'
        );
      } else {
        this.renderer.removeStyle(e, 'border');
      }
      otpStr += e.value;
    });

    if (otpStr.length === 6) {
      this.otpValidationError.set('');
      this.btnDisable.set(true);
      const processedData = {
        session_key: this.data.session_key,
        otp: otpStr
      };

      this.cloudAccService
        .confirmOtp(processedData)
        .pipe(
          finalize(() => this.btnDisable.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            if (this.data.type === 'card-transaction') {
              this.dialogRef.close({
                success: true,
                session_key: this.data.session_key
              });
            } else {
              this.dialogRef.close(true);
            }
          } else if (!res.success) {
            // Shown in this modal rather than in a second alert dialog on top
            // of it, so the OTP boxes stay visible next to the reason.
            this.otpValidationError.set(
              res.errorMsg || 'Invalid OTP. Please check and try again.'
            );
          }
        });
    } else {
      this.otpValidationError.set('OTP is required');
    }
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
      this.otpValidationError.set('');
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
    this.otpValidationError.set('');
    this.autoSubmitWhenComplete();
  }

  onOtpPaste(event: ClipboardEvent): void {
    // Handled here instead of letting the browser drop the whole string into
    // this box, which onOtpInput would then cut down to its last digit. Codes
    // copied from SMS or email often carry spaces, dashes or a newline, so
    // only the digits are kept.
    event.preventDefault();
    this.otpValidationError.set('');
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
      this.renderer.removeStyle(box, 'border');
    });
    boxes[start + written.length - 1]?.focus();
  }

  private getOtpBoxes(): HTMLInputElement[] {
    return Array.from(
      document.querySelectorAll<HTMLInputElement>('input.otp_box_v4')
    );
  }

  /**
   * @description Empties the OTP boxes and returns the caret to the first one,
   * clearing the inline error with them.
   * @returns {void}
   */
  private clearOtpInputs(): void {
    const boxes = this.getOtpBoxes();
    boxes.forEach((box) => {
      this.renderer.setProperty(box, 'value', '');
      this.renderer.removeStyle(box, 'border');
    });
    this.otpValidationError.set('');
    boxes[0]?.focus();
  }

  /**
   * Submits as soon as all six boxes hold a digit, the same as pressing
   * Verify. Skipped while a request is in flight so it never double-submits.
   */
  private autoSubmitWhenComplete(): void {
    if (this.btnDisable()) return;
    const boxes = this.getOtpBoxes();
    const isComplete =
      boxes.length === 6 && boxes.every((e) => /^\d$/.test(e.value));
    if (isComplete) this.submit();
  }
}

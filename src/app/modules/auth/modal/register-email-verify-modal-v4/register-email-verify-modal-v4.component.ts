import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  ViewChildren,
  QueryList,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
} from '@angular/material/dialog';
import { Clock, LucideAngularModule, Mail } from 'lucide-angular';

import { Utils } from 'src/app/data/utils';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';


export interface IRegisterEmailVerifyModalData {
  email: string;
  initialTimerSeconds?: number;
}

@Component({
  selector: 'app-register-email-verify-modal-v4',
  templateUrl: './register-email-verify-modal-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component]
})
export class RegisterEmailVerifyModalV4Component {
  // private dialogRef = inject(MatDialogRef<RegisterEmailVerifyModalV4Component>);
  readonly data: IRegisterEmailVerifyModalData = inject(MAT_DIALOG_DATA);
  // private authV3Service = inject(AuthV3Service);
  private renderer = inject(Renderer2);
  // private destroyRef = inject(DestroyRef);

  readonly MailIcon = Mail;
  readonly ClockIcon = Clock;
  readonly utils = Utils;

  readonly infoBorderColor =
    'color-mix(in srgb, var(--v4-badge-info-text-color) 18%, transparent)';

  readonly infoIconBgColor =
    'color-mix(in srgb, var(--v4-badge-info-text-color) 12%, transparent)';
  
    readonly infoDescriptionColor =
    'color-mix(in srgb, var(--v4-badge-info-text-color) 80%, transparent)';

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  readonly otpSlots = [0, 1, 2, 3, 4] as const;
  private readonly otpLength = this.otpSlots.length;

  submitting = signal(false);
  resending = signal(false);
  otpError = signal('');
  remainingSeconds = signal(0);
  isResendDisabled = computed(() => this.remainingSeconds() > 0);
  formattedTime = computed(() => {
    const total = this.remainingSeconds();
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  });

  constructor() {
    this.startCountdown(this.data.initialTimerSeconds ?? 60);
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  private startCountdown(seconds: number): void {
    this.remainingSeconds.set(seconds);
    // if (seconds <= 0) return;
    // timer(1000, 1000)
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(() => {
    //     const next = this.remainingSeconds() - 1;
    //     this.remainingSeconds.set(next > 0 ? next : 0);
    //   });
  }

  private collectOtp(): string {
    return this.otpBoxes
      .toArray()
      .map((ref) => ref.nativeElement.value)
      .join('');
  }

  // private clearOtpInputs(): void {
  //   this.otpBoxes.forEach((ref) => {
  //     this.renderer.setProperty(ref.nativeElement, 'value', '');
  //   });
  //   this.otpBoxes.first?.nativeElement.focus();
  // }

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
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!pasted) return;
    const inputs = this.otpBoxes.toArray();
    inputs.forEach((ref, idx) => {
      this.renderer.setProperty(ref.nativeElement, 'value', pasted[idx] ?? '');
    });
    const lastFilled = Math.min(pasted.length, inputs.length) - 1;
    if (lastFilled >= 0) {
      inputs[Math.min(lastFilled + 1, inputs.length - 1)].nativeElement.focus();
    }
    this.otpError.set('');
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

    // this.authV3Service
    //   .verifyPreRegistrationEmailOtp(this.data.email, otp)
    //   .pipe(
    //     finalize(() => this.submitting.set(false)),
    //     takeUntilDestroyed(this.destroyRef)
    //   )
    //   .subscribe((res) => {
    //     if (res?.success) {
    //       this.dialogRef.close(true);
    //     }
    //   });
  }

  resendOtp(): void {
    if (this.isResendDisabled() || this.resending()) return;
    this.resending.set(true);
    this.otpError.set('');

    // this.authV3Service
    //   .sendPreRegistrationEmailOtp(this.data.email, environment.providerType || 'zilmoney')
    //   .pipe(
    //     finalize(() => this.resending.set(false)),
    //     takeUntilDestroyed(this.destroyRef)
    //   )
    //   .subscribe((res) => {
    //     const diff = res?.timer?.diff ?? 60;
    //     this.startCountdown(diff);
    //     this.clearOtpInputs();
    //   });
  }
}

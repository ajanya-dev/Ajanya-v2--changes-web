import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, Mail, MessageSquare, X } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

export type NotifyChannelState = 'required' | 'optional' | 'soon';

export interface ISpNotifyModalData {
  payeeName: string;
  caps: { email: NotifyChannelState; sms: NotifyChannelState };
  email: string;
  emailEnabled: boolean;
  phone: string;
  smsEnabled: boolean;
  /** "Save this to the payee's record", as it stands for this payment. */
  saveEmail?: boolean;
  savePhone?: boolean;
  canSaveToPayee?: boolean;
  /**
   * The email half alone. An e-cheque offers the same tick against the address
   * it is delivered to, and two of them would answer over each other.
   */
  canSaveEmailToPayee?: boolean;
  /**
   * Asks the API whether the phone will be accepted, before Done commits it.
   * Answers with the message to show against the field, or null to accept.
   * Absent on the rails that have no such call — Done closes as it always did.
   */
  validatePhone?: (phone: string) => Observable<string | null>;
}

export interface ISpNotifyModalResult {
  email: string;
  emailEnabled: boolean;
  saveEmail: boolean;
  phone: string;
  smsEnabled: boolean;
  savePhone: boolean;
}

@Component({
  selector: 'app-sp-notify-payee-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    CommonButtonV4Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sp-notify-payee-modal.component.html',
  styleUrls: ['./sp-notify-payee-modal.component.scss']
})
export class SpNotifyPayeeModalComponent {
  readonly data = inject<ISpNotifyModalData>(MAT_DIALOG_DATA);
  private ref =
    inject<MatDialogRef<SpNotifyPayeeModalComponent, ISpNotifyModalResult>>(
      MatDialogRef
    );

  readonly MailIcon = Mail;
  readonly SmsIcon = MessageSquare;
  readonly XIcon = X;

  readonly emailEnabled = signal(
    this.data.caps.email === 'required' ? true : this.data.emailEnabled
  );

  readonly smsEnabled = signal(
    this.data.caps.sms === 'required' ? true : this.data.smsEnabled
  );

  /** A channel only has to hold a valid value while it is on AND offered. */
  private readonly emailActive = computed(
    () => this.data.caps.email !== 'soon' && this.emailEnabled()
  );

  private readonly smsActive = computed(
    () => this.data.caps.sms !== 'soon' && this.smsEnabled()
  );

  readonly emailCtrl = new FormControl<string>(this.data.email ?? '', {
    nonNullable: true,
    validators: [Validators.required, ValidationService.emailValidator]
  });

  readonly phoneCtrl = new FormControl<string>(this.data.phone ?? '', {
    nonNullable: true,
    validators: [Validators.required, ValidationService.customMinLength(10)]
  });

  readonly saveEmail = signal(this.data.saveEmail ?? false);
  readonly savePhone = signal(this.data.savePhone ?? false);

  readonly canSaveToPayee = this.data.canSaveToPayee ?? true;

  /**
   * Whether the modal owns the email tick at all — distinct from
   * `canSaveToPayee`, which leaves it on screen and switched off. Only the
   * e-cheque says no, and it says so because its delivery section asks instead.
   */
  readonly canSaveEmailToPayee = this.data.canSaveEmailToPayee ?? true;

  readonly saveHint = 'Coming soon';

  /** A phone check is in flight; Done waits rather than firing a second one. */
  readonly checking = signal(false);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // A disabled control is never invalid, so switching a channel off is all it
    // takes to drop its field out of the Done check — and it greys the input.
    effect(() => this.setEnabled(this.emailCtrl, this.emailActive()),{ allowSignalWrites: true });
    effect(() => this.setEnabled(this.phoneCtrl, this.smsActive()),{ allowSignalWrites: true });
  }

  private setEnabled(control: FormControl<string>, enabled: boolean): void {
    if (enabled) {
      control.enable();
    } else {
      control.disable();
    }
  }

  /** Each country has its own digit count; the picker reports the new one. */
  onCountryChange(event: {
    length?: { min: number | undefined; max: number | undefined };
  }): void {
    if (!event.length) return;
    this.phoneCtrl.setValidators([
      Validators.required,
      ValidationService.customMinLength(event.length.min ?? 10)
    ]);
    this.phoneCtrl.updateValueAndValidity();
  }

  cancel(): void {
    this.ref.close();
  }

  done(): void {
    // The message components only render once a control is touched.
    this.emailCtrl.markAsTouched();
    this.phoneCtrl.markAsTouched();
    if (this.emailCtrl.invalid || this.phoneCtrl.invalid || this.checking()) {
      return;
    }

    // The format is right; only the API knows whether the number is real. Ask
    // before closing, so a rejected one is corrected here rather than at the
    // far end of a submit.
    const ask = this.data.validatePhone;
    if (ask && this.smsActive()) {
      this.checking.set(true);
      ask(this.phoneCtrl.value.trim())
        .pipe(
          finalize(() => this.checking.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((message) => {
          if (message) {
            // Any edit to the field re-runs the validators and clears this.
            this.phoneCtrl.setErrors({ serverError: message });
            this.phoneCtrl.markAsTouched();
            return;
          }
          this.closeWithResult();
        });
      return;
    }

    this.closeWithResult();
  }

  private closeWithResult(): void {
    const email = this.emailCtrl.value.trim();
    const phone = this.phoneCtrl.value.trim();
    this.ref.close({
      email,
      emailEnabled:
        this.data.caps.email === 'soon' ? false : this.emailEnabled(),
      // Where the tick is not offered because the delivery section owns it,
      // Done carries the answer through rather than closing over it.
      saveEmail: this.canSaveEmailToPayee
        ? this.saveEmail() && !!email
        : this.canSaveToPayee && this.saveEmail(),
      phone,
      smsEnabled: this.data.caps.sms === 'soon' ? false : this.smsEnabled(),
      savePhone: this.canSaveToPayee && this.savePhone() && !!phone
    });
  }
}

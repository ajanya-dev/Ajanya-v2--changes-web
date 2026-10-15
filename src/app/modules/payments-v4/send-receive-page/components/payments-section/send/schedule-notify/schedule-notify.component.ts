import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  Signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup } from '@angular/forms';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal
} from '@angular/core/rxjs-interop';
import { startWith, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import {
  Bell,
  History,
  LucideAngularModule,
  Mail,
  MessageSquare,
  Pencil
} from 'lucide-angular';

import { CheckMailService } from '../shared/services/check-mail.service';
import { PaymentFeeService } from '../shared/services/payment-fee.service';
import { SendStateService } from '../shared/services/send-state.service';
import {
  RecurringModalV4Component,
  type IRecurringModalData,
  type IRecurringResult
} from './recurring-modal/recurring-modal-v4.component';
import {
  SpNotifyPayeeModalComponent,
  type ISpNotifyModalData,
  type ISpNotifyModalResult,
  type NotifyChannelState
} from './notify-payee-modal/sp-notify-payee-modal.component';

/** The two ids staging treats as ACH — the only methods it schedules or texts. */
const RECURRING_METHODS = ['ach', 'same-ach'];

/**
 * `POST /payments/check-mail` takes a payee SMS and a mailing-notice email in the
 * same payload, and prices the SMS — so a mailed check offers both for real.
 *
 * `check-email` takes the same SMS block, so the text half is real there too.
 * Its email half is not: the address that check goes to is the delivery target,
 * collected in the Email block, and would be asked for twice from here.
 */
const SMS_METHODS = [...RECURRING_METHODS, 'check_mail', 'check_email'];
const EMAIL_METHODS = ['check_mail'];
const WALLET_UNCARRIED_METHODS = ['check_mail', 'check_email'];

interface INotifyCaps {
  email: NotifyChannelState;
  sms: NotifyChannelState;
}

/**
 * Schedule + Notify, the two rows that close every Additional Details panel.
 *
 * Each source rail keeps its own form; this reads the controls it needs by name
 * and stays inert when a rail does not have them, so a rail without recurring
 * (card) can render the notify row alone without declaring dead controls.
 */
@Component({
  selector: 'app-schedule-notify',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltip],
  templateUrl: './schedule-notify.component.html',
  styleUrl: './schedule-notify.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleNotifyComponent {
  readonly RepeatIcon = History;
  readonly BellIcon = Bell;
  readonly PencilIcon = Pencil;

  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly state = inject(SendStateService);
  /** Owns the mailing envelope the phone is validated against. */
  private readonly mail = inject(CheckMailService);
  /** Texting the payee is billable, so Done has to re-price the payment. */
  private readonly fees = inject(PaymentFeeService);

  readonly form = input.required<FormGroup>();

  // Off for callers with no notify channel and no one-time send, so the rows
  // do not offer what they cannot do.
  readonly showNotify = input(true);
  readonly allowScheduledDate = input(true);

  /**
   * Whether the caller's own endpoint honours a schedule, for callers that are
   * not a send. `null` keeps the send rails deciding it from their source and
   * method, which is the only thing that can answer it for them.
   */
  readonly allowRecurring = input<boolean | null>(null);

  /** Narrows the modal's frequency list; empty keeps the full set. */
  readonly frequencies = input<readonly { value: string; label: string }[]>([]);

  /**
   * The code a fresh schedule opens on. Belongs to the caller because each
   * endpoint numbers its frequencies differently — the same code is Monthly on
   * one and a different interval on another.
   */
  readonly defaultFrequency = input('3');

  /**
   * Which ends the caller's endpoint takes, and whether it has a "count this
   * payment as the first" flag. Both differ per delivery — a direct deposit
   * takes neither an end date nor the flag.
   */
  readonly endOptions = input<readonly string[]>(['3', '1', '2']);
  readonly showIncludeThisPayment = input(true);

  private readonly formValues: Signal<unknown> = toSignal(
    toObservable(this.form).pipe(
      switchMap((f) => f.valueChanges.pipe(startWith(f.getRawValue())))
    ),
    { initialValue: null }
  );

  private control(name: string): AbstractControl | null {
    return this.form().get(name);
  }

  private value<T>(name: string): T | null {
    return (this.control(name)?.value as T) ?? null;
  }

  // ---------------------------------------------------------------------
  // Schedule
  // ---------------------------------------------------------------------

  /**
   * Whether the backend actually honours a schedule for this combination.
   *
   * Staging supports recurring in exactly three places — bank ACH, wallet ACH
   * and bank check (payments/shared/components ACH/bank-ac-ach-v3,
   * ACH/wallet-ach-v3, check/bank-ac-check). Everything else renders the row as
   * Coming soon rather than offering a control the payload would drop.
   */
  readonly scheduleSupported = computed<boolean>(() => {
    this.formValues();

    const hasControls =
      !!this.control('needRecurring') ||
      !!this.control('scheduleDate') ||
      !!this.control('needAchRecurring');
    if (!hasControls) {
      return false;
    }

    // The receive request never picks a source or a method, so the rules below
    // read null for both and answered "not supported" for a form whose endpoint
    // takes `recurring`, `frequency`, `startDate` and `endSelect`. A caller that
    // is not a send states it instead.
    const declared = this.allowRecurring();
    if (declared !== null) {
      return declared;
    }

    if (this.state.sourceId() === 'bankaccount' && this.state.isCheckFlow()) {
      return true;
    }
    return RECURRING_METHODS.includes(this.state.methodId() ?? '');
  });

  /**
   * Which halves this rail actually has, read off the controls it declared —
   * a rail that writes no `needRecurring`/`needAchRecurring` cannot repeat, and
   * one with no `scheduleDate` cannot take a date. `allowScheduledDate` still
   * has a veto: a rail may own the control and still have an endpoint that
   * drops it.
   */
  readonly supportsRecurring = computed<boolean>(() => {
    this.formValues();
    return !!this.control('needRecurring') || !!this.control('needAchRecurring');
  });

  readonly supportsScheduledDate = computed<boolean>(() => {
    this.formValues();
    return this.allowScheduledDate() && !!this.control('scheduleDate');
  });

  readonly scheduleTitle = computed<string>(() => 'Recurring/Schedule');

  /** The half the modal shows as Coming soon, or null when it offers both. */
  private scheduleUnavailableMode(): 'scheduled' | 'recurring' | null {
    if (!this.supportsScheduledDate()) return 'scheduled';
    if (!this.supportsRecurring()) return 'recurring';
    return null;
  }

  readonly isRecurring = computed<boolean>(() => {
    this.formValues();
    return (
      !!this.value<boolean>('needRecurring') ||
      !!this.value<boolean>('needAchRecurring') ||
      !!this.value<string>('scheduleDate')
    );
  });

  /**
   * A custom mailing address is written for the cheque in hand, not kept for the
   * ones a schedule would write later — so scheduling or repeating one is not
   * offered. Said in its own words rather than through `scheduleSupported`,
   * which means "this combination has no schedule at all" and reads Coming soon.
   */
  readonly scheduleBlockedReason = computed<string>(() =>
    this.state.methodId() === 'check_mail' && this.mail.isCustomMailing()
      ? 'Not available for a custom mailing address'
      : ''
  );

  readonly scheduleDisabled = computed<boolean>(
    () => !this.scheduleSupported() || !!this.scheduleBlockedReason()
  );

  readonly scheduleSubtitle = computed<string>(() => {
    if (this.scheduleBlockedReason()) {
      return this.scheduleBlockedReason();
    }
    return this.scheduleSupported() ? this.recurringSummary() : 'Coming soon';
  });

  readonly showsNotify = computed(() => this.showNotify() && this.state.methodId() !== 'check_print');

  readonly recurringSummary = computed<string>(() => {
    this.formValues();
    const needRecurring =
      this.value<boolean>('needRecurring') ??
      this.value<boolean>('needAchRecurring');
    const scheduleDate = this.value<string>('scheduleDate');

    if (!needRecurring && scheduleDate) {
      return `Sends on ${this.formatShortDate(String(scheduleDate))}`;
    }
    if (!needRecurring) {
      return 'Send now — tap to schedule or repeat';
    }

    const parts: string[] = [];
    const freq = this.value<string>('recurringFrequency');
    if (freq) parts.push(this.formatFrequencyLabel(String(freq)));
    const start = this.value<string>('recurringStartDate');
    if (start) parts.push(`from ${this.formatShortDate(String(start))}`);
    const count = this.value<number>('recurringCount');
    if (this.value<string>('recurringEndSelect') === '1' && count) {
      const n = Number(count);
      parts.push(`${n} payment${n === 1 ? '' : 's'}`);
    }
    return parts.length ? parts.join(' · ') : 'Recurring enabled';
  });

  private formatFrequencyLabel(freq: string): string {
    const byCode: Record<string, string> = {
      1: 'Daily',
      2: 'Weekly',
      3: 'Monthly',
      5: 'Biweekly',
      6: 'Bimonthly',
      7: 'Quarterly'
    };
    const key = String(freq).trim();
    if (byCode[key]) return byCode[key];
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  private formatShortDate(dateStr: string): string {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  toggleRecurring(): void {
    if (this.isRecurring()) {
      this.control('needRecurring')?.setValue(false);
      this.control('needAchRecurring')?.setValue(false);
      this.control('scheduleDate')?.setValue(null);
      return;
    }
    this.openScheduleModal();
  }

  editRecurring(): void {
    const scheduled =
      !this.value<boolean>('needRecurring') && !!this.value<string>('scheduleDate');
    this.openScheduleModal({
      mode: scheduled ? 'scheduled' : 'recurring',
      scheduleDate: this.value<string>('scheduleDate') ?? '',
      frequency:
        this.value<string>('recurringFrequency') ?? this.defaultFrequency(),
      start_date: this.value<string>('recurringStartDate') ?? '',
      end_select: this.value<string>('recurringEndSelect') ?? '3',
      count: this.value<number>('recurringCount') ?? '',
      until: this.value<string>('recurringUntil') ?? '',
      recurringIncludeCheck: this.value<boolean>('recurringIncludeCheck') ?? true
    });
  }

  private openScheduleModal(data?: IRecurringModalData): void {
    const unavailableMode = this.scheduleUnavailableMode();
    const limits: IRecurringModalData = {
      ...(unavailableMode ? { unavailableMode } : {}),
      ...(this.frequencies().length
        ? { frequencyOptions: this.frequencies() }
        : {}),
      defaultFrequency: this.defaultFrequency(),
      endOptions: this.endOptions(),
      showIncludeThisPayment: this.showIncludeThisPayment()
    };
    const payload = { ...limits, ...data };
    this.dialog
      .open(RecurringModalV4Component, {
        width: '500px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        ...(Object.keys(payload).length ? { data: payload } : {})
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val: IRecurringResult | null) =>
        this.applyScheduleResult(val)
      );
  }

  private applyScheduleResult(val: IRecurringResult | null): void {
    if (!val) return;

    if (val.mode === 'scheduled') {
      this.control('scheduleDate')?.setValue(val.scheduleDate ?? null);
      this.control('needRecurring')?.setValue(false);
      this.control('needAchRecurring')?.setValue(false);
      this.control('recurringFrequency')?.setValue(null);
      this.control('recurringStartDate')?.setValue(null);
      this.control('recurringEndSelect')?.setValue(null);
      this.control('recurringCount')?.setValue(null);
      this.control('recurringUntil')?.setValue(null);
      return;
    }
    this.control('scheduleDate')?.setValue(null);
    this.control('needRecurring')?.setValue(true);
    this.control('needAchRecurring')?.setValue(true);
    this.control('recurringFrequency')?.setValue(val.frequency ?? null);
    this.control('recurringStartDate')?.setValue(val.start_date ?? null);
    this.control('recurringEndSelect')?.setValue(val.end_select ?? null);
    this.control('recurringCount')?.setValue(
      val.count != null && val.count !== '' ? Number(val.count) : null
    );
    this.control('recurringUntil')?.setValue(val.until || null);
    this.control('recurringIncludeCheck')?.setValue(
      val.recurringIncludeCheck ?? true
    );
  }

  constructor() {
    // A schedule set before the address became custom would still be sent, with
    // a disabled toggle as the only thing saying otherwise. It goes with the
    // choice that blocked it.
    effect(
      () => {
        const blocked = !!this.scheduleBlockedReason();
        const recurring = this.isRecurring();

        untracked(() => {
          if (!blocked || !recurring) {
            return;
          }
          this.control('needRecurring')?.setValue(false);
          this.control('needAchRecurring')?.setValue(false);
          this.control('scheduleDate')?.setValue(null);
        });
      },
      { allowSignalWrites: true }
    );
  }

  // ---------------------------------------------------------------------
  // Notify
  // ---------------------------------------------------------------------

  /**
   * `direct_deposit.email` notifies the payee of the deposit, so the email half
   * is real for a bank check being deposited. It is gated on the delivery, not
   * the method id: `ach` also means wallet ACH and bank ACH, neither of which
   * carries an email in its payload.
   */
  private readonly isBankCheckDeposit = computed(
    () =>
      this.state.sourceId() === 'bankaccount' &&
      this.state.checkDelivery() === 'ach'
  );

  readonly notifyCaps = computed<INotifyCaps | null>(() => {
    const method = this.state.methodId() ?? '';

    if (
      this.state.sourceId() === 'wallet' &&
      WALLET_UNCARRIED_METHODS.includes(method)
    ) {
      return { email: 'soon', sms: 'soon' };
    }

    return {
      email:
        EMAIL_METHODS.includes(method) || this.isBankCheckDeposit()
          ? 'optional'
          : 'soon',
      sms: SMS_METHODS.includes(method) ? 'optional' : 'soon'
    };
  });

  /**
   * A printed cheque never leaves the browser — both papers submit as
   * `check_print` — so there is no send for the payee to be told about and the
   * row is dropped rather than shown as Coming soon.
   */
  readonly notifyVisible = computed<boolean>(
    () => this.showNotify() && this.state.methodId() !== 'check_print'
  );

  readonly notifyInteractive = computed<boolean>(() => {
    const c = this.notifyCaps();
    return !!c && (c.email !== 'soon' || c.sms !== 'soon');
  });

  /**
   * Notify is about one payee: the modal is titled with their name, seeded from
   * their record and offers to save back to it. Without one there is nobody to
   * notify, and nothing to seed the fields from.
   */
  readonly hasPayee = computed<boolean>(() => !!this.state.payeeId());

  /** The row is live only when the method offers a channel AND a payee is set. */
  readonly notifyEnabled = computed<boolean>(
    () => this.notifyInteractive() && this.hasPayee()
  );

  readonly isEmailNotify = computed<boolean>(() =>
    this.state.notifyEmailEnabled()
  );

  readonly isSms = computed<boolean>(() => this.state.notifySmsEnabled());

  private readonly isCheckMail = computed(
    () => this.state.sourceId() === 'bankaccount' && this.state.methodId() === 'check_mail'
  );

  readonly notifyEmailAddr = computed<string>(() =>
    this.state.effectiveNotifyEmail()
  );

  readonly notifyPhone = computed<string>(() =>
    this.state.effectiveNotifyPhone()
  );

  readonly notifyMainOn = computed<boolean>(
    () => this.notifyInteractive() && (this.isEmailNotify() || this.isSms())
  );

  /**
   * The subtitle when there are no channels to show: the method offers none,
   * there is no payee to notify, or nothing is switched on yet — the last is an
   * invitation rather than a state, so it keeps its own words. Otherwise
   * `notifyChannels` renders instead.
   */
  readonly notifySubtitle = computed<string>(() => {
    if (!this.notifyInteractive()) return 'Coming soon';
    if (!this.hasPayee()) return 'Select a payee first';
    if (!this.notifyMainOn()) return 'Off — tap to set up';
    return '';
  });

  /**
   * Every channel this method offers, each with its own icon and whether it is
   * on. Both are listed once either is on: naming only the chosen one reads as
   * though nothing else had been available, which is what left users unaware
   * that a text is on offer at all.
   *
   * The icons are the ones the notify modal heads its two rows with, so the
   * summary and the modal name the same things the same way.
   */
  readonly notifyChannels = computed<
    { label: string; icon: typeof Mail; on: boolean }[]
  >(() => {
    const caps = this.notifyCaps();
    if (!caps || !this.hasPayee() || !this.notifyMainOn()) return [];

    const out: { label: string; icon: typeof Mail; on: boolean }[] = [];
    if (caps.email !== 'soon') {
      out.push({ label: 'Email', icon: Mail, on: this.isEmailNotify() });
    }
    if (caps.sms !== 'soon') {
      out.push({ label: 'Text', icon: MessageSquare, on: this.isSms() });
    }
    return out;
  });

  readonly notifyTooltip = computed<string>(() => {
    const vals: string[] = [];
    if (this.isEmailNotify() && this.notifyEmailAddr()) {
      vals.push(this.notifyEmailAddr());
    }
    if (this.isSms() && this.notifyPhone()) {
      vals.push(this.notifyPhone());
    }
    return vals.join(', ');
  });

  /**
   * What the row says on hover. It sits on the wrapper rather than the button
   * so it still answers while the button is disabled — which is the one state
   * that most needs explaining.
   */
  readonly notifyHint = computed<string>(() => {
    if (!this.notifyInteractive()) return '';
    if (!this.hasPayee()) {
      return 'Select a payee first — the notice goes to them.';
    }
    return this.notifyTooltip();
  });

  private payeeName(): string {
    const info = this.state.payeeDetails()?.payee_information;
    return info?.payee_company_name || info?.payee_name || '';
  }

  openNotifyModal(): void {
    const caps = this.notifyCaps();
    if (!caps || !this.notifyEnabled()) return;

    const info = this.state.payeeDetails()?.payee_information;
    this.dialog
      .open(SpNotifyPayeeModalComponent, {
        width: '460px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: {
          payeeName: this.payeeName(),
          caps,
          email: this.notifyEmailAddr() || info?.payee_email || '',
          emailEnabled: this.isEmailNotify(),
          phone: this.notifyPhone() || info?.payee_phone || '',
          smsEnabled: this.isSms(),
          // Reopening the modal must not silently untick what the payload is
          // already carrying — Done writes both back either way.
          saveEmail: this.state.notifySaveEmail(),
          savePhone: this.state.notifySavePhone(),
          // Only the bank cheque's payloads carry `save_payee_email` /
          // `save_payee_phone`. Everywhere else the tick promised a choice
          // nothing performs — the number is written onto the payee either way.
          canSaveToPayee:
            this.state.sourceId() === 'bankaccount' &&
            this.state.isCheckSelected(),
          // The e-cheque's delivery section asks this against the address it
          // sends to, so the modal does not ask it a second time.
          canSaveEmailToPayee:
            this.state.sourceId() === 'bankaccount' &&
            this.state.isCheckSelected() &&
            this.state.checkDelivery() !== 'email',
          // Only a mailed cheque has a call that rules on the number; the other
          // rails leave this out and Done closes without asking.
          validatePhone: this.isCheckMail()
            ? (phone: string) => this.mail.validateNotifyPhone(phone)
            : undefined
        } as ISpNotifyModalData
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: ISpNotifyModalResult | undefined) => {
        if (!res) return;
        this.state.notifyEmailValue.set(res.email || null);
        this.state.notifyEmailEnabled.set(res.emailEnabled && !!res.email);
        // The tick only rides the save/mail payload — `save_payee_email` and
        // `save_payee_phone` are what write it onto the payee record.
        this.state.notifySaveEmail.set(res.saveEmail);
        this.state.notifyPhoneValue.set(res.phone || null);
        this.state.notifySmsEnabled.set(res.smsEnabled && !!res.phone);
        this.mirrorSmsToForm(res.smsEnabled && !!res.phone, res.phone || '');
        this.state.notifySavePhone.set(res.savePhone);
        this.fees.recompute();
      });
  }

  /**
   * Notify has no payload of its own yet, so the SMS half rides the rails'
   * existing send_sms / payeeNumber controls — the same fields the Instant SMS
   * toggle used to write. The email half has no field to write to.
   */
  private mirrorSmsToForm(enabled: boolean, phone: string): void {
    const toggle = this.control('send_sms') ?? this.control('sendSms');
    toggle?.setValue(enabled);
    if (phone) {
      this.control('payeeNumber')?.setValue(phone);
    }
  }
}

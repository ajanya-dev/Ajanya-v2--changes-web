import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, merge, of } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators';

import type { IEcheckDetails } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

import {
  CheckDeliveryBaseService,
  QUOTE_TYPE,
  type ICheckBlocker,
  type ICheckCost,
  type ICheckDeliveryResponse
} from './check-delivery-base.service';
import { PaymentFeeService } from './payment-fee.service';

/** The same shape the account's own validator accepts. */
const QUOTE_DEBOUNCE_MS = 400;

const EMAIL = /^[\w-.]+@([\w-]+\.)+[\w-]{2,15}$/;

/**
 * `error_code 731` — the account has no bank account at all. The new contract
 * has no blocker code for it yet, so it is recognised by the legacy code the
 * blocker still carries.
 */
const NO_BANK_ACCOUNT_CODE = 731;

/**
 * An e-checked bank check: the recipient address, and the one call that creates
 * the cheque and emails it.
 *
 * There is no `quote_only` here on purpose. SMS is the only billable line and
 * the API's own re-quote table says to ignore everything else for pricing — a
 * round trip to learn the value of a checkbox. The SMS unit price comes from
 * `GET /cheques/get-sms-cost`, which is cheap and cacheable.
 */
@Injectable()
export class CheckEmailService extends CheckDeliveryBaseService {
  private readonly fees = inject(PaymentFeeService);
  private readonly localStorage = inject(LocalStorageService);

  /** Typed override. Empty means "whatever the payee record carries". */
  readonly address = signal<string | null>(null);

  private readonly isEmail = computed(
    () =>
      this.registry.isBankCheck() &&
      this.state.methodId() === 'check_email'
  );

  readonly payeeEmail = computed(
    () => this.state.payeeDetails()?.payee_information?.payee_email?.trim() ?? ''
  );

  /**
   * The "Send to Custom Email" tick of `check-email-modal-v4`. It says who the
   * cheque is booked against — a group e-check rather than the payee's own —
   * and nothing more. The address is typed either way, as it is in the modal,
   * where the payee's own is a starting value and not a fixture.
   */
  readonly customAddress = signal(false);

  /**
   * Ticking it empties the box: the address is no longer the payee's, so
   * leaving theirs in it invites a send to an address the tick says it is not.
   * Unticking hands the field back to the payee's own.
   */
  setCustomAddress(on: boolean): void {
    this.customAddress.set(on);
    this.address.set(on ? '' : null);
  }

  /**
   * The payee's address is still being fetched and nothing has been typed over
   * it. The field shows a shimmer for exactly this span rather than an empty
   * box that fills itself in under the cursor.
   */
  readonly resolvingPayeeEmail = computed(
    () => this.address() === null && this.state.payeeFetching()
  );

  /**
   * What the check is actually emailed to: what was typed, or the payee's own
   * address until something is. Resolving it here is what lets the field show
   * the user where it is going before they send.
   */
  readonly effectiveAddress = computed(() =>
    (this.address() ?? this.payeeEmail()).trim()
  );

  /**
   * The address on its own, judged as soon as there is something to judge. The
   * whole-form error waits for a submit, which is too late for a field the user
   * is typing into: a malformed address is knowable the moment it is typed, and
   * saying so then is the difference between a correction and a refusal.
   */
  readonly addressFormatError = computed(() => {
    const address = this.effectiveAddress();
    if (!address) {
      return '';
    }
    return EMAIL.test(address) ? '' : 'Enter a valid email address';
  });

  /**
   * A reopened cheque carries the address it was sent to, and whether that was
   * the payee's own is only knowable once the payee has loaded — so the answer
   * waits for it rather than ticking the box on every edit.
   */
  private readonly restoredAddress = signal<string | null>(null);

  readonly restoringAddress = computed(() => this.restoredAddress() !== null);

  // ── Cost ──

  private readonly smsUnitCost = signal(0);
  private smsCostLoaded = false;

  /** The shape is a bare number on some builds and `{ amount }` on others. */
  private loadSmsCost(): void {
    if (this.smsCostLoaded) {
      return;
    }
    this.smsCostLoaded = true;
    this.checks
      .getSmsCost()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const data = res?.data as { amount?: unknown } | number | string | null;
          const raw = data && typeof data === 'object' ? data.amount : data;
          this.smsUnitCost.set(Number(raw) || 0);
        },
        // No price, no SMS line — better than inventing one.
        error: () => this.smsUnitCost.set(0)
      });
  }

  /**
   * The payee text is free while the account is still inside its trial — the
   * rule `check-email-modal-v4` applies in `getSmsCharge`, and the only part of
   * that modal's arithmetic this side was missing. Read once: the trial does
   * not end while a payment is being filled in.
   */
  private readonly inTrialPeriod =
    Number(this.localStorage.getItem('trialPeriodEndsIn')) > 0;

  /**
   * What the panel shows until the quote answers. Emailing is free on this
   * side's reckoning; the payee text and the attachments are not.
   */
  private readonly estimate = computed<ICheckCost>(() => {
    const sms =
      this.state.notifySmsEnabled() && !this.inTrialPeriod
        ? this.smsUnitCost()
        : 0;
    const attachments = this.fees.attachmentFee();

    return {
      shipping: 0,
      paper: 0,
      sms,
      attachments,
      total: sms + attachments
    };
  });

  /**
   * The server's price for this e-check. It used to have no way to ask — the
   * one call that knew was keyed by a cheque that does not exist yet — so the
   * estimate above was the whole answer and left the per-cheque fee out.
   */
  private readonly quote = signal<ICheckCost | null>(null);

  /** A price is in flight. The panel skeletons its figures for exactly this. */
  private readonly quoting = signal(false);

  readonly cost = computed<ICheckCost>(() => this.quote() ?? this.estimate());

  // ── Server-side validation ──

  /**
   * Empty, and staying that way. `POST /payments/validate` was the one call
   * that filled this, and an emailed cheque no longer goes anywhere near that
   * contract — it is written by `POST /checks` and sent by `email-checks`,
   * neither of which offers a form-time check. Emailability, approval and the
   * blank-check rule are answered by the send.
   *
   * Left in place because the inline chips and the submit gate both read it;
   * they simply have nothing to show until there is an endpoint to ask.
   */
  readonly serverBlockers = signal<ICheckBlocker[]>([]);
  readonly validating = signal(false);

  /** The account has no bank account at all — offer to go and add one. */
  readonly noBankAccount = computed(() =>
    this.serverBlockers().some(
      (b) => b.data?.error_code === NO_BANK_ACCOUNT_CODE
    )
  );

  /** Only `error` stops a submit; `warning` renders inline and lets it through. */
  private readonly blockingServerError = computed(
    () => this.serverBlockers().find((b) => b.severity !== 'warning') ?? null
  );

  /**
   * Kept so the callers that ask for a re-check after editing a payee or a bank
   * still have something to call. There is nothing to re-check: an emailed
   * cheque is validated by the send itself now.
   */
  revalidate(): void {
    this.serverBlockers.set([]);
  }

  // ── Client-side validation ──

  /** The first thing standing between this form and an emailed check, in words. */
  readonly validationError = computed(() => {
    const address = this.effectiveAddress();
    if (!address) {
      return 'Enter the email address to send this check to';
    }
    if (!EMAIL.test(address)) {
      return 'Enter a valid email address for the payee';
    }

    // A notification channel with nothing to send to is refused up front by the
    // API, and there is no fallback to the payee record.
    if (this.state.notifySmsEnabled() && !this.state.effectiveNotifyPhone()) {
      return 'Add a phone number for the payee text, or turn the text off';
    }

    // Last: what the server already told us, which the user must go and fix.
    const server = this.blockingServerError();
    if (server) {
      return server.data?.message || 'This check cannot be emailed';
    }
    return '';
  });

  /**
   * The address is the payee's, or a stand-in for it, so it cannot outlive the
   * payee it was typed against — left alone it sends the next payee's cheque to
   * the last one's inbox. The first payee seen only arms the latch, so a
   * reopened cheque keeps the address it was saved with.
   */
  /**
   * The recipient field answers the payee's missing-email prompt, which is
   * computed in the state service — and only while this is the tile in use, so
   * an address left here does not speak for a rail that is not asking it.
   */
  private publishAddressToState(): void {
    effect(
      () => {
        const address = this.isEmail() ? this.effectiveAddress() : '';
        untracked(() => this.state.deliveryEmail.set(address));
      },
      { allowSignalWrites: true }
    );
  }

  private resetAddressOnPayeeChange(): void {
    effect(
      () => {
        const payeeId = this.state.payeeId();

        untracked(() => {
          if (!payeeId || this.addressPayeeId === payeeId) {
            return;
          }
          const hadPayee = !!this.addressPayeeId;
          this.addressPayeeId = payeeId;
          if (hadPayee) {
            this.address.set(null);
            this.customAddress.set(false);
          }
        });
      },
      { allowSignalWrites: true }
    );
  }

  private addressPayeeId: string | null = null;

  constructor() {
    super();
    this.resetAddressOnPayeeChange();
    this.publishAddressToState();

    // A reopened cheque's address is only custom if it is not the payee's, and
    // that comparison needs the payee. Runs once, when they arrive.
    effect(
      () => {
        const restoredAddress = this.restoredAddress();
        if (!this.state.payeeDetails() || restoredAddress === null) {
          return;
        }
        untracked(() => {
          const restored = restoredAddress.trim();
          this.restoredAddress.set(null);
          const isOverride =
            restored.toLowerCase() !== this.payeeEmail().toLowerCase();
          this.customAddress.set(isOverride);
          // It was the payee's own address, so it belongs to the payee rather
          // than to this field — holding it here is what the tick inherited.
          if (!isOverride) {
            this.address.set(null);
          }
        });
      },
      { allowSignalWrites: true }
    );

    // Priced by the server whenever the amount or the payee text moves. The
    // estimate stays on screen meanwhile, so the panel never goes blank.
    merge(
      this.state.coreForm.controls.amount.valueChanges,
      toObservable(this.state.notifySmsEnabled),
      toObservable(this.isEmail)
    )
      .pipe(
        tap(() => this.quoting.set(this.isEmail())),
        debounceTime(QUOTE_DEBOUNCE_MS),
        switchMap(() =>
          this.isEmail()
            ? this.quoteDelivery(
                QUOTE_TYPE.email,
                this.state.notifySmsEnabled()
              )
            : of(null)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((cost) => {
        this.quoting.set(false);
        this.quote.set(cost);
      });

    // One writer for the cost panel while email is selected. `PaymentFeeService`
    // stands aside for this combination, the same way it does for mail.
    effect(
      () => {
        if (!this.isEmail()) {
          return;
        }
        const cost = this.cost();
        const quoting = this.quoting();
        untracked(() => this.fees.setMailQuote(cost, false, quoting));
      },
      { allowSignalWrites: true }
    );

  }

  /** Called when the Email tile is chosen, so the SMS price is on screen. */
  activate(): void {
    this.loadSmsCost();
  }

  newPayment(): void {
    this.resetIdempotencyKey();
    this.address.set(null);
    this.customAddress.set(false);
    this.addressPayeeId = null;
    this.restoredAddress.set(null);
    this.serverBlockers.set([]);
  }

  // ── Send ──

  /** Creates the cheque and emails it, in one call. 422 throws — read `error.blockers`. */
  send(
    acknowledgements: Record<string, number | boolean> = {}
  ): Observable<ICheckDeliveryResponse> {
    return this.checks.sendCheckEmail(
      this.envelope(acknowledgements),
      this.sendHeaders()
    ) as Observable<ICheckDeliveryResponse>;
  }

  // ── Payload ──

  protected attachmentIds(): string[] {
    return this.fees.attachmentIds();
  }

  private envelope(
    acknowledgements: Record<string, number | boolean>
  ): Record<string, unknown> {
    return {
      quote_only: false,
      payment: this.paymentBlock(),
      email: this.emailBlock(),
      // Only ever sent in answer to a resolvable blocker.
      ...(Object.keys(acknowledgements).length ? { acknowledgements } : {})
    };
  }

  /**
   * Put a saved e-check back on the form when a cheque is reopened.
   * `GET /zil-payments/{uuid}` carries it as `transfer.echeck_details`.
   *
   * Attachments are not read here: the payment's own attachment list already
   * restores them, and `file_hidden` is the same set by another name.
   */
  restoreEcheck(e: IEcheckDetails | undefined | null): void {
    if (!e) {
      return;
    }

    // For an e-check the address is the delivery, not a notice channel. A
    // custom one says so on the record, so it needs no guessing; an older save
    // put an edited address in `payee_email`, which only the payee can settle.
    if (e.is_group_echeck && e.group_echeck_email) {
      this.address.set(e.group_echeck_email);
      this.customAddress.set(true);
    } else if (e.payee_email) {
      this.address.set(e.payee_email);
      this.restoredAddress.set(e.payee_email);
    }

    this.state.notifySmsEnabled.set(!!e.sms_checkbox);
    if (e.phone) {
      this.state.notifyPhoneValue.set(e.phone);
    }
  }

  /**
   * The e-check options as `POST /checks` and `PUT /checks/{id}` store them —
   * one flat object, no check-id keys, and no `mail_check_ids`, which belongs
   * to the send call alone.
   */
  echeckDetails(): IEcheckDetails {
    const d = this.details();
    const smsOn = this.state.notifySmsEnabled();

    const address = this.effectiveAddress();

    // An address other than the payee's is a group e-check of one: the send API
    // takes it in `group_echeck_email` with the flag on and `payee_email` left
    // empty. Putting it in `payee_email` instead is the payee's own field
    // carrying somebody else's address, and the API ignores it.
    const custom =
      this.customAddress() && !!address && !this.state.notifySaveEmail();

    return {
      payee_email: custom ? '' : address,
      sms_checkbox: smsOn,
      phone: smsOn ? this.state.effectiveNotifyPhone() : '',
      // Never offer to save a one-off address onto the payee's record.
      save_payee_email:
        !custom && address && this.state.notifySaveEmail() ? 1 : 0,
      save_payee_phone: smsOn && this.state.notifySavePhone() ? 1 : 0,
      file_hidden: this.attachmentIds(),
      fileName: '',
      is_group_echeck: custom,
      group_echeck_email: custom ? address : '',
      ...this.echeckSchedule(d)
    };
  }

  /**
   * `is_recurring_value` is the send API's own scale — 0 now, 1 recurring,
   * 2 scheduled — and the two date fields follow whichever it names.
   */
  private echeckSchedule(d: Record<string, unknown>): Partial<IEcheckDetails> {
    if (d.needRecurring) {
      const endSelect = String(Number(d.recurringEndSelect) || 3);
      return {
        is_recurring_value: 1,
        emailCheckRecurring: 1,
        recurring_include_check: d.recurringIncludeCheck !== false,
        schedule_date: '',
        recurring: {
          frequency: String(Number(d.recurringFrequency) || 3),
          start_date: (d.recurringStartDate as string) || '',
          end_select: endSelect,
          // Each end option carries only its own field; the other contradicts it.
          count: endSelect === '1' ? String(Number(d.recurringCount) || 0) : '0',
          until: endSelect === '2' ? (d.recurringUntil as string) || null : null
        }
      };
    }
    if (d.scheduleDate) {
      return {
        is_recurring_value: 2,
        // Scheduled counts as recurring to this flag; only "send now" is 0.
        emailCheckRecurring: 1,
        recurring_include_check: false,
        schedule_date: d.scheduleDate as string,
        recurring: { schedule_date: d.scheduleDate as string }
      };
    }
    return {
      is_recurring_value: 0,
      emailCheckRecurring: 0,
      recurring_include_check: false,
      schedule_date: '',
      recurring: {}
    };
  }

  private emailBlock(): Record<string, unknown> {
    const address = this.effectiveAddress();

    return {
      ...(address ? { address } : {}),
      // ponytail: `email.message` is a later piece of work. It is optional and
      // the API drops an empty one, so omitting it is the honest state — the
      // modal that holds today's message is keyed by a check id that does not
      // exist until this call returns.
      sms: this.state.notifySmsEnabled()
        ? { enabled: true, phone: this.state.effectiveNotifyPhone() }
        : { enabled: false },
      ...this.scheduling()
    };
  }
}

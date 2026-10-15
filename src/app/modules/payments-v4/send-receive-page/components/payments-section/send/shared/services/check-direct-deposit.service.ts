import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, merge, of } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators';

import type { IDirectDepositDetails } from 'src/app/modules/check/model/check';

import {
  CheckDeliveryBaseService,
  QUOTE_TYPE,
  type ICheckBlocker,
  type ICheckCost,
  type ICheckDeliveryResponse
} from './check-delivery-base.service';
import { PaymentFeeService } from './payment-fee.service';

/** Long enough that typing an amount does not price every keystroke. */
const QUOTE_DEBOUNCE_MS = 400;

/**
 * A bank check deposited straight into the payee's account.
 *
 * It is not priced before it is sent. `cost.ach` is real money that moves with
 * the amount, so it cannot be worked out on this side — and the one endpoint
 * that quoted it, `POST /payments/check-direct-deposit`, is withdrawn. Its
 * replacement writes the cheque first, and `checks/get-direct-deposit-modal`
 * needs a cheque id, so there is nothing left to ask before the user commits.
 * The panel says pending rather than inventing a figure.
 */
@Injectable()
export class CheckDirectDepositService extends CheckDeliveryBaseService {
  private readonly fees = inject(PaymentFeeService);

  /**
   * Pay the receiver's bank directly rather than crediting their wallet. On by
   * default, which is where the legacy modal's checkbox starts.
   */
  readonly walletBypassing = signal(true);

  private readonly isDirectDeposit = computed(
    () => this.registry.isBankCheck() && this.state.methodId() === 'ach'
  );

  /**
   * The payee's ACH account, when one is chosen. The endpoint takes the
   * encrypted id the payee bank-accounts endpoint returns, which is what the
   * dropdown holds.
   *
   * `"0"` is filtered out deliberately: `DirectDepositService` treats anything
   * non-positive as "no account chosen", so sending it is refused with
   * `bank_details_required` — and the picker can emit it.
   */
  readonly payeeAccount = computed(() => {
    const bank = this.state.selectedPayeeBank();
    const id = bank?.encrypted_id ?? (bank?.id != null ? String(bank.id) : '');
    return id === '0' ? '' : id;
  });

  /**
   * The same account by its plain id — `decryptedId` on the payee's bank list,
   * which is what the send names it by.
   *
   * `checks/direct-deposit` — the endpoint `direct-deposit-v4` posts to and the
   * one this rail's send goes through — takes `bankAccountList.value`, a numeric
   * id, with `0` for the Master Wallet. Only the consolidated envelope accepts
   * the encrypted one. Sending the encrypted id there was a value the endpoint
   * cannot resolve, and a supplied account that does not resolve is refused
   * rather than ignored.
   */
  readonly payeeAccountPlainId = computed(() => {
    const bank = this.state.selectedPayeeBank();
    const plain = bank?.decrypted_id ?? bank?.id;
    const id = plain != null ? String(plain) : '';
    return id === '0' ? '' : id;
  });

  // ── Cost ──

  readonly cost = signal<ICheckCost | null>(null);
  readonly quoting = signal(false);

  /** What the ACH line comes to, quote or nothing — never a guess. */
  readonly achFee = computed(() => {
    const cost = this.cost();
    return cost ? cost.ach ?? cost.paper ?? 0 : null;
  });

  // ── Validation ──

  /**
   * Empty, and staying that way. The withdrawn quote was the one call that
   * filled this — the payee-account and balance answers before the user
   * committed. Its replacement cannot answer without a cheque, so the send is
   * what reports them now. Kept because the inline chips and the submit gate
   * both read it; they simply have nothing to show until there is an endpoint
   * to ask.
   */
  readonly serverBlockers = signal<ICheckBlocker[]>([]);

  /**
   * The first thing standing between this form and a deposit, in words.
   *
   * The payee's account is NOT one of them. Direct deposit is
   * receive-then-withdraw: the payee needs no account on file to be paid, and
   * `receiver_bank_account_id` is filled in when they withdraw. Only a value
   * that is supplied and does not resolve is refused, and that is the
   * endpoint's answer to give.
   */
  readonly validationError = computed(() => {
    // A notification channel with nothing to send to is refused up front.
    if (this.state.notifySmsEnabled() && !this.state.effectiveNotifyPhone()) {
      return 'Add a phone number for the payee text, or turn the text off';
    }
    // Not the optional notice: the deposit endpoint requires an address, the
    // same way the modal's column does.
    if (!this.state.effectiveNotifyEmail()) {
      return 'Add an email address to tell the payee about this deposit';
    }
    return '';
  });

  constructor() {
    super();

    // Priced by the server whenever the amount or the payee text moves. It had
    // no way to ask before — `checks/get-direct-deposit-modal` is keyed by a
    // cheque that does not exist yet — so the panel said pending and left it.
    merge(
      this.state.coreForm.controls.amount.valueChanges,
      toObservable(this.state.notifySmsEnabled),
      toObservable(this.isDirectDeposit)
    )
      .pipe(
        debounceTime(QUOTE_DEBOUNCE_MS),
        tap(() => this.quoting.set(true)),
        switchMap(() =>
          this.isDirectDeposit()
            ? this.quoteDelivery(
                QUOTE_TYPE.deposit,
                this.state.notifySmsEnabled()
              )
            : of(null)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((cost) => {
        this.quoting.set(false);
        this.cost.set(cost);
      });

    // One writer for the cost panel while direct deposit is selected.
    effect(
      () => {
        if (!this.isDirectDeposit()) {
          return;
        }
        const cost = this.cost();
        const quoting = this.quoting();
        untracked(() => this.fees.setMailQuote(cost, !cost && quoting, quoting));
      },
      { allowSignalWrites: true }
    );

  }

  newPayment(): void {
    this.resetIdempotencyKey();
    this.walletBypassing.set(true);
    this.cost.set(null);
    this.serverBlockers.set([]);
  }

  // ── Send ──

  /** Creates the cheque and deposits it, in one call. 422 throws — read `error.blockers`. */
  send(
    acknowledgements: Record<string, number | boolean> = {}
  ): Observable<ICheckDeliveryResponse> {
    return this.checks.sendCheckDirectDeposit(
      this.envelope(false, acknowledgements),
      this.sendHeaders()
    ) as Observable<ICheckDeliveryResponse>;
  }

  // ── Payload ──

  protected attachmentIds(): string[] {
    return this.fees.attachmentIds();
  }

  private envelope(
    quoteOnly: boolean,
    acknowledgements?: Record<string, number | boolean>
  ): Record<string, unknown> {
    return {
      quote_only: quoteOnly,
      payment: this.paymentBlock(),
      direct_deposit: this.depositBlock(),
      // Only ever sent in answer to a resolvable blocker; never on a quote.
      ...(acknowledgements && Object.keys(acknowledgements).length
        ? { acknowledgements }
        : {})
    };
  }

  /**
   * Put a saved deposit back on the form when a cheque is reopened.
   * `GET /zil-payments/{uuid}` carries it as `transfer.direct_deposit_details`.
   *
   * The payee's bank account is named by id alone, and only the payee's own
   * bank list can turn that back into an account, so it is left to whichever
   * rail owns that list rather than guessed at here.
   */
  restoreDirectDeposit(dd: IDirectDepositDetails | undefined | null): void {
    if (!dd) {
      return;
    }

    if (dd.wallet_bypassing != null) {
      this.walletBypassing.set(String(dd.wallet_bypassing) === '1');
    }

    this.state.notifyEmailEnabled.set(!!dd.payee_email);
    if (dd.payee_email) {
      this.state.notifyEmailValue.set(dd.payee_email);
    }
    this.state.notifySmsEnabled.set(Number(dd.send_sms) === 1);
    if (dd.payee_phone) {
      this.state.notifyPhoneValue.set(dd.payee_phone);
    }
  }

  /**
   * The deposit options as `POST /checks` and `PUT /checks/{id}` store them.
   * `mail_check_id` is deliberately absent: the cheque this belongs to is the
   * one being written, and the send call is the only place that names ids.
   */
  directDepositDetails(): IDirectDepositDetails {
    const d = this.details();
    const smsOn = this.state.notifySmsEnabled();

    return {
      // Always sent. `direct-deposit-v4` makes the address a required column and
      // prefills it from the payee: a deposit tells the payee it has happened,
      // and that is not the optional notice the toggle governs — the toggle only
      // says whether the user replaced the address. Gating the field on it sent
      // an empty one on every deposit the user had not opened the notice for.
      payee_email: this.state.effectiveNotifyEmail(),
      // `'0'` is the Master Wallet, which is also what an unchosen account
      // means — a deposit needs no account until the payee withdraws.
      payee_account: this.payeeAccount() || '0',
      wallet_bypassing: this.walletBypassing() ? '1' : '0',
      payee_phone: smsOn ? this.state.effectiveNotifyPhone() : '',
      send_sms: smsOn ? 1 : 0,
      // "Save this to the payee's record", ticked in the notify modal. Gated on
      // the channel for the same reason the value above is.
      save_payee_email: this.state.notifySaveEmail() ? 1 : 0,
      save_payee_phone: smsOn && this.state.notifySavePhone() ? 1 : 0,
      file_hidden: this.attachmentIds(),
      is_same_day: 0,
      ...this.depositSchedule(d)
    };
  }

  /** `recurring` carries the same shape the send API takes, or nothing at all. */
  private depositSchedule(
    d: Record<string, unknown>
  ): Partial<IDirectDepositDetails> {
    if (d.needRecurring) {
      const endSelect = String(Number(d.recurringEndSelect) || 3);
      return {
        is_recurring_value: 1,
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
        recurring: { schedule_date: d.scheduleDate as string }
      };
    }
    return { is_recurring_value: 0, recurring: {} };
  }

  private depositBlock(): Record<string, unknown> {
    const account = this.payeeAccount();

    return {
      ...(account ? { payee_account: account } : {}),
      wallet_bypassing: this.walletBypassing() ? 1 : 0,
      // ponytail: `same_day` is offered by the endpoint but by nothing in the
      // flow it replaces — the legacy modal never sets it. Left off rather than
      // invented; see D2 in docs/send-payment/bank-check-direct-deposit-analysis.md.
      ...(this.state.notifyEmailEnabled()
        ? { email: this.state.effectiveNotifyEmail() }
        : {}),
      sms: this.state.notifySmsEnabled()
        ? { enabled: true, phone: this.state.effectiveNotifyPhone() }
        : { enabled: false },
      ...this.scheduling()
    };
  }
}

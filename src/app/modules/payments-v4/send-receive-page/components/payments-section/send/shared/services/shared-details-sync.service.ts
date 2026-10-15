import { DestroyRef, Injectable, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormGroup } from '@angular/forms';

import { BankCheckService } from '../../bank/services/bank-check.service';
import { BankPaymentService } from '../../bank/services/bank-payment.service';
import { CardPaymentService } from '../../card/services/card-payment.service';
import { WalletPaymentService } from '../../wallet/services/wallet-payment.service';
import { SendStateService } from './send-state.service';

/**
 * The details fields that mean the same thing whichever source is paying. Not
 * every form carries every one, so each is written only into the forms declaring it.
 *
 * Deliberately absent:
 * - `category` and `payeeBankAc`: already shared, via SendStateService signals
 *   (`payeeCategory`, `selectedPayeeBank`) that every source reads and writes back
 *   to — mirroring them here would be a second writer racing the first.
 * - `shippingType` and the recurring schedule: shared *names*, but they describe
 *   how one particular rail runs, and the rail changes with the source.
 * - `payeeNumber`: it belongs to the SMS toggle, not to the payment —
 *   `BankPaymentService.applySmsValidators` blanks and disables it whenever the
 *   toggle is off, so sharing it would fight that rule. Every source already
 *   prefills it from the payee anyway.
 */
const SHARED_FIELDS = [
  'payeeEmail',
  'invoiceNumber',
  'payeeIdNumber',
  'memo'
] as const;

type SharedField = (typeof SHARED_FIELDS)[number];

/**
 * Keeps the shared Additional Details fields in step across the four source forms,
 * so switching pay-from does not make the user retype what they already typed.
 *
 * The four forms live on page-provided source services, so they all exist and hold
 * their values whether or not their component is on screen. That is what makes this
 * a service and not an `@Input`/`@Output`: nothing is ever torn down, so there is
 * nothing to re-seed on mount.
 *
 * Writes use `emitEvent: false`, so a fan-out cannot feed itself. Validation is
 * untouched: a value legal on one source and illegal on the next is carried over as
 * typed, for that source's own validators to object to.
 */
@Injectable()
export class SharedDetailsSyncService {
  private destroyRef = inject(DestroyRef);

  private state = inject(SendStateService);
  private bank = inject(BankPaymentService);
  private bankCheck = inject(BankCheckService);
  private wallet = inject(WalletPaymentService);
  private card = inject(CardPaymentService);

  /**
   * Every details form on the page. A bank has two — zil-payment and check record —
   * and both take a memo, an invoice number and a payee id, so both are kept in step.
   */
  private readonly forms: FormGroup[] = [
    this.bank.detailsForm,
    this.bankCheck.detailsForm,
    this.wallet.detailsForm,
    this.card.detailsForm
  ];

  /** Guards the fan-out against re-entering itself. */
  private writing = false;
  private seededPayeeId: string | null = null;

  constructor() {
    this.mirrorEdits();
    this.seedFromPayee();
  }

  /**
   * What the user types on the source they are on is written straight into the
   * others, so a switch shows the current answer rather than a stale one.
   */
  private mirrorEdits(): void {
    this.forms.forEach((form) => {
      SHARED_FIELDS.forEach((field) => {
        const control = form.get(field);
        if (!control) {
          return;
        }

        control.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((value) => {
            this.fanOut(field, value, form);
            if (field === 'payeeEmail') {
              this.state.detailsPayeeEmail.set(
                typeof value === 'string' ? value : ''
              );
            }
          });
      });
    });
  }

  /**
   * Seed `payeeEmail` and `payeeIdNumber` from the loaded payee. Page-scoped, so it
   * fires on payee change and at no other time — the same effect inside a source
   * component would re-run on every re-create (source switch, method change, panel
   * collapse) and overwrite what the user had typed.
   */
  private seedFromPayee(): void {
    effect(
      () => {
        const payeeId = this.state.payeeId();
        const payee = this.state.payeeDetails();

        const removed = !payeeId && !!this.seededPayeeId;
        this.seededPayeeId = payeeId;

        if (removed) {
          untracked(() => {
            this.fanOut('payeeEmail', '');
            this.fanOut('payeeIdNumber', '');
          });
          return;
        }

        if (!payee) {
          return;
        }

        const info = payee.payee_information;

        untracked(() => {
          this.fanOut('payeeEmail', info?.payee_email ?? '');
          this.fanOut('payeeIdNumber', info?.payee_id_number ?? '');
          // The fan-out is silent, so the mirror above never hears the new
          // payee's own address — and what the last one was given would stand.
          this.state.detailsPayeeEmail.set(info?.payee_email ?? '');
        });
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * Seed the memo into every source form, e.g. the memo the account's default
   * payment carries. Same one-time write as `seedFromPayee`, through the same
   * fan-out — so the card's Purpose dropdown is reconciled the usual way.
   */
  seedMemo(memo: string): void {
    this.fanOut('memo', memo);
  }

  /** Write one field into every form but the one it came from. */
  private fanOut(field: SharedField, value: unknown, from?: FormGroup): void {
    if (this.writing) {
      return;
    }

    this.writing = true;
    this.forms.forEach((form) => {
      if (form !== from) {
        this.write(form, field, value);
      }
    });
    this.writing = false;
  }

  private write(form: FormGroup, field: SharedField, value: unknown): void {
    const control = form.get(field);

    // Not every source declares every shared field, and a control already
    // holding this value has nothing to be told.
    if (!control || control.value === value) {
      return;
    }

    control.setValue(value, { emitEvent: false });

    // On a card the memo *is* the Purpose of Payment, so a memo arriving from another
    // source must be reconciled with the dropdown that owns it: a memo the card offers
    // as a purpose selects it, anything else means `Other` — the one purpose that puts
    // the memo field back on screen. `syncPurposeFromMemo` no-ops on an empty memo, so
    // clearing the field elsewhere cannot force `Other` on an untouched card.
    if (field === 'memo' && form === this.card.detailsForm) {
      this.card.syncPurposeFromMemo();
    }
  }
}

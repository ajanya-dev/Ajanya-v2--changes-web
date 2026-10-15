import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal
} from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, merge, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';

import type {
  ICheckShipingTypes,
  IMailingDetails
} from 'src/app/modules/check/model/check';
import type { IWalletData } from 'src/app/models/wallet';
import { UserService } from 'src/app/shared/service/user/user.service';

import {
  CheckDeliveryBaseService,
  toDeliveryCost,
  type BlockerEntity,
  type ICheckBlocker,
  type ICheckDeliveryResponse,
  type ICheckValidation,
  type IMailAddress
} from './check-delivery-base.service';
import { PaymentFeeService, type ICheckMailCost } from './payment-fee.service';
import { addressDeliveryReason } from '../models/check-delivery';

export type { BlockerEntity, IMailAddress } from './check-delivery-base.service';

/** The shared shapes, under the names the mail callers already import. */
export type ICheckMailBlocker = ICheckBlocker;
export type ICheckMailValidation = ICheckValidation;
export type ICheckMailResponse = ICheckDeliveryResponse;

/** `carrier_id` 2 is FedEx, and FedEx refuses PO Boxes. */
const FEDEX_CARRIER_ID = 2;
const PO_BOX = /\bP\.?\s*O\.?\s*BOX\b/i;
const CANADA = /^(ca|can|canada)$/i;

/**
 * `validate/mailing` answers with one flat message rather than a blocker list,
 * but its message always names the field it is about. Reading that back into an
 * entity keeps the inline chips — "Invalid From Address", "Add your first bank
 * account", the payee prompts — working off the same shape they already speak,
 * instead of collapsing every failure into one page-level sentence.
 */
/** One field-mapped problem, as `validate/mailing` now returns them. */
interface IValidateMailingEntry {
  /** Dot-path into the body we sent. `null` is page-level, and is an answer. */
  field?: string | null;
  code?: string;
  severity?: 'error' | 'warning';
  message?: string;
}

/** What `validate/mailing` answers with when it refuses. */
interface IValidateMailingBody {
  success?: boolean;
  errorMsg?: string;
  errorCode?: number | string;
  errors?: IValidateMailingEntry[];
}

interface IValidateMailingError {
  error?: IValidateMailingBody;
}

/** The one refusal that is premature while no carrier has been chosen yet. */
const SHIPPING_TYPE_ERROR = /shipping type/i;

/**
 * Address-book rows as `cheques/from-address` and `cheques/to-address` hold
 * them. Each row is named twice: `id` encrypted, `dec_id` plain. Which one a
 * field wants is the field's business — `sent-mail` names both ends of a
 * mailing by the plain one, and every other id in the envelope is encrypted.
 */
type IAddressBookRow = { id?: string | number; dec_id?: string | number };

const norm = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

/**
 * Line one and the postcode together are enough to call two rows the same
 * address, and are the two parts a user is least likely to have typed
 * differently. Matching on the whole record would miss a row that differs only
 * by a note, and add a duplicate every time.
 */
function findAddress(
  rows: readonly IAddressBookRow[],
  address: IMailAddress
): IAddressBookRow | null {
  return (
    rows.find((row) => {
      const r = row as Record<string, unknown>;
      return (
        norm(r['address_line_1']) === norm(address.address_line_1) &&
        norm(r['zip']) === norm(address.zip)
      );
    }) ?? null
  );
}

/**
 * The wallet's own return address, as `GET /wallets` carries it. Its keys are a
 * spelling of their own — `address1`, not `address_line_1`.
 */
function toWalletAddress(wallet: IWalletData | null | undefined): IMailAddress | null {
  const address = wallet?.address;
  if (!address?.address1) {
    return null;
  }
  return {
    name: address.name || wallet?.bankAccountName || wallet?.walletName || '',
    address_line_1: address.address1 ?? '',
    address_line_2: address.address2 ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    zip: address.zip ?? '',
    country: address.country || 'US'
  };
}

/** Identity of an address, for noticing that a materialised id is now stale. */
function addressKey(address: IMailAddress | null | undefined): string {
  if (!address) {
    return '';
  }
  return [
    address.name,
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.zip
  ]
    .map((part) => norm(part))
    .join('|');
}

/** An address in the shape `add-mail-address` posts it. */
function addressBookBody(address: IMailAddress): Record<string, unknown> {
  return {
    name: address.name ?? '',
    company_name: '',
    address_line_1: address.address_line_1 ?? '',
    address_line_2: address.address_line_2 ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    zip: address.zip ?? '',
    country: address.country ?? 'US',
    phone: address.phone ?? '',
    email: address.email ?? '',
    note: ''
  };
}

/** The bank record's own printed address, in the shape the book speaks. */
function toBankAddress(bank: Record<string, unknown> | undefined): IMailAddress | null {
  if (!bank) {
    return null;
  }
  return {
    name: String(bank['bank_account_account_name'] ?? bank['name'] ?? ''),
    address_line_1: String(bank['bank_account_address_line_1'] ?? ''),
    address_line_2: String(bank['bank_account_address_line_2'] ?? ''),
    city: String(bank['bank_account_city'] ?? ''),
    state: String(bank['bank_account_state'] ?? ''),
    zip: String(bank['bank_account_zip'] ?? ''),
    country: String(bank['bank_account_country'] ?? 'US')
  };
}

/**
 * Which record each `field` path is about, so a problem can open the thing that
 * caused it. Paths are the API's own, and only the four that name a record are
 * listed — anything else renders where its path puts it.
 */
const FIELD_ENTITIES: Readonly<Record<string, BlockerEntity>> = {
  bankAccount: 'bank_account',
  payee: 'payee',
  'mailingDetails.shipping_from': 'custom_from_address',
  'mailingDetails.shipping_to': 'custom_address'
};

/** The path `validate/mailing` reports a bad payee phone against. */
const PAYEE_PHONE_FIELD = 'mailingDetails.payee_phone';

/** The two carrier fields, by either name. */
const SHIPPING_TYPE_FIELDS: readonly string[] = [
  'mailingDetails.mail_type',
  'mailingDetails.custom_address_shipping_type'
];

/** By field where the API named one, by message only on the legacy shape. */
function isCarrier(b: ICheckMailBlocker): boolean {
  return b.field
    ? SHIPPING_TYPE_FIELDS.includes(b.field)
    : SHIPPING_TYPE_ERROR.test(b.data?.message ?? '');
}

/**
 * The refusal list, as the API sends it. Each entry already knows where it
 * belongs, so this only renames the keys — no message is read to place it.
 */
function fromFieldErrors(
  errors: readonly IValidateMailingEntry[],
  errorCode: number
): ICheckMailBlocker[] {
  return errors.map((e) => {
    const field = e.field ?? null;
    const entity = field ? FIELD_ENTITIES[field] : undefined;

    return {
      code: e.code || 'mailing_invalid',
      resolvable: false,
      severity: e.severity === 'warning' ? 'warning' : 'error',
      field,
      data: {
        message: e.message ?? '',
        ...(errorCode ? { error_code: errorCode } : {}),
        ...(entity ? { entity } : {})
      }
    };
  });
}

const VALIDATION_ENTITIES: readonly {
  test: RegExp;
  entity: BlockerEntity;
}[] = [
  { test: /mail from address/i, entity: 'custom_from_address' },
  { test: /mail to address/i, entity: 'custom_address' },
  { test: /bank account|bank details|ACH\/Direct Deposit/i, entity: 'bank_account' },
  { test: /payee/i, entity: 'payee' }
];

/**
 * The fallback, for a refusal that arrives without `errors`. Reading English to
 * decide where a message goes is what `errors[]` exists to stop; this stays only
 * so an older build still places its four commonest failures.
 */
function toValidationBlockers(
  errorMsg: string,
  errorCode: number
): ICheckMailBlocker[] {
  if (!errorMsg) {
    return [];
  }

  const entity = VALIDATION_ENTITIES.find((rule) =>
    rule.test.test(errorMsg)
  )?.entity;

  return [
    {
      code: 'mailing_invalid',
      resolvable: false,
      severity: 'error',
      data: {
        message: errorMsg,
        ...(errorCode ? { error_code: errorCode } : {}),
        ...(entity ? { entity } : {})
      }
    }
  ];
}

/** One check per envelope — what the group mail modal sends for a single check. */
const SINGLE_MAIL_OPTION = 3;

/** The stock a mailed check prints on; the API defaults to this when it is 0. */
const MAIL_CHECK_PAPER = 7;

/**
 * How long each carrier takes, keyed by the shipping-type id `getShippingType`
 * returns. Same table the working mailing flow prints
 * (`multi-check-mail2.component.ts`) — the carrier list itself carries no timing.
 */
const CARRIER_TIMINGS: Record<number, string> = {
  1: '1-5 business days',
  2: '1-5 business days',
  3: '1-3 business days',
  4: '1 business day',
  5: '2 business days',
  6: '1-5 business days',
  7: '1-3 business days',
  8: '1 business day',
  9: '2 business days',
  10: '1-5 business days',
  11: '1-3 business days',
  12: '1 business day',
  13: '1-5 business days',
  14: '1-3 business days',
  15: '1 business day',
  16: '1-5 business days',
  17: '1 business day',
  18: '7-21 business days',
  19: '3-5 business days'
};

/** Re-price no faster than this while the user is still choosing. */
const QUOTE_DEBOUNCE_MS = 400;

/** Validation is cheaper than a quote and wanted sooner, so it waits less. */
const VALIDATE_DEBOUNCE_MS = 250;

/**
 * `error_code 731` — the account has no bank account at all. The new contract
 * has no blocker code for it yet (doc §19, open product decision), so it is
 * recognised by the legacy numeric code the blocker still carries.
 */
const NO_BANK_ACCOUNT_CODE = 731;

/**
 * The API refuses a street line under 5 characters, a city under 2 and a state
 * that is not exactly 2 — say so here rather than let a quote fail.
 *
 * `strictState` is off for the payee's own record: that address is stored, not
 * typed here, and some payees carry a spelled-out state the API accepts as-is.
 */
export function addressError(
  a: IMailAddress | null,
  strictState = true
): string {
  if (!a) {
    return 'Select a mailing address';
  }
  if ((a.address_line_1 ?? '').trim().length < 5) {
    return 'The mailing address needs a street address';
  }
  if ((a.city ?? '').trim().length < 2) {
    return 'The mailing address needs a city';
  }
  const state = (a.state ?? '').trim();
  if (strictState ? state.length !== 2 : !state) {
    return strictState
      ? 'The mailing address needs a 2-letter state code'
      : 'The mailing address needs a state';
  }
  const zip = (a.zip ?? '').trim();
  if (!zip || zip.length > 12) {
    return 'The mailing address needs a valid ZIP code';
  }
  return '';
}

function isPoBox(a: IMailAddress | null): boolean {
  return PO_BOX.test(`${a?.address_line_1 ?? ''} ${a?.address_line_2 ?? ''}`);
}

/** Everything a mailed check needs beyond the payment itself: where it goes, how
 *  it travels, what it costs, and the one call that creates and mails it.
 *
 *  The quote is free and writes nothing, so it re-runs on every input the API
 *  prices on — carrier, paper, payee SMS, enclosed attachments. */
@Injectable()
export class CheckMailService extends CheckDeliveryBaseService {
  private readonly fees = inject(PaymentFeeService);
  private readonly users = inject(UserService);

  // ── Selection ──

  /** The destination. `null` means "the payee's own address". */
  readonly toAddress = signal<IMailAddress | null>(null);
  /** The printed sender. `null` means "the bank account's address". */
  readonly fromAddress = signal<IMailAddress | null>(null);

  /** Encrypted address-book ids, only so the edit dialogs know what to open. */
  readonly savedToId = signal<string | null>(null);
  readonly savedFromId = signal<string | null>(null);

  /**
   * The same two rows by their plain id, which is what `sent-mail` names them
   * by. A book row carries both and they are not interchangeable, so whoever
   * chooses a row records both — the id it is opened and matched by, and the
   * number it is mailed by.
   */
  readonly savedToDecId = signal<number | null>(null);
  readonly savedFromDecId = signal<number | null>(null);

  readonly shippingTypeId = signal<number | null>(null);

  /** Which of the payment's attachments ride inside the envelope. */
  readonly envelopeAttachmentIds = signal<string[]>([]);

  // ── Carriers ──

  readonly carriers = signal<ICheckShipingTypes[]>([]);
  readonly carriersLoading = signal(false);

  /** This account has never mailed a check, so the first one is on us. */
  readonly firstMailFree = signal(false);

  /** What one payee SMS costs. Priced per message, so this is the whole line. */
  private readonly smsUnitCost = signal(0);
  private addressSourceId: string | null = null;

  loadCarriers(): void {
    this.loadSmsCost();
    this.loadFirstMailFree();

    if (this.carriers().length || this.carriersLoading()) {
      return;
    }
    this.carriersLoading.set(true);
    this.checks
      .getShippingType()
      .pipe(
        finalize(() => this.carriersLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => this.carriers.set(res?.data ?? []),
        error: () => undefined
      });
  }

  /**
   * Read the list again, whatever is already held. `loadCarriers` is a one-shot
   * — it stops the same fetch running per delivery switch — but the account's
   * default lives on these rows as `is_default_mailing_type`, so a settings
   * change rewrites the answer and nothing local can tell.
   */
  reloadCarriers(): void {
    this.carriers.set([]);
    this.loadCarriers();
  }

  readonly selectedCarrier = computed(
    () => this.carriers().find((c) => c.id === this.shippingTypeId()) ?? null
  );

  /** How long the chosen carrier takes. Empty for one the table does not know. */
  readonly selectedCarrierTiming = computed(() => {
    const id = this.selectedCarrier()?.id;
    return id != null ? (CARRIER_TIMINGS[id] ?? '') : '';
  });

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
          const raw =
            data && typeof data === 'object' ? data.amount : data;
          this.smsUnitCost.set(Number(raw) || 0);
        },
        // No price, no SMS line — better than inventing one.
        error: () => this.smsUnitCost.set(0)
      });
  }

  private firstMailFreeLoaded = false;

  private loadFirstMailFree(): void {
    if (this.firstMailFreeLoaded) {
      return;
    }
    this.firstMailFreeLoaded = true;
    this.users.userOverallData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.firstMailFree.set(res.checkMailExist === 0);
        }
      });

    if (this.users.userOverallData.value) {
      return;
    }
    this.users
      .getUserOverallData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.users.userOverallData.next(res.data);
          }
        },
        error: () => undefined
      });
  }

  // ── Addresses ──

  /** The payee's stored address, as an `IMailAddress`. */
  readonly payeeAddress = computed<IMailAddress | null>(() => {
    const info = this.state.payeeDetails()?.payee_information;
    if (!info) {
      return null;
    }
    return {
      name: info.payee_nick_name || info.payee_name || '',
      address_line_1: info.payee_address_line_1 ?? '',
      address_line_2: info.payee_address_line_2 ?? '',
      city: info.payee_city ?? '',
      state: info.payee_state ?? '',
      zip: info.payee_zip ?? '',
      country: info.payee_country ?? 'US',
      email: info.payee_email ?? '',
      phone: info.payee_phone ?? ''
    };
  });

  /** What the check is actually addressed to — the custom one wins. */
  readonly destination = computed<IMailAddress | null>(
    () => this.toAddress() ?? this.payeeAddress()
  );

  // ── Address ids for a custom mailing ──

  /**
   * `sent_to_customer_address: 1` is an id-only contract: it wants a
   * `shipping_from` AND a `shipping_to` that both exist in the address book,
   * and refuses either as `""`. Only one side is normally custom — the other is
   * the bank account's own address or the payee's, and neither of those has an
   * id, because they live on their own records rather than in the book.
   *
   * So the missing side is materialised. A matching row is reused before one is
   * added, or a repeat payment to the same payee would leave the user's
   * "Mail to" list full of copies of them.
   */
  private readonly resolvedToId = signal<string | null>(null);
  private readonly resolvedFromId = signal<string | null>(null);
  /** The same rows by plain id — `bookId` reads both off the row it settles on. */
  private readonly resolvedToDecId = signal<number | null>(null);
  private readonly resolvedFromDecId = signal<number | null>(null);
  readonly resolvingAddressIds = signal(false);

  /**
   * A mailing read back off a reopened cheque, still holding its two addresses
   * as ids. Only the delivery block can turn an id back into an address, so it
   * takes this and clears it.
   */
  readonly savedMailing = signal<IMailingDetails | null>(null);

  /** Set once a reopened cheque has spoken for the notice channels. */
  private notifyRestored = false;

  /**
   * Put the mailing saved on a cheque back on the form. Everything the cheque
   * carries is restored — without this an edit reopened on the defaults and
   * quietly re-mailed on a carrier the user never picked.
   */
  restoreMailing(md: IMailingDetails | undefined | null): void {
    if (!md) {
      return;
    }

    const carrier =
      md.sent_to_customer_address === 1
        ? Number(md.custom_address_shipping_type) || Number(md.mail_type)
        : Number(md.mail_type);
    if (carrier) {
      this.shippingTypeId.set(carrier);
    }

    this.envelopeAttachmentIds.set(md.file_hidden ?? []);

    // The cheque's own answer wins over the per-payee default, which would
    // otherwise switch the notice back on the first time the payee resolves.
    this.notifyRestored = true;
    this.state.notifyEmailEnabled.set(md.informed_payee_email === 1);
    this.state.notifySmsEnabled.set(md.informed_payee_sms === 1);
    if (md.payee_email) {
      this.state.notifyEmailValue.set(md.payee_email);
    }
    if (md.payee_phone) {
      this.state.notifyPhoneValue.set(md.payee_phone);
    }

    this.savedMailing.set(md);
  }

  /** Custom mailing is on as soon as either side stops being its default. */
  readonly isCustomMailing = computed(
    () => !!this.toAddress() || !!this.fromAddress()
  );

  /** A cheque printed from a wallet: both ends fixed, no address book involved. */
  readonly isWalletPrint = computed(
    () =>
      this.state.sourceId() === 'wallet' &&
      this.state.methodId() === 'check_print'
  );

  private shippingToId(): string {
    return this.savedToId() ?? this.resolvedToId() ?? '';
  }

  private shippingFromId(): string {
    return this.savedFromId() ?? this.resolvedFromId() ?? '';
  }

  /** Both ends by plain id, as `sent-mail` names them — a number, not a string. */
  shippingDecIds(): { from: number | null; to: number | null } {
    return {
      from: this.savedFromDecId() ?? this.resolvedFromDecId(),
      to: this.savedToDecId() ?? this.resolvedToDecId()
    };
  }

  private readonly walletValue = toSignal(
    this.state.coreForm.controls.wallet.valueChanges.pipe(
      startWith(this.state.coreForm.controls.wallet.value)
    ),
    { initialValue: null }
  );

  /**
   * The sender a cheque drawn on this wallet prints. `GET /wallets` carries it
   * on the wallet itself, so unlike a bank account's it costs no lookup.
   */
  readonly walletAddress = computed(() => toWalletAddress(this.walletValue()));

  /**
   * The pair as the id-only contract wants it. A rail that keeps the two ends on
   * its own form — the wallet does — mirrors this rather than tracking which
   * side the user chose and which one was materialised for them.
   */
  readonly customAddressIds = computed(() => ({
    from: this.shippingFromId(),
    to: this.shippingToId()
  }));

  /**
   * True while a custom mailing is still missing one of its two ids. Nothing may
   * be validated, priced or sent in that state — the API would refuse it with
   * "Please select mail from address", which is not something the user did.
   */
  readonly mailAddressIdsPending = computed(
    () =>
      this.isCustomMailing() &&
      (!this.shippingToId() || !this.shippingFromId())
  );

  /**
   * Fills in whichever id the custom contract needs and the form has not got.
   * Runs on entering custom mailing, which is a deliberate choice by the user,
   * rather than on every keystroke — this writes to the address book.
   */
  private resolveAddressIds(): void {
    // A wallet's printed cheque offers no address choice, so it has nothing to
    // materialise. Without this, a custom address carried over from the Mail
    // tile still wrote to the book while Print was selected.
    if (this.isWalletPrint() || !this.isCustomMailing() || this.resolvingAddressIds()) {
      return;
    }

    // A materialised row belongs to the address it was made from. Switch the
    // payee, or the account the cheque is drawn on, and the row already held is
    // someone else's — keeping it mails the cheque to the previous payee.
    this.dropStaleResolvedIds();

    const needsTo = !this.shippingToId();
    const needsFrom = !this.shippingFromId();
    if (!needsTo && !needsFrom) {
      return;
    }

    this.resolvingAddressIds.set(true);

    // Resolved in order, never together, and the side being materialised is
    // told which row the other already holds so it cannot take the same one.
    // `findAddress` calls two rows the same address on street and postcode
    // alone — which a company and its own bank share, and a payee in the same
    // building too — so without this the two ends collapse onto one id and the
    // cheque goes out with the destination printed as its return address.
    //
    // When only one end is missing, the other is already chosen and is what the
    // missing one must avoid. When both are, the destination goes first and the
    // sender avoids whatever it took.
    const to$ = needsTo
      ? this.ensureToId(needsFrom ? '' : this.shippingFromId())
      : of(this.shippingToId());

    to$
      .pipe(
        switchMap((to) =>
          (needsFrom ? this.ensureFromId(to) : of(this.shippingFromId())).pipe(
            map((from) => ({ to, from }))
          )
        ),
        finalize(() => this.resolvingAddressIds.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ to, from }) => {
        if (to) {
          this.resolvedToId.set(to);
        }
        if (from) {
          this.resolvedFromId.set(from);
        }
      });
  }

  private resolvedToKey = '';
  private resolvedFromKey = '';

  /**
   * Identity of whatever the cheque is sent from. A typed address and a wallet
   * are both addresses; a bank account's is fetched, so the account itself is
   * what stands in for it.
   */
  private senderKey(): string {
    const custom = this.fromAddress();
    if (custom) {
      return addressKey(custom);
    }
    if (this.state.sourceId() === 'wallet') {
      return addressKey(this.walletAddress());
    }
    return `account:${this.state.coreForm.controls.bankAc.value?.id ?? ''}`;
  }

  private dropStaleResolvedIds(): void {
    const toKey = addressKey(this.toAddress() ?? this.payeeAddress());
    if (this.resolvedToId() && toKey !== this.resolvedToKey) {
      this.resolvedToId.set(null);
    }
    this.resolvedToKey = toKey;

    // The sender is only an address once it is a custom one; otherwise it is
    // whichever record the source names, and that record's identity is the key.
    const fromKey = this.senderKey();
    if (this.resolvedFromId() && fromKey !== this.resolvedFromKey) {
      this.resolvedFromId.set(null);
    }
    this.resolvedFromKey = fromKey;
  }

  /**
   * The book's id for an address, adding it if the book has not got it. The
   * mailing contract names both ends by id, and only the book issues them.
   */
  private bookId(
    address: IMailAddress | null | undefined,
    book: 'to' | 'from',
    excludeId = ''
  ): Observable<string> {
    if (!address?.address_line_1) {
      return of('');
    }

    const rows =
      book === 'to'
        ? this.checks.getAddressTo(this.quietHeaders())
        : this.checks.getAddressFrom(this.quietHeaders());

    return rows.pipe(
      catchError(() => of(null)),
      switchMap((res) => {
        const candidates = excludeId
          ? (res?.data ?? []).filter((row) => String(row.id) !== excludeId)
          : (res?.data ?? []);
        const match = findAddress(candidates, address);
        if (match) {
          this.setResolvedDecId(book, match.dec_id);
          return of(String(match.id));
        }
        // The user did not ask for an address-book entry, they asked to post a
        // cheque — so a refusal here has to be handed back to them with the
        // body that caused it. There is no row to reopen: it was never made.
        const body = addressBookBody(address);
        const created =
          book === 'to'
            ? this.checks.addMailTo(body)
            : this.checks.addMailFrom(body);
        return created.pipe(
          catchError((err: unknown) => {
            const reason = addressDeliveryReason(err);
            if (reason) {
              this.state.addressDeliveryError.set({ reason, book, address: body });
            }
            return of(null);
          }),
          switchMap((row) => {
            const createdId = String(
              (row as { data?: unknown } | null)?.data ?? ''
            );
            if (!createdId) {
              return of('');
            }
            // A create answers with the encrypted id alone, and the plain one
            // is what names the row on the wire — so the book is read back for
            // the row just made. This is the end the user did not choose, and
            // without it a custom mailing goes out naming only the other.
            const reread =
              book === 'to'
                ? this.checks.getAddressTo(this.quietHeaders())
                : this.checks.getAddressFrom(this.quietHeaders());

            return reread.pipe(
              catchError(() => of(null)),
              map((again) => {
                const made = (again?.data ?? []).find(
                  (candidate) => String(candidate.id) === createdId
                );
                this.setResolvedDecId(book, made?.dec_id);
                return createdId;
              })
            );
          })
        );
      })
    );
  }

  private setResolvedDecId(book: 'to' | 'from', decId: unknown): void {
    const value = Number(decId);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    if (book === 'to') {
      this.resolvedToDecId.set(value);
      return;
    }
    this.resolvedFromDecId.set(value);
  }

  /**
   * The destination: the address the user typed, or the payee's own.
   *
   * `takenId` is the row the sender already holds, when the user chose that end
   * and this is the one being materialised — see `ensureFromId`.
   */
  private ensureToId(takenId = ''): Observable<string> {
    return this.bookId(this.toAddress() ?? this.payeeAddress(), 'to', takenId);
  }

  /**
   * The printed sender: the address the user typed, or the paying bank's.
   *
   * `takenId` is the row the destination resolved to. The sender may not reuse
   * it: both books are matched on street and postcode alone, so the bank's own
   * address can land on the row just written for the payee, and the cheque
   * would go out with the destination printed as its return address.
   */
  private ensureFromId(takenId = ''): Observable<string> {
    const custom = this.fromAddress();
    if (custom) {
      return this.bookId(custom, 'from', takenId);
    }

    // A wallet carries its own return address on the list that named it, so it
    // needs no lookup at all — only a bank cheque has to go and read the
    // account record it is drawn on.
    if (this.state.sourceId() === 'wallet') {
      return this.bookId(this.walletAddress(), 'from', takenId);
    }

    const bankId = this.state.coreForm.controls.bankAc.value?.id;
    if (!bankId) {
      return of('');
    }

    return this.checks.getbank({ ids: [bankId] }).pipe(
      catchError(() => of(null)),
      switchMap((bank) =>
        this.bookId(toBankAddress(bank?.data?.[0]), 'from', takenId)
      )
    );
  }

  /**
   * The one gate the delivery-method row waits on: until an address is chosen AND
   * it holds together, no carrier can be priced or picked.
   */
  readonly destinationError = computed(() => {
    const custom = this.toAddress();
    if (custom) {
      return addressError(custom);
    }
    const payee = this.payeeAddress();
    if (!payee) {
      return 'Select a payee, or a custom mailing address';
    }
    const error = addressError(payee, false);
    return error ? "This payee's address is incomplete — edit it or use a custom address" : '';
  });

  readonly destinationValid = computed(() => !this.destinationError());

  /**
   * FedEx will not take a shipment without a phone number for the recipient —
   * `payee_phone_required` (215), and not resolvable: the user has to go and add
   * one. The destination's own phone counts when the check is going to a typed
   * address; otherwise it is the payee's record that carries it.
   */
  readonly fedexNeedsPhone = computed(() => {
    if (this.selectedCarrier()?.carrier_id !== FEDEX_CARRIER_ID) {
      return false;
    }
    const phone =
      this.destination()?.phone?.trim() || this.payeeAddress()?.phone?.trim();
    return !phone;
  });

  /** A custom return address is validated the same way; the account's is the API's to check. */
  readonly returnAddressError = computed(() => {
    const from = this.fromAddress();
    return from ? addressError(from) : '';
  });

  // ── Server-side validation (`POST /cheques/validate/mailing`) ──

  /**
   * What the server says about the bank account, payee and amount on the form.
   * The envelope is still partial — it answers before a carrier is chosen — but
   * never emptier than a cheque the server would refuse for being blank. The
   * successor to the old cheque-bound validate/bank + validate/check.
   */
  readonly serverBlockers = signal<ICheckMailBlocker[]>([]);
  readonly validating = signal(false);

  private blockerFor(...entities: BlockerEntity[]): ICheckMailBlocker | null {
    return (
      this.serverBlockers().find(
        (b) => !!b.data?.entity && entities.includes(b.data.entity)
      ) ?? null
    );
  }

  /** The bank account's own address is unusable — "Invalid From Address". */
  readonly bankBlocker = computed(() => this.blockerFor('bank_account'));

  /** The destination is unusable — "Invalid To Address", payee or typed. */
  readonly destinationBlocker = computed(() =>
    this.blockerFor('payee', 'custom_address')
  );

  /** The typed return address is unusable. */
  readonly returnAddressBlocker = computed(() =>
    this.blockerFor('custom_from_address')
  );

  /** The account has no bank account at all — offer to go and add one. */
  readonly noBankAccount = computed(() =>
    this.serverBlockers().some(
      (b) => b.data?.error_code === NO_BANK_ACCOUNT_CODE
    )
  );

  /** Only `error` stops a submit; `warning` renders inline and lets it through. */
  private readonly blockingServerError = computed(
    () =>
      this.serverBlockers().find((b) => b.severity !== 'warning') ?? null
  );

  /**
   * What the API refused about the carrier itself — "International mail not
   * enabled" among them. It arrives against `mailingDetails.mail_type`, so it
   * belongs under the delivery method; the submit gate only points at the
   * mailing block, and without this the user was sent there to read nothing.
   */
  readonly carrierError = computed(
    () =>
      this.serverBlockers().find(
        (b) => b.severity !== 'warning' && isCarrier(b)
      )?.data?.message ?? ''
  );

  private validateEnvelope(): Record<string, unknown> {
    const core = this.state.coreForm.getRawValue();

    return {
      bankAccount: core.bankAc?.id ?? '',
      payee: core.payee?.id ?? '',
      amount: Number(core.amount) || 0,
      mailingDetails: this.mailingDetails()
    };
  }

  /**
   * Held back until the cheque is worth asking about: a bank account, a payee
   * and an amount. Asked any earlier the server answers about what has not been
   * filled in yet — a blank cheque cannot be mailed — and the user reads their
   * own unfinished form back as a server error.
   */
  private validate(): Observable<unknown> {
    const core = this.state.coreForm.getRawValue();

    // A custom mailing with an id still being made would be refused for the one
    // reason the user cannot act on, so it waits for the id rather than
    // reporting "Please select mail from address" against a chosen address.
    if (
      !this.isMail() ||
      !core.bankAc?.id ||
      !core.payee?.id ||
      !(Number(core.amount) > 0) ||
      this.mailAddressIdsPending()
    ) {
      this.serverBlockers.set([]);
      return EMPTY;
    }

    this.validating.set(true);

    return this.checks.validateMailing(this.validateEnvelope()).pipe(
      // A refusal is a 422, so the body arrives on the error branch. Only a
      // transport failure reaches here with nothing, and that must not invent
      // a blocker the server never raised.
      catchError((err: IValidateMailingError) => of(err?.error ?? null)),
      finalize(() => this.validating.set(false)),
      switchMap((res: IValidateMailingBody | null) => {
        const errorCode = Number(res?.errorCode) || 0;
        let found: ICheckMailBlocker[] = [];
        if (res && res.success === false) {
          found = res.errors?.length
            ? fromFieldErrors(res.errors, errorCode)
            : toValidationBlockers(res.errorMsg ?? '', errorCode);
        }

        // The carrier is validated whenever its field is sent, and the form
        // sends it empty until one is picked. The form already says "Select a
        // delivery method" in that state, and repeating it as a server error
        // would bury the bank and payee problems this call runs early to catch.
        this.serverBlockers.set(
          this.shippingTypeId() == null ? found.filter((b) => !isCarrier(b)) : found
        );
        return EMPTY;
      })
    );
  }

  /**
   * Ask `validate/mailing` about a phone number the notify modal is still
   * holding. The page's own validation runs on what is on the form; this runs
   * on what has just been typed, so the modal can refuse it in place rather
   * than accept it and fail at submit.
   *
   * It answers with a message or null, and touches no state of its own — the
   * blockers the page renders stay whatever the form's last validation found.
   */
  validateNotifyPhone(phone: string): Observable<string | null> {
    const core = this.state.coreForm.getRawValue();

    return this.checks
      .validateMailing({
        bankAccount: core.bankAc?.id ?? '',
        payee: core.payee?.id ?? '',
        amount: Number(core.amount) || 0,
        mailingDetails: {
          ...this.mailingDetails(),
          informed_payee_sms: 1,
          payee_phone: phone
        }
      })
      .pipe(
        catchError((err: IValidateMailingError) => of(err?.error ?? null)),
        map((res: IValidateMailingBody | null) => {
          if (!res || res.success !== false) {
            return null;
          }
          const entry = res.errors?.find((e) => e.field === PAYEE_PHONE_FIELD);
          return entry?.message || null;
        })
      );
  }

  /** Re-check after the user has edited the offending record. */
  revalidate(): void {
    this.validateNow$.next();
  }

  private readonly validateNow$ = new Subject<void>();

  // ── Client-side validation ──

  /** The first thing standing between this form and a mailed check, in words. */
  readonly validationError = computed(() => {
    // An address the carrier has already refused outranks anything the form can
    // work out for itself: it is a "no" that has been asked and answered.
    const rejected = this.state.addressDeliveryError();
    if (rejected) {
      return rejected.reason;
    }
    const destination = this.destinationError();
    if (destination) {
      return destination;
    }
    const from = this.returnAddressError();
    if (from) {
      return from.replace('mailing address', 'return address');
    }
    if (this.shippingTypeId() == null) {
      return 'Select a delivery method';
    }

    const carrier = this.selectedCarrier();
    if (carrier?.carrier_id === FEDEX_CARRIER_ID && isPoBox(this.destination())) {
      return 'FedEx does not deliver to a PO Box — choose a USPS delivery method';
    }
    if (
      CANADA.test(this.destination()?.country ?? '') &&
      carrier &&
      !CANADA.test(carrier.country ?? '')
    ) {
      return 'This delivery method does not ship to Canada';
    }
    if (this.fedexNeedsPhone()) {
      return 'FedEx needs a phone number for the recipient — add one, or choose a USPS delivery method';
    }

    // A notification channel with nothing to send to is refused up front by the
    // API, and there is no fallback to the payee record.
    if (this.state.notifySmsEnabled() && !this.state.effectiveNotifyPhone()) {
      return 'Add a phone number for the payee text, or turn the text off';
    }
    if (this.state.notifyEmailEnabled() && !this.state.effectiveNotifyEmail()) {
      return 'Add an email address for the mailing notice, or turn it off';
    }

    // Last: what the server already told us, which the user must go and fix.
    const server = this.blockingServerError();
    if (server) {
      return server.data?.message || 'This check cannot be mailed as addressed';
    }
    return '';
  });

  // ── Quote ──

  /** The API's own quote. Null until it answers — and if it never does. */
  readonly cost = signal<ICheckMailCost | null>(null);
  readonly quoting = signal(false);
  readonly blockers = signal<ICheckMailBlocker[]>([]);

  /**
   * The same four lines, from figures the page already holds: the carrier's own
   * price (the one printed beside it in the dropdown), the SMS unit price, and
   * the attachment fee the payment has already been quoted.
   *
   * It stands in until the quote answers, so the total moves the instant the
   * carrier, the SMS toggle or the attachments do.
   */
  readonly estimate = computed<ICheckMailCost | null>(() => {
    const carrier = this.selectedCarrier();
    if (!carrier) {
      return null;
    }
    const shipping = this.firstMailFree() ? 0 : Number(carrier.amount) || 0;
    const sms = this.state.notifySmsEnabled() ? this.smsUnitCost() : 0;
    const attachments = this.fees.attachmentFee();

    return {
      shipping,
      paper: 0,
      sms,
      attachments,
      total: shipping + sms + attachments
    };
  });

  /** What the cost panel shows: the quote when there is one, the estimate until then. */
  readonly publishedCost = computed<ICheckMailCost | null>(
    () => this.cost() ?? this.estimate()
  );

  private readonly isMail = computed(
    () => this.registry.isBankCheck() && this.state.methodId() === 'check_mail'
  );

  /**
   * Everything the API prices on, plus everything it validates before pricing.
   *
   * The two address ids included: a custom mailing is priced by them, and the
   * end the user did not choose is written to the book in the background. Asked
   * before that comes back, the quote goes out naming one end and is priced as
   * though the mailing were an ordinary one.
   */
  private canQuote(): boolean {
    const core = this.state.coreForm.getRawValue();
    return (
      this.isMail() &&
      !!core.bankAc?.id &&
      !!core.payee?.id &&
      Number(core.amount) > 0 &&
      this.shippingTypeId() != null &&
      this.destinationValid() &&
      !this.resolvingAddressIds() &&
      !this.mailAddressIdsPending()
    );
  }

  /**
   * The payee we have already set the mailing-notice default for. Once set, the
   * toggle is the user's — unticking it in the notify modal has to stick.
   */
  private notifyDefaultedFor: string | null = null;

  /**
   * A mailed check tells the payee it is on its way, so the email notice starts
   * on for any payee that has an address on file — and off for one that does
   * not, since the API refuses `email.enabled` with nothing to send to.
   *
   * Re-runs per payee, not per change, so a deliberate untick survives.
   */
  private defaultNotifyEmail(): void {
    effect(
      () => {
        const isMail = this.isMail();
        const payeeId = this.state.payeeId();
        const details = this.state.payeeDetails();
        const email = details?.payee_information?.payee_email?.trim();

        untracked(() => {
          // The record decides this, so there is nothing to decide until it is
          // in. Claiming the default against a payee still being fetched read
          // its missing email as "no email", turned the notice off, and then
          // barred itself from ever running again for that payee.
          if (
            !isMail ||
            !payeeId ||
            !details ||
            this.notifyRestored ||
            this.notifyDefaultedFor === payeeId
          ) {
            return;
          }
          this.notifyDefaultedFor = payeeId;
          this.state.notifyEmailEnabled.set(!!email);
          this.state.notifySmsEnabled.set(false);
        });
      },
      { allowSignalWrites: true }
    );
  }

  /** The payee the carrier on screen was chosen for. */
  private carrierPayeeId: string | null = null;

  /**
   * A carrier is quoted and validated against where the cheque is going — its
   * country decides which carriers are even offered — so it does not survive the
   * payee changing underneath it. The first payee seen only arms the latch, so a
   * reopened cheque keeps the carrier it was saved with.
   */
  private resetCarrierOnPayeeChange(): void {
    effect(
      () => {
        const payeeId = this.state.payeeId();

        untracked(() => {
          if (!payeeId || this.carrierPayeeId === payeeId) {
            return;
          }
          const hadPayee = !!this.carrierPayeeId;
          this.carrierPayeeId = payeeId;
          if (hadPayee) {
            this.shippingTypeId.set(null);
          }
        });
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * The custom mailing belongs to the rail it was set up on. Switching Pay from
   * kept both ends — so the next rail opened already custom: `isCustomMailing`
   * was still true, which re-raised `isCustomAddress` and `customShipping*` on a
   * form the user had not touched, and dropped First Class from its carriers.
   */
  private resetAddressesOnSourceChange(): void {
    effect(
      () => {
        const source = this.state.sourceId();

        untracked(() => {
          if (!source || this.addressSourceId === source) {
            return;
          }
          const hadSource = !!this.addressSourceId;
          this.addressSourceId = source;
          if (hadSource) {
            this.clearAddresses();
          }
        });
      },
      { allowSignalWrites: true }
    );
  }

  /** Both ends back to their defaults — chosen and materialised alike. */
  clearAddresses(): void {
    this.toAddress.set(null);
    this.fromAddress.set(null);
    this.savedToId.set(null);
    this.savedFromId.set(null);
    this.savedToDecId.set(null);
    this.savedFromDecId.set(null);
    this.resolvedToDecId.set(null);
    this.resolvedFromDecId.set(null);
    this.resolvedToId.set(null);
    this.resolvedFromId.set(null);
    this.resolvedToKey = '';
    this.resolvedFromKey = '';
  }

  constructor() {
    super();
    this.defaultNotifyEmail();
    this.resetCarrierOnPayeeChange();
    this.resetAddressesOnSourceChange();

    // Materialise the missing address id the moment a custom mailing is chosen,
    // so validate, the quote and the send all find it already there.
    effect(
      () => {
        this.isCustomMailing();
        this.toAddress();
        this.fromAddress();
        this.payeeAddress();
        this.walletAddress();
        untracked(() => this.resolveAddressIds());
      },
      { allowSignalWrites: true }
    );

    // One writer for the cost panel while mail is selected: whatever the quote
    // and the estimate currently add up to.
    effect(
      () => {
        if (!this.isMail()) {
          return;
        }
        const cost = this.publishedCost();
        const quoting = this.quoting();
        // The estimate keeps a figure on hand, so `isLoading` stays false — but
        // the panel still has to say the price is being recalculated.
        untracked(() => this.fees.setMailQuote(cost, !cost && quoting, quoting));
      },
      { allowSignalWrites: true }
    );

    // Form-time validation. Fires once a bank account, a payee and an amount
    // are all in hand — and again when the destination or the carrier changes,
    // because deliverability and the PO-box rule both depend on them. The
    // amount only opens the gate; its value is nothing this call rules on, so
    // it triggers on crossing zero rather than on every keystroke.
    merge(
      this.state.coreForm.controls.bankAc.valueChanges,
      this.state.coreForm.controls.payee.valueChanges,
      this.state.coreForm.controls.amount.valueChanges.pipe(
        map((value) => Number(value) > 0),
        distinctUntilChanged()
      ),
      toObservable(this.state.methodId),
      toObservable(this.toAddress),
      toObservable(this.fromAddress),
      toObservable(this.shippingTypeId),
      // Both calls below refuse to run while the two ids are still being
      // resolved, so the moment they settle has to be a trigger of its own —
      // otherwise nothing asks again and the refusal is the final answer.
      toObservable(this.mailAddressIdsPending),
      this.validateNow$
    )
      .pipe(
        debounceTime(VALIDATE_DEBOUNCE_MS),
        switchMap(() => this.validate()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    merge(
      this.state.coreForm.controls.amount.valueChanges,
      this.state.coreForm.controls.bankAc.valueChanges,
      this.state.coreForm.controls.payee.valueChanges,
      toObservable(this.state.methodId),
      toObservable(this.state.payeeDetails),
      toObservable(this.state.notifySmsEnabled),
      toObservable(this.state.notifyPhoneValue),
      toObservable(this.shippingTypeId),
      toObservable(this.toAddress),
      toObservable(this.fromAddress),
      toObservable(this.mailAddressIdsPending),
      toObservable(this.fees.attachmentIds)
    )
      .pipe(
        // The quote on screen was priced for what the form held a moment ago, so
        // it goes the instant anything moves and the estimate takes over again.
        tap(() => this.markStale()),
        debounceTime(QUOTE_DEBOUNCE_MS),
        switchMap(() => this.quote()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /** Drop the stale quote; the estimate keeps a figure on screen meanwhile. */
  private markStale(): void {
    this.cost.set(null);
    this.blockers.set([]);
  }

  /**
   * Price it without writing anything. A blocked quote still carries the cost, so
   * both outcomes land here — the figure is more use to the user than the refusal.
   */
  private quote(): Observable<unknown> {
    if (!this.canQuote()) {
      return EMPTY;
    }

    this.quoting.set(true);

    return this.checks.previewShippingCost(this.mailingDetails()).pipe(
      catchError(() => of(null)),
      finalize(() => this.quoting.set(false)),
      switchMap((res) => {
        this.cost.set(toDeliveryCost(res?.data));
        // This endpoint prices; it does not validate. The blockers it used to
        // carry now come from `validate/mailing`, so leave them alone here
        // rather than clearing what that call found.
        return EMPTY;
      })
    );
  }

  // ── Send ──

  newPayment(): void {
    this.resetIdempotencyKey();
    this.notifyDefaultedFor = null;
    this.notifyRestored = false;
    this.state.notifySaveEmail.set(false);
    this.state.notifySavePhone.set(false);
    this.savedMailing.set(null);
    this.cost.set(null);
    this.blockers.set([]);
    this.serverBlockers.set([]);
    this.clearAddresses();
    this.state.addressDeliveryError.set(null);
    this.shippingTypeId.set(null);
    this.carrierPayeeId = null;
    this.envelopeAttachmentIds.set([]);
  }

  /** Creates the cheque and mails it, in one call. 422 throws — read `error.blockers`. */
  send(
    acknowledgements: Record<string, number | boolean> = {}
  ): Observable<ICheckMailResponse> {
    return this.checks.sendCheckMail(
      this.envelope(false, acknowledgements),
      this.sendHeaders()
    ) as Observable<ICheckMailResponse>;
  }

  // ── Payload ──

  /**
   * The envelope's include/exclude toggle writes this set, so what the panel
   * shows enclosed is what is sent and what is billed.
   */
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
      mail: this.mailBlock(),
      // Only ever sent in answer to a resolvable blocker; never on a quote.
      ...(acknowledgements && Object.keys(acknowledgements).length
        ? { acknowledgements }
        : {})
    };
  }

  /** The addressing half — everything `POST /payments/validate` also accepts. */
  private addressBlock(): Record<string, unknown> {
    const to = this.toAddress();
    const from = this.fromAddress();

    return {
      ship_to: to ? 'custom' : 'payee',
      // ponytail: a book address is re-sent as a custom block rather than by
      // `saved_to_address_id` — that id is a raw `dec_id` while every other id in
      // the envelope is encrypted. Switch to the id if the API ever accepts both.
      ...(to ? { custom_address: to } : {}),
      ship_from: from ? 'custom' : 'account',
      ...(from ? { custom_from_address: from } : {})
    };
  }

  /**
   * The mailing options as `POST /checks/`, `PUT /checks/{id}`,
   * `/cheques/validate/mailing` and `/cheques/preview-shipping-cost` all take
   * them: one flat object for one check. The older group shape keyed each check
   * by its own encrypted id, which a check that does not exist yet cannot have.
   */
  mailingDetails(
    acknowledgements: Partial<
      Pick<
        IMailingDetails,
        'shipping_rate_warning' | 'fedex_cutoff_time_warning'
      >
    > = {}
  ): IMailingDetails {
    const core = this.state.coreForm.getRawValue();
    const toCustom = !!this.toAddress();
    const smsOn = this.state.notifySmsEnabled();
    const emailOn = this.state.notifyEmailEnabled();

    return {
      sent_to_customer_address: toCustom ? 1 : 0,
      // `mail_type` rides along either way — both custom-address examples in the
      // contract still carry it — and a custom destination adds its own carrier
      // field and the two address ids on top.
      ...(this.shippingTypeId() != null
        ? { mail_type: this.shippingTypeId() as number }
        : {}),
      // Both ends are named whenever either one is custom. A custom return
      // address with the payee as the destination is still a custom mailing,
      // and dropping the ids because the destination is the payee's is what
      // "Return address not found" is the answer to.
      //
      // Named by the plain id — a book row carries an encrypted one too, and
      // this pair is not it. Every other caller of these two fields in the app
      // sends `dec_id`, and so does the flow this replaces.
      ...(this.isCustomMailing()
        ? {
            custom_address_shipping_type: this.shippingTypeId() ?? '',
            shipping_from: this.shippingDecIds().from ?? '',
            shipping_to: this.shippingDecIds().to ?? ''
          }
        : {}),
      Single_mail_options: SINGLE_MAIL_OPTION,
      individual_envelope: 0,
      check_paper: MAIL_CHECK_PAPER,
      file_hidden: this.envelopeAttachmentIds(),
      informed_payee_email: emailOn ? 1 : 0,
      informed_payee_sms: smsOn ? 1 : 0,
      // Only sent when its channel is on: the API validates them whenever the
      // matching flag is 1, and has no fallback to the payee record.
      payee_email: emailOn ? this.state.effectiveNotifyEmail() : '',
      payee_phone: smsOn ? this.state.effectiveNotifyPhone() : '',
      save_payee_email: emailOn && this.state.notifySaveEmail() ? 1 : 0,
      save_payee_phone: smsOn && this.state.notifySavePhone() ? 1 : 0,
      bank_account_id: core.bankAc?.id ?? '',
      all_check_ids: [],
      shipping_rate_warning: 0,
      fedex_cutoff_time_warning: 0,
      ...this.mailSchedule(),
      ...acknowledgements
    };
  }

  /**
   * Schedule and recurring in this API's own names. `end_select` happens to use
   * the same scale as our modal — 1 a set number of payments, 2 an end date,
   * anything else until cancelled — so it passes straight through.
   */
  private mailSchedule(): Partial<IMailingDetails> {
    const d = this.details();

    if (!d.needRecurring) {
      return { schedule_date: (d.scheduleDate as string) || '' };
    }

    const endSelect = Number(d.recurringEndSelect) || 3;
    return {
      // The user's tick, not a constant: it decides whether the payment being
      // made now counts as the first of the series.
      recurring_include_check: d.recurringIncludeCheck !== false,
      frequency: Number(d.recurringFrequency) || 3,
      start_date: (d.recurringStartDate as string) || '',
      end_select: endSelect,
      // Each end option carries only its own field; the other would contradict it.
      count: endSelect === 1 ? Number(d.recurringCount) || 0 : '',
      until: endSelect === 2 ? (d.recurringUntil as string) || '' : ''
    };
  }

  private mailBlock(): Record<string, unknown> {
    const smsOn = this.state.notifySmsEnabled();
    const emailOn = this.state.notifyEmailEnabled();

    return {
      shipping_type: this.shippingTypeId(),
      ...this.addressBlock(),
      // `phone` and `address` are REQUIRED when their channel is on — there is no
      // fallback to the payee record, and sending one without the other is
      // refused up front.
      sms: smsOn
        ? { enabled: true, phone: this.state.effectiveNotifyPhone() }
        : { enabled: false },
      email: emailOn
        ? { enabled: true, address: this.state.effectiveNotifyEmail() }
        : { enabled: false },
      ...this.scheduling()
    };
  }
}

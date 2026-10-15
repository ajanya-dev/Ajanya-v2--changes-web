import { Injectable, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IBankDropdown } from 'src/app/models/bank';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IWalletData } from 'src/app/models/wallet';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
  IPayeeDropdown,
  IPayeeModalData,
  IPayeeView,
  IPayeeViewBank,
  IPayeeViewInfo
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IPaymentDetails } from 'src/app/modules/payments/model/payments';
import { LET_VENDOR_DECIDE_ID } from 'src/app/modules/payments/model/pay-as-options';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  SendMode,
  SendReceivePageService
} from 'src/app/modules/payments-v4/send-receive-page/services/send-receive-page.service';
import { IPayFromSource } from 'src/app/shared/components/v4/dropdowns/pay-from-dropdown-v4/pay-from-dropdown-v4.component';
import { IPaymentMethodOption } from 'src/app/shared/components/v4/dropdowns/payment-method-dropdown-v4/payment-method-dropdown-v4.component';
import {
  CHECK_ACH_METHOD_ID,
  CHECK_WHITE_PRINT_METHOD_ID,
  CheckDeliveryId,
  deliveryToMethodId,
  methodIdToDelivery,
  paymentMethodToMethodId,
  type IAddressDeliveryFailure
} from '../models/check-delivery';
import { invalidControlKeys } from '../../field-focus/invalid-fields';

/** The five parts a mailable address needs, none of them blank. */
function isCompleteAddress(parts: readonly (string | undefined | null)[]): boolean {
  return parts.every((part) => !!part?.toString().trim());
}

/** The same five off the payee row the dropdown holds. */
function selectedPayeeAddress(
  payee: IPayeeDropdown | null | undefined
): readonly (string | undefined | null)[] {
  return [
    payee?.addressLine1,
    payee?.city,
    payee?.state,
    payee?.country,
    payee?.zip
  ];
}

/** The pay-as option that fans out into the check-delivery tiles. */
const CHECK_OPTION_ID = 'check';

/** Preselected tile, so "Check" always resolves to a submittable method. */
const DEFAULT_CHECK_DELIVERY: CheckDeliveryId = 'mail';

/** Methods whose API rejects anything under $10. */
const HIGH_MIN_AMOUNT_METHODS = ['international-payment', 'virtual-card'];

/** What those methods — and every card payment — refuse to go under. */
const HIGH_MIN_AMOUNT = environment.isItDev ? 0.01 : 10;

/** International refuses anything under $10. */
export const INTL_MIN_AMOUNT = 10;

/** Core controls in the order the user reads them down the page. */
const CORE_FIELD_ORDER = ['amount', 'payFrom', 'payee', 'payAs', 'bankAc', 'card', 'wallet'] as const;

export interface ICoreForm {
  payFrom: FormControl<IPayFromSource | null>;
  payAs: FormControl<IPaymentMethodOption | null>;
  amount: FormControl<string | null>;
  payee: FormControl<IPayeeDropdown | null>;
  wallet: FormControl<IWalletData | null>;
  bankAc: FormControl<IBankDropdown | null>;
  card: FormControl<IExistingCreditCards | null>;
}

/**
 * The order the methods are offered in, per source. Fixed rather than sorted:
 * a list that reshuffles as flags resolve gives the user nothing to learn, and
 * an unavailable method still belongs where they expect to find it.
 */
/** The one method the backend cannot store as a default payment. */
const LET_PAYEE_DECIDE = 'let-payee-choose';

const METHOD_ORDER: Record<string, readonly string[]> = {
  bankaccount: [
    'let-payee-choose',
    'check',
    'ach',
    'same-ach',
    'wire',
    'virtual-card',
    'international-payment',
    'rtp'
  ],
  card: [
    'let-payee-choose',
    'ach',
    'wire',
    'check_mail',
    'same-ach',
    'virtual-card',
    'international-payment',
    'rtp'
  ]
};

/**
 * `payOptions` in the order above, each carrying its own reason for being
 * unavailable. Card drops `check_print`.
 *
 * A method that is offered from the Wallet is deliberately not locked: it is
 * selectable, and choosing it offers to move the payment to the Wallet. Locking
 * it would put a row on screen that explains itself and then refuses to be
 * clicked.
 */
function buildPayAsItems(
  source: IPayFromSource | null | undefined,
  isLocked: (method: IPaymentMethodOption) => boolean = (m) => !!m.locked,
  toolTipFor: (method: IPaymentMethodOption) => string = () => ''
): IPaymentMethodOption[] {
  const order = METHOD_ORDER[source?.id ?? ''] ?? [];
  const rank = (id: string): number => {
    const at = order.indexOf(id);
    return at === -1 ? order.length : at;
  };

  const options = (source?.payOptions ?? [])
    .map((method) => {
      const locked = isLocked(method);
      return {
        ...method,
        locked,
        disableStar: method.id === LET_PAYEE_DECIDE,
        toolTip: toolTipFor({ ...method, locked })
      };
    })
    .sort((a, b) => rank(a.id) - rank(b.id));

  return source?.id === 'card'
    ? options.filter((m) => m.id !== 'check_print')
    : options;
}

/** `IPaymentDetails.sourceType` -> pay-from id. */
function sourceIdOf(d: IPaymentDetails): string {
  return (
    { BANK: 'bankaccount', WALLET: 'wallet', CARD: 'card', CLOUD: 'cloud' }[
      d.sourceType
    ] ?? 'wallet'
  );
}

/** `transferTypeCode` -> method id. The same mapping for both EDIT and CLONE. */
function methodIdOf(d: IPaymentDetails): string {
  const source = sourceIdOf(d);

  switch (d.transferTypeCode) {
    case 'check':
    case 'checkMail': {
      // The payment itself says how the check went out, whichever screen wrote
      // it. That names the tile outright, print paper included.
      const reported = paymentMethodToMethodId(d.paymentMethod);

      if (source === 'bankaccount') {
        if (reported) {
          return reported;
        }
        // Older payments only carry the delivery tile in the metadata. Without
        // it there is nothing to restore, and `check` opens on the default tile.
        const delivery = d.metadata?.paymentMethod ?? '';
        if (methodIdToDelivery(delivery)) {
          return delivery;
        }
        // A cheque written through the new endpoints carries the options for
        // whichever way it went out instead, and having any at all is what
        // names the tile — reopening on no tile lost the whole delivery.
        const transfer = d.transfer as
          | {
              mailing_details?: unknown;
              echeck_details?: unknown;
              direct_deposit_details?: unknown;
              print_details?: { paper_type?: number | string | null };
            }
          | undefined;
        if (transfer?.mailing_details) {
          return 'check_mail';
        }
        if (transfer?.echeck_details) {
          return 'check_email';
        }
        if (transfer?.direct_deposit_details) {
          return CHECK_ACH_METHOD_ID;
        }
        if (transfer?.print_details) {
          return paymentMethodToMethodId({
            method: 'print',
            type: transfer.print_details.paper_type
          }) ?? 'check_print';
        }
        return 'check';
      }
      if (source === 'card' || d.transferTypeCode === 'checkMail') {
        return 'check_mail';
      }
      // The wallet lists each delivery as its own pay-as option and has no
      // paper tiles, so a white-paper print reopens as the plain print option.
      if (reported === CHECK_WHITE_PRINT_METHOD_ID) {
        return 'check_print';
      }
      if (reported && reported !== CHECK_ACH_METHOD_ID) {
        return reported;
      }
      return d.metadata?.paymentMethod === 'check_email'
        ? 'check_email'
        : 'check_print';
    }

    case 'internationalWire':
      return source === 'cloud' ? 'international' : 'wire';
    case 'virtualCard':
    case 'giftCard':
      return 'virtual-card';
    case 'internationalPayment':
      return 'international-payment';
    // `zilWallet` is what the rail used to be called; rows saved under the old
    // name still open on the vendor-decide tile.
    case LET_VENDOR_DECIDE_ID:
    case 'zilWallet':
      return 'let-payee-choose';
    default:
      return d.transferTypeCode;
  }
}

/**
 * The core Send fields plus the payee data every source needs, provided at
 * SendComponent level. No payment logic — that lives in each source's service.
 */
export interface IMissingPayeeField {
  key: string;
  label: string;
  modalType: string;
}

@Injectable()
export class SendStateService {
  private payments = inject(PaymentsService);
  private localStorage = inject(LocalStorageService);
  private checks = inject(CheckService);
  private page = inject(SendReceivePageService);

  readonly coreForm = new FormGroup<ICoreForm>({
    payFrom: new FormControl<IPayFromSource | null>(null),
    payAs: new FormControl<IPaymentMethodOption | null>(
      null,
      Validators.required
    ),
    amount: new FormControl<string | null>('', [
      Validators.required,
      Validators.min(0.01)
    ]),
    payee: new FormControl<IPayeeDropdown | null>(null, Validators.required),
    wallet: new FormControl<IWalletData | null>(null),
    bankAc: new FormControl<IBankDropdown | null>(null),
    card: new FormControl<IExistingCreditCards | null>(null)
  });

  /**
   * The e-cheque's own recipient field, mirrored here by CheckEmailService.
   * `missingPayeeFields` cannot read that service — it is the one that reads
   * this — so the address is handed over rather than fetched.
   */
  readonly deliveryEmail = signal('');

  /** The Additional Details `payeeEmail`, mirrored by SharedDetailsSyncService. */
  readonly detailsPayeeEmail = signal('');

  /**
   * What the SELECTED payee lacks for the CHOSEN method — not a bare "is the
   * email empty" check. Print needs nothing, mail needs an address, a virtual
   * card needs email OR phone. Bank-account and wire-enablement gaps are
   * deliberately absent: the payee-bank dropdown owns those through its own add
   * affordances.
   */
  readonly missingPayeeFields = computed<IMissingPayeeField[]>(() => {
    // The record is being re-read — after the payee modal saved, typically.
    // What is held is the version the user has just corrected, so reporting its
    // gaps refused the payment and shook the field for the seconds the fetch
    // took, over details that were already fixed.
    if (this.payeeRefreshing()) {
      return [];
    }

    const info = this.payeeDetails()?.payee_information;
    if (!info) {
      return [];
    }

    // An address the user has already typed answers the same requirement the
    // record would have. The field validates its own format, so presence is all
    // this asks for — re-judging it here left a prompt they could not clear.
    const hasEmail =
      !!info.payee_email?.trim() ||
      !!this.deliveryEmail().trim() ||
      !!this.detailsPayeeEmail().trim();
    const hasPhone = !!info.payee_phone?.trim();
    // The working flow calls an address usable only when all five parts are
    // there (payments.service checkAndHandleMissingAddress). Judging it on
    // address line 1 alone let a payee with no city, state, country or zip pass
    // and be mailed to a partial address.
    //
    // Read from the payee row as well as the detail record, and complete in
    // either is complete. The row is what the working flow actually judges —
    // `checkAndHandleMissingAddress` takes the dropdown's payee — and the two
    // endpoints do not always fill the same five fields, which is how a payee
    // whose modal shows a full address was still told it was missing one.
    const hasAddress =
      isCompleteAddress([
        info.payee_address_line_1,
        info.payee_city,
        info.payee_state,
        info.payee_country,
        info.payee_zip
      ]) || isCompleteAddress(selectedPayeeAddress(this.coreForm.controls.payee.value));

    const email: IMissingPayeeField = {
      key: 'email',
      label: 'Email address',
      modalType: 'payeeEmail'
    };
    const address: IMissingPayeeField = {
      key: 'address',
      label: 'Address details',
      modalType: 'addAddress'
    };

    const byMethod = (): IMissingPayeeField[] => {
    switch (this.methodId()) {
      case 'check_mail':
        // Mailing a check needs somewhere to post it, not an email address.
        //
        // The email is still asked for on the two rails that genuinely refuse
        // without it: the wallet form sets `requiredEmail` on `payeeEmail` for
        // check_mail, and the card form makes it required outright. A bank check
        // has no `payeeEmail` control at all, so nothing there validates it and
        // asking blocked the user over a field the payment never uses.
        return [
          ...(hasAddress ? [] : [address]),
          ...(hasEmail || this.sourceId() === 'bankaccount' ? [] : [email])
        ];
      case 'check_print':
        return [];
      case 'virtual-card':
        return hasEmail || hasPhone
          ? []
          : [
              {
                key: 'emailOrPhone',
                label: 'Email or phone',
                modalType: 'payeeEmail'
              }
            ];
      case 'let-payee-choose':
        // The payee is emailed a link and picks their own rail, so an email
        // address is the whole requirement. Nothing is posted, and the working
        // flow validates the email alone (let-payee-choose-details).
        return hasEmail ? [] : [email];
      case 'check_email':
      case 'ach':
      case 'same-ach':
      case 'wire':
      case 'international-payment':
        return hasEmail ? [] : [email];
      default:
        return [];
    }
    };

    const fields = byMethod();

    /**
     * Three requirements the per-method switch cannot express, each of which
     * otherwise blocks the submit with no way to fix it from the page.
     */
    const extras: IMissingPayeeField[] = [];

    /**
     * Every rail but a cheque and vendor-decide wants the payee's full postal
     * address — the same five parts, refused the same way, in both working
     * flows: `payments.service.checkAndHandleMissingAddress`, which v3's ACH
     * forms run on payee selection and again on submit, and
     * `send-payment-submit.checkAndHandleMissingPayeeDetails`, which blocks Save
     * and Submit for everything except bank+Check and vendor-decide.
     *
     * A cheque is exempt because its address is the mailing address, validated
     * where it is used; vendor-decide because nothing is posted at all.
     */
    if (
      !hasAddress &&
      !this.isCheckFlow() &&
      this.methodId() &&
      this.methodId() !== 'let-payee-choose' &&
      this.methodId() !== 'virtual-card'
    ) {
      extras.push(address);
    }

    // Staging refuses a payee whose email is the sender's own
    // (ValidationService.validateDifferentEmail). hasEmail is true here, so the
    // per-method rules stay quiet and nothing offers a way to change it.
    const senderEmail = String(
      this.localStorage.getItem('email') ?? ''
    ).toLowerCase();
    if (
      senderEmail &&
      info.payee_email?.trim().toLowerCase() === senderEmail
    ) {
      extras.push({
        key: 'emailOwn',
        label: 'a different email address — this one is yours',
        modalType: 'payeeEmail'
      });
    }

    // A card requires the payee email on every method, but the method rules ask
    // for it on some and not others.
    if (this.sourceId() === 'card' && !hasEmail) {
      extras.push(email);
    }

    const withExtras = [
      ...fields,
      ...extras.filter((e) => !fields.some((f) => f.key === e.key))
    ];

    /**
     * Card networks want the payee's full address and company on top of whatever
     * the method asks for. This used to be a submit-time warning popup; it is
     * listed here instead so the rail can show it before the user commits.
     *
     * Vendor-decide is exempt on every source, as it is in the working flow
     * (send-payment-submit `handleMissingPayeeDetails` returns false for it):
     * the payee is emailed a link and chooses the rail, so neither an address
     * nor a company is known to be needed yet.
     */
    if (this.sourceId() !== 'card' || this.methodId() === 'let-payee-choose') {
      return withExtras;
    }

    // `hasAddress` is already all five parts, so a card asks for nothing more
    // than the address itself — the four fields this used to re-check are the
    // same four, and re-checking them against the detail record alone is what
    // put the chip back on a payee the row above had just cleared.
    const extra: IMissingPayeeField[] = [];
    if (!hasAddress && !withExtras.some((f) => f.key === 'address')) {
      extra.push(address);
    }
    if (!info.payee_company_name?.trim()) {
      extra.push({
        key: 'company',
        label: 'Company name',
        modalType: 'addCompany'
      });
    }
    return [...withExtras, ...extra];
  });

  /** Bumped by the right panel to open the payee editor on the missing field. */
  readonly triggerPayeeEdit = signal(0);

  /**
   * Names the field a blocked submit should scroll to, focus and shake. The
   * counter is what makes a repeat submit with the same missing field fire
   * again — a bare key would compare equal and be swallowed.
   */
  private readonly v4AlertService = inject(V4AlertService);

  /**
   * Asks the page to open the payee editor on one section (address, company,
   * email). Raised from the submit gates below; `send.component` listens and
   * opens the same editor its own "add" link uses, so the result flows back
   * into the payee list the dropdown renders.
   */
  readonly editorRequest = signal<{ modalType: string; seq: number } | null>(null);

  requestPayeeEditor(modalType: string): void {
    const seq = (this.editorRequest()?.seq ?? 0) + 1;
    this.editorRequest.set({ modalType, seq });
  }

  /**
   * Submit with a payee gap: instead of a silent shake that strands the user,
   * say what is missing in a calm prompt and offer to add it right there.
   * "Not now" leaves the form as it is and points at the payee field.
   */
  promptMissingPayeeField(): void {
    const missing = this.missingPayeeFields();
    if (!missing.length) {
      return;
    }
    // "Address details" -> "address", "Email address" stays as it reads.
    const nouns = missing.map((m) => m.label.toLowerCase().replace(' details', ''));
    const many = nouns.length > 1;
    const list = many
      ? `${nouns.slice(0, -1).join(', ')} and ${nouns[nouns.length - 1]}`
      : nouns[0];
    this.v4AlertService
      .confirmAlert({
        icon: 'info',
        title: many ? 'Payee details are missing' : `Payee ${list} is missing`,
        content: `This payment needs the payee's ${list}. Add ${many ? 'them' : 'it'} now to continue.`,
        doneMsg: many ? 'Add details' : `Add ${list}`,
        cancelMsg: 'Not now'
      })
      .afterClosed()
      .subscribe((add) => {
        if (add) {
          // Open on the first gap; once that save is read back, anything still
          // missing is asked for again (see repromptAfterPayeeLoad).
          this.requestPayeeEditor(missing[0].modalType);
        } else {
          this.requestFieldFocus('payee');
        }
      });
  }

  /**
   * The payee's stored email is present but fails the check (malformed, or the
   * account holder's own address). No field on the form holds it, so a shake
   * would point nowhere: say so and offer the editor, as for a missing one.
   */
  promptInvalidPayeeEmail(): void {
    this.v4AlertService
      .confirmAlert({
        icon: 'info',
        title: 'Payee email address needs attention',
        content:
          "The payee's email address is invalid or cannot be used for this payment. Update it now to continue.",
        doneMsg: 'Update email',
        cancelMsg: 'Not now'
      })
      .afterClosed()
      .subscribe((update) => {
        if (update) {
          this.requestPayeeEditor('payeeEmail');
        } else {
          this.requestFieldFocus('payee');
        }
      });
  }

  /**
   * Set by the page when the editor opened from the prompt above was saved.
   * The save triggers `loadPayee`; when that read-back lands, any gap still
   * open (an email after the address, say) is prompted for in turn, so the
   * user is walked through every missing field instead of being refused again.
   */
  repromptAfterPayeeLoad = false;

  private repromptIfStillMissing(): void {
    if (!this.repromptAfterPayeeLoad) {
      return;
    }
    this.repromptAfterPayeeLoad = false;
    if (this.missingPayeeFields().length) {
      this.promptMissingPayeeField();
    }
  }

  /**
   * `keys` are every field the submit refused; the page lands on whichever of
   * them is highest on screen. A single key is the common case.
   */
  readonly focusRequest = signal<{ keys: string[]; seq: number } | null>(null);

  requestFieldFocus(keys: string | readonly string[] | null): void {
    const list = (typeof keys === 'string' ? [keys] : keys ?? []).filter(Boolean);
    if (!list.length) {
      return;
    }
    const seq = (this.focusRequest()?.seq ?? 0) + 1;
    this.focusRequest.set({ keys: [...list], seq });
  }

  /** Every invalid control across the forms, core first in reading order. */
  invalidKeys(details?: FormGroup | null): string[] {
    return invalidControlKeys(
      this.coreForm.controls as unknown as Record<string, AbstractControl>,
      CORE_FIELD_ORDER,
      details
    );
  }

  /** First invalid control across the forms, in the order the user reads them. */
  firstInvalidKey(details?: FormGroup | null): string | null {
    return this.invalidKeys(details)[0] ?? null;
  }

  /**
   * True when the selected wallet cannot cover the entered amount. Read by the
   * inline message and by the submit guard, so the two cannot disagree about
   * what "insufficient" means.
   */
  isWalletShort(): boolean {
    const wallet = this.coreForm.controls.wallet.value;
    const amount = Number(this.coreForm.controls.amount.value);
    if (!wallet || !amount || amount <= 0) {
      return false;
    }
    const walletBalance = wallet.availableBalance ?? wallet.currentBalance;
    const balance =
      Number(String(walletBalance ?? '').replace(/[$,]/g, '')) || 0;
    return amount > balance;
  }

  /** 'wallet' | 'bankaccount' | 'card' | 'cloud' — decides which child renders */
  readonly sourceId = signal<string | null>(null);

  /**
   * The account the cheque is drawn on, named the way `POST /checks/preview`
   * names it. Each source keeps its id under its own key and calls it something
   * different, so anything drawing a preview asks here rather than reaching for
   * `bankAc` and finding nothing on a card or a wallet.
   */
  checkPreviewSource(): {
    sourceType: 'bankaccount' | 'wallet' | 'card';
    sourceId?: string;
  } | null {
    const core = this.coreForm.getRawValue();

    switch (this.sourceId()) {
      case 'bankaccount':
        return { sourceType: 'bankaccount', sourceId: core.bankAc?.id };
      case 'wallet':
        return { sourceType: 'wallet', sourceId: core.wallet?.uuId };
      case 'card':
        return { sourceType: 'card', sourceId: core.card?.cardId };
      default:
        return null;
    }
  }

  /**
   * The method the payment is submitted as: 'ach' | 'wire' | 'check_mail' | …
   * Not the dropdown's id: `check` stays null until a delivery tile resolves it.
   */
  readonly methodId = signal<string | null>(null);

  /** The id the pay-as dropdown is showing — `check` when the tiles are open. */
  readonly payAsId = signal<string | null>(null);

  /** which check-delivery tile is selected, once `check` is the pay-as option */
  readonly checkDelivery = signal<CheckDeliveryId | null>(null);

  /**
   * Shown when the user confirms a bank check without saying how it goes out.
   * Not on the form: the orchestrator clears it when it blanks the form.
   */
  readonly deliveryError = signal(false);

  /** Confirm was pressed while "process without payee" is on. */
  readonly noPayeeBlocked = signal(false);

  /**
   * An address the carrier refused, raised where it was refused and read by the
   * delivery block — the only place that can offer to fix one. Cleared on open.
   */
  readonly addressDeliveryError = signal<IAddressDeliveryFailure | null>(null);

  readonly isCheckSelected = computed(() => this.payAsId() === CHECK_OPTION_ID);

  /**
   * Whether the check master renders. Bank and wallet reach it through the `check`
   * pay-as option and its delivery tiles; a card has no tiles and picks Check Mail
   * as a method outright, so it would never match `isCheckSelected`.
   */
  readonly isCheckFlow = computed(
    () => this.isCheckSelected() || this.methodId() === 'check_mail'
  );

  readonly payAsItems = signal<IPaymentMethodOption[]>([]);

  readonly mode = signal<SendMode>('CREATE');
  readonly paymentId = signal<string | undefined>(undefined);

  /**
   * The payment being edited or cloned, raw. Only the bank-check rail reads it,
   * to tell whether the payment is *already* a check (EDIT can switch it to one).
   */
  readonly editedPayment = signal<IPaymentDetails | null>(null);

  /** Set from the header: approval policy is on for this user (see send.component). */
  readonly isApprovalPolicyEnabled = signal(false);

  /**
   * Set from the header: this account registered after the V2 launch, so Direct
   * Deposit is not offered to it (see send.component).
   */
  readonly hidesDirectDeposit = signal(false);

  /**
   * True when an already-approved payment is opened for editing under an active
   * approval policy. The payment has already passed approval, so its details must
   * not be modified — only the Confirm Payment action stays available.
   */
  readonly isApprovedReadOnly = computed(
    () =>
      this.isApprovalPolicyEnabled() &&
      this.mode() === 'EDIT' &&
      this.editedPayment()?.status?.toLowerCase() === 'approved'
  );

  /**
   * True for any approved payment opened for editing, whether or not the approval
   * policy is on for this viewer. An approved record is never rewritten, and the
   * wallet form locks on it — matching `isApprovedPaymentSkipUpdate` in v35's
   * payments-main-v35.component.ts.
   */
  readonly isApprovedSkipUpdate = computed(
    () =>
      this.mode() === 'EDIT' &&
      this.editedPayment()?.status?.toLowerCase() === 'approved'
  );

  /** the id `loadPayee` was called with — PaymentsPayeeBankListComponent needs it */
  readonly payeeId = signal<string | null>(null);

  /** true only while a full `loadPayee` fetch is outstanding — gates the payee skeleton */
  readonly payeeFetching = signal(false);

  /**
   * A re-read of the payee already on the form: the details on hand are the ones
   * being replaced. Distinct from `payeeFetching`, which is also true while the
   * first payee is arriving and there is nothing to be stale.
   */
  readonly payeeRefreshing = computed(
    () => this.payeeFetching() && !!this.payeeDetails()
  );

  /** the chosen payee, fetched once — the details rail renders this */
  readonly payeeDetails = signal<IPayeeView | null>(null);
  readonly payeeBanks = signal<IPayeeViewBank[]>([]);
  /** mirrors the child's payeeBankAc control so the details rail can show it */
  readonly selectedPayeeBank = signal<IPayeeViewBank | null>(null);

  /** bumped after the details rail edits a payee bank, to reload the bank dropdown */
  readonly payeeBankReloadTrigger = signal(0);


  readonly payeeCategory = signal<ICategoryDropdown | null>(null);

  /**
   * Notify-the-payee, per payment. The value signals hold an override typed in
   * the notify modal; empty means "use whatever the payee record carries", which
   * is what `effectiveNotify*` resolves. Enabling a channel with no address is
   * not a state the footer can reach — the modal collects one first.
   */
  readonly notifyEmailValue = signal<string | null>(null);
  readonly notifyEmailEnabled = signal(false);
  readonly notifyPhoneValue = signal<string | null>(null);
  readonly notifySmsEnabled = signal(false);

  /**
   * "Save this to the payee's record", as ticked in the notify modal. The modal
   * updates the payee itself the moment it closes; these carry the same answer
   * into the mailing payload so the API records the choice with the cheque.
   */
  readonly notifySaveEmail = signal(false);
  readonly notifySavePhone = signal(false);

  /**
   * Notify is per payment. The rails' `send_sms` control is reset with their form,
   * but these signals are not part of it — and the SMS is billed off this one, so
   * a leftover `true` would price a text the next payment never sends.
   */
  clearNotify(): void {
    this.notifyEmailValue.set(null);
    this.notifyEmailEnabled.set(false);
    this.notifyPhoneValue.set(null);
    this.notifySmsEnabled.set(false);
    this.notifySaveEmail.set(false);
    this.notifySavePhone.set(false);
  }

  readonly effectiveNotifyEmail = computed<string>(
    () =>
      this.notifyEmailValue() ??
      this.payeeDetails()?.payee_information?.payee_email ??
      ''
  );

  readonly effectiveNotifyPhone = computed<string>(
    () =>
      this.notifyPhoneValue() ??
      this.payeeDetails()?.payee_information?.payee_phone ??
      ''
  );

  /**
   * A category the payment already belongs to, by id — a bill brings one.
   * Outranks the payee's default.
   */
  readonly preferredCategoryId = signal<string | undefined>(undefined);

  /**
   * A payee named in the URL (`?payee_id`). The dropdown resolves the encrypted
   * id to the payee once its list is in.
   */
  readonly preferredPayeeId = signal<string | undefined>(undefined);

  /**
   * On EDIT the payee bank arrives as a bare id. Two loaders read this and it
   * must survive both, or the second overwrites the saved bank with the default.
   */
  readonly preferredBankId = signal<string | undefined>(undefined);

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  /** Pick a source, rebuild the method list, auto-select the first usable method. */
  selectSource(source: IPayFromSource | null | undefined): void {
    this.coreForm.controls.payFrom.setValue(source ?? null, { emitEvent: false });
    this.sourceId.set(source?.id ?? null);
    this.applySourceValidators();

    const items = buildPayAsItems(
      source,
      (method) => this.page.isMethodLocked(source?.id ?? null, method),
      (method) => this.page.methodTooltip(source?.id ?? null, method)
    );
    this.payAsItems.set(items);

    // Nothing is chosen for the user. Picking a rail on their behalf is a
    // decision about their money, and it hides the one question this control
    // exists to ask.
    this.selectMethod(null);
  }

  /**
   * Only the on-screen account control may be required — the other two would hold
   * the form invalid with no field to fill.
   */
  private applySourceValidators(): void {
    const c = this.coreForm.controls;
    const accounts = [c.wallet, c.bankAc, c.card];

    accounts.forEach((ctrl) => ctrl.clearValidators());

    const active = {
      wallet: c.wallet,
      bankaccount: c.bankAc,
      card: c.card
    }[this.sourceId() ?? ''];

    active?.setValidators(Validators.required);
    accounts.forEach((ctrl) => ctrl.updateValueAndValidity({ emitEvent: false }));
  }

  selectMethod(method: IPaymentMethodOption | null | undefined): void {
    this.coreForm.controls.payAs.setValue(method ?? null, { emitEvent: false });
    this.payAsId.set(method?.id ?? null);

    this.coreForm.controls.amount.enable({ emitEvent: false });
    this.coreForm.controls.payee.enable({ emitEvent: false });

    // "Check" is a family, not a method — a delivery tile resolves it.
    if (method?.id === CHECK_OPTION_ID) {
      if (this.sourceId() === 'bankaccount') {
        this.checkDelivery.set(null);
        this.methodId.set(null);
        this.applyAmountValidators();
        return;
      }
      this.selectCheckDelivery(DEFAULT_CHECK_DELIVERY);
      return;
    }

    this.checkDelivery.set(null);
    this.methodId.set(method?.id ?? null);
    this.applyAmountValidators();
  }

  private applyAmountValidators(): void {
    const { amount } = this.coreForm.controls;

    const isCard = this.sourceId() === 'card';
    const hasHighMin =
      isCard || HIGH_MIN_AMOUNT_METHODS.includes(this.methodId() ?? '');
    let min = hasHighMin ? HIGH_MIN_AMOUNT : 0.01;
    if (this.methodId() === 'international-payment') {
      min = INTL_MIN_AMOUNT;
    }

    amount.setValidators([
      Validators.required,
      Validators.min(min),
      ...(isCard ? [Validators.maxLength(9)] : [])
    ]);
    amount.updateValueAndValidity({ emitEvent: false });
  }

  /** A delivery tile is what turns "Check" into a submittable method. */
  selectCheckDelivery(delivery: CheckDeliveryId): void {
    this.checkDelivery.set(delivery);
    this.methodId.set(deliveryToMethodId(delivery));
    this.applyAmountValidators();
  }

  /**
   * Back to "check selected, no delivery yet" — the same state `selectMethod` leaves
   * a bank check in. Used when the tile that was picked stops being offerable.
   */
  clearCheckDelivery(): void {
    this.checkDelivery.set(null);
    this.methodId.set(null);
    this.applyAmountValidators();
  }


  selectSourceById(sourceId: string, methodId?: string): boolean {
    const source = this.page.sources().find((s) => s.id === sourceId);
    if (!source) {
      return false;
    }
    this.selectSource(source);

    if (!methodId) {
      return true;
    }

    const method = this.payAsItems().find((m) => m.id === methodId && !m.locked);
    if (method) {
      this.selectMethod(method);
      return true;
    }

    const delivery = methodIdToDelivery(methodId);
    const checkOption = this.payAsItems().find(
      (m) => m.id === CHECK_OPTION_ID && !m.locked
    );
    if (delivery && checkOption) {
      this.selectMethod(checkOption);
      this.selectCheckDelivery(delivery);
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // Payee
  // -------------------------------------------------------------------------

  loadPayee(payeeId: string): void {
    // Re-reading the payee already on the form is a refresh, not a change of
    // payee — the edit modal ends in one. Clearing first emptied the bank
    // selection for as long as the fetch took, and a payee-bank control that is
    // required and already touched (the user has just been refused once, which
    // is why they opened that modal) drew "please select a bank account" over an
    // account that was still chosen. Only a different payee invalidates it.
    const samePayee = this.payeeId() === payeeId;

    this.payeeId.set(payeeId);
    if (!samePayee) {
      this.payeeBanks.set([]);
      this.payeeDetails.set(null);
      this.selectedPayeeBank.set(null);
    }
    this.payeeFetching.set(true);

    this.payments
      .getPayeeDetails(payeeId, true)
      .pipe(
        catchError(() => of(null)),
        finalize(() => {
          this.payeeFetching.set(false);
          this.repromptIfStillMissing();
        })
      )
      .subscribe((details) => {
        if (!details) {
          return;
        }
        const banks = details.bank_accounts ?? [];
        this.payeeDetails.set(details);
        this.payeeBanks.set(banks);
        // On a refresh the account the user chose wins over the payee default;
        // it only gives way if this answer no longer lists it.
        this.selectedPayeeBank.set(
          (samePayee ? this.stillListed(banks) : null) ?? this.defaultBank(banks)
        );
      });

    this.checks.getPayeeCategory(payeeId).subscribe({
      next: (res) => this.payeeCategory.set(res?.data?.id ? res.data : null),
      error: () => this.payeeCategory.set(null)
    });
  }

  /**
   * Refresh only the payee's banks, in place — no clear and no fetching flag, so the
   * payee card keeps its data (and shows no skeleton) after a bank edit.
   */
  reloadPayeeBanks(payeeId: string): void {
    this.payments
      .getPayeeDetails(payeeId, true)
      .pipe(catchError(() => of(null)))
      .subscribe((details) => {
        if (!details) {
          return;
        }
        const banks = details.bank_accounts ?? [];
        this.payeeBanks.set(banks);
        this.selectedPayeeBank.set(
          this.stillListed(banks) ?? this.defaultBank(banks)
        );
      });
  }

  /** The account currently selected, if this list still has it. */
  private stillListed(banks: IPayeeViewBank[]): IPayeeViewBank | null {
    const current = this.selectedPayeeBank();
    if (!current) {
      return null;
    }
    const key = String(current.encrypted_id ?? current.id ?? '');
    const match = banks.find(
      (b) => String(b.encrypted_id ?? b.id ?? '') === key
    );
    if (!match) {
      return null;
    }
    // `decrypted_id` is put there by the bank dropdown, not by this endpoint —
    // carry it over or the direct-deposit send loses the id it posts by.
    return { ...match, decrypted_id: current.decrypted_id ?? match.decrypted_id };
  }

  /**
   * Patch the loaded payee in place from an edit-modal result — the modal already
   * persisted, so this reflects the edit immediately with no refetch and no skeleton.
   * Only fields the result actually carries are written.
   */
  applyEditedPayee(result: Partial<IPayeeModalData & IPayeeDropdown>): void {
    const current = this.payeeDetails();
    if (!current) {
      return;
    }

    const patch: Partial<IPayeeViewInfo> = {};
    const set = <K extends keyof IPayeeViewInfo>(
      key: K,
      value: IPayeeViewInfo[K] | undefined | null
    ): void => {
      if (value !== undefined && value !== null) {
        patch[key] = value;
      }
    };

    set('payee_name', result.name);
    set('payee_nick_name', result.nickName);
    set('payee_email', result.email);
    set('payee_phone', result.phone);
    set('payee_address_line_1', result.addressLine1);
    set('payee_address_line_2', result.addressLine2);
    set('payee_city', result.city);
    set('payee_state', result.state);
    set('payee_zip', result.zip);
    set('payee_country', result.country);
    set('payee_company_name', result.company);
    set('payee_id_number', result.payeeIdNumber);

    this.payeeDetails.set({
      ...current,
      payee_information: { ...current.payee_information, ...patch }
    });
  }

  clearPayee(): void {
    this.payeeId.set(null);
    this.preferredBankId.set(undefined);
    this.preferredCategoryId.set(undefined);
    this.payeeDetails.set(null);
    this.payeeBanks.set([]);
    this.selectedPayeeBank.set(null);
    this.payeeCategory.set(null);
  }

  private defaultBank(banks: IPayeeViewBank[]): IPayeeViewBank | null {
    const preferredId = this.preferredBankId();
    const preferred = preferredId
      ? banks.find((b) => b.encrypted_id === preferredId)
      : undefined;
    return preferred ?? banks.find((b) => b.is_default_for_direct_deposit) ?? null;
  }

  // -------------------------------------------------------------------------
  // Edit / clone
  // -------------------------------------------------------------------------

  /**
   * Map the core fields of an existing payment. Identical for all three sources,
   * so it is done once here; each child then patches its own details form.
   */
  patchCoreFromPayment(details: IPaymentDetails, mode: Exclude<SendMode, 'CREATE'>): void {
    this.mode.set(mode);
    this.paymentId.set(mode === 'EDIT' ? details.id : undefined);
    this.editedPayment.set(details);
    // A deposited cheque names the payee's account inside its deposit options
    // rather than on the payment, and it is the same encrypted id.
    const deposited = (
      details.transfer as
        | { direct_deposit_details?: { payee_account?: string } }
        | undefined
    )?.direct_deposit_details?.payee_account;
    this.preferredBankId.set(
      details.payeeBankAccount || deposited || undefined
    );

    this.selectSourceById(sourceIdOf(details), methodIdOf(details));

    const account = details.source_deleted ? null : details.source;
    this.coreForm.patchValue(
      {
        amount: details.amount,
        payee: details.payee_deleted ? null : details.payee,
        wallet: this.sourceId() === 'wallet' ? (account as IWalletData) : null,
        bankAc: this.sourceId() === 'bankaccount' ? (account as IBankDropdown) : null,
        card: this.sourceId() === 'card' ? (account as IExistingCreditCards) : null
      },
      { emitEvent: false }
    );

    // patchValue is silent, so the payee's banks would never load.
    if (!details.payee_deleted && details.payee?.id) {
      this.loadPayee(details.payee.id);
    }
  }
}

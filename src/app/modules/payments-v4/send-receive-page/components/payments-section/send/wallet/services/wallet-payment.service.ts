import {
  computed,
  inject,
  signal,
  Injectable,
  WritableSignal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import type { IRemittanceDetails } from 'src/app/models/bank';
import {
  ICardOnBoardingStatus,
  IWalletInternationaPaymentCreate
} from 'src/app/models/wallet';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { IInternationalPayeeAccount } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IPaymentBody,
  IPaymentDetails,
  IUpdatePaymentBody
} from 'src/app/modules/payments/model/payments';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';

import { RaincardSelectBusinessV4Component } from 'src/app/modules/payments/shared/modal/v4/raincard-select-business-v4/raincard-select-business-v4.component';
import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';
import { AddPayeeModalV4Component } from 'src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component';
import {
  AddPayeeInternationalBankV4Component,
  type AddPayeeInternationalBankDialogData
} from 'src/app/modules/payee/payee-v4/v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import {
  PaymentMethod,
  PaymentSource
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';

import { AccountVerificationService } from '../../shared/services/account-verification.service';
import {
  PaymentConfirmService,
  SUCCESS_APPROVAL_REQUIRED,
  SUCCESS_SAVED,
  buildCheckPreviewPayload,
  buildCheckPreviewValues,
  isWalletFallback,
  type IConfirmRequest
} from '../../shared/services/payment-confirm.service';
import type { IFeeRequest } from '../../shared/services/payment-fee.service';
import {
  END_AFTER_COUNT,
  END_UNTIL_CANCELLED,
  tomorrow
} from '../../shared/models/recurring';
import type { ISendSourceService } from '../../shared/models/send-source.model';
import {
  INTL_MIN_AMOUNT,
  SendStateService
} from '../../shared/services/send-state.service';
import { LET_VENDOR_DECIDE_ID } from 'src/app/modules/payments/model/pay-as-options';
import { storedPayeeEmailFailsCheck } from '../../shared/payee-email-check';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Memo cap on the three check methods. */
const MEMO_MAX = 150;

/** International caps the memo harder and restricts its charset. */
const INTL_MEMO_MAX = 50;
const INTL_MEMO_PATTERN = /^[A-Za-z0-9 -]+$/;

/** Re-applied per country on country change; 10 is the fallback. */
const INTL_PHONE_MIN_LENGTH = 10;

/** Source of funds is collected for India and the Philippines only. */
export const SOURCE_OF_FUNDS_COUNTRIES = ['IN', 'PH'];

/** The one purpose category that forces a memo. */
export const PURPOSE_CATEGORY_TRADE = 'trade';

export { INTL_MIN_AMOUNT };

/** `checkService.printMultiCheck` paper codes. */
const PAPER_CODE: Record<CheckPaperType, number> = {
  printCheck: 1,
  printWhiteCheck: 6
};

/** KYC required before a wallet payment can be saved. */
const ERR_KYC_REQUIRED = 441;

/** processPayment errors that render their own UI. */
const ERR_SELF_HANDLED = [214, 217, 202];

/** OTP challenge. */
const ERR_OTP = 112;

/** The three deliveries that write a cheque to `zil-payments` before charging it. */
const CHECK_METHODS = ['check_mail', 'check_print', 'check_email'];

/** Wire and RTP send a hardcoded due date; every other method sends today's. */
const LEGACY_FIXED_DUE_DATE = '2023-08-12';

const OTP_DIALOG_CONFIG = {
  maxWidth: '410px',
  width: '100%',
  disableClose: true,
  panelClass: 'paddingless-modal-rounded'
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckPaperType = 'printCheck' | 'printWhiteCheck';

/**
 * What this service needs from the transaction-limit card — declared structurally
 * so the service never imports the component.
 */
export interface ITransactionLimitGate {
  /** True while a 305 prompt, a 312 message or the edit-amount panel is open. */
  isLockedForSubmit(): boolean;
  transactionLimitMessage: WritableSignal<string | null>;
  proceedPayment: WritableSignal<'0' | '1'>;
  isAwaiting305Confirmation: WritableSignal<boolean>;
  was305Cancelled: WritableSignal<boolean>;
}

export interface IWalletDetailsForm {
  payeeEmail: FormControl<string | null>;
  invoiceNumber: FormControl<string | null>;
  payeeIdNumber: FormControl<string | null>;
  payeeBankAc: FormControl<IPayeeViewBank | null>;
  category: FormControl<ICategoryDropdown | null>;
  memo: FormControl<string | null>;

  // ACH
  payeeNumber: FormControl<string | null>;
  send_sms: FormControl<boolean | null>;
  isSameDay: FormControl<boolean | null>;
  needAchRecurring: FormControl<boolean | null>;

  // ACH recurring schedule, collected inline
  recurringFrequency: FormControl<string | null>;
  recurringStartDate: FormControl<string | null>;
  recurringEndSelect: FormControl<string | null>;
  recurringCount: FormControl<number | null>;

  // mailed / printed check
  /** a `carrier_code`, e.g. `USPS_FIRST_CLASS_MAIL` — not a display name */
  shippingType: FormControl<string | null>;
  isCustomAddress: FormControl<boolean | null>;
  /** ids from GET /cheques/from-address and /to-address */
  customShippingFrom: FormControl<string | null>;
  customShippingTo: FormControl<string | null>;

  // international payment
  /** 'business' | 'personal' — drives the bank, purpose and source lists. */
  recipientType: FormControl<string | null>;
  /** International banks are a different list and a different shape entirely. */
  interBankAc: FormControl<IInternationalPayeeAccount | null>;
  /** the purpose *code*, not its description */
  purpose: FormControl<string | null>;
  /** 'trade' makes the memo required */
  purposeCategory: FormControl<string | null>;
  sourceOfCash: FormControl<string | null>;
  sourceOfCashName: FormControl<string | null>;
  payeePhone: FormControl<string | null>;

  // virtual card
  cardLimitType: FormControl<string | null>;
}

/** The quote request the international rail prices a payment with. */
interface IQuoteRequest {
  countryCode: string;
  payoutCurrencyCode: string;
  amount: number;
  type: string;
  isReceivingAmount: number;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function today(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `IUpdatePaymentBody.transferType`. Note RTP is uppercase on the wire. */
function transferTypeOf(methodId: string | null): string {
  switch (methodId) {
    case 'ach':
    case 'same-ach':
      return 'ach';
    case 'wire':
      return 'wire';
    case 'rtp':
      return 'RTP';
    case 'check_mail':
      return 'checkMail';
    case 'check_print':
    case 'check_email':
      return 'check';
    case 'let-payee-choose':
      return LET_VENDOR_DECIDE_ID;
    default:
      return methodId ?? '';
  }
}

/** `IPaymentBody.mode` — a string, not a number. */
function modeOf(methodId: string | null): string {
  switch (methodId) {
    case 'wire':
      return '6';
    case 'rtp':
      return '12';
    // The vendor-decide rail.
    case 'let-payee-choose':
      return '10';
    default:
      return '1';
  }
}

/** Only wire and RTP carry the hardcoded legacy due date. */
function isWireLike(methodId: string | null): boolean {
  return methodId === 'wire' || methodId === 'rtp';
}

function confirmLabel(
  methodId: string | null,
  paperType: CheckPaperType,
  isSameDay: boolean | null
): string {
  switch (methodId) {
    case 'ach':
      return isSameDay ? 'Same Day ACH' : 'ACH / Direct Deposit';
    case 'same-ach':
      return 'Same Day ACH';
    case 'wire':
      return 'Wire';
    case 'rtp':
      return 'RTP';
    case 'check_mail':
      return 'Check Mail';
    case 'check_print':
      return paperType === 'printCheck' ? 'Check Print' : 'White Check Print';
    case 'check_email':
      return 'Check - Email(eCheck)';
    case 'international-payment':
      return 'International Payment';
    case 'virtual-card':
      return 'Virtual Card';
    default:
      return '';
  }
}

/**
 * The same choice as `confirmLabel`, typed — the modal times the payment by it.
 * `ach` with the same-day toggle on submits as Same Day ACH, which is timed
 * differently, so it must not be reported as plain ACH.
 */
function confirmMethod(
  methodId: string | null,
  isSameDay: boolean | null
): PaymentMethod | undefined {
  if (methodId === 'ach' && isSameDay) {
    return PaymentMethod.SameDayACH;
  }
  return (methodId ?? undefined) as PaymentMethod | undefined;
}

/**
 * The id the API takes for a payee bank account: ACH's bank list already emits an
 * encrypted `id`; every other method names it `encrypted_id`.
 */
function bankAccountId(bank: IPayeeViewBank | null): string | undefined {
  return bank?.encrypted_id ?? (bank?.id != null ? String(bank.id) : undefined);
}

/**
 * The recipient bank's country and payout currency. `currency` sits on
 * `beneficiaryBankDetails` for most countries, top-level for some.
 */
function interBankCountry(bank: IInternationalPayeeAccount | null): string {
  return bank?.beneficiaryBankDetails?.country ?? bank?.country ?? '';
}

function interBankCurrency(bank: IInternationalPayeeAccount | null): string {
  const details = bank?.beneficiaryBankDetails as
    | { currency?: string }
    | undefined;
  return details?.currency ?? bank?.currency ?? '';
}

function noWhitespace(control: { value: unknown }) {
  const { value } = control;
  if (typeof value !== 'string' || value === '') {
    return null;
  }
  return value.trim().length === 0 ? { hasWhitespace: true } : null;
}

/**
 * V4ControlMessageComponent has no message for `Validators.pattern`'s `pattern`
 * key; `specialChar` maps to "Special characters are not allowed".
 */
function intlMemoCharset(control: { value: unknown }) {
  const { value } = control;
  if (typeof value !== 'string' || value === '') {
    return null;
  }
  return INTL_MEMO_PATTERN.test(value) ? null : { specialChar: true };
}

/**
 * The additional-details form, its per-method validators, and save / confirm for
 * all nine wallet methods. PaymentConfirmService owns the modal and success screen.
 */
/** The methods that draw a cheque, and so have a preview worth fetching. */
const CHECK_PREVIEW_METHODS: readonly string[] = [
  'check',
  'check_mail',
  'check_print',
  'check_email'
];

@Injectable()
export class WalletPaymentService implements ISendSourceService {
  // -------------------------------------------------------------------------
  // Dependency injection
  // -------------------------------------------------------------------------

  private readonly paymentsService = inject(PaymentsService);
  private readonly psbService = inject(PsbService);
  private readonly walletService = inject(WalletService);
  private readonly walletDataService = inject(WalletDataV35Service);
  private readonly checkService = inject(CheckService);
  private readonly billService = inject(BillService);
  private readonly recurringRedirectService = inject(RecurringRedirectService);
  private readonly personaHelperService = inject(PersonaHelperService);
  private readonly v4AlertService = inject(V4AlertService);
  private readonly commonVerificationService = inject(CommonVerificationService);
  // `validateDifferentEmail` is an instance validator, unlike the statics above.
  private readonly validationService = inject(ValidationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  private readonly sendStateService = inject(SendStateService);
  private readonly paymentConfirmService = inject(PaymentConfirmService);
  private readonly accountVerificationService = inject(
    AccountVerificationService
  );

  // -------------------------------------------------------------------------
  // Signals
  // -------------------------------------------------------------------------

  /** the account-level card program status, fetched once per method selection */
  readonly cardOnboarding = signal<ICardOnBoardingStatus | undefined>(undefined);
  readonly cardOnboardingLoading = signal(false);

  /** The most recent quote, or null when the form can't produce one yet. */
  readonly quote = signal<IWalletInternationaPaymentCreate | null>(null);
  readonly quoteLoading = signal(false);
  /**
   * Set when Confirm is pressed with no live rate; shown under the recipient
   * block until a quote arrives. Cleared whenever a new quote is requested.
   */
  readonly quoteSubmitError = signal<string | null>(null);

  /**
   * The mounted `V4TransactionLimitCardComponent`, registered by
   * InternationalPaymentComponent. It owns the 305 / 312 state.
   */
  readonly limitGate = signal<ITransactionLimitGate | null>(null);

  /** The recipient bank the international form is on — the details rail reads this. */
  readonly selectedInternationalBank =
    signal<IInternationalPayeeAccount | null>(null);

  readonly internationalBankLoading = signal(false);

  /** Bumped after the details rail edits the recipient bank, to reload the dropdown. */
  readonly internationalBankReloadTrigger = signal(0);

  /** The edited bank's `encrypted_id`, kept selected across the reload. */
  readonly preferredInternationalBankId = signal<string | undefined>(undefined);

  readonly preferredInternationalCountry = signal<
    { countryCode: string; currency: string } | undefined
  >(undefined);

  /** Country codes that use IBAN, captured from the enabled-countries payload. */
  readonly internationalIbanCountries = signal<Set<string>>(new Set());

  private readonly savedCheckPaymentId = signal<string | undefined>(undefined);

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  /**
   * `emailValidator` sets `invalidEmailAddress`, which V4ControlMessageComponent
   * has a message for; `Validators.email`'s `email` key it does not.
   * `validateDifferentEmail` blocks paying the account holder's own address.
   */
  private readonly requiredEmail = [
    Validators.required,
    ValidationService.emailValidator,
    this.validationService.validateDifferentEmail()
  ];

  /** The same rules where the email itself is optional. */
  private readonly optionalEmail = [
    ValidationService.emailValidator,
    this.validationService.validateDifferentEmail()
  ];

  readonly detailsForm = new FormGroup<IWalletDetailsForm>({
    payeeEmail: new FormControl(''),
    invoiceNumber: new FormControl(''),
    payeeIdNumber: new FormControl('', Validators.maxLength(30)),
    payeeBankAc: new FormControl<IPayeeViewBank | null>(null),
    category: new FormControl<ICategoryDropdown | null>(null),
    memo: new FormControl(''),

    payeeNumber: new FormControl(''),
    send_sms: new FormControl(false),
    isSameDay: new FormControl(false),
    needAchRecurring: new FormControl(false),

    recurringFrequency: new FormControl<string | null>('3'),
    recurringStartDate: new FormControl<string | null>(tomorrow()),
    recurringEndSelect: new FormControl<string | null>(END_UNTIL_CANCELLED),
    recurringCount: new FormControl<number | null>(1),

    shippingType: new FormControl<string | null>(null),
    isCustomAddress: new FormControl(false),
    customShippingFrom: new FormControl<string | null>(null),
    customShippingTo: new FormControl<string | null>(null),

    recipientType: new FormControl<string | null>(null),
    interBankAc: new FormControl<IInternationalPayeeAccount | null>(null),
    purpose: new FormControl<string | null>(null),
    purposeCategory: new FormControl<string | null>(null),
    sourceOfCash: new FormControl<string | null>(null),
    sourceOfCashName: new FormControl(''),
    payeePhone: new FormControl(''),

    cardLimitType: new FormControl('onetime')
  });

  // -------------------------------------------------------------------------
  // Public properties — the toolbar payload, owned by SendComponent's modals
  // -------------------------------------------------------------------------

  insertFromRemittance = false;

  /** Remittance line items and their format, collected by the remittance modal. */
  remittanceItems: IRemittanceDetails[] = [];

  remittanceType = 1;

  /** Comment and attachment ids are collected by the SendComponent's modals. */
  commentIds: string[] = [];

  attachmentIds: string[] = [];
  envelopeAttachmentIds: string[] = [];

  /** The modal returns only the filled rows, so any row means a real remittance. */
  get hasRemittance(): boolean {
    return this.remittanceItems.length > 0;
  }

  /** the paper the `check_print` delivery tile chose */
  get paperType(): CheckPaperType {
    return this.sendStateService.checkDelivery() === 'printWhiteCheck'
      ? 'printWhiteCheck'
      : 'printCheck';
  }

  /**
   * The recurring fields in the shape the API expects. Null when the toggle is off.
   */
  get recurring(): { is_recurring_value: number; recurring: unknown } | null {
    const d = this.detailsForm.getRawValue();
    if (!d.needAchRecurring) {
      return null;
    }

    return {
      is_recurring_value: 1,
      recurring: {
        frequency: d.recurringFrequency,
        start_date: d.recurringStartDate,
        end_select: d.recurringEndSelect,
        // "Until I cancel" sends an empty count.
        count: d.recurringEndSelect === END_AFTER_COUNT ? d.recurringCount : ''
      }
    };
  }

  /** check_mail offers both ends of the custom address; check_print only "From". */
  get usesCustomAddress(): boolean {
    const method = this.sendStateService.methodId();
    return method === 'check_mail' || method === 'check_print';
  }

  get customAddressOn(): boolean {
    return (
      this.usesCustomAddress && !!this.detailsForm.controls.isCustomAddress.value
    );
  }

  // -------------------------------------------------------------------------
  // Private properties
  // -------------------------------------------------------------------------

  /**
   * A bare `detailsForm.reset()` nulls every control, leaving the recurring card
   * with no end option and no frequency — so a reset restores these instead.
   */
  private readonly detailsDefaults = this.detailsForm.getRawValue();

  /** OTP session key returned by a 112 challenge, replayed on retry */
  private sessionKey?: string;

  /**
   * The wallet whose card-issuing check is in flight. Both the wallet dropdown and
   * a switch to the virtual card ask for this, and within the dropdown's 500ms
   * debounce they can ask for the same wallet — which would prompt twice.
   */
  private walletOnboardingInFlight?: string;

  // -------------------------------------------------------------------------
  // ISendSourceService
  // -------------------------------------------------------------------------

  readonly memoConfig = computed(() => ({
    visible: true,
    maxLength:
      this.sendStateService.methodId() === 'international-payment'
        ? INTL_MEMO_MAX
        : MEMO_MAX
  }));

  /** Clear the details form back to its defaults, plus the state that hangs off it. */

  resetDetails(): void {
    this.detailsForm.reset(this.detailsDefaults);
    this.clearQuote();
    // The next payment is a new record, not the one this page just wrote.
    this.savedCheckPaymentId.set(undefined);
    // The next payment is not the edited one; its bank must not ride along.
    this.preferredInternationalBankId.set(undefined);
    this.preferredInternationalCountry.set(undefined);
    this.insertFromRemittance = false;
    this.remittanceItems = [];
    this.remittanceType = 0;
    this.commentIds = [];
    this.attachmentIds = [];
  }

  /**
   * Re-hydrate the wallet's own fields on edit/clone. A clone cannot reuse the
   * original's invoice number — two payments would settle one invoice.
   */
  patchDetailsFromPayment(details: IPaymentDetails): void {
    const isClone = this.sendStateService.mode() === 'CLONE';

    this.detailsForm.patchValue(
      {
        memo: details.description ?? '',
        invoiceNumber: isClone ? '' : details.referenceNo ?? '',
        category: details.category?.id ? details.category : null,
        payeeEmail: details.payee?.email ?? '',
        payeeIdNumber: details.payee?.payeeIdNumber ?? '',
        // The carrier is restored on a mailed check only.
        shippingType:
          details.transferTypeCode === 'checkMail'
            ? details.metadata?.shippingType ?? null
            : null
      },
      { emitEvent: false }
    );

    this.patchInternationalFromPayment(details);
  }

  /**
   * The international rail keeps its own answers on `details.transfer`: who the
   * recipient is, which of their banks was paid, and the purpose / source codes.
   * InternationalPaymentComponent re-applies the codes once their lists load.
   */
  private patchInternationalFromPayment(details: IPaymentDetails): void {
    if (details.transferTypeCode !== 'internationalPayment') {
      return;
    }

    const transfer = details.transfer;
    if (!transfer) {
      return;
    }

    this.preferredInternationalBankId.set(
      transfer.international_payee_bank_id || undefined
    );

    const countryCode = transfer.payee_bank_info?.beneficiary_bank_country;
    const currency =
      transfer.payee_bank_info?.currency || transfer.receiving_currency_code;
    this.preferredInternationalCountry.set(
      countryCode && currency ? { countryCode, currency } : undefined
    );

    this.detailsForm.patchValue(
      {
        recipientType:
          transfer.payee_info?.beneficiary_type === 'personal'
            ? 'personal'
            : 'business',
        purpose: transfer.purpose ?? null,
        sourceOfCash: transfer.source_of_cash ?? null,
        sourceOfCashName: transfer.source_of_cash_name ?? ''
      },
      { emitEvent: false }
    );
  }

  /**
   * What a wallet payment adds to the fee request. Same-day comes from either the
   * dedicated method or the legacy ACH checkbox; wallet has no card rail.
   */
  feeInputs(): Pick<IFeeRequest, 'shippingType' | 'isSameDay' | 'cardMode'> {
    const c = this.detailsForm.controls;
    return {
      shippingType: c.shippingType.value ?? undefined,
      isSameDay:
        this.sendStateService.methodId() === 'same-ach' || !!c.isSameDay.value
    };
  }

  // -------------------------------------------------------------------------
  // Entry points
  // -------------------------------------------------------------------------

  /** Save a draft (or update it, when editing). No confirmation modal. */
  save(): void {
    if (!this.validate()) {
      return;
    }

    if (!this.accountVerificationService.verifyForPayment(() => this.save())) {
      return;
    }

    const method = this.sendStateService.methodId();
    if (method === 'international-payment' || method === 'virtual-card') {
      // Neither API has a draft concept.
      this.paymentConfirmService.showError({
        error: { errorMsg: 'This payment cannot be saved as a draft.' }
      });
      return;
    }

    const editingId = this.writeTargetId();
    this.captureSuccessContext();
    this.paymentConfirmService.setProcessing(true);

    this.writePayment(editingId).subscribe({
      next: (res) => {
        if (!res.success) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        if (!editingId) {
          this.rememberSavedCheck(res);
        }
        this.afterSuccess();
        this.paymentConfirmService.showSuccess(SUCCESS_SAVED);
      },
      error: (err) => this.handleError(err)
    });
  }

  /** Ask for confirmation, then pay. One `case` per wallet method. */
  confirm(): void {
    if (!this.validate()) {
      return;
    }

    // The inline message is already under the wallet; this points at it rather
    // than letting a payment the balance cannot cover reach the confirm modal.
    if (this.sendStateService.isWalletShort()) {
      this.sendStateService.requestFieldFocus('wallet');
      return;
    }

    if (
      !this.accountVerificationService.verifyForPayment(() => this.confirm())
    ) {
      return;
    }

    const method = this.sendStateService.methodId();
    if (method === 'wire' && !this.payeeBank()?.is_allow_wire) {
      this.sendStateService.requestFieldFocus('payeeBankAc');
      return;
    }

    this.captureSuccessContext();

    this.paymentConfirmService
      .ask(this.confirmRequest())
      .subscribe((confirmed) => {
        if (!confirmed) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.paymentConfirmService.setProcessing(true);

        switch (method) {
          case 'ach':
          case 'same-ach':
          case 'wire':
          case 'rtp':
          // Vendor-decide is a complete-transaction like the rails above it,
          // on mode '10'.
          case 'let-payee-choose':
            this.payViaCompleteTransaction();
            break;

          case 'check_mail':
          case 'check_print':
          case 'check_email':
            this.payViaSaveThenProcess();
            break;

          case 'international-payment':
            this.payInternational();
            break;

          case 'virtual-card':
            this.payVirtualCard();
            break;

          default:
            this.paymentConfirmService.setProcessing(false);
        }
      });
  }

  // -------------------------------------------------------------------------
  // Validators per method
  // -------------------------------------------------------------------------

  /**
   * Which of the details fields are required depends on the method. Called
   * whenever the method changes.
   */
  applyMethodValidators(methodId: string | null): void {
    const c = this.detailsForm.controls;
    const perMethod = [
      c.payeeEmail,
      c.payeeBankAc,
      c.memo,
      c.shippingType,
      c.purpose,
      c.payeePhone,
      c.sourceOfCash,
      c.recipientType,
      c.interBankAc,
      c.cardLimitType
    ];

    perMethod.forEach((ctrl) => ctrl.clearValidators());

    switch (methodId) {
      case 'ach':
      case 'same-ach':
        // The payee bank account is optional; the payee email is required; the
        // memo is unconstrained.
        c.payeeEmail.setValidators(this.requiredEmail);
        break;

      case 'wire':
      case 'rtp':
        c.payeeBankAc.setValidators(Validators.required);
        c.payeeEmail.setValidators(this.requiredEmail);
        c.memo.setValidators([Validators.required, noWhitespace]);
        break;

      case 'check_mail':
        c.shippingType.setValidators(Validators.required);
        c.payeeEmail.setValidators(this.requiredEmail);
        c.memo.setValidators(Validators.maxLength(MEMO_MAX));
        break;

      case 'check_print':
        // The only method where the payee email is optional, though it must
        // still parse if given.
        c.payeeEmail.setValidators(this.optionalEmail);
        c.memo.setValidators(Validators.maxLength(MEMO_MAX));
        break;

      case 'check_email':
        c.payeeEmail.setValidators(this.requiredEmail);
        c.memo.setValidators(Validators.maxLength(MEMO_MAX));
        break;

      case 'let-payee-choose':
        // The email must not be the account holder's own — the vendor is the one
        // told where to collect the money.
        c.payeeEmail.setValidators(this.requiredEmail);
        // The vendor picks the rail from this note alone, so it is required here
        // exactly as it is on wire and RTP — and as the bank rail already has it.
        c.memo.setValidators([
          Validators.required,
          noWhitespace,
          Validators.maxLength(MEMO_MAX)
        ]);
        break;

      case 'international-payment':
        // The recipient bank comes from its own list, so `payeeBankAc` stays empty
        // and `interBankAc` is the required one.
        c.interBankAc.setValidators(Validators.required);
        c.recipientType.setValidators(Validators.required);
        c.purpose.setValidators(Validators.required);
        c.payeeEmail.setValidators(this.requiredEmail);
        c.payeePhone.setValidators(
          ValidationService.customMinLength(INTL_PHONE_MIN_LENGTH)
        );
        this.applyPurposeCategoryValidators();
        break;

      case 'virtual-card':
        // Neither contact field renders here any more: the payee record supplies
        // both, and the email-or-phone rule is reported on the payee row.
        c.payeeEmail.setValidators(this.optionalEmail);
        c.cardLimitType.setValidators(Validators.required);
        break;

      default:
        break;
    }

    // Both depend on more than the method, so they get their own pass.
    this.applySourceOfFundsValidators();
    this.applyCustomAddressValidators();

    // setValidators() does not re-run validation, and updating the *group* reads
    // the children's stale status — each control has to be updated itself.
    perMethod.forEach((ctrl) =>
      ctrl.updateValueAndValidity({ emitEvent: false })
    );
    // ...and the group itself, for the email-or-phone rule just set on it.
    this.detailsForm.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * `check-transaction-limit` refused the chosen purpose for an empty memo. The
   * purpose list's own `category` is what normally decides this; a code the
   * server treats as trade without saying so in the list only surfaces there.
   * Cleared whenever the purpose changes.
   */
  readonly memoRequiredByServer = signal(false);

  /**
   * A `trade` purpose makes the memo required; every international memo is capped
   * and charset-restricted.
   */
  applyPurposeCategoryValidators(): void {
    const c = this.detailsForm.controls;
    if (this.sendStateService.methodId() !== 'international-payment') {
      return;
    }

    c.memo.setValidators([
      ...(c.purposeCategory.value === PURPOSE_CATEGORY_TRADE ||
      this.memoRequiredByServer()
        ? [Validators.required]
        : []),
      Validators.maxLength(INTL_MEMO_MAX),
      intlMemoCharset
    ]);
    c.memo.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Source of funds hangs off the *bank's* country, not the method, so it is
   * re-applied whenever either changes; a stale value would ride along.
   */
  applySourceOfFundsValidators(): void {
    const c = this.detailsForm.controls;

    if (this.isSourceOfFundsRequired()) {
      c.sourceOfCash.setValidators(Validators.required);
    } else {
      c.sourceOfCash.clearValidators();
      c.sourceOfCash.reset(null, { emitEvent: false });
      c.sourceOfCashName.reset('', { emitEvent: false });
    }

    c.sourceOfCash.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Only a printed cheque asks for an address here: its "From" is a deliberate
   * choice with nothing to fall back on, and it has no destination at all.
   *
   * A mailed cheque's two ends are materialised for it — the delivery block
   * fills in whichever one the user left on its default — so requiring them
   * only ever fired against an address the user could see was chosen. Off drops
   * any stale id rather than sending it.
   */
  applyCustomAddressValidators(): void {
    const c = this.detailsForm.controls;
    const method = this.sendStateService.methodId();

    c.customShippingFrom.clearValidators();
    c.customShippingTo.clearValidators();

    if (!this.customAddressOn) {
      c.customShippingFrom.reset(null, { emitEvent: false });
      c.customShippingTo.reset(null, { emitEvent: false });
    } else if (method === 'check_print') {
      c.customShippingFrom.setValidators(Validators.required);
      c.customShippingTo.reset(null, { emitEvent: false });
    }

    c.customShippingFrom.updateValueAndValidity({ emitEvent: false });
    c.customShippingTo.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * True when the selected payee bank sits in a country that must declare a
   * source of funds.
   */
  isSourceOfFundsRequired(): boolean {
    const country =
      interBankCountry(this.detailsForm.controls.interBankAc.value) ||
      this.preferredInternationalCountry()?.countryCode ||
      '';
    return (
      this.sendStateService.methodId() === 'international-payment' &&
      SOURCE_OF_FUNDS_COUNTRIES.includes(country)
    );
  }

  // -------------------------------------------------------------------------
  // Virtual card: Rain's two onboarding gates
  // -------------------------------------------------------------------------

  /**
   * Rain's two gates run in order, never side by side: an un-approved account and
   * an un-onboarded wallet would otherwise raise both prompts at once and stack them.
   */
  checkVirtualCardGates(): void {
    this.checkCardOnboarding(() => this.checkWalletCardOnboarding());
  }

  /**
   * The account must be approved for the card program at all; declining the prompt
   * drops back to the first available method.
   */
  checkCardOnboarding(onApproved?: () => void): void {
    if (this.cardOnboardingLoading()) {
      return;
    }
    this.cardOnboardingLoading.set(true);
    this.walletService
      .getCardOnboardingStatus()
      .pipe(finalize(() => this.cardOnboardingLoading.set(false)))
      .subscribe({
        next: ({ success, data }) => {
          if (!success) {
            return;
          }
          this.cardOnboarding.set(data);
          if (data.status === 'Approved') {
            onApproved?.();
            return;
          }

          this.v4AlertService
            .confirmAlert({
              title: 'Not Approved',
              doneMsg: 'Apply Now',
              content:
                "You're not currently approved to make this payment. Do you want to apply for this feature?"
            })
            .afterClosed()
            .subscribe((apply) => {
              if (apply) {
                this.router.navigate(['v4', 'manage', 'virtual-card']);
                return;
              }
              this.resetMethod();
            });
        },
        error: () => undefined
      });
  }

  /**
   * ...and the chosen wallet must itself be onboarded for card issuing: un-onboarded
   * offers the Rain business-mapping modal, pending is rejected.
   */
  checkWalletCardOnboarding(): void {
    // The account-level gate owns the screen until it has passed.
    if (this.cardOnboarding()?.status !== 'Approved') {
      return;
    }

    const { wallet } = this.core();
    if (!wallet?.uuId || this.walletOnboardingInFlight === wallet.uuId) {
      return;
    }
    this.walletOnboardingInFlight = wallet.uuId;

    forkJoin([
      this.walletService.getCardOnboardingStatus(wallet.uuId),
      this.commonVerificationService.applicationStatus()
    ])
      .pipe(finalize(() => this.clearWalletOnboardingFlight()))
      .subscribe({
        next: ([onboarding, application]) => {
          if (!onboarding.success) {
            return;
          }

          const onboard = onboarding.data.wallet_onboard;
          const notOnboarded =
            !onboard || (Array.isArray(onboard) && onboard.length === 0);

          if (notOnboarded) {
            this.v4AlertService
              .confirmAlert({
                title: 'Not Approved',
                doneMsg: 'Apply Now',
                content:
                  'This wallet is not approved for card issuing. To create virtual cards using this wallet, please apply for card program access or switch to an approved wallet'
              })
              .afterClosed()
              .subscribe((apply) => {
                if (apply) {
                  this.openRainCardOnboarding(application.data);
                  return;
                }
                this.clearWallet();
              });
            return;
          }

          const { status } = onboard;
          if (status && status !== 'approved' && status !== 'completed') {
            this.v4AlertService.infoAlert({
              content:
                'Wallet verification is pending. Virtual card can be created only after approval.'
            });
            this.clearWallet();
          }
        },
        error: () => undefined
      });
  }

  // -------------------------------------------------------------------------
  // International: the live quote behind the Exchange Details card
  // -------------------------------------------------------------------------

  clearQuote(): void {
    this.quote.set(null);
    this.quoteSubmitError.set(null);
  }

  // -------------------------------------------------------------------------
  // Pay: ACH / Same-Day ACH / Wire / RTP / vendor-decide -> complete-transaction
  // -------------------------------------------------------------------------

  private payViaCompleteTransaction(): void {
    // Editing an existing payment updates it first, then processes it.
    const editingId = this.editingPaymentId();
    if (editingId) {
      // An approved payment has already passed approval — process it as it
      // stands rather than writing the form back over it.
      const pay$ = this.sendStateService.isApprovedSkipUpdate()
        ? this.paymentsService.processPayment(editingId, this.processBody())
        : this.paymentsService
            .updatePayment(editingId, this.saveBody())
            .pipe(
              switchMap(() =>
                this.paymentsService.processPayment(
                  editingId,
                  this.processBody()
                )
              )
            );

      pay$.subscribe({
        next: () => this.paid(),
        error: (err) => this.handleError(err)
      });
      return;
    }

    this.psbService.completeTransaction(this.completeBody()).subscribe({
      next: (res) => this.paid(res?.isApprovalRequired),
      error: (err) => this.handleError(err)
    });
  }

  // -------------------------------------------------------------------------
  // Pay: check mail / print / email -> save, then process
  // -------------------------------------------------------------------------

  private payViaSaveThenProcess(): void {
    const existingId = this.writeTargetId();

    // A saved payment already has an id; go straight to processing it. An
    // approved one skips the write entirely — its details are locked.
    const createOrUpdate: Observable<string | undefined> = existingId
      ? this.sendStateService.isApprovedSkipUpdate()
        ? of(existingId)
        : this.paymentsService
            .updatePayment(existingId, this.saveBody())
            .pipe(switchMap(() => of(existingId)))
      : this.paymentsService.savePayment(this.saveBody()).pipe(
          tap((res) => this.rememberSavedCheck(res)),
          switchMap((res) => of(res.success ? res.data?.id : undefined))
        );

    createOrUpdate.subscribe({
      next: (paymentId) => {
        if (!paymentId) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.processCheck(paymentId);
      },
      error: (err) => this.handleError(err)
    });
  }

  private processCheck(paymentId: string): void {
    // Tag which payee the check is going to.
    if (this.sendStateService.methodId() === 'check_mail') {
      this.checkService.activeMailPayeeId = this.core().payee?.id ?? null;
    }

    const sendingData = {
      payee_email: this.detailsForm.controls.payeeEmail.value ?? undefined,
      bills: this.billService.billId() ?? []
    };

    this.paymentsService.processPayment(paymentId, sendingData).subscribe({
      next: (res) => {
        // check_email reports a *saved* payment when processing did not succeed.
        if (!res.success) {
          this.afterSuccess();
          this.paymentConfirmService.showSuccess(SUCCESS_SAVED);
          return;
        }
        if (
          this.sendStateService.methodId() === 'check_print' &&
          res.data?.check_id
        ) {
          this.printCheck(res.data.check_id);
          return;
        }
        this.paid();
      },
      error: (err) => this.handleError(err)
    });
  }

  /** Open the rendered PDF. */
  private printCheck(checkId: string): void {
    this.checkService
      .printMultiCheck({
        checkId: [checkId],
        paperType: PAPER_CODE[this.paperType]
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data?.url) {
            window.open(res.data.url, '_blank');
          }
          this.paid();
        },
        error: () => this.paid()
      });
  }

  // -------------------------------------------------------------------------
  // Pay: international payment (Ripple) -> create quote, accept quote
  // -------------------------------------------------------------------------

  private payInternational(proceed?: '0' | '1'): void {
    // The card's live quote is the one we submit; it only goes missing when that
    // call failed or is in flight, so re-quote and carry on.
    const live = this.quote();
    const request = this.quoteRequest();

    if (!live && !request) {
      this.paymentConfirmService.showError({
        error: { errorMsg: 'Could not price this payment. Please try again.' }
      });
      return;
    }

    const gate = this.limitGate();
    gate?.was305Cancelled.set(false);
    // An explicit retry wins; otherwise the card remembers an earlier "Proceed".
    const isProceedPayment = proceed ?? gate?.proceedPayment() ?? '0';

    const quote$: Observable<IWalletInternationaPaymentCreate | undefined> = live
      ? of(live)
      : this.walletService
          .createQuote(request as NonNullable<typeof request>)
          .pipe(switchMap((res) => of(res.data)));

    quote$
      .pipe(switchMap((quote) => this.acceptQuote(quote, isProceedPayment)))
      .subscribe({
        next: () => this.paid(),
        error: (err) => this.handleInternationalError(err)
      });
  }

  private acceptQuote(
    quote: IWalletInternationaPaymentCreate | undefined,
    isProceedPayment: '0' | '1'
  ) {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const bank = d.interBankAc;
    const type = d.recipientType ?? '';

    return this.walletService.acceptQoute({
      payeeId: core.payee?.encryptedId,
      amount: Number(core.amount),
      payeeInternationalBankaccountId: bank?.encrypted_id,
      purpose: d.purpose,
      purpose_category: d.purposeCategory ?? undefined,
      quoteId: quote?.quote_id,
      walletId: core.wallet?.uuId,
      memo: d.memo,
      payeeEmail: d.payeeEmail,
      payeePhone: d.payeePhone,
      country: interBankCountry(bank),
      type,
      bills: this.billService.billId() ?? [],
      // The quote's version is echoed back on accept.
      version: quote?.version,
      isProceedPayment,
      // Source of funds is only sent for India and the Philippines.
      ...(this.isSourceOfFundsRequired() && {
        sourceOfCash: d.sourceOfCash,
        sourceOfCashName: d.sourceOfCashName
      })
    } as never);
  }

  /**
   * Accept-quote answers 305 over a waivable soft limit and 312 over a hard one —
   * neither is a generic failure, so neither reaches `handleError`.
   */
  private handleInternationalError(err: unknown): void {
    const response = err as {
      status?: number;
      error?: {
        errorCode?: number | string;
        errorMsg?: string;
        session_key?: string;
      };
    };
    const code = response?.error?.errorCode;
    const gate = this.limitGate();

    // 112: an OTP challenge. Retry the accept-quote call itself once verified —
    // not `confirm()`, which would reopen the confirmation dialog from scratch.
    if (code === 112 || code === '112') {
      this.sessionKey = response.error?.session_key;
      this.retryAfterOtp(response.error, () => this.payInternational());
      return;
    }

    if (response?.status === 305 || code === 305 || code === '305') {
      this.paymentConfirmService.setProcessing(false);
      gate?.isAwaiting305Confirmation.set(true);

      this.v4AlertService
        .confirmAlert({
          content:
            response.error?.errorMsg ??
            'Transaction limit reached. Do you want to proceed?',
          doneMsg: 'Proceed',
          cancelMsg: 'Cancel',
          // The 305 message arrives with <strong> tags.
          isShowAsHtml: true
        })
        .afterClosed()
        .subscribe((proceed) => {
          gate?.isAwaiting305Confirmation.set(false);
          if (!proceed) {
            gate?.was305Cancelled.set(true);
            return;
          }
          gate?.proceedPayment.set('1');
          this.paymentConfirmService.setProcessing(true);
          this.payInternational('1');
        });
      return;
    }

    // A hard limit: the card renders the message and offers to edit the amount.
    if (code === 312 || code === '312') {
      this.paymentConfirmService.setProcessing(false);
      gate?.transactionLimitMessage.set(
        response.error?.errorMsg ??
          'Transaction limit exceeded for this purpose.'
      );
      return;
    }

    // 266: the payee's phone number is invalid for the destination country.
    if (code === 266 || code === '266') {
      const core = this.core();
      const payeeId = core.payee?.encryptedId;

      if (payeeId) {
        this.paymentConfirmService.setProcessing(false);
        this.v4AlertService
          .failedAlert({
            content:
              response.error?.errorMsg ?? 'Invalid phone number for payee.',
            doneMsg: 'Update',
            isCancel: true
          })
          .afterClosed()
          .subscribe((updateClicked) => {
            if (!updateClicked) {
              return;
            }
            this.dialog
              .open(AddPayeeModalV4Component, {
                maxWidth: '700px',
                width: '95%',
                maxHeight: '90vh',
                disableClose: true,
                autoFocus: false,
                panelClass: 'paddingless-modal-rounded',
                data: { edit: true, id: payeeId, page: 'payeePhone' }
              })
              .afterClosed()
              .subscribe(
                (
                  result: { success?: boolean; phone?: string } | undefined
                ) => {
                  // acceptQuote() reads this hidden control, not the payee
                  // record, so a resubmit would otherwise resend the old phone.
                  if (result?.success && result.phone) {
                    this.detailsForm.controls.payeePhone.setValue(
                      result.phone,
                      { emitEvent: false }
                    );
                  }
                }
              );
          });
        return;
      }
    }

    // 267/268/269: the recipient's bank account itself was rejected. Same
    // recovery action for all three (see inter-receipient.component.ts).
    if (code === 267 || code === '267' || code === 268 || code === '268' ||
      code === 269 || code === '269') {
      const core = this.core();
      const payeeId = core.payee?.encryptedId;

      if (payeeId) {
        this.paymentConfirmService.setProcessing(false);
        this.v4AlertService
          .failedAlert({
            content:
              response.error?.errorMsg ?? 'Invalid recipient bank account.',
            doneMsg: 'Update',
            isCancel: true
          })
          .afterClosed()
          .subscribe((updateClicked) => {
            if (!updateClicked) {
              return;
            }
            const d = this.detailsForm.getRawValue();
            // getInternationalBank() expects the encrypted id, not the plain
            // numeric one — the old AddRecipientModalComponent confirms this.
            const bankEncryptedId = d.interBankAc?.encrypted_id;

            const dialogData: AddPayeeInternationalBankDialogData =
              bankEncryptedId
                ? {
                    payeeId,
                    edit: true,
                    bankId: bankEncryptedId,
                    payeePhone: d.payeePhone ?? '',
                    paymentRecipientType:
                      d.recipientType === 'personal' ? 'personal' : 'business'
                  }
                : {
                    payeeId,
                    accordionMode: true,
                    payeePhone: d.payeePhone ?? '',
                    paymentRecipientType:
                      d.recipientType === 'personal' ? 'personal' : 'business'
                  };
            this.dialog
              .open(AddPayeeInternationalBankV4Component, {
                autoFocus: false,
                disableClose: true,
                maxWidth: '95%',
                width: '600px',
                panelClass: 'paddingless-modal-rounded',
                data: dialogData
              })
              .afterClosed()
              .subscribe((result: { success?: boolean } | undefined) => {
                if (result?.success) {
                  if (bankEncryptedId) {
                    // Same bank, now corrected — keep it selected.
                    this.preferredInternationalBankId.set(bankEncryptedId);
                  }
                  // Best-effort: reloads the dropdown; a newly added bank (no
                  // known id) may still need to be picked manually.
                  this.internationalBankReloadTrigger.update((n) => n + 1);
                }
              });
          });
        return;
      }
    }

    this.handleError(err);
  }

  // -------------------------------------------------------------------------
  // Pay: virtual card (Rain) -> create gift card
  // -------------------------------------------------------------------------

  private payVirtualCard(): void {
    const core = this.core();
    const details = this.detailsForm.getRawValue();

    this.walletService
      .createGiftCard({
        walletId: core.wallet?.uuId,
        cardType: 'virtual',
        limitAmount: core.amount,
        cardLimitType: details.cardLimitType,
        payeeId: core.payee?.id,
        payeeEmail: details.payeeEmail,
        payeePhone: details.payeePhone,
        session_key: this.sessionKey
      } as never)
      .subscribe({
        next: (res) => {
          // A 112 arrives as a non-error response here.
          if (!res.success && String(res.errorCode) === String(ERR_OTP)) {
            this.sessionKey = res.session_key;
            this.retryAfterOtp(res, () => this.payVirtualCard());
            return;
          }
          // Any other unsuccessful response is a failure, not a payment.
          if (!res.success) {
            this.paymentConfirmService.setProcessing(false);
            return;
          }
          this.paid();
        },
        error: (err) => this.handleError(err)
      });
  }

  // -------------------------------------------------------------------------
  // Payload builders
  // -------------------------------------------------------------------------

  /** POST /zil-payments — the draft body, and the same shape for update. */
  private saveBody(): IUpdatePaymentBody {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const method = this.sendStateService.methodId();

    const body: IUpdatePaymentBody = {
      transferType: transferTypeOf(method),
      amount: Number(core.amount),
      category: d.category?.id,
      description: d.memo ?? '',
      payee: core.payee?.id,
      payeeBankAccount: bankAccountId(d.payeeBankAc),
      paymentDueDate: isWireLike(method) ? LEGACY_FIXED_DUE_DATE : today(),
      referenceNo: d.invoiceNumber ?? undefined,
      sourceId: core.wallet?.uuId,
      sourceType: 'wallet',
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      items: this.remittanceItems,
      payeeIdNumber: d.payeeIdNumber ?? undefined,
      payeeEmail: d.payeeEmail ?? undefined,
      bills: this.billService.billId() ?? []
    };

    // `remittanceType` names the format of the line items. With no items there
    // is no format, and sending `0` reads as "old format" rather than "none".
    if (this.hasRemittance) {
      body.remittanceType = this.remittanceType;
    }

    // Only the two non-mail check methods send paymentMethod.
    if (method === 'check_print' || method === 'check_email') {
      body.paymentMethod = method;
    }

    if (method === 'check_mail') {
      body.shippingType = d.shippingType ?? undefined;
      body.sentWithAttachment = this.envelopeAttachmentIds.length ? 1 : 0;
    }

    // check_mail sends both ends and flags the payment; check_print only names
    // the sender.
    if (d.isCustomAddress) {
      if (method === 'check_mail') {
        body.sentToCustomAddress = 1;
        body.customShippingFrom = d.customShippingFrom ?? undefined;
        body.customShippingTo = d.customShippingTo ?? undefined;
      } else if (method === 'check_print') {
        body.customShippingFrom = d.customShippingFrom ?? undefined;
      }
    }

    return body;
  }

  /** POST /payment-methods/complete-transaction — ACH / Wire / RTP only. */
  private completeBody(): IPaymentBody {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const method = this.sendStateService.methodId();
    const isAch = method === 'ach' || method === 'same-ach';
    const isLetPayeeChoose = method === 'let-payee-choose';

    const body: IPaymentBody = {
      type: 'wallet',
      walletId: core.wallet?.uuId,
      amount: core.amount,
      payees: [
        {
          id: core.payee?.id,
          amount: core.amount,
          email: d.payeeEmail,
          memo: d.memo,
          bankAccount: bankAccountId(d.payeeBankAc),
          invoiceNumber: d.invoiceNumber,
          // Vendor-decide is the one wallet rail that carries the payee's own
          // account number on the payee.
          ...(isLetPayeeChoose && {
            payeeIdNumber: d.payeeIdNumber ?? undefined
          }),
          bills: this.billService.billId() ?? []
        }
      ],
      mode: modeOf(method),
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      items: this.remittanceItems,
      // Stated rather than left off: v4 sends it explicitly.
      ...(isLetPayeeChoose && { isSameDay: 0 })
    };

    // See `saveBody` — only a real remittance has a format to name.
    if (this.hasRemittance) {
      body.remittanceType = this.remittanceType;
    }

    // RTP omits the root-level category.
    if (method !== 'rtp') {
      body.category = d.category?.id ?? '';
    }

    if (isAch) {
      body.send_sms = d.send_sms;
      body.payee_phone = d.payeeNumber;
      body.payees[0].phone = d.payeeNumber;
      body.isSameDay = method === 'same-ach' || d.isSameDay ? 1 : 0;
      body.achRecurring = d.needAchRecurring ? 1 : 0;

      if (d.needAchRecurring && this.recurring) {
        return { ...body, ...this.recurring };
      }
    }

    return body;
  }

  /** POST /zil-payments/{id}/process-payment — pay after update. */
  private processBody() {
    const d = this.detailsForm.getRawValue();
    const isAch = this.sendStateService.methodId()?.includes('ach');

    return {
      payee_bank_account_id: bankAccountId(d.payeeBankAc),
      payee_email: d.payeeEmail ?? undefined,
      ...(isAch && {
        achRecurring: d.needAchRecurring ? 1 : 0,
        // The SMS notice rides on this call the same way it rides on
        // complete-transaction. Both keys always go: off is `false` with an
        // empty phone, not an absent pair.
        send_sms: !!d.send_sms,
        payee_phone: d.send_sms ? d.payeeNumber ?? '' : '',
        ...(this.recurring && { recurring: this.recurring.recurring })
      })
    };
  }

  private confirmRequest(): IConfirmRequest {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const method = this.sendStateService.methodId();
    const label = confirmLabel(method, this.paperType, d.isSameDay);
    // A wallet draws a cheque like any other source; without its own id the
    // preview had nothing to draw and came back blank.
    const drawsCheck = CHECK_PREVIEW_METHODS.includes(method ?? '');

    return {
      accNumber: core.wallet?.bankAccountNumber ?? '',
      bankName: core.wallet?.walletName ?? '',
      payeeName: core.payee?.name ?? '',
      paymentMethod: label,
      amount: Number(core.amount).toFixed(2),
      type: 'wallet',
      // Drives the modal's "Processing Time" row. The label stays as `confirmLabel`
      // words it — the enum's own wording differs for the check methods.
      source: PaymentSource.Wallet,
      method: confirmMethod(method, d.isSameDay),
      paymentMethodLabelOverride: label,
      ...(method === 'check_mail' && {
        shippingType: d.shippingType ?? undefined
      }),
      ...(d.needAchRecurring &&
        this.recurring && { recurringDetails: this.recurring as never }),
      // RTP's modal omits this.
      ...(method !== 'rtp' && {
        isPayeeBankVerified: !(
          this.paymentsService.isPayeeBankVerificationRequired &&
          d.payeeBankAc?.verified !== 1
        )
      }),
      walletFallback: isWalletFallback(method, d.payeeBankAc),
      ...(drawsCheck
        ? {
            checkPreviewData: buildCheckPreviewValues({
              payee: this.sendStateService.payeeDetails()?.payee_information,
              payeeName: core.payee?.name ?? '',
              amount: core.amount ?? '',
              memo: d.memo ?? ''
            }),
            checkPreviewPayload: buildCheckPreviewPayload({
              sourceType: 'wallet',
              sourceId: core.wallet?.uuId,
              payeeId: core.payee?.id,
              amount: Number(String(core.amount ?? '').replace(/[$,]/g, '')),
              memo: d.memo ?? undefined
            })
          }
        : {})
    };
  }

  /**
   * What the success modal shows. Captured before the request goes out, so a
   * form reset afterwards can't blank the modal that is still on screen.
   */
  private captureSuccessContext(): void {
    const core = this.core();
    const d = this.detailsForm.getRawValue();

    this.paymentConfirmService.setSuccessContext({
      amount: Number(core.amount).toFixed(2),
      payeeName: core.payee?.name ?? '',
      paymentMethod: this.sendStateService.methodId() ?? '',
      bankName: core.wallet?.walletName ?? '',
      sourceAccountDisplay: String(core.wallet?.bankAccountNumber ?? ''),
      ...(d.needAchRecurring && { emailType: 'recurring' as const })
    });
  }

  // -------------------------------------------------------------------------
  // Shared tail
  // -------------------------------------------------------------------------

  /** Both forms must be valid, and a compliance freeze blocks everything. */
  private validate(showAlert = true): boolean {
    if (this.paymentsService.checkForComplianceFreeze()) {
      this.paymentsService.openComplianceFreezeModal();
      return false;
    }

    const { memo } = this.detailsForm.controls;
    if (typeof memo.value === 'string') {
      memo.setValue(memo.value.trim(), { emitEvent: false });
    }

    // An address the carrier has refused. The mailing block says so under the
    // end it belongs to and offers to fix it, so this only points at it — an
    // alert would repeat it in a dialog the user has to dismiss to get there.
    if (
      this.sendStateService.methodId() === 'check_mail' &&
      this.sendStateService.addressDeliveryError()
    ) {
      this.sendStateService.deliveryError.set(true);
      this.sendStateService.requestFieldFocus('checkMailing');
      return false;
    }

    // payeePhone is pre-filled from the payee record and has no editable field
    // on the form — an error on it must open the payee editor, not shake an
    // element the user cannot see.
    if (this.detailsForm.controls.payeePhone?.invalid && showAlert) {
      this.paymentConfirmService.setProcessing(false);
      this.v4AlertService
        .failedAlert({
          content:
            'The payee\'s phone number is not valid for international payment. Please update it.',
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((updateClicked) => {
          if (!updateClicked) {
            return;
          }
          const payeeId = this.core().payee?.encryptedId;
          if (payeeId) {
            this.dialog
              .open(AddPayeeModalV4Component, {
                maxWidth: '700px',
                width: '95%',
                maxHeight: '90vh',
                disableClose: true,
                autoFocus: false,
                panelClass: 'paddingless-modal-rounded',
                data: { edit: true, id: payeeId, page: 'payeePhone' }
              })
              .afterClosed()
              .subscribe((result: { success?: boolean } | undefined) => {
                if (result?.success) {
                  this.v4AlertService.successAlert({
                    content: 'Phone number updated. Please confirm your payment again.'
                  });
                }
              });
          }
        });
      return false;
    }

    // Asked before the form check. A missing payee email also fails the
    // required `payeeEmail` control, so the focus-and-shake branch below won
    // and the user was never told what was missing nor offered to add it.
    if (showAlert && this.sendStateService.missingPayeeFields().length) {
      this.sendStateService.promptMissingPayeeField();
      return false;
    }

    // The stored email is present but fails the check. No field on the form
    // holds it, so the generic branch below could only shake the payee row
    // with no word on why; the prompt names it and opens the editor. An empty
    // email is not this case: with no payee the page points at the payee
    // field, and with one the missing-details prompt above has asked for it.
    if (
      showAlert &&
      storedPayeeEmailFailsCheck(
        this.detailsForm.controls.payeeEmail,
        !!this.core().payee?.id
      )
    ) {
      this.sendStateService.promptInvalidPayeeEmail();
      return false;
    }

    if (
      (this.sendStateService.coreForm.invalid || this.detailsForm.invalid) &&
      showAlert
    ) {
      this.sendStateService.coreForm.markAllAsTouched();
      this.detailsForm.markAllAsTouched();
      this.sendStateService.requestFieldFocus(
        this.sendStateService.invalidKeys(this.detailsForm)
      );
      return false;
    }

    if (this.sendStateService.methodId() === 'international-payment') {
      // The limit card already says what is wrong and offers Edit amount, so
      // point at it rather than repeat its message in a dialog.
      const gate = this.limitGate();
      if (gate?.isLockedForSubmit()) {
        this.sendStateService.requestFieldFocus('transactionLimit');
        return false;
      }

      // No live rate means nothing to submit. This used to pass, open the
      // confirmation modal, and only after Confirm say the payment could not
      // be priced. Now it stops here and points at the recipient block.
      if (!this.quote()) {
        this.quoteSubmitError.set(
          this.quoteLoading()
            ? 'Still getting the exchange rate. Try again in a moment.'
            : 'No exchange rate yet. Check the amount (at least $10), the recipient type and the destination currency, then confirm again.'
        );
        this.sendStateService.requestFieldFocus('exchange');
        return false;
      }
      this.quoteSubmitError.set(null);
    }

    return true;
  }

  private paid(isApprovalRequired?: boolean): void {
    this.afterSuccess();
    this.paymentConfirmService.showSuccess(
      isApprovalRequired ? SUCCESS_APPROVAL_REQUIRED : 'send'
    );
  }

  private afterSuccess(): void {
    this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
      this.walletDataService.transactionUpdated$.next(true);
    });
    this.billService.billId.set(undefined);
    // A consumed quote must not be replayed on the next payment.
    this.clearQuote();

    if (this.detailsForm.controls.needAchRecurring.value) {
      this.recurringRedirectService.mark('ach', true);
    }
  }

  private handleError(err: unknown): void {
    const error = (
      err as {
        error?: { errorCode?: number; errorMsg?: string; session_key?: string };
      }
    )?.error;
    const code = Number(error?.errorCode);

    if (code === ERR_KYC_REQUIRED) {
      this.paymentConfirmService.setProcessing(false);
      this.startKyc();
      return;
    }

    if (code === ERR_OTP) {
      this.sessionKey = error?.session_key;
      this.retryAfterOtp(error, () => this.confirm());
      return;
    }

    // These render their own UI further down the stack.
    if (ERR_SELF_HANDLED.includes(code)) {
      this.paymentConfirmService.setProcessing(false);
      return;
    }

    this.paymentConfirmService.showError(err);
  }

  /** A 112 asks for a one-time passcode, then replays the same call. */
  private retryAfterOtp(data: unknown, retry: () => void): void {
    this.paymentConfirmService.setProcessing(false);
    this.dialog
      .open(OtpModalV4Component, { ...OTP_DIALOG_CONFIG, data })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          // Re-arm the guard the button's [disabled] reads — otherwise it's
          // clickable again for the whole retried call.
          this.paymentConfirmService.setProcessing(true);
          retry();
        }
      });
  }

  private startKyc(): void {
    if (environment.isV4Persona) {
      this.personaHelperService.openModal('kyc', CVSourceType.other, true);
      return;
    }
    this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private core() {
    return this.sendStateService.coreForm.getRawValue();
  }

  private payeeBank(): IPayeeViewBank | null {
    return this.detailsForm.controls.payeeBankAc.value;
  }

  /** The payment being edited, if this is an edit — a clone writes a new record. */
  private editingPaymentId(): string | undefined {
    return this.sendStateService.mode() === 'EDIT'
      ? this.sendStateService.paymentId()
      : undefined;
  }

  private writeTargetId(): string | undefined {
    return (
      this.editingPaymentId() ??
      (this.isCheckMethod() ? this.savedCheckPaymentId() : undefined)
    );
  }

  private isCheckMethod(): boolean {
    return CHECK_METHODS.includes(this.sendStateService.methodId() ?? '');
  }

  /** Hold on to a cheque `POST /zil-payments` just created, so the next write updates it. */
  private rememberSavedCheck(res: { success?: boolean; data?: { id?: string } }): void {
    if (this.isCheckMethod() && res?.success && res.data?.id) {
      this.savedCheckPaymentId.set(res.data.id);
    }
  }

  /** POST a new draft, or PUT the one being edited. */
  private writePayment(editingId: string | undefined) {
    return editingId
      ? this.paymentsService.updatePayment(editingId, this.saveBody())
      : this.paymentsService.savePayment(this.saveBody());
  }

  /**
   * A quote needs an amount over the minimum, a payee, and a recipient bank
   * whose country we know.
   */
  private quoteRequest(): IQuoteRequest | null {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const country = interBankCountry(d.interBankAc);
    const amount = Number(core.amount);

    if (
      this.sendStateService.methodId() !== 'international-payment' ||
      !country ||
      !d.recipientType ||
      !core.payee?.encryptedId ||
      !amount ||
      amount < INTL_MIN_AMOUNT
    ) {
      return null;
    }

    return {
      countryCode: country,
      payoutCurrencyCode: interBankCurrency(d.interBankAc),
      amount,
      type: d.recipientType,
      isReceivingAmount: 0
    };
  }

  private clearWalletOnboardingFlight(): void {
    this.walletOnboardingInFlight = undefined;
  }

  private openRainCardOnboarding(kycKybStatus: unknown): void {
    this.dialog
      .open(RaincardSelectBusinessV4Component, {
        maxWidth: '515px',
        width: '100%',
        maxHeight: '85%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: {
          sourceType: CVSourceType.rain_card,
          applicationStatus: kycKybStatus,
          mode: 'map',
          from: 'home',
          kybRecords: this.cardOnboarding()?.active_user_kyb_records
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.success) {
          this.clearWallet();
          return;
        }
        if (res.proceedPayment && this.validate(false)) {
          this.confirm();
          return;
        }
        this.clearWallet();
        this.v4AlertService.successAlert({
          content:
            'Your wallet is currently under on review. Once approved, you will be able to make this payment.'
        });
      });
  }

  private clearWallet(): void {
    this.sendStateService.coreForm.controls.wallet.reset();
  }

  /** Rain's `reset` output: fall back to the first selectable method. */
  private resetMethod(): void {
    const fallback =
      this.sendStateService.payAsItems().find((m) => !m.locked) ?? null;
    this.sendStateService.selectMethod(fallback);
  }
}

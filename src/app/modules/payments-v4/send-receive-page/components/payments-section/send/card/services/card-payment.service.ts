/* eslint-disable no-void */
import {
  computed,
  inject,
  signal,
  DestroyRef,
  Injectable,
  Renderer2,
  RendererFactory2
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import type { IRemittanceDetails } from 'src/app/models/bank';
import type { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import type { IAddCardResponse } from 'src/app/shared/modal/add-credit-card/add-credit-card.model';
import { Store } from '@ngrx/store';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import type { IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import type { ICategoryDropdown } from 'src/app/modules/category/model/category';
import type {
  ICardPaymentReqDocRes,
  IPaymentBody,
  IPaymentDetails,
  IUpdatePaymentBody,
  ThreeDSPayload
} from 'src/app/modules/payments/model/payments';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import type { IBillBulkPaymentData } from 'src/app/modules/bill/model/Bill';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  OpenAddCardV4Service,
  type ICardTransLimitDropdown
} from 'src/app/shared/service/open-add-card/open-add-card-v4.service';
// The class in shared/service/card-payment is the 3DS helper, not a payment
// orchestrator — this service is the orchestrator, so the helper is aliased.
import { CardPaymentService as Card3dsService } from 'src/app/shared/service/card-payment/card-payment.service';
import type { ThreeDsInstance } from 'src/app/modules/cards/components/v35/models/cards-ocw-v35.interface';
import { V4CardTransactionDocsPreviewModalComponent } from 'src/app/modules/payments-v4/send-payment/components/modals/card-transaction-docs-preview-modal/card-transaction-docs-preview-modal.component';
import {
  VerifyCardModalV4Component,
  type IVerifyCardInvoiceDialogData
} from 'src/app/modules/payments-v4/send-payment/components/modals/verify-card-modal/verify-card-modal-v4.component';
import {
  OtpModalV4Component,
  type IOtpModalV4Result
} from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';
import {
  PaymentMethod,
  PaymentSource
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';

import { AccountVerificationService } from '../../shared/services/account-verification.service';
import {
  PaymentConfirmService,
  SUCCESS_SAVED,
  buildCheckPreviewPayload,
  buildCheckPreviewValues,
  isWalletFallback,
  type IConfirmRequest
} from '../../shared/services/payment-confirm.service';
import type { IFeeRequest } from '../../shared/services/payment-fee.service';
import type { ISendSourceService } from '../../shared/models/send-source.model';
import { SendStateService } from '../../shared/services/send-state.service';
import { LET_VENDOR_DECIDE_ID } from 'src/app/modules/payments/model/pay-as-options';


const CARD_MIN_AMOUNT = environment.isItDev ? 0.01 : 10;
export const CARD_MEMO_MAX = 26;
const CARD_MEMO_PATTERN = /^[a-zA-Z ]*$/;

export const PURPOSE_OTHER = 'Other';

/** The two ids that name the same rail: an ACH, standard or same-day. */
const ACH_METHODS = ['ach', 'same-ach'];

/** ACH and wire land in a bank account; a mailed check does not. */
const PAYEE_BANK_METHODS = ['ach', 'same-ach', 'wire'];

const REQUIRED_DOCS_TRANSFER_TYPE: Record<string, string> = {
  ach: '1',
  'same-ach': '1'
};

const CARD_FEE_MODE: Record<string, number> = {
  ach: 1,
  'same-ach': 1,
  wire: 6,
  check_mail: 8
};

/** `IUpdatePaymentBody.transferType` for the card methods. */
const CARD_TRANSFER_TYPE: Record<string, string> = {
  ach: 'ach',
  'same-ach': 'ach',
  wire: 'wire',
  check_mail: 'checkMail',
  'let-payee-choose': LET_VENDOR_DECIDE_ID
};

const CARD_CAPTURE_MODE: Record<string, string> = {
  ach: '1',
  'same-ach': '1',
  wire: '6',
  'let-payee-choose': '10'
};

const CARD_DOC_MODE: Record<string, string> = {
  ach: '1',
  'same-ach': '1',
  wire: '6',
  check_mail: '8'
};

const CAPTURE_METHODS = ['ach', 'same-ach', 'wire', 'let-payee-choose'];

const THREE_DS_METHODS = ['ach', 'check_mail'];

const THREE_DS_GATEWAY = 2;

/** "You need to enable credit card before making a payment." */
const ERR_CARD_NOT_ENABLED = 441;
/** "You need to verify your business before making a payment." */
const ERR_BUSINESS_NOT_VERIFIED = 442;
const ERR_OTP = '112';
const ERR_DOCS_PREVIEW = '808';
const ERR_STALE_CARD_STATE = 816;
const ERR_PAGE_STALE = 783;

const NO_BILL_MEMO_PLUGIN = 'no-bill-payment-memo-default';

/** Shared by every OTP step-up the card rail raises. */
const OTP_DIALOG_CONFIG = {
  maxWidth: '450px',
  width: '100%',
  disableClose: true,
  autoFocus: false,
  panelClass: 'paddingless-modal-rounded'
};

/** Shared by every documents-preview agreement the card rail raises. */
const DOCS_PREVIEW_DIALOG_CONFIG = {
  maxWidth: '750px',
  width: '100%',
  disableClose: true,
  autoFocus: false,
  panelClass: 'paddingless-modal-rounded'
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ICardDetailsForm {
  payeeEmail: FormControl<string | null>;
  invoiceNumber: FormControl<string | null>;
  payeeIdNumber: FormControl<string | null>;
  payeeBankAc: FormControl<IPayeeViewBank | null>;
  category: FormControl<ICategoryDropdown | null>;
  purposeOfPayment: FormControl<string | null>;
  memo: FormControl<string | null>;
  sendSms: FormControl<boolean | null>;
  payeeNumber: FormControl<string | null>;
  shippingType: FormControl<string | null>;
}

interface ICardProcessBody {
  payee_email?: string;
  documents?: ICardPaymentReqDocRes;
  otp_and_docs_preview_section_in_credit_card: number;
  otp_type: string;
  email_otp_session_key: string;
  phone_otp_session_key: string;
  document_preview_agree: number;
  /** ACH only — wire and mailed checks send the two OTP keys and nothing else. */
  session_key?: string;
  /** ACH and wire only — a mailed check has no payee bank. */
  payee_bank_account_id?: string;
  /** ACH and mailed checks only — a wire carries no 3DS. */
  three_ds_data?: ThreeDSPayload;
  /** Mailed checks only. */
  category?: string;
  /** Mailed checks only. */
  bills?: string[];
  /** ACH only — notify the payee by text, and the number to use. */
  send_sms?: boolean;
  payee_phone?: string;
}

interface ICardVerifyResult {
  success: boolean;
  data?: ICardPaymentReqDocRes;
  authSign?: string;
}

/** The error envelope every card endpoint fails with. */
interface IApiErrorBody {
  error?: {
    errorCode?: string | number;
    errorMsg?: string;
    session_key?: string;
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function toCardMemo(value: string): string {
  return value
    .replace(/[^a-zA-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CARD_MEMO_MAX);
}

function today(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bankAccountId(bank: IPayeeViewBank | null): string | undefined {
  return bank?.encrypted_id ?? (bank?.id != null ? String(bank.id) : undefined);
}

function confirmLabel(methodId: string | null): string {
  switch (methodId) {
    case 'ach':
      return 'ACH / Direct Deposit';
    case 'wire':
      return 'Wire';
    case 'check_mail':
      return 'Check Mail';
    case 'let-payee-choose':
      return 'Let the vendor decide';
    default:
      return '';
  }
}

/** The error envelope, whichever card endpoint raised it. */
function apiError(err: unknown): IApiErrorBody['error'] {
  return (err as IApiErrorBody)?.error;
}

/** The memo a card sends is derived from Purpose of Payment, so it inherits its charset. */
function cardMemoCharset(control: { value: unknown }) {
  const { value } = control;
  if (typeof value !== 'string' || value === '') {
    return null;
  }
  return CARD_MEMO_PATTERN.test(value) ? null : { specialChar: true };
}

/** What the card rail holds every memo to, whether it was chosen or typed. */
const CARD_MEMO_VALIDATORS = [
  Validators.maxLength(CARD_MEMO_MAX),
  cardMemoCharset
];

/** The methods that draw a cheque, and so have a preview worth fetching. */
const CHECK_PREVIEW_METHODS: readonly string[] = [
  'check',
  'check_mail',
  'check_print',
  'check_email'
];

@Injectable()
export class CardPaymentService implements ISendSourceService {
  // -------------------------------------------------------------------------
  // Dependency injection
  // -------------------------------------------------------------------------

  private readonly paymentsService = inject(PaymentsService);
  private readonly cybersourceService = inject(CybersourceService);
  private readonly checkService = inject(CheckService);
  private readonly billService = inject(BillService);
  private readonly headerService = inject(HeaderService);
  private readonly personaHelperService = inject(PersonaHelperService);
  private readonly card3dsService = inject(Card3dsService);
  private readonly clickTrackingService = inject(ClickTrackingService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly v4AlertService = inject(V4AlertService);
  private readonly openAddCardService = inject(OpenAddCardV4Service);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sendStateService = inject(SendStateService);
  private readonly accountVerificationService = inject(AccountVerificationService);
  private readonly paymentConfirmService = inject(PaymentConfirmService);

  /** 3DS mounts its challenge into the DOM, so it needs a renderer of its own. */
  private readonly renderer: Renderer2 = inject(RendererFactory2).createRenderer(
    null,
    null
  );

  readonly gatewayType = signal<number | undefined>(undefined);
  readonly purposeOptions = signal<string[]>([]);
  readonly purposeIsOther = signal(false);

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  readonly detailsForm = new FormGroup<ICardDetailsForm>({
    payeeEmail: new FormControl('', [
      Validators.required,
      ValidationService.emailValidator,
      inject(ValidationService).validateDifferentEmail()
    ]),
    invoiceNumber: new FormControl('', [
      Validators.required,
      Validators.maxLength(30)
    ]),
    payeeIdNumber: new FormControl('', [Validators.maxLength(30)]),
    payeeBankAc: new FormControl<IPayeeViewBank | null>(null),
    category: new FormControl<ICategoryDropdown | null>(null),
    purposeOfPayment: new FormControl<string | null>(null, [Validators.required]),
    memo: new FormControl('', CARD_MEMO_VALIDATORS),

    sendSms: new FormControl(false),
    payeeNumber: new FormControl(''),

    shippingType: new FormControl<string | null>(null)
  });

  // -------------------------------------------------------------------------
  // Public properties — the toolbar payload, owned by SendComponent's modals
  // -------------------------------------------------------------------------

  insertFromRemittance = false;
  remittanceItems: IRemittanceDetails[] = [];
  remittanceType = 1;
  commentIds: string[] = [];
  attachmentIds: string[] = [];
  envelopeAttachmentIds: string[] = [];

  get hasRemittance(): boolean {
    return this.remittanceItems.length > 0;
  }

  // -------------------------------------------------------------------------
  // Private properties
  // -------------------------------------------------------------------------

  private readonly detailsDefaults = this.detailsForm.getRawValue();

  // Card step-up state, carried across the OTP / docs-preview replays.
  private sessionKey = '';
  private emailOtpKey = '';
  private phoneOtpKey = '';
  private uploadedDocs: ICardPaymentReqDocRes | undefined;
  private signatureUrl = '';
  private threeDsData: ThreeDSPayload | undefined;
  private threeDsInstance: ThreeDsInstance | undefined;

  private get payloadItems(): IRemittanceDetails[] {
    return this.insertFromRemittance ? this.remittanceItems : [];
  }

  // -------------------------------------------------------------------------
  // ISendSourceService
  // -------------------------------------------------------------------------

  /**
   * The memo always shows on a card. Picking a purpose fills it in; picking
   * Other clears it and hands the user a labelled field in Additional Details
   * that writes the same control.
   */
  readonly memoConfig = computed(() => ({
    visible: true,
    maxLength: CARD_MEMO_MAX
  }));

  resetDetails(): void {
    this.detailsForm.reset(this.detailsDefaults);
    // The reset cleared the purpose, so the memo is no longer required.
    this.applyPurposeValidators();
    this.resetCardState();
    this.insertFromRemittance = false;
    this.remittanceItems = [];
    this.remittanceType = 1;
    this.commentIds = [];
    this.attachmentIds = [];
  }

  /**
   * Re-hydrate a payment being edited or cloned — the card-only fields. The payee's
   * own (email, id number, phone) aren't on the payment; CardPaymentComponent fills those.
   */
  patchDetailsFromPayment(details: IPaymentDetails): void {
    const isClone = this.sendStateService.mode() === 'CLONE';

    this.detailsForm.patchValue(
      {
        memo: details.description ?? '',
        invoiceNumber: isClone ? '' : details.referenceNo ?? '',
        category: details.category?.id ? details.category : null,
        shippingType: details.metadata?.shippingType ?? null
      },
      { emitEvent: false }
    );

    // The memo *is* the purpose on a card, so the dropdown has to agree with it.
    this.syncPurposeFromMemo();
  }

  patchDetailsFromBill(bill: IBillBulkPaymentData): void {
    const plugins = this.localStorageService.getItem('userPlugins') as
      | string[]
      | null;

    const memo =
      bill.memo ||
      (plugins?.includes(NO_BILL_MEMO_PLUGIN)
        ? ''
        : `Payment for Bill ${bill.invoiceNumbers}`);

    this.detailsForm.patchValue(
      {
        memo: toCardMemo(memo),
        invoiceNumber: bill.invoiceNumbers ?? ''
      },
      { emitEvent: false }
    );

    // The memo *is* the purpose on a card, so the dropdown has to agree with it.
    this.syncPurposeFromMemo();
  }

  feeInputs(): Pick<IFeeRequest, 'shippingType' | 'isSameDay' | 'cardMode'> {
    const method = this.sendStateService.methodId() ?? '';
    return {
      shippingType: this.detailsForm.controls.shippingType.value ?? undefined,
      isSameDay: this.isSameDay(),
      cardMode: CARD_FEE_MODE[method]
    };
  }

  /**
   * Save a draft. Nothing is charged, so the documents and 3DS gates don't run — but
   * the banned-payee check does.
   */
  async save(): Promise<void> {
    if (!this.validate()) {
      return;
    }

    if (!this.accountVerificationService.verifyForPayment(() => void this.save())) {
      return;
    }

    if (!this.passesCardGates()) {
      return;
    }

    this.paymentConfirmService.setProcessing(true);
    if (await this.isPayeeBanned()) {
      this.paymentConfirmService.setProcessing(false);
      return;
    }

    const editingId = this.editingPaymentId();
    this.captureSuccessContext();

    this.writePayment(editingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.paymentConfirmService.setProcessing(false);
            return;
          }
          this.trackPaymentDone(res?.data?.id);
          this.afterSuccess();
          this.paymentConfirmService.showSuccess(SUCCESS_SAVED);
        },
        error: (err) => this.handleError(err, () => void this.save())
      });
  }

  /**
   * Pay. The gate chain runs *before* the confirmation modal, so the user is not
   * asked to confirm a payment that a gate is about to refuse.
   */
  async confirm(): Promise<void> {
    if (!this.validate()) {
      return;
    }
    if (
      !this.accountVerificationService.verifyForPayment(() => void this.confirm())
    ) {
      return;
    }
    if (!this.passesCardGates()) {
      return;
    }

    this.paymentConfirmService.setProcessing(true);
    if (await this.isPayeeBanned()) {
      this.paymentConfirmService.setProcessing(false);
      return;
    }
    this.paymentConfirmService.setProcessing(false);

    this.resetCardState();
    this.captureSuccessContext();

    this.paymentConfirmService
      .ask(this.confirmRequest())
      .subscribe((confirmed) => {
        if (!confirmed) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.paymentConfirmService.setProcessing(true);
        this.checkRequiredDocuments();
      });
  }

  // -------------------------------------------------------------------------
  // Amount checks — card only
  // -------------------------------------------------------------------------

  runAmountChecks(): void {
    if (this.sendStateService.sourceId() !== 'card') {
      return;
    }

    const amount = Number(this.sendStateService.coreForm.controls.amount.value);

    // An amount of nothing routes to no gateway, so the card list stops filtering
    // by one — `fetchGatewayType` never answers for a zero.
    if (!amount) {
      this.gatewayType.set(undefined);
    }
    this.paymentsService.fetchGatewayType(amount, (type) =>
      this.gatewayType.set(type)
    );

    this.checkTransLimit(amount);
  }

  checkTransLimit(amount: number): void {
    this.openAddCardService.checkTransLimitForCard({
      amount,
      card: this.sendStateService.coreForm.controls.card.value,
      dropdown: this.transLimitDropdown()
    });
  }

  // -------------------------------------------------------------------------
  // Purpose of Payment
  // -------------------------------------------------------------------------

  syncPurposeFromMemo(): void {
    const memo = this.detailsForm.controls.memo.value;
    const options = this.purposeOptions();
    if (!memo || !options.length) {
      return;
    }

    this.detailsForm.controls.purposeOfPayment.setValue(
      options.includes(memo) ? memo : PURPOSE_OTHER,
      // Writing the purpose writes the memo, which would overwrite the memo we
      // are reading here — and blank it outright on the `Other` branch.
      { emitEvent: false }
    );

    // ...but silencing that subscription also silences the one that makes the
    // memo required, so an edited `Other` payment has to be told here.
    this.applyPurposeValidators();
  }

  // -------------------------------------------------------------------------
  // Validators per method
  // -------------------------------------------------------------------------

  /** Which details fields are required depends on the method. */
  applyMethodValidators(methodId: string | null): void {
    const c = this.detailsForm.controls;
    c.payeeBankAc.setValidators(methodId === 'wire' ? [Validators.required] : []);

    // A mailed check is priced and routed per carrier.
    c.shippingType.setValidators(
      methodId === 'check_mail' ? [Validators.required] : []
    );

    this.applySmsValidators();
    this.applyPurposeValidators();

    Object.values(c).forEach((control) =>
      control.updateValueAndValidity({ emitEvent: false })
    );
    this.detailsForm.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Every purpose but "Other" *is* the memo, so only "Other" shows and requires one.
   * Called from every purpose-change path, including the `emitEvent: false` ones.
   */
  applyPurposeValidators(): void {
    const c = this.detailsForm.controls;
    const isOther = c.purposeOfPayment.value === PURPOSE_OTHER;

    // What shows the memo field, and the reason every purpose change routes
    // through here rather than only through `valueChanges`.
    this.purposeIsOther.set(isOther);

    c.memo.setValidators(
      isOther
        ? [Validators.required, ...CARD_MEMO_VALIDATORS]
        : CARD_MEMO_VALIDATORS
    );
    c.memo.updateValueAndValidity({ emitEvent: false });
  }

  /** The SMS toggle asks for the number it will text. */
  applySmsValidators(): void {
    const c = this.detailsForm.controls;
    c.payeeNumber.setValidators(
      this.isAch() && c.sendSms.value
        ? [Validators.required, ValidationService.phoneMinLength]
        : []
    );
    c.payeeNumber.updateValueAndValidity({ emitEvent: false });
  }

  // -------------------------------------------------------------------------
  // Gates
  // -------------------------------------------------------------------------

  /**
   * Everything true before a card payment is worth attempting: the account is cleared
   * to use a card, both forms are valid, and the payee is complete for a card network.
   */
  private validate(): boolean {
    if (this.paymentsService.checkForComplianceFreeze()) {
      this.paymentsService.openComplianceFreezeModal();
      return false;
    }

    const { memo, invoiceNumber } = this.detailsForm.controls;
    [memo, invoiceNumber].forEach((control) => {
      if (typeof control.value === 'string') {
        control.setValue(control.value.trim(), { emitEvent: false });
      }
    });

    // With a payee chosen, its gaps are asked about before the form check:
    // the required `payeeEmail` control fails on the same missing email, and
    // the focus-and-shake branch below used to win without a word.
    if (this.core().payee && !this.hasCompletePayee()) {
      return false;
    }

    if (this.sendStateService.coreForm.invalid || this.detailsForm.invalid) {
      this.sendStateService.coreForm.markAllAsTouched();
      this.detailsForm.markAllAsTouched();
      this.sendStateService.requestFieldFocus(
        this.sendStateService.invalidKeys(this.detailsForm)
      );
      return false;
    }

    return this.hasCompletePayee();
  }

  /**
   * Card networks want the payee's company as well as the address. Offer to fill in
   * whatever is missing rather than failing the payment over it.
   *
   * Judged on `missingPayeeFields`, which is what the nudge under the dropdown and
   * the details panel already render — the card branch of it asks for exactly this
   * address and company. Re-deriving it from `coreForm.payee` read the dropdown's
   * own option object, which is built when the list loads and is never refreshed by
   * `loadPayee`: a payee completed outside this page cleared both badges and still
   * failed here, shaking a field that no longer had anything wrong with it.
   */
  private hasCompletePayee(): boolean {
    const { payee } = this.core();
    if (!payee) {
      return false;
    }

    if (this.sendStateService.methodId() === 'let-payee-choose') {
      return true;
    }

    // `missingPayeeFields` answers empty while the fetch is outstanding, because
    // it has nothing to judge. Waiting is not the same as passing.
    if (this.sendStateService.payeeFetching()) {
      this.sendStateService.requestFieldFocus('payee');
      return false;
    }

    if (!this.sendStateService.missingPayeeFields().length) {
      return true;
    }

    this.sendStateService.promptMissingPayeeField();

    return false;
  }

  private passesCardGates(): boolean {
    const amount = Number(this.core().amount);
    const method = this.sendStateService.methodId();

    if (amount < CARD_MIN_AMOUNT) {
      this.paymentConfirmService.showError({
        error: {
          errorMsg: `Minimum transaction amount should be $${CARD_MIN_AMOUNT.toFixed(2)}`
        }
      });
      return false;
    }

    if (method === 'check_mail') {
      const limit = this.paymentsService?.paymentLimit?.checkMailSend;
      if (limit && amount > Number(limit)) {
        this.paymentConfirmService.showError({
          error: {
            errorMsg: `Maximum send limit for Check Mail is $${limit} reached. Please contact customer support.`
          }
        });
        return false;
      }
    }

    if (
      method === 'wire' &&
      !this.detailsForm.controls.payeeBankAc.value?.is_allow_wire
    ) {
      this.sendStateService.requestFieldFocus('payeeBankAc');
      return false;
    }

    return true;
  }

  /**
   * Visa bans the payee-and-category pair, not the payee alone, so it is asked fresh
   * on every submit; a failed lookup is not a refusal.
   */
  private async isPayeeBanned(): Promise<boolean> {
    const { payee } = this.core();
    if (!payee?.id) {
      return false;
    }

    try {
      const categoryId = this.detailsForm.controls.category.value?.id ?? '';
      const res = await firstValueFrom(
        this.paymentsService.bannedPayeeCheck(payee.id, categoryId)
      );

      if (res?.success && res.is_banned_visa_bpsp) {
        this.showBannedMessage();
        return true;
      }
    } catch {
      // A failed check is not a refusal.
    }

    return false;
  }

  /**
   * A banned payee is cleared out of the form, not just refused — leaving them
   * selected only invites another Pay.
   */
  private showBannedMessage(): void {
    const c = this.detailsForm.controls;

    this.sendStateService.coreForm.controls.payee.reset();
    this.sendStateService.clearPayee();
    c.payeeBankAc.reset();
    c.payeeEmail.reset();

    this.v4AlertService.failedAlert({
      content:
        'Unfortunately we cannot support payment to this beneficiary as it violates our terms of service'
    });
  }

  /**
   * What the card program requires for this card, amount and rail. `card` or `invoice`
   * opens the upload modal; `authDoc` is a drawn signature.
   */
  private checkRequiredDocuments(): void {
    const card = this.card();
    const method = this.sendStateService.methodId() ?? '';

    const body: {
      cardId: string;
      amount: string;
      paymentType: string;
      transfer_type?: string;
      payment_id?: string;
      shippingType?: string;
    } = {
      cardId: card?.cardId ?? '',
      amount: String(this.core().amount),
      paymentType: 'rail'
    };

    // Only ACH names its rail and its payment here; adding them for a wire or a check
    // would ask the endpoint a different question than production does.
    if (this.isAch()) {
      body.transfer_type = REQUIRED_DOCS_TRANSFER_TYPE[method];
      body.payment_id = this.sendStateService.paymentId() ?? '';
    }

    // The carrier decides which fee set — and so which documents — apply.
    if (method === 'check_mail') {
      body.shippingType = this.detailsForm.controls.shippingType.value ?? undefined;
    }

    this.paymentsService
      .getRequiredDocumentsDetails(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.paymentConfirmService.setProcessing(false);
            return;
          }

          if (res.data?.isApprovalRequired) {
            this.paymentConfirmService.setProcessing(false);
            this.paymentConfirmService.showError({
              error: {
                errorMsg:
                  'Administrator approval is required to process this payment.'
              }
            });
            return;
          }

          const required = res.data?.required_docs ?? [];
          if (required.includes('card') || required.includes('invoice')) {
            this.collectDocuments(required);
            return;
          }

          void this.runThreeDsThenPay();
        },
        error: (err) => this.handleError(err, () => this.checkRequiredDocuments())
      });
  }

  /** Card images, the invoice, and a drawn authorization signature. */
  private collectDocuments(requiredDocuments: string[]): void {
    const card = this.card();
    // The core form requires a card while the source is card, so this cannot
    // happen — but the modal has no meaning without one.
    if (!card) {
      this.paymentConfirmService.setProcessing(false);
      return;
    }

    this.dialog
      .open<
        VerifyCardModalV4Component,
        IVerifyCardInvoiceDialogData,
        ICardVerifyResult
      >(VerifyCardModalV4Component, {
        width: '480px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          card,
          requiredDocuments:
            requiredDocuments as IVerifyCardInvoiceDialogData['requiredDocuments'],
          amount: String(this.core().amount),
          payee: this.core().payee as IVerifyCardInvoiceDialogData['payee'],
          invoiceNumber: this.detailsForm.controls.invoiceNumber.value ?? '',
          mode: this.docMode(),
          isSameDay: this.isSameDay() ? 1 : 0,
          authorizationFlow: true
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.success) {
          this.uploadedDocs = result.data;
          this.signatureUrl = result.authSign ?? '';
          void this.runThreeDsThenPay();
          return;
        }

        this.paymentConfirmService.setProcessing(false);
        if (result?.success === false) {
          this.paymentConfirmService.showError({
            error: {
              errorMsg:
                "Couldn't verify your documents. Please verify all documents to make a payment."
            }
          });
        }
      });
  }

  // -------------------------------------------------------------------------
  // 3DS
  // -------------------------------------------------------------------------

  /**
   * 3DS challenges the cardholder before the charge: ACH and mailed checks only, on
   * NMI-gateway cards, only while the account has it on.
   */
  private async runThreeDsThenPay(): Promise<void> {
    const card = this.card();
    const method = this.sendStateService.methodId() ?? '';
    // eslint-disable-next-line no-underscore-dangle
    const headerData = this.headerService._headerData.getValue() || null;

    const applies =
      !!card &&
      THREE_DS_METHODS.includes(method) &&
      headerData?.allow_three_ds_testing === 1 &&
      card.gatewayType === THREE_DS_GATEWAY;

    if (!applies || !card || !headerData) {
      this.pay();
      return;
    }

    const res = await this.card3dsService.validateCardWith3ds(
      card,
      this.core().amount ?? 0,
      headerData.nmi_gatewayjs_checkout_key,
      this.renderer,
      (instance) => {
        this.threeDsInstance = instance;
      },
      () => this.card3dsService.hasThreeDsChallenge.set(true)
    );

    if (!res?.success) {
      this.paymentConfirmService.setProcessing(false);
      this.paymentConfirmService.showError({
        error: {
          errorMsg:
            res?.message || 'Something went wrong while verifying your card.'
        }
      });
      return;
    }

    const d = res.data;
    this.threeDsData = d
      ? {
          cavv: d.cavv,
          xid: d.xid,
          eci: d.eci,
          cardholder_auth: d.cardHolderAuth,
          three_ds_version: d.threeDsVersion,
          directory_server_id: d.directoryServerId,
          cardholder_info: d.cardHolderInfo
        }
      : undefined;

    this.pay();
  }

  // -------------------------------------------------------------------------
  // Pay
  // -------------------------------------------------------------------------

  /**
   * A new ACH or wire is captured in one call; anything else needs a zil-payment to
   * charge against — re-capturing an edited payment would orphan the original record.
   */
  private pay(): void {
    const editingId = this.editingPaymentId();
    const method = this.sendStateService.methodId() ?? '';

    if (!editingId && CAPTURE_METHODS.includes(method)) {
      this.payViaCapture();
      return;
    }

    this.payViaSaveThenProcess(editingId);
  }

  private payViaCapture(documentPreviewAgree = 0): void {
    const body = this.captureBody(documentPreviewAgree);

    this.cybersourceService
      .capturePayment(body)
      .pipe(
        finalize(() => this.cybersourceService.replaceIdempotencyKey()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.trackPaymentDone(res?.data?.payment_ids?.[0]);
          this.resetCardState();
          this.paid();
        },
        error: (err) => {
          const error = apiError(err);
          const code = String(error?.errorCode);

          if (code === ERR_OTP) {
            this.sessionKey = error?.session_key ?? this.sessionKey;
            this.askForOtpThenReplay(error?.errorMsg ?? '', () =>
              this.payViaCapture()
            );
            return;
          }

          if (code === ERR_DOCS_PREVIEW) {
            this.askToAgreeCaptureDocuments(body);
            return;
          }

          this.handleError(err, () => this.payViaCapture(documentPreviewAgree));
        }
      });
  }

  private askToAgreeCaptureDocuments(captureBody: IPaymentBody): void {
    this.dialog
      .open(V4CardTransactionDocsPreviewModalComponent, {
        ...DOCS_PREVIEW_DIALOG_CONFIG,
        data: {
          ...captureBody,
          authSign: this.signatureUrl,
          ...this.authorizationLabels()
        }
      })
      .afterClosed()
      .subscribe((agreed: boolean | undefined) => {
        if (!agreed) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.payViaCapture(1);
      });
  }

  /** A mailed check, or any edited payment: save, then charge against the id. */
  private payViaSaveThenProcess(editingId: string | undefined): void {
    this.writePayment(editingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const paymentId = res?.data?.id ?? editingId;
          if (!paymentId) {
            this.paymentConfirmService.setProcessing(false);
            return;
          }
          this.processCard(paymentId);
        },
        error: (err) => {
          const error = apiError(err);
          const code = String(error?.errorCode);

          if (code === ERR_OTP) {
            this.sessionKey = error?.session_key ?? this.sessionKey;
            this.askForOtpThenReplay(error?.errorMsg ?? '', () =>
              this.payViaSaveThenProcess(editingId)
            );
            return;
          }

          if (code === ERR_DOCS_PREVIEW) {
            this.askToAgreeSaveDocuments(editingId);
            return;
          }

          this.handleError(err);
        }
      });
  }

  private askToAgreeSaveDocuments(editingId: string | undefined): void {
    const core = this.core();
    const d = this.detailsForm.getRawValue();

    this.dialog
      .open(V4CardTransactionDocsPreviewModalComponent, {
        ...DOCS_PREVIEW_DIALOG_CONFIG,
        // The shape card-check-v3 hands it on this path (L1067-1087) — there is
        // no capture body here to spread.
        data: {
          amount: core.amount,
          invoiceNumber: d.invoiceNumber,
          memo: d.memo,
          authSign: this.signatureUrl,
          cardId: core.card?.cardId ?? '',
          documents: this.uploadedDocs,
          mode: this.docMode(),
          email_otp_session_key: this.emailOtpKey,
          phone_otp_session_key: this.phoneOtpKey,
          payees: [
            {
              id: core.payee?.id,
              memo: d.memo,
              amount: core.amount,
              invoiceNumber: d.invoiceNumber,
              email: d.payeeEmail,
              phone: d.payeeNumber
            }
          ],
          ...this.authorizationLabels()
        }
      })
      .afterClosed()
      .subscribe((agreed: boolean | undefined) => {
        if (!agreed) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.payViaSaveThenProcess(editingId);
      });
  }

  private processCard(paymentId: string, documentPreviewAgree = 0): void {
    const body = this.processBody(documentPreviewAgree);

    if (this.sendStateService.methodId() === 'check_mail') {
      this.checkService.activeMailPayeeId = this.core().payee?.id ?? null;
    }

    this.paymentsService
      .processCardPayment(paymentId, body)
      .pipe(
        finalize(() => this.paymentsService.replaceIdempotencyKey()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: { data?: unknown; success?: boolean; statusCode?: number }) => {
          if (res?.data || res?.success || res?.statusCode === 200) {
            this.trackPaymentDone(paymentId);
            this.resetCardState();
            this.paid();
            return;
          }
          this.paymentConfirmService.setProcessing(false);
        },
        error: (err) => {
          const error = apiError(err);
          const code = String(error?.errorCode);

          if (code === ERR_OTP) {
            this.sessionKey = error?.session_key ?? this.sessionKey;
            this.askForProcessOtp(error ?? {}, paymentId, body);
            return;
          }

          if (code === ERR_DOCS_PREVIEW) {
            this.askToAgreeDocuments(paymentId, body);
            return;
          }

          this.handleError(err, () =>
            this.processCard(paymentId, documentPreviewAgree)
          );
        }
      });
  }

  /**
   * A 112 asks for a passcode — email first, then phone. The modal returns both
   * session keys, and the same charge is replayed carrying them.
   */
  private askForProcessOtp(
    errorData: Record<string, unknown>,
    paymentId: string,
    processBody: ICardProcessBody
  ): void {
    this.dialog
      .open(OtpModalV4Component, {
        ...OTP_DIALOG_CONFIG,
        data: {
          errorData,
          amount: this.core().amount,
          paymentId,
          processBody
        }
      })
      .afterClosed()
      .subscribe((result: IOtpModalV4Result | undefined) => {
        if (!result?.success) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.emailOtpKey = result.emailSessionKey;
        this.phoneOtpKey = result.phoneSessionKey;
        this.processCard(paymentId);
      });
  }

  /**
   * The passcode asked for by a call with no payment to hang it off — the capture, and
   * the write a mailed check goes out on. The modal runs single-step, so the
   * email-then-phone ladder is kept here.
   */
  private askForOtpThenReplay(errorMsg: string, replay: () => void): void {
    this.dialog
      .open(OtpModalV4Component, {
        ...OTP_DIALOG_CONFIG,
        data: {
          session_key: this.sessionKey,
          errorMsg,
          mode: this.emailOtpKey ? 'phone' : 'email',
          subtitle: this.emailOtpKey ? 'Step 2 of 2' : 'Step 1 of 2'
        }
      })
      .afterClosed()
      .subscribe((verified: boolean | undefined) => {
        if (!verified) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        if (this.emailOtpKey) {
          this.phoneOtpKey = this.sessionKey;
        } else {
          this.emailOtpKey = this.sessionKey;
        }
        replay();
      });
  }

  /** An 808 shows what was uploaded and asks the user to stand behind it. */
  private askToAgreeDocuments(
    paymentId: string,
    processBody: ICardProcessBody
  ): void {
    this.dialog
      .open(V4CardTransactionDocsPreviewModalComponent, {
        ...DOCS_PREVIEW_DIALOG_CONFIG,
        data: {
          ...processBody,
          authSign: this.signatureUrl,
          zil_payment_uuid: paymentId,
          ...this.authorizationLabels()
        }
      })
      .afterClosed()
      .subscribe((agreed: boolean | undefined) => {
        if (!agreed) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.processCard(paymentId, 1);
      });
  }

  // -------------------------------------------------------------------------
  // Payloads
  // -------------------------------------------------------------------------

  /**
   * POST /zil-payments — the draft body, same shape for update. A mailed check names
   * its carrier and no bank; ACH and wire the reverse.
   */
  private saveBody(): IUpdatePaymentBody {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const method = this.sendStateService.methodId();

    const body: IUpdatePaymentBody = {
      transferType: CARD_TRANSFER_TYPE[method ?? ''] ?? method ?? '',
      amount: Number(core.amount),
      category: d.category?.id,
      description: d.memo ?? '',
      payee: core.payee?.id,
      paymentDueDate: today(),
      referenceNo: d.invoiceNumber ?? undefined,
      // What funds the payment: the card, not a wallet or a bank account.
      sourceId: core.card?.cardId,
      sourceType: 'card',
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      items: this.payloadItems,
      payeeIdNumber: d.payeeIdNumber ?? undefined,
      payeeEmail: d.payeeEmail ?? undefined,
      bills: this.billService.billId() ?? []
    };

    // With no line items there is no format, and `0` reads as "old format".
    if (this.hasRemittance) {
      body.remittanceType = this.remittanceType;
    }

    if (method === 'check_mail') {
      // A card check has no bank account, and the control still holds whichever one
      // an earlier ACH or wire selected — sending that would name the wrong bank.
      body.shippingType = d.shippingType ?? undefined;
    } else if (this.needsPayeeBank()) {
      body.payeeBankAccount = bankAccountId(d.payeeBankAc);
    }

    // The payee text, as `captureBody` sends it on a fresh payment. A saved one
    // is charged through save-then-process instead, and neither body carried
    // this — so reprocessing never texted the payee however the notify section
    // was left.
    if (this.isAch()) {
      body.send_sms = d.sendSms ?? false;
      body.payee_phone = d.payeeNumber ?? '';
    }

    return body;
  }

  /**
   * The one-shot charge for a new ACH or wire. No saved payment behind it, so this
   * body alone carries the SMS flag, same-day and 3DS .
   */
  private captureBody(documentPreviewAgree: number): IPaymentBody {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const method = this.sendStateService.methodId() ?? '';
    const isAch = this.isAch();
    const isLetPayeeChoose = method === 'let-payee-choose';
    const categoryId = d.category?.id ?? '';

    const body: IPaymentBody = {
      amount: core.amount,
      cardId: core.card?.cardId,
      category: categoryId,
      payees: [
        {
          id: core.payee?.id,
          amount: core.amount,
          email: d.payeeEmail,
          memo: d.memo,
          invoiceNumber: d.invoiceNumber,
          bankAccount: bankAccountId(d.payeeBankAc),
          category: categoryId,
          ...(!isLetPayeeChoose && {
            payeeIdNumber: d.payeeIdNumber ?? undefined
          }),
          bills: this.billService.billId() ?? []
        }
      ],
      mode: CARD_CAPTURE_MODE[method] ?? '1',
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      items: this.payloadItems,
      documents: this.uploadedDocs,
      session_key: this.sessionKey,
      // The phone passcode is only asked for once the email one is in hand.
      otp_type: this.otpType(),
      email_otp_session_key: this.emailOtpKey,
      phone_otp_session_key: this.phoneOtpKey,
      document_preview_agree: documentPreviewAgree,
      // A wire carries no 3DS, so there is nothing to attach on that rail.
      ...(this.threeDsData && { three_ds_data: this.threeDsData })
    };

    // See `saveBody` — only a real remittance has a format to name.
    if (this.hasRemittance) {
      body.remittanceType = this.remittanceType;
    }

    if (isAch) {
      body.isSameDay = this.isSameDay() ? 1 : 0;
      body.send_sms = d.sendSms;
      body.payee_phone = d.payeeNumber;
      body.payees[0].phone = d.payeeNumber;
    }

    if (isLetPayeeChoose) {
      body.isSameDay = 0;
      body.send_sms = false;
    }

    return body;
  }

  private processBody(documentPreviewAgree: number): ICardProcessBody {
    const d = this.detailsForm.getRawValue();
    const isCheckMail = this.sendStateService.methodId() === 'check_mail';

    return {
      payee_email: d.payeeEmail ?? undefined,
      documents: this.uploadedDocs,
      otp_and_docs_preview_section_in_credit_card: 1,
      // The phone passcode is only asked for once the email one is in hand.
      otp_type: this.otpType(),
      email_otp_session_key: this.emailOtpKey,
      phone_otp_session_key: this.phoneOtpKey,
      document_preview_agree: documentPreviewAgree,
      ...(this.isAch() && { session_key: this.sessionKey }),
      // A wire carries no 3DS, so there is nothing to attach on that rail.
      ...(this.threeDsData && { three_ds_data: this.threeDsData }),
      ...(this.needsPayeeBank() && {
        payee_bank_account_id: bankAccountId(d.payeeBankAc)
      }),
      ...(isCheckMail && {
        category: d.category?.id ?? '',
        bills: this.billService.billId() ?? []
      }),
      // Sent here as well as on the payment itself: this is the call that
      // charges a saved payment, and the fresh-payment path carries the flag on
      // its own charge (`captureBody`).
      ...(this.isAch() && {
        send_sms: d.sendSms ?? false,
        payee_phone: d.payeeNumber ?? ''
      })
    };
  }

  private confirmRequest(): IConfirmRequest {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const method = this.sendStateService.methodId();
    // A card draws a cheque like any other source; without its own id the
    // preview had nothing to draw and came back blank.
    const drawsCheck = CHECK_PREVIEW_METHODS.includes(method ?? '');

    return {
      accNumber: core.card?.cardMasked ?? '',
      bankName: core.card?.nickName ?? '',
      payeeName: core.payee?.name ?? '',
      paymentMethod: confirmLabel(method),
      amount: Number(core.amount).toFixed(2),
      type: 'card',
      source: PaymentSource.CreditCard,
      method: (method ?? undefined) as PaymentMethod | undefined,
      paymentMethodLabelOverride: confirmLabel(method),
      ...(method === 'check_mail' && {
        shippingType: d.shippingType ?? undefined
      }),
      isPayeeBankVerified: !(
        this.paymentsService.isPayeeBankVerificationRequired &&
        d.payeeBankAc?.verified !== 1
      ),
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
              sourceType: 'card',
              sourceId: core.card?.cardId,
              payeeId: core.payee?.id,
              amount: Number(String(core.amount ?? '').replace(/[$,]/g, '')),
              memo: d.memo ?? undefined
            })
          }
        : {})
    };
  }

  /** Captured before the request, so a later form reset can't blank the modal. */
  private captureSuccessContext(): void {
    const core = this.core();

    this.paymentConfirmService.setSuccessContext({
      amount: Number(core.amount).toFixed(2),
      payeeName: core.payee?.name ?? '',
      paymentMethod: this.sendStateService.methodId() ?? '',
      bankName: core.card?.nickName ?? '',
      sourceAccountDisplay: core.card?.cardMasked ?? ''
    });
  }

  // -------------------------------------------------------------------------
  // Shared tail
  // -------------------------------------------------------------------------

  private resetCardState(): void {
    this.sessionKey = '';
    this.emailOtpKey = '';
    this.phoneOtpKey = '';
    this.uploadedDocs = undefined;
    this.signatureUrl = '';
    this.threeDsData = undefined;
    this.threeDsInstance?.unmount?.();
    this.threeDsInstance = undefined;
    this.card3dsService.hasThreeDsChallenge.set(false);
  }

  private paid(): void {
    this.afterSuccess();
    this.paymentConfirmService.showSuccess('send');
  }

  private afterSuccess(): void {
    this.billService.billId.set(undefined);
  }

  /**
   * Closes the loop on the credit-card promo toast by naming the payment it led to;
   * the service returns nothing when there was no toast.
   */
  private trackPaymentDone(paymentId: string | undefined): void {
    if (!paymentId) {
      return;
    }
    this.clickTrackingService
      .ccToastClickedPaymentDone(paymentId)
      ?.pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * The codes that mean the account, not the payment, is the problem. `retry` is the
   * failed call, replayed once the user comes back verified.
   */
  private handleError(err: unknown, retry?: () => void): void {
    this.paymentConfirmService.setProcessing(false);

    const error = apiError(err);
    const code = Number(error?.errorCode);
    this.paymentsService.afterGetingError(code, error?.errorMsg ?? '');
    if (code === ERR_STALE_CARD_STATE) {
      this.askToTryAgain(error?.errorMsg).subscribe(() => {
        this.headerService.setHeaderValueChanged(true);
        this.paymentConfirmService.resetRequested.next();
      });
      return;
    }

    if (code === ERR_PAGE_STALE) {
      this.askToTryAgain(error?.errorMsg).subscribe(() => {
        this.headerService.setHeaderValueChanged(true);
        window.location.reload();
      });
      return;
    }

    if (code === ERR_CARD_NOT_ENABLED) {
      this.promptVerification(
        'kyc',
        'You need to enable credit card before making a payment',
        retry
      );
      return;
    }

    if (code === ERR_BUSINESS_NOT_VERIFIED) {
      this.promptVerification(
        'kyb',
        'You need to verify your business before making a payment',
        retry
      );
      return;
    }

    this.paymentConfirmService.showError(err);
  }

  /**
   * Ask before sending the user to Persona — v3 never opens it unprompted — and pick
   * the payment back up once they come back verified.
   */
  private promptVerification(
    flow: 'kyc' | 'kyb',
    content: string,
    retry?: () => void
  ): void {
    this.v4AlertService
      .failedAlert({
        title: 'Failed',
        content,
        isOk: true,
        isCancel: true,
        cancelMsg: 'Cancel',
        doneMsg: 'Enable Now'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.startPersona(flow, retry);
        }
      });
  }

  private startPersona(flow: 'kyc' | 'kyb', retry?: () => void): void {
    if (!environment.isV4Persona) {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
      return;
    }

    this.personaHelperService
      .openModal(flow, CVSourceType.credit_card, true)
      .subscribe((res) => {
        // An inquiry id means they went through with it; anything else means
        // they backed out, and there is nothing to resume.
        if (res?.data?.inquiry_id) {
          retry?.();
        }
      });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private core() {
    return this.sendStateService.coreForm.getRawValue();
  }

  private card(): IExistingCreditCards | null {
    return this.core().card;
  }

  /** The payment being edited, if this is an edit — a clone writes a new record. */
  private editingPaymentId(): string | undefined {
    return this.sendStateService.mode() === 'EDIT'
      ? this.sendStateService.paymentId()
      : undefined;
  }

  /** POST a new draft, or PUT the one being edited. */
  private writePayment(editingId: string | undefined) {
    return editingId
      ? this.paymentsService.updatePayment(editingId, this.saveBody())
      : this.paymentsService.savePayment(this.saveBody());
  }

  private isAch(): boolean {
    return ACH_METHODS.includes(this.sendStateService.methodId() ?? '');
  }

  /**
   * Card has no same-day checkbox: `same-ach` is its own method, locked for card
   * today (PAY_FROM_SOURCES). Derived, so it stays right if that is ever unlocked.
   */
  private isSameDay(): boolean {
    return this.sendStateService.methodId() === 'same-ach';
  }

  /** ACH and wire land in a bank account; a mailed check does not. */
  private needsPayeeBank(): boolean {
    return PAYEE_BANK_METHODS.includes(this.sendStateService.methodId() ?? '');
  }

  /**
   * What tells the shared documents modal it is the last gate of this flow, and
   * what agreeing will charge — the amount plus its fees, as the confirmation
   * modal quoted it. Every other caller of that modal sends neither and keeps
   * the plain "Confirm & Proceed".
   */
  private authorizationLabels(): {
    authorizationFlow: true;
    grandTotal: number;
  } {
    return {
      authorizationFlow: true,
      grandTotal: this.paymentConfirmService.grandTotal(this.core().amount ?? 0)
    };
  }

  private docMode(): string {
    return CARD_DOC_MODE[this.sendStateService.methodId() ?? ''] ?? '1';
  }

  /** The phone passcode is only asked for once the email one is in hand. */
  private otpType(): string {
    return this.emailOtpKey ? 'phone' : 'email';
  }

  /**
   * What the 824 handler drives. The v4 dropdown doesn't satisfy this shape, so the
   * form control stands in — selecting a card *is* setting that control.
   */
  private transLimitDropdown(): ICardTransLimitDropdown {
    const control = this.sendStateService.coreForm.controls.card;

    return {
      // The API named a card that *can* take this amount — switch to it.
      populateDuplicateCard: (card: IExistingCreditCards) => control.setValue(card),
      clearSelection: () => control.setValue(null),
      addCardWithPrefill: (card: IExistingCreditCards, gatewayType: number) => {
        this.openAddCardService
          .openAddCardWithPrefill(
            card.cardId,
            gatewayType,
            card.nickName,
            card.bgColor
          )
          .subscribe((ref) => {
            ref?.afterClosed().subscribe((res) => this.syncCardsAfterAddModal(res));
          });
      },
      addNewCard: (gatewayType?: number) => {
        this.openAddCardService.openAddCard(gatewayType).subscribe((ref) => {
          ref?.afterClosed().subscribe((res) => this.syncCardsAfterAddModal(res));
        });
      }
    };
  }

  /**
   * The card dropdown on this page is store-backed (`showAllCards`), so after the
   * add-card modal closes the store must be reloaded: on success the new card is
   * also selected; on `cardCreated` the user backed out of "Confirm Card" but the
   * (unconfirmed) card already exists and should appear in the list.
   */
  private syncCardsAfterAddModal(
    res?: { success?: boolean; data?: IAddCardResponse; cardCreated?: boolean }
  ): void {
    if (res?.success) {
      this.store.dispatch(CardsActions.loadCards({ showAllCards: true }));
      const newCard = res.data?.metaData as IExistingCreditCards | undefined;
      if (newCard) {
        this.sendStateService.coreForm.controls.card.setValue(newCard);
      }
      if (res.data?.message) {
        this.v4AlertService.successAlert({ content: res.data.message });
      }
    } else if (res?.cardCreated) {
      this.store.dispatch(CardsActions.loadCards({ showAllCards: true }));
    }
  }

  /** The dead-end alert both stale-state codes raise; emits once the user acknowledges. */
  private askToTryAgain(errorMsg: string | undefined) {
    return this.v4AlertService
      .failedAlert({
        content: errorMsg ?? 'Something went wrong!',
        isOk: true,
        doneMsg: 'Try Again'
      })
      .afterClosed();
  }
}

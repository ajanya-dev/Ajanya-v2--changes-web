import {
  computed,
  effect,
  inject,
  signal,
  untracked,
  DestroyRef,
  Injectable,
  Injector
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpHeaders } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  Validators,
  type AbstractControl
} from '@angular/forms';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router
} from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, EMPTY, of, timer, type Observable } from 'rxjs';
import {
  catchError,
  filter,
  map,
  startWith,
  switchMap,
  take
} from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import type { IHeaderData } from 'src/app/layout/model/header';
import type { IBankDropdown, IRemittanceDetails } from 'src/app/models/bank';
import type {
  IBillBulkPaymentData,
  IBillRemittance
} from 'src/app/modules/bill/model/Bill';
import type { ICategoryDropdown } from 'src/app/modules/category/model/category';
import type {
  IAchBody,
  ICheckDetailsData,
  IDirectDepositDetails,
  IEcheckDetails,
  IMailingDetails,
  INewCheck
} from 'src/app/modules/check/model/check';
import { FedexSaturdayConfirmationV4Component } from 'src/app/modules/check/modal/fedex-saturday-confirmation-v4/fedex-saturday-confirmation-v4.component';
import {
  VerifySignatureModalV4Component,
  type VerifySignatureResult
} from 'src/app/modules/payments-v4/send-payment/components/modals/verify-signature-modal-v4/verify-signature-modal-v4.component';
import { VirtualAccountConfirmationModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/virtual-account-confirmation-modal-v4/virtual-account-confirmation-modal-v4.component';
import {
  PaymentMethod,
  PaymentSource
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { SendPaymentErrorHandlerService } from 'src/app/modules/payments-v4/send-payment/services/send-payment-error-handler.service';
import type { IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';
import type {
  IPaymentDetails,
  IUpdatePaymentBody
} from 'src/app/modules/payments/model/payments';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { SubscriptionWarningModalV4Component } from 'src/app/modules/subscription/modals/subscription-warning-modal-v4/subscription-warning-modal-v4.component';
import { ScriptService } from 'src/app/core/services/script.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { Utils } from 'src/app/data/utils';
import { V4WarningAlertComponent } from 'src/app/shared/alert/v4-components/v4-warning-alert/v4-warning-alert.component';
import { V4FailedAlertComponent } from 'src/app/shared/alert/v4-components/v4-failed-alert/v4-failed-alert.component';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  RecurringRedirectService,
  type RecurringDeliveryType
} from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';

import { AccountVerificationService } from '../../shared/services/account-verification.service';
import {
  CHECK_DELIVERY_OPTIONS,
  WHITE_PAPER_TYPE,
  deliveryToMethodId,
  type CheckDeliveryId
} from '../../shared/models/check-delivery';
import {
  PaymentConfirmService,
  SUCCESS_SAVED,
  buildCheckPreviewPayload,
  buildCheckPreviewValues,
  type IConfirmRequest
} from '../../shared/services/payment-confirm.service';
import type { IFeeRequest } from '../../shared/services/payment-fee.service';
import { CheckDirectDepositService } from '../../shared/services/check-direct-deposit.service';
import { CheckEmailService } from '../../shared/services/check-email.service';
import {
  CheckMailService,
  type ICheckMailBlocker
} from '../../shared/services/check-mail.service';
import type { ISendSourceService } from '../../shared/models/send-source.model';
import { SendStateService } from '../../shared/services/send-state.service';
import { ConfirmPaymentModalComponent } from '../../confirm-modal/confirm-payment-modal.component';
import { ExportCheckService } from './export-check.service';

/** What Save and each delivery tile mean to the API (bank-ac-check L1117-1134). */
const PERMISSION_ACTION: Record<string, number> = {
  save: 0,
  printCheck: 1,
  printWhiteCheck: 1,
  mail: 2,
  email: 3,
  ach: 4
};

/**
 * `printMultiCheck.paperType` for check stock is whatever the account says it
 * loads — a setting, not a constant (bank-ac-check L2331-2343, L1724).
 */
const DEFAULT_CHECK_PAPER_TYPE = '1';

/** `ICheckDetailsData.status` — queued to go out on its schedule date. */
const CHECK_SCHEDULED = 50;

/** Accounts on this plugin do not want a memo written for them (bank-ac-check L436). */
const NO_BILL_MEMO_PLUGIN = 'no-bill-payment-memo-default';

/** The enterprise plugin that makes a category compulsory (bank-ac-check L576). */
const WIYGUL_PLUGIN = 'enterprise-wiygul';

/** Delivery, or `save` when the user only wants a draft. */
type CheckAction = CheckDeliveryId | 'save';

/** The deliveries that create and send in one call, rather than write then hand off. */
type ConsolidatedDelivery = 'mail' | 'email' | 'ach';

/**
 * `data.status` on a successful email, in the words the success modal uses.
 * The endpoint says which of the three it did, so nothing has to infer it.
 */
/** `is_recurring_value` -> the word the success modal uses for an emailed check. */
const EMAIL_TYPE_BY_RECURRING: Record<
  number,
  'immediate' | 'recurring' | 'scheduled'
> = {
  0: 'immediate',
  1: 'recurring',
  2: 'scheduled'
};

const EMAIL_STATUS_TYPE: Record<string, 'immediate' | 'recurring' | 'scheduled' | undefined> = {
  emailed: 'immediate',
  scheduled: 'scheduled',
  recurring_created: 'recurring'
};

/**
 * The resolvable blockers `POST /payments/check-mail` raises, and the
 * acknowledgement that answers each. A blocker may also name its own key in
 * `data.acknowledgement`, which wins. Anything else resolvable is retried as-is.
 */
const MAIL_ACKNOWLEDGEMENT: Record<string, string> = {
  signature_missing: 'signature_missing',
  duplicate_check_number: 'duplicate_check_number',
  duplicate_invoice: 'duplicate_invoice',
  cost_requote: 'shipping_rate'
};

/**
 * FedEx will not process a Friday request until Monday. `fedex_cutoff` carries
 * the user's CHOICE, not merely consent: `1` accepts the Monday delay, `2`
 * orders Saturday delivery at a surcharge. Never send `2` unless they asked.
 */
const FEDEX_CUTOFF_CODES = ['fedex_processed_monday', 'fedex_saturday_offer'];

/**
 * Codes the v4 interceptor already acts on — recharge, subscription, compliance.
 * It has spoken for them by the time we get here, so a second alert would stack.
 */
const INTERCEPTOR_HANDLED_CODES = new Set([
  144, 161, 170, 171, 202, 203, 205, 214, 217, 616, 999
]);

interface IApiError {
  error?: { errorCode?: number | string; errorMsg?: string };
}

/**
 * The processing time the confirmation modal shows. Read off the delivery tiles
 * themselves, so the modal can never disagree with what the user just clicked.
 */
function deliveryTiming(delivery: CheckDeliveryId): string {
  return CHECK_DELIVERY_OPTIONS.find((o) => o.id === delivery)?.timing ?? '';
}

const ymd = Utils.toLocalYmd;

export interface IBankCheckDetailsForm {
  issueDate: FormControl<string | null>;
  checkNumber: FormControl<number | null>;
  scheduleDate: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null>;
  memo: FormControl<string | null>;
  invoiceNumber: FormControl<string | null>;
  payeeIdNumber: FormControl<string | null>;

  /** "Process without" — a blank check, signed or not, dated or not. */
  noAmount: FormControl<boolean | null>;
  noSign: FormControl<boolean | null>;
  noPayee: FormControl<boolean | null>;
  noDate: FormControl<boolean | null>;

  /**
   * Ask the delivery modal to set this check up as recurring; mail, email and
   * direct-deposit each open their own step off it (bank-ac-check L1456, L2099, L2134).
   */
  needRecurring: FormControl<boolean | null>;

  /**
   * What the recurring modal collected. The legacy flow re-asked for these inside
   * the mail modal; the consolidated endpoint takes them in the same payload, so
   * they have to survive on the form.
   */
  recurringFrequency: FormControl<string | null>;
  recurringStartDate: FormControl<string | null>;
  recurringEndSelect: FormControl<string | null>;
  recurringCount: FormControl<number | null>;
  /** The end date, when the series stops on one (`end_select` 2). */
  recurringUntil: FormControl<string | null>;
  /** Whether the payment being made now counts as the first of the series. */
  recurringIncludeCheck: FormControl<boolean | null>;

  /**
   * Direct deposit only: the payee's ACH account, and whether the money goes to
   * their bank rather than their wallet. Both are validated only while the
   * Direct Deposit tile is the chosen delivery.
   */
  payeeBankAc: FormControl<IPayeeViewBank | null>;
  walletBypassing: FormControl<boolean | null>;
}

/**
 * A check drawn on a bank account — the one rail that is not a zil-payment: it
 * writes a check record and the delivery tile decides what happens to it.
 * Ported from `bank-ac-check` by way of `send-payment-submit.service`.
 */
@Injectable()
export class BankCheckService implements ISendSourceService {
  // ── Dependencies ──
  private readonly checkService = inject(CheckService);
  private readonly bankService = inject(BankService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly billService = inject(BillService);
  private readonly matDialog = inject(MatDialog);
  private readonly v4AlertService = inject(V4AlertService);
  private readonly sendPaymentErrorHandlerService = inject(SendPaymentErrorHandlerService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly headerService = inject(HeaderService);
  private readonly payeeService = inject(PayeeService);
  private readonly recurringRedirectService = inject(RecurringRedirectService);
  private readonly scriptService = inject(ScriptService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly userProfileService = inject(UserProfileService);
  /** Resolved on use: CheckMailService reads the source registry, which builds this. */
  private readonly injector = inject(Injector);

  private readonly sendStateService = inject(SendStateService);
  private readonly paymentConfirmService = inject(PaymentConfirmService);
  private readonly exportCheckService = inject(ExportCheckService);
  private readonly accountVerificationService = inject(AccountVerificationService);

  // ── Form ──
  readonly detailsForm = new FormGroup<IBankCheckDetailsForm>({
    issueDate: new FormControl<string | null>(ymd(new Date()), [
      Validators.required
    ]),
    checkNumber: new FormControl<number | null>(null, [Validators.required]),
    scheduleDate: new FormControl<string | null>(null),
    category: new FormControl<ICategoryDropdown | null>(null),
    // Memo and invoice number are capped by `maxlength` on the input, not by a
    // validator — that would block submit on an over-long paste instead of truncating
    // it (bank-ac-check L512, L522; html L142, L216).
    memo: new FormControl(''),
    invoiceNumber: new FormControl(''),
    payeeIdNumber: new FormControl('', [Validators.maxLength(30)]),

    noAmount: new FormControl(false),
    noSign: new FormControl(false),
    noPayee: new FormControl(false),
    noDate: new FormControl(false),
    needRecurring: new FormControl(false),

    recurringFrequency: new FormControl<string | null>(null),
    recurringStartDate: new FormControl<string | null>(null),
    recurringEndSelect: new FormControl<string | null>(null),
    recurringCount: new FormControl<number | null>(null),
    recurringUntil: new FormControl<string | null>(null),
    recurringIncludeCheck: new FormControl<boolean | null>(true),

    payeeBankAc: new FormControl<IPayeeViewBank | null>(null),
    walletBypassing: new FormControl(true)
  });

  // ── Signals ──

  /**
   * The check record as the API returned it on EDIT. The Export Check panel restores
   * its saved line items from this, or an edited export shows an empty table.
   */
  readonly checkDetails = signal<ICheckDetailsData | undefined>(undefined);

  /**
   * A check already queued to go out (status 50). v3 greys out the whole toolbar —
   * it is handed to the queue and re-sending would double it (bank-ac-check html L264+).
   */
  readonly isScheduled = signal(false);

  /**
   * Which fields "Process Without" has blanked. The controls are disabled either way;
   * these let the page shade them, so a blank reads as deliberate, not as a load failure.
   */
  readonly blankedAmount = signal(false);
  readonly blankedPayee = signal(false);
  readonly blankedDate = signal(false);

  /** The check record, once it exists. Attachments and comments hang off this. */
  readonly checkId = signal<string | undefined>(undefined);

  /**
   * Bumped when the check's own fields are written behind `valueChanges`. The
   * serial number arrives that way on purpose — `emitEvent: false` keeps the
   * export panel and the edit snapshot from reading a fetched default as
   * something the user typed — so nothing else can report that it landed.
   */
  readonly detailsWritten = signal(0);

  /**
   * Bumped to ask the check-delivery block to open the check on its fields. The
   * dialog is the delivery component's to open — it holds the payee name and
   * amount the preview is drawn from — so this rail asks rather than opens.
   */
  readonly checkModalRequest = signal(0);

  // ── Toolbar payload, owned by SendComponent's modals ──
  insertFromRemittance = false;
  remittanceItems: IRemittanceDetails[] = [];
  remittanceType = 1;
  commentIds: string[] = [];
  attachmentIds: string[] = [];
  envelopeAttachmentIds: string[] = [];

  /**
   * The custom fields printed on this bank's check design. The design and an edited
   * check both fill this in either order, so lookups match on name, never on position.
   */
  customElements: { [key: string]: string }[] = [];

  // ── Internal state ──
  private readonly detailsDefaults = this.detailsForm.getRawValue();

  /** What the header says about this account's subscription and trial. */
  private headerData: IHeaderData | undefined;

  /**
   * The two "proceed anyway?" warnings once the user has said yes — duplicate memo
   * (190) and re-used check number (213). They ride the retry so the API stops objecting.
   */
  private fieldsWarning = 0;
  private checkNumberWarning = 0;

  private mailEmailType: 'immediate' | 'recurring' | 'scheduled' | undefined;

  /** The check stock this account prints on. Asked for once, used on every print. */
  private checkPaperType: string | number = DEFAULT_CHECK_PAPER_TYPE;

  /**
   * The check as it was loaded. Anything the user then typed makes this an edit,
   * and an edit has to be written before it can go out.
   */
  private editSnapshot: string | null = null;

  constructor() {
    this.watchSerialNumber();

    this.checkService
      .getCheckMailEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt) => {
        if (evt.isSuccess) {
          this.mailEmailType = evt.emailType;
        }
      });

    this.checkService
      .getCheckPaperType()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.checkPaperType = res?.data?.paperType || DEFAULT_CHECK_PAPER_TYPE;
          }
        },
        error: () => {
          /* the default stock is the common one */
        }
      });

    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.headerData = data ? (data as IHeaderData) : undefined;
      });

    this.makeCategoryRequired();
    this.watchProcessWithout();

    this.destroyRef.onDestroy(() => {
      this.paymentsService.payeeDetails = undefined;
      this.paymentsService.isPaymentProcessingSubject.next(false);
      this.paymentsService.onClickSaveButton.set(false);
      this.paymentsService.onSaveQboDetails.set(undefined);
      this.paymentsService.onSaveNetSuiteDetails.set(undefined);
      this.paymentsService.onSaveFreshBooksDetails.set(undefined);
      this.paymentsService.autoSaveNetSuiteDetails.set(false);
      this.paymentsService.autoSaveFreshBooksDetails.set(false);
    });

    // Switching to another method re-enables the core fields (`selectMethod`), so
    // coming back to a check has to put the blanked ones back the way they were.
    effect(
      () => {
        const delivery = this.sendStateService.checkDelivery();
        const source = this.sendStateService.sourceId();
        if (source !== 'bankaccount' || !delivery) {
          return;
        }
        untracked(() => this.applyProcessWithoutState());
      },
      { allowSignalWrites: true }
    );

    // The dropdown writes to the shared selection; the control mirrors it so
    // the details rail and the payload read one value.
    effect(
      () => {
        const bank = this.sendStateService.selectedPayeeBank();
        untracked(() =>
          this.detailsForm.controls.payeeBankAc.setValue(bank, {
            emitEvent: false
          })
        );
      },
      { allowSignalWrites: true }
    );
  }

  get hasRemittance(): boolean {
    return this.remittanceItems.length > 0;
  }

  // -------------------------------------------------------------------------
  // Custom check-design fields
  // -------------------------------------------------------------------------

  customFieldValue(field: string): string {
    return this.customElements.find((entry) => field in entry)?.[field] ?? '';
  }

  setCustomFieldValue(field: string, value: string): void {
    const entry = this.customElements.find((e) => field in e);
    if (entry) {
      entry[field] = value;
      return;
    }
    this.customElements.push({ [field]: value });
  }

  // -------------------------------------------------------------------------
  // ISendSourceService
  // -------------------------------------------------------------------------

  readonly memoConfig = computed(() => ({
    visible: true,
    maxLength: 100
  }));

  resetDetails(): void {
    this.detailsForm.enable({ emitEvent: false });
    this.detailsForm.reset({ ...this.detailsDefaults, issueDate: ymd(new Date()) });
    this.insertFromRemittance = false;
    this.remittanceItems = [];
    this.remittanceType = 1;
    this.commentIds = [];
    this.attachmentIds = [];
    this.checkId.set(undefined);
    this.checkDetails.set(undefined);
    this.isScheduled.set(false);
    this.editSnapshot = null;
    this.fieldsWarning = 0;
    this.checkNumberWarning = 0;
    // The next cheque starts from a clean fill: the account is asked again and
    // whatever it answers goes in.
    this.serialBankId = null;
    this.customElements = this.customElements.map((field) => {
      const [name] = Object.keys(field);
      return { [name]: '' };
    });
    this.mailService().newPayment();
    this.emailService().newPayment();
    this.depositService().newPayment();
    this.exportCheckService.reset();
  }

  /** Only the print deliveries are quoted a fee — see `PaymentFeeService.compute`. */
  feeInputs(): Pick<IFeeRequest, 'shippingType' | 'isSameDay' | 'cardMode'> {
    return { isSameDay: false };
  }

  /**
   * The Export Check panel holds its line items in a form of its own, and the
   * check body reads what that form last *saved* — so it has to save first.
   */
  onBeforeSubmit(): Observable<boolean> {
    return this.exportCheckService.saveLineItems();
  }

  /**
   * The schedule half of a saved mailing. It lives on this form rather than on
   * the mail service — Schedule and Recurring are the cheque's own fields, and
   * the modal reads them from here.
   *
   * `frequency` is what separates the two: a repeating mailing always names one,
   * a one-off scheduled mailing carries only its date.
   */
  private restoreMailingSchedule(mailing: IMailingDetails | undefined): void {
    if (!mailing) {
      return;
    }

    if (mailing.frequency) {
      this.detailsForm.patchValue(
        {
          needRecurring: true,
          recurringFrequency: String(mailing.frequency),
          recurringStartDate: mailing.start_date || '',
          recurringEndSelect: String(mailing.end_select ?? ''),
          recurringCount:
            mailing.count === '' || mailing.count == null
              ? null
              : Number(mailing.count),
          recurringUntil: mailing.until || null,
          recurringIncludeCheck: mailing.recurring_include_check !== false
        },
        { emitEvent: false }
      );
      return;
    }

    if (mailing.schedule_date) {
      this.detailsForm.patchValue(
        { scheduleDate: mailing.schedule_date },
        { emitEvent: false }
      );
    }
  }

  /**
   * The schedule half of a saved e-check or deposit. Both keep it in a nested
   * `recurring` object rather than in the flat fields a mailing uses, so the
   * mailing's restore cannot be reused as it stands.
   */
  private restoreNestedSchedule(
    d: { schedule_date?: string; recurring?: Record<string, unknown> } | undefined
  ): void {
    const { recurring } = d ?? {};

    if (recurring?.frequency) {
      const endSelect = String(recurring.end_select ?? '');
      const { count } = recurring;
      this.detailsForm.patchValue(
        {
          needRecurring: true,
          recurringFrequency: String(recurring.frequency),
          recurringStartDate: String(recurring.start_date ?? ''),
          recurringEndSelect: endSelect,
          recurringCount:
            count === '' || count == null ? null : Number(count),
          recurringUntil: (recurring.until as string) || null,
          // The two shapes this has arrived in; anything else is the default on.
          recurringIncludeCheck:
            recurring.recurring_include_check !== false &&
            recurring.recurring_include_check !== 0
        },
        { emitEvent: false }
      );
      return;
    }

    const scheduleDate =
      d?.schedule_date || (recurring?.schedule_date as string) || '';
    if (scheduleDate) {
      this.detailsForm.patchValue(
        { scheduleDate },
        { emitEvent: false }
      );
    }
  }

  patchDetailsFromPayment(details: IPaymentDetails): void {
    // A clone cannot reuse the invoice number — it belongs to the invoice the original
    // settled; EDIT keeps it (payments-main-v35 L720/L734 vs L847/L861).
    const isClone = this.sendStateService.mode() === 'CLONE';

    this.detailsForm.patchValue(
      {
        memo: details.description ?? '',
        invoiceNumber: isClone ? '' : details.referenceNo ?? '',
        category: details.category?.id ? details.category : null
      },
      { emitEvent: false }
    );

    // The zil-payment knows the amount, payee and memo; everything that makes it a
    // *check* is on the check record, so fetch that too.
    // The mailing the cheque was saved with, so reopening it shows the carrier
    // and addresses the user chose rather than the defaults.
    const mailing = (
      details.transfer as { mailing_details?: IMailingDetails } | undefined
    )?.mailing_details;
    this.mailService().restoreMailing(mailing);
    this.restoreMailingSchedule(mailing);

    // The same for an e-check and a deposit, both of which the payment now
    // carries alongside the mailing.
    const transfer = details.transfer as
      | {
          echeck_details?: IEcheckDetails;
          direct_deposit_details?: IDirectDepositDetails;
        }
      | undefined;

    const echeck = transfer?.echeck_details;
    this.emailService().restoreEcheck(echeck);

    const deposit = transfer?.direct_deposit_details;
    this.depositService().restoreDirectDeposit(deposit);

    // Only one of the three can be set, so whichever is present owns the schedule.
    this.restoreNestedSchedule(echeck ?? deposit);

    const checkId = details.transfer?.id;
    if (!checkId) {
      return;
    }
    this.checkId.set(checkId);

    // Closed until the check is in: editing the payment's half of the form against a
    // check that has not loaded writes the wrong thing back (bank-ac-check L535-537, L726).
    if (this.sendStateService.mode() === 'EDIT') {
      this.detailsForm.disable({ emitEvent: false });
    }

    this.loadCheck(checkId);
  }

  /**
   * Pay a bill by check. Where the payee has credit on file and the user chose to
   * spend it, the amount is *less* than the bill total — without that the check is
   * written for the full amount and the credit is never applied (bank-ac-check L420-470).
   */
  patchDetailsFromBill(bill: IBillBulkPaymentData): void {
    if (this.payWithVendorCredit() && bill.isVendorCreditAvailable === 1) {
      this.sendStateService.coreForm.controls.amount.setValue(
        String(bill.amountAfterCreditApplied ?? '')
      );
    }

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
        memo,
        invoiceNumber: bill.invoiceNumbers ?? ''
      },
      { emitEvent: false }
    );

    if (Array.isArray(bill.remittance) && bill.remittance.length) {
      this.remittanceItems = bill.remittance.map((r: IBillRemittance) => ({
        invoiceNumber: r.invoiceNumber,
        invoiceDate: r.invoiceDate,
        itemDescription: r.description ?? r.item_name,
        grossAmount: r.total
      })) as unknown as IRemittanceDetails[];
    }
  }

  // -------------------------------------------------------------------------
  // Entry points
  // -------------------------------------------------------------------------

  save(): void {
    this.sendStateService.deliveryError.set(false);
    this.sendStateService.noPayeeBlocked.set(false);
    this.submit('save');
  }

  confirm(): void {
    // Process-without-payee makes a blank check; it cannot be confirmed as a payment.
    if (this.detailsForm.controls.noPayee.value) {
      this.sendStateService.noPayeeBlocked.set(true);
      this.sendStateService.requestFieldFocus('payee');
      return;
    }
    this.sendStateService.noPayeeBlocked.set(false);

    const delivery = this.sendStateService.checkDelivery();
    if (!delivery) {
      // Fields are answered top to bottom. The amount, payee and account all sit
      // above the delivery picker, so when those are missing too they are what
      // the user is sent to - not the first gate that happens to run.
      this.applyBlankCheckValidators();
      const coreKey = this.sendStateService.firstInvalidKey();
      if (coreKey) {
        this.sendStateService.coreForm.markAllAsTouched();
        this.sendStateService.requestFieldFocus(coreKey);
        return;
      }

      this.sendStateService.deliveryError.set(true);
      this.sendStateService.requestFieldFocus('delivery');
      return;
    }
    this.submit(delivery);
  }

  private submit(action: CheckAction): void {
    if (!this.validate(action)) {
      return;
    }
    this.sendStateService.deliveryError.set(false);
    this.checkVerification((isIncomplete) => {
      if (isIncomplete && action !== 'save') {
        this.promptEmailPhoneVerification(action);
        return;
      }

      this.captureSuccessContext();

      // Save writes a draft; only an actual delivery is worth confirming.
      if (action === 'save') {
       this.paymentConfirmService.setProcessing(true);
        this.write(action);
        return;
      }

     this.paymentConfirmService.ask(this.confirmRequest(action)).subscribe((confirmed) => {
        if (!confirmed) {
         this.paymentConfirmService.setProcessing(false);
          return;
        }
       this.paymentConfirmService.setProcessing(true);

        // Re-sending an untouched check: the record on file already matches the screen,
        // so it goes out as it stands rather than being rewritten (bank-ac-check L1192-1205).
        const checkId = this.checkId();
        if (this.sendStateService.mode() === 'EDIT' && checkId && this.isUnchanged()) {
          if (action === 'mail') {
            // The cheque on file already matches the screen, so it is posted as
            // it stands. `sent-mail` carries the mailing options itself, so a
            // carrier changed without touching the cheque still goes out on the
            // one that is on screen.
            this.mailNow(checkId);
            return;
          }
          if (action === 'email') {
            this.emailNow(checkId);
            return;
          }
          if (action === 'ach') {
            this.depositNow(checkId);
            return;
          }
        }

        // Every check delivery writes the cheque first and delivers it second.
        // The two calls are chained behind one button, so the user still sees a
        // single action — but unlike the consolidated endpoint, the cheque
        // exists in between, which is what lets an edit reach it and what gives
        // the delivery options somewhere to be saved.
        this.write(action);
      });
    });
  }

  // -------------------------------------------------------------------------
  // Guards
  // -------------------------------------------------------------------------

  /** A blank check carries no amount and no date, so neither is asked for. */
  private applyBlankCheckValidators(): void {
    const c = this.detailsForm.controls;
    c.issueDate.setValidators(c.noDate.value ? [] : [Validators.required]);
    c.issueDate.updateValueAndValidity({ emitEvent: false });
    const { amount } = this.sendStateService.coreForm.controls;
    amount.setValidators(
      c.noAmount.value ? [] : [Validators.required, Validators.min(0.01)]
    );
    amount.updateValueAndValidity({ emitEvent: false });
  }

  private validate(action: CheckAction): boolean {
    // Freeze checks are ACH-only: a printed or mailed check is not a transfer into the
    // payee's account, so v3 refuses these two on Direct Deposit alone (bank-ac-check L1149-1163).
    if (action === 'ach') {
      if (this.paymentsService.checkForComplianceFreeze()) {
        this.paymentsService.openComplianceFreezeModal();
        return false;
      }

      if (this.sendStateService.coreForm.getRawValue().payee?.isFreezed) {
        this.v4AlertService.infoAlert({
          content:
            'This payee is temporarily restricted from processing payments'
        });
        return false;
      }
    }

    this.applyBlankCheckValidators();

    if (this.sendStateService.coreForm.invalid || this.detailsForm.invalid) {
      this.sendStateService.coreForm.markAllAsTouched();
      this.detailsForm.markAllAsTouched();
      this.sendStateService.requestFieldFocus(
        this.sendStateService.invalidKeys(this.detailsForm)
      );
      return false;
    }

    // A mailed check has its own required fields — a deliverable address and a
    // carrier that will actually go there. The API refuses all of them; naming
    // the first one here saves the user a round trip.
    // The mailing block says what is wrong under the field it belongs to, so
    // this only points at it — an alert would repeat it in a dialog the user
    // has to dismiss, and did so in the words of a different field.
    if (action === 'mail') {
      if (this.mailService().validationError()) {
        this.sendStateService.deliveryError.set(true);
        this.sendStateService.requestFieldFocus('checkMailing');
        return false;
      }
    }

    // An emailed check needs somewhere to go too. The field says what is wrong
    // under itself, so this only points at it — an alert would repeat it in a
    // dialog the user has to dismiss.
    if (action === 'email') {
      if (this.emailService().validationError()) {
        this.sendStateService.deliveryError.set(true);
        this.sendStateService.requestFieldFocus('checkEmail');
        return false;
      }
    }

    // The account is a details-form control, so a missing one has already been
    // named above; this catches what only the service knows — a notify channel
    // switched on with nothing to send to.
    if (action === 'ach') {
      if (this.depositService().validationError()) {
        this.sendStateService.deliveryError.set(true);
        this.sendStateService.requestFieldFocus('payeeBankAc');
        return false;
      }
    }

    // The export panel has already saved (`onBeforeSubmit`), so what it holds is what
    // the check would carry — and on some accounts that is not enough to export with.
    const exportIssue = this.exportCheckService.blockingIssue(
      this.detailsForm.getRawValue().category?.id
    );
    if (exportIssue) {
      this.v4AlertService.warningAlert({ content: exportIssue });
      return false;
    }

    return true;
  }

  private checkVerification(callback: (isIncomplete: boolean) => void): void {
    this.userProfileService.UserVerification$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((res) => {
      callback(res.email_verified === 0 || res.phone_verified === 0);
    });
  }

  private promptEmailPhoneVerification(action: CheckAction): void {
    const dialogRef = this.v4AlertService.warningAlert({
      title: 'Verification Required',
      content: 'Please verify your phone number to complete this payment.',
      doneMsg: 'Verify Now',
      isOk: true,
      isCancel: true
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.accountVerificationService
          .openEmailPhoneVerificationModal()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((isVerified) => {
            if (isVerified) {
              this.submit(action);
            }
          });
      }
    });
  }

  /**
   * A check has to be drawn on a real account number. An account added by instant
   * verification has a virtual one, which banks reject when the payee deposits;
   * a Zil account can only do ACH. Both are stopped before the check goes out.
   */
  private guardBank(
    action: CheckAction,
    proceed: () => void,
    fallback: () => void
  ): void {
    const account = this.sendStateService.coreForm.getRawValue().bankAc;
    if (!account) {
      proceed();
      return;
    }

    if (account.isVirtualAccount) {
      this.v4AlertService
        .infoAlert({
          content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${account.accountNumber}. This works for ACH and wire transfers, but won't work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((update) => {
          if (update) {
            this.confirmAccountNumber(account, proceed);
          } else {
            fallback();
          }
        });
      return;
    }

    // Verification was attempted and rejected — the account number is unusable.
    if (
      account.isVirtualAccount === 0 &&
      account.verifiedBy === 88 &&
      account.verified === 0
    ) {
      this.v4AlertService
        .failedAlert({
          content:
            "Your Bank account verification was rejected. You won't be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((update) => {
          if (update) {
            this.confirmAccountNumber(account, proceed);
          } else {
            fallback();
          }
        });
      return;
    }

    // A Zil account can only do ACH, so it cannot print, mail or email a check
    // (bank-ac-check `zilBankCheck` L2157-2161).
    if (account.isItZil) {
      this.v4AlertService.warningAlert({
        content: `This check cannot be ${this.actionWord(
          action
        )}.Currently, the Zil account is only set up for ACH/Direct Deposit.`
      });
      fallback();
      return;
    }

    proceed();
  }

  private confirmAccountNumber(account: IBankDropdown, retry: () => void): void {
    this.matDialog
      .open(VirtualAccountConfirmationModalV4Component, {
        maxWidth: '1200px',
        width: '100%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { bankAccountIds: [account.id] }
      })
      .afterClosed()
      .subscribe((res: { success?: boolean } | undefined) => {
        if (res?.success) {
          // The account now carries a different number, so every list holding
          // the old one is stale (bank-ac-check `onPrintCheck` L1645-1652).
          this.store.dispatch(
            bankAccountsActions.loadBankAccounts({
              searchTerm: '',
              context: undefined,
              isReload: true
            })
          );
          retry();
        } else {
          this.done(SUCCESS_SAVED);
        }
      });
  }

  // -------------------------------------------------------------------------
  // Load an existing check
  // -------------------------------------------------------------------------

  private loadCheck(checkId: string): void {
    this.checkService
      .getChecksById(checkId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.patchFromCheck(res.data);
          }
        },
        error: () => {
          // The payment's own fields are already in; the rest keeps its defaults
          // — but the form must not stay closed just because the check 404'd.
          this.detailsForm.enable({ emitEvent: false });
        }
      });
  }

  private patchFromCheck(check: ICheckDetailsData): void {
    const c = this.detailsForm.controls;

    // The Export Check panel restores its saved line items from this.
    this.checkDetails.set(check);

    // The form was closed while the check was loading; its real values are here.
    this.detailsForm.enable({ emitEvent: false });

    // A clone is written *today* and carries neither the original's invoice number nor
    // its issue date — both belong to the check that went out (payments-main-v35 L730-738).
    const isClone = this.sendStateService.mode() === 'CLONE';
    const savedSerial = check.serialNumber ? Number(check.serialNumber) : null;

    this.detailsForm.patchValue(
      {
        issueDate: isClone ? ymd(new Date()) : ymd(check.date),
        // A clone is a new cheque and takes the account's next number — the
        // original's is already on a cheque that went out. The rail may have
        // answered before the check loaded, so whatever it put here is kept.
        checkNumber: isClone ? c.checkNumber.value : savedSerial,
        invoiceNumber: isClone ? '' : check.invoiceNumber ?? '',
        payeeIdNumber: check.accountNumber ?? '',
        noAmount: check.isNoAmount === 1,
        noSign: check.isNoSign === 1,
        noPayee: check.isNoPayee === 1,
        noDate: check.isNoDate === 1
      },
      { emitEvent: false }
    );

    // The blanked fields arrive with the check, and close their fields *silently* —
    // the user did not just tick anything (bank-ac-check L2631-2647).
    this.applyProcessWithoutState();

    // The component builds this list blank from the check *design*, so without the
    // check's own values an update writes every custom field back empty.
    Object.entries(check.customElements ?? {}).forEach(([field, value]) => {
      this.setCustomFieldValue(field, value != null ? String(value) : '');
    });

    // The line items are on the check too, and `checkBody` writes back whatever
    // it is holding (bank-ac-check `getCheckData` L758-759).
    const remittance = (check.remittance ?? []) as IRemittanceDetails[];
    if (remittance.length) {
      this.remittanceItems = remittance;
      this.remittanceType = check.remittance_type ?? 1;
      this.insertFromRemittance = true;
    }

    // A scheduled check is already queued, so the fields the queue was built from can
    // no longer move and its date becomes compulsory (bank-ac-check L729-754).
    if (this.sendStateService.mode() === 'EDIT' && check.status === CHECK_SCHEDULED) {
      this.isScheduled.set(true);

      c.scheduleDate.setValue(check.scheduleDate ?? null, { emitEvent: false });
      c.scheduleDate.setValidators([Validators.required]);
      c.scheduleDate.updateValueAndValidity({ emitEvent: false });

      c.issueDate.disable({ emitEvent: false });
      c.checkNumber.disable({ emitEvent: false });
      c.category.disable({ emitEvent: false });
      c.payeeIdNumber.disable({ emitEvent: false });
      this.sendStateService.coreForm.controls.payee.disable({ emitEvent: false });
      this.sendStateService.coreForm.controls.bankAc.disable({ emitEvent: false });
    }

    this.editSnapshot = this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Write the check record
  // -------------------------------------------------------------------------

  private write(action: CheckAction): void {
    const editingId = this.sendStateService.mode() === 'EDIT' ? this.checkId() : undefined;

    // A payment that was not a check until the user switched the method to one
    // has to become a check first — the check record hangs off the zil-payment.
    const details = this.editedPayment();
    if (details?.id && details.transferTypeCode && details.transferTypeCode !== 'check') {
      this.convertToCheck(details.id, action);
      return;
    }

    const body = this.checkBody(action);
    const request = editingId
      ? this.checkService.updateCheck(editingId, body)
      : this.checkService.createCheck(body);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (!res?.success || !res.data?.id) {
         this.paymentConfirmService.setProcessing(false);
          return;
        }

        // The API accepted the duplicate; the next write starts clean again.
        this.fieldsWarning = 0;
        this.checkNumberWarning = 0;

        // FreshBooks decides the amount, and the next check gets its own
        // (bank-ac-check L1332-1335).
        if (this.exportCheckService.options().isFreshBooksPushBack) {
          this.sendStateService.coreForm.controls.amount.reset();
          this.paymentsService.onSaveFreshBooksDetails.set(undefined);
        }

        // The account has now made a payment — the onboarding step is done
        // (bank-ac-check L1337-1341).
        this.localStorageService.updateNestedData(
          'gettingStartedData',
          'payment',
          1
        );

        if (action === 'save') {
          this.scriptService.gtagEventScript('check-created', {
            amount: Number(this.sendStateService.coreForm.getRawValue().amount)
          });
        }

        this.checkId.set(res.data.id);
        this.route(action, res.data.id);
      },
      error: (err) => this.handleWriteError(err, action)
    });
  }

  /** PATCH the zil-payment to `check`, then write the check against it. */
  private convertToCheck(paymentId: string, action: CheckAction): void {
    this.paymentsService
      .updatePayment(paymentId, this.convertBody())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res?.success || !res.data?.transfer?.id) {
           this.paymentConfirmService.setProcessing(false);
            return;
          }
          this.sendStateService.editedPayment.set(res.data);
          this.checkId.set(res.data.transfer.id);
          this.write(action);
        },
        error: (err) => this.showError(err)
      });
  }

  /**
   * 190 and 213 are both "are you sure?", not failures: the user accepts the
   * duplicate and the same write is repeated carrying the matching warning flag.
   */
  private handleWriteError(err: unknown, action: CheckAction): void {
   this.paymentConfirmService.setProcessing(false);

    const handled = this.sendPaymentErrorHandlerService.handle(err, {
      onDuplicateFieldsRetry: () => {
        this.fieldsWarning = 1;
       this.paymentConfirmService.setProcessing(true);
        this.write(action);
      },
      onDuplicateCheckNoRetry: () => {
        this.checkNumberWarning = 1;
       this.paymentConfirmService.setProcessing(true);
        this.write(action);
      },
      onDuplicateCheckNoEdit: () => this.checkModalRequest.update((n) => n + 1),
      // 515: the payee is missing the SSN/EIN or address the check needs, and it is
      // fixable right here (bank-ac-check `openPayeeWarning` L2655-2667).
      onPayeeWarningUpdate: () => this.payeeService.openPayeeEditModal.next(true)
    });

    if (handled) {
      return;
    }

    // A permission failure has already been spoken for by the interceptor; v3
    // stays quiet rather than alerting twice (bank-ac-check L1295-1306).
    const permissionRequired = (err as { error?: { permissionRequired?: string } })
      ?.error?.permissionRequired;
    if (permissionRequired === 'check-create') {
      return;
    }

    this.sendPaymentErrorHandlerService.showGenericError(err);
  }

  // -------------------------------------------------------------------------
  // Deliver it
  // -------------------------------------------------------------------------

  private route(action: CheckAction, checkId: string): void {
    switch (action) {
      case 'save':
        this.done(SUCCESS_SAVED);
        break;

      case 'mail':
        this.guardBank(
          action,
          () => this.mailNow(checkId),
          () => this.done(SUCCESS_SAVED)
        );
        break;

      case 'email':
        this.deliverByEmail(checkId);
        break;

      case 'ach':
        this.depositNow(checkId);
        break;

      case 'printCheck':
      case 'printWhiteCheck':
        this.guardBank(
          action,
          () =>
            this.print(
              checkId,
              action === 'printWhiteCheck' ? WHITE_PAPER_TYPE : this.checkPaperType
            ),
          () => this.done(SUCCESS_SAVED)
        );
        break;

      default:
        this.done();
    }
  }

  /**
   * Posts the cheque that was just written. Chained straight off create so the
   * two calls read as one action, which is what the button has always promised.
   *
   * `sent-mail` is the untouched legacy endpoint, so it still wants its own
   * shape: the shared options at the top and a block keyed by the cheque's own
   * id. `mailingDetails` holds the same values flat, so this is a re-key rather
   * than a second source of truth.
   */
  private mailNow(
    checkId: string,
    acknowledgements: Partial<
      Pick<IMailingDetails, 'shipping_rate_warning' | 'fedex_cutoff_time_warning'>
    > = {},
    signature: 0 | 1 = 0
  ): void {
    const md = this.mailService().mailingDetails(acknowledgements);

    // Either end being custom makes it a custom mailing, and both are named
    // when it is. `sent_to_customer_address` is a narrower thing — the modal
    // raises it for a custom destination alone — so keying the addresses off it
    // dropped the return address of every cheque still going to its payee.
    const isCustom = this.mailService().isCustomMailing();

    const payload: Record<string, unknown> = {
      mail_check_ids: [checkId],
      all_check_ids: [],
      // `0` on the first send, which is what leaves the server free to raise
      // `errorCode 2` for a cheque the account has not signed — the question the
      // flow this replaces puts to `cheque-details` before mailing at all. The
      // re-post flips it, once the user has answered.
      is_signature: signature,
      // Always on, and not a property of this mailing: it asks the server to
      // apply the account's approval rules to the send. Scheduling or repeating
      // a cheque changes when it goes out, not who is allowed to send it.
      check_approval: 1,
      sent_to_customer_address: md.sent_to_customer_address,
      Single_mail_options: md.Single_mail_options,
      individual_envelope: md.individual_envelope,
      shipping_rate_warning: md.shipping_rate_warning ?? 0,
      fedex_cutoff_time_warning: md.fedex_cutoff_time_warning ?? 0,
      bank_account_id: md.bank_account_id,
      ...(isCustom
        ? {
            custom_address_shipping_type: md.custom_address_shipping_type,
            shipping_from: md.shipping_from,
            shipping_to: md.shipping_to
          }
        : {}),
      schedule_date: md.schedule_date ?? '',
      recurring_include_check: md.recurring_include_check ?? true,
      frequency: md.frequency ?? '',
      start_date: md.start_date ?? '',
      end_select: md.end_select ?? '',
      count: md.count ?? '',
      until: md.until ?? '',
      [checkId]: {
        mail_type: md.mail_type ?? 1,
        check_paper: md.check_paper ?? 7,
        informed_payee_sms: md.informed_payee_sms ?? 0,
        informed_payee_email: md.informed_payee_email ?? 0,
        payee_phone: md.payee_phone ?? '',
        payee_email: md.payee_email ?? '',
        // The notify modal's "save this to the payee's record" ticks.
        save_payee_email: md.save_payee_email ?? 0,
        save_payee_phone: md.save_payee_phone ?? 0,
        file_hidden: md.file_hidden ?? []
      }
    };

    this.checkService
      .sendmail(payload, this.mailSendType(md))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            this.handleMailSendError({ error: res }, checkId);
            return;
          }
          this.done('send');
        },
        error: (err) => this.handleMailSendError(err, checkId)
      });
  }

  /**
   * The same two-outcome offer as `askFedexCutoff`, but re-posting the cheque
   * that already exists. Declining leaves it written and unmailed, which is a
   * saved cheque — the outcome every other decline on this rail reports.
   */
  private handleFedexCutoffForCheck(
    blocker: ICheckMailBlocker,
    checkId: string
  ): void {
    const message = this.blockerMessage(blocker, 'mailed');

    if (blocker.code === 'fedex_saturday_offer') {
      this.matDialog
        .open(FedexSaturdayConfirmationV4Component, {
          maxWidth: '550px',
          width: '98%',
          autoFocus: false,
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { message }
        })
        .afterClosed()
        .subscribe((choice: { process?: string } | false | undefined) => {
          const process = choice ? choice.process : undefined;
          if (!process) {
            this.done(SUCCESS_SAVED);
            return;
          }
          this.paymentConfirmService.setProcessing(true);
          this.mailNow(checkId, {
            fedex_cutoff_time_warning: process === 'Saturday' ? 2 : 1
          });
        });
      return;
    }

    this.v4AlertService
      .warningAlert({
        content: message,
        doneMsg: 'Continue',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((chose) => {
        if (!chose) {
          this.done(SUCCESS_SAVED);
          return;
        }
        this.paymentConfirmService.setProcessing(true);
        this.mailNow(checkId, { fedex_cutoff_time_warning: 1 });
      });
  }

  /**
   * The trailing segment of `sent-mail/{type}`. An immediate mailing sends an
   * empty one — the legacy modal's Send Now button passes `''`, and `mail now`
   * is only the radio's own value, never part of the URL.
   */
  private mailSendType(md: IMailingDetails): string {
    if (md.frequency) {
      return 'recurring';
    }
    return md.schedule_date ? 'schedule' : '';
  }

  /**
   * `sent-mail` answers with a flat `errorCode`, so the FedEx cutoff and the
   * re-quote arrive the way `withFedexCutoff` already rebuilds them. Retrying
   * re-posts the cheque that exists rather than writing a second one.
   */
  private handleMailSendError(err: unknown, checkId: string): void {
    const body = (err as IApiError)?.error;
    const blockers = this.withFedexCutoff([], body);

    if (blockers.length) {
      this.handleFedexCutoffForCheck(blockers[0], checkId);
      return;
    }
    // Everything else `sent-mail` can answer is what it always answered: a
    // missing signature to verify, an approval to wait for, a permission the
    // interceptor has already spoken for.
    this.handleMailError(err as IApiError, checkId);
  }

  /**
   * The next number for the chosen account. This used to live on the details
   * panel, which is built only once that panel is expanded — so a cheque written
   * without opening it went out with no number at all. The rail is alive for as
   * long as the payment is, so it asks.
   *
   * It asks *every* time the check flow lands on an account, not once per
   * account: the number the API hands out moves whenever a cheque is written
   * anywhere, so a number remembered from an earlier visit is a duplicate
   * waiting to happen. `switchMap` keeps only the latest answer.
   */
  private watchSerialNumber(): void {
    const { bankAc } = this.sendStateService.coreForm.controls;
    const isBankCheck = computed(
      () =>
        this.sendStateService.sourceId() === 'bankaccount' &&
        this.sendStateService.isCheckSelected()
    );

    combineLatest([
      bankAc.valueChanges.pipe(
        startWith(bankAc.value),
        map((bank) => bank?.id ?? null)
      ),
      toObservable(isBankCheck, { injector: this.injector })
    ])
      .pipe(
        filter(([id, onCheck]) => !!id && onCheck),
        map(([id]) => id as string),
        switchMap((bankId) =>
          this.nextSerialNumber(bankId).pipe(
            map((serial) => ({ bankId, serial }))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ bankId, serial }) => this.applySerialNumber(bankId, serial));
  }

  /** The account the number on screen belongs to. */
  private serialBankId: string | null = null;

  /** The cheque being edited already carries its number; it is not renumbered. */
  private isEditingCheckOn(bankId: string): boolean {
    return (
      this.sendStateService.mode() === 'EDIT' &&
      this.sendStateService.editedPayment()?.sourceId === bankId
    );
  }

  /**
   * The account's next number as the API has it right now. The cheque under
   * edit keeps its own: that is restored here (nothing emitted) and the API is
   * not asked. A failed request emits nothing — no number is better than a
   * wrong one, and the field stays editable.
   */
  private nextSerialNumber(bankId: string): Observable<number> {
    if (this.isEditingCheckOn(bankId)) {
      const saved = this.checkDetails()?.serialNumber;
      if (saved) {
        this.detailsForm.controls.checkNumber.setValue(Number(saved), {
          emitEvent: false
        });
        this.detailsWritten.update((n) => n + 1);
      }
      return EMPTY;
    }

    return this.bankService
      .getCheckSerialNo(bankId, new HttpHeaders().set('disablePermission', 'true'))
      .pipe(
        map((res) => Number(res?.data?.[0]?.serialNo)),
        filter((serial) => Number.isFinite(serial) && serial > 0),
        catchError(() => EMPTY)
      );
  }

  private applySerialNumber(bankId: string, serial: number): void {
    const { checkNumber } = this.detailsForm.controls;

    // The edited payment can arrive after the request went out; its own number
    // is restored by the hydration, and this answer is not for it.
    if (this.isEditingCheckOn(bankId)) {
      return;
    }

    // A different account is a different series, so its number replaces what is
    // there. On the same account a number the user typed themselves stands.
    const sameAccount = this.serialBankId === bankId;
    this.serialBankId = bankId;
    if (sameAccount && checkNumber.dirty) {
      return;
    }

    checkNumber.setValue(serial, { emitEvent: false });
    this.detailsWritten.update((n) => n + 1);
  }

  private mailService(): CheckMailService {
    return this.injector.get(CheckMailService);
  }

  private emailService(): CheckEmailService {
    return this.injector.get(CheckEmailService);
  }

  private depositService(): CheckDirectDepositService {
    return this.injector.get(CheckDirectDepositService);
  }

  private deliveryService(
    action: ConsolidatedDelivery
  ): CheckMailService | CheckEmailService | CheckDirectDepositService {
    if (action === 'mail') {
      return this.mailService();
    }
    return action === 'email' ? this.emailService() : this.depositService();
  }

  /**
   * Create the cheque and deliver it in a single call. `acknowledgements` carries
   * the user's answer to a resolvable blocker and rides an otherwise identical
   * body. A refusal rolls the cheque back with it — nothing is left behind.
   */
  private deliverNow(
    action: ConsolidatedDelivery,
    acknowledgements: Record<string, number | boolean> = {}
  ): void {
    const service = this.deliveryService(action);

    service
      .send(acknowledgements)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            this.handleBlockers(
              action,
              this.withFedexCutoff(res?.blockers ?? [], res),
              acknowledgements
            );
            return;
          }

          this.checkId.set(res.data?.check_id);

          // The endpoint says which of the three it did, so the success modal
          // no longer has to be told by a modal's event stream.
          if (action === 'email') {
            this.mailEmailType = EMAIL_STATUS_TYPE[res.data?.status ?? ''];
          }

          this.scriptService.gtagEventScript(
            action === 'email' ? 'check-emailed' : 'check-created',
            { amount: Number(this.sendStateService.coreForm.getRawValue().amount) }
          );
          this.localStorageService.updateNestedData(
            'gettingStartedData',
            'payment',
            1
          );
          service.newPayment();
          this.done('send');
        },
        error: (
          err: {
            error?: {
              blockers?: ICheckMailBlocker[];
              errorCode?: number | string;
              errorMsg?: string;
            };
          }
        ) => {
          const blockers = this.withFedexCutoff(
            err?.error?.blockers ?? [],
            err?.error
          );
          if (!blockers.length) {
            this.showError(err);
            return;
          }
          this.handleBlockers(action, blockers, acknowledgements);
        }
      });
  }

  /**
   * A resolvable blocker is a question, not a failure: the user accepts it and the
   * same body goes back carrying the matching acknowledgement. Everything else is
   * data the user has to go and fix.
   */
  private handleBlockers(
    action: ConsolidatedDelivery,
    blockers: ICheckMailBlocker[],
    acknowledgements: Record<string, number | boolean>
  ): void {
    this.paymentConfirmService.setProcessing(false);

    const verb = this.actionWord(action);
    const blocker = blockers[0];
    if (!blocker) {
      this.v4AlertService.warningAlert({
        content: `This check could not be ${verb}. Please try again.`
      });
      return;
    }

    // Recharge, subscription and compliance prompts belong to the interceptor,
    // which has already opened one. Adding ours would stack two dialogs.
    if (INTERCEPTOR_HANDLED_CODES.has(Number(blocker.data?.error_code))) {
      return;
    }

    if (!blocker.resolvable) {
      // Two of these drive an interaction rather than a message, and the
      // blocker carries what that interaction needs.
      if (blocker.code === 'bank_details_required') {
        this.askBankDetails(blocker);
        return;
      }
      if (blocker.code === 'bank_account_unverified') {
        this.askBankVerification(blocker);
        return;
      }

      this.v4AlertService.warningAlert({
        content: this.blockerMessage(blocker, verb)
      });
      return;
    }

    if (blocker.code === 'signature_missing') {
      this.askSignature(action, blocker, acknowledgements);
      return;
    }

    if (FEDEX_CUTOFF_CODES.includes(blocker.code)) {
      this.askFedexCutoff(action, blocker, acknowledgements);
      return;
    }

    const key = blocker.data?.acknowledgement || MAIL_ACKNOWLEDGEMENT[blocker.code];
    const isRetry = blocker.code === 'service_unavailable';

    this.v4AlertService
      .warningAlert({
        content: this.blockerMessage(blocker, verb),
        doneMsg: isRetry ? 'Try Again' : 'Send Anyway',
        isCancel: true
      })
      .afterClosed()
      .subscribe((accepted) => {
        if (!accepted) {
          return;
        }
        this.paymentConfirmService.setProcessing(true);
        this.deliverNow(
          action,
          key ? { ...acknowledgements, [key]: true } : acknowledgements
        );
      });
  }

  /**
   * The same Sign Authorization modal the other check flows raise, in the mode
   * that does not go looking for a cheque — ours does not exist yet.
   *
   * "Sign Now" writes the signature to the bank account, so the re-send goes out
   * clean: there is no longer a blocker to acknowledge. "Proceed Without
   * Signing" answers the blocker instead.
   */
  private askSignature(
    action: ConsolidatedDelivery,
    blocker: ICheckMailBlocker,
    acknowledgements: Record<string, number | boolean>
  ): void {
    this.matDialog
      .open(VerifySignatureModalV4Component, {
        maxWidth: '510px',
        width: '100%',
        minHeight: '200px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          standalone: true,
          serialNos: blocker.data?.serial_nos ?? [],
          ids: { ids: [] },
          data: { errorMsg: blocker.data?.message ?? '' },
          bankAccountId: this.sendStateService.coreForm.getRawValue().bankAc?.id,
          isDisableNavigation: true,
          hideSuccessAlert: true
        }
      })
      .afterClosed()
      .subscribe((result: VerifySignatureResult | undefined) => {
        if (!result) {
          return;
        }
        this.paymentConfirmService.setProcessing(true);
        this.deliverNow(
          action,
          result === 'signed'
            ? acknowledgements
            : { ...acknowledgements, signature_missing: true }
        );
      });
  }

  /**
   * Rev 3 raises the FedEx cutoff as a resolvable blocker; a response that
   * carries only the legacy `errorCode` 8 or 9 is saying the same thing in the
   * older words. Rebuilding it as a blocker keeps one path for both rather than
   * a second handler that would drift from `handleBlockers`.
   */
  private withFedexCutoff(
    blockers: ICheckMailBlocker[],
    body: { errorCode?: number | string; errorMsg?: string } | undefined
  ): ICheckMailBlocker[] {
    if (blockers.length) {
      return blockers;
    }

    const code = Number(body?.errorCode);
    if (code !== 8 && code !== 9) {
      return blockers;
    }

    return [
      {
        code: code === 9 ? 'fedex_saturday_offer' : 'fedex_processed_monday',
        resolvable: true,
        data: { message: body?.errorMsg, error_code: code }
      }
    ];
  }

  /**
   * `fedex_saturday_offer` is a choice between two outcomes, not a yes/no — the
   * legacy flow sent `2` for either answer and ordered a surcharged Saturday
   * delivery for users who had only accepted the Monday delay.
   *
   * The offer has a modal of its own, which states both outcomes and their price
   * as two buttons. A confirm alert cannot: its "cancel" would have to double as
   * "process Monday", which reads as backing out of the payment entirely.
   */
  private askFedexCutoff(
    action: ConsolidatedDelivery,
    blocker: ICheckMailBlocker,
    acknowledgements: Record<string, number | boolean>
  ): void {
    const message = this.blockerMessage(blocker, this.actionWord(action));

    if (blocker.code === 'fedex_saturday_offer') {
      this.matDialog
        .open(FedexSaturdayConfirmationV4Component, {
          maxWidth: '550px',
          width: '98%',
          autoFocus: false,
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: { message }
        })
        .afterClosed()
        .subscribe((choice: { process?: string } | false | undefined) => {
          // Cancel and the close icon both answer `false`. Neither names an
          // outcome, so nothing goes out — but the cheque itself is written by
          // then, and every other decline on this rail says so rather than
          // leaving the user with no answer at all.
          const process = choice ? choice.process : undefined;
          if (!process) {
            this.done(SUCCESS_SAVED);
            return;
          }
          this.paymentConfirmService.setProcessing(true);
          this.deliverNow(action, {
            ...acknowledgements,
            fedex_cutoff: process === 'Saturday' ? 2 : 1
          });
        });
      return;
    }

    this.v4AlertService
      .warningAlert({
        content: message,
        doneMsg: 'Continue',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((chose) => {
        if (!chose) {
          this.done(SUCCESS_SAVED);
          return;
        }
        this.paymentConfirmService.setProcessing(true);
        this.deliverNow(action, { ...acknowledgements, fedex_cutoff: 1 });
      });
  }

  /**
   * `bank_details_required` has two causes, told apart by `field`:
   * `direct_deposit.payee_account` means a chosen account did not resolve, and
   * is fixed in the picker; `payment.bank_account_id` means the PAYING account
   * has no ACH application, which nothing on this screen can fix.
   */
  private askBankDetails(blocker: ICheckMailBlocker): void {
    if (blocker.field === 'direct_deposit.payee_account') {
      this.v4AlertService.warningAlert({
        content:
          blocker.data?.message ||
          'That bank account could not be used. Choose another for this payee.'
      });
      this.sendStateService.requestFieldFocus('payeeBankAc');
      return;
    }
    this.askAchApproval(blocker);
  }

  /**
   * The payor account is not approved for ACH. Nothing on this screen can fix
   * it, so the offer is to go where it can be — the same offer the legacy
   * modal made on `errorCode 101`.
   */
  private askAchApproval(blocker: ICheckMailBlocker): void {
    this.v4AlertService
      .warningAlert({
        content:
          blocker.data?.message ||
          'Some of your bank accounts are not approved for ACH, please apply to proceed.',
        doneMsg: 'See My Banks',
        isCancel: true
      })
      .afterClosed()
      .subscribe((go) => {
        if (go) {
          this.router.navigate(['/v4/manage/bank-accounts/index']);
          return;
        }
        this.done(SUCCESS_SAVED);
      });
  }

  /**
   * The PAYING account is not verified — `field` is `payment.bank_account_id`,
   * and the ids are the account the money leaves, not the payee's. The blocker
   * names them, so micro-deposit verification opens here rather than sending
   * the user to a list to find the right one.
   */
  private askBankVerification(blocker: ICheckMailBlocker): void {
    // Staging returns `bank_account_ids: [""]` — an id-shaped blank. Opening the
    // verify modal on it would ask the API to verify nothing.
    const [bankAccountId] = (blocker.data?.bank_account_ids ?? []).filter(
      (id) => !!id
    );

    this.v4AlertService
      .warningAlert({
        content: blocker.data?.message || 'This bank account is not verified.',
        doneMsg: bankAccountId ? 'Verify Now' : 'See My Banks',
        isCancel: true
      })
      .afterClosed()
      .subscribe((go) => {
        if (!go) {
          this.done(SUCCESS_SAVED);
          return;
        }
        if (bankAccountId) {
          this.paymentsService.openBankVerifyModalV4(bankAccountId);
          return;
        }
        this.router.navigate(['/v4/manage/bank-accounts/index']);
      });
  }

  /** The message, plus the figures a blocker carries when it has them. */
  private blockerMessage(blocker: ICheckMailBlocker, verb: string): string {
    const message =
      blocker.data?.message || `This check could not be ${verb}.`;

    if (blocker.code === 'cost_requote' && blocker.data?.new_total != null) {
      const from = blocker.data.previous_total;
      const to = blocker.data.new_total;
      return from != null
        ? `${message}: $${from.toFixed(2)} → $${to.toFixed(2)}. Continue?`
        : `${message}: $${to.toFixed(2)}. Continue?`;
    }
    if (blocker.code === 'insufficient_balance' && blocker.data?.shortfall != null) {
      return `${message} You are $${blocker.data.shortfall.toFixed(2)} short.`;
    }
    return message;
  }

  /** The bank has to sign the check before it can be mailed (errorCode 2). */
  private handleMailError(err: IApiError, checkId: string): void {
   this.paymentConfirmService.setProcessing(false);
    const code = err?.error?.errorCode;
    const message = err?.error?.errorMsg;

    if (code === 2) {
      // The API answers with the check number when the missing signature is *that
      // check's*; only then is it the account's signature to verify (bank-ac-check L1930-1933).
      const checkNo = String(this.detailsForm.getRawValue().checkNumber ?? '');
      const bankAccountId =
        checkNo === message
          ? this.sendStateService.coreForm.getRawValue().bankAc?.id
          : undefined;

      this.matDialog
        .open(VerifySignatureModalV4Component, {
          maxWidth: '510px',
          width: '100%',
          minHeight: '200px',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: {
            ids: { ids: [checkId] },
            data: { errorMsg: message },
            bankAccountId,
            isDisableNavigation: true,
            hideSuccessAlert: true,
            // The cheque exists and the mailing is ours to re-post. Left to
            // itself the modal would read the cheque back and open the mail
            // modal on top of this page, which is the flow this one replaces.
            standalone: true
          }
        })
        .afterClosed()
        .subscribe((result: VerifySignatureResult | undefined) => {
          if (!result) {
            // The cheque is written and unmailed, which is a saved cheque.
            this.done(SUCCESS_SAVED);
            return;
          }
          // Signed, or told to go without one — either way the same mailing
          // goes back with the flag flipped, and this time it is not refused.
          this.paymentConfirmService.setProcessing(true);
          this.mailNow(checkId, {}, 1);
        });
      return;
    }

    // 123 is not a failure: the check exists, it just needs a human to approve it
    // before it can go out (bank-ac-check `processMailCheck` L1911-1913).
    if (code === 123) {
      this.approvalRequired('mailed');
      return;
    }

    // A permission failure is already spoken for by the interceptor
    // (bank-ac-check L1958-1966).
    if (
      (err as { error?: { permissionRequired?: string } })?.error
        ?.permissionRequired === 'check-mail'
    ) {
      this.done(SUCCESS_SAVED);
      return;
    }

    // Codes the interceptor owns — 202, recharge the credit wallet, among them
    // — are already on screen with their own actions. A second dialog saying the
    // same sentence is what the user was reading over the saved banner.
    if (this.sendPaymentErrorHandlerService.handledByInterceptor(err)) {
      this.savedAfter(this.openAlertClosed());
      return;
    }

    this.savedAfter(
      this.v4AlertService
        .warningAlert({ content: message || 'Failed to process mail delivery' })
        .afterClosed()
    );
  }

  /**
   * E-check is a subscription feature: an account whose trial has run out cannot send
   * one, and the payment stops here (bank-ac-check `processEmailCheck` L2063-2079).
   */
  private trialExpired(): boolean {
    return (
      this.headerData?.isSubscribed === 0 &&
      this.headerData?.trialPeriodEndsInDays === 0
    );
  }

  private openSubscriptionWarning(): void {
    this.paymentConfirmService.setProcessing(false);
    this.matDialog.open(SubscriptionWarningModalV4Component, {
      maxWidth: '400px',
      width: '95%',
      disableClose: true,
      data: {
        content:
          'our trial period has expired. Please update your subscription to continue.'
      },
      panelClass: 'paddingless-modal-rounded'
    });
  }

  private deliverByEmail(checkId: string): void {
    if (this.trialExpired()) {
      this.openSubscriptionWarning();
      return;
    }

    this.guardBank(
      'email',
      () => this.emailNow(checkId),
      () => this.done(SUCCESS_SAVED)
    );
  }

  /**
   * Emails the cheque that was just written. `email-checks/` is the untouched
   * legacy endpoint, so it still wants its own shape: the shared options at the
   * top and every per-cheque value keyed by the cheque's own id. `echeckDetails`
   * holds the same values flat, so this is a re-key rather than a second source
   * of truth.
   */
  private emailNow(checkId: string): void {
    const e = this.emailService().echeckDetails();

    // A group e-check names its one address at the top and sends no per-cheque
    // map at all — the working call sends `{}`, not the cheque keyed to ''.
    const group = !!e.is_group_echeck;

    const payload: Record<string, unknown> = {
      mail_check_ids: [checkId],
      payee_email: group ? {} : { [checkId]: e.payee_email ?? '' },
      sms_checkbox: { [checkId]: !!e.sms_checkbox },
      phone: { [checkId]: e.phone ?? '' },
      // The notify modal's "save this to the payee's record" ticks, keyed the
      // way this endpoint keys every other per-cheque value.
      save_payee_email: { [checkId]: e.save_payee_email ?? 0 },
      save_payee_phone: { [checkId]: e.save_payee_phone ?? 0 },
      file_hidden: { [checkId]: e.file_hidden ?? [], fileName: e.fileName ?? '' },
      is_group_echeck: group,
      group_echeck_email: e.group_echeck_email ?? '',
      schedule_date: e.schedule_date ?? '',
      recurring_include_check: !!e.recurring_include_check,
      emailCheckRecurring: e.emailCheckRecurring ?? 0,
      is_recurring_value: e.is_recurring_value ?? 0,
      recurring: e.recurring ?? {}
    };

    this.checkService
      .sendEmail(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: { success?: boolean; errorCode?: number } | undefined) => {
          if (!res?.success) {
            this.handleEmailSendError({ error: res });
            return;
          }
          this.mailEmailType = EMAIL_TYPE_BY_RECURRING[
            Number(e.is_recurring_value) || 0
          ];
          this.done('send');
        },
        error: (err) => this.handleEmailSendError(err)
      });
  }

  /** 123 is not a failure: the cheque exists and is waiting on a human. */
  private handleEmailSendError(err: unknown): void {
    if (Number((err as IApiError)?.error?.errorCode) === 123) {
      this.approvalRequired('E-mailed');
      return;
    }
    this.showErrorThenSaved(err);
  }

  /**
   * Deposit a cheque that now exists. The send takes one row per cheque with the
   * ids on the rows themselves; `directDepositDetails` holds the same values
   * flat, so this is a re-key rather than a second source of truth.
   *
   * No bank guard: direct deposit is the one delivery a virtual account number
   * and a Zil account can both do.
   */
  private depositNow(checkId: string): void {
    const d = this.depositService().directDepositDetails();

    const body: IAchBody = {
      data: [
        {
          mail_check_id: checkId,
          payee_email: d.payee_email ?? '',
          wallet_bypassing: String(d.wallet_bypassing) === '1' ? '1' : '0',
          // By its plain id, as `direct-deposit-v4` posts it — the encrypted one
          // belongs to the consolidated envelope and to the cheque record, not
          // to this endpoint. `'0'` is the payee's wallet, which is also what
          // choosing no account means.
          payee_account: this.depositService().payeeAccountPlainId() || '0',
          payee_phone: d.payee_phone ?? '',
          send_sms: d.send_sms ? 1 : 0,
          // The notify modal's "save this to the payee's record" ticks; this
          // endpoint carries every per-cheque value on the row itself.
          save_payee_email: d.save_payee_email ?? 0,
          save_payee_phone: d.save_payee_phone ?? 0,
          file_hidden: (d.file_hidden ?? []) as unknown as string
        }
      ],
      recurring: d.recurring ?? {},
      isRecurringValue: d.is_recurring_value ?? 0,
      isSameDay: d.is_same_day ?? 0
    };

    this.checkService
      .postDirectDepostModalData(body, this.depositHeaders())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: { success?: boolean } | undefined) => {
          if (!res?.success) {
            this.handleDepositSendError({ error: res });
            return;
          }
          this.done('send');
        },
        error: (err: IApiError) => this.handleDepositSendError(err)
      });
  }

  /**
   * What `direct-deposit-v4` sends. `isDisable422` matters: this endpoint
   * refuses with a 422 that carries no `errorCode`, which the interceptor
   * alerts on its own — so without it a refusal was announced twice, once in
   * the interceptor's words and once in ours.
   */
  private depositHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
  }

  /**
   * A refused deposit leaves the cheque written but not sent, which is a saved
   * check — the same reading the modal gave a close without a deposit.
   */
  private handleDepositSendError(err: unknown): void {
    this.paymentConfirmService.setProcessing(false);

    if (Number((err as IApiError)?.error?.errorCode) === 123) {
      this.approvalRequired('Direct Deposited');
      return;
    }
    this.showErrorThenSaved(err);
  }

  private print(checkId: string, paperType: number | string): void {
    this.checkService
      .printMultiCheck({ checkId: [checkId], paperType })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res.data?.url) {
            this.scriptService.gtagEventScript('check-printed', {
              amount: Number(this.sendStateService.coreForm.getRawValue().amount)
            });
            this.openPdf(res.data.url);
            return;
          }
          this.done('send');
        },
        error: (err: IApiError) => {
          const code = err?.error?.errorCode;
          if (code === 'plaid_virtual_account') {
            const account = this.sendStateService.coreForm.getRawValue().bankAc;
            if (account) {
              this.confirmAccountNumber(account, () => this.print(checkId, paperType));
              return;
            }
          }
          if (code === 125) {
           this.paymentConfirmService.setProcessing(false);
            this.v4AlertService.warningAlert({
              content:
                'This check cannot be printed. Administrator approval is required before proceeding'
            });
            return;
          }
          // 123 is not a failure: the check exists, it just needs a human to
          // approve it before it can be printed (bank-ac-check `ApprovalCheck`).
          if (code === 123) {
            this.approvalRequired('printed');
            return;
          }
          this.showError(err);
        }
      });
  }

  /**
   * The check is printed by opening its PDF, which a popup blocker silently eats — so
   * if the window never came up, say so and offer the click again (bank-ac-check L1786-1800).
   */
  private openPdf(url: string): void {
    const opened = window.open(url);

    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
     this.paymentConfirmService.setProcessing(false);
      this.v4AlertService
        .warningAlert({
          content:
            'A popup blocker may be preventing the application from opening the pdf file. You may disable popup blocker from your browser settings',
          doneMsg: 'Try Again'
        })
        .afterClosed()
        .subscribe(() => {
          window.open(url);
          this.done('send');
        });
      return;
    }

    this.done('send');
  }

  // -------------------------------------------------------------------------
  // Payloads
  // -------------------------------------------------------------------------

  /** POST /checks — everything the check record carries. */
  private checkBody(action: CheckAction): INewCheck {
    const core = this.sendStateService.coreForm.getRawValue();
    const d = this.detailsForm.getRawValue();
    const isCloned = this.sendStateService.mode() === 'CLONE';

    return {
      bankAccount: core.bankAc?.id ?? '',
      payee: core.payee?.id ?? '',
      amount: String(core.amount ?? ''),
      checkIssueDate: ymd(d.issueDate) ?? '',
      scheduleDate: ymd(d.scheduleDate),
      category: d.category?.id ?? '',
      checkSerialNo: d.checkNumber ?? 0,
      accountNo: d.payeeIdNumber ?? '',
      invoiceNo: d.invoiceNumber ?? '',
      note: '',
      memo: d.memo ?? '',
      no_amount: d.noAmount ? 1 : 0,
      no_sign: d.noSign ? 1 : 0,
      no_payee: d.noPayee ? 1 : 0,
      no_date: d.noDate ? 1 : 0,
      isVendorCreditApplied: 0,
      vendorCredit: 0,
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      // The user's "Insert to Check" choice, not the mere presence of rows: line items
      // typed but not inserted are not part of the check (bank-ac-check L1092-1093).
      attachRemittanceToCheck: this.insertFromRemittance ? '1' : '0',
      // Always sent, line items or not — 1 for the new remittance format, 0 for the old
      // (bank-ac-check `isRemittanceModified` L2563-2568).
      remittance_type: this.remittanceType,
      remittance: this.insertFromRemittance ? this.remittanceItems : [],
      customElements: this.customElements,
      bills: this.billService.billId() ?? [],
      // A cloned check is a new check drawn on a used number, so it always
      // duplicates something — v3 waives the warning outright.
      warning: isCloned ? 1 : this.fieldsWarning,
      checkNumberWarning: this.checkNumberWarning,
      permission_action: PERMISSION_ACTION[action] ?? 0,
      isCloned: isCloned ? 1 : 0,
      // Saved with the check so the mailing survives it — an edit reopens with
      // the carrier and addresses the user chose, and `sent-mail` is handed the
      // same options the fee was quoted on.
      //
      // Keyed on the delivery rather than the action: saving a mailed check for
      // later is exactly the case that needs its mailing kept, and gating on
      // `action === 'mail'` stored nothing for it.
      ...(this.sendStateService.checkDelivery() === 'mail'
        ? { mailingDetails: this.mailService().mailingDetails() }
        : {}),
      ...(this.sendStateService.checkDelivery() === 'email'
        ? { echeckDetails: this.emailService().echeckDetails() }
        : {}),
      ...(this.sendStateService.checkDelivery() === 'ach'
        ? { directDepositDetails: this.depositService().directDepositDetails() }
        : {}),
      // A print tile has no options of its own, so a saved print check carried
      // nothing that named it and reopened with no delivery. The paper is that
      // name — it is what `paymentMethod.type` / `print_details.paper_type` is
      // read back as.
      ...(this.sendStateService.checkDelivery() === 'printCheck' ||
      this.sendStateService.checkDelivery() === 'printWhiteCheck'
        ? {
            printDetails: {
              paper_type:
                this.sendStateService.checkDelivery() === 'printWhiteCheck'
                  ? WHITE_PAPER_TYPE
                  : this.checkPaperType
            }
          }
        : {}),
      ...this.exportCheckService.checkKeys()
    } as INewCheck;
  }

  /** PATCH /zil-payments/{id} — only to turn a non-check payment into a check. */
  private convertBody(): IUpdatePaymentBody {
    const core = this.sendStateService.coreForm.getRawValue();
    const d = this.detailsForm.getRawValue();

    return {
      transferType: 'check',
      amount: Number(core.amount),
      description: d.memo ?? '',
      payee: core.payee?.id,
      paymentDueDate: ymd(d.issueDate) ?? undefined,
      referenceNo: d.invoiceNumber ?? '',
      sourceId: core.bankAc?.id,
      sourceType: 'bankaccount',
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      payeeIdNumber: d.payeeIdNumber ?? '',
      payeeEmail: core.payee?.email ?? ''
    };
  }


  private confirmRequest(delivery: CheckDeliveryId): IConfirmRequest {
    const core = this.sendStateService.coreForm.getRawValue();
    const carrier = delivery === 'mail' ? this.mailService().selectedCarrier() : null;

    return {
      accNumber: core.bankAc?.accountNumber ?? '',
      bankName: core.bankAc?.nickName ?? '',
      payeeName: core.payee?.name ?? '',
      ...(delivery === 'email'
        ? { payeeEmail: this.emailService().effectiveAddress() || undefined }
        : {}),
      paymentMethod: this.deliveryLabel(delivery),
      amount: Number(core.amount).toFixed(2),
      type: 'bankaccount',
      // Bank+Check has no single processing time — each delivery method has its
      // own, so the modal's source+method lookup is overridden outright.
      source: PaymentSource.BankAccount,
      method: deliveryToMethodId(delivery) as PaymentMethod,
      // The carrier is already chosen by confirm time, so its own timing stands
      // in for the tile's "Depending on shipping type".
      processingTimeOverride:
        (carrier ? this.mailService().selectedCarrierTiming() : '') ||
        deliveryTiming(delivery),
      paymentMethodLabelOverride: this.deliveryLabel(delivery),
      ...(carrier ? { shippingType: carrier.name } : {}),
      // A deposit draws no check — the modal's preview block is keyed to the
      // mail, email and print methods and skips it — so asking for the design
      // would only hold the confirm button behind a fetch nothing renders.
      ...(delivery === 'ach'
        ? {}
        : {
            checkPreviewData: this.checkPreviewValues(),
            checkPreviewPayload: this.checkPreviewPayload()
          })
    };
  }

  /**
   * What the confirmation preview prints. The same fields the check-details
   * modal draws, read straight off the forms rather than off a fetch — only the
   * design behind them has to be asked for.
   */
  private checkPreviewValues(): Record<string, unknown> {
    const core = this.sendStateService.coreForm.getRawValue();
    const d = this.detailsForm.getRawValue();

    return buildCheckPreviewValues({
      payee: this.sendStateService.payeeDetails()?.payee_information,
      payeeName: core.payee?.name ?? '',
      amount: core.amount ?? '',
      memo: d.memo ?? '',
      serialNo: String(d.checkNumber ?? ''),
      issueDate: d.issueDate ?? ''
    });
  }

  /** `POST /checks/preview` — read-only and free, so it costs a modal nothing. */
  private checkPreviewPayload(): Record<string, unknown> | undefined {
    const core = this.sendStateService.coreForm.getRawValue();
    const d = this.detailsForm.getRawValue();
    const amount = d.noAmount
      ? 0
      : Number(String(core.amount ?? '').replace(/[$,]/g, ''));

    return buildCheckPreviewPayload({
      sourceType: 'bankaccount',
      sourceId: core.bankAc?.id,
      payeeId: core.payee?.id,
      amount,
      issueDate: !d.noDate && d.issueDate ? ymd(d.issueDate) : undefined,
      serialNo: d.checkNumber != null ? String(d.checkNumber) : undefined,
      memo: d.memo ?? undefined,
      processWithout: (
        [
          ['noAmount', 'amount'],
          ['noPayee', 'payee'],
          ['noSign', 'signature'],
          ['noDate', 'date']
        ] as const
      )
        .filter(([control]) => !!d[control])
        .map(([, value]) => value)
    });
  }

  private successContext() {
    const core = this.sendStateService.coreForm.getRawValue();

    return {
      amount: Number(core.amount).toFixed(2),
      payeeName: core.payee?.name ?? '',
      paymentMethod: this.sendStateService.methodId() ?? '',
      bankName: core.bankAc?.nickName ?? '',
      sourceAccountDisplay: String(core.bankAc?.accountNumber ?? '')
    };
  }

  private captureSuccessContext(): void {
   this.paymentConfirmService.setSuccessContext(this.successContext());
  }

  // -------------------------------------------------------------------------
  // "Process without" — a blank check
  // -------------------------------------------------------------------------

  private watchProcessWithout(): void {
    const c = this.detailsForm.controls;
    const core = this.sendStateService.coreForm.controls;

    c.noAmount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((on) => {
        if (on) {
          this.v4AlertService.infoAlert({
            content:
              'This will enable processing check without amount, producing a blank check.'
          });
        }
        this.blankedAmount.set(!!on);
        this.blankField(core.amount, !!on);
      });

    c.noPayee.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((on) => {
        if (on) {
          this.v4AlertService.infoAlert({
            content: `This will enable processing check without check's ${
              environment.env_id === 'compass' ? 'vendor' : 'payee'
            }, producing a blank check.`
          });
        }
        this.blankedPayee.set(!!on);
        this.blankField(core.payee, !!on);
      });

    // Nothing to blank: the signature is not a field the user filled in.
    c.noSign.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((on) => {
        if (on) {
          this.v4AlertService.infoAlert({
            content:
              'This will enable processing check without signature, producing a blank check.'
          });
        }
      });

    c.noDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((on) => {
        if (on) {
          this.v4AlertService.infoAlert({
            content:
              "This will enable processing check without check's date, producing a blank check."
          });
        } else if (!c.issueDate.value) {
          c.issueDate.setValue(ymd(new Date()));
        }
        this.blankedDate.set(!!on);
        this.blankField(c.issueDate, !!on);
      });
  }

  /**
   * A bill decides the amount and the payee, so neither is the user's to clear —
   * v3 leaves both alone and only closes the field (bank-ac-check L644-647).
   */
  private blankField(control: AbstractControl, on: boolean): void {
    const isBillCheck = !!this.billService.billId()?.length;

    if (on) {
      if (!isBillCheck) {
        control.reset();
      }
      control.disable();
      return;
    }

    if (!isBillCheck) {
      control.enable();
    }
  }

  /** Re-close the blanked fields without re-alerting or clearing what they hold. */
  private applyProcessWithoutState(): void {
    const d = this.detailsForm.getRawValue();
    const core = this.sendStateService.coreForm.controls;

    const apply = (control: AbstractControl, on: boolean): void => {
      if (on) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    };

    this.blankedAmount.set(!!d.noAmount);
    this.blankedPayee.set(!!d.noPayee);
    this.blankedDate.set(!!d.noDate);

    apply(core.amount, !!d.noAmount);
    apply(core.payee, !!d.noPayee);
    apply(this.detailsForm.controls.issueDate, !!d.noDate);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * The Wiygul enterprise plugin makes the category compulsory on the field
   * itself, not just at submit (bank-ac-check `makeCategoryRequired` L575-582).
   */
  private makeCategoryRequired(): void {
    const plugins = this.localStorageService.getItem('userPlugins') as
      | string[]
      | null;

    const { category } = this.detailsForm.controls;

    if (plugins?.includes(WIYGUL_PLUGIN)) {
      category.setValidators([Validators.required]);
    } else {
      category.clearValidators();
    }
    category.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * The Bills page says whether the user chose to spend the payee's credit; it
   * travels in the router state, not the URL (bill-payment.service L96).
   */
  private payWithVendorCredit(): boolean {
    return !!(window.history.state as { payWithVendorCredit?: boolean } | null)
      ?.payWithVendorCredit;
  }

  private snapshot(): string {
    const core = this.sendStateService.coreForm.getRawValue();
    const d = this.detailsForm.getRawValue();

    return JSON.stringify({
      amount: core.amount,
      payeeId: core.payee?.id ?? null,
      bankId: core.bankAc?.id ?? null,
      issueDate: d.issueDate,
      scheduleDate: d.scheduleDate,
      checkNumber: d.checkNumber,
      categoryId: d.category?.id ?? null,
      memo: d.memo,
      invoiceNumber: d.invoiceNumber,
      payeeIdNumber: d.payeeIdNumber,
      noAmount: d.noAmount,
      noSign: d.noSign,
      noPayee: d.noPayee,
      noDate: d.noDate
    });
  }

  private isUnchanged(): boolean {
    return !!this.editSnapshot && this.editSnapshot === this.snapshot();
  }

  private editedPayment(): IPaymentDetails | null {
    return this.sendStateService.mode() === 'EDIT' ? this.sendStateService.editedPayment() : null;
  }

  /** The word v3 uses for each delivery in the Zil and approval messages. */
  private actionWord(action: CheckAction): string {
    switch (action) {
      case 'mail':
        return 'mailed';
      case 'email':
        return 'emailed';
      case 'printCheck':
      case 'printWhiteCheck':
        return 'printed';
      default:
        return 'processed';
    }
  }

  private deliveryLabel(delivery: CheckDeliveryId): string {
    switch (delivery) {
      case 'mail':
        return 'Check Mail';
      case 'email':
        return 'E-Check';
      case 'ach':
        return 'ACH / Direct Deposit';
      case 'printWhiteCheck':
        return 'White Check Print';
      default:
        return 'Check Print';
    }
  }

  /**
   * A check that cannot be approved for this action. v3 names the action and the
   * account type it *can* do (bank-ac-check `ApprovalCheck` L2168-2194).
   */
  private approvalRequired(type: string): void {
   this.paymentConfirmService.setProcessing(false);
    this.v4AlertService
      .warningAlert({
        content: `This check cannot be ${type}.Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
      })
      .afterClosed()
      .subscribe(() => this.done(SUCCESS_SAVED));
  }

  /** Every path ends here: the bill clears, and the success modal says what happened. */
  private done(mode: 'send' | typeof SUCCESS_SAVED = 'send'): void {
    this.billService.billId.set(undefined);

    if (this.mailEmailType) {
      this.paymentConfirmService.amendSuccessContext({
        emailType: this.mailEmailType
      });
    }

    this.markRecurring(mode);

   this.paymentConfirmService.showSuccess(mode);
  }

  /**
   * What tells the success modal this was a recurring or scheduled payment: it
   * consumes the mark to word its own message and to point "View Payment" at the
   * recurring table's matching sub-tab. Without it a scheduled cheque announced
   * itself as an ordinary payment and sent the user to the wrong list.
   *
   * Only a payment that went out starts a series — a saved draft starts nothing.
   */
  private markRecurring(mode: 'send' | typeof SUCCESS_SAVED): void {
    if (mode !== 'send') {
      return;
    }

    const delivery = this.sendStateService.checkDelivery();
    if (delivery !== 'mail' && delivery !== 'email' && delivery !== 'ach') {
      return;
    }

    // The endpoint's own answer wherever it gave one — a mailed or emailed
    // cheque is scheduled through its modal, which reports back what it did. A
    // deposit has no modal, so its schedule is read off the form.
    const d = this.detailsForm.getRawValue();
    let type = this.mailEmailType;
    if (!type) {
      if (d.needRecurring) {
        type = 'recurring';
      } else if (d.scheduleDate) {
        type = 'scheduled';
      }
    }

    if (!type || type === 'immediate') {
      return;
    }

    this.recurringRedirectService.mark(
      delivery as RecurringDeliveryType,
      type === 'recurring'
    );
  }

  private showError(err: unknown): Observable<boolean | undefined> | null {
   this.paymentConfirmService.setProcessing(false);
    return this.sendPaymentErrorHandlerService.showGenericError(err);
  }

  /**
   * The send failed after the cheque was written, so there are two things to
   * say and they cannot share a screen — a success banner behind a failure
   * alert reads as both at once. The failure goes first; the saved banner takes
   * its place when the user dismisses it.
   */
  private showErrorThenSaved(err: unknown): void {
    this.savedAfter(this.showError(err) ?? this.openAlertClosed());
  }

  /** The saved banner, once the screen is free to show it. */
  private savedAfter(closed: Observable<unknown> | null): void {
    if (!closed) {
      this.done(SUCCESS_SAVED);
      return;
    }
    closed
      .pipe(
        take(1),
        switchMap(() => this.followUpsClosed()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.done(SUCCESS_SAVED));
  }

  /**
   * An alert someone else already put on screen, closing.
   *
   * A 422 with no error code belongs to the interceptor, which opens its own
   * warning from the pipe before our subscriber runs. We show nothing in that
   * case — rightly, it would be the same sentence twice — but the saved banner
   * still has to wait for it, or it paints underneath.
   *
   * Only an alert counts. The confirmation modal is open too and spins until it
   * is told the payment is done, so waiting on that would wait forever.
   */
  private openAlertClosed(): Observable<unknown> | null {
    const alerts = this.matDialog.openDialogs.filter(
      (ref: MatDialogRef<unknown>) =>
        ref.componentInstance instanceof V4WarningAlertComponent ||
        ref.componentInstance instanceof V4FailedAlertComponent
    );
    const alert = alerts[alerts.length - 1];
    return alert ? alert.afterClosed() : null;
  }

  /**
   * The interceptor's alert can have a sequel. "Recharge Now" on the low-credit
   * warning closes it and puts the next step in its place — a "Kindly subscribe"
   * alert for an account without a plan, the recharge modal for one with — and
   * that step can leave the page altogether. A saved banner that followed the
   * first alert straight away opened under the second, since alerts are pinned
   * above every other modal, and the user read both at once.
   *
   * So the banner waits out the whole chain. The interceptor's own handler runs
   * before ours and opens the sequel synchronously; a macrotask makes that hold
   * even if the order changes. Whatever is then open besides the confirmation
   * modal is waited on, and the check repeats in case it had a sequel of its
   * own. A navigation already under way is waited on too: if it lands somewhere
   * else, this service goes with the page and the banner is never shown.
   */
  private followUpsClosed(): Observable<void> {
    return timer(0).pipe(
      switchMap(() => this.navigationSettled()),
      switchMap(() => {
        const followUps = this.matDialog.openDialogs.filter(
          (ref: MatDialogRef<unknown>) =>
            !(ref.componentInstance instanceof ConfirmPaymentModalComponent)
        );
        const followUp = followUps[followUps.length - 1];
        if (!followUp) {
          return of(undefined);
        }
        return followUp.afterClosed().pipe(
          take(1),
          switchMap(() => this.followUpsClosed())
        );
      })
    );
  }

  /** Resolves once no navigation is in flight. */
  private navigationSettled(): Observable<unknown> {
    if (!this.router.getCurrentNavigation()) {
      return of(undefined);
    }
    return this.router.events.pipe(
      filter(
        (event) =>
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped
      ),
      take(1)
    );
  }
}

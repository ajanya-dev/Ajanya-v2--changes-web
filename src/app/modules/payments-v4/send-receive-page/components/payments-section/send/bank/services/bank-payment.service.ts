import {
  computed,
  inject,
  DestroyRef,
  Injectable
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import type { IRemittanceDetails } from 'src/app/models/bank';
import type { ICategoryDropdown } from 'src/app/modules/category/model/category';
import type { IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';
import type {
  IPaymentBody,
  IPaymentDetails,
  IUpdatePaymentBody
} from 'src/app/modules/payments/model/payments';
import {
  PaymentMethod,
  PaymentSource
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

import { AccountVerificationService } from '../../shared/services/account-verification.service';
import {
  PaymentConfirmService,
  SUCCESS_APPROVAL_REQUIRED,
  SUCCESS_SAVED,
  isWalletFallback,
  type IConfirmRequest
} from '../../shared/services/payment-confirm.service';
import type { IFeeRequest } from '../../shared/services/payment-fee.service';
import { applySmsValidators as applySmsRule } from '../../shared/models/payment-validators';
import {
  END_AFTER_COUNT,
  END_UNTIL_CANCELLED,
  tomorrow
} from '../../shared/models/recurring';
import type { ISendSourceService } from '../../shared/models/send-source.model';
import { SendStateService } from '../../shared/services/send-state.service';
import { ExportCheckService } from './export-check.service';
import { LET_VENDOR_DECIDE_ID } from 'src/app/modules/payments/model/pay-as-options';

/**
 * `IPaymentBody.mode` — the rail, not the source (bank-ac-ach L953, wire L839).
 * Vendor-decide rides its own rail, `'10'` (send-payment-submit L1614).
 */
const BANK_MODE: Record<string, string> = {
  ach: '1',
  wire: '6',
  'let-payee-choose': '10'
};

/** `IUpdatePaymentBody.transferType`. */
const BANK_TRANSFER_TYPE: Record<string, string> = {
  'let-payee-choose': LET_VENDOR_DECIDE_ID
};

/** The methods this rail debits the bank for, and the only ones an ACH-approved
 *  bank is asked about. */
const BANK_ACH_DEBIT_METHODS = ['ach', 'let-payee-choose'];

/** The process-payment call opts out of the interceptor and alerts for itself. */
const PROCESS_HEADERS = new HttpHeaders({
  'Content-Type': 'application/json',
  isDisable422: 'true'
});

// The field caps (email 320, invoice 320, payee id 30, memo 100) live on the inputs
// as `maxlength`, not on the controls (bank-ac-ach-v3 html L91, L122, L143, L194).

/**
 * Deliberate deviation: v3 bank-wire hard-codes `paymentDueDate: '2023-08-12'`
 * (bank-acc-wire-v3 L847). That literal is drift — both rails date the payment today.
 */
function today(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bankAccountId(bank: IPayeeViewBank | null): string | undefined {
  return bank?.encrypted_id ?? (bank?.id != null ? String(bank.id) : undefined);
}

function noWhitespace(control: { value: unknown }) {
  const { value } = control;
  if (typeof value !== 'string' || value === '') {
    return null;
  }
  return value.trim().length === 0 ? { hasWhitespace: true } : null;
}

/**
 * A recurrence cannot start in the past, and the field is a plain date input that
 * can be typed into rather than picked (recurring-modal L60-61, L100-102).
 */
function notBeforeTomorrow(control: { value: unknown }) {
  const { value } = control;
  if (typeof value !== 'string' || !value) {
    return null;
  }
  return value < tomorrow() ? { minDate: true } : null;
}

export interface IBankDetailsForm {
  payeeEmail: FormControl<string | null>;
  invoiceNumber: FormControl<string | null>;
  payeeIdNumber: FormControl<string | null>;
  payeeBankAc: FormControl<IPayeeViewBank | null>;
  category: FormControl<ICategoryDropdown | null>;
  memo: FormControl<string | null>;

  // ACH only
  sendSms: FormControl<boolean | null>;
  payeeNumber: FormControl<string | null>;
  needAchRecurring: FormControl<boolean | null>;
  recurringFrequency: FormControl<string | null>;
  recurringStartDate: FormControl<string | null>;
  recurringEndSelect: FormControl<string | null>;
  recurringCount: FormControl<number | null>;
}

/**
 * A bank ACH or wire payment: both rails write a zil-payment and then charge it.
 * A bank *check* does not — it lives in `BankCheckService`.
 * Ported from `bank-ac-ach-v3` and `bank-acc-wire-v3`.
 */
@Injectable()
export class BankPaymentService implements ISendSourceService {
  // ── Dependencies ──
  private readonly paymentsService = inject(PaymentsService);
  private readonly bsbService = inject(PsbService);
  private readonly billService = inject(BillService);
  private readonly recurringRedirectService = inject(RecurringRedirectService);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly v4AlertService = inject(V4AlertService);
  private readonly accountVerificationService = inject(AccountVerificationService);
  private readonly validationService = inject(ValidationService);

  private readonly sendStateService = inject(SendStateService);
  private readonly paymentConfirmService = inject(PaymentConfirmService);
  private readonly exportCheckService = inject(ExportCheckService);

  // ── Form ──
  readonly detailsForm = new FormGroup<IBankDetailsForm>({
    payeeEmail: new FormControl('', [
      Validators.required,
      ValidationService.emailValidator,
      this.validationService.validateDifferentEmail()
    ]),
    invoiceNumber: new FormControl(''),
    payeeIdNumber: new FormControl('', [Validators.maxLength(30)]),
    payeeBankAc: new FormControl<IPayeeViewBank | null>(null),
    category: new FormControl<ICategoryDropdown | null>(null),
    memo: new FormControl(''),

    sendSms: new FormControl(false),
    payeeNumber: new FormControl(''),
    needAchRecurring: new FormControl(false),
    recurringFrequency: new FormControl<string | null>('3'),
    recurringStartDate: new FormControl<string | null>(tomorrow()),
    recurringEndSelect: new FormControl<string | null>(END_UNTIL_CANCELLED),
    recurringCount: new FormControl<number | null>(1)
  });

  // ── Toolbar payload, owned by SendComponent's modals ──
  insertFromRemittance = false;
  remittanceItems: IRemittanceDetails[] = [];
  remittanceType = 1;
  commentIds: string[] = [];
  attachmentIds: string[] = [];
  envelopeAttachmentIds: string[] = [];

  private readonly detailsDefaults = this.detailsForm.getRawValue();

  constructor() {
    const c = this.detailsForm.controls;

    c.needAchRecurring.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyRecurringValidators());

    c.recurringEndSelect.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyRecurringValidators());

    this.sendStateService.coreForm.controls.bankAc.valueChanges
      .pipe(
        distinctUntilChanged((a, b) => a?.id === b?.id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((bank) => {
        if (bank && (this.isAch() || this.isLetPayeeChoose())) {
          if (!this.paymentsService.checkBankCanACHV4(bank)) {
            this.sendStateService.coreForm.controls.bankAc.reset();
          }
        }
      });

    this.sendStateService.coreForm.controls.payAs.valueChanges
      .pipe(
        distinctUntilChanged((a, b) => a?.id === b?.id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((paymentMethod) => {
        const selectedBank = this.sendStateService.coreForm.controls.bankAc.value;
        if (
          selectedBank &&
          BANK_ACH_DEBIT_METHODS.includes(paymentMethod?.id ?? '')
        ) {
          if (!this.paymentsService.checkBankCanACHV4(selectedBank)) {
            this.sendStateService.coreForm.controls.bankAc.reset();
          }
        }
      });

    // A bank check names its method through a delivery tile, so `payAs` stays on
    // `check` and the watcher above skips it by design — nothing there ever sees
    // Direct Deposit arrive. Watching the resolved method closes that: the rule
    // then holds whichever of the two the user picks last.
    toObservable(this.sendStateService.methodId)
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((methodId) => {
        const selectedBank = this.sendStateService.coreForm.controls.bankAc.value;
        if (!selectedBank || methodId !== 'ach') {
          return;
        }
        if (!this.paymentsService.checkBankCanACHV4(selectedBank)) {
          this.sendStateService.coreForm.controls.bankAc.reset();
        }
      });
  }

  get hasRemittance(): boolean {
    return this.remittanceItems.length > 0;
  }

  /**
   * The schedule in the shape the API expects — the object the recurring modal
   * used to close with. Null whenever the toggle is off.
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

  // -------------------------------------------------------------------------
  // ISendSourceService
  // -------------------------------------------------------------------------

  readonly memoConfig = computed(() => {
    const method = this.sendStateService.methodId();
    const required = method === 'wire' || method === 'let-payee-choose';
    return { visible: true, maxLength: required ? 150 : 100 };
  });

  resetDetails(): void {
    this.detailsForm.reset(this.detailsDefaults);
    this.insertFromRemittance = false;
    this.remittanceItems = [];
    this.remittanceType = 1;
    this.commentIds = [];
    this.attachmentIds = [];
    this.exportCheckService.reset();
  }

  /** Bank has no carrier and no card rail, and same-day is not offered here. */
  feeInputs(): Pick<IFeeRequest, 'shippingType' | 'isSameDay' | 'cardMode'> {
    return { isSameDay: false };
  }

  /**
   * `saveBody` reads what the export panel last *saved*, so it has to save first.
   * Only ACH exportCheckService; on a wire the panel is absent and this is a no-op.
   */
  onBeforeSubmit(): Observable<boolean> {
    return this.exportCheckService.saveLineItems();
  }

  patchDetailsFromPayment(details: IPaymentDetails): void {
    const isClone = this.sendStateService.mode() === 'CLONE';

    this.detailsForm.patchValue(
      {
        memo: details.description ?? '',
        invoiceNumber: isClone ? '' : details.referenceNo ?? '',
        category: details.category?.id ? details.category : null
      },
      { emitEvent: false }
    );
  }

  // -------------------------------------------------------------------------
  // Validators per method
  // -------------------------------------------------------------------------

  applyMethodValidators(methodId: string | null): void {
    const c = this.detailsForm.controls;

    const isWire = methodId === 'wire';
    const isMemoRequired = methodId === 'wire' || methodId === 'let-payee-choose';

    c.payeeBankAc.setValidators(isWire ? [Validators.required] : []);
    c.memo.setValidators(isMemoRequired ? [Validators.required, noWhitespace] : []);

    this.applySmsValidators();
    this.applyRecurringValidators();

    Object.values(c).forEach((control) =>
      control.updateValueAndValidity({ emitEvent: false })
    );
    this.detailsForm.updateValueAndValidity({ emitEvent: false });
  }

  applySmsValidators(): void {
    const c = this.detailsForm.controls;
    applySmsRule(
      c.sendSms,
      c.payeeNumber,
      this.isAch(),
      ValidationService.phoneMinLength,
      true
    );
  }

  /**
   * Inline, the form is the only thing between an empty schedule and the API — the
   * modal it replaced refused to close without these.
   */
  applyRecurringValidators(): void {
    const c = this.detailsForm.controls;
    const on = this.isAch() && !!c.needAchRecurring.value;

    c.recurringFrequency.setValidators(on ? [Validators.required] : []);
    c.recurringStartDate.setValidators(
      on ? [Validators.required, notBeforeTomorrow] : []
    );
    c.recurringCount.setValidators(
      on && c.recurringEndSelect.value === END_AFTER_COUNT
        ? [Validators.required, Validators.min(1)]
        : []
    );

    [c.recurringFrequency, c.recurringStartDate, c.recurringCount].forEach(
      (control) => control.updateValueAndValidity({ emitEvent: false })
    );
  }

  // -------------------------------------------------------------------------
  // Entry points
  // -------------------------------------------------------------------------

  save(): void {
    if (!this.validate()) {
      return;
    }

    const editingId =
      this.sendStateService.mode() === 'EDIT' ? this.sendStateService.paymentId() : undefined;
    this.captureSuccessContext();
    this.paymentConfirmService.setProcessing(true);

    const request = editingId
      ? this.paymentsService.updatePayment(editingId, this.saveBody())
      : this.paymentsService.savePayment(this.saveBody());

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (!res.success) {
          this.paymentConfirmService.setProcessing(false);
          return;
        }
        this.afterSuccess();
        this.paymentConfirmService.showSuccess(SUCCESS_SAVED);
      },
      error: (err) => this.handleError(err)
    });
  }

  confirm(): void {
    if (!this.validate()) {
      return;
    }

    // A wire only reaches a bank account cleared to receive one. v3 refuses to
    // call anything and sends the user to fix the bank.
    if (this.isWire() && !this.detailsForm.controls.payeeBankAc.value?.is_allow_wire) {
      this.sendStateService.requestFieldFocus('payeeBankAc');
      return;
    }

    this.captureSuccessContext();

    const editingId =
      this.sendStateService.mode() === 'EDIT' ? this.sendStateService.paymentId() : undefined;

    // An edited payment is written back *before* the confirmation, which then covers
    // the charge alone.
    if (editingId) {
      if (this.sendStateService.isApprovedReadOnly()) {
        this.askAndCharge(editingId);
        return;
      }

      this.paymentConfirmService.setProcessing(true);
      this.paymentsService
        .updatePayment(editingId, this.saveBody())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.paymentConfirmService.setProcessing(false);
            if (!res?.success) {
              return;
            }
            this.askAndCharge(editingId);
          },
          error: (err) => this.handleError(err)
        });
      return;
    }

    // v3 bank-wire shows no confirmation at all, unlike every sibling rail.
    // Treated as drift: a wire is irreversible and gets confirmed like the rest.
    this.paymentConfirmService.ask(this.confirmRequest()).subscribe((confirmed) => {
      if (!confirmed) {
        this.paymentConfirmService.setProcessing(false);
        return;
      }
      this.paymentConfirmService.setProcessing(true);
      this.pay();
    });
  }

  // -------------------------------------------------------------------------
  // Pay
  // -------------------------------------------------------------------------

  private askAndCharge(paymentId: string): void {
    this.paymentConfirmService.ask(this.confirmRequest()).subscribe((confirmed) => {
      if (!confirmed) {
        this.paymentConfirmService.setProcessing(false);
        return;
      }
      this.paymentConfirmService.setProcessing(true);
      this.charge(paymentId);
    });
  }

  /**
   * A new payment is captured in one call. An edited one has already been written
   * back by `confirm()`, and is charged against its own id from there.
   */
  private pay(): void {
    this.bsbService
      .completeTransaction(this.completeBody())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.paid(res?.isApprovalRequired),
        error: (err) => this.handleError(err)
      });
  }

  /** POST /zil-payments/{id}/process-payment — charge a payment that already exists. */
  private charge(paymentId: string): void {
    this.paymentsService
      .processPayment(paymentId, this.processBody(), PROCESS_HEADERS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.paid(),
        error: (err) => this.handleError(err, true)
      });
  }

  // -------------------------------------------------------------------------
  // Guards
  // -------------------------------------------------------------------------

  private validate(): boolean {
    if (this.paymentsService.checkForComplianceFreeze()) {
      this.paymentsService.openComplianceFreezeModal();
      return false;
    }

    const { memo } = this.detailsForm.controls;
    if (typeof memo.value === 'string') {
      memo.setValue(memo.value.trim(), { emitEvent: false });
    }

    // Asked before the form check. A missing payee email also fails the
    // required `payeeEmail` control, so the focus-and-shake branch below won
    // and the user was never told what was missing nor offered to add it.
    if (this.sendStateService.missingPayeeFields().length) {
      this.sendStateService.promptMissingPayeeField();
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

    const gettingStarted = this.localStorageService.getItem(
      'gettingStartedData'
    ) as { verification?: number } | null;

    if (gettingStarted?.verification === 0) {
      this.promptEmailPhoneVerification();
      return false;
    }

    const bank = this.core().bankAc;
    return !bank || this.paymentsService.checkBankCanACHV4(bank);
  }

  private promptEmailPhoneVerification(): void {
    const dialogRef = this.v4AlertService.warningAlert({
      title: 'Verification Required',
      content: 'Please verify your phone number to this payment.',
      doneMsg: 'Verify Now',
      isOk: true,
      isCancel: true
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.accountVerificationService.openEmailPhoneVerificationModal();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Payloads
  // -------------------------------------------------------------------------

  /** POST /zil-payments — the draft body, and the same shape for update. */
  private saveBody(): IUpdatePaymentBody {
    const core = this.core();
    const d = this.detailsForm.getRawValue();
    const method = this.sendStateService.methodId() ?? '';

    return {
      transferType: BANK_TRANSFER_TYPE[method] ?? method,
      amount: Number(core.amount),
      category: d.category?.id,
      description: d.memo ?? '',
      payee: core.payee?.id,
      payeeBankAccount: bankAccountId(d.payeeBankAc),
      paymentDueDate: today(),
      referenceNo: d.invoiceNumber ?? undefined,
      sourceId: core.bankAc?.id,
      sourceType: 'bankaccount',
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      items: this.payloadItems,
      payeeIdNumber: d.payeeIdNumber ?? undefined,
      payeeEmail: d.payeeEmail ?? undefined,
      // NetSuite is the only platform a zil-payment exports to, and only ACH
      ...(this.isAch() && this.exportCheckService.netsuitePaymentKeys()),
      remittanceType: this.remittanceType
    };
  }

  /** POST /payment-methods/complete-transaction — a new payment, charged in one call. */
  private completeBody(): IPaymentBody {
    const core = this.core();
    const d = this.detailsForm.getRawValue();

    const body: IPaymentBody = {
      type: 'bankaccount',
      bankaccountId: core.bankAc?.id,
      amount: core.amount,
      // v3 bank-wire omits the category while bank-ACH sends it. Drift: the
      // payment is categorised either way, so both rails say so.
      category: d.category?.id ?? '',
      payees: [
        {
          id: core.payee?.id,
          amount: core.amount,
          email: d.payeeEmail,
          memo: d.memo,
          bankAccount: bankAccountId(d.payeeBankAc),
          invoiceNumber: d.invoiceNumber,
          payeeIdNumber: d.payeeIdNumber ?? undefined,
          bills: this.billService.billId() ?? []
        }
      ],
      mode: BANK_MODE[this.sendStateService.methodId() ?? ''] ?? '1',
      commentIds: this.commentIds,
      attachmentIds: this.attachmentIds,
      items: this.payloadItems,
      // Always sent, line items or not.
      remittanceType: this.remittanceType,
      // Vendor-decide states it rather than leaving it off .
      ...(this.isLetPayeeChoose() && { isSameDay: 0 })
    };

    // Texting the payee and repeating the payment are both ACH-only ideas.
    if (this.isAch()) {
      body.send_sms = d.sendSms;
      // The number rides along only if it is going to be texted — an SMS costs the
      // user $0.50.
      if (d.sendSms) {
        body.payee_phone = d.payeeNumber;
        body.payees[0].phone = d.payeeNumber;
      }
      body.achRecurring = d.needAchRecurring ? 1 : 0;

      if (d.needAchRecurring && this.recurring) {
        return { ...body, ...this.recurring };
      }
    }

    return body;
  }

  /** POST /zil-payments/{id}/process-payment — charge a payment that already exists. */
  private processBody() {
    const d = this.detailsForm.getRawValue();

    return {
      payee_bank_account_id: bankAccountId(d.payeeBankAc),
      payee_email: d.payeeEmail ?? undefined,
      ...(this.isAch() && {
        achRecurring: d.needAchRecurring ? 1 : 0,
        ...(this.recurring && { recurring: this.recurring.recurring })
      })
    };
  }

  private confirmRequest(): IConfirmRequest {
    const core = this.core();
    const d = this.detailsForm.getRawValue();

    return {
      accNumber: core.bankAc?.accountNumber ?? '',
      bankName: core.bankAc?.nickName ?? '',
      // The payee as the API knows them, not as the dropdown labelled them
      payeeName:
        this.sendStateService.payeeDetails()?.payee_information?.payee_name ??
        core.payee?.name ??
        '',
      paymentMethod: this.methodLabel(),
      amount: Number(core.amount).toFixed(2),
      type: 'bankaccount',
      // Drives the modal's "Processing Time" row. The label stays as `methodLabel`
      // words it — the enum's own wording differs.
      source: PaymentSource.BankAccount,
      method: this.confirmMethod(),
      paymentMethodLabelOverride: this.methodLabel(),
      ...(d.needAchRecurring &&
        this.recurring && { recurringDetails: this.recurring as never }),
      isPayeeBankVerified: !(
        this.paymentsService.isPayeeBankVerificationRequired && d.payeeBankAc?.verified !== 1
      ),
      walletFallback: isWalletFallback(
        this.sendStateService.methodId(),
        d.payeeBankAc
      )
    };
  }

  /** Captured before the request, so a later form reset can't blank the modal. */
  private captureSuccessContext(): void {
    const core = this.core();
    const d = this.detailsForm.getRawValue();

    this.paymentConfirmService.setSuccessContext({
      amount: Number(core.amount).toFixed(2),
      payeeName: core.payee?.name ?? '',
      paymentMethod: this.sendStateService.methodId() ?? '',
      bankName: core.bankAc?.nickName ?? '',
      sourceAccountDisplay: String(core.bankAc?.accountNumber ?? ''),
      ...(d.needAchRecurring && { emailType: 'recurring' as const })
    });
  }

  // -------------------------------------------------------------------------
  // Shared tail
  // -------------------------------------------------------------------------

  private paid(isApprovalRequired?: boolean): void {
    this.afterSuccess();

    // The redirect manages the series just started, so it belongs to a payment that
    // was *made* — a draft starts nothing.
    if (this.detailsForm.controls.needAchRecurring.value) {
      this.recurringRedirectService.mark('ach', true);
    }

    this.paymentConfirmService.showSuccess(
      isApprovalRequired ? SUCCESS_APPROVAL_REQUIRED : 'send'
    );
  }

  private afterSuccess(): void {
    this.billService.billId.set(undefined);

    // A phone number typed here is saved onto the payee, so every list still
    // holding the old one is stale.
    const d = this.detailsForm.getRawValue();
    if (d.sendSms && d.payeeNumber) {
      this.store.dispatch(
        payeesActions.loadPayees({
          searchTerm: '',
          skipEmpty: true,
          isReload: true
        })
      );
    }
  }

  private handleError(err: unknown, force = false): void {
    this.paymentConfirmService.showError(err, { force });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private isAch(): boolean {
    return this.sendStateService.methodId() === 'ach';
  }

  private isWire(): boolean {
    return this.sendStateService.methodId() === 'wire';
  }

  private isLetPayeeChoose(): boolean {
    return this.sendStateService.methodId() === 'let-payee-choose';
  }

  private core() {
    return this.sendStateService.coreForm.getRawValue();
  }

  /**
   * Line items the user typed but did not insert into the payment are not part of
   * it (bank-ac-ach-v3 L968, L1133, L1200).
   */
  private get payloadItems(): IRemittanceDetails[] {
    return this.insertFromRemittance ? this.remittanceItems : [];
  }

  /** What the confirmation modal calls this payment. */
  private methodLabel(): string {
    if (this.isWire()) {
      return 'Wire';
    }
    if (this.isLetPayeeChoose()) {
      return 'Let the vendor decide';
    }
    return 'ACH / Direct Deposit';
  }

  /** The same choice as `methodLabel`, typed — the modal times the payment by it. */
  private confirmMethod(): PaymentMethod {
    if (this.isWire()) {
      return PaymentMethod.Wire;
    }
    if (this.isLetPayeeChoose()) {
      return PaymentMethod.LetPayeeChoose;
    }
    return PaymentMethod.ACH;
  }
}

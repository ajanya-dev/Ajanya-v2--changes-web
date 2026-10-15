import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';
import { IPaymentFeeDetails } from 'src/app/modules/payments/model/payments';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { SendSourceRegistryService } from './send-source-registry.service';
import { SendStateService } from './send-state.service';

const ATTACHMENT_FEE_TITLE = 'Attachment fee';
const SAME_DAY_FEE_TITLE = 'Same day ACH processing fee';
const SAME_DAY_FEATURE_CODE = 'txn-zilpayment-sameday-ach-processing-fee';
const SMS_FEE_TITLE = 'Payee SMS fee';

/** `POST /payments/check-mail` prices a mailed check line by line. */
export interface ICheckMailCost {
  shipping: number;
  paper: number;
  sms: number;
  attachments: number;
  total: number;
}

export interface IFeeState {
  isShow: boolean;
  isLoading: boolean;
  /**
   * A delivery quote is in flight. Distinct from `isLoading`, which means "there
   * is no figure at all yet": a re-quote keeps the previous estimate on hand, and
   * the panel must not go on showing a price that is being recalculated.
   */
  isQuoting: boolean;
  isError: boolean;
  /** a mailed check with no carrier chosen — the fee is not knowable yet */
  isPending: boolean;
  isMailingFeePending: boolean;
  amount: number;
  feeDetails: IPaymentFeeDetails | null;
  /** the mail quote's own breakdown, when this is a bank check being mailed */
  mailQuote: ICheckMailCost | null;
}

const IDLE: IFeeState = {
  isShow: false,
  isLoading: false,
  isQuoting: false,
  isError: false,
  isPending: false,
  isMailingFeePending: false,
  amount: 0,
  feeDetails: null,
  mailQuote: null
};

export interface IFeeRequest {
  sourceId: string;
  methodId: string;
  amount: number;
  /** mailed checks: a `carrier_code`, e.g. `USPS_FIRST_CLASS_MAIL` */
  shippingType?: string;
  /** Same-day ACH is billed a separate processing fee; the caller states it. */
  isSameDay?: boolean;
  /** card payments only — the transaction mode number */
  cardMode?: number;
}

/**
 * Which fee endpoint a payment uses. `none` = the one flow that is never quoted a
 * fee at all: `wallet:virtual-card`. A wallet check printed here is priced like the
 * bank-account one, on the `txn-check-print` feature code.
 */
function endpointFor(
  sourceId: string,
  methodId: string
): 'none' | 'zero' | 'card' | 'cloud' | 'psb' {
  if (sourceId === 'wallet' && methodId === 'international-payment') {
    return 'zero';
  }
  if (sourceId === 'wallet' && methodId === 'virtual-card') {
    return 'none';
  }
  // The fee follows the rail, and let-the-vendor-decide has no rail yet — so there
  // is nothing to price, on any source, until the vendor chooses.
  if (methodId === 'let-payee-choose') {
    return 'zero';
  }
  if (sourceId === 'card') {
    return 'card';
  }
  if (sourceId === 'cloud') {
    return 'cloud';
  }
  return 'psb';
}

/** `getTransactionFeatureCode` expects `bank`, not `bankaccount`. */
function feeSourceName(sourceId: string): string {
  return sourceId === 'bankaccount' ? 'bank' : sourceId;
}

/** ...and the delivery words, not the `check_*` method ids. */
function feeMethodName(methodId: string): string {
  switch (methodId) {
    case 'same-ach':
      return 'ach';
    case 'check':
    case 'check_mail':
      return 'mail';
    case 'check_email':
      return 'email';
    case 'check_print':
      return 'print';
    case 'virtual-card':
      return 'card';
    case 'international-payment':
      return 'international';
    default:
      return methodId;
  }
}

const QUOTES_MAILED_CHECK_WITHOUT_CARRIER = ['bankaccount', 'card'];

/**
 * The card endpoint titles its extra lines (`cardAchFee`), the PSB one returns the
 * SMS fee bare — so read either shape rather than bet on which one landed.
 */
function smsFeeLine(
  raw: number | string | { title?: string; fee?: number | string } | undefined
): IPaymentFeeDetails['smsFee'] {
  const isLine = !!raw && typeof raw === 'object';
  const fee = Number(isLine ? raw.fee : raw) || 0;
  if (fee <= 0) {
    return undefined;
  }
  return { title: (isLine && raw.title) || SMS_FEE_TITLE, fee };
}

function cloudTransferType(methodId: string): string {
  if (methodId === 'domestic') {
    return 'wire';
  }
  if (methodId === 'international') {
    return 'internationalWire';
  }
  return 'ach';
}

/** All fee calculation for the Send page, in one place. */
@Injectable()
export class PaymentFeeService {
  private payments = inject(PaymentsService);
  private psb = inject(PsbService);
  private sendState = inject(SendStateService);
  private sources = inject(SendSourceRegistryService);

  /**
   * Recompute from whatever is currently selected: the inputs live on the state
   * service and the active source, so callers just say "something changed".
   */
  recompute(): void {
    const sourceId = this.sendState.sourceId();
    const methodId = this.sendState.methodId();

    this.syncAttachmentBilling();

    if (!sourceId || !methodId) {
      this.reset();
      return;
    }

    this.compute({
      sourceId,
      methodId,
      amount: Number(this.sendState.coreForm.controls.amount.value),
      // The carrier, the same-day flag and the card rail's mode are the active
      // source's to state — they don't all exist on every source.
      ...this.sources.active().feeInputs()
    });
  }

  /** cancels an in-flight request when a newer one arrives */
  private cancel$ = new Subject<void>();

  readonly state = signal<IFeeState>(IDLE);

  /**
   * The payment's attachments and what they cost. Public because the mailed
   * check prices them itself — its quote takes the ids, and its estimate the fee.
   */
  readonly attachmentIds = signal<string[]>([]);
  readonly attachmentFee = signal(0);

  /**
   * The attachment fee is fetched on its own, after the service fee has already been
   * quoted, so its row skeletons on its own too.
   */
  readonly attachmentFeeLoading = signal(false);

  /**
   * The fee as the endpoint returned it, before `withAttachment` layers the
   * attachment fee on — so that fee can change without re-requesting the service fee.
   */
  private baseDetails: IPaymentFeeDetails | null = null;

  /** Whether the quote in flight / on screen was made without a carrier. */
  private mailingFeePending = false;

  private compute(request: IFeeRequest): void {
    this.cancel$.next();

    // Only a mailed check is priced per carrier, and the carrier form control keeps
    // its value across method switches — so drop it here rather than trust the caller.
    const isCheckMail = request.methodId === 'check_mail';
    const req: IFeeRequest = {
      ...request,
      shippingType: isCheckMail ? request.shippingType : undefined
    };

    // A mailed bank check is priced by `CheckMailService`'s quote — the only
    // figure that accounts for carrier, paper, SMS and attachment pages together.
    // An emailed one is priced by `CheckEmailService`, where the payee text is
    // the single billable line. Each owns this panel while its method is
    // selected; touching it here would wipe a figure that has already landed.
    // Direct deposit joins them: `cost.ach` is a real transaction fee that moves
    // with the amount, and `CheckDirectDepositService` quotes it.
    const isCheckEmail = request.methodId === 'check_email';
    const isCheckDeposit = request.methodId === 'ach';
    if (
      this.sources.isBankCheck() &&
      (isCheckMail || isCheckEmail || isCheckDeposit)
    ) {
      return;
    }

    const endpoint =
      this.sources.isBankCheck() && req.methodId !== 'check_print'
        ? 'zero'
        : endpointFor(req.sourceId, req.methodId);

    if (endpoint === 'none' || !req.amount || req.amount <= 0) {
      this.clear();
      return;
    }

    // Quoted here, not by an endpoint: international is priced into its exchange rate,
    // vendor-decide has no rail to price yet, and a bank check's non-print deliveries
    // are priced by the delivery modal.
    if (endpoint === 'zero') {
      this.mailingFeePending = false;
      this.publish(this.breakdown(req.amount, 0));
      return;
    }

    // No carrier, no fee to quote — except on the sources that can price a mailed
    // check without one.
    if (
      isCheckMail &&
      !QUOTES_MAILED_CHECK_WITHOUT_CARRIER.includes(req.sourceId) &&
      !req.shippingType
    ) {
      this.baseDetails = null;
      this.mailingFeePending = false;
      this.state.set({
        ...IDLE,
        isShow: true,
        isPending: true,
        amount: req.amount
      });
      return;
    }

    // Quoted, but the carrier has not been picked, so the mailing portion of this
    // quote is not the final one — the panel says so instead of printing a figure.
    this.mailingFeePending = isCheckMail && !req.shippingType;

    this.state.update((s) => ({
      ...s,
      isShow: true,
      isLoading: true,
      isError: false,
      isPending: false,
      isMailingFeePending: this.mailingFeePending,
      amount: req.amount
    }));

    this.request(endpoint, req)
      .pipe(
        takeUntil(this.cancel$),
        finalize(() => this.state.update((s) => ({ ...s, isLoading: false })))
      )
      .subscribe({
        next: (feeDetails) => this.publish(feeDetails),
        error: () => {
          this.baseDetails = null;
          this.state.update((s) => ({ ...s, isError: true, feeDetails: null }));
        }
      });
  }

  /**
   * The mailed bank check's price, straight from the quote. `null` with no load in
   * flight is the honest pending state — the carrier has not been chosen yet.
   */
  setMailQuote(
    cost: ICheckMailCost | null,
    loading = false,
    quoting = loading
  ): void {
    // A service-fee request still in flight belongs to another method now.
    this.cancel$.next();
    this.baseDetails = null;

    const amount = Number(this.sendState.coreForm.controls.amount.value) || 0;

    this.state.set({
      isShow: true,
      isLoading: loading,
      isQuoting: quoting,
      isError: false,
      isPending: !cost && !loading,
      isMailingFeePending: false,
      amount,
      mailQuote: cost,
      // The confirmation modal reads this shape. `additionalFee` stays empty: it
      // adds that line on top of `totalAmount`, and the quote's total already
      // has the postage in it.
      feeDetails: cost
        ? {
            originalAmount: amount.toFixed(2),
            serviceFee: Number(cost.total || 0).toFixed(2),
            serviceFeeWithoutAdditionalFee: Number(cost.total || 0).toFixed(2),
            additionalFee: '',
            totalAmount: amount + Number(cost.total || 0)
          }
        : null
    });
  }

  /**
   * Attachments cost something only where they are printed and enclosed, or
   * carried by the e-cheque the payee is emailed. Vendor-decide, ACH, wire and a
   * virtual card send them as files on an email, and there is nothing to bill:
   * pricing them there put an Attachment fee on a payment that never mails one.
   *
   * `check_mail` covers all three rails — a bank cheque on the Mail tile takes
   * that method id too.
   */
  private billsAttachments(): boolean {
    const method = this.sendState.methodId();
    return method === 'check_mail' || method === 'check_email';
  }

  /** Attachments are billable on mailed checks; an empty list clears the fee. */
  setAttachmentIds(ids: string[]): void {
    this.attachmentIds.set(ids ?? []);

    if (!ids?.length || !this.billsAttachments()) {
      this.attachmentFeeLoading.set(false);
      this.attachmentFee.set(0);
      this.refreshTotals();
      return;
    }

    this.attachmentFeeLoading.set(true);
    this.payments
      .getAttachmentFee(ids)
      .pipe(finalize(() => this.attachmentFeeLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.attachmentFee.set(res?.success ? res.data.total_attachment_fee || 0 : 0);
          this.refreshTotals();
        },
        error: () => {
          this.attachmentFee.set(0);
          this.refreshTotals();
        }
      });
  }

  /**
   * Fetch or drop the attachment fee when the method crosses the mailing line.
   * Only on the transition: `recompute` also runs on every amount keystroke, and
   * the fee does not move with the amount.
   */
  private billedAttachments = false;

  private syncAttachmentBilling(): void {
    const bills = this.billsAttachments();
    if (bills === this.billedAttachments) {
      return;
    }
    this.billedAttachments = bills;
    this.setAttachmentIds(this.attachmentIds());
  }

  reset(): void {
    this.cancel$.next();
    this.attachmentFeeLoading.set(false);
    this.attachmentFee.set(0);
    this.clear();
  }

  // -------------------------------------------------------------------------

  private clear(): void {
    this.baseDetails = null;
    this.mailingFeePending = false;
    this.state.set(IDLE);
  }

  /** Store the endpoint's breakdown and render it with the attachment fee on top. */
  private publish(details: IPaymentFeeDetails): void {
    this.baseDetails = details;
    this.state.set({
      isShow: true,
      isLoading: false,
      isQuoting: false,
      isError: false,
      isPending: false,
      isMailingFeePending: this.mailingFeePending,
      amount: Number(details.originalAmount),
      mailQuote: null,
      feeDetails: this.withAttachment(details)
    });
  }

  private request(
    endpoint: 'card' | 'cloud' | 'psb',
    req: IFeeRequest
  ): Observable<IPaymentFeeDetails> {
    if (endpoint === 'card') {
      return this.cardFee(req);
    }
    if (endpoint === 'cloud') {
      return this.cloudFee(req);
    }
    return this.psbFee(req);
  }

  /**
   * The card endpoint returns a complete breakdown; nothing is derived locally —
   * `totalAmount` already carries the SMS fee it quoted, so the line is only
   * reshaped, never added on top.
   */
  private cardFee(req: IFeeRequest): Observable<IPaymentFeeDetails> {
    const sendSms = this.sendState.notifySmsEnabled();
    return this.payments
      .calculatePaymentFee({
        mode: req.cardMode ?? 0,
        amount: req.amount,
        shippingType: req.shippingType ?? undefined,
        isSameDay: !!req.isSameDay,
        sendSms
      })
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error('fee-request-failed');
          }
          // With no carrier confirmed, the backend still prices `totalAmount`
          // and `cardAchFee` off a guessed carrier — trim that guess back out
          // so the total doesn't say more than the "Mailing fee" row does.
          const unresolvedCarrierFee = this.mailingFeePending
            ? Number(res.data.cardAchFee?.fee) || 0
            : 0;
          return {
            ...res.data,
            originalAmount: Number(res.data.originalAmount).toFixed(2),
            serviceFeeWithoutAdditionalFee: Number(
              res.data.serviceFeeWithoutAdditionalFee
            ).toFixed(2),
            additionalFee: Number(res.data.additionalFee).toFixed(2),
            smsFee: sendSms ? smsFeeLine(res.data.smsFee) : undefined,
            totalAmount: Number(res.data.totalAmount) - unresolvedCarrierFee
          };
        })
      );
  }

  private cloudFee(req: IFeeRequest): Observable<IPaymentFeeDetails> {
    const transferType = cloudTransferType(req.methodId);
    return this.psb.getCloudBankTransactionFee(transferType).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error('fee-request-failed');
        }
        return this.breakdown(req.amount, Number(res.data.fees));
      })
    );
  }

  private psbFee(req: IFeeRequest): Observable<IPaymentFeeDetails> {
    const featureCode = this.payments.getTransactionFeatureCode(
      feeSourceName(req.sourceId),
      feeMethodName(req.methodId)
    );
    // Texting the payee is priced with the payment, so the endpoint has to be
    // told the notify modal switched it on. The state signal is the one source
    // of truth for it — every rail's `send_sms` control mirrors this.
    const sendSms = this.sendState.notifySmsEnabled();
    return this.psb
      .getTransactionFee({
        featureCode,
        transactionAmount: req.amount,
        shipping_type: req.shippingType ?? undefined,
        send_sms: sendSms ? 1 : 0,
        ...(req.isSameDay && { samedayFeatureCode: SAME_DAY_FEATURE_CODE })
      })
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error('fee-request-failed');
          }
          const sameDayFee = res.samedayFee ? Number(res.samedayFee) : 0;
          const smsFee = sendSms ? Number(res.smsFee) || 0 : 0;
          return this.breakdown(
            req.amount,
            Number(res.data),
            sameDayFee,
            smsFee
          );
        })
      );
  }

  /**
   * Shared shape for the two endpoints that return a bare service fee. The same-day
   * and SMS fees are charged on top, so they belong in the total.
   */
  private breakdown(
    amount: number,
    serviceFee: number,
    sameDayFee = 0,
    smsFee = 0
  ): IPaymentFeeDetails {
    return {
      originalAmount: amount.toFixed(2),
      serviceFeeWithoutAdditionalFee: serviceFee.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      additionalFee: '',
      totalAmount: amount + serviceFee + sameDayFee + smsFee,
      ...(sameDayFee > 0 && {
        sameDayFee: { title: SAME_DAY_FEE_TITLE, fee: sameDayFee }
      }),
      ...(smsFee > 0 && {
        smsFee: { title: SMS_FEE_TITLE, fee: smsFee }
      })
    };
  }

  private withAttachment(details: IPaymentFeeDetails): IPaymentFeeDetails {
    const fee = this.attachmentFee();
    if (fee <= 0 || !this.billsAttachments()) {
      return { ...details, attachmentFee: undefined };
    }
    return {
      ...details,
      attachmentFee: { fee, title: ATTACHMENT_FEE_TITLE },
      totalAmount: Number(details.totalAmount) + fee
    };
  }

  /** Re-total after the attachment fee changed, without re-requesting the service fee. */
  private refreshTotals(): void {
    if (!this.baseDetails) {
      return;
    }
    const feeDetails = this.withAttachment(this.baseDetails);
    this.state.update((s) => ({ ...s, feeDetails }));
  }
}

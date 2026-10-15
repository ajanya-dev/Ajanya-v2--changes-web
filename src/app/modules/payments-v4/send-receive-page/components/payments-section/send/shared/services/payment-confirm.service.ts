import { Injectable, Injector, inject, signal, type Signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { filter, finalize, take, takeUntil } from 'rxjs/operators';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { IRecurringDetails } from 'src/app/modules/payments/model/payments';
import {
  PaymentMethod,
  PaymentSource
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import type {
  IPaymentSuccessV4Data,
  PaymentSuccessResult
} from 'src/app/modules/payments-v4/shared/modals/payment-success-modal-v4/payment-success-modal-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { SendPaymentTypeConfig } from 'src/app/modules/payments-v4/send-payment/models/payment-type-config';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ConfirmPaymentModalComponent } from '../../confirm-modal/confirm-payment-modal.component';
import { SendStateService } from './send-state.service';
import { PaymentFeeService } from './payment-fee.service';

/** How `POST /checks/preview` names the account the cheque is drawn on. */
export type CheckPreviewSourceType = 'bankaccount' | 'wallet' | 'card';

/** The payee fields the drawn cheque reads. A subset of `payee_information`. */
export interface IPreviewPayee {
  payee_nick_name?: string;
  payee_name?: string;
  payee_address_line_1?: string;
  payee_address_line_2?: string;
  payee_city?: string;
  payee_state?: string;
  payee_zip?: string;
}

export interface ICheckPreviewInput {
  sourceType: CheckPreviewSourceType;
  sourceId?: string | null;
  payeeId?: string | null;
  amount?: number;
  /** `yyyy-mm-dd`. */
  issueDate?: string | null;
  serialNo?: string | null;
  memo?: string | null;
  processWithout?: string[];
}

/**
 * The body `POST /checks/preview` takes. The source is named rather than assumed
 * to be a bank account, which is what lets a card and a wallet draw their own
 * cheque instead of a blank one.
 *
 * Anything the form has not got is left out rather than sent empty — a card and
 * a wallet carry no serial number or issue date of their own, and the endpoint
 * fills in its own.
 *
 * Returns nothing until it can be answered. The source and the payee are both
 * required, on every rail: a cheque is drawn on an account and made out to
 * someone, and asking without either is a call that can only fail. The one
 * exception is a cheque deliberately written without a payee, which says so in
 * `process_without` and is the endpoint's to accept.
 */
export function buildCheckPreviewPayload(
  input: ICheckPreviewInput
): Record<string, unknown> | undefined {
  const withoutPayee = !!input.processWithout?.includes('payee');

  if (!input.sourceId || (!input.payeeId && !withoutPayee)) {
    return undefined;
  }

  return {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    ...(input.payeeId ? { payee_id: input.payeeId } : {}),
    ...(input.amount ? { amount: input.amount } : {}),
    ...(input.issueDate ? { issue_date: input.issueDate } : {}),
    ...(input.serialNo ? { serial_no: input.serialNo } : {}),
    ...(input.memo ? { memo: input.memo } : {}),
    process_without: input.processWithout ?? []
  };
}

/**
 * What the preview prints, read off the forms rather than off a fetch — only
 * the design behind them has to be asked for.
 */
export function buildCheckPreviewValues(input: {
  payee?: IPreviewPayee | null;
  payeeName?: string;
  amount?: string | number;
  memo?: string;
  serialNo?: string;
  issueDate?: string;
}): Record<string, unknown> {
  const info = input.payee;
  const address = [
    info?.payee_address_line_1,
    info?.payee_city,
    info?.payee_state,
    info?.payee_zip
  ]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(', ');

  return {
    chequeSerialNumber: input.serialNo ?? '',
    chequeIssueDate: input.issueDate ?? '',
    chequeAmount: String(input.amount ?? ''),
    chequeMemo: input.memo ?? '',
    address,
    payeeName:
      info?.payee_nick_name || info?.payee_name || input.payeeName || '',
    payeeAddressLine1: info?.payee_address_line_1 ?? '',
    payeeZip: info?.payee_zip ?? '',
    bankName: '',
    amounyInWords: ''
  };
}

/** `POST /checks/preview` — only the design is read from it here. */
interface ICheckPreviewResponse {
  data?: { design?: { checkDesign?: unknown } };
}

function designJson(res: ICheckPreviewResponse | null): string | null {
  const design = res?.data?.design?.checkDesign;
  if (!design) {
    return null;
  }
  return typeof design === 'string' ? design : JSON.stringify(design);
}

/** What the confirmation modal shows. Only `paymentMethod` and `type` differ by source. */
export interface IConfirmRequest {
  accNumber: string | number;
  /** Filled in by `ask()` from the selected payee — no rail needs to pass it. */
  payeeEmail?: string;
  bankName: string;
  payeeName: string;
  paymentMethod: string;
  amount: number | string;
  type?: string;
  shippingType?: string;
  recurringDetails?: IRecurringDetails;
  isPayeeBankVerified?: boolean;
  /**
   * The check preview, for a check method. `checkPreviewData` is the values —
   * the caller already holds them — and `checkPreviewPayload` fetches the design
   * they are drawn on. Without both the modal renders an empty default template,
   * which is what it did for as long as nobody passed either.
   */
  checkPreviewData?: unknown;
  checkPreviewPayload?: Record<string, unknown>;
  /**
   * The modal looks up "Processing Time" from the typed source+method pair — a
   * label alone tells it nothing, so omitting these hides the row entirely.
   */
  source?: PaymentSource;
  method?: PaymentMethod;
  /** Wins over the source+method lookup (e.g. Bank+Check sub-delivery methods). */
  processingTimeOverride?: string;
  /** Keeps the displayed method label as this module words it, not as the enum does. */
  paymentMethodLabelOverride?: string;
  /** The payee has no bank account, so the money lands in their wallet instead. */
  walletFallback?: boolean;
}

/**
 * The ACH rails accept a payee with no bank account on file — only a wire
 * insists on one. The payment still goes through; the money is credited to the
 * payee's wallet for them to withdraw, and the modal has to say so.
 */
export function isWalletFallback(
  methodId: string | null | undefined,
  payeeBank: unknown
): boolean {
  return (methodId === 'ach' || methodId === 'same-ach') && !payeeBank;
}

/**
 * What the success modal shows beyond the outcome itself. The source service
 * supplies it, because only it knows the payee, method and amount.
 */
export type ISuccessContext = Omit<IPaymentSuccessV4Data, 'mode'>;

/**
 * The two non-`send` outcomes, as `PaymentSuccessModalV4Component` names them. A saved
 * draft and an updated one share a screen — the modal's `mode` union has no `'updated'`.
 */
export const SUCCESS_SAVED: IPaymentSuccessV4Data['mode'] = 'saved';
export const SUCCESS_APPROVAL_REQUIRED: IPaymentSuccessV4Data['mode'] =
  'approval_required';

/**
 * The confirmation modal and the success screen, shared by the bank, wallet and card
 * services. A helper those services CALL — it never calls back into them.
 */
@Injectable()
export class PaymentConfirmService {
  private dialog = inject(MatDialog);
  private sendState = inject(SendStateService);
  private injector = inject(Injector);
  private payments = inject(PaymentsService);
  private paymentsV4 = inject(PaymentsV4Service);
  private alert = inject(V4AlertService);
  private checks = inject(CheckService);

  /**
   * Emits once the success modal closes. `'new'` means the user asked to start
   * another payment; SendComponent resets the form on it.
   */
  readonly successClosed = new Subject<PaymentSuccessResult>();

  /**
   * A source asking for the form to be thrown away with no payment made: its state
   * is stale, so re-submitting would fail the same way.
   */
  readonly resetRequested = new Subject<void>();

  /** True while a request is in flight — disables the action bar. */
  readonly processing = signal(false);

  readonly charging = signal(false);

  /** The context of the payment being submitted, for the success modal. */
  private context: ISuccessContext = { amount: 0 };

  /**
   * The last confirm request, kept so the success modal can reuse the same
   * "Processing Time" derivation and method label the confirmation modal used.
   */
  private lastRequest?: IConfirmRequest;

  /** The open confirmation modal, if any. It stays open while the payment runs. */
  private confirmRef?: MatDialogRef<ConfirmPaymentModalComponent, boolean>;

  setSuccessContext(context: ISuccessContext): void {
    this.context = context;
  }

  /**
   * Adds to what was captured at submit rather than gathering it again. What
   * the payment was is only reliable while the form still holds it, and by the
   * time the send answers the page may have moved on.
   */
  amendSuccessContext(patch: Partial<ISuccessContext>): void {
    this.context = { ...this.context, ...patch };
  }

  /**
   * Open the confirmation modal; emits true on confirm. In `send` mode the modal does
   * not close itself — it spins until `dismiss()`.
   */
  /**
   * The check design the confirmation preview draws on. Signals rather than
   * plain values: the dialog is opened at once and the design lands after it.
   */
  private readonly checkPreviewTemplate = signal<string | null>(null);
  private readonly checkPreviewLoading = signal(false);

  private loadCheckPreview(payload: Record<string, unknown> | undefined): void {
    this.checkPreviewTemplate.set(null);
    if (!payload) {
      this.checkPreviewLoading.set(false);
      return;
    }

    this.checkPreviewLoading.set(true);
    this.checks
      .getCheckPreviewData(payload)
      .pipe(finalize(() => this.checkPreviewLoading.set(false)))
      .subscribe({
        next: (res: ICheckPreviewResponse | null) =>
          this.checkPreviewTemplate.set(designJson(res)),
        error: () => this.checkPreviewTemplate.set(null)
      });
  }

  ask(request: IConfirmRequest): Observable<boolean> {
    this.lastRequest = request;
    this.charging.set(false);
    this.loadCheckPreview(request.checkPreviewPayload);

    const ref = this.dialog.open<
      ConfirmPaymentModalComponent,
      IConfirmRequest & {
        mode: 'send';
        checkPreviewTemplateSignal: Signal<string | null>;
        checkPreviewLoadingSignal: Signal<boolean>;
      },
      boolean
    >(ConfirmPaymentModalComponent, {
      width: '560px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        ...request,
        payeeEmail:
          request.payeeEmail ??
          this.sendState.payeeDetails()?.payee_information?.payee_email ??
          undefined,
        ...this.feeLines(request.amount),
        checkPreviewTemplateSignal: this.checkPreviewTemplate,
        checkPreviewLoadingSignal: this.checkPreviewLoading,
        mode: 'send'
      }
    });
    this.confirmRef = ref;

    const answer = new Subject<boolean>();
    let settled = false;
    const settle = (confirmed: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      answer.next(confirmed);
      answer.complete();
    };

    const confirmSub = ref.componentInstance.confirmed.subscribe(() => {
      this.charging.set(true);
      // A payment that opens its own dialog — an OTP challenge, or the success
      // modal — must not leave the spinner stranded behind it.
      this.dialog.afterOpened
        .pipe(
          filter((opened) => opened.id !== ref.id),
          take(1),
          takeUntil(ref.afterClosed())
        )
        .subscribe(() => ref.close());
      settle(true);
    });

    // Cancel, the X, or Escape. Also the cleanup path once the payment finishes.
    ref.afterClosed().subscribe((confirmed) => {
      confirmSub.unsubscribe();
      if (this.confirmRef === ref) {
        this.confirmRef = undefined;
      }
      settle(!!confirmed);
    });

    return answer.asObservable();
  }

  /**
   * The fee lines the modal renders. Its markup has always been there; nothing
   * filled it, so the rows never showed. Mirrors the reference: the service fee
   * without the carrier's share, the carrier as its own line, and a total that
   * adds the two.
   */
  /**
   * What the fee row is called. Mailing has its own charge and its own row; the
   * rest is the service fee, which is what the panel calls it too.
   */
  private serviceFeeLabel(): string {
    return 'Service fee';
  }

  grandTotal(amount: number | string): number {
    return this.feeLines(amount).total;
  }

  private feeLines(amount: number | string): {
    serviceFeeDisplay?: string;
    serviceFeeLabel: string;
    mailingCost: number;
    mailingCostLabel: string;
    total: number;
  } {
    const feeState = this.injector.get(PaymentFeeService).state();
    const fee = feeState.feeDetails;

    // The quote the fee was computed for. International can change the amount
    // from the limit card without refetching, which left the modal showing a
    // total from the previous amount — $60,000 against a $100 payment.
    const quotedFor = Number(feeState.amount);
    const asked = Number(amount) || 0;
    const feeIsCurrent = !!fee && (!quotedFor || quotedFor === asked);

    // A mailed bank check is priced by its own quote, and every line of it is
    // postage — carrier, paper, payee SMS, enclosed pages. It belongs under
    // "Mailing fee"; billing it as the service fee named the wrong charge. The
    // other two deliveries share the quote channel but are not postage.
    const quote =
      this.sendState.methodId() === 'check_mail' ? feeState.mailQuote : null;
    if (quote) {
      const mailed = Number(quote.total) || 0;
      // No service-fee row at all: every line of this quote is postage and it
      // is already on the mailing row. Saying "Service fee — Free" beside it
      // names a second charge that does not exist.
      return {
        serviceFeeLabel: this.serviceFeeLabel(),
        mailingCost: mailed,
        mailingCostLabel: 'Mailing fee',
        total: asked + mailed
      };
    }

    // The three fee fields are one sum split up, not three charges:
    // `serviceFeeWithoutAdditionalFee` + `additionalFee` is the service fee, and
    // `totalAmount` is the amount plus that. So the two rows below are a
    // breakdown of the total, and adding either back on top charged it twice —
    // which is what a card ACH, wire or mailed cheque, the methods that carry an
    // `additionalFee` at all, were showing.
    const mailingCost = feeIsCurrent ? Number(fee?.additionalFee) || 0 : 0;
    const serviceFee = feeIsCurrent
      ? Number(fee?.serviceFeeWithoutAdditionalFee ?? 0)
      : 0;
    const total = feeIsCurrent ? Number(fee?.totalAmount ?? asked) || 0 : asked;

    return {
      serviceFeeLabel: this.serviceFeeLabel(),
      serviceFeeDisplay: feeIsCurrent
        ? serviceFee > 0
          ? `$${serviceFee.toFixed(2)}`
          : 'Free'
        : undefined,
      mailingCost,
      // `additionalFee` is postage only where the payment is posted. On a card
      // ACH or wire it is that rail's own charge, and the endpoint names it —
      // the panel renders that name, so the modal reads it from the same place
      // rather than calling every extra charge a mailing fee.
      mailingCostLabel:
        this.sendState.methodId() === 'check_mail'
          ? 'Mailing fee'
          : fee?.cardAchFee?.title || fee?.sameDayFee?.title || 'Mailing fee',
      total
    };
  }

  /** Close the confirmation modal, if it is still up behind its spinner. */
  dismiss(): void {
    this.confirmRef?.close();
    this.confirmRef = undefined;
  }

  /**
   * `mode` is the outcome: a completed payment is `'send'`, everything else
   * names itself.
   */
  showSuccess(mode: IPaymentSuccessV4Data['mode'] = 'send'): void {
    this.setProcessing(false);
    this.dismiss();
    this.paymentsV4
      .openPaymentSuccessModal({ ...this.successContextFor(mode), mode })
      .afterClosed()
      .subscribe((result) => this.successClosed.next(result ?? 'done'));
  }

  /**
   * Only the completed-payment ("send") summary shows Processing Time and the method
   * label. The confirm request already carries what the confirmation modal derived
   * them from, so reuse it rather than let the success modal show a blank row.
   */
  private successContextFor(mode: IPaymentSuccessV4Data['mode']): ISuccessContext {
    const request = this.lastRequest;
    if (mode !== 'send' || !request) {
      return this.context;
    }

    return {
      ...this.context,
      processingTime:
        this.context.processingTime ??
        SendPaymentTypeConfig.resolveProcessingTime({
          source: request.source,
          method: request.method,
          processingTimeOverride: request.processingTimeOverride,
          shippingType: request.shippingType
        }),
      paymentMethodLabelOverride:
        this.context.paymentMethodLabelOverride ??
        request.paymentMethodLabelOverride
    };
  }

  setProcessing(active: boolean): void {
    this.processing.set(active);
    this.payments.isPaymentProcessingSubject.next(active);
    // A finished payment leaves nothing for the confirmation modal to wait on.
    if (!active) {
      this.charging.set(false);
      this.dismiss();
    }
  }

  /**
   * Alerts only what the interceptor does not — it covers all but a 422 with an
   * `errorCode`. `force` is for callers that suppress the interceptor's 422 handling.
   */
  showError(err: unknown, options: { force?: boolean } = {}): void {
    this.setProcessing(false);

    const failure = err as {
      status?: number;
      error?: { errorCode?: number | string; errorMsg?: string };
    };

    // No status means this is not an HTTP failure at all — it is a rail refusing
    // the payment in its own words, and nothing else will say so.
    const isHttp = typeof failure?.status === 'number';
    const alreadyAlerted =
      isHttp &&
      !options.force &&
      !(failure.status === 422 && !!failure.error?.errorCode);

    if (alreadyAlerted) {
      return;
    }

    this.alert.failedAlert({
      content: failure?.error?.errorMsg ?? 'Something went wrong!'
    });
  }
}

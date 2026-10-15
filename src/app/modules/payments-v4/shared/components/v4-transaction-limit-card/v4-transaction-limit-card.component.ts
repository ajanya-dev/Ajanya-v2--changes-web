import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil
} from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IWalletInternationaPaymentCreate } from 'src/app/models/wallet';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * V4-styled transaction limit card for the international payment flow.
 * Same public API as the V3 TransactionLimitCardComponent, rendered with V4 tokens.
 * Runs the limit check and handles the 305 (proceed prompt) and 312 (inline message)
 * error codes for both business and personal recipients.
 */
@Component({
  selector: 'app-v4-transaction-limit-card',
  standalone: true,
  templateUrl: './v4-transaction-limit-card.component.html',
  imports: [FormsModule, NgxMaskDirective, CommonButtonV4Component],
  providers: [provideNgxMask()],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4TransactionLimitCardComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private el = inject(ElementRef<HTMLElement>);

  constructor() {
    // Scroll the card into view when a limit message or the edit panel appears.
    effect(() => {
      const shouldScroll = !!this.transactionLimitMessage() || this.showEditAmount();
      if (shouldScroll) {
        // Wait for the message/panel to render before scrolling to it.
        setTimeout(() => {
          this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    });
  }

  quoteId = input<string | null>(null);
  payeeId = input<string | null>(null);
  countryCode = input<string | null>(null);
  payoutCurrencyCode = input<string | null>(null);
  type = input<string | null>(null);
  paymentMemo = input<string>('');
  receivingCurrency = input<string>('');
  purposeDescription = input<string>('Maximum');
  currentSendAmount = input<number | string | null>(null);
  currentReceivingAmount = input<number | string | null>(null);
  /** When true, cancelling the 305 prompt opens the inline edit panel instead of locking Continue. */
  editAmountOnLimitCancel = input<boolean>(false);
  /**
   * The parent answers a memo refusal itself, through `memoRequired`. Off leaves
   * that refusal on the `limitCheckFailed` path it has always taken, so a caller
   * that has not opted in behaves exactly as before.
   */
  handlesMemoError = input<boolean>(false);

  amountUpdated = output<{
    amount: number;
    quote: IWalletInternationaPaymentCreate;
  }>();

  /** Emitted when the 305 prompt is cancelled without using the edit panel. */
  limitCancelled = output<void>();
  /** Emitted on a non-305/312 limit failure, so the parent can clear the offending purpose. */
  limitCheckFailed = output<void>();
  /**
   * The check refused the purpose only for want of a memo — a fixable payment,
   * not an unusable purpose. Carries the server's own sentence.
   */
  memoRequired = output<string>();

  transactionLimitMessage = signal<string | null>(null);
  showEditAmount = signal<boolean>(false);
  isCheckingTransactionLimit = signal<boolean>(false);
  isAwaiting305Confirmation = signal<boolean>(false);
  was305Cancelled = signal<boolean>(false);
  isCalculatingSend = signal<boolean>(false);
  isCalculatingReceived = signal<boolean>(false);
  isUpdatingAmount = signal<boolean>(false);
  sendAmountError = signal<string | null>(null);
  /** Set once the user confirms the 305 "proceed" prompt, so Continue doesn't re-prompt. */
  proceedPayment = signal<'0' | '1'>('0');

  editSendAmount = '';
  editReceivingAmount = '';

  isLockedForSubmit = computed<boolean>(
    () =>
      this.isCheckingTransactionLimit() ||
      this.isAwaiting305Confirmation() ||
      this.was305Cancelled() ||
      !!this.transactionLimitMessage() ||
      this.showEditAmount()
  );

  utils = Utils;

  private savedLimitMessage: string | null = null;
  private lastCheckedPurposeCode: string | null = null;
  /** Quote created while typing in the edit panel, reused by updateAmount. */
  private editQuote: IWalletInternationaPaymentCreate | null = null;
  private editSendAmountChange$ = new Subject<string>();
  private editReceivingAmountChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.editSendAmountChange$
      .pipe(debounceTime(800), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.recalculateEditAmounts(Number(value), 0);
      });
    this.editReceivingAmountChange$
      .pipe(debounceTime(800), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.recalculateEditAmounts(Number(value), 1);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Runs the limit check for a purpose code. @param overrideQuoteId checks against a just-created quote without waiting for the input binding. */
  checkLimit(purposeCode: string, overrideQuoteId?: string): void {
    this.lastCheckedPurposeCode = purposeCode;
    this.runLimitCheck(purposeCode, '0', overrideQuoteId);
  }

  /** Clears all limit-card / edit-panel state when an upstream change makes the previous limit response stale. */
  clearState(): void {
    if (this.transactionLimitMessage()) {
      this.transactionLimitMessage.set(null);
    }
    if (this.was305Cancelled()) {
      this.was305Cancelled.set(false);
    }
    if (this.showEditAmount()) {
      this.showEditAmount.set(false);
    }
    this.savedLimitMessage = null;
    this.proceedPayment.set('0');
  }

  private runLimitCheck(
    purposeCode: string,
    isProceedPayment: '0' | '1' = '0',
    overrideQuoteId?: string
  ): void {
    const quoteId = overrideQuoteId || this.quoteId();
    const payeeId = this.payeeId();
    const countryCode = this.countryCode();
    const type = this.type();
    if (!quoteId || !payeeId || !countryCode || !type) return;
    this.transactionLimitMessage.set(null);
    this.was305Cancelled.set(false);
    const payload = {
      quoteId,
      payeeId,
      countryCode,
      type,
      purposeCode,
      paymentMemo: this.paymentMemo() || '',
      isProceedPayment
    };
    this.isCheckingTransactionLimit.set(true);
    this.walletService
      .checkTransactionLimit(payload)
      .pipe(
        finalize(() => this.isCheckingTransactionLimit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        // A refusal can arrive 200-with-`success: false` rather than as an error
        // status; only the memo one is acted on here, the rest read as before.
        next: (res) => {
          const body = res as unknown as {
            success?: boolean;
            errorMsg?: string;
          };
          if (body?.success === false && this.isMemoRefusal(body.errorMsg, payload.paymentMemo)) {
            this.memoRequired.emit(String(body.errorMsg));
          }
        },
        error: (err: HttpErrorResponse) => {
          const errorCode = err?.error?.errorCode;

          // Refused for an empty memo: the purpose is fine, the payment is one
          // field short. Told apart from the failures below so the parent can
          // ask for the memo instead of dropping the purpose.
          if (this.isMemoRefusal(err?.error?.errorMsg, payload.paymentMemo)) {
            this.memoRequired.emit(String(err?.error?.errorMsg ?? ''));
            return;
          }
          if (err?.status === 305 || errorCode === 305 || errorCode === '305') {
            this.isAwaiting305Confirmation.set(true);
            const dialog = this.alertService.confirmAlert({
              content:
                err?.error?.errorMsg ||
                'Transaction limit reached. Do you want to proceed?',
              doneMsg: 'Proceed',
              cancelMsg: 'Cancel',
              // The 305 message arrives with <strong> tags; render them as HTML so it shows bold.
              isShowAsHtml: true
            });
            dialog.afterClosed().subscribe((result) => {
              this.isAwaiting305Confirmation.set(false);
              if (result) {
                this.proceedPayment.set('1');
                this.runLimitCheck(purposeCode, '1', overrideQuoteId);
                return;
              }
              if (this.editAmountOnLimitCancel()) {
                // Let the user lower the amount and re-check instead of locking Continue.
                this.editAmount();
                return;
              }
              this.was305Cancelled.set(true);
              // Let the parent draw the user back to its amount field.
              this.limitCancelled.emit();
            });
            return;
          }
          if (errorCode === 312 || errorCode === '312') {
            this.transactionLimitMessage.set(
              err?.error?.errorMsg ||
                'Transaction limit exceeded for this purpose.'
            );
            return;
          }
          // Other failures are handled by the global interceptor; notify the parent to clear the purpose.
          this.limitCheckFailed.emit();
        }
      });
  }

  /**
   * "Memo is required for trade purposes." — the one refusal that is about the
   * memo rather than the purpose. Both halves have to hold: the message names
   * the memo, and the memo we actually sent was empty.
   *
   * ponytail: matched on the message, since the response carries no code of its
   * own; switch to an errorCode the day the API gives this one.
   */
  private isMemoRefusal(message: unknown, sentMemo: string): boolean {
    return (
      this.handlesMemoError() &&
      !sentMemo.trim() &&
      /memo/i.test(String(message ?? ''))
    );
  }

  /** Opens the inline edit panel pre-filled with the current amounts, saving the limit message so it can be restored on Cancel. */
  editAmount(): void {
    this.savedLimitMessage = this.transactionLimitMessage();
    this.transactionLimitMessage.set(null);
    this.sendAmountError.set(null);
    // Pre-filled amounts haven't been quoted in this edit session yet.
    this.editQuote = null;
    this.isCalculatingReceived.set(false);
    this.isCalculatingSend.set(false);
    const sendAmount = this.currentSendAmount();
    this.editSendAmount =
      sendAmount != null && sendAmount !== ''
        ? Number(sendAmount).toFixed(2)
        : '';
    const receiving = this.currentReceivingAmount();
    this.editReceivingAmount =
      receiving != null && receiving !== '' ? Number(receiving).toFixed(2) : '';
    this.showEditAmount.set(true);
  }

  cancelEditAmount(): void {
    this.showEditAmount.set(false);
    this.transactionLimitMessage.set(this.savedLimitMessage);
  }

  /** Re-creates the quote with the edited amount, emits it, and re-runs the limit check against the new quote_id. */
  updateAmount(): void {
    const amount = Number(this.editSendAmount);
    if (!amount || amount < 10) {
      this.sendAmountError.set('Minimum transaction amount should be $10.00.');
      return;
    }
    if (this.editQuote) {
      this.applyUpdatedQuote(amount, this.editQuote);
      return;
    }
    const payload = {
      countryCode: this.countryCode() || '',
      payoutCurrencyCode: this.payoutCurrencyCode() || '',
      amount,
      type: (this.type() as string) || '',
      isReceivingAmount: 0,
      paymentHome: false
    };
    this.isUpdatingAmount.set(true);
    this.walletService
      .createQuote(payload)
      .pipe(
        finalize(() => this.isUpdatingAmount.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.applyUpdatedQuote(amount, res.data);
          } else {
            // Quote creation failed (e.g. 312): show the backend message.
            this.showQuoteUpdateError(res);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.showQuoteUpdateError(err?.error);
        }
      });
  }

  /** Applies a (re)created quote: emits it, closes the edit panel and re-runs the limit check against the new quote_id. */
  private applyUpdatedQuote(
    amount: number,
    quote: IWalletInternationaPaymentCreate
  ): void {
    this.amountUpdated.emit({ amount, quote });
    this.showEditAmount.set(false);
    this.savedLimitMessage = null;
    this.editQuote = null;
    if (this.lastCheckedPurposeCode) {
      this.runLimitCheck(this.lastCheckedPurposeCode, '0', quote.quote_id);
    }
  }

  /** Shows the quote-create API's error message in the warning modal, falling back to a generic message. */
  private showQuoteUpdateError(failure: unknown): void {
    const error = failure as
      | { errorMsg?: string; errorCode?: number }
      | null
      | undefined;
    this.alertService.warningAlert({
      content: error?.errorMsg || 'Unable to update the amount. Please try again.'
    });
  }

  onEditSendAmountChange(value: string): void {
    // The amount changed; the previous quote no longer matches it.
    this.editQuote = null;
    this.editSendAmount = value;
    const amount = Number(value);
    if (value && amount < 10) {
      this.sendAmountError.set('Minimum transaction amount should be $10.00.');
      this.isCalculatingReceived.set(false);
      this.editReceivingAmount = '';
    } else {
      this.sendAmountError.set(null);
      if (value && amount >= 10) {
        this.isCalculatingReceived.set(true);
      } else {
        this.isCalculatingReceived.set(false);
        this.editReceivingAmount = '';
      }
    }
    this.editSendAmountChange$.next(value);
  }

  onEditReceivingAmountChange(value: string): void {
    // The amount changed; the previous quote no longer matches it.
    this.editQuote = null;
    this.editReceivingAmount = value;
    this.sendAmountError.set(null);
    const amount = Number(value);
    if (value && amount > 0) {
      this.isCalculatingSend.set(true);
    } else {
      this.isCalculatingSend.set(false);
      this.editSendAmount = '';
    }
    this.editReceivingAmountChange$.next(value);
  }

  formatSendAmountOnBlur(): void {
    const amount = Number(this.editSendAmount);
    if (this.editSendAmount && !Number.isNaN(amount)) {
      this.editSendAmount = amount.toFixed(2);
    }
  }

  private recalculateEditAmounts(
    amount: number,
    isReceivingAmount: 0 | 1
  ): void {
    if (isReceivingAmount === 0 && (!amount || amount < 10)) {
      this.editReceivingAmount = '';
      return;
    }
    if (isReceivingAmount === 1 && (!amount || amount <= 0)) {
      this.editSendAmount = '';
      return;
    }
    const payload = {
      countryCode: this.countryCode() || '',
      payoutCurrencyCode: this.payoutCurrencyCode() || '',
      amount,
      type: (this.type() as string) || '',
      isReceivingAmount,
      paymentHome: false
    };
    if (isReceivingAmount === 0) {
      this.isCalculatingReceived.set(true);
    } else {
      this.isCalculatingSend.set(true);
    }
    this.walletService
      .createQuote(payload)
      .pipe(
        finalize(() => {
          this.isCalculatingReceived.set(false);
          this.isCalculatingSend.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            // Keep this quote so Update Amount can reuse it instead of creating another one.
            this.editQuote = res.data;
            if (isReceivingAmount === 0) {
              this.editReceivingAmount = Number(
                res.data.receiving_amount
              ).toFixed(2);
            } else {
              const sending =
                res.data.sending_amount ||
                (amount / Number(res.data.customer_exchange_rate)).toString();
              this.editSendAmount = Number(sending).toFixed(2);
            }
            return;
          }
          this.handleRecalculateFailure(
            (res as unknown as { errorMsg?: string })?.errorMsg,
            isReceivingAmount
          );
        },
        error: (err: HttpErrorResponse) => {
          this.handleRecalculateFailure(
            err?.error?.errorMsg,
            isReceivingAmount
          );
        }
      });
  }

  /** On a quote-creation failure, clears the opposite field and shows the server errorMsg under the Send Amount input. */
  private handleRecalculateFailure(
    errorMsg: string | undefined,
    isReceivingAmount: 0 | 1
  ): void {
    this.editQuote = null;
    if (isReceivingAmount === 0) {
      this.editReceivingAmount = '';
    } else {
      this.editSendAmount = '';
    }
    if (errorMsg) {
      this.sendAmountError.set(errorMsg);
    }
  }
}

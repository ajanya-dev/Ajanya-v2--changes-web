import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPenToSquare } from '@fortawesome/pro-solid-svg-icons';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil
} from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IWalletInternationaPaymentCreate } from 'src/app/models/wallet';

@Component({
  selector: 'app-transaction-limit-card',
  standalone: true,
  templateUrl: './transaction-limit-card.component.html',
  imports: [FormsModule, NgClass, FaIconComponent, NgxMaskDirective],
  providers: [provideNgxMask()]
})
export class TransactionLimitCardComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private alertService = inject(AlertService);

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
  /** When true, cancelling the 305 prompt opens the inline edit panel (so the amount can be lowered and re-checked) instead of locking the Continue button. */
  editAmountOnLimitCancel = input<boolean>(false);

  amountUpdated = output<{
    amount: number;
    quote: IWalletInternationaPaymentCreate;
  }>();

  /** Emitted when the 305 prompt is cancelled and the inline edit panel isn't used, so the parent can react (e.g. focus its own amount field). */
  limitCancelled = output<void>();
  /** Emitted when the limit check fails with a non-305/312 error (e.g. the trade-category memo requirement modal), so the parent can clear the offending purpose selection. */
  limitCheckFailed = output<void>();

  transactionLimitMessage = signal<string | null>(null);
  showEditAmount = signal<boolean>(false);
  isCheckingTransactionLimit = signal<boolean>(false);
  isAwaiting305Confirmation = signal<boolean>(false);
  was305Cancelled = signal<boolean>(false);
  isCalculatingSend = signal<boolean>(false);
  isCalculatingReceived = signal<boolean>(false);
  isUpdatingAmount = signal<boolean>(false);
  sendAmountError = signal<string | null>(null);
  /** Whether the user already confirmed the 305 "proceed" prompt; read by the parent's acceptQoute so Continue inherits the flag and doesn't re-prompt. */
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

  faPenToSquare = faPenToSquare;
  utils = Utils;

  private savedLimitMessage: string | null = null;
  private lastCheckedPurposeCode: string | null = null;
  /** Runs when the limit check passes (e.g. the parent's proceed-to-accept); set per checkLimit() call, cleared once it fires or the check fails. */
  private onCheckSuccess: (() => void) | null = null;
  /** Quote created while typing in the edit panel so updateAmount can reuse it; kept in lockstep with the entered amounts (cleared on keystroke/failure, set on success). */
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

  /** Runs the limit check for a purpose code, handling the 305 proceed flow and 312 inline display; @param overrideQuoteId checks against a just-created quote without waiting for the input binding to refresh. @param onSuccess runs once the check passes (e.g. proceed to accept), including after the user confirms a 305 prompt. */
  checkLimit(
    purposeCode: string,
    overrideQuoteId?: string,
    onSuccess?: () => void
  ): void {
    this.lastCheckedPurposeCode = purposeCode;
    this.onCheckSuccess = onSuccess ?? null;
    this.runLimitCheck(purposeCode, '0', overrideQuoteId);
  }

  /** Fires the pending on-success callback (if any) exactly once. */
  private runCheckSuccess(): void {
    const cb = this.onCheckSuccess;
    this.onCheckSuccess = null;
    cb?.();
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
    if (!quoteId || !payeeId || !countryCode || !type) {
      // Can't pre-validate the limit here; let the caller proceed — acceptQoute re-validates limits.
      this.runCheckSuccess();
      return;
    }
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
        next: (res) => {
          // Limit check passed: run the pending success action (e.g. proceed to accept).
          if (res?.success) {
            this.runCheckSuccess();
          } else {
            this.onCheckSuccess = null;
          }
        },
        error: (err: HttpErrorResponse) => {
          const errorCode = err?.error?.errorCode;
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
              // Cancelled: don't proceed to accept.
              this.onCheckSuccess = null;
              if (this.editAmountOnLimitCancel()) {
                // Open the edit panel so the user can lower the amount and re-check, instead of being stuck on a locked Continue button.
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
            this.onCheckSuccess = null;
            this.transactionLimitMessage.set(
              err?.error?.errorMsg ||
                'Transaction limit exceeded for this purpose.'
            );
            return;
          }
          // Remaining failures are surfaced by the global ErrorHandlingInterceptor; don't stack our own modal on top.
          this.onCheckSuccess = null;
          // Notify the parent so it can clear the purpose that triggered the error (e.g. trade-category memo modal).
          this.limitCheckFailed.emit();
        }
      });
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

  /** Re-creates the quote with the edited amount, emits it, hides the edit panel, then re-runs the limit check with the new quote_id so a still-over-limit amount can't bypass validation. */
  updateAmount(): void {
    const amount = Number(this.editSendAmount);
    if (!amount || amount < 10) {
      this.sendAmountError.set('Minimum transaction amount should be $10.00.');
      return;
    }
    // Reuse the quote created while typing; only create a fresh one when none exists (amount not recalculated, or recalculation failed).
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
            // Quote creation failed (e.g. 312 – amount exceeds limit): show the backend message in the warning modal.
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

  /** Surfaces a quote-creation failure in the edit panel: clears the opposite field and shows the server's errorMsg under the Send Amount input. */
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

import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal';

const INTERCEPTOR_HANDLED_STATUSES = new Set([401, 403, 404, 429, 500]);

const INTERCEPTOR_HANDLED_ERROR_CODES = new Set([
  144, 161, 170, 171, 202, 203, 205, 214, 217, 616, 999
]);

/**
 * Centralized error handler for send payment API errors.
 * Maps error codes to appropriate user-facing responses.
 */
@Injectable()
export class SendPaymentErrorHandlerService {
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private modalService = inject(CustomDoubleSideModalService);

  /**
   * Handle payment API errors by error code.
   * Returns true if the error was handled, false otherwise.
   */
  handle(
    error: unknown,
    callbacks?: {
      onDuplicateFieldsRetry?: () => void;
      onDuplicateCheckNoRetry?: () => void;
      /**
       * 213 with somewhere to go: the caller can open the check on its number so
       * a user who will not reuse it can pick another. Without one the alert
       * closes on a form the user cannot fix.
       */
      onDuplicateCheckNoEdit?: () => void;
      /**
       * 515 names something missing on the payee — an SSN/EIN, an address — that
       * the caller can offer to go and fix. Without it the alert is a dead end
       * (bank-ac-check `openPayeeWarning` L2655-2667).
       */
      onPayeeWarningUpdate?: () => void;
    }
  ): boolean {
    if (this.isHandledByInterceptor(error)) {
      return true;
    }

    const apiError = error as { error?: { errorCode?: number; errorMsg?: string; message?: string } };
    const errorCode = apiError?.error?.errorCode;
    const errorMsg = apiError?.error?.errorMsg || apiError?.error?.message || 'Something went wrong';

    switch (errorCode) {
      case 190:
        return this.handleDuplicateCheckFields(errorMsg, callbacks?.onDuplicateFieldsRetry);

      case 213:
        return this.handleDuplicateCheckNumber(
          errorMsg,
          callbacks?.onDuplicateCheckNoRetry,
          callbacks?.onDuplicateCheckNoEdit
        );

      case 515:
        this.handlePayeeWarning(errorMsg, callbacks?.onPayeeWarningUpdate);
        return true;

      case 731:
        this.handleNoBankAccount(errorMsg);
        return true;

      // ACH: KYC / identity verification required
      case 441:
        this.handleKycVerification(errorMsg);
        return true;

      // ACH: address / common verification required
      case 351:
      case 101:
        this.handleCommonVerification(errorMsg);
        return true;

      // ACH / general: payment requires admin approval
      case 123:
        this.alertService.warningAlert({
          content: errorMsg || 'This payment requires approval before it can be processed.'
        });
        return true;

      // International: wallet not mapped to business
      case 250:
        this.alertService.failedAlert({ content: 'Please map your wallet with business' });
        return true;

      // International: business verification required
      case 541:
        this.handleBusinessVerification(errorMsg);
        return true;

      default:
        return false;
    }
  }

  /** Error 190: Duplicate check fields — ask user to proceed anyway */
  private handleDuplicateCheckFields(
    message: string,
    onRetry?: () => void
  ): boolean {
    const dialogRef = this.alertService.confirmAlert({
      content: message,
      title: 'Do you want to proceed anyway?'
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && onRetry) {
        onRetry();
      }
    });
    return true;
  }

  /** Error 213: Duplicate check number — ask user to proceed anyway */
  private handleDuplicateCheckNumber(
    message: string,
    onRetry?: () => void,
    onEdit?: () => void
  ): boolean {
    const dialogRef = this.alertService.confirmAlert({
      content: message,
      title: 'Do you want to proceed anyway?',
      ...(onEdit ? { cancelMsg: 'Change Check Number' } : {})
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        onRetry?.();
        return;
      }
      onEdit?.();
    });
    return true;
  }

  /**
   * Error 515: Payee warning.
   *
   * With an `onUpdate` the alert becomes actionable — v3 offers "Update" against
   * "Not Now" and opens the payee editor on it. Without one it stays a plain
   * warning, which is what the callers that pass nothing already expect.
   */
  private handlePayeeWarning(message: string, onUpdate?: () => void): void {
    if (!onUpdate) {
      this.alertService.warningAlert({ content: message });
      return;
    }

    this.alertService
      .warningAlert({
        content: message,
        doneMsg: 'Update',
        isCancel: true,
        cancelMsg: 'Not Now'
      })
      .afterClosed()
      .subscribe((update) => {
        if (update) {
          onUpdate();
        }
      });
  }

  /** Error 731: No bank account — offer to navigate to add bank */
  private handleNoBankAccount(message: string): void {
    this.alertService
      .warningAlert({
        title: 'No Bank Account Found',
        content: message,
        doneMsg: 'Add Bank Account',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.closeModalAndNavigate(['/v4/manage/bank-accounts']);
        }
      });
  }

  /** Error 441: KYC / identity verification required */
  private handleKycVerification(message: string): void {
    this.alertService
      .warningAlert({
        content: message || 'Identity verification is required to process this payment.',
        doneMsg: 'Verify',
        isCancel: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.closeModalAndNavigate(['/v4/manage/verification/index']);
        }
      });
  }

  /** Error 351 / 101: Common verification (address/email/phone) */
  private handleCommonVerification(message: string): void {
    this.alertService
      .warningAlert({
        content: message || 'Verification is required to process this payment.',
        doneMsg: 'Verify',
        isCancel: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.closeModalAndNavigate(['/v4/manage/verification/index'],{ openVerificationModal: true }
          );
        }
      });
  }

  /** Error 541: Business verification required */
  private handleBusinessVerification(message: string): void {
    this.alertService
      .warningAlert({
        content: message || 'Business verification is required.',
        doneMsg: 'Verify',
        isCancel: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.closeModalAndNavigate(['/v4/manage/verification/index']);
        }
      });
  }

  /**
   * Returns the alert's closing, so a caller with something to say afterwards
   * can wait its turn. `null` means nothing was shown — the interceptor already
   * spoke — and there is nothing to wait for.
   */
  showGenericError(error: unknown): Observable<boolean | undefined> | null {
    if (this.isHandledByInterceptor(error)) return null;

    const apiError = error as { error?: { errorMsg?: string; message?: string }; message?: string };
    const message =
      apiError?.error?.errorMsg || apiError?.error?.message || apiError?.message || 'Something went wrong';
    return this.alertService.failedAlert({ content: message }).afterClosed();
  }

  /**
   * Whether the interceptor has already spoken for this error. A caller that
   * opens its own alert rather than going through `showGenericError` has to ask
   * first, or the user reads the same sentence in two dialogs.
   */
  handledByInterceptor(error: unknown): boolean {
    return this.isHandledByInterceptor(error);
  }

  private isHandledByInterceptor(error: unknown): boolean {
    const httpError = error as HttpErrorResponse;
    if (INTERCEPTOR_HANDLED_STATUSES.has(httpError?.status)) return true;

    const errorCode = (error as { error?: { errorCode?: number } })?.error?.errorCode;
    if (errorCode && INTERCEPTOR_HANDLED_ERROR_CODES.has(Number(errorCode))) return true;
    if (httpError?.status === 422 && !errorCode) return true;
    
    return false;
  }

  /** Close the send payment modal and navigate */
  private closeModalAndNavigate(route: string[], queryParams?: Record<string, unknown>): void {
    const ref = this.modalService.modalRef();
    if (ref) {
      ref.close(undefined);
    }
    this.router.navigate(route, queryParams ? { queryParams } : undefined);
  }
}

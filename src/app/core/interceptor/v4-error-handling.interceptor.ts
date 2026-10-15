import { catchError } from 'rxjs/operators';
import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { SubscriptionKycRequiredWarningModalV4Component } from 'src/app/modules/subscription/pages/subscription-kyc-required-warning-modal-v4/subscription-kyc-required-warning-modal-v4.component';
import { PlanDataAlertModalV4Component } from 'src/app/shared/modal/plan-data-alert-modal-v4/plan-data-alert-modal-v4.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ContactSupportModalV4Component } from 'src/app/shared/modal/contact-support-modal-v4/contact-support-modal-v4.component';
import { ComplianceService } from 'src/app/modules/compliance-freeze/compliance.service';
import { SubscriptionWarningModalV4Component } from 'src/app/modules/subscription/modals/subscription-warning-modal-v4/subscription-warning-modal-v4.component';
import { V4WarningAlertComponent } from 'src/app/shared/alert/v4-components/v4-warning-alert/v4-warning-alert.component';
import { V4FailedAlertComponent } from 'src/app/shared/alert/v4-components/v4-failed-alert/v4-failed-alert.component';
import {
  IContactNowError,
  ISubscriptionError
} from 'src/app/models/error-handler';
import { environment } from 'src/environments/environment';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { RefillCreditRechargeModalV4Component } from 'src/app/modules/v4-refill-credit/modals/refill-credit-recharge-modal-v4/refill-credit-recharge-modal-v4.component';
import {
  QBO_COMPANY_EXPIRED_CODE,
  QboReconnectService
} from 'src/app/modules/integration/quick-books/services/qbo-reconnect.service';

/**
 * Error codes that the interceptor handles globally.
 * These are infrastructure / subscription / compliance errors —
 * NOT business-logic errors that component-level handlers manage.
 */
const GLOBAL_ERROR_CODES = new Set([
  144, // Company not found
  161, // Compliance freeze
  170, // Contact customer support
  171, // No permission
  202, // Refill credit
  203, // KYC required
  205, // Contact now
  214, // Contact now
  217, // Subscription
  616, // Payment request failed
  999, // Policy acceptance
  QBO_COMPANY_EXPIRED_CODE // 4501 - QuickBooks company access expired
]);

/**
 * V4-specific HTTP error interceptor.
 * Only activates on V4 routes (/v4/).
 *
 * Mirrors V3 interceptor behavior:
 * - 422 with a global errorCode (subscription, compliance, etc.) → special handling.
 * - 422 with a business-logic errorCode (190, 213, 441, etc.) → skipped, component handles.
 * - 422 with no errorCode → shows errorMsg via warning alert (generic fallthrough).
 * - Components can opt out with the 'isDisable422' request header.
 */
@Injectable({
  providedIn: 'root'
})
export class V4ErrorHandlingInterceptor implements HttpInterceptor {
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private doubleSideModalService = inject(CustomDoubleSideModalService);
  private complianceService = inject(ComplianceService);
  private postHogService = inject(PostHogService);
  private qboReconnectService = inject(QboReconnectService);

  private warningRef: MatDialogRef<V4WarningAlertComponent, boolean> | undefined;
  private failedRef: MatDialogRef<V4FailedAlertComponent, boolean> | undefined;
  private ROOT_URL = environment.rootUrl;

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (!this.router.url.includes('v4')) {
          return throwError(() => err);
        }

        if (err.error instanceof Blob) {
          return from(this.parseBlobError(err)).pipe(
            catchError((parsedError: HttpErrorResponse) => {
              this.onHandleErrors(parsedError, request);
              return throwError(() => parsedError);
            })
          );
        }

        this.onHandleErrors(err, request);
        return throwError(() => err);
      })
    );
  }

  private async parseBlobError(error: HttpErrorResponse): Promise<never> {
    try {
      const errorText = await error.error.text();
      const errorJson = JSON.parse(errorText);
      const parsedError = new HttpErrorResponse({
        error: errorJson,
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined
      });
      throw parsedError;
    } catch (parseError) {
      if (parseError instanceof HttpErrorResponse) {
        throw parseError;
      }
      throw error;
    }
  }

  private onHandleErrors(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>
  ): void {
    if (request.url === `${this.ROOT_URL}/logout`) {
      return;
    }

    switch (error.status) {
      case 401:
        this.handle401();
        break;

      case 429:
        this.openWarningAlert(error.error?.message || 'Too many requests');
        break;

      case 422:
        this.handle422(error, request);
        break;

      case 403:
        this.handle403(error, request);
        break;

      case 404:
        this.openWarningAlert('404');
        break;

      case 500:
        this.openFailedAlert();
        break;

      default:
        break;
    }
  }

  // ── 401: Logged out ──

  private handle401(): void {
    // Close every open modal (send-payment modal, confirmation dialogs,
    // side panels, etc.) before surfacing the logout notice and navigating
    // away.  Otherwise stale modals linger over the login page.
    this.dialog.closeAll();
    this.doubleSideModalService.closeAll();
    this.warningRef = undefined;

    // An expired session ends the session just as the logout button does, so the
    // identity has to be dropped here too — otherwise the next person to sign in
    // on this browser is merged into the previous one.
    this.postHogService.reset();

    this.openWarningAlert('You are logged out. Please login');
    const showNewLoginUi = this.localStorageService.getItem('showNewLoginUi');
    if (showNewLoginUi) {
      this.router.navigate(['/login'], {
        queryParams: { initiated_from: showNewLoginUi },
        state: { fromLogout: true }
      });
    } else {
      this.router.navigate(['/login'], { state: { fromLogout: true } });
    }
    this.localStorageService.clearLocalStorage();
  }

  // ── 422: Handle global error codes + generic fallthrough ──

  private handle422(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>
  ): void {
    const errorCode = error.error?.errorCode;

    // Total opt-out, global codes included. For calls that run repeatedly while
    // the user is still typing — a debounced price quote or a form-time
    // validation — where a global code such as 202 would stack a Recharge modal
    // on every keystroke. No existing caller sets this header, so nothing else
    // changes; `isDisable422` below keeps its narrower meaning.
    if (request?.headers?.get('isDisableGlobal422') === 'true') {
      return;
    }

    // If it has an errorCode, only handle global ones — business-logic codes
    // (190, 213, 441, etc.) are left for component-level handlers
    if (errorCode) {
      if (GLOBAL_ERROR_CODES.has(Number(errorCode))) {
        this.handleGlobalErrorCode(error);
      }
      return;
    }

    // No errorCode below this point

    // Allow components to opt out of generic 422 handling
    if (request?.headers?.get('isDisable422') === 'true') {
      return;
    }

    // Skip permission-only messages without errorCode (handled elsewhere)
    if (error.error?.errorMsg === "You don't have permission to do this action.") {
      return;
    }

    // Generic fallthrough — show errorMsg for 422s without errorCode
    const msg = error.error?.errorMsg || error.error?.message;
    if (msg) {
      this.openWarningAlert(this.transformErrorMessage(msg));
    }
  }

  private handleGlobalErrorCode(error: HttpErrorResponse): void {
    const err = error.error;
    switch (Number(err.errorCode)) {
      case 202:
        this.refillCreditWarning(err.errorMsg);
        break;
      case 144:
        this.companyNotFound();
        break;
      case 203:
        this.openSubscriptionKycRequiredModal();
        break;
      case 205:
      case 214:
        this.openErrorWithContactNow(err);
        break;
      case 999:
        this.gotoPolicyAcceptance();
        break;
      case 217:
        this.subscriptionHandler(err);
        break;
      case 170:
        this.showContactCustomerSupportInfoAlert(err);
        break;
      case 171:
        this.openWarningAlert("You don't have permission to do this action.");
        break;
      case 616:
        this.alertService.failedAlert({ content: 'Your payment request is failed' });
        break;
      case 161:
        this.handleComplianceFreeze(err.accountOnHold);
        break;
      case QBO_COMPANY_EXPIRED_CODE:
        this.qboReconnectService.promptReconnect(err, 'v4');
        break;
      default:
        break;
    }
  }

  // ── 403: Subscription / permissions ──

  private handle403(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>
  ): void {
    if (error.error?.errorCode === 161) {
      this.handleComplianceFreeze(error.error.accountOnHold);
      return;
    }
    if (request.headers.get('disablePermission') === 'true') {
      return;
    }

    if (
      this.router.url.includes('v4/manage/payments-out/detailed') &&
      request.url !== `${this.ROOT_URL}/checks/check-list-data` &&
      error.error.errorType !== 'subscription' &&
       error.error.permissionType !== 'action'
    ) {
      return;
    }

    if (error.error?.errorType === 'bankdata') {
      this.openSubscriptionAdModal();
      return;
    }

    if (error.error?.errorType === 'subscription') {
      if (error.error.errorCode === '203') {
        this.openSubscriptionKycRequiredModal();
      } else if (error.error.errorCode === '204') {
        this.openSubscriptionPausedAlert(error.error);
      } else {
        this.subscriptionHandler(error.error);
      }
      return;
    }
    if (error?.error?.errorMsg && !error?.error?.permissionType) {
      this.openWarningAlert(error.error.errorMsg);
      return;
    }

    if (request.headers.get('isDisable422') !== 'true') {
      this.userPermissionHandler(error.error);
    }

  }

  private userPermissionHandler(err: HttpErrorResponse['error']): void {
    if (err?.permissionType === 'page' ) {
      this.router.navigateByUrl('/v4/manage/permission-denied');
    } else if (err?.permissionType === 'action') {
      this.openWarningAlert("You don't have permission to do this action.");
    } else if (err?.errorMsg) {
      this.openWarningAlert(err.errorMsg);
    }
  }

  // ── Shared handlers (same logic as V3 interceptor) ──

  private handleComplianceFreeze(isAccountHold = false): void {
    this.complianceService.setFreezeState(true);
    if (isAccountHold) {
      this.router.navigate(['/compliance-freeze']);
    } else {
      this.complianceService.openComplianceFreezeModal();
    }
  }

  private subscriptionHandler(err: HttpErrorResponse['error']): void {
    // Use setTimeout to ensure this opens AFTER any other dialogs (e.g. payment success)
    // so it renders on top in the CDK overlay stack
    setTimeout(() => {
      this.dialog.closeAll();
      // const url = this.router?.url ?? '';
      // const isBankAccountFlow =
      //   url.includes('/bank-accounts') || url.includes('/bankaccount');
      // if (isBankAccountFlow) {
      //   this.dialog.open(PlanDataAlertModalV4Component, {
      //     width: '353px',
      //     autoFocus: false,
      //     panelClass: 'paddingless-modal-rounded',
      //     disableClose: true,
      //     data: { target: 'plans' }
      //   });
      //   return;
      // }
      this.dialog.open(SubscriptionWarningModalV4Component, {
        maxWidth: '400px',
        width: '95%',
        disableClose: true,
        data: { content: err.errorMsg },
        panelClass: 'paddingless-modal-rounded'
      });
    });
  }

  private openSubscriptionPausedAlert(error: ISubscriptionError): void {
    const action = this.alertService.warningAlert({
      content: error.errorMsg,
      doneMsg: 'Contact Now',
      isCancel: true,
      cancelMsg: 'Not Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  private openErrorWithContactNow(error: IContactNowError): void {
    const action = this.alertService.warningAlert({
      content: error.errorMsg,
      doneMsg: 'Contact Now',
      isCancel: true,
      cancelMsg: 'Not Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.open(ContactSupportModalV4Component, {
          width: '400px',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded'
        });
      }
    });
  }

  private showContactCustomerSupportInfoAlert(error: IContactNowError): void {
    const action = this.alertService.infoAlert({
      content: error.errorMsg,
      doneMsg: 'Contact Now',
      isCancel: true,
      cancelMsg: 'Not Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  private refillCreditWarning(msg: string): void {
    const dref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Recharge Now',
      cancelMsg: 'Not Now',
      isCancel: true
    });
    dref.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.closeAll();
        const headerData = this.headerService._headerData.value;
        const isSubscribed = headerData ? headerData.isSubscribed : 0;
        if (!isSubscribed) {
          const subAlert = this.alertService.warningAlert({
            content: 'Kindly subscribe to a plan.',
            isCancel: true,
            doneMsg: 'Subscribe Now',
            cancelMsg: 'Not Now'
          });
          subAlert.afterClosed().subscribe((subRes) => {
            if (subRes) {
              this.router.navigate(['/v4/manage/subscription'], {
                state: { returnUrl: this.router.url }
              });
            }
          });
          return;
        }
        this.dialog.open(RefillCreditRechargeModalV4Component, {
          width: '450px',
          maxWidth: '93%',
          autoFocus: false,
          disableClose: true,
          panelClass: 'paddingless-modal-rounded'
        });
      }
    });
  }

  private openSubscriptionKycRequiredModal(): void {
    this.dialog.closeAll();
    this.dialog.open(SubscriptionKycRequiredWarningModalV4Component, {
      maxWidth: '500px',
      width: '90%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  private openSubscriptionAdModal(): void {
    this.dialog.closeAll();
    this.dialog.open(PlanDataAlertModalV4Component, {
      width: '353px',
      autoFocus: false,
      data: { target: 'addons' },
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  private companyNotFound(): void {
    this.openWarningAlert('You have to select one company.');
    this.router.navigate(['manage/company_management/select_company_dashboard']);
  }

  private gotoPolicyAcceptance(): void {
    if (this.router.url !== '/manage/company_management/select_company_dashboard') {
      this.router.navigate(['/manage/company_management/select_company_dashboard']);
    }
  }

  private transformErrorMessage(msg: string): string {
    let cleaned = msg.replace(/Error on row #\s*\d+\s*-\s*/i, '');
    cleaned = cleaned.replace(/The amount field is required\.?/i, 'The amount field is not selected.');
    return cleaned;
  }

  private openWarningAlert(content: string): void {
    if (this.warningRef) return;
    this.warningRef = this.alertService.warningAlert({ content }) as MatDialogRef<V4WarningAlertComponent, boolean>;
    this.warningRef.afterClosed().subscribe(() => {
      this.warningRef = undefined;
    });
  }

  private openFailedAlert(): void {
    if (this.failedRef) return;
    this.failedRef = this.alertService.failedAlert({
      title: '500 - Internal server error',
      content: 'Try to refresh the page or feel free to contact us if the problem persists.',
      refresh: true
    }) as MatDialogRef<V4FailedAlertComponent, boolean>;
    this.failedRef.afterClosed().subscribe(() => {
      this.failedRef = undefined;
    });
  }
}

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
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { SubscriptionWarningModalComponent } from 'src/app/modules/subscription/modals/subscription-warning-modal/subscription-warning-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { FailedAlertComponent } from 'src/app/shared/alert/components/failed-alert/failed-alert.component';
import { SubscriptionKycRequiredWarningModalComponent } from 'src/app/modules/subscription/pages/subscription-kyc-required-warning-modal/subscription-kyc-required-warning-modal.component';
import { environment } from 'src/environments/environment';
import {
  IContactNowError,
  ISubscriptionError
} from 'src/app/models/error-handler';
import { PlanDataAlertModalComponent } from 'src/app/shared/modal/plan-data-alert-modal/plan-data-alert-modal.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ContactSupportModalComponent } from 'src/app/shared/modal/contact-support-modal/contact-support-modal.component';
import { ComplianceService } from 'src/app/modules/compliance-freeze/compliance.service';
import { AddPayeeModalComponent } from 'src/app/shared/modal/payee-modal/add-payee-modal/add-payee-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PusherService } from 'src/app/core/services/pusher.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import {
  QBO_COMPANY_EXPIRED_CODE,
  QboReconnectService
} from 'src/app/modules/integration/quick-books/services/qbo-reconnect.service';

/**
 * @description Error Interceptor class. intercepts all the requests and if there is any error takes appropriate action.
 * @class - Service Class
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingInterceptor implements HttpInterceptor {
  private alertService = inject(AlertService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private route = inject(ActivatedRoute);
  private checkService = inject(CheckService);
  private complianceService = inject(ComplianceService);
  private pusherService = inject(PusherService);
  private postHogService = inject(PostHogService);
  private qboReconnectService = inject(QboReconnectService);

  warningRef: MatDialogRef<WarningAlertComponent, boolean> | undefined;
  failedRef: MatDialogRef<FailedAlertComponent, boolean> | undefined;
  ROOT_URL = environment.rootUrl;

  /**
   * @description Identifies and handles a given HTTP request.
   * @param request - HttpRequest, every http request going out from application
   * @param next - HttpHandler
   * @returns
   */
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        // Skip v4 routes — handled by V4ErrorHandlingInterceptor
        if (this.router.url.includes('v4')) {
          return throwError(() => err);
        }
        // Handle blob response errors - when responseType is 'blob', error body is also a Blob
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

  /**
   * @description Parses a Blob error response to extract JSON error data
   * @param error - HttpErrorResponse with Blob error body
   * @returns Promise that rejects with a new HttpErrorResponse containing parsed error data
   */
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
      // If parsing fails, throw the original error
      if (parseError instanceof HttpErrorResponse) {
        throw parseError;
      }
      throw error;
    }
  }

  /**
   * @description Getting an error and request object that got an error. and this is the function that takes appropriate actions for each error according to error codes.
   * @param error - HttpErrorResponse
   * @param request - HttpRequest
   * @returns
   */
  onHandleErrors(
    error: HttpErrorResponse,
    request: HttpRequest<unknown>
  ): void {
    if (request.url === `${this.ROOT_URL}/logout`) {
      return;
    }

    const showNewLoginUi = this.localStorageService.getItem('showNewLoginUi');
    switch (error.status) {
      /**
       * @description 401 Logged Out
       */
      case 401:
        this.pusherService.disconnectClient();
        // An expired session ends the session just as the logout button does, so
        // the identity has to be dropped here too — otherwise the next person to
        // sign in on this browser is merged into the previous one.
        this.postHogService.reset();
        this.openWarningAlert('You are logged out. Please login');
        if(showNewLoginUi) {
          this.router.navigate(['/login'], { queryParams: { initiated_from: showNewLoginUi }, state: { fromLogout: true } });
        }else{
          this.router.navigate(['/login'], { state: { fromLogout: true } });
        }
        this.localStorageService.clearLocalStorage();
        break;

      /**
       * @description 429 Too Many attempts
       */
      case 429:
        this.openWarningAlert(error.error.message);
        break;

      /**
       * @description 422.
       */
      case 422:
        if(this.route.snapshot.queryParams.from && error.url?.includes('signup-page-visit')) {
          return;
        }
        
        if (
          error.error.errorCode &&
          !this.router.url.includes('bulk-payments/index')
        ) {
          this.handleErrorCode(error);
          return;
        }
        if (
          request?.headers?.get('isDisable422') === 'true' ||
          (error.error.errorMsg ===
            "You don't have permission to do this action." &&
            !error.error.errorCode)
        ) {
          return;
        }
        if (error.error.errorCode === '521') {
          return;
        }
        this.openWarningAlert(error.error.errorMsg || error.error.message);
        break;

      /**
       * @description 403. Subscription related
       */
      case 403:
        if(error.error.errorCode === 161) {
          const isAccontHold = error.error.accountOnHold;
          this.handleComplianceFreeze(isAccontHold);
          return;
        }

        if (request.headers.get('disablePermission') === 'true') {
          return;
        }
        if (
          this.router.url.includes('manage/payments-table') &&
          request.url !== `${this.ROOT_URL}/checks/check-list-data` &&
          error.error.errorType !== 'subscription'
        ) {
          return;
        }
        if (
          (this.router.url.includes('manage/home') ||
          this.router.url.includes('manage/payments/main')) &&
          error.error.permissionType !== 'action' &&
          error.error.errorType !== 'subscription'
        ) {
          return;
        }
        if (error.error.errorType === 'bankdata') {
          this.openSubscriptionAdModal();
          break;
        }
        if (
          error?.error?.errorType === 'subscription' &&
          error?.error?.errorCode === '203'
        )
          this.openSubscriptionKycRequiredModal();
        else if (
          error?.error?.errorType === 'subscription' &&
          error?.error?.errorCode === '204'
        )
          this.openSubscriptionPausedAlert(error?.error);
        else if (error?.error?.errorType === 'subscription')
          this.subscriptionHandler(error?.error);
        else if (error?.error?.errorMsg && !error?.error?.permissionType) {
          // Generic 403 error with errorMsg (e.g., outside API errors like download limits)
          this.openWarningAlert(error.error.errorMsg);
        }
        else if (request?.headers?.get('isDisable422') !== 'true') {
          this.userPermissionHandler(error.error);
        }
        break;

      /**
       * @description 404. Not Found.
       */
      case 404:
        this.openWarningAlert('404');
        break;

      /**
       * @description 500. Server Error.
       */
      case 500:
        this.openFailedAlert();
        break;

      default:
        break;
    }
  }

  /**
   * @description Opens a modal that alerts user about the user subscription has paused.
   * @param error
   */
  openSubscriptionPausedAlert(error: ISubscriptionError) {
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

  /**
   * @description Opens a modal with contact now that alerts user is not eligible for outside funding.
   * @param error
   */
  openErrorWithContactNow(error: IContactNowError) {
    const action = this.alertService.warningAlert({
      content: error.errorMsg,
      doneMsg: 'Contact Now',
      isCancel: true,
      cancelMsg: 'Not Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.open(ContactSupportModalComponent, {
          width: '400px',
          disableClose: true
        });
      }
    });
  }

  /**
   * @description Opens a modal that warns about subscirption,
   * @param err
   */
  subscriptionHandler(err: HttpErrorResponse['error']): void {
    this.dialog.closeAll();
    const warningAlert = () => {
      const dialogRef = this.dialog.open(SubscriptionWarningModalComponent, {
        maxWidth: '370px',
        minWidth: '370px',
        width: '95%',
        disableClose: true,
        data: { content: err.errorMsg },
        panelClass: 'ocw_alert_wrapper'
      });
      return dialogRef;
    };

    warningAlert();
  }

  /**
   * @description Handling all the errors regarding user persmissions due to subscriptions. checking different routes and alerts user with corresponding error messages.
   * @param err
   * @returns
   */
  userPermissionHandler(err: HttpErrorResponse['error']): void {
    const currentRoute = this.router.url.split('?')[0];
    if (currentRoute.includes('v3')) {
      if (
        (err.permissionType === 'action' &&
          err.permissionRequired === 'bankaccount-create') ||
        err.permissionRequired === 'netsuite-import'
      ) {
        this.openWarningAlert("You don't have permission to do this action.");
      }
      return;
    }
    if (
      currentRoute === '/manage/cheque/create' ||
      currentRoute === '/manage/receivedchecks/requestcheck' ||
      currentRoute === '/manage/payee/index' ||
      currentRoute === '/manage/invoice' ||
      currentRoute === '/manage/payment-links/create' ||
      currentRoute === '/manage/bill/index' ||
      currentRoute === '/manage/checkdraft/new' ||
      currentRoute === '/manage/depositslips/create' ||
      currentRoute === '/manage/cashexp/new-cash' ||
      currentRoute === '/manage/wallet/fund-your-wallet' ||
      currentRoute === '/manage/wallet/withdraw-fund' ||
      currentRoute === '/manage/vendor-credit/index' ||
      currentRoute.includes('manage/get_paid_by_form/update')
    ) {
      if (err.permissionType === 'page') {
        if (err.permissionRequired === 'bill-read') {
          this.router.navigateByUrl('/manage/permission-denied');
        } else if (err.permissionRequired === 'payee-read') {
          this.openWarningAlert(
            "You don't have permission to view payee. Please contact the company owner."
          );
        } else if (err.permissionRequired === 'bankaccount-read') {
          this.openWarningAlert(
            "You don't have permission to view bank accounts. Please contact the company owner."
          );
        } else if (err.permissionRequired === 'category-add-page-access') {
          this.openWarningAlert(
            "You don't have permission to view categories. Please contact the company owner."
          );
        } else if (err.permissionRequired === 'getpaidbyform-read') {
          this.openWarningAlert(
            "You don't have permission to view payment links. Please contact the company owner."
          );
        }
      } else if (
        currentRoute === '/manage/cheque/create' &&
        err.permissionRequired === 'creditcard-view' &&
        err.permissionType === 'action'
      ) {
        return;
      }
      if (err.permissionType === 'action') {
        this.openWarningAlert("You don't have permission to do this action.");
      }
    } else if (
      currentRoute === '/manage/depositslips/index' ||
      currentRoute === '/manage/cheque/checkrecords'
    ) {
      if (
        err.permissionType === 'page' &&
        (err.permissionRequired === 'bankaccount-read' ||
          err.permissionRequired === 'payee-read')
      ) {
        return;
      }
      if (err.permissionType === 'action') {
        this.openWarningAlert("You don't have permission to do this action.");
      }
    } else if (err.permissionType === 'page') {
      this.router.navigateByUrl('/manage/permission-denied');
    } else if (
      err.permissionType === 'action' &&
      (err.permissionRequired !== 'quickbooks-online-mapping' ||
        err.permissionRequired !== 'quickbooks-desktop-mapping') &&
      currentRoute !== '/manage/permission-denied'
    ) {
      this.openWarningAlert("You don't have permission to do this action.");
    } else if (
      err.permissionType === 'action' &&
      err.permissionRequired === 'quickbooks-online-mapping'
    ) {
      this.openWarningAlert("You don't have permission to do this action.");
      this.router.navigateByUrl(
        '/manage/thirdparty_app/quickBooks/quickbooks_online'
      );
    } else if (
      err.permissionType === 'action' &&
      err.permissionRequired === 'quickbooks-desktop-mapping'
    ) {
      this.openWarningAlert("You don't have permission to do this action.");
      this.router.navigateByUrl('/manage/thirdparty_app/qb_desktop');
    }
  }

  /**
   * @description Handles different error codes when error status codes 422, and taking appropriate actions.
   * @param error
   */
  handleErrorCode(error: HttpErrorResponse['error']) {
    switch (error.error.errorCode) {
      case 101:
      case '101':
        this.handlePayeeAddressUpdate(error?.error.errorMsg);
        break;
      case 202:
        this.refillCreditWarning(error.error.errorMsg);
        break;
      case 144:
        this.companyNotFound();
        break;
      case 203:
        this.openSubscriptionKycRequiredModal();
        break;
      case 205:
        this.openErrorWithContactNow(error?.error);
        break;
      case 214:
        this.openErrorWithContactNow(error?.error);
        break;
      case 999:
        this.gotoPolicyAcceptance();
        break;
      case 217:
        this.subscriptionHandler(error?.error);
        break;
      case 170:
        this.showContactCustomerSupportInfoAlert(error?.error);
        break;
      case 171:
        this.openWarningAlert("You don't have permission to do this action.");
        break;
      case 616:
        this.alertService.failedAlert({
          content: 'Your payment request is failed',
        });
        break;
      case 161:
        this.handleComplianceFreeze();
        break;
      // The company OAuth grant expired; offer to disconnect and reconnect it.
      case QBO_COMPANY_EXPIRED_CODE:
      case String(QBO_COMPANY_EXPIRED_CODE):
        this.qboReconnectService.promptReconnect(error.error, 'v3');
        break;
      case '303':
        this.openWarningAlert(error.error.errorMsg);
        break;
      default:
        break;
    }
  }

  /**
   * @description Opens the compliance freeze modal to inform the user about account restrictions.
   */
  handleComplianceFreeze(isAccountHold: boolean = false): void {
    if (isAccountHold) {
      this.router.navigate(['compliance-freeze']);
    } else {
      this.complianceService.openComplianceFreezeModal();
    }
  }

  /**
   * @description Handles error code 101 - payee address update required for mailing a check.
   * Shows the backend error message and opens the add payee modal in address mode.
   */
  handlePayeeAddressUpdate(error: string): void {
    const payeeId = this.checkService.activeMailPayeeId;
    if (!payeeId) {
      this.openWarningAlert(error);
      return;
    }
    const action = this.alertService.warningAlert({
      content: error,
      doneMsg: 'Update',
      isCancel: true,
      cancelMsg: 'Not Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.open(AddPayeeModalComponent, {
          disableClose: true,
          maxWidth: '700px',
          width: '95%',
          data: {
            edit: true,
            id: payeeId,
            type: 'payee',
            page: 'addAddress'
          }
        });
      }
    });
  }

  /**
   * @description Opens warning alert with custom message, and after closed navigates to another route.
   */
  refillCreditWarning(msg: string) {
    const dref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Recharge Now',
      cancelMsg: 'Not Now',
      isCancel: true
    });

    dref.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.closeAll();
        this.router.navigate(['manage/refill-credit']);
      }
    });
  }

  showContactCustomerSupportInfoAlert(error: IContactNowError) {
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

  /**
   * @description Opens Subscription Kyc Required Modal.
   */
  openSubscriptionKycRequiredModal(): void {
    this.dialog.closeAll();
    this.dialog.open(SubscriptionKycRequiredWarningModalComponent, {
      maxWidth: '850px',
      width: '90%',
      disableClose: true
    });
  }

  openSubscriptionAdModal() {
    this.dialog.closeAll();
    this.dialog.open(PlanDataAlertModalComponent, {
      width: '353px',
      autoFocus: false,
      data: { target: 'addons' },
      disableClose: true
    });
  }

  /**
   * @description Opens warning alert with custom message
   */
  companyNotFound() {
    this.openWarningAlert('You have to select one company.');
    this.router.navigate([
      'manage/company_management/select_company_dashboard'
    ]);
  }

  /**
   * @description redirects to policy acceptance page if policy not accepted.
   */
  gotoPolicyAcceptance() {
    if (
      this.router.url !== '/manage/company_management/select_company_dashboard'
    ) {
      this.router.navigate([
        '/manage/company_management/select_company_dashboard'
      ]);
    }
  }

  /**
   * @description Opens Warning Alert modal.
   * @returns
   */
  openWarningAlert(content: string) {
    if (this.warningRef) {
      return;
    }
    this.warningRef = this.alertService.warningAlert({ content });
    this.warningRef.afterClosed().subscribe(() => {
      this.warningRef = undefined;
    });
  }

  /**
   * @description Opens Failed Alert modal.
   * @returns
   */
  openFailedAlert() {
    if (this.failedRef) {
      return;
    }
    const data = {
      title: '500 - Internal server error',
      content:
        'Try to refresh the page or feel free to contact us if the problem persists.',
      refresh: true
    };
    this.failedRef = this.alertService.failedAlert(data);
    this.failedRef.afterClosed().subscribe(() => {
      this.failedRef = undefined;
    });
  }
}

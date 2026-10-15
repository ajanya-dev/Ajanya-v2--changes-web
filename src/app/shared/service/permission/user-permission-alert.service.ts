import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Injectable({
  providedIn: 'root'
})
export class UserPermissionAlertService {
  private router = inject(Router);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);

  currentRoute: string;

  private get isV4(): boolean {
    return this.router.url.includes('v4');
  }

  /**
   * @description - Displays a warning alert indicating that the user doesn't have permission to perform an action.
   */
  private displayPermissionDeniedAlert() {
    const content = "You don't have permission to do this action.";
    if (this.isV4) {
      this.v4AlertService.warningAlert({ content });
    } else {
      this.alertService.warningAlert({ content });
    }
  }

  /**
   * @description-Handles errors related to permissions and executes a callback function when a 403 status error occurs.
   * @param error -The error object containing status information.
   * @param permissionCallback - The callback function to execute when permission error occurs.
   */
  handleErrorsAndPermissions(error: any, permissionCallback: () => void): void {
    if (error.status === 403) {
      this.currentRoute = this.router.url.split('?')[0];
      permissionCallback();
    }
  }

  /**
   * @description - Handles permission-related errors specific to creating a blank check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  blankCheckPermission(error: HttpErrorResponse) {
    if (
      error.error.permissionRequired === 'can-make-blank-check' &&
      error.error.permissionType === 'action' && !this.isV4
    ) {
      this.displayPermissionDeniedAlert();
    }
  }

  /**
   * @description - Handles permission-related errors specific to creating a cloud payment and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  cloudPaymentPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/home' ||
      this.currentRoute === '/manage/payments/main'
    ) {
      if (
        error.error.permissionRequired === 'cloudbank-send-payment' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to creating a check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  createCheckPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/home' ||
      this.currentRoute === '/manage/payments/main'
    ) {
      if (
        error.error.permissionRequired === 'check-create' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to deleting a check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  deleteCheckPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/home' ||
      this.currentRoute === '/manage/payments/main' ||
      this.currentRoute === '/manage/payments-table/index'
    ) {
      if (
        error.error.permissionRequired === 'check-delete' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to voiding a check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  voidCheckPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/home' ||
      this.currentRoute === '/manage/payments/main' ||
      this.currentRoute === '/manage/payments-table/index'
    ) {
      if (
        error.error.permissionRequired === 'check-void' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to creating a credit card and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  createCardPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/home' ||
      this.currentRoute === '/manage/payments/main' ||
      this.currentRoute === '/manage/cards'
    ) {
      if (
        error.error.permissionRequired === 'creditcard-create' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to printing a check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  printCheckPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/payments-table/index' ||
      this.currentRoute === '/manage/home' ||
      this.currentRoute.includes('/v4/manage/payments-out/detailed')
    ) {
      if (
        error.error.permissionRequired === 'check-print' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to mailing a check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  maillCheckPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/payments-table/index' ||
      this.currentRoute === '/manage/home' ||
      this.currentRoute.includes('/v4/manage/payments-out/detailed')
    ) {
      if (
        error.error.permissionRequired === 'check-mail' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to e-mailing a check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  emailCheckPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/payments-table/index' ||
      this.currentRoute === '/manage/home'
    ) {
      if (
        error.error.permissionRequired === 'check-email' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to direct depositing a check and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  DDCheckPermission(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/payments-table/index' ||
      this.currentRoute === '/manage/home'
    ) {
      if (
        error.error.permissionRequired === 'check-directdeposit' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to creating a cloud bank account and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  cloudAccount(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cloud-bank/index') {
      if (
        error.error.permissionRequired === 'cloudbank-create-account' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to downloading a statement and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  downloadStatement(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cloud-bank/index') {
      if (
        error.error.permissionRequired === 'cloudbank-download-statement' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to approving a cloud transaction and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  cloudApprovePayment(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cloud-bank/index') {
      if (
        error.error.permissionRequired ===
          'cloudbank-transaction-request-approve' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to rejecting a cloud transaction and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  cloudRejectPayment(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cloud-bank/index') {
      if (
        error.error.permissionRequired ===
          'cloudbank-transaction-request-reject' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to viewing cloud accounts and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  cloudAccountDetails(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cloud-bank/index') {
      if (
        error.error.permissionRequired === 'cloudbank-view-account' &&
        error.error.permissionType === 'page'
      ) {
        this.router.navigateByUrl(
          this.isV4 ? '/v4/manage/permission-denied' : '/manage/permission-denied'
        );
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to viewing cloud accounts and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  payrollDetails(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/payroll-card/index') {
      if (
        error.error.permissionRequired === 'payroll-by-card-page-access' &&
        error.error.permissionType === 'page'
      ) {
        this.router.navigateByUrl(
          this.isV4 ? '/v4/manage/permission-denied' : '/manage/permission-denied'
        );
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to updating a credit card details and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  updateCard(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cards' || this.currentRoute === '/v4/manage/cards') {
      if (
        error.error.permissionRequired === 'creditcard-update' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to deleting credit card and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  deleteCard(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cards') {
      if (
        error.error.permissionRequired === 'creditcard-delete' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to viewing credit card details and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  cardDetails(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/cards' || this.currentRoute === '/v4/manage/cards') {
      if (
        error.error.permissionRequired === 'creditcard-view' &&
        error.error.permissionType === 'action'
      ) {
        this.router.navigateByUrl(
          this.isV4 ? '/v4/manage/permission-denied' : '/manage/permission-denied'
        );
      }
    }
  }


  /**
   * @description - Handles permission-related errors specific to approving a check payment and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  approveCheck(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/home' ||
      this.currentRoute === '/manage/payments-table/index'
    ) {
      if (
        error.error.permissionRequired ===
          'can-this-user-approve-other-user-printing-request' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to payee update and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  payeeCreate(error: HttpErrorResponse) {
    if (this.currentRoute === '/manage/payees') {
      if (
        error.error.permissionRequired === 'payee-create' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    } 
  }

  /**
   * @description - Handles permission-related errors specific to walletWithdrawn and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  walletWithdrawn(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/wallet/transactions' ||
      this.currentRoute === '/manage/transfers/index'
    ) {
      if (
        error.error.permissionRequired === 'wallet-withdraw-fund' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to walletWithdrawn and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  fundWallet(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/wallet/transactions' ||
      this.currentRoute === '/manage/transfers/index'
    ) {
      if (
        error.error.permissionRequired === 'wallet-fund' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }

  /**
   * @description - Handles permission-related errors specific to walletWithdrawn and displays a permission denied alert.
   * @param error -The error object containing permission-related details.
   */
  walletTransferFund(error: HttpErrorResponse) {
    if (
      this.currentRoute === '/manage/wallet/transactions' ||
      this.currentRoute === '/manage/transfers/index'
    ) {
      if (
        error.error.permissionRequired === 'wallet-transfer-fund' &&
        error.error.permissionType === 'action'
      ) {
        this.displayPermissionDeniedAlert();
      }
    }
  }
}

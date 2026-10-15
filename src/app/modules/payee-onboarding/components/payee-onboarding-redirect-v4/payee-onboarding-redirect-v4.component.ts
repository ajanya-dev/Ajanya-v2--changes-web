import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PayeeOnboardingService } from '../../services/payee-onboarding.service';
import { ResetPasswordModalV4Component } from 'src/app/shared/modal/reset-password-modal-v4/reset-password-modal-v4.component';

const WALLETS_ROUTE = '/v4/manage/wallets';
const VIRTUAL_CARD_ROUTE = '/v4/manage/virtual-card';

const REDIRECT_BACK_ROUTES: Record<string, string> = {
  virtual_card: VIRTUAL_CARD_ROUTE
};

@Component({
  selector: 'app-payee-onboarding-redirect-v4',
  standalone: true,
  template: ''
})
export class PayeeOnboardingRedirectV4Component implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private payeeOnboardingService = inject(PayeeOnboardingService);

  private redirectRoute = WALLETS_ROUTE;

  ngOnInit(): void {
    this.redirectRoute = this.resolveRedirectRoute();
    this.captureParams();
    this.openModalThenNavigate();
  }

  private resolveRedirectRoute(): string {
    const redirectBack = this.route.snapshot.queryParams?.redirect_back;
    return REDIRECT_BACK_ROUTES[redirectBack] ?? WALLETS_ROUTE;
  }

  private captureParams(): void {
    const params = this.route.snapshot.queryParams;
    if (
      params?.initiator_id &&
      params?.externalToken &&
      params?.initiated_from
    ) {
      this.localStorageService.setItem('payeeObInitId', params.initiator_id);
      this.localStorageService.setItem('payeeObExtToken', params.externalToken);
      this.localStorageService.setItem('payeeObInitFrom', params.initiated_from);
      if (params.isNewUser !== undefined) {
        this.localStorageService.setItem('payeeObIsNewUser', params.isNewUser);
      }
      this.payeeOnboardingService.payeeOnboardingSignal.set({
        initiatedFrom: params.initiated_from,
        initiatorId: params.initiator_id,
        externalToken: params.externalToken,
        isNewUser: params.isNewUser
      });
    }
  }

  /** Existing payees (isNewUser=0) already have a password; `set-password` still forces the modal. */
  private shouldSkipPasswordModal(): boolean {
    if (this.route.snapshot.routeConfig?.path !== 'index') {
      return false;
    }
    const { isNewUser } = this.payeeOnboardingService.payeeOnboardingSignal();
    return Number(isNewUser) === 0;
  }

  /** Ask the wallets page to open withdraw on arrival, magic-link landing only. */
  private requestWithdrawOnArrival(): void {
    if (
      this.route.snapshot.routeConfig?.path === 'index' &&
      this.redirectRoute === WALLETS_ROUTE
    ) {
      this.payeeOnboardingService.openWithdrawOnArrival.set(true);
    }
  }

  private openModalThenNavigate(): void {
    if (this.localStorageService.getItem('payeePasswordSet') === '1') {
      this.requestWithdrawOnArrival();
      this.router.navigate([this.redirectRoute], { replaceUrl: true });
      return;
    }

    if (this.shouldSkipPasswordModal()) {
      this.requestWithdrawOnArrival();
      this.router.navigate([this.redirectRoute], { replaceUrl: true });
      return;
    }

    const params = this.route.snapshot.queryParams;
    const dialogRef = this.dialog.open(ResetPasswordModalV4Component, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        externalToken: params?.externalToken
      }
    });

    this.router.navigate([this.redirectRoute], { replaceUrl: true });

    dialogRef.afterClosed().subscribe((success) => {
      if (success) {
        // New user: withdraw only once the password is actually set.
        this.requestWithdrawOnArrival();
        this.router.navigate([this.redirectRoute], { replaceUrl: true });
      }
    });
  }
}

import {  Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IHeaderLinks } from 'src/app/layout/model/header';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import {
  PaymentSource,
  PaymentMethod
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { mapToV4Route } from 'src/app/shared/service/route/v4-route-mapper';
import { MatDialog } from '@angular/material/dialog';

/**
 * V4 counterpart of the classic `CommonOnInitService` quick-action handlers,
 * scoped to the favorites drawer. Each method opens the **v4** modal / flow (or
 * navigates to the v4 route) for a quick-action tile — the drawer's switch just
 * delegates here. Modal components are lazy-loaded via dynamic `import()` so the
 * eagerly-loaded header chunk stays lean.
 */
@Injectable({ providedIn: 'root' })
export class FavoriteCommonOnInitV4Service {
  private router = inject(Router);
  private paymentsV4Service = inject(PaymentsV4Service);
  private commonOnInitService = inject(CommonOnInitService);
  private dialog = inject(MatDialog);

  navigateTo(url: string): void {
    this.router.navigateByUrl(url);
  }

  // ---- Pay / Request toggle ----------------------------------------------

  pay(): void {
    this.paymentsV4Service.openSendModal();
  }

  request(): void {
    this.paymentsV4Service.openReceiveModal();
  }

  // ---- Tile actions -------------------------------------------------------

  /** ACH → Send Payment modal pre-set to Bank Account → ACH. */
  ach(): void {
    this.paymentsV4Service.openSendModal({
      paymentSource: PaymentSource.BankAccount,
      paymentMethod: PaymentMethod.ACH
    });
  }

  /**
   * Import Check → v4 check list page, then open the Excel/CSV check import
   * modal — the v4 counterpart of the classic `cheque/multi_import/step1` page.
   */
  async importCheck(): Promise<void> {
        await this.router.navigateByUrl('/v4/manage/payments-out/detailed/check');
    const { V4ExcelImportComponent } = await import(
      '../../../../shared/modal/v4-thirdparty-imports/v4-excel-import/v4-excel-import/v4-excel-import.component'
    );
    this.dialog.open(V4ExcelImportComponent, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { type: 'checks' }
    });
  }

  /** Blank Checks → v4 check list page, then open the blank check modal. */
  async blankChecks(): Promise<void> {
        await this.router.navigateByUrl('/v4/manage/payments-out/detailed/check');
    const { BlankCheckModalV4Component } = await import(
      '../../../../modules/payments-v4/send-payment/components/modals/blank-check-modal-v4/blank-check-modal-v4.component'
    );
    this.dialog.open(BlankCheckModalV4Component, {
      maxWidth: '450px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { hideDemoVideo: true }
    });
  }

  /** Shipping Label → (no v4 page yet) reuse the permission-gated v3 route. */
  shippingLabel(): void {
    this.commonOnInitService.goToShippingLabel();
  }

  /** Positive Pay → permission check then v4 positive-pay page (layout-aware). */
  positivePay(): void {
    this.commonOnInitService.checkPostivePayPermission();
  }

  /** Fallback for any tile not explicitly handled: map its v3 routerLink to v4. */
  openByRouterLink(tile: IHeaderLinks): void {
    if (tile.routerLink) {
      this.navigateTo(mapToV4Route(tile.routerLink));
    }
  }
}

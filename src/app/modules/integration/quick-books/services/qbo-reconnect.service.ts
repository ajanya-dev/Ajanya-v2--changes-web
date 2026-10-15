import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { QboReconnectModalComponent } from '../modals/qbo-reconnect-modal/qbo-reconnect-modal.component';
import { QboReconnectModalV35Component } from '../modals/qbo-reconnect-modal/qbo-reconnect-modal-v35.component';

/**
 * The `errorCode` a QuickBooks Online request fails with once the company's
 * OAuth grant has expired. The user cannot recover from it by retrying — the
 * company has to be disconnected and connected again — so it is handled
 * globally by both error interceptors rather than per screen.
 */
export const QBO_COMPANY_EXPIRED_CODE = 4501;

/**
 * The body of a 4501 response.
 *
 * `errorMsg` arrives as HTML (`<br>`, `<b>` around the company name), so the
 * prompt renders it as markup rather than as plain text.
 *
 * Note the casing seam: the company id comes back as `data.realmId` here, but
 * the disconnect endpoint expects it as `RealmId`. `IntegrationService`
 * already owns that translation.
 */
export interface IQboExpiredCompanyError {
  errorMsg?: string;
  errorCode?: number | string;
  data?: { realmId?: string };
}

/** Which era's dialog to open — the v3 app must not get v4 chrome. */
export type TQboReconnectVariant = 'v3' | 'v4';

/**
 * Opens the "company access expired" recovery for QuickBooks Online.
 *
 * Both error interceptors route 4501 here and each names its own era, so the
 * dialog matches the app around it — the v3 screens must not be handed v4
 * chrome. The reconnect itself is shared: both dialogs extend
 * `QboReconnectModalBase`, which keeps them on screen — showing a spinner on
 * the button — from the moment Reconnect is pressed until the browser leaves
 * for QuickBooks.
 */
@Injectable({ providedIn: 'root' })
export class QboReconnectService {
  private dialog = inject(MatDialog);

  /**
   * True while the dialog is open. A single screen can fire several QuickBooks
   * requests at once — five import buttons hit five endpoints — and every one
   * of them would fail with 4501, so without this the user would get a stack
   * of identical dialogs.
   */
  private isOpen = false;

  /**
   * @description Opens the expired-company prompt for a 4501.
   * @param error - The 4501 response body.
   * @param variant - Which era's dialog to show.
   */
  promptReconnect(
    error: IQboExpiredCompanyError | undefined,
    variant: TQboReconnectVariant
  ): void {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;

    const component =
      variant === 'v4'
        ? QboReconnectModalComponent
        : QboReconnectModalV35Component;

    this.dialog
      .open(component, {
        maxWidth: '410px',
        width: '95%',
        // Once the disconnect has gone out the reconnect must not be
        // interrupted half way through.
        disableClose: true,
        panelClass:
          variant === 'v4' ? 'v4_alert_wrapper' : 'paddingless-modal-rounded',
        data: {
          message:
            error?.errorMsg ??
            'Your company access has expired. Please reconnect your QuickBooks company.',
          realmId: error?.data?.realmId ?? ''
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.isOpen = false;
      });
  }
}

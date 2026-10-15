import { Directive, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';

/** What the interceptor hands this modal from the 4501 body. */
export interface IQboReconnectModalData {
  /** `errorMsg`, which arrives as HTML naming the expired company. */
  message: string;
  /** The company to disconnect; empty when the response carried none. */
  realmId: string;
}

/**
 * @description The reconnect behind the "company access expired" prompt.
 *
 * Pressing Reconnect does not close the dialog — that is the whole point of
 * this being a component rather than the shared confirm alert. The button
 * turns into a spinner and the dialog holds, through the disconnect and then
 * the connect, until the browser leaves for QuickBooks. Closing on the click
 * would drop the user back on an unchanged page with two silent requests in
 * flight.
 *
 * View-agnostic: the V3 and V4 dialogs are two templates over this one
 * implementation, so each renders in its own era's chrome.
 */
@Directive()
export abstract class QboReconnectModalBase {
  protected dialogRef = inject<MatDialogRef<unknown, boolean>>(MatDialogRef);
  protected integrationService = inject(IntegrationService);
  protected data = inject<IQboReconnectModalData>(MAT_DIALOG_DATA);

  /** Drives the button's spinner and keeps the dialog open. */
  isReconnecting = signal(false);

  message = this.data?.message ?? '';

  cancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * @description Disconnects the expired company, then starts the connect
   * flow. QuickBooks will not issue a fresh grant while a stale one is held,
   * so the order matters. No success alert is shown for the disconnect — it is
   * a step of the reconnect, not something the user asked for.
   */
  reconnect(): void {
    if (this.isReconnecting()) return;
    this.isReconnecting.set(true);

    const realmId = this.data?.realmId;
    if (!realmId) {
      // Nothing to disconnect, but the connect flow is still where the user
      // re-authorises.
      this.connect();
      return;
    }

    this.integrationService.disconnectToQuickBooksOnline(realmId).subscribe({
      next: (res) => (res?.success ? this.connect() : this.stop()),
      error: () => this.stop()
    });
  }

  /**
   * @description Hands the browser to QuickBooks, matching what the
   * "Add New Company" button does. This is the only path that closes the
   * dialog on success — the page is leaving.
   */
  private connect(): void {
    this.integrationService.connectToQuickBooksOnline().subscribe({
      next: (res) => {
        if (res?.success && res?.redirectUrl) {
          this.dialogRef.close(true);
          window.open(res.redirectUrl, '_self');
          return;
        }
        this.stop();
      },
      error: () => this.stop()
    });
  }

  /**
   * @description Returns to the prompt after a failed step. The dialog stays
   * open so the user can retry — the interceptor has already shown them why it
   * failed.
   */
  private stop(): void {
    this.isReconnecting.set(false);
  }
}

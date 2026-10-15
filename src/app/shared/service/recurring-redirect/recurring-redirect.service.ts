import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

export type RecurringDeliveryType = 'email' | 'mail' | 'ach';

export interface IRecurringRedirectInfo {
  /** true = recurring payment, false = one-time scheduled payment. */
  isRecurring: boolean;
  /** Which delivery the payment used, drives the recurring-table sub-tab. */
  delivery: RecurringDeliveryType;
}

/**
 * Shared, single source of truth for "the payment that just completed was set up
 * as recurring / scheduled". A delivery flow (email / mail / ACH modal or the ACH
 * send flow) calls `mark()` at the exact point the payment completes; the success
 * modal calls `consume()` once when it opens to decide the success message and the
 * "View Payment" redirect (recurring table with the matching sub-tab pre-selected).
 *
 * Used by both the v3 and v4 success modals.
 */
@Injectable({ providedIn: 'root' })
export class RecurringRedirectService {
  /**
   * Recurring-table sub-tab index. Identical for the v3 table
   * (`/manage/checkmailing/recurring?tab=N`) and the v4 table
   * (`/v4/manage/payments-out/detailed/recurring?tab=N`):
   * 1 = Mailed Checks, 2 = ACH, 3 = Emailed Checks.
   */
  static readonly TAB_INDEX: Record<RecurringDeliveryType, number> = {
    mail: 1,
    ach: 2,
    email: 3
  };

  static readonly V4_RECURRING_ROUTE =
    '/v4/manage/payments-out/detailed/recurring';

  private router = inject(Router);

  private pending: IRecurringRedirectInfo | null = null;

  /** Flag that a recurring/scheduled payment just completed. */
  mark(delivery: RecurringDeliveryType, isRecurring: boolean): void {
    this.pending = { delivery, isRecurring };
  }

  /** Read and clear the pending info. Call once when the success modal opens. */
  consume(): IRecurringRedirectInfo | null {
    const info = this.pending;
    this.pending = null;
    return info;
  }

  /** Clear any stale info. Call when a new send flow starts. */
  reset(): void {
    this.pending = null;
  }

  /** Sub-tab index for a delivery type. */
  tabIndex(delivery: RecurringDeliveryType): number {
    return RecurringRedirectService.TAB_INDEX[delivery];
  }

  /**
   * For flows that close a delivery modal without a success modal (Payments Out):
   * consume the pending info and, when there is one, open the v4 recurring table
   * on the matching sub-tab. Returns whether it navigated.
   */
  redirectPendingToV4Recurring(): boolean {
    const info = this.consume();
    if (!info) {
      return false;
    }
    this.router.navigate([RecurringRedirectService.V4_RECURRING_ROUTE], {
      queryParams: { tab: this.tabIndex(info.delivery) }
    });
    return true;
  }
}

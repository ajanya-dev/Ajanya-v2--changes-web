import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Cross-component events for the v4 wallet page.
 *
 * `CommonLayoutV4Component` renders the wallet detail card and the transactions
 * grid as two sibling dynamic components, so neither holds a reference to the
 * other. This carries the few messages that have to cross that gap.
 *
 * It lives here rather than on `WalletDataV35Service` because that service sits
 * under the frozen `wallet-v3` tree.
 */
@Injectable({ providedIn: 'root' })
export class WalletV4EventsService {
  /**
   * Fired when something outside the detail card wants the "Send Money" flow —
   * today the transactions grid's empty-state CTA. The flow itself (onboarding
   * redirect, verification gate, payment payload, route) stays in
   * `WalletDetailsV4Component`, which is always mounted alongside the grid, so
   * there is exactly one copy of it.
   */
  readonly sendMoneyRequested$ = new Subject<void>();
}

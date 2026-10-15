import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4AchRecurringListComponent } from './v4-ach-recurring-list/v4-ach-recurring-list.component';
import { V4CheckRecurringListComponent } from './v4-check-recurring-list/v4-check-recurring-list.component';
import { V4EmailRecurringListComponent } from './v4-email-recurring-list/v4-email-recurring-list.component';
import { V4GiftCardRecurringListComponent } from './v4-gift-card-recurring-list/v4-gift-card-recurring-list.component';

const TAB_INDEX_MAP: Record<number, string> = {
  1: 'mailed-checks',
  2: 'ach',
  3: 'emailed-checks',
  4: 'gift-card'
};

/**
 * @description Represents check recurring component.
 */
@Component({
  selector: 'app-v4-check-recurring',
  templateUrl: './v4-check-recurring.component.html',
  styleUrls: ['./v4-check-recurring.component.scss'],
  standalone: true,
  imports: [
    V4CheckRecurringListComponent,
    V4AchRecurringListComponent,
    V4EmailRecurringListComponent,
    V4GiftCardRecurringListComponent,
    CommonTabV4Component
  ]
})
export class V4CheckRecurringComponent implements OnInit {
  activeTab = signal('mailed-checks');

  recurringTabs: ITabItem[] = [
    { label: 'Mailed Checks', value: 'mailed-checks' },
    { label: 'Emailed Checks', value: 'emailed-checks' },
    { label: 'ACH', value: 'ach' },
    { label: 'Gift Card', value: 'gift-card' }
  ];

  isFromPaymentsV3 = input(false);
  deepLinkRowId = signal('');
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tabParam = params.get('tab');
      if (tabParam && !Number.isNaN(Number(tabParam))) {
        const mapped = TAB_INDEX_MAP[Number(tabParam)];
        if (mapped) this.activeTab.set(mapped);
      }
      const initiatorId = params.get('initiator_id');
      if (initiatorId) {
        this.deepLinkRowId.set(initiatorId);
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { initiator_id: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });
  }

  /**
   * Mirrors the picked sub-tab into `?tab=`, so a later redirect to a sub-tab
   * (e.g. the success modal's "View Payment") is never a same-URL no-op.
   */
  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    const index = Object.keys(TAB_INDEX_MAP).find(
      (key) => TAB_INDEX_MAP[Number(key)] === tab
    );
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: index },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}

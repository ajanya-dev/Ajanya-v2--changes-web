import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule
} from '@angular/router';
import { filter } from 'rxjs';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { PaymentsInHeaderV4Component } from '../../components/payments-in-header-v4/payments-in-header-v4.component';
import { PaymentsInTabService } from '../../services/payments-in-tab.service';

@Component({
  selector: 'app-payments-in-page-v4',
  templateUrl: './payments-in-page-v4.component.html',
  styleUrls: ['./payments-in-page-v4.component.scss'],
  standalone: true,
  imports: [RouterModule, PaymentsInHeaderV4Component, CommonTabV4Component]
})
export class PaymentsInPageV4Component implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paymentsInTabService = inject(PaymentsInTabService);
  private destroyRef = inject(DestroyRef);

  /** Tab values are the child route paths — the URL is the source of truth. */
  readonly mainTabs: ITabItem[] = [
    { label: 'All', value: 'detailed' },
    { label: 'Recurring', value: 'recurring' },
    { label: 'e-Payments', value: 'e-payments' }
  ];

  activeMainTab = signal('detailed');

  ngOnInit(): void {
    this.syncTabFromUrl();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncTabFromUrl());

    this.paymentsInTabService.onTabSwitch
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const currentTab = this.route.firstChild?.snapshot.url[0]?.path;
        if (currentTab === data.tab) {
          // Already on this tab – navigate away briefly to force component re-creation
          const tempTab = data.tab === 'detailed' ? 'overview' : 'detailed';
          this.router
            .navigate([tempTab], {
              relativeTo: this.route,
              skipLocationChange: true
            })
            .then(() =>
              this.router.navigate([data.tab], { relativeTo: this.route })
            );
        } else {
          this.router.navigate([data.tab], { relativeTo: this.route });
        }
      });
  }

  onMainTabChange(value: string): void {
    this.router.navigate([value], { relativeTo: this.route });
  }

  private syncTabFromUrl(): void {
    const path = this.route.firstChild?.snapshot.url[0]?.path;
    if (path && this.mainTabs.some((tab) => tab.value === path)) {
      this.activeMainTab.set(path);
    }
  }
}

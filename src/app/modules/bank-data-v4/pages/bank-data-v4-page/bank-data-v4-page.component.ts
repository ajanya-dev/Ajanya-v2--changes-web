import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { TBankDataV4Tab } from '../../models/bank-data-v4.types';
import { BankDataV4TransactionsStateService } from '../../services/bank-data-v4-transactions-state.service';

@Component({
  selector: 'app-bank-data-v4-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterOutlet,
    CommonTabV4Component,
    V4PageHeaderComponent
  ],
  templateUrl: './bank-data-v4-page.component.html',
  providers: [V3DataTableService, BankDataV4TransactionsStateService],
  animations: [
    trigger('headerEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '250ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ])
  ]
})
export class BankDataV4PageComponent implements OnDestroy {
  private state = inject(BankDataV4TransactionsStateService);
  private router = inject(Router);
  private routerSub: Subscription;

  readonly tabs: ITabItem[] = [
    { label: 'Overview', value: 'overview', lucideIcon: 'trending-up' },
    { label: 'Transactions', value: 'transactions', lucideIcon: 'receipt' },
    { label: 'Rules', value: 'rules', lucideIcon: 'file-text' },
    { label: 'Accounts', value: 'accounts', lucideIcon: 'building-2' },
    { label: 'Company', value: 'company', lucideIcon: 'briefcase' },
    { label: 'Category', value: 'category', lucideIcon: 'tag' }
  ];

  activeTab = signal<TBankDataV4Tab>(this.getTabFromUrl());

  constructor() {
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.activeTab.set(this.getTabFromUrl());
      });
  }

  onTabChange(tab: string): void {
    this.router.navigate([tab], { relativeTo: this.getActivatedRoute() });
  }

  ngOnDestroy(): void {
    this.state.destroy();
    this.routerSub.unsubscribe();
  }

  private getTabFromUrl(): TBankDataV4Tab {
    const { url } = this.router;
    const segments = url.split('/');
    const lastSegment = segments[segments.length - 1]?.split('?')[0];
    const validTabs: TBankDataV4Tab[] = [
      'overview',
      'transactions',
      'rules',
      'accounts',
      'company',
      'category'
    ];
    return validTabs.includes(lastSegment as TBankDataV4Tab)
      ? (lastSegment as TBankDataV4Tab)
      : 'transactions';
  }

  private getActivatedRoute() {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.parent;
  }
}

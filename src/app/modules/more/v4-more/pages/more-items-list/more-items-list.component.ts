import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs';
import { LUCIDE_ICONS_V4 } from 'src/app/shared/V4/lucide-icons';
import { MatDialog } from '@angular/material/dialog';
import { CalculatorModalV4Component } from '../../modals/calculator-modal-v4/calculator-modal-v4.component';

interface MoreItem {
  title: string;
  description: string;
  icon: string;
  iconBg: string;
  iconBgLight: string;
  route: string;
  comingSoon?: boolean;
}

const MORE_ITEMS: MoreItem[] = [
  {
    title: 'Category',
    description: 'Organize and manage transaction categories',
    icon: 'list',
    iconBg: 'var(--v4-common-blue-color)',
    iconBgLight: 'rgba(59,130,246,0.12)',
    route: '/v4/manage/checkcatagory/index'
  },
  {
    title: 'Recharge My Credits',
    description: 'Purchase credits to use for payments and services',
    icon: 'dollar-sign',
    iconBg: 'var(--v4-common-green-color)',
    iconBgLight: 'rgba(34,197,94,0.12)',
    route: '/v4/manage/refill-credit/show-refillform'
  },
  {
    title: 'Calculator',
    description: 'Quick access to financial calculation tools',
    icon: 'calculator',
    iconBg: 'var(--v4-accent-violet-color)',
    iconBgLight: 'rgba(139,92,246,0.12)',
    route: '/calculator'
  },
  {
    title: 'Check Report',
    description: 'View detailed reports and analytics for check payments',
    icon: 'file-text',
    iconBg: 'var(--v4-primary-brand-color)',
    iconBgLight: 'rgba(59,130,246,0.12)',
    route: '/v4/manage/cheque/v4-check-report'
  },
  {
    title: 'Refer & Earn',
    description: 'Earn rewards by referring new users to Zil Money',
    icon: 'gift',
    iconBg: '#e91e8c',
    iconBgLight: 'rgba(233,30,140,0.12)',
    route: '/v4/manage/more/refer',
    comingSoon: true
  },
  {
    title: 'My Credits Statement',
    description: 'View your complete credit transaction history',
    icon: 'receipt',
    iconBg: 'var(--v4-common-yellow-color)',
    iconBgLight: 'rgba(234,179,8,0.12)',
    route: '/v4/manage/financialstatement/index'
  },
  {
    title: 'Billing/Plan',
    description: 'Manage your subscription and billing information',
    icon: 'credit-card',
    iconBg: 'var(--v4-common-red-color)',
    iconBgLight: 'rgba(239,68,68,0.12)',
    route: '/v4/manage/subscription/plan'
  },
  {
    title: 'Developer Panel',
    description: 'Access API keys, webhooks, and developer tools',
    icon: 'code',
    iconBg: 'var(--v4-badge-neutral-text-color)',
    iconBgLight: 'rgba(71,85,105,0.12)',
    route: '/v4/manage/developer/index'
  },
  {
    title: 'Report',
    description: 'Generate and download various business reports',
    icon: 'bar-chart-2',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(14,165,233,0.12)',
    route: '/v4/manage/more/report'
  },
  {
    title: 'Notifications',
    description: 'View and manage all your alerts and updates',
    icon: 'bell',
    iconBg: 'var(--v4-common-blue-color)',
    iconBgLight: 'rgba(59,130,246,0.12)',
    route: '/v4/manage/more/notification/show'
  },
];

@Component({
  selector: 'app-more-items-list',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  providers: [Location],
  templateUrl: './more-items-list.component.html',
  styleUrl: './more-items-list.component.scss'
})
export class MoreItemsListComponent implements OnInit {
  readonly icons = LUCIDE_ICONS_V4;
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  searchQuery = signal('');
  loadingRoute = signal<string | null>(null);

  filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return MORE_ITEMS;
    return MORE_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  });

  constructor(
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.loadingRoute.set(null));
  }

  goBack(): void {
    this.location.back();
  }

  navigate(route: string): void {
    if (route === '/calculator') {
      this.openCalculatorModal();
      return;
    }
    this.loadingRoute.set(route);
    this.router.navigateByUrl(route);
  }

  openCalculatorModal(): void {
    this.dialog.open(CalculatorModalV4Component, {
      maxWidth: '380px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded'
    });
  }
}

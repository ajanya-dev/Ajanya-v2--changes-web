import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import {
  OverviewCardsV4Component,
  IOverviewSummaryCard
} from 'src/app/shared/V4/overview-cards-v4/overview-cards-v4.component';
import {
  VendorStatusChartV4Component,
  IVendorData
} from 'src/app/shared/V4/vendor-status-chart-v4/vendor-status-chart-v4.component';
import {
  RevenueChartLineGraphV4Component,
  IRevenueTimelineData
} from 'src/app/shared/V4/revenue-chart-line-graph-v4/revenue-chart-line-graph-v4.component';
import {
  InvoiceService,
  IInvoiceRiskIndicators
} from 'src/app/shared/service/invoice/invoice.service';
import {
  RiskCardV4Component,
  IRiskCard
} from 'src/app/shared/V4/risk-card-v4/risk-card-v4.component';

@Component({
  selector: 'app-v4-invoice-overview',
  standalone: true,
  templateUrl: './v4-invoice-overview.component.html',
  styleUrl: './v4-invoice-overview.component.scss',
  imports: [
    OverviewCardsV4Component,
    RevenueChartLineGraphV4Component,
    VendorStatusChartV4Component,
    RiskCardV4Component
  ]
})
export class V4InvoiceOverviewComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private destroyRef = inject(DestroyRef);

  switchToDetailedView = output<void>();

  isLoading = signal(true);
  private riskIndicators = signal<IInvoiceRiskIndicators | null>(null);

  statsCards = signal<IOverviewSummaryCard[]>([
    {
      title: 'UNPAID THIS MONTH',
      primaryValue: '0',
      secondaryValue: '$0.0k',
      valueColor: 'orange'
    },
    {
      title: 'PAID THIS MONTH',
      primaryValue: '0',
      secondaryValue: '$0.0k',
      valueColor: 'green'
    },
    {
      title: 'OVERDUE THIS MONTH',
      primaryValue: '0',
      secondaryValue: '$0.0k',
      valueColor: 'red'
    },
    {
      title: 'TOTAL THIS MONTH',
      primaryValue: '0',
      secondaryValue: '$0.0k',
      valueColor: 'neutral'
    },
    { title: 'AVG COLLECTION', primaryValue: '$0.00', valueColor: 'blue' }
  ]);

  revenueData = signal<IRevenueTimelineData[]>([]);
  clientData = signal<IVendorData[]>([]);

  riskCards = computed<IRiskCard[]>(() => {
    const r = this.riskIndicators();
    if (!r) return [];
    return [
      {
        label: 'Overdue',
        count: r.overdue.count,
        subLabel: `$${r.overdue.amount.toLocaleString()}`,
        icon: 'alert-circle',
        badge: 'red'
      },
      {
        label: 'Due This Week',
        count: r.dueThisWeek.count,
        subLabel: `$${r.dueThisWeek.amount.toLocaleString()}`,
        icon: 'calendar-clock',
        badge: 'orange'
      },
      {
        label: 'Upcoming',
        count: r.upcoming.count,
        subLabel: `$${r.upcoming.amount.toLocaleString()}`,
        icon: 'calendar',
        badge: 'blue'
      },
      {
        label: 'Duplicates',
        count: r.duplicates.count,
        subLabel: 'Review needed',
        icon: 'copy',
        badge: 'purple'
      },
      {
        label: 'High Value',
        count: r.highValue.count,
        subLabel: `$${r.highValue.amount.toLocaleString()}`,
        icon: 'dollar-sign',
        badge: 'green'
      }
    ];
  });

  ngOnInit(): void {
    forkJoin({
      stats: this.invoiceService.getInvoiceOverviewStats(),
      timeline: this.invoiceService.getInvoiceRevenueTimeline(),
      clients: this.invoiceService.getInvoiceTopClients(),
      risk: this.invoiceService.getInvoiceRiskIndicators()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ stats, timeline, clients, risk }) => {
          this.statsCards.set([
            {
              title: 'UNPAID THIS MONTH',
              primaryValue: String(stats.unpaidThisMonth.count),
              secondaryValue: `$${stats.unpaidThisMonth.amount}`,
              valueColor: 'orange'
            },
            {
              title: 'PAID THIS MONTH',
              primaryValue: String(stats.paidThisMonth.count),
              secondaryValue: `$${stats.paidThisMonth.amount}`,
              valueColor: 'green'
            },
            {
              title: 'OVERDUE THIS MONTH',
              primaryValue: String(stats.overdueThisMonth.count),
              secondaryValue: `$${stats.overdueThisMonth.amount}`,
              valueColor: 'red'
            },
            {
              title: 'TOTAL THIS MONTH',
              primaryValue: String(stats.totalThisMonth.count),
              secondaryValue: `$${stats.totalThisMonth.amount}`,
              valueColor: 'neutral'
            },
            {
              title: 'AVG COLLECTION',
              primaryValue: `$${Number(stats.averageCollection).toFixed(2)}`,
              valueColor: 'blue'
            }
          ]);
          this.revenueData.set(timeline);
          this.clientData.set(clients);
          this.riskIndicators.set(risk);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  OverviewCardsV4Component,
  IOverviewSummaryCard
} from 'src/app/shared/V4/overview-cards-v4/overview-cards-v4.component';
import {
  CashFlowForecastComponent,
  ICashFlowPoint
} from './cash-flow-forecast/cash-flow-forecast.component';
import {
  SpendingTrendsComponent,
  ISpendingTrend,
  CATEGORY_COLORS
} from './spending-trends/spending-trends.component';
import { BankDataV4ApiService } from '../../../services/bank-data-v4-api.service';
import { BankDataV4TransactionsStateService } from '../../../services/bank-data-v4-transactions-state.service';

interface ITransactionTotals {
  total: string;
  count: number;
  credit: string;
  debit: number;
  activeRulesCount: number;
}

@Component({
  selector: 'app-bank-data-v4-overview-tab',
  standalone: true,
  imports: [
    OverviewCardsV4Component,
    CashFlowForecastComponent,
    SpendingTrendsComponent
  ],
  templateUrl: './bank-data-v4-overview-tab.component.html'
})
export class BankDataV4OverviewTabComponent implements OnInit {
  private api = inject(BankDataV4ApiService);
  private state = inject(BankDataV4TransactionsStateService);

  readonly cardsLoading = signal(true);
  readonly cashFlowLoading = signal(true);
  readonly spendingLoading = signal(true);
  readonly cashFlowData = signal<ICashFlowPoint[]>([]);
  readonly spendingTrendsData = signal<ISpendingTrend[]>([]);
  readonly totalsData = signal<ITransactionTotals | null>(null);

  readonly metricCards = computed<IOverviewSummaryCard[]>(() => {
    const totals = this.totalsData();
    const total = Number(totals?.total) || 0;
    const count = totals?.count ?? 0;
    const activeRules = totals?.activeRulesCount ?? 0;

    return [
      {
        title: 'Total Balance',
        primaryValue: `$${total.toLocaleString()}`,
        secondaryValue: `${count} transactions`,
        valueColor: 'green',
        showDollarIcon: true
      },
      {
        title: 'Active Rules',
        primaryValue: String(activeRules),
        secondaryValue: 'Auto-categorization rules',
        valueColor: 'green'
      }
    ];
  });

  ngOnInit(): void {
    this.state.loadIndex();
    this.loadTransactionTotals();
    this.loadIncomeExpenseChart();
    this.loadSpendingTrends();
  }

  private loadTransactionTotals(): void {
    this.cardsLoading.set(true);
    this.api.getTransactionTotal({} as never).subscribe({
      next: (res: { success?: boolean; data?: ITransactionTotals }) => {
        if (res?.success && res.data) {
          this.totalsData.set(res.data);
        }
        this.cardsLoading.set(false);
      },
      error: () => this.cardsLoading.set(false)
    });
  }

  private loadIncomeExpenseChart(): void {
    this.cashFlowLoading.set(true);
    this.api.getIncomeExpenseChart().subscribe({
      next: (res: {
        success?: boolean;
        data?: { cashFlowForecast?: ICashFlowPoint[] };
      }) => {
        if (res?.success && res.data) {
          const items = res.data.cashFlowForecast ?? [];
          this.cashFlowData.set(
            items.map((item) => ({
              day: Number(item.day) || 0,
              income: Number(item.income) || 0,
              expense: Number(item.expense) || 0
            }))
          );
        }
        this.cashFlowLoading.set(false);
      },
      error: () => this.cashFlowLoading.set(false)
    });
  }

  private loadSpendingTrends(): void {
    this.spendingLoading.set(true);
    this.api.getSpendingTrendsByCategory().subscribe({
      next: (res: {
        success?: boolean;
        data?: { spendingTrends?: ISpendingTrend[] };
      }) => {
        if (res?.success && res.data) {
          const items = res.data.spendingTrends ?? [];
          this.spendingTrendsData.set(
            items.map((item, i) => ({
              category: item.category ?? 'Unknown',
              amount: Number(item.amount) || 0,
              trend: Number(item.trend) || 0,
              isAnomaly: item.isAnomaly ?? false,
              history: item.history ?? [],
              color: item.color ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length]
            }))
          );
        }
        this.spendingLoading.set(false);
      },
      error: () => this.spendingLoading.set(false)
    });
  }
}

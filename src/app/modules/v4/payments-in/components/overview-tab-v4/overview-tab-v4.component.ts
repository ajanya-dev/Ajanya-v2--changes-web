import { Component, OnInit, effect, inject, signal } from '@angular/core';
import {
  IOverviewSummaryCard,
  OverviewCardsV4Component
} from 'src/app/shared/V4/overview-cards-v4/overview-cards-v4.component';
import {
  IPaymentInsights,
  PaymentInsightsPanelV4Component
} from 'src/app/shared/V4/payment-insights-panel-v4/payment-insights-panel-v4.component';
import { PaymentReceiptTimelineV4Component } from 'src/app/shared/V4/payment-receipt-timeline-v4/payment-receipt-timeline-v4.component';
import {
  IVendorData,
  VendorStatusChartV4Component
} from 'src/app/shared/V4/vendor-status-chart-v4/vendor-status-chart-v4.component';
import { PaymentsInService } from 'src/app/modules/receive-payments/services/payments-in-v4.service';

@Component({
  standalone: true,
  selector: 'app-overview-tab-v4',
  templateUrl: './overview-tab-v4.component.html',
  styleUrls: ['./overview-tab-v4.component.scss'],
  imports: [
    OverviewCardsV4Component,
    PaymentReceiptTimelineV4Component,
    VendorStatusChartV4Component,
    PaymentInsightsPanelV4Component
  ]
})
export class OverviewTabV4Component implements OnInit {
  private paymentsInService = inject(PaymentsInService);

  summaryCards = signal<IOverviewSummaryCard[]>([]);
  isLoading = signal(false);
  vendorData = signal<IVendorData[]>([]);
  isLoadingVendors = signal(false);
  insights = signal<IPaymentInsights | null>(null);

  constructor() {
    effect(
      () => {
        const trigger = this.paymentsInService.refreshTrigger();
        if (trigger > 0) this.loadData();
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.paymentsInService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res?.success && res?.data) {
          const s = res.data.summary;
          const m = res.data.metrics;
          if (s) {
            this.summaryCards.set([
              {
                title: 'RECEIVED THIS MONTH',
                primaryValue: String(s.received_this_month_count ?? 0),
                secondaryValue: this.formatAmount(
                  s.received_this_month_amount ?? 0
                ),
                valueColor: 'green'
              },
              {
                title: 'NEW / AWAITING',
                primaryValue: String(s.new_count ?? 0),
                secondaryValue: this.formatAmount(s.new_amount ?? 0),
                valueColor: 'blue'
              },
              {
                title: 'PENDING',
                primaryValue: String(s.pending_count ?? 0),
                secondaryValue: this.formatAmount(s.pending_amount ?? 0),
                valueColor: 'orange'
              },
              {
                title: 'TOTAL RECEIVED',
                primaryValue: String(s.total_count ?? 0),
                secondaryValue: this.formatAmount(s.total_amount ?? 0),
                valueColor: 'neutral'
              },
              {
                title: 'AVG RECEIPT TIME',
                primaryValue: '',
                secondaryValue: '',
                valueColor: 'neutral',
                comingSoon: true
              }
            ]);
          }
          if (s && m) {
            this.insights.set({
              newCount: s.new_count ?? 0,
              pendingCount: s.pending_count ?? 0,
              rejectedCount: s.rejected_count ?? 0,
              highValueCount: m.high_value_count ?? 0,
              highValueThreshold: m.high_value_threshold ?? 0,
              recurringCount: m.recurring_count ?? 0
            });
          }
        }
      },
      error: () => this.isLoading.set(false),
      complete: () => this.isLoading.set(false)
    });

    this.isLoadingVendors.set(true);
    this.paymentsInService.getTopPayers().subscribe({
      next: (res) => {
        if (res?.success && res?.data?.payers) {
          this.vendorData.set(
            res.data.payers.map((p) => ({
              name: p.payer_name ?? '',
              paid: p.paid_amount ?? 0,
              overdue: p.overdue_amount ?? 0,
              pending: p.pending_amount ?? 0,
              total: p.total_amount ?? 0
            }))
          );
        }
      },
      error: () => this.isLoadingVendors.set(false),
      complete: () => this.isLoadingVendors.set(false)
    });
  }

  private formatAmount(amount: number): string {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}

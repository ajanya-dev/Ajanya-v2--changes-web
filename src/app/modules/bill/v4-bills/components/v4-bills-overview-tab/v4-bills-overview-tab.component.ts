import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IOverviewSummaryCard,
  OverviewCardsV4Component
} from 'src/app/shared/V4/overview-cards-v4/overview-cards-v4.component';
import {
  IPaymentReceiptTimelineData,
  PaymentReceiptTimelineV4Component
} from 'src/app/shared/V4/payment-receipt-timeline-v4/payment-receipt-timeline-v4.component';
import {
  IVendorData,
  VendorStatusChartV4Component
} from 'src/app/shared/V4/vendor-status-chart-v4/vendor-status-chart-v4.component';
import {
  BillService,
  IBillQuickCard,
  IBillRiskIndicator
} from 'src/app/shared/service/Bill/bill.service';
import { V4BillRiskIndicatorsComponent } from '../v4-bill-risk-indicators/v4-bill-risk-indicators.component';

const TIMELINE_LABEL_MAP: Record<string, string> = {
  '-14': '-14',
  '-7': '-7',
  '-3': '-3',
  0: '0',
  3: '3',
  7: '7',
  14: '14'
};

@Component({
  selector: 'app-v4-bills-overview-tab',
  standalone: true,
  imports: [
    OverviewCardsV4Component,
    PaymentReceiptTimelineV4Component,
    VendorStatusChartV4Component,
    V4BillRiskIndicatorsComponent
  ],
  templateUrl: './v4-bills-overview-tab.component.html',
  styleUrls: ['./v4-bills-overview-tab.component.scss']
})
export class V4BillsOverviewTabComponent implements OnInit {
  private billService = inject(BillService);
  private destroyRef = inject(DestroyRef);

  summaryCards = signal<IOverviewSummaryCard[]>([]);
  isLoading = signal(false);
  timelineData = signal<IPaymentReceiptTimelineData>({
    bars: [],
    onTimePercent: 0,
    earlyAmount: '$0',
    onTimeAmount: '$0',
    lateAmount: '$0'
  });

  isLoadingTimeline = signal(false);
  vendorData = signal<IVendorData[]>([]);
  isLoadingVendors = signal(false);
  riskIndicators = signal<IBillRiskIndicator[]>([]);
  isLoadingRisk = signal(false);

  ngOnInit(): void {
    this.loadQuickCards();
    this.loadPaymentTimeline();
    this.loadTopVendors();
    this.loadRiskIndicators();
  }

  private loadQuickCards(): void {
    this.isLoading.set(true);
    this.billService
      .getOverviewQuickCards()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data) {
            const { data } = res;
            const find = (t: string) =>
              data.find((d: IBillQuickCard) => d.type === t);

            const toPay = find('to_pay_this_month');
            const paid = find('paid_this_month');
            const overdue = find('overdue');
            const due = find('due_this_month');
            const avg = find('average_time_to_pay');

            this.summaryCards.set([
              {
                title: 'TO PAY THIS MONTH',
                primaryValue: String(toPay?.count ?? 0),
                secondaryValue: this.formatAmount(toPay?.total_amount ?? 0),
                valueColor: 'orange'
              },
              {
                title: 'PAID THIS MONTH',
                primaryValue: String(paid?.count ?? 0),
                secondaryValue: this.formatAmount(paid?.total_amount ?? 0),
                valueColor: 'green'
              },
              {
                title: 'OVERDUE',
                primaryValue: String(overdue?.count ?? 0),
                secondaryValue: this.formatAmount(overdue?.total_amount ?? 0),
                valueColor: 'red'
              },
              {
                title: 'DUE THIS MONTH',
                primaryValue: String(due?.count ?? 0),
                secondaryValue: this.formatAmount(due?.total_amount ?? 0),
                valueColor: 'blue'
              },
              {
                title: 'AVG TIME',
                primaryValue: `${avg?.average_days ?? 0}d`,
                secondaryValue: 'To payment',
                valueColor: 'neutral'
              }
            ]);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  private loadPaymentTimeline(): void {
    this.isLoadingTimeline.set(true);
    this.billService
      .getOverviewPaymentTimeline()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data?.length) {
            const timelineObj = res.data.find((d) => d.timeline)?.timeline;
            const summaryObj = res.data.find(
              (d) => d.monthly_summary
            )?.monthly_summary;

            if (timelineObj) {
              const bars = Object.entries(timelineObj)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([key, val]) => ({
                  label: TIMELINE_LABEL_MAP[key] ?? key,
                  value: val.count,
                  amount: parseFloat(String(val.amount)) || 0,
                  isToday: key === '0'
                }));

              this.timelineData.set({
                bars,
                onTimePercent: summaryObj?.on_time?.percentage ?? 0,
                earlyAmount: this.formatAmount(
                  parseFloat(String(summaryObj?.early?.amount ?? 0))
                ),
                onTimeAmount: this.formatAmount(
                  parseFloat(String(summaryObj?.on_time?.amount ?? 0))
                ),
                lateAmount: this.formatAmount(
                  parseFloat(String(summaryObj?.late?.amount ?? 0))
                )
              });
            }
          }
        },
        error: () => this.isLoadingTimeline.set(false),
        complete: () => this.isLoadingTimeline.set(false)
      });
  }

  private loadTopVendors(): void {
    this.isLoadingVendors.set(true);
    this.billService
      .getOverviewTopVendors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data) {
            this.vendorData.set(
              res.data.map((v) => ({
                name: v.vendor_name ?? '',
                paid: v.paid?.amount ?? 0,
                overdue: v.overdue?.amount ?? 0,
                pending: v.pending?.amount ?? 0,
                total:
                  (v.paid?.amount ?? 0) +
                  (v.pending?.amount ?? 0) +
                  (v.overdue?.amount ?? 0)
              }))
            );
          }
        },
        error: () => this.isLoadingVendors.set(false),
        complete: () => this.isLoadingVendors.set(false)
      });
  }

  private loadRiskIndicators(): void {
    this.isLoadingRisk.set(true);
    this.billService
      .getOverviewRiskIndicators()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data) {
            this.riskIndicators.set(res.data);
          }
        },
        error: () => this.isLoadingRisk.set(false),
        complete: () => this.isLoadingRisk.set(false)
      });
  }

  private formatAmount(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return num >= 1000 ? `$${(num / 1000).toFixed(1)}k` : `$${num.toFixed(0)}`;
  }
}

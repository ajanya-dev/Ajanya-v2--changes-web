import { Component, computed, input } from '@angular/core';
import { NgClass, CurrencyPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { IBillRiskIndicator } from 'src/app/shared/service/Bill/bill.service';

interface IRiskCardConfig {
  type: IBillRiskIndicator['type'];
  title: string;
  icon: string;
  labelClass: string;
  countClass: string;
  subtitleClass: string;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  dotClass: string;
  hasDot: boolean;
}

const RISK_CARD_CONFIGS: IRiskCardConfig[] = [
  {
    type: 'overdue_bills',
    title: 'OVERDUE',
    icon: 'triangle-alert',
    labelClass: 'text-v4-insight-card-label-text-red',
    countClass: 'text-v4-insight-card-main-number-red',
    subtitleClass: 'text-v4-insight-card-sub-number-red',
    bgClass: 'bg-v4-insight-card-background-red',
    borderClass: 'border-v4-insight-card-border-red',
    iconBgClass: 'bg-v4-insight-card-icon-red text-white',
    dotClass: 'bg-v4-insight-card-icon-red',
    hasDot: true
  },
  {
    type: 'bills_due_this_week',
    title: 'DUE THIS WEEK',
    icon: 'clock',
    labelClass: 'text-v4-insight-card-label-text-orange',
    countClass: 'text-v4-insight-card-main-number-orange',
    subtitleClass: 'text-v4-insight-card-sub-number-orange',
    bgClass: 'bg-v4-insight-card-background-orange',
    borderClass: 'border-v4-insight-card-border-orange',
    iconBgClass: 'bg-v4-insight-card-icon-orange text-white',
    dotClass: 'bg-v4-insight-card-icon-orange',
    hasDot: false
  },
  {
    type: 'upcoming_bills',
    title: 'UPCOMING (30D)',
    icon: 'calendar',
    labelClass: 'text-v4-insight-card-label-text-blue',
    countClass: 'text-v4-insight-card-main-number-blue',
    subtitleClass: 'text-v4-insight-card-sub-number-blue',
    bgClass: 'bg-v4-insight-card-background-blue',
    borderClass: 'border-v4-insight-card-border-blue',
    iconBgClass: 'bg-v4-insight-card-icon-blue text-white',
    dotClass: 'bg-v4-insight-card-icon-blue',
    hasDot: false
  },
  {
    type: 'duplicate_bills',
    title: 'DUPLICATES',
    icon: 'copy',
    labelClass: 'text-v4-insight-card-label-text-purple',
    countClass: 'text-v4-insight-card-main-number-purple',
    subtitleClass: 'text-v4-insight-card-sub-number-purple',
    bgClass: 'bg-v4-insight-card-background-purple',
    borderClass: 'border-v4-insight-card-border-purple',
    iconBgClass: 'bg-v4-insight-card-icon-purple text-white',
    dotClass: 'bg-v4-insight-card-icon-purple',
    hasDot: true
  },
  {
    type: 'high_amount_bills',
    title: 'HIGH VALUE',
    icon: 'dollar-sign',
    labelClass: 'text-v4-insight-card-label-text-green',
    countClass: 'text-v4-insight-card-main-number-green',
    subtitleClass: 'text-v4-insight-card-sub-number-green',
    bgClass: 'bg-v4-insight-card-background-green',
    borderClass: 'border-v4-insight-card-border-green',
    iconBgClass: 'bg-v4-insight-card-icon-green text-white',
    dotClass: 'bg-v4-insight-card-icon-green',
    hasDot: false
  }
];

@Component({
  standalone: true,
  selector: 'app-v4-bill-risk-indicators',
  templateUrl: './v4-bill-risk-indicators.component.html',
  styleUrls: ['./v4-bill-risk-indicators.component.scss'],
  imports: [NgClass, CurrencyPipe, LucideAngularModule]
})
export class V4BillRiskIndicatorsComponent {
  indicators = input.required<IBillRiskIndicator[]>();
  isLoading = input(false);

  cards = computed(() => {
    const data = this.indicators();
    return RISK_CARD_CONFIGS.map((config) => {
      const indicator = data.find((d) => d.type === config.type);
      const count = indicator?.count ?? 0;
      return {
        ...config,
        count,
        amount: indicator?.amount ?? 0
      };
    });
  });

  overdueCount = computed(() => {
    const overdue = this.indicators().find((d) => d.type === 'overdue_bills');
    return overdue?.count ?? 0;
  });

  formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  }
}

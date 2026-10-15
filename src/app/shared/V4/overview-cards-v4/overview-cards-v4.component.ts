import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { DollarSign, LucideAngularModule } from 'lucide-angular';

export interface IOverviewSummaryCard {
  title: string;
  primaryValue: string;
  secondaryValue?: string;
  valueColor: 'green' | 'blue' | 'orange' | 'neutral' | 'red';
  /** When true, secondary value uses muted color (e.g. "To receive"). */
  secondaryMuted?: boolean;
  /** When true, renders the card in a "Coming Soon" state. */
  comingSoon?: boolean;
  /** When true, shows a dollar sign icon circle in the card. */
  showDollarIcon?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-overview-cards-v4',
  templateUrl: './overview-cards-v4.component.html',
  styleUrls: ['./overview-cards-v4.component.scss'],
  imports: [LucideAngularModule, NgClass, NgOptimizedImage]
})
export class OverviewCardsV4Component {
  readonly dollarSignIcon = DollarSign;
  card = input.required<IOverviewSummaryCard>();
  loading = input(false);

  valueColorClass(color: IOverviewSummaryCard['valueColor']): string {
    const map: Record<IOverviewSummaryCard['valueColor'], string> = {
      green: 'text-v4-text-success',
      blue: 'text-v4-common-blue-color',
      orange: 'text-v4-common-yellow-color',
      neutral: 'text-v4-main-text-color',
      red: 'text-v4-badge-error-text-color'
    };
    return map[color];
  }

  iconBgClass(color: IOverviewSummaryCard['valueColor']): string {
    const map: Record<IOverviewSummaryCard['valueColor'], string> = {
      green: 'bg-v4-badge-success-bg-color text-v4-badge-success-text-color',
      blue: 'bg-v4-badge-info-bg-color text-v4-badge-info-text-color',
      orange: 'bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color',
      red: 'bg-v4-badge-error-bg-color text-v4-badge-error-text-color',
      neutral: 'bg-v4-badge-neutral-bg-color text-v4-badge-neutral-text-color'
    };
    return map[color];
  }
}

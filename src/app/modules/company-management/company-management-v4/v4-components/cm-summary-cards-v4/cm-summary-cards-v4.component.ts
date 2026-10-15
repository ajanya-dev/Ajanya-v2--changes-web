import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

interface ISummaryCard {
  title: string;
  value: string;
  icon: string;
  valueColor: string;
  iconBg?: string;
  iconColor?: string;
  iconBgStyle?: string;
  iconColorStyle?: string;
  valueSizeClass?: string;
}

@Component({
  selector: 'app-cm-summary-cards-v4',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './cm-summary-cards-v4.component.html'
})
export class CmSummaryCardsV4Component {
  totalCount = input(0);
  ownedCount = input(0);
  activeCompanyName = input('None selected');
  loading = input(false);

  get cards(): ISummaryCard[] {
    return [
      {
        title: 'Total Companies',
        value: String(this.totalCount()),
        icon: 'building-2',
        valueColor: 'text-v4-common-blue-color',
        iconBg: 'bg-v4-badge-info-bg-color',
        iconColor: 'text-v4-badge-info-text-color'
      },
      {
        title: 'Owned Companies',
        value: String(this.ownedCount()),
        icon: 'check-circle-2',
        valueColor: 'text-v4-common-green-color',
        iconBg: 'bg-v4-badge-success-bg-color',
        iconColor: 'text-v4-badge-success-text-color'
      },
      {
        title: 'Active Company',
        value: this.activeCompanyName(),
        icon: 'building-2',
        valueColor: 'text-v4-main-text-color',
        iconBgStyle: 'var(--v4-surface-success-bold)',
        iconColorStyle: 'var(--v4-secondary-brand-color)',
        valueSizeClass: 'text-[14px]'
      }
    ];
  }
}

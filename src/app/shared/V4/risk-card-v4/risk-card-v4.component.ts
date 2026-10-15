import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type RiskBadge = 'red' | 'orange' | 'blue' | 'purple' | 'green';

export interface IRiskCard {
  label: string;
  count: number;
  subLabel: string;
  icon: string;
  badge: RiskBadge;
}

interface IRiskCardClasses {
  bg: string;
  border: string;
  icon: string;
  label: string;
  count: string;
  subtitle: string;
}

@Component({
  standalone: true,
  selector: 'app-risk-card-v4',
  templateUrl: './risk-card-v4.component.html',
  imports: [LucideAngularModule, NgClass]
})
export class RiskCardV4Component {
  card = input.required<IRiskCard>();

  classes(): IRiskCardClasses {
    const map: Record<RiskBadge, IRiskCardClasses> = {
      red: {
        bg: 'bg-v4-insight-card-background-red',
        border: 'border-v4-insight-card-border-red',
        icon: 'text-v4-insight-card-icon-red',
        label: 'text-v4-insight-card-label-text-red',
        count: 'text-v4-insight-card-main-number-red',
        subtitle: 'text-v4-insight-card-sub-number-red'
      },
      orange: {
        bg: 'bg-v4-insight-card-background-orange',
        border: 'border-v4-insight-card-border-orange',
        icon: 'text-v4-insight-card-icon-orange',
        label: 'text-v4-insight-card-label-text-orange',
        count: 'text-v4-insight-card-main-number-orange',
        subtitle: 'text-v4-insight-card-sub-number-orange'
      },
      blue: {
        bg: 'bg-v4-insight-card-background-blue',
        border: 'border-v4-insight-card-border-blue',
        icon: 'text-v4-insight-card-icon-blue',
        label: 'text-v4-insight-card-label-text-blue',
        count: 'text-v4-insight-card-main-number-blue',
        subtitle: 'text-v4-insight-card-sub-number-blue'
      },
      purple: {
        bg: 'bg-v4-insight-card-background-purple',
        border: 'border-v4-insight-card-border-purple',
        icon: 'text-v4-insight-card-icon-purple',
        label: 'text-v4-insight-card-label-text-purple',
        count: 'text-v4-insight-card-main-number-purple',
        subtitle: 'text-v4-insight-card-sub-number-purple'
      },
      green: {
        bg: 'bg-v4-insight-card-background-green',
        border: 'border-v4-insight-card-border-green',
        icon: 'text-v4-insight-card-icon-green',
        label: 'text-v4-insight-card-label-text-green',
        count: 'text-v4-insight-card-main-number-green',
        subtitle: 'text-v4-insight-card-sub-number-green'
      }
    };
    return map[this.card().badge];
  }
}

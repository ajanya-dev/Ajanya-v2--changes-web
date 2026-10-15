import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Clock, LucideAngularModule, LucideIconData } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-v4-main-page-api-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatTooltip],
  templateUrl: './v4-main-page-api-card.component.html',
  styleUrls: ['./v4-main-page-api-card.component.scss']
})
export class V4MainPageApiCardComponent {
  icon = input.required<LucideIconData>();
  label = input.required<string>();
  value = input.required<string>();
  valueColor = input<string>('');
  subtitle = input<string>('');
  subtitleColor = input<string>('var(--v4-primary-brand-color)');
  iconBgColor = input<string>('var(--v4-primary-brand-color)');
  iconColor = input<string>('#ffffff');
  isLoading = input<boolean>(false);
  comingSoon = input<boolean>(false);
  readonly clockIcon = Clock;
}

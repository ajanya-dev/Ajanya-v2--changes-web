import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChevronRight,
  LucideAngularModule,
  LucideIconData
} from 'lucide-angular';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-v4-main-page-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FaIconComponent],
  templateUrl: './v4-main-page-card.component.html',
  styleUrls: ['./v4-main-page-card.component.scss']
})
export class V4MainPageCardComponent {
  readonly ChevronRightIcon = ChevronRight;

  icon = input.required<LucideIconData>();
  heading = input.required<string>();
  description = input.required<string>();
  buttonText = input.required<string>();
  iconBgColor = input<string>('var(--v4-primary-brand-color)');
  iconColor = input<string>('#ffffff');
  fontIcon = input<IconDefinition>();
  badge = input<string>('');
  badgeColor = input<string>('');
  comingSoon = input(false);

  buttonClick = output();
}

import { NgClass } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { LucideAngularModule } from 'lucide-angular';

export interface ITabItem {
  label: string;
  value: string;
  icon?: IconProp;
  lucideIcon?: string;
  description?: string;
  disabled?: boolean;
}

export type TTabVariant = 'toggle' | 'pill' | 'underline' | 'flat';

/**
 * CommonTabV4Component - A reusable tab component with two style variants.
 *
 * @example
 * <!-- Toggle tabs (Overview / Detailed style) -->
 * <app-common-tab-v4
 *   [tabs]="[
 *     { label: 'Overview', value: 'overview', icon: ['fas', 'chart-bar'] },
 *     { label: 'Detailed', value: 'detailed', icon: ['fas', 'table-cells'] }
 *   ]"
 *   [(activeTab)]="selectedTab"
 *   [variant]="'toggle'"
 *   (tabChange)="onTabChange($event)"
 * />
 *
 * @example
 * <!-- Pill tabs (All, Check, ACH style) -->
 * <app-common-tab-v4
 *   [tabs]="[
 *     { label: 'All (61)', value: 'all' },
 *     { label: 'Check (16)', value: 'check' },
 *     { label: 'ACH (24)', value: 'ach' }
 *   ]"
 *   [(activeTab)]="selectedFilter"
 *   [variant]="'pill'"
 *   (tabChange)="onFilterChange($event)"
 * />
 */
@Component({
  selector: 'app-common-tab-v4',
  templateUrl: './common-tab-v4.component.html',
  styleUrls: ['./common-tab-v4.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, LucideAngularModule,NgClass]
})
export class CommonTabV4Component {
  /** Array of tab items to display. */
  tabs = input.required<ITabItem[]>();

  /** The currently active tab value (supports two-way binding). */
  activeTab = model.required<string>();

  /** Visual variant: 'toggle' for full-width segmented control, 'pill' for inline pill buttons. */
  variant = input<TTabVariant>('toggle');

  height = input('');

  /** Text size for tabs: 'sm' (default) or 'xs' for compact panels. */
  size = input<'sm' | 'xs'>('sm');

  /** When true, tabs stretch equally to fill the full container width. */
  justified = input(false);

  /** When true, pill tabs stay on a single row (scroll instead of wrap) — for tight/responsive rows. */
  noWrap = input(false);

  /** Emits the selected tab value when a tab is clicked. */
  tabChange = output<string>();
  borderNone = input(false);

  selectTab(value: string): void {
    this.activeTab.set(value);
    this.tabChange.emit(value);
  }
}

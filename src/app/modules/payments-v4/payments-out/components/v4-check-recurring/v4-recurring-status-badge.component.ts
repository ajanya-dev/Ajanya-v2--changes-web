import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

/**
 * Status -> V4 badge token. Semantics match `V4StatusComponent`:
 * upcoming = info (blue), running = sky, done = success (green),
 * on hold = warning (amber), stopped = error (red).
 * Tokens: src/assets/style_varients/_v4-light-theme.scss
 */
const RECURRING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: {
    bg: 'var(--v4-badge-info-bg-color)',
    text: 'var(--v4-badge-info-text-color)'
  },
  scheduled: {
    bg: 'var(--v4-badge-info-bg-color)',
    text: 'var(--v4-badge-info-text-color)'
  },
  started: {
    bg: 'var(--v4-badge-sky-bg-color)',
    text: 'var(--v4-badge-sky-text-color)'
  },
  completed: {
    bg: 'var(--v4-badge-success-bg-color)',
    text: 'var(--v4-badge-success-text-color)'
  },
  paused: {
    bg: 'var(--v4-badge-warning-bg-color)',
    text: 'var(--v4-badge-warning-text-color)'
  },
  canceled: {
    bg: 'var(--v4-badge-error-bg-color)',
    text: 'var(--v4-badge-error-text-color)'
  },
  cancelled: {
    bg: 'var(--v4-badge-error-bg-color)',
    text: 'var(--v4-badge-error-text-color)'
  }
};

const FALLBACK_COLOR = {
  bg: 'var(--v4-badge-neutral-bg-color)',
  text: 'var(--v4-badge-neutral-text-color)'
};

@Component({
  selector: 'app-v4-recurring-status-badge',
  standalone: true,
  template: `
    <div class="flex items-center h-full">
      @if (statusText) {
        <span
          class="status-badge"
          [style.background-color]="badgeBg"
          [style.color]="badgeTextColor"
        >
          {{ statusText }}
        </span>
      }
    </div>
  `
})
export class V4RecurringStatusBadgeComponent
  implements ICellRendererAngularComp
{
  statusText = '';
  badgeBg = '';
  badgeTextColor = '';

  agInit(params: ICellRendererParams): void {
    this.setStatus(params.value);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setStatus(params.value);
    return true;
  }

  private setStatus(name: unknown): void {
    this.statusText = typeof name === 'string' ? name.trim() : '';
    if (!this.statusText) {
      this.badgeBg = '';
      this.badgeTextColor = '';
      return;
    }
    const color =
      RECURRING_STATUS_COLORS[this.statusText.toLowerCase()] ?? FALLBACK_COLOR;
    this.badgeBg = color.bg;
    this.badgeTextColor = color.text;
  }
}

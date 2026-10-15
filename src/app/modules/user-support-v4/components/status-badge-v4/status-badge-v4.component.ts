import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

const BADGE_CONFIG: Record<
  number,
  { label: string; bgClass: string; textClass: string }
> = {
  1: {
    label: 'Open',
    bgClass: 'bg-v4-badge-info-bg-color',
    textClass: 'text-v4-badge-info-text-color'
  },
  2: {
    label: 'Resolved',
    bgClass: 'bg-v4-badge-success-bg-color',
    textClass: 'text-v4-badge-success-text-color'
  }
};

@Component({
  selector: 'app-status-badge-v4',
  standalone: true,
  template: `
    @if (label) {
      <div class="flex items-center h-full">
        <span
          class="status-badge status-badge--clickable {{ bgClass }} {{ textClass }}"
          >{{ label }}</span
        >
      </div>
    }
  `,
  styles: [
    `
      :host .status-badge.status-badge--clickable {
        cursor: pointer;
        font-weight: 500;
      }
    `
  ]
})
export class StatusBadgeV4Component implements ICellRendererAngularComp {
  label = '';
  bgClass = '';
  textClass = '';

  agInit(params: ICellRendererParams): void {
    this.setBadge(params.value as number);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setBadge(params.value as number);
    return true;
  }

  private setBadge(value: number): void {
    const config = BADGE_CONFIG[value];
    if (config) {
      this.label = config.label;
      this.bgClass = config.bgClass;
      this.textClass = config.textClass;
    } else {
      this.label = '';
      this.bgClass = '';
      this.textClass = '';
    }
  }
}

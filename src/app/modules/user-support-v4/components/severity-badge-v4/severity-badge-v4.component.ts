import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

const BADGE_CONFIG: Record<
  number,
  { label: string; bgClass: string; textClass: string }
> = {
  1: {
    label: 'Low',
    bgClass: 'bg-v4-badge-success-bg-color',
    textClass: 'text-v4-badge-success-text-color'
  },
  2: {
    label: 'Medium',
    bgClass: 'bg-v4-badge-warning-bg-color',
    textClass: 'text-v4-badge-warning-text-color'
  },
  3: {
    label: 'High',
    bgClass: 'bg-v4-badge-error-bg-color',
    textClass: 'text-v4-badge-error-text-color'
  }
};

@Component({
  selector: 'app-severity-badge-v4',
  standalone: true,
  template: `
    @if (label) {
      <div class="flex items-center h-full">
        <span class="status-badge {{ bgClass }} {{ textClass }}">{{ label }}</span>
      </div>
    }
  `
})
export class SeverityBadgeV4Component implements ICellRendererAngularComp {
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

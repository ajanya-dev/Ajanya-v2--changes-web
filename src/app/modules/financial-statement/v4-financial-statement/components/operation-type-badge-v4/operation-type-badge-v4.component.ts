import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';

const BADGE_CONFIG: Record<
  number,
  { label: string; bgClass: string; textClass: string }
> = {
  1: {
    label: 'Refill',
    bgClass: 'bg-v4-badge-success-bg-color',
    textClass: 'text-v4-badge-success-text-color'
  },
  15: {
    label: 'SMS',
    bgClass: 'bg-v4-badge-sky-bg-color',
    textClass: 'text-v4-badge-sky-text-color'
  },
  2: {
    label: 'Check Mail',
    bgClass: 'bg-v4-badge-accent-bg-color',
    textClass: 'text-v4-badge-accent-text-color'
  },
  3: {
    label: 'Shopping',
    bgClass: 'bg-v4-badge-info-bg-color',
    textClass: 'text-v4-badge-info-text-color'
  }
};

const OPERATION_LABELS: Record<number, string> = {
  5: 'Refund',
  7: 'Transaction fee',
  11: 'Shipping Label',
  13: 'Check Design Fee',
  25: 'Document Mail',
  27: 'Invoice Mail'
};

@Component({
  selector: 'app-operation-type-badge-v4',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="flex items-center h-full">
      <span
        class="status-badge gap-1 {{ bgClass }} {{ textClass }}"
      >
        @if (opType === 1) {
          <lucide-icon name="dollar-sign" [size]="11" />
        } @else if (opType === 15) {
          <lucide-icon name="message-square" [size]="11" />
        } @else if (opType === 2) {
          <lucide-icon name="mail" [size]="11" />
        } @else if (opType === 3) {
          <lucide-icon name="shopping-cart" [size]="11" />
        } @else {
          <lucide-icon name="tag" [size]="11" />
        }
        {{ label }}
      </span>
    </div>
  `
})
export class OperationTypeBadgeV4Component implements ICellRendererAngularComp {
  opType = 0;
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

  private setBadge(opType: number): void {
    this.opType = opType;
    const config = BADGE_CONFIG[opType];
    if (config) {
      this.label = config.label;
      this.bgClass = config.bgClass;
      this.textClass = config.textClass;
    } else {
      this.label = OPERATION_LABELS[opType] ?? 'Other';
      this.bgClass = 'bg-v4-badge-neutral-bg-color';
      this.textClass = 'text-v4-badge-neutral-text-color';
    }
  }
}

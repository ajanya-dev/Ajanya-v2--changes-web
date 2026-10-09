import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { NgClass } from '@angular/common';

const TYPE_MAP: Record<number, string> = {
  1: 'User',
  2: 'Accountant',
  3: 'Client',
  4: 'Clerk',
  5: 'Approver'
};

@Component({
  selector: 'app-user-type-cell-v4',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold"
      [ngClass]="badgeClass"
    >
      {{ typeName }}
    </span>
  `
})
export class UserTypeCellV4Component implements ICellRendererAngularComp {
  typeName = '';
  badgeClass = '';

  agInit(params: ICellRendererParams): void {
    const type = params.data?.client_type;
    this.typeName = TYPE_MAP[type] || 'Unknown';
    this.badgeClass = this.getBadgeClass(type);
  }

  refresh(): boolean {
    return false;
  }

  private getBadgeClass(type: number): string {
    switch (type) {
      case 1:
        return 'bg-v4-badge-info-bg-color text-v4-badge-info-color';
      case 2:
        return 'bg-[color-mix(in_srgb,var(--v4-common-green-color)_12%,transparent)] text-v4-common-green-color';
      case 3:
        return 'bg-v4-badge-info-bg-color text-v4-badge-info-color';
      case 4:
        return 'bg-[color-mix(in_srgb,var(--v4-badge-warning-color)_12%,transparent)] text-v4-badge-warning-color';
      case 5:
        return 'bg-[color-mix(in_srgb,var(--v4-badge-violet-color)_12%,transparent)] text-v4-badge-violet-color';
      default:
        return 'bg-v4-badge-info-bg-color text-v4-badge-info-color';
    }
  }
}

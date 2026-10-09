import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-user-status-cell-v4',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @switch (status) {
      @case (0) {
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
          style="background: color-mix(in srgb, var(--v4-common-yellow-color) 12%, transparent); color: var(--v4-common-yellow-color);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--v4-common-yellow-color);"></span>
          Pending
        </span>
      }
      @case (1) {
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
          style="background: color-mix(in srgb, var(--v4-common-green-color) 12%, transparent); color: var(--v4-common-green-color);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--v4-common-green-color);"></span>
          Active
        </span>
      }
      @case (2) {
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
          style="background: color-mix(in srgb, var(--v4-common-red-color) 12%, transparent); color: var(--v4-common-red-color);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--v4-common-red-color);"></span>
          Rejected
        </span>
      }
      @default {
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
          style="background: color-mix(in srgb, var(--v4-badge-warning-color) 12%, transparent); color: var(--v4-badge-warning-color);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--v4-badge-warning-color);"></span>
          Awaiting Approval
        </span>
      }
    }
  `
})
export class UserStatusCellV4Component implements ICellRendererAngularComp {
  status: number;

  agInit(params: ICellRendererParams): void {
    this.status = params.data?.status;
  }

  refresh(): boolean {
    return false;
  }
}

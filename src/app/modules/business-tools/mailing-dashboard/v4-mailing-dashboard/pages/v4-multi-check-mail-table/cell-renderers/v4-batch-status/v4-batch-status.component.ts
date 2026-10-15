import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IV4StatusBadge, TV4StatusMap } from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';

const BATCH_STATUS_MAP: TV4StatusMap = {
  3: {
    status: 'New',
    bgColor: 'var(--v4-badge-accent-bg-color)',
    textColor: 'var(--v4-badge-accent-text-color)'
  },
  1: {
    status: 'Processing',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-badge-info-text-color)'
  },
  2: {
    status: 'Processed',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-badge-success-text-color)'
  }
};

@Component({
  selector: 'app-v4-batch-status',
  standalone: true,
  template: `
    <div class="flex items-center h-full">
      <span
        class="status-badge"
        [style.background]="statusBadge.bgColor"
        [style.color]="statusBadge.textColor"
      >{{ statusBadge.status }}</span>
    </div>
  `
})
export class V4BatchStatusComponent implements ICellRendererAngularComp {
  statusBadge: IV4StatusBadge = { status: '', bgColor: '', textColor: '' };

  agInit(params: ICellRendererParams): void {
    this.resolveStatus(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.resolveStatus(params);
    return true;
  }

  private resolveStatus(params: ICellRendererParams): void {
    const statusValue = params.data?.status;
    this.statusBadge = BATCH_STATUS_MAP[statusValue] ?? {
      status: 'Unknown',
      bgColor: 'var(--v4-badge-info-bg-color)',
      textColor: 'var(--v4-common-blue-color)'
    };
  }
}

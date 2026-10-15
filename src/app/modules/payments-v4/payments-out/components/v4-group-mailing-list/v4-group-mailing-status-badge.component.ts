import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import {
  GroupMailingStatus,
  IGroupMailingRecord
} from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';

@Component({
  selector: 'app-v4-group-mailing-status-badge',
  standalone: true,
  imports: [CommonModule],
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
  `,
})
export class V4GroupMailingStatusBadgeComponent
  implements ICellRendererAngularComp
{
  statusText = '';
  badgeBg = '';
  badgeTextColor = '';

  agInit(params: ICellRendererParams<IGroupMailingRecord>): void {
    this.setStatus(params.data?.status);
  }

  refresh(params: ICellRendererParams<IGroupMailingRecord>): boolean {
    this.setStatus(params.data?.status);
    return true;
  }

  private setStatus(status: number | undefined): void {
    switch (status) {
      case GroupMailingStatus.NEW:
        this.statusText = 'New';
        this.badgeBg = 'var(--v4-badge-info-bg-color)';
        this.badgeTextColor = 'var(--v4-common-blue-color)';
        break;
      case GroupMailingStatus.MAILED:
        this.statusText = 'Mailed';
        this.badgeBg = 'var(--v4-badge-success-bg-color)';
        this.badgeTextColor = 'var(--v4-common-green-color)';
        break;
      case GroupMailingStatus.CANCELLED:
        this.statusText = 'Cancelled';
        this.badgeBg = 'var(--v4-badge-error-bg-color)';
        this.badgeTextColor = 'var(--v4-common-red-color)';
        break;
      case GroupMailingStatus.PENDING:
        this.statusText = 'Pending';
        this.badgeBg = 'var(--v4-badge-warning-bg-color)';
        this.badgeTextColor = 'var(--v4-common-yellow-color)';
        break;
      case GroupMailingStatus.FAILED:
        this.statusText = 'Failed';
        this.badgeBg = 'var(--v4-badge-error-bg-color)';
        this.badgeTextColor = 'var(--v4-common-red-color)';
        break;
      default:
        this.statusText = '';
        this.badgeBg = '';
        this.badgeTextColor = '';
    }
  }
}

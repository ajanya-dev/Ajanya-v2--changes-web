import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

@Component({
  selector: 'app-document-mail-status-badge-v4',
  standalone: true,
  templateUrl: './document-mail-status-badge-v4.component.html'
})
export class DocumentMailStatusBadgeV4Component
  implements ICellRendererAngularComp
{
  statusText = '';
  badgeBg = '';
  badgeTextColor = '';

  agInit(params: ICellRendererParams): void {
    this.setStatus(params.data?.status);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setStatus(params.data?.status);
    return true;
  }

  private setStatus(status: number): void {
    switch (status) {
      case 0:
        this.statusText = 'New';
        this.badgeBg = 'var(--v4-badge-info-bg-color)';
        this.badgeTextColor = 'var(--v4-badge-info-text-color)';
        break;
      case 1:
        this.statusText = 'Pending';
        this.badgeBg = 'var(--v4-badge-warning-bg-color)';
        this.badgeTextColor = 'var(--v4-badge-warning-text-color)';
        break;
      case 2:
        this.statusText = 'Printed';
        this.badgeBg = 'var(--v4-badge-accent-bg-color)';
        this.badgeTextColor = 'var(--v4-badge-accent-text-color)';
        break;
      case 3:
        this.statusText = 'Envelope printed';
        this.badgeBg = 'var(--v4-badge-accent-bg-color)';
        this.badgeTextColor = 'var(--v4-badge-accent-text-color)';
        break;
      case 4:
        this.statusText = 'Completed';
        this.badgeBg = 'var(--v4-badge-success-bg-color)';
        this.badgeTextColor = 'var(--v4-badge-success-text-color)';
        break;
      case 8:
        this.statusText = 'Refunded';
        this.badgeBg = 'var(--v4-badge-error-bg-color)';
        this.badgeTextColor = 'var(--v4-badge-error-text-color)';
        break;
      default:
        this.statusText = '';
        this.badgeBg = '';
        this.badgeTextColor = '';
    }
  }
}

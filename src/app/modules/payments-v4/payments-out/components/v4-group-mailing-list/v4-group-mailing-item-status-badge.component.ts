import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { GroupMailingDetailsStatus } from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';

interface IBadgeColors {
  bg: string;
  text: string;
}

const COLORS_GREEN: IBadgeColors = {
  bg: 'var(--v4-badge-success-bg-color)',
  text: 'var(--v4-badge-success-text-color)'
};
const COLORS_BLUE: IBadgeColors = {
  bg: 'var(--v4-badge-info-bg-color)',
  text: 'var(--v4-badge-info-text-color)'
};
const COLORS_RED: IBadgeColors = {
  bg: 'var(--v4-badge-error-bg-color)',
  text: 'var(--v4-badge-error-text-color)'
};
const COLORS_YELLOW: IBadgeColors = {
  bg: 'var(--v4-badge-warning-bg-color)',
  text: 'var(--v4-badge-warning-text-color)'
};
const COLORS_VIOLET: IBadgeColors = {
  bg: 'var(--v4-badge-accent-bg-color)',
  text: 'var(--v4-badge-accent-text-color)'
};
const COLORS_NEUTRAL: IBadgeColors = {
  bg: 'var(--v4-badge-neutral-bg-color)',
  text: 'var(--v4-badge-neutral-text-color)'
};

function statusNameToColors(statusName: string): IBadgeColors {
  const s = statusName
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
    .trim();

  // Negated states first: 'un posted' also contains 'posted', 'not exported'
  // also contains 'exported', so a plain includes() would colour them as done.
  if (['un posted', 'not exported'].some((k) => s.includes(k)))
    return COLORS_NEUTRAL;

  if (
    ['completed', 'success', 'approved', 'settled', 'mailed', 'posted'].some(
      (k) => s.includes(k)
    )
  )
    return COLORS_GREEN;

  if (['cancelled', 'canceled', 'archived'].some((k) => s.includes(k)))
    return COLORS_NEUTRAL;

  if (
    ['void', 'failed', 'rejected', 'declined', 'unmapped'].some((k) =>
      s.includes(k)
    )
  )
    return COLORS_RED;

  if (
    ['pending', 'approval', 'schedule', 'requested', 'funding'].some((k) =>
      s.includes(k)
    )
  )
    return COLORS_YELLOW;

  if (
    ['printing', 'printed', 'eprinted', 'e-printed'].some((k) => s.includes(k))
  )
    return COLORS_VIOLET;

  if (['new', 'draft', 'blank'].some((k) => s.includes(k)))
    return COLORS_VIOLET;

  return COLORS_BLUE;
}

@Component({
  selector: 'app-v4-group-mailing-item-status-badge',
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
  `
})
export class V4GroupMailingItemStatusBadgeComponent
  implements ICellRendererAngularComp
{
  statusText = '';
  badgeBg = '';
  badgeTextColor = '';

  agInit(
    params: ICellRendererParams<{ cheque_status?: number | string }>
  ): void {
    this.setStatus(params.data?.cheque_status);
  }

  refresh(
    params: ICellRendererParams<{ cheque_status?: number | string }>
  ): boolean {
    this.setStatus(params.data?.cheque_status);
    return true;
  }

  private setStatus(status: number | string | undefined): void {
    this.statusText = this.getStatusText(status);
    if (!this.statusText) {
      this.badgeBg = '';
      this.badgeTextColor = '';
      return;
    }
    const colors = statusNameToColors(this.statusText);
    this.badgeBg = colors.bg;
    this.badgeTextColor = colors.text;
  }

  private getStatusText(status: number | string | undefined): string {
    if (status === undefined || status === null) return '';
    switch (String(status)) {
      case GroupMailingDetailsStatus.NEW:
        return 'New';
      case GroupMailingDetailsStatus.PRINTED:
        return 'Printed';
      case GroupMailingDetailsStatus.VOID:
        return 'Void';
      case GroupMailingDetailsStatus.ARCHIVED:
        return 'Archived';
      case GroupMailingDetailsStatus.PRINTING:
        return 'Printing';
      case GroupMailingDetailsStatus.MAILED:
        return 'Mailed';
      case GroupMailingDetailsStatus.SCHEDULE:
        return 'Schedule';
      case GroupMailingDetailsStatus.EMAILED:
        return 'E-Printed';
      case GroupMailingDetailsStatus.REQUESTED:
        return 'Requested';
      case GroupMailingDetailsStatus.DD:
        return 'DD';
      case GroupMailingDetailsStatus.DD_FUNDING:
        return 'DD-Funding';
      case GroupMailingDetailsStatus.DD_FAILED:
        return 'DD-Failed';
      case GroupMailingDetailsStatus.DDW:
        return 'DDW';
      case GroupMailingDetailsStatus.DD_DEPOSITING:
        return 'DD-Depositing';
      case GroupMailingDetailsStatus.DD_DEPOSIT_FAILED:
        return 'DD-Deposit-F';
      case GroupMailingDetailsStatus.DDC:
        return 'DDC';
      case GroupMailingDetailsStatus.POSTED:
        return 'Posted';
      case GroupMailingDetailsStatus.UN_POSTED:
        return 'Un-Posted';
      case GroupMailingDetailsStatus.APPROVAL_REQUIRED:
        return 'Approval-Required';
      case GroupMailingDetailsStatus.UNMAPPED_CHECKS:
        return 'Unmapped-Checks';
      case GroupMailingDetailsStatus.EXPORTED:
        return 'Exported';
      case GroupMailingDetailsStatus.NOT_EXPORTED:
        return 'Not Exported';
      case GroupMailingDetailsStatus.BLANK:
        return 'Blank';
      case '11':
        return 'Mailed';
      default:
        return '';
    }
  }
}

import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import {
  LucideAngularModule,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-angular';

type ZilSignStatus =
  | 'pending'
  | 'in_progress'
  | 'sent'
  | 'signed'
  | 'completed'
  | 'cancelled'
  | 'declined'
  | 'expired';

export interface IZilSignStatusPalette {
  label: string;
  bg: string;
  fg: string;
  icon: string;
}

function titleCase(value: string): string {
  if (!value) return '';
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Status → label/colours/icon; shared by this badge and the detail panel header. */
export function zilSignStatusPalette(rawStatus: string): IZilSignStatusPalette {
  const raw = rawStatus.toLowerCase() as ZilSignStatus;
  switch (raw) {
    case 'signed':
    case 'completed':
      return {
        label: 'Signed',
        bg: 'var(--v4-badge-success-bg-color)',
        fg: 'var(--v4-badge-success-text-color)',
        icon: 'check-circle-2'
      };
    case 'in_progress':
      return {
        label: 'In progress',
        bg: 'var(--v4-badge-info-bg-color)',
        fg: 'var(--v4-badge-info-text-color)',
        icon: 'clock'
      };
    case 'sent':
      return {
        label: 'Sent',
        bg: 'var(--v4-badge-info-bg-color)',
        fg: 'var(--v4-badge-info-text-color)',
        icon: 'check-circle-2'
      };
    case 'pending':
      return {
        label: 'Pending',
        bg: 'var(--v4-badge-warning-bg-color)',
        fg: 'var(--v4-badge-warning-text-color)',
        icon: 'clock'
      };
    case 'cancelled':
    case 'declined':
      return {
        // Cancelled is neutral - cancelling is not a failure. Declined is
        // a rejection, so it keeps the error pair.
        label: raw === 'declined' ? 'Declined' : 'Cancelled',
        bg:
          raw === 'declined'
            ? 'var(--v4-badge-error-bg-color)'
            : 'var(--v4-badge-neutral-bg-color)',
        fg:
          raw === 'declined'
            ? 'var(--v4-badge-error-text-color)'
            : 'var(--v4-badge-neutral-text-color)',
        icon: 'x-circle'
      };
    case 'expired':
      return {
        label: 'Expired',
        bg: 'var(--v4-badge-warning-bg-color)',
        fg: 'var(--v4-badge-warning-text-color)',
        icon: 'alert-circle'
      };
    default:
      return {
        label: titleCase(rawStatus) || '—',
        bg: 'var(--v4-badge-neutral-bg-color)',
        fg: 'var(--v4-badge-neutral-text-color)',
        icon: 'clock'
      };
  }
}

@Component({
  selector: 'app-v4-zil-sign-status-badge',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (plain()) {
      <span class="zs-status zs-status--plain" [style.color]="plainColor()">
        <lucide-icon [name]="palette().icon" [size]="12"></lucide-icon>
        {{ palette().label }}
      </span>
    } @else {
      <span
        class="status-badge zs-status"
        [style.background-color]="palette().bg"
        [style.color]="palette().fg"
      >
        <lucide-icon [name]="palette().icon" [size]="12"></lucide-icon>
        {{ palette().label }}
      </span>
    }
  `,
  styles: [
    `
      /*
       * Geometry mirrors the theme's .status-badge so this looks identical
       * outside a grid cell (detail panel, doc view) - the theme scopes its
       * own rule to '.ag-theme-v4 .ag-cell .status-badge', which wins on
       * specificity inside the grid, so nothing is duplicated there.
       */
      .zs-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--font-peridot);
        font-size: 12px;
        font-weight: 400;
        line-height: 1.4;
        border-radius: 8px;
        padding: 4px 12px;
        min-width: 44px;
        white-space: nowrap;
        border: none;
      }

      /* Inline label variant - no chip, just coloured text. */
      .zs-status--plain {
        padding: 0;
        min-width: 0;
        background: none;
      }
    `
  ]
})
export class V4ZilSignStatusBadgeComponent implements ICellRendererAngularComp {
  readonly CheckIcon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly XIcon = XCircle;
  readonly AlertIcon = AlertCircle;

  status = input<string | undefined>(undefined);
  plain = input(false);

  private cellStatus: string | undefined;

  agInit(params: ICellRendererParams): void {
    this.cellStatus =
      (params.value as string) || (params.data?.status as string) || undefined;
  }

  refresh(params: ICellRendererParams): boolean {
    this.cellStatus =
      (params.value as string) || (params.data?.status as string) || undefined;
    return true;
  }

  palette = computed(() =>
    zilSignStatusPalette(this.cellStatus || this.status() || '')
  );

  plainColor = computed(() =>
    this.palette().fg === 'var(--v4-badge-info-text-color)'
      ? 'var(--v4-primary-brand-bold-color)'
      : this.palette().fg
  );
}

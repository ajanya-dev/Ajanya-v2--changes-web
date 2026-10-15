import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Params } from '@angular/router';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

/** Status descriptor as served by `/received-checks` status config. */
interface IReceivedStatus {
  statusShortDescription: string;
  color: string;
  statusFullDescription: string;
}

interface IBadgeColors {
  badgeBg: string;
  badgeTextColor: string;
}

/** V2.1 badge palette — same tokens the payments-out status column uses. */
const BADGE = {
  success: {
    badgeBg: 'var(--v4-badge-success-bg-color)',
    badgeTextColor: 'var(--v4-badge-success-text-color)'
  },
  warning: {
    badgeBg: 'var(--v4-badge-warning-bg-color)',
    badgeTextColor: 'var(--v4-badge-warning-text-color)'
  },
  info: {
    badgeBg: 'var(--v4-badge-info-bg-color)',
    badgeTextColor: 'var(--v4-badge-info-text-color)'
  },
  error: {
    badgeBg: 'var(--v4-badge-error-bg-color)',
    badgeTextColor: 'var(--v4-badge-error-text-color)'
  },
  neutral: {
    badgeBg: 'var(--v4-badge-neutral-bg-color)',
    badgeTextColor: 'var(--v4-badge-neutral-text-color)'
  }
} as const;

/**
 * @description Maps a status description to V4 badge colours. Keyword-based
 * rather than a status-code switch because the received-payments statuses are
 * served by the API per `received_type` and vary by white label — same approach
 * the check-list status renderer takes.
 */
function statusNameToColors(statusName: string): IBadgeColors {
  const s = statusName
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
    .trim();

  if (
    ['completed', 'success', 'received', 'deposited', 'approved', 'paid'].some(
      (k) => s.includes(k)
    )
  )
    return BADGE.success;

  if (
    [
      'failed',
      'rejected',
      'declined',
      'returned',
      'void',
      'stopped',
      'expired'
    ].some((k) => s.includes(k))
  )
    return BADGE.error;

  if (
    ['pending', 'requested', 'awaiting', 'hold', 'scheduled'].some((k) =>
      s.includes(k)
    )
  )
    return BADGE.warning;

  if (['canceled', 'cancelled', 'draft', 'new'].some((k) => s.includes(k)))
    return BADGE.neutral;

  // Processing / printed / mailed / emailed and anything unrecognised.
  return BADGE.info;
}

/** Payment-network acronyms that must stay uppercase inside a status label. */
const STATUS_ACRONYMS = new Set([
  'PYMT',
  'PYMNT',
  'GPBL',
  'GPBF',
  'DD',
  'ACH',
  'TTP',
  'HTML'
]);

/**
 * @description Title-cases a status label but keeps the payment-network
 * acronyms uppercase — `titlecase` alone renders "GPBL Viewed" as
 * "Gpbl Viewed" and "M-ACH" as "M-ach". Every run of letters is handled on its
 * own, so separators (space, hyphen, slash) need no special casing.
 */
function formatStatusLabel(label: string): string {
  return label
    .trim()
    .replace(/[a-z]+/gi, (word) =>
      STATUS_ACRONYMS.has(word.toUpperCase())
        ? word.toUpperCase()
        : word[0].toUpperCase() + word.slice(1).toLowerCase()
    );
}

@Component({
  selector: 'app-payments-in-status-v4',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, CommonFilterIconComponent],
  templateUrl: './payments-in-status-v4.component.html',
  styleUrls: ['./payments-in-status-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsInStatusV4Component implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  params!: ICellRendererParams;
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  cellRendererRePymntsStatus: Params = {};

  statusName?: IReceivedStatus;
  statusLabel = '';
  badgeBg: string = BADGE.info.badgeBg;
  badgeTextColor: string = BADGE.info.badgeTextColor;
  showFilterIcon = false;

  /** Attachment/comment flags for this row, keyed by the row's encrypted id. */
  statusIcon: Signal<IDtAttachComntArray | undefined> = signal(undefined);

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.statusIcon = computed(() =>
      this.attachCommentList()?.find(
        (item) => item.id === params.data?.encrypted_id
      )
    );
    this.getStatus();
    this.getAttachmentStatus();
  }

  refresh(): boolean {
    return true;
  }

  /**
   * @description Resolves the row's status descriptor and, as the old renderer
   * did, tells the table whether this row's action/eye buttons apply — the
   * externally-received types (10/11/12) have no row actions.
   */
  private renderStatus(params: ICellRendererParams): void {
    this.statusName =
      this.cellRendererRePymntsStatus?.[params.data?.received_type]?.[
        params.data?.status
      ];

    this.statusLabel = formatStatusLabel(
      this.statusName?.statusShortDescription ?? ''
    );

    const colors = statusNameToColors(
      this.statusName?.statusShortDescription ?? ''
    );
    this.badgeBg = colors.badgeBg;
    this.badgeTextColor = colors.badgeTextColor;

    const hideActions = [10, 11, 12].includes(params.data?.received_type);
    this.dataTableService.setDataFromParent(undefined, undefined, undefined, {
      actionButton: !hideActions,
      eyeButton: !hideActions
    });

    this.cdr.markForCheck();
  }

  addAttachment(event?: Event): void {
    event?.stopPropagation();
    this.dialog
      .open(V4AddAttachmentModalComponent, {
        width: '750px',
        maxWidth: '1000px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          id: this.params.data?.encrypted_id,
          type: 'request-payments'
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        // This modal closes with `isRefresh`; the comment modal uses `refresh`.
        if (res?.isRefresh) {
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  addComment(event?: Event): void {
    event?.stopPropagation();
    this.dialog
      .open(V4AddCommentCommonModalComponent, {
        width: '750px',
        maxWidth: '1000px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          id: this.params.data?.encrypted_id,
          type: 'request-payments',
          enableDelete: true
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.refresh) {
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  private getStatus(): void {
    this.requestPaymentsService
      .getStatusArray()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.cellRendererRePymntsStatus = res;
        if (Object.keys(res ?? {})?.length) {
          this.renderStatus(this.params);
        }
      });
  }

  private getAttachmentStatus(): void {
    this.dataTableService
      .getAttachmentCommentStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.attachCommentList.set(res);
        this.cdr.markForCheck();
      });
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: JSON.stringify(this.statusName),
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi?.deselectAll();
  }
}

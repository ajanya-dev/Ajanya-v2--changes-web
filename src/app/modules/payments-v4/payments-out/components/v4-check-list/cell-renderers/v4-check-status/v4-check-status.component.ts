import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import {
  ICheckListTableRowData,
  ICheckStatus
} from 'src/app/modules/check/model/check';
import {
  checkStatus,
  statusCodesWithFilter
} from 'src/app/modules/check/components/methods/check-methods';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

interface IV4CheckStatusParams extends ICellRendererParams {
  checkStatusMap: Record<string, ICheckStatus>;
  showFilter?: boolean;
  isLegalEnabled?: boolean;
  /** This account is not offered Direct Deposit, so the menu does not carry it. */
  hidesDirectDeposit?: boolean;
  onCommentClick?: (id: string) => void;
  onAttachmentClick?: (id: string) => void;
  onTrackingClick?: (id: string) => void;
  /**
   * Fired when a payment option is picked from the New-check Process menu.
   * `done` clears the button's loader once the parent's flow has settled.
   */
  onNewCheckOption?: (
    row: ICheckListTableRowData,
    optionId: string,
    done: () => void
  ) => void;
}

/** New-check payment options — same set + ids as the bulk action toolbar. */
interface INewCheckPaymentOption {
  id: string;
  name: string;
  icon: string;
}
export const NEW_CHECK_PAYMENT_OPTIONS: INewCheckPaymentOption[] = [
  {
    id: 'id_printCheck',
    name: 'Print on Check Paper',
    icon: 'printer'
  },
  {
    id: 'id_printCheck_white',
    name: 'Print on White Paper',
    icon: 'printer'
  },
  { id: 'id_mail', name: 'Mail', icon: 'send' },
  { id: 'id_email', name: 'Email', icon: 'mail' },
  {
    id: 'id_direct_deposit',
    name: 'ACH / Direct Deposit',
    icon: 'landmark'
  }
];

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

/**
 * Maps a status name to V4 badge colors.
 */
function statusNameToColors(statusName: string): IBadgeColors {
  const s = statusName
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
    .trim();

  // Green statuses
  if (
    [
      'completed',
      'success',
      'active',
      'approved',
      'settled',
      'cashed',
      'deposited'
    ].some((k) => s.includes(k))
  )
    return COLORS_GREEN;

  // Red statuses
  if (
    [
      'void',
      'failed',
      'rejected',
      'canceled',
      'cancelled',
      'returned',
      'declined',
      'inactive',
      'stopped'
    ].some((k) => s.includes(k))
  )
    return COLORS_RED;

  // Yellow/Orange statuses
  if (
    ['pending', 'approval required', 'approval', 'scheduled', 'hold'].some(
      (k) => s.includes(k)
    )
  )
    return COLORS_YELLOW;

  // Violet statuses
  if (['saved', 'new', 'draft'].some((k) => s.includes(k)))
    return COLORS_VIOLET;

  // Blue statuses (default for processing, printing, mailed, dd, etc.)
  return COLORS_BLUE;
}

@Component({
  selector: 'app-v4-check-status',
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    MatMenuModule,
    LucideAngularModule,
    CommonFilterIconComponent
  ],
  templateUrl: './v4-check-status.component.html',
  styleUrl: './v4-check-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4CheckStatusComponent implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  private params: IV4CheckStatusParams;
  // Row data may contain additional dynamic fields from the API beyond the typed interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rowData: ICheckListTableRowData & Record<string, any>;
  private checkStatusMap: Record<string, ICheckStatus> = {};

  statusName = '';
  statusDescription = '';
  badgeBg = COLORS_BLUE.bg;
  badgeTextColor = COLORS_BLUE.text;
  hasTrackingCode = false;
  isReprinted = false;
  areCommentsPresent = false;
  areAttachmentsPresent = false;
  isFilterableStatus = false;
  /** New checks (status code 0) get a Process button + payment-options menu instead of a badge. */
  isNew = false;
  get paymentOptions(): INewCheckPaymentOption[] {
    return this.params?.hidesDirectDeposit
      ? NEW_CHECK_PAYMENT_OPTIONS.filter((opt) => opt.id !== 'id_direct_deposit')
      : NEW_CHECK_PAYMENT_OPTIONS;
  }
  /** Option last picked from the menu — stays ticked so the choice is visible. */
  selectedOptionId: string | null = null;
  /** True while the parent flow for the picked option is still running. */
  isOptionRunning = false;
  /** Drives the chevron direction — up while the options menu is open. */
  isMenuOpen = false;

  private filterableStatusCodes = checkStatus;
  private statusCodesWithFilter = statusCodesWithFilter;

  agInit(params: IV4CheckStatusParams): void {
    this.params = params;
    this.rowData = params.data;
    this.checkStatusMap = params.checkStatusMap ?? {};

    this.resolveStatus();
    this.resolveAttachmentCommentIcons();
  }

  refresh(params: IV4CheckStatusParams): boolean {
    this.params = params;
    this.rowData = params.data;
    this.checkStatusMap = params.checkStatusMap ?? {};
    // Row data reloaded — whatever the option kicked off has landed.
    this.isOptionRunning = false;
    this.resolveStatus();
    return true;
  }

  private resolveStatus(): void {
    const chequeStatus = this.rowData?.cheque_status;
    this.isNew = chequeStatus === 0;
    const statusInfo = this.checkStatusMap[chequeStatus];

    if (!statusInfo) {
      this.statusName = '';
      this.badgeBg = COLORS_BLUE.bg;
      this.badgeTextColor = COLORS_BLUE.text;
      return;
    }

    // Check "Re-printed" special case
    if (this.params.isLegalEnabled && chequeStatus === 1) {
      // The reprint flag comes from the attachment/comment list;
      // handled after subscription resolves. Set default for now.
      this.isReprinted = false;
    }

    // Check "Mail Scheduled-Void" special case
    if (
      this.rowData?.is_voided_scheduled_check === true &&
      chequeStatus === 2
    ) {
      this.statusName = 'Mail Scheduled-Void';
      this.statusDescription = statusInfo.statusFullDescription;
      this.badgeBg = COLORS_RED.bg;
      this.badgeTextColor = COLORS_RED.text;
      this.setFilterability(chequeStatus);
      this.hasTrackingCode = false;
      return;
    }

    // Mailed status with mailedUsing tooltip
    if (chequeStatus === 7) {
      const shortDesc = statusInfo.statusShortDescription;
      this.statusName = this.formatStatusName(shortDesc);
      this.statusDescription = `${statusInfo.statusFullDescription} ( ${this.rowData?.mailedUsing} )`;
    } else if (chequeStatus === 807) {
      this.statusName = statusInfo.statusShortDescription;
      this.statusDescription = statusInfo.statusFullDescription;
    } else {
      this.statusName = this.formatStatusName(
        statusInfo.statusShortDescription
      );
      this.statusDescription = statusInfo.statusFullDescription;
    }

    // Map status name to V4 badge colors
    const colors = statusNameToColors(this.statusName);
    this.badgeBg = colors.bg;
    this.badgeTextColor = colors.text;

    // Tracking code
    this.hasTrackingCode =
      this.rowData?.trackingCode != null && this.rowData?.trackingCode !== '';

    this.setFilterability(chequeStatus);
  }

  private setFilterability(chequeStatus: number): void {
    this.isFilterableStatus =
      !!this.params.showFilter &&
      this.filterableStatusCodes.includes(chequeStatus);
  }

  private resolveAttachmentCommentIcons(): void {
    this.dataTableService
      .getAttachmentCommentStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list: IDtAttachComntArray[] | undefined) => {
        if (!list) return;
        const icon = list.find((item) => item.id === this.rowData?.id);
        this.areCommentsPresent = icon?.comment === 1;
        this.areAttachmentsPresent = icon?.attachment === 1;

        // Handle "Re-printed" after we have the icon data
        if (
          this.params.isLegalEnabled &&
          icon?.reprint === 1 &&
          this.checkStatusMap[this.rowData?.cheque_status]?.statusValue === 1
        ) {
          this.isReprinted = true;
        }
        this.cdr.markForCheck();
      });
  }

  onStatusClick(): void {
    if (this.hasTrackingCode) {
      this.params.onTrackingClick?.(this.rowData?.id);
    }
  }

  /**
   * Menu open/close from the trigger. Closing happens on the overlay backdrop,
   * outside this view, so OnPush needs the explicit markForCheck.
   */
  onMenuToggle(isOpen: boolean): void {
    this.isMenuOpen = isOpen;
    this.cdr.markForCheck();
  }

  /** A payment option was chosen from the New-check Process menu. */
  onPaymentOption(optionId: string): void {
    const handler = this.params.onNewCheckOption;
    if (!handler || this.isOptionRunning) return;

    this.selectedOptionId = optionId;
    this.isOptionRunning = true;
    this.cdr.markForCheck();

    handler(this.rowData, optionId, () => {
      this.isOptionRunning = false;
      this.cdr.markForCheck();
    });
  }

  onCommentClick(): void {
    this.params.onCommentClick?.(this.rowData?.id);
  }

  onAttachmentClick(): void {
    this.params.onAttachmentClick?.(this.rowData?.id);
  }

  onFilterClicked(): void {
    const selectedStatusValue = this.getKeyForStatusCode(
      this.rowData?.cheque_status
    );
    const cellValue = {
      filter: selectedStatusValue as string,
      field: this.params.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  /**
   * Retrieves the filter key for a given check status code.
   */
  private getKeyForStatusCode(statusCode: number): string | null {
    const entry = Object.entries(this.statusCodesWithFilter).find(
      ([_, codes]) => codes.includes(statusCode)
    );
    return entry ? entry[0] : null;
  }

  /**
   * Formats a status name with proper casing, preserving DD/DDW as uppercase.
   */
  private formatStatusName(value: string): string {
    if (!value) return '';
    const words = value.split(/[-_\s]+/);
    return words
      .map((word, index) => {
        if (word.toLowerCase() === 'dd' || word.toLowerCase() === 'ddw') {
          return word.toUpperCase();
        }
        if (index > 0 && words[index - 1].toLowerCase() === 'dd') {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('-');
  }
}

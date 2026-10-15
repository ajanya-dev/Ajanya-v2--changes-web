import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DetailSidePanelComponent } from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { MatTooltip } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { GroupMailingService } from 'src/app/modules/business-tools/mailing-dashboard/services/group-mailing.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IApiRes } from 'src/app/models/api';
import {
  GroupMailingDetailsStatus,
  IGroupMailingActivityLog,
  IGroupMailingAttachment,
  IGroupMailingDetailData,
  IGroupMailingRawDetails
} from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { V4GroupMailingPanelService } from './v4-group-mailing-panel.service';
import {
  V4GroupMailingItemsModalComponent,
  IGroupMailingItemsModalData
} from './v4-group-mailing-items-modal.component';

/**
 * The action-grid tiles. Unlike the payment panels these behave as tabs — one is
 * always open, so selecting the current section does not close it.
 */
type GroupMailingSection = 'items' | 'activity' | 'attachments';

@Component({
  selector: 'app-v4-group-mailing-detail-panel',
  standalone: true,
  imports: [
    PdSkeletonComponent,
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    DetailSidePanelComponent,
    PdDateTimeComponent,
    MatTooltip
  ],
  templateUrl: './v4-group-mailing-detail-panel.component.html',
  styleUrls: ['./v4-group-mailing-detail-panel.component.scss']
})
export class V4GroupMailingDetailPanelComponent {
  panelService = inject(V4GroupMailingPanelService);
  private groupMailingService = inject(GroupMailingService);
  private dataTableService = inject(DataTableService);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  readonly PREVIEW_LIMIT = 5;
  readonly tableId = DTTableId.businessToolsGroupMailingDetails;

  loading = signal(false);
  data = signal<IGroupMailingDetailData | null>(null);
  items = signal<IGroupMailingRawDetails[]>([]);
  itemsLoading = signal(false);
  totalItemCount = signal(0);

  previewItems = computed(() => this.items().slice(0, this.PREVIEW_LIMIT));

  openActionSection = signal<GroupMailingSection>('items');

  readonly actionSectionButtons: {
    section: GroupMailingSection;
    icon: string;
    label: string;
  }[] = [
    { section: 'items', icon: 'file-text', label: 'Group mailing items' },
    { section: 'activity', icon: 'activity', label: 'Activity log' },
    { section: 'attachments', icon: 'paperclip', label: 'Attachments' }
  ];

  activityLogs = signal<IGroupMailingActivityLog[]>([]);
  attachments = signal<IGroupMailingAttachment[]>([]);
  viewingAttachmentId = signal<string | null>(null);

  /** Mirrors the shell's expanded (⤢) state so the body can switch to the grid. */
  isPanelExpanded = signal(false);

  /** Per-card collapse state — one signal, keyed by card. */
  collapsedCards = signal<Record<string, boolean>>({});

  /** Section keys already fetched for the current group (reset on open). */
  private loadedSections = new Set<string>();
  /** Section keys with a request in flight — drives the inline skeleton. */
  private loadingSections = signal<string[]>([]);
  /** Cancels in-flight section requests when the panel switches to another group. */
  private panelReset$ = new Subject<void>();

  /** The group's own name is the headline; the panel type is the meta line. */
  panelTitle = computed(
    () =>
      this.data()?.group_name || this.panelService.groupName() || 'Group mail'
  );

  /** Meta line under the title: "Group mailing · Bulk · FedEx 2 Day". */
  panelSubtitle = computed(() => {
    const details = this.data();
    const parts = ['Group mailing'];
    if (details) parts.push(this.envelopeText());
    if (details?.shipment_name) parts.push(details.shipment_name);
    return parts.join(' • ');
  });

  envelopeText = computed(() =>
    this.data()?.is_individual_envelope === 1 ? 'Individual' : 'Bulk'
  );

  fromAddress = computed(() =>
    this.splitAddress(this.data()?.sender_info?.sender)
  );

  toAddress = computed(() =>
    this.splitAddress(this.data()?.sender_info?.receiver)
  );

  hasAnyAddress = computed(
    () => this.fromAddress().length > 0 || this.toAddress().length > 0
  );

  constructor() {
    effect(
      () => {
        const id = this.panelService.groupId();
        const open = this.panelService.isOpen();
        if (open && id) {
          this.resetSectionState();
          this.loadData(id);
        } else {
          this.data.set(null);
          this.items.set([]);
          this.totalItemCount.set(0);
          this.resetSectionState();
        }
      },
      { allowSignalWrites: true }
    );
  }

  private resetSectionState(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set('items');
    this.activityLogs.set([]);
    this.attachments.set([]);
    this.viewingAttachmentId.set(null);
  }

  private itemsPayload(id: string, endRow: number) {
    return {
      startRow: 0,
      endRow,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: [],
      group_id: id
    };
  }

  private loadData(id: string): void {
    this.loading.set(true);
    this.itemsLoading.set(true);

    // Eager: the details and the first page of items — both are in the first
    // view. Activity log and attachments load on their tile — see loadSection().
    forkJoin({
      details: this.groupMailingService
        .getGroupMailingDetails(id)
        .pipe(catchError(() => of(null))),
      items: this.dataTableService
        .getTableListData(
          this.itemsPayload(id, this.PREVIEW_LIMIT),
          this.tableId
        )
        .pipe(catchError(() => of(null)))
    })
      .pipe(takeUntil(this.panelReset$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ details, items }) => {
          if (details?.success && details.data) {
            this.data.set(details.data);
            if (details.data.group_name) {
              this.panelService.groupName.set(details.data.group_name);
            }
          } else {
            this.data.set(null);
          }
          this.loading.set(false);

          this.items.set(
            items && Array.isArray(items.rowData)
              ? (items.rowData as IGroupMailingRawDetails[])
              : []
          );
          const metaCount = details?.data?.count_group_items;
          const responseCount =
            items && typeof items.rowCount === 'number' ? items.rowCount : 0;
          this.totalItemCount.set(metaCount ?? responseCount);
          this.itemsLoading.set(false);
        },
        error: () => {
          this.data.set(null);
          this.items.set([]);
          this.totalItemCount.set(0);
          this.loading.set(false);
          this.itemsLoading.set(false);
        }
      });
  }

  onClose(): void {
    this.panelService.close();
  }

  // ── Card collapse ─────────────────────────────────────────────────────────
  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // ── Action grid ───────────────────────────────────────────────────────────
  selectSection(section: GroupMailingSection): void {
    this.openActionSection.set(section);
    this.loadSection(section);
  }

  /** True while the given section's request is in flight (shows a skeleton). */
  isSectionLoading(key: GroupMailingSection): boolean {
    return this.loadingSections().includes(key);
  }

  /**
   * Fetch a section's data the first time it is opened rather than on panel
   * open. Cached per group via loadedSections, so re-opening never refetches.
   */
  private loadSection(key: GroupMailingSection): void {
    if (this.loadedSections.has(key)) return;
    const request$ = this.sectionRequest(key);
    if (!request$) return;

    this.loadedSections.add(key);
    this.loadingSections.update((keys) => [...keys, key]);
    request$
      .pipe(
        catchError(() => of(null)),
        finalize(() =>
          this.loadingSections.update((keys) => keys.filter((k) => k !== key))
        ),
        takeUntil(this.panelReset$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /** The request backing one section, or null when it needs no API. */
  private sectionRequest(key: GroupMailingSection): Observable<unknown> | null {
    const id = this.panelService.groupId();
    if (!id) return null;

    switch (key) {
      // The item preview rides along with the details request — no extra call.
      case 'items':
        return null;

      // The `tap` params are annotated because this method's declared
      // `Observable<unknown>` return type contextually re-types them; without
      // it a truthiness check narrows `unknown` to `{}` and the field reads fail.
      case 'activity':
        return this.groupMailingService.getActivityLog(id).pipe(
          tap((res: IApiRes<IGroupMailingActivityLog[]> | null) => {
            this.activityLogs.set(res?.success && res.data ? res.data : []);
          })
        );

      case 'attachments': {
        // Attachments are not their own endpoint — they hang off the item rows,
        // so this pulls the full item set rather than the 5-row preview.
        const total = this.totalItemCount();
        return this.dataTableService
          .getTableListData(
            this.itemsPayload(id, total > 0 ? total : 1000),
            this.tableId
          )
          .pipe(
            tap((res: { rowData?: unknown } | null) => {
              const rows = Array.isArray(res?.rowData)
                ? (res.rowData as IGroupMailingRawDetails[])
                : [];
              this.attachments.set(this.extractUniqueAttachments(rows));
            })
          );
      }

      default:
        return null;
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  onViewAllItems(): void {
    const id = this.panelService.groupId();
    if (!id) return;
    const dialogData: IGroupMailingItemsModalData = {
      groupId: id,
      groupName: this.panelService.groupName() || ''
    };
    this.dialog.open(V4GroupMailingItemsModalComponent, {
      width: 'calc(100vw - 64px)',
      maxWidth: 'calc(100vw - 64px)',
      height: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: ['paddingless-modal-rounded'],
      data: dialogData
    });
  }

  /** Carrier tracking page — an external URL, so straight to a new tab. */
  onOpenTracking(): void {
    const link = this.data()?.tracking_link;
    if (!link) return;
    window.open(link, '_blank');
  }

  viewAttachment(attachment: IGroupMailingAttachment): void {
    if (this.viewingAttachmentId()) return;
    this.viewingAttachmentId.set(attachment.id);

    this.checkService
      .viewAttachmentDocument(attachment.id)
      .pipe(
        finalize(() => this.viewingAttachmentId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.URL) {
            window.open(response.data.URL, '_blank');
          } else {
            this.alertService.failedAlert({
              title: 'Could not get attachment',
              content: 'Please try again later'
            });
          }
        },
        error: () => {
          this.alertService.failedAlert({
            title: 'Could not get attachment',
            content: 'Please try again later'
          });
        }
      });
  }

  private extractUniqueAttachments(
    rows: IGroupMailingRawDetails[]
  ): IGroupMailingAttachment[] {
    const all: IGroupMailingAttachment[] = [];
    rows.forEach((row) => {
      if (Array.isArray(row.attachments) && row.attachments.length > 0) {
        all.push(...row.attachments);
      }
    });
    return all.filter(
      (attachment, index, self) =>
        index === self.findIndex((a) => a.id === attachment.id)
    );
  }

  formatAmount(amount: string | number | undefined): string {
    if (amount === undefined || amount === null || amount === '') return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  getStatusText(status: number | string | undefined): string {
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

  /**
   * Badge colours for one mailing item. Both halves come from the same
   * `--v4-badge-*` family — pairing a `--v4-common-*-color` text with a
   * `--v4-badge-*-bg-color` background mixes two palettes that were not designed
   * against each other.
   */
  getStatusColors(status: number | string | undefined): {
    bg: string;
    text: string;
  } {
    const name = this.getStatusText(status).toLowerCase();
    const tone = (t: 'success' | 'error' | 'warning' | 'accent' | 'info') => ({
      bg: `var(--v4-badge-${t}-bg-color)`,
      text: `var(--v4-badge-${t}-text-color)`
    });

    if (['mailed', 'posted'].some((k) => name.includes(k)))
      return tone('success');
    if (
      ['void', 'failed', 'cancelled', 'unmapped'].some((k) => name.includes(k))
    ) {
      return tone('error');
    }
    if (
      ['pending', 'schedule', 'approval', 'requested', 'funding'].some((k) =>
        name.includes(k)
      )
    ) {
      return tone('warning');
    }
    if (
      ['printing', 'printed', 'eprinted', 'e-printed', 'new', 'blank'].some(
        (k) => name.includes(k)
      )
    ) {
      return tone('accent');
    }
    return tone('info');
  }

  private splitAddress(address: string | undefined | null): string[] {
    if (!address || !address.toString().trim()) return [];

    let lines: string[];
    if (/<br\s*\/?>/i.test(address)) {
      lines = address
        .split(/<br\s*\/?>/i)
        .map((part) => part.replace(/\s+/g, ' ').trim())
        .filter((part) => part.length > 0);
    } else {
      const cleaned = address.replace(/[ \t]+/g, ' ').trim();
      if (!cleaned.includes('\n') && !cleaned.includes(',')) {
        lines = [cleaned];
      } else {
        lines = cleaned
          .split(/[,\n]/)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);
      }
    }

    return lines;
  }
}

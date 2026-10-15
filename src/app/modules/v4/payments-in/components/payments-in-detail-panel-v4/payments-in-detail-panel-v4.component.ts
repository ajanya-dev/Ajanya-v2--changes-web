import {
  IPdMetaPart,
  pdMetaLine,
  PdMetaLinesComponent
} from 'src/app/shared/V4/pd-meta-lines/pd-meta-lines.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  filter,
  finalize,
  forkJoin,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import {
  IReceiveCheckActivityLog,
  IReceiveCheckDetails,
  IRecieveCheckRow
} from 'src/app/modules/receive-payments/model/ReceivePayment';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IApiRes } from 'src/app/models/api';
import { getPaymentStatusBadge } from 'src/app/modules/v4-pages/v4-dashboard/utils/transaction-status.utils';
import { IGetAttachment, IGetComment } from 'src/app/models/common';
import { IPodDetails } from 'src/app/modules/payments/model/payments';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import {
  IActivityEntry,
  PoAuditLogListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/audit-log-list/audit-log-list.component';
import { PoCommentsListComponent } from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  IAttachmentEntry,
  PoAttachmentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import {
  IPodEntry,
  PoPodListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/pod-list/pod-list.component';
import { CheckPreviewV4Component } from 'src/app/shared/V4/for-side-drawer/check-preview-v4/check-preview-v4.component';
import { MetadataActivityListV4Component } from 'src/app/shared/V4/for-side-drawer/metadata-activity-list-v4/metadata-activity-list-v4.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';
import { PhoneNumberFormatterPipe } from 'src/app/pipes/phone-number-formatter.pipe';

/** The resource path every generic `/{type}/{id}/…` verb uses for this panel. */
const RESOURCE = 'request-payments';

/** Shortcuts the API embeds in a received-payment status name. These render in
 *  caps; every other word is an ordinary word and reads as one, so "Email" and
 *  "Mail" are not shouted. Add a shortcut here when the API introduces one. */
const STATUS_SHORTCUTS = new Set([
  'GPPL',
  'GPBL',
  'PYMT',
  'TPP',
  'TTP',
  'DD',
  'DDC',
  'ACH',
  'POD',
  'HTML',
  'PA',
  'AV'
]);

export type ActionGridSection =
  | 'audit'
  | 'comments'
  | 'attachments'
  | 'metadata'
  | 'pod';

/** One cell of the shared received-payments status map, keyed [received_type][status]. */
interface IStatusInfo {
  statusShortDescription: string;
  color: string;
  receivedTypeDescription?: string;
}

@Component({
  selector: 'app-payments-in-detail-panel-v4',
  standalone: true,
  imports: [
    PdMetaLinesComponent,
    PdSkeletonComponent,
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    DetailSidePanelComponent,
    PoAuditLogListComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    PoPodListComponent,
    CheckPreviewV4Component,
    MetadataActivityListV4Component,
    PdDateTimeComponent,
    PdShowMoreComponent
  ],
  templateUrl: './payments-in-detail-panel-v4.component.html',
  styleUrls: ['./payments-in-detail-panel-v4.component.scss']
})
export class PaymentsInDetailPanelV4Component {
  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  uuid = input.required<string>();
  encryptedId = input.required<string>();
  row = input<IRecieveCheckRow | null>(null);
  isOpen = input(false);
  /** z-index for the panel backdrop; panel itself uses backdropZIndex + 1. Default 200. */
  backdropZIndex = input(200);
  /** Optional badge override used when statusMap lookup isn't available (e.g. dashboard view). */
  statusBadgeOverride = input<IDetailPanelStatusBadge | undefined>(undefined);

  /** Emits `true` when the panel changed something the host grid renders. */
  closed = output<boolean>();
  actionButtonClicked = output<string>();

  /** Set by every successful comment/attachment mutation; reported on close. */
  private mutated = false;

  onPanelClosed(): void {
    this.closed.emit(this.mutated);
  }

  // ── Services ──────────────────────────────────────────────────────────────
  private requestPaymentsService = inject(RequestPaymentsService);
  private sharedService = inject(SharedService);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  /** Standalone instances — the party card's lines are built in a computed, not the template. */
  private readonly datePipe = new DatePipe('en-US');
  private readonly phonePipe = new PhoneNumberFormatterPipe();

  // ── State ─────────────────────────────────────────────────────────────────
  details = signal<IReceiveCheckDetails | null>(null);
  isLoading = signal(false);
  openActionSection = signal<ActionGridSection | null>(null);
  /** null = not loaded yet (skeleton), [] = loaded and empty (empty-state sentence). */
  comments = signal<IGetComment[] | null>(null);
  attachments = signal<IGetAttachment[] | null>(null);
  /** Attachment encrypted_id currently being deleted (for loading state). */
  deletingAttachmentId = signal<string | null>(null);
  /** Inline comment composer state (po-comments-list). */
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  /** Inline attachment picker state (po-attachments-list). */
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);
  podAttachments = signal<IPodDetails[] | null>(null);
  /** Eager — it feeds the always-visible status timeline card, not just the audit tile. */
  activityLogs = signal<IReceiveCheckActivityLog[] | null>(null);
  /** Mirrors the shared panel's expanded (wide, two-column) state. */
  isPanelExpanded = signal(false);

  // ── Timeline cap (v4-detail-panel skill §7) ───────────────────────────────
  /** Collapsed shows the latest 2 behind a "Show N more" link; expanded scrolls. */
  private readonly TIMELINE_COLLAPSED_COUNT = 2;
  timelineShowAll = signal(false);

  visibleActivityLogs = computed(() => {
    const list = this.activityLogs() ?? [];
    return this.timelineShowAll() || this.isPanelExpanded()
      ? list
      : list.slice(0, this.TIMELINE_COLLAPSED_COUNT);
  });

  canShowMoreTimeline = computed(
    () =>
      !this.isPanelExpanded() &&
      (this.activityLogs()?.length ?? 0) > this.TIMELINE_COLLAPSED_COUNT
  );

  hiddenTimelineCount = computed(
    () => (this.activityLogs()?.length ?? 0) - this.TIMELINE_COLLAPSED_COUNT
  );

  statusMap = signal<Record<string, Record<string, IStatusInfo>>>({});

  /** Sections already fetched for the current uuid — re-opening one never refetches. */
  private loadedSections = new Set<string>();
  /** Sections whose request is in flight — drives the inline section skeleton. */
  private loadingSections = signal<string[]>([]);
  /** Cancels in-flight section requests when the panel switches record. */
  private panelReset$ = new Subject<void>();

  // ── Per-card collapse (the ⌃ chevron on each `.pd-card-head`) ──────────────
  collapsedCards = signal<Record<string, boolean>>({});

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // ── Panel header config ───────────────────────────────────────────────────
  /** The status-map cell for this row, or null when the map isn't loaded yet. */
  private statusInfo = computed<IStatusInfo | null>(() => {
    const row = this.row();
    if (!row) return null;
    return this.statusMap()?.[row.received_type]?.[row.status] ?? null;
  });

  /** Received type as the API names it ("Check", "ACH", …); falls back to Check. */
  methodLabel = computed(
    () => this.statusInfo()?.receivedTypeDescription?.trim() || 'Check'
  );

  /** Gates the check-only rows and tile; this panel also serves wallet and ACH. */
  isCheckPayment = computed(
    () =>
      !!(
        this.details()?.chequeSerialNumber ||
        this.row()?.cheque_serial_number ||
        this.details()?.chequeStatus ||
        this.row()?.cheque_status
      )
  );

  panelTitle = computed(() => {
    const amt = this.row()?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  /** Inline gray text after the amount: "from {payer name}" (mirrors payments-out's "to {payee}"). */
  panelTitleSuffix = computed(() => {
    const name = this.row()?.check_from_name;
    return name ? `from ${name}` : '';
  });

  /** Meta line under the title: "Check · Ref {check no} · {date}". */
  panelMetaLines = computed<IPdMetaPart[][]>(() => {
    const row = this.row();
    if (!row) return [];
    return [
      pdMetaLine([
        { label: 'Method:', value: this.methodLabel() },
        {
          label: 'Ref:',
          value: row.cheque_serial_number ?? this.details()?.chequeSerialNumber
        }
      ]),
      pdMetaLine([
        {
          label: 'Created:',
          value: this.formatStamp(row.created_at, 'MM/dd/yyyy')
        }
      ])
    ].filter((l) => l.length);
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const info = this.statusInfo();
    if (!info) return this.statusBadgeOverride();
    // The designed text/bg pair — the raw `info.color` is not designed against
    // the badge backgrounds, so pairing the two produced mismatched badges.
    const badge = getPaymentStatusBadge(info.statusShortDescription);
    return {
      // `preserveText` or the panel's titlecase turns "PYMT" back into "Pymt".
      text: this.formatStatusLabel(info.statusShortDescription),
      color: badge.textColor,
      bgColor: badge.bg,
      preserveText: true
    };
  });

  /** "Pymt-Receiving" → "PYMT Receiving": every separator becomes a space, a
   *  known shortcut is capitalised and every ordinary word is Title Case. */
  formatStatusLabel(raw: string | undefined): string {
    return (raw ?? '')
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((word) =>
        STATUS_SHORTCUTS.has(word.toUpperCase())
          ? word.toUpperCase()
          : word[0].toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
  }

  /** Only the actions this record can actually take — same status/type rules as
   *  the list's `onRowSelected`. The host runs them; the panel just closes. */
  readonly panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const row = this.row();
    if (!row) return [];
    const { status, received_type: type } = row;
    const buttons: IDetailPanelActionButton[] = [];

        if ([4, 5].includes(status)) {
      buttons.push({
        label: 'Print',
        lucideIcon: 'printer',
        variant: 'outline',
        key: 'panel-print'
      });
    }
    if (type !== 1 && [4, 5].includes(status)) {
      buttons.push({
        label: 'Direct deposit',
        lucideIcon: 'landmark',
        variant: 'outline',
        key: 'panel-dd'
      });
    }
    if ([1, 2].includes(status) || (status === 52 && type === 4)) {
      buttons.push({
        label: 'Accept',
        lucideIcon: 'circle-check',
        variant: 'primary',
        key: 'panel-accept'
      });
    }
    if ([1, 2].includes(status) || (status === 4 && type === 4)) {
      buttons.push({
        label: 'Reject',
        lucideIcon: 'x',
        variant: 'danger',
        key: 'panel-reject'
      });
    }
    return buttons;
  });

  // ── Derived display models ────────────────────────────────────────────────
  /** Compact payer identity for the party card — one computed, no field chains in the template. */
  payerDisplay = computed(() => {
    const r = this.row();
    const name = (r?.check_from_name ?? '').trim();
    const email = (r?.sender_email ?? '').trim();
    const phone = this.phonePipe.transform((r?.sender_phone ?? '').trim());
    const address = [
      r?.sender_address_line_1,
      r?.sender_city,
      r?.sender_state,
      r?.sender_zip
    ]
      .map((part) => (part == null ? '' : String(part).trim()))
      .filter(Boolean)
      .join(', ');
    // Many received payments carry only an email. Promote it to the headline
    // rather than rendering "—" over it and repeating it on the line below.
    const headline = name || email || phone;
    const contact = [name ? email : '', name || email ? phone : '']
      .filter(Boolean)
      .join(' · ');
    const initials =
      (headline || '?')
        .trim()
        .split(/[\s@._-]+/)
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
    return {
      headline,
      contact,
      address,
      initials,
      has: !!(headline || address)
    };
  });

  /** The check's bank block — already returned by the details API, previously unused. */
  bankDetails = computed(() => {
    const d = this.details();
    const a = d?.account_details;
    const address =
      [
        a?.bankAccountAddressLine1,
        a?.bankAccountAddressLine2,
        a?.bankAccountCity,
        a?.bankAccountState,
        a?.bankAccountZip
      ]
        .map((part) => (part == null ? '' : String(part).trim()))
        .filter(Boolean)
        .join(', ') || (a?.bankAccountAddress ?? '').trim();
    const bankName = (d?.bankName ?? '').trim();
    const accountName = (a?.bankAccountAccountName ?? '').trim();
    const accountNumber = (a?.bankAccountAccountNumber ?? '').trim();
    const routingNumber = (a?.bankAccountRoutingNumber ?? '').trim();
    return {
      bankName,
      accountName,
      accountNumber,
      routingNumber,
      address,
      has: !!(
        bankName ||
        accountName ||
        accountNumber ||
        routingNumber ||
        address
      )
    };
  });

  /** Raw timestamps normalised to "MM/dd/yyyy hh:mm a" so pd-date-time can stack them. */
  createdAt = computed(() => this.formatStamp(this.row()?.created_at));
  updatedAt = computed(() => this.formatStamp(this.row()?.updated_at));

  /** Falls back to the raw string; a date-only value keeps a date-only result. */
  private formatStamp(value?: string | null, format?: string): string {
    if (!value) return '';
    const pattern =
      format ??
      (/\d{1,2}:\d{2}/.test(value) ? 'MM/dd/yyyy hh:mm a' : 'MM/dd/yyyy');
    try {
      return this.datePipe.transform(value, pattern) ?? value;
    } catch {
      return value;
    }
  }

  amountValue = computed(() => {
    const amt = this.details()?.chequeAmount || this.row()?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '—';
  });

  /** Timeline middle line: drops a note that just repeats the status. */
  timelineDescription(log: IReceiveCheckActivityLog): string {
    const key = (v?: string) =>
      (v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const parts: string[] = [];
    if (log.note && key(log.note) !== key(log.status)) parts.push(log.note);
    if (log.userName) parts.push(log.userName);
    return parts.join(' · ');
  }

  /** Adapts payments-in activity logs to the po-audit-log-list input shape
   *  (only the field name differs: userFormatedActivityDate → formattedCreatedAt). */
  auditLogsForList = computed<IActivityEntry[] | null>(() => {
    const list = this.activityLogs();
    if (list == null) return null;
    return list.map((item) => ({
      formattedCreatedAt: item.userFormatedActivityDate,
      status: item.status,
      userName: item.userName,
      ipAddress: item.ipAddress,
      note: item.note
    }));
  });

  /** Maps API POD data to the shared po-pod-list shape. */
  podForList = computed<IPodEntry[] | null>(() => {
    const list = this.podAttachments();
    if (list == null) return null;
    return list.map((item) => ({
      date: item.formated_date,
      user: item.user_name,
      file: item.file_name ?? item.file_path ?? '',
      publicUrl: item.public_url
    }));
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    // Shared status map (populated by the parent list's getStatus() call).
    this.requestPaymentsService
      .getStatusArray()
      .pipe(takeUntilDestroyed())
      .subscribe((arr) => {
        this.statusMap.set(
          arr as unknown as Record<string, Record<string, IStatusInfo>>
        );
      });

    // Eager: only what the first view shows. The rest is loadSection().
    const loadTrigger = computed(() => ({
      u: this.uuid(),
      e: this.encryptedId()
    }));
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        filter(({ u }) => !!u),
        switchMap(() => {
          this.resetForNewRecord();
          const fallback = <T>() =>
            of({ success: false, data: null } as IApiRes<T>);
          return forkJoin({
            details: this.requestPaymentsService
              .getCheckView(this.uuid())
              .pipe(catchError(() => fallback<IReceiveCheckDetails>())),
            activityLogs: this.requestPaymentsService
              .recieveCheckActiveLog(this.uuid())
              .pipe(catchError(() => fallback<IReceiveCheckActivityLog[]>()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe({
        next: (res) => {
          this.details.set(res.details.data);
          const activityData = res.activityLogs.data;
          this.activityLogs.set(
            Array.isArray(activityData) ? activityData : []
          );
          // Auto-open one section so the panel never lands on a half-empty grid.
          this.openActionSection.set('audit');
        },
        error: () => this.isLoading.set(false)
      });
  }

  /** Clears every signal + in-flight request so record B never shows record A's data. */
  private resetForNewRecord(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set(null);
    this.details.set(null);
    this.comments.set(null);
    this.attachments.set(null);
    this.podAttachments.set(null);
    this.activityLogs.set(null);
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.deletingAttachmentId.set(null);
    this.mutated = false;
    this.isLoading.set(true);
  }

  /** Dot color for a status-timeline stage. Shares the header badge's mapping so
   *  a step and the header can never disagree about what a status means — the
   *  local keyword list it replaced fell through to grey for most statuses. */
  timelineColor(status: string | undefined): string {
    return getPaymentStatusBadge(status ?? '').textColor;
  }

  // ── Lazy section loading ──────────────────────────────────────────────────
  /** True while the given section's request is in flight (shows a skeleton). */
  isSectionLoading(key: string): boolean {
    return this.loadingSections().includes(key);
  }

  private loadSection(key: ActionGridSection): void {
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

  /** The request backing one section, or null when it needs no API call. */
  private sectionRequest(key: ActionGridSection): Observable<unknown> | null {
    const encryptedId = this.encryptedId();
    switch (key) {
      case 'comments':
        return encryptedId ? this.comments$() : null;

      case 'attachments':
        return encryptedId ? this.attachments$() : null;

      case 'pod':
        return encryptedId ? this.pod$() : null;

      // Audit rides along with the eager fetch (it also feeds the timeline
      // card); metadata renders from details().
      case 'audit':
      case 'metadata':
      default:
        return null;
    }
  }

  /** One builder per resource — shared by the first lazy load and every refetch. */
  private comments$(): Observable<unknown> {
    return this.sharedService
      .getAllComments(RESOURCE, this.encryptedId())
      .pipe(
        tap((res) =>
          this.comments.set(
            res?.success ? ((res.data as IGetComment[]) ?? []) : []
          )
        )
      );
  }

  private attachments$(): Observable<unknown> {
    return this.sharedService
      .getAttachment(RESOURCE, this.encryptedId())
      .pipe(
        tap((res) =>
          this.attachments.set(
            res?.success ? ((res.data as IGetAttachment[]) ?? []) : []
          )
        )
      );
  }

  private pod$(): Observable<unknown> {
    return this.paymentsService
      .getPodFile(RESOURCE, this.encryptedId())
      .pipe(
        tap((res) =>
          this.podAttachments.set(
            res?.success ? ((res.data as IPodDetails[]) ?? []) : []
          )
        )
      );
  }

  // ── Action grid ───────────────────────────────────────────────────────────
  selectSection(section: ActionGridSection): void {
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
    // Fetch on open only — closing a section must not re-trigger its request.
    if (this.openActionSection() === section) this.loadSection(section);
  }

  closeSection(): void {
    this.openActionSection.set(null);
  }

  // ── Comments ──────────────────────────────────────────────────────────────
  /** Inline composer post (po-comments-list submitComment). */
  onSubmitComment(text: string): void {
    const comment = text?.trim();
    const encryptedId = this.encryptedId();
    if (!comment || !encryptedId) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment(RESOURCE, encryptedId, { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.mutated = true;
            this.comments$()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe();
          } else {
            this.commentError.set('Couldn’t post — please try again.');
          }
        },
        error: () => this.commentError.set('Couldn’t post — please try again.')
      });
  }

  onDeleteCommentById(commentId: string): void {
    if (!commentId) return;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.sharedService
          .deleteComment(RESOURCE, 0, commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success) {
              this.mutated = true;
              this.comments.update(
                (list) =>
                  list?.filter((c) => c.encrypted_id !== commentId) ?? null
              );
            }
          });
      });
  }

  // ── Attachments ───────────────────────────────────────────────────────────
  /** Inline picker upload (po-attachments-list fileSelected). */
  onAttachmentSelected(file: File): void {
    const encryptedId = this.encryptedId();
    if (!file || !encryptedId) return;
    const formData = new FormData();
    formData.append('image', file);
    this.attachmentError.set(null);
    this.attachmentUploading.set(true);
    this.sharedService
      .addAttachment(RESOURCE, encryptedId, formData)
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Attachment added.',
              close: true,
              timeout: 1500
            });
            this.mutated = true;
            this.attachments$()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe();
          } else {
            this.attachmentError.set('Couldn’t upload — please try again.');
          }
        },
        error: () =>
          this.attachmentError.set('Couldn’t upload — please try again.')
      });
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    const attachmentId = entry?.encrypted_id;
    if (!attachmentId) return;

    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this attachment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.deletingAttachmentId.set(attachmentId);
        this.sharedService
          .deleteAttachment(RESOURCE, this.encryptedId(), attachmentId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe({
            next: (res) => {
              if (res?.success) {
                this.mutated = true;
                this.attachments$()
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe();
              }
            },
            error: () => {
              this.alertService.failedAlert({
                content: 'Failed to delete attachment. Please try again.'
              });
            }
          });
      });
  }
}

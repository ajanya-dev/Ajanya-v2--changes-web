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
import { NgClass, NgTemplateOutlet } from '@angular/common';
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

import { GetPaidByFormService } from 'src/app/shared/service/getPaidByForm/get-paid-by-form.service';
import {
  IGatPaidCheckRecurring,
  ICheckRecurringEventDetails
} from 'src/app/models/check-recurring';
import { IMetaData } from 'src/app/modules/receive-payments/model/ReceivePayment';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import {
  IActivityEntry,
  PoAuditLogListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/audit-log-list/audit-log-list.component';
import {
  ICommentEntry,
  PoCommentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import { MetadataActivityListV4Component } from 'src/app/shared/V4/for-side-drawer/metadata-activity-list-v4/metadata-activity-list-v4.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';

export type GpbfActionSection = 'audit' | 'comments' | 'metadata';

export interface IGpbfRecurringViewData {
  checkSerialNo: string;
  payableTo: string;
  payeeName: string;
  payeePhone: string;
  payeeEmail: string;
  payeeAddressLine1: string;
  amount: string;
  frequency: string;
  ofPay: number;
  ofPaid: number;
  ofLeft: string;
  memo: string;
  payeeAccount: string;
  transactionId: string;
  submittedIpAddress: string;
  submittedAt: string;
}

export interface IGpbfActivityLog {
  date: string;
  status: string;
  location: string;
  by: string;
  msg: string;
}

export interface IGpbfComment {
  date: string;
  comment: string;
  by: string;
}

/** The gpbf service returns `Observable<any>`; name the shape we actually read. */
interface IGpbfApiRes<T> {
  success?: boolean;
  data?: T | null;
}

@Component({
  selector: 'app-gpbf-recurring-detail-panel-v4',
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
    MetadataActivityListV4Component,
    PdDateTimeComponent,
    PdShowMoreComponent
  ],
  templateUrl: './gpbf-recurring-detail-panel-v4.component.html',
  styleUrls: ['./gpbf-recurring-detail-panel-v4.component.scss']
})
export class GpbfRecurringDetailPanelV4Component {
  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  checkId = input.required<string>();
  row = input<IGatPaidCheckRecurring | null>(null);
  isOpen = input(false);

  closed = output<void>();
  actionButtonClicked = output<string>();

  // ── Services ──────────────────────────────────────────────────────────────
  private getPaidByFormService = inject(GetPaidByFormService);
  private destroyRef = inject(DestroyRef);

  // ── State ─────────────────────────────────────────────────────────────────
  viewData = signal<IGpbfRecurringViewData | null>(null);
  /** null = not loaded yet (skeleton), [] = loaded and empty (empty-state sentence). */
  activityLog = signal<IGpbfActivityLog[] | null>(null);
  commentList = signal<IGpbfComment[] | null>(null);
  recurringEventDetails = signal<ICheckRecurringEventDetails[] | null>(null);
  metaData = signal<Record<string, string>>({});
  isLoading = signal(false);
  openActionSection = signal<GpbfActionSection | null>(null);
  /** Mirrors the shared panel's expanded (wide, two-column) state. */
  isPanelExpanded = signal(false);

  // ── Timeline cap (v4-detail-panel skill §7) ───────────────────────────────
  /** Collapsed shows the latest 2 behind a "Show N more" link; expanded scrolls. */
  private readonly TIMELINE_COLLAPSED_COUNT = 2;
  timelineShowAll = signal(false);

  visibleRecurringEvents = computed(() => {
    const list = this.recurringEventDetails() ?? [];
    return this.timelineShowAll() || this.isPanelExpanded()
      ? list
      : list.slice(0, this.TIMELINE_COLLAPSED_COUNT);
  });

  canShowMoreTimeline = computed(
    () =>
      !this.isPanelExpanded() &&
      (this.recurringEventDetails()?.length ?? 0) >
        this.TIMELINE_COLLAPSED_COUNT
  );

  hiddenTimelineCount = computed(
    () =>
      (this.recurringEventDetails()?.length ?? 0) -
      this.TIMELINE_COLLAPSED_COUNT
  );

  /** Inline comment composer state (po-comments-list). */
  commentPosting = signal(false);
  commentError = signal<string | null>(null);

  /** Sections already fetched for the current checkId — re-opening never refetches. */
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
  panelTitle = computed(() => {
    const amt = this.viewData()?.amount || this.row()?.cheque_amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  /** Inline gray continuation after the amount — the party, never the meta line. */
  panelTitleSuffix = computed(() => {
    const name = this.viewData()?.payeeName || this.row()?.payee_name;
    return name ? `from ${name}` : '';
  });

  /** Meta under the title (panelMeta template). */
  panelMetaLines = computed<IPdMetaPart[][]>(() => {
    const view = this.viewData();
    return [
      pdMetaLine([
        { label: 'Type:', value: 'Recurring' },
        {
          label: 'Frequency:',
          value: view?.frequency || this.row()?.rrule_freq
        }
      ]),
      pdMetaLine([{ label: 'Ref:', value: view?.checkSerialNo }])
    ].filter((l) => l.length);
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const row = this.row();
    return row ? this.statusBadge(row.status) : undefined;
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const row = this.row();
    if (!row) return [];
    switch (row.status) {
      case 1: // Started
      case 5: // Starting soon
        return [
          {
            label: 'Pause',
            variant: 'warning' as const,
            key: 'pause',
            lucideIcon: 'pause'
          },
          {
            label: 'Cancel',
            variant: 'outline' as const,
            key: 'cancel',
            lucideIcon: 'x',
            customTextColor: 'var(--v4-common-red-color)'
          }
        ];
      case 3: // Paused
        return [
          {
            label: 'Resume',
            variant: 'outline' as const,
            key: 'resume',
            lucideIcon: 'play',
            customTextColor: 'var(--v4-common-green-color)'
          },
          {
            label: 'Cancel',
            variant: 'outline' as const,
            key: 'cancel',
            lucideIcon: 'x',
            customTextColor: 'var(--v4-common-red-color)'
          }
        ];
      default: // Completed (2), Cancelled (4)
        return [];
    }
  });

  // ── Derived display models ────────────────────────────────────────────────
  /** Compact payee identity for the party card — one computed, no field chains. */
  payeeDisplay = computed(() => {
    const v = this.viewData();
    const name = (v?.payeeName || this.row()?.payee_name || '').trim();
    const email = (v?.payeeEmail ?? '').trim();
    const phone = (v?.payeePhone ?? '').trim();
    const address = (v?.payeeAddressLine1 ?? '').trim();
    const contact = [email, phone].filter(Boolean).join(' · ');
    const initials =
      (name || '?')
        .trim()
        .split(/\s+/)
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
    // No payee id anywhere in this API's payload, so no "Open payee" link —
    // rendering a dead button would be worse than omitting the affordance.
    return {
      name,
      contact,
      address,
      account: (v?.payeeAccount ?? '').trim(),
      initials,
      has: !!(name || contact || address)
    };
  });

  /** Unlimited schedules report no finite counts — say so instead of showing a number. */
  isUnlimited = computed(() => this.row()?.is_it_unlimited === 1);

  totalPayments = computed(() =>
    this.isUnlimited()
      ? 'Unlimited'
      : String(this.viewData()?.ofPay ?? this.row()?.total ?? '—')
  );

  paymentsMade = computed(() =>
    String(this.viewData()?.ofPaid ?? this.row()?.completed ?? '—')
  );

  paymentsLeft = computed(() =>
    this.isUnlimited()
      ? 'Unlimited'
      : String(this.viewData()?.ofLeft ?? this.row()?.remaining ?? '—')
  );

  /** Adapts gpbf activity logs to the po-audit-log-list input shape. */
  auditLogsForList = computed<IActivityEntry[] | null>(() => {
    const list = this.activityLog();
    if (list == null) return null;
    return list.map((item) => ({
      formattedCreatedAt: item.date,
      status: item.status,
      userName: item.by,
      ipAddress: item.location,
      note: item.msg
    }));
  });

  /** Adapts gpbf comments to the po-comments-list input shape. */
  commentsForList = computed<ICommentEntry[] | null>(() => {
    const list = this.commentList();
    if (list == null) return null;
    return list.map((item) => ({
      formated_date: item.date,
      comments: item.comment,
      user_name: item.by
    }));
  });

  /** The metadata list takes the `{ metaData: {…} }` wrapper shape. */
  metaDataForList = computed<IMetaData[]>(() =>
    Object.keys(this.metaData()).length ? [{ metaData: this.metaData() }] : []
  );

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    // Eager: only what the first view shows. The rest is loadSection().
    toObservable(computed(() => this.checkId()))
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.resetForNewRecord();
          const fallback = () => of({ success: false, data: null });
          return forkJoin({
            details: this.getPaidByFormService
              .viewgpbfCheck(id)
              .pipe(catchError(() => fallback())),
            events: this.getPaidByFormService
              .getRecurringEventDetails(id)
              .pipe(catchError(() => fallback()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe({
        next: (res) => {
          if (res.details?.success) {
            const data = res.details.data as IGpbfRecurringViewData & {
              meta_data?: string | Record<string, string>;
            };
            this.viewData.set(data);
            this.metaData.set(this.parseMetaData(data.meta_data));
          }
          this.recurringEventDetails.set(
            res.events?.success
              ? ((res.events.data as ICheckRecurringEventDetails[]) ?? [])
              : []
          );
          // Auto-open one section so the panel never lands on a half-empty grid.
          this.selectSection('audit');
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
    this.viewData.set(null);
    this.activityLog.set(null);
    this.commentList.set(null);
    this.recurringEventDetails.set(null);
    this.metaData.set({});
    this.commentError.set(null);
    this.isLoading.set(true);
  }

  /** The blob arrives as either a JSON string or an already-parsed object. */
  private parseMetaData(
    raw?: string | Record<string, string>
  ): Record<string, string> {
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Record<string, string>;
      } catch {
        return {};
      }
    }
    return raw && typeof raw === 'object' ? raw : {};
  }

  // ── Lazy section loading ──────────────────────────────────────────────────
  /** True while the given section's request is in flight (shows a skeleton). */
  isSectionLoading(key: string): boolean {
    return this.loadingSections().includes(key);
  }

  private loadSection(key: GpbfActionSection): void {
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
  private sectionRequest(key: GpbfActionSection): Observable<unknown> | null {
    switch (key) {
      case 'audit':
        return this.activity$();
      case 'comments':
        return this.comments$();
      // Metadata rides along inside the details response — no request.
      case 'metadata':
      default:
        return null;
    }
  }

  /** One builder per resource — shared by the first lazy load and every refetch. */
  private activity$(): Observable<unknown> {
    return this.getPaidByFormService
      .getgpbfActivityLog(this.checkId())
      .pipe(
        tap((res: IGpbfApiRes<IGpbfActivityLog[]>) =>
          this.activityLog.set(res?.success ? (res.data ?? []) : [])
        )
      );
  }

  private comments$(): Observable<unknown> {
    return this.getPaidByFormService
      .getComment(this.checkId())
      .pipe(
        tap((res: IGpbfApiRes<IGpbfComment[]>) =>
          this.commentList.set(res?.success ? (res.data ?? []) : [])
        )
      );
  }

  // ── Action grid ───────────────────────────────────────────────────────────
  selectSection(section: GpbfActionSection): void {
    this.commentError.set(null);
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
    // Fetch on open only — closing a section must not re-trigger its request.
    if (this.openActionSection() === section) this.loadSection(section);
  }

  closeSection(): void {
    this.openActionSection.set(null);
  }

  /** Inline composer post (po-comments-list submitComment). */
  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.getPaidByFormService
      .addComments({ id: this.checkId(), comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
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

  // ── Status colours ────────────────────────────────────────────────────────
  /** One tone per status, so the timeline dot and any badge never disagree. */
  private eventTone(
    status: string | undefined
  ): 'success' | 'warning' | 'error' | 'info' {
    const s = (status ?? '').toLowerCase();
    if (s === 'completed' || s === 'paid') return 'success';
    if (s === 'pending') return 'warning';
    if (s === 'failed' || s === 'cancelled' || s === 'canceled') return 'error';
    return 'info';
  }

  timelineColor(status: string | undefined): string {
    switch (this.eventTone(status)) {
      case 'success':
        return 'var(--v4-common-green-color)';
      case 'warning':
        return 'var(--v4-common-yellow-color)';
      case 'error':
        return 'var(--v4-common-red-color)';
      default:
        return 'var(--v4-tertiary-text-color)';
    }
  }

  private statusBadge(status: number): IDetailPanelStatusBadge {
    const badge = (
      tone: 'info' | 'success' | 'warning' | 'error',
      text: string
    ): IDetailPanelStatusBadge => ({
      text,
      color: `var(--v4-badge-${tone}-text-color)`,
      bgColor: `var(--v4-badge-${tone}-bg-color)`
    });
    switch (status) {
      case 1:
        return badge('success', 'Started');
      case 2:
        return badge('success', 'Completed');
      case 3:
        return badge('warning', 'Paused');
      case 4:
        return badge('error', 'Cancelled');
      case 5:
        return badge('info', 'Starting soon');
      default:
        return badge('info', 'Unknown');
    }
  }
}

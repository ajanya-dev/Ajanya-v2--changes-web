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
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IAchRecurringTableRow,
  ICheckRecurringEventDetails
} from 'src/app/models/check-recurring';
import { IGetComment } from 'src/app/models/common';
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
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';

/** The resource path every generic `/{type}/{id}/…` verb uses for this panel. */
const RESOURCE = 'ach-recurring';

export type AchActionSection = 'audit' | 'comments';

export interface IAchRecurringViewData {
  status: string;
  amount: string;
  frequency: string;
  startDate: string;
  endDate: string;
  ofPay: number;
  ofPaid: number;
  ofLeft: string;
  payableTo: string;
  memo: string;
}

export interface IAchRecurringPayerDetails {
  heading?: string;
  payeeName: string;
  payeeEmail: string;
  address: {
    payeeName: string;
    addressLine1: string;
    payeeCity: string;
    payeeState: string;
    payeeZip: string;
    payeeCountry: string;
  };
}

export interface IAchRecurringAuditTrail {
  date: string;
  status: string;
  ipOrLocation: string;
  by: string;
  note: string;
}

/** The gpbf service returns `Observable<any>`; name the shape we actually read. */
interface IAchApiRes<T> {
  success?: boolean;
  data?: T | null;
}

@Component({
  selector: 'app-ach-recurring-detail-panel-v4',
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
    PdDateTimeComponent,
    PdShowMoreComponent
  ],
  templateUrl: './ach-recurring-detail-panel-v4.component.html',
  styleUrls: ['./ach-recurring-detail-panel-v4.component.scss']
})
export class AchRecurringDetailPanelV4Component {
  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  rowId = input.required<string>();
  row = input<IAchRecurringTableRow | null>(null);
  isOpen = input(false);

  closed = output<void>();
  actionButtonClicked = output<string>();

  // ── Services ──────────────────────────────────────────────────────────────
  private getPaidByFormService = inject(GetPaidByFormService);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  // ── State ─────────────────────────────────────────────────────────────────
  viewData = signal<IAchRecurringViewData | null>(null);
  payerDetails = signal<IAchRecurringPayerDetails | null>(null);
  /** null = not loaded yet (skeleton), [] = loaded and empty (empty-state sentence). */
  auditTrail = signal<IAchRecurringAuditTrail[] | null>(null);
  commentList = signal<IGetComment[] | null>(null);
  recurringEventDetails = signal<ICheckRecurringEventDetails[] | null>(null);
  isLoading = signal(false);
  openActionSection = signal<AchActionSection | null>(null);
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

  /** Sections already fetched for the current rowId — re-opening never refetches. */
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
    const amt =
      this.viewData()?.amount || this.row()?.recurring_base_data?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  /** Inline gray continuation after the amount — the party, never the meta line. */
  panelTitleSuffix = computed(() => {
    const name =
      this.payerDetails()?.payeeName ||
      this.viewData()?.payableTo ||
      this.row()?.from;
    return name ? `from ${name}` : '';
  });

  /** Meta under the title (panelMeta template). */
  panelMetaLines = computed<IPdMetaPart[][]>(() => [
    pdMetaLine([
      { label: 'Type:', value: 'ACH recurring' },
      {
        label: 'Frequency:',
        value: this.viewData()?.frequency || this.row()?.rrule_freq
      }
    ]),
    pdMetaLine([
      {
        label: 'Starts:',
        value: this.viewData()?.startDate || this.row()?.start_date
      }
    ])
  ].filter((l) => l.length));

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const row = this.row();
    return row ? this.statusBadge(row.status) : undefined;
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const row = this.row();
    if (!row) return [];
    switch (row.status) {
      case 1: // Started
        return [
          {
            label: 'Pause',
            lucideIcon: 'pause',
            variant: 'warning' as const,
            key: 'pause'
          },
          {
            label: 'Cancel',
            lucideIcon: 'x',
            variant: 'outline' as const,
            key: 'cancel',
            customTextColor: 'var(--v4-common-red-color)'
          }
        ];
      case 3: // Paused
        return [
          {
            label: 'Resume',
            lucideIcon: 'play',
            variant: 'outline' as const,
            key: 'resume',
            customTextColor: 'var(--v4-common-green-color)'
          },
          {
            label: 'Cancel',
            lucideIcon: 'x',
            variant: 'outline' as const,
            key: 'cancel',
            customTextColor: 'var(--v4-common-red-color)'
          }
        ];
      default: // Completed (2), Cancelled (4)
        return [];
    }
  });

  // ── Derived display models ────────────────────────────────────────────────
  /** Party card identity; the address is joined here, never in the template. */
  payerDisplay = computed(() => {
    const payer = this.payerDetails();
    const name = (
      payer?.payeeName ||
      this.viewData()?.payableTo ||
      this.row()?.from ||
      ''
    ).trim();
    const email = (payer?.payeeEmail ?? '').trim();
    const a = payer?.address;
    const address = [
      a?.payeeName === name ? '' : a?.payeeName,
      a?.addressLine1,
      a?.payeeCity,
      a?.payeeState,
      a?.payeeZip,
      a?.payeeCountry
    ]
      .map((part) => (part == null ? '' : String(part).trim()))
      .filter(Boolean)
      .join(', ');
    const initials =
      (name || '?')
        .trim()
        .split(/\s+/)
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
    // `/ach-recurring/{id}/payee-details` carries no payee id, so there is no
    // "Open payee" link — a dead button would be worse than no affordance.
    return {
      // The API names the block itself (payer vs donor); fall back to sentence case.
      heading: (payer?.heading ?? '').trim() || 'Payer details',
      name,
      email,
      address,
      initials,
      has: !!(name || email || address)
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

  /** Adapts the ach audit trail to the po-audit-log-list input shape. */
  auditLogsForList = computed<IActivityEntry[] | null>(() => {
    const list = this.auditTrail();
    if (list == null) return null;
    return list.map((item) => ({
      formattedCreatedAt: item.date,
      status: item.status,
      userName: item.by,
      ipAddress: item.ipOrLocation,
      note: item.note
    }));
  });

  /** Adapts the generic comment payload to the po-comments-list input shape. */
  commentsForList = computed<ICommentEntry[] | null>(() => {
    const list = this.commentList();
    if (list == null) return null;
    return list.map((item) => ({
      id: item.id,
      encrypted_id: item.encrypted_id,
      formated_date: item.formated_date,
      comments: item.comments,
      user_name: item.user_name
    }));
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    // Eager: only what the first view shows. The rest is loadSection().
    toObservable(computed(() => this.rowId()))
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.resetForNewRecord();
          const fallback = () => of({ success: false, data: null });
          return forkJoin({
            details: this.getPaidByFormService
              .viewRecurringDetails(id)
              .pipe(catchError(() => fallback())),
            payer: this.getPaidByFormService
              .getPersonalDetails(id)
              .pipe(catchError(() => fallback())),
            events: this.getPaidByFormService
              .getAchRecurringEvent(id)
              .pipe(catchError(() => fallback()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe({
        next: (res) => {
          if (res.details?.success) {
            this.viewData.set(res.details.data as IAchRecurringViewData);
          }
          if (res.payer?.success) {
            this.payerDetails.set(res.payer.data as IAchRecurringPayerDetails);
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
    this.payerDetails.set(null);
    this.auditTrail.set(null);
    this.commentList.set(null);
    this.recurringEventDetails.set(null);
    this.commentError.set(null);
    this.isLoading.set(true);
  }

  // ── Lazy section loading ──────────────────────────────────────────────────
  /** True while the given section's request is in flight (shows a skeleton). */
  isSectionLoading(key: string): boolean {
    return this.loadingSections().includes(key);
  }

  private loadSection(key: AchActionSection): void {
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

  private sectionRequest(key: AchActionSection): Observable<unknown> | null {
    switch (key) {
      case 'audit':
        return this.audit$();
      case 'comments':
        return this.comments$();
      default:
        return null;
    }
  }

  /** One builder per resource — shared by the first lazy load and every refetch. */
  private audit$(): Observable<unknown> {
    return this.getPaidByFormService
      .getAuditTrail(this.rowId())
      .pipe(
        tap((res: IAchApiRes<IAchRecurringAuditTrail[]>) =>
          this.auditTrail.set(res?.success ? (res.data ?? []) : [])
        )
      );
  }

  private comments$(): Observable<unknown> {
    return this.sharedService
      .getAllComments(RESOURCE, this.rowId())
      .pipe(
        tap((res) =>
          this.commentList.set(
            res?.success ? ((res.data as IGetComment[]) ?? []) : []
          )
        )
      );
  }

  // ── Action grid ───────────────────────────────────────────────────────────
  selectSection(section: AchActionSection): void {
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

  // ── Comments ──────────────────────────────────────────────────────────────
  /** Inline composer post (po-comments-list submitComment). */
  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment(RESOURCE, this.rowId(), { comment })
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

  onDeleteComment(commentId: string): void {
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
          .deleteComment(RESOURCE, this.rowId(), commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success) {
              this.commentList.update(
                (list) =>
                  list?.filter((c) => c.encrypted_id !== commentId) ?? null
              );
            }
          });
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
      default:
        return badge('info', 'Unknown');
    }
  }
}

import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';
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
import {
  NgClass,
  NgTemplateOutlet,
  DatePipe,
  TitleCasePipe
} from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  filter,
  finalize,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  ICheckMailingRecurringDetails,
  ICheckMailingRecurringJob,
  IRecurringCheck,
  ICheckAchRecurringComments,
  ICheckRecurringAuditTrialTable
} from 'src/app/models/check-recurring';
import {
  DetailSidePanelComponent,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import {
  PoCommentsListComponent,
  type ICommentEntry
} from '../../common/comments-list/comments-list.component';

/**
 * The action-grid tiles. The recurring schedule is NOT one of them — it rides
 * along in the details response, so it is a standalone timeline card instead.
 */
export type CheckMailingActionSection = 'audit' | 'comments';

/** Resource path this panel's comments / audit trail hang off. */
const RECURRING_RESOURCE = 'check-mailing/recurring';

@Component({
  selector: 'app-check-mailing-detail-panel-v4',
  standalone: true,
  imports: [
    PdShowMoreComponent,
    PdMetaLinesComponent,
    PdSkeletonComponent,
    NgClass,
    NgTemplateOutlet,
    DatePipe,
    PoCommentsListComponent,
    PdDateTimeComponent,
    CommonButtonV4Component,
    TitleCasePipe,
    LucideAngularModule,
    MatTooltipModule,
    DetailSidePanelComponent
  ],
  templateUrl: './check-mailing-detail-panel-v4.component.html',
  styleUrls: ['./check-mailing-detail-panel-v4.component.scss']
})
export class CheckMailingDetailPanelV4Component {
  rowId = input.required<string>();
  isOpen = input(false);
  openRecurringByDefault = input(false);
  retryingId = signal<string | null>(null);

  closed = output<void>();

  private checkListRecurringService = inject(CheckListRecurringService);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  checkDetails = signal<IRecurringCheck | null>(null);
  isBankDeleted = signal(false);
  isPayeeDeleted = signal(false);
  cancelDate = signal<string>('');
  recurringDetails = signal<ICheckMailingRecurringJob[]>([]);
  auditTrail = signal<ICheckRecurringAuditTrialTable[]>([]);
  commentList = signal<ICheckAchRecurringComments[]>([]);
  isLoading = signal(false);
  openActionSection = signal<CheckMailingActionSection | null>(null);
  /** True while a comment is being posted; disables the shared composer. */
  commentPosting = signal(false);
  /** Inline error shown under the composer — not a toast. */
  commentError = signal<string | null>(null);

  /**
   * Maps this resource's comment shape onto the shared list's entry shape. Both
   * describe the same `/{type}/{id}/comments` payload; only `status` differs
   * (string here, `{ status_text }` there), and the list doesn't read it.
   */
  commentsForList = computed<ICommentEntry[]>(() =>
    this.commentList().map((c) => ({
      id: c.id,
      encrypted_id: c.encrypted_id,
      formated_date: c.formated_date,
      comments: c.comments,
      user_name: c.user_name
    }))
  );

  /** Mirrors the shell's expanded (⤢) state so the body can switch to the grid. */
  isPanelExpanded = signal(false);

  // Collapsed caps: 2 for the schedule timeline, 4 for the audit table.
  // Expanded shows everything and the existing max-height wrapper scrolls.
  private readonly SCHEDULE_COLLAPSED = 2;
  private readonly AUDIT_COLLAPSED = 4;
  scheduleShowAll = signal(false);
  auditShowAll = signal(false);

  visibleSchedule = computed(() =>
    this.scheduleShowAll() || this.isPanelExpanded()
      ? this.recurringDetails()
      : this.recurringDetails().slice(0, this.SCHEDULE_COLLAPSED)
  );

  canShowMoreSchedule = computed(
    () =>
      !this.isPanelExpanded() &&
      this.recurringDetails().length > this.SCHEDULE_COLLAPSED
  );

  hiddenScheduleCount = computed(
    () => this.recurringDetails().length - this.SCHEDULE_COLLAPSED
  );

  visibleAuditTrail = computed(() =>
    this.auditShowAll() || this.isPanelExpanded()
      ? this.auditTrail()
      : this.auditTrail().slice(0, this.AUDIT_COLLAPSED)
  );

  canShowMoreAudit = computed(
    () =>
      !this.isPanelExpanded() && this.auditTrail().length > this.AUDIT_COLLAPSED
  );

  hiddenAuditCount = computed(
    () => this.auditTrail().length - this.AUDIT_COLLAPSED
  );

  /** Per-card collapse state — one signal, keyed by card. */
  collapsedCards = signal<Record<string, boolean>>({});

  /** Section keys already fetched for the current rowId (reset on open). */
  private loadedSections = new Set<string>();
  /** Section keys with a request in flight — drives the inline skeleton. */
  private loadingSections = signal<string[]>([]);
  /** Cancels in-flight section requests when the panel switches to another rowId. */
  private panelReset$ = new Subject<void>();

  panelTitle = computed(() => {
    const check = this.checkDetails();
    return check?.cheque_amount
      ? `$${parseFloat(check.cheque_amount).toFixed(2)}`
      : '';
  });

  /** Inline gray text after the amount: "to John Myres". */
  panelTitleSuffix = computed(() => {
    const name = this.checkDetails()?.payee_name;
    return name ? `to ${name}` : '';
  });

  /** Meta under the title (panelMeta template). */
  panelMetaLines = computed<IPdMetaPart[][]>(() => {
    const check = this.checkDetails();
    if (!check) return [];
    return [
      pdMetaLine([
        { label: 'Type:', value: 'Recurring check' },
        { label: 'Frequency:', value: check.rrule_freq }
      ]),
      pdMetaLine([
        { label: 'Account:', value: check.bank_account_account_name }
      ])
    ].filter((l) => l.length);
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const check = this.checkDetails();
    if (!check?.status) return undefined;
    return this.getStatusBadge(check.status, check.completed);
  });

  /**
   * Compact payee display for the O3/O4 "Payee details" card — same shape as the
   * payments-out panel, minus two fields this API does not return.
   *
   * No `phone`: not on IRecurringCheck.
   * No `id`, so no "Open payee" link — GET /check-mailing/recurring/{id}/show/
   * returns payee_name / payee_email / payee_address_* but no payee id, and the
   * grid row (ICheckRecurringTableRow) has none either. Blocked on the backend
   * adding one; when it lands, add it to IRecurringCheck, return it here, and
   * copy payments-out's onOpenPayee() (createUrlTree + window.open '_blank').
   */
  payeeDisplay = computed(() => {
    const check = this.checkDetails();
    const name = check?.payee_name ?? '';
    const email = check?.payee_email ?? '';
    const address = [
      check?.payee_address_line_1,
      check?.payee_address_line_2,
      check?.payee_city,
      check?.payee_state,
      check?.payee_zip,
      check?.payee_country
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
    return { name, email, address, initials };
  });

  constructor() {
    const loadTrigger = computed(() => this.rowId());
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.panelReset$.next();
          this.loadedSections.clear();
          this.loadingSections.set([]);
          this.collapsedCards.set({});
          this.checkDetails.set(null);
          this.isBankDeleted.set(false);
          this.isPayeeDeleted.set(false);
          this.cancelDate.set('');
          this.recurringDetails.set([]);
          this.auditTrail.set([]);
          this.commentList.set([]);
          // Auto-select the audit trail so the action card is never an empty
          // strip of tiles on open.
          this.openActionSection.set('audit');
          this.commentError.set(null);
          // Deep-linked opens land on the full recurring schedule.
          this.scheduleShowAll.set(this.openRecurringByDefault());
          this.isLoading.set(true);
          this.loadSection('audit');

          // Only the always-visible data is eager — details carry the recurring
          // schedule with them. Comments load when their tile is first opened.
          return this.checkListRecurringService.viewRecurringDetails(id).pipe(
            catchError(() => of({ success: false, data: null })),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            const d = res.data as ICheckMailingRecurringDetails;
            this.checkDetails.set(d.checks);
            this.isBankDeleted.set(!!d.isBankDeleted);
            this.isPayeeDeleted.set(!!d.isPayeeDeleted);
            this.cancelDate.set(d.cancelledDate ?? '');
            this.recurringDetails.set(d.job ?? []);
            // Never hide a retryable event behind "show more".
            if (d.job?.some((j) => j.canRetry)) this.scheduleShowAll.set(true);
          }
        }
      });
  }

  // ── Card collapse ─────────────────────────────────────────────────────────
  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // ── Action grid ───────────────────────────────────────────────────────────
  toggleSection(section: CheckMailingActionSection): void {
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
    // Fetch on open only — closing a section must not re-trigger it.
    if (this.openActionSection() === section) this.loadSection(section);
  }

  /** True while the given section's request is in flight (shows a skeleton). */
  isSectionLoading(key: CheckMailingActionSection): boolean {
    return this.loadingSections().includes(key);
  }

  /**
   * Fetch a section's data the first time it is opened rather than on panel
   * open. Cached per rowId via loadedSections, so re-opening never refetches.
   */
  private loadSection(key: CheckMailingActionSection): void {
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
  private sectionRequest(
    key: CheckMailingActionSection
  ): Observable<unknown> | null {
    switch (key) {
      case 'audit':
        return this.checkListRecurringService
          .getAchAuditTrail(RECURRING_RESOURCE, this.rowId())
          .pipe(
            tap((res) => {
              if (res?.success) {
                this.auditTrail.set(
                  (res.data as ICheckRecurringAuditTrialTable[]) ?? []
                );
              }
            })
          );

      case 'comments':
        return this.comments$();

      default:
        return null;
    }
  }

  /** Post a comment inline (no modal). Called from the shared composer. */
  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;

    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment(RECURRING_RESOURCE, this.rowId(), { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.refetchComments();
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
        title: 'Confirm',
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.sharedService
          .deleteComment(RECURRING_RESOURCE, this.rowId(), commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: 'Comment deleted successfully.',
                close: true,
                timeout: 1500
              });
              this.commentList.update((cur) =>
                cur.filter(
                  (item) => (item.encrypted_id ?? String(item.id)) !== commentId
                )
              );
            }
          });
      });
  }

  private refetchComments(): void {
    this.comments$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /**
   * Badge colours for one scheduled occurrence. `bg`/`color` drive the pill; the
   * `color` alone is reused as the dot colour on the recurring-schedule timeline,
   * so the two never drift apart.
   */
  getEventStatusBadge(status: string): { bg: string; color: string } {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'paid') {
      return {
        bg: 'var(--v4-badge-success-bg-color)',
        color: 'var(--v4-badge-success-text-color)'
      };
    }
    if (s === 'pending') {
      return {
        bg: 'var(--v4-badge-warning-bg-color)',
        color: 'var(--v4-badge-warning-text-color)'
      };
    }
    if (s === 'failed' || s === 'cancelled' || s === 'canceled') {
      return {
        bg: 'var(--v4-badge-error-bg-color)',
        color: 'var(--v4-badge-error-text-color)'
      };
    }
    return {
      bg: 'var(--v4-badge-info-bg-color)',
      color: 'var(--v4-badge-info-text-color)'
    };
  }

  /** Comments request — one builder for the lazy first load and the post refresh. */
  private comments$(): Observable<unknown> {
    return this.checkListRecurringService
      .getRecurringComment(this.rowId())
      .pipe(
        tap((res) => {
          if (res?.success) {
            this.commentList.set(
              (res.data as ICheckAchRecurringComments[]) ?? []
            );
          }
        })
      );
  }

  private refetchRecuringList(): void {
    this.checkListRecurringService
      .viewRecurringDetails(this.rowId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          const d = res.data as ICheckMailingRecurringDetails;
          this.recurringDetails.set(d.job ?? []);
        }
      });
  }

  /**
   * @description Retries a failed check mailing recurring event and refreshes the list on success.
   */
  retryEvent(id: string) {
    const isConfirm = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to retry this recurring payment?'
    });
    isConfirm.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.retryingId.set(id);
      this.checkListRecurringService
        .retryCheckMailingRecurringEvent(id)
        .pipe(
          finalize(() => this.retryingId.set(null)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({ title: ' ', content: res.data });
            this.refetchRecuringList();
          }
        });
    });
  }

  /**
   * Header badge. Supplies `bgColor` explicitly so the badge gets the designed
   * `--v4-badge-*` pair rather than the shell's derived tint fallback.
   */
  private getStatusBadge(
    status: string,
    completed: number
  ): IDetailPanelStatusBadge {
    const badge = (
      tone: 'info' | 'success' | 'warning' | 'error',
      text: string
    ) => ({
      text,
      color: `var(--v4-badge-${tone}-text-color)`,
      bgColor: `var(--v4-badge-${tone}-bg-color)`
    });

    const s = status?.toLowerCase();
    if (s === 'Started') return badge('info', 'Active');
    if (s === 'completed') return badge('success', 'Completed');
    if (s === 'paused') return badge('warning', 'Paused');
    if (s === 'canceled' || s === 'cancelled') return badge('error', status);
    return badge('info', status ?? '');
  }
}

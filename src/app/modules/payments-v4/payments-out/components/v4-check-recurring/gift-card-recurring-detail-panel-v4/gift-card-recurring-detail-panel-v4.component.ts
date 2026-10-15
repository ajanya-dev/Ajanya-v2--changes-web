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
import { NgClass, NgTemplateOutlet, TitleCasePipe } from '@angular/common';
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

import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  ICheckRecurringEventDetails,
  ICheckRecurringAuditTrialTable,
  IGiftCardRecurringComment,
  IGiftCardRecurringDetails
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
 * The action-grid tiles. The recurring events schedule is NOT one of them — it
 * is fetched eagerly and shown as a standalone timeline card.
 */
export type GiftCardRecurringViewActionSection = 'audit' | 'comments';

/** Resource path this panel's comments / audit trail hang off. */
const RECURRING_RESOURCE = 'gift-card-recurring';

@Component({
  selector: 'app-gift-card-recurring-detail-panel-v4',
  standalone: true,
  imports: [
    PdShowMoreComponent,
    PdMetaLinesComponent,
    PdSkeletonComponent,
    NgClass,
    NgTemplateOutlet,
    PoCommentsListComponent,
    PdDateTimeComponent,
    CommonButtonV4Component,
    TitleCasePipe,
    LucideAngularModule,
    DetailSidePanelComponent
  ],
  templateUrl: './gift-card-recurring-detail-panel-v4.component.html',
  styleUrls: ['./gift-card-recurring-detail-panel-v4.component.scss']
})
export class GiftCardRecurringDetailPanelV4Component {
  rowId = input.required<string>();
  isOpen = input(false);
  openRecurringByDefault = input(false);
  retryingCardId = signal<string | null>(null);
  closed = output<void>();

  private checkListRecurringService = inject(CheckListRecurringService);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  giftCardData = signal<IGiftCardRecurringDetails | null>(null);
  recurringEventDetails = signal<ICheckRecurringEventDetails[]>([]);
  auditTrail = signal<ICheckRecurringAuditTrialTable[]>([]);
  commentList = signal<IGiftCardRecurringComment[]>([]);
  isLoading = signal(false);
  openActionSection = signal<GiftCardRecurringViewActionSection | null>(null);

  /** True while a comment is being posted; disables the shared composer. */
  commentPosting = signal(false);
  /** Inline error shown under the composer — not a toast. */
  commentError = signal<string | null>(null);

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
      ? this.recurringEventDetails()
      : this.recurringEventDetails().slice(0, this.SCHEDULE_COLLAPSED)
  );

  canShowMoreSchedule = computed(
    () =>
      !this.isPanelExpanded() &&
      this.recurringEventDetails().length > this.SCHEDULE_COLLAPSED
  );

  hiddenScheduleCount = computed(
    () => this.recurringEventDetails().length - this.SCHEDULE_COLLAPSED
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

  /**
   * Maps this resource's comment shape onto the shared list's entry shape. Both
   * describe the same `/{type}/{id}/comments` payload; `created_at` covers for
   * `formated_date` when the API omits the pre-formatted one.
   */
  commentsForList = computed<ICommentEntry[]>(() =>
    this.commentList().map((c) => ({
      id: c.id,
      encrypted_id: c.encrypted_id,
      formated_date: c.formated_date ?? c.created_at,
      comments: c.comments,
      user_name: c.user_name
    }))
  );

  panelTitle = computed(() => {
    const data = this.giftCardData();
    if (data?.amount === undefined || data?.amount === null) return '';
    const amountNum = Number(data.amount);
    if (Number.isNaN(amountNum)) return `$${data.amount}`;
    return `$${amountNum.toFixed(2)}`;
  });

  /** Inline gray text after the amount: "to John Myres". */
  panelTitleSuffix = computed(() => {
    const name = this.giftCardData()?.nameOnCard;
    return name ? `to ${name}` : '';
  });

  /** Meta under the title (panelMeta template). */
  panelMetaLines = computed<IPdMetaPart[][]>(() => {
    const data = this.giftCardData();
    if (!data) return [];
    return [
      pdMetaLine([
        { label: 'Type:', value: 'Recurring gift card' },
        { label: 'Card:', value: data.cardType }
      ]),
      pdMetaLine([{ label: 'Frequency:', value: data.frequency }])
    ].filter((l) => l.length);
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const data = this.giftCardData();
    if (!data?.status) return undefined;
    return this.getStatusBadge(data.status);
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
          this.giftCardData.set(null);
          this.recurringEventDetails.set([]);
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

          // Eager: only what the always-visible cards need. Comments load when
          // their tile is first opened — see loadSection().
          const fallback = () => of({ success: false, data: null });
          return forkJoin({
            details: this.checkListRecurringService
              .viewGiftCardRecurringDetails(id)
              .pipe(catchError(() => fallback())),
            events: this.checkListRecurringService
              .getGiftCardRecurringEventDetails(id)
              .pipe(catchError(() => fallback()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe({
        next: (res) => {
          if (res.details?.success) {
            this.giftCardData.set(
              res.details.data as IGiftCardRecurringDetails
            );
          }
          if (res.events?.success) {
            const events =
              (res.events.data as ICheckRecurringEventDetails[]) ?? [];
            this.recurringEventDetails.set(events);
            // Never hide a retryable event behind "show more".
            if (events.some((e) => e.canRetry)) this.scheduleShowAll.set(true);
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
  toggleSection(section: GiftCardRecurringViewActionSection): void {
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
    // Fetch on open only — closing a section must not re-trigger it.
    if (this.openActionSection() === section) this.loadSection(section);
  }

  /** True while the given section's request is in flight (shows a skeleton). */
  isSectionLoading(key: GiftCardRecurringViewActionSection): boolean {
    return this.loadingSections().includes(key);
  }

  /**
   * Fetch a section's data the first time it is opened rather than on panel
   * open. Cached per rowId via loadedSections, so re-opening never refetches.
   */
  private loadSection(key: GiftCardRecurringViewActionSection): void {
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
    key: GiftCardRecurringViewActionSection
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

  // ── Comments ──────────────────────────────────────────────────────────────
  /** Post a comment inline (no modal). Called from the shared composer. */
  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;

    this.commentError.set(null);
    this.commentPosting.set(true);
    this.checkListRecurringService
      .addGiftCardComment(this.rowId(), comment)
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

  /** Comments request — one builder for the lazy first load and the post refresh. */
  private comments$(): Observable<unknown> {
    return this.checkListRecurringService
      .getGiftCardComments(this.rowId())
      .pipe(
        tap((res) => {
          if (res?.success) {
            this.commentList.set(
              (res.data as IGiftCardRecurringComment[]) ?? []
            );
          }
        })
      );
  }

  private refetchComments(): void {
    this.comments$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /**
   * Badge colours for one scheduled occurrence. `bg`/`color` drive the pill; the
   * `color` alone is reused as the dot colour on the recurring-events timeline,
   * so the two never drift apart.
   */
  getEventStatusBadge(status: string): { bg: string; color: string } {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'paid' || s === 'success') {
      return {
        bg: 'var(--v4-badge-success-bg-color)',
        color: 'var(--v4-badge-success-text-color)'
      };
    }
    if (s === 'pending' || s === 'paused') {
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

  retryEvent(id: string) {
    const isConfirm = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to retry this recurring payment?'
    });
    isConfirm.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.retryingCardId.set(id);
      this.checkListRecurringService
        .retryGiftCardRecurringEvent(id)
        .pipe(
          finalize(() => this.retryingCardId.set(null)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({ title: ' ', content: res.data });
            this.refetchGiftCardEvents();
          }
        });
    });
  }

  refetchGiftCardEvents(){
    this.checkListRecurringService
      .getGiftCardRecurringEventDetails(this.rowId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.recurringEventDetails.set(
            (res.data as ICheckRecurringEventDetails[]) ?? []
          );
      }
      });

  }

  /**
   * Header badge.
   */
  private getStatusBadge(status: string): IDetailPanelStatusBadge {
    const s = status?.toLowerCase();
    if (s === 'started') {
      return {
        text: 'Active',
        color: 'var(--v4-common-blue-color)',
        bgColor: 'var(--v4-badge-info-bg-color)'
      };
    }
    if (s === 'completed') {
      return {
        text: 'Completed',
        color: 'var(--v4-common-green-color)',
        bgColor: 'var(--v4-badge-success-bg-color)'
      };
    }
    if (s === 'paused') {
      return {
        text: 'Paused',
        color: 'var(--v4-common-yellow-color)',
        bgColor: 'var(--v4-badge-warning-bg-color)'
      };
    }
    if (s === 'canceled' || s === 'cancelled') {
      return {
        text: 'Cancelled',
        color: 'var(--v4-common-red-color)',
        bgColor: 'var(--v4-badge-error-bg-color)'
      };
    }
    if (s === 'scheduled') {
      return {
        text: 'Scheduled',
        color: 'var(--v4-common-blue-color)',
        bgColor: 'var(--v4-badge-info-bg-color)'
      };
    }
    return {
      text: status,
      color: 'var(--v4-common-blue-color)',
      bgColor: 'var(--v4-badge-info-bg-color)'
    };
  }
  
}

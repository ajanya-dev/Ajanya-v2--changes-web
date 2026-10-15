import {
  Component,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, of, switchMap, finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { PdShowMoreComponent } from 'src/app/shared/V4/pd-show-more/pd-show-more.component';

import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { ICheckDraftRecurringView } from '../../model/v4-Checkdraft';

@Component({
  standalone: true,
  selector: 'app-v4-check-draft-recurring-detail-panel',
  imports: [
    LucideAngularModule,
    MatTooltip,
    DetailSidePanelComponent,
    PdSkeletonComponent,
    PdShowMoreComponent
  ],
  templateUrl: './v4-check-draft-recurring-detail-panel.component.html',
  styleUrls: ['./v4-check-draft-recurring-detail-panel.component.scss']
})
export class V4CheckDraftRecurringDetailPanelComponent {
  rowId = input.required<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row = input<any>(null);
  isOpen = input(false);

  closed = output<void>();
  actionButtonClicked = output<string>();

  private checkDraftService = inject(CheckDraftService);

  // State
  viewData = signal<ICheckDraftRecurringView | null>(null);
  isLoading = signal(false);
  /** Mirrors the shared panel's expanded (wide, two-column) state. */
  isPanelExpanded = signal(false);

  collapsedCards = signal<Record<string, boolean>>({});

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // Schedule timeline: collapsed shows the first runs behind "Show N more"; expanded shows all.
  private readonly SCHEDULE_COLLAPSED_COUNT = 2;
  scheduleShowAll = signal(false);

  jobs = computed(() => this.viewData()?.job ?? []);

  visibleJobs = computed(() =>
    this.scheduleShowAll() || this.isPanelExpanded()
      ? this.jobs()
      : this.jobs().slice(0, this.SCHEDULE_COLLAPSED_COUNT)
  );

  canShowMoreJobs = computed(
    () =>
      !this.isPanelExpanded() &&
      this.jobs().length > this.SCHEDULE_COLLAPSED_COUNT
  );

  hiddenJobCount = computed(
    () => this.jobs().length - this.SCHEDULE_COLLAPSED_COUNT
  );

  // Panel header config
  panelTitle = computed(() => {
    const view = this.viewData();
    const row = this.row();
    const amt = view?.details?.amount ?? row?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  panelTitleSuffix = computed(() => {
    const name = this.viewData()?.details?.payee_name ?? this.row()?.payee_name;
    return name ? `to ${name}` : '';
  });

  bankName = computed(() => this.viewData()?.details?.bank_account_name ?? '');

  scheduleParts = computed(() => {
    const d = this.viewData()?.details;
    if (!d) return [];
    const paid =
      d.total !== null && d.total !== undefined
        ? `Paid ${d.paid ?? 0} of ${d.total}`
        : '';
    const ends = d.ending_date ? `Ends ${this.formatDate(d.ending_date)}` : '';
    return [paid, ends].filter(Boolean);
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const row = this.row();
    if (!row) return undefined;
    return this.getStatusBadge(Number(row.status));
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => []);

  constructor() {
    const loadTrigger = computed(() => this.rowId());
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.viewData.set(null);
          this.collapsedCards.set({});
          this.scheduleShowAll.set(false);
          this.isLoading.set(true);
          return this.checkDraftService.recurringView(id).pipe(
            catchError(() => of({ success: false, data: null })),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.viewData.set(res.data as ICheckDraftRecurringView);
          }
        }
      });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  getJobStatusBadge(processed: number): { bg: string; color: string } {
    if (processed === 1) {
      return {
        bg: 'var(--v4-badge-success-bg-color)',
        color: 'var(--v4-badge-success-text-color)'
      };
    }
    return {
      bg: 'var(--v4-badge-warning-bg-color)',
      color: 'var(--v4-badge-warning-text-color)'
    };
  }

  getJobStatusText(processed: number): string {
    return processed === 1 ? 'Completed' : 'Pending';
  }

  private getStatusBadge(status: number): IDetailPanelStatusBadge {
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
        return badge('info', 'Started');
      case 2:
        return badge('success', 'Completed');
      case 3:
        return badge('warning', 'Paused');
      case 4:
        return badge('error', 'Canceled');
      case 6:
        return badge('error', 'Rejected');
      default:
        return badge('info', 'Unknown');
    }
  }
}

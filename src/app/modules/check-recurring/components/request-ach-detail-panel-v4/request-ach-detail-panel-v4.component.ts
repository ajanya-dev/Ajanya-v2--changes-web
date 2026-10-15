import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, forkJoin, of, switchMap, finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  IAchRecurringTableRow,
  ICheckAchRecurringComments,
  ICheckRecurringAch,
  ICheckRecurringAuditTrialTable,
  ICheckRecurringEventDetails
} from 'src/app/models/check-recurring';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

export type RequestAchActionSection = 'audit' | 'comments';

@Component({
  selector: 'app-request-ach-detail-panel-v4',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideAngularModule,
    DetailSidePanelComponent,
    CommonInputFieldV4Component,
    CommonButtonV4Component
  ],
  templateUrl: './request-ach-detail-panel-v4.component.html',
  styleUrls: ['./request-ach-detail-panel-v4.component.scss']
})
export class RequestAchDetailPanelV4Component {
  rowId = input.required<string>();
  row = input<IAchRecurringTableRow | null>(null);
  isOpen = input(false);

  closed = output<void>();
  actionButtonClicked = output<string>();

  private checkListRecurringService = inject(CheckListRecurringService);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);

  // State
  viewData = signal<ICheckRecurringAch | null>(null);
  auditTrail = signal<ICheckRecurringAuditTrialTable[]>([]);
  commentList = signal<ICheckAchRecurringComments[]>([]);
  recurringEventDetails = signal<ICheckRecurringEventDetails[]>([]);
  isLoading = signal(false);
  openActionSection = signal<RequestAchActionSection | null>(null);
  commentControl = new FormControl('');
  isAddingComment = signal(false);

  // Panel header config
  panelTitle = computed(() => {
    const view = this.viewData();
    const row = this.row();
    const amt = view?.amount ?? row?.recurring_base_data?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  panelSubtitle = computed(() => {
    const view = this.viewData();
    const row = this.row();
    const name = view?.payingFrom ?? row?.from;
    const memo = view?.memo ?? row?.recurring_base_data?.memo;
    const parts = [name, memo].filter(Boolean);
    return parts.length ? `from ${parts.join(' - ')}` : '';
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const row = this.row();
    if (!row) return undefined;
    return this.getStatusBadge(row.status);
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const row = this.row();
    if (!row) return [];
    switch (row.status) {
      case 1: // Requested
        return [
          {
            label: 'Cancel',
            variant: 'outline' as const,
            key: 'cancel',
            color: 'var(--v4-common-red-color)'
          }
        ];
      case 2: // Started
        return [
          {
            label: 'Pause',
            variant: 'outline' as const,
            key: 'pause',
            color: 'var(--v4-common-yellow-color)'
          },
          {
            label: 'Cancel',
            variant: 'outline' as const,
            key: 'cancel',
            color: 'var(--v4-common-red-color)'
          }
        ];
      default: // Completed (3)
        return [];
    }
  });

  constructor() {
    const loadTrigger = computed(() => this.rowId());
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.viewData.set(null);
          this.auditTrail.set([]);
          this.commentList.set([]);
          this.recurringEventDetails.set([]);
          this.openActionSection.set(null);
          this.commentControl.reset('');
          this.isLoading.set(true);
          const fallback = () => of({ success: false, data: null });
          return forkJoin({
            details: this.checkListRecurringService
              .viewAchRecurringDetails(id)
              .pipe(catchError(() => fallback())),
            audit: this.checkListRecurringService
              .getAchAuditTrail('ach-recurring', id)
              .pipe(catchError(() => fallback())),
            comments: this.checkListRecurringService
              .getComments(id)
              .pipe(catchError(() => fallback())),
            events: this.checkListRecurringService
              .getRecurringEventDetails(id)
              .pipe(catchError(() => fallback()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe({
        next: (res) => {
          if (res.details?.success) {
            this.viewData.set(res.details.data);
          }
          if (res.audit?.success) {
            this.auditTrail.set(
              (res.audit.data as ICheckRecurringAuditTrialTable[]) ?? []
            );
          }
          if (res.comments?.success) {
            this.commentList.set(
              (res.comments.data as ICheckAchRecurringComments[]) ?? []
            );
          }
          if (res.events?.success) {
            this.recurringEventDetails.set(
              (res.events.data as ICheckRecurringEventDetails[]) ?? []
            );
          }
        }
      });
  }

  toggleSection(section: RequestAchActionSection): void {
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
  }

  addComment(): void {
    const comment = (this.commentControl.value ?? '').trim();
    if (!comment) return;
    this.isAddingComment.set(true);
    const data = { comment };
    this.sharedService
      .addComment('ach-recurring', this.rowId(), data)
      .pipe(
        finalize(() => this.isAddingComment.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.commentControl.reset('');
          this.refetchComments();
        }
      });
  }

  private refetchComments(): void {
    this.checkListRecurringService
      .getComments(this.rowId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.commentList.set(res.data ?? []);
        }
      });
  }

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

  private getStatusBadge(status: number): IDetailPanelStatusBadge {
    switch (status) {
      case 1:
        return {
          text: 'Requested',
          color: 'var(--v4-badge-warning-text-color)'
        };
      case 2:
        return { text: 'Started', color: 'var(--v4-badge-success-text-color)' };
      case 3:
        return {
          text: 'Completed',
          color: 'var(--v4-badge-success-text-color)'
        };
      default:
        return { text: 'Unknown', color: 'var(--v4-badge-info-text-color)' };
    }
  }
}

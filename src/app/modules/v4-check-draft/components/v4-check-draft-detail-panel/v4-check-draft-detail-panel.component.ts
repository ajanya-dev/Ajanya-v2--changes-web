import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, forkJoin, of, switchMap, finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { FormControl } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import {
  ICommentEntry,
  PoCommentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  IAttachmentEntry,
  PoAttachmentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import {
  ICheckDraftView,
  ICheckDraftActivityLog,
  ICheckDraftAttachments,
  ICheckDraftComments,
  ICheckDraftTableRow
} from '../../model/v4-Checkdraft';

export type CheckDraftActionSection = 'activity' | 'attachments' | 'comments';

@Component({
  standalone: true,
  selector: 'app-v4-check-draft-detail-panel',
  imports: [
    NgClass,
    MatTooltip,
    LucideAngularModule,
    DetailSidePanelComponent,
    PdSkeletonComponent,
    PdDateTimeComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent
  ],
  templateUrl: './v4-check-draft-detail-panel.component.html',
  styleUrls: ['./v4-check-draft-detail-panel.component.scss']
})
export class V4CheckDraftDetailPanelComponent {
  rowId = input.required<string>();
  row = input<ICheckDraftTableRow | null>(null);
  isOpen = input(false);

  closed = output<void>();
  actionButtonClicked = output<string>();

  private checkDraftService = inject(CheckDraftService);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(V4AlertService);

  // State
  viewData = signal<ICheckDraftView | null>(null);
  activityLogs = signal<ICheckDraftActivityLog[]>([]);
  attachmentsList = signal<ICheckDraftAttachments[]>([]);
  commentsList = signal<ICheckDraftComments[]>([]);
  isLoading = signal(false);
  openActionSection = signal<CheckDraftActionSection | null>(null);
  commentControl = new FormControl('');
  isAddingComment = signal(false);
  /** Post failure, shown under the shared composer. */
  commentError = signal<string | null>(null);
  deletingAttachmentId = signal<string | null>(null);
  attachmentUploading = signal(false);
  /** Upload failure, shown in the shared list's error strip. */
  attachmentError = signal<string | null>(null);
  /** Mirrors the shared panel's expanded (wide, two-column) state. */
  isPanelExpanded = signal(false);

  readonly actionTiles: {
    key: CheckDraftActionSection;
    label: string;
    icon: string;
  }[] = [
    { key: 'activity', label: 'Activity log', icon: 'activity' },
    { key: 'attachments', label: 'Attachments', icon: 'paperclip' },
    { key: 'comments', label: 'Comments', icon: 'message-square' }
  ];

  collapsedCards = signal<Record<string, boolean>>({});

  // Shapes the shared Payments Out comment/attachment lists expect.
  commentsForList = computed<ICommentEntry[]>(() =>
    this.commentsList().map((c) => ({
      id: c.id,
      encrypted_id: c.encrypted_id,
      formated_date: c.formated_date,
      comments: c.comments,
      user_name: c.user_name
    }))
  );

  attachmentsForList = computed<IAttachmentEntry[]>(() =>
    this.attachmentsList().map((a) => ({
      id: a.id,
      encrypted_id: a.encrypted_id,
      fileName: a.file_name?.split('/').pop() ?? a.file_name,
      user_name: a.user_name,
      formated_date: a.formated_date
    }))
  );

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // Header values; the grid row fills in until the view API lands.
  checkNo = computed(
    () => this.viewData()?.check_no ?? this.row()?.cheque_serial_number ?? null
  );

  bankName = computed(
    () =>
      this.viewData()?.bank_account_name ||
      this.row()?.bank_account_nick_name ||
      this.row()?.bank_account_account_name ||
      ''
  );

  // Panel header config
  panelTitle = computed(() => {
    const view = this.viewData();
    const row = this.row();
    const amt = view?.amount ?? row?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  panelTitleSuffix = computed(() => {
    const name = this.viewData()?.payee_name ?? this.row()?.payee_name;
    return name ? `to ${name}` : '';
  });

  checkDateText = computed(() => {
    const date = this.viewData()?.check_date;
    return date ? this.formatDate(date) : '';
  });

  headerMetaParts = computed(() =>
    [
      { key: 'no', label: 'Check #:', value: `${this.checkNo() ?? ''}`, bold: true },
      { key: 'bank', label: 'Bank:', value: this.bankName(), bold: true },
      { key: 'date', label: '', value: this.checkDateText(), bold: false },
      {
        key: 'by',
        label: 'By',
        value: this.row()?.created_by_name ?? '',
        bold: false
      }
    ].filter((part) => !!part.value)
  );

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const row = this.row();
    if (!row) return undefined;
    return this.getStatusBadge(row.cheque_status);
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const row = this.row();
    if (!row) return [];
    const status = row.cheque_status;
    const buttons: IDetailPanelActionButton[] = [];

    // Print: available for New (0), Printed (1), Approved (7)
    if (status === 0 || status === 1 || status === 7) {
      buttons.push({
        label: 'Print',
        variant: 'outline' as const,
        key: 'print',
        lucideIcon: 'printer'
      });
    }

    // Clone: available for all except Rejected (8)
    if (status !== 8) {
      buttons.push({
        label: 'Clone',
        variant: 'outline' as const,
        key: 'clone',
        lucideIcon: 'copy'
      });
    }

    // Delete: always available — destructive, so it lives in the ⋮ menu.
    buttons.push({
      label: 'More actions',
      variant: 'outline' as const,
      key: 'more',
      menuHeading: 'Actions',
      menu: [
        { label: 'Delete', key: 'delete', danger: true, lucideIcon: 'trash-2' }
      ]
    });

    return buttons;
  });

  constructor() {
    const loadTrigger = computed(() => this.rowId());
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.viewData.set(null);
          this.activityLogs.set([]);
          this.attachmentsList.set([]);
          this.commentsList.set([]);
          this.openActionSection.set('activity');
          this.collapsedCards.set({});
          this.commentControl.reset('');
          this.commentError.set(null);
          this.attachmentError.set(null);
          this.isLoading.set(true);
          const fallback = () => of({ success: false, data: null });
          return forkJoin({
            details: this.checkDraftService
              .checkDraftView(id)
              .pipe(catchError(() => fallback())),
            activity: this.checkDraftService
              .getActivityLogs(id)
              .pipe(catchError(() => fallback())),
            attachments: this.checkDraftService
              .getAttachments(id)
              .pipe(catchError(() => fallback())),
            comments: this.checkDraftService
              .getComments(id)
              .pipe(catchError(() => fallback()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe({
        next: (res) => {
          if (res.details?.success) {
            this.viewData.set(res.details.data as ICheckDraftView);
          }
          if (res.activity?.success) {
            this.activityLogs.set(
              (res.activity.data as ICheckDraftActivityLog[]) ?? []
            );
          }
          if (res.attachments?.success) {
            this.attachmentsList.set(
              (res.attachments.data as ICheckDraftAttachments[]) ?? []
            );
          }
          if (res.comments?.success) {
            this.commentsList.set(
              (res.comments.data as ICheckDraftComments[]) ?? []
            );
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

  toggleSection(section: CheckDraftActionSection): void {
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
  }

  addComment(): void {
    const comment = (this.commentControl.value ?? '').trim();
    if (!comment) return;
    if (comment.length > 190) {
      this.alertService.warningAlert({
        content:
          'Character limit is 190. Please enter data under 190 characters.'
      });
      return;
    }
    this.commentError.set(null);
    this.isAddingComment.set(true);
    const data = { comment };
    this.sharedService
      .addComment('cheque-drafts', this.rowId(), data)
      .pipe(
        finalize(() => this.isAddingComment.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.commentControl.reset('');
            this.refetchComments();
          } else {
            this.commentError.set('Couldn’t post — please try again.');
          }
        },
        error: () => this.commentError.set('Couldn’t post — please try again.')
      });
  }

  /** Shared composer post: runs through addComment() (190-char guard, same API). */
  onSubmitComment(text: string): void {
    this.commentControl.setValue(text);
    this.addComment();
  }

  onDeleteComment(commentId: string): void {
    if (!commentId) return;
    this.alertService
      .warningAlert({
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Delete',
        isCancel: true,
        cancelMsg: 'Cancel'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.sharedService
          .deleteComment('cheque-drafts', this.rowId(), commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res?.success) {
                this.refetchComments();
              } else {
                this.alertService.failedAlert({
                  content: 'Failed to delete comment. Please try again.'
                });
              }
            },
            error: () =>
              this.alertService.failedAlert({
                content: 'Failed to delete comment. Please try again.'
              })
          });
      });
  }

  onOpenAttachment(entry: IAttachmentEntry): void {
    if (entry?.encrypted_id) this.viewAttachment(entry.encrypted_id);
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    if (entry?.encrypted_id) this.deleteAttachment(entry.encrypted_id);
  }

  /** Shared picker upload — same `cheque-drafts` endpoint and `image` field the add-attachment modal used. */
  onAttachmentSelected(file: File): void {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    this.attachmentError.set(null);
    this.attachmentUploading.set(true);
    this.sharedService
      .addAttachment('cheque-drafts', this.rowId(), formData)
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.refetchAttachments();
            this.alertService.successAlert({
              content: 'Attachment added.',
              close: true,
              timeout: 1500
            });
          } else {
            this.attachmentError.set('Couldn’t upload — please try again.');
          }
        },
        error: () =>
          this.attachmentError.set('Couldn’t upload — please try again.')
      });
  }

  viewAttachment(fileId: string): void {
    this.checkDraftService
      .openAttachment(this.rowId(), fileId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data, '_blank');
        }
      });
  }

  deleteAttachment(attachmentId: string): void {
    const ref = this.alertService.warningAlert({
      content: 'Are you sure you want to delete this attachment?',
      doneMsg: 'Delete',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.deletingAttachmentId.set(attachmentId);
      this.sharedService
        .deleteAttachment('cheque-drafts', this.rowId(), attachmentId)
        .pipe(
          finalize(() => this.deletingAttachmentId.set(null)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.refetchAttachments();
          }
        });
    });
  }

  private refetchAttachments(): void {
    this.checkDraftService
      .getAttachments(this.rowId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.attachmentsList.set(res.data ?? []);
        }
      });
  }

  private refetchComments(): void {
    this.checkDraftService
      .getComments(this.rowId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.commentsList.set(res.data ?? []);
        }
      });
  }

  private getStatusBadge(status: number): IDetailPanelStatusBadge {
    const badge = (
      tone: 'info' | 'success' | 'warning' | 'error',
      text: string,
      preserveText = false
    ): IDetailPanelStatusBadge => ({
      text,
      color: `var(--v4-badge-${tone}-text-color)`,
      bgColor: `var(--v4-badge-${tone}-bg-color)`,
      preserveText
    });

    switch (status) {
      case 0:
        // No --v4-badge-purple-* pair exists in the theme; tint the violet.
        return {
          text: 'New',
          color: 'var(--v4-common-violet-color)',
          bgColor:
            'color-mix(in srgb, var(--v4-common-violet-color) 12%, transparent)'
        };
      case 1:
        return badge('success', 'Printed');
      case 5:
        return badge('warning', 'PA', true);
      case 6:
        return badge('info', 'AV', true);
      case 7:
        return badge('success', 'Approved');
      case 8:
        return badge('error', 'Rejected');
      case 10:
        return badge('info', 'DD Initiated', true);
      case 11:
        return badge('success', 'DD Completed', true);
      case 12:
        return badge('error', 'DD Rejected', true);
      case 13:
        return badge('error', 'DD Returned', true);
      case 15:
        return badge('error', 'VOIDED');
      case 20:
        return badge('error', 'Permission Needed');
      default:
        return badge('info', 'Unknown');
    }
  }
}

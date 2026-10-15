import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { filter, switchMap, forkJoin, finalize } from 'rxjs';
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
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DocumentMailService } from '../../../services/document-mail.service';
import {
  IDocumentMailById,
  IDocumentMailActivityLog,
  IDocumentMailComments
} from '../../../models/document-mail.model';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4DocumentMailModalComponent } from '../../../components/v4-document-mail-modal/v4-document-mail-modal.component';
import { DocumentEditModalV4Component } from '../../modals/document-edit-modal-v4/document-edit-modal-v4.component';

/** The comments API also returns the display fields the shared model omits. */
type IDocumentMailApiComment = IDocumentMailComments & {
  formated_date?: string;
  comments?: string;
  user_name?: string;
};

@Component({
  selector: 'app-document-mail-detail-panel-v4',
  standalone: true,
  imports: [
    DetailSidePanelComponent,
    LucideAngularModule,
    CurrencyPipe,
    DatePipe,
    MatTooltipModule,
    PoCommentsListComponent,
    NgClass,
    NgTemplateOutlet,
    PdSkeletonComponent,
    PdDateTimeComponent
  ],
  templateUrl: './document-mail-detail-panel-v4.component.html',
  styleUrl: './document-mail-detail-panel-v4.component.scss'
})
export class DocumentMailDetailPanelV4Component {
  private documentMailService = inject(DocumentMailService);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  documentId = input.required<string>();
  isOpen = input(false);
  refreshTrigger = input(0);
  closed = output<void>();

  viewData = signal<IDocumentMailById | null>(null);
  activityLogs = signal<IDocumentMailActivityLog[]>([]);
  commentsList = signal<IDocumentMailComments[]>([]);
  loading = signal(false);
  activityLoading = signal(false);
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  activeSection = signal<'tracking' | 'activity' | 'comments'>('tracking');
  isPanelExpanded = signal(false);

  collapsedCards = signal<Record<string, boolean>>({});
  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }
  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  statusMapper: Record<number, string> = {
    0: 'New',
    1: 'Pending',
    2: 'Printed',
    3: 'Envelop Printed',
    4: 'Mail Sent',
    8: 'Refunded'
  };

  private statusColorMap: Record<number, { color: string; bgColor: string }> = {
    0: {
      color: 'var(--v4-common-blue-color)',
      bgColor: 'var(--v4-badge-info-bg-color)'
    },
    1: {
      color: 'var(--v4-common-yellow-color)',
      bgColor: 'var(--v4-badge-warning-bg-color)'
    },
    2: {
      color: 'var(--v4-common-blue-color)',
      bgColor: 'var(--v4-badge-info-bg-color)'
    },
    3: {
      color: 'var(--v4-common-blue-color)',
      bgColor: 'var(--v4-badge-info-bg-color)'
    },
    4: {
      color: 'var(--v4-common-green-color)',
      bgColor: 'var(--v4-badge-success-bg-color)'
    },
    8: {
      color: 'var(--v4-common-red-color)',
      bgColor: 'var(--v4-badge-error-bg-color)'
    }
  };

  statusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const data = this.viewData();
    if (!data) return undefined;
    const status = data.status as number;
    const colors = this.statusColorMap[status] ?? this.statusColorMap[0];
    return {
      text: this.statusMapper[status] ?? 'Unknown',
      color: colors.color,
      bgColor: colors.bgColor
    };
  });

  /** Same rules as the list's row actions: edit / delete (in the ⋮ menu) only while the document is New. */
  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const data = this.viewData();
    if (!data) return [];
    const editable = Number(data.status) === 0;
    return [
      { label: 'Mail', variant: 'outline', lucideIcon: 'send', key: 'mail' },
      { label: 'Download', variant: 'outline', lucideIcon: 'download', key: 'download' },
      {
        label: 'More',
        variant: 'outline',
        key: 'more',
        menuHeading: 'Actions',
        menu: [
          { label: 'Edit', key: 'edit', lucideIcon: 'square-pen', disabled: !editable },
          { label: 'Delete', key: 'delete', lucideIcon: 'trash-2', danger: true, disabled: !editable }
        ]
      }
    ];
  });

  commentsForList = computed<ICommentEntry[]>(() =>
    (this.commentsList() as IDocumentMailApiComment[]).map((c) => ({
      id: c.id,
      encrypted_id: c.encrypted_id,
      formated_date: c.formated_date,
      comments: c.comments,
      user_name: c.user_name
    }))
  );

  statusText = computed(() => {
    const data = this.viewData();
    if (!data) return '';
    return this.statusMapper[data.status as number] ?? 'Unknown';
  });

  constructor() {
    toObservable(this.documentId)
      .pipe(
        filter((id) => !!id),
        switchMap((id) => {
          this.loading.set(true);
          this.activeSection.set('tracking');
          this.collapsedCards.set({});
          this.activityLogs.set([]);
          return forkJoin({
            details: this.documentMailService.getDocumentMailById(id),
            comments: this.documentMailService.getComments(id)
          }).pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed()
      )
      .subscribe((res) => {
        this.viewData.set(res.details.data);
        this.commentsList.set(res.comments.data);
      });

    toObservable(this.refreshTrigger)
      .pipe(
        filter((v) => v > 0),
        switchMap(() =>
          this.documentMailService.getComments(this.documentId())
        ),
        takeUntilDestroyed()
      )
      .subscribe((res) => this.commentsList.set(res.data));
  }

  setActiveSection(section: 'tracking' | 'activity' | 'comments'): void {
    this.activeSection.set(section);
    if (section === 'activity') {
      this.loadActivityLogs();
    }
  }

  private loadActivityLogs(): void {
    const id = this.documentId();
    if (!id) return;
    this.activityLoading.set(true);
    this.documentMailService
      .getDocumentMailActivityLogs(id)
      .pipe(
        finalize(() => this.activityLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.activityLogs.set(res.data));
  }

  truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)  }...`
      : text;
  }

  getStatusColor(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'created') return 'var(--v4-common-green-color)';
    if (s === 'updated') return 'var(--v4-common-blue-color)';
    if (s === 'pending') return 'var(--v4-common-yellow-color)';
    return 'var(--v4-main-text-color)';
  }

  getStatusBgColor(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'created') return 'var(--v4-badge-success-bg-color)';
    if (s === 'updated') return 'var(--v4-badge-info-bg-color)';
    if (s === 'pending') return 'var(--v4-badge-warning-bg-color)';
    return 'var(--v4-tertiary-background-color)';
  }

  onActionButtonClicked(key: string): void {
    if (!this.viewData()) return;
    if (key === 'edit') {
      this.openEdit();
    } else if (key === 'mail') {
      this.openMail();
    } else if (key === 'download') {
      this.downloadDocument();
    } else if (key === 'delete') {
      this.deleteDocument();
    }
  }

  private openEdit(): void {
    const data = this.viewData();
    if (!data) return;
    this.dialog
      .open(DocumentEditModalV4Component, {
        width: '510px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: false,
        autoFocus: false,
        data: {
          id: data.id,
          title: data.document_title,
          fileName: data.document_name,
          url: data.document_url
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.onChanged();
      });
  }

  private downloadDocument(): void {
    this.documentMailService
      .downloadDocument(this.documentId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val.success) window.open(val.data.file_url, '_blank');
      });
  }

  private openMail(): void {
    const data = this.viewData();
    if (!data) return;
    this.dialog
      .open(V4DocumentMailModalComponent, {
        disableClose: true,
        width: '1200px',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: {
          type: 'normal',
          documents: [
            {
              id: data.id,
              document_title: data.document_title,
              document_name: data.document_name,
              document_url: data.document_url,
              created_at: data.created_at,
              status: data.status
            }
          ]
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.status) this.onChanged();
      });
  }

  private deleteDocument(): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to delete?' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.documentMailService
          .deleteDocument(this.documentId())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((val) => {
            if (!val.success) return;
            this.alertService.successAlert({
              title: 'Success',
              content: 'Document deleted successfully',
              timeout: 2000,
              close: true
            });
            this.v3DataTableService.refreshV3DataTable();
            this.closed.emit();
          });
      });
  }

  /** Edit / mail changed the row: refresh the grid and this panel's details. */
  private onChanged(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.documentMailService
      .getDocumentMailById(this.documentId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.viewData.set(res.data));
  }

  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment('document-mailing', this.documentId(), { comment })
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

  onDeleteComment(deleteId: string): void {
    if (!deleteId) return;
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to delete this comment?' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.sharedService
          .deleteComment('document-mailing', 0, deleteId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success) {
              this.commentsList.update((list) =>
                list.filter((c) => (c.encrypted_id ?? c.id) !== deleteId)
              );
            }
          });
      });
  }

  private refetchComments(): void {
    this.documentMailService
      .getComments(this.documentId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.commentsList.set(res.data));
  }
}

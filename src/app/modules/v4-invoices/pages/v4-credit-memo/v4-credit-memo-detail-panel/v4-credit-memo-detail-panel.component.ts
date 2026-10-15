import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import {
  ICreditMemoTransaction,
  ICreditViewData
} from 'src/app/modules/invoices/model/invoice';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import {
  PoCommentsListComponent,
  ICommentEntry
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  PoAttachmentsListComponent,
  IAttachmentEntry
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import {
  PoAuditLogListComponent,
  IActivityEntry
} from 'src/app/modules/payments-v4/payments-out/components/common/audit-log-list/audit-log-list.component';

export type CreditMemoActionSection = 'activity' | 'comments' | 'attachments';

export interface ICreditMemoRowData {
  action: string;
  credit_memo_no?: string;
  payee_name?: string;
  status?: number;
  po_no?: string;
  transactions?: ICreditMemoTransaction[];
  [key: string]: unknown;
}

@Component({
  selector: 'app-v4-credit-memo-detail-panel',
  templateUrl: './v4-credit-memo-detail-panel.component.html',
  styleUrls: ['./v4-credit-memo-detail-panel.component.scss'],
  standalone: true,
  imports: [
    DetailSidePanelComponent,
    LucideAngularModule,
    NgClass,
    NgTemplateOutlet,
    CurrencyPipe,
    DecimalPipe,
    PdSkeletonComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    PoAuditLogListComponent
  ]
})
export class V4CreditMemoDetailPanelComponent {
  row            = input<ICreditMemoRowData | null>(null);
  isOpen         = input(false);
  backdropZIndex = input(200);
  initialSection = input<CreditMemoActionSection | null>(null);

  closed              = output<void>();
  actionButtonClicked = output<string>();

  isPanelExpanded   = signal(false);
  collapsedCards    = signal<Record<string, boolean>>({});
  openActionSection = signal<CreditMemoActionSection | null>('activity');

  details     = signal<ICreditViewData | null>(null);
  isLoading   = signal(false);
  auditLogs   = signal<IActivityEntry[] | null>(null);
  comments    = signal<Record<string, unknown>[] | null>(null);
  attachments = signal<Record<string, unknown>[] | null>(null);

  commentPosting       = signal(false);
  commentError         = signal<string | null>(null);
  attachmentUploading  = signal(false);
  attachmentError      = signal<string | null>(null);
  deletingAttachmentId = signal<string | null>(null);

  private loadedSections  = new Set<CreditMemoActionSection>();
  private loadingSections = signal<CreditMemoActionSection[]>([]);
  private panelReset$     = new Subject<void>();

  private invoiceService = inject(InvoiceService);
  private sharedService  = inject(SharedService);
  private alertService   = inject(V4AlertService);
  private destroyRef     = inject(DestroyRef);

  readonly actionTiles: { key: CreditMemoActionSection; label: string; icon: string }[] = [
    { key: 'activity',    label: 'Activity Log', icon: 'activity'       },
    { key: 'comments',    label: 'Comments',     icon: 'message-square' },
    { key: 'attachments', label: 'Attachments',  icon: 'paperclip'      }
  ];

  panelTitle    = computed(() => this.row()?.credit_memo_no ?? 'Credit Memo');
  panelSubtitle = computed(() => this.row()?.payee_name ?? '');

  statusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    switch (this.row()?.status) {
      case 2: return { text: 'Reconciled', color: 'var(--v4-badge-success-text-color)', bgColor: 'var(--v4-badge-success-bg-color)' };
      case 3: return { text: 'Voided',     color: 'var(--v4-badge-error-text-color)',   bgColor: 'var(--v4-badge-error-bg-color)'   };
      case 4: return { text: 'Partial',    color: 'var(--v4-badge-warning-text-color)', bgColor: 'var(--v4-badge-warning-bg-color)' };
      case 5: return { text: 'Completed',  color: 'var(--v4-badge-success-text-color)', bgColor: 'var(--v4-badge-success-bg-color)' };
      default: return { text: 'New',       color: 'var(--v4-badge-info-text-color)',    bgColor: 'var(--v4-badge-info-bg-color)'    };
    }
  });

  filteredItems   = computed(() => this.details()?.items?.filter(i => i.itemName) ?? []);
  rowTransactions = computed(() => this.row()?.transactions ?? []);

  commentsForList = computed<ICommentEntry[] | null>(() => {
    const list = this.comments();
    if (list == null) return null;
    return list.map(item => ({
      formated_date: item['formated_date'] as string | undefined,
      comments:      item['comments']      as string | undefined,
      user_name:     item['user_name']     as string | undefined,
      status:        item['status']        as ICommentEntry['status'],
      encrypted_id:  item['encrypted_id']  as string | undefined
    }));
  });

  attachmentsForList = computed<IAttachmentEntry[] | null>(() => {
    const list = this.attachments();
    if (list == null) return null;
    return list.map(item => ({
      file_name:             (item['file_name']     as string) ?? '',
      user_name:             (item['user_name']     as string) ?? '',
      formated_date:         (item['formated_date'] as string) ?? '',
      encrypted_id:          (item['encrypted_id']  as string) ?? '',
      all_attachment_status: item['status'] as unknown as { status_text: string } | undefined
    }));
  });

  actionButtons = computed<IDetailPanelActionButton[]>(() => {
    switch (this.row()?.status) {
      case 3: return [
        { label: 'Unvoid', variant: 'danger', key: 'Unvoid', lucideIcon: 'rotate-ccw' },
        { label: 'Delete', variant: 'danger', key: 'Delete', lucideIcon: 'trash-2'   }
      ];
      case 5: return [{ label: 'Delete', variant: 'danger', key: 'Delete', lucideIcon: 'trash-2' }];
      case 2: case 4: return [];
      default: return [
        { label: 'Edit', variant: 'outline', key: 'Edit', lucideIcon: 'square-pen' },
        { label: 'Void', variant: 'danger',  key: 'Void', lucideIcon: 'ban' },
        {
          label: '', variant: 'outline', key: '__overflow',
          menu: [{ label: 'Delete', key: 'Delete', danger: true, lucideIcon: 'trash-2' }],
          menuHeading: 'ACTIONS'
        }
      ];
    }
  });

  constructor() {
    const loadTrigger = computed(() => ({ action: this.row()?.action ?? null, open: this.isOpen() }));
    toObservable(loadTrigger).pipe(
      takeUntilDestroyed(),
      switchMap(({ action, open }) => {
        if (!action || !open) { this.details.set(null); return EMPTY; }
        this.resetForNewRecord();
        return this.invoiceService.creditView(action).pipe(
          catchError(() => of(null)),
          finalize(() => this.isLoading.set(false))
        );
      })
    ).subscribe(res => {
      if (res?.data) this.details.set(res.data);
      const section = this.initialSection() ?? 'activity';
      this.openActionSection.set(section);
      this.loadSection(section);
    });
  }

  private sectionRequest(key: CreditMemoActionSection): Observable<unknown> | null {
    const id = this.row()?.action;
    if (!id) return null;
    switch (key) {
      case 'activity':
        return this.invoiceService.auditTrailCredit(id).pipe(
          tap(res => this.auditLogs.set(res?.data ? (res.data as unknown as IActivityEntry[]) : []))
        );
      case 'comments':
        return this.invoiceService.getCreditComments(id).pipe(
          tap(res => this.comments.set(res?.data ? (res.data as unknown as Record<string, unknown>[]) : []))
        );
      case 'attachments':
        return this.invoiceService.getCreditattachments(id).pipe(
          tap(res => this.attachments.set(res?.data ? (res.data as unknown as Record<string, unknown>[]) : []))
        );
    }
  }

  loadSection(key: CreditMemoActionSection): void {
    if (this.loadedSections.has(key)) { this.openActionSection.set(key); return; }
    const req = this.sectionRequest(key);
    if (!req) { this.loadedSections.add(key); this.openActionSection.set(key); return; }
    this.loadingSections.update(s => [...s, key]);
    req.pipe(
      takeUntilDestroyed(this.destroyRef),
      takeUntil(this.panelReset$),
      finalize(() => this.loadingSections.update(s => s.filter(k => k !== key)))
    ).subscribe({ complete: () => { this.loadedSections.add(key); this.openActionSection.set(key); } });
  }

  selectSection(key: CreditMemoActionSection): void {
    if (this.openActionSection() === key) { this.openActionSection.set(null); return; }
    this.loadSection(key);
  }

  closeSection(): void {
    this.openActionSection.set(null);
  }

  isSectionLoading(key: CreditMemoActionSection): boolean {
    return this.loadingSections().includes(key);
  }

  toggleCard(key: string): void {
    this.collapsedCards.update(m => ({ ...m, [key]: !m[key] }));
  }

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  onSubmitComment(text: string): void {
    const comment = text?.trim();
    const id = this.row()?.action;
    if (!comment || !id) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService.addComment('credit-memos', id, { comment }).pipe(
      finalize(() => this.commentPosting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        if (res?.success) { this.loadedSections.delete('comments'); this.loadSection('comments'); }
        else this.commentError.set("Couldn't post — please try again.");
      },
      error: () => this.commentError.set("Couldn't post — please try again.")
    });
  }

  onDeleteComment(encryptedId: string): void {
    const id = this.row()?.action;
    if (!id || !encryptedId) return;
    this.alertService.confirmAlert({ content: 'Delete this comment?', doneMsg: 'Yes, delete', cancelMsg: 'Cancel' })
      .afterClosed().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.loadedSections.delete('comments');
        this.loadSection('comments');
      });
  }

  onAttachmentSelected(file: File): void {
    const id = this.row()?.action;
    if (!file || !id) return;
    if ((this.attachments() ?? []).length >= 5) {
      this.alertService.warningAlert({ content: 'Maximum limit is 5' }); return;
    }
    const formData = new FormData();
    formData.append('image', file);
    this.attachmentError.set(null);
    this.attachmentUploading.set(true);
    this.sharedService.addAttachment('credit-memos', id, formData).pipe(
      finalize(() => this.attachmentUploading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        if (res?.success) {
          this.alertService.successAlert({ content: 'Attachment uploaded successfully', close: true, timeout: 2500 });
          this.loadedSections.delete('attachments');
          this.loadSection('attachments');
        } else {
          this.attachmentError.set("Couldn't upload — please try again.");
        }
      },
      error: () => this.attachmentError.set("Couldn't upload — please try again.")
    });
  }

  onOpenAttachment(entry: IAttachmentEntry): void {
    const attachmentId = entry?.encrypted_id;
    const id = this.row()?.action;
    if (!attachmentId || !id) return;
    this.sharedService.openAttachment('credit-memos', id, attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => { if (res?.data) window.open(res.data as string, '_blank'); });
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    const attachmentId = entry?.encrypted_id;
    const id = this.row()?.action;
    if (!attachmentId || !id) return;
    this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this attachment?',
      doneMsg: 'Yes, Delete it!', cancelMsg: 'No, Cancel!'
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.deletingAttachmentId.set(attachmentId);
        this.sharedService.deleteAttachment('credit-memos', id, attachmentId).pipe(
          finalize(() => this.deletingAttachmentId.set(null)),
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(res => {
          if (res?.success) {
            this.attachments.update(list => list?.filter(a => a['encrypted_id'] !== attachmentId) ?? null);
          }
        });
      });
  }

  onActionClicked(key: string): void {
    if (['Edit', 'Void', 'Unvoid', 'Delete'].includes(key)) this.onClosed();
    this.actionButtonClicked.emit(key);
  }

  onClosed(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set(null);
    this.details.set(null);
    this.auditLogs.set(null);
    this.comments.set(null);
    this.attachments.set(null);
    this.closed.emit();
  }

  private resetForNewRecord(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set('activity');
    this.details.set(null);
    this.auditLogs.set(null);
    this.comments.set(null);
    this.attachments.set(null);
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.deletingAttachmentId.set(null);
    this.isLoading.set(true);
  }
}

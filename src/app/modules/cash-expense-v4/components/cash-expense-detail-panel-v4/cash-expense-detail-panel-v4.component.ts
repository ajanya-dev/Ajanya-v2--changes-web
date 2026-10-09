import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ITabItem } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, finalize, forkJoin, of, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import {
  AuditLogListV4Component,
  type IAuditLogEntry
} from 'src/app/shared/V4/for-side-drawer/audit-log-list-v4/audit-log-list-v4.component';
import {
  ICommentEntry,
  PoCommentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  IAttachmentEntry,
  PoAttachmentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import {
  ITransactionListEntry,
  TransactionsListV4Component
} from 'src/app/shared/V4/for-side-drawer/transactions-list-v4/transactions-list-v4.component';

import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IApiRes } from 'src/app/models/api';
import {
  ICashExpenseActivity,
  ICashExpenseDetails,
  ICashexpenseAttachments,
  ICashexpenseComments,
  ICashexpensePayeeSummary
} from 'src/app/modules/Cash-Expense/model/CashExpense';

import { CashExpenseV4StateService } from '../../services/cash-expense-v4-state.service';
import { CashExpenseDetailCardV4Component } from '../cash-expense-detail-card-v4/cash-expense-detail-card-v4.component';
import { CashExpenseCreateModalV4Component } from '../../modals/cash-expense-create-modal-v4/cash-expense-create-modal-v4.component';
import { CashExpenseSendPaymentProofModalV4Component } from '../../modals/cash-expense-send-payment-proof-modal-v4/cash-expense-send-payment-proof-modal-v4.component';
import { CashExpenseGetReceiptModalV4Component } from '../../modals/cash-expense-get-receipt-modal-v4/cash-expense-get-receipt-modal-v4.component';

export type ActionGridSection =
  | 'audit'
  | 'comments'
  | 'attachments'
  | 'transactions';

@Component({
  selector: 'app-cash-expense-detail-panel-v4',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    LucideAngularModule,
    PdSkeletonComponent,
    DetailSidePanelComponent,
    AuditLogListV4Component,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    TransactionsListV4Component,
    CashExpenseDetailCardV4Component
  ],
  templateUrl: './cash-expense-detail-panel-v4.component.html',
  styleUrls: ['./cash-expense-detail-panel-v4.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CashExpenseDetailPanelV4Component {
  cashExpenseId = input.required<string>();
  isOpen = input(false);
  backdropZIndex = input(200);

  closed = output<void>();
  actionSuccess = output<void>();

  private cashExpenseService = inject(CashExpenseService);
  private sharedService = inject(SharedService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private stateService = inject(CashExpenseV4StateService);

  details = signal<ICashExpenseDetails | null>(null);
  isLoading = signal(false);
  openActionSection = signal<ActionGridSection | null>('audit');
  isPanelExpanded = signal(false);

  collapsedCards = signal<Record<string, boolean>>({});
  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }
  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  auditLogs = signal<ICashExpenseActivity[] | null>(null);
  comments = signal<ICashexpenseComments[] | null>(null);
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  /** Set while delete-attachment API is in flight (matches `encrypted_id` on the row). */
  attachmentDeletingId = signal<string | null>(null);
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);
  attachments = signal<ICashexpenseAttachments[] | null>(null);
  payeeSummary = signal<ICashexpensePayeeSummary | null>(null);



  panelTitle = computed(() => {
    const d = this.details();
    if (!d) return '';
    const amt = parseFloat(String(d.grandTotal || '0'));
    return `$${amt.toFixed(2)}`;
  });

  /** Money cell: `$12.00`; a missing value reads `$0.00`. */
  money(value?: string | number | null): string {
    const amt = parseFloat(String(value ?? '0'));
    return `$${(Number.isNaN(amt) ? 0 : amt).toFixed(2)}`;
  }

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const d = this.details();
    if (!d) return undefined;
    const isExpense = Number(d.transactionType) === 1;
    const tone = isExpense ? 'accent' : 'success';
    return {
      text: isExpense ? 'Expense' : 'Income',
      color: `var(--v4-badge-${tone}-text-color)`,
      bgColor: `var(--v4-badge-${tone}-bg-color)`
    };
  });

  panelIconBgColor = computed(() => {
    const d = this.details();
    if (!d) return '#7924FF';
    return Number(d.transactionType) === 1 ? '#7924FF' : '#00a5b2';
  });

  isExpense = computed(() => Number(this.details()?.transactionType) === 1);

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    if (!this.details()) return [];
    const buttons: IDetailPanelActionButton[] = [
      { label: 'Clone', variant: 'outline', lucideIcon: 'copy', key: 'clone' }
    ];
    if (this.isExpense()) {
      buttons.push({
        label: 'Get receipt',
        variant: 'outline',
        lucideIcon: 'receipt',
        key: 'receipt'
      });
    }
    buttons.push(
      { label: 'Send proof', variant: 'outline', lucideIcon: 'send', key: 'paymentProof' },
      {
        label: 'More',
        variant: 'outline',
        key: 'more',
        menuHeading: 'Actions',
        menu: [
          { label: 'Edit', key: 'edit', lucideIcon: 'edit' },
          { label: 'Delete', key: 'delete', lucideIcon: 'trash-2', danger: true }
        ]
      }
    );
    return buttons;
  });

  auditLogsForList = computed<IAuditLogEntry[]>(() => {
    const list = this.auditLogs();
    if (!list?.length) return [];
    return list.map((item) => ({
      userFormatedActivityDate: item.formattedCreatedAt ?? '',
      status: item.status ?? '',
      userName: item.userName ?? '',
      ipAddress: item.deviceName || item.ipAddress || '',
      note: item.note ?? ''
    }));
  });

  commentsForList = computed<ICommentEntry[]>(() =>
    (this.comments() ?? []).map((item) => ({
      id: item.id,
      encrypted_id: item.encrypted_id,
      formated_date: item.formated_date,
      comments: item.comments,
      user_name: item.user || item.user_name
    }))
  );

  attachmentsForList = computed<IAttachmentEntry[]>(() =>
    (this.attachments() ?? []).map((item) => ({
      id: item.id,
      encrypted_id: item.encrypted_id,
      formated_date: item.formated_date,
      user_name: item.user_name,
      file_name: item.file_name ?? ''
    }))
  );

  transactionsForList = computed<ITransactionListEntry[]>(() => {
    const summary = this.payeeSummary();
    if (!summary?.rows?.length) return [];
    return summary.rows.map((t) => ({
      date: t.date ?? '',
      description: t.memo ?? 'Cash Expense',
      amount: t.amount ? `$${t.amount}` : '$0.00',
      status: '',
      method: t.account ?? 'Cash'
    }));
  });

  totalForList = computed(() => {
    const summary = this.payeeSummary();
    return summary?.summary?.total_paid_all
      ? `$${summary.summary.total_paid_all}`
      : '$0.00';
  });

  panelTabs = computed<ITabItem[]>(() => [
      { label: 'Activity log', value: 'audit' },
      { label: 'Comments', value: 'comments' },
      { label: 'Attachments', value: 'attachments' },
      { label: 'Last 10 transactions', value: 'transactions' }
    ]);

  readonly tileIcons: Record<string, string> = {
    audit: 'activity',
    comments: 'message-square',
    attachments: 'paperclip',
    transactions: 'history'
  };


  constructor() {
    toObservable(this.cashExpenseId)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.openActionSection.set(null);
          this.collapsedCards.set({});
          this.details.set(null);
          this.auditLogs.set(null);
          this.comments.set(null);
          this.attachments.set(null);
          this.payeeSummary.set(null);
          this.isLoading.set(true);

          const fallback = <T>() =>
            of({ success: false, data: null } as unknown as IApiRes<T>);

          return forkJoin({
            details: this.cashExpenseService
              .getCashExpensesById(id)
              .pipe(catchError(() => fallback<ICashExpenseDetails>())),
            activities: this.cashExpenseService
              .getCashExpenseActivity(id)
              .pipe(catchError(() => fallback<ICashExpenseActivity[]>())),
            comments: this.cashExpenseService
              .getCashExpenseComments(id)
              .pipe(catchError(() => fallback<ICashexpenseComments[]>())),
            attachments: this.cashExpenseService
              .getCashExpenseAttachment(id)
              .pipe(catchError(() => fallback<ICashexpenseAttachments[]>()))
          }).pipe(
            switchMap((firstRes) => {
              const detailData = Array.isArray(firstRes.details.data)
                ? firstRes.details.data[0]
                : firstRes.details.data;
              this.details.set(detailData as ICashExpenseDetails);
              this.auditLogs.set(firstRes.activities.data ?? null);
              this.comments.set(firstRes.comments.data ?? null);
              this.attachments.set(firstRes.attachments.data ?? null);

              const payeeId = (detailData as ICashExpenseDetails)?.payee?.payeeId;
              if (payeeId) {
                return this.cashExpenseService
                  .getPayeeSummary(payeeId)
                  .pipe(catchError(() => fallback<ICashexpensePayeeSummary>()));
              }
              return of(null);
            }),
            finalize(() => {
              this.isLoading.set(false);
              this.openActionSection.set('audit');
            })
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res && 'success' in res && res.success && res.data) {
            this.payeeSummary.set(res.data);
          }
        }
      });
  }

  selectSection(section: ActionGridSection): void {
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
  }

  onActionButtonClicked(key: string): void {
    const id = this.cashExpenseId();
    if (!id) return;

    switch (key) {
      case 'clone':
        this.closed.emit();
        this.dialog.open(CashExpenseCreateModalV4Component, {
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          panelClass: 'paddingless-modal-rounded',
          data: { mode: 'clone', id }
        }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
          if (result?.success) {
            this.stateService.refreshList();
            this.actionSuccess.emit();
          }
        });
        break;

      case 'edit':
        this.closed.emit();
        this.dialog.open(CashExpenseCreateModalV4Component, {
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          panelClass: 'paddingless-modal-rounded',
          data: { mode: 'edit', id }
        }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
          if (result?.success) {
            this.stateService.refreshList();
            this.actionSuccess.emit();
          }
        });
        break;

      case 'receipt':
        this.openGetReceipt();
        break;

      case 'print':
        this.printCashExpense(id);
        break;

      case 'paymentProof':
        this.openSendPaymentProof();
        break;

      case 'delete':
        this.alertService
          .confirmAlert({
            content: 'Are you sure you want to delete this cash expense?',
            cancelMsg: 'No, Cancel!',
            doneMsg: 'Yes, Delete it!'
          })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((confirmed) => {
            if (!confirmed) return;
            this.cashExpenseService
              .deleteCashexpense(id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res.success) {
                  this.alertService.successAlert({
                    title: 'Success!',
                    content: 'Cash expense deleted.',
                    close: true
                  });
                  this.closed.emit();
                  this.stateService.refreshList();
                  this.actionSuccess.emit();
                }
              });
          });
        break;
      default:
    }
  }

  private printCashExpense(id: string): void {
    this.cashExpenseService
      .printCashExpense(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res.success) return;
        document.querySelectorAll('iframe').forEach((el) => el.parentNode?.removeChild(el));
        const iframe = document.createElement('iframe');
        iframe.srcdoc = res.data.printData;
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      });
  }

  private openSendPaymentProof(): void {
    const id = this.cashExpenseId();
    if (!id) return;
    this.dialog.open(CashExpenseSendPaymentProofModalV4Component, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { id },
      disableClose: true
    });
  }

  private openGetReceipt(): void {
    const id = this.cashExpenseId();
    if (!id) return;

    // CashExpenseGetReceiptModalV4Component does its own
    // getCashExpensesById + payeeService.showPayee lookup internally
    // (see cash-expense-get-receipt-modal-v4.component.ts:78-99), so
    // the side panel only needs to pass the cashExpenseId.
    this.dialog.open(CashExpenseGetReceiptModalV4Component, {
      maxWidth: '550px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { cashExpenseId: id }
    });
  }

  onSubmitComment(text: string): void {
    const id = this.cashExpenseId();
    const comment = text?.trim();
    if (!id || !comment) return;

    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment('cash-expenses', id, { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.refetchComments();
            this.refetchAuditLogs();
            this.stateService.refreshList();
          } else {
            this.commentError.set('Couldn’t post — please try again.');
          }
        },
        error: () => this.commentError.set('Couldn’t post — please try again.')
      });
  }

  onDeleteComment(commentId: string): void {
    const id = this.cashExpenseId();
    if (!id || !commentId) return;

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
        this.cashExpenseService
          .deleteCashExpenseComment(id, commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success) {
              this.refetchAuditLogs();
              this.refetchComments();
              this.stateService.refreshList();
            }
          });
      });
  }

  onAttachmentSelected(file: File): void {
    const id = this.cashExpenseId();
    if (!id || !file) return;

    // Format / size / count are validated by the picker (po-attachments-list).
    this.attachmentError.set(null);
    const formData = new FormData();
    formData.append('image', file);

    this.attachmentUploading.set(true);
    this.sharedService
      .addAttachment('cash-expenses', id, formData)
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.refetchAttachments();
            this.refetchAuditLogs();
            this.stateService.refreshList();
          } else {
            this.attachmentError.set('Couldn’t upload — please try again.');
          }
        },
        error: () => this.attachmentError.set('Couldn’t upload — please try again.')
      });
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    if (!entry?.encrypted_id) return;
    const id = this.cashExpenseId();
    if (!id) return;
    const attachmentEncryptedId = entry.encrypted_id;

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
        this.attachmentDeletingId.set(attachmentEncryptedId);
        this.cashExpenseService
          .deleteCashexpenseAttachment(id, attachmentEncryptedId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success) {
              this.refetchAuditLogs();
              this.stateService.refreshList();
              this.cashExpenseService
                .getCashExpenseAttachment(id)
                .pipe(
                  takeUntilDestroyed(this.destroyRef),
                  finalize(() => this.attachmentDeletingId.set(null))
                )
                .subscribe((attachmentRes) => {
                  if (attachmentRes?.success) this.attachments.set(attachmentRes.data ?? null);
                });
            } else {
              this.attachmentDeletingId.set(null);
            }
          });
      });
  }

  onOpenAttachment(entry: IAttachmentEntry): void {
    if (!entry?.encrypted_id) return;
    const id = this.cashExpenseId();
    if (!id) return;
    this.cashExpenseService
      .openCashExpenseAttachment(id, entry.encrypted_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res.data) {
          window.open(res.data, '_blank', 'noopener,noreferrer');
        }
      });
  }

  private refetchComments(): void {
    const id = this.cashExpenseId();
    if (!id) return;
    this.cashExpenseService
      .getCashExpenseComments(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.comments.set(res.data ?? null);
      });
  }

  private refetchAttachments(): void {
    const id = this.cashExpenseId();
    if (!id) return;
    this.cashExpenseService
      .getCashExpenseAttachment(id)
      .subscribe((res) => {
        if (res?.success) this.attachments.set(res.data ?? null);
      });
  }

  private refetchAuditLogs(): void {
    const id = this.cashExpenseId();
    if (!id) return;
    this.cashExpenseService
      .getCashExpenseActivity(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.auditLogs.set(res.data ?? null);
      });
  }

}

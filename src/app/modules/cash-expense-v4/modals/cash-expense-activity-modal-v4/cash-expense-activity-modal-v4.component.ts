import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, X, LoaderCircle } from 'lucide-angular';
import { forkJoin, finalize, catchError, of } from 'rxjs';

import {
  ICashExpenseActivity,
  ICashexpenseComments,
  ICashexpenseAttachments
} from 'src/app/modules/Cash-Expense/model/CashExpense';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IActivityModalData {
  id: string;
}

@Component({
  selector: 'app-cash-expense-activity-modal-v4',
  templateUrl: './cash-expense-activity-modal-v4.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, MatDialogClose, MatTooltip, CommonButtonV4Component]
})
export class CashExpenseActivityModalV4Component implements OnInit {
  data: IActivityModalData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<CashExpenseActivityModalV4Component>);
  private cashExpenseService = inject(CashExpenseService);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly LoaderCircleIcon = LoaderCircle;

  isLoading = signal(false);
  auditTrail = signal<ICashExpenseActivity[]>([]);
  comments = signal<ICashexpenseComments[]>([]);
  attachments = signal<ICashexpenseAttachments[]>([]);
  /** Row `encrypted_id` while comment delete API runs */
  commentDeletingId = signal<string | null>(null);
  /** Row `encrypted_id` while attachment delete API runs */
  attachmentDeletingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    const id = this.data.id;
    this.isLoading.set(true);

    const fallback = <T>() => of({ success: false, data: [] as T[] });

    forkJoin({
      audit: this.sharedService
        .getAuditTrail('cash-expenses', id)
        .pipe(catchError(() => fallback<ICashExpenseActivity>())),
      comments: this.cashExpenseService
        .getCashExpenseComments(id)
        .pipe(catchError(() => fallback<ICashexpenseComments>())),
      attachments: this.cashExpenseService
        .getCashExpenseAttachment(id)
        .pipe(catchError(() => fallback<ICashexpenseAttachments>()))
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.audit.success) this.auditTrail.set(res.audit.data as ICashExpenseActivity[]);
        if (res.comments.success) this.comments.set(res.comments.data as ICashexpenseComments[]);
        if (res.attachments.success) this.attachments.set(res.attachments.data as ICashexpenseAttachments[]);
      });
  }

  onDeleteComment(encryptedId: string): void {
    if (this.commentDeletingId() || this.attachmentDeletingId()) return;

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
        this.commentDeletingId.set(encryptedId);
        this.cashExpenseService
          .deleteCashExpenseComment(this.data.id, encryptedId)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.commentDeletingId.set(null))
          )
          .subscribe((res) => {
            if (res?.success) {
              this.comments.update((list) => list.filter((c) => c.encrypted_id !== encryptedId));
              this.refetchAuditTrail();
              this.alertService.successAlert({
                title: 'Success!',
                content: 'Comment deleted successfully.',
                close: true
              });
            }
          });
      });
  }

  onDeleteAttachment(encryptedId: string): void {
    if (this.commentDeletingId() || this.attachmentDeletingId()) return;

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
        this.attachmentDeletingId.set(encryptedId);
        this.cashExpenseService
          .deleteCashexpenseAttachment(this.data.id, encryptedId)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.attachmentDeletingId.set(null))
          )
          .subscribe((res) => {
            if (res?.success) {
              this.attachments.update((list) => list.filter((a) => a.encrypted_id !== encryptedId));
              this.refetchAuditTrail();
              this.alertService.successAlert({
                title: 'Success!',
                content: 'Attachment deleted successfully.',
                close: true
              });
            }
          });
      });
  }

  private refetchAuditTrail(): void {
    this.sharedService
      .getAuditTrail('cash-expenses', this.data.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.auditTrail.set(res.data as ICashExpenseActivity[]);
      });
  }

  onOpenAttachment(encryptedId: string): void {
    this.cashExpenseService
      .openCashExpenseAttachment(this.data.id, encryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res.data) {
          window.open(res.data, '_blank', 'noopener,noreferrer');
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

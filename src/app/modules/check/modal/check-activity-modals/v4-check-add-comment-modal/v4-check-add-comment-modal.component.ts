import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X, Trash2, Mail, LoaderCircle } from 'lucide-angular';

import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { IGetComment } from 'src/app/models/common';
import { IComment } from 'src/app/models/wallet';
import { ICheckComments } from 'src/app/models/v3-datatable';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { MatTooltip } from '@angular/material/tooltip';

export interface IV4AddCommentModalData {
  id: string | number;
  type: string;
  mode?: string;
  enableDelete?: boolean;
  existingData?: IGetComment[] | ICheckComments[] | string[];
}

@Component({
  selector: 'app-v4-check-add-comment-modal',
  templateUrl: './v4-check-add-comment-modal.component.html',
  styleUrls: ['./v4-check-add-comment-modal.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    DatePipe,
    MatTooltip
  ]
})
export class V4CheckAddCommentModalComponent implements OnInit {
  public data: IV4AddCommentModalData = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<V4CheckAddCommentModalComponent>);
  private sharedService = inject(SharedService);
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  private get isInternationalPayment(): boolean {
    return this.data.mode === 'international_payments';
  }

  readonly XIcon = X;
  readonly Trash2Icon = Trash2;
  readonly MailIcon = Mail;
  readonly LoaderCircleIcon = LoaderCircle;

  listData: (IGetComment | ICheckComments)[] = [];
  groupPaymentsComments: string[] = [];
  loading = false;
  submitting = false;
  commentDeletingLoading: false | string = false;
  isRefresh = false;
  success = false;

  /**
   * No `required` validator: the field blurs when Cancel/Done is clicked, which
   * would flash "This field is required" as the modal closes. An empty comment
   * is blocked by `isCommentEmpty` instead.
   */
  commentControl = new FormControl('', { nonNullable: true });

  get isCommentEmpty(): boolean {
    return !this.commentControl.value.trim();
  }

  private get type(): string {
    return this.data.type ?? 'checks';
  }

  get isCheckMode(): boolean {
    return this.type === 'checks';
  }

  ngOnInit(): void {
    if (this.data.mode === 'group_payments') {
      this.groupPaymentsComments = (this.data.existingData as string[]) ?? [];
    } else if (this.data.id === 0 && this.data.existingData) {
      this.listData = this.data.existingData as (
        | IGetComment
        | ICheckComments
      )[];
    } else {
      this.loadComments();
    }
  }

  loadComments(): void {
    if (!this.data.id) return;
    this.loading = true;
    this.getCommentsObs()
      .pipe(finalize(() => { this.loading = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => { this.listData = res.data as (IGetComment | ICheckComments)[]; });
  }

  private getCommentsObs(): Observable<IApiRes<IComment[] | IGetComment[] | ICheckComments[]>> {
    return this.isInternationalPayment
      ? this.walletService.getCommentsInternationalPayment(this.data.id as string)
      : this.sharedService.getAllComments(this.type, this.data.id);
  }

  private addCommentObs(body: { comment: string }): Observable<IApiResMesssage | IApiRes<IGetComment>> {
    return this.isInternationalPayment
      ? this.walletService.addCommentInternationalPayment(this.data.id as string, body)
      : this.sharedService.addComment(this.type, this.data.id, body);
  }

  private deleteCommentObs(commentId: string): Observable<IApiResMesssage> {
    return this.isInternationalPayment
      ? this.walletService.deleteCommentInternationalPayment(this.data.id as string, commentId)
      : this.sharedService.deleteComment(this.type, this.data.id, commentId);
  }

  onSubmit(): void {
    if (this.isCommentEmpty) return;

    if (this.data.mode === 'group_payments') {
      this.groupPaymentsComments = [
        ...this.groupPaymentsComments,
        this.commentControl.value
      ];
      this.success = true;
      this.commentControl.reset();
      return;
    }

    this.submitting = true;
    const body = { comment: this.commentControl.value };
    const onSuccess = (res: IApiResMesssage | IApiRes<IGetComment>) => {
      this.success = true;
      this.isRefresh = true;
      this.alertService.successAlert({ content: 'Comment added.', close: true, timeout: 1500 });
      this.commentControl.reset();
      // A new (unsaved) payment has no resource id yet, so loadComments() would
      // bail out and the just-added comment would vanish. The API still returns
      // the created comment, so append it to the list locally instead.
      if (!this.data.id) {
        const created = (res as IApiRes<IGetComment>).data;
        if (created) this.listData = [...this.listData, created];
      } else {
        this.loadComments();
      }
    };
    this.addCommentObs(body)
      .pipe(finalize(() => { this.submitting = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => { if (res.success) onSuccess(res); });
  }

  removeComment(i: number): void {
    this.groupPaymentsComments.splice(i, 1);
  }

  deleteComment(id: string | number, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (this.commentDeletingLoading) return;

    const commentId = String(id);

    // Use setTimeout to ensure the dialog opens properly from within another dialog
    setTimeout(() => {
      const confirmDialogRef = this.alertService.confirmAlert({
        title: 'Confirm',
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      });

      confirmDialogRef
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (!result) return;
          this.commentDeletingLoading = commentId;
          const onDeleted = (success: boolean) => {
            if (success) {
              this.success = true;
              this.isRefresh = true;
              this.alertService.successAlert({ content: 'Comment deleted successfully.', close: true, timeout: 1500 });
              this.listData = this.listData.filter(
                (item) => (item.encrypted_id ?? String(item.id)) !== commentId
              );
            }
          };
          this.deleteCommentObs(commentId)
              .pipe(finalize(() => { this.commentDeletingLoading = false; }), takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => onDeleted(res.success));
        });
    }, 0);
  }

  close(): void {
    if (this.commentDeletingLoading) return;
    this.dialogRef.close({
      success: this.success,
      isRefresh: this.isRefresh,
      existingData:
        this.data.mode === 'group_payments'
          ? this.groupPaymentsComments
          : this.listData
    });
  }
}

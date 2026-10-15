import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X, Trash2, LoaderCircle } from 'lucide-angular';

import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IGetComment } from 'src/app/models/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { MatTooltip } from '@angular/material/tooltip';

export interface IV4AddCommentModalData {
  id: string | number;
  type: string;
  enableDelete?: boolean;
  enableCommentTooltip?: boolean;
  existingData?: IGetComment[];
}

@Component({
  selector: 'app-v4-add-comment-common-modal',
  templateUrl: './v4-add-comment-common-modal.component.html',
  styleUrls: ['./v4-add-comment-common-modal.component.scss'],
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
export class V4AddCommentCommonModalComponent implements OnInit {
  public data: IV4AddCommentModalData = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<V4AddCommentCommonModalComponent>);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly Trash2Icon = Trash2;
  readonly LoaderCircleIcon = LoaderCircle;

  listData: IGetComment[] = [];
  loading = false;
  submitting = false;
  commentDeletingLoading: false | string = false;
  isRefresh = false;

  commentControl = new FormControl('', {
    validators: [Validators.required],
    nonNullable: true
  });

  ngOnInit(): void {
    if (this.data.id === 0 && this.data.existingData) {
      this.listData = this.data.existingData;
    } else {
      this.loadComments();
    }
  }

  loadComments(): void {
    if (!this.data.id) return;
    this.loading = true;
    this.sharedService
      .getAllComments(this.data.type, this.data.id)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.listData = res.data as IGetComment[];
      });
  }

  onSubmit(): void {
    if (this.data.type === 'payees' && this.listData.length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add comments',
        isCancel: false
      });
      return;
    }
    this.commentControl.markAsTouched();
    if (this.commentControl.invalid) return;
    this.submitting = true;
    this.sharedService
      .addComment(this.data.type, this.data.id, {
        comment: this.commentControl.value
      })
      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.isRefresh = true;
          this.alertService.successAlert({
            content: 'Comment added.',
            close: true,
            timeout: 1500
          });
          this.commentControl.reset();
          if (!this.data.id) {
            this.listData.push(res.data);
          } else {
            this.loadComments();
          }
        }
      });
  }

  deleteComment(id: string): void {
    if (this.commentDeletingLoading) return;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) return;
        this.commentDeletingLoading = id;
        this.sharedService
          .deleteComment(this.data.type, 0, id)
          .pipe(
            finalize(() => {
              this.commentDeletingLoading = false;
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.isRefresh = true;
              this.listData = this.listData.filter(
                (item) => (item.encrypted_id ?? String(item.id)) !== id
              );
            }
          });
      });
  }

  close(): void {
    if (this.commentDeletingLoading) return;
    this.dialogRef.close({ refresh: this.isRefresh, listData: this.listData });
  }
}

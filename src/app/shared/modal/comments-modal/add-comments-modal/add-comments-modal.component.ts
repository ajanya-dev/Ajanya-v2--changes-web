import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { commentInterface, IGetComment } from 'src/app/models/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { ConfirmAlertComponent } from 'src/app/shared/alert/components/confirm-alert/confirm-alert.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { CommonButtonV35Component } from '../../../v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

interface ICommentData {
  id: string | number;
  type: string;
  count: number;
  existingData: IGetComment[];
  enableDelete: boolean;
  recurringId?: string | number;
}

/**
 * @description Modal component to add comments.
 */
@Component({
  selector: 'app-add-comments-modal',
  templateUrl: './add-comments-modal.component.html',
  styleUrls: ['./add-comments-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    CommonButtonV35Component,
    ControlMessageComponent
  ]
})
export class AddCommentsModalComponent implements OnInit, OnDestroy {
  public commentData: ICommentData = inject(MAT_DIALOG_DATA);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private v3DataTableService = inject(V3DataTableService);
  private fb = inject(UntypedFormBuilder);
  public datepipe = inject(DatePipe);
  public dialogRef = inject(MatDialogRef<AddCommentsModalComponent>);

  commentForm: UntypedFormGroup;
  listData: IGetComment[] = [];
  currentDateTime: string | null;
  subscriptions: Subscription[] = [];
  typeId: string | number;
  type: string;
  isRefreesh = false;
  count = 0;
  lengths: number;
  totalComment: number;
  enableDelete: boolean;
  commentDeletingLoading: string | boolean | number;
  isRefresh: boolean = false;
  loading: boolean = false;

  ngOnInit(): void {
    this.typeId = this.commentData.id;
    this.type = this.commentData.type;
    this.totalComment = this.commentData.count;
    this.enableDelete = this.commentData.enableDelete;
    this.getComment();

    this.currentDateTime = this.datepipe.transform(
      new Date(),
      'MM/dd/yyyy h:mm'
    );
    this.initFormGroup();

    if (this.commentData?.id === 0 && this.commentData?.existingData) {
      this.listData = this.commentData.existingData;
    }
  }

  /**
   * @description Creates the comment object using form data and return it..
   * @returns comment object.
   */
  createCommentBody(): commentInterface & { id?: string | number } {
    const data = this.commentForm.value;
    if (this.commentData.recurringId) {
      return { comment: data.comment, id: this.commentData.recurringId };
    }
    return { comment: data.comment };
  }

  /**
   * @description Initializes the comment form.
   */
  initFormGroup() {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required]
    });
  }

  /**
   * @description Method to get all comments and set them to `this.listData`.
   * @returns
   */
  getComment() {
    this.count = this.count + 1;
    if (this.typeId === 0) {
      this.listData = this.commentData?.existingData;
      return;
    }
    this.subscriptions.push(
      this.sharedService
        .getAllComments(this.type, this.typeId)
        .subscribe((res) => {
          this.listData = res.data as IGetComment[];
          if (this.count === 1) {
            this.lengths = this.listData.length;
          }
        })
    );
  }

  /**
   * @description Method to add the given comment.
   * @returns boolean
   */
  onSubmit() {
    if (this.type === 'payees' && this.totalComment >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add comments ',
        isCancel: false
      });
      return;
    }
    this.commentForm.markAllAsTouched();
    if (!this.commentForm.invalid) {
      this.loading = true;
      this.subscriptions.push(
        this.sharedService
          .addComment(this.type, this.typeId, this.createCommentBody())
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res.success === true) {
              this.isRefreesh = true;
              this.successAlert();
              this.getComment();
              if (res.success && this.typeId === 0) {
                this.listData.push(res.data);
              }
              if (res.success && this.type === 'payees') {
                this.totalComment += 1;
              }
            }
          })
      );
      this.commentForm.reset();
    } else return false;
    return true;
  }

  /**
   * @description Method to show success alert.
   */
  successAlert() {
    const data = {
      title: 'Success!',
      content: 'Comment added.',
      close: true
    };
    this.alertService.successAlert(data);
  }

  /**
   * @description Method to delete comment.
   */
  deleteComment(id: string | number): void {
    if (this.commentDeletingLoading) return;
    this.subscriptions.push(
      this.deleteConfirmAlert()
        .afterClosed()
        .subscribe((data) => {
          if (!data) return;
          if (id) {
            this.commentDeletingLoading = id;
            this.subscriptions.push(
              this.sharedService
                .deleteComment(this.type, this.commentData.recurringId ?? 0, id as string)
                .pipe(
                  finalize(() => {
                    this.commentDeletingLoading = false;
                  })
                )
                .subscribe((res) => {
                  if (res.success) {
                    this.isRefresh = true;
                    this.listData.forEach((item) => {
                      const itemId = item.encrypted_id ?? item.id;
                      if (itemId === id) {
                        this.listData.splice(this.listData.indexOf(item), 1);
                      }
                    });
                  }
                })
            );
          }
        })
    );
  }

  deleteConfirmAlert(): MatDialogRef<ConfirmAlertComponent, boolean> {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to delete this comment?',
      doneMsg: 'Yes, Delete it!',
      cancelMsg: 'No Cancel!'
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * @description Closes the dialog. For the case where the items counts are same, no need to refresh since there is no change in badge/icon display status in parent(even when user adds and deletes equal number of items).
   */
  close() {
    this.isRefresh = false;
    if (this.lengths !== this.listData.length) {
      this.isRefresh = true;
      this.v3DataTableService.refreshV3DataTable();
    }
    this.dialogRef.close({ listData: this.listData, refresh: this.isRefresh });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

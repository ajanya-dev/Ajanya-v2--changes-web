import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faSpinner, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { Subscription, finalize } from 'rxjs';
import { IComment, IGetComment } from 'src/app/models/common';
import { ICheckComments } from 'src/app/models/v3-datatable';
import { ConfirmAlertComponent } from 'src/app/shared/alert/components/confirm-alert/confirm-alert.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

/**
 * @description Component for viewing comments.
 */
@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule,NgOptimizedImage],
  selector: 'app-view-comments',
  templateUrl: './view-comments.component.html',
  styleUrls: ['./view-comments.component.scss']
})
export class ViewCommentsComponent implements OnChanges, OnDestroy {
  @Input() slug: string; // Options - bills, vendor-credits ...
  @Input() id: string; //             👆 ids

  subscriptions: Subscription[] = [];
  headers = ['Date', 'User', 'Comment', 'Action'];
  commentData: IGetComment[] | ICheckComments[] = [];
  commentDeletingLoading: string | boolean | number;
  isLoading = signal(false);

  faTrash = faTrash;
  faEnvelope = faEnvelope;
  faSpinner = faSpinner;

  private sharedService = inject(SharedService);
  private alertService = inject(AlertService);

  ngOnChanges(): void {
    if (this.id) {
      this.getData();
    }
  }

  /**
   * @description Gets all comments.
   */
  getData() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.sharedService
        .getAllComments(this.slug, this.id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((data) => {
          if (data?.success) {
            const response = data as IComment;
            this.commentData = response.data;
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
                .deleteComment(this.slug, 0, id as string)
                .pipe(
                  finalize(() => {
                    this.commentDeletingLoading = false;
                  })
                )
                .subscribe((res) => {
                  if (res?.success) {
                    this.alertService.successAlert({});

                    // Finding deleted comment indexValue
                    const index = this.commentData.findIndex((item) => {
                      const itemId = item.encrypted_id ?? item.id;
                      return itemId === id;
                    });

                    // Used the index to remove deleted item from commentData with splice method
                    if (index !== -1) {
                      this.commentData.splice(index, 1);
                    }
                  }
                })
            );
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}

import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ICheckComments } from 'src/app/models/v3-datatable';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { faEnvelope, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmAlertComponent } from 'src/app/shared/alert/components/confirm-alert/confirm-alert.component';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-check-comments',
  templateUrl: './check-comments.component.html',
  styleUrls: ['./check-comments.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    FontAwesomeModule,
    NgStyle,
    CommonButtonV35Component,
  ]
})
export class CheckCommentsComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private walletService = inject(WalletService);

  @Input() checkId: string;
  @Input() mode: 'check' | 'international_payments' = 'check';
  @Input() canAdd = true;

  subscriptions: Subscription[] = [];
  listData: ICheckComments[] = [];
  loading = false;
  comment: string;
  commentDeletingLoading: string | boolean | number;

  faTrash = faTrash;
  faEnvelope = faEnvelope;

  ngOnInit(): void {
    this.getComment();
  }

  createCommentBody() {
    return {
      comment: this.comment
    };
  }

  getComment() {
    if (this.mode === 'international_payments') {
      this.subscriptions.push(
        this.walletService
          .getCommentsInternationalPayment(this.checkId)
          .subscribe((res) => {
            if (res?.success) {
              this.listData = res.data.map((item) => ({
                id: String(item.id),
                date: item.formated_date || item.created_at,
                time: '',
                comment: item.comments,
                createdBy: item.user_name,
                encrypted_id: item.encrypted_id,
                all_comment_status: item.status
                  ? { status_text: item.status }
                  : undefined
              }));
            }
          })
      );
      return;
    }

    this.subscriptions.push(
      this.checkService.getAllCheckComments(this.checkId).subscribe((res) => {
        if (res?.success) {
          this.listData = res.data;
        }
      })
    );
  }

  onSubmit() {
    if (!this.comment) {
      this.openWarningAlert();
      return;
    }

    this.loading = true;
    if (this.comment) {
      this.subscriptions.push(
        (this.mode === 'international_payments'
          ? this.walletService.addCommentInternationalPayment(
              this.checkId,
              this.createCommentBody()
            )
          : this.checkService.addCommentCheck(
              this.checkId,
              this.createCommentBody()
            )
        )
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res?.success) {
              this.getComment();
            }
          })
      );
      this.comment = '';
    }
  }

  openWarningAlert() {
    const data = {
      content: 'Comment field is required.'
    };
    return this.alertService.warningAlert(data);
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
            if (this.mode === 'international_payments') {
              this.subscriptions.push(
                this.walletService
                  .deleteCommentInternationalPayment(
                    this.checkId,
                    id as string
                  )
                  .pipe(
                    finalize(() => {
                      this.commentDeletingLoading = false;
                    })
                  )
                  .subscribe((res) => {
                    if (res.success) {
                      this.alertService.successAlert({});
                      this.listData = this.listData.filter((item) => {
                        const itemId = item.encrypted_id ?? item.id;
                        return itemId !== id;
                      });
                    }
                  })
              );
            } else {
              this.subscriptions.push(
                this.sharedService
                  .deleteComment('checks', 0, id as string)
                  .pipe(
                    finalize(() => {
                      this.commentDeletingLoading = false;
                    })
                  )
                  .subscribe((res) => {
                    if (res.success) {
                      this.alertService.successAlert({});
                      this.listData = this.listData.filter((item) => {
                        const itemId = item.encrypted_id ?? item.id;
                        return itemId !== id;
                      });
                    }
                  })
              );
            }
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

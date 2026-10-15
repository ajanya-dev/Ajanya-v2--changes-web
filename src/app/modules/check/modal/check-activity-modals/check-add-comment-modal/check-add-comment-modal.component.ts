import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { DatePipe, NgStyle, NgIf } from '@angular/common';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { commentInterface } from 'src/app/models/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { ConfirmAlertComponent } from 'src/app/shared/alert/components/confirm-alert/confirm-alert.component';
import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-check-add-comment-modal',
  templateUrl: './check-add-comment-modal.component.html',
  styleUrls: ['./check-add-comment-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgStyle,
    NgIf,
    ControlMessageComponent,
    FaIconComponent,
    MatTooltip,
    DatePipe
  ]
})
export class CheckAddCommentModalComponent implements OnInit, OnDestroy {
  commentForm: UntypedFormGroup;
  listData: any[] = [];
  subscriptions: Subscription[] = [];
  typeId: string | number;
  isRefresh = false;
  isHide = false;
  loading = false;
  success = false;
  checkMode = true;
  commentDeletingLoading: false | string = false;
  groupPaymentsComments : string[] = [];
  faTrash = faTrash;

  public Commentdata = inject(MAT_DIALOG_DATA); // Get Data From Modal
  private fb = inject(UntypedFormBuilder);
  public datepipe = inject(DatePipe);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private walletService = inject(WalletService);
  public dialogRef = inject(MatDialogRef<CheckAddCommentModalComponent>);

  ngOnInit(): void {
    this.typeId = this.Commentdata.id;
    if (this.Commentdata.mode === 'zil_payments' || this.Commentdata.mode === 'international_payments') {
      this.checkMode = false;
    }
    if (this.Commentdata.mode === 'group_payments') {
      this.groupPaymentsComments = this.Commentdata.existingData;
    }else{
      this.loadComments();
      this.loadExistingComments();
    }
    this.initFormGroup();
  }

  // Load comments if its from new check
  loadExistingComments() {
    if (this.Commentdata?.id === 0 && this.Commentdata?.existingData)
      this.listData = this.Commentdata.existingData;
  }

  // Load Exisiting Comments
  loadComments(): void {
    if (this.typeId === 0) return;
    this.listData = this.Commentdata.existingData;
    if (this.checkMode) {
      this.subscriptions.push(
        this.checkService
          .getAllCheckComments(this.typeId)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            this.listData = res.data;
          })
      );
    } else if (this.Commentdata.mode === 'international_payments') {
      this.subscriptions.push(
        this.walletService
          .getCommentsInternationalPayment(this.typeId as string)
          .pipe(finalize(() => { this.loading = false; }))
          .subscribe((res) => { this.listData = res.data; })
      );
    } else {
      this.subscriptions.push(
        this.sharedService
          .getZilPaymentsComments(this.typeId)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            this.listData = res.data;
          })
      );
    }
  }

  initFormGroup(): void {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required]
    });
  }

  createCommentBody(): commentInterface {
    const data = this.commentForm.value;
    return {
      comment: data.comment
    };
  }

  // Add Comment
  onSubmit() {
    this.isHide = true;
    setTimeout(() => {
      this.isHide = false;
    }, 2000);
    if (this.commentForm.invalid) {
      return;
    }
    
    if (this.Commentdata.mode === 'group_payments') {
      this.groupPaymentsComments = [...this.groupPaymentsComments, this.commentForm.value.comment];
      this.success = true;
      this.commentForm.reset();      
      return;
    }
    this.loading = true;
    this.commentForm.markAllAsTouched();
    if (!this.commentForm.invalid) {
      if (this.checkMode) {
        this.subscriptions.push(
          this.checkService
            .addCommentCheck(this.typeId, this.createCommentBody())
            .pipe(
              finalize(() => {
                this.loading = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.success = true;

                if (this.listData.length === 0) this.isRefresh = true;

                if (this.typeId === 0) this.listData.push(res.data);

                this.loadComments();
              }
            })
        );
      } else if (this.Commentdata.mode === 'international_payments') {
        this.subscriptions.push(
          this.walletService
            .addCommentInternationalPayment(this.typeId as string, this.createCommentBody())
            .pipe(finalize(() => { this.loading = false; }))
            .subscribe((res) => {
              if (res.success) {
                this.success = true;
                if (this.listData.length === 0) this.isRefresh = true;
                this.loadComments();
              }
            })
        );
      } else {
        this.subscriptions.push(
          this.sharedService
            .addComment(
              'zil-payments',
              this.Commentdata.id,
              this.createCommentBody()
            )
            .pipe(
              finalize(() => {
                this.loading = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.success = true;

                if (this.listData.length === 0) {
                  this.isRefresh = true;
                }
                const time = res.data.formated_date.split('- ')[1];
                if (this.typeId === 0) {
                  const formattedData = {
                    encrypted_id: res.data.encrypted_id,
                    user_name: res.data.user_name,
                    created_at: res.data.created_at,
                    comments: res.data.comments,
                    time
                  };
                  this.listData.push(formattedData);
                }

                this.loadComments();
              }
            })
        );
      }
      this.commentForm.reset();
    }
  }

  deleteComment(id: string): void {
    if (this.commentDeletingLoading) return;
    this.subscriptions.push(
      this.deleteConfirmAlert()
        .afterClosed()
        .subscribe((data) => {
          if (!data) return;
          if (id) {
            this.commentDeletingLoading = id;
            if (this.Commentdata.mode === 'international_payments') {
              this.subscriptions.push(
                this.walletService
                  .deleteCommentInternationalPayment(this.typeId as string, id)
                  .pipe(finalize(() => { this.commentDeletingLoading = false; }))
                  .subscribe((res) => {
                    if (res.success) {
                      this.success = true;
                      this.isRefresh = true;
                      this.listData = this.listData.filter((item) => {
                        const itemId = item.encrypted_id ?? item.id;
                        return itemId !== id;
                      });
                    }
                  })
              );
            } else {
              const type = this.checkMode ? 'checks' : 'zil-payments';
              this.subscriptions.push(
                this.sharedService
                  .deleteComment(type, 0, id)
                  .pipe(
                    finalize(() => {
                      this.commentDeletingLoading = false;
                    })
                  )
                  .subscribe((res) => {
                    if (res.success) {
                      this.success = true;
                      this.isRefresh = true;
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

  // Modal Close
  close() {
    if (this.commentDeletingLoading) return;    
    this.dialogRef.close({
      success: this.success,
      isRefresh: this.isRefresh,
      existingData: this.Commentdata.mode === 'group_payments' ? this.groupPaymentsComments : this.listData
    });
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

  removeComment(i: number): void {
    this.groupPaymentsComments.splice(i, 1);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

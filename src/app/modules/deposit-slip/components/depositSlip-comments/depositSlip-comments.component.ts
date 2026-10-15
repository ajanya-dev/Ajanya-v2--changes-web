import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  InputSignal,
  OnInit,
  inject,
  input,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subscription, finalize } from 'rxjs';
import { IGetComment } from 'src/app/models/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule,
    CommonButtonV35Component,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-depositSlip-comments',
  templateUrl: './depositSlip-comments.component.html',
  styleUrls: ['./depositSlip-comments.component.scss']
})
export class DepositSlipCommentsComponent implements OnInit {
  slipId: InputSignal<string> = input<string>('');
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private cdr = inject(ChangeDetectorRef);

  subscriptions: Subscription[] = [];
  listData: { [key: string]: string }[] | IGetComment[] = [];
  loading = false;
  comment = '';
  isLoading = signal(false);

  ngOnInit(): void {
    this.getComment();
  }

  createCommentBody() {
    return {
      comment: this.comment
    };
  }

  /** Method for getting comments */
  getComment() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.sharedService
        .getAllComments('deposit-slips', this.slipId())
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.listData = res.data as IGetComment[];
            this.cdr.detectChanges();
          }
        })
    );
  }

  /** method for add comment */
  onSubmit() {
    if (!this.comment) {
      this.openWarningAlert();
      return;
    }

    this.loading = true;

    if (this.comment) {
      this.subscriptions.push(
        this.sharedService
          .addComment('deposit-slips', this.slipId(), this.createCommentBody())
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

  /** Method for delete comment */
  onDeleteComment(id: string) {
    const alert = this.openConfirmAlert();
    this.subscriptions.push(
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.sharedService
              .deleteComment('deposit-slips', 0, id)
              .subscribe((apiRes) => {
                if (apiRes.success === true) {
                  this.getComment();
                  this.cdr.detectChanges();
                }
              })
          );
        }
      })
    );
  }

  /** Confirm alert */
  openConfirmAlert() {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to delete this deposit slip comment?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    return this.alertService.confirmAlert(data);
  }

  /** Success alert */
  openSuccessAlert() {
    const data = {
      title: 'Success!',
      content: 'Attachment deleted',
      close: true
    };
    return this.alertService.successAlert(data);
  }

  /** field warning alert */
  openWarningAlert() {
    const data = {
      content: 'Comment field is required.'
    };
    return this.alertService.warningAlert(data);
  }

  /** destroyer */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

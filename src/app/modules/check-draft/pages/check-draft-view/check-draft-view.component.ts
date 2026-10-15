import {
  CommonModule,
  DatePipe,
  NgClass,
  NgOptimizedImage
} from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip } from '@angular/material/tooltip';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  ICheckDraftActivityLog,
  ICheckDraftAttachments,
  ICheckDraftComments,
  ICheckDraftView
} from '../../model/Checkdraft';

/**
 * @description Represents a component for viewing details of a check draft.
 */
@Component({
  selector: 'app-check-draft-view',
  templateUrl: './check-draft-view.component.html',
  styleUrls: ['./check-draft-view.component.scss'],
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    FaIconComponent,
    OcwBackButtonComponent,
    CommonModule,
    NgOptimizedImage,
    NgClass,
    MatTooltip,
    TruncatePipe,
    CommonButtonV35Component
  ]
})
export class CheckDraftViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private checkDraftService = inject(CheckDraftService);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  subscription: Subscription[] = [];
  isRecurrig = false;
  Id: string;
  viewData: ICheckDraftView;
  activityLogs: ICheckDraftActivityLog[];
  attachmentsList: ICheckDraftAttachments[];
  commentsList: ICheckDraftComments[];
  isLoading = signal(false);
  isActivityLoading = signal(false);
  isCommentLoading = signal(false);
  isAttachmentLoading = signal(false);

  faSpinner = faSpinner;

  readonly fields = [
    { label: 'Check No', key: 'check_no' },
    { label: 'Bank Account Name', key: 'bank_account_name' },
    { label: 'Payee Name', key: 'payee_name' },
    { label: 'Amount', key: 'amount' },
    { label: 'Check Date', key: 'check_date' },
    { label: 'Ac#', key: 'ac_no' },
    { label: 'Inv#', key: 'inv_no' },
    { label: 'Memo', key: 'memo' },
    { label: 'Note', key: 'note' }
  ];

  ngOnInit(): void {
    this.Id = this.route.snapshot.paramMap.get('id') as string;
    this.getViewData();
    this.getCheckLogActivity();
    this.getAttachments();
    this.getComments();
  }

  /**
   * @description Fetches the view data for the check draft.
   */
  getViewData() {
    this.isLoading.set(true);
    this.subscription.push(
      this.checkDraftService
        .checkDraftView(this.Id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          this.viewData = res.data;
        })
    );
  }

  goBack() {
    this.router.navigate(['manage/checkdraft/index']);
  }

  /**
   * @description Fetches the activity logs for the check draft.
   */
  getCheckLogActivity() {
    this.isActivityLoading.set(true);
    this.subscription.push(
      this.checkDraftService
        .getActivityLogs(this.Id)
        .pipe(finalize(() => this.isActivityLoading.set(false)))
        .subscribe((res) => {
          this.activityLogs = res.data;
        })
    );
  }

  /**
   * @description Fetches the attachments for the check draft.
   */
  getAttachments() {
    this.isAttachmentLoading.set(true);
    this.subscription.push(
      this.checkDraftService
        .getAttachments(this.Id)
        .pipe(finalize(() => this.isAttachmentLoading.set(false)))
        .subscribe((res) => {
          this.attachmentsList = res.data;
        })
    );
  }

  /**
   * @description Opens and views an attachment in a new browser window.
   * @param id - The ID of the attachment to view.
   */
  viewAttachment(id: string) {
    this.subscription.push(
      this.checkDraftService.openAttachment(this.Id, id).subscribe((res) => {
        if (res.success) {
          window.open(res.data, 'blank');
        }
      })
    );
  }

  /**
   * @description Fetches the comments for the check draft.
   */
  getComments() {
    this.isCommentLoading.set(true);
    this.subscription.push(
      this.checkDraftService
        .getComments(this.Id)
        .pipe(finalize(() => this.isCommentLoading.set(false)))
        .subscribe((res) => {
          this.commentsList = res.data;
        })
    );
  }

  /**
   * @description Opens the "Add Comments" modal and refreshes the comments list after the modal is closed.
   */
  addcomments() {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '100%',
      maxWidth: '700px',
      data: {
        id: this.Id,
        type: 'cheque-drafts'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getComments();
    });
  }

  addAttachments() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      width: '100%',
      maxWidth: '700px',
      data: {
        id: this.Id,
        type: 'cheque-drafts'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getAttachments();
    });
  }

  /**
   * @description Formats a date string using the datePipe.
   * @param date - The date string to be formatted.
   * @returns - The formatted date string.
   */
  formatedDate(date: string) {
    return this.datePipe.transform(date, 'MM/dd/yyyy');
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el.unsubscribe());
  }
}

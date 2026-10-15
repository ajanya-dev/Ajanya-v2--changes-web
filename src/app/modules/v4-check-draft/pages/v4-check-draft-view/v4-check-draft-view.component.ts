import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  ICheckDraftActivityLog,
  ICheckDraftAttachments,
  ICheckDraftComments,
  ICheckDraftView
} from '../../model/v4-Checkdraft';

type ViewTab = 'activity' | 'attachments' | 'comments';

@Component({
  selector: 'app-v4-check-draft-view',
  templateUrl: './v4-check-draft-view.component.html',
  styleUrls: ['./v4-check-draft-view.component.scss'],
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component]
})
export class V4CheckDraftViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private checkDraftService = inject(CheckDraftService);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  Id: string;
  viewData: ICheckDraftView;
  activityLogs: ICheckDraftActivityLog[];
  attachmentsList: ICheckDraftAttachments[];
  commentsList: ICheckDraftComments[];

  isLoading = signal(false);
  isActivityLoading = signal(false);
  isCommentLoading = signal(false);
  isAttachmentLoading = signal(false);
  activeTab = signal<ViewTab>('activity');

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

  getViewData() {
    this.isLoading.set(true);
    this.checkDraftService
      .checkDraftView(this.Id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.viewData = res.data;
      });
  }

  goBack() {
    window.history.back();
  }

  setActiveTab(tab: ViewTab) {
    this.activeTab.set(tab);
  }

  getCheckLogActivity() {
    this.isActivityLoading.set(true);
    this.checkDraftService
      .getActivityLogs(this.Id)
      .pipe(
        finalize(() => this.isActivityLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.activityLogs = res.data;
      });
  }

  getAttachments() {
    this.isAttachmentLoading.set(true);
    this.checkDraftService
      .getAttachments(this.Id)
      .pipe(
        finalize(() => this.isAttachmentLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.attachmentsList = res.data;
      });
  }

  viewAttachment(id: string) {
    this.checkDraftService
      .openAttachment(this.Id, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data, '_blank');
        }
      });
  }

  getComments() {
    this.isCommentLoading.set(true);
    this.checkDraftService
      .getComments(this.Id)
      .pipe(
        finalize(() => this.isCommentLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.commentsList = res.data;
      });
  }

  addcomments() {
    this.dialog
      .open(AddCommentsModalComponent, {
        width: '100%',
        maxWidth: '700px',
        data: { id: this.Id, type: 'cheque-drafts' }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getComments();
      });
  }

  addAttachments() {
    this.dialog
      .open(AddAttachmentModalComponent, {
        width: '100%',
        maxWidth: '700px',
        data: { id: this.Id, type: 'cheque-drafts' }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getAttachments();
      });
  }

  formatedDate(date: string): string | null {
    return this.datePipe.transform(date, 'MM/dd/yyyy');
  }
}

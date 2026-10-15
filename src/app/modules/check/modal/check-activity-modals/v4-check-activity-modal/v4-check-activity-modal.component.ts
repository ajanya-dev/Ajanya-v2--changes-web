import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  LucideAngularModule,
  X,
  ExternalLink,
  LoaderCircle
} from 'lucide-angular';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ICheckAttachmentData } from 'src/app/modules/check/model/check';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IApiRes } from 'src/app/models/api';

interface IActivityLog {
  date: string;
  status: string;
  activityBy: string;
  location: string;
  notes: string;
}

interface ICheckComment {
  date: string;
  createdBy: string;
  comment: string;
}

@Component({
  selector: 'app-v4-check-activity-modal',
  templateUrl: './v4-check-activity-modal.component.html',
  styleUrls: ['./v4-check-activity-modal.component.scss'],
  standalone: true,
  imports: [
    TitleCasePipe,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component
  ]
})
export class V4CheckActivityModalComponent implements OnInit {
  private checkId: string = inject(MAT_DIALOG_DATA);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly ExternalLinkIcon = ExternalLink;
  readonly LoaderCircleIcon = LoaderCircle;

  activityLogs = signal<IActivityLog[]>([]);
  commentList = signal<ICheckComment[]>([]);
  attachmentList = signal<ICheckAttachmentData[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    forkJoin({
      activities: this.checkService
        .getActivityLog(this.checkId)
        .pipe(catchError(() => [{ success: false, data: [] }])),
      comments: this.checkService
        .getAllCheckComments(this.checkId)
        .pipe(catchError(() => [{ success: false, data: [] }])),
      attachments: this.checkService
        .getCheckAttachment(this.checkId)
        .pipe(
          catchError(
            () =>
              [{ success: false, data: [] }] as unknown as IApiRes<
                ICheckAttachmentData[]
              >[]
          )
        )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.activities?.success) {
            this.activityLogs.set(res.activities.data ?? []);
          }
          if (res.comments?.success) {
            this.commentList.set(res.comments.data ?? []);
          }
          if (res.attachments?.success) {
            this.attachmentList.set(res.attachments.data ?? []);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  openAttachment(id: string): void {
    this.checkService
      .openCheckAttachment(this.checkId, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          const urlLoaded = window.open(res.data);
          if (
            !urlLoaded ||
            urlLoaded.closed ||
            typeof urlLoaded.closed === 'undefined'
          ) {
            this.alertService.warningAlert({
              title: 'Error',
              content:
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
            });
          }
        }
      });
  }
}

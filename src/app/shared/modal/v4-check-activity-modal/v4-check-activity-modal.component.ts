import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X, ExternalLink, FileText } from 'lucide-angular';
import { finalize, forkJoin } from 'rxjs';

import { CheckService } from '../../service/check/check.service';
import { V4AlertService } from '../../service/alert/v4-alert.service';

interface IActivityRes {
  success: boolean;
  data: unknown[];
}

@Component({
  selector: 'app-v4-check-activity-modal',
  templateUrl: './v4-check-activity-modal.component.html',
  styleUrls: ['./v4-check-activity-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe, DatePipe, LucideAngularModule]
})
export class V4CheckActivityModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4CheckActivityModalComponent>);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  public data: string = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly ExternalLinkIcon = ExternalLink;
  readonly FileTextIcon = FileText;

  activityLogs = signal<unknown[]>([]);
  commentList = signal<unknown[]>([]);
  attachmentList = signal<unknown[]>([]);

  loading = signal(true);

  ngOnInit(): void {
    this.loadAll();
  }

  close(): void {
    this.dialogRef.close();
  }

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      activity: this.checkService.getActivityLog(this.data),
      comments: this.checkService.getAllCheckComments(this.data),
      attachments: this.checkService.getCheckAttachment(this.data)
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ activity, comments, attachments }) => {
        if ((activity as IActivityRes).success) {
          this.activityLogs.set((activity as IActivityRes).data);
        }
        if ((comments as IActivityRes).success) {
          this.commentList.set((comments as IActivityRes).data);
        }
        if ((attachments as IActivityRes).success) {
          this.attachmentList.set((attachments as IActivityRes).data);
        }
      });
  }

  openAttachment(id: string): void {
    this.checkService
      .openCheckAttachment(this.data, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: { success: boolean; data: string }) => {
        if (res.success) {
          const urlLoaded = window.open(res.data);
          if (
            !urlLoaded ||
            urlLoaded.closed ||
            typeof urlLoaded.closed === 'undefined'
          ) {
            this.alertService.failedAlert({
              content:
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window.',
              close: true,
              timeout: 3000
            });
          }
        }
      });
  }
}

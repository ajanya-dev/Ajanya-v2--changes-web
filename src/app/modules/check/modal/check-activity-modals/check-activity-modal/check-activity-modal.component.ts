import { IWarningAlert } from './../../../../../models/alert';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgFor, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-check-activity-modal',
  templateUrl: './check-activity-modal.component.html',
  styleUrls: ['./check-activity-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, TitleCasePipe]
})
export class CheckActivityModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  activityLogs: any[] = [];
  commentList: any[] = [];
  attachmentList: any[] = [];

  constructor(
    private _checkService: CheckService,
    public _alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.getActivityLogs(this.data);
    this.getComments(this.data);
    this.getAttachments(this.data);
  }

  getActivityLogs(id: any) {
    this.subscriptions.push(
      this._checkService.getActivityLog(id).subscribe((res: any) => {
        if (res.success) {
          this.activityLogs = res.data;
        }
      })
    );
  }

  getComments(id: any) {
    this.subscriptions.push(
      this._checkService.getAllCheckComments(id).subscribe((res: any) => {
        if (res.success) {
          this.commentList = res.data;
        }
      })
    );
  }

  getAttachments(id: any) {
    this.subscriptions.push(
      this._checkService.getCheckAttachment(id).subscribe((res: any) => {
        if (res.success) {
          this.attachmentList = res.data;
        }
      })
    );
  }

  openAttachment(id: any) {
    this.subscriptions.push(
      this._checkService
        .openCheckAttachment(this.data, id)
        .subscribe((res: any) => {
          if (res.success) {
            const urlLoaded = window.open(res.data);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed == 'undefined'
            ) {
              this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
              );
            }
          }
        })
    );
  }

  openWarningAlert(content: string): void {
    const data: IWarningAlert = {
      title: 'Error',
      content: content
    };
    this._alertService.warningAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { IFailedAlert } from 'src/app/models/alert';
import { NgIf } from '@angular/common';

/**
 * @description Component for failed alert dialog.
 */
@Component({
  selector: 'app-failed-alert',
  templateUrl: './failed-alert.component.html',
  styleUrls: ['./failed-alert.component.scss'],
  standalone: true,
  imports: [NgIf, MatDialogActions, MatDialogClose]
})
export class FailedAlertComponent implements OnInit {
  title: string | boolean = 'Error';
  content = 'Something went wrong!';
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 1000;
  isOk = true;
  isCancel = false;
  refresh = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IFailedAlert,
    public dialogRef: MatDialogRef<FailedAlertComponent>
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.title = this.data.title
        ? this.data.title
        : this.data.title == false
          ? (this.title = '')
          : this.title;
      this.content = this.data.content ? this.data.content : 'null';
      this.doneMsg = this.data.doneMsg ? this.data.doneMsg : 'OK';
      this.close = this.data.close ? this.data.close : false;
      this.timeout = this.data.timeout ? this.data.timeout : this.timeout;
      this.isOk = this.data.isOk ? this.data.isOk : this.isOk;
      this.isCancel = this.data.isCancel ? this.data.isCancel : this.isCancel;
      this.cancelMsg = this.data.cancelMsg
        ? this.data.cancelMsg
        : this.cancelMsg;
      // this.disableDone = this.data.disableDone ? this.data.disableDone : this.disableDone;
      this.refresh = this.data.refresh ? true : false;
    }

    if (this.close) {
      setTimeout(() => {
        this.dialogRef.close(true);
      }, this.timeout);
    }
  }

  /**
   * @description CLoses the dialog.
   */
  done() {
    this.dialogRef.close(true);
  }

  /**
   * @description Refreshes the page.
   */
  refreshPage() {
    location.reload();
  }
}

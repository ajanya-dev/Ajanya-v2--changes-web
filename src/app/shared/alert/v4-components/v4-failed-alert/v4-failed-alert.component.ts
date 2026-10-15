import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { IFailedAlert } from 'src/app/models/alert';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, CircleX } from 'lucide-angular';

@Component({
  selector: 'app-v4-failed-alert',
  templateUrl: './v4-failed-alert.component.html',
  styleUrls: ['./v4-failed-alert.component.scss'],
  standalone: true,
  imports: [MatDialogActions, LucideAngularModule, CommonButtonV4Component]
})
export class V4FailedAlertComponent implements OnInit {
  title: string | boolean = 'Error';
  content = 'Something went wrong!';
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 1000;
  isOk = true;
  isCancel = false;
  refresh = false;
  readonly CircleXIcon = CircleX;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IFailedAlert,
    public dialogRef: MatDialogRef<V4FailedAlertComponent>
  ) {}

  ngOnInit(): void {
    if (this.data) {
      if (this.data.title) {
        this.title = this.data.title;
      } else if (this.data.title === false) {
        this.title = '';
      }
      this.content = this.data.content ? this.data.content : 'null';
      this.doneMsg = this.data.doneMsg ? this.data.doneMsg : 'OK';
      this.close = this.data.close ? this.data.close : false;
      this.timeout = this.data.timeout ? this.data.timeout : this.timeout;
      this.isOk = this.data.isOk ? this.data.isOk : this.isOk;
      this.isCancel = this.data.isCancel ? this.data.isCancel : this.isCancel;
      this.cancelMsg = this.data.cancelMsg
        ? this.data.cancelMsg
        : this.cancelMsg;
      this.refresh = !!this.data.refresh;
    }

    if (this.close) {
      setTimeout(() => {
        this.dialogRef.close(true);
      }, this.timeout);
    }
  }

  done() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }

  refreshPage() {
    window.location.reload();
  }
}

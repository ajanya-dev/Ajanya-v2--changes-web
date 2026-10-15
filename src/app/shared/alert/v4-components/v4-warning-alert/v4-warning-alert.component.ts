import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IWarningAlert } from 'src/app/models/alert';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, TriangleAlert } from 'lucide-angular';

@Component({
  selector: 'app-v4-warning-alert',
  templateUrl: './v4-warning-alert.component.html',
  styleUrls: ['./v4-warning-alert.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [MatDialogActions, LucideAngularModule, CommonButtonV4Component]
})
export class V4WarningAlertComponent implements OnInit {
  title: string | boolean = 'Warning';
  content: string | SafeHtml = 'Please contact customer support.';
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 1000;
  isOk = true;
  isCancel = false;
  readonly TriangleAlertIcon = TriangleAlert;

  constructor(
    @Inject(MAT_DIALOG_DATA) public _data: IWarningAlert,
    public dialogRef: MatDialogRef<V4WarningAlertComponent>,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this._data) {
      this.title = this._data.title
        ? this._data.title
        : this._data.title == false
          ? (this.title = '')
          : this.title;
      this.content = this._data.content
        ? this._data.content
        : 'Please contact customer support.';
      this.doneMsg = this._data.doneMsg ? this._data.doneMsg : 'OK';
      this.cancelMsg = this._data.cancelMsg ? this._data.cancelMsg : 'Cancel';
      this.close = this._data.close ? this._data.close : false;
      this.timeout = this._data.timeout ? this._data.timeout : this.timeout;
      this.isOk = this._data.isOk == false ? false : true;
      this.isCancel = this._data.isCancel == true ? true : false;
      this.content = this.sanitizer.bypassSecurityTrustHtml(
        this.content as string
      );
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
}

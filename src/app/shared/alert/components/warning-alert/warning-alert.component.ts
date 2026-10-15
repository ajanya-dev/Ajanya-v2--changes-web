import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IWarningAlert } from 'src/app/models/alert';
import { NgIf } from '@angular/common';

/**
 * @description Component for warning alert dialog.
 */
@Component({
  selector: 'app-warning-alert',
  templateUrl: './warning-alert.component.html',
  styleUrls: ['./warning-alert.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgIf, MatDialogActions, MatDialogClose]
})
export class WarningAlertComponent implements OnInit {
  title: string | boolean = 'Error';
  content: string | SafeHtml = 'Please contact customer support.';
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 1000;
  isOk = true;
  isCancel = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public _data: IWarningAlert,
    public dialogRef: MatDialogRef<WarningAlertComponent>,
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

  /**
   * @description CLoses the dialog.
   */
  done() {
    this.dialogRef.close(true);
  }
}

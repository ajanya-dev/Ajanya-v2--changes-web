import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { IConfirmAlert } from 'src/app/models/alert';
import { NgIf } from '@angular/common';

/**
 * @description Component for confirmation alert dialog.
 */
@Component({
  selector: 'app-confirm-alert',
  templateUrl: './confirm-alert.component.html',
  styleUrls: ['./confirm-alert.component.scss'],
  standalone: true,
  imports: [NgIf, MatDialogActions, MatDialogClose]
})
export class ConfirmAlertComponent implements OnInit {
  title = 'Confirmation';
  content = "You won't be able to revert this!";
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 1000;
  isOk = true;
  isCancel = true;
  icon: IConfirmAlert['icon'] = 'confirm';
  isShowAsHtml = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: IConfirmAlert,
    public dialogRef: MatDialogRef<ConfirmAlertComponent>
  ) {}

  ngOnInit(): void {
    if (this._data) {
      this.title = this._data.title ? this._data.title : this.title;
      this.content = this._data.content ? this._data.content : this.content;
      this.doneMsg = this._data.doneMsg ? this._data.doneMsg : 'OK';
      this.cancelMsg = this._data.cancelMsg ? this._data.cancelMsg : 'Cancel';
      this.close = this._data.close ? this._data.close : false;
      this.timeout = this._data.timeout ? this._data.timeout : this.timeout;
      this.isOk = this._data.isOk == false ? false : true;
      this.isCancel = this._data.isCancel == false ? false : true;
      this.icon = this._data.icon ?? 'confirm';
      this.isShowAsHtml = this._data.isShowAsHtml ?? false;
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

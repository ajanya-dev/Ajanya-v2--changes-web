import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { ISuccessAlert } from 'src/app/models/alert';
import { NgIf } from '@angular/common';

/**
 * @description Component for success alert dialog.
 */
@Component({
  selector: 'app-success-alert',
  templateUrl: './success-alert.component.html',
  styleUrls: ['./success-alert.component.scss'],
  standalone: true,
  imports: [NgIf, MatDialogActions, MatDialogClose]
})
export class SuccessAlertComponent implements OnInit {
  title: string | boolean = 'Success!';
  content: string | null = 'Completed Successfully';
  close = false;
  timeout = 1000;
  doneMsg = 'OK';

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: ISuccessAlert,
    public dialogRef: MatDialogRef<SuccessAlertComponent>
  ) {}

  ngOnInit(): void {
    if (this._data) {
      this.title = this._data.title ? this._data.title : this.title;
      this.content = this._data.content ? this._data.content : null;
      this.doneMsg = this._data.doneMsg ? this._data.doneMsg : 'OK';
      this.close = this._data.close == false ? false : true;
      this.timeout = this._data.timeout ? this._data.timeout : this.timeout;
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

import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { ISuccessAlert } from 'src/app/models/alert';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, CircleCheckBig } from 'lucide-angular';

@Component({
  selector: 'app-v4-success-alert',
  templateUrl: './v4-success-alert.component.html',
  styleUrls: ['./v4-success-alert.component.scss'],
  standalone: true,
  imports: [MatDialogActions, LucideAngularModule, CommonButtonV4Component]
})
export class V4SuccessAlertComponent implements OnInit {
  title: string | boolean = 'Success!';
  content: string | null = 'Completed Successfully';
  close = false;
  timeout = 1000;
  doneMsg = 'OK';
  readonly CircleCheckBigIcon = CircleCheckBig;

  constructor(
    @Inject(MAT_DIALOG_DATA) private _data: ISuccessAlert,
    public dialogRef: MatDialogRef<V4SuccessAlertComponent>
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

  done() {
    this.dialogRef.close(true);
  }
}

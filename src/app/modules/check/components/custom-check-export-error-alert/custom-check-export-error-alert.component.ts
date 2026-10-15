import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { FailedAlertComponent } from 'src/app/shared/alert/components/failed-alert/failed-alert.component';
import { NgFor, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-custom-check-export-error-alert',
  templateUrl: './custom-check-export-error-alert.component.html',
  styleUrls: ['./custom-check-export-error-alert.component.scss'],
  standalone: true,
  imports: [NgFor, MatDialogClose, KeyValuePipe]
})
export class CustomCheckExportErrorAlertComponent {
  errorCheckList: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public _data: any,
    public dialogRef: MatDialogRef<FailedAlertComponent>
  ) {
    this.errorCheckList = _data;
  }
}

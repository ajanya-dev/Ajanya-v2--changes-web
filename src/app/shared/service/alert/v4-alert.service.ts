import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  IConfirmAlert,
  IFailedAlert,
  IInfoAlert,
  ISuccessAlert,
  IWarningAlert
} from 'src/app/models/alert';
import { V4ConfirmAlertComponent } from '../../alert/v4-components/v4-confirm-alert/v4-confirm-alert.component';
import { V4FailedAlertComponent } from '../../alert/v4-components/v4-failed-alert/v4-failed-alert.component';
import { V4SuccessAlertComponent } from '../../alert/v4-components/v4-success-alert/v4-success-alert.component';
import { V4InfoAlertComponent } from '../../alert/v4-components/v4-info-alert/v4-info-alert.component';
import { V4WarningAlertComponent } from '../../alert/v4-components/v4-warning-alert/v4-warning-alert.component';

@Injectable({
  providedIn: 'root'
})
export class V4AlertService {
  constructor(private dialog: MatDialog) {}

  //===> v4 confirmation alert
  confirmAlert(
    _data?: IConfirmAlert
  ): MatDialogRef<V4ConfirmAlertComponent, boolean> {
    const dialogRef = this.dialog.open(V4ConfirmAlertComponent, {
      maxWidth: _data?.width ?? '370px',
      minWidth: _data?.width ?? '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'v4_alert_wrapper'
    });
    return dialogRef;
  }

  //===> v4 failed alert
  failedAlert(
    _data?: IFailedAlert
  ): MatDialogRef<V4FailedAlertComponent, boolean> {
    const dialogRef = this.dialog.open(V4FailedAlertComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'v4_alert_wrapper'
    });
    return dialogRef;
  }

  //===> v4 success alert
  successAlert(
    _data?: ISuccessAlert
  ): MatDialogRef<V4SuccessAlertComponent, boolean> {
    const dialogRef = this.dialog.open(V4SuccessAlertComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'v4_alert_wrapper'
    });
    return dialogRef;
  }

  //===> v4 info alert
  infoAlert(
    _data?: IInfoAlert
  ): MatDialogRef<V4InfoAlertComponent, boolean | {inputValue: string}> {
    const dialogRef = this.dialog.open(V4InfoAlertComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'v4_alert_wrapper'
    });
    return dialogRef;
  }

  //===> v4 warning alert
  warningAlert(
    _data?: IWarningAlert, width = '370px'
  ): MatDialogRef<V4WarningAlertComponent, boolean> {
    const dialogRef = this.dialog.open(V4WarningAlertComponent, {
      maxWidth: width,
      minWidth: width,
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'v4_alert_wrapper'
    });
    return dialogRef;
  }
}

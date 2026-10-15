import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import {
  IAlertErrorMsgData,
  IConfirmAlert,
  IFailedAlert,
  IInfoAlert,
  ISuccessAlert,
  IWarningAlert
} from 'src/app/models/alert';
import { ConfirmAlertComponent } from '../../alert/components/confirm-alert/confirm-alert.component';
import { FailedAlertComponent } from '../../alert/components/failed-alert/failed-alert.component';
import { InfoAlertComponent } from '../../alert/components/info-alert/info-alert.component';
import { SuccessAlertComponent } from '../../alert/components/success-alert/success-alert.component';
import { WarningAlertComponent } from '../../alert/components/warning-alert/warning-alert.component';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  ROOT_URL = environment.rootUrl;

  constructor(
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  //===> confirmation alert
  confirmAlert(
    _data?: IConfirmAlert
  ): MatDialogRef<ConfirmAlertComponent, boolean> {
    const dialogRef = this.dialog.open(ConfirmAlertComponent, {
      maxWidth: _data?.width ?? '370px',
      minWidth: _data?.width ?? '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'ocw_alert_wrapper'
    });
    return dialogRef;
  }

  //===> info alert
  infoAlert(_data?: IInfoAlert): MatDialogRef<InfoAlertComponent, boolean | {inputValue: string}> {
    const dialogRef = this.dialog.open(InfoAlertComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'ocw_alert_wrapper'
    });
    return dialogRef;
  }

  //===> success alert
  successAlert(
    _data?: ISuccessAlert
  ): MatDialogRef<SuccessAlertComponent, boolean> {
    const dialogRef = this.dialog.open(SuccessAlertComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'ocw_alert_wrapper'
    });
    return dialogRef;
  }

  //===> failed alert
  failedAlert(
    _data?: IFailedAlert
  ): MatDialogRef<FailedAlertComponent, boolean> {
    const dialogRef = this.dialog.open(FailedAlertComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'ocw_alert_wrapper'
    });
    return dialogRef;
  }

  //===> warning alert
  warningAlert(
    _data?: IWarningAlert,width = '370px'
  ): MatDialogRef<WarningAlertComponent, boolean> {
    const dialogRef = this.dialog.open(WarningAlertComponent, {
      maxWidth: width,
      minWidth: width,
      width: '95%',
      disableClose: true,
      data: _data,
      panelClass: 'ocw_alert_wrapper'
    });
    return dialogRef;
  }

  getErrorMsgData(id: string) {
    return this.http.get<IAlertErrorMsgData>(
      `${this.ROOT_URL}/error-msg-data/${id}`
    );
  }
}

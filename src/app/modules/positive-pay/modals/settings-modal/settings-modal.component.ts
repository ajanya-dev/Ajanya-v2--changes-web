import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { IExportModalData } from '../../model/postive-pay';
import { atLeastOneRequired } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    FaIconComponent,
    V35ControlMessageComponent
  ]
})
export class SettingsModalComponent implements OnInit, OnDestroy {
  private positivePayService = inject(PositivePayService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<SettingsModalComponent>);
  public data: IExportModalData = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  btnDesable = false;
  faXmark = faXmark;

  settingsForm = new FormGroup(
    {
      bankId: new FormControl(''),
      folderPath: new FormControl(''),
      fileName: new FormControl(''),
      routingNumber: new FormControl(this.data.bank_routing_number)
    },
    { validators: atLeastOneRequired(['bankId', 'folderPath', 'fileName']) }
  );

  ngOnInit(): void {
    this.getMetaData();
  }

  getMetaData() {
    this.subscriptions.push(
      this.positivePayService
        .getSettingsMeataData(this.data.bank_routing_number)
        .subscribe((res) => {
          if (res.success) {
            this.settingsForm.patchValue({
              bankId: res.data.bankId,
              routingNumber: res.data.routingNumber,
              fileName: res.data.fileName,
              folderPath: res.data.folderPath
            });
          }
        })
    );
  }

  submit() {
    this.settingsForm.markAllAsTouched();

    if (this.settingsForm.invalid) {
      if (this.settingsForm.get('bankId')?.hasError('atLeastOneRequired')) {
        this.alertService.failedAlert({
          content:
            'Enter at least one of Bank Id, Upload folder path or File name'
        });
      }
      return;
    }

    this.btnDesable = true;
    this.subscriptions.push(
      this.positivePayService
        .saveSettings(this.settingsForm.value)
        .pipe(
          finalize(() => {
            this.btnDesable = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close();

            this.alertService.successAlert({
              content: res.message,
              close: true,
              timeout: 1500
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

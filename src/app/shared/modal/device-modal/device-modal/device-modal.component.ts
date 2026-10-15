import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { Subscription } from 'rxjs';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Modal component for devices.
 */
@Component({
  selector: 'app-device-modal',
  templateUrl: './device-modal.component.html',
  styleUrls: ['./device-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class DeviceModalComponent implements OnInit, OnDestroy {
  deviceForm: UntypedFormGroup;
  deviceData: { deviceAddress: string; deviceName: string };
  subscriptions: Subscription[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { deviceAddress: string },
    private __dialogRef: MatDialogRef<DeviceModalComponent>,
    private fb: UntypedFormBuilder,
    private _sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.initFormGroup();
    this.loadDeviceData();
  }

  /**
   * @description Initializes device form.
   */
  initFormGroup() {
    this.deviceForm = this.fb.group({
      deviceName: ['', Validators.required]
    });
  }

  /**
   * @description Loads device data from `sharedService` and sets it to `this.deviceData`.
   * Updates the form with the data.
   */
  loadDeviceData() {
    this.subscriptions.push(
      this._sharedService
        .getDeviceData(this.data.deviceAddress)
        .subscribe((res) => {
          if (res.success == true) {
            this.deviceData = res.data;
            this.deviceForm.patchValue({
              deviceName: this.deviceData.deviceName
            });
          }
        })
    );
  }

  /**
   * @description Method to create device object for posting.
   * @returns device object.
   */
  deviceBody() {
    return {
      deviceAddress: this.deviceData.deviceAddress,
      deviceName: this.deviceForm.value.deviceName
    };
  }

  /**
   * @description Sends the device object returned by `this.deviceBody` method to the `postDeviceData` method of `sharedService`.
   * @returns
   */
  onSubmit() {
    this.deviceForm.markAllAsTouched();

    if (this.deviceForm.invalid) return;

    this.subscriptions.push(
      this._sharedService.postDeviceData(this.deviceBody()).subscribe((res) => {
        if (res.success == true) this.__dialogRef.close({ success: true });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

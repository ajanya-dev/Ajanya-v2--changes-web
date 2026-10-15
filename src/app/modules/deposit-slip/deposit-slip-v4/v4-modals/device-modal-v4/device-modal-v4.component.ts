import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { finalize } from 'rxjs';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

@Component({
  selector: 'app-device-modal-v4',
  templateUrl: './device-modal-v4.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    MatDialogClose
  ]
})
export class DeviceModalV4Component implements OnInit {
  private data: { deviceAddress: string } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<DeviceModalV4Component>);
  private fb = inject(FormBuilder);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;

  deviceForm!: FormGroup;
  deviceAddress = '';
  loading = signal(true);
  submitting = signal(false);

  ngOnInit(): void {
    this.deviceForm = this.fb.group({
      deviceName: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]+$')]
      ]
    });
    this.loadDeviceData();
  }

  loadDeviceData(): void {
    this.loading.set(true);
    this.sharedService
      .getDeviceData(this.data.deviceAddress)
      .pipe(takeUntilDestroyed(this.destroyRef),finalize(() => this.loading.set(false)))
      .subscribe((res) => {
        if (res.success === true) {
          this.deviceAddress = res.data.deviceAddress;
          this.deviceForm.patchValue({ deviceName: res.data.deviceName });
        }
      });
  }

  onSubmit(): void {
    this.deviceForm.markAllAsTouched();
    if (this.deviceForm.invalid) return;

    this.submitting.set(true);
    const body = {
      deviceAddress: this.deviceAddress,
      deviceName: this.deviceForm.value.deviceName
    };

    this.sharedService
      .postDeviceData(body)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.submitting.set(false)))
      .subscribe((res) => {
        if (res.success === true) {
          this.dialogRef.close({ success: true });
        }
      });
  }
}

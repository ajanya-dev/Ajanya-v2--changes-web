import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { IExportModalData } from '../../../positive-pay/model/postive-pay';
import { atLeastOneRequired } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-v4-settings-modal',
  templateUrl: './v4-settings-modal.component.html',
  styleUrls: ['./v4-settings-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4SettingsModalComponent implements OnInit {
  private positivePayService = inject(PositivePayService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<V4SettingsModalComponent>);
  private destroyRef = inject(DestroyRef);
  public data: IExportModalData = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  isSubmitting = signal(false);

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
    this.positivePayService
      .getSettingsMeataData(this.data.bank_routing_number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.settingsForm.patchValue({
            bankId: res.data.bankId,
            routingNumber: res.data.routingNumber,
            fileName: res.data.fileName,
            folderPath: res.data.folderPath
          });
        }
      });
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

    this.isSubmitting.set(true);
    this.positivePayService
      .saveSettings(this.settingsForm.value)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close();
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
        }
      });
  }
}

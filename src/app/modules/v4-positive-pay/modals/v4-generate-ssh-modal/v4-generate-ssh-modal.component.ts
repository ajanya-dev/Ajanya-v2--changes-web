import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';

import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';

@Component({
  selector: 'app-v4-generate-ssh-modal',
  templateUrl: './v4-generate-ssh-modal.component.html',
  styleUrls: ['./v4-generate-ssh-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4CommonDropDownSelectorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4GenerateSshModalComponent {
  private positivePayService = inject(PositivePayService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<V4GenerateSshModalComponent>);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  showTextArea = signal(false);
  isSubmitting = signal(false);

  readonly sshTypeOptions = [
    { label: 'Create New', value: '1' },
    { label: 'Create From Existing', value: '2' }
  ];

  readonly rsaSizeOptions = ['1024', '2048', '4096'];

  sshForm = new FormGroup({
    fileName: new FormControl('', [Validators.required]),
    sshType: new FormControl('', [Validators.required]),
    privateKey: new FormControl(''),
    rsaSize: new FormControl('1024')
  });

  constructor() {
    this.sshForm.controls.sshType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.onChange(val ?? ''));
  }

  formBody() {
    const data = this.sshForm.value;
    return {
      nickName: data.fileName,
      sshType: data.sshType,
      privateKey: data.privateKey,
      rsaSize: data.rsaSize
    };
  }

  onChange(authType: string) {
    this.showTextArea.set(false);
    if (authType === '2') {
      this.showTextArea.set(true);
      this.sshForm.controls.privateKey.setValidators(Validators.required);
      this.sshForm.controls.privateKey.updateValueAndValidity();
    } else {
      this.sshForm.controls.privateKey.clearValidators();
      this.sshForm.controls.privateKey.updateValueAndValidity();
    }
  }

  submit() {
    this.sshForm.markAllAsTouched();
    if (this.sshForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    this.positivePayService
      .generateSsh(this.formBody())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const link = document.createElement('a');
          link.setAttribute('href', res.url);
          link.click();
          this.alertService.successAlert({
            content: 'SSH File Generated Successfully',
            close: true
          });
          this.dialogRef.close({
            success: true,
            name: this.sshForm.value.fileName
          });
        }
      });
  }
}

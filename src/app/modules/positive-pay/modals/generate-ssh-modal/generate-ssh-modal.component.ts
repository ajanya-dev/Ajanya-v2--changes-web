import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

@Component({
  selector: 'app-generate-ssh-modal',
  templateUrl: './generate-ssh-modal.component.html',
  styleUrls: ['./generate-ssh-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    CommonInputFieldComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateSshModalComponent implements OnDestroy {
  private positivePayService = inject(PositivePayService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<GenerateSshModalComponent>);

  subscriptions: Subscription[] = [];
  showTextArea = signal(false);
  isSubmit = signal(false);
  faXmark = faXmark;
  sshForm = new FormGroup({
    fileName: new FormControl('', [Validators.required]),
    sshType: new FormControl('', [Validators.required]),
    privateKey: new FormControl(''),
    rsaSize: new FormControl('1024')
  });

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

    this.isSubmit.set(true);
    const processedData = this.formBody();

    this.subscriptions.push(
      this.positivePayService
        .generateSsh(processedData)
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const link = document.createElement('a');
            link.setAttribute('href', res.url);
            link.click();
            const data = {
              content: 'SSH File Generated Successfully',
              close: true,
              timeout: 1500
            };
            this.alertService.successAlert(data);
            this.dialogRef.close({
              success: true,
              name: this.sshForm.value.fileName
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { finalize, take } from 'rxjs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-dayforce-connection-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FontAwesomeModule,
    MatDialogModule,
    NgOptimizedImage,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './dayforce-connection-modal.component.html',
  styleUrl: './dayforce-connection-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayforceConnectionModalComponent {
  private fb = inject(FormBuilder);
  private integrationService = inject(IntegrationService);
  private dialogRef = inject(MatDialogRef);
  private alertService = inject(AlertService);

  isSubmitting = signal(false);

  dayforceForm = this.fb.group({
    clientNamespace: ['', [Validators.required]],
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  faXmark = faXmark;
  faCircleInfo = faCircleInfo;

  onSubmit(): void {
    this.dayforceForm.markAllAsTouched();
    if (this.dayforceForm.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.dayforceForm.value;
    const payload = {
      clientNamespace: formValue.clientNamespace as string,
      username: formValue.username as string,
      password: formValue.password as string
    };

    this.integrationService
      .connectToDayforce(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(true);
          this.alertService.successAlert({
            content: 'Successfully Connected.'
          });
        }
      });
  }
}

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  selector: 'app-ach-email-modal-v4',
  templateUrl: './ach-email-modal-v4.component.html',
  styleUrls: ['./ach-email-modal-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchEmailModalV4Component implements OnInit {
  readonly XIcon = X;

  private dialogRef = inject(MatDialogRef<AchEmailModalV4Component>);
  private achService = inject(AchService);
  private alertService = inject(V4AlertService);
  private formId: string = inject(MAT_DIALOG_DATA);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);

  emailForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      ValidationService.emailValidator
    ])
  });

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {}

  submit(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;

    this.loading.set(true);
    const processedData = {
      email: this.emailForm.controls.email.value ?? '',
      id: this.formId
    };

    this.achService
      .emailAchForm(processedData)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({ content: 'Successfully sent' });
            this.dialogRef.close(true);
          }
        },
        error: (err) => {
          this.alertService.warningAlert({
            content: err.error?.errorMsg ?? 'Failed to send email'
          });
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LucideAngularModule, X } from 'lucide-angular';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  selector: 'app-export-to-email-v4',
  templateUrl: './export-to-email-v4.component.html',
  styleUrls: ['./export-to-email-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportToEmailV4Component {
  readonly XIcon = X;

  private dialogRef = inject(MatDialogRef<ExportToEmailV4Component>);
  private localStorage = inject(LocalStorageService);
  private router = inject(Router);

  // Payroll exports must go to the account email; other tables allow any address.
  private readonly isPayrollFlow = this.router.url.includes('payroll');

  emailForm = new FormGroup({
    emailId: new FormControl(
      {
        value: String(this.localStorage.getItem('email') ?? ''),
        disabled: this.isPayrollFlow
      },
      [Validators.required, ValidationService.emailValidator]
    ),
    subject: new FormControl('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    message: new FormControl('', [Validators.maxLength(50)])
  });

  sendEmail(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;

    this.dialogRef.close({
      send: true,
      emailId: this.emailForm.controls.emailId.value ?? '',
      subject: this.emailForm.controls.subject.value ?? '',
      message: this.emailForm.controls.message.value ?? ''
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-export-to-email',
  templateUrl: './v4-export-to-email.component.html',
  styleUrls: ['./v4-export-to-email.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonInputFieldV4Component,
    CommonButtonV4Component
  ]
})
export class ExportToEmailV4Component {
  readonly XIcon = X;
  private dialogRef = inject(MatDialogRef<ExportToEmailV4Component>);

  isSubmitting = signal(false);

  emailForm = new FormGroup({
    emailId: new FormControl('', [
      Validators.required,
      ValidationService.emailValidator
    ]),
    subject: new FormControl('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    message: new FormControl('', [Validators.maxLength(50)])
  });

  sendEmail(): void {
    if (this.emailForm.valid) {
      const data = { ...this.emailForm.value, send: true };
      this.dialogRef.close(data);
    } else {
      this.emailForm.markAllAsTouched();
    }
  }
}

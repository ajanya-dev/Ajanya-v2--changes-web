import { Component } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-enter-email-modal',
  templateUrl: './enter-email-modal.component.html',
  styleUrls: ['./enter-email-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions
  ]
})
export class EnterEmailModalComponent {
  email = new UntypedFormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  constructor(private _dialogRef: MatDialogRef<EnterEmailModalComponent>) {}

  closeModal() {
    if (this.email.invalid) {
      return;
    }

    this._dialogRef.close({ email: this.email.value });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { finalize, take } from 'rxjs';
import { PayeeService } from '../../../service/payee/payee.service';

@Component({
  selector: 'app-add-email-payee-modal-v4',
  standalone: true,
  imports: [
    CommonButtonV4Component,
    MatDialogClose,
    CommonInputFieldV4Component,
    LucideAngularModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-email-payee-modal-v4.component.html',
  styleUrl: './add-email-payee-modal-v4.component.scss'
})
export class AddEmailPayeeModalV4Component {
  public data: IViewPayee = inject(MAT_DIALOG_DATA);
  private PayeeService = inject(PayeeService);
  private dialogRef = inject(MatDialogRef<AddEmailPayeeModalV4Component>);

  emailControl = new FormControl('', [
    ValidationService.emailValidator,
    Validators.required
  ]);

  readonly XIcon = X;
  isSubmitting = signal(false);

  saveEmailToPayee(): void {
    this.emailControl.markAllAsTouched();
    if (this.emailControl.invalid) {
      return;
    }
    this.isSubmitting.set(true);
    this.PayeeService.addPayeetoEmail(this.data.id, {
      email: this.emailControl.value
    })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        take(1)
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(this.emailControl.value);
        }
      });
  }
}

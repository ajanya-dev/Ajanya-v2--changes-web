import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-export-to-email',
  templateUrl: './export-to-email.component.html',
  styleUrls: ['./export-to-email.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions
  ]
})
export class ExportToEmailComponent implements OnInit {
  emailForm: UntypedFormGroup;

  constructor(
    private dialogRef: MatDialogRef<ExportToEmailComponent>,
    private fb: UntypedFormBuilder,
    private localStorage: LocalStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      emailId: [
        {
          value: this.localStorage.getItem('email') ?? '',
          // Payroll exports must go to the account email; other tables allow any address.
          disabled: this.router.url.includes('payroll')
        },
        [Validators.required, ValidationService.emailValidator]
      ],
      subject: [null, [Validators.required, Validators.maxLength(50)]],
      message: [null, Validators.maxLength(50)]
    });
  }

  sendEmail() {
    if (this.emailForm.valid) {
      const data = this.emailForm.getRawValue();
      data.send = true;
      this.closeDialog(data);
    }
  }

  closeDialog(data: Record<string, unknown>) {
    this.dialogRef.close(data);
  }
}

import { Component, inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { IInfoAlert } from 'src/app/models/alert';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { LucideAngularModule, Info } from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  selector: 'app-v4-info-alert',
  templateUrl: './v4-info-alert.component.html',
  styleUrls: ['./v4-info-alert.component.scss'],
  standalone: true,
  imports: [
    MatDialogActions,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ]
})
export class V4InfoAlertComponent implements OnInit {
  title: string | boolean = 'Info';
  content: SafeHtml | string = "You won't be able to revert this!";
  doneMsg = 'OK';
  cancelMsg = 'Cancel';
  close = false;
  timeout = 1000;
  isOk = true;
  isCancel = false;
  isInputRequired = false;
  inputPlaceholder = '';
  inputType: 'text' | 'email' | 'number' = 'email';
  inputValue = new FormControl('');
  isSubmitted = false;
  readonly InfoIcon = Info;

  private readonly data = inject<IInfoAlert>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<V4InfoAlertComponent>);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    if (this.data) {
      if (this.data.title) {
        this.title = this.data.title;
      } else if (this.data.title === false) {
        this.title = '';
      }
      this.content = this.data.content
        ? this.sanitizer.bypassSecurityTrustHtml(this.data.content)
        : ' ';
      this.doneMsg = this.data.doneMsg ? this.data.doneMsg : 'OK';
      this.cancelMsg = this.data.cancelMsg ? this.data.cancelMsg : 'Cancel';
      this.close = this.data.close ? this.data.close : false;
      this.timeout = this.data.timeout ? this.data.timeout : this.timeout;
      this.isCancel = this.data.isCancel ? this.data.isCancel : this.isCancel;
      this.isOk = this.data.isOk ? this.data.isOk : this.isOk;
      this.isInputRequired = this.data.isInputRequired
        ? this.data.isInputRequired
        : this.isInputRequired;
      this.inputPlaceholder = this.data.inputPlaceholder
        ? this.data.inputPlaceholder
        : 'Enter email address';
      this.inputType = this.data.inputType ?? 'email';
    }

    if (this.isInputRequired) {
      const validators = [Validators.required];
      if (this.inputType === 'email') {
        validators.push(ValidationService.emailValidator);
      } else if (this.inputType === 'number') {
        validators.push(Validators.pattern(/^\d+$/));
      }
      this.inputValue.setValidators(validators);
      this.inputValue.updateValueAndValidity();
    }

    if (this.close) {
      setTimeout(() => {
        this.dialogRef.close(true);
      }, this.timeout);
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }

  done() {
    if (this.isInputRequired) {
      this.isSubmitted = true;
      this.inputValue.markAsTouched();
      if (this.inputValue.valid) {
        this.dialogRef.close({ inputValue: this.inputValue.value });
      }
    } else {
      this.dialogRef.close(true);
    }
  }
}

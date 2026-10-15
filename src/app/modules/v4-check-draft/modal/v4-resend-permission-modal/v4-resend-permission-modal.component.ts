import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { ICheckDraftTableRow } from '../../model/v4-Checkdraft';

interface IResendPermissionForm {
  email: FormControl<string>;
  sms: FormControl<string>;
}

@Component({
  selector: 'app-v4-resend-permission-modal',
  templateUrl: './v4-resend-permission-modal.component.html',
  styleUrls: ['./v4-resend-permission-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component
  ]
})
export class V4ResendPermissionModalComponent implements OnInit {
  private headerService = inject(HeaderService);
  private fb = inject(NonNullableFormBuilder);
  private checkDraftService = inject(CheckDraftService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<V4ResendPermissionModalComponent>);
  private destroyRef = inject(DestroyRef);
  public data: ICheckDraftTableRow = inject(MAT_DIALOG_DATA);

  resendPermissionForm: FormGroup<IResendPermissionForm>;
  btnDisable = signal(false);

  ngOnInit(): void {
    this.initFormGroup();
    if (this.data) {
      this.setData(this.data);
    }
  }

  setData(data: ICheckDraftTableRow) {
    this.resendPermissionForm.patchValue({
      email: data.payee_email,
      sms: data.payee_phone
    });
  }

  initFormGroup(): void {
    this.resendPermissionForm = this.fb.group({
      email: ['', [Validators.required, ValidationService.emailValidator]],
      sms: ['', [Validators.required, ValidationService.phoneNumberValidator]]
    });
  }

  resendCheckDraftPermission() {
    if (this.resendPermissionForm.invalid) {
      this.resendPermissionForm.markAllAsTouched();
      return;
    }
    this.btnDisable.set(true);
    this.resendPermission();
  }

  private resendPermission() {
    this.checkDraftService
      .resendPermission(
        this.data.action,
        this.resendPermissionForm.getRawValue()
      )
      .pipe(
        finalize(() => this.btnDisable.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Permission resent',
            close: true
          });
          this.headerService.setHeaderValueChanged(true);
          this.dialogRef.close(true);
        }
      });
  }
}

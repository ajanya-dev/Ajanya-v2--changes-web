import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { DOUBLE_SIDE_MODAL_REF } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';

@Component({
  selector: 'app-request-access-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './request-access-modal-v4.component.html',
  styleUrls: ['./request-access-modal-v4.component.scss']
})
export class RequestAccessModalV4Component {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);

  requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, ValidationService.emailValidator]],
    confirmEmail: ['', [Validators.required]],
    name: ['', [Validators.required]],
    nickName: ['', [Validators.required]],
    companyName: ['', [Validators.required]]
  });

  loading = signal(false);
  private sessionKey = '';

  submit(): void {
    this.requestForm.markAllAsTouched();

    if (
      this.requestForm.invalid ||
      this.requestForm.value.email !== this.requestForm.value.confirmEmail
    ) {
      if (
        this.requestForm.valid &&
        this.requestForm.value.email !== this.requestForm.value.confirmEmail
      ) {
        this.alertService.warningAlert({ content: 'Emails do not match.' });
      }
      return;
    }

    const values = this.requestForm.getRawValue();
    const formData = new FormData();
    formData.append('email', values.email);
    formData.append('username', values.name);
    formData.append('name', values.name);
    formData.append('nickName', values.nickName);
    formData.append('companyName', values.companyName);
    formData.append('clientType', '3');
    if (this.sessionKey) {
      formData.append('session_key', this.sessionKey);
    }

    this.loading.set(true);

    this.userService
      .addUsers(formData)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Invitation sent.',
              close: true,
              timeout: 2000
            });
            this.modalRef.close({ success: true });
          }
        },
        error: (err) => {
          if (err.error?.errorCode === '112') {
            this.sessionKey = err.error.session_key;
            const otpDialog = this.dialog.open(OtpModalV4Component, {
              maxWidth: '410px',
              width: '100%',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            otpDialog
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((result) => {
                if (result) {
                  this.submit();
                }
              });
          }
        }
      });
  }

  close(): void {
    this.modalRef.close();
  }
}

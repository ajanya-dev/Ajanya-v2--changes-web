import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, X } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { UserService } from 'src/app/shared/service/user/user.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-text-us-v4',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    PhoneInputV4Component
  ],
  templateUrl: './text-us-v4.component.html',
  styleUrls: ['./text-us-v4.component.scss']
})
export class TextUsV4Component implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TextUsV4Component>);
  private userService = inject(UserService);
  private userProfileService = inject(UserProfileService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly closeIcon = X;

  isSending = signal(false);
  isPhoneNotVerified = false;

  textUsForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, ValidationService.phoneMinLength]]
  });

  ngOnInit(): void {
    this.prefillPhone();
    this.checkPhoneVerification();
  }

  private prefillPhone(): void {
    this.userProfileService
      .getPersonalInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.data?.phone) {
          this.textUsForm.patchValue({ phone: res.data.phone });
        }
      });
  }

  private checkPhoneVerification(): void {
    this.userProfileService.UserVerification$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.phone_verified === 0) {
          this.isPhoneNotVerified = true;
        }
      });
  }

  onSubmit(): void {
    if (this.textUsForm.invalid) {
      this.textUsForm.markAllAsTouched();
      return;
    }

    if (this.isPhoneNotVerified) {
      this.verifyPhone();
      return;
    }

    this.isSending.set(true);
    this.userService
      .textUs({ phone: this.textUsForm.controls['phone'].value })
      .pipe(
        finalize(() => this.isSending.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close(true);
            this.v4AlertService.successAlert({
              content: 'Message Sent Successfully'
            });
          }
        }
      });
  }

  private verifyPhone(): void {
    const ref = this.v4AlertService.warningAlert({
      content: 'Please verify your Phone Number',
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (response) {
          this.dialogRef.close();
          this.router.navigateByUrl('/v4/manage/users/verify-email-phone');
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

import { Component, OnDestroy, inject, signal } from '@angular/core';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { LucideAngularModule, X, CircleAlert } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  selector: 'app-v4-user-whitelist-ip',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-user-whitelist-ip.component.html'
})
export class V4UserWhitelistIpComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<V4UserWhitelistIpComponent>);
  private alertService = inject(V4AlertService);
  private userProfileService = inject(UserProfileService);

  readonly XIcon = X;
  readonly CircleAlertIcon = CircleAlert;

  subscriptions: Subscription[] = [];
  isSubmitting = signal(false);

  ipAddressForm = new FormGroup({
    ipAddress: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/)
    ]),
    nickname: new FormControl('', [Validators.required])
  });

  onSubmit() {
    this.ipAddressForm.markAllAsTouched();
    if (this.ipAddressForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const data = {
      ip: this.ipAddressForm.get('ipAddress')?.value || '',
      nickname: this.ipAddressForm.get('nickname')?.value || ''
    };

    this.subscriptions.push(
      this.userProfileService
        .addIpWhitelist(data)
        .pipe(finalize(() => this.isSubmitting.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'IP Address Added.',
              close: true
            });
            this.ipAddressForm.reset();
            this.dialogRef.close(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}

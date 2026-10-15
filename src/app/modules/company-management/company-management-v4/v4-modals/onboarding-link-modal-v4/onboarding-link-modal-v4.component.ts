import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  IOnboardingLink,
  IOnboardingLinkPayload
} from '../../../model/company-managment';

export interface IOnboardingLinkModalData {
  customerRef: string;
  companyName: string;
}

@Component({
  selector: 'app-onboarding-link-modal-v4',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './onboarding-link-modal-v4.component.html',
  styleUrls: ['./onboarding-link-modal-v4.component.scss']
})
export class OnboardingLinkModalV4Component {
  private destroyRef = inject(DestroyRef);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private alertService = inject(V4AlertService);
  private clipboard = inject(Clipboard);
  private dialogRef = inject(MatDialogRef<OnboardingLinkModalV4Component>);
  readonly data = inject<IOnboardingLinkModalData>(MAT_DIALOG_DATA);

  email = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      ValidationService.emailValidator,
      Validators.maxLength(191)
    ]
  });

  generating = signal(false);
  sending = signal(false);
  link = signal<IOnboardingLink | null>(null);

  generateLink(): void {
    this.generating.set(true);
    this.request({ customerRef: this.data.customerRef }, () =>
      this.generating.set(false)
    );
  }

  sendLink(): void {
    this.email.markAsTouched();
    if (this.email.invalid) return;

    this.sending.set(true);
    this.request(
      {
        customerRef: this.data.customerRef,
        sendEmail: true,
        email: this.email.value
      },
      () => this.sending.set(false)
    );
  }

  copyLink(): void {
    const url = this.link()?.onboardingUrl;
    if (!url) return;
    this.clipboard.copy(url);
    this.alertService.successAlert({
      content: 'Onboarding link copied.',
      close: true,
      timeout: 2000
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  private request(payload: IOnboardingLinkPayload, done: () => void): void {
    this.companySwitchRepo
      .generateOnboardingLink(payload)
      .pipe(finalize(done), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res.success) {
          this.alertService.warningAlert({
            content: res.errorMsg || 'Unable to generate the onboarding link.'
          });
          return;
        }

        this.link.set(res.data);

        if (!payload.sendEmail) return;

        if (res.data.emailSent) {
          this.alertService.successAlert({
            content: `Onboarding link sent to ${res.data.sentTo}.`,
            close: true,
            timeout: 2000
          });
          this.email.reset();
        } else {
          this.alertService.warningAlert({
            content:
              res.data.emailError ||
              'The link was generated but the email could not be sent.'
          });
        }
      });
  }
}

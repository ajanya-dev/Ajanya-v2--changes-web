import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCopy,
  faPaperPlane,
  faRotate,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { finalize } from 'rxjs/operators';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import {
  IOnboardingLink,
  IOnboardingLinkPayload
} from '../../model/company-managment';

export interface IOnboardingLinkModalData {
  customerRef: string;
  companyName: string;
}

/**
 * @description Modal for generating or emailing an enterprise onboarding link for a company
 */
@Component({
  selector: 'app-onboarding-link-modal',
  templateUrl: './onboarding-link-modal.component.html',
  styleUrls: ['./onboarding-link-modal.component.scss'],
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent
  ]
})
export class OnboardingLinkModalComponent {
  data = inject<IOnboardingLinkModalData>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private alertService = inject(AlertService);
  private clipboard = inject(Clipboard);

  email = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      ValidationService.emailValidator,
      Validators.maxLength(191)
    ]
  });

  readonly icons = { faCopy, faPaperPlane, faRotate, faXmark };
  loading = { generating: false, sending: false };
  link: IOnboardingLink | null = null;

  /**
   * @description Generates an onboarding link without sending an email
   */
  generateLink() {
    this.loading.generating = true;
    this.request({ customerRef: this.data.customerRef }, () => {
      this.loading.generating = false;
    });
  }

  /**
   * @description Generates an onboarding link and emails it to the entered address
   */
  sendLink() {
    this.email.markAsTouched();
    if (this.email.invalid) return;

    this.loading.sending = true;
    this.request(
      {
        customerRef: this.data.customerRef,
        sendEmail: true,
        email: this.email.value
      },
      () => {
        this.loading.sending = false;
      }
    );
  }

  /**
   * @description Copies the generated onboarding link to the clipboard
   */
  copyLink() {
    if (!this.link?.onboardingUrl) return;
    this.clipboard.copy(this.link.onboardingUrl);
    this.alertService.successAlert({ content: 'Onboarding link copied.' });
  }

  private request(payload: IOnboardingLinkPayload, done: () => void) {
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

        this.link = res.data;

        if (!payload.sendEmail) return;

        if (res.data.emailSent) {
          this.alertService.successAlert({
            content: `Onboarding link sent to ${res.data.sentTo}.`
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

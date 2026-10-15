import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import {
  faArrowLeft,
  faCopy,
  faEnvelope,
  faMobile
} from '@fortawesome/pro-solid-svg-icons';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-send-tracking',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatDialogClose,
    MatDialogModule,
    ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    NewPhoneInputComponent,
    NgClass
  ],
  templateUrl: './send-tracking.component.html',
  styleUrl: './send-tracking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SendTrackingComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<SendTrackingComponent>);
  private checkService = inject(CheckService);
  public alertService = inject(AlertService);
  private clipBoard = inject(Clipboard);
  public injectData: {
    mode: 'check' | 'invoice' | 'mail-doc';
    id: string;
    trackingUrl: string;
    payee: { payeeEmail: string; payeePhone: string };
  } = inject(MAT_DIALOG_DATA);

  proofType: string = '';
  isCountryDropdownOpened: boolean = false;
  subscriptions: Subscription[] = [];
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);

  /**
   * icons
   */
  faXmark = faXmark;
  faEnvelope = faEnvelope;
  faMobile = faMobile;
  faArrowLeft = faArrowLeft;
  faCopy = faCopy;

  /**
   * proof sending types
   */
  proofsList = [
    {
      icon: faEnvelope,
      name: 'Email',
      action: 'email'
    },
    {
      icon: faMobile,
      name: 'SMS',
      action: 'sms'
    },
    {
      icon: faCopy,
      name: 'Copy Link',
      action: 'copy'
    }
  ];

  /**
   *email formControl
   */
  sendEmail = new FormControl(this.injectData.payee.payeeEmail, [
    Validators.required,
    ValidationService.emailValidator
  ]);

  /**
   *phone formControl
   */
  sendPhoneNumber = new FormControl(this.injectData.payee.payeePhone, [
    Validators.required,
    Validators.minLength(10)
  ]);

  /**
   * method for for managing send proof action
   */
  sendProof(action: string) {
    switch (action) {
      case 'email':
        this.emailProof();
        break;
      case 'sms':
        this.smsProof();
        break;
      case 'copy':
        this.copyProof();
        break;
      default:
        break;
    }
  }

  /**
   * Methods for Email payment Proof
   */
  emailProof() {
    if (this.proofType === '') {
      this.proofType = 'Email';
      return;
    }

    if (this.sendEmail.invalid) {
      this.sendEmail.markAllAsTouched();
      return;
    }

    if (!this.injectData?.id) return;

    const payload = this.createPayload('email');
    const endpoint =
      this.injectData.mode === 'check' ? 'cheque-tracking' : 'invoices';

    this.isEmailProofLoading.set(true);
    this.subscriptions.push(
      this.checkService
        .sentTrackingUrl(endpoint, payload)
        .pipe(
          finalize(() => {
            this.isEmailProofLoading.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              const data = {
                content: 'Email send Successfully',
                close: true,
                timeout: 1500
              };
              this.alertService.successAlert(data);
              this.close();
            }
          }
        })
    );
  }

  /**
   * Methods for SMS payment Proof
   */
  smsProof() {
    if (this.proofType === '') {
      this.proofType = 'SMS';
      return;
    }

    if (this.sendPhoneNumber.invalid) {
      this.sendPhoneNumber.markAllAsTouched();
      return;
    }

    if (!this.injectData?.id) return;

    const payload = this.createPayload('sms');
    const endpoint =
      this.injectData.mode === 'check' ? 'cheque-tracking' : 'invoices';

    this.isSMSProofLoading.set(true);
    this.subscriptions.push(
      this.checkService
        .sentTrackingUrl(endpoint, payload)
        .pipe(
          finalize(() => {
            this.isSMSProofLoading.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              const data = {
                content: 'SMS send Successfully',
                close: true,
                timeout: 1500
              };
              this.alertService.successAlert(data);
              this.close();
            }
          }
        })
    );
  }

  copyProof() {
    this.proofType = '';
    this.clipBoard.copy(this.injectData.trackingUrl);
    const data = {
      content: 'Link Copied Successfully.',
      close: true,
      timeout: 1500
    };
    this.alertService.successAlert(data);
    this.close();
  }

  private createPayload(mode: 'email' | 'sms') {
    const contactKey = mode === 'sms' ? 'phone' : 'email';
    const contactValue =
      mode === 'sms' ? this.sendPhoneNumber.value : this.sendEmail.value;

    const basePayload = {
      id: this.injectData.id,
      type: mode,
      [contactKey]: contactValue as string
    };

    return this.injectData.mode === 'check'
      ? basePayload
      : { ...basePayload, is_invoice: this.injectData.mode === 'invoice' };
  }

  /**
   * handles backbutton event
   */
  back() {
    this.isCountryDropdownOpened = false;
    this.proofType = '';
  }

  /**
   * handles county dropdown event event
   */
  countryChange(event: { isOpen: boolean }) {
    if (event.isOpen === true) {
      this.isCountryDropdownOpened = true;
    } else {
      this.isCountryDropdownOpened = false;
    }
  }

  /**
   * handles modal close action
   */
  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

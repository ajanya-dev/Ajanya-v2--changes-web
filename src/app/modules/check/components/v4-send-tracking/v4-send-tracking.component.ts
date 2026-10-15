import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import {
  LucideAngularModule,
  Mail,
  Phone,
  Copy,
  X,
  ArrowLeft
} from 'lucide-angular';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';
import type { LucideIconData } from 'lucide-angular/icons/types';

@Component({
  selector: 'app-v4-send-tracking',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatDialogClose,
    MatDialogModule,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    NgClass
  ],
  templateUrl: './v4-send-tracking.component.html',
  styleUrl: './v4-send-tracking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4SendTrackingComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<V4SendTrackingComponent>);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private clipBoard = inject(Clipboard);
  public injectData: {
    mode: 'check' | 'invoice' | 'mail-doc';
    id: string;
    trackingCode: string;
    payee: { payeeEmail: string; payeePhone: string };
  } = inject(MAT_DIALOG_DATA);

  proofType: string = '';
  isCountryDropdownOpened: boolean = false;
  subscriptions: Subscription[] = [];
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);

  readonly XIcon = X;
  readonly ArrowLeftIcon = ArrowLeft;

  proofsList: { icon: LucideIconData; name: string; action: string }[] = [
    { icon: Mail, name: 'Email', action: 'email' },
    { icon: Phone, name: 'SMS', action: 'sms' },
    { icon: Copy, name: 'Copy Link', action: 'copy' }
  ];

  sendEmail = new FormControl(this.injectData.payee.payeeEmail, [
    Validators.required,
    ValidationService.emailValidator
  ]);

  sendPhoneNumber = new FormControl(this.injectData.payee.payeePhone, [
    Validators.required,
    Validators.minLength(10)
  ]);

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
              this.alertService.successAlert({
                content: 'Email send Successfully'
              });
              this.close();
            }
          }
        })
    );
  }

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
              this.alertService.successAlert({
                content: 'SMS send Successfully'
              });
              this.close();
            }
          }
        })
    );
  }

  copyProof() {
    this.proofType = '';
    this.clipBoard.copy(getMailTrackUrl(this.injectData.trackingCode));
    this.alertService.successAlert({
      content: 'Link Copied Successfully.'
    });
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

  back() {
    this.isCountryDropdownOpened = false;
    this.proofType = '';
  }

  countryChange(event: { isOpen: boolean }) {
    this.isCountryDropdownOpened = event.isOpen;
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

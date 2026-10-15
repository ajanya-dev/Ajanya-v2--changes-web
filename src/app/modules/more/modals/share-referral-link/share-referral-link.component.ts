import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCopy,
  faEnvelope,
  faMobile,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { Clipboard } from '@angular/cdk/clipboard';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { faWhatsappSquare } from '@fortawesome/free-brands-svg-icons';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { finalize, Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IconDefinition, IconProp } from '@fortawesome/fontawesome-svg-core';
import { environment } from 'src/environments/environment';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-share-referral-link',
  templateUrl: './share-referral-link.component.html',
  styleUrls: ['./share-referral-link.component.scss'],
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
  ]
})
export class ShareReferralLinkComponent implements OnDestroy{
  private dialogRef = inject(MatDialogRef<ShareReferralLinkComponent>);
  private affiliateService = inject(AffiliateProgramsService);
  private alertService = inject(AlertService);
  private clipBoard = inject(Clipboard);
  public data: { link: string } = inject(MAT_DIALOG_DATA);

  isCountryDropdownOpened: boolean = false;
  shareType: string = '';
  isEmailing = signal<boolean>(false);
  isSendingSMS = signal<boolean>(false);
  isCopying = signal<boolean>(false);

  faXmark = faXmark;
  faArrowLeft = faArrowLeft;

  subscriptions: Subscription[] = [];

  /**
   * Duration of the "copied to clipboard" message.
   */
  copyMsgDuration = 1;

  /**
   * proof sending types
   */
  shareList = signal<
    {
      icon: IconProp | IconDefinition;
      name: string;
      action: string;
      loading?: boolean;
      loadingText?: string;
    }[]
  >([
    {
      icon: faCopy,
      name: 'Copy Link',
      action: 'copy',
      loading: this.isCopying(),
      loadingText: 'Copying..'
    },
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
      icon: faWhatsappSquare as IconDefinition,
      name: 'Whatsapp',
      action: 'whatsapp'
    }
  ]);

  /**
   * method for for managing send proof action
   */
  sendProof(action: string) {
    switch (action) {
      case 'copy':
        this.copyToClipboard();
        break;
      case 'email':
        this.emailLink();
        break;
      case 'sms':
        this.smsLink();
        break;
      case 'whatsapp':
        this.WhatsappLink();
        break;
      default:
        break;
    }
  }

  emailLink() {
    this.shareType = 'Email';
    if (this.sendEmail.invalid) {
      this.sendEmail.markAllAsTouched();
      return;
    }
    this.isEmailing.set(true);
    this.subscriptions.push(
      this.affiliateService
        .shareReferral({
          type: 'email',
          email: this.sendEmail.value as string,
          link: this.data.link
        })
        .pipe(
          finalize(() => {
            this.isEmailing.set(false);
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
            this.isEmailing.set(false);
          },
          error: (err) => {
            if (err) {
              this.isEmailing.set(false);
            }
          }
        })
    );
  }

  smsLink() {
    this.shareType = 'SMS';
    if (this.sendPhoneNumber.invalid) {
      this.sendPhoneNumber.markAllAsTouched();
      return;
    }
    this.isSendingSMS.set(true);
    this.subscriptions.push(
      this.affiliateService
        .shareReferral({
          type: 'sms',
          phone: this.sendPhoneNumber.value as string,
          link: this.data.link
        })
        .pipe(
          finalize(() => {
            this.isEmailing.set(false);
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
            this.isSendingSMS.set(false);
          },
          error: (err) => {
            if (err) {
              this.isSendingSMS.set(false);
            }
          }
        })
    );
  }

  WhatsappLink() {
    let textToSend = '';
    if (environment.env_id === 'zilMoney') {
      textToSend = this.setTextToShareOnWhatsapp('Zil Money');
    } else {
      textToSend = this.setTextToShareOnWhatsapp('Online Check Writer');
    }

    window.open(
      `https://web.whatsapp.com/send?text=${encodeURIComponent(textToSend)}`,
      '_blank'
    );
  }

  setTextToShareOnWhatsapp(platform: string) {
    return `*${platform}* \n Hi! I've invited you to join ${platform}, a platform that makes managing your finances easy. Use my referral link to get started: ${this.data.link} Feel free to reach out if you have any questions!`;
  }

  /**
   *email formControl
   */
  sendEmail = new FormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  /**
   *phone formControl
   */
  sendPhoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(10)
  ]);

  /**
   * Copies the referral link to the clipboard and displays a notification.
   */
  copyToClipboard() {
    if (this.data.link) {
      this.isCopying.set(true);
      this.clipBoard.copy(this.data.link);
      this.close();
      const data = {
        content: 'Link Copied Successfully',
        close: true,
        timeout: 1500
      };
      this.alertService.successAlert(data);
      this.isCopying.set(false);
    }
  }

  /**
   * handles backbutton event
   */
  back() {
    this.isCountryDropdownOpened = false;
    this.shareType = '';
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
  }
}

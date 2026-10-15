import { Clipboard } from '@angular/cdk/clipboard';
import { NgClass, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
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
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import {
  faArrowLeft,
  faCopy,
  faDownload,
  faEnvelope,
  faMobile,
  faXmark,
  faEllipsis,
  faChevronUp,
  IconDefinition
} from '@fortawesome/pro-solid-svg-icons';
import { Observable, finalize, Subject, takeUntil } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import {
  ISocialTarget,
  SOCIAL_TARGETS,
  socialShareUrl
} from 'src/app/shared/utils/social-share.util';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IPaymentsProofPayload } from 'src/app/modules/payments/model/payments';

interface IInjectData {
  transactionId: string;
  payee: { email: string; phone: string };
}

@Component({
  selector: 'app-send-receipt-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    MatDialogClose,
    FaIconComponent,
    ControlMessageComponent,
    NewPhoneInputComponent,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    MatTooltip
  ],
  templateUrl: './send-receipt-modal.component.html',
  styleUrl: './send-receipt-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SendReceiptModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<SendReceiptModalComponent>);
  public paymentsService = inject(PaymentsService);
  public alertService = inject(AlertService);
  private clipBoard = inject(Clipboard);
  public injectData = inject<IInjectData>(MAT_DIALOG_DATA);

  proofType: string;
  destroy$ = new Subject();
  isCountryDropdownOpened = signal(false);
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);
  isCopyProofLoading = signal(false);
  isDownload = signal(false);
  isWhatsappLoading = signal(false);
  faXmark = faXmark;
  faArrowLeft = faArrowLeft;
  faEllipsis = faEllipsis;
  faChevronUp = faChevronUp;

  readonly socialTargets = SOCIAL_TARGETS;
  /** The "More" row of social targets is expanded. */
  showMoreShare = signal(false);
  /** Key of the social target currently waiting on its link, or null. */
  sharingSocial = signal<string | null>(null);

  proofsList: Array<{
    icon?: IconDefinition;
    name: string;
    action: string;
    isSVG?: string;
  }> = [
    {
      icon: faCopy,
      name: 'Copy Link',
      action: 'copy'
    },
    {
      icon: faEnvelope,
      name: 'Email',
      action: 'email'
    },
    {
      icon: faDownload,
      name: 'Download',
      action: 'download'
    },
    {
      icon: faMobile,
      name: 'SMS',
      action: 'sms'
    },
    {
      isSVG: '/assets/icon/svg/whatsapp.svg',
      name: 'Whatsapp',
      action: 'whatsapp'
    }
  ];

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

  ngOnInit(): void {
    this.sendEmail.setValue(this.injectData.payee?.email);
    this.sendPhoneNumber.setValue(this.injectData.payee?.phone);
  }

  onClickAction(action: string) {
    if (
      this.isDownload() ||
      this.isCopyProofLoading() ||
      this.isWhatsappLoading()
    ) {
      return;
    }
    this.proofType = action;
    switch (action) {
      case 'copy':
        this.sendProof('link');
        break;
      case 'download':
        this.sendProof('download');
        break;
      case 'whatsapp':
        this.whatsappReceipt();
        break;
      default:
        break;
    }
  }

  back() {
    this.isCountryDropdownOpened.set(false);
    this.proofType = '';
  }

  countryChange(event: { isOpen: boolean }) {
    if (event.isOpen === true) {
      this.isCountryDropdownOpened.set(true);
    } else {
      this.isCountryDropdownOpened.set(false);
    }
  }

  sendProof(
    type: 'email' | 'link' | 'download' | 'sms',
    data?: { phone?: string; email?: string }
  ) {
    const loadingState = this.getLoadingState(type);
    loadingState.set(true);

    const payload: IPaymentsProofPayload = {
      type: [type] as ["email"] | ["sms"] | ["email", "sms"] | ["link"] | ["download"],
      is_signature_request: false,
      ...data
    };

    this.paymentsService
      .sendPaymentReceipt(this.injectData.transactionId, payload)
      .pipe(
        finalize(() => loadingState.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.handleSuccess(type, res.data);
        }
      });
  }

  /** The receipt link — the same request the Copy Link tile makes. */
  private receiptLink$(): Observable<IApiRes<string>> {
    return this.paymentsService.sendPaymentReceipt(
      this.injectData.transactionId,
      { type: ['link'], is_signature_request: false }
    );
  }

  /** WhatsApp message — asterisks are WhatsApp's own bold markup. */
  private whatsappReceipt() {
    this.isWhatsappLoading.set(true);
    this.receiptLink$()
      .pipe(
        finalize(() => this.isWhatsappLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          const text = `*Payment Receipt* 
          Please find the payment receipt here : 
          ${res.data}`;
          window.open(
            `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`,
            '_blank'
          );
        }
      });
  }

  /**
   * A social target in the "More" row. Same flow as the WhatsApp tile: fetch
   * the receipt link, then hand it to the network's web share intent.
   */
  shareToSocial(target: ISocialTarget) {
    if (this.sharingSocial()) return;
    this.sharingSocial.set(target.key);
    this.receiptLink$()
      .pipe(
        finalize(() => this.sharingSocial.set(null)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          window.open(
            socialShareUrl(target.key, res.data, 'Payment Receipt'),
            '_blank'
          );
        }
      });
  }

  // Helper to get the correct loading state based on the type
  private getLoadingState(type: string) {
    switch (type) {
      case 'email':
        return this.isEmailProofLoading;
      case 'link':
        return this.isCopyProofLoading;
      case 'download':
        return this.isDownload;
      case 'sms':
        return this.isSMSProofLoading;
      default:
        throw new Error('Invalid type for loading state');
    }
  }

  // Helper to handle success messages and actions
  private handleSuccess(type: string, data: string) {
    switch (type) {
      case 'email':
        this.openSuccessAlert('Email sent successfully');
        break;
      case 'link':
        this.clipBoard.copy(data);
        this.openSuccessAlert('Link copied successfully');
        break;
      case 'download':
        window.open(data, '_blank');
        this.openSuccessAlert('Downloaded successfully');
        break;
      case 'sms':
        this.openSuccessAlert('SMS sent successfully');
        break;
      default:
        throw new Error('Invalid type for success handler');
    }
  }

  // Usage Examples
  copyProof() {
    this.sendProof('link');
  }

  emailProof() {
    this.sendEmail.markAllAsTouched();
    if (this.sendEmail.invalid) {
      return;
    }
    this.sendProof('email', { email: this.sendEmail.value as string });
  }

  downloadProof() {
    this.sendProof('download');
  }

  smsProof() {
    this.sendPhoneNumber.markAllAsTouched();
    if (this.sendPhoneNumber.invalid) {
      return;
    }
    this.sendProof('sms', { phone: this.sendPhoneNumber.value as string });
  }

  openSuccessAlert(content: string) {
    const data = {
      content,
      close: true,
      timeout: 1500
    };
    this.alertService.successAlert(data);
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  LucideAngularModule,
  X,
  ArrowLeft,
  Copy,
  Mail,
  Download,
  Phone,
  MessageCircle,
  MoreHorizontal,
  ChevronUp
} from 'lucide-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Observable, finalize } from 'rxjs';

import { IApiRes } from 'src/app/models/api';
import {
  ISocialTarget,
  SOCIAL_TARGETS,
  socialShareUrl
} from 'src/app/shared/utils/social-share.util';

import { IPaymentsProofPayload } from 'src/app/modules/payments/model/payments';
import { PaymentsService } from '../../service/payments/payments.service';
import { V4AlertService } from '../../service/alert/v4-alert.service';
import { ValidationService } from '../../service/validation/validation.service';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from '../../V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from '../../V4/v4-phone-input/v4-phone-input.component';

interface IInjectData {
  transactionId: string;
  payee: { email: string; phone: string };
}

@Component({
  selector: 'app-v4-send-receipt-modal',
  templateUrl: './v4-send-receipt-modal.component.html',
  styleUrls: ['./v4-send-receipt-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    MatDialogClose,
    NgClass,
    MatTooltip,
    FontAwesomeModule
  ]
})
export class V4SendReceiptModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4SendReceiptModalComponent>);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(V4AlertService);
  private clipBoard = inject(Clipboard);
  private destroyRef = inject(DestroyRef);
  public injectData = inject<IInjectData>(MAT_DIALOG_DATA);

  // Lucide icons
  readonly XIcon = X;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly CopyIcon = Copy;
  readonly MailIcon = Mail;
  readonly DownloadIcon = Download;
  readonly PhoneIcon = Phone;
  readonly MessageCircleIcon = MessageCircle;
  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly ChevronUpIcon = ChevronUp;
  readonly faWhatsapp = faWhatsapp;
  readonly socialTargets = SOCIAL_TARGETS;

  // State
  proofType = signal<string>('');
  isCountryDropdownOpened = signal(false);

  // Loading signals
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);
  isCopyProofLoading = signal(false);
  isDownloadLoading = signal(false);
  isWhatsappLoading = signal(false);
  /** The "More" row of social targets is expanded. */
  showMoreShare = signal(false);
  /** Key of the social target currently waiting on its link, or null. */
  sharingSocial = signal<string | null>(null);

  // Computed
  showBackButton = computed(() => this.proofType() !== '');

  proofsList = [
    { icon: this.CopyIcon, name: 'Copy Link', action: 'copy' },
    { icon: this.MailIcon, name: 'Email', action: 'email' },
    { icon: this.DownloadIcon, name: 'Download', action: 'download' },
    { icon: this.PhoneIcon, name: 'SMS', action: 'sms' },
    { icon: this.MessageCircleIcon, name: 'Whatsapp', action: 'whatsapp' }
  ];

  // Form controls
  sendEmail = new FormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  sendPhoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(10)
  ]);

  ngOnInit(): void {
    this.sendEmail.setValue(this.injectData.payee?.email);
    this.sendPhoneNumber.setValue(this.injectData.payee?.phone);
  }

  onClickAction(action: string): void {
    if (
      this.isDownloadLoading() ||
      this.isCopyProofLoading() ||
      this.isWhatsappLoading()
    ) {
      return;
    }
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
      case 'email':
      case 'sms':
        this.proofType.set(action);
        break;
      default:
        break;
    }
  }

  handleBack(): void {
    this.isCountryDropdownOpened.set(false);
    this.proofType.set('');
  }

  countryChange(event: { isOpen: boolean }): void {
    this.isCountryDropdownOpened.set(event.isOpen);
  }

  sendProof(
    type: 'email' | 'link' | 'download' | 'sms',
    data?: { phone?: string; email?: string }
  ): void {
    const loadingState = this.getLoadingState(type);
    loadingState.set(true);

    const payload: IPaymentsProofPayload = {
      type: [type] as
        | ['email']
        | ['sms']
        | ['email', 'sms']
        | ['link']
        | ['download'],
      is_signature_request: false,
      ...data
    };

    this.paymentsService
      .sendPaymentReceipt(this.injectData.transactionId, payload)
      .pipe(
        finalize(() => loadingState.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.handleSuccess(type, res.data);
        }
      });
  }

  emailProof(): void {
    this.sendEmail.markAllAsTouched();
    if (this.sendEmail.invalid) return;
    this.sendProof('email', { email: this.sendEmail.value as string });
  }

  smsProof(): void {
    this.sendPhoneNumber.markAllAsTouched();
    if (this.sendPhoneNumber.invalid) return;
    this.sendProof('sms', { phone: this.sendPhoneNumber.value as string });
  }

  /** The receipt link — the same request the Copy Link tile makes. */
  private receiptLink$(): Observable<IApiRes<string>> {
    return this.paymentsService.sendPaymentReceipt(
      this.injectData.transactionId,
      { type: ['link'], is_signature_request: false }
    );
  }

  /** WhatsApp message — asterisks are WhatsApp's own bold markup. */
  private whatsappReceipt(): void {
    this.isWhatsappLoading.set(true);
    this.receiptLink$()
      .pipe(
        finalize(() => this.isWhatsappLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
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
  shareToSocial(target: ISocialTarget): void {
    if (this.sharingSocial()) return;
    this.sharingSocial.set(target.key);
    this.receiptLink$()
      .pipe(
        finalize(() => this.sharingSocial.set(null)),
        takeUntilDestroyed(this.destroyRef)
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

  private getLoadingState(type: string) {
    switch (type) {
      case 'email':
        return this.isEmailProofLoading;
      case 'link':
        return this.isCopyProofLoading;
      case 'download':
        return this.isDownloadLoading;
      case 'sms':
        return this.isSMSProofLoading;
      default:
        throw new Error('Invalid type for loading state');
    }
  }

  private handleSuccess(type: string, data: string): void {
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
        break;
    }
  }

  private openSuccessAlert(content: string): void {
    this.alertService.successAlert({
      content,
      close: true,
      timeout: 1500
    });
    this.dialogRef.close();
  }
}

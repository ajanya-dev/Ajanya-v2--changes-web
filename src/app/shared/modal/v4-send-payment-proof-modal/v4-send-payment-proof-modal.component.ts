import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  X,
  Mail,
  Phone,
  Upload,
  Smartphone,
  QrCode,
  ArrowLeft,
  CircleCheck,
  Trash2,
  Image,
  Play,
  Copy,
  Printer,
  Download,
  FileText,
  MessageCircle,
  MoreHorizontal,
  ChevronUp
} from 'lucide-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  ISocialTarget,
  SOCIAL_TARGETS,
  socialShareUrl
} from 'src/app/shared/utils/social-share.util';
import {
  Observable,
  Subject,
  catchError,
  finalize,
  interval,
  of,
  takeUntil
} from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { Channel } from 'pusher-js';

import { PaymentsService } from '../../service/payments/payments.service';
import { V4AlertService } from '../../service/alert/v4-alert.service';
import { ValidationService } from '../../service/validation/validation.service';
import { LocalStorageService } from '../../service/storage/local-storage.service';
import { PusherService } from 'src/app/core/services/pusher.service';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from '../../V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from '../../V4/v4-phone-input/v4-phone-input.component';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { IPusherEvent } from 'src/app/modules/auth/model/pusher';
import {
  IPaymentsProofPayload,
  IPodDetails
} from 'src/app/modules/payments/model/payments';

/** Detail-panel section that can be shared through this modal. */
export type ShareSectionType =
  | 'audit_log'
  | 'comments'
  | 'attachments'
  | 'remittance'
  | 'proof_of_delivery';

const SHARE_LABELS: Record<ShareSectionType, string> = {
  audit_log: 'Audit Log',
  comments: 'Comments',
  attachments: 'Attachments',
  remittance: 'Remittance',
  proof_of_delivery: 'Proof of Delivery'
};

/** Tooltip for the Share button above a detail-view section. */
export function shareSectionTooltip(type: ShareSectionType): string {
  return `Send the ${SHARE_LABELS[type].toLowerCase()} by email, SMS, link or social media`;
}

export interface IV4SendPaymentProofModalData {
  checkStatus: { value: string; color: string };
  uuId: string;
  mode: 'pp' | 'pod' | 'share';
  payee: { email: string; phone: string };
  isMailProof: boolean;
  amount: string;
  encryptedId: string;
  /** mode 'share' only: which section is being sent. */
  shareType?: ShareSectionType;
  /** mode 'share' only: payee name, sent as `recipient_name`. */
  recipientName?: string;
}

interface IProofItem {
  icon: any;
  name: string;
  action: string;
}

@Component({
  selector: 'app-v4-send-payment-proof-modal',
  templateUrl: './v4-send-payment-proof-modal.component.html',
  styleUrls: ['./v4-send-payment-proof-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    DatePipe,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    TruncatePipe,
    MatTooltip,
    MatDialogClose,
    FontAwesomeModule
  ]
})
export class V4SendPaymentProofModalComponent implements OnInit, OnDestroy {
  // DI
  private dialogRef = inject(MatDialogRef<V4SendPaymentProofModalComponent>);
  public data: IV4SendPaymentProofModalData = inject(MAT_DIALOG_DATA);
  private paymentService = inject(PaymentsService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private alertService = inject(V4AlertService);
  private matDialog = inject(MatDialog);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);
  private clipBoard = inject(Clipboard);
  private destroyRef = inject(DestroyRef);

  // Lucide icons
  readonly XIcon = X;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly UploadIcon = Upload;
  readonly SmartphoneIcon = Smartphone;
  readonly QrCodeIcon = QrCode;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly CircleCheckIcon = CircleCheck;
  readonly Trash2Icon = Trash2;
  readonly ImageIcon = Image;
  readonly PlayIcon = Play;
  readonly CopyIcon = Copy;
  readonly PrinterIcon = Printer;
  readonly DownloadIcon = Download;
  readonly FileTextIcon = FileText;
  readonly MessageCircleIcon = MessageCircle;
  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly ChevronUpIcon = ChevronUp;
  readonly faWhatsapp = faWhatsapp;
  readonly socialTargets = SOCIAL_TARGETS;

  // View state signals
  podTab = signal<'request' | 'send'>('request');
  requestStep = signal<'choose' | 'email' | 'sms'>('choose');
  proofType = signal<string>('');
  isCountryDropdownOpened = signal(false);
  /** Share mode: the "More" row of social targets is expanded. */
  showMoreShare = signal(false);
  /** Key of the social target currently waiting on its link, or null. */
  sharingSocial = signal<string | null>(null);

  // Loading signals
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);
  isCopyProofLoading = signal(false);
  isPrinting = signal(false);
  isDownloading = signal(false);
  isWhatsappProofLoading = signal(false);
  isSubmittingProof = signal(false);
  isQRCodeLoading = signal(false);
  uploadLoading = signal(false);
  phoneNumberSending = signal(false);

  // Send Proof tab state
  selectedSendMethod = signal<'email' | 'sms' | null>(null);
  mediaPreview = signal<string | null>(null);
  mediaType = signal<'image' | 'video' | null>(null);
  uploadedFile = signal<File | null>(null);
  showPreview = signal(false);
  showPhoneInput = signal(false);
  sendSuccessfully = signal(false);
  isUploadedViaMobileOrQrCode = signal(false);
  uploadedFiles = signal<any[]>([]);
  mediaNeeded = signal(false);

  // Timer state
  timerExist = signal(false);
  displayTimer = signal('');
  private timer = 0;
  private timerCancel$ = new Subject<void>();

  // Pusher state
  private pusherChannels: Channel[] = [];
  private readonly PUSHER_CHANNEL_NAME_PREFIX =
    'zil-payment-pod-document-' as const;
  private readonly PUSHER_EVENT_NAME_PREFIX =
    'zil-payment-pod-document-event-' as const;
  private qrDialogRef: MatDialogRef<QrCodeScannerModalComponent> | undefined;

  // Phone upload tracking
  private phoneIncr = 0;
  private previousPhoneNumber = '';

  // Form controls
  sendEmail = new FormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  sendPhoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(10)
  ]);

  notesControl = new FormControl('');

  // Computed
  /** "Audit Log" / "Comments" / … — share mode only. */
  shareLabel = computed(() => SHARE_LABELS[this.data.shareType ?? 'audit_log']);

  modalTitle = computed(() => {
    if (this.data.mode === 'share') {
      return `Send ${this.shareLabel()}`;
    }
    if (this.data.mode === 'pp') {
      return this.data.isMailProof
        ? 'Send Mail Payment Proof'
        : 'Send Payment Proof';
    }
    return 'Proof of Delivery';
  });

  showBackButton = computed(() => {
    if (this.data.mode === 'pod') {
      return this.podTab() === 'request' && this.requestStep() !== 'choose';
    }
    return this.proofType() !== '';
  });

  phoneNumberButtonLabel = computed(() => {
    if (this.phoneNumberSending()) return 'Sending';
    if (
      this.previousPhoneNumber === this.sendPhoneNumber.value &&
      !this.phoneNumberSending()
    ) {
      return 'Resend';
    }
    if (
      this.showPhoneInput() &&
      this.previousPhoneNumber !== this.sendPhoneNumber.value
    ) {
      return 'Send Link';
    }
    return 'Upload from Phone';
  });

  proofsList = computed<IProofItem[]>(() => {
    const allProofs: IProofItem[] = [
      { icon: this.PrinterIcon, name: 'Print Receipt', action: 'print' },
      { icon: this.CopyIcon, name: 'Copy Link', action: 'copy' },
      { icon: this.MailIcon, name: 'Email', action: 'email' },
      { icon: this.DownloadIcon, name: 'Download', action: 'download' },
      { icon: this.PhoneIcon, name: 'SMS', action: 'sms' },
      {
        icon: this.MessageCircleIcon,
        name: 'Whatsapp',
        action: 'whatsapp'
      }
    ];

    // Share mode keeps all six tiles; only "Print Receipt" is payment-proof
    // wording — an audit log or a remittance is just printed.
    if (this.data.mode === 'share') {
      return allProofs.map((item) =>
        item.action === 'print' ? { ...item, name: 'Print' } : item
      );
    }

    let filtered =
      this.data.mode === 'pod'
        ? allProofs.filter(
            (p) =>
              !['Print Receipt', 'Copy Link', 'Download', 'Whatsapp'].includes(
                p.name
              )
          )
        : allProofs;

    if (
      this.data?.uuId &&
      this.data?.checkStatus?.value === 'Mailed' &&
      this.data?.isMailProof &&
      this.data.mode === 'pp'
    ) {
      filtered = filtered.map((item) =>
        item.action === 'print' ? { ...item, name: 'Proof of Mail' } : item
      );
    }

    return filtered;
  });

  // Lifecycle
  ngOnInit(): void {
    this.configureDialogBehavior();
    this.setupMobileUpload();

    if (this.data.mode === 'pod' || this.data.mode === 'share') {
      this.setPayeeEmailAndPhone();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.qrDialogRef?.close();
    this.pusherChannels.forEach((ch) => ch.unsubscribe());
  }

  // Dialog behavior
  private configureDialogBehavior(): void {
    this.dialogRef.disableClose = true;

    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isSubmittingProof() || this.uploadLoading()) {
          this.alertService.failedAlert({
            content: 'Please wait for the current operation to complete.',
            close: true,
            timeout: 1500
          });
        } else {
          this.close();
        }
      });

    this.dialogRef
      .keydownEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (this.isSubmittingProof() || this.uploadLoading()) {
            this.alertService.failedAlert({
              content: 'Please wait for the current operation to complete.',
              close: true,
              timeout: 1500
            });
          } else {
            this.close();
          }
        }
      });
  }

  private setupMobileUpload(): void {
    const userId = this.localStorageService.getItem('userId');
    const channelName = `attachment-from-phone-${userId}`;
    const eventName = 'attachment-from-phone-event';

    this.pusherService
      .getEvent(channelName, eventName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: IPusherEvent) => {
        if (res?.event?.data?.user_id === userId) {
          this.alertService.successAlert({
            content: 'File uploaded successfully from mobile device',
            close: true,
            timeout: 1500
          });
        }
      });
  }

  private setPayeeEmailAndPhone(): void {
    this.sendEmail.setValue(this.data.payee?.email);
    this.sendPhoneNumber.setValue(this.data.payee?.phone);
  }

  // Navigation
  close(): void {
    this.dialogRef.close();
  }

  handleBack(): void {
    if (this.data.mode === 'pod') {
      this.requestStep.set('choose');
    } else {
      this.proofType.set('');
    }
    this.isCountryDropdownOpened.set(false);
  }

  switchTab(tab: 'request' | 'send'): void {
    this.podTab.set(tab);
    if (tab === 'request') {
      this.requestStep.set('choose');
    }
    if (tab === 'send') {
      this.loadPodAttachments();
      if (this.data.payee?.email) {
        this.selectedSendMethod.set('email');
      } else if (this.data.payee?.phone) {
        this.selectedSendMethod.set('sms');
      }
    }
  }

  onSendMethodChange(method: 'email' | 'sms'): void {
    this.selectedSendMethod.set(method);
    if (method === 'email') {
      this.sendPhoneNumber.setErrors(null);
    } else {
      this.sendEmail.setErrors(null);
    }
  }

  countryChange(event: { isOpen: boolean }): void {
    this.isCountryDropdownOpened.set(event.isOpen);
  }

  // PP mode proof actions
  sendProof(action: string): void {
    if (this.data.mode === 'share') {
      this.shareSection(action);
      return;
    }

    switch (action) {
      case 'print':
        this.downloadProofOfPayment();
        break;
      case 'copy':
        this.copyProof();
        break;
      case 'email':
        this.emailProof();
        break;
      case 'download':
        this.downloadProof();
        break;
      case 'sms':
        this.smsProof();
        break;
      case 'whatsapp':
        this.whatsappProof();
        break;
    }
  }

  // ── Share mode (audit log / comments / attachments / remittance) ──────────
  /**
   * Tile click in share mode. Print and Download both ask the API for a
   * `download` URL and open it; Copy Link and WhatsApp ask for a `link`;
   * Email and SMS fall through to the same two-step input screens the payment
   * proof flow uses.
   */
  private shareSection(action: string): void {
    switch (action) {
      case 'email':
        this.emailProof();
        break;
      case 'sms':
        this.smsProof();
        break;
      case 'print':
      case 'download':
        this.requestShareUrl(
          'download',
          action === 'print' ? this.isPrinting : this.isDownloading,
          (url) => {
            window.open(url, '_blank');
            this.close();
          }
        );
        break;
      case 'copy':
        this.requestShareUrl('link', this.isCopyProofLoading, (url) => {
          this.clipBoard.copy(url);
          this.alertService.successAlert({
            content: 'Link Copied Successfully.',
            close: true,
            timeout: 1500
          });
          this.close();
        });
        break;
      case 'whatsapp':
        this.requestShareUrl('link', this.isWhatsappProofLoading, (url) => {
          window.open(
            `https://web.whatsapp.com/send?text=${encodeURIComponent(this.shareMessage(url))}`,
            '_blank'
          );
        });
        break;
      default:
        break;
    }
  }

  /**
   * A social target in the "More" row. Same flow as the WhatsApp tile: ask the
   * API for a `link`, then hand that link to the network's web share intent.
   */
  shareToSocial(target: ISocialTarget): void {
    if (!this.data.uuId || this.sharingSocial()) return;
    this.sharingSocial.set(target.key);

    this.socialLink$()
      .pipe(
        finalize(() => this.sharingSocial.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            window.open(
              socialShareUrl(target.key, res.data, this.shareTitle()),
              '_blank'
            );
          }
        }
      });
  }

  /** WhatsApp message — asterisks are WhatsApp's own bold markup. */
  private shareMessage(url: string): string {
    const label = this.shareLabel();
    return `*${label}* \n Please find the ${label.toLowerCase()} for your payment of $${this.data.amount} here : \n ${url}`;
  }

  /**
   * The link a social target posts — from the same source the Copy Link and
   * WhatsApp tiles already use in each mode.
   */
  private socialLink$(): Observable<IApiRes<string>> {
    if (this.data.mode === 'share') {
      return this.paymentService.sendSharedSection(
        this.data.uuId,
        this.sharePayload('link')
      );
    }
    return this.data.isMailProof
      ? this.v3PaymentsTableService.getProofOfPaymentForMailed(this.data.uuId)
      : this.paymentService.sendPaymentProof(this.data.uuId, { type: 'link' });
  }

  /**
   * One-line caption for networks that take a plain title, not rich text.
   * Some callers open the modal without an amount, so it is left off then
   * rather than printing "$undefined".
   */
  private shareTitle(): string {
    const label =
      this.data.mode === 'share' ? this.shareLabel() : 'Payment Confirmation';
    return this.data.amount
      ? `${label} for payment of $${this.data.amount}`
      : label;
  }

  /** Body every share request shares — only `type` and the contact differ. */
  private sharePayload(
    type: IPaymentsProofPayload['type']
  ): IPaymentsProofPayload {
    return {
      type,
      share_type: this.data.shareType,
      recipient_name: this.data.recipientName ?? ''
    };
  }

  private requestShareUrl(
    type: 'link' | 'download',
    loading: WritableSignal<boolean> | null,
    done: (url: string) => void
  ): void {
    if (!this.data.uuId) return;
    loading?.set(true);

    this.paymentService
      .sendSharedSection(this.data.uuId, this.sharePayload(type))
      .pipe(
        finalize(() => loading?.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) done(res.data);
        }
      });
  }

  /** Share via email/SMS — reached from the Email/SMS step, after validation. */
  private sendShareTo(type: 'email' | 'sms'): void {
    if (!this.data.uuId) return;

    const loading =
      type === 'email' ? this.isEmailProofLoading : this.isSMSProofLoading;
    loading.set(true);

    this.paymentService
      .sendSharedSection(this.data.uuId, {
        ...this.sharePayload(type),
        ...(type === 'email'
          ? { email: this.sendEmail.value as string }
          : { phone: this.sendPhoneNumber.value as string })
      })
      .pipe(
        finalize(() => loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content:
                type === 'email'
                  ? 'Email send Successfully'
                  : 'SMS send Successfully',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        }
      });
  }

  private downloadProofOfPayment(): void {
    if (!this.data?.uuId) return;
    this.isPrinting.set(true);

    if (this.data?.checkStatus?.value === 'Mailed' && this.data?.isMailProof) {
      this.v3PaymentsTableService
        .getProofOfPaymentForMailed(this.data.uuId)
        .pipe(
          finalize(() => this.isPrinting.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res) {
            this.close();
            window.open(res.data, '_blank');
          }
        });
      return;
    }

    this.v3PaymentsTableService
      .getProofOfPayment(this.data.uuId)
      .pipe(
        finalize(() => this.isPrinting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          this.close();
          window.open(res.data, '_blank');
        }
      });
  }

  private copyProof(): void {
    if (!this.data.uuId) return;
    this.isCopyProofLoading.set(true);

    if (!this.data?.isMailProof) {
      this.paymentService
        .sendPaymentProof(this.data.uuId, { type: 'link' })
        .pipe(
          finalize(() => this.isCopyProofLoading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.clipBoard.copy(res.data);
              this.alertService.successAlert({
                content: 'Link Copied Successfully.',
                close: true,
                timeout: 1500
              });
              this.close();
            }
          }
        });
    } else {
      this.v3PaymentsTableService
        .getProofOfPaymentForMailed(this.data.uuId)
        .pipe(
          finalize(() => this.isCopyProofLoading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.clipBoard.copy(res.data);
            this.alertService.successAlert({
              content: 'Link Copied Successfully.',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        });
    }
  }

  emailProof(): void {
    if (this.proofType() === '') {
      this.proofType.set('Email');
      return;
    }
    if (this.sendEmail.invalid) {
      this.sendEmail.markAllAsTouched();
      return;
    }

    if (this.data.mode === 'pod') {
      this.requestPod('email');
      return;
    }

    if (this.data.mode === 'share') {
      this.sendShareTo('email');
      return;
    }

    if (!this.data.uuId) return;
    this.isEmailProofLoading.set(true);

    const proofMethod = this.data.isMailProof
      ? this.paymentService.sendMailPaymentProof.bind(this.paymentService)
      : this.paymentService.sendPaymentProof.bind(this.paymentService);

    proofMethod(this.data.uuId, {
      type: 'email',
      email: this.sendEmail.value as string
    })
      .pipe(
        finalize(() => this.isEmailProofLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Email send Successfully',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        }
      });
  }

  private downloadProof(): void {
    if (!this.data.uuId || this.isDownloading()) return;
    this.isDownloading.set(true);

    this.paymentService
      .sendPaymentProof(this.data.uuId, { type: 'download' })
      .pipe(
        finalize(() => this.isDownloading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            window.open(res.data, '_blank');
            this.alertService.successAlert({
              content: 'Downloaded Successfully.',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        }
      });
  }

  smsProof(): void {
    if (this.proofType() === '') {
      this.proofType.set('SMS');
      return;
    }
    if (this.sendPhoneNumber.invalid) {
      this.sendPhoneNumber.markAllAsTouched();
      return;
    }

    if (this.data.mode === 'pod') {
      this.requestPod('sms');
      return;
    }

    if (this.data.mode === 'share') {
      this.sendShareTo('sms');
      return;
    }

    if (!this.data.uuId) return;
    this.isSMSProofLoading.set(true);

    const proofMethod = this.data.isMailProof
      ? this.paymentService.sendMailPaymentProof.bind(this.paymentService)
      : this.paymentService.sendPaymentProof.bind(this.paymentService);

    proofMethod(this.data.uuId, {
      type: 'sms',
      phone: this.sendPhoneNumber.value as string
    })
      .pipe(
        finalize(() => this.isSMSProofLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'SMS send Successfully',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        }
      });
  }

  private whatsappProof(): void {
    if (!this.data.uuId) return;
    this.isWhatsappProofLoading.set(true);

    if (!this.data.isMailProof) {
      this.paymentService
        .sendPaymentProof(this.data.uuId, { type: 'link' })
        .pipe(
          finalize(() => this.isWhatsappProofLoading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              const textToSend = `*Payment Confirmation* \n Your payment of $${this.data.amount} has been processed. Please find the proof of payment here : \n ${res.data}`;
              window.open(
                `https://web.whatsapp.com/send?text=${encodeURIComponent(textToSend)}`,
                '_blank'
              );
            }
          }
        });
    } else {
      this.v3PaymentsTableService
        .getProofOfPaymentForMailed(this.data.uuId)
        .pipe(
          finalize(() => this.isWhatsappProofLoading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            const textToSend = `*Payment Confirmation* \n Your payment of $${this.data.amount} has been processed. Please find the proof of payment here : \n ${res.data}`;
            window.open(
              `https://web.whatsapp.com/send?text=${encodeURIComponent(textToSend)}`,
              '_blank'
            );
          }
        });
    }
  }

  // POD Request Proof
  requestPod(type: 'email' | 'sms'): void {
    if (!this.data.uuId) return;

    if (type === 'email') {
      this.isEmailProofLoading.set(true);
    } else {
      this.isSMSProofLoading.set(true);
    }

    this.paymentService
      .sendDeliveryOfProof(this.data.uuId, {
        type,
        [type === 'sms' ? 'phone' : 'email']:
          type === 'sms'
            ? (this.sendPhoneNumber.value as string)
            : (this.sendEmail.value as string)
      })
      .pipe(
        finalize(() => {
          if (type === 'email') {
            this.isEmailProofLoading.set(false);
          } else {
            this.isSMSProofLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content:
                type === 'email'
                  ? 'Email send Successfully'
                  : 'SMS send Successfully',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        }
      });
  }

  // Send email for POD request (from Request Proof tab step)
  sendRequestEmail(): void {
    if (this.sendEmail.invalid) {
      this.sendEmail.markAllAsTouched();
      return;
    }
    this.requestPod('email');
  }

  // Send SMS for POD request (from Request Proof tab step)
  sendRequestSMS(): void {
    if (this.sendPhoneNumber.invalid) {
      this.sendPhoneNumber.markAllAsTouched();
      return;
    }
    this.requestPod('sms');
  }

  // Send Proof tab - File upload
  chooseMedia(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    fileInput.click();
  }

  mediaPicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadedFile.set(null);
    this.mediaPreview.set(null);
    this.mediaType.set(null);
    this.showPreview.set(false);
    this.stopTimer();
    this.isUploadedViaMobileOrQrCode.set(false);
    this.handleImageFile(file);

    if (this.data.mode === 'pod' && this.podTab() === 'send') {
      this.showPhoneInput.set(false);
    }
  }

  private handleImageFile(file: File): void {
    if (file.type.startsWith('image/')) {
      this.mediaType.set('image');
    } else if (file.type.startsWith('video/')) {
      this.mediaType.set('video');
    } else {
      this.alertService.failedAlert({
        content: 'Please select an image or video file',
        close: true,
        timeout: 1500
      });
      return;
    }

    this.uploadedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.mediaPreview.set(e.target?.result as string);
      this.mediaNeeded.set(false);
    };
    reader.readAsDataURL(file);
  }

  removeMedia(): void {
    this.uploadedFile.set(null);
    this.mediaPreview.set(null);
    this.mediaType.set(null);
    this.showPreview.set(false);
    const fileInput = document.getElementById(
      'v4-file-upload'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // Send Proof tab - Mobile upload
  addWithMobileDevice(): void {
    this.mediaNeeded.set(false);
    this.mediaPreview.set(null);
    this.mediaType.set(null);
    this.uploadedFile.set(null);
    this.showPreview.set(false);
    const fileInput = document.getElementById(
      'v4-file-upload'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    this.showPhoneInput.set(true);
    this.sendPhoneNumber.markAsTouched();

    if (this.sendPhoneNumber.invalid) {
      this.phoneIncr += 1;
      return;
    }

    this.previousPhoneNumber = this.sendPhoneNumber.value as string;
    if (this.phoneIncr !== 0) {
      this.phoneNumberSending.set(true);
      this.submitPhoneNumber();
    }
    this.phoneIncr += 1;
  }

  private submitPhoneNumber(): void {
    const paymentId = this.data.uuId || '0';

    this.paymentService
      .uploadPodFromPhone({
        documentType: ['pod'],
        encryptedId: paymentId,
        uu_id: paymentId,
        requestType: 'sms',
        phone: this.sendPhoneNumber.value as string
      })
      .pipe(
        finalize(() => this.phoneNumberSending.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.sendSuccessfully.set(true);
            this.startTimer(300);
            this.subscribePusherForAttachments(res.data.uuid as string);
            setTimeout(() => this.sendSuccessfully.set(false), 3500);
          } else {
            this.startTimer(0);
          }
        },
        error: () => this.startTimer(0)
      });
  }

  // Send Proof tab - QR code
  openQrCodeModal(): void {
    this.mediaNeeded.set(false);
    this.mediaPreview.set(null);
    this.mediaType.set(null);
    this.uploadedFile.set(null);
    this.showPreview.set(false);
    this.showPhoneInput.set(false);
    const fileInput = document.getElementById(
      'v4-file-upload'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    if (this.isQRCodeLoading()) return;
    this.isQRCodeLoading.set(true);

    const paymentId = this.data.uuId || '0';

    this.paymentService
      .uploadPodFromPhone({
        documentType: ['pod'],
        encryptedId: this.data.encryptedId,
        uu_id: paymentId,
        requestType: 'qr'
      })
      .pipe(
        finalize(() => this.isQRCodeLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.qrDialogRef = this.matDialog.open(
              QrCodeScannerModalComponent,
              {
                width: '322px',
                height: '445px',
                data: { link: res.data.link }
              }
            );
            this.subscribePusherForAttachments(res.data.uuid as string);
          } else {
            this.alertService.failedAlert({
              content: 'Failed to generate QR code',
              close: true,
              timeout: 1500
            });
          }
        },
        error: () => {
          this.alertService.failedAlert({
            content: 'Failed to generate QR code',
            close: true,
            timeout: 1500
          });
        }
      });
  }

  // Pusher for attachments
  private subscribePusherForAttachments(typeId: string): void {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + typeId;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + typeId;

    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (res: any) => {
          if (res?.document_info?.length > 0) {
            this.isUploadedViaMobileOrQrCode.set(true);
            this.uploadedFiles.update((files) => [
              ...files,
              res.document_info[0]
            ]);
            this.alertService.successAlert({
              content: 'File uploaded successfully from mobile device',
              close: true,
              timeout: 1500
            });
            this.qrDialogRef?.close();
            this.stopTimer();
          }
        })
    );
  }

  // Send Proof tab - Submit
  submitPodProof(): void {
    if (!this.selectedSendMethod() && !this.isUploadedViaMobileOrQrCode()) {
      this.alertService.failedAlert({
        content: 'Please select a send method (Email or SMS)',
        close: true,
        timeout: 1500
      });
      return;
    }

    if (this.selectedSendMethod() === 'email') {
      if (!this.sendEmail.value || this.sendEmail.invalid) {
        this.sendEmail.markAsTouched();
        this.alertService.failedAlert({
          content: 'Please enter a valid email address',
          close: true,
          timeout: 1500
        });
        return;
      }
    } else if (this.selectedSendMethod() === 'sms') {
      if (!this.sendPhoneNumber.value || this.sendPhoneNumber.invalid) {
        this.sendPhoneNumber.markAsTouched();
        this.alertService.failedAlert({
          content: 'Please enter a valid phone number',
          close: true,
          timeout: 1500
        });
        return;
      }
    }

    if (!this.isUploadedViaMobileOrQrCode() && !this.uploadedFile()) {
      this.mediaNeeded.set(true);
      this.alertService.failedAlert({
        content: 'Please upload an image or video file',
        close: true,
        timeout: 1500
      });
      return;
    }

    if (this.isUploadedViaMobileOrQrCode()) {
      this.submitPodProofWithMobileUpload();
    } else {
      this.convertFileToBase64AndUpload(this.uploadedFile() as File);
    }
  }

  private submitPodProofWithMobileUpload(): void {
    if (!this.data.uuId || !this.uploadedFiles().length) {
      this.alertService.failedAlert({
        content: 'No uploaded file found',
        close: true,
        timeout: 1500
      });
      return;
    }

    this.isSubmittingProof.set(true);
    this.uploadLoading.set(true);

    const formData = new FormData();
    formData.append('type', this.selectedSendMethod() || '');
    formData.append('email', this.sendEmail.value || '');
    formData.append('phone', this.sendPhoneNumber.value || '');
    formData.append('description', this.notesControl.value || '');
    formData.append('uu_id', this.data.uuId || '');
    formData.append('pod_document_id', this.uploadedFiles()[0].id);

    this.paymentService
      .uploadPodAttachment(this.data.uuId, formData)
      .pipe(
        finalize(() => {
          this.isSubmittingProof.set(false);
          this.uploadLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: { success: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Proof of delivery sent successfully',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        }
      });
  }

  private convertFileToBase64AndUpload(file: File): void {
    if (!this.data.uuId || !file) {
      this.alertService.failedAlert({
        content: 'Invalid file or payment ID',
        close: true,
        timeout: 1500
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.alertService.failedAlert({
        content: 'File size too large. Please choose a file smaller than 10MB.',
        close: true,
        timeout: 1500
      });
      return;
    }

    this.isSubmittingProof.set(true);
    this.uploadLoading.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadPodAttachmentWithFile(file);
    };
    reader.onerror = () => {
      this.isSubmittingProof.set(false);
      this.uploadLoading.set(false);
      this.alertService.failedAlert({
        content: 'Failed to read file. Please try again.',
        close: true,
        timeout: 1500
      });
    };
    reader.readAsDataURL(file);
  }

  private uploadPodAttachmentWithFile(file: File): void {
    const formData = new FormData();
    formData.append('type', this.selectedSendMethod() || '');
    formData.append('email', this.sendEmail.value || '');
    formData.append('phone', this.sendPhoneNumber.value || '');
    formData.append('description', this.notesControl.value || '');
    formData.append('uu_id', this.data.uuId || '');
    formData.append('pod', file, file.name);
    if (this.isUploadedViaMobileOrQrCode()) {
      formData.append('pod_document_id', this.uploadedFiles()[0].id);
    }

    this.paymentService
      .uploadPodAttachment(this.data.uuId, formData)
      .pipe(
        finalize(() => {
          this.isSubmittingProof.set(false);
          this.uploadLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: { success: boolean }) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Proof of delivery sent successfully',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        }
      });
  }

  // POD attachments management
  loadPodAttachments(): void {
    if (!this.data.uuId) return;
    this.uploadLoading.set(true);

    this.paymentService
      .getPodFile('zil-payments', this.data.uuId)
      .pipe(
        catchError(() => of({ success: false, data: [] as IPodDetails[] })),
        finalize(() => this.uploadLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: { success: boolean; data: IPodDetails[] }) => {
        if (res?.success) {
          this.uploadedFiles.set(res.data || []);
        }
      });
  }

  deletePodAttachment(attachmentId: string): void {
    if (!this.data.uuId || !attachmentId) return;
    this.uploadLoading.set(true);

    this.paymentService
      .deletePodAttachment(this.data.uuId, attachmentId)
      .pipe(
        finalize(() => {
          this.uploadLoading.set(false);
          this.isUploadedViaMobileOrQrCode.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: { success: boolean }) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Attachment deleted.',
            close: true,
            timeout: 1500
          });
          this.loadPodAttachments();
        } else {
          this.alertService.failedAlert({
            content: 'Delete failed',
            close: true,
            timeout: 1500
          });
        }
      });
  }

  openPodAttachment(id: string): void {
    if (!this.data.uuId || !id) return;
    this.paymentService
      .downloadPodFile('zil-payments', this.data.uuId, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        if (res?.success && res.data) {
          window.open(res.data, '_blank');
        }
      });
  }

  trackByAttachmentId(_index: number, item: any): string {
    return item.id;
  }

  getFileIcon(fileName: string): any {
    if (!fileName) return this.FileTextIcon;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return this.ImageIcon;
    }
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) {
      return this.PlayIcon;
    }
    return this.FileTextIcon;
  }

  // Timer
  private startTimer(time: number): void {
    this.timerCancel$.next();

    this.timer = time;
    this.timerExist.set(time > 0);

    if (time > 0) this.updateTimerDisplay();

    interval(1000).pipe(
      takeUntil(this.timerCancel$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.timer > 0) {
        this.timer -= 1;
        this.updateTimerDisplay();
      } else {
        this.timerExist.set(false);
        this.displayTimer.set('');
        this.timerCancel$.next();
      }
    });
  }

  private updateTimerDisplay(): void {
    const hours = Math.floor(this.timer / 3600);
    const minutes = Math.floor((this.timer % 3600) / 60);
    const seconds = this.timer % 60;
    this.displayTimer.set(
      `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }

  private stopTimer(): void {
    this.timerCancel$.next();
    this.timerExist.set(false);
    this.displayTimer.set('');
    this.timer = 0;
  }
}

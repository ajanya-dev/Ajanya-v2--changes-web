import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef,
  MatDialog
} from '@angular/material/dialog';
import { Observable, Subscription, finalize, interval } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { NgClass, NgOptimizedImage } from '@angular/common';
import {
  faArrowLeft,
  faCopy,
  faDownload,
  faEnvelope,
  faMobile,
  faPrint,
  faCircleCheck,
  faUpload,
  faImage,
  faPlay,
  faQrcode,
  faEllipsis,
  faChevronUp,
  IconDefinition
} from '@fortawesome/pro-solid-svg-icons';
import {
  ISocialTarget,
  SOCIAL_TARGETS,
  socialShareUrl
} from 'src/app/shared/utils/social-share.util';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { ControlMessageComponent } from '../../components/control-message/control-message/control-message.component';
import { ValidationService } from '../../service/validation/validation.service';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { NewPhoneInputComponent } from '../../components/new-phone-input/new-phone-input.component';
import { PaymentsService } from '../../service/payments/payments.service';
import { AlertService } from '../../service/alert/alert.service';
import { CommonInputFieldComponent } from '../../v3/common-input-field/common-input-field.component';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { PusherService } from 'src/app/core/services/pusher.service';
import { IPusherEvent } from 'src/app/modules/auth/model/pusher';
import { LocalStorageService } from '../../service/storage/local-storage.service';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { Channel } from 'pusher-js';
import {
  IPaymentsProofPayload,
  IPodDetails
} from 'src/app/modules/payments/model/payments';
import { ShareSectionType } from '../v4-send-payment-proof-modal/v4-send-payment-proof-modal.component';

const SHARE_LABELS: Record<ShareSectionType, string> = {
  audit_log: 'Audit Log',
  comments: 'Comments',
  attachments: 'Attachments',
  remittance: 'Remittance',
  proof_of_delivery: 'Proof of Delivery'
};

@Component({
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
    NgClass,
    NgOptimizedImage,
    MatMenuModule,
    MatTooltip,
    CommonInputFieldComponent,
    TruncatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-send-payment-proof-modal',
  templateUrl: './send-payment-proof-modal.component.html',
  styleUrls: ['./send-payment-proof-modal.component.scss']
})
export class SendPaymentProofModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<SendPaymentProofModalComponent>);
  private clipBoard = inject(Clipboard);
  private paymentService = inject(PaymentsService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private matDialog = inject(MatDialog);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);

  public data: {
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
  } = inject(MAT_DIALOG_DATA);

  proofType: string = '';
  isCountryDropdownOpened: boolean = false;
  subscriptions: Subscription[] = [];
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);
  isCopyProofLoading: boolean = false;
  isPrinting: boolean = false;
  isWhatsappProofLoading: boolean = false;
  isMailProof: boolean = false;
  selectedSendMethod: 'email' | 'sms' | null = null;
  isUploadedViaMobileOrQrCode: boolean = false;

  podTab: 'request' | 'send' = 'request';

  notesControl = new FormControl('');

  mediaNeeded = signal(false);
  mediaPreview: string | null = null;
  mediaType: 'image' | 'video' | null = null;
  uploadedFile: File | null = null;
  showPreview: boolean = false;

  showPhoneInput: boolean = false;
  phoneIncr = 0;
  phoneNumberSending: boolean = false;
  phoneNumberButton = signal<string>('Upload from Phone');
  previousPhoneNumber: string = '';
  sendSuccessfully = false;
  isQRCodeLoading: boolean = false;
  pusherChannels: Channel[] = [];
  timerExist = false;
  displayTimer: string = '';
  timer: number = 0;
  qrDialogRef: MatDialogRef<QrCodeScannerModalComponent> | undefined =
    undefined;

  PUSHER_CHANNEL_NAME_PREFIX = 'zil-payment-pod-document-' as const;
  PUSHER_EVENT_NAME_PREFIX = 'zil-payment-pod-document-event-' as const;
  timerSubscription: Subscription | undefined;

  // POD attachment state
  uploadedFiles: any[] = [];
  uploadLoading = false;
  isSubmittingProof = signal(false);

  /**
   * icons
   */
  faXmark = faXmark;
  faEnvelope = faEnvelope;
  faCopy = faCopy;
  faMobile = faMobile;
  faArrowLeft = faArrowLeft;
  faPrint = faPrint;
  faCircleCheck = faCircleCheck;
  faUpload = faUpload;
  faImage = faImage;
  faPlay = faPlay;
  faQrcode = faQrcode;
  faEllipsis = faEllipsis;
  faChevronUp = faChevronUp;

  /**
   * share mode state
   */
  readonly socialTargets = SOCIAL_TARGETS;
  /** Share mode: the "More" row of social targets is expanded. */
  showMoreShare = signal(false);
  /** Key of the social target currently waiting on its link, or null. */
  sharingSocial = signal<string | null>(null);

  /** "Audit Log" / "Comments" / … — share mode only. */
  get shareLabel(): string {
    return SHARE_LABELS[this.data.shareType ?? 'audit_log'];
  }

  /**
   * proof sending types
   */
  proofsList: Array<{
    icon?: IconDefinition;
    name: string;
    action: string;
    isSVG?: string;
  }>;

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
    this.setProofList();
    if (this.data.mode === 'share') {
      this.setPayeeEmailAndPhone();
    }
    if (this.data.mode === 'pod') {
      this.setPayeeEmailAndPhone();
      if (this.podTab === 'send') {
        this.loadPodAttachments();
        if (this.data.payee?.email) {
          this.selectedSendMethod = 'email';
        } else if (this.data.payee?.phone) {
          this.selectedSendMethod = 'sms';
        }
      }
    }

    this.displayTimer = '';

    this.setupMobileUpload();

    this.configureDialogBehavior();
  }

  setupMobileUpload(): void {
    const userId = this.localStorageService.getItem('userId');
    const channelName = `attachment-from-phone-${userId}`;
    const eventName = 'attachment-from-phone-event';
    this.subscriptions.push(
      this.pusherService
        .getEvent(channelName, eventName)
        .subscribe((res: IPusherEvent) => {
          if (res?.event?.data?.user_id === userId) {
            this.alertService.successAlert({
              content: 'File uploaded successfully from mobile device',
              close: true,
              timeout: 1500
            });
          }
        })
    );
  }

  /**
   * Configure dialog behavior to prevent accidental closing during operations
   */
  configureDialogBehavior(): void {
    this.dialogRef.disableClose = true;

    this.subscriptions.push(
      this.dialogRef.backdropClick().subscribe(() => {
        if (this.isSubmittingProof() || this.uploadLoading) {
          this.alertService.failedAlert({
            content: 'Please wait for the current operation to complete.',
            close: true,
            timeout: 1500
          });
        } else {
          this.close();
        }
      })
    );

    this.subscriptions.push(
      this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (this.isSubmittingProof() || this.uploadLoading) {
            this.alertService.failedAlert({
              content: 'Please wait for the current operation to complete.',
              close: true,
              timeout: 1500
            });
          } else {
            this.close();
          }
        }
      })
    );
  }

  setProofList() {
    const allProofs = [
      {
        icon: faPrint,
        name: 'Print Receipt',
        action: 'print'
      },
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

    // Share mode keeps all six tiles; only "Print Receipt" is payment-proof
    // wording — an audit log or a remittance is just printed.
    if (this.data.mode === 'share') {
      this.proofsList = allProofs.map((proof) =>
        proof.action === 'print' ? { ...proof, name: 'Print' } : proof
      );
      return;
    }

    this.proofsList =
      this.data.mode === 'pod'
        ? allProofs.filter(
            (proof) =>
              !['Print Receipt', 'Copy Link', 'Download', 'Whatsapp'].includes(
                proof.name
              )
          )
        : allProofs;
    if (
      this.data?.uuId &&
      this.data?.checkStatus?.value === 'Mailed' &&
      this.data?.isMailProof &&
      this.data.mode === 'pp'
    ) {
      this.proofsList[0].name = 'Proof of Mail';
    }
    if (this.data.isMailProof) {
      this.isMailProof = true;
    }
  }

  setPayeeEmailAndPhone() {
    this.sendEmail.setValue(this.data.payee?.email);
    this.sendPhoneNumber.setValue(this.data.payee?.phone);
  }

  /**
   * Set POD tab
   */
  setPodTab(tab: 'request' | 'send') {
    this.podTab = tab;
  }

  /**
   * Handle send method selection change
   */
  onSendMethodChange(method: 'email' | 'sms') {
    this.selectedSendMethod = method;
    if (method === 'email') {
      this.sendPhoneNumber.setErrors(null);
    } else {
      this.sendEmail.setErrors(null);
    }
  }

  submitPodProof() {
    if (!this.selectedSendMethod && !this.isUploadedViaMobileOrQrCode) {
      this.alertService.failedAlert({
        content: 'Please select a send method (Email or SMS)',
        close: true,
        timeout: 1500
      });
      return;
    }

    if (this.selectedSendMethod === 'email') {
      if (!this.sendEmail.value || this.sendEmail.invalid) {
        this.sendEmail.markAsTouched();
        this.alertService.failedAlert({
          content: 'Please enter a valid email address',
          close: true,
          timeout: 1500
        });
        return;
      }
    } else if (this.selectedSendMethod === 'sms') {
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

    if (!this.isUploadedViaMobileOrQrCode && !this.uploadedFile) {
      this.mediaNeeded.set(true);
      this.alertService.failedAlert({
        content: 'Please upload an image or video file',
        close: true,
        timeout: 1500
      });
      return;
    }

    if (this.isUploadedViaMobileOrQrCode) {
      this.submitPodProofWithMobileUpload();
    } else {
      this.convertFileToBase64AndUpload(this.uploadedFile as File);
    }
  }

  /**
   * Media upload methods
   */
  chooseMedia(fileInput: HTMLInputElement) {
    fileInput.value = '';
    fileInput.click();
  }

  mediaPicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadedFile = null;
      this.mediaPreview = null;
      this.mediaType = null;
      this.showPreview = false;

      this.stopTimer();

      this.isUploadedViaMobileOrQrCode = false;

      this.handleImageFile(file);
      if (this.data.mode === 'pod' && this.podTab === 'send') {
        this.showPhoneInput = false;
        this.loadPhoneBtnLabel();
      }
    }
  }

  handleImageFile(file: File) {
    if (file.type.startsWith('image/')) {
      this.mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      this.mediaType = 'video';
    } else {
      this.alertService.failedAlert({
        content: 'Please select an image or video file',
        close: true,
        timeout: 1500
      });
      return;
    }

    this.uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.mediaPreview = e.target?.result as string;
      this.mediaNeeded.set(false);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeMedia(resetInput: boolean = true) {
    this.uploadedFile = null;
    this.mediaPreview = null;
    this.mediaType = null;
    this.showPreview = false;
    if (resetInput) {
      const fileInput = document.getElementById('file1') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
    this.cdr.detectChanges();
  }

  addWithMobileDevice(): void {
    this.mediaNeeded.set(false);
    this.mediaPreview = null;
    this.mediaType = null;
    this.uploadedFile = null;
    this.showPreview = false;
    const fileInput = document.getElementById('file1') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
    this.showPhoneInput = true;
    this.sendPhoneNumber.markAsTouched();
    this.loadPhoneBtnLabel();
    if (this.sendPhoneNumber.invalid) {
      this.phoneIncr += 1;
      return;
    }
    this.previousPhoneNumber = this.sendPhoneNumber.value as string;
    if (this.phoneIncr !== 0) {
      this.phoneNumberSending = true;
      this.loadPhoneBtnLabel();
      this.submitPhoneNumber();
    }
    this.phoneIncr += 1;
  }

  submitPhoneNumber(): void {
    const paymentId = this.data.uuId || '0';

    this.subscriptions.push(
      this.paymentService
        .uploadPodFromPhone({
          documentType: ['pod'],
          encryptedId: paymentId,
          uu_id: paymentId,
          requestType: 'sms',
          phone: this.sendPhoneNumber.value as string
        })
        .pipe(
          finalize(() => {
            this.phoneNumberSending = false;
            this.loadPhoneBtnLabel();
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.sendSuccessfully = true;
              this.startTimer(300);
              this.subscribePusherForAttachments(res.data.uuid as string);
              this.cdr.detectChanges();
              setTimeout(() => {
                this.sendSuccessfully = false;
                this.cdr.detectChanges();
              }, 3500);
            } else {
              this.startTimer(0);
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            this.startTimer(0);
            this.cdr.detectChanges();
          }
        })
    );
  }

  loadPhoneBtnLabel(): void {
    if (
      this.previousPhoneNumber === this.sendPhoneNumber.value &&
      !this.phoneNumberSending
    ) {
      this.phoneNumberButton.set('Resend');
    } else if (this.phoneNumberSending) {
      this.phoneNumberButton.set('Sending');
    } else if (
      this.showPhoneInput &&
      this.previousPhoneNumber !== this.sendPhoneNumber.value
    ) {
      this.phoneNumberButton.set('Send Link');
    } else {
      this.phoneNumberButton.set('Upload from Phone');
    }
  }

  openQrCodeModal() {
    this.mediaNeeded.set(false);
    this.mediaPreview = null;
    this.mediaType = null;
    this.uploadedFile = null;
    this.showPreview = false;
    this.showPhoneInput = false;
    this.loadPhoneBtnLabel();
    // Reset the file input when switching to QR code upload
    const fileInput = document.getElementById('file1') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
    if (this.isQRCodeLoading) {
      return;
    }
    this.isQRCodeLoading = true;

    const openQrCodeModal = (link: string) =>
      this.matDialog.open(QrCodeScannerModalComponent, {
        width: '322px',
        height: '445px',
        data: {
          link
        }
      });

    const paymentId = this.data.uuId || '0';

    this.subscriptions.push(
      this.paymentService
        .uploadPodFromPhone({
          documentType: ['pod'],
          encryptedId: this.data.encryptedId,
          uu_id: paymentId,
          requestType: 'qr'
        })
        .pipe(
          finalize(() => {
            this.isQRCodeLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.qrDialogRef = openQrCodeModal(res.data.link as string);
              this.subscribePusherForAttachments(res.data.uuid as string);
            } else {
              this.alertService.failedAlert({
                content: 'Failed to generate QR code',
                close: true,
                timeout: 1500
              });
            }
          },
          error: (err) => {
            this.alertService.failedAlert({
              content: 'Failed to generate QR code',
              close: true,
              timeout: 1500
            });
          }
        })
    );
  }

  subscribePusherForAttachments(typeId: string) {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + typeId;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + typeId;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (res: any) => {
          if (res && res.document_info && res.document_info.length > 0) {
            this.isUploadedViaMobileOrQrCode = true;
            this.uploadedFiles.push(res.document_info[0]);
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

  /**
   * @description This function countdown from the time we given as param (output format 'hh:mm:ss')
   * @param time The no of seconds
   */
  startTimer(time: number) {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.timer = time;
    this.timerExist = time > 0;

    if (time > 0) {
      this.updateTimerDisplay();
    }

    const source = interval(1000);

    this.timerSubscription = source.subscribe(() => {
      if (this.timer > 0) {
        this.timer -= 1;
        this.updateTimerDisplay();
        this.cdr.detectChanges();
      } else {
        this.timerExist = false;
        this.displayTimer = '';
        if (this.timerSubscription) {
          this.timerSubscription.unsubscribe();
          this.timerSubscription = undefined;
        }
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Update the timer display string
   */
  private updateTimerDisplay(): void {
    const hours = Math.floor(this.timer / 3600);
    const minutes = Math.floor((this.timer % 3600) / 60);
    const seconds = this.timer % 60;
    this.displayTimer = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Stop and reset the timer
   */
  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.timerExist = false;
    this.displayTimer = '';
    this.timer = 0;
    this.cdr.detectChanges();
  }

  /**
   * method for for managing send proof action
   */
  sendProof(action: string) {
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
      default:
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
  shareSection(action: string) {
    switch (action) {
      case 'email':
        this.emailProof();
        break;
      case 'sms':
        this.smsProof();
        break;
      case 'print':
      case 'download':
        if (action === 'print') this.isPrinting = true;
        this.requestShareUrl(
          'download',
          () => {
            if (action === 'print') this.isPrinting = false;
          },
          (url) => {
            window.open(url, '_blank');
            this.close();
          }
        );
        break;
      case 'copy':
        this.isCopyProofLoading = true;
        this.requestShareUrl(
          'link',
          () => {
            this.isCopyProofLoading = false;
          },
          (url) => {
            this.clipBoard.copy(url);
            this.alertService.successAlert({
              content: 'Link Copied Successfully.',
              close: true,
              timeout: 1500
            });
            this.close();
          }
        );
        break;
      case 'whatsapp':
        this.isWhatsappProofLoading = true;
        this.requestShareUrl(
          'link',
          () => {
            this.isWhatsappProofLoading = false;
          },
          (url) => {
            window.open(
              `https://web.whatsapp.com/send?text=${encodeURIComponent(this.shareMessage(url))}`,
              '_blank'
            );
          }
        );
        break;
      default:
        break;
    }
  }

  /**
   * A social target in the "More" row. Same flow as the WhatsApp tile: ask the
   * API for a `link`, then hand that link to the network's web share intent.
   */
  shareToSocial(target: ISocialTarget) {
    if (!this.data.uuId || this.sharingSocial()) return;
    this.sharingSocial.set(target.key);

    this.subscriptions.push(
      this.socialLink$()
        .pipe(
          finalize(() => {
            this.sharingSocial.set(null);
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              window.open(socialShareUrl(target.key, res.data, this.shareTitle()), '_blank');
            }
          }
        })
    );
  }

  /**
   * The link a social target posts — from the same source the Copy Link and
   * WhatsApp tiles already use in each mode. Payment-proof callers on the
   * classic pages open this modal without a `mode`, so anything that is not
   * `share` is a payment proof here.
   */
  private socialLink$(): Observable<IApiRes<string>> {
    if (this.data.mode === 'share') {
      return this.paymentService.sendSharedSection(
        this.data.uuId,
        this.sharePayload('link')
      );
    }
    return this.isMailProof
      ? this.v3PaymentsTableService.getProofOfPaymentForMailed(this.data.uuId)
      : this.paymentService.sendPaymentProof(this.data.uuId, { type: 'link' });
  }

  /** WhatsApp message — asterisks are WhatsApp's own bold markup. */
  private shareMessage(url: string): string {
    const label = this.shareLabel;
    return `*${label}* \n Please find the ${label.toLowerCase()} for your payment of $${this.data.amount} here : \n ${url}`;
  }

  /**
   * One-line caption for networks that take a plain title, not rich text.
   * Some callers open the modal without an amount, so it is left off then
   * rather than printing "$undefined".
   */
  private shareTitle(): string {
    const label =
      this.data.mode === 'share' ? this.shareLabel : 'Payment Confirmation';
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
    done: () => void,
    open: (url: string) => void
  ) {
    if (!this.data.uuId) {
      done();
      return;
    }

    this.subscriptions.push(
      this.paymentService
        .sendSharedSection(this.data.uuId, this.sharePayload(type))
        .pipe(
          finalize(() => {
            done();
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success && res.data) open(res.data);
          }
        })
    );
  }

  /** Share via email/SMS — reached from the Email/SMS step, after validation. */
  private sendShareTo(type: 'email' | 'sms') {
    if (!this.data.uuId) return;

    const loading =
      type === 'email' ? this.isEmailProofLoading : this.isSMSProofLoading;
    loading.set(true);

    this.subscriptions.push(
      this.paymentService
        .sendSharedSection(this.data.uuId, {
          ...this.sharePayload(type),
          ...(type === 'email'
            ? { email: this.sendEmail.value as string }
            : { phone: this.sendPhoneNumber.value as string })
        })
        .pipe(finalize(() => loading.set(false)))
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
        })
    );
  }

  setListNames(action: string, name: string) {
    this.proofsList = this.proofsList.map((item) => {
      if (item.action === action) {
        return { ...item, name };
      }
      return item;
    });
  }

  /**
   * method for downloading payment proof
   */
  downloadProof() {
    if (this.data.uuId) {
      this.setListNames('download', 'Downloading..');
      this.subscriptions.push(
        this.paymentService
          .sendPaymentProof(this.data.uuId, {
            type: 'download'
          })
          .pipe(
            finalize(() => {
              this.setListNames('download', 'Download');
              this.cdr.detectChanges();
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                window.open(res.data, '_blank');
                const data = {
                  content: 'Downloaded Successfully.',
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
  }

  /**
   * @returns redirect to the pdf web page
   */
  downloadProofOfPayment() {
    if (this.data?.uuId) {
      this.isPrinting = true;
      if (
        this.data?.checkStatus &&
        this.data?.checkStatus.value === 'Mailed' &&
        this.data?.isMailProof
      ) {
        this.subscriptions.push(
          this.v3PaymentsTableService
            .getProofOfPaymentForMailed(this.data?.uuId)
            .pipe(
              finalize(() => {
                this.isPrinting = false;
                this.cdr.detectChanges();
              })
            )
            .subscribe((res) => {
              if (res) {
                this.close();
                window.open(res.data, '_blank');
              }
            })
        );
        return;
      }

      this.subscriptions.push(
        this.v3PaymentsTableService
          .getProofOfPayment(this.data?.uuId)
          .pipe(
            finalize(() => {
              this.isPrinting = false;
              this.cdr.detectChanges();
            })
          )
          .subscribe((res) => {
            if (res) {
              this.close();
              window.open(res.data, '_blank');
            }
          })
      );
    }
  }

  /**
   * method for copying payment proof
   */
  copyProof() {
    this.proofType = '';
    if (this.data.uuId) {
      if (!this.data?.isMailProof) {
        this.isCopyProofLoading = true;
        this.subscriptions.push(
          this.paymentService
            .sendPaymentProof(this.data.uuId, {
              type: 'link'
            })
            .pipe(
              finalize(() => {
                this.isCopyProofLoading = false;
                this.cdr.detectChanges();
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.clipBoard.copy(res.data);
                  const data = {
                    content: 'Link Copied Successfully.',
                    close: true,
                    timeout: 1500
                  };
                  this.alertService.successAlert(data);
                  this.close();
                }
                this.isCopyProofLoading = false;
              },
              error: (err) => {
                if (err) {
                  this.isCopyProofLoading = false;
                }
              }
            })
        );
      } else {
        this.isCopyProofLoading = true;
        this.subscriptions.push(
          this.v3PaymentsTableService
            .getProofOfPaymentForMailed(this.data?.uuId)
            .pipe(
              finalize(() => {
                this.isCopyProofLoading = false;
                this.cdr.detectChanges();
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.clipBoard.copy(res.data);
                const data = {
                  content: 'Link Copied Successfully.',
                  close: true,
                  timeout: 1500
                };
                this.alertService.successAlert(data);
                this.close();
              }
              this.isCopyProofLoading = false;
            })
        );
      }
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

    if (this.data.mode === 'pod') {
      this.requestPod('email');
      return;
    }
    if (this.data.mode === 'share') {
      this.sendShareTo('email');
      return;
    }
    if (this.data.uuId) {
      this.isEmailProofLoading.set(true);
      if (!this.isMailProof) {
        this.subscriptions.push(
          this.paymentService
            .sendPaymentProof(this.data.uuId, {
              type: 'email',
              email: this.sendEmail.value as string
            })
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
      } else {
        this.subscriptions.push(
          this.paymentService
            .sendMailPaymentProof(this.data.uuId, {
              type: 'email',
              email: this.sendEmail.value as string
            })
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
    }
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
    if (this.data.mode === 'pod') {
      this.requestPod('sms');
      return;
    }
    if (this.data.mode === 'share') {
      this.sendShareTo('sms');
      return;
    }
    if (this.data.uuId) {
      this.isSMSProofLoading.set(true);
      if (!this.isMailProof) {
        this.subscriptions.push(
          this.paymentService
            .sendPaymentProof(this.data.uuId, {
              type: 'sms',
              phone: this.sendPhoneNumber.value as string
            })
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
      } else {
        this.subscriptions.push(
          this.paymentService
            .sendMailPaymentProof(this.data.uuId, {
              type: 'sms',
              phone: this.sendPhoneNumber.value as string
            })
            .pipe(
              finalize(() => {
                this.isSMSProofLoading.set(false);
                this.cdr.detectChanges();
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
    }
  }

  /**
   * Methods for whatsapp payment Proof
   */
  whatsappProof() {
    this.proofType = '';
    if (this.data.uuId) {
      if (!this.isMailProof) {
        this.isWhatsappProofLoading = true;
        this.subscriptions.push(
          this.paymentService
            .sendPaymentProof(this.data.uuId, {
              type: 'link'
            })
            .pipe(
              finalize(() => {
                this.isWhatsappProofLoading = false;
                this.cdr.detectChanges();
              })
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
                this.isWhatsappProofLoading = false;
              },
              error: (err) => {
                if (err) {
                  this.isWhatsappProofLoading = false;
                }
              }
            })
        );
      } else {
        this.isWhatsappProofLoading = true;
        this.subscriptions.push(
          this.v3PaymentsTableService
            .getProofOfPaymentForMailed(this.data?.uuId)
            .pipe(
              finalize(() => {
                this.isWhatsappProofLoading = false;
                this.cdr.detectChanges();
              })
            )
            .subscribe((res) => {
              if (res.success) {
                const textToSend = `*Payment Confirmation* \n Your payment of $${this.data.amount} has been processed. Please find the proof of payment here : \n ${res.data}`;
                window.open(
                  `https://web.whatsapp.com/send?text=${encodeURIComponent(textToSend)}`,
                  '_blank'
                );
              }
              this.isWhatsappProofLoading = false;
            })
        );
      }
    }
  }

  requestPod(type: 'email' | 'sms') {
    if (this.data.uuId) {
      if (type === 'email') {
        this.isEmailProofLoading.set(true);
      } else {
        this.isSMSProofLoading.set(true);
      }
      this.subscriptions.push(
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
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                const data = {
                  content:
                    type === 'email'
                      ? 'Email send Successfully'
                      : 'SMS send Successfully',
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

  // Load POD attachments
  loadPodAttachments() {
    if (this.data.uuId) {
      this.uploadLoading = true;
      this.subscriptions.push(
        this.paymentService
          .getPodFile('zil-payments', this.data.uuId)
          .pipe(
            finalize(() => {
              this.uploadLoading = false;
              this.cdr.detectChanges();
            })
          )
          .subscribe((res: { success: boolean; data: IPodDetails[] }) => {
            if (res?.success) {
              this.uploadedFiles = res.data || [];
            }
          })
      );
    }
  }

  /**
   * Submit POD proof when file is already uploaded via mobile or QR code
   */
  submitPodProofWithMobileUpload() {
    if (!this.data.uuId || !this.uploadedFiles.length) {
      this.alertService.failedAlert({
        content: 'No uploaded file found',
        close: true,
        timeout: 1500
      });
      return;
    }

    this.isSubmittingProof.set(true);
    this.uploadLoading = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('type', this.selectedSendMethod || '');
    formData.append('email', this.sendEmail.value || '');
    formData.append('phone', this.sendPhoneNumber.value || '');
    formData.append('description', this.notesControl.value || '');
    formData.append('uu_id', this.data.uuId || '');
    formData.append('pod_document_id', this.uploadedFiles[0].id);

    this.subscriptions.push(
      this.paymentService
        .uploadPodAttachment(this.data.uuId, formData)
        .pipe(
          finalize(() => {
            this.isSubmittingProof.set(false);
            this.uploadLoading = false;
            this.cdr.detectChanges();
          })
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
        })
    );
  }

  /**
   * Convert file to base64 and upload POD attachment
   */
  convertFileToBase64AndUpload(file: File) {
    if (!this.data.uuId || !file) {
      this.alertService.failedAlert({
        content: 'Invalid file or payment ID',
        close: true,
        timeout: 1500
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this.alertService.failedAlert({
        content: 'File size too large. Please choose a file smaller than 10MB.',
        close: true,
        timeout: 1500
      });
      return;
    }

    this.isSubmittingProof.set(true);
    this.uploadLoading = true;
    this.cdr.detectChanges();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const base64String = e.target?.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];

        if (!base64Data) {
          throw new Error('Failed to convert file to base64');
        }

        this.uploadPodAttachmentWithBase64(file, base64Data);
      } catch (error) {
        this.isSubmittingProof.set(false);
        this.uploadLoading = false;
        this.cdr.detectChanges();
        this.alertService.failedAlert({
          content: 'Failed to process file. Please try again.',
          close: true,
          timeout: 1500
        });
      }
    };

    reader.onerror = () => {
      this.isSubmittingProof.set(false);
      this.uploadLoading = false;
      this.cdr.detectChanges();
      this.alertService.failedAlert({
        content: 'Failed to read file. Please try again.',
        close: true,
        timeout: 1500
      });
    };

    reader.readAsDataURL(file);
  }

  /**
   * Upload POD attachment with base64 data
   */
  uploadPodAttachmentWithBase64(file: File, base64Data: string) {
    const formData = new FormData();
    formData.append('type', this.selectedSendMethod || '');
    formData.append('email', this.sendEmail.value || '');
    formData.append('phone', this.sendPhoneNumber.value || '');
    formData.append('description', this.notesControl.value || '');
    formData.append('uu_id', this.data.uuId || '');
    formData.append('pod', file, file.name);
    if (this.isUploadedViaMobileOrQrCode) {
      formData.append('pod_document_id', this.uploadedFiles[0].id);
    }

    this.subscriptions.push(
      this.paymentService
        .uploadPodAttachment(this.data.uuId, formData)
        .pipe(
          finalize(() => {
            this.isSubmittingProof.set(false);
            this.uploadLoading = false;
            this.cdr.detectChanges();
          })
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
        })
    );
  }

  uploadPodAttachment(file: File) {
    if (!this.data.uuId || !file) return;
    this.uploadLoading = true;
    const formData = new FormData();
    formData.append('type', this.selectedSendMethod || '');
    formData.append('email', this.sendEmail.value || '');
    formData.append('phone', this.sendPhoneNumber.value || '');
    formData.append('description', this.notesControl.value || '');
    formData.append('uu_id', this.data.uuId || '');
    formData.append('pod', file, file.name);

    this.subscriptions.push(
      this.paymentService
        .uploadPodAttachment(this.data.uuId, formData)
        .pipe(
          finalize(() => {
            this.uploadLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (res: { success: boolean }) => {
            if (res?.success) {
              this.alertService.successAlert({
                content: 'File uploaded successfully',
                close: true,
                timeout: 1500
              });
              this.close();
            } else {
              this.alertService.failedAlert({
                content: 'Upload failed',
                close: true,
                timeout: 1500
              });
              this.close();
            }
          }
        })
    );
  }

  deletePodAttachment(attachmentId: string) {
    if (!this.data.uuId || !attachmentId) return;
    this.uploadLoading = true;
    this.subscriptions.push(
      this.paymentService
        .deletePodAttachment(this.data.uuId, attachmentId)
        .pipe(
          finalize(() => {
            this.uploadLoading = false;
            this.cdr.detectChanges();
            this.isUploadedViaMobileOrQrCode = false;
          })
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
        })
    );
  }

  trackByAttachmentId(index: number, item: any) {
    return item.id;
  }

  openPodAttachment(id: string) {
    if (!this.data.uuId || !id) return;
    this.paymentService
      .downloadPodFile('zil-payments', this.data.uuId, id)
      .subscribe((res: any) => {
        if (res?.success && res.data) {
          window.open(res.data, '_blank');
        }
      });
  }

  ngOnDestroy() {
    this.isSubmittingProof.set(false);
    this.uploadLoading = false;

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    if (this.qrDialogRef) {
      this.qrDialogRef.close();
    }

    this.pusherChannels.forEach((channel) => {
      channel.unsubscribe();
    });
  }
}

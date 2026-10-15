import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { NgClass } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import {
  CircleCheck,
  Image,
  LucideAngularModule,
  PenLine,
  Phone,
  QrCode,
  Upload,
  X
} from 'lucide-angular';
import { Subscription, finalize, interval, takeWhile } from 'rxjs';
import { Channel } from 'pusher-js';

import { IDocumentInfo } from 'src/app/models/bank';
import { PusherService } from 'src/app/core/services/pusher.service';
import { QrCodeScannerModalV4Component } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/v4/qr-code-scanner-modal-v4.component';
import { IPodPusherResponse } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { RequestPaymentsService } from '../../service/RequestPayments/request-payments.service';
import { V4AlertService } from '../../service/alert/v4-alert.service';
import { ValidationService } from '../../service/validation/validation.service';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from '../../V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from '../../V4/v4-phone-input/v4-phone-input.component';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { signatureUploadPanelComponent } from '../../components/upload-panel/signature-upload-panel/signature-upload-panel.component';

export interface IV4AddProofOfDeliveryModalData {
  uuId: string;
  encryptedId: string;
}

@Component({
  selector: 'app-v4-add-proof-of-delivery-modal',
  templateUrl: './v4-add-proof-of-delivery-modal.component.html',
  styleUrls: ['./v4-add-proof-of-delivery-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    TruncatePipe,
    MatTooltip
  ]
})
export class V4AddProofOfDeliveryModalComponent implements OnInit, OnDestroy {
  // DI
  private dialogRef = inject(MatDialogRef<V4AddProofOfDeliveryModalComponent>);
  public data: IV4AddProofOfDeliveryModalData = inject(MAT_DIALOG_DATA);
  private requestPaymentsService = inject(RequestPaymentsService);
  private alertService = inject(V4AlertService);
  private matDialog = inject(MatDialog);
  private pusherService = inject(PusherService);
  private destroyRef = inject(DestroyRef);

  // Lucide icons
  readonly XIcon = X;
  readonly PhoneIcon = Phone;
  readonly UploadIcon = Upload;
  readonly QrCodeIcon = QrCode;
  readonly CircleCheckIcon = CircleCheck;
  readonly ImageIcon = Image;
  readonly PenLineIcon = PenLine;

  // Send type
  sendType = signal<'email' | 'sms'>('email');

  // Loading signals
  isSmsLoading = signal(false);
  isQrLoading = signal(false);
  isSubmitting = signal(false);
  isResendLink = signal(false);

  // Error state
  showError = signal({ imageError: false, signError: false });

  // Media state
  mediaPreview = signal<string | null>(null);
  mediaType = signal<'image' | 'video' | null>(null);
  uploadedFile = signal<File | null>(null);
  showPreview = signal(false);

  // Mobile upload
  podFromPhone = signal<IDocumentInfo[]>([]);

  // QR caching
  qrCodeLink = signal<string | undefined>(undefined);

  // Signature
  signaturePadImg = signal('');
  signatureUrl = '';

  // SMS countdown
  smsCountdown = signal('');
  countdown = signal(-1);
  smsCountdownSubscription: Subscription | null = null;

  // Pusher
  private pusherChannels: Channel[] = [];
  private qrDialogRef: MatDialogRef<QrCodeScannerModalV4Component> | undefined;

  private readonly PUSHER_CHANNEL_NAME_PREFIX =
    'received-checklist-pod-document-' as const;

  private readonly PUSHER_EVENT_NAME_PREFIX =
    'received-checklist-pod-document-event-' as const;

  // proofsList
  readonly proofsList = [
    { icon: this.PhoneIcon, name: 'Send Link', action: 'sms' as const },
    { icon: this.QrCodeIcon, name: 'QR Code', action: 'qr' as const }
  ];

  // Form
  podForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      ValidationService.emailValidator
    ]),
    phone: new FormControl('', [Validators.minLength(10)]),
    notes: new FormControl('')
  });

  // Lifecycle
  ngOnInit(): void {
    this.configureDialogBehavior();
  }

  private configureDialogBehavior(): void {
    this.dialogRef.disableClose = true;

    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isSubmitting()) {
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
          if (this.isSubmitting()) {
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

  // Navigation
  close(): void {
    this.dialogRef.close();
  }

  countryChange(_event: { isOpen: boolean }): void {
    // kept for phone input compatibility
  }

  // Send type
  changeType(event: { value: string }): void {
    this.sendType.set(event.value as 'email' | 'sms');
    if (this.sendType() === 'email') {
      this.podForm.controls.email.addValidators(Validators.required);
      this.podForm.controls.phone.clearValidators();
    } else {
      this.podForm.controls.phone.addValidators(Validators.required);
      this.podForm.controls.email.clearValidators();
    }
    const controls = ['email', 'phone'] as const;
    controls.forEach((el) =>
      this.podForm.controls[el].updateValueAndValidity()
    );
  }

  // Mobile upload — Send Link or QR Code
  sendProof(action: 'sms' | 'qr'): void {
    this.uploadFromPhone(action);
  }

  uploadFromPhone(type: string): void {
    const openQrModal = (link: string) =>
      this.matDialog.open(QrCodeScannerModalV4Component, {
        width: '322px',
        panelClass: 'paddingless-modal-rounded',
        data: { link }
      });

    if (type === 'qr' && this.qrCodeLink()) {
      this.qrDialogRef = openQrModal(this.qrCodeLink() as string);
      return;
    }

    const payload = {
      requestType: type,
      uu_id: this.data.uuId,
      encryptedId: this.data.encryptedId,
      documentType: ['pod']
    };

    if (type === 'sms') {
      this.isSmsLoading.set(true);
      this.isResendLink.set(false);
    } else {
      this.isQrLoading.set(true);
    }

    this.requestPaymentsService
      .uploadPodFromPhone(payload)
      .pipe(
        finalize(() => {
          if (type === 'sms') {
            this.isSmsLoading.set(false);
          } else {
            this.isQrLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.qrCodeLink.set(res.data.data.link);
          this.subscribePusher(res.data.data.id);
          if (type === 'qr') {
            this.qrDialogRef = openQrModal(res.data.data.link);
          } else {
            this.alertService.successAlert({
              content: `Link sent to your verified phone number ${res.data.data.phoneNumber}`,
              close: true,
              timeout: 2000
            });
            this.startSmsCountdown();
          }
        }
      });
  }

  private startSmsCountdown(): void {
    this.smsCountdownSubscription?.unsubscribe();
    this.countdown.set(59);
    this.updateCountdownString();

    this.smsCountdownSubscription = interval(1000)
      .pipe(takeWhile(() => this.countdown() >= 0))
      .subscribe(() => {
        this.countdown.update((v) => v - 1);
        this.updateCountdownString();

        if (this.countdown() < 0) {
          this.smsCountdownSubscription?.unsubscribe();
          this.smsCountdown.set('');
          this.isResendLink.set(true);
        } else {
          this.isResendLink.set(false);
        }
      });
  }

  private updateCountdownString(): void {
    const minutes = Math.floor(this.countdown() / 60);
    const seconds = this.countdown() % 60;
    this.smsCountdown.set(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }

  private subscribePusher(id: string): void {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + id;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + id;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (data: IPodPusherResponse) => {
          this.qrDialogRef?.close();
          this.podFromPhone.set(data.document_info);
        })
    );
  }

  // File upload
  chooseMedia(fileInput: HTMLInputElement): void {
    const input = fileInput;
    input.value = '';
    input.click();
  }

  mediaPicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.podFromPhone.set([]);
    this.qrCodeLink.set(undefined);

    if (file.type.startsWith('image/')) {
      this.mediaType.set('image');
    } else if (file.type.startsWith('video/')) {
      this.mediaType.set('video');
    } else {
      this.showError.update((c) => ({ ...c, imageError: true }));
      this.alertService.failedAlert({
        content: 'Please select an image or video file',
        close: true,
        timeout: 1500
      });
      return;
    }

    this.uploadedFile.set(file);
    this.showError.update((c) => ({ ...c, imageError: false }));
    const reader = new FileReader();
    reader.onload = (e) => this.mediaPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removeMedia(): void {
    this.uploadedFile.set(null);
    this.mediaPreview.set(null);
    this.mediaType.set(null);
    this.showPreview.set(false);
    this.showError.update((c) => ({ ...c, imageError: false }));
    const fileInput = document.getElementById(
      'v4-pod-file-upload'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // Signature
  addSignature(): void {
    if (this.signaturePadImg() !== '') return;
    const dialogRef = this.matDialog.open(signatureUploadPanelComponent, {
      maxWidth: '690px',
      width: '93%',
      panelClass: 'upload_panel_wrapper',
      minHeight: '410px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((signImg) => {
      if (signImg) {
        this.showError.update((c) => ({ ...c, signError: false }));
        this.signatureUrl = signImg.signatureUrl || '';
        if (signImg.signPad) this.signaturePadImg.set(signImg.signPad);
        if (signImg.existSign) {
          this.signaturePadImg.set(signImg.existSign);
          this.signatureUrl = signImg.existSign;
        }
        if (signImg.uploadSign) this.signaturePadImg.set(signImg.uploadSign);
        if (signImg.digitalSign) this.signaturePadImg.set(signImg.digitalSign);
      }
    });
  }

  removeSign(event: Event): void {
    event.stopPropagation();
    this.signaturePadImg.set('');
    this.showError.update((c) => ({ ...c, signError: true }));
  }

  // Submit
  submit(): void {
    this.podForm.markAllAsTouched();

    if (this.signaturePadImg() === '') {
      this.showError.update((c) => ({ ...c, signError: true }));
    }

    const hasMedia = !!this.uploadedFile() || this.podFromPhone().length > 0;
    if (!hasMedia) {
      this.showError.update((c) => ({ ...c, imageError: true }));
    }

    if (
      this.podForm.invalid ||
      this.showError().imageError ||
      this.showError().signError
    ) {
      return;
    }

    const formValue = this.podForm.value;
    const formData = new FormData();
    formData.append('uu_id', this.data.uuId);
    formData.append('signature', this.signatureUrl);
    formData.append('description', formValue.notes || '');

    if (this.podFromPhone().length > 0) {
      formData.append('pod_document_id', this.podFromPhone()[0].document_id);
    } else {
      const file = this.uploadedFile();
      if (file) formData.append('pod', file);
    }

    if (this.sendType() === 'email') {
      formData.append('type', 'email');
      formData.append('email', formValue.email as string);
    } else {
      formData.append('type', 'sms');
      formData.append('phone', formValue.phone as string);
    }

    this.isSubmitting.set(true);
    this.requestPaymentsService
      .sendPod(formData)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: res.data,
            close: true,
            timeout: 1500
          });
          this.dialogRef.close(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.smsCountdownSubscription?.unsubscribe();
    this.qrDialogRef?.close();
    this.pusherChannels.forEach((ch) => ch.unsubscribe());
  }
}

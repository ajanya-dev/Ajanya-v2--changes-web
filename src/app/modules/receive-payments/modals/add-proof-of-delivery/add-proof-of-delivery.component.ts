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
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faPaperPlaneTop,
  faPenNib,
  faQrcode,
  faSpinner,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { Channel } from 'pusher-js';
import {
  finalize,
  interval,
  Subject,
  Subscription,
  takeUntil,
  takeWhile
} from 'rxjs';
import { PusherService } from 'src/app/core/services/pusher.service';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { signatureUploadPanelComponent } from 'src/app/shared/components/upload-panel/signature-upload-panel/signature-upload-panel.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { IDocumentInfo } from 'src/app/models/bank';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { IPodPusherResponse } from '../../model/ReceivePayment';

@Component({
  selector: 'app-add-proof-of-delivery',
  standalone: true,
  imports: [
    FaIconComponent,
    MatDialogClose,
    CommonButtonV35Component,
    MatRadioModule,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    NewPhoneInputComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonUploadButtonV35Component,
    NgClass,
    TruncatePipe
  ],
  templateUrl: './add-proof-of-delivery.component.html',
  styleUrl: './add-proof-of-delivery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProofOfDeliveryComponent implements OnDestroy {
  private matDialog = inject(MatDialog);
  private requestPaymentsService = inject(RequestPaymentsService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<AddProofOfDeliveryComponent>);
  private injectedData: { uuId: string; encryptedId: string } =
    inject(MAT_DIALOG_DATA);

  private pusherService = inject(PusherService);

  mediaPreview = signal<string | null>(null);
  mediaType = signal<'image' | 'video' | null>(null);
  sendType = signal('email');
  signaturePadImg = signal('');
  qrCodeLink = signal<string | undefined>(undefined);
  signatureUrl: string;
  uploadedFile: File | undefined = undefined;
  showPreview = signal(false);
  isSubmit = signal(false);
  isSmsLoading = signal(false);
  isQrLoading = signal(false);
  isResendLink = signal(false);
  destroy$ = new Subject();
  qrDialogRef: MatDialogRef<QrCodeScannerModalComponent> | undefined =
  undefined;
  
  smsCountdown = signal<string>('');
  countdown = signal<number>(-1);
  smsCountdownSubscription: Subscription | null = null;
  pusherChannels: Channel[] = [];
  podFromPhone = signal<IDocumentInfo[]>([]);
  showError = signal({
    imageError: false,
    signError: false
  });

  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;
  faCircleCheck = faCircleCheck;
  faPen = faPenNib;

  podForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      ValidationService.emailValidator
    ]),
    phone: new FormControl('', [Validators.minLength(10)]),
    notes: new FormControl('')
  });

  proofsList = [
    {
      icon: faPaperPlaneTop,
      name: 'Send Link',
      action: 'sms'
    },
    {
      icon: faQrcode,
      name: 'Qr code',
      action: 'qr'
    }
  ];

  PUSHER_CHANNEL_NAME_PREFIX = 'received-checklist-pod-document-';
  PUSHER_EVENT_NAME_PREFIX = 'received-checklist-pod-document-event-';

  changeType(event: { value: string }) {
    this.sendType.set(event.value);
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

  addSignature() {
    if (this.signaturePadImg() !== '') return;

    const dialogRef = this.matDialog.open(signatureUploadPanelComponent, {
      maxWidth: '690px',
      width: '93%',
      panelClass: 'upload_panel_wrapper',
      minHeight: '410px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((signImg) => {
      this.showError.update(current => ({ ...current, signError: false }));
      this.signatureUrl = signImg.signatureUrl;
      if (signImg) {
        if (signImg.signPad) {
          this.signaturePadImg.set(signImg.signPad);
        }
        if (signImg.existSign) {
          this.signaturePadImg.set(signImg.existSign);
          this.signatureUrl = signImg.existSign;
        }
        if (signImg.uploadSign) {
          this.signaturePadImg.set(signImg.uploadSign);
        }
        if (signImg.digitalSign) {
          this.signaturePadImg.set(signImg.digitalSign);
        }
      }
    });
  }

  removeSign(event: Event) {
    event.stopPropagation();
    this.signaturePadImg.set('');
    this.showError.update(current => ({ ...current, signError: true }));
  }

  filePicked(file: File) {
    if (file.type) {
      this.uploadedFile = file;
      this.showError.update(current => ({ ...current, imageError: false }));
      if (file.type.startsWith('image/')) {
        this.handleImageFile(file);
      } else if (file.type.startsWith('video/')) {
        this.handleVideoFile(file);
      }
    } else {
      this.uploadedFile = undefined;
      this.mediaPreview.set(null);
      this.mediaType.set(null);
      this.showPreview.set(false);
      this.showError.update(current => ({ ...current, imageError: true }));
    }
  }

  handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.mediaPreview.set((e.target as FileReader).result as string);
      this.mediaType.set('image');
    };
    reader.readAsDataURL(file);
  }

  handleVideoFile(file: File) {
    const videoURL = URL.createObjectURL(file);
    this.mediaPreview.set(videoURL);
    this.mediaType.set('video');
  }

  sendProof(action: 'sms' | 'qr') {
    this.uploadFromPhone(action);
  }

  uploadFromPhone(type: string) {
    const openQrCodeModal = (link: string) =>
      this.matDialog.open(QrCodeScannerModalComponent, {
        width: '322px',
        height: '445px',
        data: {
          link
        }
      });

    if (type === 'qr' && this.qrCodeLink()) {
      this.qrDialogRef = openQrCodeModal(this.qrCodeLink() as string);
      return;
    }

    const payload = {
      requestType: type,
      uu_id: this.injectedData.uuId,
      encryptedId: this.injectedData.encryptedId,
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

        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.qrCodeLink.set(res.data.data.link);
          this.subscribePusher(res.data.data.id);
          if (type === 'qr') {
            this.qrDialogRef = openQrCodeModal(res.data.data.link);
          } else {
            this.alertService.successAlert({
              content: `Link sent to your verified phone number ${res.data.data.phoneNumber}`,
              timeout: 2000
            });
            this.startSmsCountdown();
          }
        }
      });
  }

  startSmsCountdown() {
    this.countdown.set(59);
    this.updateCountdownString();

    this.smsCountdownSubscription = interval(1000)
      .pipe(takeWhile(() => this.countdown() >= 0))
      .subscribe(() => {
        this.countdown.update((value) => value - 1);
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

  private updateCountdownString() {
    const minutes = Math.floor(this.countdown() / 60);
    const seconds = this.countdown() % 60;
    this.smsCountdown.set(
      `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`
    );
  }

  subscribePusher(uuId: string) {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + uuId;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + uuId;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (data: IPodPusherResponse) => {          
          this.qrDialogRef?.close();
          this.podFromPhone.set(data.document_info);          
        })
    );
  }

  closePreview() {
    this.showPreview.set(false);
  }

  onClickPreview(event:string){
    if(event === 'custom'){
      this.showPreview.set(true);
    }
  }

  submit() {
    this.podForm.markAllAsTouched();

    if(this.signaturePadImg() === ''){
      this.showError.update(current => ({ ...current, signError: true }));    }

    if(!this.uploadedFile && !this.podFromPhone()?.length){
      this.showError.update(current => ({ ...current, imageError: true }));
    }

    if (
      this.podForm.invalid ||
      this.showError().imageError ||
      this.showError().signError
    ) {
      return;
    }

    const formValue = this.podForm.value;
    const note = formValue.notes as string;
    const email = formValue.email as string;
    const phone = formValue.phone as string;

    const formData = new FormData();
    formData.append('uu_id', this.injectedData.uuId);
    if (this.uploadedFile && !this.podFromPhone()?.length) {
      formData.append('pod', this.uploadedFile);
    }

    if (this.podFromPhone()?.length > 0) {
      formData.append('pod_document_id', this.podFromPhone()[0]?.document_id);
    }
    formData.append('signature', this.signatureUrl);
    formData.append('description', note);
    if (this.sendType() === 'email') {
      formData.append('type', 'email');
      formData.append('email', email);
    } else {
      formData.append('type', 'sms');
      formData.append('phone', phone);
    }

    this.isSubmit.set(true);
    this.requestPaymentsService
      .sendPod(formData)
      .pipe(
        finalize(() => {
          this.isSubmit.set(false);
          takeUntil(this.destroy$);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.data });
          this.dialogRef.close(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.smsCountdownSubscription?.unsubscribe();
    this.pusherChannels.forEach((el) => el.unsubscribe());
  }
}

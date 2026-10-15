import { NgClass, NgOptimizedImage } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCamera } from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleCheck,
  faCirclePlay,
  faImage,
  faPlus,
  faUpToLine,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import SignaturePad from 'signature_pad';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';

@Component({
  selector: 'app-proof-of-delivery',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FaIconComponent,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    NgClass,
    CommonUploadButtonV35Component,
    MatMenuModule,
    MatTooltip,
    TruncatePipe,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './proof-of-delivery.component.html',
  styleUrl: './proof-of-delivery.component.scss'
})
export class ProofOfDeliveryComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private appSettingsService = inject(AppSettingsService);
  public outsideService = inject(OutsideService);
  private alertService = inject(AlertService);
  private activatedRoute = inject(ActivatedRoute);

  @ViewChild('signPad') public signPad: ElementRef;
  signaturePad: SignaturePad;

  appConfig: IAppConfig;
  paymentId: string;
  isDrawing = signal(false);
  signatureNeeded = signal(false);
  mediaNeeded = signal(false);
  isSubmit = signal(false);
  isLoading = signal(false);
  linkExpired = signal(false);
  uploadCompleted = signal(false);
  isFromDesktop = signal(false);
  uuId: string;
  showPreview = false;
  notes: string;
  mediaPreview: string | null = null;
  mediaType: 'image' | 'video' | null = null;
  uploadedFile: File | undefined = undefined;
  isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  destroy$ = new Subject();
  faPlus = faPlus;
  faXmark = faXmark;
  faCamera = faCamera;
  faUpload = faUpToLine;
  faCircleCheck = faCircleCheck;
  faImage = faImage;
  faPlay = faCirclePlay;

  notesControl = new FormControl('');

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.signPad.nativeElement);
  }

  ngOnInit(): void {
    this.loadAppSettings();
    this.getPaymentId();
  }

  getPaymentId() {
    const id = this.activatedRoute?.snapshot?.queryParams?.id;
    const uuId = this.activatedRoute?.snapshot?.queryParams?.uuid;
    if (uuId) {
      this.getMetaData(uuId);
      this.uuId = uuId;
    }
    if (id) {
      this.paymentId = id;
    }
  }

  loadAppSettings(): void {
    this.appSettingsService.appConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      });
  }

  getMetaData(uuId: string) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.isLoading.set(true);
    this.outsideService
      .getPodMetaData(uuId, headerOptions)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data.documentType) {
            this.isFromDesktop.set(true);
          }
        },
        error: (err) => {
          if (err) {
            this.linkExpired.set(true);
          }
        }
      });
  }

  startDrawing(event: Event) {
    if (event) {
      this.isDrawing.set(true);
    }
  }

  moved(event: Event) {
    if (event) {
      this.isDrawing.set(true);
    }
  }

  stopDrawing() {
    this.isDrawing.set(false);
    this.signatureNeeded.set(false);
  }

  clearSign() {
    this.isDrawing.set(false);
    this.signaturePad.clear();
    this.signatureNeeded.set(true);
  }

  chooseMedia(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  mediaPicked(event: Event) {
    if (this.imageValidator(event)) {
      return;
    }
    if (event.target === null) return;
    const file = ((event.target as HTMLInputElement).files as FileList)[0];
    if (file) {
      this.uploadedFile = file;
      this.mediaNeeded.set(false);
      if (file.type.startsWith('image/')) {
        this.handleImageFile(file);
      } else if (file.type.startsWith('video/')) {
        this.handleVideoFile(file);
      }
    }
  }

  /**
   * @description This function checks if the size of the uploaded image exceeds a specified limit.
   * If the size is too large, it displays a failure alert.
   * @param {Event} event - The event containing the uploaded file.
   * @returns {boolean} Returns true if the image size exceeds the specified limit, otherwise false.
   */
  imageValidator(event: Event) {
    const divider = 1e6;
    if (
      ((event.target as HTMLInputElement).files as FileList)[0].size / divider >
      10
    ) {
      this.alertService.failedAlert({
        content: `The selected file size should be less than 10 MB`
      });
      return true;
    }
    return false;
  }

  handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.mediaPreview = (e.target as FileReader).result as string;
      this.mediaType = 'image';
    };
    reader.readAsDataURL(file);
  }

  handleVideoFile(file: File) {
    const videoURL = URL.createObjectURL(file);
    this.mediaPreview = videoURL;
    this.mediaType = 'video';
  }

  // Method to trigger camera capture
  triggerCameraCapture(inputElement: HTMLInputElement): void {
    inputElement.setAttribute('accept', 'image/*');
    inputElement.setAttribute('capture', 'camera');
    inputElement.click();
  }

  // Method to trigger video capture
  triggerVideoCapture(inputElement: HTMLInputElement): void {
    inputElement.setAttribute('accept', 'video/*');
    inputElement.setAttribute('capture', 'camcorder');
    inputElement.click();
  }

  removeMedia() {
    this.mediaPreview = null;
    this.mediaType = null;
    this.mediaNeeded.set(true);
    this.uploadedFile = undefined;
    this.showPreview = false;
  }

  submit() {
    if (!this.mediaPreview) {
      this.mediaNeeded.set(true);
    } else {
      this.mediaNeeded.set(false);
    }

    if (this.isFromDesktop()) {
      this.uploadPodFile();
      return;
    }
    if (this.signaturePad.isEmpty()) {
      this.signatureNeeded.set(true);
    } else {
      this.signatureNeeded.set(false);
    }

    if (this.mediaNeeded() || this.signatureNeeded()) return;

    const signature = this.signaturePad.toDataURL('image/png');
    const blob = this.dataURLtoBlob(signature);
    const file = new File([blob], 'signature.png', { type: 'image/png' });
    const note = this.notesControl.value as string;
    const formData = new FormData();
    formData.append('uu_id', this.paymentId);
    if (this.uploadedFile) {
      formData.append('pod', this.uploadedFile);
    }
    formData.append('signature', file);
    formData.append('description', note);
    this.isSubmit.set(true);
    this.outsideService
      .uploadPod(formData)
      .pipe(
        finalize(() => {
          this.isSubmit.set(false);
          takeUntil(this.destroy$);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.uploadCompleted.set(true);
        }
      });
  }

  dataURLtoBlob(dataURL: string): Blob {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i += 1) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  uploadPodFile() {
    if (this.mediaNeeded()) return;
    this.isSubmit.set(true);
    const formData = new FormData();
    formData.append('uuid', this.uuId);
    if (this.uploadedFile) {
      formData.append('pod', this.uploadedFile);
    }
    this.outsideService
      .uploadPodFile(formData)
      .pipe(
        finalize(() => {
          this.isSubmit.set(false);
          takeUntil(this.destroy$);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.uploadCompleted.set(true);
        }
      });
  }

  onGoToWebsite(): void {
    window.open(StaticWhiteLabelConditions.website);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

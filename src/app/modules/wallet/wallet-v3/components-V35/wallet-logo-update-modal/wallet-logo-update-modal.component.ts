import {
  Component,
  Inject,
  ViewChild,
  ElementRef,
  signal,
  inject,
  HostListener
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faCheck,
  faExclamationTriangle,
  faInfo,
  faUpload,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  ImageCroppedEvent,
  ImageCropperModule,
  ImageTransform
} from 'ngx-image-cropper';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IWalletData } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { finalize, take } from 'rxjs';

export interface LogoUploadDialogData {
  title?: string;
  subtitle?: string;
  wallet?: IWalletData;
  from?: string;
  existingLogo?: File;
  existingLogoUrl?: string;
}

@Component({
  selector: 'app-wallet-logo-update-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    CommonButtonV35Component,
    ImageCropperModule,
    FaIconComponent
  ],
  templateUrl: './wallet-logo-update-modal.component.html',
  styleUrl: './wallet-logo-update-modal.component.scss'
})
export class WalletLogoUpdateModalComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private alertService = inject(AlertService);
  private walletService = inject(WalletService);

  selectedFile: File | null = null;
  fileName: string = '';
  fileSize: string = '';
  isError: boolean = false;

  faInfo = faInfo;
  faCheck = faCheck;
  faUpload = faUpload;
  faXmark = faXmark;
  faArrowRight = faArrowRight;
  faExclamationTriangle = faExclamationTriangle;

  isDragOver: boolean = false;
  showUploadPage = signal(false);
  showSuggestions = signal(false);
  showDontAskAgain = signal(false);
  cropping = false;
  croppedImage: { url: string; blob: Blob | undefined } = {
    url: '',
    blob: undefined
  };

  imageChangedEvent: Event | { target: { files: FileList | File[] } } | null =
    null;

  transform: ImageTransform = {
    scale: 1,
    rotate: 0,
    flipH: false,
    flipV: false
  };

  loading = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LogoUploadDialogData,
    private dialogRef: MatDialogRef<WalletLogoUpdateModalComponent>
  ) {
    if (this.data.wallet?.logo) {
      this.showUploadPage.set(true);
    }
    
    // Handle existing logo for invoice edit mode
    if (this.data.from === 'invoice') {
      this.showUploadPage.set(true);
      
      if (this.data.existingLogo) {
        this.processFile(this.data.existingLogo, true);
      }
    }
    
    if (this.data.from === 'list') {
      this.showDontAskAgain.set(true);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
    this.isError = false;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.processFile(files[0]);
    }
  }

  processFile(file: File, skipValidation: boolean = false): void {
    if (!skipValidation) {
      if (!file.type.startsWith('image/')) {
        this.alertService.warningAlert({
          title: 'Error',
          doneMsg: 'OK',
          isOk: true,
          content: 'Please select an image file (jpg, jpeg, png)'
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.warningAlert({
          title: 'Error',
          doneMsg: 'OK',
          isOk: true,
          content: 'File size must be less than 2MB'
        });
        return;
      }
    }
    
    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.cropping = true;
    this.croppedImage = { url: '', blob: undefined };
    
    // Calculate appropriate scale to fit the image properly
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const minDimension = Math.min(img.width, img.height);
      const targetSize = 200; // Target crop size
      const optimalScale = minDimension < targetSize ? targetSize / minDimension : 1;
      
      this.transform = {
        scale: optimalScale,
        rotate: 0,
        flipH: false,
        flipV: false
      };
    };
    
    img.src = objectUrl;
    
    // For ngx-image-cropper, simulate an input event
    const fakeEvent = { target: { files: [file] } };
    this.imageChangedEvent = fakeEvent;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage.url = event.objectUrl ?? '';
    this.croppedImage.blob = event.blob ?? undefined;
  }

  async onSubmit(): Promise<void> {
    if (!this.croppedImage.blob) {
      this.isError = true;
      return;
    }

    const blob = new Blob([this.croppedImage.blob], { type: 'image/jpg' });
    const imageFile = new File([blob], 'image.png', {
      type: 'image/jpg'
    });

    const formData = new FormData();
    formData.append('file', imageFile, 'image.jpg');

    this.loading.set(true);
    if(this.data.from === 'invoice') {
      this.dialogRef.close({ success: true, file: imageFile, from: 'invoice' });
      return;
    }
    this.walletService
      .updateWalletLogo(this.data.wallet?.id || '', formData)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        take(1)
      )
      .subscribe({
        next: (res) => {
          this.dialogRef.close({ success: true, wallet: res.data });
        },
        error: (error) => {
          this.dialogRef.close({ success: false });
          this.alertService.failedAlert({
            title: 'Error updating logo',
            content: 'Failed to update the logo. Please try again.',
            doneMsg: 'OK',
            isOk: true
          });
        }
      });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = '';
    this.cropping = false;
    this.croppedImage = { url: '', blob: undefined };
    this.imageChangedEvent = null;
    this.fileInput.nativeElement.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  onAddLogo(): void {
    this.showUploadPage.set(true);
  }

  toggleSuggestions(): void {
    this.showSuggestions.update((v) => !v);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  continueWithoutLogo(): void {
    this.dialogRef.close({ skipLogo: true });
  }

  dontAskAgain(): void {
    this.loading.set(true);
    this.walletService
      .updateWalletLogoDontAskAgain(this.data.wallet?.id || '')
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.dialogRef.close({ success: true, dontAskAgain: true });
        }),
        take(1)
      )
      .subscribe({
        next: () => {
          this.dialogRef.close({ success: true, dontAskAgain: true });
        },
        error: (error) => {
          this.dialogRef.close({ success: true, dontAskAgain: false });
        }
      });
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.cropping && this.selectedFile) {
      event.preventDefault();

      // Determine zoom direction
      const zoomDirection = event.deltaY > 0 ? -1 : 1;
      const zoomStep = 0.1;

      // Calculate new zoom level
      const currentScale = this.transform.scale || 1;
      const newScale = currentScale + zoomDirection * zoomStep;

      // Apply zoom limits (0.5 to 3)
      if (newScale >= 0.5 && newScale <= 3) {
        this.transform = {
          ...this.transform,
          scale: newScale
        };
      }
    }
  }

  // Reset zoom
  resetZoom(): void {
    this.transform = {
      ...this.transform,
      scale: 1
    };
  }

  // Manual refresh method to sync crop preview
  refreshCrop(): void {
    if (this.cropping && this.selectedFile) {
      const currentEvent = this.imageChangedEvent;
      if (currentEvent) {
        this.imageChangedEvent = null;
        setTimeout(() => {
          this.imageChangedEvent = currentEvent;
        }, 50);
      }
    }
  }

  // Handle crop movement to sync preview
  onCropMoved(): void {
    if (this.cropping && this.selectedFile) {
      setTimeout(() => {
        const currentEvent = this.imageChangedEvent;
        if (currentEvent) {
          this.imageChangedEvent = null;
          setTimeout(() => {
            this.imageChangedEvent = currentEvent;
          }, 10);
        }
      }, 50);
    }
  }
}

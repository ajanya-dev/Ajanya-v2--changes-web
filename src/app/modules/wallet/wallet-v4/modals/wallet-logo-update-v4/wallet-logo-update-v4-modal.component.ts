import {
  Component,
  ViewChild,
  ElementRef,
  signal,
  inject,
  HostListener
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Check,
  Info,
  TriangleAlert,
  ImagePlus
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  ImageCroppedEvent,
  ImageCropperModule,
  ImageTransform
} from 'ngx-image-cropper';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
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
  selector: 'app-wallet-logo-update-v4-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    ImageCropperModule
  ],
  templateUrl: './wallet-logo-update-v4-modal.component.html',
  styleUrl: './wallet-logo-update-v4-modal.component.scss'
})
export class WalletLogoUpdateV4ModalComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  public data = inject<LogoUploadDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<WalletLogoUpdateV4ModalComponent>);
  private v4AlertService = inject(V4AlertService);
  private walletService = inject(WalletService);

  // Lucide icons
  XIcon = X;
  CheckIcon = Check;
  InfoIcon = Info;
  TriangleAlertIcon = TriangleAlert;
  ImagePlusIcon = ImagePlus;

  selectedFile: File | null = null;
  fileName: string = '';
  fileSize: string = '';
  isError: boolean = false;

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

  constructor() {
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
        this.v4AlertService.warningAlert({
          title: 'Error',
          doneMsg: 'OK',
          isOk: true,
          content: 'Please select an image file (jpg, jpeg, png)'
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.v4AlertService.warningAlert({
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
      const targetSize = 200;
      const optimalScale =
        minDimension < targetSize ? targetSize / minDimension : 1;

      this.transform = {
        scale: optimalScale,
        rotate: 0,
        flipH: false,
        flipV: false
      };
    };

    img.src = objectUrl;

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
    if (this.data.from === 'invoice') {
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
        error: () => {
          this.dialogRef.close({ success: false });
          this.v4AlertService.failedAlert({
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
        error: () => {
          this.dialogRef.close({ success: true, dontAskAgain: false });
        }
      });
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.cropping && this.selectedFile) {
      event.preventDefault();

      const zoomDirection = event.deltaY > 0 ? -1 : 1;
      const zoomStep = 0.1;
      const currentScale = this.transform.scale || 1;
      const newScale = currentScale + zoomDirection * zoomStep;

      if (newScale >= 0.5 && newScale <= 3) {
        this.transform = {
          ...this.transform,
          scale: newScale
        };
      }
    }
  }

  resetZoom(): void {
    this.transform = {
      ...this.transform,
      scale: 1
    };
  }

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

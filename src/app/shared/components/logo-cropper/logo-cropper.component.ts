import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  signal,
  inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  faArrowRight,
  faCheck,
  faExclamationTriangle,
  faInfo,
  faUpload,
  faXmark,
  faRotate,
  faRotateLeft,
  faRotateRight,
  faArrowsRotate
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  ImageCroppedEvent,
  ImageCropperModule,
  ImageTransform
} from 'ngx-image-cropper';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

export interface CroppedLogoResult {
  url: string;
  blob: Blob;
  fileName: string;
  base64: string;
}

@Component({
  selector: 'app-logo-cropper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    CommonButtonV35Component,
    ImageCropperModule,
    MatTooltipModule
  ],
  templateUrl: './logo-cropper.component.html',
  styleUrl: './logo-cropper.component.scss'
})
export class LogoCropperComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() title: string = 'Upload Logo';
  @Input() subtitle: string = 'Upload a logo for your receipt';
  @Input() maxFileSize: number = 2 * 1024 * 1024;
  @Input() allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png'];
  @Input() aspectRatio: number = 1;
  @Input() showUploadPage: boolean = false;

  @Output() logoCropped = new EventEmitter<CroppedLogoResult>();
  @Output() cancel = new EventEmitter<void>();

  private alertService = inject(AlertService);

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
  faRotate = faRotate;
  faRotateLeft = faRotateLeft;
  faRotateRight = faRotateRight;
  faArrowsRotate = faArrowsRotate;

  isDragOver: boolean = false;
  cropping = false;
  croppedImage: { url: string; blob: Blob | undefined; base64: string } = {
    url: '',
    blob: undefined,
    base64: ''
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

  processFile(file: File): void {
    if (!this.allowedTypes.includes(file.type)) {
      this.alertService.warningAlert({
        title: 'Error',
        doneMsg: 'OK',
        isOk: true,
        content: `Please select an image file (${this.allowedTypes.join(', ')})`
      });
      return;
    }
    if (file.size > this.maxFileSize) {
      this.alertService.warningAlert({
        title: 'Error',
        doneMsg: 'OK',
        isOk: true,
        content: `File size must be less than ${this.formatFileSize(this.maxFileSize)}`
      });
      return;
    }
    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.cropping = true;
    this.croppedImage = { url: '', blob: undefined, base64: '' };
    const fakeEvent = { target: { files: [file] } };
    this.imageChangedEvent = fakeEvent;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage.url = event.objectUrl ?? '';
    this.croppedImage.blob = event.blob ?? undefined;
    this.croppedImage.base64 = event.base64 ?? '';
  }

  onConfirm(): void {
    if (!this.croppedImage.base64) {
      this.isError = true;
      return;
    }

    const result: CroppedLogoResult = {
      url: this.croppedImage.url,
      blob: this.croppedImage.blob || new Blob(),
      fileName: this.fileName,
      base64: this.croppedImage.base64
    };
    this.logoCropped.emit(result);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = '';
    this.cropping = false;
    this.croppedImage = { url: '', blob: undefined, base64: '' };
    this.imageChangedEvent = null;
    this.fileInput.nativeElement.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k**i).toFixed(2))  } ${  sizes[i]}`;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.cropping && this.selectedFile) {
      event.preventDefault();

      // Determine zoom direction
      const zoomDirection = event.deltaY > 0 ? -1 : 1;
      const zoomStep = 0.1;

      // Calculate new zoom level
      const currentScale = this.transform?.scale || 1;
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

  // Reset all transformations
  resetTransform(): void {
    this.transform = {
      scale: 1,
      rotate: 0,
      flipH: false,
      flipV: false
    };
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewChild,
  ElementRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AlertTriangle,
  Check,
  Info,
  LucideAngularModule,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X
} from 'lucide-angular';
import {
  ImageCroppedEvent,
  ImageCropperModule,
  ImageTransform
} from 'ngx-image-cropper';

import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from '../../service/alert/v4-alert.service';

export interface CroppedLogoResult {
  url: string;
  blob: Blob;
  fileName: string;
  base64: string;
}

@Component({
  selector: 'app-v4-logo-cropper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule, ImageCropperModule, MatTooltipModule, CommonButtonV4Component],
  templateUrl: './v4-logo-cropper.component.html',
  styleUrl: './v4-logo-cropper.component.scss'
})
export class V4LogoCropperComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly title = input('Upload Company Logo');
  readonly subtitle = input('Upload a logo for your receipt');
  readonly maxFileSize = input(2 * 1024 * 1024);
  readonly allowedTypes = input<string[]>(['image/jpeg', 'image/jpg', 'image/png']);
  readonly aspectRatio = input(1);
  readonly currentLogoUrl = input<string | null>(null);

  readonly logoCropped = output<CroppedLogoResult>();
  readonly cancel = output<void>();
  readonly removeLogo = output<void>();

  private v4AlertService = inject(V4AlertService);

  // Lucide icons
  readonly XIcon = X;
  readonly UploadIcon = Upload;
  readonly InfoIcon = Info;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly Trash2Icon = Trash2;
  readonly RotateCcwIcon = RotateCcw;
  readonly RotateCwIcon = RotateCw;
  readonly RefreshCwIcon = RefreshCw;
  readonly CheckIcon = Check;

  // Signals
  cropping = signal(false);
  isDragOver = signal(false);
  isError = signal(false);
  replacingExisting = signal(false);
  croppedImageData = signal<{ url: string; blob: Blob | undefined; base64: string }>({
    url: '',
    blob: undefined,
    base64: ''
  });

  selectedFile: File | null = null;
  fileName = '';
  fileSize = '';

  imageChangedEvent: Event | { target: { files: FileList | File[] } } | null = null;

  transform: ImageTransform = {
    scale: 1,
    rotate: 0,
    flipH: false,
    flipV: false
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
    this.isError.set(false);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.processFile(files[0]);
    }
  }

  processFile(file: File): void {
    if (!this.allowedTypes().includes(file.type)) {
      this.v4AlertService.warningAlert({
        content: `Please select an image file (${this.allowedTypes().join(', ')})`
      });
      return;
    }
    if (file.size > this.maxFileSize()) {
      this.v4AlertService.warningAlert({
        content: `File size must be less than ${this.formatFileSize(this.maxFileSize())}`
      });
      return;
    }
    this.selectedFile = file;
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.cropping.set(true);
    this.croppedImageData.set({ url: '', blob: undefined, base64: '' });
    this.imageChangedEvent = { target: { files: [file] } };
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedImageData.set({
      url: event.objectUrl ?? '',
      blob: event.blob ?? undefined,
      base64: event.base64 ?? ''
    });
  }

  onConfirm(): void {
    const img = this.croppedImageData();
    if (!img.base64) {
      this.isError.set(true);
      return;
    }
    const result: CroppedLogoResult = {
      url: img.url,
      blob: img.blob || new Blob(),
      fileName: this.fileName,
      base64: img.base64
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
    this.cropping.set(false);
    this.croppedImageData.set({ url: '', blob: undefined, base64: '' });
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

  onCancel(): void {
    this.cancel.emit();
  }

  onRemoveLogo(): void {
    this.removeLogo.emit();
  }

  rotateLeft(): void {
    this.transform = { ...this.transform, rotate: (this.transform.rotate || 0) - 90 };
  }

  rotateRight(): void {
    this.transform = { ...this.transform, rotate: (this.transform.rotate || 0) + 90 };
  }

  resetZoom(): void {
    this.transform = { ...this.transform, scale: 1 };
  }

  resetTransform(): void {
    this.transform = { scale: 1, rotate: 0, flipH: false, flipV: false };
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (this.cropping() && this.selectedFile) {
      event.preventDefault();
      const zoomDirection = event.deltaY > 0 ? -1 : 1;
      const newScale = (this.transform?.scale || 1) + zoomDirection * 0.1;
      if (newScale >= 0.5 && newScale <= 3) {
        this.transform = { ...this.transform, scale: newScale };
      }
    }
  }
}

import {
  Component,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCamera,
  faXmark,
  faRotate,
  faCheck
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

export interface IWebcamCaptureDialogData {
  documentType: 'card' | 'cardReverse';
  title: string;
}

export interface IWebcamCaptureResult {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-webcam-capture-modal',
  templateUrl: './webcam-capture-modal.component.html',
  styleUrls: ['./webcam-capture-modal.component.scss'],
  standalone: true,
  imports: [FaIconComponent, CommonButtonV35Component]
})
export class WebcamCaptureModalComponent implements AfterViewInit, OnDestroy {
  private matDialogRef = inject(MatDialogRef<WebcamCaptureModalComponent>);
  public dialogData: IWebcamCaptureDialogData = inject(MAT_DIALOG_DATA);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private stream: MediaStream | null = null;
  capturedImage: string | null = null;
  isCapturing = false;
  error: string | null = null;
  facingMode: 'user' | 'environment' = 'environment';

  // Icons
  faCamera = faCamera;
  faXmark = faXmark;
  faRotate = faRotate;
  faCheck = faCheck;

  async ngAfterViewInit(): Promise<void> {
    await this.startWebcam();
  }

  ngOnDestroy(): void {
    this.stopWebcam();
  }

  /**
   * Start the webcam stream
   */
  async startWebcam(): Promise<void> {
    try {
      this.error = null;
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        await this.videoElement.nativeElement.play();
      }
    } catch (err) {
      this.handleWebcamError(err);
    }
  }

  /**
   * Stop the webcam stream
   */
  stopWebcam(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * Handle webcam errors
   */
  private handleWebcamError(err: unknown): void {
    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          this.error = 'Camera permission denied. Please allow camera access.';
          break;
        case 'NotFoundError':
          this.error = 'No camera found on this device.';
          break;
        case 'NotReadableError':
          this.error = 'Camera is being used by another application.';
          break;
        default:
          this.error = 'Failed to access camera. Please try again.';
      }
    } else {
      this.error = 'An unexpected error occurred.';
    }
  }

  /**
   * Capture image from webcam
   */
  captureImage(): void {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement)
      return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    this.capturedImage = canvas.toDataURL('image/jpeg', 0.9);
    this.isCapturing = true;

    // Stop the webcam after capture
    this.stopWebcam();
  }

  /**
   * Retake the photo
   */
  async retake(): Promise<void> {
    this.capturedImage = null;
    this.isCapturing = false;
    await this.startWebcam();
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.stopWebcam();
    await this.startWebcam();
  }

  /**
   * Confirm the captured image and close modal
   */
  confirmCapture(): void {
    if (!this.capturedImage) return;

    const file = this.dataUrlToFile(
      this.capturedImage,
      `${this.dialogData.documentType}_capture.jpg`
    );

    this.matDialogRef.close({
      file,
      previewUrl: this.capturedImage
    } as IWebcamCaptureResult);
  }

  /**
   * Convert data URL to File object
   */
  private dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    // eslint-disable-next-line no-plusplus
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Close modal without capture
   */
  closeModal(): void {
    this.stopWebcam();
    this.matDialogRef.close(null);
  }
}

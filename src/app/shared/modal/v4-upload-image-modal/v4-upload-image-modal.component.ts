import { Component, OnInit, inject, signal } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-upload-image-modal',
  standalone: true,
  imports: [
    ImageCropperModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component
  ],
  templateUrl: './v4-upload-image-modal.component.html',
  styleUrl: './v4-upload-image-modal.component.scss'
})
export class V4UploadImageModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4UploadImageModalComponent>);
  data: { event: Event; mode: string } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;

  isRounded = true;
  submitting = signal(false);
  croppedImage: { url: string; blob: Blob | undefined } = {
    url: '',
    blob: undefined
  };

  ngOnInit(): void {
    if (this.data?.mode === 'onboarding') {
      this.isRounded = false;
    }
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedImage.url = event.objectUrl ?? '';
    this.croppedImage.blob = event.blob ?? undefined;
  }

  submit(): void {
    this.dialogRef.close({ image: this.croppedImage });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}

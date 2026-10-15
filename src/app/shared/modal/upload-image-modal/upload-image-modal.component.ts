import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { Subscription } from 'rxjs';
import { NgStyle, NgIf } from '@angular/common';

/**
 * @description Modal component to upload images.
 */
@Component({
  selector: 'app-upload-image-modal',
  templateUrl: './upload-image-modal.component.html',
  styleUrls: ['./upload-image-modal.component.scss'],
  standalone: true,
  imports: [ImageCropperModule, NgStyle, MatDialogActions, NgIf]
})
export class UploadImageModalComponent implements OnInit, OnDestroy {
  userProfile!: UntypedFormGroup;
  fileToUpload!: File;
  imageChangedEvent = '';
  croppedImage: { url: string; blob: Blob | undefined } = {
    url: '',
    blob: undefined
  };
  corppedImg!: FormData;
  subscriptions: Subscription[] = [];
  btnDesable = false;
  isRounded = true;
  croppedImg: FormData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { event: Event; mode: string },
    private dialogRef: MatDialogRef<UploadImageModalComponent>
  ) {}

  ngOnInit(): void {
    if (this.data?.mode == 'onboarding') {
      this.isRounded = false;
    }
  }

  /**
   * @description Method invoked when `imageCropped` event is emitted from `image-cropper`.
   * Sets the cropped image to `this.croppedImage`.
   * @param event - `imageCropped` event.
   */
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage.url = event.objectUrl ?? '';
    this.croppedImage.blob = event.blob ?? undefined;
  }

  /**
   * @description Closes the dialog and submits the data.
   */
  imageUpload() {
    this.dialogRef.close({ image: this.croppedImage });
  }

  /**
   * @description Closes the dialog to cancel.
   */
  close() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

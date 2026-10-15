import { Component, Inject } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MatDialogActions
} from '@angular/material/dialog';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-logo-upload-modal',
  templateUrl: './logo-upload-modal.component.html',
  styleUrls: ['./logo-upload-modal.component.scss'],
  standalone: true,
  imports: [ImageCropperModule, MatDialogActions, NgIf]
})
export class LogoUploadModalComponent {
  userLogo!: UntypedFormGroup;
  croppedImage: string | null | undefined;
  corppedImg!: FormData;
  btnDesable = false;
  imgFile: File;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<LogoUploadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event: Event }
  ) {}

  /**
   * @description  To open logo upload modal.
   *
   */
  openDialog() {
    this.dialog.open(LogoUploadModalComponent);
  }

  id = 'personal';

  /**
   * @description  To crop the logo.
   *
   */
  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      this.getBase64FromBlob(event.blob, (base64Data: string) => {
        // Set the base64 data to this.croppedImage
        this.croppedImage = base64Data;
        this.convert(this.croppedImage);
      });
    }
  }
  /**
   * @description  To convert the logo.
   *
   */
  convert(imagebase64?: string | null) {
    const base64 = new String(imagebase64);
    this.ConvertToFormData(base64.substring(22));
  }

  /**
   * @description  To convert tho form data logo.
   *
   */
  ConvertToFormData(base64: string) {
    const byteCharacters = atob(base64);

    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpg' });
    const imageFile = new File([blob], 'logo_img.jpg', { type: 'image/jpg' });
    this.imgFile = imageFile;

    const formData = new FormData();
    formData.append('logo_img', imageFile, 'image.jpg');
    this.corppedImg = formData;
  }

  imageLoaded() {
    // show cropper
  }
  cropperReady() {
    // cropper ready
  }
  loadImageFailed() {
    // show message
  }

  /**
   * @description  To add the logo.
   *
   */
  addlogoimg() {
    // this.btnDesable=true;
    const data = {
      image: this.croppedImage
    };
    this.dialogRef.close(data);
  }

  /**
   * @description  Convert blob to base64
   *
   * @param blob
   * @param callback
   */
  getBase64FromBlob(blob: Blob, callback: (base64Data: string) => void) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      callback(base64Data);
    };
    reader.readAsDataURL(blob);
  }

  close() {
    this.dialogRef.close(false);
  }
}

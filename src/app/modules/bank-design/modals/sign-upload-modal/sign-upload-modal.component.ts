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
  selector: 'app-sign-upload-modal',
  templateUrl: './sign-upload-modal.component.html',
  styleUrls: ['./sign-upload-modal.component.scss'],
  standalone: true,
  imports: [ImageCropperModule, MatDialogActions, NgIf]
})
export class SignUploadModalComponent {
  userSign!: UntypedFormGroup;
  fileToUpload!: File;
  croppedImage: string | null | undefined;
  corppedImg!: FormData;

  btnDesable = false;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<SignUploadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event: Event }
  ) {}

  /**
   * @description  To open logo upload modal.
   *
   */
  openDialog() {
    this.dialog.open(SignUploadModalComponent);
  }

  id = 'personal';

  /**
   * @description  To crop the logo.
   *
   */
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
    this.convert(this.croppedImage);
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
  addProfilepic() {
    this.btnDesable = true;
  }

  /**
   * @description  To close the modal.
   *
   */
  close() {
    this.dialogRef.close(false);
  }
}

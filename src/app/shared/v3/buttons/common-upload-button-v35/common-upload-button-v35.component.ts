import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  forwardRef,
  inject
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

/**
 * `CommonUploadButtonV35Component` Represents a common file upload component for v3.5.
 */
@Component({
  standalone: true,
  selector: 'app-common-upload-button-v35',
  templateUrl: './common-upload-button-v35.component.html',
  styleUrls: ['./common-upload-button-v35.component.scss'],
  imports: [CommonModule, PipesModule, FontAwesomeModule, MatTooltipModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonUploadButtonV35Component),
      multi: true
    }
  ]
})
export class CommonUploadButtonV35Component {
  private alertService = inject(AlertService);

  @ViewChild('uploadedFileHTMLInput')
  commonUploadButtonV35Component: HTMLInputElement;

  /** Text to be displayed on the button. */
  @Input({ required: true }) buttonText = 'Upload';
  /** Text to be displayed top of the button after select file. */
  @Input() buttonHeader = '';
  /** Uplaod field width. */
  @Input() inputWidth = '100%';
  /** Accepted file types */
  @Input() acceptedFileTypes = ['.jpg', '.png', 'jpeg'];
  /** Uploaded File. This is used when show the file in filed, when get file from api or someothers. */
  @Input() uploadedFile: File = {} as File;
  /** Show and hide the image preview icon from field based on the this boolean value */
  @Input() isPreviewNeed = false;

  @Input() isCustomePreviewNeed = false;
  /** Maximum size of the uploaded file(MB) */
  @Input() FileSize = 10;
  /** For adding individual ids for the input field */
  @Input() inputId: string = '';

  /** To check duplicate file names */
  @Input() selectedFileNames: string[] = [];

  /** Maximum length for file name display before truncation */
  @Input() fileNameMaxLength: number = 37;

  /** Emit the remove file name to the parent component */
  @Output() removingFileName = new EventEmitter<string>();
  /** Emit the selected File to parent component. */
  @Output() selectedFileEvent = new EventEmitter<File>();
  /** Emit the selected file for preview */
  @Output() previewImageEvent = new EventEmitter<string | undefined>();

  emptyFile: File = {} as File;
  previewFileURL: string | undefined;
  isDrageFile = false;
  isHovered = false;

  /**
   * @description Function to handle the selection of image.
   * @param {HTMLInputElement} input - The input element used to select the image file.
   */
  chooseImage(input: HTMLInputElement): void {
    if (this.uploadedFile?.name) {
      return;
    }
    input.click();
  }

  /**
   * @description Function to remove the selected image.
   */
  removeImage(input: HTMLInputElement, event?: Event): void {
    event?.stopPropagation();
    const removingFileName = this.uploadedFile.name;
    this.uploadedFile = this.emptyFile;
    this.previewFileURL = undefined;
    this.selectedFileEvent.emit(this.uploadedFile);
    this.removingFileName.emit(removingFileName);

    /**
     * We have to reassign the paramter because file upload
     * does not work without this.
     */
    const inputElement = input;
    inputElement.value = '';
  }

  removePickedImage() {
    const htmlInput = this.commonUploadButtonV35Component;
    this.removeImage(htmlInput);
  }

  /**
   * @description Event handler for when a image is selected.
   * @param {Event} event - The event object triggered by the selection of an image.
   */
  imagePicked(event: Event): void {
    if (this.imageValidator(event)) {
      return;
    }
    if (event.target === null) return;
    this.uploadedFile = (event.target as HTMLInputElement).files?.length
      ? ((event.target as HTMLInputElement).files as FileList)[0]
      : this.emptyFile;
    this.uploadFile(this.uploadedFile);
  }

  /**
   * @description This function emits an event to preview the uploaded file.
   */
  previewImage() {
    if (this.isCustomePreviewNeed) {
      this.previewImageEvent.emit('custom');
      return;
    }
    if (this.uploadedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.uploadedFile);
      reader.onload = (event) => {
        if (event.target) {
          this.previewFileURL = event.target.result as string;
          this.previewImageEvent.emit(this.previewFileURL);
        }
      };
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
      this.FileSize
    ) {
      this.alertService.failedAlert({
        content: `The selected file size should be less than ${this.FileSize}MB`,
        title:'Error!'
      });
      return true;
    }
    return false;
  }

  /**
   * @description This function checks if the size of the dropped file exceeds a specified limit.
   * If the size is too large, it displays a failure alert.
   * @param {DragEvent} event - The drag event containing the dropped file.
   * @returns {boolean} Returns true if the file size exceeds the specified limit, otherwise false.
   */
  dropValidator(event: DragEvent) {
    const divider = 1e6;
    const files = event.dataTransfer?.files;
    
    if (!files || files.length === 0) {
      return false;
    }

    const file = files[0];
    if (file.size / divider > this.FileSize) {
      this.alertService.failedAlert({
        content: `The selected file size should be less than ${this.FileSize}MB`,
        title:'Error!'
      });
      return true;
    }
    return false;
  }

  /**
   * @description Event handler for drag over the file upload area.
   * @param {DragEvent} event - The drag event object.
   */
  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDrageFile = true;
  }

  /**
   * @description Event handler for drag leave the file upload area.
   * @param {DragEvent} event - The drag event object.
   */
  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDrageFile = false;
  }

  /**
   * @description Event handler for dropping a file onto the file upload area.
   * @param {DragEvent} event - The drag event object.
   */
  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDrageFile = false;
    
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    // Validate the dropped file using the drop validator
    const dropValidation = this.dropValidator(event);
    if (dropValidation) {
      return;
    }

    this.handleDroppedFiles(files);
  }

  /**
   * @description Handle the dropped files.
   * @param {FileList} files - The list of dropped files.
   */
  handleDroppedFiles(files: FileList): void {
    if (files.length > 0) {
      this.uploadedFile = files[0];
      this.uploadFile(this.uploadedFile);
    }
  }

  /**
   * @description Handle upload file.
   * @param file Selected file.
   */
  uploadFile(file: File) {
    if (this.selectedFileNames.length) {
      if (this.selectedFileNames.includes(file.name)) {
        this.uploadedFile = this.emptyFile;
        this.alertService.infoAlert({
          content:
            'This file has already been selected, please choose a different file.',
          close: true,
          timeout: 2000
        });
        const inputId = document.getElementById(this.inputId);
        if (inputId) {
          (inputId as HTMLInputElement).value = '';
        }
        return;
      }
    }
    const fileType = `.${file.name.split('.').pop()}`;
    if (this.acceptedFileTypes.includes((fileType ?? '').toLowerCase())) {
      this.selectedFileEvent.emit(file);
    } else {
      this.alertService.failedAlert({
        content: 'The file format you selected is not supported. Please choose a different file and try again.',
        title:'Error!'
      });
      this.uploadedFile = this.emptyFile;
      this.selectedFileEvent.emit(this.uploadedFile);
    }
  }

  /**
   * @description Handles the mouse enter event.
   */
  handleMouseEnter(): void {
    this.isHovered = true;
  }

  /**
   * @description Handles the mouse leave event.
   */
  handleMouseLeave(): void {
    this.isHovered = false;
  }
}

import {
  Component,
  ViewChild,
  effect,
  forwardRef,
  inject,
  input,
  output
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Upload,
  CircleCheck,
  Eye,
  X
} from 'lucide-angular';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  standalone: true,
  selector: 'app-common-upload-button-v4',
  templateUrl: './common-upload-button-v4.component.html',
  styleUrls: ['./common-upload-button-v4.component.scss'],
  imports: [LucideAngularModule, MatTooltipModule, TruncatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonUploadButtonV4Component),
      multi: true
    }
  ]
})
export class CommonUploadButtonV4Component {
  private alertService = inject(V4AlertService);

  @ViewChild('uploadedFileHTMLInput')
  commonUploadButtonV4Component: HTMLInputElement;

  /** Text to be displayed on the button. */
  buttonText = input('Upload');
  /** Text to be displayed top of the button after select file. */
  buttonHeader = input('');
  /** Upload field width. */
  inputWidth = input('100%');
  /** Accepted file types */
  acceptedFileTypes = input(['.jpg', '.png', 'jpeg']);
  /** Uploaded File from parent. */
  uploadedFile = input<File>({} as File);
  /** Show and hide the image preview icon */
  isPreviewNeed = input(false);
  isCustomePreviewNeed = input(false);
  /** Maximum size of the uploaded file(MB) */
  FileSize = input(10);
  /** For adding individual ids for the input field */
  inputId = input('');
  /** To check duplicate file names */
  selectedFileNames = input<string[]>([]);
  /** Maximum length for file name display before truncation */
  fileNameMaxLength = input(37);

  /** Emit the remove file name to the parent component */
  removingFileName = output<string>();
  /** Emit the selected File to parent component. */
  selectedFileEvent = output<File>();
  /** Emit the selected file for preview */
  previewImageEvent = output<string | undefined>();

  readonly UploadIcon = Upload;
  readonly CircleCheckIcon = CircleCheck;
  readonly EyeIcon = Eye;
  readonly XIcon = X;

  emptyFile: File = {} as File;
  internalFile: File = {} as File;
  previewFileURL: string | undefined;
  isDrageFile = false;
  isHovered = false;

  constructor() {
    effect(() => {
      this.internalFile = this.uploadedFile();
    });
  }

  chooseImage(inputElement: HTMLInputElement): void {
    if (this.internalFile?.name) {
      return;
    }
    inputElement.click();
  }

  removeImage(inputElement: HTMLInputElement, event?: Event): void {
    event?.stopPropagation();
    const removingFileName = this.internalFile.name;
    this.internalFile = this.emptyFile;
    this.previewFileURL = undefined;
    this.selectedFileEvent.emit(this.internalFile);
    this.removingFileName.emit(removingFileName);

    const el = inputElement;
    el.value = '';
  }

  removePickedImage() {
    const htmlInput = this.commonUploadButtonV4Component;
    this.removeImage(htmlInput);
  }

  imagePicked(event: Event): void {
    if (this.imageValidator(event)) {
      return;
    }
    if (event.target === null) return;
    this.internalFile = (event.target as HTMLInputElement).files?.length
      ? ((event.target as HTMLInputElement).files as FileList)[0]
      : this.emptyFile;
    this.uploadFile(this.internalFile);
  }

  previewImage() {
    if (this.isCustomePreviewNeed()) {
      this.previewImageEvent.emit('custom');
      return;
    }
    if (this.internalFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.internalFile);
      reader.onload = (event) => {
        if (event.target) {
          this.previewFileURL = event.target.result as string;
          this.previewImageEvent.emit(this.previewFileURL);
        }
      };
    }
  }

  imageValidator(event: Event) {
    const divider = 1e6;
    if (
      ((event.target as HTMLInputElement).files as FileList)[0].size / divider >
      this.FileSize()
    ) {
      this.alertService.warningAlert({
        content: `The selected file size should be less than ${this.FileSize()}MB`,
        isCancel: false
      });
      return true;
    }
    return false;
  }

  dropValidator(event: DragEvent) {
    const divider = 1e6;
    const files = event.dataTransfer?.files;

    if (!files || files.length === 0) {
      return false;
    }

    const file = files[0];
    if (file.size / divider > this.FileSize()) {
      this.alertService.warningAlert({
        content: `The selected file size should be less than ${this.FileSize()}MB`,
        isCancel: false
      });
      return true;
    }
    return false;
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDrageFile = true;
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDrageFile = false;
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDrageFile = false;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const dropValidation = this.dropValidator(event);
    if (dropValidation) {
      return;
    }

    this.handleDroppedFiles(files);
  }

  handleDroppedFiles(files: FileList): void {
    if (files.length > 0) {
      this.internalFile = files[0];
      this.uploadFile(this.internalFile);
    }
  }

  uploadFile(file: File) {
    if (this.selectedFileNames().length) {
      if (this.selectedFileNames().includes(file.name)) {
        this.internalFile = this.emptyFile;
        this.alertService.warningAlert({
          content:
            'This file has already been selected, please choose a different file.',
          isCancel: false
        });
        const inputId = document.getElementById(this.inputId());
        if (inputId) {
          (inputId as HTMLInputElement).value = '';
        }
        return;
      }
    }
    const fileType = `.${file.name.split('.').pop()}`;
    if (this.acceptedFileTypes().includes((fileType ?? '').toLowerCase())) {
      this.selectedFileEvent.emit(file);
    } else {
      this.alertService.warningAlert({
        content:
          'The file format you selected is not supported. Please choose a different file and try again.',
        isCancel: false
      });
      this.internalFile = this.emptyFile;
      this.selectedFileEvent.emit(this.internalFile);
    }
  }

  handleMouseEnter(): void {
    this.isHovered = true;
  }

  handleMouseLeave(): void {
    this.isHovered = false;
  }
}

import { Component, DestroyRef, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowUpFromLine, faXmark, faCloudArrowUp, faFile } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DocumentVaultService } from '../../services/document-vault.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonModule } from '@angular/common';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  serialNumber: string;
  memo: string;
}

@Component({
  selector: 'app-upload-file-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    MatDialogClose
  ],
  templateUrl: './upload-file-modal.component.html',
  styleUrls: ['./upload-file-modal.component.scss']
})
export class UploadFileModalComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private data: { currentFolderId: string } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<UploadFileModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(AlertService);

  faXmark = faXmark;
  faUpload = faArrowUpFromLine;
  faCloudArrowUp = faCloudArrowUp;
  faFile = faFile;

  loading = false;
  isDragging = false;
  selectedFiles: FileItem[] = [];

  readonly maxFiles = 20;
  readonly maxFileSizeMB = 500;
  readonly maxFileSize = this.maxFileSizeMB * 1024 * 1024; // 500MB in bytes
  readonly acceptedFileTypes = ['.jpg', '.png', '.jpeg', '.pdf', '.doc', '.docx', '.csv', '.xls', '.xlsx'];


  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.canAddMoreFiles()) {
      this.isDragging = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (!this.canAddMoreFiles()) {
      return;
    }

    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  addFiles(files: File[]): void {
    const validFiles: File[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > this.maxFileSize) {
        this.alertService.failedAlert({
          content: `File "${file.name}" exceeds ${this.maxFileSizeMB}MB limit`,
          title: 'File Too Large'
        });
        continue;
      }

      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!this.acceptedFileTypes.includes(extension)) {
        this.alertService.failedAlert({
          content: `File "${file.name}" has an unsupported file type`,
          title: 'Invalid File Type'
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Check max files limit
    const remainingSlots = this.maxFiles - this.selectedFiles.length;
    if (remainingSlots <= 0) {
      this.alertService.failedAlert({
        content: `Maximum ${this.maxFiles} files allowed`,
        title: 'File Limit Reached'
      });
      return;
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      this.alertService.failedAlert({
        content: `The 20-file limit was reached. ${remainingSlots} ${remainingSlots === 1 ? 'file' : 'files'} were added successfully`,
        title: 'File Limit Reached'
      });
    }

    // Add files with metadata
    const newFileItems: FileItem[] = filesToAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: this.getFileNameWithoutExtension(file.name),
      serialNumber: '',
      memo: ''
    }));

    this.selectedFiles = [...this.selectedFiles, ...newFileItems];
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles]; // Trigger change detection
  }

  openFileBrowser(): void {
    if (this.canAddMoreFiles()) {
      this.fileInput.nativeElement.click();
    }
  }

  canAddMoreFiles(): boolean {
    return this.selectedFiles.length < this.maxFiles;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.canAddMoreFiles() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.openFileBrowser();
    }
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  getFileNameWithoutExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  }

  onUpload(): void {
    if (this.selectedFiles.length === 0) {
      this.alertService.failedAlert({
        content: 'Please select at least one file to upload',
        title: 'No Files Selected'
      });
      return;
    }

    // Validate that all files have names
    const filesWithoutNames = this.selectedFiles.filter(f => !f.name.trim());
    if (filesWithoutNames.length > 0) {
      this.alertService.failedAlert({
        content: 'Please provide a name for all files',
        title: 'Validation Error'
      });
      return;
    }

    this.loading = true;

    const formData = new FormData();
    formData.append('parent_id', this.data.currentFolderId);

    this.selectedFiles.forEach((fileItem, index) => {
      formData.append(`files[${index}]`, fileItem.file);
      formData.append(`names[${index}]`, fileItem.name.trim());
      formData.append(`serial_numbers[${index}]`, fileItem.serialNumber.trim());
      formData.append(`memo_notes[${index}]`, fileItem.memo.trim());
      formData.append(`type`, 'file');
    });

    this.documentVaultService
      .uploadDocument(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close(res);
          }
        },
        error: () => {
          this.dialogRef.close();
        }
      });
  }
}

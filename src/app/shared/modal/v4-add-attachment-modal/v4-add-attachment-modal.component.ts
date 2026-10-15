import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  LucideAngularModule,
  X,
  Upload,
  Trash2,
  ExternalLink,
  LoaderCircle
} from 'lucide-angular';

import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IGetAttachment } from 'src/app/models/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { MatTooltip } from '@angular/material/tooltip';

export interface IV4AddAttachmentModalData {
  id: string | number;
  type: string;
  existingData?: IGetAttachment[];
  limit?: number;
  acceptedFormat?: string;
  formFieldName?: string;
  isMail?: boolean;
}

@Component({
  selector: 'app-v4-add-attachment-modal',
  templateUrl: './v4-add-attachment-modal.component.html',
  styleUrls: ['./v4-add-attachment-modal.component.scss'],
  standalone: true,
  imports: [NgClass, LucideAngularModule, CommonButtonV4Component, DatePipe,MatTooltip]
})
export class V4AddAttachmentModalComponent implements OnInit {
  public data: IV4AddAttachmentModalData = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<V4AddAttachmentModalComponent>);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly UploadIcon = Upload;
  readonly Trash2Icon = Trash2;
  readonly ExternalLinkIcon = ExternalLink;
  readonly LoaderCircleIcon = LoaderCircle;

  listData: IGetAttachment[] = [];
  loading = false;
  submitting = false;
  attachmentDeletingId: false | string = false;
  isRefresh = false;

  isDragging = false;
  selectedFileName = '';

  readonly defaultAcceptedFormat = '.pdf,.txt,.docx,.doc,.csv,.xls,.xlsx,rtf';
  private fileInput: HTMLInputElement;

  get acceptedFormat(): string {
    return this.data.acceptedFormat ?? this.defaultAcceptedFormat;
  }

  get fileLimit(): number {
    return this.data.limit ?? 5;
  }

  ngOnInit(): void {
    this.dialogRef.disableClose = true;
    if (this.data.id === 0 && this.data.existingData) {
      this.listData = this.data.existingData;
    } else {
      this.loadAttachments();
    }
  }

  loadAttachments(): void {
    if (!this.data.id) return;
    this.loading = true;
    this.sharedService
      .getAttachment(this.data.type, this.data.id)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.listData = res.data as IGetAttachment[];
      });
  }

  // --- Drag-and-drop ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
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
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
      input.value = '';
    }
  }

  triggerFileInput(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = this.acceptedFormat;
      this.fileInput.addEventListener('change', (e) =>
        this.onFileInputChange(e)
      );
    }
    this.fileInput.accept = this.acceptedFormat;
    this.fileInput.click();
  }

  handleFileSelection(file: File): void {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const acceptedFormats = this.acceptedFormat
      .split(',')
      .map((f) => f.trim().toLowerCase());

    if (!acceptedFormats.includes(fileExtension)) {
      this.alertService.warningAlert({
        content: `File format ${fileExtension} is not supported. Accepted formats: ${this.acceptedFormat}`
      });
      return;
    }

    const maxFileSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxFileSizeInBytes) {
      this.alertService.warningAlert({
        content: 'Maximum file size is 10MB. Please select a smaller file.'
      });
      return;
    }

    this.selectedFileName = file.name;
    this.onSubmit(file);
  }

  onSubmit(file: File): void {
    if (this.listData.length >= this.fileLimit) {
      this.alertService.warningAlert({
        content: `A maximum of ${this.fileLimit} attachments is allowed.`
      });
      this.selectedFileName = '';
      return;
    }

    const formData = new FormData();
    formData.append(this.data.formFieldName ?? 'image', file);
    this.submitting = true;

    this.sharedService
      .addAttachment(this.data.type, this.data.id, formData)
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.selectedFileName = '';
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.isRefresh = true;
          if (this.data.id === 0) {
            this.listData.push(res.data);
          } else {
            this.loadAttachments();
          }
        }
      });
  }

  openAttachment(item: IGetAttachment): void {
    // Mirrors v3 AddAttachmentModalComponent.openAttachment:
    // fall back to `id` when the API row omits `encrypted_id`, then
    // surface a popup-blocker warning if window.open is blocked.
    const attachmentId = (item.encrypted_id || item.id) as string;
    if (!attachmentId) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Unable to open attachment: missing identifier.'
      });
      return;
    }

    this.sharedService
      .openAttachment(this.data.type, this.data.id, attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.success || !res.data) return;
        const urlLoaded = window.open(res.data);
        if (
          !urlLoaded ||
          urlLoaded.closed ||
          typeof urlLoaded.closed === 'undefined'
        ) {
          this.alertService.warningAlert({
            title: 'Error',
            content:
              'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
          });
        }
      });
  }

  deleteAttachment(item: IGetAttachment, index: number): void {
    if (this.attachmentDeletingId) return;

    this.alertService
      .confirmAlert({
        content: 'This attachment will be deleted permanently',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) return;

        if (this.data.id === 0) {
          this.listData.splice(index, 1);
          return;
        }

        this.attachmentDeletingId = item.encrypted_id;
        this.sharedService
          .deleteAttachment(this.data.type, this.data.id, item.encrypted_id)
          .pipe(
            finalize(() => {
              this.attachmentDeletingId = false;
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success) {
              this.isRefresh = true;
              this.listData.splice(index, 1);
            }
          });
      });
  }

  close(): void {
    if (this.submitting || this.attachmentDeletingId) return;
    this.dialogRef.close({
      isRefresh: this.isRefresh,
      existingData: this.listData
    });
  }
}

import { Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { MatDialog, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { Utils } from 'src/app/data/utils';
import { IDocumentMailUpload } from '../../../models/document-mail.model';
import { DocumentMailService } from '../../../services/document-mail.service';
import { V4DocumentMailModalComponent } from '../../../components/v4-document-mail-modal/v4-document-mail-modal.component';

@Component({
  selector: 'app-upload-document-modal-v4',
  standalone: true,
  imports: [
    MatDialogClose,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ],
  templateUrl: './upload-document-modal-v4.component.html',
  styleUrl: './upload-document-modal-v4.component.scss'
})
export class UploadDocumentModalV4Component {
  private alertService = inject(V4AlertService);
  private documentMailService = inject(DocumentMailService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<UploadDocumentModalV4Component>);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  loading = signal(false);
  isDragging = signal(false);
  files: File[] = [];
  uploadedFiles = signal<IDocumentMailUpload[]>([]);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.onSelect([file]);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.onSelect([file]);
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onSelect(event: File[]): void {
    if (event.length) {
      if (Utils.maxSizeValidator(event[0].size)) {
        this.alertService.warningAlert({ content: 'Max size is 4MB' });
        return;
      }
      this.files[0] = event[0];
    } else {
      this.files = [];
    }
    this.submit();
  }

  submit(): void {
    if (!this.files.length) {
      this.alertService.warningAlert({ content: 'Please choose a file' });
      return;
    }

    const arr = new Uint32Array(2);
    const payload = new FormData();
    payload.append('file', this.files[0]);
    payload.append('idempotency_key', window.crypto.getRandomValues(arr).join(''));
    payload.append('document_title', this.files[0].name);

    this.loading.set(true);
    this.documentMailService
      .uploadDocument(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.v3DataTableService.refreshV3DataTable();
          this.alertService.successAlert({
            title: 'Success',
            content: res.data.message,
            timeout: 2000,
            close: true
          });
          this.uploadedFiles.update((files) => [...files, res.data]);
          this.files.length = 0;
          this.fileInputRef.nativeElement.value = '';
        } else {
          this.fileInputRef.nativeElement.value = '';
          this.alertService.warningAlert({
            content: (res as unknown as { message: string }).message
          });
        }
      });
  }

  async deleteAttachment(id: string): Promise<void> {
    const confirmed = await firstValueFrom(
      this.alertService
        .confirmAlert({
          content:
            'Are you sure you want to delete this document? This action cannot be undone.'
        })
        .afterClosed()
    );
    if (confirmed) {
      this.documentMailService
        .deleteDocument(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((val) => {
          if (val.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: val.message,
              timeout: 2000,
              close: true
            });
            this.uploadedFiles.update((files) => files.filter((item) => item.id !== id));
          }
        });
    }
  }

  onMail(): void {
    const files = this.uploadedFiles();
    if (files.length) {
      this.dialog
        .open(V4DocumentMailModalComponent, {
          disableClose: true,
          width: '1200px',
          autoFocus: false,
          panelClass: 'paddingless-modal-rounded',
          data: {
            type: 'normal',
            documents: files
          }
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((val: { status: boolean }) => {
          if (val?.status) {
            this.dialogRef.close({ success: true });
          }
        });
    } else {
      this.alertService.warningAlert({ content: 'Please upload a file to mail' });
    }
  }
}

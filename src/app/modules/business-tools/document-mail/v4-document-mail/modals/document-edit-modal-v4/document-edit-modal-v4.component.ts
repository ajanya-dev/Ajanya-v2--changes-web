import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { Utils } from 'src/app/data/utils';
import { DocumentMailService } from '../../../services/document-mail.service';

@Component({
  selector: 'app-document-edit-modal-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
  ],
  templateUrl: './document-edit-modal-v4.component.html',
  styleUrl: './document-edit-modal-v4.component.scss'
})
export class DocumentEditModalV4Component implements OnInit {
  private alertService = inject(V4AlertService);
  private documentMailService = inject(DocumentMailService);
  private dialogRef = inject(MatDialogRef<DocumentEditModalV4Component>);
  private v3DataTableService = inject(V3DataTableService);
  private data: {
    id: string;
    title: string;
    fileName: string;
    url: string;
  } = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  loading = signal(false);
  isDragging = signal(false);
  files: File[] = [];
  isFileChanged = false;
  fileTouched = false;
  originalFileName = '';
  originalUrl = '';

  documentForm!: FormGroup;

  ngOnInit(): void {
    this.documentForm = new FormGroup({
      documentTitle: new FormControl('', [Validators.required])
    });

    if (this.data) {
      this.originalUrl = this.data.url || '';
      this.originalFileName = this.data.fileName || '';
      this.documentForm.patchValue({
        documentTitle: this.data.title || ''
      });
    }
  }

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

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  removeFile(): void {
    this.files = [];
    this.isFileChanged = false;
    this.fileInputRef.nativeElement.value = '';
  }

  onSelect(event: File[]): void {
    this.fileTouched = true;
    if (event.length) {
      if (Utils.maxSizeValidator(event[0].size)) {
        this.alertService.warningAlert({ content: 'Max size is 4MB' });
        return;
      }
      this.files[0] = event[0];
      this.isFileChanged = true;
    } else {
      this.isFileChanged = false;
      this.files = [];
    }
  }

  onEdit(): void {
    this.fileTouched = true;
    if (this.documentForm.invalid) return;

    this.loading.set(true);
    const formData = new FormData();
    formData.append('document_title', this.documentForm.value.documentTitle.trim());

    if (this.isFileChanged && this.files.length > 0) {
      formData.append('file', this.files[0]);
    } else {
      formData.append('file', '');
    }

    this.documentMailService
      .editDocument(this.data.id, formData)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Document updated successfully',
            timeout: 2000,
            close: true
          });
          this.v3DataTableService.refreshV3DataTable();
          this.dialogRef.close({ success: true });
        } else {
          this.alertService.warningAlert({
            content: res.message || 'Failed to update document'
          });
        }
      });
  }
}

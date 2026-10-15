import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faXmark, faExternalLinkAlt } from '@fortawesome/pro-solid-svg-icons';
import { Utils } from 'src/app/data/utils';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  IDocumentMailFromAddress,
  IDocumentMailUpload
} from '../../models/document-mail.model';
import { DocumentMailService } from '../../services/document-mail.service';
import { DropZoneComponent } from '../../../../../shared/components/drop-zone/drop-zone.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';

@Component({
  selector: 'app-document-edit-modal',
  templateUrl: './document-edit-modal.component.html',
  styleUrl: './document-edit-modal.component.scss',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogClose,
    FaIconComponent,
    DropZoneComponent,
    MatDialogActions,
    FaIconComponent,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    ReactiveFormsModule
  ]
})
export class DocumentEditModalComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private documentMailService = inject(DocumentMailService);
  private dialogRef = inject(MatDialogRef<DocumentEditModalComponent>);
  private v3DataTableService = inject(V3DataTableService);
  private data = inject(MAT_DIALOG_DATA);

  faXmark = faXmark;
  faExternalLinkAlt = faExternalLinkAlt;

  private destroy$ = new Subject<boolean>();

  loading = false;
  addressList: IDocumentMailFromAddress[] = [];
  files: File[] = [];
  uploadedFiles: IDocumentMailUpload[] = [];
  removeSubject = new Subject();

  documentId: string = '';
  currentFileName: string = '';
  currentDocumentTitle: string = '';
  isFileChanged: boolean = false;
  fileTouched: boolean = false;
  
  documentForm: FormGroup;

  originalFileName: string = ''; 
  originalUrl: string = '';
  validationErrors: { title?: string; file?: string } = {};

  ngOnInit(): void {
    this.initFormGroup();

    if (this.data) {
      this.documentId = this.data.id;
      this.currentDocumentTitle = this.data.title || '';
      this.originalUrl = this.data.url || '';
      this.currentFileName = this.data.fileName || this.data.document_name || '';
      this.originalFileName = this.currentFileName;
      this.documentForm.patchValue({
        documentTitle: this.currentDocumentTitle
      });
    }
  }

  initFormGroup() {
    this.documentForm = new FormGroup({
      documentTitle: new FormControl('', [Validators.required])
    });
  }

  onSelect(event: File[]) {
    this.fileTouched = true; 
    if (event.length) {
      if (Utils.maxSizeValidator(event[0].size)) {
        this.alertService.failedAlert({ content: 'Max size is 4MB' });
        return;
      }
      this.files[0] = event[0];
      
      this.isFileChanged = true;
      this.currentFileName = event[0].name; 
    }else{
      this.isFileChanged = false;
      this.files = [];
      this.currentFileName = this.originalFileName;
    }
  }

  onEdit() {
    this.fileTouched = true;

    if (this.documentForm.invalid) {
      return;
    }

    this.currentDocumentTitle = this.documentForm.value.documentTitle;
    this.loading = true;

    // Create FormData to send file and metadata
    const formData = new FormData();
    formData.append('document_title', this.currentDocumentTitle.trim());  

    if (this.isFileChanged && this.files.length > 0) {
      formData.append('file', this.files[0]);
    }else{
      formData.append('file', '');
    }
    // Call the edit API
    this.documentMailService
      .editDocument(this.documentId, formData)
      .pipe(
        finalize(() => this.loading = false),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Document updated successfully'
          });
          this.v3DataTableService.refreshV3DataTable();
          this.dialogRef.close({ success: true });
        } else {
          this.alertService.failedAlert({
            content: res.message || 'Failed to update document'
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

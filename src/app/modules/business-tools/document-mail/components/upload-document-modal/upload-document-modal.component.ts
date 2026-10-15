import { Component, OnDestroy, inject } from '@angular/core';
import { Subject, finalize, firstValueFrom } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faPlus, faTrash, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { Utils } from 'src/app/data/utils';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  IDocumentMailFromAddress,
  IDocumentMailUpload
} from '../../models/document-mail.model';
import { DocumentMailService } from '../../services/document-mail.service';
import { DocumentMailModalComponent } from '../document-mail-modal/document-mail-modal.component';
import { DropZoneComponent } from '../../../../../shared/components/drop-zone/drop-zone.component';

@Component({
  selector: 'app-upload-document-modal',
  templateUrl: './upload-document-modal.component.html',
  styleUrls: ['./upload-document-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogClose,
    FaIconComponent,
    DropZoneComponent,
    MatDialogActions
  ]
})
export class UploadDocumentModalComponent implements OnDestroy {
  private alertService = inject(AlertService);
  private documentMailService = inject(DocumentMailService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<UploadDocumentModalComponent>);
  private v3DataTableService = inject(V3DataTableService);

  faXmark = faXmark;
  faPlus = faPlus;
  faTrash = faTrash;
  private sanitizer = inject(DomSanitizer);

  private destroy$ = new Subject<boolean>();
  loading = false;
  addressList: IDocumentMailFromAddress[] = [];
  files: File[] = [];
  uploadedFiles: IDocumentMailUpload[] = [];
  imagePreview?: SafeResourceUrl;
  removeSubject = new Subject();

  /**
   * Handles the file selection event when a file is selected for upload.
   *
   * @param event {{ e: File[] }} event - File selection event.
   * @memberof UploadDocumentModalComponent
   */
  onSelect(event: File[]) {
    if (event.length) {
      if (Utils.maxSizeValidator(event[0].size)) {
        this.alertService.failedAlert({ content: 'Max size is 4MB' });
        return;
      }
      this.files[0] = event[0];
      this.getPreview(this.files[0]);
    } else {
      this.files = [];
    }
    this.submit();
  }

  /**
   * Retrieves a preview of the selected image file.
   *
   * @param {File} img - Selected image file.
   * @memberof UploadDocumentModalComponent
   */
  getPreview(img: File) {
    const reader = new FileReader();
    reader.readAsDataURL(img);
    reader.onload = () => {
      this.imagePreview = this.sanitizer.bypassSecurityTrustResourceUrl(
        reader.result as string
      );
    };
  }

  /**
   * Submits the selected file for upload.
   *
   * @memberof UploadDocumentModalComponent
   */
  submit() {
    if (!this.files.length) {
      this.alertService.warningAlert({
        content: 'Please choose a file ',
        isCancel: false
      });
      return;
    }

    const arr = new Uint32Array(2);

    const payload = new FormData();

    payload.append('file', this.files[0]);

    payload.append(
      'idempotency_key',
      window.crypto.getRandomValues(arr).join('')
    );
    payload.append('document_title', this.files[0].name);

    this.loading = true;
    this.documentMailService
      .uploadDocument(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.v3DataTableService.refreshV3DataTable();
          this.alertService.successAlert({ content: res.data.message });
          this.uploadedFiles.push(res.data);
          this.files.length = 0;
          this.removeSubject.next(true);
          this.imagePreview = undefined;
        } else {
          this.removeSubject.next(true);
          this.alertService.failedAlert({
            content: (res as unknown as { message: string }).message
          });
        }
      });
  }

  /**
   * Deletes an uploaded document attachment based on the specified ID after confirming with the user.
   *
   * @param {string} id - ID of the document attachment to be deleted.
   * @memberof UploadDocumentModalComponent
   */
  async deleteAttachment(id: string) {
    const value = await firstValueFrom(
      this.alertService.confirmAlert({ content: 'Are you sure?' }).afterClosed()
    );
    if (value) {
      this.documentMailService.deleteDocument(id).subscribe((val) => {
        if (val.success) {
          this.alertService.successAlert({ content: val.message });
          const index = this.uploadedFiles.findIndex((item) => item.id === id);
          this.uploadedFiles.splice(index, 1);
        }
      });
    }
  }

  /**
   * Handles the mail event, opening the DocumentMailModalComponent for sending mails with uploaded documents.
   *
   * @memberof UploadDocumentModalComponent
   */
  onMail() {
    if (this.uploadedFiles.length) {
      const dialogRef = this.dialog.open(DocumentMailModalComponent, {
        disableClose: true,
        width: '1200px',
        autoFocus: false,
        data: {
          type: 'normal',
          documents: this.uploadedFiles
        }
      });
      dialogRef.afterClosed().subscribe((val: { status: boolean }) => {
        if (val.status) {
          this.dialogRef.close();
        }
      });
    } else {
      this.alertService.warningAlert({
        content: 'Please upload a file to mail'
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

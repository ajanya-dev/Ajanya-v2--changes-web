import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faShareNodes } from '@fortawesome/pro-solid-svg-icons';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DocumentVaultService } from '../../services/document-vault.service';

@Component({
  selector: 'app-share-file-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    MatDialogClose
  ],
  templateUrl: './share-file-modal.component.html',
  styleUrls: ['./share-file-modal.component.scss']
})
export class ShareFileModalComponent implements OnInit {
  private data: { fileId?: string; folderId?: string; type: 'file' | 'folder' } = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ShareFileModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private dextroyRef = inject(DestroyRef);
  private alertService = inject(AlertService);
  faXmark = faXmark;
  faShareNodes = faShareNodes;
  shareForm: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.shareForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      expires_days: [
        null,
        [Validators.required, Validators.min(1), Validators.max(90)]
      ],
      max_downloads: [null, [Validators.required, Validators.min(1)]]
    });
  }

  onShare(): void {
    this.shareForm.markAllAsTouched();
    if (this.shareForm.invalid) {
      return;
    }
    this.loading = true;

    // Build data object based on type (file or folder)
    const data: {
      file_id?: string;
      folder_id?: string;
      email: string;
      expires_days: number;
      max_downloads: number;
    } = {
      email: this.shareForm.value.email as string,
      expires_days: this.shareForm.value.expires_days as number,
      max_downloads: this.shareForm.value.max_downloads as number
    };

    // Pass file_id for files, folder_id for folders
    if (this.data.type === 'folder' && this.data.folderId) {
      data.folder_id = this.data.folderId;
    } else if (this.data.fileId) {
      data.file_id = this.data.fileId;
    }

    this.documentVaultService
      .shareItem(data)
      .pipe(
        takeUntilDestroyed(this.dextroyRef),
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
      error: (error) => {
        if (error.status === 403) {
          this.alertService.failedAlert({
            content: error.error.errorMsg || 'Access denied'
          });
          this.dialogRef.close();
        }
      }
    });
  }
}
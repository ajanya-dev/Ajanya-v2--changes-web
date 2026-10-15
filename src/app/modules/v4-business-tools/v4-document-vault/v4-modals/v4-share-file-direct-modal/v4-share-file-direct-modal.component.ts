import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { LucideAngularModule, X, Share2 } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { DocumentVaultService } from '../../v4-services/v4-document-vault.service';

@Component({
  selector: 'app-v4-share-file-direct-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    MatDialogClose
  ],
  templateUrl: './v4-share-file-direct-modal.component.html',
  styleUrls: ['./v4-share-file-direct-modal.component.scss']
})
export class V4ShareFileDirectModalComponent implements OnInit {
  private data: {
    fileId?: string;
    folderId?: string;
    type: 'file' | 'folder';
  } = inject(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4ShareFileDirectModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(V4AlertService);

  readonly XIcon = X;
  readonly Share2Icon = Share2;

  shareForm: FormGroup;
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.shareForm = this.fb.group({
      email: [
        '',
        [Validators.required, ValidationService.emailValidator]
      ],
      expires_days: [
        null,
        [Validators.required, Validators.min(1), Validators.max(90)]
      ],
      max_downloads: [null, [Validators.required, Validators.min(1)]]
    });
  }

  onShare(): void {
    this.shareForm.markAllAsTouched();
    if (this.shareForm.invalid) return;

    this.isSubmitting.set(true);

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

    if (this.data.type === 'folder' && this.data.folderId) {
      data.folder_id = this.data.folderId;
    } else if (this.data.fileId) {
      data.file_id = this.data.fileId;
    }

    this.documentVaultService
      .shareItem(data)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSubmitting.set(false);
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

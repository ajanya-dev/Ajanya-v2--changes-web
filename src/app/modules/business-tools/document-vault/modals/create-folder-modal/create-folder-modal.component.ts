import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faFolderPlus } from '@fortawesome/pro-solid-svg-icons';
import { finalize } from 'rxjs';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DocumentVaultService } from '../../services/document-vault.service';

@Component({
  selector: 'app-create-folder-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    MatDialogClose
  ],
  templateUrl: './create-folder-modal.component.html',
  styleUrls: ['./create-folder-modal.component.scss']
})
export class CreateFolderModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateFolderModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private data = inject(MAT_DIALOG_DATA);
  private dextroyRef = inject(DestroyRef);
  faXmark = faXmark;
  faFolderPlus = faFolderPlus;
  folderForm: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.folderForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.pattern(/^[a-zA-Z0-9 ]+$/)]],
      type: ['folder', [Validators.required]],
      parent_id: [this.data.currentFolderId],
    });
  }

  onCreateFolder(): void {
    this.folderForm.markAllAsTouched();
    if (this.folderForm.invalid) {
      return;
    }
    this.loading = true;
    this.documentVaultService
      .createFolder(this.data.currentFolderId, this.folderForm.value)
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
        error: () => {
          this.dialogRef.close();
        }
      });
  }
}
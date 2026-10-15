import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, FolderPlus, X } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { DocumentVaultService } from '../../v4-services/v4-document-vault.service';

@Component({
  selector: 'app-v4-create-folder-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    MatDialogClose
  ],
  templateUrl: './v4-create-folder-modal.component.html',
  styleUrls: ['./v4-create-folder-modal.component.scss']
})
export class V4CreateFolderModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4CreateFolderModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private data = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  readonly FolderPlusIcon = FolderPlus;
  readonly XIcon = X;

  folderForm: FormGroup;
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.folderForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.pattern(/^[a-zA-Z0-9 ]+$/)
        ]
      ],
      type: ['folder', [Validators.required]],
      parent_id: [this.data.currentFolderId]
    });
  }

  onCreateFolder(): void {
    this.folderForm.markAllAsTouched();
    if (this.folderForm.invalid) {
      return;
    }
    this.isSubmitting.set(true);
    this.documentVaultService
      .createFolder(this.data.currentFolderId, this.folderForm.value)
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
        error: () => {
          this.dialogRef.close();
        }
      });
  }
}

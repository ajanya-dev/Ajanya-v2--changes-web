import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faPen } from '@fortawesome/pro-solid-svg-icons';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
// import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DocumentVaultService } from '../../services/document-vault.service';

@Component({
  selector: 'app-edit-folder-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    MatDialogClose
  ],
  templateUrl: './edit-folder-modal.component.html',
  styleUrls: ['./edit-folder-modal.component.scss']
})
export class EditFolderModalComponent implements OnInit {
  // private alertService = inject(AlertService);
  private data: {
    id: string;
    currentName: string;
    name: string;
    type: 'folder' | 'file';
    serial_number: string;
  } = inject(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditFolderModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private dextroyRef = inject(DestroyRef);

  faXmark = faXmark;
  faPen = faPen;
  renameForm: FormGroup;
  loading = false;
  readonly isFile = this.data?.type === 'file';

  currentName = signal<string>('');

  ngOnInit(): void {
    this.renameForm = this.fb.group({
      name: [
        this.data?.currentName || '',
        [Validators.required, Validators.minLength(1), Validators.pattern(/^[a-zA-Z0-9 ]+$/)]
      ],
      serial_number: [this.data?.serial_number || '']
    });
    this.currentName.set(this.data?.currentName || '');
  }

  onRename(): void {
    this.renameForm.markAllAsTouched();
    if (this.renameForm.invalid) {
      return;
    }
    this.loading = true;
    const data = {
      name: this.renameForm.value.name as string,
      type: this.data.type,
      serial_number: this.renameForm.value.serial_number as string
    };
    this.documentVaultService
      .renameItem(this.data.id, data)
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
import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
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
import { LucideAngularModule, SquarePen, X } from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DocumentVaultService } from '../../v4-services/v4-document-vault.service';

@Component({
  selector: 'app-v4-edit-folder-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    MatDialogClose
  ],
  templateUrl: './v4-edit-folder-modal.component.html',
  styleUrls: ['./v4-edit-folder-modal.component.scss']
})
export class V4EditFolderModalComponent implements OnInit {
  private data: {
    id: string;
    currentName: string;
    name: string;
    type: 'folder' | 'file';
    serial_number: string;
  } = inject(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4EditFolderModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);

  readonly PencilIcon = SquarePen;
  readonly XIcon = X;
  readonly isFile = this.data?.type === 'file';

  renameForm: FormGroup;
  isSubmitting = signal(false);
  currentName = signal<string>('');

  ngOnInit(): void {
    this.renameForm = this.fb.group({
      name: [
        this.data?.currentName || '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.pattern(/^[a-zA-Z0-9 ]+$/)
        ]
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
    this.isSubmitting.set(true);
    const data = {
      name: this.renameForm.value.name as string,
      type: this.data.type,
      serial_number: this.renameForm.value.serial_number as string
    };
    this.documentVaultService
      .renameItem(this.data.id, data)
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

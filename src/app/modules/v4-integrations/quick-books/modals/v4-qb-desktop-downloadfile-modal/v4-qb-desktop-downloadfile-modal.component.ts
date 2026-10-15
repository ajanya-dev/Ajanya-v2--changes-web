import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { IFileData } from 'src/app/modules/integration/model/integration';

interface IDialogData {
  mode: string;
  fileDetails: IFileData;
}

@Component({
  selector: 'app-v4-qb-desktop-downloadfile-modal',
  templateUrl: './v4-qb-desktop-downloadfile-modal.component.html',
  styleUrls: ['./v4-qb-desktop-downloadfile-modal.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ]
})
export class V4QbDesktopDownloadfileModalComponent implements OnInit {
  private dialogRef = inject(
    MatDialogRef<V4QbDesktopDownloadfileModalComponent>
  );
  private dialogData = inject<IDialogData | null>(MAT_DIALOG_DATA, {
    optional: true
  });
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly closeIcon = X;

  loading = signal(false);
  isEditMode = false;

  form = new FormGroup({
    fileName: new FormControl('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    password1: new FormControl('', [
      Validators.required,
      Validators.maxLength(20)
    ]),
    password2: new FormControl('', [
      Validators.required,
      Validators.maxLength(20)
    ])
  });

  ngOnInit(): void {
    if (this.dialogData?.mode === 'edit') {
      this.isEditMode = true;
      this.form.controls.fileName.setValue(
        this.dialogData.fileDetails?.nick_name ?? ''
      );
      this.form.controls.fileName.disable();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEditMode) {
      this.onReset();
    } else {
      this.onDownload();
    }
  }

  private onDownload(): void {
    const data = new FormData();
    data.append('file_name', this.form.controls.fileName.value!);
    data.append('password', this.form.controls.password1.value!);
    data.append('confirm_password', this.form.controls.password2.value!);

    this.loading.set(true);

    this.integrationService
      .downloadWebConnectorFile(data)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.downloadURI(res.data);
          this.dialogRef.close(true);
        }
      });
  }

  private onReset(): void {
    const data = new FormData();
    data.append('file_id', this.dialogData!.fileDetails.id);
    data.append('new_password', this.form.controls.password1.value!);
    data.append('confirm_password', this.form.controls.password2.value!);

    this.loading.set(true);

    this.integrationService
      .resetPasswordOfQBDFile(data)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Password Reset Successful.',
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  private downloadURI(uri: string): void {
    const link = document.createElement('a');
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

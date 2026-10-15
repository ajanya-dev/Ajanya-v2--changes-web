import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  LucideAngularModule,
  X,
  UploadCloud,
  CircleCheck,
  TriangleAlert
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'app-upload-statement-modal-v4',
  templateUrl: './upload-statement-modal-v4.component.html',
  styleUrls: ['./upload-statement-modal-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4ControlMessageComponent
  ]
})
export class UploadStatementModalV4Component implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private bankAccountsService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  public dialogRef = inject(MatDialogRef<UploadStatementModalV4Component>);
  public data = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly UploadCloudIcon = UploadCloud;
  readonly CircleCheckIcon = CircleCheck;
  readonly TriangleAlertIcon = TriangleAlert;

  readonly acceptedFileTypes = [
    '.pdf', '.csv', '.xlsx', '.xls',
    '.docx', '.doc', '.rtf', '.txt', '.jpg', '.png'
  ];

  uploadForm: FormGroup;
  uploadFormData: FormData = new FormData();
  selectedFile: File | null = null;
  selectedFileNames: string[] = [];
  isDragOver = false;
  isLoading = signal(false);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      bankStatement: ['', [Validators.required]]
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    input.value = '';
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    const maxSizeMB = 10;
    if (file.size / 1e6 > maxSizeMB) {
      this.alertService.failedAlert({
        content: `The selected file size should be less than ${maxSizeMB}MB`,
        title: 'Error!'
      });
      return;
    }

    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!this.acceptedFileTypes.includes(ext)) {
      this.alertService.failedAlert({
        content: 'The file format you selected is not supported. Please choose a different file and try again.',
        title: 'Error!'
      });
      return;
    }

    if (this.selectedFileNames.includes(file.name)) {
      this.alertService.infoAlert({
        content: 'This file has already been selected, please choose a different file.',
        close: true,
        timeout: 2000
      });
      return;
    }

    this.selectedFile = file;
    this.selectedFileNames.push(file.name);
    this.uploadFormData.set('statement', file);
    this.uploadForm.controls['bankStatement'].setValue(file);
  }

  removeFile(): void {
    if (this.selectedFile) {
      this.selectedFileNames = this.selectedFileNames.filter(
        (n) => n !== this.selectedFile!.name
      );
    }
    this.selectedFile = null;
    this.uploadFormData.delete('statement');
    this.uploadForm.controls['bankStatement'].setValue(null);
    this.uploadForm.markAllAsTouched();
  }

  continue(): void {
    this.uploadForm.markAllAsTouched();

    if (this.uploadForm.invalid) {
      return;
    }

    this.uploadFormData.set('bankAccountId', this.data.encrypted_bankacc_id);
    this.uploadFormData.set('bankAccountNumber', this.data.accountNumber);
    this.uploadFormData.set('bankRoutingNumber', this.data.routingNumber);
    this.uploadFormData.set('bankId', this.data.bankAccountId);

    this.isLoading.set(true);
    this.subscriptions.push(
      this.bankAccountsService
        .uploadBankStatement(this.uploadFormData)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: res.data.message,
              close: true,
              timeout: 2000
            });
            this.dialogRef.close({ success: true });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

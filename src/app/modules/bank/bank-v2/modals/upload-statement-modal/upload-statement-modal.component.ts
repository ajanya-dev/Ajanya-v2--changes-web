import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'app-upload-statement-modal',
  templateUrl: './upload-statement-modal.component.html',
  styleUrls: ['./upload-statement-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    FaIconComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    MatDialogClose,
    CommonUploadButtonV35Component
  ]
})
export class UploadStatementModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bankAccountsService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<UploadStatementModalComponent>);
  public data = inject(MAT_DIALOG_DATA);

  faXmark = faXmark;
  selectedFile: File | null = null;
  selectedFileNames: string[] = [];
  uploadForm: FormGroup;
  uploadFormData: FormData = new FormData();
  bankStatementName = '';
  isLoading = signal(false);
  subscriptions: Subscription[] = []

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize the upload form with validators
   */
  initForm(): void {
    this.uploadForm = this.fb.group({
      bankStatement: ['', [Validators.required]]
    });
  }

  /**
   * Close the dialog without submitting
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * @description Handles file input event and updates corresponding form controls and FormData.
   * @param {File} event - The file input event containing the selected file.
   * @param documentType
   */
  fileInput(
    event: File,
  ) {
    this.selectedFileNames.push(event.name);
      if (event.name) {
        this.uploadFormData.append('statement', event);
        this.bankStatementName = event.name;
        this.uploadForm.controls.bankStatement.setValue(event);
      } else {
        this.bankStatementName = '';
        this.uploadFormData.delete('statement');
        this.uploadForm.controls.bankStatement.setValue(null);
      }
    }

  removeFileName(fileName: string) {
    this.selectedFileNames = this.selectedFileNames.filter(
      (file) => file !== fileName
    );
    this.uploadForm.markAllAsTouched();
  }

  /**
   * @description Handles the submission of the microDepositForm and sends a micro deposit request.
   *
   */
  continue() {
    this.uploadForm.markAllAsTouched();

    if (this.uploadForm.invalid) {
      return;
    }
    this.uploadFormData.append('bankAccountId', this.data.encrypted_bankacc_id);
    this.uploadFormData.append('bankAccountNumber', this.data.accountNumber);
    this.uploadFormData.append('bankRoutingNumber', this.data.routingNumber);
    this.uploadFormData.append('bankId', this.data.bankAccountId);
    this.isLoading.set(true);
    this.subscriptions.push(
      this.bankAccountsService.uploadBankStatement(this.uploadFormData)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          const data = {
            title: 'Success',
            content: res.data.message,
            close: true,
            timeout: 2000
          };
          this.alertService.successAlert(data);
          this.dialogRef.close({success: true});
        }
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
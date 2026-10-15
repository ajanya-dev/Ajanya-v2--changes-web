import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faXmark,
  faAngleRight,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface IBulkImportRow {
  name: string;
  email: string;
  amount: string;
}

export interface IImportPaymentLinksModalData {
  parentLinkId: string;
}

type Step = 'upload' | 'edit' | 'review';

@Component({
  selector: 'app-import-payment-links-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    CommonButtonV35Component,
    MatDialogClose,
    CommonUploadButtonV35Component,
    FontAwesomeModule
  ],
  templateUrl: './import-payment-links-modal.component.html',
  styleUrl: './import-payment-links-modal.component.scss'
})
export class ImportPaymentLinksModalComponent implements OnInit {
  private paymentLinkService = inject(PaymentLinkService);
  private dialogRef = inject(MatDialogRef<ImportPaymentLinksModalComponent>);
  private destroy = inject(DestroyRef);
  public data: IImportPaymentLinksModalData = inject(MAT_DIALOG_DATA);

  faXmark = faXmark;
  faAngleRight = faAngleRight;
  faTrash = faTrash;

  // Step management
  currentStep = signal<Step>('upload');

  // Step 1: Upload
  selectedFile: File | null = null;
  fileName: string = '';
  sampleFileUrl: string = '';

  // Step 2 & 3: Data
  batchUuid: string = '';
  importData: IBulkImportRow[] = [];
  editableData: IBulkImportRow[] = [];

  // Loading states
  loading = signal(false);
  isSampleFileLoading = signal(false);
  isUpdating = signal(false);
  isCreating = signal(false);

  // Parent link ID from dialog data
  parentLinkId: string = '';

  constructor() {
    if (this.data?.parentLinkId) {
      this.parentLinkId = this.data.parentLinkId;
    }
  }

  ngOnInit(): void {
    this.getSampleFile();
  }

  /**
   * Fetches the sample file URL from the API
   */
  getSampleFile(): void {
    this.isSampleFileLoading.set(true);
    this.paymentLinkService
      .getBulkImportSampleFile()
      .pipe(
        finalize(() => {
          this.isSampleFileLoading.set(false);
        }),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe((response) => {
        if (response?.success) {
          this.sampleFileUrl = response?.data?.sampleFileUrl;
        }
      });
  }

  /**
   * Handles the file upload event
   * @param file The selected file
   */
  uploadEvent(file: File): void {
    if (file && file?.name) {
      this.fileName = file.name;
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
      this.fileName = '';
    }
  }

  /**
   * Downloads the sample CSV file
   */
  downloadSampleFile(): void {
    if (this.sampleFileUrl) {
      window.location.href = this.sampleFileUrl;
    }
  }

  /**
   * Step 1: Submit file for import
   */
  submitFile(): void {
    if (!this.selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.loading.set(true);
    this.paymentLinkService
      .uploadBulkImportFile(formData)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe((response) => {
        if (response?.success) {
          this.batchUuid = response.data.batch_uuid;
          this.importData = response.data.data || [];
          this.editableData = JSON.parse(JSON.stringify(this.importData));
          this.currentStep.set('edit');
        }
      });
  }

  /**
   * Step 2: Update the data
   */
  updateData(): void {
    if (!this.batchUuid || !this.editableData.length) {
      return;
    }

    this.isUpdating.set(true);
    this.paymentLinkService
      .updateBulkImportData(this.batchUuid, this.editableData)
      .pipe(
        finalize(() => {
          this.isUpdating.set(false);
        }),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe((response) => {
        if (response?.success) {
          this.importData = JSON.parse(JSON.stringify(this.editableData));
          this.currentStep.set('review');
        }
      });
  }

  /**
   * Go back to edit step from review
   */
  goBackToEdit(): void {
    this.editableData = JSON.parse(JSON.stringify(this.importData));
    this.currentStep.set('edit');
  }

  /**
   * Delete a row from editable data
   */
  deleteRow(index: number): void {
    this.editableData.splice(index, 1);
  }

  /**
   * Step 3: Create the payment links
   */
  createLinks(): void {
    if (!this.batchUuid || !this.parentLinkId) {
      return;
    }

    this.isCreating.set(true);
    this.paymentLinkService
      .createBulkImportLinks(this.batchUuid, this.parentLinkId)
      .pipe(
        finalize(() => {
          this.isCreating.set(false);
        }),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe((response) => {
        if (response?.success) {
          this.dialogRef.close({ success: true, batchUuid: this.batchUuid });
        }
      });
  }

  /**
   * Closes the modal
   */
  cancel(): void {
    this.dialogRef.close(false);
  }
}

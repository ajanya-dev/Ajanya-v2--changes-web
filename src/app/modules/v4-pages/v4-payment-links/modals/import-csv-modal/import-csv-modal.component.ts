import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

interface ImportCsvModalData {
  parentLinkId: string;
}

interface ImportRow {
  name: string;
  email: string;
  amount: string;
}

@Component({
  selector: 'app-import-csv-modal',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatDialogClose,
    MatTooltipModule,
    FormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './import-csv-modal.component.html'
})
export class ImportCsvModalComponent {
  private paymentLinkService = inject(PaymentLinkService);
  private v4AlertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<ImportCsvModalComponent>);
  private destroyRef = inject(DestroyRef);
  public data = inject<ImportCsvModalData>(MAT_DIALOG_DATA);

  step = signal<1 | 2 | 3>(1);
  uploading = signal(false);
  creating = signal(false);
  batchUuid = signal('');
  rows = signal<ImportRow[]>([]);
  selectedFile = signal<File | null>(null);

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile.set(input.files[0]);
    }
  }

  discardFile(fileInput: HTMLInputElement) {
    this.selectedFile.set(null);
    fileInput.value = '';
  }

  downloadSample() {
    this.paymentLinkService.getBulkImportSampleFile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success && res.data.sampleFileUrl) {
          window.open(res.data.sampleFileUrl, '_blank');
        }
      });
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.uploading.set(true);
    this.paymentLinkService.uploadBulkImportFile(formData)
      .pipe(finalize(() => this.uploading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.batchUuid.set(res.data.batch_uuid);
          this.rows.set(res.data.data);
          this.step.set(2);
        }
      });
  }

  updateRow(index: number, field: keyof ImportRow, value: string) {
    this.rows.update((r) => {
      const updated = [...r];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  removeRow(index: number) {
    this.rows.update((r) => r.filter((_, i) => i !== index));
  }

  saveEdits() {
    this.uploading.set(true);
    this.paymentLinkService.updateBulkImportData(this.batchUuid(), this.rows())
      .pipe(finalize(() => this.uploading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) this.step.set(3);
      });
  }

  createLinks() {
    this.creating.set(true);
    this.paymentLinkService.createBulkImportLinks(this.batchUuid(), this.data.parentLinkId)
      .pipe(finalize(() => this.creating.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.v4AlertService.successAlert({ content: 'Links created successfully!' });
          this.dialogRef.close({ success: true });
        }
      });
  }
}

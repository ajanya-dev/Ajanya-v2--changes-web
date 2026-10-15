import { NgClass, TitleCasePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    MatDialogClose,
    CommonUploadButtonV35Component,
    TitleCasePipe,
    NgClass
  ],
  templateUrl: './import-modal.component.html',
  styleUrl: './import-modal.component.scss'
})
export class ImportModalComponent implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<ImportModalComponent>);
  public injectData = inject<'rule' | 'customer' | 'item'>(MAT_DIALOG_DATA);

  templateFile: string;
  selectedFile: File | undefined;
  isSampleFileLoading = signal(false);
  isSubmit = signal(false);
  showError = signal(false);
  destroy$ = new Subject();

  faXamrk = faXmark;
  faAngleRight = faAngleRight;

  ngOnInit(): void {
    this.getSampleFiles();
  }

  getSampleFiles() {
    this.isSampleFileLoading.set(true);
    this.invoiceService
      .getSampleFile(this.injectData)
      .pipe(
        finalize(() => {
          this.isSampleFileLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.templateFile = res.data.sampleFileUrl;
        }
      });
  }

  uploadEvent(files: File) {
    if (files && files.name) {
      this.selectedFile = files;
      this.showError.set(false);
    } else {
      this.showError.set(true);
    }
  }

  submit() {
    if (!this.selectedFile || this.showError()) {
      this.showError.set(true);
      return;
    }

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
    this.isSubmit.set(true);
    this.invoiceService
      .importData(formData, this.injectData)
      .pipe(
        finalize(() => {
          this.isSubmit.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.message });
          this.dialogRef.close(true);
        }
      });
  }

  downloadClick() {
    window.location.href = this.templateFile;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

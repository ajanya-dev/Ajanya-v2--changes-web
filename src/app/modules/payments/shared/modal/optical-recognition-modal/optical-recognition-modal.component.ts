import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faUpload,
  faXmark,
  faUser,
  faEdit,
  faCalendar,
  faInfoCircle
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';

interface PaymentFormData {
  payeeName: string;
  payeePhone: string;
  payeeEmail: string;
  payeeAddress: string;
  payeeCity: string;
  payeeState: string;
  payeeZipCode: string;
  payeeCountry: string;
  amount: number | null;
  date: string;
  memo: string;
}
import { finalize, Subject, takeUntil } from 'rxjs';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SpeechToTextService } from '../../services/speech-to-text.service';
import {
  OcrDocument,
  OcrSaveModalData,
  PayeeCreationResult
} from '../../services/speech-to-text.model';

@Component({
  selector: 'app-optical-recognition-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    MatDialogClose,
    ReactiveFormsModule,
    NgClass,
    CommonUploadButtonV35Component,
    DatePipe,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    NewPhoneInputComponent
  ],
  templateUrl: './optical-recognition-modal.component.html',
  styleUrl: './optical-recognition-modal.component.scss'
})
export class OpticalRecognitionModalComponent implements OnInit, OnDestroy {
  private ocrService = inject(SpeechToTextService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef);
  private alertService = inject(AlertService);

  faUpload = faUpload;
  faXmark = faXmark;
  faUser = faUser;
  faEdit = faEdit;
  faCalendar = faCalendar;
  faInfoCircle = faInfoCircle;

  ocrFormData = new FormData();
  paymentDetailsForm!: FormGroup;
  originalFormData: PaymentFormData | null = null;
  destroy$ = new Subject<boolean>();

  modalLoading = signal<string>('OCR Document Upload');
  fileReadyToUpload = signal<boolean>(false);
  loading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  showOcrData = signal<boolean>(false);

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.paymentDetailsForm = this.fb.group({
      payeeName: ['', [Validators.required]],
      payeePhone: ['', [ValidationService.customMinLength(10)]],
      payeeEmail: ['', [ValidationService.emailValidator]],
      payeeAddress: [''],
      payeeCity: [''],
      payeeState: [''],
      payeeZipCode: ['', [ValidationService.zipValidator]],
      payeeCountry: [''],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [''],
      memo: ['']
    });
  }

  toggleEditMode() {
    if (!this.isEditMode()) {
      this.originalFormData = { ...this.paymentDetailsForm.value };
      this.isEditMode.set(true);
      this.paymentDetailsForm.markAsTouched();
    } else {
      if (this.paymentDetailsForm.valid) {
        this.originalFormData = { ...this.paymentDetailsForm.value };
        this.isEditMode.set(false);
      } else {
        this.paymentDetailsForm.markAllAsTouched();
        return;
      }
    }
  }

  saveChanges() {
    if (this.paymentDetailsForm.valid) {
      this.isEditMode.set(false);
      this.loading.set(true);
      this.handlePayeeCreation(this.paymentDetailsForm.value);
    } else {
      this.paymentDetailsForm.markAllAsTouched();
      if (
        this.paymentDetailsForm.get('amount')?.value === null ||
        this.paymentDetailsForm.get('amount')?.value <= 0
      ) {
        this.alertService.warningAlert({
          content: 'Amount is required',
          close: false
        });
        return;
      }

      if (this.paymentDetailsForm.get('payeeName')?.value === '') {
        this.alertService.warningAlert({
          content: 'Payee Name is required',
          close: false
        });
        return;
      }

      if (this.paymentDetailsForm.get('payeePhone')?.invalid) {
        this.alertService.warningAlert({
          content: 'Please fill valid phone number',
          close: false
        });
        return;
      }

      return;
    }
  }

  cancelEdit() {
    if (this.originalFormData) {
      this.paymentDetailsForm.patchValue(this.originalFormData);
      this.paymentDetailsForm.markAsUntouched();
      this.paymentDetailsForm.markAsPristine();
    }
    this.isEditMode.set(false);
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.paymentDetailsForm.controls.payeePhone.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.paymentDetailsForm.controls.payeePhone.updateValueAndValidity();
  }

  fileInput(event: File) {
    this.ocrFormData = new FormData();
    if (event && event.name) {
      const cleanFile = new File([event], event.name, {
        type: event.type,
        lastModified: event.lastModified
      });
      this.ocrFormData.append('file', cleanFile);
    }
    this.fileReadyToUpload.set(this.ocrFormData.get('file') ? true : false);
  }

  removeFileName(fileName: string) {
    this.ocrFormData = new FormData();
    this.fileReadyToUpload.set(false);
  }

  submit() {
    this.modalLoading.set('Scanning Document...');
    this.loading.set(true);

    const file = this.ocrFormData.get('file');
    if (!file || !(file instanceof File)) {
      this.loading.set(false);
      this.modalLoading.set('OCR Document Upload');
      return;
    }

    const freshFormData = new FormData();

    const cleanFile = new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });

    freshFormData.append('file', cleanFile);
    this.ocrService
      .uploadOcrDocument(freshFormData)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.modalLoading.set('Confirm OCR Details');
            this.showOcrData.set(true);
            this.populateFormWithOcrData(res.data);
          } else {
            this.modalLoading.set('OCR Document Upload');
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.modalLoading.set('OCR Document Upload');
        }
      });
  }

  populateFormWithOcrData(ocrData: OcrDocument) {
    if (ocrData) {
      const formData = {
        payeeName: ocrData.payee_name || '',
        payeePhone: ocrData.payee_phone || '',
        payeeEmail: ocrData.payee_email || '',
        payeeAddress: ocrData.payee_address || '',
        payeeCity: ocrData.payee_city || '',
        payeeState: ocrData.payee_state || '',
        payeeZipCode: ocrData.payee_zip || '',
        payeeCountry: ocrData.payee_country || '',
        amount: parseFloat(ocrData.amount) || null,
        date: ocrData.date || '',
        memo: ocrData.memo || ''
      };
      this.paymentDetailsForm.patchValue(formData);
      this.originalFormData = { ...formData };
      if (formData.amount === null || formData.amount <= 0) {
        this.paymentDetailsForm.get('amount')?.markAsTouched();
      }
    }
  }

  closeModal() {
    this.dialogRef.close();
  }

  /**
   * Handle payee creation from extracted vendor information
   */
  private handlePayeeCreation(item: OcrSaveModalData): void {
    this.ocrService
      .handlePayeeCreation(item)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PayeeCreationResult) => {
          this.setPayeeAndCompleteFlow(result);
        },
        error: (error) => {
          this.loading.set(false);
        }
      });
  }

  setPayeeAndCompleteFlow(result: PayeeCreationResult): void {
    const DataForParent = {
      payeeId: result.payeeId,
      payeeName: result.payeeName,
      payeeEmail: result.payeeEmail,
      payeePhone: result.payeePhone,
      payeeAddress: result.payeeAddress,
      payeeCity: result.payeeCity,
      payeeState: result.payeeState,
      payeeZipCode: result.payeeZipCode,
      payeeCountry: result.payeeCountry,
      memo: result.memo,
      amount: result.amount,
      date: result.date
    };

    this.loading.set(false);
    this.dialogRef.close(DataForParent);
  }

  uploadNewDocument() {
    this.showOcrData.set(false);
    this.modalLoading.set('OCR Document Upload');
    this.ocrFormData = new FormData();
    this.fileReadyToUpload.set(false);
    this.paymentDetailsForm.reset();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

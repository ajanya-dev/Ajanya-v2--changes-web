import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { NgOptimizedImage, KeyValuePipe } from '@angular/common';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { environment } from 'src/environments/environment';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { finalize } from 'rxjs';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-document-verification',
  templateUrl: './document-verification.component.html',
  styleUrls: ['./document-verification.component.scss'],
  standalone: true,
  imports: [
    NgOptimizedImage, 
    CommonUploadButtonV35Component,
    CommonButtonV35Component,
    FaIconComponent,
    KeyValuePipe
  ]
})
export class DocumentVerificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private appSettingService = inject(AppSettingsService);
  private destroyRef = inject(DestroyRef);
  public authV3Service = inject(AuthV3Service);
  private outsideService = inject(OutsideService);
  private dialog = inject(MatDialog);

  env = environment;
  logoPath = 'assets/main/app_logo.svg';
  appConfig: IAppConfig;
  loading = signal<boolean>(false);
  uploading = signal<boolean>(false);
  uploaded = signal<boolean>(false);
  linkExpired = signal<boolean>(false);
  faCheckCircle = faCheckCircle;
  uuid = signal<string>('');
  userId = signal<string>('');
  link = signal<string>('');
  documentFields = signal<{ [key: string]: string }>({});
  uploadedFiles = signal<{
    [key: string]: { file: File | null; uploaded: boolean };
  }>({});

  acceptedFileTypes = ['.pdf', '.doc', '.Docx', '.jpeg', '.jpg', '.png', '.xls', '.xlsx', '.csv', '.rtf', '.zip', '.bmp', '.webp'];
  errorMessage = signal<string>('');
  keepOrder = () => 0;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.uuid.set(params.uuid);
        this.userId.set(params.user_id);
      });
    this.getAttachemntDetails();
    this.loadAppSettings();
    if (this.env.isItWhiteLabel) {
      this.logoPath = `assets/white_label/${this.env.env_id}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg';
    }
  }

  loadAppSettings(): void {
    this.appSettingService.appConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      });
  }

  /**
   * Handle file selection for a specific document field
   * @param file Selected file
   * @param fieldId Document field identifier
   */
  onFileSelected(file: File, fieldId: string): void {
    this.uploadedFiles.set({
      ...this.uploadedFiles(),
      [fieldId]: { file, uploaded: true }
    });
  }

  /**
   * Handle file removal for a specific document field
   * @param fieldId Document field identifier
   */
  onFileRemoved(fieldId: string): void {
    this.uploadedFiles.set({
      ...this.uploadedFiles(),
      [fieldId]: { file: null, uploaded: false }
    });
  }

  /**
   * Check if all required documents are uploaded
   * @returns True if all required documents are uploaded
   */
  get allRequiredDocumentsUploaded(): boolean {
    const uploadedFiles = Object.keys(this.uploadedFiles() || {});
    return uploadedFiles.length === this.documentFieldsCount && uploadedFiles.every((file) => this.uploadedFiles()[file]?.uploaded);
  }

  /**
   * Get count of uploaded documents
   * @returns Number of uploaded documents
   */
  get uploadedDocumentsCount(): number {
    return Object.keys(this.uploadedFiles() || {}).length;
  }

  get documentFieldsCount(): number {
    return Object.keys(this.documentFields() || {}).length;
  }

  /**
   * Upload all selected documents
   */
  uploadDocuments(): void {

    const formData = new FormData();

    formData.append('uuid', this.uuid());
    formData.append('user_id', this.userId());

    Object.keys(this.uploadedFiles()).forEach((key) => {
      if(this.uploadedFiles()[key]?.file) {
        formData.append(`upload_file[${key}]`, this.uploadedFiles()[key]?.file as File);
      }
    });

    this.uploading.set(true);
    this.outsideService
      .uploadDocument(formData)
      .pipe(
        finalize(() => {
          this.uploading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.uploaded.set(true);
        }
      });
  }

  /**
   * Navigate to website
   */
  onGoToWebsite(): void {
    this.authV3Service.onGoToWebsite();
  }

  getAttachemntDetails(): void {
    this.loading.set(true);
    this.outsideService
      .getDocumentVerificationData(this.uuid(), this.userId())
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.documentFields.set(res.data.requested_document_types);
            this.link.set(res.data.link);
          }
        },
        error: (error) => {
          this.errorMessage.set(error.error.errorMsg);
          this.linkExpired.set(true);
        }
      });
  }

  uploadDocumentsFromPhone(): void {
    this.openQrCodeModal();
  }

  openQrCodeModal(): void {
    this.dialog.open(QrCodeScannerModalComponent, {
      width: '322px',
      height: '445px',
      data: {
        link: this.link()
      }
    });
  }
}
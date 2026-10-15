import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFile,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileImage,
  faFileVideo,
  faFileAudio,
  faFileArchive,
  faFileCode,
  faDownload
} from '@fortawesome/pro-solid-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { IDownloadPageData } from '../../models/document-vault.models';

@Component({
  selector: 'app-share-download-outside',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FaIconComponent,
    CommonButtonV35Component,
    NgOptimizedImage
  ],
  templateUrl: './share-download-outside.component.html',
  styleUrl: './share-download-outside.component.scss'
})
export class ShareDownloadOutsideComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private outsideService = inject(OutsideService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(AlertService);

  // Icons
  faFile = faFile;
  faFilePdf = faFilePdf;
  faFileWord = faFileWord;
  faFileExcel = faFileExcel;
  faFilePowerpoint = faFilePowerpoint;
  faFileImage = faFileImage;
  faFileVideo = faFileVideo;
  faFileAudio = faFileAudio;
  faFileArchive = faFileArchive;
  faFileCode = faFileCode;
  faDownload = faDownload;

  token: string = '';
  pinForm: FormGroup;
  downloadData: IDownloadPageData | null = null;
  pageLoading = true;
  downloadingFileId: number | null = null;
  downloadingAll = false;
  isPinVerified = false;
  companyInitial: string = '';
  brandLogo: string = '';
  isExpired = false;
  isLimitReached = false;
  verifyingPin = false;
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.token = params.id;
        if (this.token) {
          this.loadDownloadData();
        }
      });

    this.pinForm = this.fb.group({
      pin: ['', [Validators.required, Validators.pattern(/^(\d{4}|\d{6})$/)]]
    });
  }

  loadDownloadData(pin?: string): void {
    this.pageLoading = true;
    this.outsideService
      .getDownloadLinkData(this.token, pin)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.pageLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.downloadData = res.data;

            this.isExpired = res.data.expires_at
              ? new Date(res.data.expires_at) < new Date()
              : false;

            if (res.data.max_downloads) {
              this.isLimitReached =
                res.data.current_downloads >= res.data.max_downloads;
            }

            if (res.data.company_name) {
              this.companyInitial = res.data.company_name
                .charAt(0)
                .toUpperCase();
            }

            if (pin) {
              this.isPinVerified = true;
            }
          }
        }
      });
  }

  verifyPin(): void {
    this.pinForm.markAllAsTouched();

    if (this.pinForm.invalid) {
      return;
    }

    const { pin } = this.pinForm.value;
    this.verifyingPin = true;

    this.outsideService
      .verifyDownloadPin(this.token, pin)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.verifyingPin = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.isPinVerified = true;
            this.loadDownloadData(pin);
          }
        }
      });
  }

  downloadFile(fileId: number, fileName: string): void {
    this.downloadingFileId = fileId;
    const pin = this.pinForm.value.pin || undefined;

    this.outsideService
      .downloadFile(this.token, fileId.toString(), pin)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.downloadingFileId = null;
        })
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.alertService.successAlert({
            content: 'File downloaded successfully',
            title: 'Success'
          });
        }
      });
  }

  downloadAll(): void {
    this.downloadingAll = true;
    const pin = this.pinForm.value.pin || undefined;

    this.outsideService
      .downloadFolderAsZip(this.token, pin)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.downloadingAll = false;
        })
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${this.downloadData?.company_name || 'files'}_download.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.alertService.successAlert({
            content: 'All files downloaded successfully',
            title: 'Success'
          });
        }
      });
  }

  getFileIcon(fileType?: string): IconProp {
    if (!fileType) return this.faFile;

    const type = fileType.toLowerCase();

    if (type === 'pdf') return this.faFilePdf;
    if (['doc', 'docx', 'odt'].includes(type)) return this.faFileWord;

    if (['xls', 'xlsx', 'csv', 'ods'].includes(type)) return this.faFileExcel;

    if (['ppt', 'pptx', 'odp'].includes(type)) return this.faFilePowerpoint;

    if (
      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(type)
    ) {
      return this.faFileImage;
    }

    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(type)) {
      return this.faFileVideo;
    }

    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(type)) {
      return this.faFileAudio;
    }

    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(type)) {
      return this.faFileArchive;
    }

    if (
      [
        'js',
        'ts',
        'html',
        'css',
        'scss',
        'json',
        'xml',
        'php',
        'py',
        'java',
        'cpp',
        'c',
        'h'
      ].includes(type)
    ) {
      return this.faFileCode;
    }

    return this.faFile;
  }

  getFileSizeDisplay(fileSize?: number): string {
    if (!fileSize) return 'N/A';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  getModifiedDateDisplay(modifiedAt?: string): string {
    if (!modifiedAt) return 'N/A';
    return modifiedAt;
  }
}

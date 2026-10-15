import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
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
  faCloudArrowUp,
  faXmark,
  faFile,
  faCircleCheck
} from '@fortawesome/pro-solid-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { environment } from 'src/environments/environment';
import { IShareCollectData } from '../../v4-models/v4-document-vault.models';

@Component({
  selector: 'app-share-collect-outside',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FaIconComponent,
    CommonButtonV4Component,
    V35ControlMessageComponent,
    NgOptimizedImage
  ],
  templateUrl: './v4-share-collect-outside.component.html',
  styleUrl: './v4-share-collect-outside.component.scss'
})
export class ShareCollectOutsideComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private outsideService = inject(OutsideService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(V4AlertService);

  faCloudArrowUp = faCloudArrowUp;
  faXmark = faXmark;
  faFile = faFile;
  faCircleCheck = faCircleCheck;

  token: string = '';
  uploadForm: FormGroup;
  loading = false;
  pageLoading = true;
  shareData: IShareCollectData | null = null;
  selectedFiles: File[] = [];
  companyInitial: string = '';
  brandLogo: string = '';
  isExpired = false;
  isLimitReached = false;
  submitSuccess = false;
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  ngOnInit(): void {
    // Get token from route params
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.token = params.id;
        if (this.token) {
          this.loadShareCollectData();
        }
      });

    // Initialize form
    this.uploadForm = this.fb.group({
      comment: [''],
      pin: ['']
    });
  }

  loadShareCollectData(): void {
    this.pageLoading = true;
    this.outsideService
      .getShareCollectData(this.token)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.pageLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.shareData = res.data;

            // Set company initial
            if (res.data.company_name) {
              this.companyInitial = res.data.company_name
                .charAt(0)
                .toUpperCase();
            }

            // Set PIN validation if required
            if (res.data.pin_enabled) {
              this.uploadForm
                .get('pin')
                ?.setValidators([
                  Validators.required,
                  Validators.pattern(/^(\d{4}|\d{6})$/)
                ]);
              this.uploadForm.get('pin')?.updateValueAndValidity();
            }
          }
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  addFiles(files: File[]): void {
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    const maxFiles = this.shareData?.max_uploads;

    // Check file sizes and filter valid files
    const validFiles = files.filter((file) => {
      if (file.size > maxFileSize) {
        this.alertService.failedAlert({
          content: `File ${file.name} exceeds 25MB limit`,
          title: 'File Too Large'
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Check max files limit
    if (maxFiles && this.selectedFiles.length >= maxFiles) {
      this.alertService.failedAlert({
        content: `Maximum ${maxFiles} files allowed`,
        title: 'File Limit Reached'
      });
      return;
    }

    // Calculate how many files we can add
    const remainingSlots = maxFiles
      ? maxFiles - this.selectedFiles.length
      : validFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (maxFiles && validFiles.length > remainingSlots) {
      this.alertService.failedAlert({
        content: `Maximum ${maxFiles} files allowed`,
        title: 'File Limit Reached'
      });
    }

    // Create new array reference to trigger change detection
    this.selectedFiles = [...this.selectedFiles, ...filesToAdd];
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  openFileBrowser(): void {
    if (this.shareData?.max_uploads === 1 && this.selectedFiles.length > 0) {
      return;
    }
    this.fileInput.nativeElement.click();
  }

  canAddMoreFiles(): boolean {
    return !(
      this.shareData?.max_uploads === 1 && this.selectedFiles.length > 0
    );
  }

  onKeyDown(event: KeyboardEvent): void {
    if (
      this.canAddMoreFiles() &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      this.openFileBrowser();
    }
  }

  submitFiles(): void {
    this.uploadForm.markAllAsTouched();

    if (this.selectedFiles.length === 0) {
      this.alertService.failedAlert({
        content: 'Please select at least one file to upload',
        title: 'Validation Error'
      });
      return;
    }

    if (this.uploadForm.invalid) {
      return;
    }

    this.loading = true;

    const formData = new FormData();

    // Add files
    this.selectedFiles.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    // Add comment if provided
    if (this.uploadForm.value.comment) {
      formData.append('comment', this.uploadForm.value.comment);
    }

    // Add PIN if provided
    if (this.uploadForm.value.pin) {
      formData.append('pin', this.uploadForm.value.pin);
    }

    this.outsideService
      .submitShareCollectFiles(this.token, formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.submitSuccess = true;
          }
        }
      });
  }

  cancel(): void {
    this.selectedFiles = [];
    this.uploadForm.reset();
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, finalize, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICheckShipingTypes } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { GroupMailingService } from '../../../services/group-mailing.service';
import { V4MultiCheckStepperComponent } from '../../components/v4-multi-check-stepper/v4-multi-check-stepper.component';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-v4-multi-check-mail-upload',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TitleCasePipe,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4MultiCheckStepperComponent,
    MatTooltip
  ],
  templateUrl: './v4-multi-check-mail-upload.component.html',
  styleUrl: './v4-multi-check-mail-upload.component.scss'
})
export class V4MultiCheckMailUploadComponent implements OnInit {
  private groupMailingService = inject(GroupMailingService);
  private router = inject(Router);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  shippingTypeList = signal<ICheckShipingTypes[]>([]);
  submitting = signal(false);
  isSampleFileLoading = signal(false);
  sampleFileUrl = signal('');
  sampleZipFileUrl = signal('');
  isLoading = signal(false);
  isDragging = signal(false);
  selectedFileName = signal('');
  selectedFileSize = signal('');
  isFileSelected = signal(false);

  skeletonRows = Array(8);

  importForm = new FormGroup({
    includeHeader: new FormControl(false),
    file: new FormControl<File | null>(null, [Validators.required]),
    batch_name: new FormControl('')
  });

  ngOnInit(): void {
    this.getTemplates();
    this.getShippingTypes();
  }

  private getTemplates(): void {
    this.isSampleFileLoading.set(true);
    this.groupMailingService
      .getSampleFiles()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSampleFileLoading.set(false))
      )
      .subscribe((data) => {
        this.sampleFileUrl.set(data.data.sampleFileUrl);
        this.sampleZipFileUrl.set(data.data.sampleZipFileUrl);
      });
  }

  private getShippingTypes(): void {
    this.isLoading.set(true);
    this.checkService
      .getShippingType()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((data) => {
        this.shippingTypeList.set(data.data);
      });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  removeFile(): void {
    this.importForm.controls.file.setValue(null);
    this.selectedFileName.set('');
    this.selectedFileSize.set('');
    this.isFileSelected.set(false);
    this.fileInput.nativeElement.value = '';
  }

  private handleFile(file: File): void {
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.zip'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.setErrors({ invalidFileType: true });
      this.selectedFileName.set('');
      this.selectedFileSize.set('');
      this.isFileSelected.set(false);
      return;
    }

    this.importForm.controls.file.setValue(file);
    this.selectedFileName.set(file.name);
    this.selectedFileSize.set(this.formatFileSize(file.size));
    this.importForm.controls.file.setErrors(null);
    this.isFileSelected.set(true);
  }

  submit(): void {
    if (this.submitting() || !this.importForm.controls.file.value) {
      this.alertService.failedAlert({
        content: 'Please select a file to import'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', this.importForm.controls.file.value);
    formData.append(
      'includeHeader',
      this.importForm.controls.includeHeader.value ? 'yes' : 'no'
    );

    this.submitting.set(true);
    this.groupMailingService
      .importMultyChecks(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
        catchError(() => of(null))
      )
      .subscribe((data) => {
        if (data?.success) {
          const batchName = this.importForm.controls.batch_name.value || '';
          this.router.navigate(
            ['/v4/manage/business-tools/mail-dashboard/multi-check-mail2'],
            {
              state: {
                res: JSON.stringify(data?.data),
                templateName: 'Default template',
                batchName
              }
            }
          );
        }
      });
  }

  downloadClick(): void {
    window.location.href = this.sampleFileUrl();
  }

  downloadZipClick(): void {
    window.location.href = this.sampleZipFileUrl();
  }

  backButtonClick(): void {
    this.router.navigate([
      '/v4/manage/business-tools/mail-dashboard/multi-check-mail-table'
    ]);
  }

  getShippingName(name: string): string {
    if (!name) return '';
    return name.replace(/\s*[–-]?\s*\d+(\.\d+)?$/, '').trim();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }
}

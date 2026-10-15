import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faCircleQuestion, faUpToLine } from '@fortawesome/pro-solid-svg-icons';
import { catchError, finalize, of, Subject, takeUntil } from 'rxjs';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { Router } from '@angular/router';
import { ICheckShipingTypes } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgClass, TitleCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { GroupMailingService } from '../../services/group-mailing.service';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

@Component({
  selector: 'app-multi-check-mail1',
  standalone: true,
  imports: [
    ControlMessageComponent, 
    ReactiveFormsModule,
    FaIconComponent,
    CommonButtonV35Component,
    TitleCasePipe,
    MatTooltipModule,
    CommonBackButtonV35Component,
    CommonInputFieldComponent,
    NgClass
  ],
  templateUrl: './multi-check-mail1.component.html',
  styleUrl: './multi-check-mail1.component.scss'
})
export class MultiCheckMail1Component implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private groupMailingService = inject(GroupMailingService);
  private route = inject(Router);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  shippingTypeList=signal<ICheckShipingTypes[]>([]);

  submitting = signal<boolean>(false);
  isSampleFileLoading = signal<boolean>(false);
  sampleFileUrl = signal<string>('');
  sampleZipFileUrl = signal<string>('');
  isLoading = signal<boolean>(false);
  importForm: FormGroup;
  isDragging = signal<boolean>(false);
  selectedFileName = signal<string>('');
  selectedFileSize = signal<string>('');

  faAngleRight = faAngleRight;
  faCircleQuestion = faCircleQuestion;
  faUpToLine = faUpToLine;
  isFileSelected = signal<boolean>(false);

  ngOnInit(): void {
    this.initImportForm();
    this.getTemplates();
    this.getShippingTypes();
  }

  getTemplates() {
    this.isSampleFileLoading.set(true);
      this.groupMailingService.getSampleFiles()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSampleFileLoading.set(false))
      )
      .subscribe((data) => {
        this.sampleFileUrl.set(data.data.sampleFileUrl);
        this.sampleZipFileUrl.set(data.data.sampleZipFileUrl);
      });
  }

  initImportForm() {
    this.importForm = new FormGroup({
      includeHeader: new FormControl(false),
      file: new FormControl('', [Validators.required]),
      batch_name: new FormControl(''),
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
      this.isFileSelected.set(true);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
      this.isFileSelected.set(true);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  private handleFile(file: File) {
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.zip'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.setErrors({ invalidFileType: true });
      this.selectedFileName.set('');
      this.selectedFileSize.set('');
      return;
    }

    this.importForm.controls.file.setValue(file);
    this.selectedFileName.set(file.name);
    this.selectedFileSize.set(this.formatFileSize(file.size));
    this.importForm.controls.file.setErrors(null);
  }

  uploadEvent(event: File | null) {
    if (event && event?.name) {
      this.handleFile(event);
    } else {
      this.importForm.controls.file.setValue(null);
      this.selectedFileName.set('');
      this.selectedFileSize.set('');
      this.importForm.controls.file.markAsTouched();
    }
  }

  getFormData() {
    const formData = new FormData();
    formData.append('file', this.importForm.controls.file.value);
    formData.append('includeHeader', this.importForm.controls.includeHeader.value ? 'yes' : 'no');
    return formData;
  }

  submit() {
    if (this.submitting() || !this.importForm.controls.file.value) {
      this.alertService.failedAlert({
        content: 'Please select a file to import',
      });
      return;
    }
    const formData = this.getFormData();
    this.submitting.set(true);
    this.groupMailingService.importMultyChecks(formData)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.submitting.set(false)),
      catchError(() => of(null))
    )
    .subscribe((data) => {
      if (data?.success) {
        const batchName = this.importForm.controls.batch_name.value || '';
        this.route.navigate(['manage/business-tools/mail-dashboard/multi-check-mail2'], {
          state: { 
            res: JSON.stringify(data?.data), 
            templateName: 'Default template',
            batchName
          }
        });
      }
    });
  }

  downloadClick() {
    window.location.href = this.sampleFileUrl();
  }

  downloadZipClick() {
    window.location.href = this.sampleZipFileUrl();
  }

  getShippingTypes() {
    this.isLoading.set(true);
    this.checkService.getShippingType()
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    )
    .subscribe((data) => {
      this.shippingTypeList.set(data.data);
    });
  }

  getShippingName(name: string): string {
    if (!name) return '';

    // Removes trailing price information (with optional dash and spaces) and retains only the service name
    return name.replace(/\s*[–-]?\s*\d+(\.\d+)?$/, '').trim();
  }

  backButtonClick () {
    this.route.navigate(['manage/business-tools/mail-dashboard/multi-check-mail-table']);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k**i).toFixed(2))  } ${  sizes[i]}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

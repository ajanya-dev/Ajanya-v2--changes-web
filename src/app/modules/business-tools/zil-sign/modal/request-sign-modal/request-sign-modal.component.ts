import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowUpFromLine,
  faTrash,
  faPlus,
  faGrid
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { DecimalPipe, NgClass } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { Subscription } from 'rxjs';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { ZilSignService } from '../../service/zil-sign.service';

interface PdfJsGlobal {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { data: ArrayBuffer; isEvalSupported?: boolean }) => {
    promise: Promise<{
      getPage: (pageNumber: number) => Promise<{
        getViewport: (options: { scale: number }) => {
          height: number;
          width: number;
        };
        render: (context: { canvasContext: CanvasRenderingContext2D; viewport: { height: number; width: number } }) => {
          promise: Promise<void>;
        };
      }>;
    }>;
  };
}

// Declare PDF.js from global window object (loaded from local assets)
declare const pdfjsLib: PdfJsGlobal;

@Component({
  selector: 'app-request-sign-modal',
  standalone: true,
  imports: [
    FaIconComponent,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    ReactiveFormsModule,
    NgClass,
    DecimalPipe,
    V35CommonDropDownSelectorComponent,
    NewPhoneInputComponent,
    MatCheckboxModule,
    OcwBackButtonComponent
  ],
  templateUrl: './request-sign-modal.component.html',
  styleUrl: './request-sign-modal.component.scss'
})
export class RequestSignModalComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private alertService = inject(AlertService);
  private zilSignService = inject(ZilSignService);
  private router = inject(Router);
  private headerService = inject(HeaderService);

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  readonly MAX_RECIPIENTS = 5;
  readonly SMS_CHARGE_PER_RECIPIENT = 0.50;

  faUpload = faArrowUpFromLine;
  faTrash = faTrash;
  faPlus = faPlus;
  faGrid = faGrid;
  loading = false;
  uploadedFiles: File[] = [];
  isDragOver = false;
  subscriptions: Subscription[] = [];
  currentUserEmail = '';
  currentUserName = '';
  documentNameControl = new FormControl('', [Validators.required]);
  pdfThumbnailUrl: string | null = null;
  documentNameInputId = 'request-sign-document-name';

  roleOptions = [
    { value: 'signer', name: 'Needs to sign' },
    { value: 'receives_copy', name: 'Receive a copy' }
  ];

  recipientsFormArray = new FormArray<FormGroup>([]);

  ngOnInit(): void {
    this.getCurrentUserInfo();
    // Add two default recipient rows on initialization
    this.addRecipient();
    this.addRecipient();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getCurrentUserInfo(): void {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res: false | IHeaderData) => {
        if (res && typeof res !== 'boolean') {
          this.currentUserEmail = res.personalInfo?.email || res.userInfo?.email || '';
          this.currentUserName = res.personalInfo?.name || res.userInfo?.name || '';
        }
      })
    );
  }


  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles([files[0]]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles([input.files[0]]);
      input.value = '';
    }
  }

  openFileBrowser(): void {
    this.fileInput.nativeElement.click();
  }

  async handleFiles(files: File[]): Promise<void> {
    if (files.length === 0) return;

    const file = files[0];

    if (file.type !== 'application/pdf') {
      this.alertService.failedAlert({
        content: `File "${file.name}" is not a PDF. Only PDF files are allowed.`,
        title: 'Invalid File Type'
      });
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.alertService.failedAlert({
        content: `File "${file.name}" exceeds the maximum size of 10MB.`,
        title: 'File Too Large'
      });
      return;
    }

    this.uploadedFiles = [file];
    // Set the document name (remove .pdf extension for editing)
    const nameWithoutExtension = file.name.replace(/\.pdf$/i, '');
    this.documentNameControl.setValue(nameWithoutExtension);

    // Generate PDF thumbnail
    await this.generatePdfThumbnail(file);
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.documentNameControl.setValue('');
    this.pdfThumbnailUrl = null;
  }

  async generatePdfThumbnail(file: File): Promise<void> {
    try {
      // Set worker path for pdfjs
      if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.js';
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
      const pdf = await loadingTask.promise;

      // Get first page
      const page = await pdf.getPage(1);

      // Set scale for thumbnail (smaller scale for thumbnail)
      const scale = 0.5;
      const viewport = page.getViewport({ scale });

      // Create canvas element
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render page to canvas
      if (context) {
        const renderContext = {
          canvasContext: context,
          viewport
        };
        await page.render(renderContext).promise;

        // Convert canvas to data URL
        this.pdfThumbnailUrl = canvas.toDataURL('image/png');
      }
    } catch (error) {

      this.pdfThumbnailUrl = null;
    }
  }

  getRecipientFormGroup(index: number): FormGroup {
    return this.recipientsFormArray.at(index) as FormGroup;
  }

  createRecipientFormGroup(data?: Partial<{
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    role: string;
    usePhone: boolean;
  }>): FormGroup {
    const formGroup = new FormGroup({
      recipientName: new FormControl(data?.recipientName || '', [Validators.required]),
      recipientEmail: new FormControl(data?.recipientEmail || '', [ValidationService.emailValidator]),
      recipientPhone: new FormControl(data?.recipientPhone || ''),
      role: new FormControl(data?.role || 'signer', [Validators.required]),
      usePhone: new FormControl(data?.usePhone || false)
    });

    // Setup phone validation based on usePhone checkbox
    this.subscriptions.push(
      formGroup.get('usePhone')?.valueChanges.subscribe(usePhone => {
        const phoneControl = formGroup.get('recipientPhone');
        if (usePhone) {
          phoneControl?.enable();
          phoneControl?.setValidators([Validators.required]);
        } else {
          phoneControl?.disable();
          phoneControl?.clearValidators();
          phoneControl?.setValue('');
        }
        phoneControl?.updateValueAndValidity();
      }) as Subscription
    );

    // Set initial disabled state for phone
    const usePhone = data?.usePhone || false;
    if (!usePhone) {
      formGroup.get('recipientPhone')?.disable();
    }

    // Trigger initial validation setup
    formGroup.get('usePhone')?.updateValueAndValidity();

    return formGroup;
  }

  addRecipient(): void {
    if (this.recipientsFormArray.length >= this.MAX_RECIPIENTS) {
      this.alertService.failedAlert({
        content: `Maximum ${this.MAX_RECIPIENTS} recipients allowed`,
        title: 'Recipient Limit Reached'
      });
      return;
    }

    // Simply add a new empty recipient row
    this.recipientsFormArray.push(this.createRecipientFormGroup());
  }

  addMe(): void {
    if (!this.currentUserEmail || !this.currentUserName) {
      this.alertService.failedAlert({
        content: 'Unable to retrieve user information',
        title: 'Error'
      });
      return;
    }

    if (this.recipientsFormArray.length >= this.MAX_RECIPIENTS) {
      this.alertService.failedAlert({
        content: `Maximum ${this.MAX_RECIPIENTS} recipients allowed`,
        title: 'Recipient Limit Reached'
      });
      return;
    }

    // Check if already added
    const alreadyAdded = this.recipientsFormArray.controls.some(
      control => control.get('recipientEmail')?.value === this.currentUserEmail
    );

    if (alreadyAdded) {
      this.alertService.failedAlert({
        content: 'You are already added as a recipient',
        title: 'Duplicate Recipient'
      });
      return;
    }

    this.recipientsFormArray.push(
      this.createRecipientFormGroup({
        recipientName: this.currentUserName,
        recipientEmail: this.currentUserEmail,
        recipientPhone: '',
        role: 'signer',
        usePhone: false
      })
    );
  }

  removeRecipient(index: number): void {
    this.recipientsFormArray.removeAt(index);
  }

  getRoleName(value: string): string {
    const role = this.roleOptions.find(r => r.value === value);
    return role ? role.name : value;
  }

  getPhoneRecipientsCount(): number {
    return this.recipientsFormArray.controls.filter(
      control => control.get('recipientPhone')?.value.trim()
    ).length;
  }

  getTotalSmsCost(): number {
    return this.getPhoneRecipientsCount() * this.SMS_CHARGE_PER_RECIPIENT;
  }

  saveAndExit(): void {
    this.router.navigate(['manage/business-tools/zil-sign/sign-doc-list']);
  }

  continue(): void {
    if (this.uploadedFiles.length === 0) {
      this.alertService.failedAlert({
        content: 'Please upload a PDF file',
        title: 'Missing File'
      });
      return;
    }

    if (this.documentNameControl.invalid) {
      this.documentNameControl.markAsTouched();
      this.alertService.failedAlert({
        content: 'Please enter a valid document name',
        title: 'Invalid Document Name'
      });
      return;
    }

    if (this.recipientsFormArray.length === 0) {
      this.alertService.failedAlert({
        content: 'Please add at least one recipient',
        title: 'Missing Recipients'
      });
      return;
    }

    // Validate all recipients
    let hasErrors = false;
    this.recipientsFormArray.controls.forEach((recipientGroup) => {
      // Mark all controls as touched to show validation errors
      recipientGroup.markAllAsTouched();

      // Check if form group is invalid
      if (recipientGroup.invalid) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      this.alertService.failedAlert({
        content: 'Please fix the errors in recipient information',
        title: 'Invalid Recipient Data'
      });
      return;
    }

    this.requestSign();
  }

  requestSign(): void {
    this.loading = true;

    const formData = new FormData();

    formData.append('pdf', this.uploadedFiles[0]);

    // Use the editable document name with .pdf extension
    const documentName = this.documentNameControl.value
      ? `${this.documentNameControl.value}.pdf`
      : this.uploadedFiles[0].name || 'random file name';
    formData.append('name', documentName);
    
    const recipients = this.recipientsFormArray.controls.map((recipient) => ({
      name: recipient.get('recipientName')?.value,
      email: recipient.get('recipientEmail')?.value || '',
      phone: recipient.get('recipientPhone')?.value || '',
      role: recipient.get('role')?.value,
      usePhone: recipient.get('usePhone')?.value
    }));
    
    formData.append('recipients', JSON.stringify(recipients));

    this.zilSignService
      .requestSign(formData)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Request sent successfully',
              title: 'Success'
            });
            this.router.navigate([`sign-pdf-viewer/${res.data.id}`]);
          } else {
            this.alertService.failedAlert({
              content: 'Something went wrong',
              title: 'Error'
            });
          }
        }
      });
  }
}

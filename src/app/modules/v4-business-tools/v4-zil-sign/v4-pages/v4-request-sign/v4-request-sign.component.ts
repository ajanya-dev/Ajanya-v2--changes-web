import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription, finalize, take } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { ZilSignService } from 'src/app/modules/business-tools/zil-sign/service/zil-sign.service';

interface PdfJsGlobal {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { data: ArrayBuffer; isEvalSupported?: boolean }) => {
    promise: Promise<{
      getPage: (pageNumber: number) => Promise<{
        getViewport: (options: { scale: number }) => {
          height: number;
          width: number;
        };
        render: (context: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { height: number; width: number };
        }) => { promise: Promise<void> };
      }>;
    }>;
  };
}

declare const pdfjsLib: PdfJsGlobal;

@Component({
  selector: 'app-v4-request-sign',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ReactiveFormsModule,
    MatCheckbox,
    MatTooltipModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './v4-request-sign.component.html',
  styleUrls: ['./v4-request-sign.component.scss']
})
export class V4RequestSignComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private alert = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private zilSignService = inject(ZilSignService);

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  readonly MAX_RECIPIENTS = 5;
  readonly SMS_CHARGE_PER_RECIPIENT = 0.5;

  loading = signal(false);
  isDragOver = signal(false);
  uploadedFile = signal<File | null>(null);
  pdfThumbnailUrl = signal<string | null>(null);

  documentNameControl = new FormControl('', [Validators.required]);
  recipientsFormArray = new FormArray<FormGroup>([]);

  roleOptions = [
    { value: 'signer', name: 'Needs to sign' },
    { value: 'receives_copy', name: 'Receive a copy' }
  ];

  roleDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select role',
    displayField: 'name',
    outputField: 'value'
  };

  currentUserName = '';
  currentUserEmail = '';
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: true,
      animation: false
    });
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe(
        (res: false | IHeaderData) => {
          if (res && typeof res !== 'boolean') {
            this.currentUserEmail =
              res.personalInfo?.email || res.userInfo?.email || '';
            this.currentUserName =
              res.personalInfo?.name || res.userInfo?.name || '';
          }
        }
      )
    );

    this.addRecipient();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/v4-business-tools/zil-sign']);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
      input.value = '';
    }
  }

  openFileBrowser(): void {
    this.fileInput.nativeElement.click();
  }

  async handleFile(file: File): Promise<void> {
    if (file.type !== 'application/pdf') {
      this.alert.failedAlert({
        content: `File "${file.name}" is not a PDF. Only PDF files are allowed.`,
        title: 'Invalid File Type'
      });
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.alert.failedAlert({
        content: `File "${file.name}" exceeds the maximum size of 10MB.`,
        title: 'File Too Large'
      });
      return;
    }

    this.uploadedFile.set(file);
    const nameWithoutExtension = file.name.replace(/\.pdf$/i, '');
    this.documentNameControl.setValue(nameWithoutExtension);
    await this.generatePdfThumbnail(file);
  }

  removeFile(): void {
    this.uploadedFile.set(null);
    this.pdfThumbnailUrl.set(null);
    this.documentNameControl.setValue('');
  }

  async generatePdfThumbnail(file: File): Promise<void> {
    try {
      if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'assets/pdfjs/pdf.worker.min.js';
      }
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const scale = 0.5;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        this.pdfThumbnailUrl.set(canvas.toDataURL('image/png'));
      }
    } catch {
      this.pdfThumbnailUrl.set(null);
    }
  }

  getRecipientFormGroup(index: number): FormGroup {
    return this.recipientsFormArray.at(index) as FormGroup;
  }

  createRecipientFormGroup(
    data?: Partial<{
      recipientName: string;
      recipientEmail: string;
      recipientPhone: string;
      role: string;
      usePhone: boolean;
    }>
  ): FormGroup {
    const formGroup = new FormGroup({
      recipientName: new FormControl(data?.recipientName || '', [
        Validators.required
      ]),
      recipientEmail: new FormControl(data?.recipientEmail || '', [
        ValidationService.emailValidator
      ]),
      recipientPhone: new FormControl(data?.recipientPhone || ''),
      role: new FormControl(data?.role || 'signer', [Validators.required]),
      usePhone: new FormControl(data?.usePhone || false)
    });

    this.subscriptions.push(
      formGroup.get('usePhone')!.valueChanges.subscribe((usePhone) => {
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
      })
    );

    if (!(data?.usePhone || false)) {
      formGroup.get('recipientPhone')?.disable();
    }
    formGroup.get('usePhone')?.updateValueAndValidity();

    return formGroup;
  }

  addRecipient(): void {
    if (this.recipientsFormArray.length >= this.MAX_RECIPIENTS) {
      this.alert.failedAlert({
        content: `Maximum ${this.MAX_RECIPIENTS} recipients allowed`,
        title: 'Recipient Limit Reached'
      });
      return;
    }
    this.recipientsFormArray.push(this.createRecipientFormGroup());
  }

  addMe(): void {
    if (!this.currentUserEmail || !this.currentUserName) {
      this.alert.failedAlert({
        content: 'Unable to retrieve user information',
        title: 'Error'
      });
      return;
    }
    if (this.recipientsFormArray.length >= this.MAX_RECIPIENTS) {
      this.alert.failedAlert({
        content: `Maximum ${this.MAX_RECIPIENTS} recipients allowed`,
        title: 'Recipient Limit Reached'
      });
      return;
    }
    const alreadyAdded = this.recipientsFormArray.controls.some(
      (control) =>
        control.get('recipientEmail')?.value === this.currentUserEmail
    );
    if (alreadyAdded) {
      this.alert.failedAlert({
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

  togglePhone(index: number): void {
    const group = this.getRecipientFormGroup(index);
    const usePhone = group.get('usePhone')?.value;
    group.get('usePhone')?.setValue(!usePhone);
  }

  getPhoneRecipientsCount(): number {
    return this.recipientsFormArray.controls.filter((control) => {
      const value = control.get('recipientPhone')?.value;
      return value && (value as string).trim();
    }).length;
  }

  getTotalSmsCost(): number {
    return this.getPhoneRecipientsCount() * this.SMS_CHARGE_PER_RECIPIENT;
  }

  continue(): void {
    if (!this.uploadedFile()) {
      this.alert.failedAlert({
        content: 'Please upload a PDF file',
        title: 'Missing File'
      });
      return;
    }

    if (this.documentNameControl.invalid) {
      this.documentNameControl.markAsTouched();
      this.alert.failedAlert({
        content: 'Please enter a valid document name',
        title: 'Invalid Document Name'
      });
      return;
    }

    if (this.recipientsFormArray.length === 0) {
      this.alert.failedAlert({
        content: 'Please add at least one recipient',
        title: 'Missing Recipients'
      });
      return;
    }

    let hasErrors = false;
    this.recipientsFormArray.controls.forEach((g) => {
      g.markAllAsTouched();
      if (g.invalid) hasErrors = true;
    });
    if (hasErrors) {
      this.alert.failedAlert({
        content: 'Please fix the errors in recipient information',
        title: 'Invalid Recipient Data'
      });
      return;
    }

    const hasSigner = this.recipientsFormArray.controls.some(
      (g) => g.get('role')?.value !== 'receives_copy'
    );
    if (!hasSigner) {
      this.alert.failedAlert({
        content: 'Please add at least one recipient who needs to sign',
        title: 'Missing Signer'
      });
      return;
    }

    this.requestSign();
  }

  private requestSign(): void {
    const file = this.uploadedFile();
    if (!file) return;

    this.loading.set(true);
    const formData = new FormData();
    formData.append('pdf', file);
    const documentName = this.documentNameControl.value
      ? `${this.documentNameControl.value}.pdf`
      : file.name;
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
        finalize(() => this.loading.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data?.id) {
            this.alert.successAlert({
              content: 'Request created successfully',
              title: 'Success'
            });
            this.router.navigate([
              '/v4/manage/v4-business-tools/zil-sign/sign-pdf-viewer',
              res.data.id
            ]);
          } else {
            this.alert.failedAlert({
              content: 'Something went wrong',
              title: 'Error'
            });
          }
        }
      });
  }
}

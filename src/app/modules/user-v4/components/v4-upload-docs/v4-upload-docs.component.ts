import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Download,
  X,
  Upload,
  FileText,
  FilePlus
} from 'lucide-angular';
import { Subscription, finalize } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';

@Component({
  selector: 'app-v4-upload-docs',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './v4-upload-docs.component.html',
  styleUrls: ['./v4-upload-docs.component.scss']
})
export class V4UploadDocsComponent implements OnInit, OnDestroy {
  private alert = inject(V4AlertService);
  private userService = inject(UserProfileService);

  readonly DownloadIcon = Download;
  readonly XIcon = X;
  readonly UploadIcon = Upload;
  readonly FileTextIcon = FileText;
  readonly FilePlusIcon = FilePlus;

  supportDocDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select file type',
    displayField: 'name',
    outputField: 'value'
  };

  subscriptions: Subscription[] = [];
  supportDocName = '';
  uploadedFiles: Record<string, string>[];
  currentFileName: string[] = [];
  currentFile: File[] = [];
  fileName: string[] = [];
  file: File[] = [];
  iterable = 0;
  isLoading = signal(false);
  isSubmit = signal(false);

  acceptedFileTypes = [
    '.pdf',
    '.jpg',
    '.png',
    '.csv',
    '.xlsx',
    '.xls',
    '.docx',
    '.doc',
    '.rtf',
    '.txt'
  ];

  supportDocuments = [
    { value: 'llc_corporation_document', name: 'LLC/Corporation Document' },
    { value: 'ein_letter', name: 'EIN Letter' },
    { value: 'irs', name: 'IRS' },
    { value: 'business_proof', name: 'Any Business Proof' },
    { value: 'others', name: 'Others' }
  ];

  ngOnInit(): void {
    this.getUploadedFiles();
  }

  getUploadedFiles(): void {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.userService
        .getDocuments()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          this.uploadedFiles = res.data;
        })
    );
  }

  onFileInputChange(event: Event, position: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileName[position] = input.files[0].name;
      this.file[position] = input.files[0];
      input.value = '';
    }
  }

  onChange(val: string): void {
    this.supportDocName = val;
  }

  multipleUploadInput(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    if (!input.files?.length) return;

    const remaining = 4 - this.iterable;
    if (remaining <= 0) {
      this.alert.infoAlert({
        title: 'Info',
        content:
          'You can upload a maximum of 4 attachments for supporting documents.',
        close: true,
        timeout: 1500
      });
      input.value = '';
      return;
    }

    const filesToAdd = Math.min(input.files.length, remaining);
    for (let i = 0; i < filesToAdd; i += 1) {
      this.currentFileName[this.iterable] = input.files[i].name;
      this.currentFile[this.iterable] = input.files[i];
      this.iterable += 1;
    }

    if (input.files.length > remaining) {
      this.alert.infoAlert({
        title: 'Info',
        content:
          'You can upload a maximum of 4 attachments for supporting documents.',
        close: true,
        timeout: 1500
      });
    }
    input.value = '';
  }

  removeFile(index: number): void {
    this.currentFileName.splice(index, 1);
    this.currentFile.splice(index, 1);
    this.iterable -= 1;
  }

  onUploadClick(): void {
    const body = new FormData();

    for (let i = 0; i < this.fileName.length; i += 1) {
      if (this.fileName[i] !== undefined && this.file[i] !== undefined) {
        body.append('uplaod_document[]', this.file[i]);
        body.append('uplaod_document_name[]', this.fileName[i]);
      }
    }

    for (let i = 0; i < this.currentFileName.length; i += 1) {
      if (this.currentFileName[i] && this.currentFile[i]) {
        body.append('uplaod_document[]', this.currentFile[i] as File);
        body.append(
          'uplaod_document_name[]',
          this.currentFileName[i] as string
        );
      }
    }

    this.uploadDocuments(body);
  }

  uploadDocuments(file: FormData): void {
    this.isSubmit.set(true);
    this.subscriptions.push(
      this.userService
        .uploadDocs(file)
        .pipe(finalize(() => this.isSubmit.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.alert.successAlert({
              title: 'Success',
              content: 'Documents Uploaded',
              close: true,
              timeout: 1500
            });
            this.getUploadedFiles();
            this.currentFileName = [];
            this.fileName = [];
            this.currentFile = [];
            this.file = [];
            this.supportDocName = '';
            this.iterable = 0;
          }
        })
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes  } B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)  } KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)  } MB`;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}

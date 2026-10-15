import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDownload, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * @description Component for uploading documents in profile section.
 */
@Component({
  selector: 'app-upload-docs',
  templateUrl: './upload-docs.component.html',
  styleUrls: ['./upload-docs.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonUploadButtonV35Component,
    FaIconComponent,
    CommonButtonV35Component,
    MatTooltip,
    NgOptimizedImage
  ]
})
export class UploadDocsComponent implements OnInit, OnDestroy {
  private alert = inject(AlertService);
  private userService = inject(UserProfileService);

  @ViewChild('formationDocument')
  formationDocument: CommonUploadButtonV35Component;

  @ViewChild('ownerShipDocument')
  ownerShipDocument: CommonUploadButtonV35Component;

  @ViewChild('principleDocument')
  principleDocument: CommonUploadButtonV35Component;

  subscriptions: Subscription[] = [];
  supportDocName = '';
  uploadedFiles: string[];
  currentFileName: string[] = [];
  currentFile: File[] = [];
  fileName: string[] = [];
  file: File[] = [];
  iterable = 0;
  isLoading = signal(false);
  isSubmit = signal(false);
  faXmark = faXmark;
  faDownload = faDownload;

  supportDocuments = [
    { value: 'llc_corporation_document', name: 'LLC/Corporation Document' },
    { value: 'ein_letter', name: 'EIN Letter' },
    { value: 'irs', name: 'IRS' },
    { value: 'business_proof', name: 'Any Business Proof' },
    { value: 'others', name: 'Others' }
  ];

  ngOnInit() {
    this.getUploadedFiles();
  }

  /**
   * @description Method to get the already uploaded files
   */
  getUploadedFiles() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.userService
        .getDocuments()
        .pipe(
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe((res) => {
          this.uploadedFiles = res.data;
        })
    );
  }

  /**
   * @description Method to transfer the click to another html element.
   */
  uploadButton() {
    const fileInput = document.getElementById('file') as HTMLInputElement;
    fileInput.click();
  }

  filePicked(event: File, position: number) {
    if (event?.name) {
      this.fileName[position] = event.name;
      this.file[position] = event;
    } else {
      this.fileName.splice(position, 1);
      this.file.splice(position, 1);
    }
  }

  /**
   * @description Method to set the document name from options in select menu
   * @param val - selected option
   */
  onChange(val: string) {
    this.supportDocName = val;
  }

  /**
   * @description Method for multiple file upload
   * @param event - event containing files to be uploaded
   */
  multipleUploadInput(evt: Event) {
    const event = evt.target as HTMLInputElement;
    if (this.iterable === 4) {
      const data = {
        title: 'Info',
        content:
          'You can upload a maximum of 4 attachments for supporting documents.',
        close: true,
        timeout: 1500
      };
      this.alert.infoAlert(data);
    } else if (this.iterable < 4) {
      if (event.files) {
        this.currentFileName[this.iterable] = event.files[0].name;
        this.currentFile[this.iterable] = event.files[0];
        this.iterable += 1;
      }
    }
  }

  removeFile(index: number) {
    this.currentFileName.splice(index, 1);
    this.currentFile.splice(index, 1);
    this.iterable -= 1;
  }

  /**
   * @description Method to invoke upon clicking upload
   */
  onUploadClick() {
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

  /**
   * @description Method to upload the selected documents
   * @param file - The file ot be uploaded.
   */
  uploadDocuments(file: FormData) {
    this.isSubmit.set(true);
    this.subscriptions.push(
      this.userService
        .uploadDocs(file)
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success',
              content: 'Documents Uploaded',
              close: true,
              timeout: 1500
            };
            this.alert.successAlert(data);
            this.getUploadedFiles();
            this.currentFileName = [];
            this.fileName = [];
            this.currentFile = [];
            this.file = [];
            this.formationDocument.removePickedImage();
            this.ownerShipDocument.removePickedImage();
            this.principleDocument.removePickedImage();
            this.supportDocName = '';
            this.iterable = 0;
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

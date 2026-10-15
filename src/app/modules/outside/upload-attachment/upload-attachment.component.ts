import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { Subscription, finalize } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import {
  faCircleCheck,
  faFile,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IPaymentMetaData } from '../model/outside';

@Component({
  standalone: true,
  imports: [
    NgClass,
    TruncatePipe,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-upload-attachment',
  templateUrl: './upload-attachment.component.html',
  styleUrls: ['./upload-attachment.component.scss']
})
export class UploadAttachmentComponent implements OnInit,OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private outsideService = inject(OutsideService);
  private alertService = inject(AlertService);

  document: File[] = [];
  verificationId: string;
  metaData?: IPaymentMetaData;
  documentType?: string;
  uuid: string;
  isFileUpload = signal(true);
  uploading = signal(false);
  uploaded = signal(false);
  linkExpired = signal(false);
  isLoading = signal(false);
  documentTypeId: string;
  subscriptions: Subscription[] = [];
  isCardProgram: string | undefined;

  faFile = faFile;
  faCircleCheck = faCircleCheck;
  faXmark = faXmark;

  ngOnInit(): void {
    this.verificationId = this.activatedRoute.snapshot.params['id'];
    this.isCardProgram = this.activatedRoute.snapshot.queryParams['type'] || undefined;
  

    if (this.router.url.includes('deposit-slips')) {
      this.documentTypeId = 'deposit-slips';
    } else if (this.router.url.includes('checks')) {
      this.documentTypeId = 'checks';
    }
    this.getPaymentMetaData(this.documentTypeId);
  }

  filePicked(event: Event) {
    if (event.target === null) return;
    if ((event.target as HTMLInputElement).files?.length) {
      if (
        this.document.find(
          (doc) =>
            doc.name ===
            ((event.target as HTMLInputElement).files as FileList)[0].name
        )
      ) {
        this.alertService.warningAlert({ content: 'File already exist.' });
        return;
      }
      this.document?.push(
        ((event.target as HTMLInputElement).files as FileList)[0]
      );
    }
  }

  /**
   * @description Function for opening file choose window for user when clicking on input div.
   * @param input - HTML file input element. creates a click on it if either card or invoice are not selected
   * @returns
   */
  chooseFile(input: HTMLInputElement) {
    if (this.document?.length === 5 || this.linkExpired()) {
      return;
    }
    input.click();
  }

  getPaymentMetaData(documentType: string) {
    this.isLoading.set(true);
    if (documentType === 'deposit-slips') {
      const headerOptions = new HttpHeaders({
        'Content-Type': 'application/json',
        isDisable422: 'true'
      });
      this.subscriptions.push(
        this.outsideService
          .getDepositSlipMetaData(this.verificationId, headerOptions)
          .pipe(
            finalize(() => {
              this.isLoading.set(false);
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.metaData = res.data;
                this.uuid = this.metaData.uuid as string;
                this.documentType = res.data.documentType;
                this.isFileUpload.set(true);
              }
            },
            error: (err: { success: boolean; errorMsg: string }) => {
              if (!err.success) {
                this.linkExpired.set(true);
                this.isFileUpload.set(false);
              }
            }
          })
      );
    } else if (documentType === 'checks') {
      const headerOptions = new HttpHeaders({
        'Content-Type': 'application/json',
        isDisable422: 'true'
      });
      this.subscriptions.push(
        this.outsideService
          .getcheckMetaData(this.verificationId, headerOptions)
          .pipe(
            finalize(() => {
              this.isLoading.set(false);
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.metaData = res.data;
                this.uuid = this.metaData.uuid as string;
                this.documentType = res.data.documentType;
                this.isFileUpload.set(true);
              }
            },
            error: (err: { success: boolean; errorMsg: string }) => {
              if (!err.success) {
                this.linkExpired.set(true);
                this.isFileUpload.set(false);
              }
            }
          })
      );
    }
  }

  removeFile(input: string) {
    this.document = this.document.filter((file) => file.name !== input);
  }

  uploadFile() {
    if (!this.document?.length) {
      const data = {
        content: 'Please select a file'
      };
      this.alertService.infoAlert(data);
      return;
    }
    this.uploading.set(true);
    const formData = new FormData();
    formData.append('uuid', this.uuid);
    this.document.forEach((docs) => {
      formData.append('document[]', docs);
    });

    if (this.documentTypeId === 'deposit-slips') {
      this.subscriptions.push(
        this.outsideService
          .uploadDepositSlipAttachments(formData)
          .pipe(
            finalize(() => {
              this.uploading.set(false);
              this.isFileUpload.set(false);
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.uploaded.set(true);
                this.document = [];
              }
            },
            error: (err) => {
              if (err) {
                this.linkExpired.set(true);
                this.document = [];
              }
            }
          })
      );
    } else if (this.documentTypeId === 'checks') {

      if(this.isCardProgram && this.isCardProgram === 'card-program'){
        this.subscriptions.push(
          this.outsideService
            .uploadCardAttachments(formData)
            .pipe(
              finalize(() => {
                this.uploading.set(false);
                this.isFileUpload.set(false);
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.uploaded.set(true);
                  this.document = [];
                }
              },
              error: (err) => {
                if (err) {
                  this.linkExpired.set(true);
                  this.document = [];
                }
              }
            })
        );
      }else if(this.isCardProgram && this.isCardProgram === 'card-details'){
        this.subscriptions.push(
          this.outsideService
            .uploadCardDetailsAttachments(formData)
            .pipe(
              finalize(() => {
                this.uploading.set(false);
                this.isFileUpload.set(false);
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.uploaded.set(true);
                  this.document = [];
                }
              },
              error: (err) => {
                if (err) {
                  this.linkExpired.set(true);
                  this.document = [];
                }
              }
            })
        );

      }else{
        this.subscriptions.push(
          this.outsideService
            .uploadChecksAttachments(formData)
            .pipe(
              finalize(() => {
                this.uploading.set(false);
                this.isFileUpload.set(false);
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.uploaded.set(true);
                  this.document = [];
                }
              },
              error: (err) => {
                if (err) {
                  this.linkExpired.set(true);
                  this.document = [];
                }
              }
            })
        );
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

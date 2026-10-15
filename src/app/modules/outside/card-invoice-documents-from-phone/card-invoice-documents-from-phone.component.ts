import { takeUntil, finalize } from 'rxjs/operators';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { ActivatedRoute } from '@angular/router';
import {
  VERIFICATION_DOCUMENT_ACCEPT,
  VERIFICATION_DOCUMENT_ERROR,
  isAcceptedVerificationDocument
} from 'src/app/shared/utils/verification-document.util';
import { IPaymentMetaData } from '../model/outside';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { NgIf, NgClass } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

@Component({
  selector: 'app-card-invoice-documents-from-phone',
  templateUrl: './card-invoice-documents-from-phone.component.html',
  styleUrls: ['./card-invoice-documents-from-phone.component.scss'],
  standalone: true,
  imports: [NgIf, NgClass, TruncatePipe]
})
export class CardInvoiceDocumentsFromPhoneComponent
  implements OnInit, OnDestroy
{
  private _outsideService = inject(OutsideService);
  private _appSettingService = inject(AppSettingsService);
  private _route = inject(ActivatedRoute);
  private alertService = inject(AlertService);

  private destroy$ = new Subject();
  appConfig: IAppConfig;
  linkExpired = false;
  loading = false;
  uploading = false;
  uploaded = false;
  document: File | undefined = undefined;
  showError = false;
  documentType: IPaymentMetaData['documentType'] = 'card';
  uuId: string;
  acceptedDocumentTypes = VERIFICATION_DOCUMENT_ACCEPT;
  metaData?: IPaymentMetaData;

  ngOnInit(): void {
    this.uuId = this._route.snapshot.queryParams.identity;
    this.loadAppSettings();
    this.getPaymentMetaData();
  }

  loadAppSettings(): void {
    this._appSettingService.appConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      });
  }

  getPaymentMetaData() {
    this.loading = true;
    this._outsideService
      .getPaymentMetaData(this.uuId)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.metaData = {
              ...res.data,
              cardNickName: res.data.cardNickName?.split('(')[0]
            };
            this.documentType = res.data.documentType;
          }
        },
        error: (err: { success: boolean; errorMsg: string }) => {
          if (!err.success) {
            this.linkExpired = true;
          }
        }
      });
  }

  /**
   * @description Function for opening file choose window for user when clicking on input div.
   * @param input - HTML file input element. creates a click on it if either card or invoice are not selected
   * @returns
   */
  chooseFile(input: HTMLInputElement) {
    if (this.document?.name) {
      return;
    }
    input.click();
  }

  /**
   * @description Funciton to be called when there is file input change event. if event has files in target property, we are just storing that file to currespoding variable.
   * @param event - File input change event
   * @param file - we should pass this param to know which file are we choosing. so we can store the file in currespoding variable.
   */
  filePicked(event: Event) {
    if (event.target === null) return;
    const selectedFile = ((event.target as HTMLInputElement).files as FileList)[0];
    if (!isAcceptedVerificationDocument(selectedFile)) {
      this.alertService.failedAlert({
        content: VERIFICATION_DOCUMENT_ERROR
      });
      return;
    }
    if ((event.target as HTMLInputElement).files?.length) {
      this.document = ((event.target as HTMLInputElement).files as FileList)[0];
    }
  }

  /**
   * @description function for remove alredy selected file from stored variable.
   * @param input - HTML file input element. accepting input to clear its value.
   * @param file - we should pass this param to know which file are we removeing. so we can remove the file in currespoding variable.
   */
  removeFile(input: HTMLInputElement) {
    input.value = '';
    this.document = undefined;
    this.showError = true;
  }

  uploadFile() {
    if (!this.document?.name) return;

    const formData = new FormData();
    formData.append('uuid', this.uuId);
    formData.append('document', this.document);

    this.uploading = true;
    this._outsideService
      .uploadPaymentVerificationDocument(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.uploading = false))
      )
      .subscribe((res) => {
        if (res) {
          this.uploaded = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

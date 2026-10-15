import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { faCircleCheck, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { IKycKybInfo } from 'src/app/models/bank';
import { IMicroDepositMetaData } from '../../model/outside';
import { TruncatePipe } from '../../../../pipes/truncate.pipe';

@Component({
  selector: 'app-micro-deposit-doc-upload',
  templateUrl: './micro-deposit-doc-upload.component.html',
  styleUrls: ['./micro-deposit-doc-upload.component.scss'],
  standalone: true,
  imports: [NgClass, TruncatePipe, NgOptimizedImage, FaIconComponent]
})
export class MicroDepositDocUploadComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private outsideService = inject(OutsideService);
  private appSettingService = inject(AppSettingsService);

  uuId: string;
  loading = false;
  linkExpired = false;
  metaData: IMicroDepositMetaData;
  documentType: string[] = [];
  appConfig: IAppConfig;
  document: { name: undefined } | undefined;
  uploading = false;
  uploaded = false;
  documentField: { name: string; field: string }[] = [];
  govIdUploaded: boolean;
  bankStatementUploaded: boolean;
  subscriptions: Subscription[] = [];
  faCircleCheck = faCircleCheck;
  faXmark = faXmark;
  faPlus = faPlus;
  isKycVerified = false;

  showError: Record<string, File | boolean> = {
    bankStatement: false,
    govId: false,
    businessInfo1: false,
    businessInfo2: false
  };

  documentUploaded: Record<string, File | undefined> = {
    bankStatement: undefined,
    govId: undefined,
    businessInfo1: undefined,
    businessInfo2: undefined
  };

  ngOnInit(): void {
    this.uuId = this.route.snapshot.queryParams.uuid;
    this.getPaymentMetaData(this.route.snapshot.queryParams.uuid);
    this.loadAppSettings();
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      })
    );
  }

  /**
   *@description To get the meta data using the uuId
   * @param uuId  unique id got from route
   */
  getPaymentMetaData(uuId = this.uuId) {
    this.loading = true;
    this.subscriptions.push(
      this.outsideService
        .getMicroDepositMetaData(uuId)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.metaData = res.data;
              this.setDocumentField(res.data.kycKybInfo);
            }
          },
          error: (err: { success: boolean; errorMsg: string }) => {
            if (!err.success) {
              this.linkExpired = true;
            }
          }
        })
    );
  }

  setDocumentField(kycKybInfo:IKycKybInfo){
    if(kycKybInfo.kycStatus && kycKybInfo.kybRecords?.length > 0){
      this.documentField = [
        { name: 'Banking Statement', field: 'bankStatement' },

      ];
    }else if(kycKybInfo.kycStatus){
      this.documentField = [
        { name: 'Banking Statement', field: 'bankStatement' },
        { name: 'Business Info', field: 'businessInfo1' },
        { name: 'Other Info', field: 'businessInfo2' }
      ];
    }else{
      this.documentField = [
        { name: 'Government Id', field: 'govId' },
        { name: 'Banking Statement', field: 'bankStatement' },
        { name: 'Business Info', field: 'businessInfo1' },
        { name: 'Other Info', field: 'businessInfo2' }
      ];
    }
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
  filePicked(event: Event, field: string) {
    if (event.target === null) return;
    if ((event.target as HTMLInputElement).files?.length) {
      if (field === 'govId') {
        this.govIdUploaded = true;
      } else if (field === 'bankStatement') {
        this.bankStatementUploaded = true;
      }
      this.documentUploaded[field] = (
        (event.target as HTMLInputElement).files as FileList
      )[0];
      this.showError[field] = false;
    }
  }

  /**
   * @description function for remove alredy selected file from stored variable.
   * @param input - HTML file input element. accepting input to clear its value.
   * @param file - we should pass this param to know which file are we removeing. so we can remove the file in currespoding variable.
   */
  removeFile(input: HTMLInputElement, field: string) {
    if (field === 'govId') {
      this.govIdUploaded = false;
      this.showError[field] = true;
    } else if (field === 'bankStatement') {
      this.bankStatementUploaded = false;
      this.showError[field] = true;
    }
    // eslint-disable-next-line no-param-reassign
    input.value = '';
    this.document = undefined;
    this.documentUploaded[field] = undefined;
  }

  /**
   * @description Uploads the given files
   * @returns
   */
  uploadFile() {
    let requiredFieldPending = false;
    if (!this.govIdUploaded && !this.metaData.kycKybInfo.kycStatus) {
      this.showError.govId = true;
      requiredFieldPending = true;
    }
    if (!this.bankStatementUploaded) {
      this.showError.bankStatement = true;
      requiredFieldPending = true;
    }
    if (requiredFieldPending) {
      return;
    }
    const formData = new FormData();
    formData.append('uuid', this.uuId);
    if(this.metaData.kycKybInfo.kycStatus){
      formData.append(
        'use_kyc',
        this.metaData.kycKybInfo.kycStatus.toString()
      );
    }
    this.documentField.forEach((el) => {
      if (this.documentUploaded[el.field]) {
        formData.append(el.field, this.documentUploaded[el.field] as File);
      }
    });

    this.uploading = true;
    this.subscriptions.push(
      this.outsideService
        .uploadMicroDepositOutsideDocumentVerify(formData)
        .pipe(
          finalize(() => {
            this.uploading = false;
          })
        )
        .subscribe((res) => {
          if (res) {
            this.uploaded = true;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

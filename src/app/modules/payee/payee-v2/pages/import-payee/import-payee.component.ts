import { Subscription, finalize } from 'rxjs';
import { Params, Router } from '@angular/router';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { NgClass, NgIf } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faAngleRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';

@Component({
  selector: 'app-import-payee',
  templateUrl: './import-payee.component.html',
  styleUrls: ['./import-payee.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    CommonButtonV35Component,
    FontAwesomeModule,
    NgClass,
    CommonUploadButtonV35Component
  ]
})
export class ImportPayeeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);

  subscriptions: Subscription[] = [];
  fileName = 'Upload Document';
  files: File | undefined;
  templateFile =
    'https://api-staging.api.ocw.sebipay.com/cdn/download/sample_multi_data_file.xlsx';

  isBankingACHUser = false;
  isLoading = false;
  isSampleFileLoading = signal(false);
  faAngleRight = faAngleRight;

  ngOnInit(): void {
    this.checkWhetherIsABankingACHUser();
  }

  /**
   * Method for checking for ACH user
   */
  checkWhetherIsABankingACHUser() {
    this.isSampleFileLoading.set(true);
    this.subscriptions.push(
      this.payeeService.checkWhetherIsBankingACHUser()
      .pipe(
        finalize(() => {
          this.isSampleFileLoading.set(false);
        })
      )
      .subscribe((data) => {
        if (data.success) {
          if (data.data.isBankingAchEnabled === 1) {
            this.isBankingACHUser = true;
            this.templateFile = data.data.sampleFileUrl;
          } else {
            this.templateFile = data.data.sampleFileUrl;
          }
        }
      })
    );
  }

  /**
   * Method for handling file upload event
   */
  uploadEvent(files: File): void {
    this.files = undefined;
    if (files && files.name) {
      this.fileName = files?.name as string;
      this.files = files;
    } else {
      this.fileName = '';
    }
  }

  /**
   * Method for submitting file
   */
  uploadInput(): void {
    if ((this.files as File)?.name) {
      this.fileName = this.files?.name as string;
      const formData = this.getFormData(this.files as File);
      const templateName = 'payeeTemplate';
      this.isLoading = true;
      this.subscriptions.push(
        this.payeeService
          .multiImportStep2(formData)
          .pipe(
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe((data) => {
            if (data.success) {
              try{
                this.router.navigate(['manage/payee/payee_data_import/step2'], {
                  state: { res: JSON.stringify(data.data), templateName }
                });
              } catch(err){
                this.isLoading = false;
              }
            }
          })
      );
    } else {
      this.onError({
        errMsg: 'Please click on browse and select a valid file'
      });
    }
  }

  /**
   * Method for getting form data
   */
  getFormData(fileData: File): FormData {
    const body: Params = {
      template: 'templateFile',
      excelFile: fileData,
      includeHeader: true
    };
    const formData = new FormData();
    Object.keys(body).forEach((key) => {
      const value = body[key as keyof typeof body];
      formData.append(key, value instanceof File ? value : value.toString());
    });
    return formData;
  }

  /**
   * Method for handling error message
   * @param err - error
   * */
  onError(err: { errMsg: string }) {
    this.alertService.warningAlert({ content: err.errMsg });
  }

  /**
   * method handles sample file download
   */
  downloadClick() {
    window.location.href = this.templateFile;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}

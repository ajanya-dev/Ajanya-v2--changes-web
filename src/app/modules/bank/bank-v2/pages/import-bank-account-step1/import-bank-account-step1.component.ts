import { faAngleRight } from '@fortawesome/pro-solid-svg-icons';
import { Component, OnDestroy,  inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { NgClass, NgIf } from '@angular/common';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-import-bank-account-step1',
  templateUrl: './import-bank-account-step1.component.html',
  styleUrls: ['./import-bank-account-step1.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    CommonUploadButtonV35Component,
    FontAwesomeModule,
    CommonButtonV35Component
  ]
})
export class ImportBankAccountStep1Component implements  OnDestroy {
  /**
   * dependency injection
   */
  private bankAccService = inject(BankAccountsService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  /**
   * class properties
   */
  docs: FormData;
  subscriptions: Subscription[] = [];
  selectFileName = '';
  isSubmitting = false;

  /**
   * icon
   */
  faAngleRight = faAngleRight;

  /**
   * sample file path
   */
  sourcePath =
    'https://c.onlinecheckwriter.com/public/cdn/download/sample_bank_data.xlsx';

  /**
   * sample file name
   */
  fileName = 'sample_bank_data.xlsx';

  /**
   * @description Method for handling file upload event
   * @param files -file
   */
  onUploadFile(files: File): void {
    if (files && files?.name) {
      this.selectFileName = files?.name;

      const formData = new FormData();
      formData.append('excelFile[]', files);
      this.docs = formData;
    } else {
      this.selectFileName = '';
      this.docs = new FormData();
    }
  }

  /**
   * @description  Upload selected file.
   *
   */
  submit() {
    if (this.selectFileName === '') {
      const data = {
        content: 'Please select a file'
      };
      this.alertService.infoAlert(data);
      return;
    }
    this.isSubmitting = true;

    this.subscriptions.push(
      this.bankAccService
        .uploadXlDocStep2(this.docs)
        .pipe(
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe((res) => {
          this.isSubmitting = false;
          if (res.success) {
            try {
              this.router.navigate(
                ['manage/bankaccount/import-bankaccount/step2'],
                { state: { example: JSON.stringify(res.data) } }
              );
            } catch (err) {
              this.isSubmitting = false;
            }
          }
        })
    );
  }

  /**
   * method handles sample file download
   */
  downloadClick() {
    window.location.href =
      'https://c.onlinecheckwriter.com/public/cdn/download/sample_bank_data.xlsx?_ga=2.108388939.898780388.1641787952-1962123330.1635179220';
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

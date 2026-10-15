/* eslint-disable no-restricted-globals */
import { DatePipe, NgClass, NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IConfirmAlert } from 'src/app/models/alert';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleExclamation,
  faCircleInfo
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

interface IErrorMsg {
  payee_name: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_country: string;
  cheque_memo: string;
  cheque_notes: string;
  check_account_number: string;
  check_invoice_number: string;
  check_issue_date: string;
  cheque_amount: number;
  payee_phone: string;
  payee_email: number;
  payee_company_name: string;
  cheque_serial_number: string;
  category_name: string;
  payee_nick_name: string;
  account_number: string;
  routing_number: string;
  account_type: string;
  payee_first_name: string;
  payee_last_name: string;
  payment_method: string;
  customMailType: string;
  customSpFileNumber: string;
  customHours: string;
  validationError: { [key: string]: string };
  row_number: number;
}

@Component({
  selector: 'app-multi-import-step2',
  templateUrl: './multi-import-step2.component.html',
  styleUrls: ['./multi-import-step2.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    FormsModule,
    CommonButtonV35Component,
    NgStyle,
    MatTooltip,
    FaIconComponent,
    NgClass
  ]
})
export class MultiImportStep2Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);
  public alertService = inject(AlertService);
  private datePipe = inject(DatePipe);

  subscriptions: Subscription[] = [];
  submitting = false;
  savingTemplate = false;

  data: Params;
  headerOptions: { key: string; value: string; isRequired?: boolean }[] = [];
  headerColumns: { selectedIndex: string }[] = [];
  templateName: string;
  showSaveTemplate = false;
  disableMapping: Params = {};
  checkData: { [key: string]: string }[] = [];
  showErrorPage = false;
  validationData: IErrorMsg[] = [];

  // checkData is capped at 5 rows, so the hint is only relevant when the file has more.
  get showPreviewHint(): boolean {
    return (this.data?.chequeData?.length ?? 0) > 5;
  }

  faCircleExclamation = faCircleExclamation;
  faCircleInfo = faCircleInfo;
  source: string;
  requiredHeaderKeys: string[] = ['0', '1', '3', '5', '6', '7', '8','14']; // Payee Full Name, Amount, Payee Adrs L1, City, State, Zip, Country, Payee Email
  tableHeaders = [
    'Row No',
    'DATE',
    'PAYEE',
    'PAYEE NICKNAME',
    'PAYEE EMAIL',
    'PAYEE PHONE',
    'AMOUNT',
    'MEMO',
    'NOTE',
    'AC#',
    'ROUTING NO',
    'INV#',
    'CHECK NO',
    'COMPANY NAME',
    'ADDRESS LINE 1',
    'ADDRESS LINE 2',
    'CITY',
    'STATE',
    'COUNTRY',
    'ZIP',
    'PAYMENT METHOD'
  ] as const;

  tableFields = [
    'row_number',
    'check_issue_date',
    'payee_name',
    'payee_nick_name',
    'payee_email',
    'payee_phone',
    'cheque_amount',
    'cheque_memo',
    'cheque_notes',
    'check_account_number',
    'routing_number',
    'check_invoice_number',
    'cheque_serial_number',
    'payee_company_name',
    'payee_address_line_1',
    'payee_address_line_2',
    'payee_city',
    'payee_state',
    'payee_country',
    'payee_zip',
    'payment_method'
  ] as const;

  ngOnInit(): void {
    if (!history.state?.res) {
      return;
    }

    this.data = JSON.parse(history.state.res);
    this.source = history.state?.source ?? '';
    this.formatCheckData();
    this.headerOptions = this.makeHeader(this.data.header[0], this.source === 'wallet');
    this.templateName = history.state.templateName;

    if (this.data?.template?.length) {
      this.data?.template.forEach((item: string) => {
        this.headerColumns.push({ selectedIndex: item });
      });

      this.mappingChange();
    } else {
      for (let i = 0; i < 21; i += 1) {
        this.headerColumns.push({ selectedIndex: '' });
      }
    }
  }

  formatCheckData() {
    for (let i = 0; i <= 4; i += 1) {
      if (this.data?.chequeData?.length <= i) {
        return;
      }

      const row = this.data?.chequeData[i];
      const obj: Params = {};

      Object.keys(row).forEach((key) => {
        if (typeof row[key] === 'object' && row[key]?.date) {
          obj[key] = this.datePipe.transform(row[key].date, 'shortDate');
        } else {
          obj[key] = row[key];
        }
      });
      this.checkData.push(obj);
    }
  }
  
  makeHeader(data: {
    [key: string]: string;
  }, isWallet: boolean = false): { key: string; value: string; isRequired?: boolean }[] {
    const headers: { key: string; value: string; isRequired?: boolean }[] = [];
    Object.entries(data).forEach(([key, value]) => {
      const isRequired = isWallet && this.requiredHeaderKeys.includes(key);
      headers.push({ 
        key, 
        value: isRequired ? `${value} *` : value,
        isRequired 
      });
    });
    return headers;
  }

  mappingChange() {
    this.disableMapping = {};
    this.headerColumns.forEach((item: { selectedIndex: string | number }) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = !isNaN(
          item.selectedIndex as number
        );
      }
    });
  }

  submit(isProceedAnyWay?: boolean) {
    const requiredAny1 = ['0', '23', '24'];
    let payeeNameSelected = false;
    let payeeSelectedIdx: number = 0;

    const mapping = this.headerColumns.map(
      (row: { selectedIndex: string }, index: number) => {
        if (requiredAny1.includes(row.selectedIndex)) {
          payeeNameSelected = true;
        }
        if (row.selectedIndex === '0') {
          payeeSelectedIdx = index;
        }
        return row.selectedIndex;
      }
    );

    let isPayeeNameSelected = 1;
    if (this.templateName === 'Default template') {
      isPayeeNameSelected = 0;
      this.checkData.forEach((row) => {
        if (Object.values(row)[payeeSelectedIdx] !== '') {
          isPayeeNameSelected = 1;
        }
      });
    }

    // Validate required fields are mapped (only for wallet source)
    if (this.source === 'wallet') {
      const mappedHeaderKeys = new Set(
        this.headerColumns
          .map((row: { selectedIndex: string }) => row.selectedIndex)
          .filter((key: string) => key !== '')
      );

      const missingRequiredFields: string[] = [];
      const headerData = this.data.header[0];
      
      this.requiredHeaderKeys.forEach((requiredKey) => {
        if (!mappedHeaderKeys.has(requiredKey)) {
          // Get original field name from header data
          const fieldName = headerData?.[requiredKey] || requiredKey;
          missingRequiredFields.push(fieldName);
        }
      });

      if (missingRequiredFields.length > 0) {
        this.alertService.failedAlert({
          content: `Please map the following required fields: ${missingRequiredFields.join(', ')}`
        });
        return;
      }
    }

    if (!payeeNameSelected || isPayeeNameSelected === 0) {
      this.alertService.failedAlert({ content: 'Please select payee name' });
      return;
    }

    const body = {
      mapping,
      uploadFromImport: 'yes',
      proceedForCheckNumber: isProceedAnyWay ? 1 : 0
    };
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .multiImportStep3(body, this.source === 'wallet' ? 'wallet-checks' : 'checks-import')
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe({
          next: (data) => {
            if (data?.success) {
              this.router.navigate(['manage/cheque/multi_import/step3'],{state: {source: this.source}});
              this.showErrorPage = false;
            }
          },
          error: (err) => {
            if (err.error.errorCode === 190) {
              this.proceedModal(err.error.errorMsg);
            }
            if (err.error.errorCode === 191) {
              this.showErrorPage = true;
              this.validationData = err.error.errorMsg;
            }
          }
        })
    );
  }

  proceedModal(err: string) {
    const warn = this.openConfirmAlert('Do you want to proceed anyway?', err);
    warn.afterClosed().subscribe((res) => {
      if (res) {
        this.submit(true);
      }
    });
  }

  openConfirmAlert(content: string, title?: string) {
    const data: IConfirmAlert = {
      title: title || 'Confirm',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  toggleShowTemp() {
    this.showSaveTemplate = !this.showSaveTemplate;
  }

  saveTemplate(name: HTMLInputElement) {
    if (!name.value) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please enter template name'
      });
      return;
    }

    const template = this.headerColumns.map((row: { selectedIndex: string }) =>
      row.selectedIndex ? row.selectedIndex : ''
    );

    const body = { template, nick_name: name.value };

    this.savingTemplate = true;
    this.subscriptions.push(
      this.checkService
        .saveNewTemplate(body)
        .pipe(
          finalize(() => {
            this.savingTemplate = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Template saved !',
              close: true,
              timeout: 2500
            });
          }
        })
    );
  }

  back() {
    this.showErrorPage = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}

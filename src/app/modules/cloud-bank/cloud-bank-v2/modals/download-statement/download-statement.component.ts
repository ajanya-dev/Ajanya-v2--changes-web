import { OnInit, Component, inject, OnDestroy } from '@angular/core';
import { DatePipe, NgIf, NgFor, NgStyle } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { ISuccessAlert } from 'src/app/models/alert';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  MatDatepickerInputEvent,
  MatDateRangeInput,
  MatStartDate,
  MatEndDate,
  MatDatepickerToggle,
  MatDateRangePicker
} from '@angular/material/datepicker';
import { ICloudBankLimitData } from 'src/app/modules/cloud-bank/model/cloudbank';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { faXmark, faArrowDownToLine } from '@fortawesome/pro-solid-svg-icons';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { CloudBankDetailsDataV35Service } from '../../../cloud-bank-v3/services/cloud-bank-details-data-v35.service';

interface IDialogData {
  type?: string;
  page?: string;
  id?: string;
}
/**
 * @description Component for downloading bank statements.
 */
@Component({
  selector: 'app-download-statement',
  templateUrl: './download-statement.component.html',
  styleUrls: ['./download-statement.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    NgFor,
    NgStyle,
    MatFormField,
    MatDateRangeInput,
    MatStartDate,
    MatEndDate,
    MatDatepickerToggle,
    MatSuffix,
    MatDateRangePicker,
    FontAwesomeModule,
    FormsModule,
    MatTooltip
  ]
})
export class DownloadStatementComponent implements OnDestroy, OnInit {
  faXmark = faXmark;
  faArrowDownToLine = faArrowDownToLine;

  types = [
    { key: 1, name: 'Last Month' },
    { key: 2, name: 'Last 3 Months' },
    { key: 3, name: 'Last 6 Months' },
    { key: 6, name: 'Last Year' },
    { key: 4, name: 'All Time' }
  ] as const;

  selectedValue = 'pdf';

  customDate = { start: '', end: '' };

  subscriptions: Subscription[] = [];
  loading: number | undefined;
  limitDetails: ICloudBankLimitData;
  selectedVersion: 1 | 2 = 1;

  cloudService = inject(CloudBankService);
  cloudDetailsV35Service = inject(CloudBankDetailsDataV35Service);
  datePipe = inject(DatePipe);
  alerService = inject(AlertService);
  dialogData: IDialogData = inject(MAT_DIALOG_DATA);
  private walletService = inject(WalletService);
  private dialogRef = inject(MatDialogRef<DownloadStatementComponent>);

  ngOnInit(): void {
    if (this.dialogData?.type) {
      this.getLimit();
    }
  }

  /**
   * @description Retrieves bank limit details for the account.
   */
  getLimit() {}

  /**
   * @description Initiates the download of a bank statement.
   * @param key - The statement type key.
   */
  download(key: number,version: 1 | 2) {
    this.selectedVersion = version;
    this.loading = key;
    const body: Record<string, string | number> = {
      dateType: key,
      type: this.selectedValue,
      purpose: 1,
      statementVersion: version
    };
    if (key === 5) {
      body.fromDate = this.customDate.start;
      body.toDate = this.customDate.end;
    }
    if (this.dialogData?.page === 'wallet') {
      this.downloadWalletStatement(this.dialogData?.id as string, body);
      return;
    }
    const { accountId } = this.cloudDetailsV35Service;
    if (accountId) {
      this.subscriptions.push(
        this.cloudService
          .downloadStatement(body, accountId)
          .pipe(
            finalize(() => {
              this.loading = undefined;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              if (res.url) {
                const urlLoaded = window.open(res?.url);
                if (!urlLoaded) {
                  window.open(res.url);
                }
              } else {
                this.openSuccessAlert(
                  'Your bank statement is emailed successfully.Check the email to download the statement'
                );
              }
            }
          })
      );
    }
  }

  /**
   * @description Handles changes in the custom date range for statement download.
   * @param ev - MatDatepickerInputEvent containing the selected date.
   * @param type - The date type ('start' or 'end').
   */
  customDateChange(
    ev: MatDatepickerInputEvent<string, HTMLInputElement>,
    type: 'start' | 'end'
  ) {
    if (type === 'start') {
      this.customDate.end = '';
    }
    const dateStr = this.datePipe.transform(ev.value, 'yyyy-MM-dd');
    if (dateStr) this.customDate[type] = dateStr;
  }

  /**
   * @description Initiates the download of a wallet statement.
   * @param walletId Selected wallet uuId.
   * @param dateRange Selected date range.
   */
  downloadWalletStatement(
    walletId: string,
    dateRange: Record<string, string | number>
  ) {
    this.subscriptions.push(
      this.walletService
        .downloadStatement(walletId, dateRange)
        .pipe(
          finalize(() => {
            this.loading = undefined;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if(res.data?.emailed) {
              this.openSuccessAlert(res.data?.message);
              return;
            }
            if (res.data?.url) {
              this.dialogRef.close();
              const urlLoaded = window.open(res?.data?.url);
              if (!urlLoaded) {
                window.open(res.data?.url);
              }
            }             
          }
        })
    );
  }

  /**
   * @description Displays a success alert with the given content.
   * @param content - The content to display in the success alert.
   */
  openSuccessAlert(content: string): void {
    const dialogData: ISuccessAlert = {
      title: 'Success!',
      content,
      close: false,
      doneMsg: 'OK'
    };
    this.alerService.successAlert(dialogData);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}

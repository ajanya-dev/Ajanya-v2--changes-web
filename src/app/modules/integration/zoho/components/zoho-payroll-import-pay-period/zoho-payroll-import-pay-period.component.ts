import { finalize } from 'rxjs/operators';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IPayPeriodData } from '../../../model/integration';
import { MatTooltip } from '@angular/material/tooltip';
import { NgFor, NgStyle, NgIf } from '@angular/common';

/**
 * Component for importing pay periods in Zoho Payroll integration.
 */
@Component({
  selector: 'app-zoho-payroll-import-pay-period',
  templateUrl: './zoho-payroll-import-pay-period.component.html',
  styleUrls: ['./zoho-payroll-import-pay-period.component.scss'],
  standalone: true,
  imports: [NgFor, NgStyle, NgIf, MatTooltip]
})
export class ZohoPayrollImportPayPeriodComponent implements OnInit, OnDestroy {
  @Input() PayPeriodData: IPayPeriodData;
  @Input() companyId: string;

  loading: number | undefined = undefined;
  subscriptions: Subscription[] = [];
  allReadyImported: string[] = [];

  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.allReadyImported = this.PayPeriodData.dbPayrun;
  }

  /**
   * Initiates the import of payroll transactions for a pay period.
   * @param payrollRunId - The ID of the payroll run to import.
   * @param i - Index of the pay period in the list.
   */
  importTransactions(payrollRunId: string, i: number): void {
    this.loading = i;
    this.subscriptions.push(
      this._integrationService
        .importPayrollTransactions(this.companyId, payrollRunId)
        .pipe(finalize(() => (this.loading = undefined)))
        .subscribe((res) => {
          if (res?.success) {
            if (res.success) {
              this.openSuccessAlert('Successfully Imported.');
              this.allReadyImported.push(payrollRunId);
            }
          }
        })
    );
  }

  /**
   * Opens a success alert with the given content.
   * @param content - The content to display in the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

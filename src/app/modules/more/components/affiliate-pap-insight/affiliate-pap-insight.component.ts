import { DatePipe, NgClass } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IRowData,
  ITransactionsData,
  IUserEarningData
} from 'src/app/modules/more/model/affiliate';
import { RequestToPayoutModalComponent } from 'src/app/modules/more/modals/request-to-payout-modal/request-to-payout-modal.component';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { TruncatePipe } from '../../../../pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * Component for displaying insights on affiliate earnings and data.
 */
@Component({
  selector: 'app-affiliate-pap-insight',
  templateUrl: './affiliate-pap-insight.component.html',
  styleUrls: ['./affiliate-pap-insight.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    TruncatePipe
  ]
})
export class AffiliatePapInsightComponent implements OnInit, OnDestroy {
  /**
   * Input for affiliate earnings data.
   */
  @Input() earningData: IUserEarningData;

  /**
   * Input for loading indicator status.
   */
  @Input() loading: boolean;

  private _affiliateService = inject(AffiliateProgramsService);
  private _matDialog = inject(MatDialog);
  private _datePipe = inject(DatePipe);

  /**
   * Array to hold active subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Loading indicator for transaction data.
   */
  transactionLoading = false;

  /**
   * Loading indicator for traffic data.
   */
  trafficLoading = false;

  /**
   * Loading indicator for link clicks data.
   */
  linksLoading = false;

  /**
   * Array to hold sub-tabs for insights.
   */
  subTabs = [
    { id: 'traffic', title: 'Traffic Data' },
    { id: 'transaction', title: 'Transaction Data' },
    { id: 'link-clicks', title: 'Link Clicks' }
  ];

  /**
   * Array to hold traffic data.
   */
  trafficData: { name: string; value: number }[] = [];

  /**
   * Array to hold transaction data.
   */
  transactionData: ITransactionsData[];

  /**
   * Array to hold clicked data for links.
   */
  clickedData: IRowData[] = [];

  /**
   * Currently active sub-tab.
   */
  currentTab = this.subTabs[0].id;

  /**
   * Form group for date range selection.
   */
  dateForm: FormGroup;

  /**
   * Current date.
   */
  currentDate = new Date();

  /**
   * Date of the past month.
   */
  pastMonthDate = new Date().setMonth(this.currentDate.getMonth() - 1);

  /**
   * Initializes the component and retrieves initial data.
   */
  ngOnInit(): void {
    this.initForm();
    this.getTrafficData();
    this.getTransactionData();
  }

  /**
   * Formats a date value to 'yyyy-MM-dd' format using DatePipe.
   *
   * @param date - The date value to be formatted.
   * @returns The formatted date string.
   */
  formatDate(date: string | number | Date) {
    return this._datePipe.transform(date, 'yyyy-MM-dd');
  }

  /**
   * Initializes the date selection form.
   */
  initForm() {
    this.dateForm = new FormGroup({
      from_date: new FormControl(
        this.formatDate(this.pastMonthDate),
        Validators.required
      ),
      to_date: new FormControl(
        this.formatDate(this.currentDate),
        Validators.required
      )
    });
  }

  /**
   * Retrieves traffic data based on the selected date range.
   */
  getTrafficData() {
    this.trafficLoading = true;
    this.subscriptions.push(
      this._affiliateService
        .getTrafficStatsHistory(this.dateForm.value)
        .pipe(finalize(() => (this.trafficLoading = false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.trafficData = res.data;
            }
          }
        })
    );
  }

  /**
   * Retrieves transaction data based on the selected date range.
   */
  getTransactionData() {
    this.transactionLoading = true;
    this.subscriptions.push(
      this._affiliateService
        .getAdditionalStatus(this.dateForm.value)
        .pipe(finalize(() => (this.transactionLoading = false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.transactionData = res.data.transactions_data;
            }
          }
        })
    );
  }

  /**
   * Retrieves link clicks data based on the selected date range.
   */
  getLinkClicks() {
    this.linksLoading = true;
    this.subscriptions.push(
      this._affiliateService
        .getRawClicks(this.dateForm.value)
        .pipe(finalize(() => (this.linksLoading = false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.clickedData = res.data.rows;
            }
          }
        })
    );
  }

  /**
   * Filters data based on the selected date range.
   */
  filterData() {
    if (this.dateForm.invalid) return;
    if (this.currentTab === 'traffic') {
      this.getTrafficData();
    } else if (this.currentTab === 'transaction') {
      this.getTransactionData();
    } else {
      this.getLinkClicks();
    }
  }

  /**
   * Opens the request to payout modal dialog.
   */
  onWithdraw() {
    this._matDialog.open(RequestToPayoutModalComponent);
  }

  /**
   * Cleans up all subscriptions to prevent memory leaks when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

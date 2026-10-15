import { finalize } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ScriptService } from 'src/app/core/services/script.service';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CopiedTextComponent } from 'src/app/shared/components/copied-text/copied-text.component';
import {
  IAffilaiteTable,
  IAffilateStatus,
  IAffiliateForm,
  IAffiliateJoin,
  IAffiliatePayHistory,
  IRowData,
  ITransactionsData,
  IUserEarningData,
  IUserTransactionHistory
} from 'src/app/modules/more/model/affiliate';
import { MatDialog } from '@angular/material/dialog';
import { RequestToPayoutModalComponent } from '../../modals/request-to-payout-modal/request-to-payout-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  NgClass,
  NgIf,
  NgFor,
  TitleCasePipe,
  CurrencyPipe,
  DatePipe
} from '@angular/common';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

/**
 * Component for joining an affiliate program and managing affiliate-related actions.
 */
@Component({
  selector: 'app-affiliate-join',
  templateUrl: './affiliate-join.component.html',
  styleUrls: ['./affiliate-join.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    TitleCasePipe,
    CurrencyPipe,
    DatePipe
  ]
})
export class AffiliateJoinComponent implements OnInit, OnDestroy {
 
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  /** Component for joining an affiliate program and managing affiliate-related actions.*/
  subscription: Subscription[] = [];

  /** Affiliate referral link. */
  link: string;

  /** Form group for affiliate-related form controls. */
  form: FormGroup;

  /** Loading indicator for various data requests. */
  isLoading = false;

  /** Duration of copy message. */
  copyMsgDuration = 1;

  /** Affiliate status data. */
  affilateData: IAffilateStatus;

  /** Loading indicator for affiliate-related data. */
  dataLoading = false;

  /** Additional transaction data. */
  additionalData: ITransactionsData[];

  /** Clicked data for affiliate tracking. */
  clcikedData: IRowData[];

  /** Affiliate payout history. */
  payHistory: IAffiliatePayHistory[];

  /** Traffic statistics history for affiliates. */
  trafficStatsHistory: IAffilaiteTable[];

  /** Indicates whether data is currently loading. */
  isLoad = false;

  /** Date range for filtering data. */
  dateRange: { from_date: string; to_date: string };

  /** User's affiliate earning details. */
  userEarningDetails: IUserEarningData;

  /** User's transaction history. */
  userTransactionDetails: IUserTransactionHistory[];

  /**
   * Constructs an instance of the AffiliateJoinComponent.
   *
   * @param _scriptService - The script service for dynamically loading scripts.
   * @param _affiliateService - The affiliate program service for making API requests.
   * @param fb - The FormBuilder for creating reactive forms.
   * @param _snackBar - The MatSnackBar service for displaying snack bar notifications.
   * @param _dialog - The MatDialog service for opening dialogs.
   * @param _alertService - The AlertService for displaying alerts.
   */
  constructor(
    private _scriptService: ScriptService,
    private _affiliateService: AffiliateProgramsService,
    private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private _alertService: AlertService
  ) {}

  /**
   * Initializes the component.
   */
  ngOnInit(): void {
    this.initForm();
    this.addSocialScript();
    this.join();
    this.getPayoutHistory();
    this.getUserEarnings();
    this.applyDateFilter();
  }

  /**
   * Initializes the form with default values.
   */
  initForm(): void {
    const today = new Date(); // Get the current date
    const thirtyDaysAgo = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 30
    ); // Get the date that is 30 days before the current date

    this.form = this.fb.group({
      referalLink: [''],
      fromDate: [thirtyDaysAgo?.toISOString()?.slice(0, 10)],
      toDate: [today?.toISOString()?.slice(0, 10)]
    });
  }

  /**
   * Retrieves the form values and constructs an affiliate form object.
   *
   * @returns The constructed affiliate form object.
   */
  formBody(): IAffiliateForm {
    const formValues = this.form?.value;
    return {
      referalLink: formValues?.referalLink,
      fromDate: formValues?.fromDate,
      toDate: formValues?.toDate
    };
  }

  /**
   * Handler for the "Join" button click. Initiates the affiliate joining process.
   */
  onJoin(): void {
    this.join();
  }

  /**
   * Initiates the affiliate joining process.
   */
  join(): void {
    this.dataLoading = true;
    this.isLoad = true;
    this.subscription.push(
      this._affiliateService
        .joinAffiliate('')
        .pipe(
          finalize(() => {
            this.isLoad = false;
          })
        )
        .subscribe(
          (res: IAffiliateJoin) => {
            if (res?.success) {
              this.getReferalLink();
            }
          },
          (err) => {
            if (err.error.errorCode === '702') {
              this.getReferalLink();
            }
          }
        )
    );
  }

  /**
   * Retrieves the affiliate referral link and updates the form.
   */
  getReferalLink(): void {
    this.isLoading = true;
    this.subscription.push(
      this._affiliateService
        .getReferLink()
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.form.patchValue({
              referalLink: res.data.referral_link
            });
            this.link = res?.data.referral_link;
            this.getAffilateStatus();
          }
        })
    );
  }

  /**
   * Retrieves the affiliate status data.
   */
  getAffilateStatus(): void {
    this.subscription.push(
      this._affiliateService
        .getReferStatus()
        .pipe(
          finalize(() => {
            this.dataLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.affilateData = res?.data;
          }
        })
    );
  }

  /**
   * Retrieves traffic statistics history for affiliates.
   */
  getTrafficStatsHistory(): void {
    this.subscription.push(
      this._affiliateService
        .getTrafficStatsHistory(this.dateRange)
        .subscribe((res) => {
          if (res?.success) {
            this.trafficStatsHistory = res?.data;
          }
        })
    );
  }

  /**
   * Retrieves additional status data.
   */
  getAdditionalStatus(): void {
    this.subscription.push(
      this._affiliateService
        .getAdditionalStatus(this.dateRange)
        .subscribe((res) => {
          if (res?.success) {
            this.additionalData = res?.data?.transactions_data;
          }
        })
    );
  }

  /**
   * Retrieves raw click details for affiliate tracking.
   */
  getRawClickDetails(): void {
    this.subscription.push(
      this._affiliateService.getRawClicks(this.dateRange).subscribe((res) => {
        this.clcikedData = res?.data.rows;
      })
    );
  }

  /**
   * Retrieves payout history for affiliates.
   */
  getPayoutHistory(): void {
    this.subscription.push(
      this._affiliateService.getPayoutHistory().subscribe((res) => {
        this.payHistory = res?.data;
      })
    );
  }

  /**
   * Copies the provided text to the clipboard and displays a notification.
   *
   * @param element - The HTML input element containing the text to copy.
   */
  copyToClipboard(element: HTMLInputElement): void {
    this._snackBar.openFromComponent(CopiedTextComponent, {
      duration: this.copyMsgDuration * 1000
    });
    element.select();
    document.execCommand('copy');
    //eslint-disable-next-line @typescript-eslint/no-empty-function
    setTimeout(() => {}, 800);
  }

  /**
   * Adds a social script dynamically to the DOM if it doesn't exist.
   */
  addSocialScript(): void {
    if (!document.getElementById('addthis_social')) {
      const src =
        'https://s7.addthis.com/js/300/addthis_widget.js#pubid=ra-5b79fd595dfa1c2d';
      this._scriptService.addScript('', 'addthis_social', src);
    }
  }

  /**
   * Applies the date filter and retrieves relevant data.
   */
  applyDateFilter() {
    this.dateRange = {
      from_date: this.formBody().fromDate,
      to_date: this.formBody().toDate
    };
    this.getTrafficStatsHistory();
    this.getAdditionalStatus();
    this.getUserTransactions();
    this.getRawClickDetails();
  }

  /**
   * Retrieves user earnings data.
   */
  getUserEarnings() {
    this.subscription.push(
      this._affiliateService.getUserEarnings().subscribe((res) => {
        this.userEarningDetails = res?.data?.rows;
      })
    );
  }

  /**
   * Retrieves user transaction history.
   */
  getUserTransactions() {
    this.subscription.push(
      this._affiliateService
        .getUserTransactions(this.dateRange)
        .subscribe((res) => {
          this.userTransactionDetails = res?.data;
        })
    );
  }

  /**
   * Initiates a request for payout with the specified amount.
   *
   * @param amount - The amount to request payout for.
   */
  requestToPayout(amount: number) {
    if (amount < 100) {
      this._alertService.warningAlert({
        title: 'Error',
        content:
          'Only withdrawal requests for amounts greater than $100 will be processed.',
        doneMsg: 'Ok'
      });
      return;
    }
    const payoutDialog = this._dialog.open(RequestToPayoutModalComponent, {
      minWidth: '20%',
      data: amount
    });
    payoutDialog.afterClosed().subscribe((res) => {
      if (res) {
        this.applyDateFilter();
      }
    });
  }

  /**
   * Cleans up all subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscription.forEach((s) => {
      s.unsubscribe();
    });
  }
}

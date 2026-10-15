import { finalize } from 'rxjs/operators';
import {
  Component,
  Input,
  OnInit,
  inject,
  OnDestroy,
  EventEmitter,
  Output,
  OnChanges
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IAffiliatePayHistory,
  IClickedData,
  IUserCoupon,
  IUserEarningsData,
  IUserTransactionHistory
} from 'src/app/modules/more/model/affiliate';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { CopiedTextComponent } from 'src/app/shared/components/copied-text/copied-text.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { DateRangeSelectorV35Component } from 'src/app/shared/components/date-range-selector-v35/date-range-selector-v35.component';
import { AlertService } from '../../../../shared/service/alert/alert.service';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * Component for displaying data in the Affiliate PAP dashboard table.
 */
@Component({
  selector: 'app-affiliate-pap-dashboard-table',
  templateUrl: './affiliate-pap-dashboard-table.component.html',
  styleUrls: ['./affiliate-pap-dashboard-table.component.scss'],
  standalone: true,
  imports: [
    CommonButtonV35Component,
    NgClass,
    FaIconComponent,
    DateRangeSelectorV35Component
  ]
})
export class AffiliatePapDashboardTableComponent
  implements OnInit, OnDestroy, OnChanges
{
  /**
   * Event emitter for adding a coupon.
   */
  @Output() addCouponEvent = new EventEmitter();

  /**
   * Input to specify the active tab on the dashboard table.
   */
  @Input() tab:
    | 'coupon'
    | 'pay-history'
    | 'transaction-history'
    | 'earnings'
    | 'click-details';

  private affiliateService = inject(AffiliateProgramsService);
  private alertService = inject(AlertService);
  private matSnackBar = inject(MatSnackBar);
  private clipBoard = inject(Clipboard);

  /** Array to hold active subscriptions. */
  subscriptions: Subscription[] = [];

  /** Array to hold payout history data. */
  payOutHistory: IAffiliatePayHistory[] = [];
  filteredPayOutHistory: IAffiliatePayHistory[] = [];
  /** Array to hold transaction history data. */

  transactionHistory: IUserTransactionHistory[] = [];

  /** Array to hold transaction history data. */
  userEarnings: IUserEarningsData[] = [];
  filteredUserEarnings: IUserEarningsData[] = [];

  /** Array to hold user coupons. */
  coupons: IUserCoupon[] = [];

  /** Loading indicator for data retrieval. */
  loading = false;

  /** Duration of the "copied to clipboard" message. */
  copyMsgDuration = 1;

  clickDetails: IClickedData['rows'] = [];
  filteredClickDetails: IClickedData['rows'] = [];

  initialCount = 1;
  pageArr: (number | string)[] = [];
  initialPage = 1;
  selectedValue!: number;
  pseudoI!: number;
  totalPage = 0;
  mode = 1;
  redirectNotficationPage: string;
  paginationPage: number = 0;
  startDate: string;
  endDate: string;

  /**
   * Initializes the component and retrieves data based on the active tab.
   */
  ngOnInit(): void {
    this.getPayHistory();
    if (this.tab === 'pay-history') {
      this.getPayHistory();
    } else if (this.tab === 'transaction-history') {
      this.getUserTransactions();
    } else if (this.tab === 'coupon') {
      this.getCoupons();
    } else if (this.tab === 'earnings') {
      this.getEarnings();
    } else if (this.tab === 'click-details') {
      this.getRowClicks();
    }
  }

  ngOnChanges(): void {
    if (this.tab === 'click-details') {
      this.getRowClicks();
    } else if (this.tab === 'earnings') {
      this.getEarnings();
    } else if (this.tab === 'pay-history') {
      this.getPayHistory();
    }
  }

  /**
   * Retrieves payout history data.
   */
  getPayHistory() {
    this.loading = true;
    this.subscriptions.push(
      this.affiliateService
        .getPayoutHistory()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.payOutHistory = res.data;
              this.totalPage = Math.ceil(res.data.length / 20);
              this.paginationArray();
              const start = 1 * 20 - 20;
              const end = 1 * 20;
              this.filteredPayOutHistory = this.payOutHistory.slice(start, end);
            }
          }
        })
    );
  }

  /**
   * Emits the 'addCouponEvent' event when the 'Add Coupon' button is clicked.
   */
  addCoupon() {
    this.addCouponEvent.emit();
  }

  /**
   * Retrieves user transaction history data.
   */
  getUserTransactions() {
    this.loading = true;
    this.subscriptions.push(
      this.affiliateService
        .getUserTransactions({ from_date: '', to_date: '' })
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.transactionHistory = res.data;
            }
          }
        })
    );
  }

  /**
   * Retrieves user earnings history data.
   */
  getEarnings() {
    this.loading = true;
    this.subscriptions.push(
      this.affiliateService
        .getEarnings()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.userEarnings = res.data;
              this.userEarnings?.forEach(
                (data: IUserEarningsData, index: number) => {
                  const formatedDate = this.formatDateToUSFormat(
                    data.created_at
                  );
                  this.userEarnings[index].created_at = formatedDate;
                }
              );
              this.totalPage = Math.ceil(res.data.length / 20);
              this.paginationArray();
              const start = 1 * 20 - 20;
              const end = 1 * 20;
              this.filteredUserEarnings = this.userEarnings.slice(start, end);
            }
          }
        })
    );
  }

  formatDateToUSFormat(isoDateString: string) {
    const date = new Date(isoDateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleString('en-US', options);
  }

  /**
   * Retrieves user coupons.
   */
  getCoupons() {
    this.loading = true;
    this.subscriptions.push(
      this.affiliateService
        .getUserCoupons()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.coupons = res.data;
            }
          }
        })
    );
  }

  /**
   * Deletes a user coupon after confirming with a dialog.
   *
   * @param coupon - The user coupon to be deleted.
   */
  deleteCoupon(coupon: IUserCoupon) {
    const dialogRef = this.alertService.confirmAlert();
    dialogRef.afterClosed().subscribe((val) => {
      if (val) {
        this.loading = true;
        if (coupon) {
          this.subscriptions.push(
            this.affiliateService
              .deleteUserCoupon(coupon.id)
              .pipe(
                finalize(() => {
                  this.loading = false;
                })
              )
              .subscribe({
                next: (res) => {
                  if (res.success) {
                    this.alertService.successAlert({ content: res.message });
                    this.getCoupons();
                  }
                }
              })
          );
        }
      }
    });
  }

  /**
   * Copies a coupon code to the clipboard and displays a notification.
   *
   * @param index - The index of the coupon code to copy.
   */
  copyToClipboard(index: number) {
    if (this.coupons.length > 0) {
      this.matSnackBar.openFromComponent(CopiedTextComponent, {
        duration: this.copyMsgDuration * 1000
      });
      this.clipBoard.copy(this.coupons[index].couponCode);
    }
  }

  /**
   * Generates an array for pagination control based on the current mode.
   * @method
   */
  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  /**
   * Moves to the previous page of notifications.
   * @method
   */
  onPrevious() {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.setUserEarnings(this.initialPage);
    }
  }

  /**
   * Moves to the next page of notifications.
   * @method
   */
  onNext() {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.setUserEarnings(this.initialPage);
    }
  }

  /**
   * Navigates to a specific page of notifications.
   * @method
   * @param {number | string} item - The page number to navigate to.
   */
  gotoPage(page: number | string) {
    const item = Number(page);
    if (item > 0) {
      this.initialPage = item;
      if (item < this.initialCount + 4) {
        this.mode = 1;
        this.paginationArray();
      } else if (item > this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }

    this.setUserEarnings(item);
  }

  setUserEarnings(num: number) {
    this.paginationPage = num;
    const start = num * 20 - 20;
    const end = num * 20;
    if (this.tab === 'earnings') {
      this.filteredUserEarnings = this.userEarnings.slice(start, end);
    } else if (this.tab === 'transaction-history') {
      this.filteredPayOutHistory = this.payOutHistory.slice(start, end);
    } else {
      this.filteredClickDetails = this.clickDetails.slice(start, end);
    }
  }

  /** get row click details */
  getRowClicks(): void {
    this.loading = true;
    this.subscriptions.push(
      this.affiliateService
        .getRawClicks({ from_date: this.startDate, to_date: this.endDate })
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.clickDetails = res.data.rows;
            this.totalPage = res.data.totalRecords;
            this.totalPage = Math.ceil(this.totalPage / 20);
            const start = 1 * 20 - 20;
            const end = 1 * 20;
            this.filteredClickDetails = this.clickDetails.slice(start, end);
            this.paginationArray();
          },
          error: () => {
            this.loading = false;
          }
        })
    );
  }

  dateEmiter(event: { start: string; end: string }): void {
    this.startDate = event.start;
    this.endDate = event.end;
    this.getRowClicks();
  }

  /**
   * Cleans up all subscriptions to prevent memory leaks when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

import { DatePipe, NgIf, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ISetCustomDateRange } from 'src/app/models/common';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { SelectedService } from '../../../../data-table/components/dt-date-range/selected.service';
import { RouterOutlet } from '@angular/router';

enum Type {
  'check-transactions' = 1,
  'cash-expense',
  'billing',
  'invoice',
  'wallet'
}

@Component({
  selector: 'app-payee-transaction-history',
  templateUrl: './payee-transaction-history.component.html',
  styleUrls: ['./payee-transaction-history.component.scss'],
  standalone: true,
  imports: [NgIf, NgClass, RouterOutlet]
})
export class PayeeTransactionHistoryComponent implements OnDestroy, OnInit {
  subscriptions: Subscription[] = [];

  payeeId: string;
  type: number | string = 1;
  paidValues: any = {
    inThisMonth: '00000',
    inThisYear: '00000',
    totalPaid: '00000'
  };
  payeeInfo: IViewPayee;
  pageName: string;
  isShowCard = false;
  isFilterType: boolean;
  selectedDate: ISetCustomDateRange;
  selectedFilterType = ['This Month', 'This Year', 'All Time', undefined];
  customHead: string;
  dateRange: string;

  paidValLoading = true;

  constructor(
    private _payeeService: PayeeService,
    private _selectedService: SelectedService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.getSelectedDate();
  }

  getSelectedDate(): void {
    this.subscriptions.push(
      this._selectedService.selectedDateRange$.subscribe((res) => {
        if (res && this.payeeId) {
          this.selectedDate = res;
          this.dateRange = res?.filterType.toLocaleLowerCase();
          this.getTransactionHistory();
          this.isFilterType = this.selectedFilterType.every(
            (item) => item !== this.selectedDate?.filterType
          );
          if (this.isFilterType) {
            this.isShowCard = true;
          } else {
            this.isShowCard = false;
          }

          if (res.filterType === 'Custom') {
            this.getSelectedMonth(res?.fromDate, res?.toDate);
          }
        }
      })
    );
  }

  getSelectedMonth(startDate: string, endDate: string): void {
    const fromDate = new Date(startDate);
    const toDate = new Date(endDate);
    const startMonth = fromDate
      .toLocaleString('en-US', { month: 'long' })
      .substring(0, 3);
    const endMonth = toDate
      .toLocaleString('en-US', { month: 'long' })
      .substring(0, 3);
    const startDay = fromDate.getDate();
    const endDay = toDate.getDate();
    this.customHead =
      'Paid total' +
      ' ' +
      '(' +
      startMonth +
      ' ' +
      startDay +
      ' ' +
      'to' +
      ' ' +
      endMonth +
      ' ' +
      endDay +
      ')';
  }

  getPayee() {
    if (this.payeeInfo) {
      return;
    }

    this.subscriptions.push(
      this._payeeService
        .showPayee(this.payeeId)
        .pipe(finalize(() => this.skelRemoveForAddress()))
        .subscribe((data) => {
          if (data?.success) {
            this.payeeInfo = data.data;
          }
        })
    );
  }

  getTransactionHistory() {
    const getParams = `fromDate=${this.selectedDate.fromDate}&toDate=${this.selectedDate.toDate}`;
    this.paidValLoading = true;
    this.subscriptions.push(
      this._payeeService
        .getTransactionHistory(this.payeeId, Type[<number>this.type], getParams)
        .pipe(finalize(() => (this.paidValLoading = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.paidValues = data.data;
          }
        })
    );
  }

  tableChange(event: any) {
    const todayDate = String(this.datePipe.transform(new Date(), 'YYYY-MM-dd'));

    setTimeout(() => {
      this.type = event.type;
      this.payeeId = event.payeeId;
      this.pageName = event.name;
      if (this.pageName) {
        this._selectedService.selectedDateRange = {
          fromDate: '1970-1-1',
          toDate: todayDate,
          filterType: ''
        };
        this.isShowCard = false;
      }

      if (this.type && this.payeeId) {
        this.getPayee();
      }
    }, 200);
  }

  //===> Remove skelton loader
  skelRemoveForAddress() {
    const addressList: NodeListOf<HTMLElement> = document.querySelectorAll(
      '.payee-address-card.skelton'
    );
    addressList.forEach((item) => item.classList.remove('skelton'));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

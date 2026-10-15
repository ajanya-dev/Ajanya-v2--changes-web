import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ISetCustomDateRange } from 'src/app/models/common';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { SelectedService } from 'src/app/modules/data-table/components/dt-date-range/selected.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CashExpenseDetailPanelV4Component } from 'src/app/modules/cash-expense-v4/components/cash-expense-detail-panel-v4/cash-expense-detail-panel-v4.component';
import { CashExpenseV4StateService } from 'src/app/modules/cash-expense-v4/services/cash-expense-v4-state.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4PayeeSummaryCheckListTableComponent } from './check-list-table/v4-check-list-table.component';
import { V4PayeeSummaryCashExpenseTableComponent } from './cash-expense-table/v4-cash-expense-table.component';
import { V4PayeeSummaryBillingTableComponent } from './billing-table/v4-billing-table.component';
import { V4PayeeSummaryInvoiceTableComponent } from './invoice-table/v4-invoice-table.component';
import { V4PayeeSummaryWalletTableComponent } from './wallet-table/v4-wallet-table.component';

enum Type {
  'check-transactions' = 1,
  'cash-expense',
  'billing',
  'invoice',
  'wallet'
}

const TYPE_NAME_MAP: Record<string, string> = {
  1: 'Checks',
  2: 'Cash Expenses',
  3: 'Billing',
  4: 'Invoice',
  5: 'Wallet'
};

@Component({
  selector: 'app-v4-payee-summary',
  templateUrl: './v4-payee-summary.component.html',
  styleUrls: ['./v4-payee-summary.component.scss'],
  standalone: true,
  imports: [
    V4PageHeaderComponent,
    CommonTabV4Component,
    V4PayeeSummaryCheckListTableComponent,
    V4PayeeSummaryCashExpenseTableComponent,
    V4PayeeSummaryBillingTableComponent,
    V4PayeeSummaryInvoiceTableComponent,
    V4PayeeSummaryWalletTableComponent,
    CashExpenseDetailPanelV4Component
  ]
})
export class V4PayeeSummaryComponent implements OnDestroy, OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // Exposed to the template so the in-place cash expense detail panel
  // can read/write panel open state without an extra getter layer.
  cashExpenseState = inject(CashExpenseV4StateService);
  subscriptions: Subscription[] = [];


  readonly typeTabs: ITabItem[] = [
    { label: 'Checks', value: '1' },
    { label: 'Cash Expenses', value: '2' },
    { label: 'Billing', value: '3' },
    { label: 'Invoice', value: '4' },
    { label: 'Wallet', value: '5' }
  ];

  payeeId: string;
  private loadedPayeeId: string | null = null;
  type: number | string = 1;
  currentType = signal('1');
  paidValues: {
    inThisMonth: string;
    inThisYear: string;
    totalPaid: string;
    paidByDate?: string;
  } = {
    inThisMonth: '00000',
    inThisYear: '00000',
    totalPaid: '00000'
  };

  payeeInfo: IViewPayee | undefined;
  pageName: string;
  selectedDate: ISetCustomDateRange;

  paidValLoading = signal(true);
  payeeLoading = signal(true);

  constructor(
    private payeeService: PayeeService,
    private selectedService: SelectedService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        const nextPayeeId = params.payeeId;
        const type = params.type || '1';
        const isPayeeChanged = nextPayeeId !== this.payeeId;
        this.payeeId = nextPayeeId;
        this.type = type;
        this.currentType.set(type);
        this.pageName = TYPE_NAME_MAP[type] || '';

        if (isPayeeChanged) {
          this.payeeInfo = undefined;
          this.loadedPayeeId = null;
          this.payeeLoading.set(true);
          this.paidValues = {
            inThisMonth: '00000',
            inThisYear: '00000',
            totalPaid: '00000'
          };
        }

        const todayDate = String(
          this.datePipe.transform(new Date(), 'YYYY-MM-dd')
        );
        this.selectedService.selectedDateRange = {
          fromDate: '1970-1-1',
          toDate: todayDate,
          filterType: ''
        };
        if (this.payeeId) {
          this.getPayee();
        }
      })
    );
    this.getSelectedDate();
  }

  getSelectedDate(): void {
    this.subscriptions.push(
      this.selectedService.selectedDateRange$.subscribe((res) => {
        if (res && this.payeeId) {
          this.selectedDate = res;
          this.getTransactionHistory();
        }
      })
    );
  }

  getPayee() {
    if (!this.payeeId) {
      return;
    }

    if (this.loadedPayeeId === this.payeeId && this.payeeInfo) {
      return;
    }

    this.payeeLoading.set(true);
    this.subscriptions.push(
      this.payeeService
        .showPayee(this.payeeId)
        .pipe(finalize(() => this.payeeLoading.set(false)))
        .subscribe((data) => {
          if (data?.success) {
            this.payeeInfo = data.data;
            this.loadedPayeeId = this.payeeId;
          } else {
            this.payeeInfo = undefined;
            this.loadedPayeeId = null;
          }
        })
    );
  }

  getTransactionHistory() {
    const getParams = `fromDate=${this.selectedDate.fromDate}&toDate=${this.selectedDate.toDate}`;
    this.paidValLoading.set(true);
    this.subscriptions.push(
      this.payeeService
        .getTransactionHistory(this.payeeId, Type[<number>this.type], getParams)
        .pipe(
          finalize(() => {
            this.paidValLoading.set(false);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.paidValues = data.data;
          }
        })
    );
  }

  /**
   * When this page is opened for the Cash Expenses tab (type === '2'),
   * the user came from the Cash Expense module and should be sent back
   * there. For every other tab, keep the existing Payments-out behavior.
   */
  get backLabel(): string {
    return this.currentType() === '2'
      ? 'Back to Cash Expense'
      : 'Back to Payments';
  }

  onTypeChange(value: string): void {
    if (!value || value === this.currentType() || !this.payeeId) {
      return;
    }
    this.router.navigate([
      `/v4/manage/transaction-history/${this.payeeId}/${value}`
    ]);
  }

  goBack() {
    if (this.currentType() === '2') {
      this.router.navigateByUrl('/v4/manage/cashexp');
      return;
    }
    this.router.navigate(['/v4/manage/payments-out/detailed/check']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

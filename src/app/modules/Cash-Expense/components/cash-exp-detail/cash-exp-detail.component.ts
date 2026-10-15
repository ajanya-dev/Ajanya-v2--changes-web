import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ICashExpenseActivity } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-cash-exp-detail',
  templateUrl: './cash-exp-detail.component.html',
  styleUrls: ['./cash-exp-detail.component.scss'],
  standalone: true,
  imports: [CurrencyPipe]
})
export class CashExpDetailComponent implements OnChanges, OnDestroy {
  @Input() cashExpenseId: any;
  subscriptions: Subscription[] = [];
  cashExpenseData: any;
  fromUser: string;
  cashExpenseType: any;

  constructor(
    public __dialog: MatDialog,
    private _cashExpenseService: CashExpenseService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const cashExpenseId: SimpleChange = changes.cashExpenseId;
    this.cashExpenseId = cashExpenseId.currentValue;
    if (cashExpenseId != undefined) {
      this.loadCashExpenseData();
      this.loadCashExpenseUser();
    }
  }

  loadCashExpenseData(): void {
    this.subscriptions.push(
      this._cashExpenseService
        .getCashExpensesById(this.cashExpenseId)
        .subscribe((res: any) => {
          if (res.success == true) {
            this.cashExpenseData = res.data;
            this.cashExpenseType =
              this.cashExpenseData.transactionType == '1'
                ? 'Expense'
                : 'Income';
          }
        })
    );
  }
  loadCashExpenseUser(): void {
    this.subscriptions.push(
      this._cashExpenseService
        .getCashExpenseActivity(this.cashExpenseId)
        .subscribe((res) => {
          if (res.success == true) {
            const activityData = res.data;
            this.fromUser = activityData.filter(
              (x: ICashExpenseActivity) => x.status == 'Created'
            )[0].userName;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

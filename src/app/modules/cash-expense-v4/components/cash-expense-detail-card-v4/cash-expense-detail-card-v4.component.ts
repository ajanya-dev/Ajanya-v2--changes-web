import { Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ICashExpenseDetails } from 'src/app/modules/Cash-Expense/model/CashExpense';

@Component({
  selector: 'app-cash-expense-detail-card-v4',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './cash-expense-detail-card-v4.component.html'
})
export class CashExpenseDetailCardV4Component {
  details = input<ICashExpenseDetails | null>(null);
}

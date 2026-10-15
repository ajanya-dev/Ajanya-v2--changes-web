import {
  Component,
  Input,
  EventEmitter,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChange
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { NgIf, NgFor, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-cash-exp-last-transaction',
  templateUrl: './cash-exp-last-transaction.component.html',
  styleUrls: ['./cash-exp-last-transaction.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, SlicePipe]
})
export class CashExpLastTransactionComponent implements OnChanges, OnDestroy {
  @Input() payeeId: string;
  @Input() fromModal = false;
  subscriptions: Subscription[] = [];

  payeeTransactionData: any;
  @Output() onClickTransAmount = new EventEmitter();

  constructor(
    private _cashExpenseService: CashExpenseService,
    private router: Router
  ) {}

  ngOnChanges(changes: { [property: string]: SimpleChange }) {
    const payeeId: SimpleChange = changes.payeeId;
    this.payeeId = payeeId.currentValue;
    if (this.payeeId != undefined) {
      this.loadLastTenTransactions(this.payeeId);
    }
  }

  loadLastTenTransactions(payeeId: string) {
    this.subscriptions.push(
      this._cashExpenseService
        .getPayeeTransactions(payeeId)
        .subscribe((res) => {
          if (res.success == true) {
            this.payeeTransactionData = res.data.rows.sort((x: any) => x.date);
          }
        })
    );
  }

  //Redirect to slected check view
  onCashExpenseView(id: string) {
    this.router.navigate(['/manage/cashexp/view/', id]);
    this.onClickTransAmount.emit(id);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

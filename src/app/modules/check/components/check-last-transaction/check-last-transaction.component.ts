import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChange
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ICheckPayeeSummary } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-check-last-transaction',
  templateUrl: './check-last-transaction.component.html',
  styleUrls: ['./check-last-transaction.component.scss'],
  standalone: true,
  imports: [NgFor]
})
export class CheckLastTransactionComponent implements OnChanges, OnDestroy {
  @Input() payeeId: string;
  subscriptions: Subscription[] = [];
  payeeTransactionData: ICheckPayeeSummary[];
  @Output() onClickTransAmount = new EventEmitter();

  constructor(
    private _checkService: CheckService,
    private router: Router
  ) {}

  ngOnChanges(changes: { [property: string]: SimpleChange }): void {
    const payeeId: SimpleChange = changes.payeeId;
    this.payeeId = payeeId.currentValue;

    if (this.payeeId) {
      this.loadPayeeTransactions(this.payeeId);
    }
  }

  loadPayeeTransactions(payeeId: string): void {
    this.subscriptions.push(
      this._checkService.getPayeeSummary(payeeId).subscribe((res) => {
        if (res?.success) {
          this.payeeTransactionData = res.data;
        }
      })
    );
  }

  //Redirect to slected check view
  onCheckView(id: string) {
    this.router.navigate(['/manage/cheque/view/', id]);
    this.onClickTransAmount.emit(id);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

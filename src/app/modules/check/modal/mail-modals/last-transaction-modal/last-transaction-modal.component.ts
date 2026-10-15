import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IPayeeTransaction } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-last-transaction-modal',
  templateUrl: './last-transaction-modal.component.html',
  styleUrls: ['./last-transaction-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor]
})
export class LastTransactionModalComponent implements OnInit, OnDestroy {
  transactions: IPayeeTransaction[] = [];
  subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _payeeService: PayeeService
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.getTransactions(this.data);
    }
  }

  getTransactions(checkId: string) {
    this.subscriptions.push(
      this._payeeService.getPayeeTransactions(checkId, 10).subscribe((data) => {
        if (data?.success) {
          this.transactions = data.data;
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

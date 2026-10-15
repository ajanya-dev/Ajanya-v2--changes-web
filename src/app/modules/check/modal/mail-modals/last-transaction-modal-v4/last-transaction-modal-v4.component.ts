import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { finalize, Subscription } from 'rxjs';
import { IPayeeTransaction } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-last-transaction-modal',
  templateUrl: './last-transaction-modal-v4.component.html',
  styleUrls: ['./last-transaction-modal-v4.component.scss'],
  standalone: true,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component]
})
export class LastTransactionModalV4Component implements OnInit, OnDestroy {
  private data = inject(MAT_DIALOG_DATA);
  private payeeService = inject(PayeeService);

  readonly XIcon = X;
  transactions = signal<IPayeeTransaction[]>([]);
  isLoading = signal(false);
  subscriptions: Subscription[] = [];

  /**
   * A cheque id, as every caller has always passed — or `{ id, isPayee }` for
   * the payee itself, which is the only thing a screen has to name before the
   * cheque exists.
   */
  ngOnInit(): void {
    if (!this.data) {
      return;
    }
    if (typeof this.data === 'string') {
      this.getTransactions(this.data);
      return;
    }
    this.getTransactions(this.data.id, !!this.data.isPayee);
  }

  getTransactions(id: string, isPayee = false) {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.payeeService
        .getPayeeTransactions(id, 10, isPayee)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((data) => {
          if (data?.success) {
            this.transactions.set(data.data);
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

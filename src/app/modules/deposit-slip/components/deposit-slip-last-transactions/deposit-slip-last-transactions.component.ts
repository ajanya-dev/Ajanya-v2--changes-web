import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { IDepositSlipLastTransaction } from '../../model/depositslips';

@Component({
  selector: 'app-deposit-slip-last-transactions',
  standalone: true,
  imports: [],
  templateUrl: './deposit-slip-last-transactions.component.html',
  styleUrl: './deposit-slip-last-transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepositSlipLastTransactionsComponent implements OnInit, OnDestroy {
  private depositSlipService = inject(DepositSlipsService);

  destroy$ = new Subject();
  isLoading = signal(false);
  slipId = input<string>();
  lastTransactions = signal<IDepositSlipLastTransaction[]>([]);

  ngOnInit(): void {
    this.getLastTransactions();
  }

  getLastTransactions() {
    if (this.slipId() === undefined) return;
    this.isLoading.set(true);
    this.depositSlipService
      .depositSlipLastTransaction(this.slipId() as string)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.lastTransactions.set(res.data);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

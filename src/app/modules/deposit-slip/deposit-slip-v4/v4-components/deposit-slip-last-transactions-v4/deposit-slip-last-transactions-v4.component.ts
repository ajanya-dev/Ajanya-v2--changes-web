import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { IDepositSlipLastTransaction } from '../../../model/depositslips';

@Component({
  selector: 'app-deposit-slip-last-transactions-v4',
  standalone: true,
  imports: [],
  templateUrl: './deposit-slip-last-transactions-v4.component.html',
  styleUrls: ['./deposit-slip-last-transactions-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepositSlipLastTransactionsV4Component implements OnInit {
  private depositSlipService = inject(DepositSlipsService);
  private destroyRef = inject(DestroyRef);

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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.lastTransactions.set(res.data);
        }
      });
  }
}

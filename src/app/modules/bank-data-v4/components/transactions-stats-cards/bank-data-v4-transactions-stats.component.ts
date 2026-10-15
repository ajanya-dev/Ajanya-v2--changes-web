import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { IBankDataV4TxnTotal } from '../../models/bank-data-v4-api.types';

@Component({
  selector: 'app-bank-data-v4-transactions-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './bank-data-v4-transactions-stats.component.html',
  styleUrls: ['./bank-data-v4-transactions-stats.component.scss']
})
export class BankDataV4TransactionsStatsComponent {
  totals = input.required<IBankDataV4TxnTotal>();
  totalRowCount = input<number>(0);
  loading = input(false);

  private currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });

  cards = computed(() => {
    const t = this.totals();
    return [
      {
        label: 'Total Transactions',
        value: (this.asNumber(t.count) || this.totalRowCount()).toLocaleString(),
        icon: 'receipt',
        iconColor: 'text-v4-primary-brand-bold-color',
        valueColor: 'text-v4-main-text-color',
        subtitle: 'Filtered results'
      },
      {
        label: 'Total Credit',
        value: this.currencyFmt.format(this.asNumber(t.credit)),
        icon: 'arrow-down-left',
        iconColor: 'text-v4-text-success',
        valueColor: 'text-v4-text-success',
        subtitle: 'All revenue'
      },
      {
        label: 'Total Debit',
        value: this.currencyFmt.format(this.asNumber(t.debit)),
        icon: 'arrow-up-right',
        iconColor: 'text-v4-common-red-color',
        valueColor: 'text-v4-main-text-color',
        subtitle: 'All spending'
      }
    ];
  });

  private asNumber(value: string | number | undefined): number {
    if (value == null) return 0;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
}

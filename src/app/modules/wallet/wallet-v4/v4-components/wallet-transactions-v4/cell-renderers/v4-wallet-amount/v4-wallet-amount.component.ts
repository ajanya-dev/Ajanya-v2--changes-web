import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

/**
 * Signed amount cell for the wallet transactions grid.
 *
 * Replaces the shared v2 `TransactionTypeComponent`, which drew a 14px/700
 * Roboto `<h1>` and revealed its filter icon from `(mouseenter)` handlers —
 * both things v4 deliberately dropped. Here the row's debit/credit sign is the
 * only colour carried (v4 badge text tokens, so it stays legible in both
 * themes); size and weight come from the theme's amount rule, and the filter
 * icon is revealed by CSS hover.
 *
 * The icon collapses to zero width instead of merely fading, so the amount
 * stays flush with the column's right edge until the row is hovered — same
 * treatment `V4DTCommonFilterComponent` gives its `isAmountField` cells.
 */
@Component({
  standalone: true,
  selector: 'app-v4-wallet-amount',
  imports: [CurrencyPipe, CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wallet-amount-cell flex items-center justify-end w-full">
      <span [class]="transactionType === 'debit' ? 'debit' : 'credit'">
        {{ signedAmount | currency }}
      </span>
      <app-common-filter-icon
        class="amount-filter"
        (filterEvent)="onFilterClicked()"
      />
    </div>
  `,
  styles: [
    `
      .debit {
        color: var(--v4-badge-error-text-color);
      }

      .credit {
        color: var(--v4-badge-success-text-color);
      }

      .wallet-amount-cell .amount-filter {
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transform: translateX(8px);
        transition:
          max-width 0.15s ease,
          opacity 0.15s ease,
          transform 0.15s ease;
      }

      .wallet-amount-cell:hover .amount-filter {
        max-width: 26px;
        opacity: 1;
        transform: none;
        transition-delay: 0.4s;
      }
    `
  ]
})
export class V4WalletAmountComponent {
  private dataTableService = inject(DataTableService);

  transactionType: 'debit' | 'credit' = 'credit';
  signedAmount = 0;

  private param: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.param = params;
    const type = params.data?.type ?? params.data?.txn_type;
    this.transactionType = type === 'debit' ? 'debit' : 'credit';

    const amount = Number(params.data?.transaction_amount ?? 0);
    this.signedAmount = this.transactionType === 'debit' ? -amount : amount;
  }

  /** The search box filters on the raw, unsigned amount the API stores. */
  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: String(this.param.data?.transaction_amount ?? ''),
      field: this.param.colDef?.headerName as string,
      payee: undefined
    });
  }
}

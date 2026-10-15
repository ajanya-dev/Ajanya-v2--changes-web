import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IPayeeSummaryRow,
  PAYEE_SUMMARY_TABLE_ID,
  V4PayeeSummaryDetailService
} from './v4-payee-summary-detail.service';

@Component({
  selector: 'app-amount-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule],
  providers: [CurrencyPipe],
  template: `
    <span
      role="presentation"
      class="cursor-pointer font-semibold text-v4-main-text-color hover:underline"
      matTooltip="View Details"
      (click)="onClick()"
    >
      {{ amount }}
    </span>
  `
})
export class V4AmountRendererComponent implements ICellRendererAngularComp {
  private detailService = inject(V4PayeeSummaryDetailService);
  private currencyPipe = inject(CurrencyPipe);

  params: ICellRendererParams;
  amount: string;

  private get tableId(): number | undefined {
    return this.params.colDef?.floatingFilterComponentParams?.tableId;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.amount = params.value;

    switch (this.tableId) {
      case PAYEE_SUMMARY_TABLE_ID.check:
        this.amount = this.withDollarSign(params.data?.cheque_amount_formated);
        break;
      case PAYEE_SUMMARY_TABLE_ID.cashExpense:
        this.amount = this.withDollarSign(params.data?.cash_amount_formatted);
        break;
      case PAYEE_SUMMARY_TABLE_ID.bill:
        this.amount = this.formatAmount(params.data?.bill_grand_total);
        break;
      default:
        this.amount = this.formatAmount(params.value);
        break;
    }
  }

  private withDollarSign(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    return `$${value}`;
  }

  private formatAmount(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return String(value);
    return (
      this.currencyPipe.transform(numeric, 'USD', 'symbol', '1.2-2', 'en-US') ??
      ''
    );
  }

  refresh(): boolean {
    return true;
  }

  onClick(): void {
    this.detailService.open(
      this.tableId,
      this.params.data as IPayeeSummaryRow | undefined
    );
  }
}

import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ICellRendererParams } from '@ag-grid-community/core';

interface IExtendedCellRendererParams extends ICellRendererParams {
  tableId?: string;
  isV4?: () => string;
}
@Component({
  selector: 'app-transaction-type',
  template: `
    <div
      class="flex gap-1"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      @if (transactionType === 'debit') {
        <h1 [class]="isV4 ? 'debit-v4' : 'debit'">{{ -this.transactionAmount | currency }}</h1>
      } @else if (transactionType === 'credit') {
        <h1 [class]="isV4 ? 'credit-v4' : 'credit'">
          {{ this.transactionAmount | currency }}
        </h1>
      }
      @if (showFilterIcon) {
        <app-common-filter-icon class="mt-1" (filterEvent)="onFilterClicked()" />
      }
    </div>
    <style>
      .debit {
        color: #f05959;
        font-family: var(--roboto);
        font-size: 14px;
        font-weight: 700;
        text-transform: capitalize;
      }
      .credit {
        color: #1a826f;
        font-family: var(--roboto);
        font-size: 14px;
        font-weight: 700;
        text-transform: capitalize;
      }
      .debit-v4 {
        color: var(--v4-badge-error-text-color);
        font-family: var(--font-peridot);
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }
      .credit-v4 {
        color: var(--v4-badge-success-text-color);
        font-family: var(--font-peridot);
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }
    </style>
  `,
  standalone: true,
  imports: [CommonFilterIconComponent,CurrencyPipe]
})
export class TransactionTypeComponent {
  private dataTableService = inject(DataTableService);

  params: IExtendedCellRendererParams;
  transactionAmount: number;
  transactionType: string;
  showFilterIcon = false;
  amount: string;
  isV4 = false;

  agInit(params: IExtendedCellRendererParams): void {
    this.params = params;
    this.isV4 = params.isV4?.() === 'v4';
    this.checkTransactionType();
  }

  checkTransactionType() {
    let { type } = this.params.data;
    if (!type) {
      type = this.params.data.txn_type;
    }

    if (type === 'debit') {
      this.transactionType = 'debit';
    } else if (type === 'credit') {
      this.transactionType = 'credit';
    }

    if (
      this.params?.column &&
      this.params?.column.getColDef().floatingFilterComponentParams?.tableId ===
        'cardSendRecv'
    ) {
      this.transactionAmount = this.params.data.amount;
    } else {
      this.transactionAmount = this.params.data.transaction_amount;
    }
  }


  onFilterClicked(): void {
    const cellValue = {
      filter: this.transactionAmount.toString(),
      field: this.params.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }
}

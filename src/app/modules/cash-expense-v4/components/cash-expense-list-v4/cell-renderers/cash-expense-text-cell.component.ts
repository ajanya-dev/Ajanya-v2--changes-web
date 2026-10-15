import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

interface ICashExpenseTextCellParams extends ICellRendererParams {
  isAmountField?: boolean;
  isFormatDate?: boolean;
}

@Component({
  selector: 'app-cash-expense-text-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonFilterIconComponent, MatTooltipModule],
  providers: [CurrencyPipe],
  template: `
    <div class="flex items-center gap-1 w-full min-w-0">
      <span
        class="overflow-hidden text-ellipsis whitespace-nowrap"
        [matTooltip]="text"
        [matTooltipDisabled]="!text"
      >
        {{ text }}
      </span>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `
})
export class CashExpenseTextCellComponent implements ICellRendererAngularComp {
  private dataTableService = inject(DataTableService);
  private currencyPipe = inject(CurrencyPipe);

  private params: ICashExpenseTextCellParams;
  private rawValue = '';
  text = '';

  agInit(params: ICashExpenseTextCellParams): void {
    this.setValue(params);
  }

  refresh(params: ICashExpenseTextCellParams): boolean {
    this.setValue(params);
    return true;
  }

  private setValue(params: ICashExpenseTextCellParams): void {
    this.params = params;
    this.rawValue = params.value ?? '';

    if (params.isAmountField) {
      this.text = this.formatAmount(params.value);
      return;
    }

    if (params.isFormatDate && typeof this.rawValue === 'string') {
      const [date, time] = this.rawValue.split('_');
      this.text = time ? `${date} (${time})` : date ?? '';
      return;
    }

    this.text = this.rawValue;
  }

  private formatAmount(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string' && value.includes('$')) return value;

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);

    return (
      this.currencyPipe.transform(numericValue, 'USD', 'symbol', '1.2-2', 'en-US') ?? ''
    );
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.rawValue,
      field: this.params.colDef?.headerName as string,
      payee: undefined
    });
  }
}

import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

/**
 * "Default Pay Method" cell: maps the stored code to its label and exposes the
 * shared hover filter icon. Filters by the label (not the code) because the
 * column's select-box floating filter matches on the option `name`.
 */
const PAY_METHOD_LABELS: Record<string, string> = {
  1: 'Printable Check',
  2: 'Mail Check by USPS',
  3: 'Direct Deposit',
  4: 'Email Check'
};

@Component({
  selector: 'app-v4-pay-method',
  standalone: true,
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-1 items-center w-full">
      <span class="text-ellipsis overflow-x-hidden font-peridot">{{
        label
      }}</span>
      @if (label) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class V4PayMethodComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  label = '';

  agInit(params: ICellRendererParams) {
    this.param = params;
    this.label =
      PAY_METHOD_LABELS[params.data?.payee_default_payment_method as string] ??
      '';
  }

  onFilterClicked(): void {
    this.dataTableService.selectedCellValueSignal.set({
      filter: this.label,
      field: this.param.colDef?.headerName as string,
      payee: undefined
    });
  }
}

import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v4-bank-name',
  standalone: true,
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style.width]="width + 'px'" class="flex items-center gap-1">
      <p
        class="text-main-text-color font-normal font-peridot text-[13px] leading-4"
      >
        {{ cellValue }}
      </p>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `
})
export class V4BankNameComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  cellValue: string;
  width: number;

  agInit(params: ICellRendererParams) {
    this.param = params;
    this.width = (params.colDef?.minWidth ?? 0) + 30 || 100;
    this.cellValue = params?.value ?? params.data?.bank_account_nick_name;
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.param.data?.bank_account_nick_name as string,
      field: 'bank',
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }
}

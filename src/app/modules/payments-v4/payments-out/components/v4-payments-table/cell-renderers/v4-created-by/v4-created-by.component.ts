import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v4-created-by',
  standalone: true,
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-1 items-center w-full">
      <h2 class="text-ellipsis overflow-x-hidden font-peridot">
        {{ createdBy }}
      </h2>
      <app-common-filter-icon (filterEvent)="onFilterClicked()" />
    </div>
  `
})
export class V4CreatedByComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  createdBy: string;
  tableName: 'check_list_table' | 'payment_table';

  agInit(params: ICellRendererParams) {
    this.param = params;
    this.tableName = params.colDef?.floatingFilterComponentParams?.tableName;
    if (this.tableName === 'check_list_table') {
      this.createdBy = params.data?.cheque_created_by_user_name;
    } else {
      this.createdBy =
        params.data?.created_by?.nick_name ?? params.data?.created_by?.name;
    }
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.createdBy,
      field: this.param.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }
}

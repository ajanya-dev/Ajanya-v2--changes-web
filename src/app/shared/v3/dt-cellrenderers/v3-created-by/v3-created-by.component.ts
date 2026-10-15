import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFilterList } from '@fortawesome/pro-solid-svg-icons';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v3-created-by',
  standalone: true,
  imports: [FaIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIcon = true"
      (mouseleave)="showFilterIcon = false"
    >
      <h2 class="text-ellipsis overflow-x-hidden">{{ createdBy }}</h2>
      @if (showFilterIcon) {
        <div
          role="presentation"
          class="h-6 flex justify-center items-center bg-common-secondary-blue-color text-common-blue-color p-1 cursor-pointer"
          (click)="onFilterClicked()"
        >
          <fa-icon class="-my-3" [icon]="faFilterList"></fa-icon>
        </div>
      }
    </div>
  `
})
export class V3CreatedByComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  showFilterIcon = false;
  faFilterList = faFilterList;
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

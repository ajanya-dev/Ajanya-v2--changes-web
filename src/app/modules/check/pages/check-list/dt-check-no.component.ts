import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v3dt-check-number-by',
  standalone: true,
  imports:[CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex gap-1 items-center w-full"
       (mouseenter)="showFilterIconForRow(true)"
(mouseleave)="showFilterIconForRow()"
    >
      @if (param?.data?.verified === 1) {
        <h2
          type="text"
          style="color: var(--brand-color-lite); font-weight: 700 "
          title="Verified using bank data"
        >
          {{ checkNumber }}
        </h2>
      } @else {
        <h2 class="text-ellipsis overflow-x-hidden">{{ checkNumber }}</h2>
      }
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class V3DTCheckNumberComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  showFilterIcon = false;
  checkNumber: string;

  agInit(params: ICellRendererParams) {
    this.param = params;

    this.checkNumber = params.data?.cheque_serial_number;
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.checkNumber,
      field: this.param.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }
  
  showFilterIconForRow(show?:boolean){
    if(show){
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }
}

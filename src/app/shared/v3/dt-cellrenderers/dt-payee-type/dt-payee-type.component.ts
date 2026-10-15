import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

@Component({
  selector: 'app-v3-payee-type',
  standalone: true,
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <h2 class="text-ellipsis overflow-x-hidden">{{ payeeType }}</h2>
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class V3PayeeTypeComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  showFilterIcon = false;
  payeeType: string;

  agInit(params: ICellRendererParams) {
    this.param = params;
    this.payeeType = this.getPayeeType(params?.data?.payee_type_id);
  }

  getPayeeType(payeeType: number): string {
    if (payeeType === 1) {
      return 'Customer';
    }
    if (payeeType === 2) {
      return 'Vendor';
    }
    if (payeeType === 3) {
      return 'Employee';
    }
    return '';
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.payeeType,
      field: this.param.colDef?.headerName as string,
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

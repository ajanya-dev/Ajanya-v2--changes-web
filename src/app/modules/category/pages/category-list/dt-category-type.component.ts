import { ICellRendererParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

@Component({
  selector: 'app-v3-dt-category-type',
  standalone: true,
  imports: [CommonFilterIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (!isCategoryRender()) {
    <div
      class="flex gap-1 items-center w-full"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <h2 class="text-ellipsis overflow-x-hidden">{{ categoryType }}</h2>
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  }
  @else {
    <div>
      <h2 class="text-ellipsis overflow-x-hidden">{{ categoryStatus() }}</h2>
    </div>
  }
  `
})
export class V3DTCategoryTypeComponent {
  private dataTableService = inject(DataTableService);

  param: ICellRendererParams;
  showFilterIcon = false;
  categoryType: string;

  isCategoryRender = signal(false);
  categoryStatus = signal('Active');

  agInit(params: ICellRendererParams) {
    this.param = params;
    this.categoryType = this.getStatus(this.param.data.catagory_type);
    if (this.param.colDef?.cellRendererParams?.type === 'category_status') {
      this.isCategoryRender.set(true);
      this.categoryStatus.set(this.getCategoryStatus(this.param.data.category_status));
    }
  }

  getStatus(categoryType: number) {
    if (categoryType === 1) {
      return 'Income';
    }
    if (categoryType === 2) {
      return 'Expense';
    }
    if (categoryType === 3) {
      return 'Imported from QB';
    }
    return '';
  }

  getCategoryStatus(categoryStatus: number) {
    if (categoryStatus === 1) {
      return 'Active';
    }
    if (categoryStatus === 0) {
      return 'Inactive';
    }
    return '';
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.categoryType,
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

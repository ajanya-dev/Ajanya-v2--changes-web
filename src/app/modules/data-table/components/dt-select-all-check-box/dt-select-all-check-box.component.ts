import { Component } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { FormsModule } from '@angular/forms';
export interface SelectFloatingFilterParams extends IFloatingFilterParams {
  selectedValue: any;
}

@Component({
  selector: 'app-dt-select-all-check-box',
  template: `<div>
    <input
      [(ngModel)]="isChecked"
      (ngModelChange)="isCheked()"
      type="checkbox"
      id="dt-select-all-checkbox-{{ tableId }}"
    />
    <label for="dt-select-all-checkbox-{{ tableId }}"></label>
  </div>`,
  styleUrls: ['./dt-select-all-check-box.component.scss'],
  standalone: true,
  imports: [FormsModule]
})
export class DtSelectAllCheckBoxComponent implements AgFloatingFilterComponent {
  params!: IFloatingFilterParams;
  isChecked!: boolean | null;
  selectedRows: any[] = [];
  tableId: number | undefined;

  constructor(private _dataTableService: DataTableService) {}

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
    this.tableId = (params?.column.getColDef() as any)?.tableId;

    this._dataTableService.selectAllCheckbox$.subscribe((value) => {
      this.isChecked = value;
      this.isCheked();
    });
  }

  onParentModelChanged() {
    // When the filter is empty we will receive a null value here
    // if (!parentModel) {
    //   this.isChecked = null;
    // } else {
    //   this.isChecked = parentModel.filter;
    // }
  }

  isCheked() {
    // if (this.isChecked == null) {
    //   // Remove the filter
    //   this.params.parentFilterInstance((instance: any) => {
    //     instance.onFloatingFilterChanged(null, null);
    //   });
    //   return;
    // }

    const gapi: any = this.params.api;
    if (gapi?.destroyCalled) {
      return;
    }

    const paginationSize = this.params.api.paginationGetPageSize();
    const currentPage = this.params.api.paginationGetCurrentPage();
    const startRowIndex = paginationSize * currentPage;
    const endRowIndex = startRowIndex + paginationSize;

    if (this.isChecked) {
      this.params.api.forEachNode((node) => {
        if (node?.rowIndex! >= startRowIndex && node?.rowIndex! < endRowIndex) {
          node.setSelected(true);
          this.selectedRows.push(node.data);
        }
      });
    } else {
      this.params.api.deselectAll();
      this.selectedRows = [];
    }

    this._dataTableService.setDataFromFrameWorkComponent(
      this.selectedRows,
      this.tableId
    );
  }
}

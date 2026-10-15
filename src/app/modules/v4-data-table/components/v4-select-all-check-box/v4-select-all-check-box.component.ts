import { Component, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { ColDef, IFloatingFilterParams, IRowNode } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NgClass } from '@angular/common';

export interface V4SelectFloatingFilterParams extends IFloatingFilterParams {
  selectedValue: unknown;
}

interface ColDefWithTableId extends ColDef {
  tableId?: number;
}

@Component({
  selector: 'app-v4-select-all-check-box',
  template: `<div
    class="ag-checkbox-input-wrapper"
    [class.ag-checked]="isChecked === true"
    (click)="toggleChecked()"
  ></div>`,
  styleUrls: ['./v4-select-all-check-box.component.scss'],
  standalone: true,
  imports: [NgClass]
})
export class V4SelectAllCheckBoxComponent implements AgFloatingFilterComponent, OnDestroy {
  private dataTableService = inject(DataTableService);
  private subscription = new Subscription();

  params!: IFloatingFilterParams;
  isChecked: boolean = false;
  selectedRows: unknown[] = [];
  tableId: number | undefined;

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
    this.tableId = (params?.column.getColDef() as ColDefWithTableId)?.tableId;

    this.subscription.add(
      this.dataTableService.selectAllCheckbox$.subscribe((value) => {
        if (value === null) return;
        this.isChecked = value;
        this.isCheked();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onParentModelChanged() {}

  toggleChecked() {
    this.isChecked = !this.isChecked;
    this.isCheked();
  }

  isCheked() {
    if ((this.params.api as unknown as Record<string, unknown>).destroyCalled) return;

    const paginationSize = this.params.api.paginationGetPageSize();
    const currentPage = this.params.api.paginationGetCurrentPage();
    const startRowIndex = paginationSize * currentPage;
    const endRowIndex = startRowIndex + paginationSize;

    if (this.isChecked) {
      this.params.api.forEachNode((node: IRowNode) => {
        if (
          (node?.rowIndex || node?.rowIndex === 0) &&
          node.rowIndex >= startRowIndex &&
          node.rowIndex < endRowIndex
        ) {
          node.setSelected(true);
          this.selectedRows.push(node.data);
        }
      });
    } else {
      this.params.api.deselectAll();
      this.selectedRows = [];
    }

    this.dataTableService.setDataFromFrameWorkComponent(this.selectedRows, this.tableId);
  }
}

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { LucideAngularModule, X } from 'lucide-angular';

import {
  DataTableService,
  ICellValue
} from 'src/app/shared/service/data-table/data-table.service';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

interface IStatusData {
  value: string;
  name: string;
  type: 'normal';
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  selector: 'app-v4-select-box-filter',
  templateUrl: './v4-select-box-filter.component.html',
  styleUrl: './v4-select-box-filter.component.scss'
})
export class V4SelectBoxFilterComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  readonly XIcon = X;

  params: IFloatingFilterParams;
  currentValue: IStatusData | '' = '';
  optionResult: IStatusData[] = [];
  getCurrentColumn: unknown;
  bindedValues = '';
  subscriptions: Subscription[] = [];
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
    this.getCurrentColumn = params.column.getColId();

    const getData = this.dataTableService.getSelectBoxData();
    const getValues = getData.values as IDtFloatingFilterProp['selectBox'];

    if (getValues) {
      const filterData = getValues.filter((el) => el.id === this.getCurrentColumn);
      if (filterData[0]) {
        this.optionResult = filterData[0].values.map((item) => ({
          ...item,
          value: String(item.value),
          type: 'normal' as const
        }));
      }
    }
  }

  ngOnInit(): void {
    this.setCellFilter();
  }

  onParentModelChanged(): void {}

  private setCellFilter(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (
          res?.field === this.params.column.getColDef()?.headerName &&
          res?.filter
        ) {
          this.bindedValues = res.filter;
          this.onChangeValue(res);
        }
      })
    );
  }

  onChangeValue(filter?: ICellValue): void {
    let value: IStatusData | '' = '';
    if (this.bindedValues !== '') {
      const matched = this.optionResult.filter(
        (item) => item.name === this.bindedValues
      );
      value = matched[0] ?? '';
    }
    this.applyFilter(value, filter);
  }

  private applyFilter(currentValue: IStatusData | '', filter?: ICellValue): void {
    this.currentValue = currentValue;

    if (currentValue === '') {
      const field = this.params.filterParams.colDef.field;
      if (field) {
        this.v3DataTableService.removeFilters(field);
        this.v3DataTableService.updateV3DataTableByRemovingFilter = [field];
      }
    } else {
      const selectBoxFilterValues: ISelectBoxFilterValues = {
        filter: currentValue.value,
        filterType: 'text',
        type: 'equals'
      };

      const filterName = this.params.filterParams.colDef.field as string;
      const filterPayload: ISelectBoxFilterArray = {
        [filterName]: { ...selectBoxFilterValues }
      };

      this.v3DataTableService.updateV3DataTable = filterPayload;
    }
  }

  resetFilter(): void {
    this.bindedValues = '';
    this.v3DataTableService?.gridApi?.deselectAll();
    this.onChangeValue();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.dataTableService.clearMainFilter();
  }
}

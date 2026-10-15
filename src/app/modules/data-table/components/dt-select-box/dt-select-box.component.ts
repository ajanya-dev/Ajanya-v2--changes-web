import { Subscription } from 'rxjs/internal/Subscription';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { FormsModule } from '@angular/forms';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

interface IUpdatedFloatingFilter extends IFloatingFilterParams {
  tableName?: string;
}

interface IStatusArray {
  id: string;
  values: { value: string | number; name: string }[];
}

@Component({
  selector: 'app-dt-select-box',
  templateUrl: './dt-select-box.component.html',
  styleUrls: ['./dt-select-box.component.scss'],
  standalone: true,
  imports: [FormsModule, NgClass, FaIconComponent, NgSelectModule]
})
export class DtSelectBoxComponent
  implements AgFloatingFilterComponent, OnDestroy, OnInit
{
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  params: IUpdatedFloatingFilter;
  currentValue = '';
  getData: {
    data: IDtColumnFields[];
    values: IDtFloatingFilterProp['selectBox'];
  };

  optionResult: IStatusArray[];
  getCurrentColumn: string;
  tableId: number | undefined;
  subscriptions: Subscription[] = [];
  faXmark = faXmark;
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);

  onParentModelChanged(): void {
    // This method is mandatory for this component. Use it if needed and remove this comment.
  }

  ngOnInit(): void {
    this.setCellFilter();
  }

  agInit(params: IUpdatedFloatingFilter): void {
    this.params = params;
    // get current column
    this.getCurrentColumn = params.column.getColId();

    // get Display Data
    this.getData = this.dataTableService.getSelectBoxData();
    const getValues = this.getData.values as IStatusArray[];

    // filter data having same field
    this.optionResult = getValues?.filter(
      (el) => el.id === this.getCurrentColumn
    );
    this.valueChangedMainFilter();
    if (params?.tableName === 'check_list_table') {
      this.autoPopulate();
    }
  }

  /**
   * Method for auto populating values if filter already exist
   */
  autoPopulate() {
    const payload = this.dataTableService.dataTablePayload;
    const filterName = this.params.column.getColId();
    if (payload) {
      if (
        payload?.filterModel['cheques.cheque_status'] &&
        filterName === 'cheques.cheque_status'
      ) {
        const currentSelection = this.optionResult[0]?.values.filter(
          (el) =>
            el.value === payload?.filterModel['cheques.cheque_status']?.filter
        );
        this.currentValue = currentSelection[0].value as string;
      }
    }
  }

  valueChanged() {
    if (this.currentValue == null) {
      // Remove the filter
      this.params.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }

    this.params.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged('equals', this.currentValue);
    });
  }

  valueChangedMainFilter() {
    let match = false;
    let value: string | null;
    this.subscriptions.push(
      this.dataTableService.getMainFilter().subscribe((res) => {
        value = res?.data;

        if (value !== null && this.optionResult[0].id === res?.fieldId) {
          if (this.optionResult && this.optionResult.length > 0) {
            this.optionResult[0]?.values.forEach((el) => {
              if (el.value === res.data) {
                match = true;
              }
            });
          }

          if (match === true) {
            this.currentValue = res.data;
          } else {
            this.currentValue = '';
          }

          if (value == null) {
            // Remove the filter
            this.params.parentFilterInstance((instance) => {
              instance.onFloatingFilterChanged(null, null);
            });
            return;
          }

          this.params.parentFilterInstance((instance) => {
            instance.onFloatingFilterChanged('equals', value);
          });
        }
      })
    );
  }

  /**
   * @description Set filter when click cell filter icon.
   */
  setCellFilter(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (
          res?.field === this.params.column.getColDef()?.headerName &&
          res?.filter
        ) {
          this.currentValue = res.filter;
          this.valueChanged();
        }
      })
    );
  }

  resetFilter(): void {
    this.currentValue = '';
    this.v3DataTableService?.gridApi?.deselectAll();
    this.valueChanged();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.dataTableService.clearMainFilter();
  }
}

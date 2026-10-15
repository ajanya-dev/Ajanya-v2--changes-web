import { Subscription, debounceTime } from 'rxjs';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';

interface IUpdatedFloatingFilter extends IFloatingFilterParams {
  tableName?: string;
  tableId?: number;
}

@Component({
  selector: 'app-dt-search-box',
  templateUrl: './dt-search-box.component.html',
  styleUrls: ['./dt-search-box.component.scss'],
  standalone: true,
  imports: [FormsModule, FaIconComponent, NgClass]
})
export class DtSearchBoxComponent
  implements AgFloatingFilterComponent, OnDestroy, OnInit
{
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  onParentModelChanged(): void {
    // This method is mandatory for this component. Use it if needed and remove this comment.
  }

  params: IUpdatedFloatingFilter;
  currentValue: string | null;
  filterModelItem: ISelectBoxFilterArray;
  isV3DataTable = false;
  subsription: Subscription[] = [];
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);
  faXmark = faXmark;

  agInit(params: IUpdatedFloatingFilter): void {
    this.params = params;
    this.checkIsV3DataTable();
    this.clearFilters();
    this.autoPopulate(params);
  }

  ngOnInit(): void {
    this.setCellFilter();
  }

  /**
   * @description Automatically populates the component's `currentValue` based on the current state
   * of the DataTable payload and the column identified by the provided parameters.
   */
  autoPopulate(params: IUpdatedFloatingFilter) {
    if (params?.tableName === 'payment_table') {
      const payload = this.v3DataTableService.dataTablePayload;
      const filterName = this.params.column.getColId();
      if (payload) {
        if (payload?.filterModel?.amount && filterName === 'amount') {
          this.currentValue = payload?.filterModel?.amount?.filter;
        } else if (
          payload?.filterModel?.description &&
          filterName === 'description'
        ) {
          this.currentValue = payload?.filterModel?.description?.filter;
        } else if (
          payload?.filterModel?.created_by?.name &&
          filterName === 'created_by.name'
        ) {
          this.currentValue = payload?.filterModel?.created_by?.name?.filter;
        } else if (
          payload?.filterModel?.reference_no &&
          filterName === 'reference_no'
        ) {
          this.currentValue = payload?.filterModel?.reference_no?.filter;
        }
      }
    } else if (params?.tableName === 'check_list_table') {
      const payload = this.dataTableService.dataTablePayload;
      const filterName = this.params.column.getColId();
      if (payload) {
        if (
          payload?.filterModel?.cheque_amount &&
          filterName === 'cheque_amount'
        ) {
          this.currentValue = payload?.filterModel?.cheque_amount?.filter;
        } else if (
          payload?.filterModel['bank_accounts.bank_account_account_name'] &&
          filterName === 'bank_accounts.bank_account_account_name'
        ) {
          this.currentValue =
            payload?.filterModel[
              'bank_accounts.bank_account_account_name'
            ]?.filter;
        } else if (
          payload?.filterModel?.cheque_serial_number &&
          filterName === 'cheque_serial_number'
        ) {
          this.currentValue =
            payload?.filterModel?.cheque_serial_number?.filter;
        } else if (
          payload?.filterModel?.cheque_invoice_number &&
          filterName === 'cheque_invoice_number'
        ) {
          this.currentValue =
            payload?.filterModel?.cheque_invoice_number?.filter;
        } else if (
          payload?.filterModel?.catagory_name &&
          filterName === 'catagory_name'
        ) {
          this.currentValue = payload?.filterModel?.catagory_name?.filter;
        } else if (
          payload?.filterModel?.cheque_memo &&
          filterName === 'cheque_memo'
        ) {
          this.currentValue = payload?.filterModel?.cheque_memo?.filter;
        } else if (
          payload?.filterModel?.cheque_account_number &&
          filterName === 'cheque_account_number'
        ) {
          this.currentValue =
            payload?.filterModel?.cheque_account_number?.filter;
        } else if (
          payload?.filterModel?.cheque_created_by_name &&
          filterName === 'cheque_created_by_name'
        ) {
          this.currentValue =
            payload?.filterModel?.cheque_created_by_name?.filter;
        }
        this.getSearch({ keyCode: 13 });
      }
    }
  }

  /**
   * @description This function is specifically created for the payments table.
   * It is used to clear the selected value in search box when switching tabs.
   * Listens for tab switch changes from `switchPaymentTableTab$`.
   */
  clearFilters() {
    this.subsription.push(
      this.v3DataTableService.switchPaymentTableTab$.subscribe((res) => {
        if (res) {
          this.v3DataTableService.clearStoredData();
          this.currentValue = null;
        }
      })
    );
  }

  /**
   * @description Set filter when click cell filter icon.
   */
  setCellFilter(): void {
    this.subsription.push(
      this.cellValue$.subscribe((res) => {
        if (
          res?.field === this.params.column.getColDef()?.headerName &&
          res?.filter
        ) {
          this.currentValue = res.filter;
          this.getSearch({ keyCode: 13 });
        }
      })
    );
  }

  /**
   * @description Reset filter.
   */
  resetFilter(): void {
    this.currentValue = null;
    this.v3DataTableService?.gridApi?.deselectAll();
    this.getSearch({ keyCode: 13 });
  }

  getSearch(event: { keyCode: number }): void {
    if (event.keyCode !== 13) return;
    if (this.currentValue == null) {
      // Remove the filter
      if (this.isV3DataTable) {
        this.setFilterModel();
        return;
      }
      this.params.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }
    let mode: string;
    const filterMode = this.params.filterParams.colDef.filter;

    if (filterMode === 'agNumberColumnFilter') {
      mode = 'equals';
    } else {
      mode = 'contains';
    }
    if (event.keyCode === 13) {
      if (this.isV3DataTable) {
        const filter = {
          filter: this.currentValue,
          filterType: 'text',
          type: mode
        };
        this.setFilterModel(filter);
        return;
      }
    }
    let searchValue: string = this.currentValue as string;
    if (this.params.filterParams.colDef.field === 'type_details.employee_ssn') {
      searchValue = (this.currentValue.toString().match(/\d+/g) ?? []).join('');
    }
    this.params.parentFilterInstance((instance) => {
      instance.onFloatingFilterChanged(mode, searchValue);
    });
  }

  // }

  /**
   * @description Method to check if table loaded is V3, and set `isV3DataTable` property..
   */
  checkIsV3DataTable() {
    this.v3DataTableService.hasV3DataTableLoaded$
      .pipe(debounceTime(200))
      .subscribe((res) => {
        if (res === true) {
          this.isV3DataTable = true;
        }
      });
  }

  /**
   * @description Creates payload object for filtering and returns it.
   * @param filterValue - String representing value to be filtered.
   * @returns Filter payload object.
   */
  createFilterPayload(
    selectBoxFilterValues: ISelectBoxFilterValues | undefined,
    filterName: string
  ) {
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: selectBoxFilterValues as ISelectBoxFilterArray
    };
    return filterPayloadForGrid;
  }

  /**
   * @description Method to update the filter in default payload and update the table.
   * @param filter - Parent filter model.
   * @param event Filter changed event from grid.
   */
  setFilterModel(filter?: ISelectBoxFilterValues | undefined) {
    let filterName = this.params.column.getColId();
    if (filterName === 'created_by') filterName = 'created_by.name';
    
    if (filterName === 'payee_name' && this.params?.tableId === 113) {
      filterName = 'payees.payee_name';
    }
  
    if(filterName === 'name' && this.params?.tableId === 112) {
      filterName = 'multi_import_check_mailing_batches.name';
    }
    
    if (this.currentValue === '' || this.currentValue === null) {
      this.v3DataTableService.updateV3DataTableByRemovingFilter = [filterName];
      this.v3DataTableService.removeSearchBoxFilters(filterName);
      return;
    }
    if (filter) {
      this.filterModelItem = this.createFilterPayload(filter, filterName);
      if (this.params?.tableName === 'payment_table') {
        this.storeFilterValues(filterName);
      }
      this.v3DataTableService.updateV3DataTable = this.filterModelItem;
    }
  }

  /**
   * @description Stores the filter values in the v3DataTableService based on the provided filterName.
   * @param {string} filterName - The name of the filter or column identifier.
   */
  storeFilterValues(filterName: string) {
    if (filterName === 'amount') {
      this.v3DataTableService.filteredAmount = this.filterModelItem;
    } else if (filterName === 'description') {
      this.v3DataTableService.filteredDescription = this.filterModelItem;
    } else if (filterName === 'created_by.name') {
      this.v3DataTableService.filteredCreatedAt = this.filterModelItem;
    } else if (filterName === 'reference_no') {
      this.v3DataTableService.filteredReference = this.filterModelItem;
    }
    this.v3DataTableService.updatePayloadData();
  }

  ngOnDestroy(): void {
    this.subsription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { Subscription } from 'rxjs/internal/Subscription';
import {
  DataTableService,
  ICellValue
} from 'src/app/shared/service/data-table/data-table.service';
import {
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V3DataTableService } from '../../../../modules/v3-data-table/services/v3-data-table.service';

type IFloatingFilterParamsExtended<T = unknown> = IFloatingFilterParams<T> & {
  suppressFilterButton?: boolean;
  table?: 'payment_table' | 'bankAccount_data_table';
  tableName?: string;
};

interface IStatusData {
  value: string;
  name: string;
  type: 'normal' | 'check';
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  selector: 'app-v3-data-table-select-box',
  templateUrl: './v3-data-table-select-box.component.html',
  styleUrls: ['./v3-data-table-select-box.component.scss']
})
export class V3DataTableSelectBoxComponent implements OnInit, OnDestroy {
  /* Injectors */
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private paymentService = inject(PaymentsService);

  /* Variables */
  params: IFloatingFilterParamsExtended<ICommonTransactionTableData>;
  isFilterUpdationAPICalled = false;
  currentValue: IStatusData | '' = '';
  getData!: {
    data: IDtColumnFields[];
    values: IDtFloatingFilterProp['selectBox'];
  };

  optionResult: any;
  getCurrentColumn: unknown;
  tableId: number | undefined;
  subscriptions: Subscription[] = [];
  tableType?: IFloatingFilterParamsExtended['table'];
  checkStatus: { type: string; value: string | number; name: string }[] = [];
  bindedValues = '';
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);
  faXmark = faXmark;

  subFilterNames = [] as string[];

  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param params This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(params: IFloatingFilterParamsExtended<ICommonTransactionTableData>) {
    this.clearFilters();
    this.params = params;

    if (params.column) {
      this.tableId = (params.column.getColDef() as any)?.tableId;
    }

    /* Get current column */
    this.getCurrentColumn = this.params.column.getColId();

    /* Get display data */
    this.getData = this.dataTableService.getSelectBoxData();
    const getValues = this.getData.values;

    /* Filter data having same field */
    if (getValues) {
      const filterData = getValues?.filter(
        (el) => el.id === this.getCurrentColumn
      );
      if (filterData) {
        this.optionResult = filterData[0]?.values.map((item) => ({
          ...item,
          type: 'normal'
        }));
      }
    }

    if (
      (params.table === 'payment_table' ||
        params.tableName === 'payee_transaction') &&
      this.getCurrentColumn === 'status'
    ) {
      this.setUpCheckSelectMenu(getValues);
    }
    if (
      params.table === 'payment_table' ||
      params.tableName === 'payee_transaction'
    ) {
      this.autoPopulate();
    }
  }

  ngOnInit(): void {
    this.setCellFilter();
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
          const checkStatus = this.checkStatus.filter(
            (item) => (item as unknown as IStatusData).value === res.filter
          )[0] as unknown as IStatusData;
          const selectedCheckStatus = checkStatus?.name;

          this.bindedValues = selectedCheckStatus ?? res.filter;
          this.onChangeValue(res);
        }
      })
    );
  }

  /**
   * @description Automatically populates the component's bindedValues based on the current state
   * of the DataTable payload and the isClickEyeButton flag in the v3DataTableService.
   */
  autoPopulate() {
    const payLoad = this.v3DataTableService.dataTablePayload;
    if (
      payLoad &&
      (this.v3DataTableService.isClickEyeButton ||
        this.paymentService.isFromViewPage)
    ) {
      if (
        payLoad?.filterModel?.source_type &&
        this.getCurrentColumn === 'source_type'
      ) {
        this.bindedValues = payLoad?.filterModel?.source_type.filter;
      } else if (
        payLoad?.filterModel?.transfer_mode &&
        this.getCurrentColumn === 'transfer_mode'
      ) {
        const value = this.optionResult.filter(
          (item: { value: unknown }) =>
            item.value === payLoad?.filterModel?.transfer_mode.filter
        );
        this.bindedValues = value[0].name;
      } else if (
        payLoad?.filterModel?.status &&
        this.getCurrentColumn === 'status'
      ) {
        const value = this.optionResult.filter(
          (item: { value: unknown }) =>
            item.value === payLoad?.filterModel?.status.filter
        );
        this.bindedValues = value[0].name;
      } else if (
        payLoad?.filterModel?.transfer_type &&
        this.getCurrentColumn === 'status'
      ) {
        this.bindedValues = this.v3DataTableService
          ?.selectedCheckStatus as string;
      }
    }
  }

  /**
   * @description This function is specifically created for the payments table.
   * It is used to clear the selected source,type and status when switching tabs.
   * Listens for tab switch changes from `switchPaymentTableTab$`.
   */
  clearFilters() {
    this.subscriptions.push(
      this.v3DataTableService.switchPaymentTableTab$.subscribe((res) => {
        if (res) {
          this.v3DataTableService.clearStoredData();
          this.bindedValues = '';
        }
      })
    );
  }

  /**
   * Setting up check filter selection menu. if the table is paymen table and the column is status,
   * then we are adding one more option group in select. for filtering checks.
   * @param values - array of check filter select options
   */
  setUpCheckSelectMenu(values: IDtFloatingFilterProp['selectBox']) {
    const filterCheckStatus =
      values?.filter((val) => val.id === 'cheques.cheque_status') ?? [];
    if (filterCheckStatus[0]) {
      this.checkStatus = filterCheckStatus[0].values.map((item) => ({
        ...item,
        type: 'check'
      })) as {
        type: string;
        value: string | number;
        name: string;
      }[];
    }
  }

  /**
   * This function is needed as per AG Grid Documentation but we don't use the
   * functionalities inside.
   * @param parentModel Updates on changes in select box but not all the time.
   */
  onParentModelChanged(parentModel: ISelectBoxFilterValues): void {
    parentModel;
  }

  /**
   * @description Function is called when an option is chosen in the select box.
   */
  onChangeValue(filter?: ICellValue) {
    let value;
    if (this.bindedValues === '') {
      value = '';
    } else {
      const otherStatus = this.optionResult.filter(
        (item: { name: string }) => item.name === this.bindedValues
      );
      const checkStatus = this.checkStatus.filter(
        (item) => (item as unknown as IStatusData).name === this.bindedValues
      );
      value = otherStatus[0] ?? checkStatus[0];
    }
    this.onSetFilterPayload(value, filter);
  }

  /**
   * @description Sets the filter payload based on the provided value and updates the V3 data table accordingly.
   *
   * @param {IStatusData | ''} value - The value to set in the filter payload.
   */
  onSetFilterPayload(currentValue: IStatusData | '', filter?: ICellValue) {
    this.currentValue = currentValue;
    let filterName = '';

    if (currentValue === '') {
      const filters: string[] = [];
      if (
        (this.params.table === 'payment_table' ||
          this.params.tableName === 'payee_transaction') &&
        this.getCurrentColumn === 'status' &&
        this.v3DataTableService.defaultPayload.filterModel.transfer_type
      ) {
        this.v3DataTableService.defaultPayload.transfer_status = undefined;
        filters.push('transfer_type');
        this.v3DataTableService.removeFilters('transfer_type');
      }
      if (this.params.filterParams.colDef.field) {
        filters.push(this.params.filterParams.colDef.field);
        this.v3DataTableService.removeFilters(
          this.params.filterParams.colDef.field
        );
      }
      if (
        this.params.table === 'bankAccount_data_table' &&
        this.getCurrentColumn === 'verified_by' &&
        this.v3DataTableService.defaultPayload.filterModel.mark_as_verified
      ) {
        filters.push('mark_as_verified');
        this.v3DataTableService.removeFilters('mark_as_verified');
      }

      if (this.params.tableName === 'multi_check_mail_table') {
        filters.push('multi_import_check_mailing_batches.status');
        this.v3DataTableService.removeFilters('status');
      }

      if (this.subFilterNames.length) {
        this.subFilterNames.forEach((el) => {
          this.v3DataTableService.removeFilters(el);
        });
      }

      this.v3DataTableService.updateV3DataTableByRemovingFilter = [
        ...filters,
        ...this.subFilterNames
      ];
    } else if (
      typeof currentValue === 'object' &&
      currentValue.type === 'normal'
    ) {
      /**
       * @description Add the filter based on ```currentValue``` which holds the
       * number value of the filter and ```this.params.filterParams.colDef.field```
       * which is the name of the filter
       */
      const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
        filter: currentValue.value,
        filterType: 'text',
        type: 'equals'
      };

      filterName = this.params.filterParams.colDef.field as string;

      /**
       * enables searching for different column field from a single column for bank account data table
       */
      if (
        this.params.table === 'bankAccount_data_table' &&
        this.getCurrentColumn === 'verified_by'
      ) {
        if (currentValue.name === 'Verified') {
          filterName = 'mark_as_verified';
          if (this.v3DataTableService.defaultPayload.filterModel?.verified_by) {
            this.v3DataTableService.defaultPayload.filterModel.verified_by =
              undefined;
          }
        } else {
          this.v3DataTableService.defaultPayload.filterModel.mark_as_verified =
            undefined;
        }
      }

      /**
       * Special case for multi_check_mail_table where status should map to multi_import_check_mailing_batches.status
       */
      if (this.params.tableName === 'multi_check_mail_table' && filterName === 'status') {
        filterName = 'multi_import_check_mailing_batches.status';
      }

      const filterPayloadForGrid: ISelectBoxFilterArray = {
        [filterName]: {
          ...selectBoxFilterValues
        }
      };

      let subFilter: ISelectBoxFilterValues | undefined;

      if (filter?.subFilter) {
        this.subFilterNames.push(filter.subFilter.name);
        subFilter = {
          filter: filter.subFilter.value,
          filterType: 'text',
          type: 'equals'
        };
      }

      if (subFilter && filter?.subFilter) {
        filterPayloadForGrid[filter?.subFilter.name] = subFilter;
      }

      if (filterName === 'source_type') {
        this.v3DataTableService.filteredSourceType = filterPayloadForGrid;
      } else if (filterName === 'transfer_mode') {
        this.v3DataTableService.filteredTransferType = filterPayloadForGrid;
      } else if (filterName === 'status') {
        this.v3DataTableService.filteredStatusType = filterPayloadForGrid;
      }

      // Setting up check filter selection menu. if the table is paymen table and the column is status,
      // then we are removing the check filters if there is any
      // from the ag-grid payload
      if (
        (this.params.table === 'payment_table' ||
          this.params.tableName === 'payee_transaction') &&
        this.getCurrentColumn === 'status'
      ) {
        this.v3DataTableService.updateV3DataTableByRemovingFilter = [
          'transfer_type'
        ];
        this.v3DataTableService.defaultPayload.transfer_status = undefined;
      }

      this.v3DataTableService.updateV3DataTable = filterPayloadForGrid;

      // Setting up check filter selection menu. if the table is paymen table and the column is status,
      // then we are adding the check filters in the ag-grid payload
    } else if (
      typeof currentValue === 'object' &&
      currentValue.type === 'check'
    ) {
      this.v3DataTableService.selectedCheckStatus = currentValue.name;
      const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
        filter: 'CHECK',
        filterType: 'text',
        type: 'contains'
      };

      const filterPayloadForGrid: ISelectBoxFilterArray = {
        transfer_type: {
          ...selectBoxFilterValues
        }
      };
      this.v3DataTableService.filteredCheckType = filterPayloadForGrid;
      this.v3DataTableService.updateV3DataTableByRemovingFilter = ['status'];
      this.v3DataTableService.defaultPayload.transfer_status =
        currentValue.value;
      this.v3DataTableService.updateV3DataTable = filterPayloadForGrid;
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

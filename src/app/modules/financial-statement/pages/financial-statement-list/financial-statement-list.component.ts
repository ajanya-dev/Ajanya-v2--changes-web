import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { formatNumber } from '@angular/common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import {
  IDataTable,
  IDtColumnFields,
  IDtHeaderElements
} from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { EyeButtonComponent } from '../../components/eye-button/eye-button.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

interface IOperationType {
  value: number;
  name: string;
}

@Component({
  selector: 'app-financial-statement-list',
  templateUrl: './financial-statement-list.component.html',
  styleUrls: ['./financial-statement-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class FinancialStatementListComponent implements OnInit, IDataTable,OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(AlertService);

  // DATA TABLE VARAIBLES
  public columnDefs: (ColDef | ColGroupDef)[] | null;
  public columnFields: IDtColumnFields[];
  public headerElements: IDtHeaderElements;
  subscriptions: Subscription[] = [];
  public frameworkComponents: {
    selectBoxComponent: typeof V3DataTableSelectBoxComponent;
    dateRangeV35Component: typeof DataRangeV35Component;
    SearchBoxComponent: typeof DtSearchBoxComponent;
    btnCellRenderer: typeof EyeButtonComponent;
    V3DTCommonFilterComponent: typeof V3DTCommonFilterComponent;
  };

  public tableId = DTTableId.financialStatement;

  operationTypes: IOperationType[] = [
    { value: 1, name: 'Refill' },
    { value: 2, name: 'Mail' },
    { value: 3, name: 'Shopping' },
    { value: 5, name: 'Refund' },
    { value: 15, name: 'SMS' },
    { value: 7, name: 'Transaction fee' },
    { value: 11, name: 'Shipping Label' },
    { value: 13, name: 'Check Design Fee' },
    { value: 25, name: 'Document Mail' },
    { value: 27, name: 'Invoice Mail' },
  ];

  operationTypeMap = new Map(
    this.operationTypes.map((el) => [el.value, el.name])
  );

  actionComponentProp: { actionButton: boolean; eyeButton: boolean };
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Financial Statement',
    ignoreColumns: ['id', 'action']
  };

  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'operation_type',
        values: this.operationTypes
      }
    ],
    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true }
    ]
  };

  disabledColumns = ['new_amount', 'financial_statements.amount', 'old_amount'];

  ngOnInit(): void {
    this.frameworkComponents = {
      selectBoxComponent: V3DataTableSelectBoxComponent,
      dateRangeV35Component: DataRangeV35Component,
      SearchBoxComponent: DtSearchBoxComponent,
      btnCellRenderer: EyeButtonComponent,
      V3DTCommonFilterComponent
    };

    this.columnDefs = [
      this.colDefDate,
      this.colDefPrevAmount,
      this.colDefCrAmount,
      this.colDefDrAmount,
      this.colDefBalAmount,
      this.colDefType,
      this.colDefDesc,
      this.colDefAction
    ];

    // PASS  FIELD DATA
    this.columnFields = [
      {
        id: 'created_at',
        name: 'Date',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'old_amount',
        name: 'Previous Balance',
        isDisabled: true,
        colDef: this.colDefPrevAmount,
        isChecked: true
      },
      {
        id: 'amount',
        name: 'Credit',
        isDisabled: true,
        colDef: this.colDefCrAmount,
        isChecked: true
      },
      {
        id: 'amount',
        name: 'Debit',
        isDisabled: true,
        colDef: this.colDefDrAmount,
        isChecked: true
      },
      {
        id: 'new_amount',
        name: 'Balance',
        isDisabled: true,
        colDef: this.colDefBalAmount,
        isChecked: true
      },
      {
        id: 'operation_type',
        name: 'Operation Type',
        isDisabled: false,
        colDef: this.colDefType,
        isChecked: true
      },

      {
        id: 'description',
        name: 'Description',
        isDisabled: false,
        colDef: this.colDefDesc,
        isChecked: true
      },
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];

    // ACTION COMPONENT PROPERTIES
    this.actionComponentProp = {
      actionButton: false,
      eyeButton: true
    };

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      undefined,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  colDefDate = {
    minWidth: 180,
    maxWidth: 180,
    headerName: 'Date',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date',
      isFormatDateWithHyphen: true,
      prefixOptionalField: 'created_date'
    }
  };

  colDefPrevAmount = {
    minWidth: 180,
    maxWidth: 200,
    headerName: 'Previous Balance',
    field: 'old_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: number }) => {
      const amount = formatNumber(params.value, 'en-US', '1.2-2');
      return `$${amount}`;
    }
  };

  colDefCrAmount = {
    minWidth: 180,
    maxWidth: 200,
    headerName: 'Credit',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { data: { operation: number; amount: number } }) => {
      if (params.data.operation === 1) {
        const amount = formatNumber(params.data.amount, 'en-US', '1.2-2');
        return `$${amount}`;
      }
      return '$0.00';
    },
    cellStyle: () => ({ color: 'var(--brand-color-lite)' })
  };

  colDefDrAmount = {
    minWidth: 180,
    maxWidth: 200,
    headerName: 'Debit',
    field: 'financial_statements.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { data: { operation: number; amount: number } }) => {
      if (params.data.operation === 2) {
        const amount = formatNumber(params.data.amount, 'en-US', '1.2-2');
        return `$${amount}`;
      }
      return '$0.00';
    },
    cellStyle: () => ({ color: 'var(--text_danger_lite)' })
  };

  colDefBalAmount = {
    minWidth: 180,
    maxWidth: 200,
    headerName: 'Balance',
    field: 'new_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: number }) => {
      const amount = formatNumber(params.value, 'en-US', '1.2-2');
      return `$${amount}`;
    }
  };

  colDefType = {
    minWidth: 100,
    headerName: 'Operation Type',
    field: 'operation_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: (params: { value: number }) => ({
      fieldValue: this.operationTypeMap.get(params.value)
    })
  };

  colDefDesc = {
    minWidth: 100,
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction = {
    minWidth: 50,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 100,
    sortable: false,
    cellRenderer: 'btnCellRenderer',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererParams: {
      clicked() {
        return false;
      }
    },
    cellStyle: () => ({ color: 'var(--ocw-btn-light-blue)' })
  };

  /**
   * method to export table data
   */
  onExportData(filterModel: {
    items: string[];
    fromDate: string | Date;
    toDate: string | Date;
    type: 'csv' | 'pdf';
  }) {
    this.subscriptions.push(
      this.v3DataTableService
        .exportTable(filterModel, 'financial-statements')
        .subscribe((val) => {
          if (val.message) {
            const data = {
              title: 'Success!',
              content: val.message,
              close: false
            };
            this.alertService.successAlert(data);
          } else {
            window.open(val.data.url);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

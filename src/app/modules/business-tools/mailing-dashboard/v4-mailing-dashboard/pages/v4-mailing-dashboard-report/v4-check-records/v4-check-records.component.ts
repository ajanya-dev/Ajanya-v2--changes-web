import { Component, effect, inject, input, OnDestroy, OnInit } from '@angular/core';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { SelectedService } from 'src/app/modules/data-table/components/dt-date-range/selected.service';

@Component({
  selector: 'app-v4-check-records',
  standalone: true,
  imports: [V4DataTableComponent],
  templateUrl: './v4-check-records.component.html',
  styleUrl: './v4-check-records.component.scss'
})
export class V4CheckRecordsComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private selectedService = inject(SelectedService);

  selectedDate = input<{ endDate: string; startDate: string }>();

  tableId = DTTableId.mailingDashboardCheckRecords;
  deselectedColumns: string[] = [];

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4PayeeListDropDownFilterComponent: V4PayeeMultiSelectFloatingFilterComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    V4DTCommonFilterComponent
  };

  configs = {
    selectDate: [
      { id: 'cheques.created_at', initialRange: 'All Time' }
    ]
  };

  colDefPayee = {
    headerName: 'Payee',
    minWidth: 220,
    flex: 2,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4PayeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 220,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { isAmountField: true }
  };

  colDefBank = {
    headerName: 'Bank',
    minWidth: 175,
    flex: 1,
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefGroupName = {
    headerName: 'Group Name',
    field: 'group_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    flex: 1,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefCheckSerialNumber = {
    headerName: 'Check Serial Number',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 185,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefTrackingNumber = {
    headerName: 'Tracking Number',
    field: 'tracking_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefTransferMode = {
    headerName: 'Transfer Mode',
    field: 'transfer_mode',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefCreatedAt = {
    headerName: 'Created Date',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilterComponentParams: { tableId: 108 },
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4UpdatedAtComponent'
  };

  defaultColumnFields = [
    { id: 'payee_name', name: 'Payee', isDisabled: true, colDef: this.colDefPayee, isChecked: true },
    { id: 'bank_name', name: 'Bank', isDisabled: true, colDef: this.colDefBank, isChecked: true },
    { id: 'amount', name: 'Amount', isDisabled: true, colDef: this.colDefAmount, isChecked: true },
    { id: 'group_name', name: 'Group Name', isDisabled: false, colDef: this.colDefGroupName, isChecked: true },
    { id: 'cheques.created_at', name: 'Created Date', isDisabled: false, colDef: this.colDefCreatedAt, isChecked: true },
    { id: 'cheque_serial_number', name: 'Check Serial Number', isDisabled: false, colDef: this.colDefCheckSerialNumber, isChecked: true },
    { id: 'tracking_number', name: 'Tracking Number', isDisabled: false, colDef: this.colDefTrackingNumber, isChecked: true },
    { id: 'transfer_mode', name: 'Transfer Mode', isDisabled: false, colDef: this.colDefTransferMode, isChecked: true }
  ];

  columnDefs = [
    this.colDefPayee,
    this.colDefBank,
    this.colDefAmount,
    this.colDefGroupName,
    this.colDefCreatedAt,
    this.colDefCheckSerialNumber,
    this.colDefTrackingNumber,
    this.colDefTransferMode
  ];

  constructor() {
    effect(() => {
      const selectedDate = this.selectedDate();
      if (selectedDate) {
        this.applyDateFilter(selectedDate);
      }
    });
  }

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(this.defaultColumnFields, this.configs);
    this.initializeDataTable();
  }

  private applyDateFilter(selectedDate: { startDate: string; endDate: string }): void {
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate.startDate === today && selectedDate.endDate === today;
    this.selectedService.setCustomDateFilterArray({
      colId: 'cheques.created_at',
      fromDate: selectedDate.startDate,
      toDate: selectedDate.endDate,
      dateRangeId: isToday ? 'today' : undefined
    });
  }

  private initializeDataTable(): void {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}

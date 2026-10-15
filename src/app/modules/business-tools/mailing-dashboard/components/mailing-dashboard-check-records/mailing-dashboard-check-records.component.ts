import { CurrencyPipe } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { SelectedService } from 'src/app/modules/data-table/components/dt-date-range/selected.service';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';

@Component({
  selector: 'app-mailing-dashboard-check-records',
  standalone: true,
  imports: [V3DataTableComponent, V3DataTableModule],
  templateUrl: './mailing-dashboard-check-records.component.html',
  styleUrl: './mailing-dashboard-check-records.component.scss'
})
export class MailingDashboardCheckRecordsComponent
  implements OnInit, OnDestroy
{
  /* Injectors */
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private selectedService = inject(SelectedService);

  /** DATA TABLE VARIABLES */
  public tableId = DTTableId.mailingDashboardCheckRecords;
  selectedDate = input<{ endDate: string; startDate: string }>();
  fieldsShownByDefault: string[] = ['payee_name','bank_name','amount'];

  frameworkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    v3PayeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    v3UpdatedAtComponent: V3UpdatedAtComponent
  };

  /** Table columns */
  colDefPayee = {
    headerName: 'Payee',
    minWidth: 175,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 100,
    maxWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefBank = {
    headerName: 'Bank',
    minWidth: 175,
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefGroupName = {
    headerName: 'Group Name',
    field: 'group_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCheckSerialNumber = {
    headerName: 'Check Serial Number',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
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
    cellClass: 'flex flex-col justify-center'
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
    cellClass: 'flex flex-col justify-center'
  };

  colDefCreatedAt = {
    headerName: 'Created Date',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent',
    floatingFilterComponentParams: {
      tableId: 108
    }
  };

  /**
   * Default column fields for column chooser support (required for v3 data table)
   */
  defaultColumnFields = [
    {
      id: 'payee_name',
      name: 'Payee',
      isDisabled: false,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'bank_account',
      name: 'Bank',
      isDisabled: false,
      colDef: this.colDefBank,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'group_name',
      name: 'Group Name',
      isDisabled: false,
      colDef: this.colDefGroupName,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created Date',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'cheque_serial_number',
      name: 'Check Serial Number',
      isDisabled: false,
      colDef: this.colDefCheckSerialNumber,
      isChecked: true
    },
    {
      id: 'tracking_number',
      name: 'Tracking Number',
      isDisabled: false,
      colDef: this.colDefTrackingNumber,
      isChecked: true
    },
    {
      id: 'transfer_mode',
      name: 'Transfer Mode',
      isDisabled: false,
      colDef: this.colDefTransferMode,
      isChecked: true
    }
  ];

  constructor() {
    effect(() => {
      const selectedDate = this.selectedDate();
      if (selectedDate) {
        this.setDefaultDate(selectedDate);
      }
    });
  }

  ngOnInit(): void {
    this.initializeV3DataTable();
    this.refreshDataTable();
    this.dataTableService.setDataFromParent(undefined);
  }

  setDefaultDate(selectedDate: { endDate: string; startDate: string }) {
    const today = new Date().toISOString().split('T')[0];
    const isToday =
      selectedDate.startDate === today && selectedDate.endDate === today;
    this.selectedService.setCustomDateFilterArray({
      colId: 'cheques.created_at',
      fromDate: selectedDate?.startDate as string,
      toDate: selectedDate?.endDate as string,
      dateRangeId: isToday ? 'today' : undefined
    });
    this.colDefCreatedAt.floatingFilterComponentParams = { tableId: 108 };
  }

  /**
   * @description Initializes the V3 data table with default payload values.
   */
  initializeV3DataTable() {
    const filterModels = {};
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: filterModels,
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  refreshDataTable(): void {
    this.initializeV3DataTable();
  }

  /** Set column fields. */
  columnDefs = [
    this.colDefPayee,
    this.colDefBank,
    this.colDefAmount,
    this.colDefGroupName,
    this.colDefCheckSerialNumber,
    this.colDefTrackingNumber,
    this.colDefTransferMode,
    this.colDefCreatedAt
  ];

  /**
   * @description Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
  }
}

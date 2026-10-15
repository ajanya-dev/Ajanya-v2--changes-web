import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-payroll-data-table',
  templateUrl: './payroll-data-table.component.html',
  styleUrls: ['./payroll-data-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent],
  providers: [CurrencyPipe]
})
export class PayrollDataTableComponent implements OnInit, OnChanges {
  @Input() selectedApp: IPayrollApps;

  public tableId = DTTableId.universalPayrollTransaction;
  rowHeight = '45';
  dynamicHeaderText: 'Payroll Details';
  appId: string = '';

  public currencyPipe = inject(CurrencyPipe);
  public datePipe = inject(DatePipe);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  colDefAmount = {
    headerName: 'Payroll Amount',
    field: 'payroll_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    cellClass: 'ag-right-aligned-cell',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  colDefDate = {
    headerName: 'Processed Date',
    field: 'processed_date',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'selectDateComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'payroll_transaction'
    },
    cellRenderer: 'v3UpdatedAtComponent',
    cellRendererParams: {
      isPayroll: true
    }
  };

  colDefFromCard = {
    headerName: 'From Credit Card',
    field: 'processed_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    cellClass: 'ag-right-aligned-cell',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  colDefCheckDate = {
    headerName: 'Payroll Date',
    field: 'payroll_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableId: 77
    },
    headerClass: 'fixed-size-header',
    cellRenderer: (params: ICellRendererParams) => {
      const inputDate = new Date(params.value);
      return `${(inputDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${inputDate
        .getDate()
        .toString()
        .padStart(2, '0')}/${inputDate.getFullYear()}`;
    }
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'created_by_user.name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header'
  };

  colDefBankAccount = {
    headerName: 'Bank Account',
    field: 'bank_account.bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 115,
    field: 'universal_payroll_transactions.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const value = params?.data?.status;
      let name = '';
      let bg = '';
      let color = '';
      if (value === 0) {
        name = `Pending`;
        bg = 'var(--pending-status-background-color)';
        color = '#C17D2D';
      } else if (value === 1) {
        name = `Processing`;
        bg = 'var(--refund-status-background-color)';
        color = '#4168CD';
      } else if (value === 2) {
        name = `Completed`;
        bg = 'var(--settled-status-background-color)';
        color = 'var(--settled-status-font-color)';
      } else if (value === 3) {
        name = `Failed`;
        bg = 'var(--cancelled-status-background-color)';
        color = '#CA5A53';
      } else if (value === 4) {
        name = `Tried to pay`;
        bg = 'var(--cancelled-status-background-color)';
        color = '#C17D2D';
      } else if (value === 5) {
        name = `Automatic payment initiated`;
        bg = 'var(--cancelled-status-background-color)';
        color = 'var(--settled-status-font-color)';
      } else if (value === 6) {
        name = `Rejected`;
        bg = 'var(--cancelled-status-background-color)';
        color = 'var(--text_danger)';
      }

      return `<span title="${name}"
          style="background-color:${bg}; padding: 3px 5px;border-radius: 4px;color:${color};font-weight: 500;font-size:13px;text-transform:uppercase;">
          ${name}
        </span>`;
    }
  };

  columnDefs = [
    this.colDefAmount,
    this.colDefDate,
    this.colDefCheckDate,
    this.colDefFromCard,
    this.colDefCreatedBy,
    this.colDefBankAccount,
    this.colDefStatus
  ];

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    v3UpdatedAtComponent: V3UpdatedAtComponent,
    selectDateComponent: DataRangeV35Component
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'universal_payroll_transactions.status',
        values: [
          { value: 0, name: 'Pending' },
          { value: 1, name: 'Processing' },
          { value: 2, name: 'Completed' },
          { value: 3, name: 'Tried to pay' },
          { value: 4, name: 'Failed' },
          { value: 5, name: 'Automatic payment initiated' },
          { value: 6, name: 'Rejected' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
    this.initializeAccountDataTable();
  }

  /**
   * @description -Detects changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      if (this.appId !== this.selectedApp.id) {
        this.appId = this.selectedApp.id;
        this.initializeAccountDataTable();
      }
    }
  }

  /**
   * @description This function initializes the account data table.
   * It sets the default payload for the data table
   */
  initializeAccountDataTable(): void {
    const companyId = this.selectedApp.id;
    const companyType = this.selectedApp.manual ? 'manual' : 'merge';
    this.v3DataTableService.defaultPayload = {
      companyId,
      companyType,
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
}

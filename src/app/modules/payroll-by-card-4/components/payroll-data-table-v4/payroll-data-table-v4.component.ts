import { Component, OnInit, effect, inject, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import {
  V4StatusComponent,
  TV4StatusMap
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { V4DataTableComponent } from '../../../v4-data-table/components/v4-data-table/v4-data-table.component';

@Component({
  selector: 'app-payroll-data-table-v4',
  templateUrl: './payroll-data-table-v4.component.html',
  styleUrls: ['./payroll-data-table-v4.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent],
  providers: [CurrencyPipe]
})
export class PayrollDataTableV4Component implements OnInit {
  selectedApp = input<IPayrollApps>();

  public tableId = DTTableId.universalPayrollTransaction;
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
    minWidth: 150,
    flex: 1,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  colDefDate = {
    headerName: 'Processed Date',
    field: 'processed_date',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 170,
    flex: 1.2,
    floatingFilterComponent: 'selectDateComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'payroll_transaction'
    },
    cellRenderer: 'v4UpdatedAtComponent',
    cellRendererParams: {
      isPayroll: true
    }
  };

  colDefFromCard = {
    headerName: 'From Credit Card',
    field: 'processed_amount',
    suppressFloatingFilterButton: true,
    minWidth: 170,
    flex: 1.2,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  colDefCheckDate = {
    headerName: 'Payroll Date',
    field: 'payroll_date',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    flex: 1,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableId: 77
    },
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
    minWidth: 150,
    flex: 1.2,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true
  };

  colDefBankAccount = {
    headerName: 'Bank Account',
    field: 'bank_account.bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    flex: 1.5,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus = {
    headerName: 'Status',
    maxWidth: 300,
    minWidth: 130,
    width: 150,
    flex: 0,
    pinned: 'right' as const,
    lockPinned: true,
    lockPosition: 'right' as const,
    suppressMovable: true,
    field: 'universal_payroll_transactions.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'attachmentComments',
    cellRendererParams: {
      statusMode: 'custom' as const,
      statusField: 'status',
      statusMap: {
        0: {
          status: 'Pending',
          bgColor: 'var(--v4-badge-warning-bg-color)',
          textColor: 'var(--v4-badge-warning-text-color)'
        },
        1: {
          status: 'Processing',
          bgColor: 'var(--v4-badge-info-bg-color)',
          textColor: 'var(--v4-badge-info-text-color)'
        },
        2: {
          status: 'Completed',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-badge-success-text-color)'
        },
        3: {
          status: 'Failed',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        },
        4: {
          status: 'Tried to Pay',
          bgColor: 'var(--v4-badge-warning-bg-color)',
          textColor: 'var(--v4-badge-warning-text-color)'
        },
        5: {
          status: 'Auto Initiated',
          bgColor: 'var(--v4-badge-info-bg-color)',
          textColor: 'var(--v4-badge-info-text-color)'
        },
        6: {
          status: 'Rejected',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        }
      } satisfies TV4StatusMap,
      hideFilterButton: true,
      isStatementDisable: true
    },
    valueGetter: (params: { data: { status: number } }) => {
      const statusLabels: Record<number, string> = {
        0: 'Pending',
        1: 'Processing',
        2: 'Completed',
        3: 'Failed',
        4: 'Tried to Pay',
        5: 'Automatic Payment Initiated',
        6: 'Rejected'
      };
      return statusLabels[params?.data?.status] ?? '';
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
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    attachmentComments: V4StatusComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'universal_payroll_transactions.status',
        values: [
          { value: 0, name: 'Pending' },
          { value: 1, name: 'Processing' },
          { value: 2, name: 'Completed' },
          { value: 3, name: 'Tried to Pay' },
          { value: 4, name: 'Failed' },
          { value: 5, name: 'Automatic Payment Initiated' },
          { value: 6, name: 'Rejected' }
        ]
      }
    ],
    selectDate: [
      { id: 'processed_date', initialRange: 'All Time', isPrimary: true },
      { id: 'payroll_date', initialRange: 'All Time' }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
    this.initializeAccountDataTable();
  }

  constructor() {
    effect(() => {
      const app = this.selectedApp();
      if (app && this.appId !== app.id) {
        this.appId = app.id;
        this.initializeAccountDataTable();
      }
    });
  }

  /**
   * @description This function initializes the account data table.
   * It sets the default payload for the data table
   */
  initializeAccountDataTable(): void {
    const app = this.selectedApp();
    if (!app) return;
    const companyId = app.id;
    const companyType = app.manual ? 'manual' : 'merge';
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

import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  output,
  signal
} from '@angular/core';
import { firstValueFrom, mergeMap } from 'rxjs';
import { ICoulmnDefFieldsResponse } from 'src/app/models/v3-datatable';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

interface CashExpenseData {
  id: string;
  bank_account_bank_id: number | null;
  action: string;
  current_balance: string;
}

@Component({
  selector: 'app-cash-expense-bank-table',
  standalone: true,
  imports: [V3DataTableComponent, CommonModule],
  templateUrl: './cash-expense-bank-table.component.html',
  styleUrl: './cash-expense-bank-table.component.scss'
})
export class CashExpenseBankTableComponent implements OnInit {
  /* Injectors */
  private v3DataTableService = inject(V3DataTableService);
  private cashexpService = inject(CashExpenseService);
  private localStorageService = inject(LocalStorageService);

  /** DATA TABLE VARIABLES */
  public tableId = DTTableId.cashExpenseList;
  selectedPanelButton = 'bank_accounts';
  showCashExpenseTransaction = output<boolean>();
  isCashExpenseBalanceEnabled = signal<boolean>(false);

  constructor() {
    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.isCashExpenseBalanceEnabled.set(
      userPlugins?.includes('cash-expense-balance') || false
    );
  }

  frameworkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [
      {
        name: 'Transaction',
        id: 'transaction_list'
      },
      {
        name: 'Cash Accounts',
        id: 'bank_accounts'
      }
    ]
  }));

  /** Table columns */
  colDefAccount = {
    headerName: 'Account Name',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefAccountNickName = {
    headerName: 'Account Nickname',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'balance',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCreatedAt = {
    headerName: 'Created Date',
    field: 'bank_accounts.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent',
    floatingFilterComponentParams: {
      tableName: 'cash_expenses'
    },
    valueGetter: (params: ICellRendererParams) => params.data.created_at
  };

  colDefCurrentBalance = {
    headerName: 'Current Balance',
    field: 'current_balance',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    floatingFilter: true,
    sortable: false
  };

  /**
   * Default column fields for column chooser support (required for v3 data table)
   */
  defaultColumnFields = [
    {
      id: 'bank_account_account_name',
      name: 'Account Name',
      isDisabled: false,
      colDef: this.colDefAccount,
      isChecked: true
    },
    {
      id: 'bank_account_nick_name',
      name: 'Account Nickname',
      isDisabled: false,
      colDef: this.colDefAccountNickName,
      isChecked: true
    },
    {
      id: 'current_balance',
      name: 'Current Balance',
      isDisabled: false,
      colDef: this.colDefCurrentBalance,
      isChecked: true
    },
    {
      id: 'balance',
      name: 'Balance',
      isDisabled: false,
      colDef: this.colDefBalance,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created Date',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    this.initializeV3DataTable();
    this.refreshDataTable();
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

  headerButtonClick(event: { id: string }) {
    if (event.id === 'transaction_list') {
      this.showCashExpenseTransaction.emit(true);
    } else {
      this.showCashExpenseTransaction.emit(false);
    }
  }

  mapper = mergeMap(async (val: ICoulmnDefFieldsResponse<CashExpenseData>) => {
    if (!val.rowData.length) return val;
    const bankIds = val.rowData.map((item: CashExpenseData) =>
      item.id.toString()
    );
    const balancePromise = firstValueFrom(
      this.cashexpService.getCashExpenseBalance(bankIds, 2)
    );
    const [balancesResult] = await Promise.allSettled([balancePromise]);

    if (balancesResult.status === 'fulfilled' && balancesResult.value.success) {
      const balances = balancesResult.value.data.current_balances;
      const balanceData = Object.keys(balances);
      val.rowData.forEach((el: CashExpenseData) => {
        balanceData.forEach((item: string) => {
          if (el?.action.toString() === item) {
            el.current_balance =
              balancesResult.value.data.current_balances[item] || '0';
          }
        });
      });
    }
    return val;
  });

  /** Set column fields. */
  columnDefs = [
    this.colDefAccount,
    this.colDefAccountNickName,
    this.colDefBalance,
    this.colDefCreatedAt
  ];
}

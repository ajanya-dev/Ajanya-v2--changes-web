import { ValueFormatterParams } from '@ag-grid-community/core';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, mergeMap } from 'rxjs';
import { ICoulmnDefFieldsResponse } from 'src/app/models/v3-datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { NewCashAccountModalV4Component } from '../../modals/new-cash-account-modal-v4/new-cash-account-modal-v4.component';
import { CashExpenseTextCellComponent } from '../cash-expense-list-v4/cell-renderers/cash-expense-text-cell.component';

interface CashExpenseData {
  id: string;
  bank_account_bank_id: number | null;
  action: string;
  current_balance: string;
}

@Component({
  selector: 'app-cash-expense-bank-table-v4',
  standalone: true,
  imports: [V4DataTableComponent],
  providers: [V3DataTableService, CurrencyPipe],
  templateUrl: './cash-expense-bank-table-v4.component.html',
  styleUrl: './cash-expense-bank-table-v4.component.scss'
})
export class CashExpenseBankTableV4Component implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private cashExpenseService = inject(CashExpenseService);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private currencyPipe = inject(CurrencyPipe);

  tableId = DTTableId.cashExpenseList;
  isCashExpenseBalanceEnabled = signal(false);

  constructor() {
    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.isCashExpenseBalanceEnabled.set(
      userPlugins?.includes('cash-expense-balance') || false
    );
  }

  frameworkComponents = {
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    cashExpenseTextCell: CashExpenseTextCellComponent,
    v4CreatedAtComponent: V4CreatedAtComponent
  };

  colDefAccount = {
    headerName: 'Account Name',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 170,
    flex: 1,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTextCell'
  };

  colDefAccountNickName = {
    headerName: 'Account Nickname',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 180,
    flex: 1,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseTextCell'
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'balance',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    maxWidth: 200,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'v4-amount-col flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    valueFormatter: (params: ValueFormatterParams) => this.formatAmount(params.value)
  };

  colDefCreatedAt = {
    headerName: 'Created Date',
    field: 'bank_accounts.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableName: 'cash_expenses' },
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefCurrentBalance = {
    headerName: 'Current Balance',
    field: 'current_balance',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'v4-amount-col flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    valueFormatter: (params: ValueFormatterParams) => this.formatAmount(params.value)
  };

  columnDefs = [
    this.colDefAccount,
    this.colDefAccountNickName,
    this.colDefCurrentBalance,
    this.colDefBalance,
    this.colDefCreatedAt
  ];

  defaultColumnFields = [
    { id: 'bank_account_account_name', name: 'Account Name', isDisabled: false, colDef: this.colDefAccount, isChecked: true },
    { id: 'bank_account_nick_name', name: 'Account Nickname', isDisabled: false, colDef: this.colDefAccountNickName, isChecked: true },
    { id: 'current_balance', name: 'Current Balance', isDisabled: false, colDef: this.colDefCurrentBalance, isChecked: true },
    { id: 'balance', name: 'Balance', isDisabled: false, colDef: this.colDefBalance, isChecked: true },
    { id: 'created_at', name: 'Created Date', isDisabled: false, colDef: this.colDefCreatedAt, isChecked: true }
  ];

  ngOnInit(): void {
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

  private formatAmount(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string' && value.includes('$')) return value;

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);

    return (
      this.currencyPipe.transform(numericValue, 'USD', 'symbol', '1.2-2', 'en-US') ?? ''
    );
  }

  openNewCashAccountModal(): void {
    const ref = this.dialog.open(NewCashAccountModalV4Component, {
      width: '500px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded'
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result?.success) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  mapper = mergeMap(async (val: ICoulmnDefFieldsResponse<CashExpenseData>) => {
    if (!val.rowData.length) return val;
    const bankIds = val.rowData.map((item: CashExpenseData) => item.id.toString());
    const balancePromise = firstValueFrom(
      this.cashExpenseService.getCashExpenseBalance(bankIds, 2)
    );
    const [balancesResult] = await Promise.allSettled([balancePromise]);

    if (balancesResult.status === 'fulfilled' && balancesResult.value.success) {
      const balances = balancesResult.value.data.current_balances;
      const balanceData = Object.keys(balances);
      val.rowData.forEach((el: CashExpenseData) => {
        balanceData.forEach((item: string) => {
          if (el?.action?.toString() === item) {
            el.current_balance = balances[item] || '0';
          }
        });
      });
    }
    return val;
  });
}

import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams } from '@ag-grid-community/core';
import {
  V4SelectDropdownComponent,
  IV4SelectOption
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { BankDataV4TransactionsStateService } from '../../../services/bank-data-v4-transactions-state.service';
import { IBankDataV4PostData } from '../../../services/bank-data-v4-api.service';
import { indentNameByLevel } from '../../../services/bank-data-v4-category.util';
import { IBankDataV4TxnRow } from '../../../models/bank-data-v4-api.types';
import { BankDataV4TransactionsStatsComponent } from '../../../components/transactions-stats-cards/bank-data-v4-transactions-stats.component';
import {
  BankDataV4PostdataFilterComponent,
  IBankDataV4FilterOption
} from '../../../components/txn-postdata-filter/bank-data-v4-postdata-filter.component';
import { BankDataV4TxnCellComponent } from '../../../components/txn-cell/bank-data-v4-txn-cell.component';
import {
  BankDataV4CreateProcessingRuleModalComponent,
  IBankDataV4CreateProcessingRuleData
} from '../../../modals/create-processing-rule-modal/bank-data-v4-create-processing-rule-modal.component';
import {
  BankDataV4CreateCategoryModalComponent,
  IBankDataV4CategoryModalData
} from '../../../modals/create-category-modal/bank-data-v4-create-category-modal.component';

const DEFAULT_FROM = '1900-01-01';
const DEFAULT_TO = '2999-12-31';

@Component({
  selector: 'app-bank-data-v4-transactions-tab',
  standalone: true,
  providers: [V3DataTableService, DatePipe, CurrencyPipe],
  imports: [
    BankDataV4TransactionsStatsComponent,
    V4DataTableComponent,
    V3DataTableModule,
    V4SelectDropdownComponent
  ],
  templateUrl: './bank-data-v4-transactions-tab.component.html'
})
export class BankDataV4TransactionsTabComponent implements OnInit, OnDestroy {
  state = inject(BankDataV4TransactionsStateService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);
  private destroyRef = inject(DestroyRef);
  private bankDataService = inject(BankDataService);
  private plaidHelperService = inject(PlaidHelperService);

  readonly tableId: TTableIdValues = DTTableId.bankData; // 42

  /** Currently-selected company (drives the company chip + filteredBankAccounts). */
  selectedCompanyId = '';

  /** Companies for the dropdown — fetched directly from /bank-data/company. */
  companyList = signal<{ id: string; name: string }[]>([]);

  /** Company dropdown options, derived from the dedicated company fetch. */
  companyFilterItems = computed<IV4SelectOption[]>(() =>
    this.companyList().map((c) => ({ id: c.id, name: c.name, value: c.id }))
  );

  /**
   * Post-data block merged into every /ag-grid/42 request by app-v4-data-table
   * (read fresh from `additionalPayload()` on each fetch). Category / Account
   * filters mutate this object in place, mirroring v3's postData channel.
   */
  postData: Record<string, unknown> = {
    fromDate: DEFAULT_FROM,
    toDate: DEFAULT_TO,
    filteredBankAccounts: '',
    filterCompany: '',
    filteredCategory: '',
    filteredDescription: '',
    filteredDate: '',
    filteredAmount: '',
    categoriesList: ''
  };

  frameworkComponents = {
    searchBoxComponent: V4TextFloatingFilterComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateFloatingFilterComponent: V4DateFloatingFilterComponent,
    postdataDropdown: BankDataV4PostdataFilterComponent,
    txnCell: BankDataV4TxnCellComponent
  };

  ngOnInit(): void {
    this.state.loadIndex();
    this.state.loadCategories();
    // Company dropdown is sourced only from /bank-data/company.
    this.bankDataService
      .getCompanyList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => this.companyList.set(list));
    // Type dropdown options (filterModel path via V4DropdownFloatingFilterComponent).
    this.dataTableService.setDataFromParent(undefined, {
      selectBox: [
        {
          id: 'base_type',
          values: [
            { value: 'credit', name: 'Credit' },
            { value: 'debit', name: 'Debit' }
          ]
        }
      ]
    });
    this.initializeV3DataTable();
  }

  private initializeV3DataTable(): void {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 25,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: [{ colId: 'date', sort: 'desc' }]
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  /* ===============> Post-data (Category / Account) filtering <=============== */

  categoryFilterOptions = (): IBankDataV4FilterOption[] =>
    this.state.userCategories().map((node) => ({
      value: node.id,
      name: indentNameByLevel(
        (node.name || '').replace(/&nbsp;/g, '').trim(),
        node.level || 0
      )
    }));

  accountFilterOptions = (): IBankDataV4FilterOption[] =>
    this.state.accountOptions().map((a) => ({ value: a.id, name: a.name }));

  onCategoryFilter = (value: string): void => {
    this.postData.filteredCategory = value;
    this.applyPostData();
  };

  onAccountFilter = (value: string): void => {
    this.postData.filteredBankAccounts = value;
    this.applyPostData();
  };

  /**
   * Selecting a company scopes the grid to that company via the dedicated
   * `filterCompany` post-data key (backend-side filtering). Independent of the
   * Account column filter, so the two can combine.
   */
  onCompanyFilter = (companyId: string): void => {
    this.selectedCompanyId = companyId;
    this.postData.filterCompany = companyId || '';
    this.applyPostData();
  };

  private applyPostData(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.state.refreshTotals(this.postData as unknown as IBankDataV4PostData);
  }

  /**
   * Empty-state CTA. Nothing is created here — the rows are pulled from
   * connected banks — so the CTA opens the same Plaid modal the Accounts
   * tab uses, and reloads once an account has been linked.
   */
  onEmptyStateConnectBank(): void {
    this.plaidHelperService
      .openPlaidModal({
        isVerify: false,
        selectedBankId: '',
        sourceType: 1,
        isV4: true
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result?.success) return;
        this.state.refreshIndex();
        this.applyPostData();
      });
  }

  /* ===============> Inline row actions <=============== */

  onAddRule = (row: IBankDataV4TxnRow): void => {
    const description = (row.description_custom ||
      row.original_description ||
      '') as string;
    const ref = this.dialog.open(BankDataV4CreateProcessingRuleModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      disableClose: true,
      data: {
        accounts: this.state.accountOptions(),
        description
      } as IBankDataV4CreateProcessingRuleData
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  };

  onEditCategory = (row: IBankDataV4TxnRow): void => {
    const id = (row.category_id_custom || '') as string;
    if (!id) return;

    const data: IBankDataV4CategoryModalData = {
      mode: 'edit',
      category: { id, name: this.getCategoryName(row) }
    };

    const ref = this.dialog.open(BankDataV4CreateCategoryModalComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      disableClose: true,
      data
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.state.loadCategories();
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  };

  getCategoryName = (row: IBankDataV4TxnRow): string =>
    ((row.category_name_custom as string) || '').replace(/&nbsp;/g, '');

  private formatAmount(value: number | string): number {
    if (typeof value === 'number') return value;
    const n = parseFloat(value as string);
    return Number.isFinite(n) ? n : 0;
  }

  /* ===============> Column definitions (mirror v3 order) <=============== */

  colDefIndex = {
    headerName: '#',
    field: 'checkNumber',
    // Fixed, like the checkbox column on grids that have one — a min/max range
    // lets ag-grid flex the row-number gutter as the other columns resize.
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    sortable: false,
    lockPosition: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center justify-center',
    cellRenderer: (p: ICellRendererParams) =>
      p.node?.rowIndex != null ? String(p.node.rowIndex + 1) : ''
  };

  colDefDescription = {
    headerName: 'Description',
    field: 'description_custom',
    minWidth: 280,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilterComponentParams: { filterType: 'contains' },
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'txnCell',
    cellRendererParams: { onAddRule: this.onAddRule },
    cellRendererForExport: (params: ICellRendererParams) => {
      const row = params?.data as IBankDataV4TxnRow;
      return (row?.description_custom || row?.original_description || '') as string;
    }
  };

  colDefDate = {
    headerName: 'Date',
    field: 'date',
    minWidth: 130,
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponent: 'v4DateFloatingFilterComponent',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: (p: ICellRendererParams) =>
      this.datePipe.transform(p.value, 'MM/dd/yyyy') as string
  };

  colDefCategory = {
    headerName: 'Category',
    field: 'category_id_custom',
    minWidth: 160,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponent: 'postdataDropdown',
    floatingFilterComponentParams: {
      getOptions: this.categoryFilterOptions,
      onSelect: this.onCategoryFilter,
      placeholder: 'All'
    },
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'txnCell',
    cellRendererParams: {
      onEditCategory: this.onEditCategory,
      getCategoryName: this.getCategoryName
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      this.getCategoryName(params?.data as IBankDataV4TxnRow)
  };

  colDefAccount = {
    headerName: 'Account',
    field: 'account_id',
    minWidth: 160,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponent: 'postdataDropdown',
    floatingFilterComponentParams: {
      getOptions: this.accountFilterOptions,
      onSelect: this.onAccountFilter,
      placeholder: 'All'
    },
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    valueGetter: (p: { data?: Record<string, string> }) =>
      p.data?.account_name ?? ''
  };

  colDefType = {
    headerName: 'Type',
    field: 'base_type',
    minWidth: 110,
    maxWidth: 140,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: { placeholder: 'All' },
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: (p: ICellRendererParams) => {
      const v = (p.value ?? '').toString();
      if (!v) return '';
      // Same credit / debit ink the wallet amount cell carries — badge text
      // tokens, so both stay legible in either theme.
      const color =
        v.toUpperCase() === 'CREDIT'
          ? 'var(--v4-badge-success-text-color)'
          : 'var(--v4-badge-error-text-color)';
      const label = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      return `<span style="color: ${color}">${label}</span>`;
    }
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amountAmount',
    minWidth: 150,
    maxWidth: 200,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilterComponentParams: { filterType: 'contains' },
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    // col-id contains "amount", so the theme supplies the right-align, the 12px
    // right pad and the 500 weight for both the cell and its header.
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: (p: ICellRendererParams) =>
      this.currencyPipe.transform(this.formatAmount(p.value)) as string
  };

  columnDefs = [
    this.colDefIndex,
    this.colDefDescription,
    this.colDefDate,
    this.colDefCategory,
    this.colDefAccount,
    this.colDefType,
    this.colDefAmount
  ];

  columnFields = [
    { id: 'SNo', name: '#', isDisabled: true, colDef: this.colDefIndex, isChecked: true },
    { id: 'description', name: 'Description', isDisabled: false, colDef: this.colDefDescription, isChecked: true },
    { id: 'date', name: 'Date', isDisabled: false, colDef: this.colDefDate, isChecked: true },
    { id: 'category', name: 'Category', isDisabled: false, colDef: this.colDefCategory, isChecked: true },
    { id: 'account', name: 'Account', isDisabled: false, colDef: this.colDefAccount, isChecked: true },
    { id: 'base_type', name: 'Type', isDisabled: false, colDef: this.colDefType, isChecked: true },
    { id: 'amount', name: 'Amount', isDisabled: false, colDef: this.colDefAmount, isChecked: true }
  ];

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}

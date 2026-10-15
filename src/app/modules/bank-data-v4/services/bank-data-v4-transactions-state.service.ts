import { computed, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IBankDataAccount,
  IBankDataProviderAccounts
} from 'src/app/modules/bank/bank-v3/model/bank-v35';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import {
  BankDataV4ApiService,
  IBankDataV4PostData
} from './bank-data-v4-api.service';
import {
  IBankDataV4TxnFilters,
  IBankDataV4TxnRow,
  IBankDataV4TxnTotal,
  TBankDataV4TxnTypeFilter
} from '../models/bank-data-v4-api.types';
import {
  IV4CategoryNode,
  buildCategoryTree
} from './bank-data-v4-category.util';

const DEFAULT_FROM = '1900-01-01';
const DEFAULT_TO = '2999-12-31';

const emptyFilters = (): IBankDataV4TxnFilters => ({
  search: '',
  bankAccountIds: [],
  companyId: '',
  categoryId: '',
  txnType: 'all',
  fromDate: DEFAULT_FROM,
  toDate: DEFAULT_TO,
  amount: ''
});

/**
 * Owns transactions tab state: filters, pagination, list rows, totals.
 * Provided locally by the tab component so opening it twice resets state.
 */
@Injectable()
export class BankDataV4TransactionsStateService {
  private api = inject(BankDataV4ApiService);
  private bankDataService = inject(BankDataService);

  // Master data (loaded once)
  readonly providerAccounts = signal<IBankDataProviderAccounts[]>([]);
  readonly accountsMap = signal<{ [id: string]: IBankDataAccount }>({});
  readonly categoriesMap = signal<{ [id: string]: string }>({});
  readonly companies = signal<{ id: string; name: string }[]>([]);
  readonly userCategories = signal<IV4CategoryNode[]>([]);
  readonly ydCategories = signal<
    { id: string; name: string; parent_id?: string; level: number }[]
  >([]);

  readonly categoriesLoaded = signal(false);
  readonly indexLoaded = signal(false);

  // Filter + paging + sort
  readonly filters = signal<IBankDataV4TxnFilters>(emptyFilters());
  readonly pageIndex = signal(0); // 0-based
  readonly pageSize = signal(25);
  readonly sort = signal<{ colId: string; sort: 'asc' | 'desc' } | null>({
    colId: 'date',
    sort: 'desc'
  });

  // Results
  readonly rows = signal<IBankDataV4TxnRow[]>([]);
  readonly totalRowCount = signal(0);
  readonly isLoading = signal(false);
  readonly totals = signal<IBankDataV4TxnTotal>({});

  readonly totalPages = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.ceil(this.totalRowCount() / size) : 0;
  });

  readonly accountOptions = computed(() => {
    const map = this.accountsMap();
    return Object.entries(map).map(([id, acc]) => ({
      id,
      name: this.resolveAccountName(acc)
    }));
  });

  readonly categoryOptions = computed(() => {
    const map = this.categoriesMap();
    return Object.entries(map).map(([id, name]) => ({
      id,
      name: (name || '').replace(/&nbsp;/g, '').trim()
    }));
  });

  private subs: Subscription[] = [];

  resolveAccountName(acc?: IBankDataAccount): string {
    if (!acc) return '';
    return (acc.short_name || acc.nick_name || acc.name || '').trim();
  }

  getAccountNameById(id: string): string {
    return this.resolveAccountName(this.accountsMap()[id]);
  }

  getCategoryNameById(id: string): string {
    return (this.categoriesMap()[id] || '').replace(/&nbsp;/g, '').trim();
  }

  /** Comma-separated list of account IDs belonging to the given company. */
  getAccountIdsForCompany(companyId: string): string {
    const map = this.accountsMap();
    return Object.keys(map)
      .filter((id) => map[id]?.company_id === companyId)
      .join(',');
  }

  /** All currently-active account IDs (status === 1). v3 default scope. */
  readonly activeAccountIds = computed(() =>
    this.providerAccounts().flatMap((prov) =>
      (prov.accounts ?? [])
        .filter((acc) => acc.status === 1 && acc.id)
        .map((acc) => acc.id)
    )
  );

  private indexLoading = false;

  /** Fetch user categories from dedicated endpoint. */
  loadCategories(): void {
    this.subs.push(
      this.api
        .getCategories()
        .subscribe(
          (res: {
            success?: boolean;
            data?: { categories: IV4CategoryNode[] };
          }) => {
            if (res?.success && Array.isArray(res.data?.categories)) {
              this.userCategories.set(buildCategoryTree(res.data.categories));
            }
            this.categoriesLoaded.set(true);
          }
        )
    );
  }

  /** Reset the index gate and re-fetch master data (banks, accounts, categories). */
  refreshIndex(): void {
    this.indexLoaded.set(false);
    this.categoriesLoaded.set(false);
    this.indexLoading = false;
    this.loadIndex();
    this.loadCategories();
  }

  /**
   * Load one-time master data (banks, accounts, categories).
   * Idempotent — safe to call multiple times; only the first load fires the API.
   */
  loadIndex(): void {
    if (this.indexLoaded() || this.indexLoading) return;
    this.indexLoading = true;

    this.subs.push(
      this.api.getIndex().subscribe({
        next: (res) => {
          if (!res?.success) {
            this.indexLoading = false;
            return;
          }
          this.providerAccounts.set(res.data.providerAccounts ?? []);
          this.accountsMap.set(res.data.accounts ?? {});
          this.categoriesMap.set(res.data.categories ?? {});
          // Companies are loaded separately via loadCompanies() (/bank-data/company).
          // Flip the gate BEFORE fetchAll so the txn / total guards open.
          this.indexLoaded.set(true);
          this.indexLoading = false;
          this.fetchAll();
        },
        error: () => {
          this.indexLoading = false;
        }
      })
    );
  }

  /** Populate the companies signal from the dedicated /bank-data/company endpoint. */
  loadCompanies(): void {
    this.subs.push(
      this.bankDataService
        .getCompanyList()
        .subscribe((list) => this.companies.set(list))
    );
  }

  setFilter<K extends keyof IBankDataV4TxnFilters>(
    key: K,
    value: IBankDataV4TxnFilters[K]
  ): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.pageIndex.set(0);
    this.fetchAll();
  }

  setTxnType(type: TBankDataV4TxnTypeFilter): void {
    this.setFilter('txnType', type);
  }

  clearFilters(): void {
    this.filters.set(emptyFilters());
    this.pageIndex.set(0);
    this.fetchAll();
  }

  setSort(colId: string): void {
    const current = this.sort();
    let next: { colId: string; sort: 'asc' | 'desc' } | null;
    if (current?.colId === colId) {
      next =
        current.sort === 'asc'
          ? { colId, sort: 'desc' }
          : { colId, sort: 'asc' };
    } else {
      next = { colId, sort: 'desc' };
    }
    this.sort.set(next);
    this.fetchAll();
  }

  setPageIndex(idx: number): void {
    if (idx < 0 || (idx > 0 && idx >= this.totalPages())) return;
    this.pageIndex.set(idx);
    this.fetchTransactions();
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.fetchTransactions();
  }

  /** Build the post-data block reused for both endpoints. */
  private buildPostData(): IBankDataV4PostData {
    const f = this.filters();
    return {
      fromDate: f.fromDate || DEFAULT_FROM,
      toDate: f.toDate || DEFAULT_TO,
      filteredBankAccounts: f.companyId
        ? this.getAccountIdsForCompany(f.companyId)
        : '',
      filterCompany: f.companyId || '',
      filteredDescription: '',
      filteredCategory: '',
      filteredDate: '',
      filteredAmount: '',
      categoriesList: ''
    };
  }

  /** Refresh both totals and the table. */
  fetchAll(): void {
    this.fetchTotals();
    this.fetchTransactions();
  }

  fetchTotals(): void {
    this.subs.push(
      this.api.getTransactionTotal(this.buildPostData()).subscribe((res) => {
        if (res?.success) this.totals.set(res.data ?? {});
      })
    );
  }

  /**
   * Recompute totals using a caller-supplied post-data block. Used by the
   * transactions grid so the stat cards react to the grid's own postData
   * filters (category / account / date-range), matching v3.
   */
  refreshTotals(post: IBankDataV4PostData): void {
    this.subs.push(
      this.api.getTransactionTotal(post).subscribe((res) => {
        if (res?.success) this.totals.set(res.data ?? {});
      })
    );
  }

  fetchTransactions(): void {
    const startRow = this.pageIndex() * this.pageSize();

    this.isLoading.set(true);
    this.subs.push(
      this.api
        .fetchTransactions(
          startRow,
          this.pageSize(),
          this.buildPostData(),
          this.sort(),
          this.filters()
        )
        .subscribe({
          next: (res) => {
            if (res?.success !== false) {
              this.rows.set(res.rowData ?? []);
              this.totalRowCount.set(res.rowCount ?? 0);
            }
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        })
    );
  }

  /**
   * Fetch the full filtered dataset (up to `cap` rows) for client-side export.
   * Returns an Observable so callers can drive their own loading state.
   */
  fetchAllForExport(cap = 5000) {
    return this.api.fetchTransactions(
      0,
      cap,
      this.buildPostData(),
      this.sort(),
      this.filters()
    );
  }

  destroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiRes } from 'src/app/models/api';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  ICoulmnDefFieldsResponse,
  IDefaultPayload
} from 'src/app/models/v3-datatable';
import {
  IBankDataV4TxnFilters,
  IBankDataV4TxnRow
} from '../models/bank-data-v4-api.types';

export type TBankDataV4ManualAccountType =
  | 'cash'
  | 'checking'
  | 'savings'
  | 'credit'
  | 'investment'
  | 'loan';

export interface IBankDataV4ManualAccountPayload {
  account_name: string;
  account_type: TBankDataV4ManualAccountType;
  balance: number;
  institution_name: string;
  source: 'manual';
}

/**
 * Maps backend post-data keys for the bank-data filters → ag-grid payload.
 * Mirrors v3 view-bank-data PostData shape.
 */
export interface IBankDataV4PostData {
  fromDate: string;
  toDate: string;
  filteredBankAccounts: string;
  filterCompany: string;
  filteredDescription: string;
  filteredCategory: string;
  filteredDate: string;
  filteredAmount: string;
  categoriesList: string;
}

@Injectable({ providedIn: 'root' })
export class BankDataV4ApiService {
  private http = inject(HttpClient);
  private bankDataService = inject(BankDataService);
  private v3DataTableService = inject(V3DataTableService);

  private readonly rootUrl = environment.rootUrl;

  /** Index → providerAccounts, accounts, categories, companies, status_text */
  getIndex() {
    return this.bankDataService.getIndex();
  }

  /** Flat categories map { id: name } */
  getCategories() {
    return this.bankDataService.getCategories();
  }

  /** Aggregated totals (count / credit / debit) honoring the same post-data filters */
  getTransactionTotal(post: IBankDataV4PostData) {
    return this.bankDataService.getTransactionTotal(post);
  }

  /**
   * AG Grid 42 endpoint. We build a fresh `IDefaultPayload` for each request
   * (the shared V3DataTableService is heavily wired into the v3 table component
   * — keeping our payload local avoids stomping on it).
   */
  fetchTransactions(
    startRow: number,
    pageSize: number,
    post: IBankDataV4PostData,
    sort: { colId: string; sort: 'asc' | 'desc' } | null,
    filters: IBankDataV4TxnFilters
  ): Observable<ICoulmnDefFieldsResponse<IBankDataV4TxnRow>> {
    const filterModel: Record<string, unknown> = {};

    if (filters.search) {
      filterModel.description_custom = {
        filter: filters.search,
        filterType: 'text',
        type: 'contains'
      };
    }

    if (filters.bankAccountIds.length > 0) {
      filterModel.account_id = {
        filter: filters.bankAccountIds[0],
        filterType: 'text',
        type: 'contains'
      };
    }

    if (filters.categoryId) {
      filterModel.category_id_custom = {
        filter: filters.categoryId,
        filterType: 'text',
        type: 'contains'
      };
    }

    if (filters.amount) {
      filterModel.amountAmount = {
        filter: filters.amount,
        filterType: 'text',
        type: 'contains'
      };
    }

    if (filters.txnType && filters.txnType !== 'all') {
      filterModel.base_type = {
        filter: filters.txnType.toLowerCase(),
        filterType: 'text',
        type: 'contains'
      };
    }

    const payload: IDefaultPayload = {
      startRow,
      endRow: startRow + pageSize,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel,
      sortModel: sort ? [sort] : []
    };

    return this.v3DataTableService.getTableListData<IBankDataV4TxnRow>(
      DTTableId.bankData,
      { ...payload, ...post }
    );
  }

  /** Create a manual bank-data account (Banker-Data /bank-data/accounts endpoint). */
  createManualAccount(
    payload: IBankDataV4ManualAccountPayload
  ): Observable<IApiRes<unknown>> {
    return this.http.post<IApiRes<unknown>>(
      `${this.rootUrl}/bank-data/accounts`,
      payload
    );
  }

  createCategory(payload: { name: string; parent?: string }) {
    return this.http.post(`${this.rootUrl}/bank-data/categories`, payload);
  }

  updateCategory(body: { id: string; name: string; yd_category_id?: number }) {
    return this.bankDataService.updateCategory(body);
  }

  deleteCategory(id: string) {
    return this.bankDataService.deleteCategory(id);
  }

  // --- Account / Provider methods ---

  getAccountData(id: string) {
    return this.bankDataService.getAccountData(id);
  }

  deleteBank(id: string) {
    return this.bankDataService.deleteBank(id);
  }

  deleteProvider(id: string) {
    return this.bankDataService.deleteProvider(id);
  }

  updateProvider(body: { id: string; name: string }) {
    return this.bankDataService.updateProvider(body);
  }

  updateBank(body: unknown) {
    return this.bankDataService.updateBank(body);
  }

  activateAccount(id: string) {
    return this.bankDataService.activateAccount(id);
  }

  deActivateAccount(id: string) {
    return this.bankDataService.deActivateAccount(id);
  }

  syncPlaidTransactions(body: { bankId: string; accountIds: string[] }) {
    return this.bankDataService.syncPlaidTransactions(body);
  }

  // --- Company methods ---

  addCompany(name: string) {
    return this.bankDataService.addCompany(name);
  }

  updateCompany(body: { id: string; name: string }) {
    return this.bankDataService.updateCompany(body);
  }

  deleteCompany(id: string) {
    return this.bankDataService.deleteCompany(id);
  }

  // --- Overview chart methods ---

  getSpendingTrendsByCategory() {
    return this.http.get(
      `${this.rootUrl}/bank-data/spending-trends-by-category`
    );
  }

  getIncomeExpenseChart() {
    return this.http.get(`${this.rootUrl}/bank-data/income-expense-chart`);
  }
}

/**
 * Row shape returned by AG Grid endpoint (POST /ag-grid/42).
 * Field names mirror the v3 implementation.
 */
export interface IBankDataV4TxnRow {
  id?: string;
  date: string;
  description_custom?: string;
  original_description?: string;
  category_id_custom?: string;
  account_id: string;
  base_type: 'CREDIT' | 'DEBIT' | string;
  amountAmount: number | string;
  // pass-through for any extra metadata the backend returns
  [key: string]: unknown;
}

/**
 * Response shape from `POST /bank-data/transactions-total`.
 * Field names match the v3 implementation (view-bank-data uses
 * `total`, `credit`, `debit`, `count` directly).
 */
export interface IBankDataV4TxnTotal {
  total?: string | number;
  credit?: string | number;
  debit?: string | number;
  count?: string | number;
  [key: string]: string | number | undefined;
}

export type TBankDataV4TxnTypeFilter = 'all' | 'CREDIT' | 'DEBIT';

export interface IBankDataV4TxnFilters {
  search: string;
  bankAccountIds: string[]; // empty = all
  companyId: string; // '' = all
  categoryId: string; // '' = all
  txnType: TBankDataV4TxnTypeFilter;
  fromDate: string; // yyyy-MM-dd
  toDate: string; // yyyy-MM-dd
  amount: string;
}

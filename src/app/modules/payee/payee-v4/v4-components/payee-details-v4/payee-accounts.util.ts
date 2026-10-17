import { IPayeeBank, IPayeeInterBank } from '../../../payee-v2/model/payee';
import { Country } from 'src/app/data/data/country-list';

export type PayeeAccountKind = 'domestic' | 'international';
export type PayeeAccountFilter = 'all' | PayeeAccountKind;

/** One row of the merged payee bank-account list (card preview and modal). */
export interface PayeeAccountRow {
  kind: PayeeAccountKind;
  id: string;
  bankName: string;
  holderName: string;
  /** "Business Savings" for domestic, "GBP · Business" for international. */
  accountLabel: string;
  maskedNumber: string;
  /** Routing number for domestic, SWIFT / BIC for international. */
  identifier: string;
  /** ISO code of the beneficiary country; empty for domestic. */
  countryCode: string;
  isDefault: boolean;
  domestic?: IPayeeBank;
  international?: IPayeeInterBank;
}

export interface PayeeAccountCounts {
  all: number;
  domestic: number;
  international: number;
}

export function maskAccountNumber(value: string | null | undefined): string {
  if (!value || value.length <= 4) return value || '—';
  return `••••${value.slice(-4)}`;
}

export function formatAccountType(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function domesticRow(account: IPayeeBank): PayeeAccountRow {
  return {
    kind: 'domestic',
    id: account.id,
    bankName: account.bank_name || '',
    holderName: [account.bank_account_first_name, account.bank_account_last_name]
      .filter(Boolean)
      .join(' '),
    accountLabel: formatAccountType(account.account_type),
    maskedNumber: maskAccountNumber(account.account_number),
    identifier: account.routing_number || '',
    countryCode: '',
    isDefault: account.is_default_for_direct_deposit === 1,
    domestic: account
  };
}

function internationalRow(account: IPayeeInterBank): PayeeAccountRow {
  const details = account.bank_account_details as
    | { beneficiary_country?: string; beneficiary_bank_country?: string }
    | undefined;
  return {
    kind: 'international',
    id: account.id,
    bankName: account.bank_name || account.account_name || account.payee_name || '',
    holderName: account.account_name || '',
    accountLabel: [account.currency, formatAccountType(account.account_type)]
      .filter(Boolean)
      .join(' · '),
    maskedNumber: maskAccountNumber(account.account_number),
    identifier: account.swift_or_bic || '',
    countryCode: details?.beneficiary_country || details?.beneficiary_bank_country || '',
    isDefault:
      account.is_default_for_business === 1 || account.is_default_for_personal === 1,
    international: account
  };
}

export function mergePayeeAccounts(
  domestic: IPayeeBank[],
  international: IPayeeInterBank[]
): PayeeAccountRow[] {
  return [...domestic.map(domesticRow), ...international.map(internationalRow)].sort(
    (a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.bankName.localeCompare(b.bankName, undefined, { sensitivity: 'base' });
    }
  );
}

export function filterPayeeAccounts(
  rows: PayeeAccountRow[],
  filter: PayeeAccountFilter
): PayeeAccountRow[] {
  return filter === 'all' ? rows : rows.filter((row) => row.kind === filter);
}

export function countPayeeAccounts(rows: PayeeAccountRow[]): PayeeAccountCounts {
  return {
    all: rows.length,
    domestic: rows.filter((row) => row.kind === 'domestic').length,
    international: rows.filter((row) => row.kind === 'international').length
  };
}

const COUNTRY_LIST = Country.countryList();

export function countryName(code: string | null | undefined): string {
  if (!code) return '-';
  return COUNTRY_LIST.find((c) => c.code === code)?.name || code;
}

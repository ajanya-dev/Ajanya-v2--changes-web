import {
  IBankAccountEditDetails,
  IBankAuditTrial,
  IBankData
} from 'src/app/models/bank';

export interface IBankAccountSignalState {
  bankAccountList: IBankData[];
  selectedBankAccount: IBankData | undefined;
  bankAccountCount: number | undefined;
  bankAccountLoading: boolean;
}

export interface ISelectedBankAccountSignalState {
  bankAccountInfo: IBankAccountEditDetails | undefined;
  storeBankAccountInfo: { [key: string]: IBankAccountEditDetails };
  storeAuditTrails: { [key: string]: IBankAuditTrial[] };
  auditTrailList: IBankAuditTrial[] | undefined;
  auditTrailLoading: boolean;
  bankAccountInfoLoading: boolean;
}

export interface IProviderAccounts {
  accounts: IProviderAccount[];
  providerId: string;
  providerName: string;
  checked?: boolean;
}

export interface IProviderAccount {
  additional_status: string;
  available_balance_amount: string;
  checked: boolean;
  company_id: string;
  current_balance: string;
  id: string;
  last_updated: string;
  name: string;
  nick_name: string;
  refresh_status: number;
  short_name: string;
  status: number;
}

export interface IReAuthProvider {
  [key: string]: {
    status: string;
    statusMsg: string;
  };
}

export interface IExportAllBankAccounts {
  type: 'xlsx' | 'csv';
  fromDate: string;
  toDate: string;
}

export interface IAccountsKeyVal {
  [key: string]: {
    additional_status?: string;
    available_balance_amount?: string;
    checked?: boolean;
    company_id?: string;
    current_balance?: string;
    id?: string;
    last_updated?: string;
    name?: string;
    nick_name?: string;
    refresh_status?: number;
    short_name?: string;
    status?: number;
  };
}

export interface IBankBalanceYdRes {
  CONTAINER: string;
  lastUpdated: string;
  accountId: number;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance?: {
    amount: number;
    currency: string;
  };
  availableBalance?: {
    amount: number;
    currency: string;
  };
  currentBalance?: {
    amount: number;
    currency: string;
  };
  providerId: string;
  providerName: string;
  providerAccountId: number;
  refreshStatus: 'SUCCESS' | 'IN_PROGRESS' | 'FAILED';
  reloginRequired: 1 | 0;
  failedReason:
    | 'REQUIRED_DATA_NOT_AVAILABLE'
    | 'USER_INPUT_REQUIRED'
    | 'CREDENTIALS_UPDATE_NEEDED'
    | 'INCORRECT_CREDENTIALS'
    | 'USER_ACTION_NEEDED_AT_SITE'
    | 'ADDL_AUTHENTICATION_REQUIRED'
    | 'INVALID_ADDL_INFO_PROVIDED'
    | 'ACCOUNT_LOCKEDSITE_NOT_SUPPORTED'
    | 'SITE_BLOCKING_ERROR'
    | 'TECH_ERROR'
    | 'UNEXPECTED_SITE_ERROR'
    | 'SITE_UNAVAILABLE'
    | 'SITE_SESSION_INVALIDATED'
    | 'REQUEST_TIME_OUT'
    | 'CONSENT_EXPIRED'
    | 'CONSENT_REVOKED'
    | 'INCORRECT_OAUTH_TOKEN'
    | 'CONSENT_REQUIRED'
    | 'NEW_AUTHENTICATION_REQUIRED';
}

export interface IBankDataRes {
  providerAccounts: IBankDataProviderAccounts[];
  accounts: { [accountId: string]: IBankDataAccount };
  categories: { [categoryId: string]: string };
  companies: unknown[];
  reauth_providers: { [accountId: string]: string };
  status_text: { [statusId: string]: string };
  show_refresh_button: string;
}

export interface IBankDataProviderAccounts {
  providerId: string;
  providerName: string;
  accounts: IBankDataAccount[];
}

export interface IBankDataAccount {
  id: string;
  refresh_status: number;
  additional_status: string;
  status: number;
  nick_name: string;
  short_name: string;
  current_balance: string;
  available_balance_amount: string;
  last_updated: string;
  name: string;
  company_id: string;
}


export interface IBankBalancePlaidRes{
  accountBalance: IAccountBalance
  accountId: string
  reloginRequired: number
  lastUpdated: string
}

interface IAccountBalance {
  available: number
  current: number
  iso_currency_code: string
  limit: unknown
  unofficial_currency_code: unknown
}
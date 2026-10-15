import { createSelector } from '@ngrx/store';
import { IMainState } from '../main-state.model';
import { selectMainState } from '..';
import { IBankAccountsState } from 'src/app/models/bank';

/**
 * Selector function to get the BankAccounts array from the store.
 */
export const selectBankAccounts = createSelector(
  selectMainState,
  (state: IMainState) => state.bankAccountsStates.bankAccounts
);
/**
 * Selector function to get the filtered BankAccounts array from the store.
 */
export const selectFilteredBankAccounts = createSelector(
  selectMainState,
  (state: IMainState) => state.bankAccountsStates.bankAccountsFiltered
);
/**
 * Selector function to get the entire BankAccounts state object from the store.
 */
export const selectBankAccountsState = createSelector(
  selectMainState,
  (state: IMainState) => state.bankAccountsStates
);
/**
 * Selector function to get the 'isFilterOn' property from the BankAccounts state.
 */
export const selectIsBankAccountsFilterOn = createSelector(
  selectBankAccountsState,
  (bankAccountsStates: IBankAccountsState) => bankAccountsStates.isFilterOn
);
/**
 * Selector function to get the 'isLoading' property from the BankAccounts state.
 */
export const selectIsBankAccountsLoading = createSelector(
  selectBankAccountsState,
  (bankAccountsStates: IBankAccountsState) => bankAccountsStates.isLoading
);

/**
 * Selects the loading status for fetching bank accounts by IDs from the bank accounts state.
 */
export const selectIsBankAccountsByIdLoading = createSelector(
  selectBankAccountsState,
  (bankAccountsStates: IBankAccountsState) =>
    bankAccountsStates.isBankAccountsByIdsLoading
);

export const selectBankAccountsTotalCount = createSelector(
  selectBankAccountsState,
  (bankAccountsStates: IBankAccountsState) => bankAccountsStates.totalCount
);

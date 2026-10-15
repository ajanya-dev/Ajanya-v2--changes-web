import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { IBankAccountsState, IBankDropdown } from 'src/app/models/bank';
import { bankAccountsActions } from './bank-accounts.actions';

export const bankAccountsFeatureKey = 'bankAccounts';

const initialState: IBankAccountsState = {
  bankAccounts: [] as IBankDropdown[],
  pageNo: 0,
  isFilterOn: false,
  searchTerm: '',
  searchIds: [] as string[],
  bankAccountsFiltered: [] as IBankDropdown[],
  filteredPageNo: 0,
  isBankAccountsByIdsLoading: false,
  isLoading: false,
  isError: false
};

export const bankAccountsReducer: ActionReducer<IBankAccountsState, Action> =
  createReducer(
    initialState,
    // Action handlers:
    /**
     * Handle the 'Load bankAccounts Success' action.
     * @param {IBankAccountsState} state - Current state of the bankAccounts.
     * @param {Action} action - Action with bankAccounts data and optional pagination details.
     * @returns {IBankAccountsState} Updated state with bankAccounts, bankAccountsFiltered, pagination details, and isLoading modified.
     */
    on(
      bankAccountsActions.loadBankAccounts,
      (state, action): IBankAccountsState => {
        const searchTerm = action.searchTerm ?? '';
        const isFilterOn = !!searchTerm;
        const hasContext = Object.values(action.context ?? {}).some(Boolean);
        const searchTermChanged = searchTerm !== (state.searchTerm ?? '');
        const shouldResetData =
          !!action.isReload || hasContext || searchTermChanged;

        // A dispatch that doesn't change anything (a second dropdown mounting,
        // or a keyup that didn't alter the text) must not wipe the loaded list
        // or reset the paging counters — that only causes needless refetching.
        if (!shouldResetData) {
          if (
            state.searchTerm === searchTerm &&
            state.isFilterOn === isFilterOn &&
            state.context === action.context
          ) {
            // Same reference keeps the selectors memoized, so a repeat dispatch
            // (every keyup, every extra dropdown on the page) doesn't re-emit
            // the list and make an open dropdown re-render.
            return state;
          }
          return {
            ...state,
            searchTerm,
            isFilterOn,
            context: action.context
          };
        }

        // Whenever a mode's page counter goes back to 0 its total must be
        // dropped as well. `loadMoreBankAccounts$` skips the API call when the
        // loaded count already reaches the stored total, so keeping the
        // previous search's total behind (0 for a search with no results) made
        // the next load silently do nothing.
        const resetUnfiltered = !isFilterOn || !!action.isReload || hasContext;

        return {
          ...state,
          // The list itself is kept when only the search term changed — the
          // fresh page 1 replaces it on success, which avoids an empty flash.
          bankAccounts:
            action.isReload || hasContext ? [] : state.bankAccounts,
          pageNo: resetUnfiltered ? 0 : state.pageNo,
          totalCount: resetUnfiltered ? undefined : state.totalCount,
          // Clear filtered results when a fresh search dispatches so the
          // dropdown doesn't show the previous search's matches while the
          // new request is in flight. Pagination uses loadMoreBankAccounts
          // (separate action) so this won't break infinite-scroll.
          bankAccountsFiltered: [],
          filteredPageNo: 0,
          filteredTotalCount: undefined,
          searchTerm,
          isFilterOn,
          context: action.context,
          // Any request still in flight belongs to the previous search term and
          // gets cancelled by `loadMoreBankAccounts$`; leaving `isLoading` true
          // would make both effects skip this new load.
          isLoading: false
        };
      }
    ),
    /**
     * Handle the 'Load bankAccounts Success' action.
     * @param {IBankAccountsState} state - Current state of the bankAccounts.
     * @param {Action} action - Action with bankAccounts data and optional pagination details.
     * @returns {IBankAccountsState} Updated state with bankAccounts, bankAccountsFiltered, pagination details, and isLoading modified.
     */
    on(
      bankAccountsActions.loadBankAccountsSuccess,
      (state, action): IBankAccountsState => {
        const bankAccountsFiltered = (() => {
          if (action.bankAccountsFiltered) {
            if (action.filteredPageNo === 1) {
              return action.bankAccountsFiltered;
            }

            return [
              ...state.bankAccountsFiltered,
              ...action.bankAccountsFiltered
            ];
          }
          return state.bankAccountsFiltered;
        })();

        const bankAccounts = (() => {
          if (!action.bankAccounts) {
            return state.bankAccounts;
          }
          // Page 1 is always a fresh list (initial load, reload, or the search
          // being cleared) so it replaces instead of appending — otherwise the
          // stale page stays in the store and shows up as duplicates.
          if (action.pageNo === 1) {
            return action.bankAccounts;
          }
          return [...state.bankAccounts, ...action.bankAccounts];
        })();

        return {
          ...state,
          pageNo: action.pageNo ?? state.pageNo,
          bankAccounts,
          filteredPageNo: action.filteredPageNo
            ? action.filteredPageNo
            : state.filteredPageNo,
          bankAccountsFiltered,
          isLoading: false,
          isError: false,
          // Each mode keeps its own total, so a search result count can never
          // be mistaken for the number of accounts in the unfiltered list.
          totalCount: action.isFilterOn
            ? state.totalCount
            : (action.totalCount ?? state.totalCount),
          filteredTotalCount: action.isFilterOn
            ? (action.totalCount ?? state.filteredTotalCount)
            : state.filteredTotalCount
        };
      }
    ),
    /**
     * Handle the 'Load bankAccounts Failure' action.
     * @param {IBankAccountsState} state - Current state of the bankAccounts.
     * @returns {IBankAccountsState} Updated state with isLoading set to false and isError set to true.
     */
    on(
      bankAccountsActions.loadBankAccountsFailure,
      (state): IBankAccountsState => ({
        ...state,
        isLoading: false,
        isError: true
      })
    ),
    /**
     * Handle the 'Loading bankAccounts' action.
     * @param {IBankAccountsState} state - Current state of the bankAccounts.
     * @returns {IBankAccountsState} Updated state with isLoading set to true and isError set to false.
     */
    on(
      bankAccountsActions.loadingBankAccounts,
      (state): IBankAccountsState => ({
        ...state,
        isLoading: true,
        isError: false
      })
    ),
    /**
     * Reducer function for handling the 'loadBankAccountsByIds' action.
     */
    on(
      bankAccountsActions.loadBankAccountsByIds,
      (state, action): IBankAccountsState => {
        const searchIds = [...state.searchIds];
        action.ids.forEach((bankAccountId) => {
          if (!searchIds.includes(bankAccountId)) {
            searchIds.push(bankAccountId);
          }
        });

        return {
          ...state,
          isFilterOn: false,
          isBankAccountsByIdsLoading: true,
          searchIds,
          context: action.context
        };
      }
    ),
    /**
     * Reducer function for handling the 'loadBankAccountsByIdsSuccess' action.
     */
    on(
      bankAccountsActions.loadBankAccountsByIdsSuccess,
      (state, action): IBankAccountsState => ({
        ...state,
        isFilterOn: false,
        bankAccounts: action.bankAccounts
          ? [
              ...state.bankAccounts,
              ...action.bankAccounts.filter(
                (newAcc) =>
                  !state.bankAccounts.some(
                    (existing) => existing.id === newAcc.id
                  )
              )
            ]
          : state.bankAccounts,
        searchIds: [],
        isBankAccountsByIdsLoading: false,
        isError: false
      })
    ),
    /**
     * Reducer function for handling the 'loadBankAccountsByIdsFailure' action.
     */
    on(
      bankAccountsActions.loadBankAccountsByIdsFailure,
      (state): IBankAccountsState => ({
        ...state,
        isBankAccountsByIdsLoading: false,
        isError: true
      })
    ),
    /**
     * Reducer to add created bankAccount into store.
     * pushes the new data into existing state of bankAccounts.
     */
    on(
      bankAccountsActions.addCreatedBankAccountIntoBankAccounts,
      (state, action): IBankAccountsState => ({
        ...state,
        bankAccounts: action.bankAccount
          ? [...state.bankAccounts, action.bankAccount]
          : state.bankAccounts,
        isBankAccountsByIdsLoading: false,
        isError: true
      })
    ),
    /**
     * Reducer to delete bankAccount from store.
     * Deletes the bank account from existing state of bankAccounts.
     */
    on(
      bankAccountsActions.deleteBankFromBankAccountStore,
      (state, action): IBankAccountsState => {
        const updatedBankAccounts = state.bankAccounts.filter(
          (account) => account.id !== action.id
        );
        return {
          ...state,
          bankAccounts: updatedBankAccounts,
          isBankAccountsByIdsLoading: false,
          isError: false
        };
      }
    ),
    /**
     * Reducer function for handling the 'bankAccountsReset' action.
     */
    on(
      bankAccountsActions.bankAccountsReset,
      (): IBankAccountsState => initialState
    )
  );

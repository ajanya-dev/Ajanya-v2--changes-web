import { createSelector } from '@ngrx/store';
import { IMainState } from '../main-state.model';
import { selectMainState } from '..';
import { IWalletsStates } from 'src/app/models/wallet';

/**
 * Selector for retrieving the list of wallets from the main state.
 * @param state - Current main state.
 * @returns List of wallets.
 */
export const selectWallets = createSelector(
  selectMainState,
  (state: IMainState) => state.walletsStates.wallets
);

/**
 * Selector for retrieving the filtered list of wallets from the main state.
 * @param state - Current main state.
 * @returns Filtered list of wallets.
 */
export const selectFilteredWallets = createSelector(
  selectMainState,
  (state: IMainState) => state.walletsStates.walletsFiltered
);

/**
 * Selector for retrieving the wallets state from the main state.
 */
export const selectWalletsStates = createSelector(
  selectMainState,
  (state: IMainState) => state.walletsStates
);

/**
 * Selector for checking if wallets filtering is active.
 */
export const selectIsWalletsFilterOn = createSelector(
  selectWalletsStates,
  (walletsStates: IWalletsStates) => walletsStates.isFilterOn
);

/**
 * Selector for checking if wallets are currently loading.
 */
export const selectIsWalletsLoading = createSelector(
  selectWalletsStates,
  (walletsStates: IWalletsStates) => walletsStates.isLoading
);

/**
 * Selector for checking if wallets by IDs are currently loading.
 */
export const selectIsWalletsByIdLoading = createSelector(
  selectWalletsStates,
  (walletsStates: IWalletsStates) => walletsStates.isWalletsByIdsLoading
);


/**
 * Selector for checking whether the last wallet request was rejected with a 403.
 */
export const selectIsWalletsPermissionDenied = createSelector(
  selectWalletsStates,
  (walletsStates: IWalletsStates) => walletsStates.isPermissionDenied === true
);

export const selectWalletUploadPrompt = createSelector(
  selectWalletsStates,
  (walletsStates: IWalletsStates) => walletsStates.walletUploadPrompt
);

export const selectWalletsTotalCount = createSelector(
  selectWalletsStates,
  (walletsStates: IWalletsStates) => walletsStates.totalCount
);
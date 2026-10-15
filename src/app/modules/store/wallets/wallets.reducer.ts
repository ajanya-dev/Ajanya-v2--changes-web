import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { IWalletData, IWalletsStates } from 'src/app/models/wallet';
import { WalletsActions } from './wallets.actions';

export const walletsFeatureKey = 'wallets';

const initialState: IWalletsStates = {
  wallets: [] as IWalletData[],
  pageNo: 0,
  isFilterOn: false,
  searchTerm: '',
  searchIds: [] as string[],
  walletsFiltered: [] as IWalletData[],
  filteredPageNo: 0,
  isLoading: false,
  isWalletsByIdsLoading: false,
  isError: false,
  isPermissionDenied: false,
  walletUploadPrompt: undefined,
  hasMore: true,
  filteredHasMore: true
};

export const walletsReducer: ActionReducer<IWalletsStates, Action> =
  createReducer(
    initialState,
    // Action handlers:
    /**
     * Handle the 'Load wallets Success' action.
     * @param {IWalletsStates} state - Current state of the wallets.
     * @param {Action} action - Action with wallets data and optional pagination details.
     * @returns {IWalletsStates} Updated state with wallets, walletsFiltered, pagination details, and isLoading modified.
     */
    on(WalletsActions.loadWallets, (state, action): IWalletsStates => {
      const shouldResetData = action.isReload || !!action.context?.internationalPaymentWallets;
      return {
        ...state,
        wallets: shouldResetData ? [] : state.wallets,
        pageNo: shouldResetData ? 0 : state.pageNo,
        filteredPageNo: 0,
        searchTerm: action.searchTerm,
        isFilterOn: !!action.searchTerm,
        // A list that starts from page 0 again has its next page back.
        hasMore: shouldResetData ? true : state.hasMore,
        filteredHasMore: true,
        context: action.context,
        disablePermission: action.disablePermission
      };
    }),
    /**
     * Handle the 'Load wallets Success' action.
     * @param {IWalletsStates} state - Current state of the wallets.
     * @param {Action} action - Action with wallets data and optional pagination details.
     * @returns {IWalletsStates} Updated state with wallets, walletsFiltered, pagination details, and isLoading modified.
     */
    on(WalletsActions.loadWalletsSuccess, (state, action): IWalletsStates => {
      const isFiltered = action.filteredPageNo !== undefined;
      const rows = isFiltered ? action.walletsFiltered : action.wallets;
      const count = rows?.length ?? 0;
      const pageSize = Math.max(state.pageSize ?? 0, count);
      const hasMore = count > 0 && count >= pageSize;

      const walletsFiltered = (() => {
        if (action.walletsFiltered) {
          if (action.filteredPageNo === 1) {
            return action.walletsFiltered;
          } else {
            return [...state.walletsFiltered, ...action.walletsFiltered];
          }
        } else {
          return state.walletsFiltered;
        }
      })();
      return {
        ...state,
        pageNo: action.pageNo ?? state.pageNo,
        wallets: action.wallets
          ? [...state.wallets, ...action.wallets]
          : state.wallets,
        filteredPageNo: action.filteredPageNo
          ? action.filteredPageNo
          : state.filteredPageNo,
        walletsFiltered: walletsFiltered,
        isLoading: false,
        isError: false,
        isPermissionDenied: false,
        walletUploadPrompt: action.walletUploadPrompt ?? state.walletUploadPrompt,
        totalCount: action.totalCount ?? state.totalCount,
        pageSize,
        hasMore: isFiltered ? state.hasMore : hasMore,
        filteredHasMore: isFiltered ? hasMore : state.filteredHasMore
      };
    }),

    /**
     * Handle the 'Load wallets Failure' action.
     * @param {IWalletsStates} state - Current state of the wallets.
     * @returns {IWalletsStates} Updated state with isLoading set to false and isError set to true.
     */
    on(WalletsActions.loadWalletsFailure, (state, action): IWalletsStates => {
      return {
        ...state,
        isLoading: false,
        isError: true,
        isPermissionDenied: action.isPermissionDenied === true
      };
    }),
    /**
     * Handle the 'Loading wallets' action.
     * @param {IWalletsStates} state - Current state of the wallets.
     * @returns {IWalletsStates} Updated state with isLoading set to true and isError set to false.
     */
    on(WalletsActions.loadingWallets, (state): IWalletsStates => {
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    }),
    /**
     * Reducer function for handling 'loadWalletsByIds' action.
     * This reducer adds wallet IDs to the search list and updates loading flags.
     * @param state - Current state of the wallet module.
     * @param action - 'loadWalletsByIds' action containing wallet IDs.
     * @returns Updated wallet module state.
     */
    on(WalletsActions.loadWalletsByIds, (state, action): IWalletsStates => {
      const searchIds = [...state.searchIds];
      action.ids.forEach((walletId) => {
        if (!searchIds.includes(walletId)) {
          searchIds.push(walletId);
        }
      });

      return {
        ...state,
        isFilterOn: false,
        isWalletsByIdsLoading: true,
        searchIds: searchIds,
        context: action.context ?? state.context,
        disablePermission: action.disablePermission
      };
    }),
    /**
     * Reducer function for handling 'loadWalletsByIdsSuccess' action.
     * This reducer updates the state with fetched wallet data and resets loading flags.
     * @param state - Current state of the wallet module.
     * @param action - 'loadWalletsByIdsSuccess' action containing wallet data.
     * @returns Updated wallet module state.
     */
    on(
      WalletsActions.loadWalletsByIdsSuccess,
      (state, action): IWalletsStates => {
        return {
          ...state,
          isFilterOn: false,
          wallets: action.wallets
            ? [...state.wallets, ...action.wallets]
            : state.wallets,
          searchIds: [],
          isWalletsByIdsLoading: false,
          isError: false,
          isPermissionDenied: false
        };
      }
    ),

    /**
     * Reducer function for handling 'loadWalletsByIdsFailure' action.
     * This reducer updates the state to indicate a failure in loading wallet data.
     * @param state - Current state of the wallet module.
     * @param action - 'loadWalletsByIdsFailure' action.
     * @returns Updated wallet module state.
     */
    on(
      WalletsActions.loadWalletsByIdsFailure,
      (state, action): IWalletsStates => {
        return {
          ...state,
          // The ids stay in `searchIds` otherwise, so the next by-ids request
          // keeps re-sending the id that just failed.
          searchIds: [],
          isWalletsByIdsLoading: false,
          isError: true,
          isPermissionDenied: action.isPermissionDenied === true
        };
      }
    ),
    /**
     * Reducer function for handling 'walletsReset' action.
     * This reducer resets the wallet module state to its initial state.
     * @returns Initial wallet module state.
     */
    on(WalletsActions.walletsReset, (): IWalletsStates => {
      return initialState;
    })
  );

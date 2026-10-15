import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IWalletData } from 'src/app/models/wallet';

export const WalletsActions = createActionGroup({
  source: 'Wallets',
  events: {
    /**
     * Action to load wallets based on a search term.
     * @param searchTerm The search term used to filter wallets.
     */
    'Load Wallets': props<{ searchTerm: string; context?: { internationalPaymentWallets?: boolean }; isReload?: boolean; disablePermission?: boolean }>(),

    /**
     * Action indicating that wallets are currently being loaded.
     */
    'Loading Wallets': emptyProps(),

    /**
     * Action to signal the successful loading of wallets.
     * @param pageNo The current page number of wallets.
     * @param filteredPageNo The current page number of filtered wallets.
     * @param wallets An array of wallet data.
     * @param walletsFiltered An array of filtered wallet data.
     */
    'Load Wallets Success': props<{
      pageNo?: number;
      walletUploadPrompt?: number;
      filteredPageNo?: number;
      wallets?: IWalletData[];
      walletsFiltered?: IWalletData[];
      totalCount?: number;
    }>(),

    /**
     * Action to signal the failure of loading wallets.
     * @param error The error that occurred during wallet loading.
     * @param isPermissionDenied True when the request failed with a 403.
     */
    'Load Wallets Failure': props<{
      error: unknown;
      isPermissionDenied?: boolean;
    }>(),

    /**
     * Action to load more wallets.
     */
    'Load More Wallets': emptyProps(),

    /**
     * Action to load wallets by their IDs.
     * @param ids An array of wallet IDs to load.
     */
    'Load Wallets By Ids': props<{ ids: string[]; context?: { internationalPaymentWallets?: boolean }, disablePermission?: boolean }>(),

    /**
     * Action to signal the successful loading of wallets by their IDs.
     * @param wallets An array of wallet data.
     */
    'Load Wallets By Ids Success': props<{ wallets: IWalletData[] }>(),

    /**
     * Action to signal the failure of loading wallets by their IDs.
     * @param error The error that occurred during wallet loading.
     * @param isPermissionDenied True when the request failed with a 403.
     */
    'Load Wallets By Ids Failure': props<{
      error: unknown;
      isPermissionDenied?: boolean;
    }>(),

    /**
     * Action to reset the state of wallets.
     */
    'Wallets Reset': emptyProps()
  }
});

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IPayeeDropdown } from '../../payee/payee-v2/model/payee';

export const payeesActions = createActionGroup({
  source: 'Payees',
  events: {
    /**
     * Action dispatched to load payees based on the provided search term.
     * @param {string} searchTerm - The term used to search for payees.
     * @param {boolean} [isFilterOn] - Optional flag indicating whether filtering is active.
     */
    'Load Payees': props<{ searchTerm: string; skipEmpty?: boolean,isReload?: boolean; disablePermission?: boolean; }>(),
    /**
     * Action dispatched to indicate that payees are being loaded.
     * This action does not carry any additional data.
     */
    'Loading Payees': emptyProps(),
    /**
     * Action dispatched when loading payees is successful.
     * @param {number} [pageNo] - The page number for the loaded payees (if not filtered).
     * @param {number} [filteredPageNo] - The page number for the loaded filtered payees (if filtering applied).
     * @param {IPayeeDropdown[]} [payees] - The array of loaded payees (if not filtered).
     * @param {IPayeeDropdown[]} [payeesFiltered] - The array of loaded filtered payees (if filtering applied).
     * @param {boolean} isFilterOn - Flag indicating whether filtering is active.
     */
    'Load Payees Success': props<{
      pageNo?: number;
      filteredPageNo?: number;
      payees?: IPayeeDropdown[];
      payeesFiltered?: IPayeeDropdown[];
    }>(),
    /**
     * Action dispatched when loading payees fails.
     * This action does not carry any additional data.
     */
    'Load Payees Failure': emptyProps(),
    /**
     * Action dispatched to load more payees.
     * This action does not carry any additional data.
     */
    'Load More Payees': props<{ skipEmpty?: boolean }>(),
    /**
     * Action to load payees by their IDs.
     * @param ids - An array of payee IDs to load.
     */
    'Load Payees By Ids': props<{ ids: string[] }>(),

    /**
     * Action dispatched when loading payees by their IDs is successful.
     * @param payees - An array of loaded payees.
     */
    'Load Payees By Ids Success': props<{ payees: IPayeeDropdown[] }>(),

    /**
     * Action dispatched when loading payees by their IDs encounters an error.
     * @param error - The error that occurred during the load process.
     */
    'Load Payees By Ids Failure': props<{ error: unknown }>(),

    /**
     * Action to add created payee details into store
     * @param payee The new payee information.
     */
    'Add Created Payee Into Payees': props<{ payee: IPayeeDropdown }>(),

    /**
     * Action to remove payee from store
     * @param payee The new payee information.
     */
    'Remove Payee From Payees': props<{ payeeId: string }>(),

    /**
     * Action to add created payee details into store
     * @param payee The new payee information.
     */
    'Add updated Payee Into Payees': props<{ payee: IPayeeDropdown }>(),

    /**
     * Action to reset the payees state.
     */
    'Payees Reset': emptyProps()
  }
});

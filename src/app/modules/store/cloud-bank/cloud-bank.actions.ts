import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ICloudAccountDetails2,
  ICloudBankAccountDetailsAirwallex
} from '../../cloud-bank/model/cloudbank';

/**
 * Actions related to managing Cloud Banks.
 */
export const CloudBankAccountsActions = createActionGroup({
  source: 'CloudBankAccounts',
  events: {
    /**
     * @description Load cloud Bank Accounts Airwallex action.
     */
    'Load Cloud Bank Accounts Airwallex': emptyProps(),

    /**
     * Load Cloud Bank Accounts success action.
     *
     * @param bankAccounts - An array of existing cloud bank account.
     * @param bankAccountsFiltered - An array of filtered existing cloud bank account.
     * @param isFilterOn - A boolean indicating whether a filter is applied.
     * @param bankAccountsGrouped - An array of existing cloud bank account - grouped with title.
     */
    'Load Cloud Bank Accounts Airwallex Success': props<{
      bankAccountsAirwalex: ICloudBankAccountDetailsAirwallex[];
      isLoading: boolean;
    }>(),

    /**
     * Load Cloud Bank Accounts failure action.
     *
     * @param error - An unknown error object.
     */
    'Load Cloud Bank Accounts Airwallex Failure': props<{ error: unknown }>(),

    /**
     * Loading Cloud Bank Accounts action.
     */
    'Loading Cloud Bank Accounts': emptyProps(),

    /**
     * Add Cloud Bank Accounts action.
     */
    'Add Cloud Bank Accounts': props<{ bankAccount: ICloudAccountDetails2 }>(),

    /**
     * Reset Cloud Bank Accounts action.
     */
    'Cloud Bank Accounts Reset': emptyProps()
  }
});

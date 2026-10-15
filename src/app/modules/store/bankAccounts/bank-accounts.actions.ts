import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IBankDropdown } from 'src/app/models/bank';

export const bankAccountsActions = createActionGroup({
  source: 'BankAccounts',
  events: {
    /**
     * Action dispatched to load BankAccounts based on the provided search term.
     * @param {string} searchTerm - The term used to search for BankAccounts.
     */
    'Load BankAccounts': props<
    { searchTerm: string;
      context?: {
        fromDepositSlip?:boolean;
        forPaymentLink?: boolean;
        forInvoice?: boolean;
        forCreditMemo?: boolean;
        forBill?: boolean;
        forCheckDraft?: boolean;
        forCashExpense?: boolean;
        forPayment?: boolean;
      };
      isReload?: boolean; }
    >(),
    /**
     * Action dispatched to indicate that BankAccounts are being loaded.
     * This action does not carry any additional data.
     */
    'Loading BankAccounts': emptyProps(),
    /**
     * Action dispatched when loading BankAccounts is successful.
     * @param {number} [pageNo] - The page number for the loaded BankAccounts (if not filtered).
     * @param {number} [filteredPageNo] - The page number for the loaded filtered BankAccounts (if filtering applied).
     * @param {IBankDropdown[]} [bankAccounts] - The array of loaded BankAccounts (if not filtered).
     * @param {IBankDropdown[]} [bankAccountsFiltered] - The array of loaded filtered BankAccounts (if filtering applied).
     * @param {boolean} isFilterOn - Flag indicating whether filtering is active.
     */
    'Load BankAccounts Success': props<{
      pageNo?: number;
      filteredPageNo?: number;
      bankAccounts?: IBankDropdown[];
      bankAccountsFiltered?: IBankDropdown[];
      totalCount?: number;
      isFilterOn?: boolean;
    }>(),
    /**
     * Action dispatched when loading BankAccounts fails.
     * This action does not carry any additional data.
     */
    'Load BankAccounts Failure': emptyProps(),
    /**
     * Action dispatched to load more BankAccounts.
     * This action does not carry any additional data.
     */
    'Load More BankAccounts': emptyProps(),

    /**
     * Loads bank accounts by their IDs.
     * @param ids - An array of bank account IDs to load.
     * @param context - Optional context for filtering bank accounts.
     */
    'Load BankAccounts By Ids': props<{ 
      ids: string[];
      context?: {
        fromDepositSlip?:boolean;
        forPaymentLink?: boolean;
        forInvoice?: boolean;
        forCreditMemo?: boolean;
        forBill?: boolean;
        forCheckDraft?: boolean;
        forCashExpense?: boolean;
        forPayment?: boolean;
      };
    }>(),

    /**
     * Successful response for loading bank accounts by IDs.
     * @param bankAccounts - An array of bank account data.
     */
    'Load BankAccounts By Ids Success': props<{
      bankAccounts: IBankDropdown[];
    }>(),

    /**
     * Failure response for loading bank accounts by IDs.
     * @param error - An error object describing the failure.
     */
    'Load BankAccounts By Ids Failure': props<{ error: unknown }>(),

    /**
     * Action to add created bankAccount details into store
     * @param bankAccount The new bankAccount information.
     */
    'Add Created Bank Account Into Bank Accounts': props<{
      bankAccount: IBankDropdown;
    }>(),

    /**
     * Action to delete bankAccount from store
     * @param bankAccount The new bankAccount information.
     */
    'Delete Bank From Bank Account Store': props<{ id: string }>(),
    /**
     * Resets the bank accounts state to its initial state.
     */
    'BankAccounts Reset': emptyProps()
  }
});

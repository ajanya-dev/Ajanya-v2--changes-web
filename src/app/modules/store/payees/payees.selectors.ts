import { createSelector } from '@ngrx/store';
import { IMainState } from '../main-state.model';
import { selectMainState } from '..';
import { IPayeesState } from '../../payee/payee-v2/model/payee';

/**
 * Selector function to get the payees array from the store.
 */
export const selectPayees = createSelector(
  selectMainState,
  (state: IMainState) => state.payeesStates.payees
);
/**
 * Selector function to get the filtered payees array from the store.
 */
export const selectFilteredPayees = createSelector(
  selectMainState,
  (state: IMainState) => state.payeesStates.payeesFiltered
);
/**
 * Selector function to get the entire payees state object from the store.
 */
export const selectPayeesState = createSelector(
  selectMainState,
  (state: IMainState) => state.payeesStates
);
/**
 * Selector function to get the 'isFilterOn' property from the payees state.
 */
export const selectIsPayeesFilterOn = createSelector(
  selectPayeesState,
  (payeesStates: IPayeesState) => payeesStates.isFilterOn
);
/**
 * Selector function to get the 'isLoading' property from the payees state.
 */
export const selectIsPayeesLoading = createSelector(
  selectPayeesState,
  (payeesStates: IPayeesState) => payeesStates.isLoading
);

/**
 * Selector function to retrieve the loading status of payees by IDs from the payees state.
 */
export const selectIsPayeesByIdLoading = createSelector(
  selectPayeesState,
  (payeesStates: IPayeesState) => payeesStates.isPayeesByIdsLoading
);

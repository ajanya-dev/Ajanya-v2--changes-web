import { createSelector } from '@ngrx/store';
import { selectAppState } from 'src/app/store';
import { IAppState } from 'src/app/store/app-state.model';

/**
 * Selector for retrieving the list of wallets from the main state.
 * @param state - Current main state.
 * @returns List of wallets.
 */
export const layoutVariables = createSelector(
  selectAppState,
  (state: IAppState) => state.layoutVariables
);

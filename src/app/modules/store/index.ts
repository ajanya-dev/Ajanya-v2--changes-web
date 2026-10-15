import {
  ActionReducerMap,
  Store,
  createActionGroup,
  createFeatureSelector,
  emptyProps
} from '@ngrx/store';
import { IMainState } from './main-state.model';
import { payeesReducer } from './payees/payees.reducers';
import { bankAccountsReducer } from './bankAccounts/bank-accounts.reducer';
import { cardsReducer } from './cards/cards.reducer';
import { walletsReducer } from './wallets/wallets.reducer';
import { categoriesReducer } from './categories/categories.reducer';
import { cloudBankReducer } from './cloud-bank/cloud-bank.reducer';
import { userManagementReducer } from './userManagement/userManagement.reducer';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { exhaustMap, of } from 'rxjs';
import { WalletsActions } from './wallets/wallets.actions';
import { CardsActions } from './cards/cards.actions';
import { CategoriesActions } from './categories/categories.actions';
import { bankAccountsActions } from './bankAccounts/bank-accounts.actions';
import { payeesActions } from './payees/payees.actions';
import { CloudBankAccountsActions } from './cloud-bank/cloud-bank.actions';
import { UserManagementActions } from './userManagement/userManagement.actions';

/**
 * The feature key for the main state.
 */
export const mainStateFeatureKey = 'mainState';
/**
 * Selector to retrieve the main state from the store.
 */
export const selectMainState = createFeatureSelector<IMainState>('mainState');

/**
 * Reducers for the main state.
 */
export const reducers: ActionReducerMap<IMainState> = {
  payeesStates: payeesReducer,
  bankAccountsStates: bankAccountsReducer,
  cardsStates: cardsReducer,
  walletsStates: walletsReducer,
  categoriesStates: categoriesReducer,
  cloudBankStates: cloudBankReducer,
  userManagementStates: userManagementReducer
};

/**
 * Actions related to the main state.
 */
export const mainStateActions = createActionGroup({
  source: 'mainState',
  events: {
    'Reset States On Company Change': emptyProps()
  }
});

@Injectable()
export class MainStateEffects {
  private store = inject(Store);
  private actions$ = inject(Actions);

  /**
   * Effect to reset various states when the company changes.
   */
  mainStateEffects = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(mainStateActions.resetStatesOnCompanyChange), // Listen for the 'loadCategories' action
        exhaustMap(() => {
          this.store.dispatch(WalletsActions.walletsReset());
          this.store.dispatch(CardsActions.cardsReset());
          this.store.dispatch(CategoriesActions.categoriesReset());
          this.store.dispatch(bankAccountsActions.bankAccountsReset());
          this.store.dispatch(payeesActions.payeesReset());
          this.store.dispatch(
            CloudBankAccountsActions.cloudBankAccountsReset()
          );
          this.store.dispatch(UserManagementActions.clearUserVerification());
          return of();
        })
      );
    },
    {
      dispatch: false
    }
  );
}

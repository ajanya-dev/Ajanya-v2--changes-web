import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { IAppUser } from './app-state.model';
import { AppActions } from './app.actions';

export const appFeatureKey = 'app';

export const appUserReducer: ActionReducer<IAppUser, Action> = createReducer(
  { isUserLoggedIn: false },
  on(AppActions.appInit, (state, action): IAppUser => {
    return {
      ...state,
      ...action
    };
  })
);

import { ActionReducerMap, createFeatureSelector } from '@ngrx/store';
import { IAppState } from './app-state.model';
import { appUserReducer } from './app.reducer';
import { layoutReducers } from '../layout/v3-layout/state/layout.reducers';

/**
 * Selector to retrieve the app state from the store.
 */
export const selectAppState = createFeatureSelector<IAppState>('appState');

export const reducers: ActionReducerMap<IAppState> = {
  appUser: appUserReducer,
  layoutVariables: layoutReducers
};

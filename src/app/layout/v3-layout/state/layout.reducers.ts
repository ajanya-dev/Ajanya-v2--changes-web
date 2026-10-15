import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { ILayoutVariables } from 'src/app/store/app-state.model';
import * as LayoutActions from './layout.actions';

export const initialState = {
  emailVerified: 0,
  phoneVerified: 0,
  activeCompanyName: '',
  achEnabled: 0,
  internationalPaymentEnabled: 0,
  pingPongEnabled: 0,
  email: '',
  userId: 0,
  phone: '',
  encryptedUserId: '',
  isSubscribed: 0,
  companyName: '',
  profilePicLink: 'assets/images/user-img.jpg'
};

export const layoutReducers: ActionReducer<ILayoutVariables, Action> =
  createReducer(
    initialState,
    on(LayoutActions.storeVariables, (state, action) => ({
      ...state,
      ...action
    }))
  );

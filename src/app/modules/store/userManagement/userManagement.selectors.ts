import { createSelector } from '@ngrx/store';
import { IMainState } from '../main-state.model';
import { IUserManagementStates } from './userManagement.model.interface';
import { selectMainState } from '..';

export const selectUserVerificationAllState = createSelector(
  selectMainState,
  (state: IMainState) => state?.userManagementStates
);

// `mainState` is registered by the lazy MainModule, so the slice is undefined
// for anything selecting before /manage loads — the auth pages included. null
// is the same "not known yet" this selector already returns from the initial
// state, matching the sibling selectors below.
export const selectUserVerification = createSelector(
  selectUserVerificationAllState,
  (state: IUserManagementStates) => state?.userVerificationState ?? null
);

export const selectUserIsLoading = createSelector(
  selectUserVerificationAllState,
  (state: IUserManagementStates) => state?.isLoading ?? false
);

export const selectIsError = createSelector(
  selectUserVerificationAllState,
  (state: IUserManagementStates) => state?.isError ?? false
);

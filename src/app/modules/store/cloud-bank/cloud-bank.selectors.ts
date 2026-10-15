import { createSelector } from '@ngrx/store';
import { IMainState } from '../main-state.model';
import { selectMainState } from '..';
import { ICloudBankStates } from 'src/app/models/cloudBank';

export const selectCLoudBanksStates = createSelector(
  selectMainState,
  (state: IMainState) => state.cloudBankStates
);

export const selectCLoudBanksAirwallexStates = createSelector(
  selectMainState,
  (state: IMainState) => state.cloudBankStates.bankAccountsAirwallex
);

export const selectIsCloudLoading = createSelector(
  selectCLoudBanksStates,
  (cloudBankStates: ICloudBankStates) => cloudBankStates.isLoading
);

export const selectCloudBankError = createSelector(
  selectCLoudBanksStates,
  (cloudBankStates: ICloudBankStates) => cloudBankStates.isError
);

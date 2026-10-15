import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { ICloudBankStates } from 'src/app/models/cloudBank';
import { CloudBankAccountsActions } from './cloud-bank.actions';
import {
  ICloudAccountDetails2,
  ICloudBankAccountDetails,
  ICloudBankAccountDetailsAirwallex
} from '../../cloud-bank/model/cloudbank';

export const cloudFeatureKey = 'cloud';

const initialState = {
  bankAccountsGrouped: [],
  bankAccounts: [] as ICloudBankAccountDetails[],
  pageNo: 0,
  isFilterOn: false,
  searchTerm: '',
  bankAccountsFiltered: [] as ICloudAccountDetails2[],
  filteredPageNo: 0,
  isLoading: false,
  isError: false,
  bankAccountsAirwallex: [] as ICloudBankAccountDetailsAirwallex[]
} as ICloudBankStates;

export const cloudBankReducer: ActionReducer<ICloudBankStates, Action> =
  createReducer(
    initialState,

    /**
     * Reducer for handling the 'Load Cloud Bank Accounts Airwallex'.
     *
     * @param state - The current state of the Cloud Bank feaure
     * @returns The new state after applying the action.
     */
    on(
      CloudBankAccountsActions.loadCloudBankAccountsAirwallex,
      (state): ICloudBankStates => {
        return {
          ...state
        };
      }
    ),

    /**
     * Reducer for handling the 'Load Cloud Banks Airwallex Success' action.
     *
     * @param state - The current state of the Cloud Banks feature.
     * @param action - The 'Load Cloud Banks Airwallex Success' action.
     * @returns Updated state with loaded Cloud Banks data.
     */
    on(
      CloudBankAccountsActions.loadCloudBankAccountsAirwallexSuccess,
      (state, action): ICloudBankStates => {
        return {
          ...state,
          bankAccountsAirwallex: action.bankAccountsAirwalex,
          isLoading: action.isLoading
        };
      }
    ),

    /**
     * Reducer for handling the 'Load Cloud Banks Airwallex Failure' action.
     *
     * @param state - The current state of the Cloud Banks feature.
     * @returns Updated state with an error flag set.
     */
    on(
      CloudBankAccountsActions.loadCloudBankAccountsAirwallexFailure,
      (state, action): ICloudBankStates => {
        return {
          ...state,
          isLoading: false,
          isError: action.error
        };
      }
    ),

    /**
     * Reducer for handling the 'Loading Cloud Banks' action.
     *
     * @param state - The current state of the Cloud Banks feature.
     * @returns Updated state with loading indicators.
     */
    on(
      CloudBankAccountsActions.loadingCloudBankAccounts,
      (state): ICloudBankStates => {
        return {
          ...state,
          isLoading: true,
          isError: false
        };
      }
    ),
    /**
     * Reducer for handling the 'Add Cloud Banks' action.
     *
     * @param state - The current state of the Cloud Banks feature.
     * @returns Updated state with loading indicators and adding new cloud bank information.
     */
    on(
      CloudBankAccountsActions.addCloudBankAccounts,
      (state, action): ICloudBankStates => {
        return {
          ...state,
          bankAccounts: action.bankAccount
            ? [...state.bankAccounts, action.bankAccount]
            : state.bankAccounts,
          isLoading: true,
          isError: false
        };
      }
    ),
    /**
     * Reducer for handling the 'Cloud Banks Reset' action.
     * @returns The initial state of the Cloud Banks feature.
     */
    on(
      CloudBankAccountsActions.cloudBankAccountsReset,
      (): ICloudBankStates => {
        return initialState;
      }
    )
  );

import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { IUserManagementStates } from './userManagement.model.interface';
import { UserManagementActions } from './userManagement.actions';
import { IUserVerification } from 'src/app/models/user';

export const userManagementFeatureKey = 'userManagement';

const initialState: IUserManagementStates = {
  userVerificationState: null,
  isError: false,
  isLoading: false
};

export const userManagementReducer: ActionReducer<
  IUserManagementStates,
  Action
> = createReducer(
  initialState,
  /**
   * UserManagement reducer handles state changes for credit card data.
   *
   * @param state - The current state of the UserManagement module.
   * @param action - The action dispatched to update the state.
   * @returns The new state after applying the action.
   */
  on(
    UserManagementActions.loadUserVerification,
    (state): IUserManagementStates => {
      return {
        ...state
      };
    }
  ),
  /**
   * Reducer for handling the 'Load UserManagement Success' action.
   *
   * @param state - The current state of the UserManagement feature.
   * @param action - The 'Load UserManagement Success' action.
   * @returns Updated state with loaded UserManagement data.
   */
  on(
    UserManagementActions.loadUserVerificationSuccess,
    (state, action): IUserManagementStates => {
      return {
        ...state,
        userVerificationState: action.verificationState,
        isLoading: false,
        isError: false
      };
    }
  ),
  /**
   * Reducer for handling the 'Load UserManagement Failure' action.
   *
   * @param state - The current state of the UserManagement feature.
   * @returns Updated state with an error flag set.
   */
  on(
    UserManagementActions.loadUserVerificationFailure,
    (state, action): IUserManagementStates => {
      return {
        ...state,
        isLoading: false,
        isError: action.error
      };
    }
  ),
  /**
   * Reducer for handling the 'Loading UserManagement' action.
   *
   * @param state - The current state of the UserManagement feature.
   * @returns Updated state with loading indicators.
   */
  on(
    UserManagementActions.loadingUserVerification,
    (state): IUserManagementStates => {
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    }
  ),

  /**
   * Reducer for handling the 'manualUpdateUserVerification' action.
   *
   * @param state - The current state of the UserManagement feature.
   * @param action - The 'manualUpdateUserVerification' action.
   * @returns Updated state with loaded UserManagement data.
   */
  on(
    UserManagementActions.manualUpdateUserVerification,
    (state, action): IUserManagementStates => {
      return {
        ...state,
        userVerificationState: {
          ...(state.userVerificationState ?? {}),
          ...(action.verificationState ?? {})
        } as IUserVerification,
        isLoading: false,
        isError: false
      };
    }
  ),

  /**
   * Reducer for handling the 'clear UserManagement' action.
   *
   * @param state - The current state of the UserManagement feature.
   * @returns Updated state with loading indicators and adding new card information.
   */
  on(
    UserManagementActions.clearUserVerification,
    (state, action): IUserManagementStates => {
      return {
        ...state,
        userVerificationState: null,
        isLoading: false,
        isError: false
      };
    }
  )
);

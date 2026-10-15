import { createFeature, createReducer, on } from '@ngrx/store';
import { groupPaymentsActions } from './groupPayments.actions';
import { IGroupPaymentsState } from '../models/group-payments.models';

export const storeFeatureKey = 'groupPayments';

/**
 * Initial state for the group payments feature.
 */
const initialState: IGroupPaymentsState = {
  isLoading: false,
  mode: 'CREATE',
  groupDetails: {}
};

/**
 * Reducer for the group payments feature.
 */
export const groupPaymentsFeature = createFeature({
  name: storeFeatureKey,
  reducer: createReducer(
    initialState,
    /**
     * Action handler for initializing group payments.
     */
    on(
      groupPaymentsActions.groupPaymentsInit,
      (state, action): IGroupPaymentsState => {
        return {
          ...state,
          isLoading: false,
          mode: action.id ? 'UPDATE' : 'CREATE'
        };
      }
    ),
    /**
     * Action handler for loading group payment data.
     */
    on(
      groupPaymentsActions.groupPaymentsLoadGroupPaymentData,
      (state, action): IGroupPaymentsState => ({
        ...state,
        isLoading: true,
        groupDetails: {
          groupId: action.id
        }
      })
    ),
    /**
     * Action handler for successfully loading group payment data.
     */
    on(
      groupPaymentsActions.groupPaymentsLoadSuccess,
      (state, action): IGroupPaymentsState => ({
        ...state,
        isLoading: false,
        groupDetails: {
          groupId: state.groupDetails.groupId,
          groupData: action.groupDetails
        }
      })
    ),
    /**
     * Action handler for loading group payment data failure.
     */
    on(
      groupPaymentsActions.groupPaymentsLoadFailure,
      (state): IGroupPaymentsState => ({
        ...state,
        isLoading: false
      })
    ),
    /**
     * Action handler for updating the group payment name.
     */
    on(
      groupPaymentsActions.groupPaymentsUpdateName,
      (state, action): IGroupPaymentsState => ({
        ...state,
        isLoading: false,
        groupDetails: {
          groupId: state.groupDetails.groupId,
          groupData: {
            resources: state.groupDetails.groupData?.resources ?? [],
            groupName: action.groupName
          }
        }
      })
    ),
    /**
     * Action handler for resetting group payments to initial state.
     */
    on(
      groupPaymentsActions.groupPaymentsReset,
      (): IGroupPaymentsState => initialState
    )
  )
});

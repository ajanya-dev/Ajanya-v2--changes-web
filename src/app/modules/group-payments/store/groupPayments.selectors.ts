import { createFeatureSelector } from '@ngrx/store';
import * as fromStore from './groupPayments.reducer';
import { IGroupPaymentsState } from '../models/group-payments.models';

/**
 * Selector to get the group payments state from the store.
 */
export const selectStoreState = createFeatureSelector<IGroupPaymentsState>(
  fromStore.storeFeatureKey
);

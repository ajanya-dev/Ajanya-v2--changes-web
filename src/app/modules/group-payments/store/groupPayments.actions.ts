import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IGroupPaymentsDetails } from '../models/group-payments.models';

export const groupPaymentsActions = createActionGroup({
  source: 'groupPayments',
  events: {
    'GroupPayments init': props<{ id?: string }>(),
    'GroupPayments Load GroupPaymentData': props<{ id: string }>(),
    'GroupPayments Load Success': props<{
      groupDetails: IGroupPaymentsDetails;
    }>(),
    'GroupPayments Load Failure': props<{ error: unknown }>(),
    'GroupPayments Update Name': props<{ groupName: string }>(),
    'GroupPayments Reset': emptyProps()
  }
});

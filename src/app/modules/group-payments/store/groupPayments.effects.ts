import { Injectable, inject } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, concatMap } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { groupPaymentsActions } from './groupPayments.actions';
import { groupPaymentsFeature } from './groupPayments.reducer';
import { GroupPaymentsService } from '../services/group-payments.service';

@Injectable()
export class StoreEffects {
  private store = inject(Store);
  private groupPaymentsService = inject(GroupPaymentsService);

  /**
   * Effect to initialize group payments.
   */
  groupPaymentsInit$ = createEffect(
    () => this.actions$.pipe(
        ofType(groupPaymentsActions.groupPaymentsInit),
        concatLatestFrom(() =>
          this.store.select(groupPaymentsFeature.selectGroupPaymentsState)
        ),
        concatMap(([action, groupPaymentsState]) => {
          if (action.id) {
            if (action.id != groupPaymentsState.groupDetails.groupId) {
              this.store.dispatch(
                groupPaymentsActions.groupPaymentsLoadGroupPaymentData({
                  id: action.id
                })
              );
            }
          }
          return EMPTY;
        })
      ),
    { dispatch: false }
  );

  /**
   * Effect to load group payment data.
   */
  groupPaymentsLoad$ = createEffect(() => this.actions$.pipe(
      ofType(groupPaymentsActions.groupPaymentsLoadGroupPaymentData),
      concatMap((action) => this.groupPaymentsService.getGroupPaymentData(action.id).pipe(
          map((res) =>
            groupPaymentsActions.groupPaymentsLoadSuccess({
              groupDetails: res.data
            })
          ),
          catchError((error) =>
            of(groupPaymentsActions.groupPaymentsLoadFailure({ error }))
          )
        ))
    ));

  /**
   * Effect to update the name of a group payment.
   */
  groupPaymentsUpdateName$ = createEffect(
    () => this.actions$.pipe(
        ofType(groupPaymentsActions.groupPaymentsUpdateName),
        concatLatestFrom(() =>
          this.store.select(groupPaymentsFeature.selectGroupPaymentsState)
        ),
        concatMap(([action, groupPaymentsState]) => {
          const sendingData = {
            groupName: action?.groupName,
            groupNameOnly: true
          };
          return this.groupPaymentsService.updatePaymentsGroup(
            sendingData,
            groupPaymentsState.groupDetails.groupId!
          );
        })
      ),
    {
      dispatch: false
    }
  );

  constructor(private actions$: Actions) {}
}

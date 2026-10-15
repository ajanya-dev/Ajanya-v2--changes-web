import { Store } from '@ngrx/store';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { catchError, debounceTime, exhaustMap, map, mergeMap, of } from 'rxjs';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { HttpHeaders } from '@angular/common/http';
import { payeesActions } from './payees.actions';
import { selectPayeesState } from './payees.selectors';
import { Injectable, inject } from '@angular/core';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

/**
 * PayeesEffects is an Angular Injectable service that manages the effects related to payees.
 * It interacts with the Redux store and the PayeeService to load payee data.
 */
@Injectable()
export class PayeesEffects {
  private store = inject(Store);
  private paymentsService = inject(PaymentsService);

  /**
   * An effect to load payees when the 'loadPayees' action is dispatched.
   * It checks if the page is 0 and isLoading is false to trigger the 'loadMorePayees' action.
   */
  loadPayees$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(payeesActions.loadPayees), // Listen for the 'loadPayees' action
      concatLatestFrom(() => this.store.select(selectPayeesState)),
      exhaustMap(([action, payeesState]) => {
        const isFilterOn = !(!action.searchTerm && action.searchTerm == '');
        const page = isFilterOn
          ? payeesState.filteredPageNo
          : payeesState.pageNo;
        if (page === 0 && payeesState.isLoading == false) {
          return of(payeesActions.loadMorePayees({ skipEmpty: true }));
        } else {
          return of();
        }
      })
    );
  });

  /**
   * An effect to load more payees when the 'loadMorePayees' action is dispatched.
   * It dispatches the 'loadingPayees' action, retrieves payee data from the PayeeService,
   * and then dispatches either 'loadPayeesSuccess' or 'loadPayeesFailure' based on the result.
   *
   * `headerOptions` used to hide common loader used in `interceptor service`.
   */
  loadMorePayees$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(payeesActions.loadMorePayees), // Listen for the 'loadPayees' action
      concatLatestFrom(() => this.store.select(selectPayeesState)),
      exhaustMap(([_action, payeesState]) => {
        const searching = !(
          !payeesState.searchTerm && payeesState.searchTerm == ''
        );
        // A list that has already answered with an empty page has nothing left
        // to give. The scroll handler fires again every time the user returns to
        // the bottom, and without this each visit cost another request and
        // another flash of the loading rows.
        const exhausted = searching
          ? payeesState.filteredHasMore === false
          : payeesState.hasMore === false;

        if (payeesState.isLoading == false && !exhausted) {
          this.store.dispatch(payeesActions.loadingPayees());
          const isFilterOn = searching;
          const page =
            (isFilterOn ? payeesState.filteredPageNo : payeesState.pageNo) + 1;

          let headerOptions = new HttpHeaders({
            isHideLoader: 'true'
          });
          
          if (payeesState.disablePermission === true) {
            headerOptions = headerOptions.set('disablePermission', 'true');
          }

          return this.payeeService
            .getPayees(
              page,
              payeesState.searchTerm,
              headerOptions,
              payeesState.skipEmpty
            )
            .pipe(
              map((res) => {
                return payeesActions.loadPayeesSuccess({
                  pageNo: isFilterOn ? undefined : page,
                  payees: isFilterOn ? undefined : res.data,
                  filteredPageNo: isFilterOn ? page : undefined,
                  payeesFiltered: isFilterOn ? res.data : undefined
                });
              }), // Dispatch 'loadPayeesSuccess' action with the fetched payees
              catchError((err) => {
                if (err.status === 403) {
                  this.paymentsService.hasPermission.payee = false;
                }
                return of(payeesActions.loadPayeesFailure());
              }) // Dispatch 'loadPayeesFailure' action on error
            );
        } else {
          return of();
        }
      })
    );
  });
  /**
   * Effect to load payees by their IDs. This effect listens for the 'loadPayeesByIds' action and fetches payees based on the provided IDs.
   */
  loadPayeesByIds$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(payeesActions.loadPayeesByIds), // Listen for the 'loadPayees' action
      concatLatestFrom(() => this.store.select(selectPayeesState)),
      debounceTime(100),
      mergeMap(([_action, payeesState]) => {
        return this.payeeService.getPayeesByIds(payeesState.searchIds).pipe(
          map((res) => {
            return payeesActions.loadPayeesByIdsSuccess({
              payees: res.data
            });
          }), // Dispatch 'loadPayeesSuccess' action with the fetched payees
          catchError((err) => of(payeesActions.loadPayeesByIdsFailure(err))) // Dispatch 'loadPayeesFailure' action on error
        );
      })
    );
  });

  constructor(
    private actions$: Actions,
    private payeeService: PayeeService
  ) {}
}

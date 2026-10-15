import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Store } from '@ngrx/store';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { catchError, debounceTime, exhaustMap, map, mergeMap, of,switchMap,filter } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { HttpHeaders } from '@angular/common/http';
import { bankAccountsActions } from './bank-accounts.actions';
import { selectBankAccountsState } from './bank-accounts.selectors';

@Injectable()
export class BankAccountsEffects {
  private store = inject(Store);
  private paymentsService = inject(PaymentsService);

  /**
   * An effect to load bankAccounts when the 'loadBankAccounts' action is dispatched.
   * It checks if the page is 0 and isLoading is false to trigger the 'loadMorebankAccounts' action.
   */
  
  loadBankAccounts$ = createEffect(() => this.actions$.pipe(
      ofType(bankAccountsActions.loadBankAccounts), // Listen for the 'loadBankAccounts' action
      concatLatestFrom(() => this.store.select(selectBankAccountsState)),
      exhaustMap(([_action, bankAccountsState]) => {
        const isFilterOn =
          !(!bankAccountsState.searchTerm || bankAccountsState.searchTerm === '');
        const page = isFilterOn
          ? bankAccountsState.filteredPageNo
          : bankAccountsState.pageNo;
        if (page === 0 && bankAccountsState.isLoading === false) {
          return of(bankAccountsActions.loadMoreBankAccounts());
        }
        return of();
      })
    ));

  /**
   * An effect to load more bankAccounts when the 'loadMorebankAccounts' action is dispatched.
   * It dispatches the 'loadingbankAccounts' action, retrieves payee data from the bankAccountsService,
   * and then dispatches either 'loadBankAccountsSuccess' or 'loadBankAccountsFailure' based on the result.
   *
   * `headerOptions` used to hide common loader used in `interceptor service`.
   */
  loadMorebankAccounts$ = createEffect(() => {
    const headerOptions = new HttpHeaders({
      isHideLoader: 'true'
    });
    return this.actions$.pipe(
      ofType(bankAccountsActions.loadMoreBankAccounts), // Listen for the 'loadBankAccounts' action
      concatLatestFrom(() => this.store.select(selectBankAccountsState)),
      // Guarding here (instead of returning an empty observable from the
      // projection) matters: `switchMap` would treat that empty observable as a
      // new inner and cancel the request that is already running.
      filter(([_action, bankAccountsState]) => {
        if (bankAccountsState.isLoading) {
          return false;
        }
        const isFilterOn = !!bankAccountsState.searchTerm;
        const loadedCount = isFilterOn
          ? bankAccountsState.bankAccountsFiltered.length
          : bankAccountsState.bankAccounts.length;
        // Compare against the total of the mode being loaded — using the
        // filtered total for an unfiltered load (or vice versa) skipped the
        // API call and left the previous results on screen.
        const totalCount = isFilterOn
          ? bankAccountsState.filteredTotalCount
          : bankAccountsState.totalCount;
        return totalCount === undefined || loadedCount < totalCount;
      }),
      // `switchMap` so a new search/clear cancels the request of the term the
      // user already moved away from; concurrent duplicates are still blocked
      // by the `isLoading` guard above, so pagination is unaffected.
      switchMap(([_action, bankAccountsState]) => {
        const isFilterOn = !!bankAccountsState.searchTerm;
        this.store.dispatch(bankAccountsActions.loadingBankAccounts());
        const page =
          (isFilterOn
            ? bankAccountsState.filteredPageNo
            : bankAccountsState.pageNo) + 1;
        return this.bankAccountsService
          .getBankAccounts(
            page,
            bankAccountsState.searchTerm,
            undefined,
            undefined,
            undefined,
            headerOptions,
            undefined,
            bankAccountsState.context
          )
          .pipe(
            map((res) => {
              this.paymentsService.hasPermission.bank = true;
              return bankAccountsActions.loadBankAccountsSuccess({
                pageNo: isFilterOn ? bankAccountsState.pageNo : page,
                // Leave the untouched list alone instead of echoing it back —
                // sending it as `bankAccounts` made the reducer append the
                // whole list to itself on every search.
                bankAccounts: isFilterOn ? undefined : res.data,
                filteredPageNo: isFilterOn
                  ? page
                  : bankAccountsState.filteredPageNo,
                bankAccountsFiltered: isFilterOn ? res.data : undefined,
                totalCount: res.totalCount,
                isFilterOn
              });
            }), // Dispatch 'loadBankAccountsSuccess' action with the fetched bankAccounts
            catchError((err) => {
              if (err.status === 403) {
                this.paymentsService.hasPermission.bank = false;
              }
              return of(bankAccountsActions.loadBankAccountsFailure());
            }) // Dispatch 'loadBankAccountsFailure' action on error
          );
      })
    );
  });

  /**
   * Effect to load bank accounts by their IDs.
   */
  loadBankAccountsByIds$ = createEffect(() => 
    this.actions$.pipe(
      ofType(bankAccountsActions.loadBankAccountsByIds), // Listen for the 'loadBankAccounts' action
      concatLatestFrom(() => this.store.select(selectBankAccountsState)),
      debounceTime(100),
      mergeMap(([action, bankAccountsState]) => 
        this.bankAccountsService
          .getBankAccountByIds(bankAccountsState.searchIds, action.context)
          .pipe(
            map((res) => bankAccountsActions.loadBankAccountsByIdsSuccess({
              bankAccounts: res.data
            })), // Dispatch 'loadBankAccountsSuccess' action with the fetched bankAccounts
            catchError((err) =>
              of(bankAccountsActions.loadBankAccountsByIdsFailure(err))
            ) // Dispatch 'loadBankAccountsFailure' action on error
          )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private bankAccountsService: BankAccountsService
  ) {}
}

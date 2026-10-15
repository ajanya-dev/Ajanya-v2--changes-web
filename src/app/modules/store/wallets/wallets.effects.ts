import { Store } from '@ngrx/store';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { catchError, debounceTime, exhaustMap, map, mergeMap, of } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WalletsActions } from './wallets.actions';
import { selectWalletsStates } from './wallets.selectors';

@Injectable()
export class WalletsEffects {
  private store = inject(Store);
  private paymentsService = inject(PaymentsService);
  private walletsService = inject(WalletService);
  /**
   * An effect to load wallets when the 'loadWallets' action is dispatched.
   * It checks if the page is 0 and isLoading is false to trigger the 'loadMorewallets' action.
   */
  loadWallets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WalletsActions.loadWallets), // Listen for the 'loadWallets' action
      concatLatestFrom(() => this.store.select(selectWalletsStates)),
      exhaustMap(([action, walletsState]) => {
        const isFilterOn = !(!action.searchTerm && action.searchTerm === '');
        const page = isFilterOn
          ? walletsState.filteredPageNo
          : walletsState.pageNo;
        if (page === 0 && walletsState.isLoading === false) {
          return of(WalletsActions.loadMoreWallets());
        }
        return of();
      })
    )
  );

  /**
   * An effect to load more wallets when the 'loadMorewallets' action is dispatched.
   * It dispatches the 'loadingwallets' action, retrieves payee data from the walletsService,
   * and then dispatches either 'loadWalletsSuccess' or 'loadWalletsFailure' based on the result.
   *
   * `headerOptions` used to hide common loader used in `interceptor service`.
   */
  loadMorewallets$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WalletsActions.loadMoreWallets), // Listen for the 'loadWallets' action
      concatLatestFrom(() => this.store.select(selectWalletsStates)),
      exhaustMap(([_action, walletsState]) => {
        const isFilterOn = !(!walletsState.searchTerm && walletsState.searchTerm === '');

        // The last page came back short or empty, so the server has nothing
        // left to page to. Scrolling the list to its end again must not ask.
        if (isFilterOn ? !walletsState.filteredHasMore : !walletsState.hasMore) {
          return of();
        }

        if (walletsState.isLoading === false) {
          this.store.dispatch(WalletsActions.loadingWallets());
          const page =
            (isFilterOn ? walletsState.filteredPageNo : walletsState.pageNo) +
            1;

          let headerOptions = new HttpHeaders({
            isHideLoader: 'true'
          });

          if (walletsState.disablePermission === true) {
            headerOptions = headerOptions.set('disablePermission', 'true');
          }

          return this.walletsService
            .getWalletInformation(
              page,
              walletsState.searchTerm,
              headerOptions,
              undefined,
              undefined,
              walletsState.context?.internationalPaymentWallets === true
            )
            .pipe(
              map((res) => {
                // Restore the flag on success — without this a single 403
                // latches "Permission Denied" on for the rest of the session,
                // even after the user is granted access.
                this.paymentsService.hasPermission.wallet = true;
                return WalletsActions.loadWalletsSuccess({
                  pageNo: isFilterOn ? undefined : page,
                  wallets: isFilterOn ? undefined : res.data,
                  filteredPageNo: isFilterOn ? page : undefined,
                  walletsFiltered: isFilterOn ? res.data : undefined,
                  walletUploadPrompt: res.walletUploadPrompt,
                  totalCount: res.totalCount
                });
              }), // Dispatch 'loadWalletsSuccess' action with the fetched wallets
              catchError((err) => {
                const isPermissionDenied = err.status === 403;
                if (isPermissionDenied) {
                  this.paymentsService.hasPermission.wallet = false;
                }
                return of(
                  WalletsActions.loadWalletsFailure({
                    error: err,
                    isPermissionDenied
                  })
                );
              })
            ); // Dispatch 'loadWalletsFailure' action on error
        }
        return of();
      })
    );
  });

  /**
   * Effect to load wallets by their IDs.
   * This effect listens for the 'loadWalletsByIds' action, fetches wallet data by their IDs,
   * and dispatches either 'loadWalletsByIdsSuccess' or 'loadWalletsByIdsFailure' based on the API response.
   * @returns An observable of wallet data or an error action.
   */
  loadWalletsByIds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WalletsActions.loadWalletsByIds), // Listen for the 'loadWallets' action
      concatLatestFrom(() => this.store.select(selectWalletsStates)),
      debounceTime(100),
      mergeMap(([_action, walletsState]) => {
        let headerOptions = new HttpHeaders({
          isHideLoader: 'true'
        });

        if (walletsState.disablePermission === true) {
          headerOptions = headerOptions.set('disablePermission', 'true');
        }
        return this.walletsService
          .getWalletInformationByIds(walletsState.searchIds,undefined,headerOptions)
          .pipe(
            map((res) => {
              this.paymentsService.hasPermission.wallet = true;
              return WalletsActions.loadWalletsByIdsSuccess({
                wallets: res.data
              });
            }), // Dispatch 'loadWalletsSuccess' action with the fetched wallets
            // A pre-selected wallet id resolves through this call, so it is the
            // request that 403s first on a page that opens with a wallet
            // already chosen — it has to report the denial too.
            catchError((err) => {
              const isPermissionDenied = err.status === 403;
              if (isPermissionDenied) {
                this.paymentsService.hasPermission.wallet = false;
              }
              return of(
                WalletsActions.loadWalletsByIdsFailure({
                  error: err,
                  isPermissionDenied
                })
              );
            }) // Dispatch 'loadWalletsFailure' action on error
          );
      })
    )
  );

  constructor(private actions$: Actions) {}
}

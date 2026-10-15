import { Injectable, inject } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { CloudBankAccountsActions } from './cloud-bank.actions';
import { Store } from '@ngrx/store';
import { selectCLoudBanksStates } from './cloud-bank.selectors';
import { EMPTY, catchError, exhaustMap, map, of } from 'rxjs';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';

@Injectable()
export class CloudBankEffects {
  private store = inject(Store);
  private cloudBankService = inject(CloudBankService);

  /**
   * @description Ngrx effect to load Airwalles bank accounts.
   */
  loadCloudBanksAirwallex$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CloudBankAccountsActions.loadCloudBankAccountsAirwallex), // Listen for the 'loadBankAccountsAirwallex' action
      concatLatestFrom(() => this.store.select(selectCLoudBanksStates)),
      exhaustMap(([_action, cloudBankStates]) => {
        if (
          cloudBankStates.bankAccountsAirwallex.length === 0 &&
          cloudBankStates.isLoading === false
        ) {
          this.store.dispatch(
            CloudBankAccountsActions.loadingCloudBankAccounts()
          );
          return this.cloudBankService.getAccountsAirwallex().pipe(
            map((res) => {
              const accDetails = res?.data;
              return CloudBankAccountsActions.loadCloudBankAccountsAirwallexSuccess(
                {
                  bankAccountsAirwalex: accDetails,
                  isLoading: false
                }
              );
            }),
            catchError((error) =>
              of(
                CloudBankAccountsActions.loadCloudBankAccountsAirwallexFailure(
                  error
                )
              )
            )
          );
        }
        return EMPTY;
      })
    )
  );

  constructor(private actions$: Actions) {}
}

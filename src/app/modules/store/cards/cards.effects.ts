import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, withLatestFrom } from 'rxjs';
import { ISendReceiveVirtualCard } from 'src/app/data/data/virtual-card';
import { VirtualCardService } from 'src/app/shared/service/virtual-card/virtual-card.service';
import { CardsActions } from './cards.actions';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import * as CardsSelectors from './cards.selectors';
import { select, Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/app-state.model';
import { IApiResWithMsg } from 'src/app/models/api';
import { IExistingCreditCards } from '../../../models/payment-switch-board';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Injectable()
export class CardsEffects {
  private virtualCardService = inject(VirtualCardService);
  private cyberSourceService = inject(CybersourceService);
  private store = inject(Store<IAppState>);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private paymentsService = inject(PaymentsService);

  /**
   * Effect responsible for loading credit card data.
   */
  getCreditCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      withLatestFrom(
        this.store.pipe(select(CardsSelectors.selectIsCardsLoading))
      ),
      mergeMap(([action]) => {
        this.store.dispatch(CardsActions.loadingCards());
        return this.cyberSourceService.getExistingCards(action.showAllCards, action.isPayroll).pipe(
          map((res: IApiResWithMsg<IExistingCreditCards[]>) => {
            if (res?.success) {
              const updatedData = res.data.map((c) => {
                let bgColor = 'green';
                if (c.bgColor === '#E5F8F2') {
                  bgColor = 'green';
                } else if (c.bgColor === '#EDEBFF') {
                  bgColor = 'violet';
                } else if (c.bgColor === '#E9F3FF') {
                  bgColor = 'blue';
                } else if (c.bgColor === '#FAEFF5') {
                  bgColor = 'red';
                }

                const colorClasses = {
                  bg: `common-secondary-${bgColor}-color`,
                  text: `common-${bgColor}-color`
                };
                const last4 = c.card.slice(c.card.length - 4);
                return {
                  ...c,
                  bgColor,
                  last4,
                  cardMasked: `*******${last4}`,
                  colorClasses
                };
              });
              return CardsActions.loadCardsSuccess({
                isFilterOn: false,
                cards: updatedData,
                cardsFiltered: updatedData
              });
            }
            return CardsActions.loadCardsFailure({
              error: res.message ?? 'Something went wrong!'
            });
          }),
          catchError((err) => {
            if (err.status === 403) {
              this.paymentsService.hasPermission.card = false;
            }
            this.v3PaymentsTableService.cardsDataDispatched = false;
            return of(
              CardsActions.loadCardsFailure({ error: 'Something went wrong!' })
            );
          })
        );
      })
    )
  );

  getReceivedCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.getReceivedCards),
      mergeMap((action) =>
        this.virtualCardService.getRecievedCards(action.searchKey).pipe(
          map(
            (res: {
              success: boolean;
              total: number;
              data: ISendReceiveVirtualCard[];
              message?: string;
            }) => {
              if (res?.success) {
                return CardsActions.getReceivedCardsSuccess({
                  cards: res.data
                });
              }
              return CardsActions.loadCardsFailure({
                error: res.message ?? 'Something went wrong!'
              });
            }
          ),
          catchError((err) => {
            if (err.status === 403) {
              this.paymentsService.hasPermission.card = false;
            }
            return of(
              CardsActions.loadCardsFailure({ error: 'Something went wrong!' })
            );
          })
        )
      )
    )
  );

  getSentCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.getSentCards),
      mergeMap(() =>
        this.virtualCardService.sendCards().pipe(
          map(
            (res: {
              success: boolean;
              total: number;
              data: ISendReceiveVirtualCard[];
              message?: string;
            }) => {
              if (res?.success) {
                return CardsActions.getSentCardsSuccess({ cards: res.data });
              }
              return CardsActions.loadCardsFailure({
                error: res.message ?? 'Something went wrong!'
              });
            }
          ),
          catchError((err) => {
            if (err.status === 403) {
              this.paymentsService.hasPermission.card = false;
            }
            return of(
              CardsActions.loadCardsFailure({ error: 'Something went wrong!' })
            );
          })
        )
      )
    )
  );

  constructor(private actions$: Actions) {}
}

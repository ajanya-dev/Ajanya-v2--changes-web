import { Injectable, inject, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EMPTY, Observable, catchError, finalize, map, of, switchMap } from 'rxjs';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IAddCardResponse, IExistingCardDetails } from '../../modal/add-credit-card/add-credit-card.model';
import { V4ChooseCardProviderModalComponent } from '../../modal/choose-card-provider-modal/v4/v4-choose-card-provider-modal.component';
import { AddCreditCardService } from '../../modal/add-credit-card/add-credit-card.service';
import { V4AddCreditCardComponent } from '../../modal/add-credit-card/v4/v4-add-credit-card.component';
import { V4AddCardSpinnerDialogComponent } from '../../modal/add-credit-card/v4/v4-add-card-spinner-dialog.component';
import { PaymentsService } from '../payments/payments.service';
import { V4AlertService } from '../alert/v4-alert.service';

export interface ICardTransLimitDropdown {
  populateDuplicateCard(card: IExistingCreditCards): void;
  clearSelection(): void;
  addCardWithPrefill(card: IExistingCreditCards, gatewayType: number): void;
  addNewCard(gatewayType?: number, fromTransLimitApi?: boolean): void;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAddCardV4Service {
  private dialog = inject(MatDialog);
  private addCreditCardService = inject(AddCreditCardService);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(V4AlertService);

  isLoading = signal(false);

  checkTransLimitForCard(params: {
    amount: number;
    card: IExistingCreditCards | null | undefined;
    dropdown: ICardTransLimitDropdown | undefined;
  }): void {
    const { amount, card, dropdown } = params;
    if (!amount || !card?.gatewayType) return;
    if (this.paymentsService.isGatewaySkip(card.cardId)) return;
    this.paymentsService
      .decideGatewayByTransLimit(amount, Number(card.gatewayType), card.cardId)
      .subscribe({
        next: () => {},
        error: (err) => {
          if (err.error.errorMsg.errorCode === 824) {
            const duplicateCard: IExistingCreditCards | undefined =
              err.error.errorMsg.duplicate_card;
            if (duplicateCard?.cardId) {
              dropdown?.populateDuplicateCard(duplicateCard);
            } else {
              dropdown?.clearSelection();
              const failGatewayType = err.error.errorMsg.gateway_type;
              const failMessage = err.error.errorMsg.errorMsg;
              this.alertService
                .warningAlert({
                  title: 'Card Verification Required',
                  content: failMessage,
                  doneMsg: 'Verify Now',
                  cancelMsg: 'Cancel',
                  isCancel: true
                })
                .afterClosed()
                .subscribe((confirmed) => {
                  if (!confirmed) return;
                  if (card?.cardId) {
                    dropdown?.addCardWithPrefill(card, failGatewayType);
                  } else {
                    dropdown?.addNewCard(failGatewayType, true);
                  }
                });
            }
          }
        }
      });
  }

  openAddCard(gatewayType?: number) {
    this.isLoading.set(true);
    return this.addCreditCardService.getToken(gatewayType).pipe(
      finalize(() => {
        this.isLoading.set(false);
      }),
      map((res) => (res?.success ? this.openAddCardModal(res) : null))
    );
  }

  openAddCardModal(data: {
    success: boolean;
    token: string;
    amex_allowed: 0 | 1;
    amex_divert_to_cybersource: 0 | 1;
    user_application_iv: string;
    user_application_id: string;
  }) {
    return this.dialog.open<
      V4ChooseCardProviderModalComponent,
      {
        success: boolean;
        token: string;
        amex_allowed: 0 | 1;
        amex_divert_to_cybersource: 0 | 1;
        tabapay_allowed: 0 | 1;
        user_application_iv: string;
        user_application_id: string;
      },
      {
        success: boolean;
        data: IAddCardResponse;
        type: 'nmi' | 'cybs' | 'tabapay';
        /**
         * `true` when the user cancelled the "Confirm Card" step after the
         * first gateway already stored the card — lists should refresh.
         */
        cardCreated?: boolean;
      }
    >(V4ChooseCardProviderModalComponent, {
      width: '429px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: { ...data, tabapay_allowed: 1 }
    });
  }

  openAddCardWithPrefill(
    cardId: string,
    gatewayType: number | undefined,
    nickName: string,
    bgColor: string,
    allowSkipGatewayAddition?: boolean
  ): Observable<MatDialogRef<V4AddCreditCardComponent, { success?: boolean; data?: IAddCardResponse; errorCode?: number; skipGatewayAddition?: boolean; cardCreated?: boolean }> | null> {
    const canSkipGatewayAddition = !!allowSkipGatewayAddition;
    this.isLoading.set(true);
    const spinnerRef = this.dialog.open(V4AddCardSpinnerDialogComponent, {
      width: '320px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
    const finishSpinner = () => {
      spinnerRef.close();
      this.isLoading.set(false);
    };
    return this.addCreditCardService.getExistingCardDetails(cardId).pipe(
      catchError(() => of(null)),
      switchMap((detailsRes) => {
        const cardDetails = detailsRes?.data?.card_details;
        // No saved details to prefill from: emit null so the caller can fall
        // back to the plain add-card flow.
        if (!detailsRes?.success || !cardDetails) {
          finishSpinner();
          return of(null);
        }
        return this.addCreditCardService.getToken(gatewayType, 'from=card_verification').pipe(
          catchError(() => of(undefined)),
          switchMap((tokenRes) => {
            finishSpinner();
            // A failed token fetch is already reported by the error interceptor.
            // Emitting null here would send the caller into `addNewCard`, which
            // requests the same token again and raises the same error twice.
            if (!tokenRes?.success) {
              return EMPTY;
            }
            return of(
              this.openAddCardModalDirect(tokenRes, cardDetails, nickName, bgColor, gatewayType, canSkipGatewayAddition)
            );
          })
        );
      })
    );
  }

  private openAddCardModalDirect(
    tokenRes: {
      success: boolean;
      token: string;
      amex_allowed: 0 | 1;
      amex_divert_to_cybersource: 0 | 1;
      user_application_iv: string;
      user_application_id: string;
      amex_token?: string;
    },
    cardDetails: IExistingCardDetails,
    nickName: string,
    bgColor: string,
    gatewayType: number | undefined,
    allowSkipGatewayAddition?: boolean
  ) {
    const tokenWithGateway = tokenRes as typeof tokenRes & {
      gateway_type?: 2 | 4 | 5;
      gateway_url?: string;
    };
    return this.dialog.open<
      V4AddCreditCardComponent,
      {
        nickName: string;
        color: string;
        data: {
          success: boolean;
          token: string;
          amex_allowed: 0 | 1;
          gateway_type: 2 | 4 | 5;
          gateway_url: string;
          user_application_id: string;
          user_application_iv: string;
          selectedProvider: string;
          amex_token: string;
        };
        prefillData: IExistingCardDetails;
        allowSkipGatewayAddition?: boolean;
      },
      { success?: boolean; data?: IAddCardResponse; errorCode?: number; skipGatewayAddition?: boolean; cardCreated?: boolean }
    >(V4AddCreditCardComponent, {
      width: '547px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        nickName,
        color: bgColor,
        data: {
          success: tokenRes.success,
          token: tokenRes.token,
          amex_allowed: tokenRes.amex_allowed,
          gateway_type: tokenWithGateway.gateway_type ?? (gatewayType as 2 | 4 | 5),
          gateway_url: tokenWithGateway.gateway_url ?? '',
          user_application_id: tokenRes.user_application_id,
          user_application_iv: tokenRes.user_application_iv,
          amex_token: tokenRes.amex_token ?? '',
          selectedProvider: ''
        },
        prefillData: cardDetails,
        allowSkipGatewayAddition
      }
    });
  }
}

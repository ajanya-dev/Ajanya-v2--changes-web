import { Injectable, inject, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, catchError, finalize, map, of, switchMap } from 'rxjs';
import {
  IAddCardResponse,
  IExistingCardDetails
} from '../../modal/add-credit-card/add-credit-card.model';
import { ChooseCardProviderModalComponent } from '../../modal/choose-card-provider-modal/choose-card-provider-modal.component';
import { AddCreditCardService } from '../../modal/add-credit-card/add-credit-card.service';
import { AddCreditCardComponent } from '../../modal/add-credit-card/add-credit-card.component';
import { AddCardSpinnerDialogComponent } from '../../modal/add-credit-card/add-card-spinner-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class OpenAddCardService {
  private dialog = inject(MatDialog);
  private addCreditCardService = inject(AddCreditCardService);

  isLoading = signal(false);

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
    amex_token:string;
  }) {
    return this.dialog.open<
      ChooseCardProviderModalComponent,
      {
        success: boolean;
        token: string;
        amex_allowed: 0 | 1;
        amex_divert_to_cybersource: 0 | 1;
        tabapay_allowed: 0 | 1;
        user_application_iv: string;
        user_application_id: string;
        amex_token:string;
      },
      {
        success: boolean;
        /**
         * if `type` is `nmi` this is available.
         */
        data: IAddCardResponse;
        type: 'nmi' | 'cybs'|'tabapay';
        /**
         * `true` when the user cancelled the "Confirm Card" step after the
         * first gateway already stored the card — lists should refresh.
         */
        cardCreated?: boolean;
      }
    >(ChooseCardProviderModalComponent, {
      width: '429px',
      disableClose: true,
      autoFocus: false,
      data: {...data, tabapay_allowed: 1}
    });
  }

  /**
   * @description Fetches an existing card's saved details and, on success,
   * fetches a fresh form token and opens AddCreditCardComponent directly,
   * bypassing the nickname/color/provider chooser. Used by the trans-limit
   * 824 fail flow to let the user re-tokenise an existing card on a new
   * gateway without re-entering billing/address info.
   * Emits null when get-card-details or get-form-token does not succeed,
   * so callers can fall back to the standard `openAddCard` flow.
   */
  openAddCardWithPrefill(
    cardId: string,
    gatewayType: number | undefined,
    nickName: string,
    bgColor: string,
    allowSkipGatewayAddition?: boolean
  ): Observable<MatDialogRef<AddCreditCardComponent, { success?: boolean; data?: IAddCardResponse; errorCode?: number; skipGatewayAddition?: boolean; cardCreated?: boolean }> | null> {
    this.isLoading.set(true);
    const spinnerRef = this.dialog.open(AddCardSpinnerDialogComponent, {
      panelClass: 'add-card-spinner-panel',
      backdropClass: 'cdk-overlay-dark-backdrop',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
    const finishSpinner = () => {
      spinnerRef.close();
      this.isLoading.set(false);
    };
    return this.addCreditCardService.getExistingCardDetails(cardId).pipe(
      switchMap((detailsRes) => {
        const cardDetails = detailsRes?.data?.card_details;
        if (!detailsRes?.success || !cardDetails) {
          finishSpinner();
          return of(null);
        }
        return this.addCreditCardService.getToken(gatewayType,'from=card_verification').pipe(
          map((tokenRes) => {
            finishSpinner();
            return tokenRes?.success
              ? this.openAddCardModalDirect(tokenRes, cardDetails, nickName, bgColor, gatewayType, allowSkipGatewayAddition)
              : null;
          })
        );
      }),
      catchError(() => {
        finishSpinner();
        return of(null);
      })
    );
  }

  /**
   * @description Opens AddCreditCardComponent without going through the
   * provider chooser. nickName/color come from the existing card record;
   * billing fields are prefilled from the get-card-details response.
   */
  private openAddCardModalDirect(
    tokenRes: {
      success: boolean;
      token: string;
      amex_allowed: 0 | 1;
      amex_divert_to_cybersource: 0 | 1;
      user_application_iv: string;
      user_application_id: string;
      amex_token: string;
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
      AddCreditCardComponent,
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
    >(AddCreditCardComponent, {
      width: '547px',
      disableClose: true,
      data: {
        nickName,
        color: bgColor,
        data: {
          success: tokenRes.success,
          token: tokenRes.token,
          amex_allowed: tokenRes.amex_allowed,
          gateway_type: (tokenWithGateway.gateway_type ?? (gatewayType as 2 | 4 | 5)),
          gateway_url: tokenWithGateway.gateway_url ?? '',
          user_application_id: tokenRes.user_application_id,
          user_application_iv: tokenRes.user_application_iv,
          amex_token: tokenRes.amex_token,
          selectedProvider: ''
        },
        prefillData: cardDetails,
        allowSkipGatewayAddition
      }
    });
  }
}

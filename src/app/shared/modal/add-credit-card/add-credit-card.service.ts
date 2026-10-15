import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  IAddCardPayload,
  IAddCardResponse,
  IExistingCardDetailsResponse
} from './add-credit-card.model';
import { ThreeDSPayload } from 'src/app/modules/payments/model/payments';

@Injectable({
  providedIn: 'root'
})
export class AddCreditCardService {
  private http = inject(HttpClient);

  ROOT_URL = environment.rootUrl;

  getToken(gatewayType?: number, extraQuery?: string) {
    const queryParts = [
      gatewayType !== undefined ? `gateway_type=${gatewayType}` : '',
      extraQuery ?? ''
    ].filter(Boolean);
    const query = queryParts.length ? `?${queryParts.join('&')}` : '';
    const url = `${this.ROOT_URL}/payment-methods/card/get-form-token${query}`;
    return this.http.post<{
      success: boolean;
      token: string;
      amex_allowed: 0 | 1;
      amex_divert_to_cybersource: 0 | 1;
      user_application_id: string;
      user_application_iv: string;
      amex_token:string;
    }>(url, {});
  }

  getExistingCardDetails(cardId: string) {
    const params = new HttpParams().set('card_id', cardId);
    return this.http.get<IExistingCardDetailsResponse>(
      `${this.ROOT_URL}/payment-methods/card/get-card-details`,
      { params }
    );
  }

  addCard(
    payload: IAddCardPayload & Partial<ThreeDSPayload>,
    isTabaPayActive: boolean,
    headerOption?: HttpHeaders,
  ) {
    if(isTabaPayActive){
      return this.http.post<IAddCardResponse>(
        `${this.ROOT_URL}/payment-methods/card/tabapay-add-card`,
        payload,
        { headers: headerOption }
      );
    }
    
    return this.http.post<IAddCardResponse>(
        `${this.ROOT_URL}/payment-methods/card/add-card`,
        payload,
        { headers: headerOption }
      );
    
    }


}

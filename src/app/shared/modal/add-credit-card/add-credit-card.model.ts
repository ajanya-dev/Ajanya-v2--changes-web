import { HttpErrorResponse } from '@angular/common/http';

export interface ICollectJSResponse {
  tokenType: string;
  token: string;
  card: ICollectJSResponseCard;
}

export interface ICollectJSResponseCard {
  number: string;
  bin: string;
  exp: string;
  type: string;
  category?: string;
  hash: string;
}

export interface IAddCardPayload {
  nickName: string;
  bgColor: string;
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  payment_token: string;
  card?: ICollectJSResponseCard;
  is_card_verification?: 1;
  existing_card_id?: string;
}

export interface IAddCardResponse {
  success: boolean;
  message: string;
  metaData: {
    cardId: string;
    card: string;
    nickName: string;
    bgColor: string;
    cardType?: string;
  };
  errorCode?:number;
}

export type IAddCardHttpError = Omit<HttpErrorResponse, 'error'> & {
  error: IAddCardErrorResponse;
};

export interface ISecondGatewayDetails {
  success: boolean;
  token: string;
  amex_token: string;
  checkout: string;
  amex_allowed: 0 | 1;
  amex_divert_to_cybersource: 0 | 1;
  gateway_type: 2 | 4 | 5;
  gateway_url: string;
  user_application_id: string;
  user_application_iv: string;
}

export interface IAddCardErrorResponse {
  success: boolean;
  errorMsg: string;
  errorCode: number;
  errors: Record<string, string[]>;
  metaData?: {
    secondGatewayDetails?: ISecondGatewayDetails;
  };
}

export interface IExistingCardDetails {
  id: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  card_type: string;
  card_exp_month: string;
  card_exp_year: string;
  card_last_digits: string;
}

export interface IExistingCardDetailsResponse {
  success: boolean;
  data?: { card_details: IExistingCardDetails };
  errorMsg?: string;
}

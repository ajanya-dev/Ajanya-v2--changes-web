import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MoEngageService } from 'src/app/core/services/moengage.service';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';

export interface ILinkToken {
  token: string,
  key: string
}

export interface ICallBackPayload {
  public_token: string,
  key: string,
  institutionName: string | null,
  institutionId: string | null,
  metadata: any
}

export interface IPlaidCallBackRes {
  accounts: IPlaidCallBackResAccount[]
}

export interface IPlaidCallBackResAccount {
  routing_number: string
  account_number: string
  full_account_number: string
  bank_name: string
  bank_account_account_name: string
  account_nick_name: string
  account_id: number
  plaid_account_id: string
  institution_id: string
  account_type: string
  account_sub_type: string
  account_city: string
  account_state: string
  account_country: string
  account_zip: string
  account_address: string
  bank_account_phone: string
  bank_account_email: string
  Identity_status: boolean
}


@Injectable({
  providedIn: 'root'
})
export class PlaidService {


  ROOT_URL = environment.rootUrl;
  OUTSIDE_ROOT_URL = environment.rootUrl.split('/api/v4')[0];


  private http = inject(HttpClient);
  private moEngageService = inject(MoEngageService);
  
  getLinkToken(payload?:{updateMode?:boolean,bankId?:string,sourceType?:number}): Observable<IApiRes<ILinkToken>>{
    return this.http.post<IApiRes<ILinkToken>>(`${this.ROOT_URL}/bank-account-verify/plaid/get-link-token`,  payload || {});
  }

  callBack(payload: ICallBackPayload): Observable<IApiRes<IPlaidCallBackRes>>{
    return this.http.post<IApiRes<IPlaidCallBackRes>>(`${this.ROOT_URL}/bank-account-verify/plaid/callback`, payload);
  }

  outsideCallBack(payload: ICallBackPayload): Observable<IApiRes<IPlaidCallBackRes>>{
    // return this.http.post<IApiRes<IPlaidCallBackRes>>(`https://OCW-16276-DANISH.api.ocw.sebipay.com/outside/widget/plaid-callback`, payload);
    return this.http.post<IApiRes<IPlaidCallBackRes>>(`${this.OUTSIDE_ROOT_URL}/outside/widget/plaid-callback`, payload);
  }

  createBankAccounts(payLoad: {accounts: IPlaidCallBackRes['accounts']}): Observable<any>{
    const initialtionTime = this.moEngageService.bankInitiatedTime();
    let headers = new HttpHeaders();
    if(initialtionTime){
      headers=headers.set(
        'setup-started-at', initialtionTime
      );
    }
    return this.http.post<{accounts: IPlaidCallBackRes['accounts']}>(`${this.ROOT_URL}/bank-account-verify/plaid/add-bank-account`, payLoad, { headers });
  }

  verifyBankAccount(payLoad: {accounts: IPlaidCallBackRes['accounts'],selectedBankId:string}): Observable<any>{
    return this.http.post<{accounts: IPlaidCallBackRes['accounts']}>(`${this.ROOT_URL}/bank-account-verify/plaid`, payLoad);
  }

}

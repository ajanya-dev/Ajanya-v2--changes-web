import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import {
  IBankDropdown,
  IBankQrCode,
  ICheckSerialNo
} from 'src/app/models/bank';
import { INewReceivePayment } from 'src/app/modules/receive-payments/model/ReceivePayment';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  getBankAccountList(page: number, term = ''): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/bank-accounts?page=${page}&&term=${term}`
    );
  }

  qetQrCode(id: string,headers?: HttpHeaders): Observable<IApiRes<IBankQrCode[]>> {
    return this.http.get<IApiRes<IBankQrCode[]>>(
      `${this.ROOT_URL}/bank-accounts/${id}/payment-links`,
      { headers }
    );
  }

  requestPayment(data: INewReceivePayment): Observable<any> {
    return this.http.post<unknown>(`${this.ROOT_URL}/request-payments/`, data);
  }

  requestPaymentPreview(data: INewReceivePayment) {
    return this.http.post<IApiRes<unknown>>(
      `${this.ROOT_URL}/request-payments/preview/`,
      data
    );
  }

  getBankAccounts() {
    return this.http.get<IApiRes<IBankDropdown[]>>(
      `${this.ROOT_URL}/bank-accounts`
    );
  }

  getCheckSerialNo(
    id: string,
    headers?: HttpHeaders
  ): Observable<IApiRes<ICheckSerialNo[]>> {
    return this.http.get<IApiRes<ICheckSerialNo[]>>(
      `${this.ROOT_URL}/bank-accounts/${id}/serial-number`,
      { headers: headers }
    );
  }

  bankToBankTransfer(formData: {
    fromAccount: string;
    toAccount: string;
    amount: string;
    comment: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/wallets/bank-transfer`,
      formData
    );
  }
}

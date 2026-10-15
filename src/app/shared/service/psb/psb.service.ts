import { IApiRes } from 'src/app/models/api';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IPaidStatement,
  IPsbtransactionFee
} from 'src/app/models/payment-switch-board';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PsbService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  shippingCostCalculation(body: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/svb-rail-check-mailing/shipping-cost-calculation`,
      body
    );
  }

  completeTransaction(body: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/payment-methods/complete-transaction`,
      body
    );
  }

  getPaidStatements(uuid: string): Observable<IApiRes<IPaidStatement[]>> {
    return this.http.get<IApiRes<IPaidStatement[]>>(
      `${this.ROOT_URL}/zil-payments/${uuid}/statements`
    );
  }

  /**
   * @description getting transaction fee based on the feature code
   * @param body feature code and transaction amount
   * @returns
   * @deprecated New API is available for card payment fee calculation
   */
  getTransactionFee(
    body: IPsbtransactionFee
  ): Observable<
    IApiRes<string> & { samedayFee?: string; smsFee?: number | string }
  > {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/subscription/transaction-fee`,
      body
    );
  }

  /**
   * @description getting transaction fee based transaction type
   * @param transaction type
   * @returns
   */
  getCloudBankTransactionFee(
    shipping_type?: string
  ): Observable<IApiRes<{ fees: string }>> {
    return this.http.get<IApiRes<{ fees: string }>>(
      `${this.ROOT_URL}/banking-as-service/payment-fees?transferType=${shipping_type}`
    );
  }
}

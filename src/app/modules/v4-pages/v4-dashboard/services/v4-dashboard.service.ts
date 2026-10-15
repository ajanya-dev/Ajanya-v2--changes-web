import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import {
  IRecentTransaction,
  IScheduledPaymentsCount,
  IWalletDetails
} from '../models/v4-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class V4DashboardService {
  private http = inject(HttpClient);
  private ROOT_URL = environment.rootUrl;

  getWalletDetails(): Observable<IApiRes<IWalletDetails>> {
    return this.http.get<IApiRes<IWalletDetails>>(
      `${this.ROOT_URL}/wallets/dashboard/wallet-details`
    );
  }

  getRecentTransactions(
    type?: 'send-payment' | 'received-payment'
  ): Observable<IApiRes<Record<string, IRecentTransaction[]>>> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<IApiRes<Record<string, IRecentTransaction[]>>>(
      `${this.ROOT_URL}/zil-payments/dashboard/get-recent-transactions`,
      { params }
    );
  }

  getScheduledPaymentsCount(): Observable<IApiRes<IScheduledPaymentsCount>> {
    return this.http.get<IApiRes<IScheduledPaymentsCount>>(
      `${this.ROOT_URL}/zil-payments/dashboard/get-scheduled-payments-count`
    );
  }
}

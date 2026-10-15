import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';

export interface IFeatureApplyCoupon {
  amount: string;
  credit_type: number;
  features: {
    feature: string;
    amount: string;
  }[];
  validity: number;
  type?: string;
  id?: string;
  shared_features: {
    feature_name: string;
  }[];
}

export interface IFeatureCreditList {
  feature_code: string;
  feature_name: string;
  credit_type: number;
  credit_amount: string;
  balance: string;
  status: 1 | 2;
  expire_at: string;
  features: {
    feature_name: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class RefillCreditService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  getCurrentCredit(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/refill-credits`);
  }

  getAutoRecharge(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/refill-credits/auto-recharge`);
  }

  addFund(amount: string): Observable<any> {
    const formData = new FormData();
    formData.append('amount', amount);
    return this.http.post(`${this.ROOT_URL}/refill-credits/add-fund`, formData);
  }

  addAutoRecharge(threshold: string, add_amount: string): Observable<any> {
    const formData = new FormData();
    formData.append('threshold', threshold);
    formData.append('add_amount', add_amount);
    return this.http.post(
      `${this.ROOT_URL}/refill-credits/auto-recharge`,
      formData
    );
  }

  deleteAutoRecharge(): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/refill-credits/auto-recharge`);
  }

  /**
   * Fetching all the credits list of the user from API (feature wise).
   */
  featureCreditList() {
    return this.http.get<IApiRes<IFeatureCreditList[]>>(
      `${this.ROOT_URL}/refill-credits/feature-credit`
    );
  }

  /**
   * Making apply request of a coupon to server.
   * @param body - API Payload.
   */
  featureApplyCoupon(body: { coupon_code: string }) {
    return this.http.post<IApiRes<IFeatureApplyCoupon>>(
      `${this.ROOT_URL}/refill-credits/feature-credit/apply-coupon`,
      body
    );
  }
}

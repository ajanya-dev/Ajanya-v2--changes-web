import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { ICoupon } from 'src/app/modules/coupon/model/coupon';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  usedCouponCodes(): Observable<IApiRes<ICoupon>> {
    return this.http.get<IApiRes<ICoupon>>(`${this.ROOT_URL}/coupon`);
  }

  enterCouponCode(data: any): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/coupon/activate-stack-vendor`,
      data
    );
  }

  redeemCouponCodeApi(data: any): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/coupon/activate-coupon-redeem`,
      data
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IAdditionalData,
  IAffilaiteRefer,
  IAffilaiteTable,
  IAffilateStatus,
  IAffiliateClickedList,
  IAffiliateGetWithdrawRequest,
  IAffiliateJoin,
  IAffiliatePayHistory,
  IAffiliateRedeemerDetails,
  IAffiliateReferralActivity,
  IAffiliateReferralList,
  IAffiliateRequestWithdraw,
  IAffiliateNode,
  IClickedData,
  IRefillCoupon,
  IUserCoupon,
  IUserEarnings,
  IUserEarningsData,
  IUserTransactionHistory,
  IChartData
} from 'src/app/modules/more/model/affiliate';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AffiliateProgramsService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  /**
   * @description API function for Retrieve the affiliate referral link and balance.
   */
  getReferalLink(): Observable<
    IApiRes<{ balance: string; ReferalLink: string }>
  > {
    return this.http.get<IApiRes<{ balance: string; ReferalLink: string }>>(
      `${this.ROOT_URL}/affiliate-programs`
    );
  }

  /**
   * @description API function for Retrieve the list of clicked affiliate links.
   */
  getClickedList(): Observable<IApiRes<IAffiliateClickedList[]>> {
    return this.http.get<IApiRes<IAffiliateClickedList[]>>(
      `${this.ROOT_URL}/affiliate-programs/clicked-list`
    );
  }

  /**
   * @description API function for Retrieve the list of affiliate withdraw requests.
   */
  getWithdrawRequest(): Observable<IApiRes<IAffiliateGetWithdrawRequest[]>> {
    return this.http.get<IApiRes<IAffiliateGetWithdrawRequest[]>>(
      `${this.ROOT_URL}/affiliate-programs/withdraw-request`
    );
  }

  /**
   * @description API function for Submits the redemption request form.
   * @param data- Payload for the API.
   */
  requestWithdraw(
    data: IAffiliateRequestWithdraw
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/affiliate-programs`,
      data
    );
  }

  /**
   * @description API function for Fetches user details, including balance and pre-fills the redemption form.
   */
  getRedeemerDetails(): Observable<IApiRes<IAffiliateRedeemerDetails[]>> {
    return this.http.get<IApiRes<IAffiliateRedeemerDetails[]>>(
      `${this.ROOT_URL}/affiliate-programs/redeemer`
    );
  }

  /**
   * @description API function for Retrieve the referral list.
   */
  getReferalList(): Observable<IApiRes<IAffiliateReferralList[]>> {
    return this.http.get<IApiRes<IAffiliateReferralList[]>>(
      `${this.ROOT_URL}/affiliate-programs/referral-list`
    );
  }

  /**
   * @description API function for Retrieve referral activity details based on the provided 'id'
   * @param affiliateCode - Payload for the API.
   */
  getReferalActivity(
    id: string
  ): Observable<IApiRes<IAffiliateReferralActivity>> {
    return this.http.get<IApiRes<IAffiliateReferralActivity>>(
      `${this.ROOT_URL}/affiliate-programs/referral-activity/${id}`
    );
  }

  /**
   * @description API function for Initiates the affiliate joining process.
   * @param affiliateCode - Payload for the API.
   */
  joinAffiliate(affiliateCode: string): Observable<IAffiliateJoin> {
    return this.http.post<IAffiliateJoin>(
      `${this.ROOT_URL}/affiliate-user/join`,
      { affiliate_code: affiliateCode }
    );
  }

  /**
   * @description Retrieves the affiliate referral link and updates the form.
   */
  getReferLink(): Observable<IApiRes<IAffilaiteRefer>> {
    return this.http.get<IApiRes<IAffilaiteRefer>>(
      `${this.ROOT_URL}/affiliate-user/ref-link`
    );
  }

  /**
   * @description API function for retrieves the affiliate status data.
   */
  getReferStatus(): Observable<IApiRes<IAffilateStatus>> {
    return this.http.get<IApiRes<IAffilateStatus>>(
      `${this.ROOT_URL}/affiliate-user/ref-stats`
    );
  }

  /**
   * @description API function for Retrieves traffic statistics history for affiliates..
   * @param daterange - Payload for the API.
   */
  getTrafficStatsHistory(daterange: {
    from_date: string;
    to_date: string;
  }): Observable<IApiRes<IAffilaiteTable[]>> {
    return this.http.post<IApiRes<IAffilaiteTable[]>>(
      `${this.ROOT_URL}/affiliate-user/traffic-stats-data`,
      daterange
    );
  }

  /**
   * @description API function for Retrieves additional status data.
   * @param daterange - Payload for the API.
   */
  getAdditionalStatus(daterange: {
    from_date: string;
    to_date: string;
  }): Observable<IApiRes<IAdditionalData>> {
    return this.http.post<IApiRes<IAdditionalData>>(
      `${this.ROOT_URL}/affiliate-user/additional-stats-data`,
      daterange
    );
  }

  /**
   * @description API function for Retrieve raw click details for affiliate tracking.
   * @param daterange - Payload for the API.
   */
  getRawClicks(daterange: {
    from_date: string;
    to_date: string;
  }): Observable<IApiRes<IClickedData>> {
    return this.http.post<IApiRes<IClickedData>>(
      `${this.ROOT_URL}/affiliate-user/raw-clicks`,
      daterange
    );
  }

  /**
   * @description API function for Retrieve payout history for affiliates
   */
  getPayoutHistory(): Observable<IApiRes<IAffiliatePayHistory[]>> {
    return this.http.get<IApiRes<IAffiliatePayHistory[]>>(
      `${this.ROOT_URL}/affiliate-user/payout-history`
    );
  }

  quickStatsReport(daterange: {
    from_date: string;
    to_date: string;
  }): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/affiliate-user/quick-stats-report`,
      daterange
    );
  }

  /**
   * @description API function for Retrieve user earnings data.
   */
  getUserEarnings(): Observable<IApiRes<IUserEarnings>> {
    return this.http.get<IApiRes<IUserEarnings>>(
      `${this.ROOT_URL}/affiliate-user/user-earnings`
    );
  }

  /**
   * @description API function for Retrieve user transaction history.
   * @param daterange - Payload for the API.
   */
  getUserTransactions(daterange: {
    from_date: string;
    to_date: string;
  }): Observable<IApiRes<IUserTransactionHistory[]>> {
    return this.http.post<IApiRes<IUserTransactionHistory[]>>(
      `${this.ROOT_URL}/affiliate-user/user-transactions`,
      daterange
    );
  }

  getEarnings(): Observable<IApiRes<IUserEarningsData[]>> {
    return this.http.get<IApiRes<IUserEarningsData[]>>(
      `${this.ROOT_URL}/affiliate-user/user-referred-list`
    );
  }

  requestPayout(data: {
    amount: number;
  }): Observable<{ success: boolean; message?: string; errorMsg?: string }> {
    return this.http.post<{
      success: boolean;
      message?: string;
      errorMsg?: string;
    }>(`${this.ROOT_URL}/affiliate-user/request-payout`, data);
  }

  /**
   * @description API function for Check if the user is an affiliate.
   */
  getIsUserAffiliate(): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/affiliate-user/is-affiliate`
    );
  }

  /**
   * @description API function for Retrieve all available coupon discounts.
   */
  getAvailableDiscounts(): Observable<
    IApiRes<
      {
        id: number;
        code: string;
        value: string;
        affiliate_commission: string;
      }[]
    >
  > {
    return this.http.get<
      IApiRes<
        {
          id: number;
          code: string;
          value: string;
          affiliate_commission: string;
        }[]
      >
    >(`${this.ROOT_URL}/affiliate-user/coupons/available-discounts`);
  }

  /**
   * @description API function for Generates a coupon based on the provided code and discount.
   * @param couponCode- Payload for the API.
   * @param zohoCouponId-Payload for the API.
   */
  generateCoupon(
    couponCode: string,
    zohoCouponId: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/affiliate-user/coupons`,
      {
        pap_affiliate_id: '',
        coupon_code: couponCode,
        zoho_coupon_id: zohoCouponId
      }
    );
  }

  /**
   * @description API function for Retrieve user coupons.
   */
  getUserCoupons(): Observable<IApiRes<IUserCoupon[]>> {
    return this.http.get<IApiRes<IUserCoupon[]>>(
      `${this.ROOT_URL}/affiliate-user/coupons/list`
    );
  }

  /**
   * @description API function for Delete a user coupon after confirming with a dialog.
   * @param couponId - Payload for the API.
   */
  deleteUserCoupon(
    couponId: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/affiliate-user/coupons/${couponId}/delete`
    );
  }

  /**
   * @description API function for Change the affiliate slug.
   * @param slug - Payload for the API.
   */
  changeSlug(slug: string): Observable<{ success: boolean; data: string }> {
    return this.http.post<{ success: boolean; data: string }>(
      `${this.ROOT_URL}/affiliate-user/change-slug`,
      { affiliate_code: slug }
    );
  }

  getRfilCoupon(): Observable<IApiRes<IRefillCoupon[] | null>> {
    return this.http.get<IApiRes<IRefillCoupon[] | null>>(
      `${this.ROOT_URL}/affiliate-user/refill-coupon`
    );
  }

  updateRefilCoupon(payloadData: {
    coupon_code: string;
    amount: number;
  }): Observable<{ success: string; message: string }> {
    return this.http.post<{ success: string; message: string }>(
      `${this.ROOT_URL}/affiliate-user/refill-coupon`,
      payloadData
    );
  }

  /**
   * @description API function for sharing Refferal link.
   * @param slug - Payload for the API.
   */
  shareReferral(payload: {
    type: string;
    link: string;
    email?: string;
    phone?: string;
  }): Observable<{ success: boolean; data: string }> {
    return this.http.post<{ success: boolean; data: string }>(
      `${this.ROOT_URL}/affiliate-user/send-ref-link`,
      payload
    );
  }

  changeCouponStatus(paylod: { uu_id: string; status: number }) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/affiliate-user/refill-coupon/change-status`,
      paylod
    );
  }

  affiliateTree() {
    return this.http.get<IApiRes<IAffiliateNode[]>>(
      `${this.ROOT_URL}/affiliate-user/user-referrals-chain`
    );
  }

  getchartData(){
    return this.http.get<IApiRes<IChartData>>(
      `${this.ROOT_URL}/affiliate-user/user-monthly-earnings`
      );
  }
}

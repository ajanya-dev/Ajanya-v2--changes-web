import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IBillingAddress,
  ICheckRenewalStatus,
  IComparisonData,
  ICurrentSubscriptionPlan,
  IPlanFeaturesAddonsList,
  IRenewalPaymentResponse,
  ISubscriptionData
} from 'src/app/modules/subscription/model/subscription';
import { IApiRes, IApiResMesssage } from '../../../models/api';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private location = inject(Location);
  private router = inject(Router);

  private ROOT_URL = environment.rootUrl;
  private getHeaders(disableInterceptorAlert?: boolean) {
    return disableInterceptorAlert
      ? { headers: new HttpHeaders({ isDisable422: 'true' }) }
      : {};
  }
  buttonText = false;
  isFromRefillCreditPage = false;
  isV4Page = signal(false);

  getCurrentUrl() {
    this.isV4Page.set(this.router.url.includes('/v4/'));
    if (this.router.url.includes('update-card')) {
      this.isFromRefillCreditPage = true;
    } else {
      this.isFromRefillCreditPage = false;
    }
  }

  planFeatures(isFromTrial?: number) {
    return this.http.get<IApiRes<IPlanFeaturesAddonsList>>(
      `${this.ROOT_URL}/subscription/plan-features${isFromTrial ? `?isFromTrial=${isFromTrial}` : ''}`
    );
  }

  planComparisonDetails() {
    return this.http.get<IApiRes<IComparisonData>>(
      `${this.ROOT_URL}/subscription/plan-feature-comparison-details`
    );
  }

  getCurrentPlans() {
    // 422 here means "user has no active subscription" — a normal app state
    // (handled by callers via `hasNoPlan` / `effectivePlanCode`). Silence the
    // global error popup; 404 is also ignored for backwards compatibility.
    return this.http.get<IApiRes<ICurrentSubscriptionPlan>>(
      `${this.ROOT_URL}/subscription`,
      {
        headers: { ignoreError: '404', isDisable422: 'true' }
      }
    );
  }

  getCurrentlyUsedPlans(
    headerOption?: HttpHeaders
  ): Observable<IApiRes<ISubscriptionData>> {
    return this.http.get<IApiRes<ISubscriptionData>>(
      `${this.ROOT_URL}/subscription`,
      { headers: headerOption }
    );
  }

  createSubscriptionWallet(data: any, disableInterceptorAlert?: boolean): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/subscription/subscribe/wallet`,
      data,
      this.getHeaders(disableInterceptorAlert)
    );
  }

  createSubscriptionCheck(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/subscription/subscribe/check`,
      data
    );
  }

  createSubscriptionCard(data: any, disableInterceptorAlert?: boolean): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/subscription/subscribe/online`,
      data,
      this.getHeaders(disableInterceptorAlert)
    );
  }

  updateSubscriptionWallet(data: any, disableInterceptorAlert?: boolean): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/subscription/subscribe/wallet`,
      data,
      this.getHeaders(disableInterceptorAlert)
    );
  }

  updateSubscriptionCheck(data: any): Observable<any> {
    return this.http.put(`${this.ROOT_URL}/subscription/subscribe/check`, data);
  }

  updateSubscriptionCard(data: any, disableInterceptorAlert?: boolean): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/subscription/subscribe/online`,
      data,
      this.getHeaders(disableInterceptorAlert)
    );
  }

  updateCard(data: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/subscription/associate-card`, data);
  }

  //Update payment method
  updatePaymentCheckAndWallet(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/subscription/payment-method/offline`,
      data
    );
  }

  updatePaymentCard(data?: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/subscription/payment-method/online`,
      data
    );
  }

  getBillingAddress() {
    return this.http.get<IApiRes<IBillingAddress>>(
      `${this.ROOT_URL}/subscription/customer-billing-details`
    );
  }

  closeSubscriptionPage(): void {
    this.location.back();
  }

  goToDashBoard(): void {
    this.getCurrentUrl();
    if (this.isFromRefillCreditPage) {
      if (this.isV4Page()) {
        this.router.navigate(['/v4/manage/refill-credit/show-refillform']);
      } else {
        this.router.navigate(['/manage/refill-credit/show-refillform']);
      }
    } else if (this.isV4Page()) {
        this.router.navigate(['/v4/manage/subscription/dashboard']);
      } else {
        this.router.navigate(['/manage/subscription/dashboard']);
      }
  }

  talkToSales(
    body: { 
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      app_name?: string | null;
      type?: number | null;
      note?: string | null;
      feature_desired_date?: string | null;
    },
    isOutside: boolean,
    disableInterceptorAlert?: boolean
  ): Observable<IApiResMesssage> {
    const outsideRoot = `${this.ROOT_URL.split('/api/v4')[0]}/outside`;
    const endpoint = `${isOutside ? outsideRoot : this.ROOT_URL}/talk-to-sales`;
    return this.http.post<IApiResMesssage>(endpoint, body, this.getHeaders(disableInterceptorAlert));
  }

  buyAddon(addOns: { featureCode: string; quantity: number }[]) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/subscription/buy-addon`,
      {
        addOns: addOns
      }
    );
  }

  /**
   * API function to check is pay as you go should be showed
   */
  isShowPayAsYouGo(){
    return this.http.get<IApiRes<{hidePayAsYouGo: number}>>(
      `${this.ROOT_URL}/subscription/subscription-configuration`,
    );
  }

  checkRenewalStatus() {
    return this.http.get<IApiRes<ICheckRenewalStatus>>(
      `${this.ROOT_URL}/subscription/renewal/status`
    );
  }

  renewInvoicePayment(payload: { is_renewal: number; redirect_url: string; invoice_id: string | null }) {
    return this.http.post<IApiRes<IRenewalPaymentResponse>>(`${this.ROOT_URL}/subscription/renewal/payment`, payload);
  }

  getAppFaqs(appName: string) {
    return this.http.get<IApiRes<{ id: number; app_name: string; question: string; answer: string; is_active: boolean }[]>>(
      `${this.ROOT_URL}/get-app-faqs`,
      { params: { app_name: appName } }
    );
  }

  checkOverdueStatus(hostedpage_id: string) {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/subscription/renewal/sync?hostedpage_id=${hostedpage_id}`,

    );
  }

  checkInvoiceStatus(invoice_id: string) {
    return this.http.get<IApiRes<{ is_payable: boolean, amount: number , invoice_number: string, due_date: string }>>(
      `${this.ROOT_URL}/subscription/renewal/invoice-status?invoice_id=${invoice_id}`
    );
  }
}

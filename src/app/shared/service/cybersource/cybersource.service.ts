import { ICyberSourceCardAddRequestModel } from 'src/app/modules/integration/model/integration';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { UserPermissionAlertService } from '../permission/user-permission-alert.service';
import { AlertService } from '../alert/alert.service';
import { AdpService } from '../integration/adp.service';
import {
  IApiRes,
  IApiResMesssage,
  IApiResWithMsg
} from "../../../models/api";


interface ICreditCard {
  nickName: string;
  bgColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CybersourceService implements OnDestroy {
  private _userPermissionService = inject(UserPermissionAlertService);

  ROOT_URL = environment.rootUrl;
  private idempotencyKeySubject = new BehaviorSubject<string>('');

  private alertService = inject(AlertService);
  private adpService = inject(AdpService);
  private router = inject(Router);
  private http = inject(HttpClient);

  subscription: Subscription[] = [];

  private headerOptions = new HttpHeaders({
    'Content-Type': 'application/json',
    isDisable422: 'true'
  });

  /**
   * @description Create Idempotency key using randomUUID method. Even if multiple transactions are initiated only one transaction with same idempotency key will become successful.
   */
  createIdempotencyKey() {
    if (this.idempotencyKeySubject.value === '') {
      this.idempotencyKeySubject.next(crypto.randomUUID());
    }
  }

  /**
   * @description -Handles an error response from a card deletion operation related to ADP.
   * @param error - The error response object from the HTTP request.
   */
  adpCardDeleteErrorManage(error: HttpErrorResponse) {
    if (error?.error?.errorCode === 733) {
      const warningRef = this.alertService.warningAlert({
        content: error.error.errorMsg,
        doneMsg: 'Go to ADP Settings',
        isCancel: true
      });
      warningRef.afterClosed().subscribe((res) => {
        if (res) {
          this.subscription.push(
            this.adpService.listCompanies().subscribe((response) => {
              const companyId = response.data[0].id;
              const {companyName} = response.data[0];
              this.router.navigate([
                'manage/thirdparty_app/adp/setup',
                companyId,
                companyName
              ]);
            })
          );
        }
      });
    }
  }

  /**
   * @description Change current idempotency key.
   */
  replaceIdempotencyKey() {
    this.idempotencyKeySubject.next(crypto.randomUUID());
  }

  getExistingCards(showAllCards?: boolean, isPayroll?: boolean, headerOptions?: HttpHeaders): Observable<IApiResWithMsg<IExistingCreditCards[]>> {
    let url = showAllCards
      ? `${this.ROOT_URL}/payment-methods/card/exisitng?all_cards`
      : `${this.ROOT_URL}/payment-methods/card/exisitng`;
    if (isPayroll) {
      url += showAllCards ? '&payroll' : '?payroll';
    }
    return this.http
      .get<
        IApiResWithMsg<IExistingCreditCards[]>
      >(url, { headers: headerOptions || this.headerOptions })
      .pipe(
        catchError((error) => {
          this._userPermissionService.handleErrorsAndPermissions(error, () => {
            this._userPermissionService.cardDetails(error);
          });
          throw error;
        })
      );
  }

  /**
   * @description Decides the gateway type based on the amount
   * @param amount - The payment amount
   * @returns Observable with gateway_type in response
   */
  decideGateway(amount: number) {
    return this.http.post<IApiRes<{gateway_type: number}>>(
      `${this.ROOT_URL}/payment-methods/card/decide-gateway`,
      { amount }
    );
  }

  getPostData(body: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/payment-methods/card/post-data`,
      body,
      { headers: this.headerOptions }
    );
  }

  capturePayment(body: any): Observable<any> {
    this.createIdempotencyKey();
    return this.http.post(
      `${this.ROOT_URL}/payment-methods/card/complete-transaction`,
      body,
      { headers: { 'idempotency-key': this.idempotencyKeySubject.value } }
    );
  }

  achPay(body: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/payment-methods/ach`, body);
  }

  /**
   *@description API function for Adds card data to Cybersource.
   * @param sendingData Payload for the API
   */
  addCardData(
    sendingData: ICreditCard
  ): Observable<IApiRes<ICyberSourceCardAddRequestModel>> {
    return this.http
      .post<
        IApiRes<ICyberSourceCardAddRequestModel>
      >(`${this.ROOT_URL}/payment-methods/card`, sendingData)
      .pipe(
        catchError((error) => {
          this._userPermissionService.handleErrorsAndPermissions(error, () => {
            this._userPermissionService.createCardPermission(error);
          });
          throw error;
        })
      );
  }

  getAcceptedOrigins(): Observable<{ origin_name: string }[]> {
    return this.http.get<{ origin_name: string }[]>(
      `${this.ROOT_URL}/payment-methods/card/accepted-origins`
    );
  }

  updateCard(
    cardId: string,
    sendingData: { nickName: string },
    showPermissionAlert: boolean = true
  ): Observable<IApiResMesssage> {
    return this.http
      .post<IApiResMesssage>(
        `${this.ROOT_URL}/payment-methods/card/${cardId}/update`,
        sendingData
      )
      .pipe(
        catchError((error) => {
          this._userPermissionService.handleErrorsAndPermissions(error, () => {
            if(showPermissionAlert){
              this._userPermissionService.updateCard(error);
            }
          });
          throw error;
        })
      );
  }

  deleteCard(cardId: string): Observable<IApiResMesssage> {
    return this.http
      .delete<IApiResMesssage>(
        `${this.ROOT_URL}/payment-methods/card/${cardId}/delete`
      )
      .pipe(
        catchError((error) => {
          this.adpCardDeleteErrorManage(error);
          this._userPermissionService.handleErrorsAndPermissions(error, () => {
            this._userPermissionService.deleteCard(error);
          });
          throw error;
        })
      );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

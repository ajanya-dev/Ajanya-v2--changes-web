import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  IADPSetupRequest,
  ICompanyDetailsItemADP,
  IConnectADP
} from 'src/app/modules/integration/model/integration';
import { IApiResMesssage } from 'src/app/models/api';

@Injectable({
  providedIn: 'root'
})
export class AdpService {
  private ROOT_URL = environment.rootUrl;

  private _adpUserDetails: BehaviorSubject<{
    adpMarketPlaceUser: number;
    passwordUpdated: number;
  }> = new BehaviorSubject({ adpMarketPlaceUser: 0, passwordUpdated: 0 });

  public get adpUserDetails(): BehaviorSubject<{
    adpMarketPlaceUser: number;
    passwordUpdated: number;
  }> {
    return this._adpUserDetails;
  }
  public set adpUserDetails(
    value: BehaviorSubject<{
      adpMarketPlaceUser: number;
      passwordUpdated: number;
    }>
  ) {
    this._adpUserDetails = value;
  }

  isADPRunUser: number;

  constructor(private http: HttpClient) {}

  /**
   * @description API function for Initiate the process of connecting ADP.
   */
  connectAdp(): Observable<IConnectADP> {
    return this.http.post<IConnectADP>(
      `${this.ROOT_URL}/integrations/adp/connect`,
      {}
    );
  }

  /**
   * @description -API function for Handle callback responses after connecting or disconnecting ADP.
   * @param data -Payload for the API
   * @returns
   */
  getCompany(data: { state: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/adp/connect/company`,
      data
    );
  }

  /**
   * @description API function for Initiate the ADP company consent process.
   * @param id -Payload for the API
   * @returns
   */
  adpCompanyConsent(id: string): Observable<IConnectADP> {
    return this.http.post<IConnectADP>(
      `${this.ROOT_URL}/integrations/adp/connect/window`,
      { id }
    );
  }

  /**
   * @description -API Function for get Lists of the companies integrated with ADP and sets the active company for payroll processing.
   *
   */
  listCompanies(): Observable<{ data: ICompanyDetailsItemADP[] }> {
    return this.http.get<{ data: ICompanyDetailsItemADP[] }>(
      `${this.ROOT_URL}/integrations/adp/connected-companies`
    );
  }

  /**
   * @description- API function for Retrieve the list of payroll items.
   * @param id -Payload for the API
   */
  getAdpPayroll(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/integrations/adp/events/${id}`);
  }

  /**
   * @description -API function for Process a payroll item.
   * @param companyId -Payload for the API
   * @param sendingData -Payload for the API
   */
  processPayroll(
    companyId: string,
    sendingData: { payrollId: string; amount: string; processingAmount: string }
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/adp/events/${companyId}/process`,
      sendingData
    );
  }

  /**
   * @description -API function for Trigger synchronization of payroll data.
   * @param companyId -Payload for the API
   */
  syncPayrollData(companyId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/adp/events`,
      { companyId }
    );
  }

  /**
   * @description -API function for Initiate the process of disconnecting ADP for a specific company.
   * @param id
   */
  disconnectADPInitiate(id: string) {
    return this.http.post<IConnectADP>(
      `${this.ROOT_URL}/integrations/adp/connect/signout`,
      { id }
    );
  }

  /**
   * @description -API function for Handles callback responses after connecting or disconnecting ADP.
   * @param id -Payload for the API
   */
  disconnectADPConfirm(id: string) {
    return this.http.post<IConnectADP>(
      `${this.ROOT_URL}/integrations/adp/connect/signout-response`,
      { id }
    );
  }

  /**
   * @description -API function for Saves the ADP setup details.
   * @param sendingData -Payload for the API
   */
  setADPSetupDetails(sendingData: IADPSetupRequest) {
    return this.http.post<IConnectADP>(
      `${this.ROOT_URL}/integrations/adp/settings`,
      sendingData
    );
  }

  /**
   * @description -API function for Retrieve ADP setup details.
   * @param companyId -Payload for the API
   */
  getADPSetupDetails(companyId: string) {
    return this.http.get<any>(
      `${this.ROOT_URL}/integrations/adp/settings/${companyId}`
    );
  }

  setADPUserOnboard(sendingData: {
    company: string;
    password: string;
    password_confirmation: string;
  }) {
    return this.http.post<any>(
      `${this.ROOT_URL}/integrations/user-update`,
      sendingData
    );
  }
}

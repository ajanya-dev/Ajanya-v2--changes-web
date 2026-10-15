import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import {
  IActivityDataDeveloper_apiData,
  IApiSettingsDetails,
  IapiSettingsLog
} from 'src/app/models/developer';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeveloperPanelService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  tokenApiKey(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/developer`, data);
  }

  getToken(sessionKey: string = ''): Observable<IApiRes<{ token: string }>> {
    const url = sessionKey
      ? `${this.ROOT_URL}/developer/token?session_key=${sessionKey}`
      : `${this.ROOT_URL}/developer/token`;
    return this.http.get<IApiRes<{ token: string }>>(url);
  }

  getPartnerConnectToken(): Observable<IApiRes<{ connectionKey: string }>> {
    return this.http.post<IApiRes<{ connectionKey: string }>>(
      `${this.ROOT_URL}/developer/partner-connect/token`,
      {}
    );
  }

  apiActivity(): Observable<IApiRes<IActivityDataDeveloper_apiData>> {
    return this.http.get<IApiRes<IActivityDataDeveloper_apiData>>(
      `${this.ROOT_URL}/developer/accounts`
    );
  }

  apiSettingsLog(): Observable<IApiRes<IapiSettingsLog>> {
    return this.http.get<IApiRes<IapiSettingsLog>>(
      `${this.ROOT_URL}/developer/api-logs`
    );
  }
  apiSettingsDetails(id: string): Observable<IApiRes<IApiSettingsDetails>> {
    return this.http.get<IApiRes<IApiSettingsDetails>>(
      `${this.ROOT_URL}/developer/api-log-details?id=${id}`
    );
  }
  updateWebhook(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/developer/update-webhook`,
      data
    );
  }
  gpblWebhook(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/developer/update-gpbl-webhook`,
      data
    );
  }

  /**
   * @description To fetch all webhook events
   * @returns
   */
  getWebhookEvents(): Observable<IApiRes<string[]>> {
    return this.http.get<IApiRes<string[]>>(
      `${this.ROOT_URL}/developer/webhook-events`
    );
  }
}

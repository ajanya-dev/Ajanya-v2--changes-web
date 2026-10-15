import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IImportTransactionCompany,
  INetSuiteCompanyDetails,
  INetSuiteConnectedData,
  INetSuiteData
} from 'src/app/modules/integration/model/integration';
import {
  INetSuiteBank,
  INetSuiteClass,
  INetsuiteConnectionPayload,
  INetsuiteMapedBankList,
  INetsuiteOAuthConnectData,
  INetsuiteOAuthConnectPayload,
  INetsuiteSettings
} from 'src/app/modules/integration/netsuite/model/netsuite';
import { IApiRes, IApiResMesssage } from '../../../models/api';

@Injectable({
  providedIn: 'root'
})
export class NetsuiteIntegrationService {
  private ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  /**
   * @description API function for Initiate the NetSuite integration connection process.
   */
  connectNetsuite(): Observable<IApiRes<INetSuiteData>> {
    return this.http.get<IApiRes<INetSuiteData>>(
      `${this.ROOT_URL}/integrations/merge/create-link-token/netsuite`
    );
  }

  /**
   * @description  API function for Handle the successful integration with NetSuite.
   * @param token -Payload for the API
   * @param userid -Payload for the APi
   */
  getAccountToken(token: string, userid: string): Observable<IApiRes<boolean>> {
    return this.http.get<IApiRes<boolean>>(
      `${this.ROOT_URL}/integrations/merge/get-account-token/${token}/${userid}`
    );
  }

  /**
   *@description API function for Check if NetSuite is connected and retrieves company details if connected.
   */
  getNetSuiteDetails(): Observable<IApiRes<INetSuiteConnectedData>> {
    return this.http.get<IApiRes<INetSuiteConnectedData>>(
      `${this.ROOT_URL}/integrations/merge/details/netsuite`
    );
  }

  /**
   * @description API function for Initiate the NetSuite integration connection process.
   */
  disConnectNetSuite(): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/merge/disconnect/netsuite`,
      {}
    );
  }

  /**
   * @description -API function for Initiate the import of NetSuite company details.
   * @param data -Paylaod for the API
   * @returns
   */
  importCompanyDetails(data: {
    code: string;
  }): Observable<IApiRes<INetSuiteCompanyDetails>> {
    return this.http.post<IApiRes<INetSuiteCompanyDetails>>(
      `${this.ROOT_URL}/integrations/merge/import-companies`,
      data
    );
  }

  /**
   * @description API function for Initiate the import of payees from NetSuite.
   * @param params -Payload for the API
   * @returns
   */
  importNetSuiteTransaction(
    params: IImportTransactionCompany
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/import-transactions`,
      params
    );
  }

  /**
   * @description -API function for Disconnect a NetSuite company.
   * @param data -Payload for the API
   * @returns
   */
  disConnectCompany(data: { companyId: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/disconnect-company/netsuite`,
      data
    );
  }

  onConnectNetSuite(
    body: INetsuiteConnectionPayload
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/connect`,
      body
    );
  }

  /**
   * @description API function to initiate the NetSuite OAuth connection.
   * On success the response contains the OAuth authorization URL to redirect to.
   * @param body - Payload containing the account id, client id and client secret.
   */
  connectNetSuiteOAuth(
    body: INetsuiteOAuthConnectPayload
  ): Observable<IApiRes<INetsuiteOAuthConnectData>> {
    return this.http.post<IApiRes<INetsuiteOAuthConnectData>>(
      `${this.ROOT_URL}/integrations/netsuite/oauth/connect`,
      body
    );
  }

  getNetSuiteConnectionDetails(): Observable<
    IApiRes<{ id: string; connected: number }>
  > {
    return this.http.get<IApiRes<{ id: string; connected: number }>>(
      `${this.ROOT_URL}/integrations/netsuite/details`
    );
  }

  onDisconnectNetSuite(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/${id}/disconnect`,
      {}
    );
  }

  importNetsuiteSettings(
    importType: string,
    type?: number
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/${importType}`,
      { type }
    );
  }

  updatePayees() {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/update-payees`,
      {}
    );
  }

  getMappedBankList(): Observable<IApiRes<INetsuiteMapedBankList[]>> {
    return this.http.get<IApiRes<INetsuiteMapedBankList[]>>(
      `${this.ROOT_URL}/integrations/netsuite/bank-account-mapping`
    );
  }

  mapBank(body: {
    ocwAccountId: string;
    netsuiteAccountId: string;
    subsidiaryMappingId: string;
  }): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/netsuite/bank-account-mapping`,
      body
    );
  }

  removeMapping(id: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/netsuite/bank-account-mapping/${id}/remove-mapping`,
      {}
    );
  }

  deleteBank(id: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/netsuite/bank-account-mapping/${id}`
    );
  }

  importData(body: {
    type: number;
    importTime: number;
    downloadFilter: number;
    subsidiaryIds: string[];
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/import-data`,
      body
    );
  }

  getSettings(): Observable<IApiRes<INetsuiteSettings>> {
    return this.http.get<IApiRes<INetsuiteSettings>>(
      `${this.ROOT_URL}/integrations/netsuite/settings`
    );
  }

  updateSettings(
    body: Partial<{
      check: number | null;
      downloadFilter: number | null;
      pushBackEnable: number | null;
      defaultSubsidiaryId: string | null;
    }>
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/netsuite/settings`,
      body
    );
  }

  exportChecksToNetSuite(checkId: string[], zilPaymentIds?: string[]) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/export-checks`,
      { checkIds: checkId, zilPaymentIds }
    );
  }

  getNetSuiteBank(bankId: string): Observable<IApiRes<INetSuiteBank>> {
    return this.http.get<IApiRes<INetSuiteBank>>(
      `${this.ROOT_URL}/checks/netsuite/details/${bankId}`
    );
  }

  getNetSuiteExportDetails(
    type: string,
    term?: string,
    page?: number
  ): Observable<IApiRes<INetSuiteClass[]>> {
    let params = new HttpParams();
    if (page) {
      params = params.append('page', page);
    }
    if (term) {
      params = params.append('term', term);
    }
    return this.http.get<IApiRes<INetSuiteClass[]>>(
      `${this.ROOT_URL}/checks/netsuite/${type}`,
      { params }
    );
  }

  updateSignlePayee(payload: { id: string }) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/netsuite/update-payee`,
      payload
    );
  }

  getSubsidiary(page:number = 1, term?:string){
    let params = new HttpParams().append('page',page);
    if (term) {
      params = params.append('term',term);
    }
    return this.http.get<IApiRes<{id:string,name:string}[]>>(`${this.ROOT_URL}/checks/netsuite/subsidiaries`,{params});
  }

  importLocations(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/import-locations`,
      {}
    );
  }

  getNetSuiteLocations() {
    return this.http.get<IApiRes<{ id: string; name: string }[]>>(
      `${this.ROOT_URL}/checks/netsuite/locations`
    );
  }
}

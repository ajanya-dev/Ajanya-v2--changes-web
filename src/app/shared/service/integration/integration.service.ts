import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IMappingBankAccount,
  IQuickBookDesktopImportRequest,
  IFreshBookSettings,
  IBillOrg,
  IQbdCompanyInfo,
  IQbdBankAccountInfo,
  IQBDData,
  IConnectedThirdPartyData,
  IThirdPartyTransactionBody,
  IFreeAgentData,
  IConnectiontData,
  IIntegrationData,
  IGustoCompanyData,
  IgetConnectionUrl,
  IGustoBankMappedData,
  IResponseURL,
  IMappingBankAccountRes,
  IgetPayrollCheckDataRes,
  IGetPayrollCheckDataParams,
  IPayrollCheckValidateRes,
  IQbConnectedCompany,
  IQuickBookOnlineData,
  IXeroSettings,
  IbankAccountList,
  IgetZapierDataRes,
  IpostQuickBookOnlineData,
  IupdateQuickBookDesktopData,
  ImapQbDesktopBankAcc,
  IQBCompanyData,
  IGustoPaymentsList,
  ISalesforceAccount,
  ISalesforceIssueCheckResponse,
  ISalesforceAuthUrlResponse,
  ISalesforceSyncContactsResponse,
  ISalesforceContactsResponse,
  IHubSpotDetailsResponse,
  IHubSpotCompaniesResponse,
  ISlackAccount,
  ISlackIssueCheckResponse,
  IClioContactsResponse,
  IQuickbooksPayrollDetails,
  IQuickbooksPayrollConnect,
  IQuickbooksPayrollBankMapping,
  IQuickbooksPayrollActionRes
} from 'src/app/modules/integration/model/integration';
import {
  IQuickbooksPayrollFetchRes,
  IQuickbooksPayrollImportRes
} from 'src/app/modules/integration/pages/quickbooks-payroll/model/quickbooks-payroll-run';
import { LocalStorageService } from '../storage/local-storage.service';
import { IResponse } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { ISampleFiles } from 'src/app/modules/integration/pages/payrollcheck-integration/payrollcheck-integration.component';
import { IDayforceConnection, IDayforceConnectionDetails, IDayforceConnectionResponse, IDayforceLocations } from 'src/app/modules/integration/dayforce/model/dayforce';
import {
  IApiRes,
  IApiResMesssage,
  IApiResWithMsg
} from './../../../models/api';

interface IThirdPartyIntegrationTracking {
  app_name: string;
  count: number;
  created_at: string;
  created_for_id: number;
  id: number;
  updated_at: string;
}
@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private ROOT_URL = environment.rootUrl;
  private OUTSIDE_ROOT_URL = environment.rootUrl.split('/api/v4')[0];
  private dayforceRootUrl = `${this.ROOT_URL}/integrations/dayforce`;

  constructor(private http: HttpClient) {}

  appsConnectionStatus(){
    return this.http.get<IApiRes<{connected_applications: string[]}>>(`${this.ROOT_URL}/integrations/connected-thirdparty-applications`);
  }

  //QUICK BOOK ONLINE START
  connectToQuickBooksOnline(): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/integrations/quickbooks-online/connect-company`
    );
  }

  /**
   * @description -API function for Perform the disconnect action for a QuickBooks company.
   * @param realmId -Payload for the API
   * @returns
   */
  disconnectToQuickBooksOnline(realmId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-online/disconnect-company`,
      { RealmId: realmId }
    );
  }

  /**
   * @description -API function for Handle the callback from QuickBooks.
   * @param queryParam -Payload for the API
   * @returns
   */
  quickBookCallBack(queryParam: string): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-online/callback?${queryParam}`
    );
  }

  /**
   * @description API function for Retrieve duplicate mapped banks data for QuickBooks Online.
   *
   */
  getQuickBookOnlineData(): Observable<{
    success: boolean;
    data: IQuickBookOnlineData;
  }> {
    return this.http.get<{ success: boolean; data: IQuickBookOnlineData }>(
      `${this.ROOT_URL}/integrations/quickbooks-online`
    );
  }

  /**
   * @description -API function for Save QuickBooks Online data.
   * @param data -Payload for the API
   */
  postQuickBookOnlineData(
    data: IpostQuickBookOnlineData
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-online`,
      data
    );
  }

  /**
   * @description -API function for Load bank account mapping data with optional pagination and search filters.
   * @param params - Optional parameters for filtering, pagination, and search
   */
  getBankAccountMappingData(params?: {
    realmId?: string;
    page?: number;
    per_page?: number;
    quickBookId?: string;
    quickBookAccount?: string;
    ocwBankAccount?: string;
    ocwBankNickName?: string;
    search?: string;
  }): Observable<{
    success: boolean;
    data: IQbConnectedCompany[];
  }> {
    let url = `${this.ROOT_URL}/integrations/quickbooks-online/bank-account-mapping`;

    if (params) {
      const queryParams = new URLSearchParams();
      if (params.realmId) {
        queryParams.append('realmId', params.realmId);
      }
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.per_page) {
        queryParams.append('per_page', params.per_page.toString());
      }
      if (params.quickBookId) {
        queryParams.append('quickBookId', params.quickBookId);
      }
      if (params.quickBookAccount) {
        queryParams.append('quickBookAccount', params.quickBookAccount);
      }
      if (params.ocwBankAccount) {
        queryParams.append('ocwBankAccount', params.ocwBankAccount);
      }
      if (params.ocwBankNickName) {
        queryParams.append('ocwBankNickName', params.ocwBankNickName);
      }
      if (params.search) {
        queryParams.append('search', params.search);
      }
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.http.get<{ success: boolean; data: IQbConnectedCompany[] }>(url);
  }

  /**
   * @description -API function for Delete a bank account mapping by ID.
   * @param bankId -Payload for the API
   */
  deleteBankAccMapping(bankId: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-online/bank-account-mapping/${bankId}`
    );
  }

  /**
   * @description -API function for Bulk delete bank account mappings by IDs.
   * @param ids -Array of bank account mapping IDs to delete
   */
  bulkDeleteBankAccMapping(ids: string[]): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-online/bank-account-mapping`,
      { body: { ids } }
    );
  }

  /**
   * @description -API function for Remove bank account mapping by ID.
   * @param data -Payload for the API
   */
  removeBankAccMapping(data: { id: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-online/bank-account-mapping/remove-mapping`,
      data
    );
  }
  // QUICK BOOK ONLINE END

  // QUICK BOOK ONLINE IMPORTS/EXPORTS START------

  /**
   * @description -API function for Import bank data from a QuickBooks company with the specified realm ID.
   * @param realmId -Payload for the API
   * @returns
   */
  importQuickbookBanks(realmId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/quickbooks-online-imports/get-quickbook-banks`,
      { realm_id: realmId }
    );
  }

  /**
   * @description -API function for Import QuickBooks payee data from a company with the specified realm ID.
   * @param realmId -Payload for the API
   */
  importQuickbookPayee(realmId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/quickbooks-online-imports/get-quickbook-payee`,
      { realm_id: realmId }
    );
  }

  /**
   * @description -API function for Import QuickBooks categories or classes data based on the specified type and realm ID.
   * @param id -Payload for the API
   * @param realmId -Payload for the API
   */
  importQuickbookCategories(
    id: string,
    realmId: string
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/quickbooks-online-imports/${id}`,
      { realm_id: realmId }
    );
  }

  /**
   * @description -API function for Import QuickBooks locations for a specific realm ID.
   * @param realmId -Payload for the API
   */
  importQuickbookLocation(realmId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/quickbooks-online-imports/get-quickbook-locations`,
      { realm_id: realmId }
    );
  }

  /**
   * @description -API function for Export checks to quickbook
   * @param checkIds -Payload for the API
   */
  exportChecksToQuickbook(checkIds: string[]): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/quickbooks-online-export/export-checks`,
      { check_ids: checkIds }
    );
  }

  // QUICK BOOK ONLINE IMPORTS/EXPORTS END

  // QUICK BOOK DESKTOP START-----------

  /**
   * @description -API function for Retrieve mapped banks data for QuickBooks Desktop.
   */
  getQuickBookDesktopData(): Observable<IApiRes<IQBDData>> {
    return this.http.get<IApiRes<IQBDData>>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop`
    );
  }

  /**
   * @description -API function for Update QuickBooks Desktop settings.
   * @param data -Payload for the API
   * @returns
   */
  updateQuickBookDesktopData(
    data: IupdateQuickBookDesktopData
  ): Observable<IResponse> {
    return this.http.post<IResponse>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop`,
      data
    );
  }

  geQbDesktopBankMappedData(): Observable<{
    success: boolean;
    data: IQBCompanyData[];
  }> {
    return this.http.get<{ success: boolean; data: IQBCompanyData[] }>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/mapping`
    );
  }

  deleteQbMappedBank(bankId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/mapping/${bankId}`
    );
  }

  /**
   * @description API function for Submit the bank account mapping.
   * @param data -Payload for the API
   */
  updateMapQBDesktopBankAcc(
    qbid: string,
    data: { bankAccountId: string }
  ): Observable<IResponse> {
    return this.http.put<IResponse>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/mapping/${qbid}`,
      data
    );
  }

  /**
   * @description API function for Submit the bank account mapping.
   * @param data -Payload for the API
   */
  mapQuickBooksDesktopBankAcc(data: {
    bankAccountId: string;
    qbId: string;
  }): Observable<IResponse> {
    return this.http.post<IResponse>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/mapping`,
      data
    );
  }

  /**
   * @description -API function for Submit the form data to map a bank account.
   * @param data -Payload for the API
   * @returns
   */
  mapQbDesktopBankAcc(data: ImapQbDesktopBankAcc): Observable<IResponse> {
    return this.http.post<IResponse>(
      `${this.ROOT_URL}/integrations/quickbooks-online/bank-account-mapping`,
      data
    );
  }

  updateQboMapingBankAcc(
    data: {
      bankAccountId: string;
      classMappingId: string;
      locationMappingId: string;
    },
    qbid: string
  ): Observable<IResponse> {
    return this.http.put<IResponse>(
      `${this.ROOT_URL}/integrations/quickbooks-online/bank-account-mapping/${qbid}`,
      data
    );
  }

  /**
   * @description -API function for Load company data for QuickBooks Desktop integration.
   */
  getQuickbooksDesktopCompanies(): Observable<IApiRes<IQbdCompanyInfo>> {
    return this.http.get<IApiRes<IQbdCompanyInfo>>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/companies`
    );
  }

  getQuickbooksDesktopFiles(): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/files`
    );
  }

  /**
   * @description -API function for Handles the download web connector file.
   * @param data -Payload for the API
   * @returns
   */
  downloadWebConnectorFile(data: FormData): Observable<IResponseURL> {
    return this.http.post<IResponseURL>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/download`,
      data
    );
  }

  quickbooksDesktopImport(
    sendingData: IQuickBookDesktopImportRequest
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/import`,
      sendingData
    );
  }

  /**
   * @description -API function for Disconnect from a QuickBooks Desktop company.
   * @param data -Payload for the API
   * @returns
   */
  quickbooksDesktopDisconnectCompany(
    data: FormData
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/disconnect-company`,
      data
    );
  }

  /**
   * @description -API function for Download a QuickBooks Desktop company file.
   * @param data -Payload for the API
   */
  quickbooksDesktopDownloadCompanyFile(
    data: FormData
  ): Observable<IResponseURL> {
    return this.http.post<IResponseURL>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/download-file`,
      data
    );
  }

  /**
   * @description -API function for Delete a QuickBooks Desktop company file.
   * @param data -Payload for the API
   * @returns
   */
  deleteQBDesktopCompanyFile(data: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/delete-file`,
      data
    );
  }

  getBankAccountsOfQBDCompany(
    id: string
  ): Observable<IApiRes<IQbdBankAccountInfo[]>> {
    return this.http.get<IApiRes<IQbdBankAccountInfo[]>>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/get-accounts/${id}`
    );
  }

  /**
   * @description -API function for Import new bank accounts of a QuickBooks Desktop company.
   * @param sendingData -Payload for the API
   * @returns
   */
  importNewBankAccountsOfQBDCompany(
    sendingData: FormData
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/import-accounts`,
      sendingData
    );
  }

  /**
   * @description -API function for Handle the reset QBD password
   * @param sendingData -Payload for the API
   * @returns
   */
  resetPasswordOfQBDFile(sendingData: FormData): Observable<IResponse> {
    return this.http.post<IResponse>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/reset-password`,
      sendingData
    );
  }

  /**
   * @description -API function for Import new details of a QuickBooks Desktop company based on the specified type.
   * @param urlEnd -Payload for the API
   * @param sendingData -PAyload for the API
   */
  importQBDCompanyDetails(
    urlEnd: string,
    sendingData: FormData
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/${urlEnd}`,
      sendingData
    );
  }

  /**
   * @description -API function for Export Check to quick book desktop.
   * @param checkIds -Payload for the API
   */
  exportChecksToQuickbookDesktop(
    checkIds: string[]
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/quickbooks-desktop/export-checks`,
      { check_ids: checkIds }
    );
  }

  // ZAPIER START

  /**
   * @description -API function for Retrieve Zapier integration data.
   */
  getZapierData(): Observable<IgetZapierDataRes> {
    return this.http.get<IgetZapierDataRes>(
      `${this.ROOT_URL}/integrations/thirdparty-app/zapier`
    );
  }

  // ZAPIER END

  /**
   * @description -API function for Send the selected file to the server.
   */
  postPayrollCheckData(data: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/integrations/payroll-check`,
      data
    );
  }

  /**
   * @description -API function for validating payroll check cost before printing.
   * @param path - The ref_id returned from upload
   */
  validatePayrollCheck(path: string,feature_code:string): Observable<IPayrollCheckValidateRes> {
    return this.http.get<IPayrollCheckValidateRes>(
      `${this.ROOT_URL}/integrations/payroll-check/validate?path=${path}&feature_code=${feature_code}`
    );
  }

  /**
   * @description -API function for Load the payroll check file.
   * @param params -Payload for the API (path, demo, sign, micr)
   */
  getPayrollCheckData(
    params: IGetPayrollCheckDataParams
  ): Observable<IgetPayrollCheckDataRes> {
    const { path, demo, sign, micr } = params;
    return this.http.get<IgetPayrollCheckDataRes>(
      `${this.ROOT_URL}/integrations/payroll-check?path=${path}&demo=${demo}&sign=${sign}&micr=${micr}`
    );
  }


  savePayrollCheck(payload: { path: string; sign: number; demo: number; micr: number }): Observable<IResponse> {
    return this.http.post<IResponse>(
      `${this.ROOT_URL}/integrations/payroll-check/save`,
      payload
    );
  }

  /**
   * @description -API function for Load sample files for payroll checks.
   */
  getPayrollCheckSampleFiles(): Observable<{
    success: boolean;
    data: ISampleFiles;
  }> {
    return this.http.get<{ success: boolean; data: ISampleFiles }>(
      `${this.ROOT_URL}/integrations/payroll-check/sample-files`
    );
  }
  // CHECKS FROM PDF END

  //ZOHO START

  startImporting(providerCode: string, params: any): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/${providerCode}?companyId[]=${params.companyId}&markAsPrintLater=${params.markAsPrintLater}&importTime=${params.importTime}`
    );
  }

  /**
   * @description API function for Imports company data from FreshBooks.
   */
  importZohoCompany(providerCode: string): Observable<IResponse> {
    return this.http.get<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/add-company/${providerCode}`
    );
  }

  /**
   * @description API function for Imports Payroll Pay Period.
   */
  importPayrollPayPeriod(companyId: string): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-pay-period/zoho_payroll?company_id=${companyId}`
    );
  }

  /**
   * @description -API function for Initiate the import of payroll transactions for a pay period.
   * @param companyId -Payload for the API
   * @param payrollRunId -Payload for the API
   */
  importPayrollTransactions(
    companyId: string,
    payrollRunId: string
  ): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-pay-period-check/zoho_payroll?companyId=${companyId}&payrollRunId=${payrollRunId}`
    );
  }

  /**
   * @description -API function for Perform the actual deletion of a bank account mapping.
   * @param bankId -Payload for the API
   */
  deleteZohoMappedBank(bankId: string): Observable<IResponse> {
    return this.http.delete<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/bank-account-mapping/zoho_books/${bankId}`
    );
  }

  /**
   * @description API function for Imports bank accounts from the selected company.
   * @param providerCode -Payload for the API
   * @param params -Payload for the API
   * @returns
   */
  importZohoBankAccount(
    providerCode: string,
    params: { companyId: string; type: number }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/${providerCode}?companyId[]=${params.companyId}&type=${params.type}`
    );
  }
  // ZOHO END

  /**
   * Zoho Payroll Start
   */

  /**
   * @description -API function for Import bank accounts from a selected company.
   * @param providerCode -Payload for the API
   * @param params -Payload for the API
   */
  importZohoPayrollAccount(
    providerCode: string,
    params: { companyId: string; type: number }
  ): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import/bank/${providerCode}?companyId=${params.companyId}`
    );
  }

  /**
   * @description -API function for Disconnection of zoho payroll.
   * @param providerCode -Payload for the API
   * @param params -Payload for the API
   */
  disConnectionZohoPayroll(): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/zoho-payroll/disconnect`,
      {}
    );
  }

  /**
   * Zoho Payroll End
   */

  // GUSTO START
  createGustoCompanies(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/integrations/thirdparty-app/create-company/gusto`,
      data
    );
  }

  getMyCompanies(): Observable<IApiRes<IGustoCompanyData[]>> {
    return this.http.get<IApiRes<IGustoCompanyData[]>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/fetch-company/gusto`
    );
  }

  /**
   * @description -API function for Automatically run a Gusto company.
   * @param data -Payload for the API
   */
  autoRunGustoCompany(data: {
    company_id: string;
    status: number;
  }): Observable<IResponse> {
    return this.http.post<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/auto-company-details`,
      data
    );
  }

  /**
   * @description API function for Import the Gusto company.
   * @param providerCode -Payload for thr API
   * @param companyId -Payload for the API
   */
  importGustoCompany(
    providerCode: string,
    companyId: string
  ): Observable<IResponse> {
    return this.http.get<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/add-company/${providerCode}/${companyId}`
    );
  }

  importGustoPayrollTransactions(
    companyId: string,
    payrollRunId: string,
    type: string,
    headerOption?: HttpHeaders
  ): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/gusto?company_id=${companyId}&payroll=${payrollRunId}&gets=${type}`,
      { headers: headerOption }
    );
  }

  /**
   * @description API function for Load Gusto company details for the selected company.
   * @param companyId -Payload for the API.
   * @returns
   */
  viewCompanyData(
    companyId: string
  ): Observable<{ data: IConnectedThirdPartyData }> {
    return this.http.get<{ data: IConnectedThirdPartyData }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/fetch-company/gusto/${companyId}`
    );
  }

  /**
   * @description -API function for Load Gusto payroll details for the selected company and payroll ID.
   * @param providerCode -Payload for the API
   * @param companyId -Payload for the API
   * @param PayrollId -Payload for the API
   */
  viewGustoPayroll(
    providerCode: string,
    companyId: string,
    PayrollId: string
  ): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/integrations/thirdparty-app/fetch-payroll/${providerCode}/${companyId}/${PayrollId}`
    );
  }

  /**
   * @description -API function for Fetch mapped bank account data.
   * @param data-Payload for the API
   */
  geGustoBankMappedData(): Observable<IGustoBankMappedData> {
    return this.http.get<IGustoBankMappedData>(
      `${this.ROOT_URL}/integrations/thirdparty-app/gusto-mapping`
    );
  }

  /**
   * @description -API function for Handle Gusto bank account mapping.
   * @param data-Payload for the API
   */
  mapGustoBankAccount(data: {
    bankAccountId: string;
    id: string;
  }): Observable<IResponse> {
    return this.http.post<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/gusto-mapping`,
      data
    );
  }

  /**
   * @description -API function for Handle Gusto bank account update.
   * @param data-Payload for the API
   */
  updateGustoMappedBankAccount(data: {
    bankAccountId: string;
    id: string;
  }): Observable<IResponse> {
    return this.http.put<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/gusto-mapping/${data.id}`,
      { bankAccountId: data.bankAccountId }
    );
  }

  /**
   * @description API function for Deletes a bank account mapping.
   * @param bankId -Payload for the API
   */
  deleteGustoMappedBank(bankId: string): Observable<IResponse> {
    return this.http.delete<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/gusto-mapping/${bankId}`
    );
  }
  // GUSTO END

  // QUICKBOOKS PAYROLL START
  /**
   * @description Fetches the QuickBooks Payroll module card state and every
   * connected company.
   */
  getQuickbooksPayrollDetails(): Observable<IApiRes<IQuickbooksPayrollDetails>> {
    return this.http.get<IApiRes<IQuickbooksPayrollDetails>>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/details`
    );
  }
  /**
   * @description Returns the Intuit authorization URL the browser must be
   * redirected to for Connect / Connect New Company.
   */
  connectQuickbooksPayroll(): Observable<IQuickbooksPayrollConnect> {
    return this.http.get<IQuickbooksPayrollConnect>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/connect`
    );
  }
  /**
   * @description Fetches the pay runs of a company live from Intuit. Drives the
   * payroll list table on screen load and the Fetch Payroll button. Does not
   * create any checks.
   * @param companyId -Intuit realmId of the company the pay runs belong to.
   * @param params -Optional `YYYY-MM-DD` window. Defaults to the last 30 days.
   */
  fetchQuickbooksPayrolls(
    companyId: string,
    params?: { start_date?: string; end_date?: string }
  ): Observable<IQuickbooksPayrollFetchRes> {
    let url = `${this.ROOT_URL}/integrations/quickbooks-payroll/fetch-payrolls/${companyId}`;

    if (params) {
      const queryParams = new URLSearchParams();
      if (params.start_date) {
        queryParams.append('start_date', params.start_date);
      }
      if (params.end_date) {
        queryParams.append('end_date', params.end_date);
      }
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.http.get<IQuickbooksPayrollFetchRes>(url);
  }
  /**
   * @description Creates one check per employee in a pay run, drawn on the
   * bank account mapped to the company. Employees are auto-created as payees
   * and the company LAST RUN is updated. Requires a mapped bank account.
   * @param companyId -Intuit realmId of the company.
   * @param payrollId -Pay run the checks are created from.
   */
  importQuickbooksPayrollTransactions(
    companyId: string,
    payrollId: string
  ): Observable<IQuickbooksPayrollImportRes> {
    return this.http.get<IQuickbooksPayrollImportRes>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/import-transactions/${companyId}?payrollId=${encodeURIComponent(payrollId)}`
    );
  }
  /**
   * @description Lists the company / bank account mappings shown on the
   * QuickBooks Payroll bank account mapping page.
   */
  getQuickbooksPayrollBankMappings(): Observable<
    IApiRes<IQuickbooksPayrollBankMapping[]>
  > {
    return this.http.get<IApiRes<IQuickbooksPayrollBankMapping[]>>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/bank-account-mapping`
    );
  }
  /**
   * @description Maps or updates the bank account of a QuickBooks Payroll
   * company. The same endpoint handles both Map Now and edit.
   * @param data -Mapping row id and the bank account to map to it.
   */
  mapQuickbooksPayrollBankAccount(data: {
    id: string;
    bankAccountId: string;
  }): Observable<IQuickbooksPayrollActionRes> {
    return this.http.post<IQuickbooksPayrollActionRes>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/bank-account-mapping`,
      data
    );
  }
  /**
   * @description Removes a QuickBooks Payroll company / bank account mapping.
   * @param id -Mapping row id.
   */
  deleteQuickbooksPayrollBankMapping(
    id: string
  ): Observable<IQuickbooksPayrollActionRes> {
    return this.http.delete<IQuickbooksPayrollActionRes>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/bank-account-mapping/${id}`
    );
  }
  /**
   * @description Removes a connected QuickBooks Payroll company along with its
   * mapping and settings. Already imported pay periods are kept as history.
   * @param companyId -Intuit realmId of the company.
   */
  deleteQuickbooksPayrollCompany(
    companyId: string
  ): Observable<IQuickbooksPayrollActionRes> {
    return this.http.delete<IQuickbooksPayrollActionRes>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/companies/${companyId}`
    );
  }
  /**
   * @description Disconnects the whole QuickBooks Payroll integration, removing
   * every connected company and its settings.
   */
  disconnectQuickbooksPayroll(): Observable<IQuickbooksPayrollActionRes> {
    return this.http.post<IQuickbooksPayrollActionRes>(
      `${this.ROOT_URL}/integrations/quickbooks-payroll/disconnect`,
      {}
    );
  }
  // QUICKBOOKS PAYROLL END

  /**
   * @description API function for zoho, gusto and xero start
   * @param providerCode -Payload for the API
   */
  getDetails(
    providerCode: string
  ): Observable<IApiRes<IConnectedThirdPartyData>> {
    return this.http.get<IApiRes<IConnectedThirdPartyData>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/details/${providerCode}`
    );
  }

  /**
   * @description API function for Handles the callback from FreshBooks authentication.
   * @param queryParam -Payload for the API
   * @param providerCode -Payload for the API
   */
  connectCallBack(
    queryParam: string,
    providerCode: string
  ): Observable<IResponse> {
    return this.http.get<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/callback/${providerCode}?${queryParam}`
    );
  }

  /**
   * @description API function for Initiate the connection to FreshBooks.
   * @param -Payload for the API
   */
  getConnectionUrl(providerCode: string): Observable<IgetConnectionUrl> {
    return this.http.get<IgetConnectionUrl>(
      `${this.ROOT_URL}/integrations/thirdparty-app/connect/${providerCode}`
    );
  }

  disconnect(): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/integrations/thirdparty-app/zoho-books/disconnect`,
      {}
    );
  }

  disConnect(providerCode: string, data = {}): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/disconnect/${providerCode}`,
      data
    );
  }

  /**
   * @description -API function for Fetch Gusto payroll data for the selected company.
   * @param providerCode -Payload for the API
   * @param companyId -Payload for the API
   */
  getPayroll(providerCode: string, companyId: string, off_cycle_only?: boolean): Observable<any> {
    let url = `${this.ROOT_URL}/integrations/thirdparty-app/fetch-payroll/${providerCode}/${companyId}`
    const params: { off_cycle_only?: boolean } = {};
    if (off_cycle_only === true) {
      params.off_cycle_only = true;
    }
    return this.http.get<any>(
      url, {params}
    );
  }

  /**
   * @description -API function for Fetch imported Gusto payroll
   *
   */
  getImportedPayrolls(): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/integrations/thirdparty-app/get-imported-payrolls/gusto`
    );
  }

  /**
   * @description API function for Retrieve the list of mapped bank accounts.
   */
  getBankAccountMapping(): Observable<IMappingBankAccountRes> {
    return this.http.get<IMappingBankAccountRes>(
      `${this.ROOT_URL}/integrations/thirdparty-app/get-bank-account-mapping/zoho_books`
    );
  }

  /**
   * @description API function for Delete a Gusto company.
   * @param companyId -Payload for the API
   * @returns
   */
  deleteGustoCompany(companyId: string): Observable<IResponse> {
    return this.http.delete<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/delete-gusto-company/${companyId}`
    );
  }

  //XERO START

  /**
   * @description -API function for Send a request to import data to Xero.
   * @param data -Payload for the API
   */
  getImportXeroCompanies(data: {
    importTime: number;
    companyId: string | string[];
    importBill: number | string;
  }): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/xero?importTime=${data.importTime}&companyId[]=${data.companyId}&importBill=${data.importBill}`
    );
  }

  /**
   * @description -API function for Disconnect a company from Xero.
   * @param data -Payload for the API
   * @returns
   */
  disConnectXero(data = {}): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/xero/disconnect`,
      data
    );
  }

  /**
   * @description API function for Retrieve mapped bank account data.
   */
  getBankAccountMappingXero(): Observable<{
    success: boolean;
    data: IbankAccountList[];
  }> {
    return this.http.get<{ success: boolean; data: IbankAccountList[] }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/get-bank-account-mapping/xero`
    );
  }

  /**
   * @description API function for Perform the deletion of a bank account.
   * @param bankId -Payload for the API
   * @returns
   */
  deleteXeroMappedBank(bankId: string): Observable<IResponse> {
    return this.http.delete<IResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/bank-account-mapping/xero/${bankId}`
    );
  }

  /**
   * @description -API function for Submit the bank account mapping request to Xero.
   * @param data -payload for the API
   */
  mapXeroBankAcc(data: {
    bank_account: string;
    id: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/bank-account-mapping/xero`,
      data
    );
  }

  /// XERO setting

  /**
   * @description -API function for Retrieve Xero settings and populates the form.
   */
  getXeroSettings(): Observable<IXeroSettings> {
    return this.http.get<IXeroSettings>(
      `${this.ROOT_URL}/integrations/thirdparty-app/settings`
    );
  }

  /***
   * @description -API function for Post Xero settings data to update auto-downloading configuration.
   */
  PostXeroSettings(data: { xero_webhook: number }): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.ROOT_URL}/integrations/thirdparty-app/settings`,
      data
    );
  }

  //XERO END

  /**
   * @description -API function for Import payee details from a specific company.
   * @param data -Payload for the API
   */
  getImportWaveCompanies(data: {
    importTime: number;
    companyId: string;
    importType: number;
  }): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/wave?companyId[]=${data.companyId}&importType=${data.importType}`
    );
  }

  /**
   * @description -API function for Disconnect from Wave.
   * @param data -Payload for the API
   * @returns
   */
  disConnectWave(data = {}): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/wave/disconnect`,
      data
    );
  }

  //WAVE END

  // ZOHO, GUSTO AND XERO END / AND WAVE

  // All IMPORT
  thirdpPartyTransactionImporting(
    providerCode: string,
    params: IThirdPartyTransactionBody
  ): Observable<{
    success: boolean;
    message: string;
    companyWithError: string[];
  }> {
    let paramsUrlStr = ``;
    let companyStr = `companyId[]=`;
    params.companyId.forEach((ele, i) => {
      if (i === 0) {
        companyStr += `${ele}`;
      } else {
        companyStr += `&companyId[]=${ele}`;
      }
    });

    if (providerCode === 'xero') {
      paramsUrlStr = `&importTime=${params.importTime}&importBill=${params.importBill}&importStatus=${params.importStatus}`;
    } else if (providerCode === 'zoho_books') {
      if (params.type === 3) {
        paramsUrlStr = `&importTime=${params.importTime}&type=${params.type}&invoice_status=${params.invoice_status}`;
      } else if (params.type === 2) {
        paramsUrlStr = `&importTime=${params.importTime}&type=${params.type}&bill_status=${params.bill_status}`;
      } else if (params.type === 1) {
        paramsUrlStr = `&importTime=${params.importTime}&type=${params.type}&markAsPrintLater=${params.markAsPrintLater}`;
      }
    } else if (providerCode === 'freshbooks') {
      paramsUrlStr = `&importTime=${params.importTime}&importType=${params.importBill}&importStatus=${params.importStatus}`;
    } else if (providerCode === 'sage_business') {
      paramsUrlStr = `&importTime=${params.importTime}&importType=${params.importBill}&importStatus=${params.importStatus}`;
    } else if (providerCode === 'wave') {
      paramsUrlStr = `&importTime=${params.importTime}&importType=${params.importBill}&importStatus=${params.importStatus}`;
    }
    return this.http.get<{
      success: boolean;
      message: string;
      companyWithError: string[];
    }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/${providerCode}?` +
        companyStr +
        paramsUrlStr
    );
  }
  //END
  // Bill.com start
  getBillOrgs(): Observable<IApiRes<IBillOrg[]>> {
    return this.http.get<IApiRes<IBillOrg[]>>(
      `${this.ROOT_URL}/integrations/bill-com/organization`
    );
  }

  /**
   * @description -API function for Submit the form data to connect to Bill.com.
   * @param body -Payload for the API
   */
  connectBilldotCom(body: {
    userName: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/integrations/bill-com/`, body);
  }

  /**
   * @description -API function for Post data to `importFromBilldotCom`
   * @param body -Payload fro the API
   */
  importFromBilldotCom(body: {
    orgId: string[];
    importTime: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/bill-com/bill`,
      body
    );
  }

  /**
   * @description -API function for Initiate the disconnection of a Bill.com organization.
   * @param id -Payload for the API
   * @returns
   */
  disconnectBilldotCom(id: string): Observable<IResponse> {
    return this.http.delete<IResponse>(
      `${this.ROOT_URL}/integrations/bill-com/${id}`
    );
  }
  // Bill.com end

  //QBDesktop Version handling
  static qbDesktopOldVersion = signal<boolean>(
    IntegrationService.getQBDData()?.isOldVersion ?? false
  );

  static setQBDData(QBDData: { isOldVersion: boolean }): void {
    new LocalStorageService().setItem('QBDversion', QBDData);
    IntegrationService.qbDesktopOldVersion.set(QBDData.isOldVersion);
  }

  static getQBDData(): any {
    let QBDData = { isOldVersion: false };

    QBDData = new LocalStorageService().getItem('QBDversion');

    return QBDData;
  }
  static getQBDesktopRoutingLinks(): string {
    const QBDData = this.getQBDData();
    if (QBDData?.isOldVersion) {
      return '/manage/thirdparty_app/qb_desktop_old';
    } else {
      return '/manage/thirdparty_app/qb_desktop';
    }
  }

  // Freshbooks start....//

  /**
   * @description -API function for disconnect Freshbooks
   * @param data -Payload for the API
   */
  disConnectFreshbooks(data = {}): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/freshbook/disconnect`,
      data
    );
  }

  /**
   * @description API function for Retrieves FreshBooks integration settings.
   */
  getFreshBooksSettings(): Observable<IApiRes<IFreshBookSettings>> {
    return this.http.get<IApiRes<IFreshBookSettings>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/settings`
    );
  }

  /**
   * @description API function for Post FreshBooks settings data.
   * @param data -Payload for the API
   */
  PostFreshBooksSettings(data: {
    freshbook_webhook: number;
    fb_push_back_enable: number;
  }): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/settings`,
      data
    );
  }

  /**
   * @description API function for Import payee data from FreshBooks.
   */
  importFreshBookPayee(payload:{companyIds: string[]}): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/freshbooks/import-payees`,
      payload
    );
  }

  /**
   * @description API function for Import category data from FreshBooks.
   */
  importFreshBookCategories(payload:{companyIds: string[]}): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/freshbooks/import-categories`,
      payload
    );
  }

  getCategoriesList(companyId: string): Observable<IApiRes<{id: string, name: string}[]>> {
    return this.http.get<IApiRes<{id: string, name: string}[]>>(
      `${this.ROOT_URL}/integrations/freshbooks/categories/${companyId}`
    );
  }

  exportFreshBookChecks(payload:{checkIds: string[]}): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/freshbooks/export-checks`,
      payload
    );
  }

  /**
   * @description -API function for Track the request for a third-party integration.
   * @param body -Payload for the API
   * @returns
   */
  thirdPartyIntegrationRequest(body: {
    appName: string;
  }): Observable<IThirdPartyIntegrationTracking> {
    return this.http.post<IThirdPartyIntegrationTracking>(
      `${this.ROOT_URL}/integrations/track-requests`,
      body
    );
  }

  /**
   * @description -API function for Disconnect from Sage Business.
   * @param providerCode -Payload for the API
   */
  disconnectCompany(
    providerCode: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/${providerCode}/disconnect`,
      {}
    );
  }

  /**
   * @description -API function for Fetch mapped bank account data.
   * @param providerCode -Payload for the API
   * @returns
   */
  getBankAccountMappingList(
    providerCode: string
  ): Observable<IApiRes<IMappingBankAccount[]>> {
    return this.http.get<IApiRes<IMappingBankAccount[]>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/get-bank-account-mapping/${providerCode}`
    );
  }

  /**
   * @description -API function for Submit the mapped bank account.
   * @param data -Payload for the API
   * @param providerCode -Payload for the API
   */
  mapBankAccount(
    data: { bank_account: string; id: string },
    providerCode: string
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/bank-account-mapping/${providerCode}`,
      data
    );
  }

  /**
   * @description -API function for Perform the delete action for a bank account.
   * @param providerCode -Payload for the API
   * @param bankId -Payload for the API
   */
  deleteMappedBank(
    providerCode: string,
    bankId: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/bank-account-mapping/${providerCode}/${bankId}`
    );
  }

  /**
   * @description -API function for Import payee data from a specific company in Sage Business.
   * @param data -Payload for the API
   * @param providerCode -Payload for the API
   */
  getImportBankAccounts(
    data: { companyId: string; importType: number },
    providerCode: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/${providerCode}?companyId[]=${data.companyId}&importType=${data.importType}`
    );
  }

  /**
   * @description -API function for Initiate the connection to Microsoft Dynamics service.
   * @param appName -Payload for the API
   * @returns
   */
  connectToService(appName: string): Observable<IApiRes<IFreeAgentData>> {
    return this.http.get<IApiRes<IFreeAgentData>>(
      `${this.ROOT_URL}/integrations/merge/create-unified-link-token/${appName}`
    );
  }

  getAccountToken(token: string): Observable<IApiRes<IFreeAgentData>> {
    return this.http.get<IApiRes<IFreeAgentData>>(
      `${this.ROOT_URL}/integrations/merge/get-unified-account-token/${token}`
    );
  }

  /**
   * @description -API function for Check if Microsoft dynamics 365 is connected and retrieves connection details.
   * @param appName -Payload for the API
   * @returns
   */
  getConnectionDetails(appName: string): Observable<IApiRes<IConnectiontData>> {
    return this.http.get<IApiRes<IConnectiontData>>(
      `${this.ROOT_URL}/integrations/merge/get-app-details/${appName}`
    );
  }

  getAccountsData(
    mode: string,
    appId: string,
    from?: string,
    to?: string,
    page?: number
  ): Observable<IApiRes<IIntegrationData>> {
    if (from && to) {
      return this.http.get<IApiRes<IIntegrationData>>(
        `${this.ROOT_URL}/integrations/merge/get-data/${appId}?type=${mode}&fromDate=${from}&toDate=${to}&page=${page}`
      );
    } else {
      return this.http.get<IApiRes<IIntegrationData>>(
        `${this.ROOT_URL}/integrations/merge/get-data/${appId}?type=${mode}&page=${page}`
      );
    }
  }

  /**
   * @description -API function for import third partyData
   * @param body -Payload for the API
   * @param appId -Payload for the API
   */
  importData(body: object, appId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/import-data/${appId}`,
      body
    );
  }

  /**
   * @description -Disconnects a merge payroll integration with the specified App ID.
   * @param appId  - The unique identifier of the payroll integration to disconnect.
   */
  disconnectConnection(appId: string): Observable<IApiRes<IFreeAgentData>> {
    return this.http.post<IApiRes<IFreeAgentData>>(
      `${this.ROOT_URL}/integrations/merge/disconnect-app/${appId}`,
      {}
    );
  }

  /**
   * @description -Disconnects a manual payroll integration with the specified App ID.
   * @param appId  - The unique identifier of the payroll integration to disconnect.
   */
  disconnectManualConnection(
    appId: string
  ): Observable<IApiRes<IFreeAgentData>> {
    return this.http.post<IApiRes<IFreeAgentData>>(
      `${this.ROOT_URL}/integrations/merge/disconnect-manual-payroll/${appId}`,
      {}
    );
  }

  /**
   * API function for gusto connection
   */
  openGusto() {
    return this.http.get<IApiResWithMsg<{ url: string }>>(
      `${this.ROOT_URL}/integrations/gusto/connect`
    );
  }

  /**
   * API function for zoho connection
   */
  openZoho() {
    return this.http.get<IApiResWithMsg<{ url: string }>>(
      `${this.ROOT_URL}/integrations/zoho-payroll/connect`
    );
  }

  /**
   * API function for gusto payments
   */
  getPaymentsForGusto(id: string) {
    return this.http.get<IApiResWithMsg<IGustoPaymentsList>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/gusto/fetch-contractor-payments/${id}`
    );
  }

  /**
   * API function for gusto import contractor payment
   */
  importGustoContractorPayment(createCheckPayload: {
    companyId: string;
    contractorId: string;
  }) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/gusto/import-contractor-payments`,
      createCheckPayload
    );
  }

  /**
   * API function for gusto import contractor payment
   */
  getGustoPaymentDetails(companyId: string, contractorId: string) {
    return this.http.get<IApiRes<IGustoPaymentsList>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/gusto/fetch-contractor-payment/${companyId}/${contractorId}`
    );
  }

  /**
   * @description API function for Initiate the connection to square.
   * @param -Payload for the API
   */
  getConnectionUrlForSquare(): Observable<IApiRes<{ url: string }>> {
    return this.http.get<IApiRes<{ url: string }>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/square/connect`
    );
  }

  /**
   * @description API function for getting square integration details.
   * @param -Payload for the API
   */
  getSquareDetails(): Observable<IApiRes<{ id: string; connected: number }>> {
    return this.http.get<IApiRes<{ id: string; connected: number }>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/square/details`
    );
  }

  /**
   * @description API function for disconnecting square.
   * @param -Payload for the API
   */
  disconnectSquare(): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/square/disconnect-square`,
      {}
    );
  }

  /**
   * @description API function for disconnecting square.
   * @param -Payload for the API
   */
  importFromSquare(payload: {
    importTime?: number;
    type: number;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/square/import`,
      payload
    );
  }

  // =================== SALESFORCE INTEGRATION START ===================

  /**
   * @description Get Salesforce OAuth authorization URL
   * @returns Observable with authorization URL
   */
  getSalesforceAuthUrl(): Observable<IApiRes<ISalesforceAuthUrlResponse>> {
    return this.http.get<IApiRes<ISalesforceAuthUrlResponse>>(
      `${this.ROOT_URL}/integrations/salesforce/auth-url`
    );
  }

  /**
   * @description Handle OAuth callback from Salesforce
   * @param code - Authorization code from Salesforce
   * @returns Observable with account data
   */
  salesforceCallback(code: string): Observable<IApiRes<ISalesforceAccount>> {
    return this.http.post<IApiRes<ISalesforceAccount>>(
      `${this.OUTSIDE_ROOT_URL}/outside/salesforce/callback`,
      { code }
    );
  }

  /**
   * @description Get all connected Salesforce accounts
   * @returns Observable with array of Salesforce accounts
   */
  getSalesforceAccounts(): Observable<IApiRes<ISalesforceAccount[]>> {
    return this.http.get<IApiRes<ISalesforceAccount[]>>(
      `${this.ROOT_URL}/integrations/salesforce/accounts`
    );
  }

  /**
   * @description Disconnect a Salesforce account
   * @param accountId - Encrypted Salesforce account ID
   * @returns Observable with success message
   */
  disconnectSalesforce(accountId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/salesforce/${accountId}/disconnect`,
      {}
    );
  }

  /**
   * @description Refresh Salesforce access token
   * @param accountId - Encrypted Salesforce account ID
   * @returns Observable with success message
   */
  refreshSalesforceToken(accountId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/salesforce/${accountId}/refresh-token`,
      {}
    );
  }

  /**
   * @description Sync contacts from Salesforce
   * @param accountId - Encrypted Salesforce account ID
   * @returns Observable with sync result
   */
  syncSalesforceContacts(
    accountId: string
  ): Observable<IApiRes<ISalesforceSyncContactsResponse>> {
    return this.http.post<IApiRes<ISalesforceSyncContactsResponse>>(
      `${this.ROOT_URL}/integrations/salesforce/${accountId}/sync-contacts`,
      {}
    );
  }

  /**
   * @description Get synced contacts for a Salesforce account
   * @param accountId - Encrypted Salesforce account ID
   * @param page - Page number (default 1)
   * @param perPage - Items per page (default 10)
   * @returns Observable with paginated contacts
   */
  getSalesforceContacts(
    accountId: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<ISalesforceContactsResponse> {
    return this.http.get<ISalesforceContactsResponse>(
      `${this.ROOT_URL}/integrations/salesforce/${accountId}/contacts?page=${page}&perPage=${perPage}`
    );
  }

  /**
   * @description Issue check - create mapping between contact and payee
   * @param contactId - Encrypted contact ID
   * @returns Observable with issue check response containing payeeId
   */
  salesforceIssueCheck(
    contactId: string
  ): Observable<IApiRes<ISalesforceIssueCheckResponse>> {
    return this.http.post<IApiRes<ISalesforceIssueCheckResponse>>(
      `${this.ROOT_URL}/integrations/salesforce/issue-check`,
      { contact_id: contactId }
    );
  }

  // =================== SALESFORCE INTEGRATION END ===================

  // =================== HUBSPOT INTEGRATION START ===================

  /**
   * @description Get HubSpot OAuth authorization URL
   * @returns Observable with authorization URL
   */
  connectToHubSpot(): Observable<{success: boolean, redirectUrl: string}> {
    return this.http.get<{success: boolean, redirectUrl: string}>(
      `${this.ROOT_URL}/integrations/thirdparty-app/connect/hubspot`
    );
  }

  /**
   * @description Handle OAuth callback from HubSpot
   * @param code - Authorization code from HubSpot
   * @param state - State parameter from HubSpot
   * @returns Observable with success response
   */
  hubSpotCallback(code: string, state: string): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/callback/hubspot?code=${code}&state=${state}`
    );
  }

  /**
   * @description Get HubSpot provider details and connected companies
   * @returns Observable with provider and companies data
   */
  getHubSpotCompanies(page: number = 1, perPage: number = 10, company_id?: string[]): Observable<IHubSpotCompaniesResponse> {
    let queryParams = `page=${page}&perPage=${perPage}`;
    if (company_id && company_id.length > 0) {
      const companyIdQuery = company_id.map(id => `company_id[]=${encodeURIComponent(id)}`).join('&');
      queryParams += `&${companyIdQuery}`;
    }
    return this.http.get<IHubSpotCompaniesResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/hubspot/companies?${queryParams}`
    );
  }

  getHubspotDeals(): Observable<IApiRes<IHubSpotDetailsResponse>> {
    return this.http.get<IApiRes<IHubSpotDetailsResponse>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/hubspot/deals`
    );
  }

  /**
   * @description Add a new HubSpot company
   * @returns Observable with success response
   */
  addHubSpotCompany(): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/add-company/hubspot`
    );
  }

  /**
   * @description Import HubSpot transactions
   * @param companyId - HubSpot company ID
   * @param importType - Import type (1 => contacts, 2 => companies, 3 => deals)
   * @returns Observable with success response
   */
  importHubSpotTransactions( importType: '1' | '2' | '3',companyId?: string[]): Observable<IApiResMesssage> {
    const companyIdQuery = companyId ?
      companyId?.map(id => `company_id[]=${encodeURIComponent(id)}`)
      .join('&') : '';

    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/hubspot?${companyIdQuery}&import_type=${importType}`
    );
  }

  /**
   * @description Disconnect HubSpot
   * @returns Observable with success response
   */
  disconnectHubSpot(): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/disconnect/hubspot`,
      {}
    );
  }

  disconnectWorkspace(workspaceId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/hubspot/disconnect/${workspaceId}`,
      {}
    );
  }

  // =================== HUBSPOT INTEGRATION END ===================

  // =================== CLIO INTEGRATION START ===================

  /**
   * @description Get Clio OAuth authorization URL
   * @returns Observable with redirect URL
   */
  connectToClio(): Observable<{ success: boolean; redirectUrl: string }> {
    return this.http.get<{ success: boolean; redirectUrl: string }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/connect/clio`
    );
  }

  /**
   * @description Handle OAuth callback from Clio
   * @param code - Authorization code from Clio
   * @param state - State parameter from Clio
   * @returns Observable with success response
   */
  clioCallback(code: string, state: string): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/callback/clio?code=${code}&state=${state}`
    );
  }

  /**
   * @description Add a Clio company account
   * @returns Observable with success response
   */
  addClioCompany(): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/add-company/clio`
    );
  }

  /**
   * @description Get Clio contacts with pagination
   * @param page - Current page number
   * @param perPage - Items per page
   * @param company_id - Array of company IDs to filter by
   * @returns Observable with contacts response
   */
  getClioContacts(page: number, perPage: number, company_id?: string[]): Observable<IClioContactsResponse> {
    return this.http.get<IClioContactsResponse>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/clio?import_type=1&company_id[]=${company_id?.join(',')}`
    );
  }

  /**
   * @description Import Clio transactions/contacts
   * @param importType - Import type (1 = contacts)
   * @param companyId - Array of Clio company IDs
   * @returns Observable with success response
   */
  importClioTransactions(importType: '1' | '2' | '3', companyId?: string[]): Observable<IApiResMesssage> {
    const companyIdQuery = companyId
      ? companyId.map(id => `company_id[]=${encodeURIComponent(id)}`).join('&')
      : '';
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/clio?import_type=${importType}${companyIdQuery ? `&${companyIdQuery}` : ''}`
    );
  }

  /**
   * @description Disconnect a specific Clio company
   * @param companyId - The company ID to disconnect
   * @returns Observable with success response
   */
  disconnectClio(companyId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/clio/disconnect/${companyId}`,
      {}
    );
  }

  // =================== CLIO INTEGRATION END ===================


  // =================== SLACK INTEGRATION START ===================

  /**
   * @description Connect to Slack
   * @returns Observable with Slack account data
   */
  connectToSlack(): Observable<{success: boolean, redirectUrl: string, message: string }> {
    return this.http.get<{success: boolean, redirectUrl: string, message: string }>(
      `${this.ROOT_URL}/integrations/thirdparty-app/connect/slack`
    );
  }

  /**
   * @description Handle OAuth callback from Slack
   * @param params - Query parameters from Slack
   * @returns Observable with Slack account data
   */
  slackCallback(params: string): Observable<IApiRes<ISlackAccount[]>> {
    return this.http.get<IApiRes<ISlackAccount[]>>(
      `${this.ROOT_URL}/integrations/thirdparty-app/callback/slack?${params}`
    );
  }

/**
 * @description Get all connected Slack accounts
 * @returns Observable with array of Slack accounts
 */
getSlackAccounts(): Observable<IApiRes<ISlackAccount>> {
  return this.http.get<IApiRes<ISlackAccount>>(
    `${this.ROOT_URL}/integrations/thirdparty-app/slack/employees/preview`
  );
}

/**
 * @description Import Slack employees
 * @returns Observable with Slack account data
 */
importSlackEmployees(): Observable<IApiRes<ISlackAccount[]>> {
  return this.http.post<IApiRes<ISlackAccount[]>>(
    `${this.ROOT_URL}/integrations/thirdparty-app/slack/employees/import`,
    {}
  );
}

/**
 * @description Disconnect Slack
 * @returns Observable with success message
 */
disconnectSlack(): Observable<IApiResMesssage> {
  return this.http.post<IApiResMesssage>(
    `${this.ROOT_URL}/integrations/thirdparty-app/slack/disconnect`,
    {}
  );
}

/**
 * @description Issue check for Slack
 * @param employeeId - Slack employee ID
 * @returns Observable with issue check response
 */
issueCheckSlack(employeeId: string): Observable<IApiResWithMsg<ISlackIssueCheckResponse>> {
  return this.http.post<IApiResWithMsg<ISlackIssueCheckResponse>>(
    `${this.ROOT_URL}/integrations/thirdparty-app/slack/issue-check`,
    { employee_id: employeeId }
  );
}

// =================== SLACK INTEGRATION END ===================

  // =================== JOBBER INTEGRATION START ===================

  /**
   * @description Get Jobber OAuth authorization URL
   * @returns Observable with authorization URL
   */
  connectToJobber(): Observable<{success: boolean, redirectUrl: string}> {
    return this.http.get<{success: boolean, redirectUrl: string}>(
      `${this.ROOT_URL}/integrations/thirdparty-app/connect/jobber`
    );
  }

  /**
   * @description Handle OAuth callback from Jobber
   * @param code - Authorization code from Jobber
   * @param state - State parameter from Jobber
   * @returns Observable with success response
   */
  jobberCallback(code: string, state: string): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/callback/jobber?code=${code}&state=${state}`
    );
  }

  /**
   * @description Import Jobber transactions
   * @param importType - Import type (1 => customers, 2 => jobs, 3 => quotes)
   * @param companyId - Array of Jobber company IDs
   * @returns Observable with success response
   */
  importJobberTransactions(importType: '1', companyId?: string[]): Observable<IApiResMesssage> {
    const companyIdQuery = companyId ?
      companyId?.map(id => `company_id[]=${encodeURIComponent(id)}`).join('&') : '';

    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/jobber?import_type=${importType}${companyIdQuery ? `&${companyIdQuery}` : ''}`
    );
  }

  /**
   * @description Disconnect Jobber
   * @returns Observable with success response
   */
  disconnectJobber(): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/jobber/disconnect`,
      {}
    );
  }

  // =================== JOBBER INTEGRATION END ===================

// =================== DAYFORCE INTEGRATION START ===================
  /**
   * @description Connect to Dayforce
   * @returns Observable with Dayforce account data
   */
  connectToDayforce(payload: IDayforceConnection) {
    return this.http.post<IApiRes<IDayforceConnectionResponse>>(
      `${this.dayforceRootUrl}/connect`,
      payload
    );
  }

  getDayforceConnectionDetails(){
    return this.http.get<IApiRes<IDayforceConnectionDetails>>(
      `${this.dayforceRootUrl}/connection-status`
    );
  }

  disconnectDayforce(){
    return this.http.post<IApiResMesssage>(
      `${this.dayforceRootUrl}/disconnect`,
      {}
    );
  }

  importDayforceData(payload: { payPeriodStartDate: string }) {
    return this.http.post<IApiRes<{message: string, total_employees: number}>>(
      `${this.dayforceRootUrl}/import-data`,
      payload
    );
  }

  importDayforcePayees() {
    return this.http.post<IApiRes<{message: string, total_employees: number}>>(
      `${this.dayforceRootUrl}/import-employees`,
      {}
    );
  }

  importDayforceLocations() {
    return this.http.post<IApiRes<{message: string, already_imported: number}>>(
      `${this.dayforceRootUrl}/import-locations`,
      {}
    );
  }

  getDayforceLocations() {
    return this.http.get<IApiRes<IDayforceLocations[]>>(
      `${this.dayforceRootUrl}/location-mappings`
    );
  }

  mapDayforceLocation(payload: { locationXRefCode: string; companyUserId: string; bankAccountId: string }) {
    return this.http.post<IApiResMesssage>(
      `${this.dayforceRootUrl}/map-location`,
      payload
    );
  }

  clearDayforceLocation(payload: { locationId: string }) {
    return this.http.post<IApiResMesssage>(
      `${this.dayforceRootUrl}/clear-location-mapping`,
      payload
    );
  }

  deleteDayforceLocation(payload: { locationId: string }) {
    return this.http.post<IApiResMesssage>(
      `${this.dayforceRootUrl}/delete-location`,
      payload
    );
  }

  // =================== DAYFORCE INTEGRATION END ===================

  // =================== SHOPIFY INTEGRATION START ===================

  /**
   * @description Connect to Shopify
   * @param shop - Shopify store domain
   * @returns Observable with Shopify connection URL
   */
  connectToShopify(shop?: string): Observable<IgetConnectionUrl> {
    return this.http.get<IgetConnectionUrl>(
      `${this.ROOT_URL}/integrations/thirdparty-app/connect/shopify?shop=${encodeURIComponent(shop || '')}`
    );
  }

  /**
   * @description Handle Shopify OAuth callback
   * @param code - Authorization code from Shopify
   * @param state - State parameter from Shopify
   * @param shop - Shopify store domain
   * @returns Observable with success response
   */
  shopifyCallback(code: string, state: string, shop: string): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/callback/shopify?code=${code}&state=${state}&shop=${encodeURIComponent(shop)}`
    );
  }

  /**
   * @description Add Shopify company
   * @returns Observable with success response
   */
  addShopifyCompany(): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/add-company/shopify`
    );
  }

  /**
   * @description Import Shopify customers
   * @param companyIds - Array of Shopify company IDs
   * @returns Observable with success response
   */
  importShopifyCustomers(companyIds: string[]): Observable<IApiResMesssage> {
    const query = companyIds.map(id => `company_id[]=${encodeURIComponent(id)}`).join('&');
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/import-transactions/shopify?${query}`
    );
  }

  /**
   * @description Disconnect Shopify store
   * @param companyId - Shopify company ID
   * @returns Observable with success response
   */
  disconnectShopifyStore(companyId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/shopify/disconnect/${encodeURIComponent(companyId)}`,
      {}
    );
  }

  /**
   * @description Disconnect Shopify
   * @returns Observable with success response
   */
  disconnectShopify(): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/thirdparty-app/disconnect/shopify`,
      {}
    );
  }

  // =================== SHOPIFY INTEGRATION END ===================

}


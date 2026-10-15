import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import {
  IAllCompanies,
  IInvitedCompany,
  IOwnCompany
} from 'src/app/layout/model/header';
import {
  ICancelDelete,
  IDeletedCompanies,
  IDeletedCompany,
  IOnboardingLinkPayload,
  IOnboardingLinkRes
} from '../../company-management/model/company-managment';
import { IPendingPolicy, IPolicy } from '../model/company-switch';

@Injectable({
  providedIn: 'root'
})
export class CompanySwitchRepository {
  ROOT_URL = environment.rootUrl;
  localStorageService = inject(LocalStorageService);
  pendingPolicy = new BehaviorSubject<number>(0);
  private http = inject(HttpClient);

  /**
   * Retrieves a list of policies.
   * @returns Observable containing policy list.
   */
  getPolicies(): Observable<IApiRes<IPolicy[]>> {
    return this.http.get<IApiRes<IPolicy[]>>(`${this.ROOT_URL}/policies`);
  }

  /**
   * Notifies the server that the policy has been accepted.
   * @returns Observable indicating the success of the operation.
   */
  setPolicyAccepted(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/policies`,
      {}
    );
  }

  /**
   * Retrieves information about pending policies.
   * @returns Observable with information about pending policies.
   */
  getPolicyPending(): Observable<IPendingPolicy> {
    return this.http.get<IPendingPolicy>(`${this.ROOT_URL}/policies/decision`);
  }

  /**
   * Retrieves a list of all companies.
   * @returns Observable with company list.
   */
  getAllCompanies(): Observable<IApiRes<IAllCompanies>> {
    return this.http.get<IApiRes<IAllCompanies>>(
      `${this.ROOT_URL}/company-management/companies`
    );
  }

  /**
   * Removes access to a company.
   * @param id - The ID of the company.
   * @returns Observable indicating the success of the operation.
   */
  removeAccess(id: string): Observable<IApiResMesssage> {
    const data = new FormData();
    data.append('client_management_id', id);
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/company-management/remove-access/`,
      data
    );
  }

  /**
   * Accepts an invitation from a company.
   * @param id - The ID of the company.
   * @returns Observable indicating the success of the operation.
   */
  acceptCompany(id: string): Observable<IApiResMesssage> {
    const data = new FormData();
    data.append('clientManagementId', id);
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/company-management/accept`,
      data
    );
  }

  /**
   * Rejects an invitation from a company.
   * @param id - The ID of the company.
   * @returns Observable indicating the success of the operation.
   */
  rejectCompany(id: string): Observable<IApiResMesssage> {
    const data = new FormData();
    data.append('clientManagementId', id);
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/company-management/reject`,
      data
    );
  }

  /**
   * Resends an invitation to a company.
   * @param id - The ID of the company.
   * @returns Observable indicating the success of the operation.
   */
  resendInvitation(id: string): Observable<IApiResMesssage> {
    const data = new FormData();
    data.append('client_management_id', id);
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/company-management/resent-invitation/`,
      data
    );
  }

  /**
   * Requests to reject an invitation from a company.
   * @param id - An object containing the client management ID.
   * @returns Observable indicating the success of the operation.
   */
  requestReject(id: {
    clientManagementId: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/company-management/reject`,
      id
    );
  }

  /**
   * Retrieves a list of companies owned by the user.
   * @returns Observable with the list of owned companies.
   */
  getOwnCompanies(): Observable<IApiRes<IOwnCompany[]>> {
    return this.http.get<IApiRes<IOwnCompany[]>>(
      `${this.ROOT_URL}/company-management/own-companies`
    );
  }

  /**
   * Retrieves a list of deleted companies.
   * @returns Observable with the list of deleted companies.
   */
  getDeletedCompanies(): Observable<IApiRes<IDeletedCompanies[]>> {
    return this.http.get<IApiRes<IDeletedCompanies[]>>(
      `${this.ROOT_URL}/company-management/deleted-companies`
    );
  }

  /**
   * Retrieves a list of invited companies.
   * @returns Observable with the list of invited companies.
   */
  getInvitedCompanies(): Observable<IApiRes<IInvitedCompany[]>> {
    return this.http.get<IApiRes<IInvitedCompany[]>>(
      `${this.ROOT_URL}/company-management/invited-companies`
    );
  }

  /**
   * Adds a new company.
   * @param companyName - The name of the new company.
   * @returns Observable indicating the success of the operation.
   */
  addNewCompany(
    companyName: string,
    headerOption?: HttpHeaders
  ): Observable<IApiRes<IOwnCompany>> {
    return this.http.post<IApiRes<IOwnCompany>>(
      `${this.ROOT_URL}/company-management/add-companies/`,
      { companyName },
      { headers: headerOption }
    );
  }

  /**
   * Retrieves details of a specific company.
   * @param id - The ID of the company.
   * @returns Observable with details of the company.
   */
  getCompaniesDetails(id: string): Observable<IApiRes<IOwnCompany>> {
    return this.http.get<IApiRes<IOwnCompany>>(
      `${this.ROOT_URL}/company-management/${id}/details`
    );
  }

  /**
   * Deletes a company.
   * @param id - The ID of the company.
   * @param password - The password for authentication.
   * @returns Observable indicating the success of the operation.
   */
  deleteCompany(
    id: string,
    password: string
  ): Observable<IApiRes<IDeletedCompany>> {
    return this.http.post<IApiRes<IDeletedCompany>>(
      `${this.ROOT_URL}/company-management/${id}/delete-companies`,
      { password }
    );
  }

  /**
   * Cancels the deletion of a company.
   * @param id - The ID of the company.
   * @param password - The password for authentication.
   * @returns Observable indicating the success of the operation.
   */
  cancelDeleteCompany(
    id: string,
    data: { password: string }
  ): Observable<IApiRes<ICancelDelete>> {
    return this.http.post<IApiRes<ICancelDelete>>(
      `${this.ROOT_URL}/company-management/${id}/cancel-deletion`,
      data
    );
  }

  /**
   * Updates the name of a company.
   * @param id - The ID of the company.
   * @param companyName - The updated name of the company.data
   * @returns Observable indicating the success of the operation.
   */
  updateCompany(id: string, companyName: string): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/company-management/${id}/update-companies`,
      { companyName }
    );
  }

  /**
   * Updates the business information of a company.
   * @param id - The ID of the company.
   * @param businessIfo - The updated business information.
   * @returns Observable indicating the success of the operation.
   */
  updateCompanyBusiness(
    id: string,
    businessIfo: any
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/company-management/${id}/business-info`,
      businessIfo
    );
  }

  /**
   * Retrieves information about intro modals.
   * @returns Observable with information about intro modals.
   */
  showIntroModals(): Observable<IApiRes<{ showNpsModal: number }>> {
    return this.http.get<IApiRes<{ showNpsModal: number }>>(
      `${this.ROOT_URL}/show-modal/`
    );
  }

  /**
   * Generates an enterprise onboarding link for a company, optionally emailing it.
   * @param payload - customerRef, plus sendEmail/email when the link should be emailed.
   * @returns Observable with the generated link details.
   */
  generateOnboardingLink(
    payload: IOnboardingLinkPayload
  ): Observable<IOnboardingLinkRes> {
    return this.http.post<IOnboardingLinkRes>(
      `${this.ROOT_URL}/developer/enterprise/onboarding-link`,
      payload
    );
  }

  checkIpPermission(userId:string, companyId: string) {
    return this.http.get<{success:boolean}>(`${this.ROOT_URL}/${userId}/whitelist-ips/${companyId}`);
  }

  checkCompanyAccessPermission(companyId: string) {
    return this.http.get<IApiRes<{success:boolean,access:number,errorMsg:string,errorCode:number}>>(`${this.ROOT_URL}/company-management/company-access/${companyId}`);
  }

}

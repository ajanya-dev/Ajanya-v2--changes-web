import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IAccountsPermission,
  IAccountsPermissionPayload,
  IActivityExportPayload,
  IAddMultiLevelPolicyData,
  IAddPolicyData,
  IApprovalRequest,
  IApproveUserData,
  IApprovers,
  IExistingRules,
  IGetWhiteListIp,
  ISelectedPermissionsData,
  IUserActivity,
  IUserActivityPaginationPayload,
  IUsersList
} from 'src/app/models/user';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  userTypes = [
    { value: 0, name: 'All' },
    { value: 1, name: 'User' },
    { value: 2, name: 'Accountant' },
    { value: 3, name: 'Client' },
    { value: 4, name: 'Clerk' },
    { value: 5, name: 'Approver' }
  ];

  getUserType(client_type: number) {
    let clientName = '';
    for (const user of this.userTypes) {
      if (user.value === client_type) {
        clientName = user.name;
        return clientName;
      } else {
        clientName = '';
      }
    }
    return clientName;
  }

  getUsersList(
    type: number,
    searchTerm: string
  ): Observable<IApiRes<IUsersList[]>> {
    return this.http.get<IApiRes<IUsersList[]>>(
      `${this.ROOT_URL}/users/users-list?type=${type}&search=${searchTerm}`
    );
  }

  resendInvite(
    userId: string
  ): Observable<{ message: string; success: boolean }> {
    return this.http.post<{ message: string; success: boolean }>(
      `${this.ROOT_URL}/users/${userId}/resend-invite`,
      {}
    );
  }

  deleteSingleUser(
    userId: string
  ): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(
      `${this.ROOT_URL}/users/${userId}`
    );
  }

  deleteMultipleUsers(
    userIds: string[]
  ): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(
      `${this.ROOT_URL}/users`,
      { body: userIds }
    );
  }

  approveUser(userId: string): Observable<IApiRes<IApproveUserData>> {
    return this.http.post<IApiRes<IApproveUserData>>(
      `${this.ROOT_URL}/users/${userId}/approve-accountant`,
      {}
    );
  }

  getAuditTrail(userId: string, paginationPayload?: IUserActivityPaginationPayload): Observable<IApiRes<IUserActivity>> {
    return this.http.post<IApiRes<IUserActivity>>(
      `${this.ROOT_URL}/users/${userId}/audit-trail`,
      paginationPayload
    );
  }

  userDatewiseActivities(id: string, paginationPayload?: IUserActivityPaginationPayload): Observable<IApiRes<any>> {
    return this.http.post<IApiRes<IUserActivity>>(
      `${this.ROOT_URL}/users/${id}/audit-trail?filter=date`,
      paginationPayload
    );
  }

  getPermissions(page:number): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/users/list-permissions?page=${page}`);
  }

  getSelectedPermissions(
    id: string
  ): Observable<IApiRes<ISelectedPermissionsData>> {
    return this.http.get<IApiRes<ISelectedPermissionsData>>(
      `${this.ROOT_URL}/users/${id}/permissions`
    );
  }

  createPermissions(
    data: { permissionData: string[]; bankIds: string[] },
    id: string
  ): Observable<{ data: string; success: boolean }> {
    return this.http.put<{ data: string; success: boolean }>(
      `${this.ROOT_URL}/users/${id}/permissions`,
      data
    );
  }

  createWhiteListIp(data: { ipAddress: string; name: string }, ipId: string) {
    return this.http.post<any>(
      `${this.ROOT_URL}/users/${ipId}/whitelist-ip`,
      data
    );
  }

  getWhiteListIp(clientId: string): Observable<IApiRes<IGetWhiteListIp[]>> {
    return this.http.get<IApiRes<IGetWhiteListIp[]>>(
      `${this.ROOT_URL}/users/${clientId}/whitelist-ips`
    );
  }

  deleteIpAddress(
    userId: string,
    ipId: string
  ): Observable<{ message: string; success: boolean }> {
    return this.http.delete<{ message: string; success: boolean }>(
      `${this.ROOT_URL}/users/${userId}/whitelist-ips/${ipId}`
    );
  }

  cloneUserPermissions(
    cloneFromId: string,
    clonePermissionsPayload: { cloneToIds: string[] }
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/users/${cloneFromId}/clone-permissions`,
      clonePermissionsPayload
    );
  }

  cloneUserIfZeroPermissions(
    cloneFromId: string,
    clonePermissionsPayload: { cloneToIds: string[] }
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/users/${cloneFromId}/clone-permissions`,
      clonePermissionsPayload
    );
  }

  /****** Hamaspik Approval policies ******/

  getExistingRules(): Observable<IApiRes<IExistingRules[]>> {
    return this.http.get<IApiRes<IExistingRules[]>>(
      `${this.ROOT_URL}/approval-policy`
    );
  }

  getRuleById(id: string) {
    return this.http.get(`${this.ROOT_URL}/approval-policy/${id}`);
  }

  addNewRule(data: IAddPolicyData | IAddMultiLevelPolicyData) {
    return this.http.post(`${this.ROOT_URL}/approval-policy`, data);
  }

  updateRule(id: string, data: IAddPolicyData | IAddMultiLevelPolicyData) {
    return this.http.put(`${this.ROOT_URL}/approval-policy/${id}`, data);
  }

  deleteRule(id: string) {
    return this.http.delete(`${this.ROOT_URL}/approval-policy/${id}`);
  }

  getApprovers(): Observable<IApiRes<IApprovers[]>> {
    return this.http.get<IApiRes<IApprovers[]>>(
      `${this.ROOT_URL}/approval-policy/approvers`
    );
  }

  getApprovalRequiredUsers(): Observable<IApiRes<IUsersList[]>> {
    return this.http.get<IApiRes<IUsersList[]>>(
      `${this.ROOT_URL}/approval-policy/approval-required-users`
    );
  }

  getPendingApprovalList(params?: {
    page?: number;
    perPage?: number;
  }): Observable<IApiRes<IApprovalRequest>> {
    return this.http.get<IApiRes<IApprovalRequest>>(
      `${this.ROOT_URL}/approval-policy/approval-required-payments`,
      params
        ? {
            params: {
              page: String(params.page ?? 1),
              perPage: String(params.perPage ?? 25)
            }
          }
        : {}
    );
  }

  exportUserActivity(userId:string,payload:IActivityExportPayload){
    return this.http.post<IApiRes<{url:string}>>(`${this.ROOT_URL}/users/${userId}/export`,payload);
  }

  getAccountsPermission(clientPermissionId: string,payload:IAccountsPermissionPayload) {
    return this.http.post<IApiRes<IAccountsPermission>>(`${this.ROOT_URL}/users/${clientPermissionId}/account-permissions`,payload);
  }
  
  exportPermission(payload:{client_ids:string[] | null,type:string}){
    return this.http.post<IApiRes<{url:string}>>(`${this.ROOT_URL}/users/export-permissions`,payload);
  }
}

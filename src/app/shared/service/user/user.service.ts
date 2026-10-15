import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  INotificationDetails,
  INotificationList
} from 'src/app/layout/model/header';
import { IEditUserFormBody, IOverallData } from 'src/app/models/user';
import { environment } from 'src/environments/environment';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';

export interface IUserStats {
  accountStatus: string;
  securityLevel: string;
  activeUsersCount: number;
  unreadNotificationsCount: number;
  isTwoFactorEnabled: number;
}
import {
  IGeneralSettings,
  ITimeZone,
  IUserAdvancedSettings,
  IUserEmailSettings,
  IUserEmailTemplate,
  IUserNotificationSettings,
  IUserTabs
} from 'src/app/modules/user/model/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  ROOT_URL = environment.rootUrl;

  private isAchEnabledUser$ = new Subject<0 | 1>();

  constructor(private http: HttpClient) {}

  get achEnabledUser$(): Observable<0 | 1> {
    return this.isAchEnabledUser$.asObservable();
  }

  set achEnabledUser(value: 0 | 1) {
    this.isAchEnabledUser$.next(value);
  }

  public userOverallData = new BehaviorSubject<IOverallData | undefined>(
    undefined
  );

  // USER PERMISSION START
  addUsers(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/users`, data);
  }

  /**
   * API for editing users from usermanagement.
   * @param id - user id.
   * @param data - form body for editing user.
   * @returns
   */
  editUser(id: string, data: IEditUserFormBody): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/users/${id}/update`,
      data
    );
  }

  getPermissions(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/users/permissions`);
  }

  getSelectedPermissions(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/users/${id}/permissions`);
  }

  approveCompany(id: string, data?: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/users/${id}/approve-accountant`,
      data
    );
  }

  createWhiteListIp(data: any, id: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/users/${id}/whitelist-ip`,
      data
    );
  }

  deleteSingleUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.ROOT_URL}/users/${id}`);
  }

  deleteMultipleUsers(data: any): Observable<any> {
    return this.http.delete<any>(`${this.ROOT_URL}/users`, { body: data });
  }
  // whitelist ip methods

  createPermissions(data: any, id: string): Observable<any> {
    return this.http.put<any>(`${this.ROOT_URL}/users/${id}/permissions`, data);
  }

  getWhiteListIp(id: any): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/users/${id}/whitelist-ips`);
  }

  deleteIpAddress(usersId: string, ipId: any): Observable<any> {
    return this.http.delete<any>(
      `${this.ROOT_URL}/users/${usersId}/whitelist-ips/${ipId}`
    );
  }

  // old user panel
  oldUserGet(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/old-user-panel`);
  }

  oldUserBankPermission(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/old-user-panel/${id}/bank`);
  }

  oldUserBankPermissionCreate(id: any, data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/old-user-panel/${id}`, data);
  }

  getSingleOldUser(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/old-user-panel/${id}`);
  }

  // payee methods
  getPayeePermission(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/old-user-panel/${id}/payee`);
  }

  updatePayee(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/old-user-panel/${id}/payee`,
      data
    );
  }

  // old user edit
  updateOldUser(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.ROOT_URL}/old-user-panel/${id}`, data);
  }

  resendInvite(userId: string): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/users/${userId}/resend-invite`, {});
  }
  // USER PERMISSION END

  getUserStats(): Observable<IApiRes<IUserStats>> {
    return this.http.get<IApiRes<IUserStats>>(`${this.ROOT_URL}/users/stats`);
  }

  // application settings

  getStatusOfASettinngs(): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/email-settings/sua/advanced-settings/`
    );
  }

  getTimeZone(): Observable<IApiRes<ITimeZone[]>> {
    return this.http.get<IApiRes<ITimeZone[]>>(
      `${this.ROOT_URL}/application-settings/timezone/`
    );
  }

  getGeneralSettings(): Observable<IApiRes<IGeneralSettings>> {
    return this.http.get<IApiRes<IGeneralSettings>>(
      `${this.ROOT_URL}/application-settings/general-settings/`
    );
  }

  updateGeneralSettings(data: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/application-settings/general-settings/`,
      data
    );
  }

  getTabs(): Observable<IApiRes<IUserTabs>> {
    return this.http.get<IApiRes<IUserTabs>>(
      `${this.ROOT_URL}/application-settings/check-settings/`
    );
  }

  updateTabs(data: { tab_order: number[]; }): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/application-settings/check-settings/`,
      data
    );
  }

  getPageOriantation(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/settings/pageOrientation`);
  }

  updateCheckTab(data: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/application-settings/check-settings/check-tabs/`,
      data
    );
  }

  updateCheckTemplate(data: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/application-settings/check-settings/printing-style`,
      data
    );
  }

  getAdvancedSettings(): Observable<IApiRes<IUserAdvancedSettings[]>> {
    return this.http.get<IApiRes<IUserAdvancedSettings[]>>(
      `${this.ROOT_URL}/application-settings/advanced-settings/`
    );
  }

  uploadAdavanceStatus(data: { status_id: string; status: number; bank_accounts?: string[] }) {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/application-settings/advanced-settings`,
      data
    );
  }

  getNotifStatus(): Observable<IApiRes<IUserNotificationSettings>> {
    return this.http.get<IApiRes<IUserNotificationSettings>>(
      `${this.ROOT_URL}/application-settings/notification-settings/`
    );
  }

  getUserOverallData(): Observable<IApiRes<IOverallData>> {
    return this.http.get<IApiRes<IOverallData>>(
      `${this.ROOT_URL}/dashboard-web/stats`
    );
  }

  getNotifStatusShowAll(): Observable<any> {
    return this.http.get<IApiRes<IUserNotificationSettings>>(
      `${this.ROOT_URL}/application-settings/notification-settings/?show_all=1`
    );
  }

  uploadNotifStatus(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/application-settings/notification-settings/`,
      data
    );
  }
  // ---> EMAIL SETTINGS

  getEmailSettings(): Observable<IApiRes<IUserEmailSettings>> {
    return this.http.get<IApiRes<IUserEmailSettings>>(
      `${this.ROOT_URL}/email-settings/`
    );
  }

  getEmailTemplate(): Observable<IApiRes<IUserEmailTemplate>> {
    return this.http.get<IApiRes<IUserEmailTemplate>>(
      `${this.ROOT_URL}/email-settings/email/template/`
    );
  }

  updateEmailSettings(data: any): Observable<{ success: true }> {
    return this.http.put<{ success: true }>(
      `${this.ROOT_URL}/email-settings/`,
      data
    );
  }

  addSmtpServer(data: any): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/email-settings/`,
      data
    );
  }

  updateSmtpServer(data: any, id: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.ROOT_URL}/email-settings/${id}`,
      data
    );
  }

  testSmtpServer(data: any): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/email-settings/test`,
      data
    );
  }

  deleteSMTPserver(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.ROOT_URL}/email-settings/${id}`
    );
  }

  userPanelData(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/users/user-panel-data`);
  }

  //= ===================cehck email and phone is verified=============================

  /**
   * @description  API function for geting Notification.
   */
  getNotification(page = 1,filterType?:number): Observable<IApiRes<INotificationList>> {
    return this.http.get<IApiRes<INotificationList>>(
      `${this.ROOT_URL}/notifications?page=${page}&filterType=${filterType}`
    );
  }

  getHomePageNotifications(): Observable<IApiRes<INotificationDetails[]>> {
    return this.http.get<IApiRes<INotificationDetails[]>>(
      `${this.ROOT_URL}/notifications/homepage-notifications`
    );
  }

  /**
   * @description  API function for Notification clearing in Home page Sidebar.
   */
  markAllHomeNofificationsAsRead(): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/notifications/mark-as-read-home-page`,
      {}
    );
  }

  markAsRead(id: string): Observable<{ message: string; success: boolean }> {
    const body = new FormData();
    body.append('id', id);
    return this.http.post<{ message: string; success: boolean }>(
      `${this.ROOT_URL}/notifications/mark-as-read`,
      body
    );
  }

  /**
   * @description API function for Mark all notifications as Unread.
   */
  markAsUnread(id: string): Observable<IApiRes<string>> {
    const body = new FormData();
    body.append('id', id);
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/notifications/mark-as-un-read`,
      body
    );
  }

  /**
   * @description API function for Mark all notifications as read
   */
  markAllRead(): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/notifications/mark-as-read-all`,
      {}
    );
  }

  //= ===================> user activtiy API <======================//
  userAllActivities(id: any): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/users/${id}/audit-trail`);
  }

  userDatewiseActivities(id: any): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/users/${id}/audit-trail?filter=date`
    );
  }

  /**
   * @description Used to sets the landing page for a user in the application.
   * @param {Object} sendingData - An object containing the configuration for the landing page.
   * @returns {Observable<IApiResMesssage>} An Observable that resolves to an IApiResMesssage,
   */
  setUserLandingPage(sendingData: {
    number: number;
    url: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/application-settings/login-landing-page`,
      sendingData
    );
  }

  /**
    * API function for text-us 
   * @returns 
   */
  textUs(payload:{phone:string}): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/text-us`,payload
    );
  }
}

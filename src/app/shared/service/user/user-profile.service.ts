import { selectUserVerification } from './../../../modules/store/userManagement/userManagement.selectors';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, finalize, map, tap } from 'rxjs/operators';
import { IPersonalInfo } from 'src/app/layout/model/header';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { IBusinessDetails } from 'src/app/models/bank';
import { IUserVerification } from 'src/app/models/user';
import { IBusinessIndustryTypes } from 'src/app/modules/user/model/user';
import { IDevices } from 'src/app/modules/user/user-v2/components/security/security';
import { IUploadDocs } from 'src/app/modules/user/user-v2/components/upload-docs/model/upload-documents';
import { IAppState } from 'src/app/store/app-state.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  ROOT_URL = environment.rootUrl;

  private userVerificationStatus$ = new Subject<IUserVerification>();
  isLoaderActivated: boolean;
  isUserDataLoading: boolean;
  userDetailsSignal = signal<IPersonalInfo|undefined>(undefined);
  isLoadingUserDetailsSignal = signal(false);
  userBusinessListSignal = signal<IBusinessDetails[]>([]);

  private http = inject(HttpClient);
  private store = inject(Store<IAppState>);

  dataLoader() {
    this.isLoaderActivated = true;
  }

  getUserVerification(): Observable<IUserVerification> {
    return this.userVerificationStatus$;
  }

  setUserVerification() {
    this.isUserDataLoading = true;
    this.checkEmailAndPhoneVerified()
      .pipe(
        finalize(() => {
          this.isUserDataLoading = false;
        }),
        tap(() => this.dataLoader())
      )
      .subscribe((res) => {
        this.userVerificationStatus$.next(
          (res as IApiRes<IUserVerification>).data
        );
      });
  }

  get UserVerification$(): Observable<IUserVerification> {
    return this.store.select(selectUserVerification).pipe(
      filter((res) => res !== null),
      map((res) => res as IUserVerification)
    ) as Observable<IUserVerification>;
  }

  checkEmailAndPhoneVerified(): Observable<
    IApiRes<IUserVerification> | IApiResMesssage
  > {
    return this.http.get<IApiRes<IUserVerification> | IApiResMesssage>(
      `${this.ROOT_URL}/user-verification`
    );
  }

  twofactorToggle(): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-profile/two-factor/toggle/`,
      ''
    );
  }

  changeLayoutV4(encryptedUserId: string, enableV4: 0 | 1): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/user-profile/change-layout-v4`,
      { userId: encryptedUserId, enableV4 }
    );
  }

  advancedTwofactorToggle(): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-profile/intelligent-twofactor/advanced/toggle`,
      ''
    );
  }

  requestverifyEmailMobile(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-verification/request-otp/`,
      data
    );
  }

  verifyOtp(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-verification/verify-otp/`,
      data
    );
  }

  requestVerifyEmailOTP(email: string): Observable<any> {
    const sendingData = {
      email: email
    };
    return this.http.post<any>(`${this.ROOT_URL}/user-verification/email`,sendingData);
  }
  
  requestVerifyPhoneOTP(phone:string,code?:string): Observable<any>{
    const sendingData={
      phone,
      countryCode:code
    };
    return this.http.post<any>(
      `${this.ROOT_URL}/user-verification/phone`,
      sendingData
    );
  }

  verifyEmailOtp(sendingData: { email: string; otp: string }): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-verification/email/verify`,
      sendingData
    );
  }

  verifyPhoneOTP(sendingData: { phone: string; otp: string }): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-verification/phone/verify`,
      sendingData
    );
  }

  //********************user profile******************************/
  getPersonalInfo(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/user-profile`);
  }

  getDocuments(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/user-profile/documents`);
  }

  updatePersonalInfo(data: any): Observable<any> {
    return this.http.put<any>(`${this.ROOT_URL}/user-profile`, data);
  }

  getBusinessInfo(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/user-profile/business`);
  }

  getBackupCodes(): Observable<IApiRes<string[]>>{
    return this.http.get<IApiRes<string[]>>(`${this.ROOT_URL}/user-profile/two-factor/recovery-code`);
  }

  activateBackupCode(): Observable<any> {
    let data;
    return this.http.post<any>(
      `${this.ROOT_URL}/user-profile/two-factor/recovery-code`,
      data
    );
  }

  updateBusinessInfo(data: any): Observable<any> {
    return this.http.put<any>(`${this.ROOT_URL}/user-profile/business`, data);
  }

  postBusinessInfoOnboarding(data : any): Observable<any>{
    return this.http.post<any>(`${this.ROOT_URL}/user-profile/business`,data);
  }

  postOnboardingDataStep1(data : any): Observable<any>{
    return this.http.post<any>(`${this.ROOT_URL}/user-profile/business/step1`,data);
  }

  postOnboardingDataStep2(data : any): Observable<any>{
    return this.http.post<any>(`${this.ROOT_URL}/user-profile/business/step2`,data);
  }

  uploadPhoto(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/user-profile`, data);
  }

  uploadDocs(data: FormData) {
    return this.http.post<IApiRes<IUploadDocs[]>>(`${this.ROOT_URL}/user-profile/documents`, data);
  }

  security(data: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/user-profile/change-password`,
      data
    );
  }

  authentificationOff(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-profile/two-factor/de-activate`,
      data
    );
  }

  advancedAuthentificationOff(data: {
    otp: string;
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/user-profile/intelligent-twofactor/advanced/de-active`,
      data
    );
  }

  addBusinessLogo(data: any) {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-profile/business-logo`,
      data
    );
  }

  getOnboardingListData(sendingData: {
    type: string;
  }): Observable<IApiRes<IBusinessIndustryTypes[]>> {
    return this.http.post<IApiRes<IBusinessIndustryTypes[]>>(
      `${this.ROOT_URL}/user-profile/business/items`,
      sendingData
    );
  }

  /**
   * @description API function for getting all logged devices
   */
  getActiveDevices(): Observable<IApiRes<IDevices[]>> {
    return this.http.get<IApiRes<IDevices[]>>(
      `${this.ROOT_URL}/user-profile/login-sessions`
    );
  }

  addIpWhitelist(data: {ip:string, nickname:string}): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/user-profile/company-whitelist/add`,
      data
    );
  }

  getIpWhitelist(): Observable<IApiRes<{ip: string, nickname: string, created_at: string}[]>> {
    return this.http.get<IApiRes<{ip: string, nickname: string, created_at: string}[]>>(
      `${this.ROOT_URL}/user-profile/company-whitelist/get`
    );
  }

  removeIpWhitelist(data: {ip:string}): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/user-profile/company-whitelist/remove`,
      {
        body: data
      }
    );
  }

  /**
   * @description API function for logout devices from logged sessions view
   * @param data -Payload for the API.
   */
  logoutDevices(data: { ids: string[] }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/user-profile/logout-sessions`,
      data
    );
  }

    /**
   * @description API function for storing user ui preferance. 
   * @param data -Payload for the API.
   */
    preferOldUiFeedback(data: { userId: string,neverShowAgain:number }): Observable<IApiResMesssage> {
      return this.http.post<IApiResMesssage>(
        `${this.ROOT_URL}/user-profile/dismiss-new-ui-switch-modal`,
        data
      );
    }
}

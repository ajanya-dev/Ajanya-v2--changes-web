import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  ILoginPayload,
  IRegisterPayload,
  ISetNewPasswordForm
} from 'src/app/models/user';
import { Subscription } from 'rxjs/internal/Subscription';
import { LocalStorageService } from '../storage/local-storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { DataTableCacheService } from '../indexedDb/data-table-cache.service';
import { MatDialog } from '@angular/material/dialog';
import { ScriptService } from 'src/app/core/services/script.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Utils } from 'src/app/data/utils';
import { IApiRes } from 'src/app/models/api';
import { finalize } from 'rxjs/operators';
import {
  IRegisterResponse,
  ISetPasswordExternalPayload
} from 'src/app/modules/auth/components/register/model/register';
import { Store } from '@ngrx/store';
import { mainStateActions } from 'src/app/modules/store';
import { DestroyerService } from '../common/destroyer/destroyer.service';
import { CustomDoubleSideModalService } from '../../modal/custom-double-side-modal';
import { PusherService } from 'src/app/core/services/pusher.service';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  ROOT_URL = environment.rootUrl;

  subscriptions: Subscription[] = [];
  scriptsIdToRemove = [
    'cjScript',
    'cjScript',
    'sift',
    'data_layer_event',
    'gtag_event',
    'out_brain',
    'awin',
    'true_converstion',
    'user_id_session_id'
  ];
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  public observe: Subscription;
  private logoutLoading: boolean;

  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private dtCacheService = inject(DataTableCacheService);
  private dialogRef = inject(MatDialog);
  private scriptService = inject(ScriptService);
  private postHogService = inject(PostHogService);
  private gettingStartedService = inject(GettingStartedService);
  private store = inject(Store);
  private http = inject(HttpClient);
  private destroyer = inject(DestroyerService);
  private doubleSideModalService = inject(CustomDoubleSideModalService);
  private pusherService = inject(PusherService);
  private browserTokenService = inject(BrowserTokenService);

  constructor() {
    if (this.localStorageService.appToken) {
      this.isLoggedIn.next(true);
    }
  }

  public get userLoggedIn() {
    return this.isLoggedIn.value;
  }

  set userLoggedIn(value: boolean) {
    this.isLoggedIn.next(value);
  }

  login(loginContext: ILoginPayload): Observable<any> {
    return new Observable((observer) => {
      Utils.createAuthSign(loginContext).subscribe((sign) => {
        this.http
          .post<ILoginPayload>(
            `${this.ROOT_URL}/login`,
            loginContext,
            Utils.httpHeaders({
              sign: sign,
              'browser-token': this.browserTokenService.value ?? ''
            })
          )
          .subscribe(
            (res) => {
              observer.next(res);
              observer.complete();
            },
            (_err) => {
              observer.error(_err);
            }
          );
      });
    });
  }

  socialLogin(loginContext: ILoginPayload) {
    return this.http.post<any>(`${this.ROOT_URL}/socialLogin`, loginContext);
  }

  loginWithPhone(phoneNumber: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/zilbank/login-with-phone`,
      { phone: phoneNumber }
    );
  }

  logout(data = ''): Observable<any> {
    return this.http.post<ILoginPayload>(`${this.ROOT_URL}/logout`, data);
  }

  register(registercontext: IRegisterPayload) {
    return this.http.post<IRegisterResponse>(
      `${this.ROOT_URL}/register`,
      registercontext
    );
  }

  forgotPassword(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/forgot-password/send-reset-link`,
      data
    );
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/forgot-password/reset-password/`,
      data
    );
  }

  /**
   * @description Method to set password when email verified payee directly logins with token from email link.
   * @param data - Payload data.
   * @returns Observable with response.
   */
  resetPasswordExternalLogin(
    data: ISetPasswordExternalPayload
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/forgot-password/external-login/reset-password`,
      data
    );
  }

  verifyToken(token: string): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/verify-token`, {
      customToken: token
    });
  }

  requestTwoFactorTimer(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/two-factor/timer`);
  }

  verifyZilBankOtp(data: {
    otp: string;
    phone: string;
  }): Observable<{ success: boolean; access_token: string; user: number }> {
    return this.http.post<{
      success: boolean;
      access_token: string;
      user: number;
    }>(`${this.ROOT_URL}/zilbank/verify-otp`, data);
  }

  validateOtp(data: any) {
    return this.http.post<any>(`${this.ROOT_URL}/validate-otp`, data);
  }

  resendMainPageOtp(data: any) {
    return this.http.post<any>(`${this.ROOT_URL}/resend-otp`, data);
  }

  /**
   * @description Step 1 of web two-factor activation: validates the OTP on its
   * own. Once it succeeds, `activateSend` is called with the password alone.
   * The verification stays valid for 10 minutes and is cancelled by a resend.
   * Regular flow only — the advanced flow has its own verify route.
   * @param data - The 6-digit OTP sent by two-factor/toggle or two-factor/resend.
   * @returns Observable of the verification result.
   */
  verifyTwoFactorOtp(
    data: { otp: string }
  ): Observable<{ success: boolean; message?: string }> {
    // isDisable422 stops the interceptor opening a warning dialog on top of
    // the OTP modal: a bad code belongs next to the boxes that produced it,
    // and the modal shows it inline.
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.ROOT_URL}/user-profile/two-factor/verify-otp`,
      data,
      { headers: new HttpHeaders().set('isDisable422', 'true') }
    );
  }

  /**
   * @description Step 1 of advanced two-factor activation: validates the OTP on
   * its own, so the password field is only revealed once the code is known to be
   * good. Deliberately a separate route from two-factor/verify-otp — the two
   * verifications are per-flow, and a code verified on one cannot activate the
   * other.
   * @param data - The 6-digit OTP sent by advanced/toggle or advanced/resend.
   * @returns Observable of the verification result.
   */
  advancedVerifyTwoFactorOtp(
    data: { otp: string }
  ): Observable<{ success: boolean; message?: string }> {
    // isDisable422 stops the interceptor opening a warning dialog on top of
    // the OTP modal: a bad code belongs next to the boxes that produced it,
    // and the modal shows it inline.
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.ROOT_URL}/user-profile/intelligent-twofactor/advanced/verify-otp`,
      data,
      { headers: new HttpHeaders().set('isDisable422', 'true') }
    );
  }

  activateSend(data: any) {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-profile/two-factor/activate`,
      data
    );
  }

  /**
   * @description Step 2 of advanced two-factor activation. Web sends the
   * password alone: the OTP was already accepted by advanced/verify-otp, and
   * the backend pairs the two by the `api-request-from: web` header the
   * interceptor sets. Mobile still posts `{ otp, password }` together.
   * @param data - The password entered after the OTP was verified.
   * @returns Observable of the activation result.
   */
  advancedTwoFactroActivateSend(data: {
    password: string;
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/user-profile/intelligent-twofactor/advanced/active`,
      data
    );
  }

  resendOtp() {
    return this.http.post<any>(
      `${this.ROOT_URL}/user-profile/two-factor/resend`,
      ''
    );
  }

  advancedTwoFactorResendOtp(): Observable<IApiRes<number>> {
    return this.http.post<IApiRes<number>>(
      `${this.ROOT_URL}/user-profile/intelligent-twofactor/advanced/resend`,
      ''
    );
  }

  requestTwoFactorOtp(data: any) {
    return this.http.post<any>(`${this.ROOT_URL}/two-factor`, data);
  }

  checkemail(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/user-name-suggestion`, data);
  }

  countries(): Observable<any> {
    return this.http.get<any>(`https://restcountries.com/v3.1/all`);
  }

  getLoginPageSliderDetails(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/login-slider-details`);
  }

  getLoginDetailsUsingToken(params?: any): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/me?${params}`);
  }

  setNewPassword(data: ISetNewPasswordForm): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/set-new-password`,
      data
    );
  }

  //---------------------------- Only for beta to classic switch mode Start------------------------------
  switchToClassic(params: any, data?: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/switch-to-classic?to=${params}`,
      data
    );
  }
  //---------------------------- Only for beta to classic switch mode End------------------------------

  // logout
  Logout(): void {
    this.dialogRef.closeAll();
    this.doubleSideModalService.closeAll();
    if (this.localStorageService.appToken) {
      if (!this.logoutLoading) {
        this.logoutLoading = true;
        this.subscriptions.push(
          this.logout()
            .pipe(
              finalize(() => {
                this.logoutLoading = false;
              })
            )
            .subscribe(
              (res: any) => {
                if (res.success) {
                  this.clearDataAndGoToLogin();
                }
              },
              () => {
                this.clearDataAndGoToLogin();
              }
            )
        );
      }
    } else {
      this.clearDataAndGoToLogin();
    }
  }

  clearDataAndGoToLogin() {
    const userId =
      this.localStorageService.getItem('userId') ??
      this.localStorageService.getItem('parentUserId');
    this.pusherService.unsubscribeUserSessionChannels(userId);
    this.pusherService.disconnectClient();

    this.postHogService.reset();
    const showNewLoginUi = this.localStorageService.getItem('showNewLoginUi');
    this.store.dispatch(mainStateActions.resetStatesOnCompanyChange());
    this.scriptService.gtagEventScript('logged-out');
    this.dialogRef.closeAll();    
    this.localStorageService.clearLocalStorage(); // To do - clear based on expiry
    this.dtCacheService.resetTablePostData();
    this.gettingStartedService.resetGettingStartedData();
    this.scriptService.removeScript(this.scriptsIdToRemove);
    this.userLoggedIn = false;
    this.observe?.unsubscribe();
    this.destroyer.destroyDataStoredInServices();
    if(!this.router.url.includes('outside')){
      // Full document navigation reloads the app on login (clears in-memory state).
      if(showNewLoginUi) {
        this.router.navigate(['/login'], { queryParams: { initiated_from: showNewLoginUi }, state: { fromLogout: true } });
      }else{
        this.router.navigate(['/login'], { state: { fromLogout: true } });
      }
    }
  }

}

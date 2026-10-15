import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IApiRes,
  IApiResMesssage,
  IApiResSuccessOnly
} from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import {
  ILoginPayload,
  IRegisterPayload,
  ISetNewPasswordForm
} from 'src/app/models/user';
import { Utils } from 'src/app/data/utils';
import {
  ILoginDetails,
  ISliderData,
  ITwoFactorPayload,
  ITwoFactorTimer,
  IResendOtpRes
} from '../model/login';
import { IRegisterResponse } from '../components/register/model/register';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthRepository {
  private http = inject(HttpClient);
  private browserTokenService = inject(BrowserTokenService);

  private ROOT_URL = environment.rootUrl;
  private OUTSIDE_ROOT_URL = this.ROOT_URL.split('/api/v4')[0];

  /**
   * @description Retrieves slider details for the login page.
   * @return {Observable<IApiRes<ISliderData[]>>} An Observable representing the response containing slider data.
   */
  getLoginPageSliderDetails(): Observable<IApiRes<ISliderData[]>> {
    return this.http.get<IApiRes<ISliderData[]>>(
      `${this.ROOT_URL}/login-slider-details`
    );
  }

  /**
   * @description Performs a social login operation.
   * @param {ILoginPayload} loginContext - The login context containing the necessary data for social login.
   * @return {Observable<ILoginDetails>} An Observable representing the response containing login details.
   */
  socialLogin(loginContext: ILoginPayload) {
    return this.http.post<ILoginDetails>(
      `${this.ROOT_URL}/socialLogin`,
      loginContext
    );
  }

  /**
   * @description Performs a login operation by sending a POST request to the server with authentication and browser token headers.
   * @param {ILoginPayload} loginContext - The login context containing user login information.
   * @return {Observable<ILoginPayload>} An Observable representing the response containing login details.
   */
  login(loginContext: ILoginPayload) {
    return new Observable((observer) => {
      Utils.createAuthSign(loginContext).subscribe((sign) => {
        this.http
          .post<ILoginPayload>(
            `${this.ROOT_URL}/login`,
            loginContext,
            Utils.httpHeaders({
              sign,
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

  /**
   * @description Register a user with the provided registration data.
   * @param registercontext - The user registration data to be sent to the registration endpoint.
   * @returns An Observable of type `IRegisterResponse` representing the registration result.
   */
  register(registercontext: IRegisterPayload): Observable<IRegisterResponse> {
    return this.http.post<IRegisterResponse>(
      `${this.ROOT_URL}/register`,
      registercontext
    );
  }

  /**
   * @description Check the availability of an email address suggestion.
   * @param sendingData - The email address (username) data to be sent for availability check.
   * @returns An Observable of type `IApiResMesssage` representing the result of the email address availability check.
   */
  checkemail(
    sendingData: { username: string },
    headers?: HttpHeaders
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/user-name-suggestion`,
      sendingData,
      { headers }
    );
  }

  /**
   * @description Requests the two-factor authentication timer information.
   * @return {Observable<ITwoFactorTimer>} An Observable representing the response containing two-factor authentication timer details.
   */
  requestTwoFactorTimer(): Observable<ITwoFactorTimer> {
    return this.http.get<ITwoFactorTimer>(`${this.ROOT_URL}/two-factor/timer`);
  }

  /**
   * @description Validates a OTp for two-factor authentication.
   * @param {ITwoFactorPayload} data - The data containing the OTP for validation.
   * @return {Observable<IApiResSuccessOnly>} An Observable representing the response, indicating the success of the OTP validation.
   */
  validateOtp(data: ITwoFactorPayload): Observable<IApiResSuccessOnly> {
    return this.http.post<IApiResSuccessOnly>(
      `${this.ROOT_URL}/validate-otp`,
      data
    );
  }

  /**
   * @description Retrieves login details using an authentication token.
   * @param {string} params - (Optional) Query parameters to customize the request, e.g., for filtering or customization.
   * @return {Observable<ILoginDetails>} An Observable representing the response containing login details.
   */
  getLoginDetailsUsingToken(params?: string): Observable<ILoginDetails> {
    return this.http.get<ILoginDetails>(`${this.ROOT_URL}/me?${params}`);
  }

  /**
   * @description Resends the main page OTP for authentication.
   * @return {Observable<IResendOtpRes>} An Observable representing the response containing the timer for OTP expiration.
   */
  resendMainPageOtp(): Observable<IResendOtpRes> {
    return this.http.post<IResendOtpRes>(
      `${this.ROOT_URL}/resend-otp`,
      {}
    );
  }

  /**
   * @description Sets a new password by sending an HTTP POST request to the server.
   * @param {ISetNewPasswordForm} data - The data containing the new password and relevant information.
   * @return {Observable<IApiRes<string>>} An Observable representing the response indicating the success of setting the new password.
   */
  setNewPassword(data: ISetNewPasswordForm): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/set-new-password`,
      data
    );
  }

  trackOutsideSignupPageVisit(data: { page: string, email: string, phone?: string }): Observable<{ success: boolean, message?: string, errorMsg?: string }> {
    return this.http.post<{ success: boolean, message?: string, errorMsg?: string }>(
      `${this.OUTSIDE_ROOT_URL}/outside/signup-page-visit`,
      data
    );
  }

  sendPreRegistrationEmailOtp(
    email: string,
    phone:string,
    provider_type:string
  ): Observable<{
    success: boolean;
    message?: string;
    errorMsg?: string;
    timer?: { success: boolean; diff: number };
  }> {
    return this.http.post<{
      success: boolean;
      message?: string;
      errorMsg?: string;
      timer?: { success: boolean; diff: number };
    }>(`${this.ROOT_URL}/outside/pre-registration/email/send-otp`, { email,phone,provider_type });
  }

  verifyPreRegistrationEmailOtp(
    email: string,
    otp: string
  ): Observable<{ success: boolean; message?: string; errorMsg?: string }> {
    return this.http.post<{ success: boolean; message?: string; errorMsg?: string }>(
      `${this.ROOT_URL}/outside/pre-registration/email/verify-otp`,
      { email, otp }
    );
  }

}

import { environment } from 'src/environments/environment';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

/**
 * @description Interceptor class. intercepts all the http requests.
 * @class - Interceptor Service Class.
 */
@Injectable({
  providedIn: 'root'
})
export class InterceptorService implements HttpInterceptor {
  constructor(
    private _companyManagementService: CompanyManagementService,
    private _layoutService: LayoutService,
    private _localStorageService: LocalStorageService,
    private _browserTokenService: BrowserTokenService
  ) {}

  /**
   * @description Identifies and handles a given HTTP request. Here we are setting token to authorization header, other related details, and setting global loader,
   *  and if there is any tempRoot url, that too.
   * @param request - HttpRequest, every http request going out from application
   * @param next - HttpHandler
   * @returns
   */
  intercept(
    httpRequest: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    /**
     * @description Global Loader.
     * This interceptor checks the 'isHideLoader' header in the HTTP request.
     * If the header is set to 'true', it disables the loading indicator provided by the '_layoutService'.
     * If the header is not present or set to anything other than 'true', the loading indicator is enabled.
     */
    const disableLoadingHeader = httpRequest.headers.get('isHideLoader');
    if (disableLoadingHeader === 'true') {
      this._layoutService.setLoading(false);
      /**
       * This code snippet creates a new set of HTTP headers with the 'isHideLoader' header removed.
       */
      const updatedHeaders = httpRequest.headers.delete('isHideLoader');
      httpRequest = httpRequest.clone({ headers: updatedHeaders });
    } else {
      this._layoutService.setLoading(true);
    }

    const browserToken = this._browserTokenService.value;

    if (browserToken || !this.needsBrowserToken(httpRequest)) {
      return this.forward(httpRequest, next, browserToken);
    }

    return this._browserTokenService
      .ensure()
      .pipe(
        switchMap((fetchedToken) =>
          this.forward(httpRequest, next, fetchedToken)
        )
      );
  }

  /**
   * @description Authenticated api calls are the ones the edge rule expects the header on.
   * The browser-auth call itself is excluded so a missing token can never recurse.
   */
  private needsBrowserToken(httpRequest: HttpRequest<any>): boolean {
    return (
      !!this._localStorageService.appToken &&
      httpRequest.url.startsWith(environment.rootUrl) &&
      !httpRequest.url.includes('/browser-auth')
    );
  }

  private forward(
    httpRequest: HttpRequest<any>,
    next: HttpHandler,
    browserToken: string | null
  ): Observable<HttpEvent<any>> {
    const headers: any = {
      Accept: 'application/json',
      Authorization: `Bearer ${this._localStorageService.appToken} `,
      ocw: '110',
      CompanyID: `${this._companyManagementService.getActiveCompanyId()}`,
      'api-request-from': 'web'
    };

    if (browserToken) {
      headers['browser-token'] = browserToken;
    }

    if (this._localStorageService.getItem('ocw-admin')) {
      headers['ocw-admin'] = this._localStorageService.getItem('ocw-admin');
    }

    if (this._localStorageService.getItem('seonSessionId')) {
      headers['X-Device-Fingerprint'] =
        this._localStorageService.getItem('seonSessionId');
    }

    httpRequest = httpRequest.clone({
      setHeaders: headers
    });

    /**
     * @description for testing only (local and staging)
     */
    if (environment.isItDev) {
      if (this._localStorageService.getItem('tempRoot')) {
        httpRequest = httpRequest.clone({
          url: `${this._localStorageService.getItem('tempRoot')}/api/v4/${httpRequest.url.split('v4/')[1]}`
        });
      } else {
        httpRequest = httpRequest.clone({ url: httpRequest.url });
      }
    }

    return next
      .handle(httpRequest)
      .pipe(finalize(() => this._layoutService.setLoading(false)));
  }
}

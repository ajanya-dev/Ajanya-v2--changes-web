import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IdleService } from 'src/app/core/services/idle.service';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { ILoginDetails } from 'src/app/modules/auth/model/login';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';
import { Utils } from 'src/app/data/utils';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

@Component({
  selector: 'app-switch-app',
  templateUrl: './switch-app.component.html',
  styleUrls: ['./switch-app.component.scss'],
  standalone: true
})
export class SwitchAppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  returnUrl: string;
  returnUrlIfCompanyZero: string;
  token: string;
  customToken: string;
  companyId: string;
  params = '';
  openUrl: string;
  mode: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private localStorageService: LocalStorageService,
    private authService: AuthService,
    private authV3Service: AuthV3Service,
    private alertService: AlertService,
    private idleService: IdleService,
    private authDataService: AuthDataService,
    private appSettingsService: AppSettingsService,
    private browserTokenService: BrowserTokenService,
  ) {}

  ngOnInit(): void {    
    const ifCompanyZero: string =
      this.route.snapshot.queryParams.returnUrl || '/manage/cheque';
    if (ifCompanyZero) {
      const url = ifCompanyZero?.split('?');
      this.returnUrlIfCompanyZero = url[0];
    }

    const getUrl: string = this.route.snapshot.queryParams.returnUrl;
    if (getUrl) {
      this.mode = 'toBeta';
      const url = getUrl?.split('?');
      this.returnUrl = url[0];
    }

    this.token = this.route?.snapshot?.queryParams.token;
    this.customToken = this.route?.snapshot?.queryParams.customToken;
    this.companyId = this.route?.snapshot?.queryParams.companyId;
    const getParams = this.route?.snapshot?.queryParams.params
      ? JSON?.parse(this.route?.snapshot?.queryParams.params)
      : '';

    if (getParams) {
      // Redirect from Live app

      for (const [key, value] of Object.entries(getParams)) {
        this.params += `${key}=${value}&`;
      }
      this.localStorageService.removeItem('sessionTimer');
      this.localStorageService.removeItem('sessionTimerOpen');
      this.localStorageService.appToken = this.token;
      this.localStorageService.setItem('activeCompanyId', this.companyId);

      if (
        getParams?.initiated_from === 'directDepositReceiving' ||
        getParams?.initiated_from === 'microDepositProcessed' ||
        getParams?.initiated_from === 'cardProgramWalletGiftCard' ||
        getParams?.initiated_from === 'cardProgramReceiverRequest'
      ) {
        const urlWithoutQueryParams: string =
          this.route.snapshot.queryParams.returnUrl?.split('?')[0];
        this.returnUrl = this.setDirectDepositReceivingUrl(
          urlWithoutQueryParams,
          getParams
        );
        this.returnUrlIfCompanyZero = this.returnUrl;
      }

      if (getParams?.initiated_from === 'cardProgramWalletGiftCard') {
        if (window.innerWidth < 768 && Utils.isMobile()) {
          const params = Object.entries(getParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
          
          const redirectUrl = environment.env_id === 'zilMoney'
            ? `https://staging-card.zil.us?${params}`
            : `https://staging-card.zil.us?${params}`;
          
          window.location.href = redirectUrl;
          return; 
        }
      }
    }

    this.subscriptions.push(
      this.idleService.isIdleForTimeInterval$.subscribe((isIdle) => {
        if (isIdle && !this.localStorageService.appToken) {
          this.authV3Service.getBrowserAuthToken();
        }
      })
    );
    this.idleService.onInteraction();
    this.subscriptions.push(
      this.browserTokenService.refresh().subscribe((browserToken) => {
        if (!browserToken) {
          return;
        }

        if (this.token) {
          this.loadData();
        }

        if (this.customToken) {
          this.loadDataUsingCustomToken();
        }
      })
    );

    if (!getUrl) {
      // Redirect to live
      this.mode = 'toClassic';
      this.redirectToClassic();
    }
  }

  getBrowserToken() {}

  /**
   * @description Redirects the user to the classic version of the application.
   */
  redirectToClassic() {
    const url: string = this.route.snapshot.queryParams.path;
    this.authService.switchToClassic(url).subscribe((res) => {
      if (res?.success) {
        window.location.href = res.data.url;
      }
    });
  }

  /**
   * @description  Loads data using a custom token for authentication.
   */
  loadDataUsingCustomToken(): void {
    this.subscriptions.push(
      this.authService
        .verifyToken(this.customToken)
        .pipe(
          catchError((e) => {
            this.localStorageService.clearLocalStorage();
            this.alertService.failedAlert({
              content: e.error.errorMsg,
              close: true,
              isOk: false
            });
            this.router.navigateByUrl('/login');
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            /** If its from deep link, we should directly redirect to return URL. So company id and name set from here itself */
            if (this.localStorageService.getItem('isDeeplink')) {
              this.setStorage('activeCompanyName', res.companyInfo.companyName);
              this.setStorage('activeCompanyId', res.companyInfo.companyId);
              this.setStorage('activeCompanyType', 'owncmp');
            }

            this.authDataService.afterLogin(
              res,
              this.returnUrlIfCompanyZero,
              this.returnUrl,
              undefined,
              'email',
              res.email
            );
          }
        })
    );
  }

  /**
   * @description Loads login details using a token and handles authentication.
   */
  loadData() {
    this.subscriptions.push(
      this.authService
        .getLoginDetailsUsingToken(this.params)
        .pipe(
          catchError(() => {
            this.appSettingsService.setInvitationState(false, '', '');
            this.localStorageService.clearLocalStorage();
            this.openWarningAlert('Unauthenticated.');
            this.router.navigate(['/login']);
            return of(false);
          })
        )
        .subscribe((res: ILoginDetails) => {
          if (res?.success) {
            // Check for invitation after successful authentication
            this.checkInvitationQueryParam(res.email);
            
            this.authDataService.afterLogin(
              res,
              this.returnUrlIfCompanyZero,
              this.returnUrl,
              undefined,
              'email',
              res.email
            );
          }
        })
    );
  }

  /**
   * @description Sets a key-value pair in local storage.
   * @param {string} key - The key under which to store the value in local storage.
   * @param {string} value - The value to be stored in local storage.
   */
  setStorage(key: LocalStorageKeys, value: string) {
    this.localStorageService.setItem(key, value);
  }

  /**
   * @description Opens a warning alert dialog with the provided content.
   *  @param {string} content - The content to be displayed in the warning alert.
   * @returns
   */
  openWarningAlert(content: string) {
    const data = {
      content
    };
    return this.alertService.warningAlert(data);
  }

  /**
   * @description Method to set url for direct deposit receiving (when payee logs into the application using the email link, as part of payment received notification.)
   * @param url - URL without query params.
   * @param queryParams - Query params.
   * @returns Url with query params (login token removed, everything else intact).
   */
  setDirectDepositReceivingUrl(url: string, queryParams: Params): string {
    let returnUrl = `${url}?`;
    const queryParamsObj = {
      initiated_from: queryParams.initiated_from,
      initiator_id: queryParams.initiator_id,
      externalToken: queryParams.externalToken,
      isNewUser: queryParams.isNewUser,
      redirect_back: queryParams.redirect_back
    };

    Object.entries(queryParamsObj).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      returnUrl += `${key}=${value}&`;
    });

    return returnUrl;
  }

  /**
   * @description Checks query parameters for invitation=true and sets invitation tracker state
   */
  checkInvitationQueryParam(fallbackEmail?: string): void {
    const { params } = this.route.snapshot.queryParams;
    const paramsObj = JSON.parse(params);
    if ((paramsObj.invitation === 'true' && paramsObj.type === 'new') || paramsObj.initiated_from === 'cardProgramWalletGiftCard' || paramsObj.initiated_from === 'cardProgramReceiverRequest') {
      this.appSettingsService.setInvitationState(true, paramsObj.externalToken, paramsObj.email || fallbackEmail || '', paramsObj.initiated_from);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

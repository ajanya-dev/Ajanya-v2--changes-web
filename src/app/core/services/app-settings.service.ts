import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router
} from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IAppConfig } from 'src/app/models/app_settings';
import { environment } from 'src/environments/environment';
import { ScriptService } from './script.service';
import { IApiRes } from 'src/app/models/api';

/**
 * @description Service for AppSettings, like setting title of application and setting all other domain settings data
 * like app logo, title, login background, content and etc...
 * @class Service Class
 */
@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  private appConfig = new BehaviorSubject<IAppConfig | null>(null);
  public appConfig$ = this.appConfig.asObservable();

  // Invitation tracking BehaviorSubject
  private invitationState = new BehaviorSubject<{invitation: boolean, externalToken: string, email: string, initiated_from: string|undefined}>({invitation: false, externalToken: '', email: '', initiated_from: undefined});
  public invitationState$: Observable<{invitation: boolean, externalToken: string, email: string, initiated_from: string|undefined}> = this.invitationState.asObservable();

  private TITLE = 'OnlineCheckWriter';

  constructor(
    private http: HttpClient,
    private title: Title,
    private activatedRoute: ActivatedRoute,
    private _router: Router,
    private scriptService: ScriptService
  ) {}

  ROOT_URL = environment.rootUrl;

  // Mobile page route mappings - maps returnUrl patterns to mobile page params
  public readonly MOBILE_PAGE_ROUTES: { pattern: string; params: string }[] = [
    { pattern: 'manage/payments/main/pay/bankaccount/check', params: 'page=checkprint' },
    { pattern: 'manage/payments/main/pay/bankaccount/check', params: 'page=checkmail' },
    { pattern: 'manage/payments/main/pay/bankaccount/check', params: 'page=echeck' },
    { pattern: 'manage/payments/main/pay/card/ach', params: 'page=paybycc' },
    { pattern: 'manage/payroll-card/index', params: 'page=payroll' },
    { pattern: 'manage/payments/main/pay/bankaccount/ach', params: 'page=transfer&payas=ach' },
    { pattern: 'manage/payments/main/pay/bankaccount/wire', params: 'page=transfer&payas=wire' },
    { pattern: 'manage/wallet/transactions', params: 'page=wallets' },
    { pattern: 'manage/payment-links/index', params: 'page=paymentslinks' },
    { pattern: 'manage/receivedchecks/index', params: 'page=requestpayment' },
    { pattern: 'manage/document-mail/index', params: 'page=document-mail' },
    { pattern: 'manage/bank-accounts/index', params: 'page=banklist' },
    { pattern: 'manage/verification/index', params: 'page=verificationcenter' },
    { pattern: 'manage/subscription/plan', params: 'page=subscription' },
  ];

  /**
   * @description Getting all the details about the website and domain(ocw, zil bank, ...) user enters to application,
   * we get alot of data from this apis like website title, logo, url, icon and etc...
   * and we are setting it to appconfig subject.
   */
  getDomainSettings() {
    this.getDomainSettingApi().subscribe((data: IApiRes<IAppConfig>) => {
      if (data?.success) {
        let config = data.data;
        if(environment.env_id === 'staging'){
          const updatedConfig = {
            ...config,
            websiteLogo:config.zilMoneyLogo,
            websiteTitle:'Zil Money',
            websiteUrl:'https://zilmoney.com/',
            whiteLogo:'/assets/white_label/zilmoney/assets/app_logo_white.svg'
          };
          this.appConfig.next(updatedConfig);
          config = updatedConfig;
          this.TITLE = 'ZilMoney';
        }else if(environment.env_id === 'sandbox'){
          const updatedConfig = {
            ...config,
            whiteLogo:'/assets/white_label/zilmoney/assets/app_logo_white.svg'
          };
          this.appConfig.next(updatedConfig);
          config = updatedConfig;
        }
        else{
          this.appConfig.next(config);
          this.TITLE = config?.websiteTitle;
        }
        const currentTitle = this.title.getTitle();
        const updatedTitle = currentTitle.includes('|')
          ? currentTitle.split('|')[0] + '| ' + config?.websiteTitle
          : config?.websiteTitle;
        this.title.setTitle(updatedTitle);
      }
    });
  }

  /**
   * @description functiion for change title of application.
   * subscribing to all events that happens in route, and taking the most child route, and if there is any title, we set that title to application.
   * else we continue with the default title.
   */
  onChangePage() {
    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((res: any) => {
        this.scriptService.emitCurrentPage(res?.url);
        this.title.setTitle(this.pageTitle(this.activatedRoute.snapshot));
      });
  }

  /**
   * @description Same rule as Angular's own TitleStrategy: the deepest route
   * that declares a title wins, so a title on a layout route still covers its
   * tab children. With no title anywhere the tab shows the bare site name —
   * never the previous page's title.
   */
  private pageTitle(route: ActivatedRouteSnapshot): string {
    let title: string | undefined;
    for (let r: ActivatedRouteSnapshot | null = route; r; r = r.firstChild) {
      title = r.data?.['title'] ?? title;
    }
    return title ? `${title} | ${this.TITLE}` : this.TITLE;
  }

  /**
   * Sets the page title with additional information.
   *
   * @param {string} title - The main title to be set.
   * @returns {void}
   * @example
   * // Usage example:
   * setPageTitle("My Page");
   */
  setPageTitle(title: string) {
    const changedTitle = title + ' ' + '|' + ' ' + this.TITLE;
    this.title.setTitle(changedTitle);
  }

  /**
   * @description Api for getting domain settings data.
   * we get alot of data from this apis like website title, logo, url, icon and etc...
   * @returns - an observable containing domain settings data.
   */
  getDomainSettingApi(): Observable<IApiRes<IAppConfig>> {
    return this.http.get<IApiRes<IAppConfig>>(
      `${this.ROOT_URL}/domain-settings`
    );
  }

  /**
   * @description Sets the invitation tracker state
   * @param isInvitation - Boolean indicating if user has invitation query param
   */
  setInvitationState(isInvitation: boolean, externalToken: string, email: string, initiated_from?: string): void {
    const invitationObject = {
      externalToken,
      email,
      invitation: isInvitation,
      initiated_from
    };
    sessionStorage.setItem('invitationObject', JSON.stringify(invitationObject));
    this.invitationState.next({invitation: isInvitation, externalToken, email, initiated_from});
  }

  /**
   * @description Gets current invitation tracker state
   * @returns Current invitation state
   */
  getInvitationState(): {invitation: boolean, externalToken: string, email: string} {
    return this.invitationState.value;
  }

}

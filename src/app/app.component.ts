import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  HostListener,
  inject,
  computed
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  ActivatedRoute,
  NavigationEnd,
  Params,
  Router,
  RouterOutlet
} from '@angular/router';
import { Store } from '@ngrx/store';
import { environment } from 'src/environments/environment';
import { AsyncPipe, NgClass } from '@angular/common';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
import { AppSettingsService } from './core/services/app-settings.service';
import { IdleService } from './core/services/idle.service';
import { AuthService } from './shared/service/auth/auth.service';
import { ScriptService } from './core/services/script.service';
import { LocalStorageService } from './shared/service/storage/local-storage.service';
import { ThemeService } from './shared/service/theme/theme.service';
import { AppActions } from './store/app.actions';
import { LayoutService } from './shared/service/layout/layout.service';
import { DynamicWhiteLabelService } from './modules/dynamic-white-label/service/dynamic-white-label.service';
import { CommonOnInitService } from './shared/service/common-onInit/common-on-init.service';
import { UserManagementActions } from './modules/store/userManagement/userManagement.actions';
import { IAppState } from './store/app-state.model';
import { IntroService } from './modules/intro-tour/service/intro.service';
import { IntroBoxComponent } from './modules/intro-tour/components/intro-box/intro-box.component';
import { UseMobileAppPageComponent } from './layout/use-mobile-app-page/use-mobile-app-page.component';
import { CustomDoubleSideModalOverlayComponent } from './shared/modal/custom-double-side-modal/custom-double-side-modal-overlay.component';
import { Utils } from './data/utils';
import { VersionCheckerService } from './shared/service/version-service/version.service';
import { NewUserPasswordSetupService } from './core/services/new-user-password-setup.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    RouterOutlet,
    UseMobileAppPageComponent,
    CustomDoubleSideModalOverlayComponent,
    AsyncPipe,
    IntroBoxComponent
  ]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'online-check-writer' as const;
  subscriptions: Subscription[] = [];
  isShowUseMobileApp$: BehaviorSubject<boolean>;
  updatedVersion: string;
  initiateIntroComponent = false;
  isItWhiteLabel = environment.isItWhiteLabel;
  mobilePageRoutes: { pattern: string; params: string }[] = [];

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResize(_event: Event) {
    this.layoutService.checkScreenWidthAndShowUseMobileApp();
  }

  private idleService = inject(IdleService);
  private authService = inject(AuthService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private scriptService = inject(ScriptService);
  private appSettingService = inject(AppSettingsService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private store = inject(Store<IAppState>);
  private layoutService = inject(LayoutService);
  private commonOnInitService = inject(CommonOnInitService);
  private introService = inject(IntroService);
  private activatedRoute = inject(ActivatedRoute);
  private versionCheckerService = inject(VersionCheckerService);
  private cardPaymentService = inject(CardPaymentService);
  private newUserPasswordSetupService = inject(NewUserPasswordSetupService);

  gotThreeDSChallenge = computed(() =>
    this.cardPaymentService.hasThreeDsChallenge()
  );

  ngOnInit(): void {
    this.versionCheckerService.checkForUpdate();
    this.initStore();
    this.timeOutFun();
    this.scriptService.appInitScripts();
    this.appSettingService.getDomainSettings();
    this.appSettingService.onChangePage();
    this.checkUserVerified();
    this.checkMobileWebBrowser();
    this.dynamicWhiteLabelService.setGlobalEnvironmentId();
    this.commonOnInitService.onInitFunctions();
    this.listenForIntroStartStop();
    this.newUserPasswordSetupService.subscribeToInvitationState();
    // this.checkRouteChange();
    this.mobilePageRoutes = this.appSettingService.MOBILE_PAGE_ROUTES;
  }

  checkMobileWebBrowser(): void {
    if (
      environment.env_id === 'production' ||
      environment.env_id === 'staging' ||
      environment.env_id === 'sandbox' ||
      environment.env_id === 'staging_dev' ||
      environment.env_id === 'zilMoney' // New condition for "zilMoney" environment
    ) {
      this.isShowUseMobileApp$ = this.layoutService.isShowUseMobileApp$;
      if (this.isShowUseMobileApp$) {
        this.isShowUseMobileApp$.subscribe((res: boolean) => {
          if (res) {
            const { queryParams } = this.activatedRoute.snapshot;
            const params = this.isPayeeOnboarding(queryParams);

            if (params) {
              // Redirect based on environment
              const redirectUrl =
                environment.env_id === 'zilMoney'
                  ? `https://m.zilmoney.com/#/payee-experience?${params}`
                  : `https://m.onlinecheckwriter.com/#/payee-experience?${params}`;

              window.location.href = redirectUrl;
              return;
            }

            const utmId = this.activatedRoute.snapshot.queryParams?.utm_id;
            const utmSource =
              this.activatedRoute.snapshot.queryParams?.utm_source;
            if (
              utmId &&
              utmSource &&
              window.innerWidth < 768 &&
              Utils.isMobile()
            ) {
              const str = [];
              for (
                let i = 0;
                i <
                Object.entries(this.activatedRoute.snapshot.queryParams).length;
                i += 1
              ) {
                const el = Object.entries(
                  this.activatedRoute.snapshot.queryParams
                )[i];
                str.push(
                  `${encodeURIComponent(el[0] as string)}=${encodeURIComponent(el[1] as string)}`
                );
              }
              const redirectUrl =
              environment.env_id === 'zilMoney'
                ? `https://m.zilmoney.com?page=register&${str.join('&')}`
                : `https://m.onlinecheckwriter.com?page=register&${str.join('&')}`;
              window.location.href = redirectUrl;
              return;
            }

            // General redirect based on environment
            const baseUrl =
              environment.env_id === 'zilMoney'
                ? 'https://m.zilmoney.com'
                : 'https://m.onlinecheckwriter.com';
            const pageParams = this.getMobilePageParams();
            window.location.href = pageParams
              ? `${baseUrl}?${pageParams}`
              : baseUrl;
          }
        });
      }
    } else {
      this.isShowUseMobileApp$ = this.layoutService.isShowUseMobileApp$;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.reloadOnTokenChange();
    }, 1000);
    this.themeService.setLightMode();
  }

  initStore() {
    this.store.dispatch(
      AppActions.appInit({
        isUserLoggedIn: this.authService.userLoggedIn
      })
    );
  }

  listenForIntroStartStop() {
    this.subscriptions.push(
      this.introService.introTrigger.subscribe((res) => {
        if (res === 'initiateComponent') {
          this.initiateIntroComponent = true;
          this.introService.introTrigger.next('startIntro');
        }
      }),
      this.introService.introStatus.subscribe((res) => {
        if (res === false) {
          this.initiateIntroComponent = false;
        }
      })
    );
  }

  timeOutFun() {
    this.idleService.isIdle$.subscribe((isIdle) => {
      if (isIdle) {
        this.authService.Logout();
      }
    });
  }

  reloadOnTokenChange() {
    if (!this.router.url.includes('/password/reset/')) {
      window.onstorage = (e) => {
        if (e.key === 'appToken' && e.newValue !== e.oldValue) {
          window.location.reload();
        }
      };
    }
  }

  isPayeeOnboarding(queryParams: Params): boolean | string {
    let obj: Record<string, string> = {};
    const initiatedFrom = obj?.initiated_from;
    if (initiatedFrom !== 'directDepositReceiving') return false;
    if (queryParams.returnUrl && queryParams.returnUrl.split['?'][1]) {
      const searchParams = new URLSearchParams(queryParams.returnUrl);
      // eslint-disable-next-line no-restricted-syntax
      for (const el of searchParams.entries()) {
        obj[el[0]] = el[1];
      }
    }
    if (!queryParams.returnUrl) {
      obj = queryParams;
    }
    if (
      initiatedFrom &&
      (initiatedFrom === 'directDepositReceiving' ||
        initiatedFrom === 'microDepositProcessed') &&
      window.innerWidth < 768 &&
      Utils.isMobile()
    ) {
      const str = [];
      for (let i = 0; i < Object.entries(obj).length; i += 1) {
        const el = Object.entries(obj)[i];
        str.push(`${encodeURIComponent(el[0])}=${encodeURIComponent(el[1])}`);
      }
      return str.join('&');
    }
    return false;
  }

  checkUserVerified() {
    if (
      this.localStorageService.appToken &&
      this.localStorageService.getItem('activeCompanyId')
    ) {
      this.store.dispatch(UserManagementActions.loadUserVerification());
    }
  }

  checkRouteChange() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.scriptService.matomoSetUserId(
          this.localStorageService.getItem('userId')
        );
      }
    });
  }


  /**
   * Get mobile page params based on returnUrl
   * Checks if returnUrl matches any configured route patterns
   * @returns Query string params for mobile page or empty string
   */
  private getMobilePageParams(): string {
    const returnUrl = this.activatedRoute.snapshot.queryParams?.returnUrl || '';
    const mode = this.activatedRoute.snapshot.queryParams?.mode || '';
    const matchedRoute = this.mobilePageRoutes.find((route) =>
      returnUrl.includes(route.pattern)
    );

    if (!matchedRoute) {
      return '';
    }

    // Extract mode from returnUrl if present
    if (mode) {
      return `page=${mode}`;
    }

    return matchedRoute.params;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.commonOnInitService.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

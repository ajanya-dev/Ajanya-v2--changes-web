import { Subscription, race, timer } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { Actions, ofType } from '@ngrx/effects';
import { ILoginDetails } from 'src/app/modules/auth/model/login';
import { ErrorHandler, Injectable, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ScriptService } from 'src/app/core/services/script.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { AttributionService } from 'src/app/core/services/attribution.service';
import { IIpSecurity } from 'src/app/modules/auth/model/security';
import { IRegisterResponse } from 'src/app/modules/auth/components/register/model/register';
import { WhatsNewService } from 'src/app/shared/service/whats-new/whats-new.service';
import { PoliciesService } from 'src/app/modules/company-switch/services/policies.service';
import { IdleService } from 'src/app/core/services/idle.service';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { IUserVerification } from 'src/app/models/user';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/app-state.model';
import { HttpParams } from '@angular/common/http';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { environment } from 'src/environments/environment';
import { Utils } from 'src/app/data/utils';
import { LocalStorageService } from '../storage/local-storage.service';
import { DataTableCacheService } from '../indexedDb/data-table-cache.service';
import { AuthService } from './auth.service';
import { AlertService } from '../alert/alert.service';
import { HeaderService } from '../header/header.service';
import { toV4IfEnabled } from '../route/v4-route-mapper';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';
import {
  IEmailPhoneVerificationState,
  VerificationMessageService
} from './verification-message.service';

/**
 * How long an auth event waits for user verification before firing anyway. Some
 * paths never dispatch it, and the effect drops the action when verification is
 * already loaded, so without this the event would never fire on those routes.
 */
const VERIFICATION_EVENT_TIMEOUT_MS = 10000;

@Injectable({
  providedIn: 'root'
})
export class AuthDataService implements OnDestroy {
  subscriptions: Subscription[] = [];
  isQBOnlineTimeSpanEnabled = false;
  isSetNewPassword: number | undefined;
  private scriptService = inject(ScriptService);
  private postHogService = inject(PostHogService);

  private attributionService = inject(AttributionService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dtCacheService = inject(DataTableCacheService);
  private localStorageService = inject(LocalStorageService);
  private browserTokenService = inject(BrowserTokenService);
  private verificationMessageService = inject(VerificationMessageService);
  private whatsNewService = inject(WhatsNewService);
  private policiesService = inject(PoliciesService);
  private idleService = inject(IdleService);
  private store = inject(Store<IAppState>);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);
  private errorHandler = inject(ErrorHandler);
  private actions$ = inject(Actions);
  afterLogin(
    response: ILoginDetails,
    returnUrlIfCompanyZero: string,
    returnUrl: string,
    isTempPassword?: number,
    loginMethod: string = 'email',
    userEmail?: string
  ): void {
    const res = this.convertMeResToLoginRes(response);
    // using this variable for set a new password
    this.isSetNewPassword = isTempPassword;
    this.localStorageService.appToken = res?.access_token;
    this.idleService.onInteraction();
    this.setStorage('username', res.name);
    const emailToStore = userEmail || res.email;
    if (emailToStore) {
      this.setStorage('email', emailToStore);
    }
    this.setStorage('isTwoFactorEnabled', res.isTwoFactorEnabled);
    this.setStorage(
      'isAdvancedTwoFactorEnabled',
      res.isAdvancedTwoFactorEnabled
    );
    this.setStorage('isV3LayoutEnabled', res.isV3LayoutEnabled);
    this.setStorage('isV4LayoutEnabled', res.isV4LayoutEnabled ?? 0);
    this.setStorage('showNewUiSwitchModal',res.showNewUiSwitchModal??0);
    this.setStorage('showNeverShowAgainCheckbox',res.showNeverShowAgainCheckbox??0);
    this.setStorage('versionSwitcherShown',0);
    this.policiesService.pendingPolicy.next(res.pendingPolicy);
    this.setStorage('defaultPage', res.landingPageUrl);
    this.localStorageService.setItem(
      'policyPending',
      res.pendingPolicy?.toString()
    );
    this.localStorageService.setItem(
      'isNewUser',
      response.isNewUser?.toString()
    );
    if (res.isVerified) {
      this.setStorage('verified', 'true');
    }
    this.localStorageService.setItem('showPremiumCheckNotification', true);
    if (
      res.isTwoFactorEnabled &&
      !res?.twoFactor?.success &&
      !this.localStorageService.getItem('ocw-admin')
    ) {
      this.requestTwoFactorTimer(returnUrlIfCompanyZero, returnUrl);
    } else {
      this.afterLoginConfig(res, returnUrlIfCompanyZero, returnUrl, loginMethod, userEmail);
    }

    if (res.showDemoModal) {
      this.setStorage('isShowDemo', res.showDemoModal);
    }


    if(res.showComplianceModal){
      this.setStorage('showComplianceModal', res.showComplianceModal);
    }

    if(res.showInternationalPaymentWelcomeModal !== undefined){
      this.setStorage('showInternationalPaymentWelcomeModal', res.showInternationalPaymentWelcomeModal);
    }

    this.headerService.hideNotShowDemoBtn = res.hideNotshowDemoBtn;
  }

  afterLoginConfig(
    response: ILoginDetails,
    returnUrlIfCompanyZero: string,
    returnUrl: string,
    loginMethod: string = 'email',
    userEmail?: string
  ) {
    this.scriptService.ipQualityScore();
    this.browserTokenService.ensure().subscribe();

    this.postHogService.resumeForCustomerSession();

    const res = this.convertMeResToLoginRes(response);

    if (res?.access_token) {
      const jwtUserId = JSON.parse(window.atob(res.access_token.split('.')?.[1]))?.sub;
      const userIdToStore = jwtUserId || res.userId;
      if (userIdToStore) {
        this.setStorage('userId', userIdToStore);
        this.setStorage('parentUserId', userIdToStore);
      }
    }

    if (res?.userAccountInfo) {
      this.localStorageService.setItem(
        'userAccountInfo',
        JSON.stringify(res.userAccountInfo)
      );
    }
    const orgId = res.companies?.parentComapnyId || res.companyInfo?.companyId;
    const companyName = res.companies?.parentCompanyName || res.companyInfo?.companyName;
    if (orgId) {
      this.localStorageService.setItem('moeOrgId', orgId);
    }
    if (companyName) {
      this.localStorageService.setItem('moeCompanyName', companyName);
    }

    // this.scriptService.trackMatomoEvent(
    //   'Login',
    //   'Login_success',
    //   'Login_success',
    //   this.localStorageService.getItem('userId')
    // );

    const localEmail = this.localStorageService.getItem('email');
    const localName = this.localStorageService.getItem('username');

    const loginUserId = this.localStorageService.getItem('parentUserId') || res.userId;
    if (loginUserId) {
      const loginEmail = userEmail || localEmail || res.email || '';
      const siteIdentifier = environment.env_id === 'zilMoney' ? 'ZM' : 'OCW';

      // capture() reads email from storage for its common block; afterLogin()
      // usually seeds it, but 2FA and /me paths can reach here without that.
      if (loginEmail) {
        this.setStorage('email', loginEmail);
      }

      // Several navigation branches dispatch this too late or skip it entirely,
      // so verification must be in flight before captureAfterVerification races.
      this.store.dispatch(UserManagementActions.loadUserVerification());

      // Taken here, not inside the closure: the closure waits for verification,
      // so a time read there would record when that settled, not the login.
      const loggedAt = new Date();
      const timestamp = loggedAt.toISOString();
      const isFirstLogin = !!res.isNewUser;
      // The API sends whole days since the previous login, so this is that
      // login's date at the current time of day. A first login has no previous
      // one, and neither does a response without the field: both use this login.
      const lastLoginAt =
        !isFirstLogin && res.daysSinceLastLogin != null
          ? new Date(
              loggedAt.getTime() - res.daysSinceLastLogin * 24 * 60 * 60 * 1000
            ).toISOString()
          : timestamp;

      // The hash needs crypto.subtle, which is absent on non-secure origins.
      // Swallow that into an empty hash so identify() — the only thing that
      // creates the person profile under `person_profiles: 'identified_only'` —
      // can never be lost with it.
      Utils.getHash(loginEmail.trim().toLowerCase())
        .catch(() => '')
        .then((emailHash) => {
          // Held until user verification settles, so identify() and the event
          // carry the same complete customer block — phone and the verified
          // flags are unknown before that. captureAfterVerification races the
          // store against a failure action and a timer, so it always fires and
          // the profile can never be lost by waiting.
          this.captureAfterVerification((verification) => {
            const resolvedEmail =
              this.postHogService.resolveContactEmail(
                loginEmail || verification?.email
              );
            if (resolvedEmail) {
              this.setStorage('email', resolvedEmail);
            }
            if (verification?.phone) {
              this.setStorage('phone', verification.phone);
            }
            if (verification) {
              this.setStorage('emailVerified', !!verification.email_verified);
              this.setStorage('phoneVerified', !!verification.phone_verified);
            }

            const customer = this.postHogService.customerPayload(
              {
                name: localName || '',
                customerId: String(loginUserId),
                companyId: String(orgId || ''),
                companyName: String(companyName || ''),
                email: resolvedEmail
              },
              verification
            );

            // Same shape as trackRegisterSuccess: the second argument is the
            // durable person bag, the third the approved event contract — the
            // four keys user_login sends and nothing else.
            this.postHogService.trackUserLogin(
              loginUserId.toString(),
              {
                ...customer,
                email_hash: emailHash,
                is_verified: !!res.isVerified,
                is_two_factor_enabled: !!res.isTwoFactorEnabled,
                user_plan_type: res.userAccountInfo?.user_plan_type || '',
                site_identifier: siteIdentifier
              },
              {
                site_identifier: siteIdentifier,
                is_first_login: isFirstLogin,
                timestamp,
                last_login_at: lastLoginAt
              }
            );
          });
        })
        .catch((error) => {
          this.errorHandler.handleError(
            new Error(`AuthDataService: PostHog afterLoginConfig tracking failed - ${error}`)
          );
        });
    }

    if (res.accountClosed == 1) {
      this.localStorageService.setItem('restore-date', res['restore-date']!);
      this.router.navigateByUrl('/restoreAccount');
      this.localStorageService.setItem('username', res.username!);
      return;
    }
    this.scriptService.gtagEventScript('logged-in');
    this.scriptService.runSiftTrackingCode();
    this.scriptService.pushUserId;
    this.scriptService.SetUserIdAndSessionId();
    this.authService.userLoggedIn = true;
    this.dtCacheService.resetTablePostData();
    this.scriptService.hideZohoChat();
    if (res.isVerified) {
      this.setStorage('verified', 'true');
    }

    /** If the user have temporary password we should redirect to the set new password page. */
    if (this.isSetNewPassword) {
      this.router.navigateByUrl('set-new-password');
      return;
    }

    /** If its from deep link, we should directly redirect to return URL. (company id and name already stored)  */
    if (this.localStorageService.getItem('isDeeplink')) {
      this.store.dispatch(UserManagementActions.loadUserVerification());
      this.router.navigateByUrl(this.applyV4LayoutPrefix(returnUrl));
      return;
    }

    /** Redirect user basis of number of companies */
    if (
      res.companies.totalCompanies > 0 ||
      res.companies.invitedCompaniesCount > 0
    ) {
      this.setStorage('activeCompanyName', res.companies.parentCompanyName);
      this.setStorage('activeCompanyId', res.companies.parentComapnyId);
      this.setStorage('parentCompanyId', res.companies.parentComapnyId);
      this.store.dispatch(UserManagementActions.loadUserVerification());
      this.router.navigateByUrl(this.applyV4LayoutPrefix(returnUrl));
      return;
    }

    if (
      res.companies.totalCompanies == 0 &&
      res.companies.invitedCompaniesCount == 0
    ) {
      this.setStorage('activeCompanyName', res.companyInfo.companyName);
      this.setStorage('activeCompanyId', res.companyInfo.companyId);
      this.setStorage('activeCompanyType', 'owncmp');
      this.store.dispatch(UserManagementActions.loadUserVerification());
      this.whatsNewService.isCompanyZero = true;
    }

    /** Redirect user after login on the basis of his default company information(old version) */
    if (
      res.companyInfo.companyName == '' ||
      res.companyInfo.companyName == null ||
      res.companyInfo.companyName == 'null'
    ) {
      this.whatsNewService.routeUserBasedOnVideoFlag(
        returnUrl,
        returnUrlIfCompanyZero
      );
      return;
    }

    if (res.companyInfo.parentOnly || res.companyInfo.isItDefault == 1) {
      this.setStorage('activeCompanyName', res.companyInfo.companyName);
      this.setStorage('activeCompanyId', res.companyInfo.companyId);
      this.store.dispatch(UserManagementActions.loadUserVerification());

      if (res.companyInfo.isOwnCompany) {
        this.setStorage('activeCompanyType', 'owncmp');
      } else {
        this.setStorage('activeCompanyType', 'invcomp');
      }

      if (returnUrl?.includes('?')) {
        const params = new HttpParams({
          fromString: returnUrl.split('?')[1] ?? ''
        });
        const url = returnUrl.split('?')[0];
        const queryParams: Record<string, unknown> = {};
        params.keys().forEach((key) => {
          queryParams[key] = params.get(key);
        });
        this.router.navigate([this.applyV4LayoutPrefix(url)], { queryParams });
        return;
      }
      this.router.navigateByUrl(this.applyV4LayoutPrefix(returnUrlIfCompanyZero));
    }
  }

  /**
   * When the user has opted into the v4 layout, translate the post-login URL
   * to its v4 equivalent via the shared route mapper.
   * Exception: keep the company-switch URL intact so users who still need to
   * pick a company land on the v4 company-switch page (the module's route
   * guard swaps in the `_v4` variant).
   */
  private applyV4LayoutPrefix(url: string): string {
    if (this.localStorageService.getItem('isV4LayoutEnabled') !== 1) {
      return url;
    }
    if (this.isCompanySwitchUrl(url)) {
      return url;
    }
    return toV4IfEnabled(url, this.localStorageService);
  }

  private isCompanySwitchUrl(url: string): boolean {
    if (!url) return false;
    const path = url.split('?')[0].replace(/\/+$/, '');
    return (
      /(^|\/)manage\/company_management$/.test(path) ||
      path.includes('company_management/select_company_dashboard')
    );
  }

  /** Some scenarios We are using the '/me' API to get the login response.
   * In login resp, it will get all the keys directly, But in /me,
   * it gives all the keys inside data,
   * so in this function, we are rearranging the /me resp to login resp. */
  convertMeResToLoginRes(response: ILoginDetails | any): ILoginDetails {
    return {
      ...(response?.data ? response.data : response),
      ...(response?.data
        ? { access_token: this.localStorageService.appToken }
        : {})
    };
  }

  requestTwoFactorTimer(returnUrlIfCompanyZero: string, returnUrl: string) {
    this.subscriptions.push(
      this.authService
        .requestTwoFactorTimer()
        .subscribe(
          (res: {
            success: boolean;
            backupActivated: boolean;
            errorMsg: string | number;
          }) => {
            if (!res.success) {
              this.afterTwoFactorSuccess(returnUrlIfCompanyZero, returnUrl);
            }
          }
        )
    );
  }

  afterTwoFactorSuccess(
    returnUrlIfCompanyZero: string,
    returnUrl: string
  ): void {
    const queryParams = { returnUrlIfCompanyZero, returnUrl };
    const isV4 = this.localStorageService.getItem('isV4LayoutEnabled') === 1;
    const targetPath = isV4 ? '/two-factor-auth-v4' : '/two-factor-auth';
    this.router.navigate([targetPath], { queryParams });
  }

  ipAddressVerificationRequired(
    err: IIpSecurity,
    returnUrlIfCompanyZero: string,
    returnUrl: string
  ): void {
    const queryParams = { returnUrlIfCompanyZero, returnUrl };
    this.router.navigate([`user-verification-required/${err.event_token}`], {
      queryParams
    });
    this.setStorage('email', err.user_email || '');
  }

  async onSignupSuccess(res: IRegisterResponse, trackingData?: {
    email?: string;
    /** The dial code ('+1'), despite the name — kept for existing callers. */
    countryCode?: string;
    /** Country name, e.g. 'United States'. */
    countryName?: string;
    /** ISO 3166-1 alpha-2, e.g. 'US'. */
    countryIso?: string;
    hasCoupon?: boolean;
    referralCode?: string;
    isIntegrationSignup?: boolean;
    registrationMethod?: string;
  }) {
    const token: string = res.access_token;
    this.localStorageService.appToken = token;
    this.browserTokenService.ensure().subscribe();
    this.setStorage('username', res?.name);
    this.setStorage('userId', res?.userInfo?.userId);
    this.setStorage('parentUserId', res?.userInfo?.userId);
    this.setStorage('activeCompanyName', res?.companyInfo?.companyName);
    this.setStorage('activeCompanyId', res?.companyInfo?.companyId);
    this.localStorageService.setItem('moeOrgId', res?.companyInfo?.companyId);
    this.localStorageService.setItem('moeCompanyName', res?.companyInfo?.companyName);
    this.setStorage('activeCompanyType', 'owncmp');
    this.localStorageService.setItem('isNewUser', '1');
    this.localStorageService.setItem(
      'encryptedUserId',
      res.userInfo.encryptedUserId
    );
    this.localStorageService.setItem('isShowDemo', 1);
    this.localStorageService.setItem('isV4LayoutEnabled', 1);
    this.localStorageService.setItem('showComplianceModal', res.showComplianceModal);
    this.localStorageService.setItem('policyPending', '0');
    this.store.dispatch(UserManagementActions.loadUserVerification());

    const userId = res?.userInfo?.userId;
    if (userId !== undefined && userId !== null) {
      const siteIdentifier = environment.env_id === 'zilMoney' ? 'ZM' : 'OCW';


      const orgId = res?.companyInfo?.companyId || '';
      const orgName = res?.companyInfo?.companyName || '';
      const referralCode = trackingData?.referralCode || null;

      // Signup is the only place this is known. Registering it as a super
      // property lets the SDK carry it onto every later event by itself, with
      // no app-side storage key to keep in sync. registration_method and
      // is_integration_signup are deliberately not registered: as super
      // properties they were stamped on every event, register_success included.
      this.postHogService.registerSignupAttribution({
        referral_code: referralCode
      });

      // Awaited rather than chained: the callers await onSignupSuccess before
      // redirecting, so identify() — the only thing that creates the person
      // profile under `person_profiles: 'identified_only'` — lands before the
      // navigation. The catch keeps a missing crypto.subtle (non-secure origin)
      // from taking identify() and the events down with the hash.
      const emailHash = trackingData?.email
        ? await Utils.getHash(trackingData.email.trim().toLowerCase()).catch(
            () => ''
          )
        : '';

      try {
        const trialDurationDays = this.toTrialDurationDays(res);
        const trialPlanType = res.trialPlanType ?? null;

        // Taken here, not inside the closure: the closure waits for the user
        // verification stream to settle, so a timestamp read there would record
        // when verification arrived rather than when the account was created.
        const registeredAt = new Date().toISOString();

        // Whatever campaign the signup URL itself carries. Read from the URL
        // only — nothing is persisted, so a visitor who landed with a gclid on
        // another page load or another subdomain arrives here with none.
        const attribution = this.attributionService.getFirstTouchAttribution();

        // One closure, so identify() and the signup events keep their order and
        // share one customer block: identify first, then register, then the
        // trial event, then the profile update the trial spec puts after it.
        // Held until user verification settles, since phone and the verified
        // flags are unknown before that.
        this.captureAfterVerification((verification) => {
          const resolvedEmail =
            this.postHogService.resolveContactEmail(
              trackingData?.email || verification?.email
            );
          if (resolvedEmail) {
            this.setStorage('email', resolvedEmail);
          }
          if (verification?.phone) {
            this.setStorage('phone', verification.phone);
          }
          if (verification) {
            this.setStorage('emailVerified', !!verification.email_verified);
            this.setStorage('phoneVerified', !!verification.phone_verified);
          }

          const customer = this.postHogService.customerPayload(
            {
              name: res.name || '',
              customerId: String(userId),
              companyId: orgId,
              companyName: orgName,
              email: resolvedEmail
            },
            verification
          );

          // One call, the same shape as trackUserLogin: the service owns the
          // identify -> set-once -> capture order the spec fixes. The second
          // argument is the durable person bag, the third the landing attribution
          // written set-once, the fourth the approved event contract.
          //
          // `company` and `signup_date` are not passed here: the service sets
          // them on the profile from the event's own `company` and
          // `registered_at`, so one value cannot disagree with the other.
          this.postHogService.trackRegisterSuccess(
            userId.toString(),
            {
              ...customer,
              email_hash: emailHash,
              signup_source: 'web_app',
              // The name, not the dial code that used to be sent here: '+1'
              // named no country, since it is both the US and Canada. Blank is
              // dropped downstream, so an unknown country is simply absent.
              country: trackingData?.countryName || '',
              account_status: 'active',
              user_plan_type: trialPlanType,
              site_identifier: siteIdentifier
            },
            attribution,
            {
              registered_at: registeredAt,
              user_id: String(userId),
              company_id: orgId || undefined,
              // resolveContactEmail() already falls back through the caller,
              // the verification stream and storage; '' means genuinely unknown,
              // and the contract omits the field rather than sending it blank.
              email: resolvedEmail || undefined,
              // Blank when crypto.subtle was unavailable, which is a non-secure
              // origin rather than a missing email; omitted rather than sent as
              // '', the same as every other optional field on this contract.
              email_hash: emailHash || undefined,
              ...attribution
            }
          );

          this.postHogService.capture('trial_period_started', {
            ...customer,
            trial_duration_days: trialDurationDays,
            plan_type: trialPlanType,
            trigger_point: 'onboarding_feature_selection'
          });

          // The trial fields stay on trial_period_started and are deliberately
          // not mirrored onto the person: a person property shows against every
          // event in PostHog, which is how plan_type, trigger_point and
          // trial_duration_days were turning up on register_success.
        });
      } catch (error) {
        this.errorHandler.handleError(
          new Error(`AuthDataService: PostHog onSignupSuccess tracking failed - ${error}`)
        );
      }
    }

    this.scriptsAfterSignUp();
  }

  /**
   * Resolves the trial length in days for tracking. `trialDuration` from the
   * register response is the source of truth, but the response omits it on
   * some plans, and an undefined value is dropped by JSON serialisation — the
   * property then reaches PostHog as missing rather than empty. Falling back
   * to the span between the trial dates keeps it populated, and null keeps the
   * key present when neither is usable.
   * @param {IRegisterResponse} res - The register response.
   * @returns {number | null} The trial length in days, or null if unknown.
   */
  private toTrialDurationDays(res: IRegisterResponse): number | null {
    if (typeof res.trialDuration === 'number' && !Number.isNaN(res.trialDuration)) {
      return res.trialDuration;
    }

    const startMs = new Date(res.trialStartDate).getTime();
    const endMs = new Date(res.trialEndDate).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return null;
    }

    return Math.max(0, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
  }

  scriptsAfterSignUp() {
    this.scriptService.gtagEventScript('sign-up');
    this.scriptService.onRunAwinCode(
      0,
      `reg-${this.localStorageService.getItem('userId')}`
    );
    this.scriptService.dataLayerPush('sign-up');
    this.scriptService.cjSiteScript2();
    this.scriptService.emitOutBrainEvent(`'track', 'Registration'`);
    // if (
    //   environment.env_id === 'production' ||
    //   environment.env_id === 'zilMoney'
    // ) {
    //   this.scriptService.affiliateScript(
    //     0.25,
    //     `reg-${this.localStorageService.getItem('userId')}`,
    //     'register'
    //   );
    // }
  }


  setStorage(key: LocalStorageKeys, value: any) {
    this.localStorageService.setItem(key, value);
  }

  /**
   * @description Builds the warning message naming only the credentials that are still unverified.
   * @param state - User verification state. When omitted, the `emailVerified` and
   * `phoneVerified` local storage flags are used instead.
   */
  getVerificationMessage(state?: IEmailPhoneVerificationState | null): string {
    return this.verificationMessageService.getVerificationMessage(state);
  }

  /**
   * @description Method for navigating to email and phone verification page.
   * @param msg -Error message. Defaults to the message for the currently unverified credentials.
   */
  verifyEmailAndMobile(msg?: string, cancelBtnMsg?: string,returnUrl?:string) {
    const ref = this.alertService.warningAlert({
      content: msg ?? this.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: cancelBtnMsg ?? 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl
          }
        });
      }
    });
  }

  /**
   * Runs `fire` once user verification settles, so the event marks an established
   * session rather than just a successful auth response. Covers all four outcomes:
   * verification already loaded (fires at once), loaded later, the call failing, or
   * the dispatch being dropped by the effect's guard — the timer releases that one.
   * @param fire - Sends the event; called exactly once.
   */
  private captureAfterVerification(
    fire: (verification: IUserVerification | null) => void
  ): void {
    this.subscriptions.push(
      race(
        this.store.select(selectUserVerification).pipe(
          filter((verification) => verification !== null)
        ),
        // Failure and timeout carry no verification state, so the contact fields
        // are simply absent rather than guessed.
        this.actions$.pipe(
          ofType(UserManagementActions.loadUserVerificationFailure),
          map(() => null)
        ),
        timer(VERIFICATION_EVENT_TIMEOUT_MS).pipe(map(() => null))
      )
        .pipe(take(1))
        .subscribe((verification) =>
          fire(verification as IUserVerification | null)
        )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s: Subscription) => s.unsubscribe());
  }
}

import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { MatDialog } from '@angular/material/dialog';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MainHeader } from 'src/app/data/data/menu/header/MainHeader';
import {
  IAllCompanies,
  IHeaderData,
  IHeaderLinks,
  INotificationDetails,
  IGroupedNotification,
  IOwnCompany,
  IWallet,
  IWhatsNewSlider,
  INewNotification
} from 'src/app/layout/model/header';
import { Subscription, merge, of, fromEvent, Observable } from 'rxjs';
import { delay, finalize, map } from 'rxjs/operators';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { resolveV3RecurringNotificationLink } from 'src/app/shared/service/route/v4-route-mapper';
import { UserService } from 'src/app/shared/service/user/user.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { subscriptionOffers } from 'src/app/data/data/subscription';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { IUserVerification } from 'src/app/models/user';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { IGettingStartedData } from 'src/app/models/getting-started';
import { V3PaymentSummaryModalComponent } from 'src/app/modules/v3-bulk-payment/modals/v3-payment-summery-modal/v3-payment-summary-modal.component';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { IPaymentSummaryData } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { HttpErrorResponse } from '@angular/common/http';
import { TransferDetailsService } from 'src/app/modules/transfers/services/transfer-details.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { IntroJsService } from 'src/app/shared/service/introjs/intro-js.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import {
  NgOptimizedImage,
  NgClass,
  NgFor,
  NgIf,
  UpperCasePipe,
  JsonPipe,
  DatePipe
} from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { environment } from 'src/environments/environment';
import { days } from 'src/app/data/data/notification';
import {
  faBars,
  faMagnifyingGlass,
  faXmark,
  faStar as faStarSolid,
  faRedo,
  faRepeat,
  faCalendarDay,
  faClock,
  faCircleExclamation
} from '@fortawesome/pro-solid-svg-icons';
import { PusherService } from 'src/app/core/services/pusher.service';
import { Channel } from 'pusher-js';
import { faCheck, faCrown, faLock } from '@fortawesome/pro-regular-svg-icons';
import { toObservable } from '@angular/core/rxjs-interop';
import { WhiteLabel } from 'src/app/modules/dynamic-white-label/dynamic-white-label-data/dynamic-white-label-data';
import { FormsModule } from '@angular/forms';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { ImportFromExcelComponent } from 'src/app/shared/modal/import-from-excel/import-from-excel.component';
import { faStar } from '@fortawesome/pro-thin-svg-icons';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { Store } from '@ngrx/store';
import { CommonButtonV35Component } from '../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonHelpButtonComponent } from '../common-help-button/common-help-button.component';
import { HeaderCompanyDropDownListComponent } from '../../sub-components/header-company-drop-down-list/header-company-drop-down-list.component';
import { DynamicHeaderV35Component } from '../dynamic-header-v35/dynamic-header-v35.component';
import { SideBarService } from '../../side-bar/side-bar.service';
import { WhatsNewComponent } from '../../header/whats-new/whats-new.component';
import { OutsideClickDirective } from '../../../directive/outside-click.directive';
import { RerunVerificationComponent } from 'src/app/modules/payments/shared/modal/rerun-verification/rerun-verification.component';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';

@Component({
  selector: 'app-header-v35',
  templateUrl: './header-v35.component.html',
  styleUrls: ['./header-v35.component.scss'],
  standalone: true,
  imports: [
    MatProgressBar,
    NgOptimizedImage,
    MatTooltip,
    NgClass,
    FaIconComponent,
    CommonButtonV35Component,
    NgFor,
    RouterLink,
    NgIf,
    CommonHelpButtonComponent,
    MatMenuTrigger,
    MatMenu,
    HeaderCompanyDropDownListComponent,
    DynamicHeaderV35Component,
    WhiteLabelDirective,
    CdkDrag,
    UpperCasePipe,
    SearchFilterPipe,
    FormsModule,
    JsonPipe,
    OutsideClickDirective
  ],
  providers: [DatePipe]
})
export class HeaderV35Component implements OnInit, OnDestroy, AfterViewInit {
  selectedCompanyId: string;
  isHidden: boolean;
  animation: boolean;
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.screenWidth = window.innerWidth;
  }

  subscriptions: Subscription[] = [];
  pusherChannels: Channel[] = [];
  private userId: number;
  gettingStartedData: IGettingStartedData = {
    isEmailVerificationDone: false,
    isPhoneVerificationDone: false,
    isBankAccountLinkingDone: false,
    isBankAccountVerificationDone: false,
    isFirstPayeeDone: false,
    isFirstPaymentDone: false,
    isKycStatusDone: false,
    isKybStatusDone: false
  };

  /* Injecting dependencies using inject method */
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private personaHelperService = inject(PersonaHelperService);
  private headerService = inject(HeaderService);
  private userService = inject(UserService);
  private sharedService = inject(SharedService);
  private companyManagementService = inject(CompanyManagementService);
  private dtCacheService = inject(DataTableCacheService);
  private authService = inject(AuthService);
  private adpService = inject(AdpService);
  private scriptService = inject(ScriptService);
  private userProfileService = inject(UserProfileService);
  private sideBarService = inject(SideBarService);
  private themeService = inject(ThemeService);
  private transferDetailsService = inject(TransferDetailsService);
  private localStorageService = inject(LocalStorageService);
  private commonOnInitService = inject(CommonOnInitService);
  private introJsService = inject(IntroJsService);
  public gettingStartedService = inject(GettingStartedService);
  public v3BulkPaymentService = inject(V3BulkPaymentService);
  public layoutService = inject(LayoutService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private authDataService = inject(AuthDataService);
  private cloudService = inject(CloudBankService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private userManagementService = inject(UserManagementV35Service);
  private pusherService = inject(PusherService);
  private store = inject(Store);
  private datePipe = inject(DatePipe);

  /* Variables */
  isQuickNavigationMenuShown = false;
  quickNavigationMenu: IHeaderLinks[] = MainHeader.headerDropdownLink().sort(
    (a, b) => a.title.localeCompare(b.title)
  );

  // Add favorite functionality
  fouritButtons: IHeaderLinks[] = [];
  isFavoriteButtonsExpanded = false; // Track favorite buttons toggle state for mobile
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  isCSNHCRequirement = environment.env_id === 'csnhc';
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  allCompanies: IAllCompanies;
  companyName: string;
  activeCompanyId: string;
  activeComapanyLogo: string;
  currentUrl: string;
  isLoading = false;
  profilePic: string;
  personalName: string;
  personalInfo: IHeaderData['personalInfo'];
  notificationCount: number;
  notifications: INotificationDetails[] = [];
  newNotificationCount = 0;
  showNewNotificationPanel = false;
  redirectNotficationPage: string;
  trialPeriodEndingAlert: {
    [key: number]: { offerPerc: number; value: number };
  };

  adpMarketPlaceUser: number;
  newNotification: INewNotification;
  isSubscribed: number;
  Trialend: number;
  /** Trial end date formatted for display, e.g. "December 5, 2027". */
  trialPeriodEndDate = '';
  mailCreditBalance = '000000';
  walletTableData: IWallet;
  whatsNew: number;
  subscribedEndDate: string;
  isShowTrailPeriod: number;
  isSubscribedEnd: number;
  cjScriptLoaded = false;
  demoVideos: string;
  link: string;
  online$: Observable<boolean>;
  isOffline: boolean;
  kycLoading = false;
  kycKybStatus: { kycStatus: number | null; kybStatus: number | null } = {
    kycStatus: 2,
    kybStatus: 2
  };

  isUserVerified: IUserVerification;
  mobileMenu = false;
  isDarkMode = false;
  alertTooltip: string;
  width = 0;
  progressBarValue: boolean;
  bulkPaymentCount: number;
  isShowPaymentSummary = false;
  isBulkPaymentProcessing = false;
  bulkData: (IPaymentSummaryData | IPaymentSummaryData[])[];
  countOfFailedPayment: number;
  enabledPlugins: string[];
  creditCardUser: number;
  isEnabledPlugins: boolean;
  isEnabledhamaspikPlugins: boolean;
  createNewPlugIn: boolean;
  whatsNewView = false;
  whatsnewslider: IWhatsNewSlider[];
  screenWidth: number;
  showTrialPeriodPopup: '0' | '1';
  showStatus = false;
  isEnableYoungwilliamsPlugins: boolean;
  showDemo: number;
  groupedNotifications: IGroupedNotification[] = [];
  isEnableHaloPlugins: boolean;
  isEnableSalesForceplugins: boolean;
  isEnableBeazleyPlugin: boolean;
  isNotiFication = false;
  faXmark = faXmark;
  isEnableSpectrumPlugins: boolean;
  isEnableMilwaukeePlugins: boolean;
  env = environment;
  faLoack = faLock;
  faCrown = faCrown;
  faCheck = faCheck;
  faBars = faBars;
  faStar = faStar;
  faRedo = faRedo;
  faRepeat = faRepeat;
  faStarSolid = faStarSolid;
  faCalendarDay = faCalendarDay;
  faClock = faClock;
  faCircleExclamation = faCircleExclamation;
  abcEnterpriseCheckPrintStatus: {
    total: number;
    success: number;
    fail: number;
    canceled: number;
  };

  checkPrinting$ = toObservable(
    this.v3BulkPaymentService.abcEntCheckPrintCountSignal
  );

  dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();
  currentEnvironmentId = environment.env_id;
  isHideBookDemo = false;
  faMagnifyingGlass = faMagnifyingGlass;
  searchValue: string;
  showUpgradeBtn = false;
  payAsYouGoPlans = [
    'pay-as-you-go-monthly',
    'pay-as-you-go-yearly',
    'pay-as-you-go-monthly-new',
    'pay-as-you-go-yearly-new',
    'pay-as-you-go-monthly-v3'
  ];
  
  bypassHeaderDemoButtonUser = false;
  isQuickAccessOpenedJustNow = false;
  rerunKybShowSignal = computed(() => this.headerService.rerurnKybStatus());
  eddTriggerStatus = computed(() => this.headerService.eddTriggerStatus());
  kybPersonaVerificationShowSignal = computed(() =>
    this.headerService.kybPersonaVerificationStatus()
  );

  showVersionSwitcher = signal(false);
  /**
   * @description This property is used to show or hide the refer and earn button.Temporarly disbaled as per partener bank request.
   */
  showReferAndEarn = false;

  /**
   * @description True when the subscription/trial alert banner (trial-period or
   * subscription-expired) is rendered in the header. The banner text plus the
   * "Upgrade Plan"/"Please renew" link consume horizontal space, so when it is
   * visible the "Switch to the new version" button collapses earlier (label ->
   * icon + BETA -> icon only) to keep the header on a single row. Consumed by the
   * `alert-active` modifier class on `.version-switch-wrapper`.
   */
  get isSubscriptionAlertVisible(): boolean {
    const baseVisible =
      !!this.staticWhiteLabelConditions?.subscriptionVisible &&
      this.personalInfo?.isLegalEnabled !== 1 &&
      !this.createNewPlugIn;

    if (!baseVisible) {
      return false;
    }

    const trialBannerVisible =
      this.isSubscribed === 0 &&
      this.isShowTrailPeriod === 1 &&
      this.isSubscribedEnd === 0 &&
      this.adpMarketPlaceUser !== 1;

    const subscriptionExpiredBannerVisible =
      this.subscribedEndDate !== '' && this.isSubscribedEnd === 1;

    return trialBannerVisible || subscriptionExpiredBannerVisible;
  }

  /** Whether the "Action needed" dropdown is currently open. */
  isActionNeededExpanded = false;

  /** True when a verification action (KYB re-verification or EDD) is pending. */
  get showVerificationAction(): boolean {
    return Boolean(
      this.rerunKybShowSignal() ||
        this.eddTriggerStatus() ||
        this.kybPersonaVerificationShowSignal()
    );
  }

  get verificationActionTitle(): string {
    return this.kybPersonaVerificationShowSignal()
      ? 'Keep your account verified'
      : 'Verify your identity';
  }

  get verificationActionMessage(): string {
    return this.kybPersonaVerificationShowSignal()
      ? 'Regulations require us to periodically confirm your business details. Most of your information is already on file — only a few items need review.'
      : 'A quick identity check unlocks higher sending limits and keeps your payments moving.';
  }

  get verificationActionDuration(): string {
    return this.kybPersonaVerificationShowSignal()
      ? 'Takes less than a minute'
      : 'Takes about 2 minutes';
  }

  get verificationActionCta(): string {
    return this.kybPersonaVerificationShowSignal()
      ? 'Review and Complete'
      : 'Verify now';
  }

  /**
   * Tooltip shown when hovering the standalone trial banner. Mirrors the
   * "Action needed" card copy and appends the formatted trial end date in
   * brackets when available, e.g.
   * "Upgrade to keep sending checks and payments without missing a beat (Trial ends Jul 12)".
   */
  get trialBannerTooltip(): string {
    if (this.Trialend === 0) {
      return 'Your trial period has ended. Upgrade to keep sending checks and payments without missing a beat.';
    }
    const base =
      'Upgrade to keep sending checks and payments without missing a beat';
    return this.trialPeriodEndDate
      ? `${base}\n(Trial ends ${this.trialPeriodEndDate})`
      : base;
  }

  /**
   * Tooltip shown when hovering the standalone subscription-expired banner.
   * Restores the responsive tooltip so the message/renew call-to-action stays
   * accessible when the "Please renew" link is hidden on smaller screens.
   */
  get subscriptionExpiredTooltip(): string {
    return this.subscribedEndDate
      ? `Your subscription expired ${this.subscribedEndDate}`
      : 'Your subscription expired';
  }

  /** Number of pending items shown inside the "Action needed" dropdown. */
  get actionNeededCount(): number {
    return (
      (this.isSubscriptionAlertVisible ? 1 : 0) +
      (this.showVerificationAction ? 1 : 0)
    );
  }

  /**
   * Whether to render the consolidated "Action needed" dropdown.
   * Only shown when there are 2+ pending sections; with a single section we
   * fall back to rendering that alert standalone (see template).
   */
  get showActionNeeded(): boolean {
    return this.actionNeededCount > 1;
  }

  /** Toggle the "Action needed" dropdown open/closed. */
  toggleActionNeeded(event: Event): void {
    event.stopPropagation();
    this.isActionNeededExpanded = !this.isActionNeededExpanded;
  }

  /** Upgrade/renew action triggered from the "Action needed" dropdown. */
  onActionUpgrade(): void {
    this.gtagScript();
    this.goToSubscription(this.isSubscribedEnd === 1 ? 'renew' : undefined);
    this.isActionNeededExpanded = false;
  }

  /** Verification action triggered from the "Action needed" dropdown. */
  onActionVerify(): void {
    if (this.kybPersonaVerificationShowSignal()) {
      this.openKybPersonaVerificationModal();
    } else {
      this.openRerunKybModal(this.eddTriggerStatus() ? 'edd' : 'kyb');
    }
    this.isActionNeededExpanded = false;
  }

  constructor() {
    if (this.localStorageService.getItem('profilePicLink')) {
      this.profilePic =
        this.localStorageService.getItem('profilePicLink') || '';
    }
    if (this.localStorageService.getItem('displayName')) {
      this.personalName = this.getTwoCharOfUseName(
        this.localStorageService.getItem('displayName') || ''
      );
    }
  }

  ngOnInit(): void {
    if (environment.env_id === 'olliepay') {
      this.quickNavigationMenu = this.quickNavigationMenu.filter(
        (el) => el.id !== 'shippingLabel'
      );
    }
    if (
      environment.env_id === 'archarina' ||
      environment.env_id === 'archarina-sandbox'
    ) {
      this.quickNavigationMenu = this.quickNavigationMenu.filter(
        (el) => el.id !== 'issueVisaCard'
      );
    }
    this.getWhiteLabel();
    this.currentUrl = this.router.url;
    this.headerData();
    this.loadProgressBar();
    this.activeCompanyId =
      this.localStorageService.getItem('activeCompanyId') || '';
    this.checkHeaderChanged();
    this.checkLayOut();
    this.isOnline();
    this.getCompletedPaymentCount();
    this.getCompletedCheckPrint();
    this.getBulkPaymentCount();
    this.getCountFailedPayment();
    this.headerNotificationData();
    this.scrollSubcribe();
    this.screenWidth = window.innerWidth;
    this.introJsService.triggerIntroTourFunctionalityOnRouteChanges();
    this.subscriptions.push(
      this.gettingStartedService.getGettingStarted().subscribe((res) => {
        if (res) {
          this.kycKybStatus = {
            kycStatus: res.kycStatus,
            kybStatus: res.kybStatus
          };
        }
      })
    );
    this.headerService.fetchUserVerification();
    this.getAllowedCountries();
    if (this.localStorageService.getItem('isSubscribed')) {
      this.isSubscribed =
        this.localStorageService.getItem('isSubscribed') === 1 ? 1 : 0;
    }
  }

  /**
   * @description This method will fetch the allowed country list for several areas,
   * eg: country dropdown in payee address forms
   */
  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudService.getAllowedCountries().subscribe((res) => {
        if (res) {
          this.cloudService.allowedCountries.next(res.data);
        }
      })
    );
  }

  /**
   * @description Navigate to getting-started page if user not complete each step of verification.
   */
  gotoVerification(): void {
    this.router.navigateByUrl('/manage/verification/index');
  }

  scrollSubcribe() {
    this.subscriptions.push(
      this.headerService.isSubHeaderVisible.subscribe((res) => {
        this.isHidden = res.hidden || environment.env_id === 'csnhc';
        this.animation = res.animation;
      })
    );
  }

  /**
   * @description Navigate to verify-email-phone page if user not complete each step of verification.
   */
  goToGettingStarted() {
    this.router.navigateByUrl('/manage/verification/index');
  }

  /**
   * @description - To catch global click event to close quick access menu
   * @param event -Click event
   * @returns
   */
  @HostListener('document:click', ['$event'])
  handleClick(event: Event): void {
    if (this.isQuickAccessOpenedJustNow) {
      this.isQuickAccessOpenedJustNow = false;
      return;
    }
    if (
      event &&
      this.isQuickNavigationMenuShown &&
      !this.isQuickAccessOpenedJustNow
    ) {
      this.isQuickNavigationMenuShown = false;
      this.searchValue = '';
    }
  }

  /**
   * @description Shows a toggle button in the header for opening the sidebar content as a mobile view when the screen width is less than 1300px.
   *
   * @property {boolean} mobileMenu - Indicates whether the mobile menu is shown or not.
   * @method setMobileMenu - Sets the value of the mobileMenu property in the sidebar service.
   */
  showMobileMenus() {
    this.mobileMenu = true;
    this.sideBarService.setMobileMenu(this.mobileMenu);
  }

  /**
   * @description This function is called in ther case of subscription.
   *
   * `gtagEventScript` this script is used to track user clicks.
   */
  gtagScript() {
    this.scriptService.gtagEventScript('upgrade-plan');
  }

  ngAfterViewInit() {
    this.verifyEmailPhone();
    this.themeService.initTheme();
    this.isDarkMode = this.themeService.getInitialColourTheme();
    this.changeDetectorRef.detectChanges();
  }

  /**
   * @description Get the user email and phone number verification status.
   * Here `this.isUserVerified` used in the case of subscription.
   * @interface IUserVerification its the interface of `this.isUserVerified`.
   *
   * @property {number} phone_verified - Indicates whether the user's phone number is verified (1 for verified, 0 for not verified).
   *
   * @property {number} email_verified - Indicates whether the user's email is verified (1 for verified, 0 for not verified).
   */
  verifyEmailPhone() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isUserVerified = res;
      })
    );
  }

  /**
   * @description Checks for changes in the header value and triggers the corresponding action.
   *
   * @method getHeaderValueChanged - Observable method that emits a value when the header value changes.It return a boolean value.
   * @method headerData - Performs header API calls and+ other actions related to the header.
   */
  checkHeaderChanged(): void {
    this.subscriptions.push(
      this.headerService.getHeaderValueChanged().subscribe((res) => {
        if (res) {
          this.headerData();
        }
      })
    );
  }

  /**
   * @description Checks the layout and handles the corresponding actions.
   * @method sideBar - Observable that emits boolean values when click toggle button in sidebar.
   * if `this.status` value is true .That time only show icons in side bar.
   * @method isLoading - Observable that indicates whether an API call is active.
   * @property {boolean} isLoading - Indicates whether an API call is active.Based on this value show and hide the progress bar in html.
   *
   * Set the `isLoading` value in `interceptor.service.ts` file.
   */
  checkLayOut(): void {
    this.subscriptions.push(
      this.layoutService.isLoading
        .pipe(delay(200))
        .subscribe((loading: boolean) => {
          this.isLoading = loading;
        })
    );
  }

  /**
   * @description Retrieves header data and performs various actions based on the response.
   * @method adpUserDetails - Updates the value of the adpUserDetails property in the adpService with the ADP user details.
   * @property {boolean} cjScriptLoaded - Indicates whether the CJ marketing script has been loaded.
   */
  headerData(): void {
    this.headerService.isHeaderDataLoaded.set(true);
    this.subscriptions.push(
      this.headerService.headerData()
      .pipe(finalize(() => this.headerService.isHeaderDataLoaded.set(false)))
      .subscribe((res) => {
        // eslint-disable-next-line no-underscore-dangle
        this.headerService._headerData.next(res?.data);
        this.showTrialPeriodPopup = res.data?.showTrialPeriodPopup;
        this.creditCardUser = res.data?.creditCardUser;
        this.adpService.isADPRunUser = res.data.adpRunUser;
        /**
         * @description Can be used if header data variables need to be stored in ngrx store.
         */
        // this.commonOnInitService.storeHeaderDataInNgrx(res?.data, this.profilePic);
        this.localStorageService.setItem(
          'timezone',
          res.data.personalInfo.timezone
        );
        this.localStorageService.setItem(
          'emailVerified',
          res?.data?.userInfo?.email_verified
        );
        this.localStorageService.setItem(
          'phoneVerified',
          res?.data?.userInfo?.phone_verified
        );
        this.localStorageService.setItem(
          'activeCompanyName',
          res?.data?.allCompanies?.activeCompanyName
        );
        this.localStorageService.setItem('achEnabled', res?.data?.achEnabled);
        this.userService.achEnabledUser = res.data.achEnabled ? 1 : 0;

        this.localStorageService.setItem(
          'rippleBusinessInternationalPaymentEnabled',
          res.data.rippleBusinessInternationalPaymentEnabled
        );

        this.localStorageService.setItem(
          'ripplePersonalInternationalPaymentEnabled',
          res.data.ripplePersonalInternationalPaymentEnabled
        );

        if (res.data.showInternationalPaymentWelcomeModal !== undefined) {
          this.localStorageService.setItem(
            'showInternationalPaymentWelcomeModal',
            res.data.showInternationalPaymentWelcomeModal
          );
        }
        if (res.data.isApprovedForProcessNow === 1) {
          this.sharedService.enabledForProcessNow = true;
        }

        this.localStorageService.setItem(
          'pingPongEnabled',
          res.data.pingpongEnabled
        );

        this.localStorageService.setItem('currentPlan', res.data.currentPlan);

        this.adpMarketPlaceUser = res.data?.userInfo?.adpMarketPlaceUser;
        if (
          res.data.isSubscribed === 0 &&
          this.staticWhiteLabelConditions?.subscriptionVisible &&
          this.adpMarketPlaceUser !== 1 &&
          res.data.personalInfo?.isLegalEnabled !== '1'
        ) {
          this.trialPeriodFun(
            res.data?.trialPeriodEndsInDays,
            res.data?.isShowTrailPeriod
          );
        }

        this.localStorageService.setItem('email', res.data.personalInfo?.email);
        this.localStorageService.setItem('userId', res.data.userInfo.userId);
        // this is a temporary fix - without backend support. 
        this.bypassHeaderDemoButtonUser = res.data.userInfo.userId === 1464130;
        this.localStorageService.setItem('phone', res.data.personalInfo.phone);
        this.localStorageService.setItem(
          'encryptedUserId',
          res.data.userInfo.encrypted_id
        );
        this.localStorageService.setItem('isSubscribed', res.data.isSubscribed);
        this.localStorageService.setItem(
          'companyName',
          res.data.BusinessInfo.companyName
        );
        this.localStorageService.setItem(
          'userPlugins',
          res.data.enabledPlugins
        );
        this.localStorageService.setItem('hasComplianceFreeze', !!res.data.isComplianceScreeningFrozen);

        this.localStorageService.setItem('rerunVerification', res.data.reRunVerificationData);
        this.headerService.setRerunKybStatus(!!res.data.reRunVerificationData);
        if(res.data.eddRequestData && res.data.eddRequestData.status !== 'APPROVED') {
          this.localStorageService.setItem('eddRequestData', res.data.eddRequestData);
          this.headerService.setEddTriggerStatus(!!res.data.eddRequestData);
        }
        this.localStorageService.setItem('kybPersonaVerification', res.data.kybPersonaVerificationData);
        this.headerService.setKybPersonaVerificationStatus(!!res.data.kybPersonaVerificationData?.show_modal);
        this.headerService.setCreditCardGatewaySwitchingStatus(res.data.credit_card_gateway_switching_status);

        this.userId = res.data.userInfo.userId;
        this.subscribePusherForNotifications(this.userId);
        this.subscribeForSignedReceiptsPuhser(this.userId);

        this.headerService.setHeaderLoaded(true);
        this.adpService.adpUserDetails.next({
          adpMarketPlaceUser: res.data?.userInfo?.adpMarketPlaceUser,
          passwordUpdated: res.data?.userInfo?.passwordUpdated
        });
        this.isSubscribed = Number(res.data.isSubscribed);
        this.showUpgradeBtn = this.payAsYouGoPlans.includes(
          res.data.currentPlan
        );
        this.personalInfo = res.data.personalInfo;
        this.enabledPlugins = res?.data?.enabledPlugins ?? [];
        this.showVersionSwitcher.set(!this.enabledPlugins.length || (this.enabledPlugins.includes('enterprise-pricing') && this.enabledPlugins.length ===1));
        this.Trialend = res.data.trialPeriodEndsInDays;
        this.trialPeriodEndDate = this.formatTrialEndDate(
          res.data.trialPeriodEndDate
        );
        this.localStorageService.setItem('trialPeriodEndsIn', this.Trialend);
        this.alertTooltip = `Your trial period ends in ${this.Trialend} days.`;

        if (this.enabledPlugins.includes('qb-import-time-span')) {
          this.authDataService.isQBOnlineTimeSpanEnabled = true;
        } else {
          this.authDataService.isQBOnlineTimeSpanEnabled = false;
        }

        if (this.enabledPlugins.includes('infinite-scroll')) {
          this.dataTableService.paginationChange$.next(true);
        } else {
          this.dataTableService.paginationChange$.next(false);
        }

        this.isIncludedInEnabledPlugins();

        this.personalName = this.getTwoCharOfUseName(
          res.data.personalInfo.nickName
            ? res.data.personalInfo.nickName
            : res.data.personalInfo.name
        );
        this.localStorageService.setItem('displayName', this.personalName);
        this.allCompanies = res.data.allCompanies;
        this.mailCreditBalance = res.data.totalMailCredit.credit;
        this.walletTableData = res.data.wallet;
        this.profilePic = res.data.personalInfo.profilePicLink;
        this.companyName = res.data.allCompanies.activeCompanyName;
        this.whatsNew = res.data.whatsNew;
        this.subscribedEndDate = res.data.subscribedEndDate;
        this.isShowTrailPeriod = res.data.isShowTrailPeriod;
        this.isSubscribedEnd = res.data?.isSubscribedEnd;
        /** For auto attachments */
        this.headerService.autoAttachmentSetForECheck =
          res?.data?.personalInfo?.AttachmentSettings?.check_mail === 1;
        this.headerService.autoAttachmentSetForCheckMailing =
          res?.data?.personalInfo?.AttachmentSettings?.echeck === 1;
        this.headerService.autoAttachmentSetForAch =
          res?.data?.personalInfo?.AttachmentSettings?.ach === 1;

        if (!this.cjScriptLoaded) {
          this.scriptService.cjSiteCode(); // Add cj marketing script
          this.cjScriptLoaded = true;
        }

        this.getActiveCompanyLogo();

        this.localStorageService.setItem(
          'profilePicLink',
          this.profilePic ? this.profilePic : ''
        );
        this.localStorageService.setItem(
          'isCreditCardPaymentEnabled',
          res.data.isCreditCardPaymentEnabled
        );

        this.localStorageService.setItem(
          'userQuickNavigationItems',
          res.data.userQuickNavigationItems
        );
        const quickNavFavoriteIds =
          this.localStorageService.getItem('userQuickNavigationItems') || [];
        this.fouritButtons = this.quickNavigationMenu.filter((button) =>
          quickNavFavoriteIds.includes(button.favoriteIconId)
        );

        this.gettingStartedService.resetGettingStartedData();
        this.gettingStartedService.getGettingStartedData();
        this.gettingStartedService.updateGettingStartedData();

        // EDD guard: if days_remaining > 0, only open RerunVerification modal (once per login session)
        if (res.data.eddRequestData && res.data.eddRequestData.days_remaining > 0 && res.data.eddRequestData.status !== 'APPROVED' && !this.localStorageService.getItem('eddWarningModalShown') ) {
          this.localStorageService.setItem('eddWarningModalShown', true);
          this.headerService.openEddRerunVerificationModal(
            { kyb_id: res.data.eddRequestData.kyb_id, edd_inquiry_id: res.data.eddRequestData.edd_inquiry_id },
            this.localStorageService.getItem('rerunVerification')?.id
          );
        } else if (!res.data.eddRequestData || res.data.eddRequestData.days_remaining <= 0) {
          // Existing modal opening logic — only runs when EDD is not active
          if (
            this.localStorageService.getItem('isShowDemo') &&
            !this.isHideBookDemo
          ) {
            this.showDemo = this.localStorageService.getItem('isShowDemo') || '';
          }

          if (this.localStorageService.getItem('reward') && !this.isCSNHCRequirement) {
            this.headerService.openRewardModal();
          }

          if (this.showDemo === 1 && !this.isCSNHCRequirement) {
            this.headerService.openDemoModal('home');
          }

          if (
            this.localStorageService.getItem('showComplianceModal') === 1 &&
            !this.isArcharina && !this.isCSNHCRequirement
          ) {
            this.headerService.openCertificationModal();
          }

          if (
            this.localStorageService.getItem(
              'showInternationalPaymentWelcomeModal'
            ) === 1 &&
            !this.isArcharina && !this.isCSNHCRequirement
          ) {
            this.headerService.openInternationalPaymentModal();
          }
        }
      })
    );
  }

  headerNotificationData() {
    this.subscriptions.push(
      this.headerService.getNotificationValueChanged().subscribe(() => {
        this.getNotification();
      })
    );
  }

  /**
   * @description show the subscription modal based on the header data.
   * @param trialEndsIn The number of days remaining in the trial period.
   * @param isShowTrailPeriod  Indicates whether the trial period is shown.
   * `this.trialPeriodEndingAlert` contain the percentage of offer. example `this.trialPeriodEndingAlert =  {offerPerc: 30, value: 2}`.
   *
   * Based on `trialEndsIn` value change subscription offer percentage.
   */
  trialPeriodFun(trialEndsIn: number, isShowTrailPeriod: number) {
    if ([3, 8, 13].includes(trialEndsIn)) {
      this.trialPeriodEndingAlert = subscriptionOffers[trialEndsIn];
    }

    if (
      trialEndsIn === 0 &&
      isShowTrailPeriod === 1 &&
      this.showTrialPeriodPopup === '1' &&
      this.creditCardUser !== 1
    ) {
      this.commonOnInitService.openTrialPeriodOverModal();
    } else if (
      [3, 8, 13].includes(trialEndsIn) &&
      this.commonOnInitService.showTrailPeroidOverModal('showTrialOffer') &&
      this.creditCardUser !== 1
    ) {
      this.commonOnInitService.openTrialPeriodOfferAlertModal(trialEndsIn);
    }
  }

  /**
   * Formats the API trial end date ("dd-mm-yyyy", e.g. "05-12-2027") into a
   * short, locale-aware string via Angular's DatePipe — e.g. "Dec 5, 2027".
   * Returns '' for missing/unparseable input.
   */
  private formatTrialEndDate(date: string): string {
    if (!date) {
      return '';
    }
    // Backend sends the date as dd-mm-yyyy, so the first segment is the day.
    const [day, month, year] = date.split('-').map((part) => Number(part));
    if (!month || !day || !year || month < 1 || month > 12) {
      return '';
    }
    return this.datePipe.transform(new Date(year, month - 1, day), 'MMM d, y') ?? '';
  }

  /**
   * @description Navigates to the subscription page based on the user verification status.
   *
   * If both the email and phone are verified, it navigates to the subscription page.
   *
   * If either the email or phone is not verified, it navigates to the verify email and phone page.
   */
  goToSubscription(type?: string): void {
    const onSubscriptionDashboard = this.router.url.split('?')[0] === '/manage/subscription/dashboard';
    if (onSubscriptionDashboard) {
      this.headerService.isRenewloading.set(false);
      if (type === 'renew') {
        this.headerService.renewClicked$.next(true);
        return;
      }
    } else {
      this.headerService.isRenewloading.set(true);
    }
    this.router.navigate(['manage/subscription'], {
      state: { returnUrl: this.router.url },
      queryParams: {
        type
      }
    });
  }

  /** * Company switch section start ** */

  /**
   * @description Retrieves the logo URL of the active company.
   */
  getActiveCompanyLogo(): void {
    /**
     * Searches for the active company within a list of all companies and sets the active company's logo URL.
     * @param item - The company object from the list of all companies.
     * @returns Whether the company's ID matches the active company ID.
     */
    this.activeCompanyId =
      this.localStorageService.getItem('activeCompanyId') || '';
    const findCompany = this.allCompanies?.ownCompanies?.find(
      (item: IOwnCompany) => this.activeCompanyId === item?.companyId
    );
    // Sets the active company's logo URL or an empty string if not found.
    this.activeComapanyLogo = findCompany?.companyLogoUrl || '';
  }

  /**
   * @description Handles the selection of a company.
   * @param ev An object containing the company details: companyId, companyName, and type.
   *
   * `this.companyManagementService.getCompanyChange`-Indicates that a company change has occurred in the company management service.
   */
  onSelectCompany(ev: {
    companyId: string;
    companyName: string;
    type: string;
    status: number;
    isItDefault?: number;
  }): void {
    if (ev.status === 0 || ev.status === 3) {
      this.router.navigate([
        'manage/company_management/index/company_management'
      ]);
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    this.store.dispatch(UserManagementActions.clearUserVerification());
    this.store.dispatch(UserManagementActions.loadUserVerification());

    /**
     * Sets the InternationalPay object in the shared service, indicating a company change.
     *
     * @property header - The value of the 'internationalPaymentEnabled' stored in this.localStorageService.
     * @property isCompanyChange - Indicates that a company change is occurring.
     */
    if (this.localStorageService.getItem('activeCompanyId') === ev.companyId) {
      return;
    }
    // Sets the active company's information in the company management service.Use this information set company id and name and company type in local storage.
    this.companyManagementService.setActiveCompanyInfo(
      ev.companyId,
      ev.companyName,
      ev.type,
      ev.companyId === this.localStorageService.getItem('parentCompanyId') ? 1 : 0
    );
    this.userManagementService.selectedUser$.next(false);
    // set a boolean value to getCompanyChange when company change.
    this.companyManagementService.setCompanyChange(true);
    this.headerData();
    this.dtCacheService.resetTablePostData();
    this.dtCacheService.deleteDb();
    this.transferDetailsService.resetData();
    /**
     * @description refresh the payment table on company switch when current page is payment table page.
     * Otherwise redirect to payment table page.
     */
    if (this.router.url === '/manage/payments-table/index') {
      this.v3DataTableService.refreshV3DataTable();
      this.dataTableService.setRefreshStatus(true);
    } else if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCompassRequirement'
      )
    ) {
      this.router.navigate(['/manage/payments-table/check']);
    } else {
      this.router.navigate(['/manage/payments-table']);
    }
    this.localStorageService.removeItem('reward');
    this.headerService.getRefillRewards(true);
  }

  /**
   * @description This function called when add or manage companies.
   *
   * `returnUrl` contain current page url,this url is set to local storage.
   */
  managePage(): void {
    let returnUrl = this.router.routerState.snapshot.url;
    returnUrl = returnUrl?.slice(1, returnUrl.length);
    this.localStorageService.setItem('returnFromManage', returnUrl);
    this.router.navigate(['/manage/company_management/index']);
  }

  /** * Company switch section end ** */

  /** Profile section start * */

  /**
   * @description Retrieves the initials of a user's name
   * @param {string} name - The user's name.
   * @returns {string} - The initials of the user's name.
   * @example
   * ```
   * const userFullName = "John Doe";
   * const initials = getTwoCharOfUseName(userFullName);
   * ```
   */
  getTwoCharOfUseName(name: string): string {
    const userName = name;
    const nameParts = userName?.split(' ');
    const firstName = nameParts[0]?.charAt(0);
    const lastName =
      nameParts?.length > 1
        ? nameParts[1]?.charAt(0)
        : nameParts[0]?.substring(0, 2);
    const initials = nameParts?.length > 1 ? firstName + lastName : lastName;
    return initials;
  }
  /** Profile section end * */

  /**
   * @description Get the all notification.
   *
   * ` this.notificationCount` - indicate unread notification count showed in header.
   */
  getNotification() {
    this.subscriptions.push(
      this.userService.getNotification().subscribe((data) => {
        if (data?.success) {
          this.notifications = data.data.notifications;
          this.organizeNotification();
          if (data.data.unreadNotificationsCount) {
            this.notificationCount = data.data.unreadNotificationsCount;
          } else {
            this.notificationCount = 0;
          }
          this.newNotificationCount = data.data.newNotificationCount ?? 0;
          this.evaluateNewNotificationPanel();
          if (this.userId) {
            this.subscribePusherForNotifications(this.userId);
          }
        }
      })
    );
  }

  /**
   * @description Shows the persistent new-notification panel only when the API
   * reports new notifications, there are notifications to preview, and the user
   * has not dismissed the panel during this login session.
   */
  private evaluateNewNotificationPanel(): void {
    const dismissed = !!this.localStorageService.getItem(
      'newNotificationPanelDismissed'
    );
    this.showNewNotificationPanel =
      this.newNotificationCount > 0 &&
      !!this.notifications?.length &&
      !dismissed;
  }

  /**
   * @description Dismisses the new-notification panel when the user clicks the
   * bell. The dismissal is persisted so it survives page refreshes; the app's
   * `clearLocalStorage()` on next login resets it, so the panel can show again.
   */
  dismissNewNotificationPanel(): void {
    this.localStorageService.setItem('newNotificationPanelDismissed', true);
    this.showNewNotificationPanel = false;
  }

  /**
   * Method for organizing notifications based on the date
   */
  organizeNotification() {
    this.groupedNotifications = [];
    this.notifications.slice(0, 10).forEach((notification) => {
      const dateObj = new Date(notification.createdAt as string);
      const dayName = this.isToday(dateObj)
        ? 'Today'
        : this.getDayName(notification.createdAt as string);
      const existingGroup = this.groupedNotifications.find(
        (group) => group.day === dayName
      );
      const formattedDate = `${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${dateObj
        .getDate()
        .toString()
        .padStart(2, '0')}-${dateObj.getFullYear()}`;
      if (existingGroup) {
        existingGroup.notifications.push(notification);
      } else {
        this.groupedNotifications.push({
          day: dayName,
          date: formattedDate,
          notifications: [notification]
        });
      }
    });
  }

  /**
   * Method to get dayName
   */
  getDayName(dateString: string) {
    const date = new Date(dateString);
    return days[date.getDay()];
  }

  /**
   * Method to check the day is today or not
   */
  isToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  // onclick goto corresponding page (notification)

  /**
   * @description Redirects to a specific page based on the provided notification item.
   * @param {INotificationDetails} value - The notification item containing the details.
   */
  redirectToPage(value: INotificationDetails) {
    const item = value;
    this.subscriptions.push(
      this.userService.markAsRead(item.id).subscribe((res) => {
        if (res.success) {
          item.readAt = true;
        }
        this.headerService.setHeaderValueChanged(true);
        this.headerService.setNotificationValueChanged(true);
      })
    );

    const recurringLink = resolveV3RecurringNotificationLink(
      item.notification.action_link
    );
    if (recurringLink) {
      this.router.navigate([recurringLink.path], {
        queryParams: recurringLink.queryParams,
        state: { backUrl: this.router.url }
      });
      return;
    }

    /**
     * Extracts the page URL from the notification's action link.
     * @type {string}
     */
    const [, fullPath] = item.notification.action_link.split('.com/');

    /**
     * Splits the path and query parameters.
     */
    const [path, queryString] = fullPath.split('?');

    /**
     * Replaces a specific part of the URL path.
     */
    const link = '/?id=/';
    const redirectPath = path.replace(link, '/');

    /**
     * Combines the path and query parameters.
     */
    const queryParams = queryString
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};

    /**
     * Navigates to the new URL.
     */
    this.router.navigate([redirectPath], {
      queryParams,
      state: { backUrl: this.router.url }
    });
  }

  /**
   * @description Handles the click event on the quick navigation button.
   * @param {string} clickedPage - The identifier of the clicked page.
   */
  onQuickNavigationButtonClick(clickedPage: string | undefined) {
    /**
     * Sets the flag to hide the quick navigation menu.
     * @type {boolean}
     */
    this.isQuickNavigationMenuShown = false;
    this.searchValue = '';

    /**
     * Performs an action based on the clicked page.
     */
    switch (clickedPage) {
      case 'blankCheck':
        this.commonOnInitService.openBlankCheckModal();
        break;
      case 'requestPayment':
        this.router.navigateByUrl("/manage/payments/main/receive/''/''");
        break;
      case 'newPayment':
        this.router.navigateByUrl('/manage/payments/main');
        break;
      case 'shippingLabel':
        this.commonOnInitService.goToShippingLabel();
        break;
      case 'positivePay':
        this.commonOnInitService.checkPostivePayPermission();
        break;
      default:
        break;
    }
  }

  /**
   * @description - Show or hide the Api call progress bar in header.
   *
   * `loading` - Indicates whether an API call is active (true) or not (false).
   *
   * `isLoading` - Indicates whether an API call is active.Based on this value show and hide the progress bar in html.
   */
  loadProgressBar() {
    this.subscriptions.push(
      this.layoutService.isLoading
        .pipe(delay(200))
        .subscribe((loading: boolean) => {
          this.isLoading = loading;
        })
    );
  }

  /**
   * @description Checks the online status of the application.
   *
   * `this.online$`- observable that will be used to track the online status of the application.
   *
   * `this.isOffline`- Used show and hide the no internet notification in header.
   */
  isOnline() {
    /**
     * An observable that emits the online status of the application.
     * @type {Observable<boolean>}
     */
    this.online$ = merge(
      /**
       * Emits the initial online status of the application.
       * @type {Observable<boolean>}
       */
      of(navigator.onLine),
      /**
       * Emits `true` when the window goes online.
       * @type {Observable<boolean>}
       */
      fromEvent(window, 'online').pipe(map(() => true)),
      /**
       * Emits `false` when the window goes offline.
       * @type {Observable<boolean>}
       */
      fromEvent(window, 'offline').pipe(map(() => false))
    );

    this.subscriptions.push(
      this.online$.subscribe((isOnline: boolean) => {
        /**
         * Represents whether the application is offline.
         * @type {boolean}
         */
        this.isOffline = !isOnline;
      })
    );
  }

  /**
   * @description Opens the what's new modal when click on what's new button.
   */
  openWhatsNewModal() {
    const dialog = this.dialog.open(WhatsNewComponent, {
      maxWidth: '700px',
      panelClass: ['whats-new-modal-align']
    });
    this.subscriptions.push(
      dialog.afterClosed().subscribe(() => {
        this.whatsNewView = true;
      })
    );
  }

  /**
   *
   */

  /**
   * @description Performs the logout action by calling the Logout method of the AuthService.
   */
  onLogout() {
    this.authService.Logout();
  }

  /**
   * @description Toggles the dark mode of the application.
   */
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.changeDetectorRef.detectChanges();
    if (this.isDarkMode) {
      /**
       * Updates the theme to 'dark-mode' using the ThemeService.
       * @param {string} theme - The name of the dark mode theme.
       */
      this.themeService.update('dark-mode');
      /**
       * Sends a theme switch event with the current dark mode state using the ThemeService.
       * @param {boolean} isDarkMode - The current state of the dark mode.
       */
      this.themeService.sendThemeSwitch(this.isDarkMode);
    } else {
      /**
       * Updates the theme to 'light-mode' using the ThemeService.
       */
      this.themeService.update('light-mode');
      this.themeService.sendThemeSwitch(this.isDarkMode);
    }
  }


  /**
   * @description Open Bulk payment Summary modal after clicking view summary.
   */
  openPaymentSummary(): void {
    this.dialog.open(V3PaymentSummaryModalComponent, {
      maxWidth: '1000px',
      width: '70%',
      minHeight: '500px',
      maxHeight: '1000px',
      disableClose: true
    });
  }

  /**
   * @description Navigates to the payment page with the specified mode.
   * @param {'SEND' | 'RECEIVE'} mode - The mode of payment, either 'SEND' or 'RECEIVE'.
   */
  gotoPay(mode: 'SEND' | 'RECEIVE'): void {
    this.router?.navigate(['/manage/payments/main'], {
      queryParams: { mode },
      state: { backUrl: this.router.url }
    });
  }

  /**
   * @description Retrieves the total payment count for bulk payments.
   * This method fetches the bulk payment count from the V3BulkPaymentService
   * and updates the `bulkPaymentCount` property accordingly. Based on the count,
   * it also determines whether to show or hide the progress bar in the header.
   *
   */
  getBulkPaymentCount(): void {
    this.subscriptions.push(
      this.v3BulkPaymentService.getBulkPaymentCount().subscribe((res) => {
        this.bulkPaymentCount = res;
        if (res === 0) {
          this.width = 0;
        }
        if (this.bulkPaymentCount > 0) {
          this.isShowPaymentSummary = true;
          this.isBulkPaymentProcessing = true;
        } else {
          this.isShowPaymentSummary = false;
        }
      })
    );
  }

  /**
   * @description get the number of completed payment in bulk payments.
   * fill the color in progress bar based on width value.
   * Change the progress bar content based on the value of `isBulkPaymentProcessing`.
   * if isBulkPaymentProcessing true  then show process status otherwise show summary
   */
  getCompletedPaymentCount(): void {
    this.subscriptions.push(
      this.layoutService.isProgressBarInvoked.subscribe((res: boolean) => {
        this.progressBarValue = res;
      })
    );
    this.subscriptions.push(
      this.v3BulkPaymentService.completedPaymentCount$.subscribe((res) => {
        if (!this.progressBarValue) {
          if (res === 0) {
            this.width = 0;
          }
          this.width += res;
          if (res !== 0 && this.width === this.bulkPaymentCount) {
            this.isBulkPaymentProcessing = false;
            this.layoutService.isProgressBarInvoked.next(true);
          } else {
            this.isBulkPaymentProcessing = true;
          }
        }
      })
    );
  }

  /**
   * Specially created for ABC enterprise customer.
   */
  getCompletedCheckPrint() {
    this.subscriptions.push(
      this.checkPrinting$.subscribe((res) => {
        if (res && res.total > 0) {
          this.abcEnterpriseCheckPrintStatus = res;
          if (res.total === res.canceled + res.fail + res.success) {
            this.isBulkPaymentProcessing = false;
            this.layoutService.isProgressBarInvoked.next(true);
          }
        }
      })
    );
  }

  /**
   * @description get the count of failed payments from bulk payment. This count used in Payment progress bar.
   *
   * `const errorResponse :HttpErrorResponse[] = [];` contain all error response from bulk payments.
   */
  getCountFailedPayment(): void {
    this.countOfFailedPayment = 0;
    this.subscriptions.push(
      this.v3BulkPaymentService.getBulkPaymentData().subscribe((res) => {
        this.bulkData = res;
        const response = this.bulkData as IPaymentSummaryData[];
        const errorResponse: HttpErrorResponse[] = [];
        response.filter((item) => {
          if (item?.success instanceof HttpErrorResponse) {
            errorResponse.push(item?.success?.error);
            return true;
          }
          return false;
        });
        this.countOfFailedPayment = errorResponse?.length;
      })
    );
  }

  /**
   * @description Used to close bulk payment progress bar.
   */
  close(): void {
    this.v3BulkPaymentService.setBulkPaymentCount(0);
    this.isShowPaymentSummary = false;
    this.v3BulkPaymentService.abcEntCheckPrintCountSignal.set(undefined);
  }

  /**
   * @description checking this item is included in enabledPlugins array.(Mainly for enterprise customers)
   * @param item - string value to check included or not in enabledPlugins array.
   * @returns isExist - boolean.
   */
  isIncludedInEnabledPlugins() {
    this.createNewPlugIn = false;
    this.isEnabledhamaspikPlugins = false;
    this.isEnabledPlugins = false;
    this.isEnableYoungwilliamsPlugins = false;
    this.isEnableHaloPlugins = false;
    this.isEnableSalesForceplugins = false;

    const hasEnterpriseTitlePlugin = this.enabledPlugins?.includes(
      'enterprise-title-eq-check-import'
    );
    const hasHamaspikPlugin = this.enabledPlugins?.includes(
      'enterprise-hamaspik-check-import'
    );

    if (hasEnterpriseTitlePlugin && !hasHamaspikPlugin) {
      this.isEnabledPlugins = true;
    }

    const hasYoungwilliamsPlugin = this.enabledPlugins?.includes(
      'enterprise-youngwilliams-check-import'
    );

    this.isEnableYoungwilliamsPlugins = hasYoungwilliamsPlugin;

    this.createNewPlugIn = this.enabledPlugins?.includes('enterprise-pricing');
    this.isEnabledhamaspikPlugins = hasHamaspikPlugin;

    const hasHaloPlugin = this.enabledPlugins?.includes(
      'enterprise-halo-check-import'
    );

    this.isEnableHaloPlugins = hasHaloPlugin;

    const hasSpectrumPlugin = this.enabledPlugins?.includes(
      'enterprise-spectrum-check-import'
    );

    this.isEnableSpectrumPlugins = hasSpectrumPlugin;

    this.isEnableMilwaukeePlugins = this.enabledPlugins?.includes(
      'enterprise-milwaukee-check-import'
    );

    const hasSalesForcePlugin = this.enabledPlugins?.includes(
      'enterprise-salesforce-check-import'
    );

    this.isEnableSalesForceplugins = hasSalesForcePlugin;

    const hasBeazleyPlugin =
      this.enabledPlugins?.includes('enterprise-beazley');

    this.isEnableBeazleyPlugin = hasBeazleyPlugin;
  }

  /**
   * @description Open the quick navigation modal.
   *
   * `this.isQuickNavigationMenuShown` - Toggles the visibility of the quick navigation menu.
   */
  onCreateNew(): void {
    this.isQuickNavigationMenuShown = !this.isQuickNavigationMenuShown;
    this.isQuickAccessOpenedJustNow = true;
    this.searchValue = '';
  }

  /**
   * @description Open book demo modal.
   */
  openDemoModal() {
    this.headerService.openBookDemoModal('header');
  }

  private notificationPusherSubscribed = false;

  private unsubscribeHeaderPusherChannels(): void {
    if (this.userId) {
      this.pusherService.unsubscribeUserSessionChannels(this.userId);
    }
    this.notificationPusherSubscribed = false;
    this.signedReceiptsPusherSubscribed = false;
    this.pusherChannels = [];
  }

  subscribePusherForNotifications(userId: number) {
    if (this.notificationPusherSubscribed) {
      return;
    }
    this.notificationPusherSubscribed = true;
    const channelName = `user-app-notifications-${userId}`;
    const eventName = `user-app-notifications-event-${userId}`;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (res: INewNotification) => {
          if (res) {
            this.newNotification = res;
            this.isNotiFication = true;
            this.getNotification();
            this.changeDetectorRef.detectChanges();

            setTimeout(() => {
              this.isNotiFication = false;
            }, 3000);
          }
        })
    );
  }

  private signedReceiptsPusherSubscribed = false;

  /**
   * @description Subscribes to the Pusher channel for signed receipts.
   * @param {number} userId - The user ID to subscribe to.
   */
  subscribeForSignedReceiptsPuhser(userId: number) {
    if (this.signedReceiptsPusherSubscribed) {
      return;
    }
    this.signedReceiptsPusherSubscribed = true;
    const channelName = `payment-receipt-signature-uploaded-${userId}`;
    const eventName = `payment-receipt-signature-uploaded-${userId}`;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (res: INewNotification) => {
          if (res) {
            this.v3DataTableService.refreshV3DataTable();
          }
        })
    );
  }

  closeNotification() {
    this.isNotiFication = false;
  }

  redirectToPageOnNotification(value: INewNotification) {
    if (!value.action_link) {
      return;
    }

    const recurringLink = resolveV3RecurringNotificationLink(value.action_link);
    if (recurringLink) {
      this.router.navigate([recurringLink.path], {
        queryParams: recurringLink.queryParams,
        state: { backUrl: this.router.url }
      });
      return;
    }

    /**
     * Extracts the page URL from the notification's action link and sets it as the redirectNotficationPage.
     * @type {string}
     */
    this.redirectNotficationPage = value.action_link.split('.com/')[1];
    /**
     * Replaces a specific part of the URL and sets it as the redirect.
     */
    const link = '/?id=/';
    const redirect = this.redirectNotficationPage.replace(link, '/');
    this.router.navigate([redirect], { state: { backUrl: this.router.url } });
  }

  getWhiteLabel(): void {
    const currentWhiteLabel = this.dynamicWhiteLabelData.find(
      (whiteLabel) => whiteLabel.environmentId === this.currentEnvironmentId
    );

    if (currentWhiteLabel) {
      this.isHideBookDemo = currentWhiteLabel.flags?.hideDemoButton || false;
    }
  }

  getImportChecksRoute(): void {
    if (this.isEnabledhamaspikPlugins) {
      this.router.navigate(['/manage/cheque/hamaspik-import/step1']);
    } else if (this.isEnableSpectrumPlugins) {
      this.router.navigate(['/manage/cheque/spectrum-import']);
    } else if (this.isEnableMilwaukeePlugins) {
      this.router.navigate(['/manage/cheque/enterprise-multi-import']);
    } else if (this.isEnableHaloPlugins) {
      this.router.navigate(['/manage/cheque/halo-import']);
    } else if (this.isEnableBeazleyPlugin) {
      this.openBeazleyModal();
    } else {
      this.router.navigate(['/manage/cheque/salesforce-import']);
    }
  }

  openBeazleyModal(): void {
    this.dialog
      .open(ImportFromExcelComponent, {
        width: '700px',
        disableClose: true,
        data: 'beazley-ent'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.success) {
          this.router.navigate(['/manage/payments-table/index']);
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  toggleFavorite(button: IHeaderLinks, event: Event): void {
    event.stopPropagation();
    const index = this.fouritButtons.findIndex(
      (buttonLookup) => buttonLookup.id === button.id
    );
    if (index === -1 && this.fouritButtons.length < 4) {
      this.fouritButtons.push(button);
    } else if (index === -1 && this.fouritButtons.length === 4) {
      this.fouritButtons.splice(0, 1);
      this.fouritButtons.push(button);
    } else {
      this.fouritButtons.splice(index, 1);
    }
    const quickNavFavorites = this.fouritButtons.map(
      (buttonFavorite) => buttonFavorite.favoriteIconId || 0
    );
    this.subscriptions.push(
      this.headerService
        .setQuickNavFavorites(quickNavFavorites)
        .subscribe((res) => {
          if ('success' in res) {
            this.headerService.setHeaderValueChanged(false);
          } else {
            this.headerService.setHeaderValueChanged(false);
          }
        })
    );
  }

  isFavorite(buttonId: string): boolean {
    const index = this.fouritButtons.findIndex(
      (button) => button.id === buttonId
    );
    return index !== -1;
  }

  toggleFavoriteButtons(): void {
    this.isFavoriteButtonsExpanded = !this.isFavoriteButtonsExpanded;
    if (this.isFavoriteButtonsExpanded) {
      this.isQuickNavigationMenuShown = false;
    }
  }

  onFavoriteButtonClick(event: Event): void {
    event.stopPropagation();
    this.toggleFavoriteButtons();
  }

  openRerunKybModal(model:'kyb' | 'edd'): void {
    this.dialog.open(RerunVerificationComponent, {
      panelClass: 'persona-modal',
      width: '400px',
      height: '720px',
      disableClose: true,
      data:model === 'kyb' ? {
        mode: model,
        sourceType: CVSourceType.other,
        reVerificationId: this.localStorageService.getItem('rerunVerification')?.id,
        businessId: this.localStorageService.getItem('rerunVerification')?.business_id
      } : {
        mode: model,
        sourceType: CVSourceType.other,
        reVerificationId: this.localStorageService.getItem('rerunVerification')?.id,
        businessId: this.localStorageService.getItem('eddRequestData')?.kyb_id,
        eddInquiryId: this.localStorageService.getItem('eddRequestData')?.edd_inquiry_id
      }
    });
  }

  /** Open the dynamic-persona compliance re-verification for existing customers.
   *  The inquiry is pre-created by the backend, so the persona modal opens
   *  directly on it (no inquiry/create call). */
  openKybPersonaVerificationModal(): void {
    const kybPersona = this.localStorageService.getItem('kybPersonaVerification');
    if (!kybPersona?.inquiry_id) return;
    this.personaHelperService
      .openModal(
        'kyc_kyb',
        CVSourceType.other,
        false,
        undefined,
        kybPersona.inquiry_id,
        'default',
        undefined,
        kybPersona.missing_fields
      )
      .subscribe((res) => {
        if (res?.data?.inquiry_id) {
          this.localStorageService.removeItem('kybPersonaVerification');
          this.headerService.setKybPersonaVerificationStatus(false);
        }
      });
  }

  switchToNewVersion(): void {
    const encryptedUserId = this.localStorageService.getItem('encryptedUserId') as string | null;
    this.localStorageService.setItem('isV4LayoutEnabled', 1);
    this.router.navigateByUrl('/v4/manage/payments-out/detailed/all');
    if (encryptedUserId) {
      this.userProfileService.changeLayoutV4(encryptedUserId, 1).subscribe({
        error: () => {
          this.localStorageService.setItem('isV4LayoutEnabled', 0);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeHeaderPusherChannels();
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
    this.commonOnInitService.ngOnDestroy();
    this.headerService.ngOnDestroy();
  }
}

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  computed,
  signal
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { resolveNotificationLink } from 'src/app/shared/service/route/v4-route-mapper';
import { Subscription, merge, of, fromEvent, Observable } from 'rxjs';
import { delay, finalize, map } from 'rxjs/operators';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  CurrencyPipe,
  NgClass,
  NgOptimizedImage,
  UpperCasePipe
} from '@angular/common';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { CdkDrag } from '@angular/cdk/drag-drop';

import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { TransferDetailsService } from 'src/app/modules/transfers/services/transfer-details.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { IntroJsService } from 'src/app/shared/service/introjs/intro-js.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';

import {
  IAllCompanies,
  IHeaderData,
  INotificationDetails,
  IGroupedNotification,
  IOwnCompany,
  IWallet,
  INewNotification
} from 'src/app/layout/model/header';
import { IUserVerification } from 'src/app/models/user';
import { IPaymentSummaryData } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { days } from 'src/app/data/data/notification';
import { subscriptionOffers } from 'src/app/data/data/subscription';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { WhiteLabel } from 'src/app/modules/dynamic-white-label/dynamic-white-label-data/dynamic-white-label-data';

import { PusherService } from 'src/app/core/services/pusher.service';
import { Channel } from 'pusher-js';
import { Store } from '@ngrx/store';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { environment } from 'src/environments/environment';
import { V4SideBar } from 'src/app/data/data/menu/v4-sidebar/v4-sidebar';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { AddCompanyModalV4Component } from 'src/app/modules/company-management/company-management-v4/v4-modals/add-company-modal-v4/add-company-modal-v4.component';
import { RequestAccessModalV4Component } from 'src/app/modules/company-management/company-management-v4/v4-modals/request-access-modal-v4/request-access-modal-v4.component';
import { V4PaymentSummaryModalComponent } from 'src/app/modules/v4-bulk-payment/modals/v4-payment-summary-modal/v4-payment-summary-modal.component';
import { WhatsNewComponent } from 'src/app/layout/header/whats-new/whats-new.component';
import { RerunVerificationComponent } from 'src/app/modules/payments/shared/modal/rerun-verification/rerun-verification.component';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { FeatureRequestModalV4Component } from 'src/app/shared/modal/feature-request-modal-v4/feature-request-modal-v4.component';
import { TextUsV4Component } from 'src/app/shared/modal/text-us-v4/text-us-v4.component';
import { SpectrumImportV4Component } from 'src/app/modules/check/modal/spectrum-import-v4/spectrum-import-v4.component';
import { BeazleyImportV4Component } from 'src/app/modules/check/modal/beazley-import-v4/beazley-import-v4.component';
import { EnterpriseMultiImportV4Component } from 'src/app/modules/check/modal/enterprise-multi-import-v4/enterprise-multi-import-v4.component';
import { SalesforceImportV4Component } from 'src/app/modules/check/modal/salesforce-import-v4/salesforce-import-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { YoungwilliamsImportV4Component } from 'src/app/modules/check/modal/youngwilliams-import-v4/youngwilliams-import-v4.component';
import { DemoVideoService } from 'src/app/shared/service/common/demo-video/demo-video.service';
import { HaloImportV4Component } from 'src/app/modules/check/modal/halo-import-v4/halo-import-v4.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { v4LucideIconsMap } from '../lucide-v4-icons';
import { HeaderCompanyDropdownV4Component } from '../../sub-components/header-company-dropdown-v4/header-company-dropdown-v4.component';
import { FavoritesDrawerV4Component } from './favorites-drawer-v4/favorites-drawer-v4.component';
import { FavoriteCommonOnInitV4Service } from './favorites-drawer-v4/favorite-common-on-init-v4.service';
import { V4SidebarService } from '../services/v4-sidebar.service';
import { NotificationSidebarService } from '../services/notification-sidebar.service';

const PAY_AS_YOU_GO_PLANS = new Set([
  'pay-as-you-go-monthly',
  'pay-as-you-go-yearly',
  'pay-as-you-go-monthly-new',
  'pay-as-you-go-yearly-new',
  'pay-as-you-go-monthly-v3'
]);

const TRIAL_OFFER_DAYS = new Set([3, 8, 13]);

interface ISearchMenuItem {
  name: string;
  category: string;
  icon?: IconName;
  lucideIcon?: string;
  routerLink?: string;
  queryParams?: Record<string, string>;
  action?: string;
}

function isModalResult(val: unknown): val is { success?: boolean } {
  return val !== null && typeof val === 'object';
}

@Component({
  selector: 'app-header-v4',
  templateUrl: './header-v4.component.html',
  styleUrls: ['./header-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgOptimizedImage,
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatTooltipModule,
    RouterLink,
    HeaderCompanyDropdownV4Component,
    FavoritesDrawerV4Component,
    UpperCasePipe,
    CurrencyPipe,
    FaIconComponent,
    CdkDrag
  ]
})
export class HeaderV4Component implements OnInit, OnDestroy, AfterViewInit {
  /** Lucide icons by kebab-case name for [img] binding (direct import, no provider) */
  readonly icons = v4LucideIconsMap;

  @HostBinding('class') hostClass = 'font-peridot tracking-[-0.011em]';
  @HostBinding('style') hostStyle = 'font-feature-settings: "rlig" 1, "calt" 1';

  @HostListener('window:resize')
  onResize(): void {
    this.screenWidth = window.innerWidth;
    this.windowWidth.set(window.innerWidth);
  }

  private router = inject(Router);
  headerService = inject(HeaderService);
  private companyManagementService = inject(CompanyManagementService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private localStorageService = inject(LocalStorageService);
  public layoutService = inject(LayoutService);
  private userService = inject(UserService);
  private userProfileService = inject(UserProfileService);
  public gettingStartedService = inject(GettingStartedService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dtCacheService = inject(DataTableCacheService);
  private transferDetailsService = inject(TransferDetailsService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private userManagementService = inject(UserManagementV35Service);
  v4SidebarService = inject(V4SidebarService);
  private notificationSidebarService = inject(NotificationSidebarService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private pusherService = inject(PusherService);
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private personaHelperService = inject(PersonaHelperService);
  private modalService = inject(CustomDoubleSideModalService);
  private destroyRef = inject(DestroyRef);
  private sharedService = inject(SharedService);
  private adpService = inject(AdpService);
  private scriptService = inject(ScriptService);
  private commonOnInitService = inject(CommonOnInitService);
  private introJsService = inject(IntroJsService);
  private authDataService = inject(AuthDataService);
  private cloudService = inject(CloudBankService);
  public v3BulkPaymentService = inject(V3BulkPaymentService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private favoriteActions = inject(FavoriteCommonOnInitV4Service);
  private demoVideoService = inject(DemoVideoService);

  @ViewChild('notificationMenuTrigger') notificationMenuTrigger: MatMenuTrigger;
  @ViewChild('desktopSearchInput')
  desktopSearchInput?: ElementRef<HTMLInputElement>;

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (window.innerWidth >= 1024) {
        this.desktopSearchInput?.nativeElement.focus();
        this.desktopSearchInput?.nativeElement.select();
      } else {
        this.showMobileSearch = true;
      }
    }
  }

  subscriptions: Subscription[] = [];
  pusherChannels: Channel[] = [];
  private userId: number;
  private cjScriptLoaded = false;
  private notificationPusherSubscribed = false;
  private signedReceiptsPusherSubscribed = false;

  // Header state
  isLoading = false;
  personalName = '';
  profilePic = '';
  personalInfo: IHeaderData['personalInfo'];
  companyName = '';
  activeCompanyId = '';
  activeCompanyLogo = '';
  allCompanies: IAllCompanies;
  mailCreditBalance = '--';
  notificationCount = 0;
  notifications: INotificationDetails[] = [];
  groupedNotifications: IGroupedNotification[] = [];
  newNotificationCount = 0;
  showNewNotificationPanel = false;
  isDarkMode = false;
  isOffline = false;
  showMobileSearch = false;
  showProfileMenu = false;
  showCompanyMenu = false;
  showHelpMenu = false;
  online$: Observable<boolean>;
  isNotification = false;
  newNotification: INewNotification;
  env = environment;

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  // Help menu visibility flags
  showLiveChat = true;
  showPhoneNumber = true;
  showLiveScreenSharing = true;
  showVideoTutorial = true;
  showSubmitIdea = true;
  showReportIssue = true;
  showCompliance = true;
  showBookDemo = true;
  showTextUs = true;

  // Search state
  searchQuery = '';
  showSearchResults = false;
  searchableMenuItems: ISearchMenuItem[] = [];
  filteredSearchResults: ISearchMenuItem[] = [];

  // Trial / subscription state
  isSubscribed: number;
  trialEnd: number;
  isShowTrailPeriod: number;
  isSubscribedEnd: number;
  subscribedEndDate = '';
  adpMarketPlaceUser: number;
  bypassHeaderDemoButtonUser = false;
  isBookDemoDataLoaded = false;
  showTrialPeriodPopup: '0' | '1';
  creditCardUser: number;
  showUpgradeBtn = false;
  trialPeriodEndingAlert: {
    [key: number]: { offerPerc: number; value: number };
  };

  alertTooltip = '';

  // Verification / KYC / KYB
  isUserVerified: IUserVerification;
  kycKybStatus: { kycStatus: number | null; kybStatus: number | null } = {
    kycStatus: 2,
    kybStatus: 2
  };

  rerunKybShowSignal = computed(() => this.headerService.rerurnKybStatus());
  eddTriggerStatus = computed(() => this.headerService.eddTriggerStatus());
  kybPersonaVerificationShowSignal = computed(() => this.headerService.kybPersonaVerificationStatus());
  verificationLevel = 1;

  // Tailwind breakpoints used to gate tooltips on header buttons that
  // collapse to icon-only: xl (1280px) and 2xl (1536px).
  private readonly windowWidth = signal<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  readonly isXlOrAbove = computed(() => this.windowWidth() >= 1280);
  readonly is2xlOrAbove = computed(() => this.windowWidth() >= 1536);

  // Layout / responsive
  screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  isHidden = false;
  animation = false;

  // Wallet / what's new
  walletTableData: IWallet;
  whatsNew: number;
  whatsNewView = false;

  // Bulk payment progress bar state
  bulkPaymentCount = 0;
  isShowPaymentSummary = false;
  isBulkPaymentProcessing = false;
  bulkData: (IPaymentSummaryData | IPaymentSummaryData[])[];
  countOfFailedPayment = 0;
  width = 0;
  progressBarValue: boolean;
  abcEnterpriseCheckPrintStatus?: {
    total: number;
    success: number;
    fail: number;
    canceled: number;
  };

  checkPrinting$ = toObservable(
    this.v3BulkPaymentService.abcEntCheckPrintCountSignal
  );

  // Plugin / environment flags
  enabledPlugins: string[] = [];
  showVersionSwitcher=signal<number>(1);
  isEnabledPlugins = false;
  isEnabledhamaspikPlugins = false;
  isEnableYoungwilliamsPlugins = false;
  isEnableHaloPlugins = false;
  isEnableSalesForceplugins = false;
  isEnableBeazleyPlugin = false;
  isEnableSpectrumPlugins = false;
  isEnableMilwaukeePlugins = false;
  createNewPlugIn = false;
  isHideBookDemo = false;
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  isCSNHCRequirement = environment.env_id === 'csnhc';
  private dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();

  /** Single source for profile image: API (personalInfo) first, then cached (profilePic). Used in header and popover. */
  get profilePictureUrl(): string {
    return (
      this.personalInfo?.profilePicLink?.trim() || this.profilePic?.trim() || ''
    );
  }

  constructor() {
    if (this.localStorageService.getItem('profilePicLink')) {
      this.profilePic =
        this.localStorageService.getItem('profilePicLink') || '';
    }
    if (this.localStorageService.getItem('displayName')) {
      this.personalName = this.localStorageService.getItem('displayName') || '';
    }
    this.buildSearchableItems();
  }

  private buildSearchableItems(): void {
    const sections = V4SideBar.menuSections();
    this.searchableMenuItems = sections.flatMap((section) =>
      section.items.map((item) => ({
        name: item.name,
        category: section.category,
        icon: item.icon,
        lucideIcon: item.lucideIcon,
        routerLink: item.routerLink,
        queryParams: item.queryParams,
        action: item.action
      }))
    );
    this.searchableMenuItems.push({
      name: 'Blank Check',
      category: 'PAYABLES',
      lucideIcon: 'banknote',
      action: 'blank-check'
    });
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    if (query.trim()) {
      const q = query.toLowerCase();
      this.filteredSearchResults = this.searchableMenuItems
        .filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
        .slice(0, 8);
      this.showSearchResults = true;
    } else {
      this.filteredSearchResults = [];
      this.showSearchResults = false;
    }
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.filteredSearchResults.length > 0) {
      this.navigateToSearchResult(this.filteredSearchResults[0]);
    } else if (event.key === 'Escape') {
      this.showSearchResults = false;
      this.searchQuery = '';
    }
  }

  onSearchFocus(): void {
    if (this.searchQuery.trim() && this.filteredSearchResults.length > 0) {
      this.showSearchResults = true;
    }
  }

  navigateToSearchResult(item: ISearchMenuItem): void {
    if (item.routerLink) {
      this.router.navigate([`/v4/manage/${item.routerLink}`], {
        queryParams: item.queryParams
      });
    } else if (item.action === 'send-payment') {
      this.paymentsV4Service.openSendModal();
    } else if (item.action === 'receive-payment'){
      this.paymentsV4Service.openReceiveModal();
    } else if (item.action === 'blank-check') {
      this.favoriteActions.blankChecks();
    }
    this.searchQuery = '';
    this.showSearchResults = false;
    this.filteredSearchResults = [];
  }

  closeSearchResults(): void {
    this.showSearchResults = false;
  }

  /**
   * @description Seeds `overallData` for the V4 session. Only the V3 header
   * stored it before, so on V4 the key was absent and every consumer fell back
   * to its defaults — analytics read `bank_count` as 0 and `is_first_attempt`
   * as true for everyone.
   */
  getUserOverallData(): void {
    this.userService
      .getUserOverallData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('overallData', res.data);
        }
      });
  }

  ngOnInit(): void {
    this.activeCompanyId =
      this.localStorageService.getItem('activeCompanyId') || '';
    this.getWhiteLabel();
    this.headerData();
    this.checkHeaderChanged();
    this.checkLayout();
    this.isOnline();
    this.headerNotificationData();
    this.loadHelpMenuConfig();
    this.scrollSubscribe();
    this.verifyEmailPhone();
    this.getAllowedCountries();
    this.headerService.fetchUserVerification();
    this.introJsService.triggerIntroTourFunctionalityOnRouteChanges();
    this.getCompletedPaymentCount();
    this.getCompletedCheckPrint();
    this.getBulkPaymentCount();
    this.getCountFailedPayment();
    this.demoVideoService.loadDemoVideos();
    this.getUserOverallData();

    this.gettingStartedService
      .getGettingStarted()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.verificationLevel =
            res.kybStatus !== null && res.kybStatus !== 0 ? 2 : 1;
          this.kycKybStatus = {
            kycStatus: res.kycStatus,
            kybStatus: res.kybStatus
          };
        }
      });

    if (this.localStorageService.getItem('isSubscribed')) {
      this.isSubscribed =
        this.localStorageService.getItem('isSubscribed') === 1 ? 1 : 0;
    }

    this.maybeOpenDemoModal();
  }

  private maybeOpenDemoModal(): void {
    // Match v3 (header-v35 line 705): when EDD verification is active, suppress other onboarding modals
    const eddRequestData = this.localStorageService.getItem('eddRequestData');
    if (eddRequestData && eddRequestData.days_remaining > 0) {
      return;
    }

    const showDemo = this.localStorageService.getItem('isShowDemo');
    if (showDemo === 1 && !this.isHideBookDemo && !this.isCSNHCRequirement) {
      this.headerService.openDemoModal('home');
    }
    if (
      this.localStorageService.getItem('reward') &&
      !this.isCSNHCRequirement
    ) {
      this.headerService.openRewardModal();
    }
    if (
      this.localStorageService.getItem('showComplianceModal') === 1 &&
      !this.isArcharina &&
      !this.isCSNHCRequirement
    ) {
      this.headerService.openCertificationModal();
    }
    if (
      this.localStorageService.getItem(
        'showInternationalPaymentWelcomeModal'
      ) === 1 &&
      !this.isArcharina &&
      !this.isCSNHCRequirement
    ) {
      this.headerService.openInternationalPaymentModal();
    }
  }

  ngAfterViewInit(): void {
    this.themeService.initTheme();
    this.isDarkMode = this.themeService.getInitialColourTheme();
    this.changeDetectorRef.detectChanges();
  }

  checkHeaderChanged(): void {
    this.subscriptions.push(
      this.headerService.getHeaderValueChanged().subscribe((res) => {
        if (res) this.headerData();
      })
    );
  }

  checkLayout(): void {
    this.subscriptions.push(
      this.layoutService.isLoading
        .pipe(delay(200))
        .subscribe((loading: boolean) => {
          this.isLoading = loading;
        })
    );
  }

  headerData(): void {
    this.headerService.isHeaderDataLoaded.set(true);
    this.headerService
      .headerData()
      .pipe(
        finalize(() => this.headerService.isHeaderDataLoaded.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const data = res?.data;
        if (!data) return;

        // eslint-disable-next-line no-underscore-dangle -- HeaderService public API
        this.headerService._headerData.next(data);

        this.persistHeaderToStorage(data);
        this.applyHeaderToServices(data);
        this.enabledPlugins = data.enabledPlugins ?? [];
        this.showVersionSwitcher.set(this.enabledPlugins.length);
        this.isIncludedInEnabledPlugins();

        this.headerService.setRerunKybStatus(!!data.reRunVerificationData);
        this.headerService.setEddTriggerStatus(!!data.eddRequestData);
        this.headerService.setKybPersonaVerificationStatus(
          !!data.kybPersonaVerificationData?.show_modal
        );
        this.headerService.setCreditCardGatewaySwitchingStatus(
          data.credit_card_gateway_switching_status
        );

        // EDD guard: if days_remaining > 0, open the warning modal once per session
        if (
          data.eddRequestData &&
          data.eddRequestData.days_remaining > 0 &&
          data.eddRequestData.status !== 'APPROVED' &&
          !this.localStorageService.getItem('eddWarningModalShown')
        ) {
          this.localStorageService.setItem('eddWarningModalShown', true);
          this.headerService.openEddRerunVerificationModal(
            {
              kyb_id: data.eddRequestData.kyb_id,
              edd_inquiry_id: data.eddRequestData.edd_inquiry_id
            },
            this.localStorageService.getItem('rerunVerification')?.id
          );
        }

        this.userId = data.userInfo.userId;
        // this is a temporary fix - without backend support.
        this.bypassHeaderDemoButtonUser = data.userInfo.userId === 1464130;
        this.subscribePusherForNotifications(this.userId);
        this.subscribeForSignedReceiptsPusher(this.userId);

        this.headerService.setHeaderLoaded(true);
        this.isBookDemoDataLoaded = true;
        this.personalInfo = data.personalInfo;
        this.personalName = this.getTwoCharOfUserName(
          data.personalInfo.nickName || data.personalInfo.name
        );
        this.localStorageService.setItem('displayName', this.personalName);

        this.allCompanies = data.allCompanies;
        this.mailCreditBalance = parseFloat(
          data.totalMailCredit.credit
        ).toFixed(2);
        this.walletTableData = data.wallet;
        this.whatsNew = data.whatsNew;
        this.profilePic = data.personalInfo.profilePicLink || '';
        this.companyName = data.allCompanies.activeCompanyName;
        this.localStorageService.setItem('profilePicLink', this.profilePic);

        this.isSubscribed = Number(data.isSubscribed);
        this.trialEnd = data.trialPeriodEndsInDays;
        this.isShowTrailPeriod = data.isShowTrailPeriod;
        this.isSubscribedEnd = data?.isSubscribedEnd;
        this.subscribedEndDate = data.subscribedEndDate;
        this.adpMarketPlaceUser = data?.userInfo?.adpMarketPlaceUser;
        this.showTrialPeriodPopup = data?.showTrialPeriodPopup;
        this.creditCardUser = data?.creditCardUser;
        this.showUpgradeBtn = PAY_AS_YOU_GO_PLANS.has(data.currentPlan);
        this.alertTooltip = `Your trial period ends in ${this.trialEnd} days.`;
        this.headerService.isLoggedInAsClient.next(res.data.isLoggedInAsClient);

        if (
          data.isSubscribed === 0 &&
          this.staticWhiteLabelConditions?.subscriptionVisible &&
          this.adpMarketPlaceUser !== 1 &&
          data.personalInfo?.isLegalEnabled !== '1'
        ) {
          this.trialPeriodFun(
            data?.trialPeriodEndsInDays,
            data?.isShowTrailPeriod
          );
        }

        if (!this.cjScriptLoaded) {
          this.scriptService.cjSiteCode();
          this.cjScriptLoaded = true;
        }

        this.getActiveCompanyLogo();
        this.gettingStartedService.resetGettingStartedData();
        this.gettingStartedService.getGettingStartedData();
        this.gettingStartedService.updateGettingStartedData();
      });
  }

  /** Persist header response fields to localStorage. */
  private persistHeaderToStorage(data: IHeaderData): void {
    const ls = this.localStorageService;
    ls.setItem('timezone', data.personalInfo.timezone);
    ls.setItem('emailVerified', data?.userInfo?.email_verified);
    ls.setItem('phoneVerified', data?.userInfo?.phone_verified);
    ls.setItem('activeCompanyName', data?.allCompanies?.activeCompanyName);
    ls.setItem('achEnabled', data?.achEnabled);
    ls.setItem('email', data.personalInfo?.email);
    ls.setItem('userId', data.userInfo.userId);
    ls.setItem('phone', data.personalInfo.phone);
    ls.setItem('encryptedUserId', data.userInfo.encrypted_id);
    ls.setItem('isSubscribed', data.isSubscribed);
    ls.setItem('companyName', data.BusinessInfo.companyName);
    ls.setItem('userPlugins', data.enabledPlugins);
    ls.setItem('currentPlan', data.currentPlan);
    ls.setItem('rerunVerification', data.reRunVerificationData);
    ls.setItem('eddRequestData', data.eddRequestData);
    ls.setItem('kybPersonaVerification', data.kybPersonaVerificationData);
    ls.setItem('trialPeriodEndsIn', data.trialPeriodEndsInDays);
    ls.setItem(
      'rippleBusinessInternationalPaymentEnabled',
      data.rippleBusinessInternationalPaymentEnabled
    );
    ls.setItem(
      'ripplePersonalInternationalPaymentEnabled',
      data.ripplePersonalInternationalPaymentEnabled
    );
    if (data.showInternationalPaymentWelcomeModal !== undefined) {
      ls.setItem(
        'showInternationalPaymentWelcomeModal',
        data.showInternationalPaymentWelcomeModal
      );
    }
    ls.setItem('pingPongEnabled', data.pingpongEnabled);
    ls.setItem('hasComplianceFreeze', !!data.isComplianceScreeningFrozen);
    ls.setItem('isCreditCardPaymentEnabled', data.isCreditCardPaymentEnabled);
    ls.setItem('userQuickNavigationItems', data.userQuickNavigationItems);
  }

  /** Push header fields into shared services. */
  private applyHeaderToServices(data: IHeaderData): void {
    this.adpService.isADPRunUser = data.adpRunUser;
    this.userService.achEnabledUser = data.achEnabled ? 1 : 0;
    if (data.isApprovedForProcessNow === 1) {
      this.sharedService.enabledForProcessNow = true;
    }
    this.adpService.adpUserDetails.next({
      adpMarketPlaceUser: data?.userInfo?.adpMarketPlaceUser,
      passwordUpdated: data?.userInfo?.passwordUpdated
    });
    this.authDataService.isQBOnlineTimeSpanEnabled =
      data?.enabledPlugins?.includes('qb-import-time-span') ?? false;
    this.dataTableService.paginationChange$.next(
      data?.enabledPlugins?.includes('infinite-scroll') ?? false
    );
    const attachments = data?.personalInfo?.AttachmentSettings;
    this.headerService.autoAttachmentSetForECheck =
      attachments?.check_mail === 1;
    this.headerService.autoAttachmentSetForCheckMailing =
      attachments?.echeck === 1;
    this.headerService.autoAttachmentSetForAch = attachments?.ach === 1;
  }

  private isIncludedInEnabledPlugins(): void {
    this.isEnabledhamaspikPlugins  = !!this.enabledPlugins?.includes('enterprise-hamaspik-check-import');
    this.isEnableYoungwilliamsPlugins = !!this.enabledPlugins?.includes('enterprise-youngwilliams-check-import');
    this.isEnableHaloPlugins       = !!this.enabledPlugins?.includes('enterprise-halo-check-import');
    this.isEnableSpectrumPlugins   = !!this.enabledPlugins?.includes('enterprise-spectrum-check-import');
    this.isEnableMilwaukeePlugins  = !!this.enabledPlugins?.includes('enterprise-milwaukee-check-import');
    this.isEnableSalesForceplugins = !!this.enabledPlugins?.includes('enterprise-salesforce-check-import');
    this.isEnableBeazleyPlugin     = !!this.enabledPlugins?.includes('enterprise-beazley');
    this.isEnabledPlugins          = !!this.enabledPlugins?.includes('enterprise-title-eq-check-import');
  }

  getImportChecksRoute(): void {
    if (this.isEnabledhamaspikPlugins) {
      this.router.navigate(['/manage/cheque/hamaspik-import/step1']);
    } else if (this.isEnableSpectrumPlugins) {
      this.dialog.open(SpectrumImportV4Component, {
        maxWidth: '95vw',
        width: '560px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      });
    } else if (this.isEnableMilwaukeePlugins) {
      this.dialog.open(EnterpriseMultiImportV4Component, {
        maxWidth: '95vw',
        width: '560px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      }).afterClosed().subscribe((res) => {
        if (!res) return;
        const targetUrl = '/v4/manage/payments-out/detailed/check';
        if (this.router.url.split('?')[0] === targetUrl) {
          this.v3DataTableService.refreshV3DataTable();
        } else {
          this.router.navigate([targetUrl]);
        }
      });
    } else if (this.isEnableYoungwilliamsPlugins) {
      this.dialog.open(YoungwilliamsImportV4Component, {
        maxWidth: '95vw',
        width: '560px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      }).afterClosed().subscribe((res) => {
        if (!res?.success) return;
        const targetUrl = '/v4/manage/payments-out/detailed/check';
        if (this.router.url.split('?')[0] === targetUrl) {
          this.v3DataTableService.refreshV3DataTable();
        } else {
          this.router.navigate([targetUrl]);
        }
      });
    } else if (this.isEnableHaloPlugins) {
      this.dialog.open(HaloImportV4Component, {
        maxWidth: '95vw',
        width: '560px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      });
    } else if (this.isEnableBeazleyPlugin) {
      this.openBeazleyModal();
    } else if (this.isEnableSalesForceplugins) {
      this.dialog.open(SalesforceImportV4Component, {
        maxWidth: '95vw',
        width: '480px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      });
    }
  }

  openBeazleyModal(): void {
    this.dialog
      .open(BeazleyImportV4Component, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.success) return;

        const targetUrl = '/v4/manage/payments-out/detailed/all';
        if (this.router.url.split('?')[0] === targetUrl) {
          this.v3DataTableService.refreshV3DataTable();
        } else {
          this.router.navigate([targetUrl]);
        }
      });
  }

  headerNotificationData(): void {
    this.subscriptions.push(
      this.headerService.getNotificationValueChanged().subscribe(() => {
        this.getNotification();
      })
    );
  }

  getNotification(): void {
    this.subscriptions.push(
      this.userService.getNotification().subscribe((data) => {
        if (data?.success) {
          this.notifications = data.data.notifications;
          this.organizeNotification();
          this.notificationCount = data.data.unreadNotificationsCount || 0;
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

  organizeNotification(): void {
    this.groupedNotifications = [];
    this.notifications.slice(0, 10).forEach((notification) => {
      const dateObj = new Date(notification.createdAt as string);
      const dayName = this.isToday(dateObj)
        ? 'Today'
        : this.getDayName(notification.createdAt as string);
      const existingGroup = this.groupedNotifications.find(
        (g) => g.day === dayName
      );
      const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
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

  getDayName(dateString: string): string {
    const date = new Date(dateString);
    return days[date.getDay()];
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  redirectToPage(value: INotificationDetails): void {
    this.subscriptions.push(
      this.userService.markAsRead(value.id).subscribe((res) => {
        if (res.success) {
          // eslint-disable-next-line no-param-reassign -- intentional mutation for UI update
          value.readAt = true;
        }
        this.headerService.setHeaderValueChanged(true);
        this.headerService.setNotificationValueChanged(true);
      })
    );

    const { path, queryParams } = resolveNotificationLink(
      value.notification.action_link
    );
    this.router.navigate([path], {
      queryParams,
      state: { backUrl: this.router.url }
    });
  }

  getTwoCharOfUserName(name: string): string {
    const nameParts = name?.split(' ');
    const firstName = nameParts[0]?.charAt(0);
    const lastName =
      nameParts?.length > 1
        ? nameParts[1]?.charAt(0)
        : nameParts[0]?.substring(0, 2);
    return nameParts?.length > 1 ? firstName + lastName : lastName;
  }

  getActiveCompanyLogo(): void {
    this.activeCompanyId =
      this.localStorageService.getItem('activeCompanyId') || '';
    const findCompany = this.allCompanies?.ownCompanies?.find(
      (item: IOwnCompany) => this.activeCompanyId === item?.companyId
    );
    this.activeCompanyLogo = findCompany?.companyLogoUrl || '';
  }

  private isV4Route(): boolean {
    return this.router.url.includes('/v4/');
  }

  onSelectCompany(ev: {
    companyId: string;
    companyName: string;
    type: string;
    status: number;
  }): void {
    if (ev.status === 0 || ev.status === 3) {
      this.router.navigate([
        '/v4/manage/company_management/index/company_management'
      ]);
      return;
    }

    this.store.dispatch(UserManagementActions.clearUserVerification());
    this.store.dispatch(UserManagementActions.loadUserVerification());

    if (this.localStorageService.getItem('activeCompanyId') === ev.companyId) {
      return;
    }

    const wasV4 = this.isV4Route();

    this.companyManagementService.setActiveCompanyInfo(
      ev.companyId,
      ev.companyName,
      ev.type,
      ev.companyId === this.localStorageService.getItem('parentCompanyId')
        ? 1
        : 0
    );
    this.userManagementService.selectedUser$.next(false);
    this.companyManagementService.setCompanyChange(true);
    this.notificationCount = 0;
    this.notifications = [];
    this.groupedNotifications = [];
    this.newNotificationCount = 0;
    this.showNewNotificationPanel = false;
    this.headerData();
    this.headerService.setNotificationValueChanged(true);
    this.dtCacheService.resetTablePostData();
    this.dtCacheService.deleteDb();
    this.transferDetailsService.resetData();

    if (wasV4) {
      this.router.navigate(['/v4/manage/index']);
    } else if (this.router.url === '/manage/payments-table/index') {
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
    this.v4SidebarService.setCompanySwitched(true);
  }

  managePage(): void {
    let returnUrl = this.router.routerState.snapshot.url;
    returnUrl = returnUrl?.slice(1, returnUrl.length);
    this.localStorageService.setItem('returnFromManage', returnUrl);
    this.router.navigate(['/v4/manage/company_management/index']);
  }

  switchToClassic(): void {
    const encryptedUserId = this.localStorageService.getItem(
      'encryptedUserId'
    ) as string | null;
    this.localStorageService.setItem('isV4LayoutEnabled', 0);
    this.localStorageService.setItem('versionSwitcherShown',1);
    this.router.navigateByUrl('/manage/payments-table/index');
    if (encryptedUserId) {
      this.userProfileService.changeLayoutV4(encryptedUserId, 0).subscribe({
        error: () => {
          this.localStorageService.setItem('isV4LayoutEnabled', 1);
        }
      });
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.changeDetectorRef.detectChanges();
    if (this.isDarkMode) {
      this.themeService.update('dark-mode');
      this.themeService.sendThemeSwitch(this.isDarkMode);
    } else {
      this.themeService.update('light-mode');
      this.themeService.sendThemeSwitch(this.isDarkMode);
    }
  }

  showMobileMenu(): void {
    this.v4SidebarService.openMobile();
  }

  onLogout(): void {
    this.authService.Logout();
  }

  isOnline(): void {
    this.online$ = merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    );
    this.subscriptions.push(
      this.online$.subscribe((isOnline: boolean) => {
        this.isOffline = !isOnline;
      })
    );
  }

  subscribePusherForNotifications(userId: number): void {
    if (this.notificationPusherSubscribed) return;
    this.notificationPusherSubscribed = true;
    const channelName = `user-app-notifications-${userId}`;
    const eventName = `user-app-notifications-event-${userId}`;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (res: INewNotification) => {
          if (res) {
            this.newNotification = res;
            this.isNotification = true;
            this.getNotification();
            this.changeDetectorRef.detectChanges();
            setTimeout(() => {
              this.isNotification = false;
            }, 3000);
          }
        })
    );
  }

  navigateToPricing(): void {
    this.router.navigate(['/v4/manage/refill-credit']);
  }

  closeNotification(): void {
    this.isNotification = false;
  }

  /** On image load failure: only clear cache. Do not clear API URL so we keep showing the API image and never fall back to initials. */
  onProfilePicError(): void {
    this.profilePic = '';
    this.localStorageService.setItem('profilePicLink', '');
    this.changeDetectorRef.detectChanges();
  }

  goToSubscription(type?: string): void {
    const onDashboard = this.router.url.startsWith(
      '/v4/manage/user-profile/index'
    );
    if (onDashboard) {
      this.headerService.isRenewloading.set(false);
      if (type === 'renew') {
        this.headerService.renewClicked$.next(true);
        return;
      }
    } else {
      this.headerService.isRenewloading.set(true);
    }
    if (!this.isSubscribed && !this.isSubscribedEnd) {
      this.router.navigate(['v4/manage/subscription/plan'], {
        state: { returnUrl: this.router.url },
        queryParams: { type }
      });
      return;
    }
    this.router.navigate(['/v4/manage/user-profile/index'], {
      state: { returnUrl: this.router.url },
      queryParams: { tab: 'myPlan', type }
    });
  }

  addCompany(): void {
    const ref = this.modalService.open(AddCompanyModalV4Component, {
      width: '700px',
      panelClass: 'paddingless-modal-rounded',
      data: { editMode: false }
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: unknown) => {
        if (isModalResult(result) && result.success) {
          this.headerData();
        }
      });
  }

  requestCompanyAccess(): void {
    const ref = this.modalService.open(RequestAccessModalV4Component, {
      width: '600px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: unknown) => {
        if (isModalResult(result) && result.success) {
          this.headerData();
        }
      });
  }

  toggleNotificationSidebar(): void {
    this.notificationSidebarService.toggle();
  }

  markAllNotificationsRead(): void {
    this.subscriptions.push(
      this.userService.markAllRead().subscribe((data) => {
        if (data?.success) {
          this.getNotification();
        }
        this.headerService.setNotificationValueChanged(true);
        this.headerService.setHeaderValueChanged(true);
      })
    );
  }

  onNotificationClick(item: INotificationDetails): void {
    this.userService
      .markAsRead(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          const notification = this.notifications.find((n) => n.id === item.id);
          if (notification) notification.readAt = true;
        }
        this.headerService.setHeaderValueChanged(true);
        this.headerService.setNotificationValueChanged(true);
      });

    const { path, queryParams } = resolveNotificationLink(
      item.notification.action_link
    );
    this.notificationMenuTrigger?.closeMenu();
    this.router.navigate([path], {
      queryParams,
      state: { backUrl: this.router.url }
    });
  }

  viewAllNotifications(): void {
    this.notificationMenuTrigger?.closeMenu();
    this.router.navigate(['/v4/manage/more/notification/show']);
  }

  getNotificationIconInfo(icon: string): { name: string; color: string } {
    const iconMap: Record<string, { name: string; color: string }> = {
      'fa-check-circle': {
        name: 'circle-check',
        color: 'text-v4-common-green-color'
      },
      'fa-times-circle': {
        name: 'circle-x',
        color: 'text-v4-common-red-color'
      },
      'fa-exclamation-circle': {
        name: 'circle-alert',
        color: 'text-v4-common-yellow-color'
      },
      'fa-info-circle': { name: 'info', color: 'text-v4-common-blue-color' },
      'fa-envelope': {
        name: 'mail',
        color: 'text-v4-primary-brand-bold-color'
      },
      'fa-money-bill': {
        name: 'banknote',
        color: 'text-v4-common-green-color'
      },
      'fa-credit-card': {
        name: 'credit-card',
        color: 'text-v4-primary-brand-bold-color'
      },
      'fa-university': {
        name: 'landmark',
        color: 'text-v4-primary-brand-bold-color'
      },
      'fa-file-alt': {
        name: 'file-text',
        color: 'text-v4-tertiary-text-color'
      },
      'fa-user': { name: 'user', color: 'text-v4-primary-brand-bold-color' },
      'fa-building': {
        name: 'building-2',
        color: 'text-v4-primary-brand-bold-color'
      },
      'fa-cog': { name: 'settings', color: 'text-v4-tertiary-text-color' },
      'fa fa-bank': {
        name: 'landmark',
        color: 'text-v4-primary-brand-bold-color'
      },
      'fa fa-envelope-o fs-18 text-info': {
        name: 'mail',
        color: 'text-v4-primary-brand-bold-color'
      },
      'fa fa-money': { name: 'banknote', color: 'text-v4-common-green-color' },
      'fa fa-truck': { name: 'send', color: 'text-v4-common-green-color' },
      'fa fa-file': { name: 'file-text', color: 'text-v4-tertiary-text-color' },
      'fa fa-upload fs-18 text-info': {
        name: 'upload',
        color: 'text-v4-primary-brand-bold-color'
      },
      'fa fa-exclamation-triangle fs-18 text-info': {
        name: 'circle-alert',
        color: 'text-v4-common-red-color'
      }
    };
    const match = Object.entries(iconMap).find(([key]) => icon?.includes(key));
    return match
      ? match[1]
      : { name: 'bell', color: 'text-v4-common-blue-color' };
  }

  getNotificationBgColor(icon: string): string {
    const info = this.getNotificationIconInfo(icon);
    const colorMap: Record<string, string> = {
      'text-v4-common-green-color':
        'color-mix(in srgb, var(--v4-common-green-color) 15%, transparent)',
      'text-v4-common-red-color':
        'color-mix(in srgb, var(--v4-common-red-color) 15%, transparent)',
      'text-v4-common-yellow-color':
        'color-mix(in srgb, var(--v4-common-yellow-color) 15%, transparent)',
      'text-v4-common-blue-color':
        'color-mix(in srgb, var(--v4-common-blue-color) 15%, transparent)',
      'text-v4-primary-brand-color':
        'color-mix(in srgb, var(--v4-primary-brand-color) 15%, transparent)',
      'text-v4-primary-brand-bold-color':
        'color-mix(in srgb, var(--v4-primary-brand-bold-color) 15%, transparent)',
      'text-v4-tertiary-text-color':
        'color-mix(in srgb, var(--v4-tertiary-text-color) 15%, transparent)'
    };
    return (
      colorMap[info.color] ||
      'color-mix(in srgb, var(--v4-common-blue-color) 15%, transparent)'
    );
  }

  // ── Help Menu Config ──

  loadHelpMenuConfig(): void {
    if (!StaticWhiteLabelConditions.zohoSupportChat) {
      this.showLiveChat = false;
    }
    if (!StaticWhiteLabelConditions.customerSupportNo) {
      this.showPhoneNumber = false;
    }
    if (environment.isItWhiteLabel) {
      this.showLiveScreenSharing = false;
      this.showVideoTutorial = false;
      this.showSubmitIdea = false;
      this.showCompliance = false;
      this.showBookDemo = false;
      this.showTextUs = false;
    }
    if (environment.env_id === 'sandbox') {
      this.showLiveScreenSharing = false;
      this.showVideoTutorial = false;
      this.showSubmitIdea = false;
      this.showReportIssue = false;
      this.showCompliance = false;
      this.showBookDemo = false;
      this.showTextUs = false;
    }
    if (
      environment.env_id === 'quickbanked' ||
      environment.env_id === 'quickbanked-sandbox'
    ) {
      this.showBookDemo = false;
    }
  }

  // ── Help Menu Handlers ──

  onLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  onLiveScreenSharing(): void {
    window.open('https://join.zoho.com/', '_blank');
  }

  onHelpTutorial(): void {
    window.open(StaticWhiteLabelConditions.supportWebsite, '_blank');
  }

  onVideoTutorial(): void {
    window.open(
      'https://www.youtube.com/channel/UC4rjiWXUxv-6V4drscMQDwA',
      '_blank'
    );
  }

  onSubmitIdea(): void {
    this.dialog.open(FeatureRequestModalV4Component, {
      maxWidth: '510px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {}
    });
  }

  onReportIssue(): void {
    this.router.navigate(['/v4/manage/user-support']);
  }

  onOurCompliance(): void {
    this.router.navigate(['/v4/manage/user-profile/user-settings'], {
      queryParams: { tab: 'our-compliance' }
    });
  }

  onBookDemo(): void {
    this.headerService.openBookDemoModal('header');
  }

  onTextUs(): void {
    this.dialog.open(TextUsV4Component, {
      maxWidth: '460px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded'
    });
  }

  onPhoneCall(): void {
    document.location.href = `tel:${StaticWhiteLabelConditions.customerSupportNo}`;
  }

  async onMobileHelpSupport(): Promise<void> {
    const { V4ContactSupportModalComponent } = await import(
      'src/app/shared/modal/v4-contact-support-modal/v4-contact-support-modal.component'
    );
    this.dialog.open(V4ContactSupportModalComponent, {
      maxWidth: '600px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {}
    });
  }

  // ── Lifecycle / Init helpers ──

  /** Subscribe to the subheader visibility stream so we can hide/show in scroll. */
  scrollSubscribe(): void {
    this.headerService.isSubHeaderVisible
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isHidden = res.hidden || environment.env_id === 'csnhc';
        this.animation = res.animation;
      });
  }

  /** Mirror the user verification stream onto the local field. */
  verifyEmailPhone(): void {
    this.userProfileService.UserVerification$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((res) => {
      this.isUserVerified = res;
    });
  }

  /** Fetch allowed countries used by payee/address forms. */
  getAllowedCountries(): void {
    this.cloudService
      .getAllowedCountries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.cloudService.allowedCountries.next(res.data);
      });
  }

  /** Read the active white-label config to honour env-specific feature flags. */
  getWhiteLabel(): void {
    const current = this.dynamicWhiteLabelData.find(
      (wl) => wl.environmentId === environment.env_id
    );
    this.isHideBookDemo = current?.flags?.hideDemoButton || false;
  }

  /** Fire the upgrade-plan gtag event. */
  gtagScript(): void {
    this.scriptService.gtagEventScript('upgrade-plan');
  }

  /** Open the trial-period over / offer modal based on remaining days. */
  trialPeriodFun(trialEndsIn: number, isShowTrailPeriod: number): void {
    if (TRIAL_OFFER_DAYS.has(trialEndsIn)) {
      this.trialPeriodEndingAlert = subscriptionOffers[trialEndsIn];
    }
    const isCreditCardUser = this.creditCardUser === 1;
    if (
      trialEndsIn === 0 &&
      isShowTrailPeriod === 1 &&
      this.showTrialPeriodPopup === '1' &&
      !isCreditCardUser
    ) {
      this.commonOnInitService.openTrialPeriodOverModalV4();
    } else if (
      TRIAL_OFFER_DAYS.has(trialEndsIn) &&
      this.commonOnInitService.showTrailPeroidOverModal('showTrialOffer') &&
      !isCreditCardUser
    ) {
      this.commonOnInitService.openTrialPeriodOfferAlertModalV4(trialEndsIn);
    }
  }

  /** Bulk payment count drives the visibility/state of the progress bar. */
  getBulkPaymentCount(): void {
    this.v3BulkPaymentService
      .getBulkPaymentCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.bulkPaymentCount = res;
        if (res === 0) this.width = 0;
        this.isShowPaymentSummary = res > 0;
        this.isBulkPaymentProcessing = res > 0;
      });
  }

  /** Track completed payments — fills the progress bar. */
  getCompletedPaymentCount(): void {
    this.layoutService.isProgressBarInvoked
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: boolean) => {
        this.progressBarValue = res;
      });

    this.v3BulkPaymentService.completedPaymentCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (this.progressBarValue) return;
        if (res === 0) this.width = 0;
        this.width += res;
        if (res !== 0 && this.width === this.bulkPaymentCount) {
          this.isBulkPaymentProcessing = false;
          this.layoutService.isProgressBarInvoked.next(true);
        } else {
          this.isBulkPaymentProcessing = true;
        }
      });

    // Bulk run finished: mark complete even if per-item counts didn't add up exactly.
    this.v3BulkPaymentService
      .getIsBulkPaymentProcessing()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isProcessing) => {
        if (isProcessing || !this.bulkPaymentCount) return;
        this.width = this.bulkPaymentCount;
        this.isBulkPaymentProcessing = false;
        this.layoutService.isProgressBarInvoked.next(true);
      });
  }

  /** ABC Enterprise: track check-print progress. */
  getCompletedCheckPrint(): void {
    this.checkPrinting$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.abcEnterpriseCheckPrintStatus = res;
        if (res && res.total > 0) {
          if (res.total === res.canceled + res.fail + res.success) {
            this.isBulkPaymentProcessing = false;
            this.layoutService.isProgressBarInvoked.next(true);
          }
        }
      });
  }

  /** Count how many bulk-payment items came back as HttpErrorResponse. */
  getCountFailedPayment(): void {
    this.countOfFailedPayment = 0;
    this.v3BulkPaymentService
      .getBulkPaymentData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.bulkData = res;
        const response = this.bulkData as IPaymentSummaryData[];
        this.countOfFailedPayment = response.filter(
          (item) =>
            item?.success instanceof HttpErrorResponse ||
            (item?.success as { success?: boolean })?.success === false
        ).length;
      });
  }

  /** Close the bulk-payment progress bar. */
  closeBulkProgress(): void {
    this.v3BulkPaymentService.setBulkPaymentCount(0);
    this.isShowPaymentSummary = false;
    this.v3BulkPaymentService.abcEntCheckPrintCountSignal.set(undefined);
  }

  /** Open the bulk payment summary modal (V4 variant). */
  openPaymentSummary(): void {
    this.dialog.open(V4PaymentSummaryModalComponent, {
      maxWidth: '800px',
      width: '95%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { summary: this.bulkData }
    });
    this.closeBulkProgress();
  }

  // ── Pusher: signed receipts ──

  subscribeForSignedReceiptsPusher(userId: number): void {
    if (this.signedReceiptsPusherSubscribed) return;
    this.signedReceiptsPusherSubscribed = true;
    const channel = `payment-receipt-signature-uploaded-${userId}`;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channel)
        .bind(channel, (res: INewNotification) => {
          if (res) this.v3DataTableService.refreshV3DataTable();
        })
    );
  }

  // ── Misc navigation / modals ──

  /** Open the What's New modal. */
  openWhatsNewModal(): void {
    this.dialog
      .open(WhatsNewComponent, {
        maxWidth: '700px',
        panelClass: ['whats-new-modal-align']
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.whatsNewView = true;
      });
  }

  /** Verification index navigation (used by getting-started flow). */
  gotoVerification(): void {
    this.router.navigateByUrl('/v4/manage/verification/index');
  }

  goToGettingStarted(): void {
    this.router.navigateByUrl('/v4/manage/verification/index');
  }

  /** Open the rerun KYB / EDD modal. */
  openRerunKybModal(model: 'kyb' | 'edd'): void {
    const rerun = this.localStorageService.getItem('rerunVerification');
    const edd = this.localStorageService.getItem('eddRequestData');
    const data =
      model === 'kyb'
        ? {
            mode: model,
            sourceType: CVSourceType.other,
            reVerificationId: rerun?.id,
            businessId: rerun?.business_id
          }
        : {
            mode: model,
            sourceType: CVSourceType.other,
            reVerificationId: rerun?.id,
            businessId: edd?.kyb_id,
            eddInquiryId: edd?.edd_inquiry_id
          };
    this.dialog.open(RerunVerificationComponent, {
      panelClass: 'paddingless-modal-rounded',
      width: '400px',
      height: 'auto',
      disableClose: true,
      data
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data?.inquiry_id) {
          this.localStorageService.removeItem('kybPersonaVerification');
          this.headerService.setKybPersonaVerificationStatus(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el?.unsubscribe());
    this.commonOnInitService.ngOnDestroy();
    this.headerService.ngOnDestroy();
  }
}

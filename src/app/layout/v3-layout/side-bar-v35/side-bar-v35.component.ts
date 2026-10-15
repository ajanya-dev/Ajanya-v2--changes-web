import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import {
  IMobileNavSection,
  IMobileSidebarLinks,
  IV3SidebarLinks,
  V3SideBar
} from 'src/app/data/data/menu/v3-sidebar/v35-sidebar/v35-sidebar';
import { Router, RouterLink } from '@angular/router';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { IPersonalInfo } from 'src/app/layout/model/header';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { EnvironmentId } from 'src/app/models/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, NgOptimizedImage, NgStyle, NgTemplateOutlet } from '@angular/common';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { environment } from 'src/environments/environment';
import { faUserSecret } from '@fortawesome/pro-solid-svg-icons';
import { InternationalPaymentInfoDialogComponent } from 'src/app/shared/modal/international-payment-info/international-payment-info-dialog.component';
import { filter, switchMap, take } from 'rxjs/operators';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { SideBarService } from '../../side-bar/side-bar.service';

@Component({
  selector: 'app-side-bar-v35',
  templateUrl: './side-bar-v35.component.html',
  styleUrls: ['./side-bar-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    FaIconComponent,
    MatTooltip,
    MatMenuTrigger,
    NgStyle,
    MatMenu,
    WhiteLabelDirective,
    NgTemplateOutlet,
    InternationalPaymentInfoDialogComponent,
    NgOptimizedImage
  ]
})
export class SideBarV35Component implements OnInit, OnDestroy {
  private sideBarService = inject(SideBarService);
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);
  private Layoutservice = inject(LayoutService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private userService = inject(UserService);
  public dialog = inject(MatDialog);
  private appSettingService = inject(AppSettingsService);
  private localStorageService = inject(LocalStorageService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private v3DataTable = inject(V3DataTableService);
  private requestPaymentService = inject(RequestPaymentsService);
  private clickTrackingService = inject(ClickTrackingService);

  firstMenuSection: IV3SidebarLinks[] = V3SideBar.firstMenuSection();
  secondsMenuSection: IV3SidebarLinks[] = V3SideBar.secondMenuSection();
  bottomSection: IV3SidebarLinks[] = V3SideBar.bottomMenuSection();
  settingsMenuLinks: IMobileSidebarLinks[] = V3SideBar.v3SettingsMenuList();
  mobileNavigationSections = signal<IMobileNavSection[]>(
    V3SideBar.mobileNavigation()
  );

  selectedEnvironmentId: EnvironmentId =
    this.dynamicWhiteLabelService.localStorageGlobalEnvironmentId;

  isBuckzy =
    environment.env_id === 'buckzy' || environment.env_id === 'buckzy-sandbox';

  isArcharina = environment.env_id === 'archarina' || environment.env_id === 'archarina-sandbox';

  isOlliepay = environment.env_id === 'olliepay';
  subscriptions: Subscription[] = [];
  toggleMobileMenu: boolean;
  menuId = '';
  personalInfo: string;
  profilePic: string;
  mobileMaxHeight: string;
  whiteLabelConfig = StaticWhiteLabelConditions;
  sideBarStatus = false;
  sideBar = true;
  showMoreMenus = false;
  showWebTabMenus = false;
  showMoreItems = false;
  isNotVerified = false;
  supportNo = this.whiteLabelConfig.customerSupportNo;
  appConfig: IAppConfig;
  expandedMenuIndex: string = '';
  kybStatus: number;
  private selectedItemPrivate: string | undefined;
  sideBarAction = '';
  selectedMobileSidebarItem = '';
  isAdminLogin = signal(false);
  faUserSecret = faUserSecret;
  showInternationalPaymentPopup = signal(false);

  set selectedItem(id: string | undefined) {
    this.expandedMenuIndex = id ?? '';
    if (id) {
      let tempid: string = '';
      this.firstMenuSection.forEach((val) => {
        if (val.id === id) {
          tempid = val.id;
        } else if (val.isDropdown) {
          val.subItem?.forEach((subv) => {
            if (subv.id === id) {
              tempid = val.id;
            }
          });
        }
      });
      this.secondsMenuSection.forEach((val) => {
        if (val.id === id) {
          tempid = val.id;
        } else if (val.isDropdown) {
          val.subItem?.forEach((subv) => {
            if (subv.id === id) {
              tempid = val.id;
            }
          });
        }
      });
      if (tempid) this.expandedMenuIndex = tempid;
    }
    this.selectedItemPrivate = id;
  }

  get selectedItem() {
    return this.selectedItemPrivate;
  }

  paymentLinkcount: number;
  overallDataLoading = false;

  logoUrl: string = '/assets/main/app_logo_white.svg';

  ngOnInit(): void {
    this.loadAppSettings();
    this.hideMobileMenus();
    this.checkSideBarStatus();
    this.sideBar = this.localStorageService.getItem('sideBarValues');
    this.Layoutservice.setMessage(
      this.localStorageService.getItem('sideBarValues')
    );
    this.subscriptions.push(
      this.Layoutservice.sideBarToggle.subscribe((res) => {
        this.sideBarStatus = res;
      })
    );

    this.subscriptions.push(
      this.headerService.modalQueue$.pipe(
        filter(queue => queue.length === 0 && this.shouldShowPopup()),
        switchMap(() => 
          timer(100).pipe(
            switchMap(() => this.headerService.modalQueue$.pipe(take(1)))
          )
        ),
        filter(currentQueue => currentQueue.length === 0 && this.shouldShowPopup())
      ).subscribe(() => {
        this.showInternationalPaymentPopup.set(true);
      })
    );

    this.checkUserVerification();
    this.getCurrentRoute();
    this.sideBarData();
    this.PaymentLinkCount();
    this.checkBillAutomationPlugin();
    this.isAdminLogin.set(this.localStorageService.getItem('ocw-admin'));
  }

  /**
   * @description Load the app settings.
   * This method used for white label case. Change the side bar icons based on the white label.
   */
  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
            // Update logo URL when config loads
          if (config.whiteLogo) {
            this.logoUrl = config.whiteLogo;
          }
            this.loadwhiteLabelConfig();
          }
        }
      )
    );
  }

  /**
   * @description Loads the white-label configuration based on the environment settings.
   */
  loadwhiteLabelConfig(): void {
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('hideShop')
    ) {
      this.settingsMenuLinks = this.removeMobileSidebarLinks(
        this.settingsMenuLinks,
        ['shop']
      );
      this.removeMobileNavigationSubItem(['more'], ['shop']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'hideReferAndEarn'
      )
    ) {
      this.settingsMenuLinks = this.removeMobileSidebarLinks(
        this.settingsMenuLinks,
        ['referAndEarn']
      );
      this.removeMobileNavigationSubItem(['more'], ['affiliate']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('hideViewMore')
    ) {
      this.secondsMenuSection = this.removeSidebarMenu(
        this.secondsMenuSection,
        ['business-tools'],
        ['business-tools']
      );
      this.removeMobileNavigationSubItem(['business'], ['business-tools']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isAddCreditCardRestricted'
      )
    ) {
      this.firstMenuSection = this.removeSidebarLinks(this.firstMenuSection, [
        'cards'
      ]);
      this.removeMobileNavigationSubItem(['accounts'], ['cards']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'hidePaymentTable'
      )
    ) {
      this.firstMenuSection = this.removeSidebarLinks(this.firstMenuSection, [
        'payments-table'
      ]);
      this.removeMobileNavigationSubItem(['payables'], ['payments-table']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'hideRecievables'
      )
    ) {
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['receivables']
      );
      this.removeMobileNavigationItem(['receivables']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('hideBill')
    ) {
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['bill']
      );
      this.removeMobileNavigationSubItem(['payables'], ['bill']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'hideThirdPartyApps'
      )
    ) {
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['thirdparty_app']
      );
      this.removeMobileNavigationItem(['thirdparty_app']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('hidePayroll')
    ) {
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['payroll-card']
      );
      this.removeMobileNavigationItem(['payroll-card']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'hideWorkingCaptal'
      )
    ) {
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['working-capital']
      );
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'hideIntegration'
      )
    ) {
      this.removeMobileNavigationItem(['thirdparty_app']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'subscriptionHide'
      )
    ) {
      this.settingsMenuLinks = this.removeMobileSidebarLinks(
        this.settingsMenuLinks,
        ['subscription']
      );
      this.removeMobileNavigationSubItem(['more'], ['subscription']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'hideBusinessTools'
      )
    ) {
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['businesstools']
      );
      this.removeMobileNavigationItem(['business']);
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isArcharina'
      ) || this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCSNHCRequirement'
      )
    ) {
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['international-payment','virtual-card','bank-data','marketplace']
      );
      this.removeMobileNavigationItem(['international-payment','virtual-card','bank-data','marketplace']);
    }

    if(this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('isWhitelableSidebar')){
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['international-payment','virtual-card','bank-data','marketplace']
      );
      this.removeMobileNavigationItem(['international-payment','virtual-card','bank-data','marketplace']);
    }

    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCompassRequirement'
      ) || this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCSNHCRequirement'
      )
    ) {
      this.firstMenuSection = this.removeSidebarMenu(
        this.firstMenuSection,
        ['my-accounts'],
        ['cloud-bank', 'wallets', 'cards']
      );
      this.firstMenuSection = this.firstMenuSection.map((item) => {
        if (item.id === 'payments-table') {
          return {
            ...item,
            routerLink: 'payments-table/check'
          };
        }
        return item;
      });
      this.removeMobileNavigationSubItem(
        ['accounts'],
        ['cloud-bank', 'wallets', 'cards']
      );
      this.mobileNavigationSections.update((sections) =>
        sections.map((section) => {
          if (section.id === 'payables') {
            // eslint-disable-next-line no-param-reassign
            section.links = section.links.map((link) => {
              if (link.id === 'payments-table') {
                return {
                  ...link,
                  routerLink: '/manage/payments-table/check'
                };
              }
              return link;
            });
          }
          return section;
        })
      );
      this.secondsMenuSection = this.removeSidebarLinks(
        this.secondsMenuSection,
        ['international-payment','virtual-card','bank-data','marketplace','businesstools']
      );
      this.removeMobileNavigationItem(['international-payment','virtual-card','bank-data','marketplace','business']);
    }
    if(this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('isCSNHCRequirement')){
      this.bottomSection = this.removeSidebarLinks(
        this.bottomSection,
        ['user-settings','more']
      );
    }
    this.overallDataLoading = true;
    this.subscriptions.push(
      this.userService.userOverallData.subscribe((res) => {
        if (res !== undefined) {
          this.overallDataLoading = false;
        }
        if (
          res?.cloudbankExist === 0 &&
          !this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
            'isZilBankAdShown'
          )
        ) {
          this.firstMenuSection = this.removeSidebarMenu(
            this.firstMenuSection,
            ['my-accounts'],
            ['cloud-bank']
          );
          this.removeMobileNavigationSubItem(['accounts'], ['cloud-bank']);
        }
      })
    );
  }

  removeMobileNavigationItem(item: string[]) {
    this.mobileNavigationSections.update((sections) =>
      sections.filter((section) => !item.includes(section.id))
    );
  }

  removeMobileNavigationSubItem(item: string[], subItem: string[]) {
    this.mobileNavigationSections.update((sections) =>
      sections.map((section) => {
        if (item.includes(section.id) && section.links) {
          return {
            ...section,
            links: section.links.filter((link) => !subItem.includes(link.id))
          };
        }
        return section;
      })
    );
  }

  /**
   * @description Use this for remove or splice links
   * @param {IHeaderLinks[]} object - The array of header link objects.
   * @param {string[]} removed - The array of link IDs to be removed.
   */
  removeMobileSidebarLinks(
    object: IMobileSidebarLinks[],
    removed: string[]
  ): IMobileSidebarLinks[] {
    return object.filter((item) => !removed.includes(item.id));
  }

  /**
   * @description Use this for remove or splice links in mobile side
   * @param {IHeaderLinks[]} object - The array of header link objects.
   * @param {string[]} removed - The array of link IDs to be removed.
   */
  removeSidebarLinks(
    object: IV3SidebarLinks[],
    removed: string[]
  ): IV3SidebarLinks[] {
    return object.filter((item) => !removed.includes(item.id));
  }

  removeSidebarMenu(
    object: IV3SidebarLinks[],
    removed: string[],
    subMenu: string[]
  ): IV3SidebarLinks[] {
    const sidebar = object.map((sidebarItem) => {
      const item = sidebarItem;
      if (removed.includes(item.id) && item.subItem) {
        item.subItem = item.subItem.filter(
          (menu) => !subMenu.includes(menu.id)
        );
      }
      return item;
    });
    return sidebar;
  }

  /**
   * @description Checks the user verification status and updates the `isNotVerified` property accordingly.
   *
   */
  checkUserVerification() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isNotVerified =
          res.email_verified === 0 || res.phone_verified === 0;
      })
    );
  }

  /**
   * @description Toggles the sidebar collapse state and updates the corresponding local storage value.
   */
  collapseSideBar() {
    this.sideBar = !this.sideBar;
    this.sideBarAction = this.sideBar ? 'open' : 'close';
    this.localStorageService.setItem('sideBarValues', this.sideBar);
    this.Layoutservice.setMessage(this.sideBar);
    this.expandedMenuIndex = '';
  }

  /**
   * @description Shows a toggle button in the header for opening the sidebar content as a mobile view when the screen width is less than 1300px.
   * @param {string}ids -  This id  indicating the part that is clicked in the mobile menu. Based on this id, the corresponding div is styled and the sidebar links are shown or hidden.
   */
  showMobileMenu(ids: string) {
    this.menuId = this.menuId === ids ? '' : ids;
    this.selectedMobileSidebarItem =
      this.selectedMobileSidebarItem === ids ? '' : ids;
  }

  /**
   * @description This method is used to show the profile pic and profile name in mobile menu.
   */
  sideBarData() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          const personalInfo = res.personalInfo as IPersonalInfo;
          this.personalInfo = personalInfo
            ? res.personalInfo.nickName
            : res.personalInfo?.name;
          this.profilePic = res.personalInfo.profilePicLink;
        }
      })
    );
  }

  /**
   * @description Checks the status of the mobile menu from the side bar service.
   * `this.toggleMobileMenu`- ist a boolean value, Show and hide the mobile menu side bar based on this value.
   */
  checkSideBarStatus(): void {
    this.sideBarService.getMobileMenu().subscribe((res) => {
      this.toggleMobileMenu = res;
    });
  }

  /**
   * @description Hides the mobile menus by setting the mobile menu status to false and resetting the menuId.
   */
  hideMobileMenus() {
    this.sideBarService.setMobileMenu(false);
    this.menuId = '';
  }

  /**
   * @description Toggles the expansion state of a menu item based on its index.
   * @param {number} id - The id of the menu item to toggle.
   */
  toggleExpanded(id: string) {
    this.expandedMenuIndex = this.expandedMenuIndex === id ? '' : id;
  }

  /**
   * @description Handles the click event on the settings menu items.
   * @param {string} clickedPage - The page identifier of the clicked menu item.
   * @param {IMobileSidebarLinks} items - The menu item object containing additional information.
   *
   */
  onSettingsMenuClick(clickedPage: string | undefined) {
    this.hideMobileMenus();
    this.showMoreMenus = false;
    this.showWebTabMenus = false;

    /**
     * Performs different actions based on the clickedPage value.
     */
    switch (clickedPage) {
      case 'newCategory':
        this.openAddCategoryModal();
        break;
      case 'openCalculator':
        this.openCalculator();
        break;
      default:
    }
  }

  /**
   * @description Open the Add category modal.
   */
  openAddCategoryModal(): void {
    this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });
  }

  /**
   * @description Opens the calculator Component.
   */
  openCalculator(): void {
    this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%'
    });
  }

  /**
   * @description Performs the logout action by calling the Logout method of the AuthService.
   */
  onLogout() {
    this.authService.Logout();
  }

  /**
   * @description Navigates to the specified route based on the selected sidebar item and index.
   * @param {IV3SidebarLinks | null} item - The selected sidebar item.
   * @param {number} index - The index of the sub-item if applicable.
   */
  navigate(item: IV3SidebarLinks | null, index: number): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: !!( item && item.id === 'virtual-card'),
      animation: false
    });
    if (!item) return;

    // const baseRoute = 'manage';

    if (item.id === 'virtual-card') {
      this.sideBarService.clickOnVirtualCard.next(true);
    }

    if (item.id === 'international-payment') {
      this.clickTrackingService.trackInternationalPaymentClick().pipe(take(1)).subscribe();
    }


    const baseRoute =
      item.isNotV3 || (item.subItem && item.subItem[index]?.isNotV3)
        ? 'manage'
        : 'v3/manage';
    const route = item.subItem?.[index]?.routerLink || item.routerLink;

    if (route) {
      this.router.navigateByUrl(`${baseRoute}/${route}`);

      this.selectedItem = item.subItem?.[index]?.id || item.id || '';
    }
  }

  /**
   * @description Toggles the visibility of the "More" menu.
   */
  showMoreMenu() {
    this.showWebTabMenus = false;
    this.showMoreMenus = !this.showMoreMenus;
  }

  /**
   * @description Gets the current route URL and selects the corresponding tab/menu.
   */
  getCurrentRoute(): void {
    const { url }: { url: string } = this.router;
    this.selectCurrentTab(url);
    this.headerService.getRouterEvents();
    this.subscriptions.push(
      this.headerService.routerEvents.subscribe((event) => {
        const { url: eventUrl } = event;
        this.clearFilterData(eventUrl);
        this.selectCurrentTab(eventUrl);
      })
    );
  }

  /**
   * @description Selects the corresponding tab/menu based on the given URL.
   * @param {string} url - The current URL of the router.
   */
  selectCurrentTab(url: string): void {
    // Payment view lives under payments-table; keep International Payment selected when opened from there
    const { backUrl } = (window.history.state ?? {}) as { backUrl?: string };
    if (
      url.includes('payments-table/payment-view') &&
      backUrl?.startsWith('/manage/international-payment')
    ) {
      this.selectedItem = 'international-payment';
      this.selectedMobileSidebarItem = 'international-payment';
      return;
    }

    const findInSection = (section: IV3SidebarLinks[]) =>
      section.find((item) => {
        const mainUrl = url.split('?')[0];
        if (mainUrl.includes('add-bank')) {
          return item?.id === 'bank-accounts';
        }
        
        // For items with subitems, only match if it's the exact route, not a subitem route
        if (item.isDropdown && item.subItem) {
          return item.routerLink && mainUrl === `manage/${item.routerLink}`;
        }
        
        return (
          (item.routerLink && mainUrl.includes(item.routerLink)) ||
          (item?.id && mainUrl.includes(item.id) && mainUrl.split('/').includes(item.id))
        );
      });

    const isExistInTop = findInSection(this.firstMenuSection);
    const isExistInMiddle = findInSection(this.secondsMenuSection);

    if (isExistInTop || isExistInMiddle) {
      this.selectedItem = isExistInTop?.id || isExistInMiddle?.id || '';
      this.selectedMobileSidebarItem =
        isExistInTop?.id || isExistInMiddle?.id || '';
      return;
    }

    const findInSubItem = (section: IV3SidebarLinks[]) => {
      let subItem: IV3SidebarLinks | undefined;
      section.forEach((item) => {
        if (item.subItem) {
          const foundSubItem = findInSection(item.subItem);
          if (foundSubItem) {
            subItem = foundSubItem;
          }
        }
      });
      return subItem;
    };

    const findInMobileSidebar = (section: IMobileSidebarLinks[]) =>
      section.find(
        (item) =>
          url.includes(item?.id) ||
          (item.routerLink && url.includes(item.routerLink))
      );

    const firstSubItem = findInSubItem(this.firstMenuSection);
    const secondSubItem = findInSubItem(this.secondsMenuSection);

    if (firstSubItem || secondSubItem) {
      this.selectedItem = firstSubItem?.id || secondSubItem?.id || '';
      this.selectedMobileSidebarItem =
        firstSubItem?.id || secondSubItem?.id || '';
      return;
    }

    const isExistInBottom = findInSection(this.bottomSection);
    const isExistInMore = findInMobileSidebar(this.settingsMenuLinks);
    this.selectedItem = isExistInBottom?.id || '';
    this.selectedMobileSidebarItem =
      isExistInBottom?.id || isExistInMore?.id || '';
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByFunction(index: number, item: IV3SidebarLinks | IMobileSidebarLinks) {
    return item.id;
  }

  /**
   * @description Specillay cretaed for Payemnts table.
   * Clears selected filter values from the header field of the Payments table based on the current URL.
   *
   * If the current URL does not match any of these page URLs, it invokes
   * the clearStoredData method of the v3DataTable to clear selected filter values.
   *
   * @param {string} currentUrl - The current URL of the application.
   */
  clearFilterData(currentUrl: string) {
    const pageUrls = [
      'payments-table/payment-view',
      '/manage/cheque/view',
      '/manage/payments-table/index'
    ];

    if (!pageUrls.some((url) => currentUrl.includes(url))) {
      this.v3DataTable.clearStoredData();
    }
  }

  /**
   * @description Method to get the count of the paymentLinkCount
   */
  PaymentLinkCount() {
    this.subscriptions.push(
      this.requestPaymentService.getCountOfpaymentLink().subscribe((res) => {
        this.paymentLinkcount = res.data.count;
      })
    );
  }

  isMenuSelected(section: IMobileNavSection): boolean {
    return (
      section.links.some(
        (link) => link.id === this.selectedMobileSidebarItem
      ) || this.selectedMobileSidebarItem === section.id
    );
  }

  getCaretIcon(section: IMobileNavSection): string {
    return this.isMenuSelected(section) ? 'caret-up' : 'caret-down';
  }

  /**
   * @description Check if bill-automation plugin is enabled and modify bills sidebar accordingly
   */
  checkBillAutomationPlugin(): void {

    const isBillAutomationEnabled =this.localStorageService.getItem('userPlugins')?.includes('bill-automation');
    if (isBillAutomationEnabled) {
      this.disableBillsNestedRoutes();
    }

  }

  /**
   * @description Disable bills nested routes and show only bill/index as main route
   */
  private disableBillsNestedRoutes(): void {
    this.secondsMenuSection = this.secondsMenuSection.map((item: IV3SidebarLinks) => {
      if (item.id === 'bill') {
        return {
          ...item,
          isDropdown: true,
          subItem: [
            {
              tooltip: 'Bills',
              title: 'Bills',
              id: 'bill-to-pay',
              icon: 'file-invoice',
              routerLink: 'bill/index',
              isNotV3: true
            },
            {
              tooltip: 'Inoice Inbox',
              title: 'Inbox',
              id: 'invoice-inbox',
              icon: 'envelope',
              routerLink: 'bill/inbox',
              isNotV3: true
            },
          ],
          isNotV3: true
        };
      }
      return item;
    });
  }



  /**
   * @description Hide international payment popup
   */
  hideInternationalPaymentPopup(): void {
    this.showInternationalPaymentPopup.set(false);
    this.localStorageService.setItem('hasSeenInternationalPaymentInfo', true);
  }

  /**
   * @description Check if popup should be shown
   */
  private shouldShowPopup(): boolean {
    const showInternationalPaymentModal = this.localStorageService.getItem('showInternationalPaymentModal');
    return !!this.localStorageService.appToken && Number(showInternationalPaymentModal) === 1 && !this.localStorageService.getItem('hasSeenInternationalPaymentInfo') && !this.showInternationalPaymentPopup();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
  }

}

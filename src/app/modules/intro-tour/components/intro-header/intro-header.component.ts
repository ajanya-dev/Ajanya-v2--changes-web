import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject
} from '@angular/core';
import { MainHeader } from 'src/app/data/data/menu/header/MainHeader';
import {
  IAllCompanies,
  IHeaderData,
  IHeaderLinks,
  INotificationDetails
} from 'src/app/layout/model/header';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { IUserVerification } from 'src/app/models/user';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { SideBarService } from 'src/app/layout/side-bar/side-bar.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonHelpButtonComponent } from 'src/app/layout/v3-layout/common-help-button/common-help-button.component';
import { HeaderCompanyDropDownListComponent } from 'src/app/layout/sub-components/header-company-drop-down-list/header-company-drop-down-list.component';
import {
  allCompanies,
  dynamicHeaderOverallData,
  headerNotificationData
} from '../intro-modelData';

@Component({
  selector: 'app-intro-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatMenuModule,
    MatTooltipModule,
    CommonHelpButtonComponent,
    HeaderCompanyDropDownListComponent
  ],
  templateUrl: './intro-header.component.html',
  styleUrl: './intro-header.component.scss'
})
export class IntroHeaderComponent implements AfterViewInit {
  selectedCompanyId: string;
  isHidden: boolean;
  animation: boolean;

  /* Injecting dependencies using inject method */
  private sideBarService = inject(SideBarService);
  private themeService = inject(ThemeService);
  public gettingStartedService = inject(GettingStartedService);
  public v3BulkPaymentService = inject(V3BulkPaymentService);
  public layoutService = inject(LayoutService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  /* Variables */
  isQuickNavigationMenuShown = false;
  quickNavigationMenu: IHeaderLinks[] = MainHeader.headerDropdownLink();
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  allCompanies: IAllCompanies = allCompanies;
  userEmail: string = 'intro@gmail.com';
  personalInfo: IHeaderData['personalInfo'];
  notificationCount: 99;
  notifications: INotificationDetails[] = headerNotificationData;
  overallDataLoading: boolean = false;
  isCreditPath = false;
  isWalletPath = false;
  isBankAccountPath = false;
  isAddBankAccountPath = false;
  isCloudPath = false;
  isCreditCardPath = false;
  mailCreditBalance = '0000';
  isSubscribed: number;
  isUserVerified: IUserVerification;
  mobileMenu = false;
  isDarkMode = false;
  showStatus = false;
  isQuickAccessOpenedJustNow = false;
  activeComapanyLogo =
    'https://ocw-local-s3.s3.amazonaws.com/business/65c8f574-a579-4da7-91c0-a303b84a4d5c.jpg';

  kycKybStatus: { kycStatus: number | null; kybStatus: number | null } = {
    kycStatus: 2,
    kybStatus: 2
  };

  overallData: {
    bankAcc: number;
    walletBalance: string;
    cloudBalance: string;
    creditCards: number;
    cloudBankExist: number;
  } = dynamicHeaderOverallData;

  /**
   * @description - To catch global click event to close quick access menu
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
    }
  }

  /**
   * @description Shows a toggle button in the header for opening the sidebar content as a mobile view when the screen width is less than 1300px.
   */
  showMobileMenus() {
    this.mobileMenu = true;
    this.sideBarService.setMobileMenu(this.mobileMenu);
  }

  /**
   * setting theme from ag-init
   */
  ngAfterViewInit() {
    this.themeService.initTheme();
    this.isDarkMode = this.themeService.getInitialColourTheme();
    this.changeDetectorRef.detectChanges();
  }

  /**
   * for track the for loop
   */
  trackByFunction(_: number, item: INotificationDetails | IHeaderLinks) {
    return item.id;
  }

  /**
   * To handle navigation from dynamic header
   */
  navigateToUrl(url: string) {}

  /**
   * To open the quick access tab
   */
  onCreateNew(): void {
    this.isQuickNavigationMenuShown = !this.isQuickNavigationMenuShown;
    this.isQuickAccessOpenedJustNow = true;
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
}

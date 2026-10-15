import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IMobileSidebarLinks,
  IV3SidebarLinks,
  V3SideBar
} from 'src/app/data/data/menu/v3-sidebar/v35-sidebar/v35-sidebar';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { MatDialog } from '@angular/material/dialog';
import { IAppConfig } from 'src/app/models/app_settings';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { EnvironmentId } from 'src/app/models/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { SideBarService } from 'src/app/layout/side-bar/side-bar.service';
import { Router } from '@angular/router';
import { configObject } from '../intro-modelData';

@Component({
  standalone: true,
  selector: 'app-intro-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FontAwesomeModule, MatMenuModule],
  templateUrl: './intro-sidebar.component.html',
  styleUrl: './intro-sidebar.component.scss'
})
export class IntroSidebarComponent implements OnInit, OnDestroy {
  sideBarAction = '';
  selectedItem = 'home';
  sideBar = false;

  private sideBarService = inject(SideBarService);
  public dialog = inject(MatDialog);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private router = inject(Router);
  isMobileView = signal<boolean>(false);

  firstMenuSection: IV3SidebarLinks[] = V3SideBar.firstMenuSection();
  secondsMenuSection: IV3SidebarLinks[] = V3SideBar.secondMenuSection();
  bottomSection: IV3SidebarLinks[] = V3SideBar.bottomMenuSection();
  paybleLinks: IMobileSidebarLinks[] = V3SideBar.v3payableLinks();
  receivableLinks: IMobileSidebarLinks[] = V3SideBar.receivableLinks();
  accountsLinks: IMobileSidebarLinks[] = V3SideBar.v3AccountsLink();
  businessLinks: IMobileSidebarLinks[] = V3SideBar.businessLinks();
  integrationLinks: IMobileSidebarLinks[] = V3SideBar.integrationLinks();
  settingsLinks: IMobileSidebarLinks[] = V3SideBar.settingsLinks();
  settingsMenuLinks: IMobileSidebarLinks[] = V3SideBar.v3SettingsMenuList();
  selectedEnvironmentId: EnvironmentId =
    this.dynamicWhiteLabelService.localStorageGlobalEnvironmentId;

  subscriptions: Subscription[] = [];
  menuId = '';
  personalInfo: string;
  profilePic: string;
  mobileMaxHeight: string;
  whiteLabelConfig = StaticWhiteLabelConditions;
  sideBarStatus = false;
  supportNo = '(408) 775-7720';

  showMoreMenus = false;
  showWebTabMenus = false;
  expandedMenuIndex: string = '';

  paymentLinkcount: 26;
  appConfig: IAppConfig = configObject;

  ngOnInit(): void {
    this.hideMobileMenus();
  }

  /**
   * @description Shows a toggle button in the header for opening the sidebar content as a mobile view when the screen width is less than 1300px.
   * @param {string}ids -  This id  indicating the part that is clicked in the mobile menu. Based on this id, the corresponding div is styled and the sidebar links are shown or hidden.
   */
  showMobileMenu(ids: string) {
    this.menuId = this.menuId === ids ? '' : ids;
  }

  hideMobileMenus() {
    this.sideBarService.setMobileMenu(false);
    this.menuId = '';
  }

  toggleExpanded(id: string) {
    this.expandedMenuIndex = this.expandedMenuIndex === id ? '' : id;
  }

  onSettingsMenuClick() {}

  openCalculator(): void {
    this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%'
    });
  }

  navigate(item: IV3SidebarLinks | null, index: number): void {
    if (item && item.title === 'Payees') {
      this.router.navigate(['/intro-tour/manage/payees']);
    } else if (item && item.title === 'Home Page') {
      this.router.navigate(['/intro-tour/manage/home']);
    } else if (
      item &&
      item.title === 'My Accounts' &&
      item.id === 'my-accounts'
    ) {
      this.router.navigate(['/intro-tour/manage/bank-accounts']);
    }
    this.selectedItem = item?.id as string;
  }

  showMoreMenu() {
    this.showWebTabMenus = false;
    this.showMoreMenus = !this.showMoreMenus;
  }

  trackByFunction(index: number, item: IV3SidebarLinks | IMobileSidebarLinks) {
    return item.id;
  }

  collapseSideBar() {
    this.sideBar = !this.sideBar;
    this.sideBarAction = this.sideBar ? 'open' : 'close';
    this.expandedMenuIndex = '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el?.unsubscribe();
    });
  }
}

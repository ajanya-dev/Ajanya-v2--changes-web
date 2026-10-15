import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { SideBarService } from '../../side-bar/side-bar.service';
import { IHeaderData } from '../../model/header';

interface ICsnhcMenuItem {
  title: string;
  icon: IconName;
  id: string;
  routerLink: string;
  tooltip: string;
  image?: string;
}

@Component({
  selector: 'app-side-bar-csnhc',
  templateUrl: './side-bar-csnhc.component.html',
  styleUrls: ['./side-bar-csnhc.component.scss'],
  standalone: true,
  imports: [NgClass, RouterLink, FaIconComponent, MatTooltip]
})
export class SideBarCsnhcComponent implements OnInit, OnDestroy {
  private sideBarService = inject(SideBarService);
  private authService = inject(AuthService);
  public headerService = inject(HeaderService);
  private layoutService = inject(LayoutService);
  private localStorageService = inject(LocalStorageService);
  private appSettingService = inject(AppSettingsService);
  private router = inject(Router);

  subscriptions: Subscription[] = [];
  sideBarCollapsed = true;
  sideBarAction = '';
  toggleMobileMenu = false;
  selectedItem = '';
  appConfig: IAppConfig;
  allMenuItems: ICsnhcMenuItem[] = [];

  menuItems: ICsnhcMenuItem[] = [
    {
      title: 'Home Page',
      icon: 'house',
      id: 'home',
      routerLink: 'home',
      tooltip: 'Home'
    },
    {
      title: 'Bank Account',
      icon: 'building-columns',
      id: 'bank-accounts',
      routerLink: 'bank-accounts/index',
      tooltip: 'Bank Account'
    },
    {
      title: 'Payees',
      icon: 'address-book',
      id: 'payees',
      routerLink: 'payees',
      tooltip: 'Payees'
    },
    {
      title: 'Payments',
      icon: 'dollar-sign',
      id: 'payments-table',
      routerLink: 'payments-table/index',
      tooltip: 'Payments'
    },
    {
      title: 'Users',
      icon: 'user',
      id: 'manage-users',
      routerLink: 'manage-users/index',
      tooltip: 'Users'
    },
    {
      title: 'Dayforce',
      icon: 'user',
      id: 'dayforce',
      routerLink: 'thirdparty_app/dayforce',
      tooltip: 'Dayforce',
      image: 'assets/images/integration/dayforce-icon.svg'
    },
    {
      title: 'Reprint Requests',
      icon: 'file-pen',
      id: 'reprinted-requests',
      routerLink: 'cheque/reprinted-requests',
      tooltip: 'Reprint Requests'
    }
  ];

  ngOnInit(): void {
    this.allMenuItems = [...this.menuItems];
    this.checkItsUserLoggedIn();
    this.loadAppSettings();
    this.checkSideBarStatus();
    this.sideBarCollapsed = this.localStorageService.getItem('sideBarValues');
    this.layoutService.setMessage(
      this.localStorageService.getItem('sideBarValues')
    );
    // this.getCurrentRoute();
    this.hideMobileMenus();
  }

  checkItsUserLoggedIn() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        if (isUser) {
          const hiddenIds = ['manage-users', 'bank-accounts', 'dayforce','payees','reprinted-requests'];
          this.menuItems = this.menuItems.filter(item => !hiddenIds.includes(item.id));
        }else {
          this.checkItsParentCompany(res as unknown as IHeaderData);
        }
        if(res){
          setTimeout(() => {
            this.getCurrentRoute();
          }, 1000);
        }
      })
    );
  }

  checkItsParentCompany(headerData: IHeaderData): void {
    if(headerData){
      const {activeCompanyName} = headerData.allCompanies;
      const {ownCompanies} = headerData.allCompanies;
      const isParentCompany = ownCompanies.find(company => company.companyName === activeCompanyName)?.isItDefault === 1;
      if(isParentCompany){
        this.menuItems = [...this.allMenuItems];
      }else {
        this.menuItems = this.menuItems.filter(item => item.id !== 'reprinted-requests');
      }
    }
  }


  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }

  collapseSideBar(): void {
    this.sideBarCollapsed = !this.sideBarCollapsed;
    this.sideBarAction = this.sideBarCollapsed ? 'open' : 'close';
    this.localStorageService.setItem('sideBarValues', this.sideBarCollapsed);
    this.layoutService.setMessage(this.sideBarCollapsed);
  }

  checkSideBarStatus(): void {
    this.subscriptions.push(
      this.sideBarService.getMobileMenu().subscribe((res) => {
        this.toggleMobileMenu = res;
      })
    );
  }

  hideMobileMenus(): void {
    this.sideBarService.setMobileMenu(false);
  }

  navigate(item: ICsnhcMenuItem): void {
    this.router.navigateByUrl(`manage/${item.routerLink}`);
    this.selectedItem = item.id;
    this.hideMobileMenus();
  }

  getCurrentRoute(): void {
    const { url } = this.router;
    this.selectCurrentTab(url);
    this.headerService.getRouterEvents();
    this.subscriptions.push(
      this.headerService.routerEvents.subscribe((event) => {
        this.selectCurrentTab(event.url);
      })
    );
  }

  selectCurrentTab(url: string): void {
    const mainUrl = url.split('?')[0];
    if (mainUrl.includes('add-bank')) {
      this.selectedItem = 'bank-accounts';
      return;
    }
    const found = this.menuItems.find(
      (item) =>
        (item.routerLink && mainUrl.includes(item.routerLink)) ||
        (item.id &&
          mainUrl.includes(item.id) &&
          mainUrl.split('/').includes(item.id))
    );
    this.selectedItem = found?.id || '';
  }

  onLogout(): void {
    this.authService.Logout();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }
}

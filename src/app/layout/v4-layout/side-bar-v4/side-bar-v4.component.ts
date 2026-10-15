import {
  Component,
  DestroyRef,
  HostBinding,
  OnInit,
  OnDestroy,
  effect,
  inject,
  signal,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { VerificationRequiredModalComponent } from 'src/app/shared/modal/verification-required-modal/verification-required-modal.component';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  IV4MenuItem,
  IV4MenuSection,
  V4SideBar
} from 'src/app/data/data/menu/v4-sidebar/v4-sidebar';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IDynamicWhiteLabelFlags } from 'src/app/modules/dynamic-white-label/model/dynamic-white-label.model';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { faUserSecret } from '@fortawesome/pro-solid-svg-icons';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { v4LucideIconsMap } from '../lucide-v4-icons';
import { V4SidebarService } from '../services/v4-sidebar.service';
import { V4ContactSupportModalComponent } from 'src/app/shared/modal/v4-contact-support-modal/v4-contact-support-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-side-bar-v4',
  templateUrl: './side-bar-v4.component.html',
  styleUrls: ['./side-bar-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    NgOptimizedImage
  ]
})
export class SideBarV4Component implements OnInit, OnDestroy {
  /** Lucide icons by kebab-case name for [img] binding (direct import, no provider) */
  readonly icons = v4LucideIconsMap;

  @HostBinding('class') hostClass =
    'font-peridot tracking-[-0.011em] overflow-visible';

  @HostBinding('style') hostStyle = 'font-feature-settings: "rlig" 1, "calt" 1';

  v4SidebarService = inject(V4SidebarService);
  private router = inject(Router);
  private headerService = inject(HeaderService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private localStorageService = inject(LocalStorageService);
  private appSettingService = inject(AppSettingsService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private themeService = inject(ThemeService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private v3DataTableService = inject(V3DataTableService);

  subscriptions: Subscription[] = [];
  rawMenuSections = signal<IV4MenuSection[]>(V4SideBar.menuSections());
  selectedItemId = signal<string>('');
  selectedSectionCategory = signal<string>('');
  private lightLogoUrl = signal<string>('/assets/main/app_logo.svg');
  private darkLogoUrl = signal<string>(
    '/assets/main/app_logo_white.svg'
  );

  isDarkMode = signal(false);
  logoUrl = computed(() =>
    this.isDarkMode() ? this.darkLogoUrl() : this.lightLogoUrl()
  );
  collapsedLogoUrl = computed(() =>
    this.isDarkMode()
      ? '/assets/icon/zil-wing-white.png'
      : '/assets/icon/zil-wing-green.png'
  );

  appConfig: IAppConfig;
  isAdminLogin = signal(false);
  faUserSecret = faUserSecret;

  /** ID of the item currently being hovered (desktop expanded mode) */
  // hoveredItemId = signal<string | null>(null); // COMMENTED OUT - home/favorite feature disabled
  hoveredItemId = signal<string | null>(null); // kept for template compatibility but unused

  isCollapsed = computed(() => this.v4SidebarService.isCollapsed());
  isMobileOpen = computed(() => this.v4SidebarService.isMobileOpen());

  /**
   * Computed menu sections - favorites/home logic commented out.
   * (Was: buildMainFromFavorites(raw) using favorites/home.)
   */
  menuSections = computed(() => this.rawMenuSections());
  // COMMENTED OUT - home/favorite feature disabled
  // const raw = this.rawMenuSections();
  // this.v4SidebarService.favorites();
  // this.v4SidebarService.homePage();
  // return this.v4SidebarService.buildMainFromFavorites(raw);

  /**
   * Effect registered at construction time (not tied to any lifecycle hook).
   * Re-renders the sidebar whenever `companySwitched()` flips to true,
   * then resets the signal so the next switch fires this effect again.
   */
  constructor() {
    effect(() => {
      if (!this.v4SidebarService.companySwitched()) return;
      this.rebuildMenu();
      queueMicrotask(() => this.v4SidebarService.setCompanySwitched(false));
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.themeService
      .getThemeSwitch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dark) => this.isDarkMode.set(dark));

    this.loadAppSettings();
    this.loadWhiteLabelConfig();
    this.getCurrentRoute();
    this.isAdminLogin.set(this.localStorageService.getItem('ocw-admin'));
    this.checkHeaderData();
  }

  private rebuildMenu(): void {
    this.checkHeaderData();
  }

  checkHeaderData(): void {
    this.subscriptions.push(
      this.headerService.isLoggedInAsClient.subscribe((res) => {
        if(res){
          this.rawMenuSections.update((sections) =>
            this.removeItemFromSection(sections, 'MAIN', ['verification'])
          );
        }else{
          this.rawMenuSections.set(V4SideBar.menuSections());
        }
      })
    );
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
            this.lightLogoUrl.set(
              config.websiteLogo ||
                config.zilMoneyLogo ||
                'assets/main/app_logo.svg'
            );
          }
        }
      )
    );
  }

  loadWhiteLabelConfig(): void {
    const checker = (flag: keyof IDynamicWhiteLabelFlags) =>
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(flag);

    this.rawMenuSections.update((sections) => {
      let updated = [...sections.map((s) => ({ ...s, items: [...s.items] }))];

      if (checker('hidePaymentTable')) {
        updated = this.removeItemFromSection(updated, 'PAYABLES', [
          'payments-out'
        ]);
      }
      if (checker('hideRecievables')) {
        updated = updated.filter((s) => s.category !== 'RECEIVABLES');
      }
      if (checker('hideBill')) {
        updated = this.removeItemFromSection(updated, 'PAYABLES', [
          'bill',
          'bill-inbox'
        ]);
      }
      if (checker('hideThirdPartyApps')) {
        updated = this.removeItemFromSection(updated, 'SERVICES', [
          'thirdparty_app'
        ]);
      }
      if (checker('hidePayroll')) {
        updated = this.removeItemFromSection(updated, 'PAYABLES', [
          'payroll-card'
        ]);
      }
      if (checker('hideBusinessTools')) {
        updated = updated.filter((s) => s.category !== 'BUSINESS TOOLS');
      }
      if (checker('hideViewMore')) {
        updated = this.removeItemFromSection(updated, 'BUSINESS TOOLS', [
          'business-tools'
        ]);
      }
      if (checker('isAddCreditCardRestricted')) {
        updated = this.removeItemFromSection(updated, 'ACCOUNTS', ['cards']);
      }
      if (checker('isArcharina') || checker('isCSNHCRequirement')) {
        updated = this.removeItemFromSection(updated, 'SERVICES', [
          'international-payment',
          'virtual-card',
          'marketplace'
        ]);
        updated = this.removeItemFromSection(updated, 'ACCOUNTS', [
          'bank-data'
        ]);
      }
      if (checker('isWhitelableSidebar')) {
        updated = this.removeItemFromSection(updated, 'SERVICES', [
          'international-payment',
          'virtual-card',
          'marketplace'
        ]);
        updated = this.removeItemFromSection(updated, 'ACCOUNTS', [
          'bank-data'
        ]);
      }
      if (checker('isCompassRequirement') || checker('isCSNHCRequirement')) {
        updated = this.removeItemFromSection(updated, 'ACCOUNTS', [
          'cloud-bank',
          'wallets',
          'cards'
        ]);
        updated = this.removeItemFromSection(updated, 'SERVICES', [
          'international-payment',
          'virtual-card',
          'marketplace'
        ]);
        updated = this.removeItemFromSection(updated, 'ACCOUNTS', [
          'bank-data'
        ]);
      }
      if (checker('isCSNHCRequirement')) {
        updated = this.removeItemFromSection(updated, 'SETTINGS', [
          'user-settings'
        ]);
      }

      return updated;
    });
  }

  private removeItemFromSection(
    sections: IV4MenuSection[],
    category: string,
    itemIds: string[]
  ): IV4MenuSection[] {
    return sections.map((section) => {
      if (section.category === category) {
        return {
          ...section,
          items: section.items.filter((item) => !itemIds.includes(item.id))
        };
      }
      return section;
    });
  }

  getCurrentRoute(): void {
    const { url } = this.router;
    this.selectCurrentTab(url);
    this.headerService.getRouterEvents();
    this.subscriptions.push(
      this.headerService.routerEvents.subscribe((event) => {
        const { url: eventUrl } = event;
        this.selectCurrentTab(eventUrl);
      })
    );
  }

  selectCurrentTab(url: string): void {
    const [mainUrl, queryString] = url.split('?');
    const urlParams = new URLSearchParams(queryString || '');
    const sections = this.menuSections();
    const pairs = sections.flatMap((section) =>
      section.items.map((item) => ({ item, section }))
    );
    const best = pairs.reduce<{
      foundId: string;
      foundCategory: string;
      longestMatch: number;
    }>(
      (acc, { item: i, section }) => {
        const isSpecialBank =
          mainUrl.includes('add-bank') && i.id === 'bank-accounts';
        const routerLinkMatch = i.routerLink && mainUrl.includes(i.routerLink);
        const idMatch =
          i.id && mainUrl.includes(i.id) && mainUrl.split('/').includes(i.id);

        if (!(isSpecialBank || routerLinkMatch || idMatch)) return acc;

        // Query params matching: items with queryParams must match URL params,
        // items without queryParams only match when URL has no query params
        if (i.queryParams) {
          const paramsMatch = Object.entries(i.queryParams).every(
            ([key, value]) => urlParams.get(key) === value
          );
          if (!paramsMatch) return acc;
        } else if (urlParams.toString()) {
          return acc;
        }

        const matchLength = routerLinkMatch
          ? (i.routerLink?.length ?? 0)
          : (i.id?.length ?? 0);
        if (matchLength > acc.longestMatch) {
          return {
            foundId: i.id ?? '',
            foundCategory: section.category,
            longestMatch: matchLength
          };
        }
        return acc;
      },
      { foundId: '', foundCategory: '', longestMatch: 0 }
    );
    this.selectedItemId.set(best.foundId);
    // Check if the URL matches a section's own routerLink (e.g. payables/receivables dashboard)
    const matchedSection = sections.find(
      (s) => s.routerLink && mainUrl.includes(s.routerLink)
    );
    if (matchedSection && !best.foundId) {
      this.selectedSectionCategory.set(matchedSection.category);
    } else {
      this.selectedSectionCategory.set('');
    }
    if (best.foundCategory && best.foundCategory !== 'MAIN') {
      this.v4SidebarService.expandSection(best.foundCategory);
    }
  }

  navigate(item: IV4MenuItem): void {
    this.v4SidebarService.closeMobile();

    if (item.action) {
      this.handleAction(item.action);
      return;
    }

    if (item.id === 'international-payment') {
      const phoneVerified = this.localStorageService.getItem('phoneVerified');
      const emailVerified = this.localStorageService.getItem('emailVerified');
      if (phoneVerified === 0 || emailVerified === 0) {
        this.dialog.open(VerificationRequiredModalComponent, {
          width: '400px',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: {
            description:
              'You need to verify your email and phone number to access international payments.'
          }
        });
        return;
      }
    }

    if (item.id === this.selectedItemId()) {
      this.v3DataTableService.resetToDefaultView$.next();
    }

    this.selectedItemId.set(item.id);
    this.selectedSectionCategory.set('');

    if (item.routerLink) {
      const path = `/v4/manage/${item.routerLink}`;
      this.router.navigate([path], {
        queryParams: item.queryParams || {}
      });
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'send-payment':
        this.paymentsV4Service.openSendModal();
        break;
      case 'receive-payment':
        this.paymentsV4Service.openReceiveModal();
        break;
      default:
        break;
    }
  }

  toggleCollapse(): void {
    this.v4SidebarService.toggleCollapse();
  }

  toggleSection(category: string): void {
    this.v4SidebarService.toggleSection(category);
  }

  onSectionHeaderClick(section: IV4MenuSection): void {
    this.toggleSection(section.category);
    if (section.routerLink) {
      this.navigateToSection(section);
    }
  }

  /** Keyboard activation for section header (div with role="button"). */
  onSectionHeaderKeydown(event: KeyboardEvent, section: IV4MenuSection): void {
    if (section.category === 'MAIN') {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
    }
    this.onSectionHeaderClick(section);
  }

  navigateToSection(section: IV4MenuSection): void {
    if (section.routerLink) {
      this.selectedItemId.set('');
      this.selectedSectionCategory.set(section.category);
      this.v4SidebarService.closeMobile();
      this.router.navigate([`/v4/manage/${section.routerLink}`]);
    }
  }

  isSectionExpanded(category: string): boolean {
    return this.v4SidebarService.isSectionExpanded(category);
  }

  openMobile(): void {
    this.v4SidebarService.openMobile();
  }

  closeMobile(): void {
    this.v4SidebarService.closeMobile();
  }

  onMobileSendPayment(): void {
    this.closeMobile();
    setTimeout(() => this.paymentsV4Service.openSendModal(), 300);
  }

  onMobileReceivePayment(): void {
    this.closeMobile();
    setTimeout(() => this.paymentsV4Service.openReceiveModal(), 300);
  }

  // ── Hover tracking - COMMENTED OUT (home/favorite feature disabled) ──

  // onItemHover(itemId: string): void {
  //   this.hoveredItemId.set(itemId);
  // }

  // onItemLeave(): void {
  //   this.hoveredItemId.set(null);
  // }

  // ── Favorites - COMMENTED OUT (home/favorite feature disabled) ──

  // isFavorited(itemName: string): boolean {
  //   return this.v4SidebarService.isFavorited(itemName);
  // }

  // toggleFavorite(event: Event, itemName: string): void {
  //   event.stopPropagation();
  //   this.v4SidebarService.toggleFavorite(itemName);
  // }

  // ── Home page - COMMENTED OUT (home/favorite feature disabled) ──

  // isHomePage(routerLink: string | undefined): boolean {
  //   return this.v4SidebarService.isHomePage(routerLink);
  // }

  // setHomePage(event: Event, routerLink: string): void {
  //   event.stopPropagation();
  //   this.v4SidebarService.setHomePage(routerLink);
  // }

  onContactSupport(): void {
    this.dialog.open(V4ContactSupportModalComponent, {
      width: '540px',
      maxWidth: '95%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        title: 'Contact Support',
        subtitle: "Choose how you'd like to reach our support team.",
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub?.unsubscribe());
  }
}

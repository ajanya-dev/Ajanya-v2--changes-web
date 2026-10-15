import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  LucideAngularModule,
  Search,
  CircleCheck,
  Layers,
  SlidersHorizontal
} from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';
import { odooConnectedOverride } from '../../odoo/odoo-connection-state';
import {
  IntegrationOAuthCallbackService,
  IOAuthCallbackResult
} from 'src/app/shared/service/integration/integration-oauth-callback.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { V4ContactSupportModalComponent } from 'src/app/shared/modal/v4-contact-support-modal/v4-contact-support-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4IntegrationPanelComponent } from '../v4-integration-panel/v4-integration-panel.component';
import { V4ConnectNetsuiteModalComponent } from '../../netsuite/modals/v4-connect-netsuite-modal/v4-connect-netsuite-modal.component';
import { V4ConnectOdooModalComponent } from '../../odoo/modals/v4-connect-odoo-modal/v4-connect-odoo-modal.component';
import { V4ShopifyDomainModalComponent } from '../../shopify/modals/v4-shopify-domain-modal/v4-shopify-domain-modal.component';
import { V4IntegrationRequestOptionsModalComponent } from '../../modals/v4-integration-request-options-modal/v4-integration-request-options-modal.component';
import {
  IV4IntegrationApp,
  V4IntegrationCategory,
  V4_CATEGORIES,
  getV4IntegrationApps,
  getCategoryBgColor
} from '../../data/v4-integration-data';

@Component({
  selector: 'app-v4-integration-main',
  templateUrl: './v4-integration-main.component.html',
  styleUrls: ['./v4-integration-main.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgOptimizedImage,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonTabV4Component,
    V4IntegrationPanelComponent
  ]
})
export class V4IntegrationMainComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private odooService = inject(OdooService);
  private oauthCallbackService = inject(IntegrationOAuthCallbackService);
  private headerService = inject(HeaderService);
  private alertService = inject(V4AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Lucide icons
  readonly searchIcon = Search;
  readonly circleCheckIcon = CircleCheck;
  readonly layersIcon = Layers;
  readonly slidersIcon = SlidersHorizontal;

  // Categories
  readonly categories = V4_CATEGORIES;

  // State
  allApps = signal<IV4IntegrationApp[]>([]);
  isLoading = signal(false);
  isUser = signal(false);
  isWhiteLabel = false;
  searchControl = new FormControl('');
  searchQuery = signal('');
  selectedCategory = signal('all');
  activeTab = signal<'available' | 'connected'>('connected');

  // Filter panel state
  isFilterOpen = signal(false);

  // Panel state
  selectedApp = signal<IV4IntegrationApp | null>(null);
  isPanelOpen = signal(false);

  // Computed
  connectedCount = computed(
    () => this.allApps().filter((a) => a.isConnected).length
  );

  filteredApps = computed(() => {
    let apps = this.allApps();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const tab = this.activeTab();

    // White-label filter
    if (this.isWhiteLabel) {
      apps = apps.filter((a) => !a.preventAccessToWhiteLabels);
    }

    // User filter (hide square for client users)
    if (this.isUser()) {
      apps = apps.filter((a) => a.id !== 'square');
    }

    // Search
    if (query) {
      apps = apps.filter((a) => a.title.toLowerCase().includes(query));
    }

    // Category
    if (category !== 'all') {
      apps = apps.filter((a) =>
        a.categories.includes(category as V4IntegrationCategory)
      );
    }

    // Tab
    if (tab === 'connected') {
      apps = apps.filter((a) => a.isConnected);
    }

    return apps;
  });

  ngOnInit(): void {
    this.isWhiteLabel =
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isWhiteLabel'
      );
    this.allApps.set(getV4IntegrationApps());
    this.listenToSearchControl();
    this.getHeaderData();
    this.handleNetSuiteConnectSuccess();
    this.handleOAuthCallbackThenLoad();
  }

  /**
   * Shows a success modal when redirected back from the NetSuite OAuth flow
   * with `?success=1`, then removes the param from the URL.
   */
  private handleNetSuiteConnectSuccess(): void {
    if (this.route.snapshot.queryParamMap.get('success') !== '1') return;
    this.alertService.successAlert({
      content: 'Successfully connected to NetSuite.'
    });
    const rest = { ...this.route.snapshot.queryParams };
    delete rest.success;
    this.router.navigate([], { queryParams: rest, replaceUrl: true });
  }

  /**
   * If the URL carries OAuth callback params for the redirected app, exchange
   * the code with the backend before fetching connection status — otherwise
   * the panel would render the pre-OAuth ("Not connected") state.
   */
  private handleOAuthCallbackThenLoad(): void {
    const openAppId = this.resolveOpenAppId();
    const { queryParams } = this.route.snapshot;

    if (!this.oauthCallbackService.canHandle(openAppId, queryParams)) {
      this.getConnectionStatus();
      return;
    }

    this.isLoading.set(true);
    this.oauthCallbackService
      .handle(openAppId as string, queryParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.stripOAuthParamsFromUrl();
        this.notifyCallbackResult(result);
        this.getConnectionStatus();
      });
  }

  private notifyCallbackResult(result: IOAuthCallbackResult): void {
    if (result.success) {
      this.alertService.successAlert({
        content: result.message || 'Successfully connected.'
      });
    } else if (result.message) {
      this.alertService.warningAlert({ content: result.message });
    }
  }

  /** Removes OAuth-only params; preserves `openApp` so the panel can still open. */
  private stripOAuthParamsFromUrl(): void {
    const rest = { ...this.route.snapshot.queryParams };
    this.oauthCallbackService
      .callbackParamKeys()
      .forEach((k) => delete rest[k]);
    this.router.navigate([], { queryParams: rest, replaceUrl: true });
  }

  private resolveOpenAppId(): string | undefined {
    return (
      (window.history.state as { openAppId?: string })?.openAppId ??
      this.route.snapshot.queryParams.openApp
    );
  }

  private openPanelFromNavState(): void {
    const openAppId = (window.history.state as { openAppId?: string })
      ?.openAppId;
    if (!openAppId) return;
    const app = this.allApps().find((a) => a.id === openAppId);
    if (app) this.onCardClick(app);
  }

  private openPanelFromQueryParams(): void {
    const openAppId = this.route.snapshot.queryParams.openApp;
    if (!openAppId) return;
    const app = this.allApps().find((a) => a.id === openAppId);
    if (app) {
      this.onCardClick(app);
      // Remove openApp from query params without affecting other params (OAuth params)
      const rest = { ...this.route.snapshot.queryParams };
      delete rest.openApp;
      this.router.navigate([], { queryParams: rest, replaceUrl: true });
    }
  }

  private listenToSearchControl(): void {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchQuery.set(value || '');
      });
  }

  private getHeaderData(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (typeof res === 'object') {
          this.isUser.set((res as IHeaderData).isLoggedInAsClient);
        }
      });
  }

  private getConnectionStatus(silent = false): void {
    if (!silent) {
      this.isLoading.set(true);
    }
    this.integrationService
      .appsConnectionStatus()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const connectedIds: string[] = res.data.connected_applications;
          this.allApps.update((apps) =>
            apps.map((app) => ({
              ...app,
              isConnected: connectedIds.includes(app.id)
            }))
          );
        }
        if (!silent) {
          this.openPanelFromNavState();
          this.openPanelFromQueryParams();
        }
        // Odoo's connection state is not tracked by appsConnectionStatus, so
        // resolve it via the dedicated /integrations/odoo/details endpoint and
        // merge the result so the marketplace card shows "Manage" not "Connect".
        this.resolveOdooConnectionStatus();
      });
  }

  private resolveOdooConnectionStatus(): void {
    this.odooService
      .getOdooConnectionDetails()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.success) return;
        const connected = res.data?.connected === 1;
        odooConnectedOverride.set(connected);
        this.allApps.update((apps) =>
          apps.map((app) =>
            app.id === 'odoo' ? { ...app, isConnected: connected } : app
          )
        );
      });
  }

  toggleFilter(): void {
    this.isFilterOpen.update((v) => !v);
  }

  selectCategory(value: string): void {
    this.selectedCategory.set(value);
    this.isFilterOpen.set(false);
  }

  setActiveTab(tab: 'available' | 'connected'): void {
    this.activeTab.set(tab);
  }

  clearFilters(): void {
    this.searchControl.reset('');
    this.selectedCategory.set('all');
  }

  requestIntegration(): void {
    this.dialog.open(V4ContactSupportModalComponent, {
      width: '540px',
      maxWidth: '95%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { type: 'request-integration' }
    });
  }

  onCardClick(app: IV4IntegrationApp): void {
    if (app.comingSoon) {
      this.dialog.open(V4IntegrationRequestOptionsModalComponent, {
        width: '540px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: { app }
      });
      return;
    }
    this.selectedApp.set(app);
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
    this.getConnectionStatus(true);
  }

  onConnect(app: IV4IntegrationApp): void {
    if (app.id === 'netsuite') {
      const dialogRef = this.dialog.open(V4ConnectNetsuiteModalComponent, {
        width: '480px',
        maxWidth: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { app }
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.getConnectionStatus();
        }
        this.closePanel();
      });
      return;
    }
    if (app.id === 'odoo') {
      const dialogRef = this.dialog.open(V4ConnectOdooModalComponent, {
        width: '480px',
        maxWidth: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { app }
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.getConnectionStatus();
        }
        this.closePanel();
      });
      return;
    }
    if (app.id === 'shopify') {
      // Shopify builds its consent screen per shop, so the store domain has to
      // be collected before the OAuth redirect can be requested.
      const dialogRef = this.dialog.open(V4ShopifyDomainModalComponent, {
        width: '480px',
        maxWidth: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { app }
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.getConnectionStatus();
        }
        this.closePanel();
      });
      return;
    }
    // Connection is handled by per-app settings components (e.g. V4QuickbooksOnlineComponent)
    this.closePanel();
  }

  onDisconnect(_app: IV4IntegrationApp): void {
    // Disconnection is handled by per-app settings components
    // Refresh connection status after panel closes
    this.closePanel();
  }

  getCategoryBgColor(category: V4IntegrationCategory): string {
    return getCategoryBgColor(category);
  }

  /** Check-from-PDF style apps issue checks directly instead of "connecting". */
  isCheckFromPdf(app: IV4IntegrationApp): boolean {
    return (
      app.id === 'check-from-pdf' ||
      app.id === 'qb-payroll'
    );
  }
}

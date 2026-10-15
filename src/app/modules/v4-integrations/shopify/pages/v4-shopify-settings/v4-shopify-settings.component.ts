import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IConnectedCompanyList } from 'src/app/modules/integration/model/integration';
import { shopifyConnectedOverride } from '../../shopify-connection-state';

@Component({
  selector: 'app-v4-shopify-settings',
  standalone: true,
  templateUrl: './v4-shopify-settings.component.html',
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4ShopifySettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly providerCode = 'shopify' as const;

  loading = signal({
    dataLoading: false,
    disconnecting: false,
    singleDisconnectIndex: undefined as number | undefined,
    singleImportIndex: undefined as number | undefined
  });

  isConnected = signal(false);
  connectedAccounts = signal<IConnectedCompanyList[]>([]);

  ngOnInit(): void {
    this.loadShopifyData();
    this.listenToQueryParams();
  }

  /**
   * @description Secondary OAuth landing path. The index page normally
   * exchanges the code through IntegrationOAuthCallbackService before this
   * drawer mounts; this covers a return while the drawer is already open.
   */
  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.code && params.state) {
          this.onCallBackFromShopify(params);
        }
      });
  }

  /** Loads Shopify connection status and the connected store list. */
  loadShopifyData(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .getDetails(this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, dataLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          const connected = !!res.data.connected;
          this.isConnected.set(connected);
          shopifyConnectedOverride.set(connected);
          this.connectedAccounts.set(res.data.companies || []);
        } else {
          this.isConnected.set(false);
          shopifyConnectedOverride.set(false);
          this.connectedAccounts.set([]);
        }
      });
  }

  private onCallBackFromShopify(params: Params): void {
    if (!params.code || !params.state) return;

    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .shopifyCallback(params.code, params.state, params.shop || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {} });
            this.loadShopifyData();
            this.alertService.successAlert({
              content: 'Successfully connected to Shopify.',
              close: true
            });
          } else {
            this.loading.update((l) => ({ ...l, dataLoading: false }));
            this.alertService.failedAlert({
              content: res.message || 'Failed to connect to Shopify.'
            });
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.update((l) => ({ ...l, dataLoading: false }));
          this.alertService.failedAlert({
            content: 'Failed to connect to Shopify. Please try again!'
          });
        }
      });
  }

  /** Pulls customers from a single connected store into payees. */
  onImportCustomers(companyId: string, index: number): void {
    this.loading.update((l) => ({ ...l, singleImportIndex: index }));

    this.integrationService
      .importShopifyCustomers([companyId])
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, singleImportIndex: undefined }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Customers imported successfully.',
            close: true
          });
        } else {
          this.alertService.failedAlert({
            content:
              res.message || 'Failed to import customers. Please try again.'
          });
        }
      });
  }

  /** Disconnects one store, leaving the other connected stores intact. */
  onDisconnectStore(companyId: string, index: number): void {
    this.loading.update((l) => ({ ...l, singleDisconnectIndex: index }));

    this.integrationService
      .disconnectShopifyStore(companyId)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({
            ...l,
            singleDisconnectIndex: undefined
          }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Store disconnected successfully.',
            close: true
          });
          this.loadShopifyData();
        }
      });
  }

  /** Removes the whole Shopify integration after confirmation. */
  onDisconnect(): void {
    const confirmRef = this.alertService.confirmAlert({
      content:
        'All your connected Shopify stores will be disconnected. Are you sure you want to continue?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, disconnecting: true }));

      this.integrationService
        .disconnectShopify()
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnecting: false }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content:
                res.message || 'Successfully disconnected from Shopify.',
              close: true
            });
            this.isConnected.set(false);
            shopifyConnectedOverride.set(false);
            this.connectedAccounts.set([]);
          }
        });
    });
  }
}

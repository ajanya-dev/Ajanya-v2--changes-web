import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IConnectedCompanyList } from '../../../model/integration';
import { ShopifyDomainModalComponent } from '../../modals/shopify-domain-modal/shopify-domain-modal.component';

@Component({
  selector: 'app-shopify-home',
  standalone: true,
  imports: [NgClass, CustomerSupportComponent, OcwBackButtonComponent, CommonButtonV35Component, MatDialogModule],
  templateUrl: './shopify-home.component.html',
  styleUrl: './shopify-home.component.scss'
})
export class ShopifyHomeComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  providerCode = 'shopify';
  shopifyConnectedAccounts: IConnectedCompanyList[] = [];
  isConnected = false;

  loading = {
    detailsLoading: false,
    defaultLoading: false,
    disconnecting: false,
    singleDisconnectLoading: undefined as number | undefined,
    singleImportLoading: undefined as number | undefined
  };

  instructions: string[] = [
    'Click "Connect" and authenticate with your Shopify credentials',
    'Use "Import Customers" to pull customers from a connected store',
    'Click "Disconnect" next to a store to remove it, or "Disconnect" on the top to remove all'
  ];

  ngOnInit(): void {
    this.getShopifyDetails();
    this.getQueryParams();
  }

  getQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.code && res.state) {
          this.onCallbackFromShopify(res);
        }
      });
  }

  getShopifyDetails(): void {
    this.loading.detailsLoading = true;
    this.integrationService
      .getDetails(this.providerCode)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.loading.detailsLoading = false; })
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.shopifyConnectedAccounts = res.data.companies || [];
          this.isConnected = !!(res.data.connected);
        }
      });
  }

  onCallbackFromShopify(params: Params): void {
    if (!params.code || !params.state) return;
    if(this.isConnected) return;
    this.loading.detailsLoading = true;
    this.integrationService
      .shopifyCallback(params.code, params.state, params.shop || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {}, replaceUrl:true });
            this.getShopifyDetails();
              this.alertService.successAlert({
                content: 'Successfully connected to Shopify.'
              });
          } else {
            this.loading.detailsLoading = false;
            this.alertService.failedAlert({ content: res.message || 'Failed to connect to Shopify.' });
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.detailsLoading = false;
          this.alertService.failedAlert({
            content: 'Failed to connect to Shopify. Please try again!'
          });
        }
      });
  }

  onConnectToShopify(): void {
    const dialogRef = this.dialog.open(ShopifyDomainModalComponent, { width: '440px' });
    dialogRef.afterClosed().subscribe((shop: string | null) => {
      if (!shop) return;
      this.loading.defaultLoading = true;
      this.integrationService
        .connectToShopify(shop)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => { this.loading.defaultLoading = false; })
        )
        .subscribe((res) => {
          if (res.success && res.redirectUrl) {
            window.open(res.redirectUrl, '_self');
          } else {
            this.alertService.failedAlert({ content: 'Failed to get Shopify connection URL. Please try again.' });
          }
        });
    });
  }

  onImportCustomers(companyId: string, index: number): void {
    this.loading.singleImportLoading = index;
    this.integrationService
      .importShopifyCustomers([companyId])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.loading.singleImportLoading = undefined; })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Customers imported successfully.' });
        } else {
          this.alertService.failedAlert({ content: res.message || 'Failed to import customers. Please try again.' });
        }
      });
  }

  onDisconnectShopifyStore(companyId: string, index: number): void {
    this.loading.singleDisconnectLoading = index;
    this.integrationService
      .disconnectShopifyStore(companyId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.loading.singleDisconnectLoading = undefined; })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Store disconnected successfully.' });
          this.getShopifyDetails();
        }
      });
  }

  onDisconnectAll(): void {
    this.loading.disconnecting = true;
    this.integrationService
      .disconnectShopify()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.loading.disconnecting = false; })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Successfully disconnected from Shopify.' });
          this.getShopifyDetails();
        }
      });
  }

  goBack(): void {
    setTimeout(() => { this.router.navigate(['/manage/thirdparty_app/index']); }, 100);
  }
}

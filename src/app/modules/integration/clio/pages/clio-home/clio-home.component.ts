import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IConnectedThirdPartyData, IConnectedCompanyList } from '../../../model/integration';

@Component({
  selector: 'app-clio-home',
  standalone: true,
  imports: [
    NgClass,
    CustomerSupportComponent,
    OcwBackButtonComponent,
    CommonButtonV35Component
  ],
  templateUrl: './clio-home.component.html',
  styleUrl: './clio-home.component.scss'
})
export class ClioHomeComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  providerCode = 'clio';

  // Data
  clioModule: IConnectedThirdPartyData['module'] | null = null;
  clioConnectedAccounts: IConnectedCompanyList[] = [];
  moduleId = '';

  // State
  isConnected = false;

  loading = {
    defaultLoading: false,
    detailsLoading: false,
    disconnecting: false
  };

  instructions: string[] = [
    'Click on Connect',
    'Authenticate with your Clio credentials',
    'Click "Import Contacts" to sync contacts from Clio',
    'Click "Disconnect" to remove the Clio integration'
  ];

  ngOnInit(): void {
    this.getClioDetails();
    this.getQueryParams();
  }

  /**
   * Get query parameters from the URL for OAuth callback
   */
  getQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.code && res.state) {
          this.onCallBackFromClio(res);
        }
      });
  }

  /**
   * Get Clio details
   */
  getClioDetails(): void {
    this.loading.detailsLoading = true;
    this.integrationService
      .getDetails(this.providerCode)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.detailsLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.clioModule = res.data.module || null;
          this.clioConnectedAccounts = res.data.companies || [];
          this.isConnected = !!(res.data.connected);
          this.moduleId = this.clioModule?.id || '';
        }
      });
  }

  /**
   * Handle OAuth callback from Clio
   */
  onCallBackFromClio(params: Params): void {
    if (!params.code || !params.state) return;

    this.loading.detailsLoading = true;
    this.integrationService
      .clioCallback(params.code, params.state)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {} });
            this.getClioDetails();
            this.alertService.successAlert({
              content: 'Successfully connected to Clio.'
            });
          } else {
            this.alertService.failedAlert({
              content: res.message || 'Failed to connect to Clio.'
            });
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.detailsLoading = false;
          this.alertService.failedAlert({
            content: 'Failed to connect to Clio. Please try again!'
          });
        }
      });
  }

  /**
   * Connect to Clio - get OAuth URL and redirect
   */
  onConnectToClio(): void {
    this.loading.defaultLoading = true;
    this.integrationService
      .connectToClio()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.defaultLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.success && res.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        } else {
          this.alertService.failedAlert({
            content: 'Failed to get Clio connection URL. Please try again.'
          });
        }
      });
  }

  /**
   * Disconnect Clio account
   */
  onDisconnect(): void {
    this.loading.disconnecting = true;
    this.integrationService
      .disconnectClio(this.moduleId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.disconnecting = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully disconnected from Clio.'
          });
          this.getClioDetails();
        }
      });
  }

  /**
   * Navigate back to the integrations page
   */
  goBack(): void {
    setTimeout(() => {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }, 100);
  }
}

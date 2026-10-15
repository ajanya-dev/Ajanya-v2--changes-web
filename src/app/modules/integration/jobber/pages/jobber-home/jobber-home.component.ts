import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { Utils } from 'src/app/data/utils';
import { ReactiveFormsModule } from '@angular/forms';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  IJobberProvider,
  IConnectedCompanyList
} from '../../../model/integration';

@Component({
  selector: 'app-jobber-home',
  standalone: true,
  imports: [
    NgClass,
    CustomerSupportComponent,
    OcwBackButtonComponent,
    ReactiveFormsModule,
    CommonButtonV35Component
  ],
  templateUrl: './jobber-home.component.html',
  styleUrl: './jobber-home.component.scss'
})
export class JobberHomeComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  providerCode = 'jobber';

  // Data
  jobberProvider: IJobberProvider | null = null;
  jobberConnectedAccounts: IConnectedCompanyList[] = [];
  workspaceId: string = '';
  
  // State
  isConnected = false;
  utils = Utils;
  Math = Math;

  loading = {
    defaultLoading: false,
    detailsLoading: false,
    disconnecting: false,
    dataLoading: false,
    syncingData: false,
    singleDisconnectLoading: undefined as number | undefined
  };

  instructions: string[] = [
    'Click on Connect',
    'Authenticate with your Jobber credentials',
    'Click "Disconnect" to remove the Jobber integration'
  ];

  ngOnInit(): void {
    this.getJobberDetails();
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
        this.onCallBackFromJobber(res);
      }
    });
  }

  /**
   * Get Jobber details and connected companies
   */
  getJobberDetails(): void {
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
            this.jobberProvider = res.data.provider || null;
            this.jobberConnectedAccounts = res.data.companies || [];
            this.isConnected = !!(res.data.connected);
            this.workspaceId = res.data.companies[0]?.companyId || '';
          }
        });
  }

  /**
   * Handle OAuth callback from Jobber
   */
  onCallBackFromJobber(params: Params): void {
    if (!params.code || !params.state) return;

    this.loading.detailsLoading = true;
      this.integrationService
        .jobberCallback(params.code, params.state)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.router.navigate([], { queryParams: {} });
              this.getJobberDetails();
              this.alertService.successAlert({
                content: 'Successfully connected to Jobber.'
              });
            } else {
              this.alertService.failedAlert({
                content: res.message || 'Failed to connect to Jobber.'
              });
            }
          },
          error: () => {
            this.router.navigate([], { queryParams: {} });
            this.loading.detailsLoading = false;
            this.alertService.failedAlert({
              content: 'Failed to connect to Jobber. Please try again!'
            });
          }
        });
  }

  /**
   * Connect to Jobber - get OAuth URL and redirect
   */
  onConnectToJobber(): void {
    this.loading.defaultLoading = true;
      this.integrationService
        .connectToJobber()
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
              content: 'Failed to get Jobber connection URL. Please try again.'
            });
          }
        });
  }

  onDisconnectJobber(){
    this.loading.disconnecting = true;
    this.integrationService.disconnectJobber()
      .pipe(takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.disconnecting = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully disconnected from Jobber.'
          });
          this.getJobberDetails();
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
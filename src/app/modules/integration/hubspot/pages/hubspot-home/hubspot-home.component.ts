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
import { HubspotDataTableComponent } from '../../components/hubspot-data-table/hubspot-data-table.component';
import {
  IHubSpotAddCompanyResponse,
  IHubSpotProvider,
  IHubSpotCompanies,
  IConnectedCompanyList
} from '../../../model/integration';

@Component({
  selector: 'app-hubspot-home',
  standalone: true,
  imports: [
    NgClass,
    CustomerSupportComponent,
    OcwBackButtonComponent,
    ReactiveFormsModule,
    HubspotDataTableComponent,
    CommonButtonV35Component
  ],
  templateUrl: './hubspot-home.component.html',
  styleUrl: './hubspot-home.component.scss'
})
export class HubspotHomeComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  providerCode = 'hubspot';

  // Data
  hubspotProvider: IHubSpotProvider | null = null;
  hubspotConnectedAccounts:IConnectedCompanyList[] = [];
  hubspotCompanies: IHubSpotCompanies[] = [];
  selectedCompany: IConnectedCompanyList | null = null;
  workspaceId: string = '';
  selectedCompanyId:string[] = [];
  
  // Data table properties
  currentPagination = {
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1
  };

  // State
  isConnected = false;
  utils = Utils;
  Math = Math;

  loading = {
    defaultLoading: false,
    detailsLoading: false,
    addingCompany: false,
    disconnecting: false,
    dataLoading: false,
    syncingData: false,
    singleDisconnectLoading: undefined as number | undefined
  };

  instructions: string[] = [
    'Click on Connect',
    'Authenticate with your HubSpot credentials',
    'Click "Import Companies" to sync data from HubSpot',
    'View imported companies in the table below',
    'Click "Disconnect" to remove the HubSpot integration'
  ];

  ngOnInit(): void {
    this.getHubSpotDetails();
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
        this.onCallBackFromHubSpot(res);
      }
    });
  }

  /**
   * Get HubSpot details and connected companies
   */
  getHubSpotDetails(): void {
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
            this.hubspotProvider = res.data.provider || null;
            this.hubspotConnectedAccounts = res.data.companies || [];
            this.isConnected = !!(res.data.connected);
            this.workspaceId = res.data.companies[0]?.companyId || '';
            if(this.isConnected) {
              this.selectedCompanyId.push(this.hubspotConnectedAccounts[0].companyId || '');
              // this.importHubspotCompanies(this.hubspotConnectedAccounts.map(company => company.companyId));
              this.getHubSpotCompanies(this.hubspotConnectedAccounts.map(company => company.companyId as string));
            }
          }
        });
  }

  /**
   * Handle OAuth callback from HubSpot
   */
  onCallBackFromHubSpot(params: Params): void {
    if (!params.code || !params.state) return;

    this.loading.detailsLoading = true;
      this.integrationService
        .hubSpotCallback(params.code, params.state)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.router.navigate([], { queryParams: {} });
              this.getHubSpotDetails();
              this.alertService.successAlert({
                content: 'Successfully connected to HubSpot.'
              });
            } else {
              this.alertService.failedAlert({
                content: res.message || 'Failed to connect to HubSpot.'
              });
            }
          },
          error: () => {
            this.router.navigate([], { queryParams: {} });
            this.loading.detailsLoading = false;
            this.alertService.failedAlert({
              content: 'Failed to connect to HubSpot. Please try again!'
            });
          }
        });
  }

  /**
   * Connect to HubSpot - get OAuth URL and redirect
   */
  onConnectToHubSpot(): void {
    this.loading.defaultLoading = true;
      this.integrationService
        .connectToHubSpot()
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
              content: 'Failed to get HubSpot connection URL. Please try again.'
            });
          }
        });
  }

  /**
   * Add a new HubSpot company
   */
  onAddCompany(): void {
    this.loading.addingCompany = true;
      this.integrationService
        .addHubSpotCompany()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.loading.addingCompany = false;
          })
        )
        .subscribe((res: IHubSpotAddCompanyResponse) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Company added successfully.'
            });
            this.getHubSpotDetails();
          } else {
            this.alertService.failedAlert({
              content: 'Failed to add company. Please try again.'
            });
          }
        });
  }

  onDisconnectHubSpot(){
    this.loading.disconnecting = true;
    this.integrationService.disconnectHubSpot()
      .pipe(takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.disconnecting = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully disconnected from HubSpot.'
          });
          this.getHubSpotDetails();
        }
      });
  }

  disconnectWorkspace(workspaceId: string, index: number): void {
    this.loading.singleDisconnectLoading = index;
    this.integrationService.disconnectWorkspace(workspaceId)
      .pipe(takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.singleDisconnectLoading = undefined;
        })
      ).subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully disconnected from workspace.'
          });
          this.getHubSpotDetails();
        }
      });
  }

  importHubspotCompanies(companyIds?: string[]){
    this.loading.syncingData = true;
    this.integrationService.importHubSpotTransactions('2', companyIds)
      .pipe(takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.syncingData = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully imported companies.'
          });
          this.selectedCompanyId = [];
          this.selectedCompany = null;
          this.getHubSpotCompanies(this.hubspotConnectedAccounts.map(company => company.companyId as string));
        }
      });
  }

  getHubSpotCompanies(company_id?: string[]): void {
    this.loading.dataLoading = true;
    this.integrationService.getHubSpotCompanies(this.currentPagination.currentPage, this.currentPagination.perPage, company_id)
      .pipe(takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.dataLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.hubspotCompanies = res.companies || [];
          this.currentPagination = {...this.currentPagination, ...res.pagination};
        }
      });
  }
  
  /**
   * Select a company and load initial data
   */
  selectCompany(company: IConnectedCompanyList): void {
    this.selectedCompany = company;
    // Ensure we always send selected company IDs as an array and avoid stale values
    this.selectedCompanyId = [company.companyId as string];
    this.currentPagination.currentPage = 1;
    this.getHubSpotCompanies(Array.of(company.companyId as string));
  }

  /**
   * Sync data based on current type
   */
  onSyncData(): void {
    this.importHubspotCompanies(this.hubspotConnectedAccounts.map(company => company.companyId));
  }

  /**
   * Navigate to next page for companies
   */
  onNextPage(): void {
    if (this.currentPagination.currentPage < this.currentPagination.lastPage) {
      this.currentPagination.currentPage++;
      const companyIds = this.selectedCompany ? Array.of(this.selectedCompany.companyId as string) : this.hubspotConnectedAccounts.map(company => company.companyId as string);
      this.getHubSpotCompanies(companyIds);
    }
  }

  /**
   * Navigate to previous page for companies
   */
  onPrevPage(): void {
    if (this.currentPagination.currentPage > 1) {
      this.currentPagination.currentPage--;
      const companyIds = this.selectedCompany ? Array.of(this.selectedCompany.companyId as string) : this.hubspotConnectedAccounts.map(company => company.companyId as string);
      this.getHubSpotCompanies(companyIds);
    }
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
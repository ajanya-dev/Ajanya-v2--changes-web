import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IConnectedCompanyList,
  IHubSpotCompanies,
  IHubSpotAddCompanyResponse
} from 'src/app/modules/integration/model/integration';
import { hubspotConnectedOverride } from '../../hubspot-connection-state';

@Component({
  selector: 'app-v4-hubspot-settings',
  standalone: true,
  templateUrl: './v4-hubspot-settings.component.html',
  styleUrls: ['./v4-hubspot-settings.component.scss'],
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4HubspotSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly providerCode = 'hubspot' as const;

  loading = signal({
    dataLoading: false,
    connecting: false,
    addingCompany: false,
    disconnecting: false,
    companiesLoading: false,
    syncingData: false,
    singleDisconnectIndex: undefined as number | undefined
  });

  isConnected = signal(false);
  connectedAccounts = signal<IConnectedCompanyList[]>([]);
  hubspotCompanies = signal<IHubSpotCompanies[]>([]);
  selectedCompany = signal<IConnectedCompanyList | null>(null);

  currentPagination = signal({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1
  });

  ngOnInit(): void {
    this.loadHubSpotData();
    this.listenToQueryParams();
  }

  /** Listen for OAuth callback query params */
  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.code && params.state) {
          this.onCallBackFromHubSpot(params);
        }
      });
  }

  /** Load HubSpot provider details and connected accounts */
  loadHubSpotData(): void {
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
          hubspotConnectedOverride.set(connected);
          this.connectedAccounts.set(res.data.companies || []);

          if (connected && res.data.companies?.length) {
            const companyIds = res.data.companies.map(
              (c) => c.companyId as string
            );
            this.getHubSpotCompanies(companyIds);
          }
        } else {
          this.isConnected.set(false);
          hubspotConnectedOverride.set(false);
          this.connectedAccounts.set([]);
        }
      });
  }

  /** Handle OAuth callback from HubSpot */
  private onCallBackFromHubSpot(params: Params): void {
    const { code, state } = params;
    if (!code || !state) return;

    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .hubSpotCallback(code, state)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {} });
            this.loadHubSpotData();
            this.alertService.successAlert({
              content: 'Successfully connected to HubSpot.',
              close: true
            });
          } else {
            this.alertService.failedAlert({
              content: res.message || 'Failed to connect to HubSpot.'
            });
            this.loading.update((l) => ({ ...l, dataLoading: false }));
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.update((l) => ({ ...l, dataLoading: false }));
          this.alertService.failedAlert({
            content: 'Failed to connect to HubSpot. Please try again!'
          });
        }
      });
  }

  /** Initiate OAuth connection to HubSpot */
  onConnect(): void {
    this.loading.update((l) => ({ ...l, connecting: true }));

    this.integrationService
      .connectToHubSpot()
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, connecting: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
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

  /** Add a new HubSpot company */
  onAddCompany(): void {
    this.loading.update((l) => ({ ...l, addingCompany: true }));

    this.integrationService
      .addHubSpotCompany()
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, addingCompany: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IHubSpotAddCompanyResponse) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Company added successfully.',
            close: true
          });
          this.loadHubSpotData();
        } else {
          this.alertService.failedAlert({
            content: 'Failed to add company. Please try again.'
          });
        }
      });
  }

  /** Disconnect the entire HubSpot integration */
  onDisconnect(): void {
    const confirmRef = this.alertService.confirmAlert({
      content:
        'All your connected HubSpot accounts will be disconnected. Are you sure you want to continue?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, disconnecting: true }));

      this.integrationService
        .disconnectHubSpot()
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnecting: false }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Successfully disconnected from HubSpot.',
              close: true
            });
            this.isConnected.set(false);
            hubspotConnectedOverride.set(false);
            this.connectedAccounts.set([]);
            this.hubspotCompanies.set([]);
            this.selectedCompany.set(null);
          }
        });
    });
  }

  /** Disconnect a single workspace */
  disconnectWorkspace(workspaceId: string, index: number): void {
    this.loading.update((l) => ({ ...l, singleDisconnectIndex: index }));

    this.integrationService
      .disconnectWorkspace(workspaceId)
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
            content: 'Successfully disconnected workspace.',
            close: true
          });
          this.loadHubSpotData();
        }
      });
  }

  /** Select a connected account and load its companies */
  selectCompany(company: IConnectedCompanyList): void {
    this.selectedCompany.set(company);
    this.currentPagination.update((p) => ({ ...p, currentPage: 1 }));
    this.getHubSpotCompanies([company.companyId as string]);
  }

  /** Import companies from HubSpot */
  onSyncData(): void {
    this.loading.update((l) => ({ ...l, syncingData: true }));

    const companyIds = this.connectedAccounts().map(
      (c) => c.companyId as string
    );

    this.integrationService
      .importHubSpotTransactions('2', companyIds)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, syncingData: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully imported companies.',
            close: true
          });
          this.selectedCompany.set(null);
          this.getHubSpotCompanies(companyIds);
        }
      });
  }

  /** Fetch HubSpot companies with pagination */
  getHubSpotCompanies(companyIds?: string[]): void {
    this.loading.update((l) => ({ ...l, companiesLoading: true }));

    const pagination = this.currentPagination();

    this.integrationService
      .getHubSpotCompanies(
        pagination.currentPage,
        pagination.perPage,
        companyIds
      )
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, companiesLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.hubspotCompanies.set(res.companies || []);
          this.currentPagination.update((p) => ({
            ...p,
            ...res.pagination
          }));
        }
      });
  }

  /** Next page */
  onNextPage(): void {
    const pagination = this.currentPagination();
    if (pagination.currentPage < pagination.lastPage) {
      this.currentPagination.update((p) => ({
        ...p,
        currentPage: p.currentPage + 1
      }));
      const selectedCompany = this.selectedCompany();
      const companyIds = selectedCompany
        ? [selectedCompany.companyId as string]
        : this.connectedAccounts().map((c) => c.companyId as string);
      this.getHubSpotCompanies(companyIds);
    }
  }

  /** Previous page */
  onPrevPage(): void {
    const pagination = this.currentPagination();
    if (pagination.currentPage > 1) {
      this.currentPagination.update((p) => ({
        ...p,
        currentPage: p.currentPage - 1
      }));
      const selectedCompany = this.selectedCompany();
      const companyIds = selectedCompany
        ? [selectedCompany.companyId as string]
        : this.connectedAccounts().map((c) => c.companyId as string);
      this.getHubSpotCompanies(companyIds);
    }
  }
}

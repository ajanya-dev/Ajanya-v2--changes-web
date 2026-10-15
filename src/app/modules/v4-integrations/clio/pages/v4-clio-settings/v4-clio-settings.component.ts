import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IConnectedCompanyList,
  IClioContacts
} from 'src/app/modules/integration/model/integration';
import { clioConnectedOverride } from '../../clio-connection-state';

@Component({
  selector: 'app-v4-clio-settings',
  standalone: true,
  templateUrl: './v4-clio-settings.component.html',
  styleUrls: ['./v4-clio-settings.component.scss'],
  imports: [CommonModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4ClioSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly providerCode = 'clio' as const;

  loading = signal({
    dataLoading: false,
    connecting: false,
    disconnecting: false,
    syncingData: false,
    companiesLoading: false,
    singleDisconnectIndex: undefined as number | undefined
  });

  isConnected = signal(false);
  connectedAccounts = signal<IConnectedCompanyList[]>([]);
  clioContacts = signal<IClioContacts[]>([]);
  selectedCompany = signal<IConnectedCompanyList | null>(null);

  currentPagination = signal({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1
  });

  ngOnInit(): void {
    this.loadClioData();
    this.listenToQueryParams();
  }

  /** Listen for OAuth callback query params */
  private listenToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.code && params.state) {
          this.onCallBackFromClio(params);
        }
      });
  }

  /** Load Clio provider details and connected accounts */
  loadClioData(): void {
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
          clioConnectedOverride.set(connected);
          this.connectedAccounts.set(res.data.companies || []);

          if (connected && res.data.companies?.length) {
            const companyIds = res.data.companies.map(
              (c) => c.companyId as string
            );
            this.getClioContacts(companyIds);
          }
        } else {
          this.isConnected.set(false);
          clioConnectedOverride.set(false);
          this.connectedAccounts.set([]);
        }
      });
  }

  /** Handle OAuth callback from Clio */
  private onCallBackFromClio(params: Params): void {
    const { code, state } = params;
    if (!code || !state) return;

    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .clioCallback(code, state)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate([], { queryParams: {} });
            this.loadClioData();
            this.alertService.successAlert({
              content: 'Successfully connected to Clio.',
              close: true
            });
          } else {
            this.alertService.failedAlert({
              content: res.message || 'Failed to connect to Clio.'
            });
            this.loading.update((l) => ({ ...l, dataLoading: false }));
          }
        },
        error: () => {
          this.router.navigate([], { queryParams: {} });
          this.loading.update((l) => ({ ...l, dataLoading: false }));
          this.alertService.failedAlert({
            content: 'Failed to connect to Clio. Please try again!'
          });
        }
      });
  }

  /** Initiate OAuth connection to Clio */
  onConnect(): void {
    this.loading.update((l) => ({ ...l, connecting: true }));

    this.integrationService
      .connectToClio()
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
            content: 'Failed to get Clio connection URL. Please try again.'
          });
        }
      });
  }

  /** Disconnect the entire Clio integration */
  onDisconnect(): void {
    const confirmRef = this.alertService.confirmAlert({
      content:
        'All your connected Clio accounts will be disconnected. Are you sure you want to continue?'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const accounts = this.connectedAccounts();
      if (!accounts.length) return;

      this.loading.update((l) => ({ ...l, disconnecting: true }));

      forkJoin(
        accounts.map((a) =>
          this.integrationService.disconnectClio(a.companyId as string)
        )
      )
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnecting: false }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.alertService.successAlert({
            content: 'Successfully disconnected from Clio.',
            close: true
          });
          this.isConnected.set(false);
          clioConnectedOverride.set(false);
          this.connectedAccounts.set([]);
          this.clioContacts.set([]);
          this.selectedCompany.set(null);
        });
    });
  }

  /** Disconnect a single workspace */
  disconnectWorkspace(companyId: string, index: number): void {
    this.loading.update((l) => ({ ...l, singleDisconnectIndex: index }));

    this.integrationService
      .disconnectClio(companyId)
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
          this.loadClioData();
        }
      });
  }

  /** Select a connected account and load its contacts */
  selectCompany(company: IConnectedCompanyList): void {
    this.selectedCompany.set(company);
    this.currentPagination.update((p) => ({ ...p, currentPage: 1 }));
    this.getClioContacts([company.companyId as string]);
  }

  /** Import contacts from Clio */
  onSyncData(): void {
    this.loading.update((l) => ({ ...l, syncingData: true }));

    const companyIds = this.connectedAccounts().map(
      (c) => c.companyId as string
    );

    this.integrationService
      .importClioTransactions('1', companyIds)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, syncingData: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully imported contacts.',
            close: true
          });
          this.selectedCompany.set(null);
          this.getClioContacts(companyIds);
        }
      });
  }

  /** Fetch Clio contacts with pagination */
  getClioContacts(companyIds?: string[]): void {
    this.loading.update((l) => ({ ...l, companiesLoading: true }));

    const pagination = this.currentPagination();

    this.integrationService
      .getClioContacts(pagination.currentPage, pagination.perPage, companyIds)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, companiesLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.clioContacts.set(res.companies || []);
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
      this.getClioContacts(companyIds);
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
      this.getClioContacts(companyIds);
    }
  }
}

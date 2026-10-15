import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IConnectedCompanyList,
  IConnectedThirdPartyData
} from 'src/app/modules/integration/model/integration';
import { V4GustoBankMappingModalComponent } from '../../modals/v4-gusto-bank-mapping-modal/v4-gusto-bank-mapping-modal.component';
import { V4GustoPayrollListModalComponent } from '../../modals/v4-gusto-payroll-list-modal/v4-gusto-payroll-list-modal.component';
import { V4GustoContractorPaymentsModalComponent } from '../../modals/v4-gusto-contractor-payments-modal/v4-gusto-contractor-payments-modal.component';
import { V4ViewGustoCompanyModalComponent } from '../../modals/v4-view-gusto-company-modal/v4-view-gusto-company-modal.component';
import { gustoConnectedOverride } from '../../gusto-connection-state';

@Component({
  selector: 'app-v4-gusto-settings',
  standalone: true,
  templateUrl: './v4-gusto-settings.component.html',
  styleUrls: ['./v4-gusto-settings.component.scss'],
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ]
})
export class V4GustoSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly providerCode = 'gusto' as const;

  loading = signal({
    dataLoading: false,
    deletingCompany: undefined as undefined | string,
    disconnecting: false,
    connecting: false
  });

  isConnected = signal(false);
  gustoData = signal<IConnectedThirdPartyData | null>(null);
  importedCompanies = signal<IConnectedCompanyList[]>([]);

  ngOnInit(): void {
    this.handleOAuthCallback();
    this.loadGustoData();
  }

  // ---------- OAuth callback ----------

  private handleOAuthCallback(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.state && params.code) {
          this.onCallBack(params);
        }
      });
  }

  private onCallBack(params: Params): void {
    const queryString =
      `${Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')  }&`;

    this.loading.update((l) => ({ ...l, dataLoading: true }));
    this.integrationService
      .connectCallBack(queryString, this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, dataLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.router.navigate([], {
            queryParams: {},
            queryParamsHandling: ''
          });
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Successfully connected to Gusto.',
              close: true
            });
            this.loadGustoData();
          }
        },
        error: () => {
          this.router.navigate([], {
            queryParams: {},
            queryParamsHandling: ''
          });
        }
      });
  }

  // ---------- Loaders ----------

  private loadGustoData(): void {
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
        if (res.success) {
          this.gustoData.set(res.data);
          this.isConnected.set(!!res.data.connected);
          this.importedCompanies.set(res.data.companies || []);
          gustoConnectedOverride.set(!!res.data.connected);
        } else {
          this.gustoData.set(null);
          this.isConnected.set(false);
          this.importedCompanies.set([]);
          gustoConnectedOverride.set(false);
        }
      });
  }

  // ---------- Companies ----------

  deleteCompany(company: IConnectedCompanyList): void {
    const dRef = this.alertService.confirmAlert({
      content: `Are you sure you want to remove ${company.companyName}?`,
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading.update((l) => ({
        ...l,
        deletingCompany: company.companyId
      }));
      this.integrationService
        .deleteGustoCompany(company.companyId)
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({
              ...l,
              deletingCompany: undefined
            }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Company removed.',
              close: true
            });
            this.loadGustoData();
          }
        });
    });
  }

  // ---------- Modal openers ----------

  openBankMappingModal(): void {
    this.dialog.open(V4GustoBankMappingModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  openViewCompany(company: IConnectedCompanyList): void {
    this.dialog.open(V4ViewGustoCompanyModalComponent, {
      maxWidth: '720px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { company }
    });
  }

  openPayrollList(company: IConnectedCompanyList, offCycleOnly: boolean): void {
    this.dialog.open(V4GustoPayrollListModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { company, offCycleOnly }
    });
  }

  openContractorPayments(company: IConnectedCompanyList): void {
    this.dialog.open(V4GustoContractorPaymentsModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { company }
    });
  }

  // ---------- Add Fund (Short on Cash) ----------

  openAddFund(): void {
    this.integrationService
      .openGusto()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data?.url) {
            window.open(res.data.url, '_blank');
          }
        },
        error: (err) => {
          if (err?.error?.errorMsg) {
            this.alertService.warningAlert({
              content: err.error.errorMsg
            });
          }
        }
      });
  }

  // ---------- Connect / Disconnect ----------

  onConnect(): void {
    if (this.loading().connecting) return;
    this.loading.update((l) => ({ ...l, connecting: true }));
    this.integrationService
      .getConnectionUrl(this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, connecting: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res?.redirectUrl) {
          window.open(res.redirectUrl, '_self');
        }
      });
  }

  onDisconnect(): void {
    const dRef = this.alertService.confirmAlert({
      content:
        'All your Gusto companies will be disconnected. Are you sure you want to continue?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading.update((l) => ({ ...l, disconnecting: true }));
      this.integrationService
        .disConnect(this.providerCode)
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnecting: false }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Disconnected successfully.',
              close: true
            });
            this.loadGustoData();
          }
        });
    });
  }
}

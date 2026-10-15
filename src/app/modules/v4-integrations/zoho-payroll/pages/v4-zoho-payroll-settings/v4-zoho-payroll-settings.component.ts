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
import { V4ZohoPayrollBankMappingModalComponent } from '../../modals/v4-zoho-payroll-bank-mapping-modal/v4-zoho-payroll-bank-mapping-modal.component';
import { V4ZohoPayrollPayPeriodModalComponent } from '../../modals/v4-zoho-payroll-pay-period-modal/v4-zoho-payroll-pay-period-modal.component';
import { zohoPayrollConnectedOverride } from '../../zoho-payroll-connection-state';

@Component({
  selector: 'app-v4-zoho-payroll-settings',
  standalone: true,
  templateUrl: './v4-zoho-payroll-settings.component.html',
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ]
})
export class V4ZohoPayrollSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly providerCode = 'zoho_payroll' as const;

  loading = signal({
    dataLoading: false,
    importingCompanies: false,
    disconnecting: false,
    connecting: false
  });

  isConnected = signal(false);
  zohoPayrollData = signal<IConnectedThirdPartyData | null>(null);
  importedCompanies = signal<IConnectedCompanyList[]>([]);

  ngOnInit(): void {
    this.handleOAuthCallback();
    this.loadData();
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
    const queryString = `${Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}&`;

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
              content: 'Successfully connected to Zoho Payroll.',
              close: true
            });
            this.loadData();
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

  private loadData(): void {
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
          this.zohoPayrollData.set(res.data);
          this.isConnected.set(!!res.data.connected);
          this.importedCompanies.set(res.data.companies || []);
          zohoPayrollConnectedOverride.set(!!res.data.connected);
        } else {
          this.zohoPayrollData.set(null);
          this.isConnected.set(false);
          this.importedCompanies.set([]);
          zohoPayrollConnectedOverride.set(false);
        }
      });
  }

  // ---------- Companies ----------

  importCompanies(): void {
    this.loading.update((l) => ({ ...l, importingCompanies: true }));
    this.integrationService
      .importZohoCompany(this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, importingCompanies: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message || 'Companies added successfully.',
            close: true
          });
          if (res.message !== 'No Company available to add') {
            this.loadData();
          }
        }
      });
  }

  // ---------- Modal openers ----------

  openPayPeriods(company: IConnectedCompanyList): void {
    this.dialog.open(V4ZohoPayrollPayPeriodModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { company }
    });
  }

  openBankMappingModal(): void {
    this.dialog.open(V4ZohoPayrollBankMappingModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { companies: this.importedCompanies() }
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
        'All your Zoho Payroll companies will be disconnected. Are you sure you want to continue?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading.update((l) => ({ ...l, disconnecting: true }));
      this.integrationService
        .disConnectionZohoPayroll()
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, disconnecting: false }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: res.message || 'Disconnected successfully.',
              close: true
            });
            this.loadData();
          }
        });
    });
  }
}

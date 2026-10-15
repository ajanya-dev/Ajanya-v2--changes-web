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
import { V4XeroBankMappingModalComponent } from '../../modals/v4-xero-bank-mapping-modal/v4-xero-bank-mapping-modal.component';
import { V4XeroSettingsModalComponent } from '../../modals/v4-xero-settings-modal/v4-xero-settings-modal.component';
import { xeroConnectedOverride } from '../../xero-connection-state';

@Component({
  selector: 'app-v4-xero-settings',
  standalone: true,
  templateUrl: './v4-xero-settings.component.html',
  styleUrls: ['./v4-xero-settings.component.scss'],
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ]
})
export class V4XeroSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly providerCode = 'xero' as const;

  loading = signal({
    dataLoading: false,
    disconnectingCompany: undefined as undefined | string,
    connecting: false
  });

  isConnected = signal(false);
  xeroData = signal<IConnectedThirdPartyData | null>(null);
  companies = signal<IConnectedCompanyList[]>([]);

  ngOnInit(): void {
    this.handleOAuthCallback();
    this.loadXeroData();
  }

  // ---------- OAuth callback ----------

  private handleOAuthCallback(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (
          params.code &&
          params.state &&
          params.scope &&
          params.session_state
        ) {
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.router.navigate([], {
            queryParams: {},
            queryParamsHandling: ''
          });
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Successfully connected.',
              close: true
            });
            this.importCompany();
          } else {
            this.loading.update((l) => ({ ...l, dataLoading: false }));
          }
        },
        error: () => {
          this.router.navigate([], {
            queryParams: {},
            queryParamsHandling: ''
          });
          this.loading.update((l) => ({ ...l, dataLoading: false }));
        }
      });
  }

  private importCompany(): void {
    this.integrationService
      .importZohoCompany(this.providerCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.loadXeroData();
          } else {
            this.loading.update((l) => ({ ...l, dataLoading: false }));
          }
        },
        error: () => {
          this.loading.update((l) => ({ ...l, dataLoading: false }));
        }
      });
  }

  // ---------- Loaders ----------

  private loadXeroData(): void {
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
          this.xeroData.set(res.data);
          this.isConnected.set(!!res.data.connected);
          this.companies.set(res.data.companies || []);
          xeroConnectedOverride.set(!!res.data.connected);
        } else {
          this.xeroData.set(null);
          this.isConnected.set(false);
          this.companies.set([]);
          xeroConnectedOverride.set(false);
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

  onDisconnectCompany(company: IConnectedCompanyList): void {
    const isConnectedRow = company.status === 'Connected';
    const dRef = this.alertService.confirmAlert({
      content: isConnectedRow
        ? 'Are you sure you want to disconnect?'
        : 'Are you sure you want to remove this company from the list?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading.update((l) => ({
        ...l,
        disconnectingCompany: company.companyId
      }));
      this.integrationService
        .disConnectXero({ companyId: company.companyId })
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({
              ...l,
              disconnectingCompany: undefined
            }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: isConnectedRow
                ? 'Successfully Disconnected.'
                : 'Company removed.',
              close: true
            });
            this.loadXeroData();
          }
        });
    });
  }

  // ---------- Modal openers ----------

  openBankMapping(): void {
    this.dialog.open(V4XeroBankMappingModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { companies: this.companies() }
    });
  }

  openSettingsModal(): void {
    this.dialog.open(V4XeroSettingsModalComponent, {
      maxWidth: '420px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }
}

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
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import {
  IConnectedCompanyList,
  IConnectedThirdPartyData
} from 'src/app/modules/integration/model/integration';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { V4SageBusinessBankMappingModalComponent } from '../../modals/v4-sage-business-bank-mapping-modal/v4-sage-business-bank-mapping-modal.component';
import { sageBusinessConnectedOverride } from '../../sage-business-connection-state';

@Component({
  selector: 'app-v4-sage-business-settings',
  standalone: true,
  templateUrl: './v4-sage-business-settings.component.html',
  styleUrls: ['./v4-sage-business-settings.component.scss'],
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component,
    WhiteLabelPipe
  ]
})
export class V4SageBusinessSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly providerCode = 'sage_business' as const;

  loading = signal({
    dataLoading: false,
    disconnecting: false,
    importingPayee: false
  });

  isConnected = signal(false);
  sageData = signal<IConnectedThirdPartyData | null>(null);
  companies = signal<IConnectedCompanyList[]>([]);

  ngOnInit(): void {
    this.handleOAuthCallback();
    this.loadSageData();
  }

  // ---------- OAuth callback ----------

  private handleOAuthCallback(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.code && params.state) {
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
            this.loadSageData();
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

  private loadSageData(): void {
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
          this.sageData.set(res.data);
          this.isConnected.set(!!res.data.connected);
          this.companies.set(res.data.companies || []);
          sageBusinessConnectedOverride.set(!!res.data.connected);
        } else {
          this.sageData.set(null);
          this.isConnected.set(false);
          this.companies.set([]);
          sageBusinessConnectedOverride.set(false);
        }
      });
  }

  // ---------- Disconnect ----------

  onDisconnect(): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect Sage Business?',
      doneMsg: 'Yes'
    });
    dRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading.update((l) => ({ ...l, disconnecting: true }));
      this.integrationService
        .disconnectCompany(this.providerCode)
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
            this.loadSageData();
          }
        });
    });
  }

  // ---------- Import Payee ----------

  onImportPayee(): void {
    if (this.loading().importingPayee) return;
    const companyList = this.companies();
    if (!companyList.length) {
      this.alertService.warningAlert({
        content: 'No connected companies to import from.'
      });
      return;
    }

    if (companyList.length === 1) {
      this.importPayeeFromCompany(companyList[0].companyId);
      return;
    }

    const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { mode: 'Payee', companyList }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.companyId) {
          this.importPayeeFromCompany(res.companyId);
        }
      });
  }

  private importPayeeFromCompany(companyId: string): void {
    this.loading.update((l) => ({ ...l, importingPayee: true }));
    this.integrationService
      .getImportBankAccounts(
        { companyId, importType: 5 },
        this.providerCode
      )
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, importingPayee: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
        }
      });
  }

  // ---------- Modal openers ----------

  openBankMapping(): void {
    this.dialog.open(V4SageBusinessBankMappingModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { companies: this.companies() }
    });
  }
}

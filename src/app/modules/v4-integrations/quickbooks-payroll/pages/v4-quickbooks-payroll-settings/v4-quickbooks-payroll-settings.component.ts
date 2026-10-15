import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IQuickbooksPayrollCompany } from 'src/app/modules/integration/model/integration';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4QuickbooksPayrollBankMappingModalComponent } from '../../modals/v4-quickbooks-payroll-bank-mapping-modal/v4-quickbooks-payroll-bank-mapping-modal.component';
import { V4QuickbooksPayrollListModalComponent } from '../../modals/v4-quickbooks-payroll-list-modal/v4-quickbooks-payroll-list-modal.component';
import { quickbooksPayrollConnectedOverride } from '../../quickbooks-payroll-connection-state';

/**
 * Settings tab of the QuickBooks Online Payroll integration panel. Mirrors the V3
 * page: the details endpoint drives the status badge and the companies table,
 * and every action goes through the same endpoints.
 */
@Component({
  selector: 'app-v4-quickbooks-payroll-settings',
  standalone: true,
  templateUrl: './v4-quickbooks-payroll-settings.component.html',
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ]
})
export class V4QuickbooksPayrollSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal({
    dataLoading: false,
    connecting: false,
    disconnecting: false,
    deletingCompany: undefined as undefined | string
  });

  isConnected = signal(false);
  status = signal('');
  companies = signal<IQuickbooksPayrollCompany[]>([]);

  ngOnInit(): void {
    this.handleConnectCallback();
    this.getDetails();
  }

  // ---------- Connect callback ----------

  /**
   * Reads the `connected` query param the backend callback redirects back with
   * and shows the matching alert, then drops it from the URL.
   */
  private handleConnectCallback(): void {
    const connected = this.route.snapshot.queryParamMap.get('connected');
    if (connected === null) {
      return;
    }
    if (connected === '1') {
      this.alertService.successAlert({
        content: 'QuickBooks Online Payroll connected successfully.',
        close: true
      });
    } else {
      this.alertService.warningAlert({
        content: 'Failed to connect QuickBooks Online Payroll.'
      });
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { connected: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // ---------- Loaders ----------

  /**
   * Loads the module card state and the connected companies.
   */
  getDetails(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));
    this.integrationService
      .getQuickbooksPayrollDetails()
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, dataLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const connected = !!res?.data?.module?.isConnected;
        this.isConnected.set(connected);
        this.status.set(res?.data?.module?.status ?? '');
        this.companies.set(res?.data?.companies ?? []);
        quickbooksPayrollConnectedOverride.set(connected);
      });
  }

  // ---------- Connect / Disconnect ----------

  /**
   * Connect / Connect New Company. Both use the same call — the user simply
   * picks a different company on the Intuit consent screen.
   */
  onConnect(): void {
    if (this.loading().connecting) return;
    this.loading.update((l) => ({ ...l, connecting: true }));
    this.integrationService
      .connectQuickbooksPayroll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res.data?.url) {
            // Stays in the connecting state on purpose: the browser is leaving
            // for Intuit, so the button must not invite another click.
            window.open(res.data.url, '_self');
            return;
          }
          this.loading.update((l) => ({ ...l, connecting: false }));
          if (res?.errorMsg) {
            this.alertService.warningAlert({ content: res.errorMsg });
          }
        },
        error: () => {
          this.loading.update((l) => ({ ...l, connecting: false }));
        }
      });
  }

  /**
   * Disconnects the whole integration after confirmation.
   */
  onDisconnect(): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to disconnect QuickBooks Online Payroll?',
        doneMsg: 'Yes',
        cancelMsg: 'No'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.loading.update((l) => ({ ...l, disconnecting: true }));
        this.integrationService
          .disconnectQuickbooksPayroll()
          .pipe(
            finalize(() =>
              this.loading.update((l) => ({ ...l, disconnecting: false }))
            ),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success) {
              this.alertService.successAlert({
                content: res.message ?? '',
                close: true
              });
              this.getDetails();
            } else if (res?.errorMsg) {
              this.alertService.warningAlert({ content: res.errorMsg });
            }
          });
      });
  }

  // ---------- Companies ----------

  /**
   * Removes a connected company after confirmation.
   * @param company Company to remove.
   */
  deleteCompany(company: IQuickbooksPayrollCompany): void {
    this.alertService
      .confirmAlert({
        content: `Are you sure you want to remove ${company.companyName}?`,
        doneMsg: 'Yes',
        cancelMsg: 'No'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.loading.update((l) => ({
          ...l,
          deletingCompany: company.companyId
        }));
        this.integrationService
          .deleteQuickbooksPayrollCompany(company.companyId)
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
            if (res?.success) {
              this.alertService.successAlert({
                content: res.message ?? '',
                close: true
              });
              this.getDetails();
            } else if (res?.errorMsg) {
              this.alertService.warningAlert({ content: res.errorMsg });
            }
          });
      });
  }

  // ---------- Modal openers ----------

  /**
   * Opens the pay period list for a company.
   * @param company Company the pay runs belong to.
   */
  openPayrollList(company: IQuickbooksPayrollCompany): void {
    this.dialog
      .open(V4QuickbooksPayrollListModalComponent, {
        maxWidth: '900px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { company }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getDetails());
  }

  /**
   * Opens the bank account mapping table.
   */
  openBankMappingModal(): void {
    this.dialog.open(V4QuickbooksPayrollBankMappingModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }
}

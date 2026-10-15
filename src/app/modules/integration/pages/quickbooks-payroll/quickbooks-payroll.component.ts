import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { IQuickbooksPayrollCompany } from 'src/app/modules/integration/model/integration';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { QuickbooksPayrollListComponent } from './quickbooks-payroll-list/quickbooks-payroll-list.component';

/**
 * QuickBooks Online Payroll integration page.
 *
 * On load it calls the details endpoint, which drives the connected badge on
 * the card and the company table. Companies are only listed when the response
 * returns them; otherwise the table stays empty.
 */
@Component({
  selector: 'app-quickbooks-payroll',
  templateUrl: './quickbooks-payroll.component.html',
  styleUrls: ['./quickbooks-payroll.component.scss'],
  standalone: true,
  imports: [
    NgOptimizedImage,
    OcwBackButtonComponent,
    CustomerSupportComponent,
    CommonButtonV35Component,
    FontAwesomeModule,
    QuickbooksPayrollListComponent
  ]
})
export class QuickbooksPayrollComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  faTrash = faTrash;

  /**
   * Connection state driving the whole page, taken from `module.isConnected`.
   */
  isConnected = false;

  /**
   * Badge text on the card, taken from `module.status`.
   */
  status = '';

  /**
   * Companies returned by the details endpoint.
   */
  companies: IQuickbooksPayrollCompany[] = [];

  /**
   * True from the click until the browser leaves for Intuit, so the button
   * reads "Connecting..." and cannot be fired again.
   */
  connecting = false;

  /**
   * Shows the payroll list instead of the company table.
   */
  showPayrollList = false;

  /**
   * Company whose payrolls are being listed. Its `companyId` is the Intuit
   * realmId the pay runs are fetched and imported with.
   */
  selectedCompany: IQuickbooksPayrollCompany | null = null;

  /**
   * Instructions shown in the right rail.
   */
  readonly instructions: string[] = [
    'Click on Connect',
    'Authenticate with QuickBooks Online Payroll credentials',
    'All companies from QuickBooks Online Payroll will be listed',
    'Click on view to see the payrolls',
    'Click on create check to import checks from each payroll'
  ];

  ngOnInit(): void {
    this.handleConnectCallback();
    this.getDetails();
  }

  /**
   * Reads the `connected` query param the backend callback redirects back with
   * and shows the matching alert. The param is then dropped from the URL so a
   * reload does not repeat the alert.
   */
  handleConnectCallback(): void {
    const connected = this.route.snapshot.queryParamMap.get('connected');
    if (connected === null) {
      return;
    }
    if (connected === '1') {
      this.alertService.successAlert({
        content: 'QuickBooks Online Payroll connected successfully.',
        close: true,
        timeout: 1200
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

  /**
   * Loads the module card state and the connected companies.
   */
  getDetails(): void {
    this.integrationService
      .getQuickbooksPayrollDetails()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isConnected = !!res?.data?.module?.isConnected;
        this.status = res?.data?.module?.status ?? '';
        this.companies = res?.data?.companies ?? [];
      });
  }

  /**
   * Connect / Connect New Company. Fetches the Intuit authorization URL and
   * sends the browser to it as a full-page redirect.
   */
  onConnect(): void {
    if (this.connecting) {
      return;
    }
    this.connecting = true;
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
          this.connecting = false;
          if (res?.errorMsg) {
            this.alertService.warningAlert({ content: res.errorMsg });
          }
        },
        error: () => {
          this.connecting = false;
        }
      });
  }

  /**
   * Navigates to the bank account mapping page.
   */
  onMapCompany(): void {
    this.router.navigate(['manage/thirdparty_app/quickbooks-payroll/mapping']);
  }

  /**
   * Opens the payroll list for a company.
   * @param company Company the payrolls belong to.
   */
  goToPayrollList(company: IQuickbooksPayrollCompany): void {
    this.selectedCompany = company;
    this.showPayrollList = true;
  }

  /**
   * Returns from the payroll list to the company table. The details are
   * reloaded so the LAST RUN reflects any checks created from the list.
   */
  onPayrollListBack(): void {
    this.showPayrollList = false;
    this.selectedCompany = null;
    this.getDetails();
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
        if (!confirmed) {
          return;
        }
        this.disconnect();
      });
  }

  /**
   * Calls the disconnect endpoint and alerts with the message returned by the
   * API.
   */
  private disconnect(): void {
    this.integrationService
      .disconnectQuickbooksPayroll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message ?? '',
            close: true,
            timeout: 1200
          });
          this.onPayrollListBack();
          this.getDetails();
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }

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
        if (!confirmed) {
          return;
        }
        this.removeCompany(company.companyId);
      });
  }

  /**
   * Calls the delete endpoint and alerts with the message returned by the API.
   * @param companyId Intuit realmId of the company.
   */
  private removeCompany(companyId: string): void {
    this.integrationService
      .deleteQuickbooksPayrollCompany(companyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message ?? '',
            close: true,
            timeout: 1200
          });
          this.getDetails();
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }
}

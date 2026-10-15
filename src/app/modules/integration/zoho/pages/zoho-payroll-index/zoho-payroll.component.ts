import { LocationStrategy, NgIf, NgStyle, NgFor } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { IConnectedThirdPartyData } from '../../../model/integration';
import { IApiResMesssage } from 'src/app/models/api';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { ZohoPayrollImportPayPeriodComponent } from '../../components/zoho-payroll-import-pay-period/zoho-payroll-import-pay-period.component';
import { MatTooltip } from '@angular/material/tooltip';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing Zoho Payroll integration.
 */
@Component({
  selector: 'app-zoho-payroll',
  templateUrl: './zoho-payroll.component.html',
  styleUrls: ['./zoho-payroll.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    NgIf,
    NgStyle,
    NgFor,
    MatTooltip,
    ZohoPayrollImportPayPeriodComponent,
    CustomerSupportComponent
  ]
})
export class ZohoPayrollComponent implements OnInit, OnDestroy {
  providerCode = 'zoho_payroll';
  subscriptions: Subscription[] = [];
  PayPeriodData?: IApiResMesssage;
  zohoPayrollData: IConnectedThirdPartyData;
  selectedCompanyId: string;
  isConnected: number;
  utils = Utils;
  instructions: string[] = [
    'Click on Connect',
    'Authenticate with Zoho Payroll credentials',
    'Click on Import Companies',
    'Click on view icon to see payroll details',
    'Click on download icon to import checks'
  ];

  loading = {
    defaultLoading: false,
    companyLoading: undefined as number | undefined,
    importCompany: false
  };

  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private locationStrategy: LocationStrategy
  ) {
    // Disable browser back button
    history.pushState(null, '', location.href);
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', location.href);
    });
  }

  ngOnInit(): void {
    this.getZohoPayrollData();
    this.getQueryParams();
  }

  /**
   * Get query parameters from the URL.
   */
  getQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res.code && res.state && res.location) {
        this.onCallBackFromZohoPayroll(res);
      }
    });
  }

  /**
   * Get Zoho Payroll integration data.
   */
  getZohoPayrollData(): void {
    this.loading.defaultLoading = true;

    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .pipe(finalize(() => (this.loading.defaultLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.zohoPayrollData = res.data;
            this.isConnected = res.data.connected;
          }
        })
    );
  }

  /**
   * Handle the callback from Zoho Payroll after authentication.
   * @param params - Query parameters from the callback URL.
   */
  onCallBackFromZohoPayroll(params: Params): void {
    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }

    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .connectCallBack(getParams, this.providerCode)
        .subscribe(
          (res) => {
            if (res.success) {
              this.router.navigate([]);
              this.getZohoPayrollData();
              this.openSuccessAlert('Successfully connected.');
            }
          },
          (error) => {
            if (error) {
              this.router.navigate([]);
              this.loading.defaultLoading = false;
            }
          }
        )
    );
  }

  /**
   * Connect to Zoho Payroll integration.
   */
  onConnectZohoPayroll(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .getConnectionUrl(this.providerCode)
        .pipe(finalize(() => (this.loading.defaultLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            window.open(res?.redirectUrl, '_self');
          }
        })
    );
  }

  /**
   * Disconnect from Zoho Payroll integration.
   */
  onDisconnectToZohoPayroll() {
    const _dialogRef = this.openConfirmAlert(
      'Are you sure you want to disconnect?'
    );
    _dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading.defaultLoading = true;
        this.subscriptions.push(
          this._integrationService
            .disConnectionZohoPayroll()
            .pipe(finalize(() => (this.loading.defaultLoading = false)))
            .subscribe((res) => {
              if (res.success) {
                this.openSuccessAlert(res.message);
                this.getZohoPayrollData();
              }
            })
        );
      }
    });
  }

  /**
   * Import companies from Zoho Payroll.
   */
  importCompany(): void {
    this.loading.importCompany = true;
    this.subscriptions.push(
      this._integrationService
        .importZohoCompany(this.providerCode)
        .pipe(finalize(() => (this.loading.importCompany = false)))
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert(
              res.message ? res.message : 'Companies added successfully'
            );
            if (res.message !== 'No Company available to add') {
              this.PayPeriodData = undefined;
              this.getZohoPayrollData();
            }
          }
        })
    );
  }

  /**
   * Import payroll pay period data for a specific company.
   * @param companyId - The ID of the selected company.
   * @param i - The index of the company in the list.
   */
  importPayPeriod(companyId: string, i: number): void {
    this.selectedCompanyId = companyId;
    this.loading.companyLoading = i;

    this.subscriptions.push(
      this._integrationService
        .importPayrollPayPeriod(companyId)
        .pipe(finalize(() => (this.loading.companyLoading = undefined)))
        .subscribe((res) => {
          if (res?.success) {
            this.PayPeriodData = res;
          }
        })
    );
  }

  /**
   * Handle the popstate event to disable browser back button.
   */
  @HostListener('window:popstate', ['$event']) //remove query params when go back
  onPopState() {
    this.goBack();
  }

  /**
   * Navigate back to the previous page.
   */
  goBack(): void {
    setTimeout(() => {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }, 100);
  }

  /**
   * Open a confirmation alert dialog.
   * @param content - The content of the confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Open a success alert dialog.
   * @param content - The content of the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Navigate to the bank account mapping page.
   */
  viewBankAccounts() {
    this.router.navigate([
      '/manage/thirdparty_app/zoho/zoho_payroll/bank-maps'
    ]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

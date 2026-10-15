import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Utils } from 'src/app/data/utils';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { XeroImportDataModalComponent } from '../../modals/xero-import-data-modal/xero-import-data-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { XeroSettingsModalComponent } from '../../modals/xero-settings-modal/xero-settings-modal.component';
import {
  IConnectedCompanyList,
  IConnectedThirdPartyData
} from '../../../model/integration';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgStyle, NgIf, NgFor, NgClass } from '@angular/common';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing Xero integration.
 */
@Component({
  selector: 'app-xero-home',
  templateUrl: './xero-home.component.html',
  styleUrls: ['./xero-home.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    NgStyle,
    NgIf,
    NgFor,
    NgClass,
    MatTooltip,
    CustomerSupportComponent
  ]
})
export class XeroHomeComponent implements OnInit, OnDestroy {
  instructions: string[] = [
    'Click on connect',
    'Authenticate with your Xero credentials',
    'Click on Import checks  to Import the check',
    'Click on Import Bills  to Import the Bills'
  ];

  providerCode = 'xero' as const;
  subscriptions: Subscription[] = [];
  utils = Utils;
  isConnected: number;
  companyIds: string[];
  xeroData: IConnectedThirdPartyData;

  loading = {
    globalLoading: false,
    defaultLoading: false,
    connecting: undefined as undefined | number,
    disconnecting: undefined as undefined | number
  };
  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private _matdialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getXeroData();
    this.getQueryParams();
  }

  /**
   * Retrieves Xero integration data.
   */
  getXeroData(): void {
    this.loading.defaultLoading = true;

    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .pipe(finalize(() => (this.loading.defaultLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.companyIds = res.data.companies?.map(
              (c: IConnectedCompanyList) => c.companyId
            );
            this.xeroData = res.data;
            this.isConnected = res.data.connected;
            // res.data.companies.forEach((e: any) => {
            //   this.allCompanies.push({ id: e.companyId, name: e.companyName });
            // });
          }
        })
    );
  }

  /**
   * Retrieves query parameters from the URL to handle callback from Xero.
   */
  getQueryParams() {
    this.route.queryParams.subscribe((res) => {
      if (res.code && res.state && res.scope && res.session_state) {
        this.onCallBackFromZohoBooks(res);
      }
    });
  }

  /**
   * Initiates the connection to Xero.
   */
  onConnectToGusto(): void {
    this.loading.globalLoading = true;
    this.loading.connecting = 1;
    this.subscriptions.push(
      this._integrationService
        .getConnectionUrl(this.providerCode)
        .pipe(
          finalize(() => {
            this.loading.globalLoading = false;
            this.loading.connecting = undefined;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            window.open(res?.redirectUrl, '_self');
          }
        })
    );
  }

  /**
   * Handles callback from Xero after successful connection.
   */
  onCallBackFromZohoBooks(params: Params): void {
    // this.initialTime = false;

    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }

    // this.loading.companyLoading = true;
    this.subscriptions.push(
      this._integrationService
        .connectCallBack(getParams, this.providerCode)
        .subscribe(
          (res) => {
            if (res.success) {
              this.router.navigate([]);
              // this.onConnectToGusto();
              this.openSuccessAlert('Successfully connected.');
              this.importCompany();
            }
          },
          (error) => {
            if (error) {
              this.router.navigate([]);
              // this.loading.companyLoading = false;
            }
          }
        )
    );
  }

  /**
   * Imports a company into Xero.
   */
  importCompany() {
    this.subscriptions.push(
      this._integrationService
        .importZohoCompany(this.providerCode)
        .subscribe((res) => {
          if (res.success) this.getXeroData();
        })
    );
  }

  /**
   * Disconnects a company from Xero.
   */
  onDisConnectXero(companyId?: string, i?: number, status?: string): void {
    const dRef = this._alertService.confirmAlert({
      content:
        status == 'Connected'
          ? 'Are you sure you want to disconnect?'
          : 'Are you sure you want to remove this company from the list?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        if (!companyId) {
          this.loading.globalLoading = true;
        } else {
          this.loading.disconnecting = i;
        }

        this.subscriptions.push(
          this._integrationService
            .disConnectXero({ companyId: companyId })
            .pipe(
              finalize(() => {
                this.loading.disconnecting = undefined;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.getXeroData();
                this.openSuccessAlert('Successfully Disconnected.');
              }
            })
        );
      }
    });
  }

  /**
   * Opens the import modal for Bills or Checks.
   */
  importBillsAndChecks(type: 'Bills' | 'Checks', companyId?: string): void {
    this._matdialog.open(XeroImportDataModalComponent, {
      maxWidth: '319px',
      disableClose: true,
      width: '60%',
      data: {
        companies: this.xeroData?.companies,
        type: type,
        selectedCompanyId: companyId
      }
    });
  }

  /**
   * Opens the Xero settings modal.
   */
  settings() {
    this._matdialog.open(XeroSettingsModalComponent, {
      maxWidth: '350px',
      width: '50%'
    });
  }

  /**
   * Navigates to the bank accounts mapping page.
   */
  viewBankAccounts() {
    this.router.navigate(['/manage/thirdparty_app/xero/mapping']);
  }

  /**
   * Opens a success alert with the given content.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

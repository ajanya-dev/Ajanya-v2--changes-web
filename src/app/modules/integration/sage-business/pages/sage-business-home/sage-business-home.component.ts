import { finalize } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  IConnectedCompanyList,
  ISageBusinessData
} from 'src/app/modules/integration/model/integration';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgStyle, NgIf, NgFor, NgClass } from '@angular/common';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';

/**
 * Component for Sage Business integration home page.
 */
@Component({
  selector: 'app-sage-business-home',
  templateUrl: './sage-business-home.component.html',
  styleUrls: ['./sage-business-home.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    NgStyle,
    NgIf,
    NgFor,
    MatTooltip,
    NgClass,
    CustomerSupportComponent,
    WhiteLabelPipe
  ]
})
export class SageBusinessHomeComponent implements OnInit, OnDestroy {
  /**
   * Array of instructions for connecting to Sage Business.
   */
  instructions: string[] = [
    'Click on connect',
    'Authenticate with your sage business credentials'
  ];

  /**
   * Provider code for Sage Business integration.
   */
  providerCode = 'sage_business' as const;

  /**
   * Array of subscriptions to manage cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Utility functions.
   */
  utils = Utils;

  /**
   * Indicates the connection status (0 or 1).
   */
  isConnected: number;

  /**
   * Array of company IDs.
   */
  companyIds: string[];

  /**
   * Sage Business integration data.
   */
  sageBusinessData: ISageBusinessData;

  /**
   * Loading flags for different operations.
   */
  loading = {
    globalLoading: false,
    defaultLoading: false,
    disconnecting: false,
    connecting: false
  };

  /**
   * Constructor for the Sage Business Home component.
   * @param {Router} router - The Angular router.
   * @param {IntegrationService} _integrationService - The integration service.
   * @param {ActivatedRoute} route - The activated route.
   * @param {AlertService} _alertService - The alert service.
   * @param {MatDialog} __dialog - Reference to the MatDialog service.
   */
  constructor(
    private router: Router,
    private _integrationService: IntegrationService,
    private route: ActivatedRoute,
    private _alertService: AlertService,
    public __dialog: MatDialog
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this.getSageData();
    this.getQueryParams();
  }

  /**
   * Fetch Sage Business integration data.
   */
  getSageData(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.companyIds = res?.data?.companies?.map(
              (c: { companyId: string }) => c.companyId
            );
            this.sageBusinessData = res?.data;
            this.isConnected = res?.data?.connected;
          }
        })
    );
  }

  /**
   * Get query parameters and handle callback from Sage Business.
   */
  getQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res.code && res.state && res.country) {
        this.onCallBackFromSageBusiness(res);
      }
    });
  }

  /**
   * Connect to Sage Business.
   */
  onConnectSageBusiness(): void {
    this.loading.connecting = true;
    this.subscriptions.push(
      this._integrationService
        .getConnectionUrl(this.providerCode)
        .pipe(
          finalize(() => {
            this.loading.connecting = false;
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
   * Handle callback from Sage Business after authentication.
   * @param {Object} params - Query parameters received from Sage Business callback.
   */
  onCallBackFromSageBusiness(params: { [key: string]: string }): void {
    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }
    this.loading.connecting = true;
    this.subscriptions.push(
      this._integrationService
        .connectCallBack(getParams, this.providerCode)
        .pipe(
          finalize(() => {
            this.loading.connecting = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              this.router.navigate([]);
              this.openSuccessAlert('Successfully connected.');
              this.importCompany();
            }
          },
          (error) => {
            if (error) {
              this.router.navigate([]);
            }
          }
        )
    );
  }

  /**
   * Import company data from Sage Business.
   */
  importCompany(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .importZohoCompany(this.providerCode)
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = true;
          })
        )
        .subscribe((res) => {
          if (res.success) this.getSageData();
        })
    );
  }

  /**
   * Disconnect from Sage Business.
   */
  onDisconnectToSageBusiness(): void {
    const confirm = this.openConfirmAlert(
      `Are you sure you want to disconnect?`
    );
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.loading.disconnecting = true;
        this.subscriptions.push(
          this._integrationService
            .disconnectCompany(this.providerCode)
            .pipe(
              finalize(() => {
                this.loading.disconnecting = false;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.getSageData();
                this.openSuccessAlert('Disconnected successfully.');
              }
            })
        );
      }
    });
  }

  /**
   * View bank accounts mapped in Sage Business.
   */
  viewBankAccounts(): void {
    this.router.navigate(['/manage/thirdparty_app/sage-business/mapping']);
  }

  /**
   * Import payee data from Sage Business.
   */
  importPayee() {
    const sendingData = {
      mode: environment.env_id === 'compass'? 'Vendors':'Payees',
      companyList: this.sageBusinessData?.companies
    };

    if (this.isConnected) {
      const dialogRef: MatDialogRef<
        CompanySelectModalComponent,
        {
          mode: string;
          companyList: IConnectedCompanyList[];
          companyId: string;
        }
      > = this.__dialog.open(CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          if (sendingData.mode == 'Payees') {
            this.importPayeeFromCompany(res.companyId);
          }
        }
      });
    }
  }

  /**
   * Import payee data from a specific company in Sage Business.
   * @param {string} companyId - The ID of the company to import payee data from.
   */
  importPayeeFromCompany(companyId: string) {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .getImportBankAccounts(
          {
            companyId: companyId,
            importType: 5
          },
          this.providerCode
        )
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            const whiteLabelPayee = environment.env_id === 'compass'? 'Vendors':'Payees';
            this.openSuccessAlert(`${whiteLabelPayee} imported successfully.`);
          }
        })
    );
  }

  /**
   * Open a success alert dialog.
   * @param {string} content - The content to display in the alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Open a confirmation alert dialog.
   * @param {string} content - The content to display in the confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

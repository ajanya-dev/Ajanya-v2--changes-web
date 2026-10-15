import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IConnectedThirdPartyData } from 'src/app/modules/integration/model/integration';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { WaveImportPayeeModalComponent } from '../../modals/wave-import-payee-modal/wave-import-payee-modal.component';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgStyle, NgIf, NgFor, NgClass } from '@angular/common';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';

/**
 * Component for the Wave Home page.
 */
@Component({
  selector: 'app-wave-home',
  templateUrl: './wave-home.component.html',
  styleUrls: ['./wave-home.component.scss'],
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
export class WaveHomeComponent implements OnInit, OnDestroy {
  /**
   * List of instructions for using the Wave integration
   */
  instructions: string[] = [
    'Click on connect',
    'Authenticate with your Wave credentials',
    'Click on Import Invoice to Import the invoice'
  ];

  /**
   * Provider code for Wave integration
   */
  providerCode = 'wave' as const;

  /**
   * Array to store subscription references
   */
  subscriptions: Subscription[] = [];

  /**
   * Utility functions
   */
  utils = Utils;

  /**
   * Flag to check if Wave is connected
   */
  isConnected: number;

  /**
   * List of company IDs
   */
  companyIds: string[];

  /**
   *  Wave integration data
   */
  waveData: IConnectedThirdPartyData;

  /**
   * Loading indicators
   */
  loading = {
    globalLoading: false,
    defaultLoading: false,
    importLoading: false,
    connecting: undefined as undefined | number,
    disconnecting: undefined as undefined | number
  };

  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    public __dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getWaveData();
    this.getQueryParams();
  }

  /**
   * Retrieves Wave integration data.
   */
  getWaveData(): void {
    this.loading.defaultLoading = true;

    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .pipe(finalize(() => (this.loading.defaultLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.companyIds = res.data.companies?.map(
              (c: { companyId: string }) => c.companyId
            );
            this.waveData = res.data;
            this.isConnected = res.data.connected;
          }
        })
    );
  }

  /**
   * Retrieves query parameters and handles callback from Wave.
   */
  getQueryParams() {
    this.route.queryParams.subscribe((res) => {
      if (res.code && res.state) {
        this.onCallBackFromWave(res);
      }
    });
  }

  /**
   * Initiates the connection to Wave service.
   */
  onConnectToWave(): void {
    this.loading.globalLoading = true;
    this.loading.connecting = 1;
    this.loading.defaultLoading = true;
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
   * Disconnects from Wave.
   * @param companyId Company ID to disconnect from.
   * @param i Index of the company.
   */
  onDisonnectToWave(companyId?: string, i?: number): void {
    const dRef = this._alertService.confirmAlert({
      content: 'Are you sure you want to disconnect?'
    });
    this.loading.defaultLoading = true;
    dRef.afterClosed().subscribe((res) => {
      this.loading.defaultLoading = false;
      if (res) {
        if (!companyId) {
          this.loading.globalLoading = true;
        } else {
          this.loading.disconnecting = i;
        }
        this.loading.defaultLoading = true;
        this.subscriptions.push(
          this._integrationService
            .disConnectWave({ companyId: companyId })
            .pipe(
              finalize(() => {
                this.loading.disconnecting = undefined;
              })
            )
            .subscribe((res) => {
              this.loading.defaultLoading = false;
              if (res.success) {
                this.getWaveData();
                this.openSuccessAlert('Successfully Disconnected.');
              }
            })
        );
      }
    });
  }

  /**
   * Handles callback from Wave with query parameters.
   * @param params Query parameters from the callback.
   */
  onCallBackFromWave(params: Params): void {
    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }
    this.subscriptions.push(
      this._integrationService
        .connectCallBack(getParams, this.providerCode)
        .subscribe(
          (res) => {
            this.loading.defaultLoading = false;
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
   * Imports company data from Wave.
   */
  importCompany() {
    this.subscriptions.push(
      this._integrationService
        .importZohoCompany(this.providerCode)
        .subscribe((res) => {
          if (res.success) this.getWaveData();
        })
    );
  }

  /**
   * Navigates to the bank accounts mapping page.
   */
  viewBankAccounts() {
    this.router.navigate(['/manage/thirdparty_app/wave/mappingTest']);
  }

  /**
   * Initiates the import of payee details.
   */
  importPayeeDetails() {
    const sendingData = {
      mode: 'Bank',
      companyList: this.waveData?.companies
    };
    this.loading.importLoading = true;
    if (this.isConnected) {
      const dialogRef = this.__dialog.open(WaveImportPayeeModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        this.loading.importLoading = false;
        if (res) {
          if (sendingData.mode == 'Bank') {
            this.importPayeeFromCompany(res.companyId);
          }
        }
      });
    }
  }

  /**
   * Imports payee details from a specific company.
   * @param companyId Company ID to import from.
   */
  importPayeeFromCompany(companyId: string) {
    this.loading.importLoading = true;
    this.subscriptions.push(
      this._integrationService
        .getImportWaveCompanies({
          importTime: 1,
          companyId: companyId,
          importType: 5
        })
        .subscribe((res) => {
          this.loading.importLoading = false;
          if (res?.success) {
            this.openSuccessAlert(res.message);
            this.getWaveData();
          }
        })
    );
  }

  /**
   * Opens a success alert with the provided content.
   * @param content Content for the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true,
      timeout: 2000
    };
    return this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

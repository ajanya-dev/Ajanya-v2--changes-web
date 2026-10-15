import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IConnectedThirdPartyData } from 'src/app/modules/integration/model/integration';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { FreshbooksSettingsModalComponent } from '../../modals/freshbooks-settings-modal/freshbooks-settings-modal.component';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { NgStyle, NgIf, NgFor, NgClass } from '@angular/common';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

@Component({
  selector: 'app-freshbooks-home',
  templateUrl: './freshbooks-home.component.html',
  styleUrls: ['./freshbooks-home.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    NgStyle,
    NgIf,
    NgFor,
    NgClass,
    CustomerSupportComponent
  ]
})
export class FreshbooksHomeComponent implements OnInit, OnDestroy {
  instructions: string[] = [
    'Click on connect',
    'Authenticate with your FreshBooks credentials'
  ];
  providerCode = 'freshbooks' as const;
  subscriptions: Subscription[] = [];
  utils = Utils;
  isConnected: number;
  companyIds: string[];
  freshbooksData: IConnectedThirdPartyData;
  source = signal<string>('');
  isSettingsOpen = signal<boolean>(false);

  loading = {
    globalLoading: false,
    defaultLoading: false,
    connecting: undefined as undefined | number,
    disconnecting: undefined as undefined | number,
    importCompany: false
  };

  constructor(
    private _integrationService: IntegrationService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private _matdialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getFreshbooksData();
    this.getQueryParams();
    this.source.set(history.state?.source);
  }

  /**
   * Retrieves FreshBooks integration data.
   */
  getFreshbooksData(): void {
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
            this.freshbooksData = res.data;
            this.isConnected = res.data.connected;
            if(this.source() === 'payments' && !this.isSettingsOpen()) {
              this.isSettingsOpen.set(true);
              this.settings();
            }
          }
        })
    );
  }

  /**
   * Retrieves query parameters from the URL.
   */
  getQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res.code && res.state) {
        this.onCallBack(res);
      }
    });
  }

  /**
   * Initiates the connection to FreshBooks.
   */
  onConnectToFreshbooks(): void {
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
   * Handles the callback from FreshBooks authentication.
   * @param params - Query parameters received from the callback.
   */
  onCallBack(params: { [key: string]: string }): void {
    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }

    this.subscriptions.push(
      this._integrationService
        .connectCallBack(getParams, this.providerCode)
        .subscribe(
          (res) => {
            if (res.success) {
              this.router.navigate([]);
              this.openSuccessAlert('Successfully connected.');
              this.importCompany();
              this.getFreshbooksData();
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
   * Imports company data from FreshBooks.
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
            this.getFreshbooksData();
          }
        })
    );
  }

  /**
   * Disconnects the FreshBooks connection for a company.
   * @param companyId - The ID of the company to disconnect (optional).
   * @param i - Index of the company in the list (optional).
   */
  onDisConnectFreshbooks(companyId?: string, i?: number): void {
    const message = 'Are you sure you want to disconnect this company?';
    const dRef = this.alertService.confirmAlert({
      content: companyId
        ? message
        : 'All your connected companies will be disconnected. Are you sure you want to continue?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        const data: {
          [key: string]: string | number;
        } = {};
        if (!companyId) {
          this.loading.globalLoading = true;
          data.revoke = 1;
        } else {
          this.loading.disconnecting = i;
          data.companyId = companyId;
        }
        this.loading.defaultLoading = true;

        this.subscriptions.push(
          this._integrationService
            .disConnectFreshbooks(data)
            .pipe(
              finalize(() => {
                this.loading.disconnecting = undefined;
                this.loading.defaultLoading = true;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.getFreshbooksData();
                this.openSuccessAlert('Successfully Disconnected.');
              }
            })
        );
      }
    });
  }

  /**
   * Opens the FreshBooks settings modal.
   */
  settings(): void {
    this._matdialog.open(FreshbooksSettingsModalComponent, {
      maxWidth: '660px',
      width: '80%',
      data: this.freshbooksData,
      disableClose: true
    });
  }

  /**
   * Opens a success alert dialog with the given content.
   * @param content - The content to display in the alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this.alertService.successAlert(data);
  }

  /**
   * Destroy component and unsubscribe from subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

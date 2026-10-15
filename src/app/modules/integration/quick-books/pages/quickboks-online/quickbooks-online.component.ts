import {
  LocationStrategy,
  NgIf,
  NgStyle,
  NgClass,
  NgFor
} from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Data, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { QuickBooksSettingsComponent } from '../../modals/quick-books-settings-modal/quick-books-settings.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IAppConfig } from 'src/app/models/app_settings';
import {
  IQbConnectedCompany,
  IQuickBookOnlineData
} from '../../../model/integration';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing QuickBooks Online integration.
 */
@Component({
  selector: 'app-quickbooks-online',
  templateUrl: './quickbooks-online.component.html',
  styleUrls: ['./quickbooks-online.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    NgIf,
    NgStyle,
    MatTooltip,
    NgClass,
    NgFor,
    CustomerSupportComponent
  ]
})
export class QuickbooksOnlineComponent implements OnInit, OnDestroy {
  /**
   * Configuration settings for the app.
   */
  appConfig: IAppConfig;

  /**
   * Options for tooltip positions.
   */
  matPositionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];

  /**
   * The currently selected tooltip position.
   */
  toolTipPosition = new UntypedFormControl(this.matPositionOptions[3]);

  /**
   * Holds the status of disconnecting from QuickBooks.
   */
  disconnecting: undefined | number = undefined;

  /**
   * Array of subscriptions to manage cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Data representing QuickBooks Online integration.
   */
  quickBookOnlineData: IQuickBookOnlineData;

  /**
   * The number of connected QuickBooks companies.
   */
  isConnected: number;

  /**
   * State of the panel's open/close status.
   */
  panelOpenState = false;

  /**
   * State of the expansion panel.
   */
  expansionPanel = false;

  /**
   * Text for composing an email.
   */
  mailText: string;

  /**
   * User's email address.
   */
  email: string;

  /**
   * Form control for auto-downloading settings.
   */
  autoDownloading = new UntypedFormControl();

  /**
   * Form control for regular voucher printing settings.
   */
  printRegularVoucher = new UntypedFormControl();

  /**
   * Form control for pushback enable settings.
   */
  pushbackEnable = new UntypedFormControl();

  /**
   * Loading indicators for different operations.
   */
  loading = {
    defaultLoading: false,
    companyLoading: false
  };

  /**
   * List of connected QuickBooks companies.
   */
  QbConnectedCompany: IQbConnectedCompany[];

  /**
   * Route data.
   */
  data: Data;

  /**
   * Source of the import.
   */
  source = signal<string>('');

  /**
   * Flag to track if settings modal has been opened for payments source.
   */
  settingsModalOpened = signal<boolean>(false);

  /**
   * Constructor for the QuickBooks Online component.
   * @param {IntegrationService} _integrationService - The integration service.
   * @param {AlertService} _alertService - The alert service.
   * @param {Router} router - The Angular router.
   * @param {ActivatedRoute} route - The activated route.
   * @param {LocationStrategy} locationStrategy - The location strategy for managing browser history.
   * @param {MatDialog} _dialog - The Angular Material dialog service.
   * @param {AppSettingsService} _appSettingService - The app settings service.
   * @param {ScriptService} _scriptService - The script service.
   * @param {LocalStorageService} _localStorageService - The local storage service.
   */
  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private locationStrategy: LocationStrategy,
    private _dialog: MatDialog,
    private _appSettingService: AppSettingsService,
    private _scriptService: ScriptService,
    private _localStorageService: LocalStorageService
  ) {
    this.source.set(history.state?.source);
    // Disable browser back button
    history.pushState(null, '', location.href);
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', location.href);
    });
  }

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this.getQuickBookOnlineData();
    this.getQueryParams();
    this.email = this._localStorageService.getItem('email')!;

    this.subscriptions.push(
      this._appSettingService.appConfig$.subscribe((res) => {
        if (res) {
          this.appConfig = res;
        }
      })
    );

    //get data from route
    this.route.data.subscribe((data: Data) => {
      this.data = data;
    });
  }

  /**
   * Get query parameters from the route.
   */
  getQueryParams(): void {
    this.route.queryParams.subscribe((res: Data) => {
      if (res.code && res.state && res.realmId) {
        this.onCallBackFromQuickBook(res);
      }
    });
  }

  /**
   * Retrieve QuickBooks Online integration data.
   * @param {boolean} fromCallBack - Indicates if the call is from a callback.
   */
  getQuickBookOnlineData(fromCallBack?: boolean): void {
    if (!fromCallBack) {
      this.loading.companyLoading = true;
    }

    this.subscriptions.push(
      this._integrationService
        .getQuickBookOnlineData()
        .pipe(
          finalize(() => {
            this.loading.companyLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.quickBookOnlineData = res.data;
            this.QbConnectedCompany = res.data.companies;
            this.isConnected = res.data.companyCount;
            res.data.autoDownloading
              ? this.autoDownloading.setValue(true)
              : this.autoDownloading.setValue(false);
            res.data.printRegularVoucher
              ? this.printRegularVoucher.setValue(true)
              : this.printRegularVoucher.setValue(false);
            res.data.pushBackEnable
              ? this.pushbackEnable.setValue(true)
              : this.pushbackEnable.setValue(false);
            if(this.source() === 'payments' && !this.settingsModalOpened() && !fromCallBack) {
              this.settingsModalOpened.set(true);
              this.settings();
            }
          }
        })
    );
  }

  /**
   * Handle the callback from QuickBooks.
   * @param {Params} params - Query parameters from the callback.
   */
  onCallBackFromQuickBook(params: Params): void {
    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }

    this.loading.companyLoading = true;
    this.subscriptions.push(
      this._integrationService.quickBookCallBack(getParams).subscribe(
        (res) => {
          if (res.success) {
            this.router.navigate([]);
            this.getQuickBookOnlineData(true);
            this.openSuccessAlert('Successfully added.');
          }
        },
        (error) => {
          if (error) {
            this.router.navigate([]);
            this.loading.companyLoading = false;
          }
        }
      )
    );
  }

  /**
   * Connect to QuickBooks Online.
   */
  onConnectToQuickBooks(): void {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .connectToQuickBooksOnline()
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this._scriptService.gtagEventScript('qbonline-init');
            window.open(res?.redirectUrl, '_self');
          }
        })
    );
  }

  /**
   * Disconnect from a QuickBooks company.
   * @param {string} realmId - The realm ID of the company.
   * @param {string} companyName - The name of the company.
   * @param {number} index - The index of the company in the list.
   */
  onDisconnectToQuickBooks(
    realmId: string,
    companyName: string,
    index: number
  ): void {
    const confirm = this.openConfirmAlert(
      `Are you sure you want to disconnect ${companyName}?`
    );
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.onDisconnectAction(realmId, index);
      }
    });
  }

  /**
   * Perform the disconnect action for a QuickBooks company.
   * @param {string} realmId - The realm ID of the company.
   * @param {number} index - The index of the company in the list.
   */
  onDisconnectAction(realmId: string, index: number): void {
    this.disconnecting = index;
    this.subscriptions.push(
      this._integrationService
        .disconnectToQuickBooksOnline(realmId)
        .pipe(
          finalize(() => {
            this.disconnecting = undefined;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully disconnected.');
            this.quickBookOnlineData.companies.splice(index, 1);
            if (!this.quickBookOnlineData.companies.length) {
              this.isConnected = 0;
            }
          }
        })
    );
  }

  /**
   * Save QuickBooks Online data.
   */
  postQuickBookOnlineData(): void {
    const data = {
      autoDownloading: this.autoDownloading.value ? '1' : '0',
      printRegularVoucher: this.printRegularVoucher.value ? '1' : '0',
      pushBackEnable: this.pushbackEnable.value ? '1' : '0'
    };

    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .postQuickBookOnlineData(data)
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        //eslint-disable-next-line @typescript-eslint/no-empty-function
        .subscribe(() => {})
    );
  }

  /**
   * Navigate to the company mapping page.
   */
  onMapCompany(): void {
    this.router.navigate([
      'manage/thirdparty_app/quickBooks/quickbooks_online/mapping'
    ]);
  }

  /**
   * Handle window popstate event (remove query params when going back).
   */
  @HostListener('window:popstate', ['$event']) //remove query params when go back
  onPopState() {
    this.goBack();
  }

  /**
   * Go back to the previous page.
   */
  goBack(): void {
    setTimeout(() => {
      if (this.data.backUrl) {
        this.router.navigate([this.data.backUrl]);
      } else {
        this.router.navigate(['/manage/thirdparty_app/index']);
      }
    }, 100);
  }

  /**
   * Navigate to the previous page.
   */
  backUrl() {
    if (this.data.backUrl) {
      this.router.navigate([this.data.backUrl]);
    } else {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }
  }

  /**
   * Open the default email client to send a support email.
   */
  onSupportMail(): void {
    this.mailText = `mailto:${this.email}`;
    window.location.href = this.mailText;
  }

  /**
   * Open a confirmation alert dialog.
   * @param {string} content - The content to display in the dialog.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Open a success alert dialog.
   * @param {string} content - The content to display in the dialog.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Handle the "Bank Import" button click.
   */
  onBankImportClicked() {
    if (this.isConnected) {
      this.openCompanyListModal('Bank');
    }
  }

  /**
   * Handle the "Payee Import" button click.
   */
  onPayeeImportClicked() {
    if (this.isConnected) {
      this.openCompanyListModal('Payee');
    }
  }

  /**
   * Handle the "Category Import" button click.
   */
  onCategoryImportClicked() {
    if (this.isConnected) {
      this.openCompanyListModal('Category');
    }
  }

  /**
   * Open a company list modal dialog.
   * @param {string} mode - The import mode ('Bank', 'Payee', 'Category').
   */
  openCompanyListModal(mode: string) {
    const sendingData = {
      mode: mode,
      companyList: this.quickBookOnlineData?.companies
    };
    const dialogRef = this._dialog.open(CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: sendingData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (sendingData.mode == 'Bank') {
          this.importBankFromCompany(res.realmId);
        }
        if (sendingData.mode == 'Payee') {
          this.importQuickbookPayee(res.realmId);
        }
      }
    });
  }

  /**
   * Import bank data from a QuickBooks company.
   * @param {string} realmId - The realm ID of the company.
   */
  importBankFromCompany(realmId: string) {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .importQuickbookBanks(realmId)
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully Imported.');
          }
        })
    );
  }

  /**
   * Import payee data from a QuickBooks company.
   * @param {string} realmId - The realm ID of the company.
   */
  importQuickbookPayee(realmId: string) {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .importQuickbookPayee(realmId)
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully Imported.');
          }
        })
    );
  }

  /**
   * Handle the "Search Company" input event.
   * @param {Event} event - The input event.
   */
  onSearchCompany(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    if (inputValue != '') {
      this.quickBookOnlineData.companies =
        this.quickBookOnlineData.companies.filter(
          (element: IQbConnectedCompany) => {
            return element.companyName
              .toLowerCase()
              .includes(inputValue.toLowerCase());
          }
        );
    } else {
      this.quickBookOnlineData.companies = this.QbConnectedCompany;
    }
  }

  /**
   * Open the QuickBooks settings modal dialog.
   */
  settings() {
    if(this.loading.companyLoading) return;
    const dialogRef = this._dialog.open(QuickBooksSettingsComponent, {
      maxWidth: '660px',
      width: '80%',
      data: this.quickBookOnlineData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getQuickBookOnlineData(true);
      }
    });
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

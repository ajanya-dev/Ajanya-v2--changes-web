import {
  LocationStrategy,
  NgStyle,
  NgIf,
  NgClass,
  NgFor,
  NgOptimizedImage
} from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { ActivatedRoute, Router, Params, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  GustoCompanyType,
  IConnectedCompanyList,
  IConnectedThirdPartyData,
  IGustoCompanyData,
  IGustoFetchedCompany,
  IGustoSelectedCompany
} from 'src/app/modules/integration/model/integration';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ISuccessAlert } from '../../../../../models/alert';
import { CreateGustoNewCompanyModalComponent } from '../../modals/create-gusto-new-company-modal/create-gusto-new-company-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { ViewDetailedGustoPayrollComponent } from '../../components/view-detailed-gusto-payroll/view-detailed-gusto-payroll.component';
import { ViewGustoPayrollComponent } from '../../components/view-gusto-payroll/view-gusto-payroll.component';
import { GustoPayrollListComponent } from '../../components/gusto-payroll-list/gusto-payroll-list.component';
import { MatTooltip } from '@angular/material/tooltip';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GustoPaymentListComponent } from '../../components/gusto-payment-list/gusto-payment-list.component';
import { GustoPaymentViewDetailsComponent } from '../../components/gusto-payment-view-details/gusto-payment-view-details.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';

/**
 * Component for Gusto Integration management.
 */
@Component({
  selector: 'app-gusto-integration',
  templateUrl: './gusto-integration.component.html',
  styleUrls: ['./gusto-integration.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    NgStyle,
    NgIf,
    NgClass,
    NgFor,
    MatTooltip,
    GustoPayrollListComponent,
    ViewGustoPayrollComponent,
    ViewDetailedGustoPayrollComponent,
    CustomerSupportComponent,
    NgOptimizedImage,
    CommonButtonV35Component,
    RouterLink,
    FontAwesomeModule,
    GustoPaymentListComponent,
    GustoPaymentViewDetailsComponent,
    TruncatePipe
  ]
})
export class GustoIntegrationComponent implements OnInit, OnDestroy {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private locationStrategy = inject(LocationStrategy);
  private dialogue = inject(MatDialog);

  faTrash = faTrash;

  /**
   * Gusto provider code.
   */
  providerCode = 'gusto' as const;

  /**
   * Array to store subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Selected Gusto company for payroll view.
   */
  gustoData: IConnectedThirdPartyData;
  fetchedGustoData: IGustoCompanyData[];
  isConnected: number;
  autoRunStatus = false;
  utils = Utils;
  allCompanies: { id: string; name: string }[] = [];
  selectedCompany: IGustoSelectedCompany;
  selectedPayrollId: string;
  totalCompany: number;

  /**
   * Flags to control component views.
   */
  getPayrollList = false;
  getOffCycleList = false;
  getPayrollView = false;
  getPayrollDetailedView = false;
  getPaymentList = false;
  getPaymentDetailedView = false;
  isOffCyclePayRoll = false;

  /**
   * Instructions for Gusto integration.
   */
  readonly instructions: string[] = [
    'Click on Connect',
    'Authenticate with Gusto credentials',
    'All companies from Gusto will be listed',
    'Click on view to see the payrolls',
    'Click on create check to import checks from each payroll'
  ];

  /**
   * Loading state flags.
   */
  loading = {
    globalLoading: false,
    connecting: undefined as undefined | number,
    defaultLoading: false,
    companyLoading: false,
    importCompany: undefined as undefined | number,
    autoRun: undefined as undefined | string
  };

  /**
   * Initializes the component and fetches Gusto integration data.
   */
  ngOnInit(): void {
    this.getGustoData();
    this.getQueryParams();
    history.pushState(null, '', location.href);
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', location.href);
    });
  }

  /**
   * @description Retrieves and handles query parameters from the current route.
   */
  getQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res.state && res.code) {
        this.onCallBack(res);
      }
    });
  }

  /**
   * @description Retrieves Gusto integration data, including details and connected companies.
   */
  getGustoData(): void {
    this.loading.defaultLoading = true;

    this.subscriptions.push(
      this.integrationService
        .getDetails(this.providerCode)
        .pipe(finalize(() => (this.loading.defaultLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.gustoData = res.data;
            this.isConnected = res.data.connected;
            res.data.companies.forEach((e: IConnectedCompanyList) => {
              this.allCompanies.push({ id: e.companyId, name: e.companyName });
            });

            if (
              res.data.connected &&
              this.totalCompany !== res.data.connected
            ) {
              this.totalCompany = res.data.connected;
              this.getMyCompanies();
            }
          }
        })
    );
  }

  /**
   * @description Handles the callback when query parameters are received, typically after an external integration authorization.
   * @param {Params} params - The query parameters received from the callback.
   */
  onCallBack(params: Params): void {
    let getParams = '';

    for (const [key, value] of Object.entries(params)) {
      getParams += `${key}=${value}&`;
    }

    this.loading.companyLoading = true;
    this.loading.defaultLoading = true;

    this.subscriptions.push(
      this.integrationService
        .connectCallBack(getParams, this.providerCode)
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
            this.loading.companyLoading = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              this.router.navigate([]);
              this.getGustoData();
              this.openSuccessAlert('Successfully connected.');
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
   * @description Initiates the process to connect to Gusto by obtaining the connection URL and opening it in a new browser window or tab.
   */
  onConnectToGusto(): void {
    this.loading.globalLoading = true;
    this.loading.connecting = 1;
    this.subscriptions.push(
      this.integrationService
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
   * @description Initiates the process to disconnect from Gusto.
   */
  onDisConnectToGusto(): void {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.loading.globalLoading = true;
        this.loading.connecting = 0;
        this.subscriptions.push(
          this.integrationService
            .disConnect(this.providerCode)
            .pipe(
              finalize(() => {
                this.loading.globalLoading = false;
                this.loading.connecting = undefined;
              })
            )
            .subscribe((res) => {
              if (res.success) {
                this.fetchedGustoData = [];
                this.getGustoData();
                this.openSuccessAlert('Successfully Disconnected.');
              }
            })
        );
      }
    });
  }

  /**
   * @description Initiates the process to import a company from Gusto using the provided company ID.
   * @param {string} companyId - The ID of the company to be imported.
   * @param {number} i - An identifier for tracking the import progress.
   */
  importCompany(companyId: string, i: number): void {
    this.loading.importCompany = i;
    this.loading.globalLoading = true;

    this.subscriptions.push(
      this.integrationService
        .importGustoCompany(this.providerCode, companyId)
        .pipe(
          finalize(() => {
            this.loading.importCompany = undefined;
            this.loading.globalLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (res.message !== 'No Company available to add') {
              this.getGustoData();
            }
          }
        })
    );
  }

  /**
   * Automatically run a Gusto company.
   * @param item - Gusto company data.
   * @param index - Index or identifier of the company.
   */
  autoRunCompany(item: IGustoFetchedCompany, index: string): void {
    const importCompany = (id: string) => {
      this.loading.globalLoading = true;
      this.loading.autoRun = index;
      this.subscriptions.push(
        this.integrationService
          .importGustoCompany(this.providerCode, id)
          .subscribe((res) => {
            if (res.success) {
              onAutoRun(id);
            }
          })
      );
    };

    const onAutoRun = (id: string) => {
      this.autoRunStatus = !this.autoRunStatus;

      const data = {
        company_id: id.toString(),
        status: this.autoRunStatus ? 1 : 0
      };

      this.loading.globalLoading = true;
      this.loading.autoRun = index;
      this.subscriptions.push(
        this.integrationService
          .autoRunGustoCompany(data)
          .pipe(
            finalize(() => {
              this.loading.autoRun = undefined;
              this.loading.globalLoading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              afterAutoRunSuccess();
            }
          })
      );
    };

    const afterAutoRunSuccess = () => {
      if (index.includes('fetched')) {
        this.getMyCompanies();
        this.getGustoData();
        return;
      }

      this.gustoData.companies.filter(
        (r: IConnectedCompanyList, i: number | string) => {
          if (r?.uuid) {
            i = i + 'fetched';
          } else {
            i = i + 'imported';
          }

          if (index === i) {
            if (r.runPayroll) r.runPayroll = 0;
            else r.runPayroll = 1;
          }
        }
      );
    };

    if (item?.id) {
      /** When click get my companies. */
      importCompany(item.id);
    } else {
      onAutoRun(item.companyId);
    }
  }

  /**
   * @description Retrieves the list of companies associated with the current user from the Gusto integration service.
   */
  getMyCompanies(): void {
    this.loading.globalLoading = true;
    this.subscriptions.push(
      this.integrationService
        .getMyCompanies()
        .pipe(
          finalize(() => {
            this.loading.globalLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const existing = this.gustoData.companies;
            const imported = res.data;
            this.importCompany(res.data[0]?.uuid, 1);
            this.fetchedGustoData = this.filterImported(existing, imported);
          }
        })
    );
  }

  /**
   * @description Initiates the process to delete a connected company from Gusto.
   * @param {IConnectedCompanyList} item - The connected company to be removed.
   * @param {number} i - An identifier for tracking the index of the company in the list.
   */
  deleteCompany(item: IConnectedCompanyList, i: number): void {
    const alert = this.alertService.confirmAlert({
      content: `Are you sure you want to remove ${item.companyName}?`
    });
    alert.afterClosed().subscribe((r) => {
      if (r) {
        this.subscriptions.push(
          this.integrationService
            .deleteGustoCompany(item.companyId)
            .subscribe((res) => {
              if (res.success) {
                this.gustoData.companies.splice(i, 1);
                this.openSuccessAlert('Company Removed.');
                if (this.gustoData.companies.length === 0) {
                  this.getGustoData();
                }
              }
            })
        );
      }
    });
  }

  /**
   * @description Filters out companies from the imported list that already exist in the existing list.
   * @param {IConnectedCompanyList[]} existing - The list of existing connected companies.
   * @param {IGustoCompanyData[]} imported - The list of companies to be filtered.
   * @returns {IGustoCompanyData[]} - The filtered list of companies.
   */
  filterImported(
    existing: IConnectedCompanyList[],
    imported: IGustoCompanyData[]
  ): IGustoCompanyData[] {
    const filtered: IGustoCompanyData[] = imported.filter(
      (imp: IGustoCompanyData) =>
        !existing.some(
          (ex: IConnectedCompanyList) =>
            Number(imp.id) === Number(ex.companyId) || imp.uuid === ex?.uuid
        )
    );
    return filtered;
  }

  /**
   * @description Navigates to the view page for a specific Gusto company based on the provided company ID and type.
   * @param {string} companyId - The ID of the Gusto company to view.
   * @param {GustoCompanyType} type - The type of the Gusto company.
   */
  goToViewPage(companyId: string, type: GustoCompanyType): void {
    this.getPayrollView = true;
    this.selectedCompany = { id: companyId, type };
  }

  /**
   * @description Navigates to the payroll list for a specific Gusto company based on the provided company ID.
   * @param {string} companyId - The ID of the Gusto company for which to display the payroll list.
   */
  goToPayrollList(companyId: string, companyName: string): void {
    this.getPayrollList = true;
    this.selectedCompany = { id: companyId, companyName: companyName, type: null };
  }

  /**
   * @description Navigates to the payroll list for a specific Gusto company based on the provided company ID.
   * @param {string} companyId - The ID of the Gusto company for which to display the payroll list.
   */
  goToOffCycleList(companyId: string, companyName: string ): void {
    this.getOffCycleList = true;
    this.selectedCompany = { id: companyId,  companyName: companyName, type: null };
  }

  /**
   * @description Navigates to the payment list for a specific Gusto company based on the provided company ID.
   * @param {string} companyId - The ID of the Gusto company for which to display the payment list.
   */
  goToPaymentList(companyId: string, companyName: string): void {
    this.getPayrollList = false;
    this.getPayrollView = false;
    this.getPaymentList = true;
    this.selectedCompany = { id: companyId, type: null, companyName };
  }

  /**
   * Opens the create new Gusto company modal dialog.
   */
  openCreateNewCompanyModal(): void {
    this.dialogue.open(CreateGustoNewCompanyModalComponent, {
      maxWidth: '550px',
      width: '93%',
      disableClose: true
    });
  }

  /**
   * @description Navigates to the detailed view of a specific payroll based on the provided payroll ID and selected company ID.
   * @param {Object} ev - An object containing information about the payroll and selected company.
   */
  gotoPayrollDetails(ev: {
    payrollId: string;
    selectedCompanyId: string;
    isOffCycle: boolean
  }): void {
    if (ev) {
      this.isOffCyclePayRoll = ev.isOffCycle;
      this.getPayrollList = false;
      this.getPayrollDetailedView = true;
      this.selectedPayrollId = ev.payrollId;
      this.selectedCompany = { id: ev.selectedCompanyId, type: null };
    }
  }

  /**
   * @description Navigates to the detailed view of a specific payroll based on the provided payroll ID and selected company ID.
   * @param {Object} ev - An object containing information about the payroll and selected company.
   */
  gotoOffCycleDetails(ev: {
    payrollId: string;
    selectedCompanyId: string;
    isOffCycle: boolean
  }): void {
    if (ev) {
      this.isOffCyclePayRoll = ev.isOffCycle;
      this.getOffCycleList = false;
      this.getPayrollDetailedView = true;
      this.selectedPayrollId = ev.payrollId;
      this.selectedCompany = { id: ev.selectedCompanyId, type: null };
    }
  }

  /**
   * @description Navigates to the payroll list for a specific Gusto company based on the provided company ID.
   * @param {string} ev - The ID of the Gusto company for which to display the payroll list.
   */
  onGotoPayrollList(ev: string): void {
    if (ev) {
      this.selectedCompany = { id: ev, type: null };
      this.getPayrollView = false;
      this.getPayrollList = true;
      this.getOffCycleList = true;
    }
  }

  onGotoPaymentDetails(ev: { contractorId: string }): void {
    if (ev) {
      this.selectedCompany.contractorId = ev.contractorId;
      this.getPaymentList = false;
      this.getPaymentDetailedView = true;
    }
  }

  /**
   * @description Handles the back button press event and updates component properties based on the provided event information.
   * @param {Object} ev - An object containing information about the back button press.
   */
  backButtonPressed(ev: { clicked: boolean; type?: string }): void {
    if (ev.type === 'payroll_view') {
      this.getPayrollList = true;
    } else {
      this.getPayrollList = !ev.clicked;
      this.getOffCycleList = !ev.clicked;
    }
    if (ev.type === 'off-cycle-payroll-view') {
      this.getOffCycleList = true;
    }
    if (ev.type === 'payments-view') {
      this.getPaymentDetailedView = false;
      this.getPayrollView = false;
      this.getPayrollDetailedView = false;
      this.getPaymentList = true;
      return;
    }
    this.getPayrollView = !ev.clicked;
    this.getPayrollDetailedView = !ev.clicked;
    this.getPaymentList = !ev.clicked;
  }

  /**
   * Checks if the "Get Companies" button is visible.
   * @returns True if the button is visible, otherwise false.
   */
  get getCompaniesBtnVisible(): boolean {
    if (
      this.getPayrollList ||
      this.getPayrollView ||
      this.getPayrollDetailedView
    )
      return false;
    else return true;
  }

  @HostListener('window:popstate', ['$event']) //remove query params when go back
  onPopState() {
    this.goBack();
  }

  /**
   * @description Navigates back to the third-party app index page after a short delay.
   */
  goBack(): void {
    setTimeout(() => {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }, 100);
  }

  /**
   * @description Navigates to the company mapping page for Gusto within the third-party app management section.
   */
  onMapCompany(): void {
    this.router.navigate(['manage/thirdparty_app/gusto/mapping']);
  }

  /**
   * @description Opens a success alert with the specified content and configuration.
   * @param {string} content - The content message to be displayed in the success alert.
   */
  openSuccessAlert(content: string) {
    const data: ISuccessAlert = {
      content,
      close: true,
      timeout: 1200
    };
    return this.alertService.successAlert(data);
  }

  /**
   * Method for navigating to gusto
   */
  openGusto() {
    this.subscriptions.push(
      this.integrationService.openGusto().subscribe({
        next: (res) => {
          if (res.success) {
            window.open(res.data.url);
          }
        },
        error: (err) => {
          this.alertService.warningAlert({ content: err.error.errorMsg });
        }
      })
    );
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

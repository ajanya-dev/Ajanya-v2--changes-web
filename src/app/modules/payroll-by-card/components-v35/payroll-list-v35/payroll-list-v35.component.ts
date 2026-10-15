import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgIf, NgFor, NgClass, JsonPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { payrollList } from 'src/app/data/data/payroll';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'dexie';
import { finalize } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { environment } from 'src/environments/environment';
import { BusinessNameModalComponent } from '../../components/business-name-modal/business-name-modal.component';
import { SearchFilterPipe } from '../../../../pipes/search-filter.pipe';
import { TruncatePipe } from '../../../../pipes/truncate.pipe';
import { CommonListSkeltonComponent } from '../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { PayrollConnectionModalComponent } from '../../components/payroll-connection-modal/payroll-connection-modal.component';
import { PayrollService } from '../../services/payroll.service';
import { ListHeaderV35Component } from '../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';
import { V35CommonDropDownSelectorComponent } from '../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';

@Component({
  selector: 'app-payroll-list-v35',
  templateUrl: './payroll-list-v35.component.html',
  styleUrls: ['./payroll-list-v35.component.scss'],
  standalone: true,
  imports: [
    V35CommonDropDownSelectorComponent,
    ListHeaderV35Component,
    NgIf,
    NgFor,
    NgClass,
    FaIconComponent,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    CommonListSkeltonComponent,
    JsonPipe,
    TruncatePipe,
    SearchFilterPipe
  ]
})
export class PayrollListV35Component implements OnInit, OnDestroy {
  AppsList = payrollList.payrollApps();
  payrollAppData: IPayrollApps[] = [];
  payrollData: IPayrollApps[] = [];
  payrollSearchInput: string;
  selectedAccount: IPayrollApps;
  showDropDown: boolean;
  subscriptions: Subscription[] = [];
  loading = false;
  newBusiness: boolean;
  gustoRegex = /gusto/gi;
  paychexRegex = /paychex/gi;
  zohoRegex = /zoho payroll/gi;
  kybBypassedUser = 0;
  kycCompleted?: number;
  environment = environment;

  private payrollService = inject(PayrollService);
  alertService = inject(AlertService);
  private integrationService = inject(IntegrationService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private gettingStartedService = inject(GettingStartedService);

  ngOnInit(): void {
    this.gettingStartedService.getGettingStarted().subscribe((response) => {
      if (response) {
        this.kycCompleted = response.kycStatus ?? undefined;
      }
    });
    this.route.queryParams.subscribe((params) => {
      this.newBusiness = params.newBusiness;
    });
    this.getPayrollApps();
    this.isAppConnected();
  }

  /**
   * @description -Subscribes to the isConnectedSuccess event and triggers the retrieval of payroll apps when a successful connection to a 3rd party app is detected.
   */
  isAppConnected() {
    this.subscriptions.push(
      this.payrollService.isConnectedSuccess.subscribe(() => {
        this.getPayrollApps();
      })
    );
  }

  /**
   * @description - Retrieves the logo path for the specified app name.
   * @param appName - The name of the app.
   */
  getLogoPath(appName: string): string {
    let query = appName;

    if (appName.match(this.gustoRegex)) {
      query = 'Gusto';
    }
    if (appName.match(this.paychexRegex)) {
      query = 'Paychex';
    }
    if (appName.match(this.zohoRegex)) {
      query = 'Zoho';
    }

    const appData = this.AppsList.find((app) => app.title === query);
    return appData
      ? appData.icon
      : '../../../../../assets/images/integration/manual-payroll.png';
  }

  appendIconData(payrollAppData: IPayrollApps[]): IPayrollApps[] {
    return payrollAppData.map((val) => {
      const app = val;
      if (app.manual) {
        app.icon = ['fas', 'users'];
      } else {
        app.icon = this.getLogoPath(app.name);
      }
      return app;
    });
  }

  /**
   * @description -Retrieves the payroll applications' details and updates the component's data.
   */
  getPayrollApps() {
    this.loading = true;
    this.subscriptions.push(
      this.payrollService
        .getPayrollDetails()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          this.payrollAppData = this.appendIconData(res.data);
          this.payrollData = this.payrollAppData;

          const currentSelection = this.payrollAppData.find(
            (item) => item.id === this.selectedAccount?.id
          );

          if (!currentSelection || this.newBusiness) {
            // Selection is gone (eg. disconnected) or a new business was added.
            // Nothing left to select when the last company is disconnected -
            // the page falls back to the onboarding screen.
            if (!this.payrollAppData.length) return;
            this.selectedAccount = this.newBusiness
              ? this.payrollAppData[this.payrollAppData.length - 1]
              : this.payrollAppData[0];
            this.payrollService.selectedApp = this.selectedAccount;
            this.payrollService.payrollAppId.next(this.selectedAccount);
          } else {
            // Same company stays selected, re-pointed at the fresh object.
            this.selectedAccount = currentSelection;
          }
        })
    );
  }

  /**
   * @description -Updates the selected payroll account and notifies the payrollAppId subject.
   * @param app -The selected payroll account.
   */
  selectPayrollAccount(app: IPayrollApps) {
    if (this.selectedAccount === app) {
      return;
    }
    this.selectedAccount = app;
    this.payrollService.payrollAppId.next(this.selectedAccount);
  }

  /**
   * @description -Disconnects a payroll application connection after confirming with the user.
   * @param appName -The name of the payroll application to disconnect.
   */
  disconnect(app: IPayrollApps) {
    const confirmDisconnect = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect?',
      doneMsg: 'Yes'
    });

    confirmDisconnect.afterClosed().subscribe((result) => {
      if (result) {
        const disconnectObservable = app.manual
          ? this.integrationService.disconnectManualConnection(app.id)
          : this.integrationService.disconnectConnection(app.id);

        this.subscriptions.push(
          disconnectObservable.subscribe((res) => {
            if (res) {
              this.alertService.successAlert({
                content: 'Disconnected Successfully'
              });
              // Triggers getPayrollApps(), which re-selects the first remaining
              // company only when the disconnected one was the selected one.
              this.payrollService.isConnectedSuccess.next(false);
            }
          })
        );
      }
    });
  }

  /**
   * Method for add gusto company
   * if user is a kyb bypassed user, we are just asking the business name only.
   * otherwise we go manual way to create a company.
   */
  addGustoCompany() {
    this.alertService
      .confirmAlert({
        content: `Kindly confirm the addition of Gusto Run for processing payroll via credit card.`
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.dialog.open<BusinessNameModalComponent>(
            BusinessNameModalComponent,
            {
              maxWidth: '440px',
              width: '95%',
              disableClose: true,
              autoFocus: false,
              data: { bypassedFor: 3 }
            }
          );
        }
      });
  }

  jsonParse(data: string) {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  }

  toggleDropDown() {
    this.showDropDown = !this.showDropDown;
  }

  /**
   * @description -Opens the Payroll Connection Modal.
   */
  openModal() {
    if (this.kycCompleted === 3) {
      this.alertService.warningAlert({
        content: 'Your KYC verification has been rejected'
      });
      return;
    }

    this.dialog.open(PayrollConnectionModalComponent, {
      disableClose: true
    });
  }

  payrollAppDataTrackByFn(
    index: number,
    item: { id: string }
  ): number | string {
    return item.id;
  }

  /**
   * Method to search payroll data
   */
  searchPayroll(searchText: string) {
    this.payrollAppData = this.payrollData.filter((data) =>
      data.name.toLowerCase().includes(searchText.toLowerCase())
    );
    if (this.payrollAppData.length !== 0) {
      this.payrollService.isNoSearchResult.next(false);
      this.selectPayrollAccount(this.payrollAppData[0]);
    } else {
      this.payrollService.isNoSearchResult.next(true);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

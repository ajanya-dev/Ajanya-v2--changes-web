import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ScriptService } from 'src/app/core/services/script.service';
import { payrollList } from 'src/app/data/data/payroll';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { Subscription } from 'rxjs';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FormsModule } from '@angular/forms';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { environment } from 'src/environments/environment';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { BusinessNameModalComponent } from '../business-name-modal/business-name-modal.component';
import { PayrollService } from '../../services/payroll.service';
import { SearchFilterPipe } from '../../../../pipes/search-filter.pipe';
import { DisplayIDModalComponent } from '../display-id-modal/display-id-modal.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';

export class IPayrollLists {
  id: string;
  title: string;
  icon: string;
  connected: boolean;
}

@Component({
  selector: 'app-payroll-connection-modal',
  templateUrl: './payroll-connection-modal.component.html',
  styleUrls: ['./payroll-connection-modal.component.scss'],
  standalone: true,
  imports: [FormsModule, SearchFilterPipe, FontAwesomeModule, NgOptimizedImage,CommonButtonV35Component,NgClass,DemoVideoComponent]
})
export class PayrollConnectionModalComponent implements OnInit, OnDestroy {
  payrollApps: IPayrollLists[] = payrollList.payrollApps();
  payrollAppData: IPayrollApps[] = [];
  searchInput = '';
  apiToken: string;
  subscriptions: Subscription[] = [];
  kycCompleted?: number;
  environment = environment;
  faCross = faXmark;

  private scriptService = inject(ScriptService);
  private integrationService = inject(IntegrationService);
  private dialog = inject(MatDialog);
  public dialogRef = inject(MatDialogRef<PayrollConnectionModalComponent>);
  private payrollService = inject(PayrollService);
  private alertService = inject(AlertService);
  private gettingStartedService = inject(GettingStartedService);

  ngOnInit(): void {
    this.gettingStartedService.getGettingStarted().subscribe((response) => {
      if (response) {
        this.kycCompleted = response.kycStatus ?? undefined;
      }
    });
    this.scriptService.addScript(
      '',
      'payroll',
      'https://cdn.merge.dev/initialize.js'
    );
    this.getPayrollApps();
  }

  /**
   * @description -Fetches the list of payroll applications and populates the `payrollAppData` array
   */
  getPayrollApps() {
    this.subscriptions.push(
      this.payrollService.getPayrollDetails().subscribe((res) => {
        if (res.success) {
          this.payrollAppData = res.data;
          this.connectedApps();
        }
      })
    );
  }

  /**
   * @description -Initiates the process of connecting to a payroll application.
   * @param app  The Selcted App of the payroll application to connect to.
   */
  onConnectToApp(app: IPayrollLists,appIndex:number) {
    const appId = app.id;
    if (appId === 'paychex') {
      this.dialogRef.close();
      this.dialog.open<DisplayIDModalComponent>(DisplayIDModalComponent, {
        maxWidth: '440px',
        width: '95%',
        disableClose: true,
        autoFocus: false,
        data: {
          kybBypassedUser: 1,
          bypassedFor: 3
        }
      });
      return;
    }

    if (appId === 'gusto') {
      this.subscriptions.push(
        this.integrationService.openGusto().subscribe({
          next: (res) => {
            if (res.success) {
              window.open(res.data.url);
            }
          },
          error: (err) => {
            this.alertService.warningAlert({
              content: err.error.errorMsg
            });
          }
        })
      );
      return;
    }

    if (appId === 'zoho') {
      this.subscriptions.push(
        this.integrationService.openZoho().subscribe({
          next: (res) => {
            if (res.success) {
              window.open(res.data.url);
            }
          },
          error: (err) => {
            this.alertService.warningAlert({
              content: err.error.errorMsg
            });
          }
        })
      );
      return;
    }

    if (appId === 'adp-run') {
      this.alertService
        .confirmAlert({
          content: `Kindly confirm the addition of ADP Run for processing payroll via credit card.`
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            const adpPayrollBody = this.createAdpPayrollBody();
            this.subscriptions.push(
              this.payrollService
                .addManualPayroll(adpPayrollBody)
                .subscribe((res) => {
                  if (res.success) {
                    this.payrollService.isConnectedSuccess.next(true);
                    this.dialogRef.close();
                    this.alertService.successAlert();
                  }
                })
            );
          }
        });
      return;
    }


    if (appId === 'bypass') {
      this.openBuisnessModal(appId,appIndex+2,app.title);
      return;
    }

    const subscription = this.integrationService
      .connectToService(appId)
      .subscribe((res) => {
        if (res.success) {
          this.apiToken = res.data.linkToken;
          this.payrollService.mergeLink(this.apiToken);
        }
        subscription.unsubscribe();
      });
  }

  /**
   * @description create payload for Adp payroll
   * @returns payload for creating adp payroll
   */
  createAdpPayrollBody() {
    return {
      kybBypassedUser: 1,
      bypassedFor: 1,
      bypassedBusinessName: 'ADP RUN PAYROLL',
      payroll_provider_name:'ADP Run Payroll',
      manual_payroll_provider_id:1
    };
  }

  /**
   * @description -Opens a modal for managing existing business details.
   */
  openBuisnessModal(appId:'bypass'|'adp-run'|'paychex',appIndex?:number,appTitle?:string) {
    if (this.kycCompleted === 3) {
      this.alertService.warningAlert({
        content: 'Your KYC verification has been rejected'
      });
      return;
    }

    this.dialog.open(BusinessNameModalComponent, {
      maxWidth: '440px',
      width: '95%',
      disableClose: false,
      autoFocus: false,
      data: {bypassedFor: appId === 'bypass' || appId === 'paychex' ? 2  : 1,appIndex,appTitle }
    });
  }

  /**
   * @description-Updates the `connected` property of the `payrollApps` based on the connection status in `payrollAppData`.
   */
  connectedApps() {
    this.payrollApps = this.payrollApps.map((element) => {
      const app = element;
      const matchingItem = this.payrollAppData.find(
        (item) => item.name === app.title
      );
      if (matchingItem) {
        app.connected = true;
      }
      return app;
    });
  }

  /**
   * @description Close the modal
   */
  close() {
    this.dialogRef.close();
  }

  goToExtensionPage(){
    window.open('https://chromewebstore.google.com/detail/zilmoney-payroll-by-credi/nfmlnpkpdnfddkbfepobdpfnlecbbacn', '_blank');
  }

  ngOnDestroy(): void {
    this.scriptService.removeScript(['payroll']);
    this.subscriptions.forEach((el) => el.unsubscribe());
    const iframeElement = document.getElementById('merge-link-iframe');
    if (iframeElement) {
      iframeElement.remove();
    }
  }
}

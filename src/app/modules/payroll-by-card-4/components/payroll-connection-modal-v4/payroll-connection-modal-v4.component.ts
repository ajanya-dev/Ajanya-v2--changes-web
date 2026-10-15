import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  inject
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ScriptService } from 'src/app/core/services/script.service';
import { payrollList } from 'src/app/data/data/payroll';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { Subscription } from 'rxjs';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { FormsModule } from '@angular/forms';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { environment } from 'src/environments/environment';
import { LucideAngularModule } from 'lucide-angular';
import { NgOptimizedImage } from '@angular/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BusinessNameModalV4Component } from '../business-name-modal-v4/business-name-modal-v4.component';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { SearchFilterPipe } from '../../../../pipes/search-filter.pipe';
import { DisplayIDModalV4Component } from '../display-id-modal-v4/display-id-modal-v4.component';

export class IPayrollLists {
  id: string;
  title: string;
  icon: string;
  connected: boolean;
}

@Component({
  selector: 'app-payroll-connection-modal-v4',
  templateUrl: './payroll-connection-modal-v4.component.html',
  styleUrls: ['./payroll-connection-modal-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    SearchFilterPipe,
    LucideAngularModule,
    NgOptimizedImage,
    CommonButtonV4Component
  ]
})
export class PayrollConnectionModalV4Component implements OnInit, OnDestroy {
  payrollApps: IPayrollLists[] = payrollList.payrollApps();
  payrollAppData: IPayrollApps[] = [];
  searchInput = '';
  apiToken: string;
  subscriptions: Subscription[] = [];
  kycCompleted?: number;
  environment = environment;
  private scriptService = inject(ScriptService);
  private integrationService = inject(IntegrationService);
  private dialog = inject(MatDialog);
  public dialogRef = inject(MatDialogRef<PayrollConnectionModalV4Component>);
  private payrollService = inject(PayrollService);
  private alertService = inject(V4AlertService);
  private gettingStartedService = inject(GettingStartedService);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.subscriptions.push(
      this.gettingStartedService.getGettingStarted().subscribe((response) => {
        if (response) {
          this.kycCompleted = response.kycStatus ?? undefined;
        }
      })
    );
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
  onConnectToApp(app: IPayrollLists, appIndex: number) {
    const appId = app.id;
    if (appId === 'paychex') {
      this.dialogRef.close();
      this.dialog.open<DisplayIDModalV4Component>(DisplayIDModalV4Component, {
        maxWidth: '440px',
        width: '95%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
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
      this.openBuisnessModal(appId, appIndex + 2, app.title);
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
      payroll_provider_name: 'ADP Run Payroll',
      manual_payroll_provider_id: 1
    };
  }

  /**
   * @description -Opens a modal for managing existing business details.
   */
  openBuisnessModal(
    appId: 'bypass' | 'adp-run' | 'paychex',
    appIndex?: number,
    appTitle?: string
  ) {
    if (this.kycCompleted === 3) {
      this.alertService.warningAlert({
        content: 'Your KYC verification has been rejected'
      });
      return;
    }

    this.dialogRef.addPanelClass('cdk-stacked-modal-hidden');
    const businessDialog = this.dialog.open(BusinessNameModalV4Component, {
      maxWidth: '440px',
      width: '95%',
      disableClose: false,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        bypassedFor: appId === 'bypass' || appId === 'paychex' ? 2 : 1,
        appIndex,
        appTitle
      }
    });
    businessDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.dialogRef.close();
      } else {
        this.dialogRef.removePanelClass('cdk-stacked-modal-hidden');
      }
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

  goToExtensionPage() {
    window.open(
      'https://chromewebstore.google.com/detail/zilmoney-payroll-by-credi/nfmlnpkpdnfddkbfepobdpfnlecbbacn',
      '_blank'
    );
  }

  ngOnDestroy(): void {
    this.scriptService.removeScript(['payroll']);
    this.subscriptions.forEach((el) => el.unsubscribe());
    const iframeElement =
      this.elementRef.nativeElement.ownerDocument.getElementById(
        'merge-link-iframe'
      );
    if (iframeElement) {
      this.renderer.removeChild(iframeElement.parentNode, iframeElement);
    }
  }
}

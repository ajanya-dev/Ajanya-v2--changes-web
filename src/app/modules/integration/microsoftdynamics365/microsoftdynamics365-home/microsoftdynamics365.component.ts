import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ScriptService } from 'src/app/core/services/script.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ItableData } from 'src/app/modules/integration/model/integration';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MergeintegrationService } from 'src/app/shared/service/mergeintegration/mergeintegration.service';
import { CustomerSupportComponent } from '../../../../shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from '../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for Microsoft Dynamics 365 Integration.
 */
@Component({
  selector: 'app-microsoftdynamics365',
  templateUrl: './microsoftdynamics365.component.html',
  styleUrls: ['./microsoftdynamics365.component.scss'],
  standalone: true,
  imports: [OcwBackButtonComponent, NgIf, NgFor, CustomerSupportComponent]
})
export class Microsoftdynamics365Component implements OnInit, OnDestroy {
  // Injected services and dependencies
  private integrationService = inject(IntegrationService);
  private scriptService = inject(ScriptService);
  private mergeService = inject(MergeintegrationService);
  cdr = inject(ChangeDetectorRef);
  datePipe = inject(DatePipe);
  alertService = inject(AlertService);

  subscriptions: Subscription[] = [];
  loading = false;
  apiToken: string;
  publicToken: string;
  isConnected: boolean;
  /**
   * @description Unique ID for connection
   */
  appId: string;
  tableData: ItableData[];
  selectedTab = '2';
  fromDate: string;
  toDate: string;
  selectedId: string[] = [];
  /**
   * @description Variable to keep track of which rows are selected
   */
  allChecked: boolean;
  currentPage = 1;
  totalPage: number;
  instructions: string[] = [
    'Click on connect',
    'Authenticate with your Microsoft dynamic 365 credentials',
    'Click on Import Invoice to Import the invoice'
  ];

  /**
   * Initializes the component.
   */
  ngOnInit(): void {
    this.subscriptions.push(
      this.mergeService.isConnectedSuccess.subscribe((res) => {
        if (res === 'dynamic365') {
          this.checkMicrosoftDynamicsConnected();
        }
      })
    );
    this.scriptService.addScript(
      '',
      'dynamic',
      'https://cdn.merge.dev/initialize.js'
    );
  }

  /**
   * @description Checks if Microsoft dynamics 365 is connected and retrieves connection details.
   */
  checkMicrosoftDynamicsConnected() {
    this.loading = true;
    const connection = this.integrationService
      .getConnectionDetails('microsoft-dynamics-365-business-central')
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.appId = res.data.id;
          if (res.data.connected === 1) {
            this.isConnected = true;
            this.cdr.detectChanges();
          }
        }
        connection.unsubscribe();
      });
  }

  /**
   * @description Initiates the connection to Microsoft Dynamics service.
   */
  onConnectToMicrosoftDynamics() {
    this.loading = true;
    const isConnected = this.integrationService
      .connectToService('microsoft-dynamics-365-business-central')
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.apiToken = res.data.linkToken;
          this.mergeService.mergeLink(this.apiToken, 'dynamic365');
        }
        isConnected.unsubscribe();
      });
  }

  /**
   * @description Disconnects the Microsoft Dynamics connection.
   */
  disconnectMicrosoftDynamics() {
    const alert = this.alertService.confirmAlert({
      content:
        'Are you sure you want to disconnect from Microsoft Dynamics 365 ?',
      doneMsg: 'Yes'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;
        this.integrationService
          .disconnectConnection(this.appId)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res) {
              this.isConnected = false;
              this.alertService.successAlert({
                content: 'Disconnected Successfully'
              });
            }
          });
      }
    });
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.scriptService.removeScript(['dynamic']);
    this.subscriptions.forEach((el) => el.unsubscribe());
    const iframeElement = document.getElementById('merge-link-iframe');
    if (iframeElement) {
      iframeElement.remove();
    }
  }
}

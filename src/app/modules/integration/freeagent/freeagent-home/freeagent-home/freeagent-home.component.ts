import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ScriptService } from 'src/app/core/services/script.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ItableData } from 'src/app/modules/integration/model/integration';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MergeintegrationService } from 'src/app/shared/service/mergeintegration/mergeintegration.service';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * @description This component is used to connect FreeAgent to our website and import their data.
 */
@Component({
  selector: 'app-freeagent-home',
  templateUrl: './freeagent-home.component.html',
  styleUrls: ['./freeagent-home.component.scss'],
  standalone: true,
  imports: [OcwBackButtonComponent, NgIf, NgFor, CustomerSupportComponent]
})
export class FreeagentHomeComponent implements OnInit, OnDestroy {
  private integrationService = inject(IntegrationService);
  private scriptService = inject(ScriptService);
  private mergeService = inject(MergeintegrationService);
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
    'Authenticate with your Freeagent credentials',
    'Click on Import Invoice to Import the invoice'
  ];

  status: boolean;

  ngOnInit(): void {
    this.scriptService.addScript(
      '',
      'freeagent',
      'https://cdn.merge.dev/initialize.js'
    );
    this.checkFreeAgentConnected();
    this.subscriptions.push(
      this.mergeService.isConnectedSuccess.subscribe((res) => {
        if (res === 'freeagent') {
          this.checkFreeAgentConnected();
        }
      })
    );
  }

  /**
   * @description Initiates the connection to FreeAgent service.
   */
  onConnectToFreeAgent() {
    this.loading = true;
    const subscription = this.integrationService
      .connectToService('freeagent')
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.apiToken = res.data.linkToken;
          this.mergeService.mergeLink(this.apiToken, 'freeagent');
          if (this.status) {
            this.checkFreeAgentConnected();
          }
        }
        subscription.unsubscribe();
      });
  }

  /**
   * @description Checks if FreeAgent is connected and retrieves connection details.
   */
  checkFreeAgentConnected() {
    this.loading = true;
    const connection = this.integrationService
      .getConnectionDetails('freeagent')
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
          }
          connection.unsubscribe();
        }
      });
  }

  /**
   * @description Disconnects the free agent.
   */
  disconnectFreeAgent() {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect from FreeAgent ?',
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
   * Destroy component and unsubscribe from subscriptions.
   */
  ngOnDestroy(): void {
    this.scriptService.removeScript(['freeagent']);
    this.subscriptions.forEach((el) => el.unsubscribe());
    const iframeElement = document.getElementById('merge-link-iframe');
    if (iframeElement) {
      iframeElement.remove();
    }
  }
}

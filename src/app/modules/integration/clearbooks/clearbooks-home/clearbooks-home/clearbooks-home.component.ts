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
 * @description This component is used to connect ClearBooks to our website and import their data.
 */
@Component({
  selector: 'app-clearbooks-home',
  templateUrl: './clearbooks-home.component.html',
  styleUrls: ['./clearbooks-home.component.scss'],
  standalone: true,
  imports: [OcwBackButtonComponent, NgIf, NgFor, CustomerSupportComponent]
})
export class ClearbooksHomeComponent implements OnInit, OnDestroy {
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
    'Authenticate with your clearbooks credentials',
    'Click on Import Invoice to Import the invoice'
  ];

  ngOnInit(): void {
    this.checkClearBooksConnected();
    this.subscriptions.push(
      this.mergeService.isConnectedSuccess.subscribe((res) => {
        if (res === 'clearbook') {
          this.checkClearBooksConnected();
        }
      })
    );
    this.scriptService.addScript(
      '',
      'merge',
      'https://cdn.merge.dev/initialize.js'
    );
  }

  /**
   * @description Checks if Clear Books is connected and retrieves connection details.
   */
  checkClearBooksConnected() {
    this.loading = true;
    const connection = this.integrationService
      .getConnectionDetails('clear-books')
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
        }
        connection.unsubscribe();
      });
  }

  /**
   * @description Initiates the connection to Clear Books service.
   */
  onConnectToClearBooks() {
    this.loading = true;
    const isConnected = this.integrationService
      .connectToService('clear-books')
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.apiToken = res.data.linkToken;
          this.mergeService.mergeLink(this.apiToken, 'clearbook');
        }
        isConnected.unsubscribe();
      });
  }

  /**
   * @description Disconnects the Clear Books connection.
   */
  disconnectClearBooks() {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect from ClearBooks ?',
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

  ngOnDestroy(): void {
    this.scriptService.removeScript(['merge']);
    this.subscriptions.forEach((el) => el.unsubscribe());
    const iframeElement = document.getElementById('merge-link-iframe');
    if (iframeElement) {
      iframeElement.remove();
    }
  }
}

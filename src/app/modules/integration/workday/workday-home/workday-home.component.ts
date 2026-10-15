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

@Component({
  selector: 'app-workday-home',
  templateUrl: './workday-home.component.html',
  styleUrls: ['./workday-home.component.scss'],
  standalone: true,
  imports: [OcwBackButtonComponent, NgIf, NgFor, CustomerSupportComponent]
})
export class WorkdayHomeComponent implements OnInit, OnDestroy {
  private _integrationService = inject(IntegrationService);
  private _scriptService = inject(ScriptService);
  private _mergeService = inject(MergeintegrationService);
  datePipe = inject(DatePipe);
  cdr = inject(ChangeDetectorRef);
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
    'Authenticate with your Workday credentials',
    'Click on Import Invoice to Import the invoice'
  ];

  ngOnInit(): void {
    this.checkWorkDayConnected();
    this.subscriptions.push(
      this._mergeService.isConnectedSuccess.subscribe((res) => {
        if (res === 'workday') {
          this.checkWorkDayConnected();
        }
      })
    );
    this._scriptService.addScript(
      '',
      'workday',
      'https://cdn.merge.dev/initialize.js'
    );
  }

  /**
   * @description Checks if Workday is connected and retrieves connection details.
   */
  checkWorkDayConnected() {
    this.loading = true;
    const connection = this._integrationService
      .getConnectionDetails('workday')
      .pipe(finalize(() => (this.loading = false)))
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
   * @description Initiates the connection to Workday service.
   */
  onConnectToWorkDay() {
    this.loading = true;
    const isConnected = this._integrationService
      .connectToService('workday')
      .subscribe((res) => {
        if (res) {
          this.apiToken = res.data.linkToken;
          this._mergeService.mergeLink(this.apiToken, 'workday');
        }
        isConnected.unsubscribe();
      });
  }

  /**
   * @description Disconnects the Workday connection.
   */
  disconnectWorkDay() {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to disconnect from WorkDay ?',
      doneMsg: 'Yes'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;
        this._integrationService
          .disconnectConnection(this.appId)
          .pipe(finalize(() => (this.loading = false)))
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
    this._scriptService.removeScript(['workday']);
    this.subscriptions.forEach((el) => el.unsubscribe());
    const iframeElement = document.getElementById('merge-link-iframe');
    if (iframeElement) {
      iframeElement.remove();
    }
  }
}

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
  selector: 'app-sage-intacct-home',
  templateUrl: './sage-intacct-home.component.html',
  styleUrls: ['./sage-intacct-home.component.scss'],
  standalone: true,
  imports: [OcwBackButtonComponent, NgIf, NgFor, CustomerSupportComponent]
})
export class SageIntacctHomeComponent implements OnInit, OnDestroy {
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
    'Authenticate with your Sage Intacct credentials',
    'Click on Import Invoice to Import the invoice'
  ];

  ngOnInit(): void {
    this.checkSageIntacctConnected();
    this.subscriptions.push(
      this.mergeService.isConnectedSuccess.subscribe((res) => {
        if (res === 'sage-intacct') {
          this.checkSageIntacctConnected();
        }
      })
    );
    this.scriptService.addScript(
      '',
      'sage',
      'https://cdn.merge.dev/initialize.js'
    );
  }

  /**
   * @description Checks if Sage intacct is connected and retrieves connection details.
   */
  checkSageIntacctConnected() {
    this.loading = true;
    const connection = this.integrationService
      .getConnectionDetails('sage-intacct')
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
   * @description Initiates the connection to Sage intacct service.
   */
  onConnectToSageIntacct() {
    this.loading = true;
    const isConnected = this.integrationService
      .connectToService('sage-intacct')
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.apiToken = res.data.linkToken;
          this.mergeService.mergeLink(this.apiToken, 'sage-intacct');
        }
        isConnected.unsubscribe();
      });
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.scriptService.removeScript(['sage']);
    this.subscriptions.forEach((el) => el.unsubscribe());
    const iframeElement = document.getElementById('merge-link-iframe');
    if (iframeElement) {
      iframeElement.remove();
    }
  }
}

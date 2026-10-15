import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ScriptService } from 'src/app/core/services/script.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IConfirmAlert, ISuccessAlert } from 'src/app/models/alert';
import { environment } from 'src/environments/environment';
import { Subject, takeUntil } from 'rxjs';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IPayeeListsConnectedApps } from '../../../model/payee.interface';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { SearchFilterPipe } from '../../../../../pipes/search-filter.pipe';
import { WhiteLabelDirective } from '../../../../../directive/white-label.directive';

@Component({
  selector: 'app-payee-import-modal',
  templateUrl: './payee-import-modal.component.html',
  styleUrls: ['./payee-import-modal.component.scss'],
  standalone: true,
  imports: [
    WhiteLabelDirective,
    FormsModule,
    NgClass,
    SearchFilterPipe,
    FontAwesomeModule,
    NgOptimizedImage
  ]
})
export class PayeeImportModalComponent implements OnInit, OnDestroy {
  private scriptService = inject(ScriptService);
  public dialogRef = inject(MatDialogRef<PayeeImportModalComponent>);
  private payeeService = inject(PayeeDataV35Service);
  private dialogReference = inject(MatDialogRef);
  private alert = inject(AlertService);

  faXmark = faXmark;

  payeeAppData: IPayeeListsConnectedApps[] = [];
  searchInput = '';
  apiToken: string;
  loader = {
    newAppConnect: false,
    list: true
  };

  destroy$ = new Subject<boolean>();

  ngOnInit(): void {
    if (environment.isItWhiteLabel) return;
    this.scriptService.addScript(
      '',
      'payees',
      'https://cdn.merge.dev/initialize.js'
    );
    this.getPayeeConnectedApps({ mergeAutoOpen: true });
    this.payeeService.isConnectedSuccess
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loader.newAppConnect = false;
        this.getPayeeConnectedApps();
        this.showSuccessMessage('App connected to your account.');
      });
    this.payeeService.isConnectionLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: boolean) => {
        this.loader.newAppConnect = state;
      });
  }

  /**
   * @description -Fetches the list of payee applications
   */
  getPayeeConnectedApps(config = { mergeAutoOpen: false }) {
    this.loader.list = true;
    this.payeeService
      .getCRMConnectedApps()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.loader.list = false;
        if (res.success) {
          this.payeeAppData = res.data;
          if (res.data.length <= 0 && config.mergeAutoOpen) {
            this.onConnectNewApp();
          }
        }
      });
  }

  /**
   * @description -Initiates the process of importing payee details from connected application.
   * @param {string} appId  The ID of the payee application to connect to.
   */
  onImportFromApp(appId: string) {
    this.setLoaderToItem(appId, 1);
    const subscription = this.payeeService
      .importPayeeFromCRMApps(appId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.setLoaderToItem(appId, 0);
        if (res.success) {
          this.showSuccessMessage(
            'Payees have been imported, and it will take a few minutes for them to show up in your list of payees.'
          );
          this.close();
        }
        subscription.unsubscribe();
      });
  }

  /**
   * Initiates the process of disconnecting from a connected application.
   * @param {string} appId - The ID of the payee application to disconnect from.
   */
  onDisconnectFromApp(appId: string) {
    this.confirmAlert('Are you sure you want to disconnect?')
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ans: boolean | undefined) => {
        if (ans) {
          this.setLoaderToItem(appId, 2);
          this.payeeService
            .disconnectPayeeFromCRMApps(appId)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              this.setLoaderToItem(appId, 0);
              if (res.success) {
                this.payeeAppData = this.payeeAppData.filter(
                  (val) => val.appId !== appId
                );
                this.showSuccessMessage('Disconnected from an App.');
                this.getPayeeConnectedApps();
              }
            });
        }
      });
  }

  /**
   * @description -Initiates the process of connecting to a new payee application.
   */
  onConnectNewApp() {
    if (this.loader.newAppConnect === true) return;
    this.loader.newAppConnect = true;
    const subscription = this.payeeService
      .createCRMToken()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.loader.newAppConnect = false;
        if (res.success) {
          this.apiToken = res.data.linkToken;
          this.payeeService.mergeLink(this.apiToken);
        }
        subscription.unsubscribe();
      });
  }

  /**
   * Displays a success message using the AlertService.
   * @param {string} message - The success message to display.
   */
  showSuccessMessage(message: string) {
    const data: ISuccessAlert = {
      title: 'Success',
      content: message,
      close: false,
      doneMsg: 'Ok',
      isOk: true
    };
    this.alert.successAlert(data);
  }

  /**
   * Displays a confirm alert message using the AlertService.
   * @param {string} message - The message to display.
   */
  confirmAlert(message: string) {
    const data: IConfirmAlert = {
      title: 'Sure?',
      content: message,
      close: false,
      doneMsg: 'Ok',
      isOk: true,
      cancelMsg: 'Cancel',
      isCancel: true
    };
    return this.alert.confirmAlert(data);
  }

  /**
   * @description -Sets the loader variable to a specified state for a given payee application.
   * @param appId -The ID of the payee application.
   * @param state -The loading state (0=none, 1=importing, 2=disconnecting).
   */
  setLoaderToItem(appId: string, state: 0 | 1 | 2) {
    this.payeeAppData.forEach((val) => {
      if (val.appId === appId) {
        // eslint-disable-next-line no-param-reassign
        val.loading = state;
      }
    });
  }

  /**
   * @description Close the modal
   */
  close() {
    this.dialogReference.close();
  }

  /**
   * Handles cleanup when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.scriptService.removeScript(['payees']);
    const iframeElement = document.getElementById('merge-link-iframe');
    if (iframeElement) {
      iframeElement.remove();
    }
    this.payeeService.clearSubscriptions();
    this.destroy$.next(true);
  }
}

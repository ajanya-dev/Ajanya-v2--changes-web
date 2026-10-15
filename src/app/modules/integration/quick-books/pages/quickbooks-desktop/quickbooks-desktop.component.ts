import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { Router, ActivatedRoute, Data, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IQBDData,
  IQbdCompanyInfo,
  IquickBookDesktopFile
} from 'src/app/modules/integration/model/integration';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { QBDesktopDownloadfileModalComponent } from '../../../modals/qb-desktop-downloadfile-modal/qb-desktop-downloadfile-modal.component';
import { MoreSettingsQbdesktopComponent } from '../../components/more-settings-qbdesktop/more-settings-qbdesktop.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { NgIf, NgFor, NgClass, NgStyle } from '@angular/common';
import { DemoVideoComponent } from '../../../../../shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing QuickBooks Desktop integration.
 */
@Component({
  selector: 'app-quickbooks-desktop',
  templateUrl: './quickbooks-desktop.component.html',
  styleUrls: ['./quickbooks-desktop.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    MatTooltip,
    NgIf,
    NgFor,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgStyle,
    RouterLink,
    CustomerSupportComponent
  ]
})
export class QuickbooksDesktopComponent implements OnInit, OnDestroy {
  /**
   * Options for tooltip positions.
   */
  private _dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];

  /**
   * The currently selected tooltip position.
   */
  position = new UntypedFormControl(this.positionOptions[1]);

  /**
   * Form control for payee address special setting.
   */
  payeeAddressSpecialSetting = new UntypedFormControl();

  /**
   * Form control for enabling OCW style stub.
   */
  enableOcwStyleStub = new UntypedFormControl();

  /**
   * Loading indicator for different operations.
   */
  loading = false;

  /**
   * Text for composing an email.
   */
  mailText: string;

  /**
   * User's email address.
   */
  email: string;

  /**
   * Download link for QuickBooks Desktop.
   */
  downloadLink: string;

  /**
   * Video link for QuickBooks Desktop.
   */
  videoLink: string;

  /**
   * Utility functions.
   */
  utils = Utils;

  /**
   * Array of subscriptions to manage cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Data representing QuickBooks Desktop integration.
   */
  quickBookDesktopData: IQBDData;

  /**
   * Route data.
   */
  routeData: Data;

  /**
   * Data representing QuickBooks Desktop companies and files.
   */
  quickBookDesktopCompanies: IQbdCompanyInfo;
  quickBookDesktopFiles: IquickBookDesktopFile[];

  /**
   * Indicates if the integration is connected.
   */
  isConnected: boolean;

  /**
   * Source of the import.
   */
  source = signal<string>('');

  /**
   * Flag to track if settings modal has been opened for payments source.
   */
  isSettingsOpen = signal<boolean>(false);

  /**
   * Constructor for the QuickBooks Desktop component.
   * @param {IntegrationService} _integrationService - The integration service.
   * @param {AlertService} _alertService - The alert service.
   * @param {Router} router - The Angular router.
   * @param {ActivatedRoute} routes - The activated route.
   * @param {MatDialog} matDialogue - The Angular Material dialog service.
   * @param {LocalStorageService} _localStorageService - The local storage service.
   */
  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private router: Router,
    private routes: ActivatedRoute,
    private matDialogue: MatDialog,
    private _localStorageService: LocalStorageService
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this.source.set(history.state?.source);
    this.getQuickBookDesktop();
    this.getQuickbooksCompaniesFiles();
    this.email = this._localStorageService.getItem('email')!;

    //get data from route
    this.routes.data.subscribe((data) => {
      this.routeData = data;
    });
  }

  /**
   * Retrieve QuickBooks Desktop integration data.
   */
  getQuickBookDesktop(): void {
    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .getQuickBookDesktopData()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.quickBookDesktopData = res.data;
            this.downloadLink = res.data.version5Link;
            this.videoLink = res.data.videoLink;
            res.data.payeeAddressSpecialSetting
              ? this.payeeAddressSpecialSetting.setValue(1)
              : this.payeeAddressSpecialSetting.setValue(0);
            res.data.enableOcwStyleStub
              ? this.enableOcwStyleStub.setValue(1)
              : this.enableOcwStyleStub.setValue(0);
            if(this.source() === 'payments' && !this.isSettingsOpen() ) {
              this.isSettingsOpen.set(true);
              this.openMoreSettings();
            }
          }
        })
    );
  }

  /**
   * Update QuickBooks Desktop settings.
   * @param {string} type - The type of setting to update ('setting' or 'styleStub').
   */
  updateQuickBookDesktop(type: string): void {
    let data = {};
    if (type == 'setting') {
      data = {
        payeeAddressSpecialSetting:
          type == 'setting'
            ? Number(this.payeeAddressSpecialSetting.value)
            : Number(this.quickBookDesktopData.payeeAddressSpecialSetting)
      };
    } else if (type == 'styleStub') {
      data = {
        enableOcwStyleStub:
          type == 'styleStub'
            ? Number(this.enableOcwStyleStub.value)
            : Number(this.quickBookDesktopData.enableOcwStyleStub)
      };
    }

    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .updateQuickBookDesktopData(data)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (type == 'setting') {
              this.quickBookDesktopData.payeeAddressSpecialSetting = Number(
                this.payeeAddressSpecialSetting.value
              );
            } else {
              this.quickBookDesktopData.enableOcwStyleStub = Number(
                this.enableOcwStyleStub.value
              );
            }

            this.openSuccessAlert('Updated Successfully.');
          }
        })
    );
  }

  /**
   * Retrieve QuickBooks Desktop company files.
   */
  getQuickbooksCompaniesFiles(): void {
    this.loading = true;

    this.subscriptions.push(
      this._integrationService
        .getQuickbooksDesktopFiles()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.quickBookDesktopFiles = res.data.files;
          }
        })
    );
  }

  /**
   * Retrieve QuickBooks Desktop companies.
   */
  getQuickbooksCompanies(): void {
    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .getQuickbooksDesktopCompanies()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.quickBookDesktopCompanies = res.data;
          }
        })
    );
  }

  /**
   * Open a confirmation alert dialog.
   * @param {string} content - The content to display in the dialog.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Handle the "Reset Password" button click for a QuickBooks Desktop file.
   * @param {IquickBookDesktopFile} fileDetails - Details of the file.
   */
  onResetPasswordButtonClick(fileDetails: IquickBookDesktopFile) {
    const dialogueRef = this.matDialogue.open(
      QBDesktopDownloadfileModalComponent,
      {
        width: '460px',
        minHeight: '300px',
        data: { mode: 'edit', fileDetails }
      }
    );

    dialogueRef.afterClosed().subscribe((res) => {
      if (res) {
        this.openSuccessAlert('Password Reset Successfull');
      }
    });
  }

  /**
   * Handle the "Delete File" button click for a QuickBooks Desktop file.
   * @param {IquickBookDesktopFile} fileDetails - Details of the file.
   * @param {number} indx - The index of the file in the list.
   */
  onDeleteFileClicked(fileDetails: IquickBookDesktopFile, indx: number) {
    const confirm = this.openConfirmAlert(
      `Are you sure you want to delete  ${fileDetails.nick_name} file?`
    );
    confirm.afterClosed().subscribe((res) => {
      if (res) {
        this.deleteConnectorFile(fileDetails, indx);
      }
    });
  }

  /**
   * Handle the "Disconnect" button click for a QuickBooks Desktop company.
   * @param {IquickBookDesktopFile} fileDetails - Details of the file.
   */
  onDisconnectFromQuickBooksDesktop(fileDetails: IquickBookDesktopFile) {
    const confirm = this.openConfirmAlert(
      `Are you sure you want to disconnect ${fileDetails.companyName}?`
    );
    confirm.afterClosed().subscribe((res) => {
      if (res) {
        this.disconnectFromQuickBooksDesktop(fileDetails);
      }
    });
  }

  /**
   * Disconnect from a QuickBooks Desktop company.
   * @param {IquickBookDesktopFile} fileDetails - Details of the file.
   */
  disconnectFromQuickBooksDesktop(fileDetails: IquickBookDesktopFile) {
    this.loading = true;
    const sendingData = new FormData();
    sendingData.append('file_id', fileDetails.id);
    this.subscriptions.push(
      this._integrationService
        .quickbooksDesktopDisconnectCompany(sendingData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully disconnected.');
            this.getQuickbooksCompaniesFiles();
          }
        })
    );
  }

  /**
   * Delete a QuickBooks Desktop company file.
   * @param {IquickBookDesktopFile} fileDetails - Details of the file.
   * @param {number} indx - The index of the file in the list.
   */
  deleteConnectorFile(fileDetails: IquickBookDesktopFile, indx: number) {
    if (!this.loading) {
      this.loading = true;
      const sendingData = new FormData();
      sendingData.append('file_id', fileDetails.id);
      this.subscriptions.push(
        this._integrationService
          .deleteQBDesktopCompanyFile(sendingData)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.openSuccessAlert('Successfully deleted.');
              this.quickBookDesktopFiles.splice(indx, 1);
            }
          })
      );
    }
  }

  /**
   * Download a QuickBooks Desktop company file.
   * @param {IquickBookDesktopFile} fileDetails - Details of the file.
   */
  onDownloadCompanyFile(fileDetails: IquickBookDesktopFile) {
    if (!this.loading) {
      this.loading = true;
      const sendingData = new FormData();
      sendingData.append('file_id', fileDetails.id);
      this.subscriptions.push(
        this._integrationService
          .quickbooksDesktopDownloadCompanyFile(sendingData)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.downloadURI(res.data);
            }
          })
      );
    }
  }

  /**
   * Navigate to the company mapping page.
   */
  onMapCompany(): void {
    this.router.navigate([
      'manage/thirdparty_app/quickBooks/qb_desktop/mapping'
    ]);
  }

  /**
   * Open the default email client to send a support email.
   */
  onSupportMail(): void {
    this.mailText = `mailto:${this.email}`;
    window.location.href = this.mailText;
  }

  /**
   * Go to live chat support.
   */
  goToLiveChat(): void {
    this._dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * Open a success alert dialog.
   * @param {string} content - The content to display in the dialog.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Handle the "Download File" button click.
   */
  onDownloadFileClicked() {
    const dialogueRef = this.matDialogue.open(
      QBDesktopDownloadfileModalComponent,
      {
        width: '460px',
        minHeight: '300px'
      }
    );
    dialogueRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getQuickbooksCompaniesFiles();
      }
    });
  }

  /**
   * Download a URI.
   * @param {string} uri - The URI to download.
   */
  downloadURI(uri: string) {
    const link = document.createElement('a');
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Set QuickBooks Desktop version.
   */
  setQBDVersion() {
    IntegrationService.setQBDData({ isOldVersion: true });
  }

  /**
   * Navigate to the previous page.
   */
  backUrl() {
    if (this.routeData.backUrl) {
      this.router.navigate([this.routeData.backUrl]);
    } else {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }
  }

  /**
   * Open more settings dialog for QuickBooks Desktop.
   */
  openMoreSettings() {
    const dialogueRef = this.matDialogue.open(MoreSettingsQbdesktopComponent, {
      width: '650px',
      minHeight: '300px',
      data: this.quickBookDesktopData,
      disableClose: true
    });
    dialogueRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getQuickBookDesktop();
      }
    });
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

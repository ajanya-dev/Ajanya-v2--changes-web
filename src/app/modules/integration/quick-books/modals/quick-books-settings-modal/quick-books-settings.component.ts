import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgStyle, NgClass } from '@angular/common';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleQuestion, faCloudArrowDown, faDownToLine, faGear, faSpinner, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { QBODuplicatedMappingsModalComponent } from '../../../modals/qbo-duplicated-mappings-modal/qbo-duplicated-mappings-modal.component';
import { IQuickBookOnlineData } from '../../../model/integration';

/**
 * Component for configuring QuickBooks settings in a modal.
 */
@Component({
  selector: 'app-quick-books-settings',
  templateUrl: './quick-books-settings.component.html',
  styleUrls: ['./quick-books-settings.component.scss'],
  standalone: true,
  imports: [
    NgStyle,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    NgClass,
    WhiteLabelPipe,
    FaIconComponent,
    FontAwesomeModule,
    CommonButtonV35Component,
  ]
})
export class QuickBooksSettingsComponent implements OnInit, OnDestroy {
  public dialogRef = inject(MatDialogRef<QuickBooksSettingsComponent>);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private integrationService = inject(IntegrationService);
  public data: IQuickBookOnlineData = inject(MAT_DIALOG_DATA);

  matPositionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  toolTipPosition = new UntypedFormControl(this.matPositionOptions[3]);
  toolTipPosition1 = new UntypedFormControl(this.matPositionOptions[0]);

  subscriptions: Subscription[] = [];
  isConnected: number;
  pushBack = true;
  faQuestion = faCircleQuestion;
  faXmark = faXmark;
  faGear = faGear;
  faSpinner = faSpinner;
  faDownToLine = faDownToLine;
  faCloudArrowDown = faCloudArrowDown;

  autoDownloading = new FormControl();
  printRegularVoucher = new FormControl();
  pushbackEnable = new FormControl();
  autoExportEnable = new FormControl();
  locationEnable = new FormControl();
  skipNumber = new FormControl();
  check = new FormControl();
  billPayment = new FormControl();
  expense = new FormControl();
  refund = new FormControl();
  downloadFilter = new FormControl();
  showWarning = new FormControl();
  showSelectionPopup = new FormControl();
  autoDownloadPermission = new FormControl();
  autoPayeeUpdate = new FormControl();
  importTimestampField = new FormControl();
  autoSkipTextEnabled = new FormControl();
  skipTextsInput = new FormControl();
  skipTexts: string[] = [];
  isUpdate = false;

  loading = {
    defaultLoading: false,
    companyLoading: false
  };
  
  /**
   * Loading states for different QuickBooks operations
   */
  quickBooksLoading = {
    bank: false,
    payee: false,
    category: false,
    class: false,
    location: false
  };

  downloadFilters = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  timestampFieldOptions = [
    { value: 'modified_at', name: 'Modified At' },
    { value: 'created_at', name: 'Created At' }
  ];

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    if (this.data) {
      this.data.autoDownloading == 1
        ? this.autoDownloading.setValue(1)
        : this.autoDownloading.setValue(0);
      this.data.printRegularVoucher == 1
        ? this.printRegularVoucher.setValue(1)
        : this.printRegularVoucher.setValue(0);
      this.data.pushBackEnable == 1
        ? this.pushbackEnable.setValue(true)
        : this.pushbackEnable.setValue(false);
      this.data.autoExportEnable == 1
        ? this.autoExportEnable.setValue(true)
        : this.autoExportEnable.setValue(false);
      this.data.locationEnable == 1
        ? this.locationEnable.setValue(true)
        : this.locationEnable.setValue(false);
      this.data.billPayment == '1'
        ? this.billPayment.setValue(1)
        : this.billPayment.setValue(0);
      this.data.check == '1' ? this.check.setValue(1) : this.check.setValue(0);
      this.data.expense == '1'
        ? this.expense.setValue(1)
        : this.expense.setValue(0);
      this.data.refund == '1'
        ? this.refund.setValue(1)
        : this.refund.setValue(0);
      this.data.downloadFilter == 1
        ? this.downloadFilter.setValue(1)
        : this.downloadFilter.setValue(0);
      this.data.showWarning == 1
        ? this.showWarning.setValue(1)
        : this.showWarning.setValue(0);
      this.data.skipNumber
        ? this.skipNumber.setValue(this.data.skipNumber)
        : this.skipNumber.setValue('');
      
        this.showSelectionPopup.setValue(this.data.importSettings.showSelectionPopup ? 1 : 0);
        if(this.data.autoImportPermission === 1){
          this.autoDownloadPermission.setValue(1);
        }else{
          this.autoDownloadPermission.setValue(0);
        }

        if(this.data.autoPayeeUpdate === 1){
          this.autoPayeeUpdate.setValue(1);
        }else{
          this.autoPayeeUpdate.setValue(0);
        }

        // Initialize import timestamp field (default to 'modified_at')
        this.importTimestampField.setValue(
          this.data.importSettings.importTimestampField || 'modified_at'
        );

        // Initialize auto skip text settings
        this.autoSkipTextEnabled.setValue(
          this.data.importSettings.autoSkipTextEnabled ? 1 : 0
        );
        this.skipTexts = this.data.importSettings.skipTexts || [];
        this.skipTextsInput.setValue(this.skipTexts.join(', '));

      this.isConnected = this.data.companyCount;
    }
  }

  /**
   * Post QuickBooks Online data for settings updates.
   * @param {string} type - The type of settings to update.
   */
  postQuickBookOnlineData(type?: string): void {
    if(type === 'update'){
      this.isUpdate = true;
    }
    else{
      this.isUpdate = false;
    }
    if (
      this.data?.duplication == 1 &&
      this.pushbackEnable.value &&
      this.data.pushBackEnable == 0
    ) {
      this.pushbackEnable.setValue(false);
      // this.dialogRef.close()
      const dialog = this.dialog.open(QBODuplicatedMappingsModalComponent, {
        maxWidth: '1010px',
        width: '93%',
        disableClose: true,
        data: this.data?.mapping_data
      });
      dialog.afterClosed().subscribe((res) => {
        if (res) {
          if (res == 'mapping') {
            this.dialogRef.close();
          }
          this.getSettingsDetails();
        }
      });
    }

    if(!this.autoDownloading.value){
      this.autoDownloadPermission.setValue(0);
    }

    // Parse skip texts from input (comma-separated string to array)
    const skipTextsArray = this.skipTextsInput.value
      ? this.skipTextsInput.value
          .split(',')
          .map((text: string) => text.trim())
          .filter((text: string) => text.length > 0)
      : [];

    const data = {
      autoDownloading: this.autoDownloading.value ? '1' : '0',
      printRegularVoucher: this.printRegularVoucher.value ? '1' : '0',
      pushBackEnable: this.pushbackEnable.value ? '1' : '0',
      autoExportEnable: this.autoExportEnable.value ? '1' : '0',
      locationEnable: this.locationEnable.value ? '1' : '0',
      check: this.check.value ? '1' : '0',
      billPayment: this.billPayment.value ? '1' : '0',
      expense: this.expense.value ? '1' : '0',
      refund: this.refund.value ? '1' : '0',
      downloadFilter: this.downloadFilter.value ? '1' : '0',
      showWarning: this.showWarning.value ? '1' : '0',
      skipNumber: this.skipNumber.value,
      autoImportPermission: (this.autoDownloading.value && this.autoDownloadPermission.value) ? '1' : '0',
      isPayeeAutoUpdateEnabled: this.autoPayeeUpdate.value ? '1' : '0',
      show_selection_popup: this.showSelectionPopup.value ? 1 : 0,
      importTimestampField: this.importTimestampField.value || 'modified_at',
      autoSkipTextEnabled: this.autoSkipTextEnabled.value ? 1 : 0,
      skipTexts: skipTextsArray
    };

    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this.integrationService
        .postQuickBookOnlineData(data)
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        .subscribe((res: { success: boolean; message: string }) => {
          if (res.success && type) {
            this.alertService.successAlert({ content: res.message });
            this.dialogRef.close(true);
          }
        })
    );
  }

  /**
   * Get the details of QuickBooks settings.
   */
  getSettingsDetails() {
    // this.loading = true
    this.subscriptions.push(
      this.integrationService.getQuickBookOnlineData().subscribe((res) => {
        if (res.success) {
          this.data = res.data;
        }
      })
    );
  }

  /**
   * Close the dialog.
   */
  close() {
    this.dialogRef.close(true);
  }

  /**
   * Handle the bank import button click.
   */
  onBankImportClicked() {
    if (this.isConnected) {
      this.openCompanyListModal('Bank');
    }
  }

  /**
   * Handle the payee import button click.
   */
  onPayeeImportClicked() {
    if (this.isConnected) {
      this.openCompanyListModal('Payee');
    }
  }

  /**
   * Handle the category or class import button click.
   * @param {string} mode - The mode specifying the purpose of the import ('Category' or 'Class').
   */
  onCategoryImportClicked(mode: string) {
    if (this.isConnected) {
      this.openCompanyListModal(mode);
    }
  }

  /**
   * Handle the location import button click.
   */
  onLocationImportClicked() {
    if (this.isConnected) {
      this.openCompanyListModal('Location');
    }
  }

  /**
   * @description Opens the company list modal.
   * @param mode - he mode specifying the purpose of the modal.
   * Possible values: 'Bank', 'Payee', 'Category', 'Class', 'Location'
   */
  openCompanyListModal(mode: string) {
    const sendingData = {
      mode: mode,
      companyList: this.data?.companies
    };
    const dialogRef = this.dialog.open(CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: sendingData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (sendingData.mode === 'Bank') {
          this.importBankFromCompany(res.realmId);
        }
        if (sendingData.mode === 'Payee') {
          this.importQuickbookPayee(res.realmId);
        }
        if (sendingData.mode === 'Category') {
          this.importQuickbookCategories(
            'get-quickbook-categories',
            res.realmId
          );
        }
        if (sendingData.mode === 'Class') {
          this.importQuickbookCategories('get-quickbook-classes', res.realmId);
        }
        if (sendingData.mode === 'Location') {
          this.importQuickbookLocations(res.realmId);
        }
      }
    });
  }

  /**
   * Imports bank data from a QuickBooks company with the specified realm ID.
   * @param {string} realmId - The realm ID of the QuickBooks company to import bank data from.
   */
  importBankFromCompany(realmId: string) {
    this.quickBooksLoading.bank = true;
    this.subscriptions.push(
      this.integrationService
        .importQuickbookBanks(realmId)
        .pipe(
          finalize(() => {
            this.quickBooksLoading.bank = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully Imported.');
          }
        })
    );
  }

  /**
   * Imports QuickBooks categories or classes data based on the specified type and realm ID.
   * @param {string} type - The type of data to import ('get-quickbook-categories' or 'get-quickbook-classes').
   * @param {string} realmId - The realm ID of the QuickBooks company to import data from.
   */
  importQuickbookCategories(type: string, realmId: string) {
    if (type === 'get-quickbook-categories') {
      this.quickBooksLoading.category = true;
    } else if (type === 'get-quickbook-classes') {
      this.quickBooksLoading.class = true;
    }
    
    this.subscriptions.push(
      this.integrationService
        .importQuickbookCategories(type, realmId)
        .pipe(
          finalize(() => {
            if (type === 'get-quickbook-categories') {
              this.quickBooksLoading.category = false;
            } else if (type === 'get-quickbook-classes') {
              this.quickBooksLoading.class = false;
            }
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully Imported.');
          }
        })
    );
  }

  /**
   * Imports QuickBooks payee data from a company with the specified realm ID.
   * @param {string} realmId - The realm ID of the QuickBooks company to import payee data from.
   */
  importQuickbookPayee(realmId: string) {
    this.quickBooksLoading.payee = true;
    this.subscriptions.push(
      this.integrationService
        .importQuickbookPayee(realmId)
        .pipe(
          finalize(() => {
            this.quickBooksLoading.payee = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully Imported.');
          }
        })
    );
  }

  /**
   *@description Imports QuickBooks locations for a specific realm ID.
   * Displays a loading indicator during the import process.
   * Shows a success alert if the import is successful.
   *
   * @param realmId - The realm ID for which to import the QuickBooks locations.
   */
  importQuickbookLocations(realmId: string) {
    this.quickBooksLoading.location = true;
    this.subscriptions.push(
      this.integrationService
        .importQuickbookLocation(realmId)
        .pipe(
          finalize(() => {
            this.quickBooksLoading.location = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully Imported.');
          }
        })
    );
  }

  /**
   * Open a success alert dialog with the given content.
   * @param {string} content - The content to display in the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this.alertService.successAlert(data);
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}

import { QBODuplicatedMappingsModalComponent } from '../../../modals/qbo-duplicated-mappings-modal/qbo-duplicated-mappings-modal.component';
import { CompanySelectModalComponent } from '../../../../../shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { IQBDData, IQbCompanyList } from '../../../model/integration';
import { NgStyle } from '@angular/common';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCloudArrowDown, faDownToLine, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-more-settings-qbdesktop',
  templateUrl: './more-settings-qbdesktop.component.html',
  styleUrls: ['./more-settings-qbdesktop.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    MatCheckbox,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    WhiteLabelPipe,
    FaIconComponent,
    CommonButtonV35Component,
    NgStyle
  ]
})
export class MoreSettingsQbdesktopComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  autoDownloading = new UntypedFormControl();
  printRegularVoucher = new UntypedFormControl();
  check = new UntypedFormControl();
  billPayment = new UntypedFormControl();
  payroll = new UntypedFormControl();
  downloadFilter = new UntypedFormControl(1);
  pushbackEnable = new UntypedFormControl();
  settingsForm: UntypedFormGroup;
  isValueChangesPending: boolean;
  downloadFilters = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  timeSpans = [
    { value: 1, name: 'Today' },
    { value: 3, name: 'Last 3 days' },
    { value: 7, name: 'Last 7 days' },
    { value: 15, name: 'Last 15 days' },
    { value: 30, name: 'Last 30 days' }
  ];

  loading: boolean;
  
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

  companyData: IQbCompanyList[];
  isConnected: number;
  ispushbackEnable = false;
  faSpinner = faSpinner;
  faDownToLine = faDownToLine;
  faCloudArrowDown = faCloudArrowDown;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogueData: IQBDData,
    private matDialogueRef: MatDialogRef<MoreSettingsQbdesktopComponent>,
    private integrationService: IntegrationService,
    private _alertService: AlertService,
    private __dialog: MatDialog
  ) {}

  /**
   * Initialize the component when it is first loaded.
   */
  ngOnInit(): void {
    this.settingsForm = new UntypedFormGroup({
      check: new UntypedFormControl(this.dialogueData?.check),
      billPayment: new UntypedFormControl(this.dialogueData?.billPayment),
      payroll: new UntypedFormControl(this.dialogueData?.payroll),
      downloadFilter: new UntypedFormControl(this.dialogueData?.downloadFilter),
      defaultTimeSpan: new UntypedFormControl(
        this.dialogueData?.defaultTimeSpan
      ),
      pushbackEnable: new UntypedFormControl(this.dialogueData?.pushBackEnable)
    });
    this.ispushbackEnable = this.dialogueData?.allowExport;
    this.loadCompanyData();
  }

  /**
   * Update QuickBooks Desktop settings.
   * @param {boolean} isClose - Whether to close the dialog after updating.
   */
  updateSettings(isClose: boolean) {
    this.loading = true;
    const formValue = this.settingsForm.value;
    const sendingData = {
      check: formValue.check ? 1 : 0,
      billPayment: formValue.billPayment ? 1 : 0,
      payroll: formValue.payroll ? 1 : 0,
      downloadFilter: formValue.downloadFilter ? 1 : 0,
      defaultTimeSpan: formValue.defaultTimeSpan,
      pushBackEnable: formValue.pushbackEnable ? 1 : 0
    };
    this.integrationService.updateQuickBookDesktopData(sendingData).subscribe(
      (res) => {
        this.loading = false;
        if (res.success) {
          this._alertService.successAlert({
            content: 'Settings updated successfully'
          });
          if (isClose) {
            this.matDialogueRef.close(this.settingsForm.dirty);
          }
        }
      },
      () => {
        this.loading = false;
      }
    );
  }

  /**
   * Reset settings to recommended values.
   */
  resetToRecommended() {
    this.settingsForm.patchValue({
      check: 1,
      billPayment: 1,
      payroll: 0,
      downloadFilter: 0,
      defaultTimeSpan: 7
    });
    this.updateSettings(false);
    this.settingsForm.markAsDirty();
  }

  /**
   * Close the dialog.
   */
  close() {
    this.matDialogueRef.close(this.settingsForm.dirty);
  }

  /**
   * Load company data for QuickBooks Desktop integration.
   */
  loadCompanyData() {
    this.subscriptions.push(
      this.integrationService
        .getQuickbooksDesktopCompanies()
        .subscribe((res) => {
          if (res.success) {
            this.companyData = res.data.companies;
            this.isConnected = res.data?.companyCount;
          }
        })
    );
  }

  /**
   * Import data for QuickBooks Desktop integration based on the specified type.
   * @param {string} type - The type of data to import.
   */
  ImportData(type: string) {
    const sendingData = {
      mode: type,
      companyList: this.companyData
    };

    if (this.isConnected) {
      const dialogRef = this.__dialog.open(CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          if (type == 'Bank') {
            this.importNewBankAccountsOfQBDCompany(res.id);
          } else if (type == 'Payee') {
            const whiteLabelPayee = environment.env_id === 'compass' ? 'Vendor' : 'Payee';
            this.importNewDetailsOfQBDCompany(res.id, 'import-payee', whiteLabelPayee);
          } else if (type == 'Expense') {
            this.importNewDetailsOfQBDCompany(
              res.id,
              'import-expenses',
              'expense'
            );
          } else {
            this.importNewDetailsOfQBDCompany(
              res.id,
              'import-classes',
              'class'
            );
          }
        }
      });
    } else {
      this._alertService.infoAlert({
        content: "We couldn't connect to any QuickBooks Desktop company",
        close: false
      });
    }
  }

  /**
   * Import new bank accounts of a QuickBooks Desktop company.
   * @param {string} companyId - The ID of the company.
   */
  importNewBankAccountsOfQBDCompany(companyId: string) {
    this.quickBooksLoading.bank = true;
    const sendingData = new FormData();
    sendingData.append('company_id', companyId);
    this.subscriptions.push(
      this.integrationService
        .importNewBankAccountsOfQBDCompany(sendingData)
        .pipe(finalize(() => {
          this.quickBooksLoading.bank = false;
        }))
        .subscribe((res) => {
          if (res.success) {
            this._alertService.successAlert({
              content:
                'Your bank accounts has been imported. Please refresh and check the list after one minute.',
              close: false
            });
          }
        })
    );
  }

  /**
   * Import new details of a QuickBooks Desktop company based on the specified type.
   * @param {string} companyId - The ID of the company.
   * @param {string} urlEnd - The URL end for the import operation.
   * @param {string} type - The type of data being imported.
   */
  importNewDetailsOfQBDCompany(
    companyId: string,
    urlEnd: string,
    type: string
  ) {
    // Set loading state based on type
    if (type.toLowerCase().includes('payee') || type.toLowerCase().includes('vendor')) {
      this.quickBooksLoading.payee = true;
    } else if (type.toLowerCase().includes('expense')) {
      this.quickBooksLoading.category = true;
    }
    
    const sendingData = new FormData();
    sendingData.append('company_id', companyId);
    this.subscriptions.push(
      this.integrationService
        .importQBDCompanyDetails(urlEnd, sendingData)
        .pipe(finalize(() => {
          if (type.toLowerCase().includes('payee') || type.toLowerCase().includes('vendor')) {
            this.quickBooksLoading.payee = false;
          } else if (type.toLowerCase().includes('expense')) {
            this.quickBooksLoading.category = false;
          }
        }))
        .subscribe((res) => {
          if (res.success) {
            this._alertService.successAlert({
              content: `Your ${type} has been imported. Please refresh and check the list after one minute.`,
              close: false
            });
          }
        })
    );
  }

  /**
   * Enable pushback for QuickBooks Desktop integration if conditions are met.
   */
  EnablePushBack() {
    if (
      this.dialogueData.duplication == 1 &&
      this.settingsForm.value.pushbackEnable &&
      this.dialogueData.pushBackEnable == 0
    ) {
      this.settingsForm.controls.pushbackEnable.setValue(false);
      const dialog = this.__dialog.open(QBODuplicatedMappingsModalComponent, {
        maxWidth: '1010px',
        width: '93%',
        disableClose: true,
        data: {
          data: this.dialogueData?.mapping_data,
          type: 'desktop'
        }
      });
      dialog.afterClosed().subscribe((res) => {
        if (res) {
          if (res == 'mapping') {
            this.matDialogueRef.close();
          }
          this.getSettingsDetails();
        }
      });
    }
  }

  /**
   * Get the details of QuickBooks Desktop settings.
   */
  getSettingsDetails() {
    this.subscriptions.push(
      this.integrationService.getQuickBookDesktopData().subscribe((res) => {
        if (res.success) {
          this.dialogueData = res.data;
        }
      })
    );
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

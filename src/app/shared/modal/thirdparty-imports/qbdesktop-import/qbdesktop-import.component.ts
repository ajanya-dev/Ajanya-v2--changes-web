import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { debounceTime, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  IQbCompanyList,
  IQuickBookDesktopImportRequest
} from 'src/app/modules/integration/model/integration';
import { DatePipe, NgClass, NgIf, NgFor } from '@angular/common';
import { MoreSettingsQbdesktopComponent } from 'src/app/modules/integration/quick-books/components/more-settings-qbdesktop/more-settings-qbdesktop.component';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { TruncatePipe } from '../../../../pipes/truncate.pipe';
import { SortPipe } from '../../../../pipes/sort.pipe';

/**
 * @description Modal component for qbdesktop (third party) import.
 */
@Component({
  selector: 'app-qbdesktop-import',
  templateUrl: './qbdesktop-import.component.html',
  styleUrls: ['./qbdesktop-import.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgClass,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    TruncatePipe,
    SortPipe
  ]
})
export class QBdesktopImportComponent implements OnInit, OnDestroy {
  QuickBookForm: UntypedFormGroup;
  allComplete = false;
  subscriptions: Subscription[] = [];
  loading = false;
  dataLoaded = false;
  searchText = '';
  companyData: { name: string; value: string; completed: boolean }[];
  date1 = new UntypedFormControl('');
  date2 = new UntypedFormControl('');

  @Output() connectionStatus = new EventEmitter<boolean>();
  @Output() clickBackButton = new EventEmitter<boolean>();

  importTime = [
    { value: 1, name: 'Last 2 hours' },
    { value: 2, name: 'Last 12 hours' },
    { value: 3, name: 'Last 24 hours' },
    { value: 4, name: 'Last 3 days' },
    { value: 5, name: 'Last 7 days' },
    { value: 7, name: 'Last 15 days' },
    { value: 8, name: 'Custom Date' }
  ];

  downloadFilter = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  importFrom: IImportList = {
    name: 'Import From',
    completed: false,
    list: []
  };

  importFromBankAccounts: IImportList = {
    name: 'Bank Accounts',
    completed: false,
    list: []
  };

  isConnected: number;
  companyBankAccountsQBD: { name: string; value: string; completed: boolean }[];
  selectedQBBankAC: string[];
  companyLoading: boolean;
  accountImportsLoading: boolean;
  quickBookDesktopData: IQBDDetails;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _integrationService: IntegrationService,
    private fb: UntypedFormBuilder,
    private alertService: AlertService,
    private router: Router,
    private matDialogue: MatDialog,
    public datePipe: DatePipe,
    private __dialogRef: MatDialogRef<QBdesktopImportComponent>
  ) {}

  ngOnInit(): void {
    this.loadCompanyData();
    this.initFormGroup();

    this.date1.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
    this.date2.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
    this.getQuickBookDesktop();
  }

  /**
   * @description Initializes quickbook form.
   */
  initFormGroup() {
    this.QuickBookForm = this.fb.group({
      selectedCompanyDesktop: [null],
      importTime: [this.importTime[2].value],
      importBill: [true],
      importPayroll: [false],
      importCheck: [true],
      markAsPrintLater: [0]
    });
  }

  /**
   * @description Updates `this.companyData` with the companyData that matches the search string.
   */
  onSearchCompany() {
    this.companyData = this.importFrom.list.filter((element) => element.name.toLowerCase().includes(this.searchText.toLowerCase()));
  }

  /**
   * @description Method to load company data and set it to `this.companyData`.
   * Updates `this.importFrom` array with selected data from `companyData`.
   * Invokes `this.setFormOptions` method to set completed status and
   * `this.changeImportFrom` method to set `selectedCompany`.
   * Emits `connectionStatus` event with boolean value.
   */
  loadCompanyData() {
    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .getQuickbooksDesktopCompanies()
        .pipe(
          finalize(() => {
            this.dataLoaded = true;
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            let companyData: IQbCompanyList[] = [];
            companyData = res.data.companies;
            if (companyData?.length) {
              for (const item of companyData) {
                this.importFrom.list?.push({
                  name: item.companyName,
                  value: item.id,
                  completed: false
                });
              }
            }
            this.companyData = this.importFrom.list;
            this.isConnected = res.data?.companyCount;
            if (this.isConnected && this.isConnected != 0) {
              this.QuickBookForm.controls.selectedCompanyDesktop.setValue(
                this.importFrom.list[0]
              );
              this.getBankAccountsOfQBDCompany();
              this.onCompanyChange();
              this.connectionStatus.emit(true);
            } else {
              this.connectionStatus.emit(false);
            }
            this.setFormOptions();
          }
        })
    );
  }

  /**
   * @description Returns tooltip for matTooltip.
   * @param name - list item name.
   * @returns - tooltip
   */
  tooltip(name: string) {
    let tooltip;

    if (name?.length < 35) {
      tooltip = ' ';
    } else {
      tooltip = name;
    }
    return tooltip;
  }

  /**
   * @description Method to load bank accounts of quickbook desktop and set it to `this.companyBankAccountsQBD[]`.
   */
  getBankAccountsOfQBDCompany() {
    this.importFromBankAccounts.list = [];
    this.companyLoading = true;
    this.subscriptions.push(
      this._integrationService
        .getBankAccountsOfQBDCompany(
          this.QuickBookForm.controls.selectedCompanyDesktop.value.value
        )
        .pipe(
          finalize(() => {
            this.companyLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (res.data?.length) {
              this.importFromBankAccounts.list = [];
              for (const item of res.data) {
                this.importFromBankAccounts.list?.push({
                  name: item.account_name,
                  value: item.id,
                  completed: false
                });
              }
            }
            this.companyBankAccountsQBD = this.importFromBankAccounts.list;
            this.setAll(true);
            this.updateAllComplete();
            this.changeImportFrom();
          }
        })
    );
  }

  /**
   * @description Method to reset `this.companyBankAccountsQBD[]` and
   * invokes `this.getBankAccountsOfQBDCompany`method to fetch them again on company change.
   */
  onCompanyChange() {
    this.QuickBookForm.controls.selectedCompanyDesktop.valueChanges.subscribe(
      () => {
        this.companyBankAccountsQBD = [];
        this.importFromBankAccounts.list = [];
        this.updateAllComplete();
        this.getBankAccountsOfQBDCompany();
      }
    );
  }

  /**
   * @description Sets value of `completed` property of each item in `this.importFrom.list[]` to true.
   */
  setFormOptions() {
    this.importFrom.list?.forEach((res) => {
      res.completed = true;
    });
  }

  /**
   * @description Method invoked when 'Start Importing' button is clicked in template.
   */
  onSubmit() {
    this.ImportFromQbDeskTop();
  }

  /**
   * @description Creates the body object for submitting
   * and posts it to `quickbooksDesktopImport` method of integration service.
   * Shows required alerts.
   */
  ImportFromQbDeskTop() {
    if (
      this.QuickBookForm.value.importCheck ||
      this.QuickBookForm.value.importBill ||
      this.QuickBookForm.value.importPayroll
    ) {
      const data = this.QuickBookForm.value;
      this.loading = true;
      const sendingData: IQuickBookDesktopImportRequest = {
        importTime: 8,
        markAsPrintLater: data.markAsPrintLater,
        importBill: data.importBill ? '1' : '0',
        importCheck: data.importCheck ? '1' : '0',
        importPayroll: data.importPayroll ? '1' : '0',
        company_id: data.selectedCompanyDesktop?.value,
        accounts: this.selectedQBBankAC,
        fromDate: this.date1.value,
        toDate: this.date2.value
      };
      this.subscriptions.push(
        this._integrationService
          .quickbooksDesktopImport(sendingData)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content:
                  `Your checks has been imported from <br> <b>${ 
                  data.selectedCompanyDesktop?.name 
                  }</b>. Reload the checklist after one minute to see the imported checks.`,
                close: false
              });
              this.__dialogRef.close({ success: true });
            }
          })
      );
    } else {
      this.alertService.infoAlert({
        content: 'Choose a payment type to import'
      });
    }
  }

  /**
   * @description Checks status of `completed` of each item of `this.importFrom.list[]` and updates the value of `this.allComplete` with the same.
   */
  updateAllComplete() {
    this.allComplete =
      this.importFromBankAccounts.list != null &&
      this.importFromBankAccounts.list.every((t) => t.completed);
  }

  /**
   * @description Returns true when only some items in
   * `this.importFromBankAccounts.list[]` have `allComplete` set to true. (For setting mat check box as indeterminate, if true)
   * @returns boolean
   */
  someComplete(): boolean {
    if (this.importFromBankAccounts.list == null) {
      return false;
    }
    return (
      this.importFromBankAccounts.list.filter((t) => t.completed).length > 0 &&
      !this.allComplete
    );
  }

  /**
   * @description Method invoked on checkbox selection. Updates completed status for all.
   * @param completed - boolean.
   */
  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.importFromBankAccounts.list == null) {
      return;
    }
    this.importFromBankAccounts.list.forEach((t) => (t.completed = completed));
  }

  /**
   * @description Sets `this.selectedQBBankAC[]` with `completed` values from `this.importFromBankAccounts.list[]`.
   */
  changeImportFrom() {
    this.selectedQBBankAC = [];
    this.importFromBankAccounts.list?.forEach((res) => {
      if (res.completed) this.selectedQBBankAC.push(res.value);
    });
  }

  /**
   * @description Closes the dialog.
   */
  closeDialog() {
    this.__dialogRef.close();
  }

  /**
   * @description Closes dialog and navigates to `quickbooks desktop` integration home.
   */
  goToThirdpartyHome() {
    this.router.navigate(['manage/thirdparty_app/qb_desktop'], {state: {source: 'payments'}});
    this.__dialogRef.close(false);
  }

  /**
   * @description Method to get quickbook desktop data and update `QuickBookForm`.
   */
  getQuickBookDesktop(): void {
    this.subscriptions.push(
      this._integrationService.getQuickBookDesktopData().subscribe((res) => {
        if (res.success) {
          this.QuickBookForm.setValue({
            selectedCompanyDesktop:
              this.QuickBookForm.value.selectedCompanyDesktop,
            importTime: [this.importTime[2].value],
            importBill: res?.data?.billPayment,
            importPayroll: res?.data?.payroll,
            importCheck: res?.data?.check,
            markAsPrintLater: res?.data?.downloadFilter
          });
          this.date1.setValue(res?.data?.fromDate);
          this.quickBookDesktopData = res?.data;
          this.subscriptions.push(
            this.QuickBookForm.valueChanges
              .pipe(debounceTime(1500))
              .subscribe(() => {
                this.updateSettings();
              })
          );
        }
      })
    );
  }

  /**
   * @description Method to update quickbook desktop settings.
   */
  updateSettings() {
    const sendingData = {
      check: this.QuickBookForm.value.importCheck ? 1 : 0,
      billPayment: this.QuickBookForm.value.importBill ? 1 : 0,
      payroll: this.QuickBookForm.value.importPayroll ? 1 : 0,
      downloadFilter: this.QuickBookForm.value.markAsPrintLater ? 1 : 0
    };
    this._integrationService
      .updateQuickBookDesktopData(sendingData)
      .subscribe();
  }

  /**
   * @description Opens 'MoreSettingsQbdesktopComponent' modal for advanced settings.
   */
  openAdvancedSettings() {
    const QBDSettingsData = {
      check: this.QuickBookForm.value.importCheck ? 1 : 0,
      billPayment: this.QuickBookForm.value.importBill ? 1 : 0,
      payroll: this.QuickBookForm.value.importPayroll ? 1 : 0,
      downloadFilter: this.QuickBookForm.value.markAsPrintLater ? 1 : 0,
      defaultTimeSpan: this.quickBookDesktopData.defaultTimeSpan
    };
    const dialogueRef = this.matDialogue.open(MoreSettingsQbdesktopComponent, {
      width: '650px',
      minHeight: '300px',
      data: QBDSettingsData,
      disableClose: true
    });
    dialogueRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getQuickBookDesktop();
      }
    });
  }

  /**
   * @description Method to set to default time span.
   */
  setToDefaultTimeSpan() {
    this.date1.setValue(this.quickBookDesktopData.fromDate);
    this.date2.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
  }

  /**
   * @description Methods to set to default payment type.
   */
  setToDefaultPaymentType() {
    this.QuickBookForm.controls.importPayroll.setValue(
      this.quickBookDesktopData.payroll
    );
    this.QuickBookForm.controls.importCheck.setValue(
      this.quickBookDesktopData.check
    );
    this.QuickBookForm.controls.importBill.setValue(
      this.quickBookDesktopData.billPayment
    );
  }

  /**
   * @description Method to set to default download filter.
   */
  setToDefaultDownloadFilter() {
    this.QuickBookForm.controls.markAsPrintLater.setValue(
      this.quickBookDesktopData.downloadFilter
    );
  }

  /**
   * @description Used to move to prevoius section.
   */
  back() {
    this.clickBackButton.next(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

interface IImportList {
  name?: string;
  completed: boolean;
  list: { name: string; value: string; completed: boolean }[];
}

interface IQBDDetails {
  billPayment?: number;
  check?: number;
  defaultTimeSpan?: number;
  downloadFilter?: number;
  enableOcwStyleStub?: number;
  fromDate?: string;
  payeeAddressSpecialSetting?: number;
  payroll?: number;
  version4Link?: string;
  version5Link?: string;
  videoLink?: string;
}

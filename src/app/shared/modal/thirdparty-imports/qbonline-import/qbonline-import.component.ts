import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
  signal
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IQuickBookBody } from 'src/app/modules/check/model/check';
import { IQBOImportData } from 'src/app/modules/integration/model/integration';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgClass, NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faBuilding, faBuildingCircleXmark, faBuildingColumns, faCheckCircle, faCircleInfo, faGear, faMagnifyingGlass, faUniversity } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faClock, faFileCheck, faFilter } from '@fortawesome/pro-regular-svg-icons';
import { SortPipe } from '../../../../pipes/sort.pipe';

interface IBankAccount {
  id: number;
  name: string;
}

interface ICompanyItem {
  name: string;
  value: string;
  completed: boolean;
  bankAccounts: IBankAccount[];
  selectedBankAccounts: IBankAccount[];
}

interface IImportList {
  name?: string;
  completed: boolean;
  list: ICompanyItem[];
}

/**
 * @description Modal component for qbonline (third party) import.
 */
@Component({
  selector: 'app-qbonline-import',
  templateUrl: './qbonline-import.component.html',
  styleUrls: ['./qbonline-import.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    NgSelectModule,
    SortPipe,
    CommonButtonV35Component,
    FaIconComponent,
    NgOptimizedImage,
    TitleCasePipe
  ]
})
export class QBonlineImportComponent implements OnInit, OnDestroy {
  private sharedService = inject(SharedService);
  private fb = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<QBonlineImportComponent>);
  private authDataService = inject(AuthDataService);
  public data: { [key: string]: string } = inject(MAT_DIALOG_DATA);

  QuickBookForm: UntypedFormGroup;
  allComplete = true;
  subscriptions: Subscription[] = [];
  selectedCompany: string[] = [];
  loading = false;
  dataLoaded = false;
  filteredImportTime: { name: string; value: number }[] = [];
  searchText = '';
  companyData: ICompanyItem[];
  isOnlyImportSelectedChecks = signal(false);
  @Output() connectionStatus = new EventEmitter<boolean>();
  @Output() clickBackButton = new EventEmitter<boolean>();
  selectedType = input<string>();

  importTime = [
    { value: 1, name: 'Last 2 hours' },
    { value: 2, name: 'Last 12 hours' },
    { value: 3, name: 'Last 24 hours' },
    { value: 4, name: 'Last 3 days' },
    { value: 5, name: 'Last 7 days' },
    { value: 7, name: 'Last 15 days' },
    { value: 8, name: 'Last 30 days' },
    { value: 9, name: 'Last 3 months' },
    { value: 10, name: 'Custom' }
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

  isConnected: number;
  downloadfilter = false;
  faGear = faGear;
  faSearch = faMagnifyingGlass;
  faBuilding = faBuilding;
  faUniversity = faUniversity;
  faCircleInfo = faCircleInfo;
  faFilter = faFilter;
  faFileCheck = faFileCheck;
  faClock = faClock;
  faBuildingCircleXmark = faBuildingCircleXmark;
  faCheckCircle = faCheckCircle;
  faBuildingColumns = faBuildingColumns;

  // Date filter controls (string format: yyyy-MM-dd)
  startDate = '';
  endDate = '';

  ngOnInit(): void {
    this.loadCompanyData();
    this.initFormGroup();
    this.loadSettingsData();
    this.filterImportTime();
  }

  filterImportTime(): void {
    if (this.authDataService.isQBOnlineTimeSpanEnabled) {
      this.filteredImportTime = this.importTime;
    } else {
      this.filteredImportTime = this.importTime.filter(
        (time) => time.value !== 8 && time.value !== 9
      );
    }
  }

  /**
   * @description Initializes quickbook form.
   */
  initFormGroup() {
    this.QuickBookForm = this.fb.group({
      importFrom: [''],
      importTime: [this.importTime[2].value],
      checkType: [true],
      billType: [true],
      refundReceipt: [false],
      expanse: [false],
      markAsPrintLater: ['']
    });
  }

  /**
   * @description Updates `this.companyData` with the companyData that matches the search string.
   */
  onSearchCompany() {
    this.companyData = this.importFrom.list.filter((element) =>
      element.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
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
      this.sharedService
        .getImportFromQuickBookData()
        .pipe(
          finalize(() => {
            this.dataLoaded = true;
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            let companyData: IQBOImportData[] = [];
            companyData = res.data;
            companyData.forEach((item) => {
              const bankAccounts = item.bankAccounts || [];
              this.importFrom.list?.push({
                name: item.companyName,
                value: item.realmId,
                completed: false,
                bankAccounts,
                selectedBankAccounts: []
              });
            });
            this.companyData = this.importFrom.list;
            this.setFormOptions();
            this.changeImportFrom();
            this.isConnected = res.data?.length;
            if (this.isConnected) {
              this.connectionStatus.emit(true);
            } else {
              this.connectionStatus.emit(false);
            }
          }
        })
    );
  }

  /**
   * @description Compare function for ng-select bank accounts.
   */
  compareBankAccounts = (a: IBankAccount, b: IBankAccount): boolean => a && b ? a.id === b.id : a === b;

  /**
   * @description Toggle all bank accounts selection for a company.
   * @param company - The company item to toggle bank accounts for.
   * @param selectAll - Whether to select all or deselect all.
   */
  toggleAllBankAccounts(company: ICompanyItem, selectAll: boolean): void {
    const updatedCompany = { ...company };
    if (selectAll) {
      updatedCompany.selectedBankAccounts = [...updatedCompany.bankAccounts];
    } else {
      updatedCompany.selectedBankAccounts = [];
    }
    Object.assign(company, updatedCompany);
  }

  /**
   * @description Check if all bank accounts are selected for a company.
   * @param company - The company item to check.
   * @returns boolean - True if all bank accounts are selected.
   */
  areAllBankAccountsSelected(company: ICompanyItem): boolean {
    return company.selectedBankAccounts?.length === company.bankAccounts?.length;
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
   * @description Updates `QuickBookForm` based on the data returned from `getSettingsData` method of shared service.
   */
  loadSettingsData() {
    this.subscriptions.push(
      this.sharedService.getSettingData().subscribe((res) => {
        this.downloadfilter = true;
        if (res.data.check.toString() === '1') {
          this.QuickBookForm.controls.checkType.setValue(1);
        } else {
          this.QuickBookForm.controls.checkType.setValue(0);
        }

        if (res.data.billPayment.toString() === '1') {
          this.QuickBookForm.controls.billType.setValue(1);
        } else {
          this.QuickBookForm.controls.billType.setValue(0);
        }

        if (res.data.expense.toString() === '1') {
          this.QuickBookForm.controls.expanse.setValue(1);
        } else {
          this.QuickBookForm.controls.expanse.setValue(0);
        }

        if (res.data.refund.toString() === '1') {
          this.QuickBookForm.controls.refundReceipt.setValue(1);
        } else {
          this.QuickBookForm.controls.refundReceipt.setValue(0);
        }

        if (res.data.downloadFilter.toString() === '1') {
          this.QuickBookForm.controls.markAsPrintLater.setValue(1);
        } else {
          this.QuickBookForm.controls.markAsPrintLater.setValue(0);
        }
        this.isOnlyImportSelectedChecks.set(res.data.importSettings.showSelectionPopup);
      })
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
   * @description Sets `this.selectedCompany[]` with `completed` values from `this.importFromList.list[]`.
   */
  changeImportFrom() {
    this.selectedCompany = [];
    this.importFrom.list?.forEach((res) => {
      if (res.completed) this.selectedCompany.push(res.value);
    });
  }

  /**
   * @description Builds bankAccountIds object from selected bank accounts for each company.
   * If all bank accounts are selected or no bank accounts are selected, pass empty array.
   * @returns Object with realmId as key and array of bank account IDs as value.
   */
  buildBankAccountIds(): { [realmId: string]: string[] } {
    const bankAccountIds: { [realmId: string]: string[] } = {};
    this.importFrom.list?.forEach((company) => {
      if (company.completed) {
        const allSelected = company.selectedBankAccounts?.length === company.bankAccounts?.length;
        const noneSelected = !company.selectedBankAccounts?.length;
        if (allSelected || noneSelected) {
          bankAccountIds[company.value] = [];
        } else {
          bankAccountIds[company.value] = company.selectedBankAccounts.map(
            (account) => account.id.toString()
          );
        }
      }
    });
    return bankAccountIds;
  }

  /**
   * @description Creates QuickBook body object from `QuickBookForm` and returns it.
   * @returns QuickBook body object.
   */
  createQuickBookBody(): IQuickBookBody {
    const data = this.QuickBookForm.value;
    return {
      realmIds: this.selectedCompany,
      importTime: data.importTime,
      importCheck: data.checkType ? 1 : 0,
      importBill: data.billType ? 1 : 0,
      importRefundReceipt: data.refundReceipt ? 1 : 0,
      importExpense: data.expanse ? 1 : 0,
      markAsPrintLater: data.markAsPrintLater ? 1 : 0,
      bankAccountIds: this.buildBankAccountIds()
    };
  }

  /**
   * @description Creates QuickBook body object for bills from `QuickBookForm` and returns it.
   * @returns QuickBook body object for bills.
   */
  createQuickBookBodyForBills(): IQuickBookBody {
    const data = this.QuickBookForm.value;
    return {
      realmIds: this.selectedCompany,
      importTime: data.importTime,
      importBill: 2
    };
  }

  /**
   * @description Creates QuickBook body object for invoice from `QuickBookForm` and returns it.
   * @returns QuickBook body object for invoice.
   */
  createQuickBookBodyForinvoice(): IQuickBookBody {
    const data = this.QuickBookForm.value;
    return {
      realmIds: this.selectedCompany,
      importTime: data.importTime,
      importBill: 3
    };
  }

  /**
   * @description Method invoked when 'Start Importing' button is clicked in template
   * Shows alerts for exceptions.
   * Invokes `this.postImportBody` for final submission of data.
   */
  onSubmit() {
    if (this.selectedCompany?.length === 0) {
      this.alertService.warningAlert({ content: 'Please select company' });
      return;
    }

    if (this.selectedCompany?.length > 3) {
      const dBody = {
        doneMsg: 'Proceed',
        content: `You have selected ${this.selectedCompany?.length} companies now. We recommend importing 3 or fewer companies simultaneously`
      };
      const dRef = this.alertService.confirmAlert(dBody);
      dRef.afterClosed().subscribe((res) => {
        if (res) {
          this.postImportBody();
        }
      });
    } else {
      this.postImportBody();
    }
  }

  /**
   * @description Creates body object with appropriate method and
   * posts body to `postImportFromQuickBookData` method of shared service.
   */
  postImportBody() {
    // Show selection popup only when skipSelectionPopup is false AND only check type is enabled
    if (this.isOnlyImportSelectedChecks() && this.selectedType() === 'checks') {
      this.getQuickBookOnlineChecks();
      return;
    }
    let body;
    if (this.data.type === 'bills') {
      body = this.createQuickBookBodyForBills();
    } else if (this.data.type === 'invoices') {
      body = this.createQuickBookBodyForinvoice();
    } else {
      body = this.createQuickBookBody();
    }
    let successMsg: string;

    if (this.data.type === 'check') {
      successMsg = 'Checks imported';
    } else if (this.data.type === 'invoices') {
      successMsg = 'If the invoice is not appearing, please refresh the table';
    } else if (this.data.type === 'bills') {
      successMsg = 'If the bill is not appearing, please refresh the table';
    }

    this.loading = true;
    this.subscriptions.push(
      this.sharedService
        .postImportFromQuickBookData(body)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success === true) {
              this.alertService.successAlert({
                content: successMsg,
                close: true
              });
              this.dialogRef.close({ success: true });
            }
          },
          error: (err) => {
            if (err.error.permissionRequired) {
              this.alertService.warningAlert({
                content: "You don't have permission to do this action."
              });
            }
          }
        })
    );
  }
  
  getQuickBookOnlineChecks() {
    const formValue = this.QuickBookForm.value;
    const typeArray: string[] = [];

    // Include "check" if checkType is 1 or true
    if (formValue.checkType === 1 || formValue.checkType === true) {
      typeArray.push('check');
    }

    // Include "billpayment" if billType is 1 or true
    if (formValue.billType === 1 || formValue.billType === true) {
      typeArray.push('billpayment');
    }

    // Include "refundreceipt" if refundReceipt is 1 or true
    if (formValue.refundReceipt === 1 || formValue.refundReceipt === true) {
      typeArray.push('refundreceipt');
    }

    // Include "expense" if expanse is 1 or true
    if (formValue.expanse === 1 || formValue.expanse === true) {
      typeArray.push('expense');
    }

    const payload: {
      realmIds: string[];
      importTime: string;
      type: string[];
      markAsPrintLater: number;
      bankAccountIds: { [realmId: string]: string[] };
      startDate?: string;
      endDate?: string;
    } = {
      realmIds: this.selectedCompany,
      importTime: formValue.importTime,
      type: typeArray,
      markAsPrintLater: formValue.markAsPrintLater ? 1 : 0,
      bankAccountIds: this.buildBankAccountIds()
    };

    // Add date filter if dates are selected
    if (this.startDate && formValue.importTime === 10) {
      payload.startDate = this.startDate;
    }
    if (this.endDate && formValue.importTime === 10) {
      payload.endDate = this.endDate;
    }
    this.loading = true;
    this.subscriptions.push(
      this.sharedService
        .getQuickBookOnlineChecks(payload)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Checks imported',
              close: true
            });
            this.dialogRef.close({ success: true,from: 'qbonline-import' });
          }
        })
    );
  }


  /**
   * @description Open warning alert.
   */
  openWarningAlert(content: string, doneMsg?: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: doneMsg !== undefined ? doneMsg : 'OK'
    };
    return this.alertService.warningAlert(data);
  }

  /**
   * @description Checks status of `completed` of each item of `this.importFrom.list[]` and updates the value of `this.allComplete` with the same.
   */
  updateAllComplete() {
    this.allComplete =
      this.importFrom.list != null &&
      this.importFrom.list.every((listItem) => listItem.completed);
  }

  /**
   * @description Returns true when only some items in
   * `this.importFrom.list[]` have `completed` set to true. (For setting mat check box as indeterminate, if true)
   * @returns boolean
   */
  someComplete(): boolean {
    if (this.importFrom.list == null) {
      return false;
    }
    return (
      this.importFrom.list.filter((listItem) => listItem.completed).length >
        0 && !this.allComplete
    );
  }

  /**
   * @description Method invoked on checkbox selection. Updates completed status for all.
   * @param completed - boolean.
   */
  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.importFrom.list == null) {
      return;
    }
    this.importFrom.list.forEach((listItem) => {
      listItem.completed = completed;
    });
  }

  /**
   * @description Closes the dialog.
   */
  closeDialog() {
    this.dialogRef.close();
  }

  /**
   * @description Closes dialog and navigates to `quickbooks online` integration home.
   */
  goToThirdpartyHome() {
    this.router.navigate([
      'manage/thirdparty_app/quickbooks_online'
    ], {state: {source: 'payments'}});
    this.dialogRef.close(false);
  }

  back() {
    this.clickBackButton.next(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

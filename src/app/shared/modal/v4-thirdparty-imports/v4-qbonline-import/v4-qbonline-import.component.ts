import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgClass, NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  LucideAngularModule,
  Settings,
  Building2,
  Search,
  Landmark,
  Info,
  Filter,
  FileCheck,
  Clock,
  CircleCheck
} from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IQuickBookBody } from 'src/app/modules/check/model/check';
import { IQBOImportData } from 'src/app/modules/integration/model/integration';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
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

@Component({
  selector: 'app-v4-qbonline-import',
  templateUrl: './v4-qbonline-import.component.html',
  styleUrls: ['./v4-qbonline-import.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    SortPipe,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    LucideAngularModule,
    NgOptimizedImage,
    TitleCasePipe,
    V4DatePickerComponent
  ]
})
export class V4QBonlineImportComponent implements OnInit {
  private sharedService = inject(SharedService);
  private fb = inject(UntypedFormBuilder);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<V4QBonlineImportComponent>);
  private authDataService = inject(AuthDataService);
  public data: { [key: string]: string } = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  // Signal-based inputs/outputs
  connectionStatus = output<boolean>();
  clickBackButton = output<boolean>();
  selectedType = input<string>();

  // Lucide icons
  readonly SettingsIcon = Settings;
  readonly Building2Icon = Building2;
  readonly SearchIcon = Search;
  readonly LandmarkIcon = Landmark;
  readonly InfoIcon = Info;
  readonly FilterIcon = Filter;
  readonly FileCheckIcon = FileCheck;
  readonly ClockIcon = Clock;
  readonly CircleCheckIcon = CircleCheck;

  QuickBookForm: UntypedFormGroup;
  allComplete = true;
  selectedCompany: string[] = [];
  loading = false;
  dataLoaded = false;
  filteredImportTime: { name: string; value: number }[] = [];
  searchText = '';
  companyData: ICompanyItem[];
  isOnlyImportSelectedChecks = signal(false);
  isConnected: number;
  downloadfilter = false;
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');

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

  onSearchCompany() {
    this.companyData = this.importFrom.list.filter((element) =>
      element.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  loadCompanyData() {
    this.loading = true;
    this.sharedService
      .getImportFromQuickBookData()
      .pipe(
        finalize(() => {
          this.dataLoaded = true;
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
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
      });
  }

  compareBankAccounts = (a: IBankAccount, b: IBankAccount): boolean =>
    a && b ? a.id === b.id : a === b;

  toggleAllBankAccounts(company: ICompanyItem, selectAll: boolean): void {
    const updatedCompany = { ...company };
    if (selectAll) {
      updatedCompany.selectedBankAccounts = [...updatedCompany.bankAccounts];
    } else {
      updatedCompany.selectedBankAccounts = [];
    }
    Object.assign(company, updatedCompany);
  }

  areAllBankAccountsSelected(company: ICompanyItem): boolean {
    return (
      company.selectedBankAccounts?.length === company.bankAccounts?.length
    );
  }

  tooltip(name: string) {
    if (name?.length < 35) {
      return ' ';
    }
    return name;
  }

  loadSettingsData() {
    this.sharedService
      .getSettingData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
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
        this.isOnlyImportSelectedChecks.set(
          res.data.importSettings.showSelectionPopup
        );
      });
  }

  setFormOptions() {
    this.importFrom.list?.forEach((res) => {
      res.completed = true;
    });
  }

  changeImportFrom() {
    this.selectedCompany = [];
    this.importFrom.list?.forEach((res) => {
      if (res.completed) this.selectedCompany.push(res.value);
    });
  }

  buildBankAccountIds(): { [realmId: string]: string[] } {
    const bankAccountIds: { [realmId: string]: string[] } = {};
    this.importFrom.list?.forEach((company) => {
      if (company.completed) {
        const allSelected =
          company.selectedBankAccounts?.length === company.bankAccounts?.length;
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

  createQuickBookBodyForBills(): IQuickBookBody {
    const data = this.QuickBookForm.value;
    return {
      realmIds: this.selectedCompany,
      importTime: data.importTime,
      importBill: 2
    };
  }

  createQuickBookBodyForinvoice(): IQuickBookBody {
    const data = this.QuickBookForm.value;
    return {
      realmIds: this.selectedCompany,
      importTime: data.importTime,
      importBill: 3
    };
  }

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

  postImportBody() {
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
    this.sharedService
      .postImportFromQuickBookData(body)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
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
      });
  }

  getQuickBookOnlineChecks() {
    const formValue = this.QuickBookForm.value;
    const typeArray: string[] = [];

    if (formValue.checkType === 1 || formValue.checkType === true) {
      typeArray.push('check');
    }
    if (formValue.billType === 1 || formValue.billType === true) {
      typeArray.push('billpayment');
    }
    if (formValue.refundReceipt === 1 || formValue.refundReceipt === true) {
      typeArray.push('refundreceipt');
    }
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

    if (this.startDateControl.value && formValue.importTime === 10) {
      payload.startDate = this.startDateControl.value;
    }
    if (this.endDateControl.value && formValue.importTime === 10) {
      payload.endDate = this.endDateControl.value;
    }
    this.loading = true;
    this.sharedService
      .getQuickBookOnlineChecks(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Checks imported',
            close: true
          });
          this.dialogRef.close({ success: true, from: 'qbonline-import' });
        }
      });
  }

  updateAllComplete() {
    this.allComplete =
      this.importFrom.list != null &&
      this.importFrom.list.every((listItem) => listItem.completed);
  }

  someComplete(): boolean {
    if (this.importFrom.list == null) {
      return false;
    }
    return (
      this.importFrom.list.filter((listItem) => listItem.completed).length >
        0 && !this.allComplete
    );
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.importFrom.list == null) {
      return;
    }
    this.importFrom.list.forEach((listItem) => {
      // eslint-disable-next-line no-param-reassign
      listItem.completed = completed;
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  goToThirdpartyHome() {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { source: 'payments', openAppId: 'qb-online' }
    });
    this.dialogRef.close(false);
  }

  back() {
    this.clickBackButton.emit(true);
  }
}

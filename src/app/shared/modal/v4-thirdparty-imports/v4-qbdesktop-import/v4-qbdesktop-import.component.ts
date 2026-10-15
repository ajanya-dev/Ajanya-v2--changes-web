import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { debounceTime, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DatePipe, NgClass, NgOptimizedImage } from '@angular/common';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Settings,
  Building2,
  Search,
  Landmark,
  Info,
  Filter,
  FileCheck,
  Clock
} from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  IQbCompanyList,
  IQuickBookDesktopImportRequest
} from 'src/app/modules/integration/model/integration';
import { MoreSettingsQbdesktopComponent } from 'src/app/modules/integration/quick-books/components/more-settings-qbdesktop/more-settings-qbdesktop.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { TruncatePipe } from '../../../../pipes/truncate.pipe';
import { SortPipe } from '../../../../pipes/sort.pipe';

@Component({
  selector: 'app-v4-qbdesktop-import',
  templateUrl: './v4-qbdesktop-import.component.html',
  styleUrls: ['./v4-qbdesktop-import.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [DatePipe],
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    V4RadioGroupComponent,
    TruncatePipe,
    SortPipe,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    LucideAngularModule,
    NgOptimizedImage
  ]
})
export class V4QBdesktopImportComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private fb = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private matDialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private dialogRef = inject(MatDialogRef<V4QBdesktopImportComponent>);
  public data: { [key: string]: string } = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  // Signal-based inputs/outputs
  connectionStatus = output<boolean>();
  clickBackButton = output<boolean>();
  selectedType = input<string>();

  readonly payrollTooltip =
    'Please ensure you have enabled the settings to import payroll checks in your QuickBooks Desktop application.\n' +
    '1. Goto Edit > Preferences > Integration Applications.\n' +
    '2. Click On Company Preferences.\n' +
    '3. Select your integration file.\n' +
    '4. Click Properties and Tick the first 3 options for payroll operations and click OK.\n' +
    '5. Click ok and then you will be ready to import payroll checks.';

  // Lucide icons
  readonly SettingsIcon = Settings;
  readonly Building2Icon = Building2;
  readonly SearchIcon = Search;
  readonly LandmarkIcon = Landmark;
  readonly InfoIcon = Info;
  readonly FilterIcon = Filter;
  readonly FileCheckIcon = FileCheck;
  readonly ClockIcon = Clock;

  QuickBookForm: FormGroup;
  allComplete = false;
  loading = false;
  dataLoaded = false;
  searchText = '';
  companyData: { name: string; value: string; completed: boolean }[];
  date1 = new FormControl('');
  date2 = new FormControl('');

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
    { id: 0, name: 'Download All' },
    { id: 1, name: 'Download only mark as print later' }
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
  quickBookDesktopData: IQBDDetails;

  ngOnInit(): void {
    this.loadCompanyData();
    this.initFormGroup();

    this.date1.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
    this.date2.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
    this.getQuickBookDesktop();
  }

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

  onSearchCompany() {
    this.companyData = this.importFrom.list.filter((element) =>
      element.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  loadCompanyData() {
    this.loading = true;
    this.integrationService
      .getQuickbooksDesktopCompanies()
      .pipe(
        finalize(() => {
          this.dataLoaded = true;
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          let companyData: IQbCompanyList[] = [];
          companyData = res.data.companies;
          if (companyData?.length) {
            companyData.forEach((item) => {
              this.importFrom.list?.push({
                name: item.companyName,
                value: item.id,
                completed: false
              });
            });
          }
          this.companyData = this.importFrom.list;
          this.isConnected = res.data?.companyCount;
          if (this.isConnected && this.isConnected !== 0) {
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
      });
  }

  tooltip(name: string) {
    if (name?.length < 35) {
      return ' ';
    }
    return name;
  }

  getBankAccountsOfQBDCompany() {
    this.importFromBankAccounts.list = [];
    this.companyLoading = true;
    this.integrationService
      .getBankAccountsOfQBDCompany(
        this.QuickBookForm.controls.selectedCompanyDesktop.value.value
      )
      .pipe(
        finalize(() => {
          this.companyLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.data?.length) {
            this.importFromBankAccounts.list = [];
            res.data.forEach((item) => {
              this.importFromBankAccounts.list?.push({
                name: item.account_name,
                value: item.id,
                completed: false
              });
            });
          }
          this.companyBankAccountsQBD = this.importFromBankAccounts.list;
          this.setAll(true);
          this.updateAllComplete();
          this.changeImportFrom();
        }
      });
  }

  onCompanyChange() {
    this.QuickBookForm.controls.selectedCompanyDesktop.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.companyBankAccountsQBD = [];
        this.importFromBankAccounts.list = [];
        this.updateAllComplete();
        this.getBankAccountsOfQBDCompany();
      });
  }

  setFormOptions() {
    this.importFrom.list?.forEach((res) => {
      res.completed = true;
    });
  }

  onSubmit() {
    this.ImportFromQbDeskTop();
  }

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
        fromDate: this.date1.value ?? undefined,
        toDate: this.date2.value ?? undefined
      };
      this.integrationService
        .quickbooksDesktopImport(sendingData)
        .pipe(
          finalize(() => {
            this.loading = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: `Your checks has been imported from <br> <b>${
                data.selectedCompanyDesktop?.name
              }</b>. Reload the checklist after one minute to see the imported checks.`,
              close: false
            });
            this.dialogRef.close({ success: true });
          }
        });
    } else {
      this.alertService.infoAlert({
        content: 'Choose a payment type to import'
      });
    }
  }

  updateAllComplete() {
    this.allComplete =
      this.importFromBankAccounts.list != null &&
      this.importFromBankAccounts.list.every((t) => t.completed);
  }

  someComplete(): boolean {
    if (this.importFromBankAccounts.list == null) {
      return false;
    }
    return (
      this.importFromBankAccounts.list.filter((t) => t.completed).length > 0 &&
      !this.allComplete
    );
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.importFromBankAccounts.list == null) {
      return;
    }
    this.importFromBankAccounts.list.forEach((t) => {
      // eslint-disable-next-line no-param-reassign
      t.completed = completed;
    });
  }

  changeImportFrom() {
    this.selectedQBBankAC = [];
    this.importFromBankAccounts.list?.forEach((res) => {
      if (res.completed) this.selectedQBBankAC.push(res.value);
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  goToThirdpartyHome() {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { source: 'payments', openAppId: 'qb-desktop' }
    });
    this.dialogRef.close(false);
  }

  getQuickBookDesktop(): void {
    this.integrationService
      .getQuickBookDesktopData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
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
          this.QuickBookForm.valueChanges
            .pipe(debounceTime(1500), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.updateSettings();
            });
        }
      });
  }

  updateSettings() {
    const sendingData = {
      check: this.QuickBookForm.value.importCheck ? 1 : 0,
      billPayment: this.QuickBookForm.value.importBill ? 1 : 0,
      payroll: this.QuickBookForm.value.importPayroll ? 1 : 0,
      downloadFilter: this.QuickBookForm.value.markAsPrintLater ? 1 : 0
    };
    this.integrationService
      .updateQuickBookDesktopData(sendingData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  openAdvancedSettings() {
    const QBDSettingsData = {
      check: this.QuickBookForm.value.importCheck ? 1 : 0,
      billPayment: this.QuickBookForm.value.importBill ? 1 : 0,
      payroll: this.QuickBookForm.value.importPayroll ? 1 : 0,
      downloadFilter: this.QuickBookForm.value.markAsPrintLater ? 1 : 0,
      defaultTimeSpan: this.quickBookDesktopData.defaultTimeSpan
    };
    const dialogueRef = this.matDialog.open(MoreSettingsQbdesktopComponent, {
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

  setToDefaultTimeSpan() {
    this.date1.setValue(this.quickBookDesktopData.fromDate ?? null);
    this.date2.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
  }

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

  setToDefaultDownloadFilter() {
    this.QuickBookForm.controls.markAsPrintLater.setValue(
      this.quickBookDesktopData.downloadFilter
    );
  }

  back() {
    this.clickBackButton.emit(true);
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

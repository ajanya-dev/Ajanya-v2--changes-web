import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { QBODuplicatedMappingsModalComponent } from 'src/app/modules/integration/modals/qbo-duplicated-mappings-modal/qbo-duplicated-mappings-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { IQuickBookOnlineData } from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-quickbooks-settings',
  templateUrl: './v4-quickbooks-settings.component.html',
  styleUrls: ['./v4-quickbooks-settings.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    WhiteLabelPipe
  ]
})
export class V4QuickbooksSettingsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4QuickbooksSettingsComponent>);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private integrationService = inject(IntegrationService);
  private destroyRef = inject(DestroyRef);
  public data: IQuickBookOnlineData = inject(MAT_DIALOG_DATA);

  isConnected: number;
  isUpdate = false;

  activeTab = signal<'overview' | 'settings' | 'connection'>('settings');

  tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'settings' as const, label: 'Settings' },
    { key: 'connection' as const, label: 'Connection' }
  ];

  disconnectingRealmId = signal('');
  companiesSearch = new FormControl('');

  get filteredCompanies() {
    const search = (this.companiesSearch.value || '').toLowerCase();
    const companies = this.data?.companies || [];
    if (!search) return companies;
    return companies.filter((c) =>
      c.companyName.toLowerCase().includes(search)
    );
  }

  // Form controls
  autoDownloading = new FormControl();
  autoDownloadPermission = new FormControl();
  autoPayeeUpdate = new FormControl();
  printRegularVoucher = new FormControl();
  showWarning = new FormControl();
  showSelectionPopup = new FormControl();
  autoSkipTextEnabled = new FormControl();
  skipTextsInput = new FormControl();
  importTimestampField = new FormControl();
  check = new FormControl();
  billPayment = new FormControl();
  expense = new FormControl();
  refund = new FormControl();
  downloadFilter = new FormControl();
  pushbackEnable = new FormControl();
  autoExportEnable = new FormControl();
  locationEnable = new FormControl();
  skipNumber = new FormControl();

  skipTexts: string[] = [];

  loading = signal({
    defaultLoading: false
  });

  quickBooksLoading = signal({
    bank: false,
    payee: false,
    category: false,
    class: false,
    location: false
  });

  downloadFilters = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  timestampFieldOptions = [
    { value: 'modified_at', name: 'Modified At' },
    { value: 'created_at', name: 'Created At' }
  ];

  ngOnInit(): void {
    if (this.data) {
      this.autoDownloading.setValue(this.data.autoDownloading === 1 ? 1 : 0);
      this.printRegularVoucher.setValue(
        this.data.printRegularVoucher === 1 ? 1 : 0
      );
      this.pushbackEnable.setValue(this.data.pushBackEnable === 1);
      this.autoExportEnable.setValue(this.data.autoExportEnable === 1);
      this.locationEnable.setValue(this.data.locationEnable === 1);
      this.billPayment.setValue(this.data.billPayment === '1' ? 1 : 0);
      this.check.setValue(this.data.check === '1' ? 1 : 0);
      this.expense.setValue(this.data.expense === '1' ? 1 : 0);
      this.refund.setValue(this.data.refund === '1' ? 1 : 0);
      this.downloadFilter.setValue(this.data.downloadFilter === 1 ? 1 : 0);
      this.showWarning.setValue(this.data.showWarning === 1 ? 1 : 0);
      this.skipNumber.setValue(this.data.skipNumber || '');
      this.showSelectionPopup.setValue(
        this.data.importSettings.showSelectionPopup ? 1 : 0
      );
      this.autoDownloadPermission.setValue(
        this.data.autoImportPermission === 1 ? 1 : 0
      );
      this.autoPayeeUpdate.setValue(this.data.autoPayeeUpdate === 1 ? 1 : 0);
      this.importTimestampField.setValue(
        this.data.importSettings.importTimestampField || 'modified_at'
      );
      this.autoSkipTextEnabled.setValue(
        this.data.importSettings.autoSkipTextEnabled ? 1 : 0
      );
      this.skipTexts = this.data.importSettings.skipTexts || [];
      this.skipTextsInput.setValue(this.skipTexts.join(', '));
      this.isConnected = this.data.companyCount;
    }
  }

  postQuickBookOnlineData(type?: string): void {
    if (type === 'update') {
      this.isUpdate = true;
    } else {
      this.isUpdate = false;
    }

    if (
      this.data?.duplication === 1 &&
      this.pushbackEnable.value &&
      this.data.pushBackEnable === 0
    ) {
      this.pushbackEnable.setValue(false);
      const dialog = this.dialog.open(QBODuplicatedMappingsModalComponent, {
        maxWidth: '1010px',
        width: '93%',
        disableClose: true,
        data: this.data?.mapping_data
      });
      dialog.afterClosed().subscribe((res) => {
        if (res) {
          if (res === 'mapping') {
            this.dialogRef.close();
          }
          this.getSettingsDetails();
        }
      });
    }

    if (!this.autoDownloading.value) {
      this.autoDownloadPermission.setValue(0);
    }

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
      autoImportPermission:
        this.autoDownloading.value && this.autoDownloadPermission.value
          ? '1'
          : '0',
      isPayeeAutoUpdateEnabled: this.autoPayeeUpdate.value ? '1' : '0',
      show_selection_popup: this.showSelectionPopup.value ? 1 : 0,
      importTimestampField: this.importTimestampField.value || 'modified_at',
      autoSkipTextEnabled: this.autoSkipTextEnabled.value ? 1 : 0,
      skipTexts: skipTextsArray
    };

    this.loading.update((l) => ({ ...l, defaultLoading: true }));
    this.integrationService
      .postQuickBookOnlineData(data)
      .pipe(
        finalize(() => {
          this.loading.update((l) => ({ ...l, defaultLoading: false }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: { success: boolean; message: string }) => {
        if (res.success && type) {
          this.alertService.successAlert({ content: res.message, close: true });
          this.dialogRef.close(true);
        }
      });
  }

  getSettingsDetails(): void {
    this.integrationService
      .getQuickBookOnlineData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.data = res.data;
        }
      });
  }

  close(): void {
    this.dialogRef.close(true);
  }

  disconnectCompany(realmId: string): void {
    this.disconnectingRealmId.set(realmId);
    this.integrationService
      .disconnectToQuickBooksOnline(realmId)
      .pipe(
        finalize(() => this.disconnectingRealmId.set('')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.message, close: true });
          this.getSettingsDetails();
        }
      });
  }

  onBankImportClicked(): void {
    if (this.isConnected) {
      this.openCompanyListModal('Bank');
    }
  }

  onPayeeImportClicked(): void {
    if (this.isConnected) {
      this.openCompanyListModal('Payee');
    }
  }

  onCategoryImportClicked(mode: string): void {
    if (this.isConnected) {
      this.openCompanyListModal(mode);
    }
  }

  onLocationImportClicked(): void {
    if (this.isConnected) {
      this.openCompanyListModal('Location');
    }
  }

  private openCompanyListModal(mode: string): void {
    const sendingData = {
      mode,
      companyList: this.data?.companies
    };
    const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: sendingData,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (mode === 'Bank') this.importBankFromCompany(res.realmId);
        if (mode === 'Payee') this.importQuickbookPayee(res.realmId);
        if (mode === 'Category')
          this.importQuickbookCategories(
            'get-quickbook-categories',
            res.realmId
          );
        if (mode === 'Class')
          this.importQuickbookCategories('get-quickbook-classes', res.realmId);
        if (mode === 'Location') this.importQuickbookLocations(res.realmId);
      }
    });
  }

  private importBankFromCompany(realmId: string): void {
    this.quickBooksLoading.update((l) => ({ ...l, bank: true }));
    this.integrationService
      .importQuickbookBanks(realmId)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, bank: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully Imported.',
            close: true
          });
        }
      });
  }

  private importQuickbookPayee(realmId: string): void {
    this.quickBooksLoading.update((l) => ({ ...l, payee: true }));
    this.integrationService
      .importQuickbookPayee(realmId)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, payee: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully Imported.',
            close: true
          });
        }
      });
  }

  private importQuickbookCategories(type: string, realmId: string): void {
    const key = type === 'get-quickbook-categories' ? 'category' : 'class';
    this.quickBooksLoading.update((l) => ({ ...l, [key]: true }));
    this.integrationService
      .importQuickbookCategories(type, realmId)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, [key]: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully Imported.',
            close: true
          });
        }
      });
  }

  private importQuickbookLocations(realmId: string): void {
    this.quickBooksLoading.update((l) => ({ ...l, location: true }));
    this.integrationService
      .importQuickbookLocation(realmId)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, location: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully Imported.',
            close: true
          });
        }
      });
  }
}

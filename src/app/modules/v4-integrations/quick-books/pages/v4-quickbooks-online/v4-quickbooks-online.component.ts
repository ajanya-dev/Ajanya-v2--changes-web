import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { QBODuplicatedMappingsModalComponent } from 'src/app/modules/integration/modals/qbo-duplicated-mappings-modal/qbo-duplicated-mappings-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import {
  IQbConnectedCompany,
  IQuickBookOnlineData
} from 'src/app/modules/integration/model/integration';
import { IAppConfig } from 'src/app/models/app_settings';
import { V4QboMappingComponent } from '../../modals/v4-qbo-mapping/v4-qbo-mapping.component';

@Component({
  selector: 'app-v4-quickbooks-online',
  templateUrl: './v4-quickbooks-online.component.html',
  styleUrls: ['./v4-quickbooks-online.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    WhiteLabelPipe
  ]
})
export class V4QuickbooksOnlineComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private appSettingsService = inject(AppSettingsService);
  private scriptService = inject(ScriptService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  appConfig: IAppConfig;
  quickBookOnlineData: IQuickBookOnlineData;
  QbConnectedCompany: IQbConnectedCompany[];
  isConnected: number;
  disconnecting: undefined | number = undefined;

  searchControl = new FormControl();

  // General Settings
  autoDownloading = new FormControl();
  autoDownloadPermission = new FormControl();
  autoPayeeUpdate = new FormControl();
  printRegularVoucher = new FormControl();
  showWarning = new FormControl();
  showSelectionPopup = new FormControl();
  autoSkipTextEnabled = new FormControl();
  skipTextsInput = new FormControl();

  // Import Timestamp
  importTimestampField = new FormControl();

  // Check Type
  check = new FormControl();
  billPayment = new FormControl();
  expense = new FormControl();
  refund = new FormControl();

  // Download Filter
  downloadFilter = new FormControl();

  // Export & Sync
  pushbackEnable = new FormControl();
  autoExportEnable = new FormControl();
  locationEnable = new FormControl();
  skipNumber = new FormControl();

  skipTexts: string[] = [];

  loading = signal({
    defaultLoading: false,
    companyLoading: false
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
    this.getQuickBookOnlineData();

    this.appSettingsService.appConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.appConfig = res;
        }
      });
  }

  getQuickBookOnlineData(fromCallBack?: boolean): void {
    if (!fromCallBack) {
      this.loading.update((l) => ({ ...l, companyLoading: true }));
    }

    this.integrationService
      .getQuickBookOnlineData()
      .pipe(
        finalize(() => {
          this.loading.update((l) => ({ ...l, companyLoading: false }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.quickBookOnlineData = res.data;
          this.QbConnectedCompany = res.data.companies;
          this.isConnected = res.data.companyCount;
          this.initFormControls(res.data);
        }
      });
  }

  private initFormControls(data: IQuickBookOnlineData): void {
    this.autoDownloading.setValue(data.autoDownloading === 1 ? 1 : 0);
    this.printRegularVoucher.setValue(data.printRegularVoucher === 1 ? 1 : 0);
    this.pushbackEnable.setValue(data.pushBackEnable === 1);
    this.autoExportEnable.setValue(data.autoExportEnable === 1);
    this.locationEnable.setValue(data.locationEnable === 1);
    this.billPayment.setValue(data.billPayment === '1' ? 1 : 0);
    this.check.setValue(data.check === '1' ? 1 : 0);
    this.expense.setValue(data.expense === '1' ? 1 : 0);
    this.refund.setValue(data.refund === '1' ? 1 : 0);
    this.downloadFilter.setValue(data.downloadFilter === 1 ? 1 : 0);
    this.showWarning.setValue(data.showWarning === 1 ? 1 : 0);
    this.skipNumber.setValue(data.skipNumber || '');
    this.showSelectionPopup.setValue(
      data.importSettings?.showSelectionPopup ? 1 : 0
    );
    this.autoDownloadPermission.setValue(
      data.autoImportPermission === 1 ? 1 : 0
    );
    this.autoPayeeUpdate.setValue(data.autoPayeeUpdate === 1 ? 1 : 0);
    this.importTimestampField.setValue(
      data.importSettings?.importTimestampField || 'modified_at'
    );
    this.autoSkipTextEnabled.setValue(
      data.importSettings?.autoSkipTextEnabled ? 1 : 0
    );
    this.skipTexts = data.importSettings?.skipTexts || [];
    this.skipTextsInput.setValue(this.skipTexts.join(', '));
  }

  onConnectToQuickBooks(): void {
    this.loading.update((l) => ({ ...l, defaultLoading: true }));

    this.integrationService
      .connectToQuickBooksOnline()
      .pipe(
        finalize(() => {
          this.loading.update((l) => ({ ...l, defaultLoading: false }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.scriptService.gtagEventScript('qbonline-init');
          window.open(res?.redirectUrl, '_self');
        }
      });
  }

  onDisconnectToQuickBooks(
    realmId: string,
    companyName: string,
    index: number
  ): void {
    const confirm = this.alertService.confirmAlert({
      content: `Are you sure you want to disconnect ${companyName}?`
    });
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.onDisconnectAction(realmId, index);
      }
    });
  }

  private onDisconnectAction(realmId: string, index: number): void {
    this.disconnecting = index;

    this.integrationService
      .disconnectToQuickBooksOnline(realmId)
      .pipe(
        finalize(() => {
          this.disconnecting = undefined;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully disconnected.',
            close: true
          });
          this.quickBookOnlineData.companies.splice(index, 1);
          if (!this.quickBookOnlineData.companies.length) {
            this.isConnected = 0;
          }
        }
      });
  }

  postQuickBookOnlineData(type?: string): void {
    if (
      this.quickBookOnlineData?.duplication === 1 &&
      this.pushbackEnable.value &&
      this.quickBookOnlineData.pushBackEnable === 0
    ) {
      this.pushbackEnable.setValue(false);
      const dialog = this.dialog.open(QBODuplicatedMappingsModalComponent, {
        maxWidth: '1010px',
        width: '93%',
        disableClose: true,
        data: this.quickBookOnlineData?.mapping_data
      });
      dialog.afterClosed().subscribe((res) => {
        if (res) {
          this.getQuickBookOnlineData(true);
        }
      });
      return;
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
        if (res.success && type === 'update') {
          this.alertService.successAlert({ content: res.message, close: true });
        }
      });
  }

  onMapCompany(): void {
    if (this.loading().companyLoading) return;
    const dialogRef = this.dialog.open(V4QboMappingComponent, {
      maxWidth: '1050px',
      width: '93%',
      data: this.quickBookOnlineData,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef.afterClosed().subscribe((res: boolean) => {
      if (res) {
        this.getQuickBookOnlineData(true);
      }
    });
  }

  onSearchCompany(input: HTMLInputElement): void {
    const inputValue = input.value;
    if (inputValue !== '') {
      this.quickBookOnlineData.companies = this.QbConnectedCompany.filter(
        (element: IQbConnectedCompany) =>
          element.companyName.toLowerCase().includes(inputValue.toLowerCase())
      );
    } else {
      this.quickBookOnlineData.companies = this.QbConnectedCompany;
    }
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
      companyList: this.quickBookOnlineData?.companies
    };
    const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: sendingData,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef
      .afterClosed()
      .subscribe((res: { realmId: string } | undefined) => {
        if (res) {
          if (mode === 'Bank') this.importBankFromCompany(res.realmId);
          if (mode === 'Payee') this.importQuickbookPayee(res.realmId);
          if (mode === 'Category')
            this.importQuickbookCategories(
              'get-quickbook-categories',
              res.realmId
            );
          if (mode === 'Class')
            this.importQuickbookCategories(
              'get-quickbook-classes',
              res.realmId
            );
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

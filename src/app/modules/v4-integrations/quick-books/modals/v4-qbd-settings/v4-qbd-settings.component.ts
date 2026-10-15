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
import { MatCheckbox } from '@angular/material/checkbox';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { NgClass } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { QBODuplicatedMappingsModalComponent } from 'src/app/modules/integration/modals/qbo-duplicated-mappings-modal/qbo-duplicated-mappings-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import {
  IQBDData,
  IQbCompanyList
} from 'src/app/modules/integration/model/integration';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-v4-qbd-settings',
  templateUrl: './v4-qbd-settings.component.html',
  styleUrls: ['./v4-qbd-settings.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatTooltip,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    LucideAngularModule,
    CommonButtonV4Component,
    WhiteLabelPipe
  ]
})
export class V4QbdSettingsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4QbdSettingsComponent>);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private integrationService = inject(IntegrationService);
  private destroyRef = inject(DestroyRef);
  public data: IQBDData = inject(MAT_DIALOG_DATA);

  isConnected = 0;
  isUpdate = false;
  ispushbackEnable = false;
  companyData: IQbCompanyList[] = [];

  // Form controls
  check = new FormControl();
  billPayment = new FormControl();
  payroll = new FormControl();
  downloadFilter = new FormControl();
  defaultTimeSpan = new FormControl();
  pushbackEnable = new FormControl();

  loading = signal({ defaultLoading: false });

  quickBooksLoading = signal({
    bank: false,
    payee: false,
    category: false,
    class: false
  });

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

  ngOnInit(): void {
    if (this.data) {
      this.check.setValue(this.data.check);
      this.billPayment.setValue(this.data.billPayment);
      this.payroll.setValue(this.data.payroll);
      this.downloadFilter.setValue(this.data.downloadFilter);
      this.defaultTimeSpan.setValue(this.data.defaultTimeSpan);
      this.pushbackEnable.setValue(this.data.pushBackEnable);
      this.ispushbackEnable = this.data.allowExport;
      this.loadCompanyData();
    }
  }

  updateSettings(isClose: boolean): void {
    if (isClose) {
      this.isUpdate = true;
    } else {
      this.isUpdate = false;
    }

    const sendingData = {
      check: this.check.value ? 1 : 0,
      billPayment: this.billPayment.value ? 1 : 0,
      payroll: this.payroll.value ? 1 : 0,
      downloadFilter: this.downloadFilter.value ? 1 : 0,
      defaultTimeSpan: this.defaultTimeSpan.value,
      pushBackEnable: this.pushbackEnable.value ? 1 : 0
    };

    this.loading.update((l) => ({ ...l, defaultLoading: true }));
    this.integrationService
      .updateQuickBookDesktopData(sendingData)
      .pipe(
        finalize(() => {
          this.loading.update((l) => ({ ...l, defaultLoading: false }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (isClose) {
            this.alertService.successAlert({
              content: 'Settings updated successfully',
              close: true
            });
            this.dialogRef.close(true);
          }
        }
      });
  }

  resetToRecommended(): void {
    this.check.setValue(1);
    this.billPayment.setValue(1);
    this.payroll.setValue(0);
    this.downloadFilter.setValue(0);
    this.defaultTimeSpan.setValue(7);
    this.updateSettings(false);
  }

  close(): void {
    this.dialogRef.close(false);
  }

  EnablePushBack(): void {
    if (
      this.data.duplication == 1 &&
      this.pushbackEnable.value &&
      this.data.pushBackEnable == 0
    ) {
      this.pushbackEnable.setValue(false);
      const dialog = this.dialog.open(QBODuplicatedMappingsModalComponent, {
        maxWidth: '1010px',
        width: '93%',
        disableClose: true,
        data: {
          data: this.data?.mapping_data,
          type: 'desktop'
        }
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
  }

  ImportData(type: string): void {
    const sendingData = {
      mode: type,
      companyList: this.companyData
    };

    if (this.isConnected) {
      const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          if (type === 'Bank') {
            this.importNewBankAccountsOfQBDCompany(res.id);
          } else if (type === 'Payee') {
            const whiteLabelPayee =
              environment.env_id === 'compass' ? 'Vendor' : 'Payee';
            this.importNewDetailsOfQBDCompany(
              res.id,
              'import-payee',
              whiteLabelPayee
            );
          } else if (type === 'Expense') {
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
      this.alertService.warningAlert({
        content: "We couldn't connect to any QuickBooks Desktop company",
        close: true
      });
    }
  }

  private loadCompanyData(): void {
    this.integrationService
      .getQuickbooksDesktopCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.companyData = res.data.companies;
          this.isConnected = res.data?.companyCount;
        }
      });
  }

  private importNewBankAccountsOfQBDCompany(companyId: string): void {
    this.quickBooksLoading.update((l) => ({ ...l, bank: true }));
    const sendingData = new FormData();
    sendingData.append('company_id', companyId);
    this.integrationService
      .importNewBankAccountsOfQBDCompany(sendingData)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, bank: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content:
              'Your bank accounts has been imported. Please refresh and check the list after one minute.',
            close: true
          });
        }
      });
  }

  private importNewDetailsOfQBDCompany(
    companyId: string,
    urlEnd: string,
    type: string
  ): void {
    const key =
      type.toLowerCase().includes('payee') ||
      type.toLowerCase().includes('vendor')
        ? 'payee'
        : 'category';
    this.quickBooksLoading.update((l) => ({ ...l, [key]: true }));

    const sendingData = new FormData();
    sendingData.append('company_id', companyId);
    this.integrationService
      .importQBDCompanyDetails(urlEnd, sendingData)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, [key]: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: `Your ${type} has been imported. Please refresh and check the list after one minute.`,
            close: true
          });
        }
      });
  }

  private getSettingsDetails(): void {
    this.integrationService
      .getQuickBookDesktopData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.data = res.data;
        }
      });
  }
}

import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  V4RadioGroupComponent,
  IV4RadioOption
} from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IConnectedCompanyList,
  IConnectedThirdPartyData
} from 'src/app/modules/integration/model/integration';
import { V4ZohoBooksMapBankAccountsModalComponent } from '../../modals/v4-zoho-books-bank-mapping-modal/v4-zoho-books-bank-mapping-modal.component';

@Component({
  selector: 'app-v4-zoho-books-settings',
  standalone: true,
  templateUrl: './v4-zoho-books-settings.component.html',
  styleUrls: ['./v4-zoho-books-settings.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatCheckboxModule,
    CommonButtonV4Component,
    V4RadioGroupComponent
  ]
})
export class V4ZohoBooksSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  readonly providerCode = 'zoho_books' as const;

  importTimeOptions: IV4RadioOption[] = [
    { id: 1, name: '2 hours' },
    { id: 2, name: '12 hours' },
    { id: 3, name: '24 hours' },
    { id: 4, name: '3 days' },
    { id: 5, name: '7 days' },
    { id: 6, name: '14 days' },
    { id: 7, name: '30 days' }
  ];

  importDataTypeOptions: IV4RadioOption[] = [
    { id: '0', name: 'Download all' },
    { id: '1', name: 'Import only items marked as print later' }
  ];

  loading = signal({
    dataLoading: false,
    companyLoading: false,
    importCompany: false,
    startImporting: false
  });

  isConnected = signal(false);
  zohoData = signal<IConnectedThirdPartyData | null>(null);
  companies = signal<IConnectedCompanyList[]>([]);
  selectedCompanies = signal<string[]>([]);

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadZohoData();
  }

  private initForm(): void {
    this.form = this.fb.group({
      importDataInLast: [3],
      importDataType: ['0'],
      selectAll: [true]
    });
  }

  private loadZohoData(fromCallback = false): void {
    this.loading.update((l) => ({
      ...l,
      dataLoading: true,
      companyLoading: true
    }));

    this.integrationService
      .getDetails(this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({
            ...l,
            dataLoading: false,
            companyLoading: false
          }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.zohoData.set(res.data);
          const isConnected = res.data.connected !== 0;
          this.isConnected.set(isConnected);
          const companyList = res.data.companies || [];
          this.companies.set(companyList);

          if (!fromCallback && companyList.length) {
            const allIds = companyList.map((c) => c.companyId);
            this.selectedCompanies.set(allIds);
          }
        } else {
          this.zohoData.set(null);
          this.isConnected.set(false);
          this.companies.set([]);
          this.selectedCompanies.set([]);
        }
      });
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      const allIds = this.companies().map((c) => c.companyId);
      this.selectedCompanies.set(allIds);
    } else {
      this.selectedCompanies.set([]);
    }
  }

  toggleCompany(companyId: string, checked: boolean): void {
    const current = this.selectedCompanies();
    if (checked) {
      if (!current.includes(companyId)) {
        this.selectedCompanies.set([...current, companyId]);
      }
    } else {
      this.selectedCompanies.set(current.filter((id) => id !== companyId));
    }
  }

  onImportCompanies(): void {
    if (this.loading().importCompany) return;

    this.loading.update((l) => ({ ...l, importCompany: true }));

    this.integrationService
      .importZohoCompany(this.providerCode)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, importCompany: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: res.message || 'Companies added successfully',
            close: true
          });
          if (res.message !== 'No Company available to add') {
            this.loadZohoData(true);
          }
          this.selectedCompanies.set([]);
        }
      });
  }

  onDisconnect(): void {
    const confirmRef = this.alertService.confirmAlert({
      content:
        'All your connected companies will be disconnected. Are you sure you want to continue?',
      doneMsg: 'Disconnect'
    });

    confirmRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.update((l) => ({ ...l, dataLoading: true }));

      this.integrationService
        .disconnect()
        .pipe(
          finalize(() =>
            this.loading.update((l) => ({ ...l, dataLoading: false }))
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Disconnected successfully.',
              close: true
            });
            this.loadZohoData(true);
          }
        });
    });
  }

  onImportChecks(): void {
    if (this.loading().startImporting) return;

    const selected = this.selectedCompanies();
    if (!selected.length) {
      this.alertService.warningAlert({
        content: 'Please select at least one company.'
      });
      return;
    }

    const params = {
      markAsPrintLater: this.form.value.importDataType,
      importTime: this.form.value.importDataInLast,
      companyId: selected
    };

    this.loading.update((l) => ({ ...l, startImporting: true }));

    this.integrationService
      .startImporting(this.providerCode, params)
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, startImporting: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Imported Successfully.',
            close: true
          });
          this.loadZohoData(true);
          this.selectedCompanies.set([]);
        }
      });
  }

  onViewBankAccountMapping(): void {
    this.dialog.open(V4ZohoBooksMapBankAccountsModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { companies: this.companies() }
    });
  }
}

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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  UntypedFormControl,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Settings,
  Building2,
  Search,
  Filter,
  Clock
} from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  IImportForm,
  IImportedFromList,
  IThirdPartyTransactionBody
} from 'src/app/modules/integration/model/integration';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { SortPipe } from '../../../../pipes/sort.pipe';

@Component({
  selector: 'app-v4-zoho-import',
  templateUrl: './v4-zoho-import.component.html',
  styleUrls: ['./v4-zoho-import.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    SortPipe,
    V4RadioGroupComponent,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    LucideAngularModule,
    NgOptimizedImage
  ]
})
export class V4ZohoImportComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<V4ZohoImportComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  // Signal-based inputs/outputs
  connectionStatus = output<boolean>();
  clickBackButton = output<boolean>();
  selectedType = input<string>();

  // Lucide icons
  readonly SettingsIcon = Settings;
  readonly Building2Icon = Building2;
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly ClockIcon = Clock;

  zohoForm: UntypedFormGroup;
  allChecked = false;
  selectedCompany: string[] = [];
  loading = false;
  dataLoaded = false;
  searchText = '';
  companyData: IImportedFromList[];

  importTime = [
    { id: 1, name: 'Last 2 hours' },
    { id: 2, name: 'Last 12 hours' },
    { id: 3, name: 'Last 24 hours' },
    { id: 4, name: 'Last 3 days' },
    { id: 5, name: 'Last 7 days' },
    { id: 6, name: 'Last 14 days' }
  ];

  downloadFilterChecks = [
    { id: 0, name: 'Download All' },
    { id: 1, name: 'Download only mark as print later' }
  ];

  downloadFilterinvoices = [
    { id: 0, name: 'All invoices' },
    { id: 1, name: 'Import Unpaid invoices' }
  ];

  downloadFilterBills = [
    { id: 0, name: 'All bills' },
    { id: 1, name: 'Open bills only' }
  ];

  importFrom: IImportForm = {
    name: 'Select all',
    completed: false,
    list: []
  };

  providerCode = 'zoho_books';
  isConnected: number;

  ngOnInit(): void {
    this.loadCompanyData();
    this.initFormGroup();
  }

  initFormGroup() {
    this.zohoForm = new UntypedFormGroup({
      importFrom: new UntypedFormControl(''),
      importTime: new UntypedFormControl(this.importTime[0].id),
      checkType: new UntypedFormControl(true),
      invoiceStatus: new UntypedFormControl(0),
      billStatus: new UntypedFormControl(0),
      markAsPrintLater: new UntypedFormControl(0)
    });
  }

  onSearchCompany() {
    this.companyData = this.importFrom.list.filter(
      (element: IImportedFromList) =>
        element.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  loadCompanyData() {
    this.integrationService
      .getDetails(this.providerCode)
      .pipe(
        finalize(() => {
          this.dataLoaded = true;
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.isConnected = res.data.connected;
          if (this.isConnected) {
            this.connectionStatus.emit(true);
          } else {
            this.connectionStatus.emit(false);
          }
          res.data.companies.forEach((item) => {
            this.importFrom.list?.push({
              name: item.companyName,
              value: item.companyId,
              completed: false
            });
          });
          this.companyData = this.importFrom.list;
          this.setFormOptions();
          this.changeImportFrom();
        }
      });
  }

  tooltip(name: string) {
    if (name?.length < 35) {
      return ' ';
    }
    return name;
  }

  setFormOptions() {
    this.importFrom.list?.forEach((res: IImportedFromList) => {
      res.checked = true;
    });
  }

  changeImportFrom() {
    this.selectedCompany = [];
    this.importFrom.list?.forEach((res) => {
      if (res.checked) this.selectedCompany.push(res.value);
    });
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
    const params: IThirdPartyTransactionBody = {
      markAsPrintLater: this.zohoForm.value.markAsPrintLater,
      importTime: this.zohoForm.value.importTime,
      companyId: this.selectedCompany,
      invoice_status: this.zohoForm.controls.invoiceStatus.value,
      bill_status: this.zohoForm.controls.billStatus.value
    };
    if (this.data.type === 'bills') {
      params.type = 2;
    } else if (this.data.type === 'invoices') {
      params.type = 3;
    } else if (this.data.type === 'checks') {
      params.type = 1;
    }
    this.loading = true;
    this.integrationService
      .thirdpPartyTransactionImporting(this.providerCode, params)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.companyWithError?.length) {
            if (this.selectedCompany.length === res.companyWithError.length) {
              const companyWithErrorNames = this.companyData.map((element) => {
                for (let i = 0; i < res.companyWithError.length; i += 1) {
                  if (element.value === res.companyWithError[i]) {
                    return `${element.name}`;
                  }
                }
                return undefined;
              });
              this.alertService.warningAlert({
                content: `Failed to import from company ${companyWithErrorNames
                  .filter(Boolean)
                  .join(', ')}.`
              });
            } else {
              const successSelectedCompanies = this.selectedCompany
                .filter((val) =>
                  !res.companyWithError.includes(val) ? val : undefined
                )
                .filter(Boolean);
              const result = this.companyData.reduce(
                (response: { success: string[]; error: string[] }, company) => {
                  for (let i = 0; i < res.companyWithError.length; i += 1) {
                    if (company.value === res.companyWithError[i]) {
                      response.error.push(company.name);
                    }
                  }
                  for (let i = 0; i < successSelectedCompanies.length; i += 1) {
                    if (company.value === successSelectedCompanies[i]) {
                      response.success.push(company.name);
                    }
                  }
                  return response;
                },
                { success: [], error: [] }
              );
              if (result?.success?.length) {
                this.alertService.infoAlert({
                  content: `Imported from company ${result.success.join(
                    ', '
                  )}. <br> Failed to import from company ${result.error.join(
                    ', '
                  )}.`
                });
              } else {
                this.alertService.warningAlert({
                  content: `Failed to import from company ${result.error.join(
                    ', '
                  )}.`
                });
              }
            }
          } else {
            this.alertService.successAlert({
              content: res.message,
              close: true
            });
          }
          this.dialogRef.close({ success: true });
        }
      });
  }

  updateAllComplete() {
    this.allChecked =
      this.importFrom.list != null &&
      this.importFrom.list.every((t: IImportedFromList) => t.checked);
  }

  someComplete(): boolean {
    if (this.importFrom.list == null) {
      return false;
    }
    return (
      this.importFrom.list.filter((t: IImportedFromList) => t.checked).length >
        0 && !this.allChecked
    );
  }

  setAll(checked: boolean) {
    this.allChecked = checked;
    if (this.importFrom.list == null) {
      return;
    }
    this.importFrom.list.forEach((t: IImportedFromList) => {
      // eslint-disable-next-line no-param-reassign
      t.checked = checked;
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  goToThirdpartyHome() {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { openAppId: 'zoho' }
    });
    this.dialogRef.close(false);
  }

  back() {
    this.clickBackButton.emit(true);
  }
}

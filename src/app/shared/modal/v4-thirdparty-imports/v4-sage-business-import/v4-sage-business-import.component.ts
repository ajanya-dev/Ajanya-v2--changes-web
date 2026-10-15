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
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Settings,
  Building2,
  Filter,
  Clock
} from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  IImportForm,
  IThirdPartyTransactionBody
} from 'src/app/modules/integration/model/integration';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

interface ICompanyList {
  completed: boolean;
  name: string;
  value: string;
  checked?: boolean;
}

@Component({
  selector: 'app-v4-sage-business-import',
  templateUrl: './v4-sage-business-import.component.html',
  styleUrls: ['./v4-sage-business-import.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    V4RadioGroupComponent,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    LucideAngularModule,
    NgOptimizedImage
  ]
})
export class V4SageBusinessImportComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private fb = inject(UntypedFormBuilder);
  private dialogRef = inject(MatDialogRef<V4SageBusinessImportComponent>);
  public data: {
    type: 'bills' | 'invoices' | 'checks';
    [key: string]: string;
  } = inject(MAT_DIALOG_DATA);

  private destroyRef = inject(DestroyRef);

  // Signal-based inputs/outputs
  connectionStatus = output<boolean>();
  clickBackButton = output<boolean>();
  selectedType = input<string>();

  // Lucide icons
  readonly SettingsIcon = Settings;
  readonly Building2Icon = Building2;
  readonly FilterIcon = Filter;
  readonly ClockIcon = Clock;

  sagebusinessForm: UntypedFormGroup;
  allChecked = false;
  selectedCompany: string[] = [];
  loading = false;
  dataLoaded = false;
  searchText = '';
  companyData: ICompanyList[];

  importTime = [
    { id: 1, name: 'Last 2 hours' },
    { id: 2, name: 'Last 12 hours' },
    { id: 3, name: 'Last 24 hours' },
    { id: 4, name: 'Last 3 days' },
    { id: 5, name: 'Last 7 days' },
    { id: 6, name: 'Last 14 days' },
    { id: 7, name: 'Last 30 days' }
  ];

  downloadFilter = [
    { id: 0, name: 'Download All' },
    { id: 1, name: `Download unpaid ${this.data.type} only` }
  ];

  importFrom: IImportForm = {
    name: 'Import From',
    completed: false,
    list: [
      {
        name: '',
        value: '',
        completed: false
      }
    ]
  };

  providerCode = 'sage_business';
  isConnected: number;

  ngOnInit(): void {
    this.loadCompanyData();
    this.initFormGroup();
  }

  initFormGroup(): void {
    this.sagebusinessForm = this.fb.group({
      importFrom: [''],
      importTime: [this.importTime[2].id],
      importStatus: [this.downloadFilter[1].id]
    });
  }

  onSearchCompany(): void {
    this.companyData = this.importFrom.list.filter((element) =>
      element.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  loadCompanyData(): void {
    this.integrationService
      .getDetails(this.providerCode)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.dataLoaded = true;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          res.data.companies.forEach((item) => {
            this.importFrom.list?.push({
              name: item.companyName,
              value: item.companyId,
              completed: false
            });
            this.companyData = this.importFrom.list;
            this.isConnected = res.data.connected;
            if (this.isConnected) {
              this.connectionStatus.emit(true);
            } else {
              this.connectionStatus.emit(false);
            }
          });
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

  setFormOptions(): void {
    this.importFrom.list?.forEach((res) => {
      res.checked = true;
    });
    this.importFrom.list.shift();
  }

  changeImportFrom(): void {
    this.selectedCompany = [];
    this.importFrom.list?.forEach((res) => {
      if (res.checked) this.selectedCompany.push(res.value);
    });
  }

  onSubmit(): void {
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

  postImportBody(): void {
    const params: IThirdPartyTransactionBody = {
      importTime: this.sagebusinessForm.value.importTime,
      companyId: this.selectedCompany,
      importStatus: this.sagebusinessForm.value.importStatus,
      importBill: 0
    };
    if (this.data.type === 'bills') {
      params.importBill = 1;
    } else if (this.data.type === 'invoices') {
      params.importBill = 2;
    } else if (this.data.type === 'checks') {
      params.importBill = 3;
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
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
          this.dialogRef.close({ success: true });
        }
      });
  }

  updateAllComplete(): void {
    this.allChecked =
      this.importFrom.list != null &&
      this.importFrom.list.every((t) => t.checked);
  }

  someComplete(): boolean {
    if (this.importFrom.list == null) {
      return false;
    }
    return (
      this.importFrom.list.filter((t) => t.checked).length > 0 &&
      !this.allChecked
    );
  }

  setAll(checked: boolean): void {
    this.allChecked = checked;
    if (this.importFrom.list == null) {
      return;
    }
    this.importFrom.list.forEach((t) => {
      const item = t;
      item.checked = checked;
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  goToThirdpartyHome(): void {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { source: 'payments', openAppId: 'sage-business' }
    });
    this.dialogRef.close(false);
  }

  back() {
    this.clickBackButton.emit(true);
  }
}

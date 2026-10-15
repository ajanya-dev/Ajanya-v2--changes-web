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
import { FormsModule } from '@angular/forms';

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
  Clock
} from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { SortPipe } from '../../../../pipes/sort.pipe';

interface IBillDotComCompany {
  name: string;
  value: string;
  checked?: boolean;
}

@Component({
  selector: 'app-v4-bill-dot-com-import',
  templateUrl: './v4-bill-dot-com-import.component.html',
  styleUrls: ['./v4-bill-dot-com-import.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    MatCheckbox,
    V4RadioGroupComponent,
    SortPipe,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    LucideAngularModule,
    NgOptimizedImage
  ]
})
export class V4BillDotComImportComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<V4BillDotComImportComponent>);
  public data: { type: string } = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  // Signal-based inputs/outputs
  connectionStatus = output<boolean>();
  clickBackButton = output<boolean>();
  selectedType = input<string>();

  // Lucide icons
  readonly SettingsIcon = Settings;
  readonly Building2Icon = Building2;
  readonly ClockIcon = Clock;

  allChecked = false;
  selectedCompany: string[] = [];
  companyData: IBillDotComCompany[];
  isConnected: number;
  loading = false;
  dataLoaded = false;
  searchText = '';

  importTime = [
    { id: '1', name: 'Last 2 hours' },
    { id: '2', name: 'Last 12 hours' },
    { id: '3', name: 'Last 24 hours' },
    { id: '4', name: 'Last 3 days' },
    { id: '5', name: 'Last 7 days' },
    { id: '7', name: 'Last 15 days' }
  ];

  selectedImportTime = '3';

  importFrom: { name: string; completed: boolean; list: IBillDotComCompany[] } =
    {
      name: 'Import From',
      completed: false,
      list: []
    };

  ngOnInit(): void {
    this.getOrgs();
  }

  getOrgs(): void {
    this.integrationService
      .getBillOrgs()
      .pipe(
        finalize(() => {
          this.dataLoaded = true;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          const companyData = data.data;
          companyData.forEach((item) => {
            this.importFrom.list?.push({
              name: item.orgName,
              value: item.orgId
            });
          });
          this.companyData = this.importFrom.list;
          this.isConnected = companyData?.length;
          if (this.isConnected) {
            this.connectionStatus.emit(true);
          } else {
            this.connectionStatus.emit(false);
          }
          this.setFormOptions();
          this.changeImportFrom();
        }
      });
  }

  onSearchCompany(): void {
    this.companyData = this.importFrom.list.filter((element) =>
      element.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  setFormOptions(): void {
    this.importFrom.list?.forEach((res) => {
      res.checked = true;
    });
  }

  changeImportFrom(): void {
    this.selectedCompany = [];
    this.importFrom.list?.forEach((res) => {
      if (res.checked) this.selectedCompany.push(res.value);
    });
  }

  tooltip(name: string) {
    if (name?.length < 35) {
      return ' ';
    }
    return name;
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

  onSubmit(): void {
    if (this.selectedCompany?.length === 0) {
      this.alertService.warningAlert({ content: 'Please select a company' });
      return;
    }

    this.loading = true;
    const body = {
      orgId: this.selectedCompany,
      importTime: this.selectedImportTime
    };
    this.integrationService
      .importFromBilldotCom(body)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({ content: 'Bills imported' });
          this.dialogRef.close({ success: true });
        }
      });
  }

  goToThirdpartyHome(): void {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { openAppId: 'bill' }
    });
    this.dialogRef.close(false);
  }

  back(): void {
    this.clickBackButton.emit(true);
  }
}

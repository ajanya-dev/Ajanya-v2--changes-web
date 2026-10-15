import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatCheckboxChange,
  MatCheckboxModule
} from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from 'src/environments/environment';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';

@Component({
  selector: 'app-v4-netsuite-settings-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTooltipModule,
    LucideAngularModule,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-netsuite-settings-modal.component.html',
  styleUrl: './v4-netsuite-settings-modal.component.scss'
})
export class V4NetsuiteSettingsModalComponent implements OnInit {
  private netsuiteService = inject(NetsuiteIntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private alertService = inject(V4AlertService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4NetsuiteSettingsModalComponent>);
  private destroyRef = inject(DestroyRef);

  isBankImport = signal(false);
  isPayeeImport = signal(false);
  isExpenseImport = signal(false);
  isClassImport = signal(false);
  isSubsidiaryImport = signal(false);
  isLocationImport = signal(false);
  isUpdate = signal(false);
  isAllowExport = false;
  isLoadSettings = signal(false);
  whiteLabelName = environment.env_id === 'compass' ? 'Vendor' : 'Payee';

  cachedDefaultSubsidiaryId = signal<string | null>(null);
  defaultSubsidiaryId = signal<string | null>(null);
  subsidiaryList = signal<{ id: string; name: string }[]>([]);
  subsidiaryLoading = signal(false);

  subsidiaryDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Subsidiary',
    displayField: 'name',
    outputField: 'id',
    displaySubField: 'defaultLabel'
  };

  subsidiaryOptions = computed(() =>
    this.subsidiaryList().map((s) => ({
      ...s,
      defaultLabel: this.cachedDefaultSubsidiaryId() === s.id ? 'Default' : ''
    }))
  );

  downloadFilters = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  settingForm = this.fb.group({
    check: [1],
    downloadFilter: [0],
    pushBackEnable: [0],
    customField: [''],
    autoExportEnable: [0]
  });

  ngOnInit(): void {
    this.getSettings();
    this.getSubsidiary();
  }

  getSettings(): void {
    this.isLoadSettings.set(true);
    this.subsidiaryLoading.set(true);
    this.netsuiteService
      .getSettings()
      .pipe(
        finalize(() => {
          this.isLoadSettings.set(false);
          this.subsidiaryLoading.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.settingForm.patchValue(res.data);
          this.isAllowExport = res.data.allowExport;
          if (res.data.defaultSubsidiaryId) {
            this.subsidiaryList.set([
              {
                id: res.data.defaultSubsidiaryId,
                name: res.data.defaultSubsidiaryName ?? ''
              }
            ]);
          }
          this.defaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
          this.cachedDefaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
          this.changeDetector.markForCheck();
        }
      });
  }

  getSubsidiary(): void {
    this.subsidiaryLoading.set(true);
    this.netsuiteService
      .getSubsidiary()
      .pipe(
        finalize(() => {
          this.subsidiaryLoading.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.subsidiaryList.update((list) => {
            const existingIds = new Set(list.map((item) => item.id));
            const newItems = res.data.filter(
              (item) => !existingIds.has(item.id)
            );
            return [...list, ...newItems];
          });
        }
      });
  }

  setSubsidiaryId(event: string | null): void {
    this.defaultSubsidiaryId.set(event || null);
    this.changeDetector.markForCheck();
  }

  enablePushBack(event: MatCheckboxChange): void {
    this.settingForm.controls.pushBackEnable.setValue(event.checked ? 1 : 0);
    this.changeDetector.markForCheck();
  }

  enableAutoExport(event: MatCheckboxChange): void {
    this.settingForm.controls.autoExportEnable.setValue(event.checked ? 1 : 0);
    this.changeDetector.markForCheck();
  }

  importSettings(importType: string): void {
    let type: number | undefined;
    if (importType === 'bank-accounts') {
      this.isBankImport.set(true);
    } else if (importType === 'payees') {
      type = 1;
      this.isPayeeImport.set(true);
    } else if (importType === 'classes') {
      this.isClassImport.set(true);
    } else if (importType === 'subsidiaries') {
      this.isSubsidiaryImport.set(true);
    } else {
      this.isExpenseImport.set(true);
    }

    this.netsuiteService
      .importNetsuiteSettings(`import-${importType}`, type)
      .pipe(
        finalize(() => {
          this.isBankImport.set(false);
          this.isPayeeImport.set(false);
          this.isExpenseImport.set(false);
          this.isClassImport.set(false);
          this.isSubsidiaryImport.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ content: 'Successfully Imported.' });
        }
      });
  }

  importLocations(): void {
    this.isLocationImport.set(true);
    this.netsuiteService
      .importLocations()
      .pipe(
        finalize(() => {
          this.isLocationImport.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ content: 'Successfully Imported.' });
        }
      });
  }

  update(): void {
    this.isUpdate.set(true);
    const formValue = { ...this.settingForm.value };
    (formValue as { autoExportEnable?: number }).autoExportEnable =
      formValue.autoExportEnable ? 1 : 0;
    const payload = {
      ...formValue,
      defaultSubsidiaryId: this.defaultSubsidiaryId() || null
    };
    this.netsuiteService
      .updateSettings(payload)
      .pipe(
        finalize(() => {
          this.isUpdate.set(false);
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({ content: 'Successfully Updated.' });
          this.dialogRef.close(true);
        }
      });
  }
}

import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import {
  MatCheckboxChange,
  MatCheckboxModule
} from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { environment } from 'src/environments/environment';
import { AlertService } from '../../../../../shared/service/alert/alert.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-netsuite-settings-modal',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonButtonV35Component,
    MatRadioModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgSelectModule
  ],
  templateUrl: './netsuite-settings-modal.component.html',
  styleUrl: './netsuite-settings-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetsuiteSettingsModalComponent implements OnInit, OnDestroy {
  private netsuiteService = inject(NetsuiteIntegrationService);
  private changeDetector = inject(ChangeDetectorRef);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private dilaogRef = inject(MatDialogRef);

  faXmark = faXmark;
  faInfo = faCircleInfo;
  subscription: Subscription[] = [];
  isBankImport = false;
  isPayeeImport = false;
  isExpenseImport = false;
  isClassImport = false;
  isSubsidiaryimport = false;
  isLocationImport = false;
  isUpdate = false;
  isAllowExport = false;
  isLoadSettings = false;
  whiteLabelName = environment.env_id === 'compass' ? 'Vendor' : 'Payee';
  selectedCustomField = '';
  cachedDefaultSubsidiaryId = signal<string|null>(null);
  defaultSubsidiaryId = signal<string|null>(null);
  subsidiaryList = signal<{id:string,name:string}[]>([]);
  subsidiaryLoading = signal<boolean>(false);
  subsidiaryPage = 1;
  subsidiaryHasMore = true;
  subsidiarySearchTerm = '';
  subsidiarySearch$ = new Subject<string>();
  env = environment;
  isCompass = signal<boolean>(environment.env_id === 'compass');

  downloadFilters = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  settingForm = this.fb.group({
    check: [1],
    downloadFilter: [0],
    pushBackEnable: [0],
    customField: [''],
    autoExportEnable: [0],
  });

  ngOnInit(): void {
    this.getSettings();
    this.getSubsidiary();
    this.subscription.push(
      this.subsidiarySearch$.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((term) => {
        this.subsidiarySearchTerm = term;
        this.subsidiaryPage = 1;
        this.subsidiaryHasMore = true;
        this.subsidiaryList.set([]);
        this.getSubsidiary();
      })
    );
  }

  /**
   * @description Fetches setting details from the Netsuite service and updates the form accordingly.
   */
  getSettings(): void {
    this.isLoadSettings = true;
    this.subsidiaryLoading.set(true);
    this.subscription.push(
      this.netsuiteService.getSettings()
      .pipe(
        finalize(() => {
          this.isLoadSettings = false;
          this.subsidiaryLoading.set(false);
          this.changeDetector.markForCheck();
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.settingForm.patchValue(res.data);
          this.isAllowExport = res.data.allowExport;
          if (res.data.defaultSubsidiaryId) {
            const selectedSubsidiary = {id: res.data.defaultSubsidiaryId, name: res.data.defaultSubsidiaryName};
            this.subsidiaryList.set([selectedSubsidiary]);
          }
          this.defaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
          this.cachedDefaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
        }
      })
    );
  }

  getSubsidiary(): void {
    if (!this.subsidiaryHasMore) return;
    this.subsidiaryLoading.set(true);
    this.subscription.push(
      this.netsuiteService.getSubsidiary(this.subsidiaryPage, this.subsidiarySearchTerm || undefined).pipe(finalize(() => this.subsidiaryLoading.set(false))).subscribe((res) => {
        if (res.success) {
          if (!res.data?.length) {
            this.subsidiaryHasMore = false;
            return;
          }
          this.subsidiaryList.update(list => {
            const existingIds = new Set(list.map(item => item.id));
            const newItems = res.data.filter(item => !existingIds.has(item.id));
            return [...list, ...newItems];
          });
          this.subsidiaryPage += 1;
        }
      })
    );
  }

  onSubsidiaryScrollToEnd(): void {
    this.getSubsidiary();
  }

  onSubsidiarySearch(event: {term: string}): void {
    this.subsidiarySearch$.next(event.term);
  }

  onSubsidiarySearchClear(): void {
    this.subsidiarySearchTerm = '';
    this.subsidiaryPage = 1;
    this.subsidiaryHasMore = true;
    this.subsidiaryList.set([]);
    this.getSubsidiary();
  }

  setSubsidiaryId(event:string): void {
    this.defaultSubsidiaryId.set(event);
  }

  /**
   * @description Handles enabling or disabling push back functionality based on the checkbox state.
   * @param {MatCheckboxChange} event - The event object triggered by checkbox state change.
   */
  enablePushBack(event: MatCheckboxChange): void {
    if (event.checked) {
      this.settingForm.controls.pushBackEnable.setValue(1);
    } else {
      this.settingForm.controls.pushBackEnable.setValue(0);
    }
  }

  /**
   * @description Imports the payee,bank account, class anf expense.
   * @param {string}importType - The type of import to perform.
   */
  importSettings(importType: string): void {
    let type;
    if (importType === 'bank-accounts') {
      this.isBankImport = true;
    } else if (importType === 'payees') {
      type = 1;
      this.isPayeeImport = true;
    } else if (importType === 'classes') {
      this.isClassImport = true;
    } else if(importType === 'subsidiaries') {
      this.isSubsidiaryimport = true;
    } else {
      this.isExpenseImport = true;
    }

    this.subscription.push(
      this.netsuiteService
        .importNetsuiteSettings(`import-${importType}`, type)
        .pipe(
          finalize(() => {
            this.isBankImport = false;
            this.isPayeeImport = false;
            this.isExpenseImport = false;
            this.isClassImport = false;
            this.isSubsidiaryimport = false;
            this.changeDetector.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Successfully Imported.'
            });
          }
        })
    );
  }

  /**
   * @description Imports locations from NetSuite.
   */
  importLocations(): void {
    this.isLocationImport = true;
    this.subscription.push(
      this.netsuiteService
        .importLocations()
        .pipe(
          finalize(() => {
            this.isLocationImport = false;
            this.changeDetector.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Successfully Imported.'
            });
          }
        })
    );
  }

  /**
   * @description Updates Netsuite settings with the values provided in the form.
   */
  update(): void {
    this.isUpdate = true;
    const formValue = {...this.settingForm.value};
    formValue.autoExportEnable = formValue.autoExportEnable ? 1 : 0;
    const payload = {
      ...formValue,
      defaultSubsidiaryId: this.defaultSubsidiaryId() ? this.defaultSubsidiaryId() : null
    };
    this.subscription.push(
      this.netsuiteService
        .updateSettings(payload)
        .pipe(
          finalize(() => {
            this.isUpdate = false;
            this.changeDetector.markForCheck();
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Successfully Updated.'
            });
            this.dilaogRef.close();
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

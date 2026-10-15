import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
  signal
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Router } from '@angular/router';
import {
  INetSuiteImportedFromCompany,
  INetSuiteImportedStatus
} from 'src/app/modules/integration/model/integration';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { environment } from 'src/environments/environment';
import { NgSelectModule } from '@ng-select/ng-select';

/**
 * @description Modal component for netsuite (third party) import.
 */
@Component({
  selector: 'app-netsuite-import',
  templateUrl: './netsuite-import.component.html',
  styleUrls: ['./netsuite-import.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    CommonInputFieldComponent,
    NgSelectModule
  ]
})
export class NetsuiteImportComponent implements OnInit, OnDestroy {

  public netSuiteType: { type: string } = inject(MAT_DIALOG_DATA);
  private netSuiteintegrationService = inject(NetsuiteIntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<NetsuiteImportComponent>);

  allChecked = false;
  subscriptions: Subscription[] = [];
  selectedCompany: string[] = [];
  loading = false;
  dataLoaded = false;
  searchText = '';
  companyData: INetSuiteImportedStatus[];
  faGear = faGear;
  env = environment;
  cachedDefaultSubsidiaryId = signal<string|null>(null);
  defaultSubsidiaryId = signal<string|null>(null);
  subsidiaryList = signal<{id:string,name:string|null}[]>([]);
  subsidiaryLoading = signal<boolean>(false);
  subsidiaryPage = 1;
  subsidiaryHasMore = true;
  subsidiarySearchTerm = '';
  subsidiarySearch$ = new Subject<string>();

  @Output() connectionStatus = new EventEmitter<boolean>();
  @Output() clickBackButton = new EventEmitter<boolean>();
  @Output() compelteImport = new EventEmitter<boolean>();
  selectedType = input<string>();

  importTime = [
    { value: 1, name: 'Last 2 hours' },
    { value: 2, name: 'Last 12 hours' },
    { value: 3, name: 'Last 24 hours' },
    { value: 4, name: 'Last 3 days' },
    { value: 5, name: 'Last 7 days' },
    { value: 6, name: 'Last 15 days' }
  ];

  downloadFilter = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  netsuiteForm = this.fb.group({
    type: [1],
    importTime: [this.importTime[2].value],
    downloadFilter: [0],
    billPaymentId:''
  });

  importFrom: INetSuiteImportedFromCompany = {
    name: 'Import From',
    completed: false,
    list: []
  };

  code = 'netsuite';
  isConnected: boolean;

  ngOnInit(): void {
    this.onCheckNetSuiteConnection();
    this.getSettings();
    this.getSubsidiary();
    this.subscriptions.push(
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

  onCheckNetSuiteConnection(): void {
    this.subscriptions.push(
      this.netSuiteintegrationService
        .getNetSuiteConnectionDetails()
        .pipe(
          finalize(() => {
            this.loading = false;
            this.dataLoaded = true;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (res.data.connected === 0) {
              this.isConnected = false;
              this.connectionStatus.emit(false);
            } else {
              this.isConnected = true;
              this.connectionStatus.emit(true);
            }
          }
        })
    );
  }

  getSettings(): void {
    this.subsidiaryLoading.set(true);
    this.subscriptions.push(
      this.netSuiteintegrationService.getSettings()
      .pipe(finalize(() => this.subsidiaryLoading.set(false)))
      .subscribe((res) => {
        if (res.success) {
          if (res.data.defaultSubsidiaryId) {
            const selectedSubsidiary = {id: res.data.defaultSubsidiaryId, name: res.data.defaultSubsidiaryName};
            this.subsidiaryList.set([selectedSubsidiary]);
          }
          this.defaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
          this.cachedDefaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
          this.netsuiteForm.controls.downloadFilter.setValue(
            res.data.downloadFilter
          );
        }
      })
    );
  }

  getSubsidiary(): void {
    if (!this.subsidiaryHasMore) return;
    this.subsidiaryLoading.set(true);
    this.subscriptions.push(
      this.netSuiteintegrationService.getSubsidiary(this.subsidiaryPage, this.subsidiarySearchTerm || undefined)
      .pipe(finalize(() => this.subsidiaryLoading.set(false)))
      .subscribe((res) => {
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

  onSubmit(): void {
    const formValue = this.netsuiteForm.value;
    const subsidiaryId = this.defaultSubsidiaryId() ?? '';
    const payload = {
      type: formValue.type as number,
      importTime: formValue.importTime as number,
      downloadFilter: formValue.downloadFilter as number,
      importSingleBillPayment:formValue.billPaymentId !== '' ? 1 : 0,
      billPaymentId:formValue.billPaymentId !== '' ? formValue.billPaymentId : undefined,
      importBill: this.selectedType() === 'bills' ? 1 : 0,
      importBillPayment: this.selectedType() === 'checks' ? 1 : 0,
      subsidiaryIds: subsidiaryId ? [subsidiaryId] : [] as string[]
    };
    this.loading = true;
    this.subscriptions.push(
      this.netSuiteintegrationService
        .importData(payload)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.compelteImport.emit(true);
            this.alertService.successAlert({ close: true });
          }
        })
    );
  }

  /**
   * @description Closes dialog and navigates to `netsuite` integration home.
   */
  goToThirdpartyHome() {
    this.router.navigate(['/manage/thirdparty_app/netsuite/home'], {state: {source: 'payments'}});
    this.dialogRef.close(false);
  }

  /**
   * @description Used to move to prevoius section.
   */
  back() {
    this.clickBackButton.next(true);
  }

  setSubsidiaryId(event:string): void {
    this.defaultSubsidiaryId.set(event);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /** Below Code Temporarly commented.This code use when netsuite work with Merge. */

  // /**
  //  * @description Updates `this.companyData` with the companyData that matches the search string.
  //  */
  // onSearchCompany() {
  //   this.companyData = this.importFrom.list.filter(
  //     (element: INetSuiteImportedStatus) => {
  //       return element.name
  //         .toLowerCase()
  //         .includes(this.searchText.toLowerCase());
  //     }
  //   );
  // }

  // /**
  //  * @description Method to load company data and set it to `this.companyData`.
  //  * Updates `this.importFrom` array with selected data from `companyData`.
  //  * Invokes `this.setFormOptions` method to set completed status and
  //  * `this.changeImportFrom` method to set `selectedCompany`.
  //  * Emits `connectionStatus` event with boolean value.
  //  */
  // loadCompanyData() {
  //   this.subscriptions.push(
  //     this.netSuiteintegrationService
  //       .getNetSuiteDetails()
  //       .pipe(
  //         finalize(() => {
  //           this.loading = false;
  //           this.dataLoaded = true;
  //         })
  //       )
  //       .subscribe((res) => {
  //         if (res.success) {
  //           for (const item of res.data.companies) {
  //             this.importFrom.list?.push({
  //               name: item.companyName,
  //               value: item.companyId,
  //               completed: false,
  //               checked: false
  //             });
  //             this.companyData = this.importFrom.list;
  //             if (res.data.connected === 0) {
  //               this.connectionStatus.emit(false);
  //             } else {
  //               this.connectionStatus.emit(true);
  //             }
  //             this.setFormOptions();
  //             this.changeImportFrom();
  //           }
  //         }
  //       })
  //   );
  // }

  // /**
  //  * @description Returns tooltip for matTooltip.
  //  * @param name - list item name.
  //  * @returns - tooltip
  //  */
  // tooltip(name: string) {
  //   let tooltip;

  //   if (name?.length < 35) {
  //     tooltip = ' ';
  //   } else {
  //     tooltip = name;
  //   }
  //   return tooltip;
  // }

  // /**
  //  * @description Sets value of `checked` property of each item in `this.importFrom.list[]` to true.
  //  */
  // setFormOptions() {
  //   this.importFrom.list?.forEach((res: INetSuiteImportedStatus) => {
  //     res.checked = true;
  //   });
  // }

  // /**
  //  * @description Sets `this.selectedCompany[]` with `checked` values from `this.importFromList.list[]`.
  //  */
  // changeImportFrom() {
  //   this.selectedCompany = [];
  //   this.importFrom.list?.forEach((res: INetSuiteImportedStatus) => {
  //     if (res.checked == true) this.selectedCompany.push(res.value);
  //   });
  // }

  // /**
  //  * @description Method invoked when 'Start Importing' button is clicked in template.
  //  * Shows alerts for exceptions.
  //  * Invokes `this.postImportBody` for final submission of data.
  //  */
  // onSubmit() {
  //   if (this.selectedCompany?.length == 0) {
  //     this.alertService.warningAlert({ content: 'Please select company' });
  //     return;
  //   }

  //   if (this.selectedCompany?.length > 3) {
  //     const dBody = {
  //       doneMsg: 'Proceed',
  //       content: `You have selected ${this.selectedCompany?.length} companies now. We recommend importing 3 or fewer companies simultaneously`
  //     };
  //     const dRef = this.alertService.confirmAlert(dBody);
  //     dRef.afterClosed().subscribe((res) => {
  //       if (res) {
  //         this.postImportBody();
  //       }
  //     });
  //   } else {
  //     this.postImportBody();
  //   }
  // }

  // /**
  //  * @description Creates params object and
  //  * posts params to `importNetSuiteTransaction` method of integration service.
  //  */
  // postImportBody() {
  //   const params: {
  //     type: number;
  //     code: string;
  //     importTime: { value: number; name: string };
  //     companyIds: string[];
  //   } = {
  //     type: 1,
  //     code: 'netsuite',
  //     importTime: this.netsuiteForm.value.importTime,
  //     companyIds: this.selectedCompany
  //   };
  //   if (this.netSuiteType.type === 'bills') {
  //     params.type = 1;
  //   } else if (this.netSuiteType.type === 'invoices') {
  //     params.type = 2;
  //   }
  //   this.loading = true;
  //   this.subscriptions.push(
  //     this.netSuiteintegrationService
  //       .importNetSuiteTransaction(params)
  //       .pipe(finalize(() => (this.loading = false)))
  //       .subscribe((res) => {
  //         if (res.success) {
  //           this.alertService.successAlert({
  //             content: res.message,
  //             close: true
  //           });
  //           this.dialogRef.close({ success: true });
  //         }
  //       })
  //   );
  // }

  // /**
  //  * @description Checks status of `checked` of each item of `this.importFrom.list[]` and updates the value of `this.allChecked` with the same.
  //  */
  // updateAllComplete() {
  //   this.allChecked =
  //     this.importFrom.list != null &&
  //     this.importFrom.list.every((t: INetSuiteImportedStatus) => t.checked);
  // }

  // /**
  //  * @description Returns true when only some items in
  //  * `this.importFrom.list[]` have `checked` set to true. (For setting mat check box as indeterminate, if true)
  //  * @returns boolean
  //  */
  // someComplete(): boolean {
  //   if (this.importFrom.list == null) {
  //     return false;
  //   }
  //   return (
  //     this.importFrom.list.filter((t: INetSuiteImportedStatus) => t.checked)
  //       .length > 0 && !this.allChecked
  //   );
  // }

  // /**
  //  * @description Method invoked on checkbox selection. Updates checked status for all.
  //  * @param completed - boolean.
  //  */
  // setAll(checked: boolean) {
  //   this.allChecked = checked;
  //   if (this.importFrom.list == null) {
  //     return;
  //   }
  //   this.importFrom.list.forEach(
  //     (t: INetSuiteImportedStatus) => (t.checked = checked)
  //   );
  // }
}

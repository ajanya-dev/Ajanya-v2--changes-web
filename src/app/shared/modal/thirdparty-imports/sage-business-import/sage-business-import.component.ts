import {
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  OnDestroy
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import {
  IImportForm,
  IThirdPartyTransactionBody
} from 'src/app/modules/integration/model/integration';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

interface ICompanyList {
  completed: boolean;
  name: string;
  value: string;
}

/**
 * @description Modal component for sage business (third party) import.
 */
@Component({
  selector: 'app-sage-business-import',
  templateUrl: './sage-business-import.component.html',
  styleUrls: ['./sage-business-import.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgClass,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    NgFor,
    MatRadioGroup,
    MatRadioButton
  ]
})
export class SageBusinessImportComponent implements OnInit, OnDestroy {
  sagebusinessForm: UntypedFormGroup;
  allChecked = false;
  subscriptions: Subscription[] = [];
  selectedCompany: string[] = [];
  loading = false;
  dataLoaded = false;
  searchText = '';
  companyData: ICompanyList[];
  @Output() connectionStatus = new EventEmitter<boolean>();
  @Output() clickBackButton = new EventEmitter<boolean>();

  importTime = [
    { value: 1, name: '2 hours' },
    { value: 2, name: '12 hours' },
    { value: 3, name: '24 hours' },
    { value: 4, name: '3 days' },
    { value: 5, name: '7 days' },
    { value: 6, name: '14 days' },
    { value: 7, name: '30 days' }
  ];
  downloadFilter = [
    { value: 0, name: 'Download All' },
    { value: 1, name: `Download unpaid ${this.data.type} only` }
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

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { type: 'bills' | 'invoices' | 'checks' },
    private _integrationService: IntegrationService,
    private alertService: AlertService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private __dialogRef: MatDialogRef<SageBusinessImportComponent>
  ) {}

  ngOnInit(): void {
    this.initFormGroup();
    this.loadCompanyData();
  }
  /**
   * @description Initializes sage-business form.
   */
  initFormGroup(): void {
    this.sagebusinessForm = this.fb.group({
      importFrom: [''],
      importTime: [this.importTime[2].value],
      importStatus: [this.downloadFilter[1].value]
    });
  }

  /**
   * @description Updates `this.companyData` with the companyData that matches the search string.
   */
  onSearchCompany(): void {
    this.companyData = this.importFrom.list.filter((element) => {
      return element.name.toLowerCase().includes(this.searchText.toLowerCase());
    });
  }

  /**
   * @description Method to load company data and set it to `this.companyData`.
   * Updates `this.importFrom` array with selected data from `companyData`.
   * Invokes `this.setFormOptions` method to set completed status and
   * `this.changeImportFrom` method to set `selectedCompany`.
   * Emits `connectionStatus` event with boolean value.
   */
  loadCompanyData(): void {
    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.dataLoaded = true;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            for (const item of res.data.companies) {
              this.importFrom.list?.push({
                name: item.companyName,
                value: item.companyId,
                completed: false
              });
              this.companyData = this.importFrom.list;
              this.isConnected = res?.data?.connected;
              if (this.isConnected) {
                this.connectionStatus.emit(true);
              } else {
                this.connectionStatus.emit(false);
              }
            }
            this.setFormOptions();
            this.changeImportFrom();
          }
        })
    );
  }

  /**
   * @description Returns tooltip for matTooltip.
   * @param name - list item name.
   * @returns - tooltip
   */
  tooltip(name: string) {
    let tooltip;

    if (name?.length < 35) {
      tooltip = ' ';
    } else {
      tooltip = name;
    }
    return tooltip;
  }

  /**
   * @description Sets value of `checked` property of each item in `this.importFrom.list[]` to true.
   */
  setFormOptions(): void {
    this.importFrom.list?.forEach((res) => {
      res.checked = true;
    });
    this.importFrom.list.shift();
  }

  /**
   * @description Sets `this.selectedCompany[]` with `checked` values from `this.importFromList.list[]`.
   */
  changeImportFrom(): void {
    this.selectedCompany = [];
    this.importFrom.list?.forEach((res) => {
      if (res.checked) this.selectedCompany.push(res.value);
    });
  }

  /**
   * @description Method invoked when 'Start Importing' button is clicked in template.
   * Shows alerts for exceptions.
   * Invokes `this.postImportBody` for final submission of data.
   */
  onSubmit(): void {
    if (this.selectedCompany?.length == 0) {
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

  /**
   * @description Creates params object and
   * posts `this.providerCode` and
   * params to `thirdpPartyTransactionImporting` method of integration service.
   */
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
    this.subscriptions.push(
      this._integrationService
        .thirdpPartyTransactionImporting(this.providerCode, params)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: res.message,
              close: true
            });
            this.__dialogRef.close({ success: true });
          }
        })
    );
  }

  /**
   * @description Checks status of `checked` of each item of `this.importFrom.list[]` and updates the value of `this.allChecked` with the same.
   */
  updateAllComplete(): void {
    this.allChecked =
      this.importFrom.list != null &&
      this.importFrom.list.every((t) => t.checked);
  }

  /**
   * @description Returns true when only some items in
   * `this.importFrom.list[]` have `checked` set to true. (For setting mat check box as indeterminate, if true)
   * @returns boolean
   */
  someComplete(): boolean {
    if (this.importFrom.list == null) {
      return false;
    }
    return (
      this.importFrom.list.filter((t) => t.checked).length > 0 &&
      !this.allChecked
    );
  }

  /**
   * @description Method invoked on checkbox selection. Updates checked status for all.
   * @param checked - boolean.
   */
  setAll(checked: boolean): void {
    this.allChecked = checked;
    if (this.importFrom.list == null) {
      return;
    }
    this.importFrom.list.forEach((t) => (t.checked = checked));
  }

  /**
   * @description Closes the dialog.
   * @param data - dialog data.
   */
  closeDialog(): void {
    this.__dialogRef.close();
  }

  /**
   * @description Closes dialog and navigates to `sage business` integration home.
   */
  goToThirdpartyHome(): void {
    this.router.navigate(['/manage/thirdparty_app/sage-business/home']);
    this.__dialogRef.close(false);
  }

  /**
   * @description Used to move to prevoius section.
   */
  back() {
    this.clickBackButton.next(true);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

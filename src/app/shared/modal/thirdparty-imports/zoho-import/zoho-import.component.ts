import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
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
  IImportedFromList,
  IThirdPartyTransactionBody
} from 'src/app/modules/integration/model/integration';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { SortPipe } from '../../../../pipes/sort.pipe';

/**
 * @description Modal component for zoho (third party) import.
 */
@Component({
  selector: 'app-zoho-import',
  templateUrl: './zoho-import.component.html',
  styleUrls: ['./zoho-import.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    FaIconComponent,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    SortPipe
  ]
})
export class ZohoImportComponent implements OnInit, OnDestroy {
  private integrationService = inject(IntegrationService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<ZohoImportComponent>);
  public data = inject(MAT_DIALOG_DATA);

  zohoForm: UntypedFormGroup;
  allChecked = false;
  subscriptions: Subscription[] = [];
  selectedCompany: string[] = [];
  loading = false;
  dataLoaded = false;
  searchText = '';
  companyData: IImportedFromList[];
  @Output() connectionStatus = new EventEmitter<boolean>();
  @Output() clickBackButton = new EventEmitter<boolean>();

  importTime = [
    { value: 1, name: '2 hours' },
    { value: 2, name: '12 hours' },
    { value: 3, name: '24 hours' },
    { value: 4, name: '3 days' },
    { value: 5, name: '7 days' },
    { value: 6, name: '14 days' }
  ];

  downloadFilterChecks = [
    { value: 0, name: 'Download All' },
    { value: 1, name: 'Download only mark as print later' }
  ];

  downloadFilterinvoices = [
    { value: 0, name: 'All invoices' },
    { value: 1, name: 'Import Unpaid invoices' }
  ];

  downloadFilterBills = [
    { value: 0, name: 'All bills' },
    { value: 1, name: 'Open bills only' }
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
      importTime: new UntypedFormControl(this.importTime[0].value),
      checkType: new UntypedFormControl(true),
      invoiceStatus: new UntypedFormControl(0),
      billStatus: new UntypedFormControl(0),
      markAsPrintLater: new UntypedFormControl(0)
    });
  }

  /**
   * @description Updates `this.companyData` with the companyData that matches the search string.
   */
  onSearchCompany() {
    this.companyData = this.importFrom.list.filter(
      (element: IImportedFromList) => element.name
          .toLowerCase()
          .includes(this.searchText.toLowerCase())
    );
  }

  /**
   * @description Method to load company data and set it to `this.companyData`.
   * Updates `this.importFrom` array with selected data from `companyData`.
   * Invokes `this.setFormOptions` method to set completed status and
   * `this.changeImportFrom` method to set `selectedCompany`.
   * Emits `connectionStatus` event with boolean value.
   */
  loadCompanyData() {
    this.subscriptions.push(
      this.integrationService
        .getDetails(this.providerCode)
        .pipe(
          finalize(() => {
            this.dataLoaded = true;
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.isConnected = res.data.connected;
            if (this.isConnected) {
              this.connectionStatus.emit(true);
            } else {
              this.connectionStatus.emit(false);
            }
            for (const item of res.data.companies) {
              this.importFrom.list?.push({
                name: item.companyName,
                value: item.companyId,
                completed: false
              });
              this.companyData = this.importFrom.list;
              this.setFormOptions();
              this.changeImportFrom();
            }
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
  setFormOptions() {
    this.importFrom.list?.forEach((res: IImportedFromList) => {
      res.checked = true;
    });
  }

  /**
   * @description Sets `this.selectedCompany[]` with `checked` values from `this.importFromList.list[]`.
   */
  changeImportFrom() {
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

  /**
   * @description Creates params object and
   * posts `this.providerCode` and
   * params to `thirdpPartyTransactionImporting` method of integration service.
   */
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
    this.subscriptions.push(
      this.integrationService
        .thirdpPartyTransactionImporting(this.providerCode, params)
        .pipe(finalize(() => {(this.loading = false);}))
        .subscribe((res) => {
          if (res.success) {
            /**
             * Checks if there are any companies with error while importing.
             * if there is we are showing appropriate message to user.
             * else showing the success message
             */
            if (res.companyWithError?.length) {
              if (this.selectedCompany.length === res.companyWithError.length) {
                const companyWithErrorNames = this.companyData.map(
                  (element) => {
                    for (let i = 0; i < res.companyWithError.length; i += 1) {
                      if (element.value === res.companyWithError[i]) {
                        return `${element.name}`;
                      }
                    }
                    return undefined;
                  }
                );
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
                if(result?.success?.length){
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
        })
    );
  }

  /**
   * @description Checks status of `checked` of each item of `this.importFrom.list[]` and updates the value of `this.allChecked` with the same.
   */
  updateAllComplete() {
    this.allChecked =
      this.importFrom.list != null &&
      this.importFrom.list.every((t: IImportedFromList) => t.checked);
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
      this.importFrom.list.filter((t: IImportedFromList) => t.checked).length >
        0 && !this.allChecked
    );
  }

  /**
   * @description Method invoked on checkbox selection. Updates checked status for all.
   * @param checked - boolean.
   */
  setAll(checked: boolean) {
    this.allChecked = checked;
    if (this.importFrom.list == null) {
      return;
    }
    this.importFrom.list.forEach(
      (t: IImportedFromList) => (t.checked = checked)
    );
  }

  /**
   * @description Closes the dialog.
   */
  closeDialog() {
    this.dialogRef.close();
  }

  /**
   * @description Closes dialog and navigates to `zoho` integration home.
   */
  goToThirdpartyHome() {
    this.router.navigate(['/manage/thirdparty_app/zoho/zoho_books']);
    this.dialogRef.close(false);
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

import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA,MatDialogRef } from '@angular/material/dialog';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgIf, NgClass, NgFor, NgStyle } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { IntegrationService } from '../../service/integration/integration.service';
import { AlertService } from '../../service/alert/alert.service';
import { SortPipe } from '../../../pipes/sort.pipe';

interface IForm {
  name: string;
  value: string;
  completed: boolean;
}

/**
 * @description Modal component for importing from `bill.com` (integration).
 */
@Component({
  selector: 'app-import-from-bill-dot-com',
  templateUrl: './import-from-bill-dot-com.component.html',
  styleUrls: ['./import-from-bill-dot-com.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgIf,
    MatCheckbox,
    NgClass,
    NgFor,
    FormsModule,
    MatRadioGroup,
    MatRadioButton,
    NgStyle,
    SortPipe
  ]
})
export class ImportFromBillDotComComponent implements OnInit, OnDestroy {

  public data: string = inject(MAT_DIALOG_DATA);
  private integrationService = inject(IntegrationService);
  private dialogRef = inject(MatDialogRef<ImportFromBillDotComComponent>);
  private router = inject(Router);
  private alertService = inject(AlertService);

  dataLoaded = false;
  allComplete = false;
  selectedCompany: string[] = [];
  companyData: IForm[];
  isConnected: number;
  subscriptions: Subscription[] = [];
  loading = false;
  importTime = [
    { value: '1', name: 'Last 2 hours' },
    { value: '2', name: 'Last 12 hours' },
    { value: '3', name: 'Last 24 hours' },
    { value: '4', name: 'Last 3 days' },
    { value: '5', name: 'Last 7 days' },
    { value: '7', name: 'Last 15 days' }
  ];

  selectedImportTime = '3';
  selectedOrgIds: string[] = [];
  submitting = false;
  @Output() connectionStatus = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.getOrgs();
  }

  /**
   * @description Method to load company data and set it to `this.companyData`.
   * Invokes `this.companySelected` to set orgId.
   * Updates `this.importFrom` array with selected data from `companyData`.
   * Invokes `this.setFormOptions` method to set completed status and
   * `this.changeImportFrom` method to set `selectedCompany`.
   * Emits `connectionStatus` event with boolean value.
   */
  getOrgs() {
    this.subscriptions.push(
      this.integrationService.getBillOrgs().subscribe((data) => {
        if (data?.success) {
          this.dataLoaded = true;
          const companyData = data.data;
          if (companyData?.length) {
            this.companySelected(true, companyData[0].orgId);
          }
          for (const item of companyData) {
            this.importFrom.list?.push({
              name: item.orgName,
              value: item.orgId,
              completed: false
            });
            this.companyData = this.importFrom.list;
            this.isConnected = data.data?.length;
            this.setFormOptions();
            this.changeImportFrom();
          }
          if (this.isConnected) {
            this.connectionStatus.emit(true);
          } else {
            this.connectionStatus.emit(false);
          }
        }
      })
    );
  }

  /**
   * @description Sets value of `completed` property of each item in `this.importFrom.list[]` to true.
   */
  setFormOptions() {
    this.importFrom.list?.forEach((res: { completed: boolean }) => {
      res.completed = true;
    });
  }

  /**
   * @description Returns true when only some items in
   * `this.importFrom.list[]` have `completed` set to true. (For setting mat check box as indeterminate, if true)
   * @returns boolean
   */
  someComplete(): boolean {
    if (this.importFrom.list == null) {
      return false;
    }
    return (
      this.importFrom.list.filter((t) => t.completed).length > 0 &&
      !this.allComplete
    );
  }

  /**
   * @description Method invoked on checkbox selection. Updates completed status for all.
   * @param completed - boolean.
   */
  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.importFrom.list == null) {
      return;
    }
    this.importFrom.list.forEach((t) => (t.completed = completed));
  }

  /**
   * @description Sets `this.selectedCompany[]` with `completed` values from `this.importFromList.list[]`.
   */
  changeImportFrom() {
    this.selectedCompany = [];
    this.importFrom.list?.forEach((res) => {
      if (res.completed) this.selectedCompany.push(res.value);
    });
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

  importFrom: { name: string; completed: boolean; list: IForm[] } = {
    name: 'Import From',
    completed: false,
    list: []
  };

  /**
   * @description Updates `this.selectedOrgIds[]` with the `orgId`.
   * @param checked - boolean.
   * @param orgId - orgId of company.
   */
  companySelected(checked: boolean, orgId: string) {
    const index = this.selectedOrgIds.indexOf(orgId);
    if (checked && index === -1) {
      this.selectedOrgIds.push(orgId);
    } else if (!checked) {
      this.selectedOrgIds.splice(index, 1);
    }
  }

  /**
   * @description Checks status of `completed` of each item of `this.importFrom.list[]` and updates the value of `this.allComplete` with the same.
   */
  updateAllComplete() {
    this.allComplete =
      this.importFrom.list != null &&
      this.importFrom.list.every((t) => t.completed);
  }

  /**
   * @description Posts data to `importFromBilldotCom` method of integration service.
   */
  submit() {
    if (this.selectedCompany?.length == 0) {
      this.alertService.warningAlert({ content: 'Please select a company' });
      return;
    }

    this.submitting = true;
    const body = {
      orgId: this.selectedOrgIds,
      importTime: this.selectedImportTime
    };
    this.subscriptions.push(
      this.integrationService
        .importFromBilldotCom(body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({ content: 'Bills imported' });
            this.closeDialog({ success: true });
          }
        })
    );
  }

  /**
   * @description Closes the dialog.
   * @param data - dialog data.
   */
  closeDialog(data?: { success: boolean } | undefined) {
    this.dialogRef.close(data);
  }

  /**
   * @description Closes dialog and navigates to `bill.com` integration home.
   */
  addMoreCompany() {
    this.router.navigate(['/manage/thirdparty_app/bill-dot-com/']);
    this.closeDialog();
  }

  /**
   * @description Closes dialog and navigates to `bill.com` integration home.
   */
  goToThirdpartyHome() {
    this.router.navigate(['manage/thirdparty_app/bill-dot-com/']);
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}

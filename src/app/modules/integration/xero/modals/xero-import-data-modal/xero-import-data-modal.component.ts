import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subscription } from 'rxjs';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IConnectedCompanyList } from '../../../model/integration';
import { NgFor, NgIf } from '@angular/common';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';

export interface IImport {
  importTime: number;
  companyId: string | string[];
  importBill: number | string;
}
enum EExportType {
  Bills = 1,
  Checks = 3,
  Invoices = 4
}

interface ICompany {
  name: string;
  value: string;
  completed: boolean;
}

interface IImportedCompanies {
  name: string;
  completed: boolean;
  list: ICompany[];
}
/**
 * Component for the Xero Import Data modal.
 */
@Component({
  selector: 'app-xero-import-data-modal',
  templateUrl: './xero-import-data-modal.component.html',
  styleUrls: ['./xero-import-data-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatRadioGroup,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    MatRadioButton,
    MatDialogActions,
    NgIf
  ]
})
export class XeroImportDataModalComponent implements OnInit, OnDestroy {
  timeSpan = [
    { value: 1, name: 'Last 2 hours' },
    { value: 2, name: 'Last 12 hours' },
    { value: 3, name: 'Last 24 hours' },
    { value: 4, name: 'Last 3 days' },
    { value: 5, name: 'Last 7 days' }
  ];

  importTime = new UntypedFormControl(this.timeSpan[2].value);
  // importType = new FormControl('3');

  loading = false;
  allComplete = false;
  selectedCompany: string[] = [];
  subscriptions: Subscription[] = [];
  searchText = '';

  importedCompanies: IImportedCompanies = {
    name: 'Import From',
    completed: false,
    list: []
  };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      companies: IConnectedCompanyList[];
      type: number | string;
      selectedCompanyId: string;
    },
    private _matDilogRef: MatDialogRef<XeroImportDataModalComponent>,
    private alertService: AlertService,
    private _integrationService: IntegrationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCompanies();
    this.selectedCompany.push(this.data.selectedCompanyId);
  }

  /**
   * Gets the list of companies for import.
   */
  getCompanies(): void {
    for (const c of this.data?.companies) {
      this.importedCompanies.list?.push({
        name: c.companyName,
        value: c.companyId,
        completed: false
      });
    }
    const selected = this.importedCompanies?.list?.find(
      (e: { value: string }) => {
        return e.value === this.data?.selectedCompanyId;
      }
    ); //Make as selected
    selected ? (selected.completed = true) : false;
    // this.changeCheckBox();
  }

  /**
   * Creates the request body for Xero import.
   * @returns The import request body.
   */
  createXeroBody(): IImport {
    return {
      importTime: Number(this.importTime.value),
      companyId: this.selectedCompany,
      importBill: EExportType[this.data.type as number]
    };
  }

  /**
   * Handles the form submission for importing data.
   */
  onSubmit() {
    // if (!this.selectedCompany?.length) {
    //   this.alertService.warningAlert({ content: 'Please select company' });
    //   return;
    // }

    // if (this.selectedCompany?.length > 1) {
    //   this.alertService.warningAlert({ content: `You have selected ${this.selectedCompany?.length} companies now. We recommend importing 1 company at a time.` });
    //   return;
    // }
    this.postImportBody();
  }

  /**
   * Sends a request to import data to Xero.
   */
  postImportBody(): void {
    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .getImportXeroCompanies(this.createXeroBody())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            if (this.data?.type == 'Bills') {
              this.openSuccessAlert('Bills imported successfully');
              this.router.navigate(['manage/bill/index']);
            } else if (this.data?.type == 'Invoices') {
              this.openSuccessAlert('Invoices imported successfully');
              this.router.navigate(['manage/invoice']);
            } else {
              this.openSuccessAlert('Checks imported successfully');
              this.router.navigate(['manage/cheque/checkrecords']);
            }

            this._matDilogRef.close({ success: true });
          }
        })
    );
  }

  /**
   * Opens a success alert dialog.
   * @param content - The content of the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      doneMsg: 'OK'
    };
    return this.alertService.successAlert(data);
  }

  // changeCheckBox() {
  //   this.selectedCompany = [];
  //   this.importedCompanies.list?.forEach((res: any) => {
  //     if (res.completed)
  //       this.selectedCompany.push(res.value);
  //   });
  // }

  /** Check box settings */
  // updateAllComplete() {
  //   this.allComplete = this.importedCompanies.list != null && this.importedCompanies.list.every((t: any) => t.completed);
  // }

  // someComplete(): boolean {
  //   if (this.importedCompanies.list == null) {
  //     return false;
  //   }
  //   return this.importedCompanies.list.filter((t: any) => t.completed).length > 0 && !this.allComplete;
  // }

  // setAll(completed: boolean) {
  //   this.allComplete = completed;
  //   if (this.importedCompanies.list == null) {
  //     return;
  //   }
  //   this.importedCompanies.list.forEach((t: any) => (t.completed = completed));

  // }

  /**
   * Cleans up subscriptions and resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

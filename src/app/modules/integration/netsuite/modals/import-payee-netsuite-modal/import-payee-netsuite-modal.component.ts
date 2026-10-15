import { AlertService } from '../../../../../shared/service/alert/alert.service';
import { Subscription } from 'dexie';
import { OnInit, OnDestroy } from '@angular/core';
import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { INetSuiteCompanyDetails } from 'src/app/modules/integration/model/integration';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { finalize } from 'rxjs/operators';
import { NgFor, NgIf } from '@angular/common';

/**
 * Component for importing payees from NetSuite integration.
 */
@Component({
  selector: 'app-import-payee-netsuite-modal',
  templateUrl: './import-payee-netsuite-modal.component.html',
  styleUrls: ['./import-payee-netsuite-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, NgIf]
})
export class ImportPayeeNetsuiteModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  companies: INetSuiteCompanyDetails;
  companyIds: string[] = [];
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public payeeNetSuiteDetails: INetSuiteCompanyDetails,
    public _dialogRef: MatDialogRef<ImportPayeeNetsuiteModalComponent>,
    private _netSuiteintegrationService: NetsuiteIntegrationService,
    private alertService: AlertService
  ) {}

  /**
   * Initializes the component with NetSuite company details.
   */
  ngOnInit(): void {
    this.companies = this.payeeNetSuiteDetails;
  }

  /**
   * Handles the selection change of NetSuite companies.
   * @param checked Indicates whether the company is selected or deselected.
   * @param id The ID of the company.
   */
  onCompanySelectionChanged(checked: boolean, id: string) {
    if (checked) {
      this.companyIds.push(id);
    } else {
      const index = this.companyIds.indexOf(id);
      if (index > -1) {
        this.companyIds.splice(index, 1);
      }
    }
  }

  /**
   * Handles the event when the "Import" button is clicked.
   * Initiates the import of payees from NetSuite.
   */
  onImportClicked() {
    this.loading = true;
    const params: {
      type: number;
      code: string;
      companyIds: string[];
    } = {
      type: 5,
      code: 'netsuite',
      companyIds: this.companyIds
    };

    this.subscriptions.push(
      this._netSuiteintegrationService
        .importNetSuiteTransaction(params)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res) {
            this.alertService.successAlert({ content: 'Payee Imported' });
            this._dialogRef.close();
          }
        })
    );
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

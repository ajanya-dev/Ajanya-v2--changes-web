import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IConnectedCompanyList,
  IMappingBankAccount,
  ISageBusinessData
} from 'src/app/modules/integration/model/integration';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { SageBusinessMapBankAccountModalComponent } from '../../modals/sage-business-map-bank-account-modal/sage-business-map-bank-account-modal.component';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-sage-business-mapping',
  templateUrl: './sage-business-mapping.component.html',
  styleUrls: ['./sage-business-mapping.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, MatTooltip, FaIconComponent, NgClass]
})
export class SageBusinessMappingComponent implements OnInit, OnDestroy {
  /**
   * Flag indicating whether data is loaded.
   */
  dataLoaded = false;

  /**
   * Provider code for Sage Business integration.
   */
  providerCode = 'sage_business' as const;

  /**
   * Sage Business integration data.
   */
  sageBusinessData: ISageBusinessData;

  /**
   * Indicates the connection status (0 or 1).
   */
  isConnected: number;

  /**
   * Array of subscriptions to manage cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * List of mapped bank accounts.
   */
  bankAccountList: IMappingBankAccount[] = [];

  /**
   * Loading state for delete action.
   */
  loading: string | undefined = undefined;

  /**
   * Constructor for the Sage Business Mapping component.
   * @param {IntegrationService} _integrationService - The integration service.
   * @param {MatDialog} __dialog - Reference to the MatDialog service.
   * @param {AlertService} _alertService - The alert service.
   */
  constructor(
    private _integrationService: IntegrationService,
    public __dialog: MatDialog,
    private _alertService: AlertService
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this.getSageData();
    this.getMappedData();
  }

  /**
   * Fetch Sage Business integration data.
   */
  getSageData(): void {
    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .subscribe((res) => {
          if (res.success) {
            this.sageBusinessData = res?.data;
            this.isConnected = res?.data?.connected;
          }
        })
    );
  }

  /**
   * Fetch mapped bank account data.
   */
  getMappedData(): void {
    this.dataLoaded = true;
    this.subscriptions.push(
      this._integrationService
        .getBankAccountMappingList(this.providerCode)
        .pipe(
          finalize(() => {
            this.dataLoaded = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.bankAccountList = res.data;
          }
        })
    );
  }

  /**
   * Open the bank account mapping modal dialog.
   * @param {string} id - The Sage Business ID.
   * @param {IMappingBankAccount} data - The bank account mapping data.
   * @param {string} ismapping - Indicates if it's a mapping operation.
   * @param {string} mode - The mode for the mapping modal (optional).
   */
  openBankAccountMappingModal(
    id: string,
    data: IMappingBankAccount,
    ismapping: string,
    mode?: string
  ): void {
    const dialogRef: MatDialogRef<
      SageBusinessMapBankAccountModalComponent,
      {
        id: string;
        data: IMappingBankAccount;
        ismapping: string;
        mode?: string;
      }
    > = this.__dialog.open(SageBusinessMapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        sageId: id,
        data: data,
        mode: mode ? mode : '',
        ismapping: ismapping
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMappedData();
      }
    });
  }

  /**
   * Delete a mapped bank account.
   * @param {string} bankId - The ID of the bank account to delete.
   * @param {number} i - The index of the bank account in the list.
   */
  onDeleteBankAccount(bankId: string, i: number): void {
    const confirm = this.openConfirmAlert(
      `Are you sure you want to delete this bank account?`
    );
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.onDeleteAction(bankId, i);
      }
    });
  }

  /**
   * Perform the delete action for a bank account.
   * @param {string} bankId - The ID of the bank account to delete.
   * @param {number} i - The index of the bank account in the list.
   */
  onDeleteAction(bankId: string, i: number): void {
    this.loading = bankId;
    this.subscriptions.push(
      this._integrationService
        .deleteMappedBank(this.providerCode, bankId)
        .pipe(
          finalize(() => {
            this.loading = undefined;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Bank account deleted.');
            this.bankAccountList.splice(i, 1);
          }
        })
    );
  }

  /**
   * Import bank accounts from Sage Business.
   */
  ImportBank() {
    const sendingData = {
      mode: 'Bank',
      companyList: this.sageBusinessData?.companies
    };

    if (this.isConnected) {
      const dialogRef: MatDialogRef<
        CompanySelectModalComponent,
        {
          mode: string;
          companyList: IConnectedCompanyList[];
          companyId: string;
        }
      > = this.__dialog.open(CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          if (sendingData.mode == 'Bank') {
            this.importBankFromCompany(res.companyId);
          }
        }
      });
    }
  }

  /**
   * Import bank accounts from a specific company in Sage Business.
   * @param {string} companyId - The ID of the company to import bank accounts from.
   */
  importBankFromCompany(companyId: string) {
    this.subscriptions.push(
      this._integrationService
        .getImportBankAccounts(
          { companyId: companyId, importType: 4 },
          this.providerCode
        )
        .subscribe((res) => {
          if (res?.success) {
            this.openSuccessAlert(res.message);
            this.getMappedData();
          }
        })
    );
  }

  /**
   * Open a confirmation alert dialog.
   * @param {string} content - The content to display in the confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Open a success alert dialog.
   * @param {string} content - The content to display in the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

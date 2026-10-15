import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IBankAccountMappingData,
  IConnectedCompanyList,
  IConnectedThirdPartyData,
  IMappingBankAccount
} from 'src/app/modules/integration/model/integration';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ZohobookMapBankAccountModalComponent } from '../../zoho/modals/zohobook-map-bank-account-modal/zohobook-map-bank-account-modal.component';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * Component for managing bank account mappings with Zoho Books.
 */
@Component({
  selector: 'app-bank-account-mappings',
  templateUrl: './bank-account-mappings.component.html',
  styleUrls: ['./bank-account-mappings.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, MatTooltip, FaIconComponent, NgClass]
})
export class BankAccountMappingsComponent implements OnInit, OnDestroy {
  toolTipContent =
    'If you have mapped an incorrect bank account with Zoho Books bank account, you can delete it from here. When you import again, you will be instructed to re-map.';
  subscriptions: Subscription[] = [];
  bankAccountList: IMappingBankAccount[] = [];
  loading: number | undefined = undefined;
  dataLoaded = false;
  providerCode = 'zoho_books';
  isConnected: number;
  zohoBookData: IConnectedThirdPartyData;

  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    public _dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getMappedData();
    this.getZohoBookData();
  }

  /**
   * Retrieves Zoho Book data including the connection status.
   */
  getZohoBookData(): void {
    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .subscribe((res) => {
          this.zohoBookData = res?.data;
          this.isConnected = res?.data?.connected;
        })
    );
  }

  /**
   * Retrieves the list of mapped bank accounts.
   */
  getMappedData(): void {
    this.dataLoaded = true;
    this.subscriptions.push(
      this._integrationService
        .getBankAccountMapping()
        .pipe(finalize(() => (this.dataLoaded = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccountList = res?.data;
          }
        })
    );
  }

  /**
   * Initiates the import of bank accounts from a selected company.
   */
  importBank() {
    const data = {
      mode: 'Bank',
      companyList: this.zohoBookData?.companies
    };

    if (this.isConnected) {
      const dialogRef: MatDialogRef<
        CompanySelectModalComponent,
        { mode: string; companyList: IConnectedCompanyList; companyId: string }
      > = this._dialog.open(CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: data,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          if (data?.mode == 'Bank') {
            this.importBankFromCompany(res?.companyId);
          }
        }
      });
    }
  }

  /**
   * Imports bank accounts from the selected company.
   * @param selectedCompanyId The ID of the selected company to import bank accounts from.
   */
  importBankFromCompany(selectedCompanyId: string) {
    const params = {
      companyId: selectedCompanyId,
      type: 4
    };

    this.subscriptions.push(
      this._integrationService
        .importZohoBankAccount(this.providerCode, params)
        .subscribe((res) => {
          if (res?.success) {
            this.openSuccessAlert(res?.message);
            this.getMappedData();
          }
        })
    );
  }

  /**
   * Handles the deletion of a bank account mapping.
   * @param bankId The ID of the bank account to delete.
   * @param i The index of the bank account in the list.
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
   * Performs the actual deletion of a bank account mapping.
   * @param bankId The ID of the bank account to delete.
   * @param i The index of the bank account in the list.
   */
  onDeleteAction(bankId: string, i: number): void {
    this.loading = i;
    this.subscriptions.push(
      this._integrationService
        .deleteZohoMappedBank(bankId)
        .pipe(finalize(() => (this.loading = undefined)))
        .subscribe((res) => {
          if (res?.success) {
            this.openSuccessAlert('Bank account deleted.');
            this.bankAccountList.splice(i, 1);
          }
        })
    );
  }

  /**
   * Maps a bank account to Zoho Books.
   * @param qbId The ID of the bank account to map.
   * @param bankId The ID of the bank account to map to.
   */
  mapBankAccount(qbId: string, bankId: string): void {
    const data = {
      bankAccountId: bankId,
      qbId: qbId
    };

    this.subscriptions.push(
      //eslint-disable-next-line @typescript-eslint/no-empty-function
      this._integrationService.mapQbDesktopBankAcc(data).subscribe(() => {})
    );
  }

  /**
   * Opens the bank account mapping modal for Zoho Books.
   * @param id The ID of the bank account to map.
   * @param data The bank account mapping data.
   * @param ismapping A flag indicating whether it's mapping.
   * @param mode An optional mode for the mapping.
   */
  openBankAccountMappingModal(
    id: string,
    data: IBankAccountMappingData,
    ismapping: string,
    mode?: string
  ): void {
    const dialogRef: MatDialogRef<
      ZohobookMapBankAccountModalComponent,
      {
        zohoBookId: string;
        data: IBankAccountMappingData;
        ismapping: string;
        mode?: string;
      }
    > = this._dialog.open(ZohobookMapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        zohoBookId: id,
        data: data,
        mode: mode ? mode : '',
        ismapping: ismapping
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getMappedData();
      }
    });
  }

  /**
   * Returns the ID of a bank account.
   * @param item The bank account item.
   * @returns The ID of the bank account.
   */
  bankById(item: { id: string }): string {
    return item.id;
  }

  /**
   * Opens a confirmation alert dialog.
   * @param content The content of the confirmation dialog.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Opens a success alert dialog.
   * @param content The content of the success dialog.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

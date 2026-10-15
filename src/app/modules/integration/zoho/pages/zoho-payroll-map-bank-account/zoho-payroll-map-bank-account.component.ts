import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IBankAccountMappingData,
  IConnectedCompanyList,
  IConnectedThirdPartyData
} from 'src/app/modules/integration/model/integration';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { ZohoPayrollMapBankAccountModalComponent } from '../../modals/zoho-payroll-map-bank-account-modal/zoho-payroll-map-bank-account-modal.component';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * Component for mapping bank accounts in Zoho Payroll integration.
 */
@Component({
  selector: 'app-zoho-payroll-map-bank-account',
  templateUrl: './zoho-payroll-map-bank-account.component.html',
  styleUrls: ['./zoho-payroll-map-bank-account.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, MatTooltip, FaIconComponent, NgClass]
})
export class ZohoPayrollMapBankAccountComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  bankAccountList: IBankAccountMappingData[] = [];
  loading: number | undefined = undefined;
  dataLoaded = false;
  providerCode = 'zoho_payroll';
  isConnected: number;
  zohoPayrollData: IConnectedThirdPartyData;

  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    public _dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getMappedData();
    this.getZohoPayrollData();
  }

  /**
   * Get Zoho Payroll integration data.
   */
  getZohoPayrollData(): void {
    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .subscribe((res) => {
          this.zohoPayrollData = res?.data;
          this.isConnected = res?.data?.connected;
        })
    );
  }

  /**
   * Get mapped bank account data.
   */
  getMappedData(): void {
    this.dataLoaded = true;
    this.subscriptions.push(
      this._integrationService
        .getBankAccountMappingList(this.providerCode)
        .pipe(finalize(() => (this.dataLoaded = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccountList = res?.data;
          }
        })
    );
  }

  /**
   * Import bank accounts from a company.
   */
  importBank() {
    const sendingData = {
      mode: 'Bank',
      companyList: this.zohoPayrollData?.companies
    };

    if (this.isConnected) {
      const dialogRef: MatDialogRef<
        CompanySelectModalComponent,
        { mode: string; companyList: IConnectedCompanyList; companyId: string }
      > = this._dialog.open(CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          if (sendingData?.mode == 'Bank') {
            this.importBankFromCompany(res?.companyId);
          }
        }
      });
    }
  }

  /**
   * Import bank accounts from a selected company.
   * @param selectedCompanyId - The ID of the selected company.
   */
  importBankFromCompany(selectedCompanyId: string) {
    const params = {
      companyId: selectedCompanyId,
      type: 4
    };

    this.subscriptions.push(
      this._integrationService
        .importZohoPayrollAccount(this.providerCode, params)
        .subscribe((res) => {
          if (res?.success) {
            this.openSuccessAlert(res?.message);
            this.getMappedData();
          }
        })
    );
  }

  /**
   * Handle the deletion of a bank account mapping.
   * @param bankId - The ID of the bank account to be deleted.
   * @param i - The index of the bank account in the list.
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
   * Perform the deletion action for a bank account.
   * @param bankId - The ID of the bank account to be deleted.
   * @param i - The index of the bank account in the list.
   */
  onDeleteAction(bankId: string, i: number): void {
    this.loading = i;
    this.subscriptions.push(
      this._integrationService
        .deleteMappedBank(this.providerCode, bankId)
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
   * Open a modal for bank account mapping.
   * @param id - The ID of the bank account mapping.
   * @param data - The bank account mapping data.
   * @param isMapping - Indicates if it's mapping or unmapping.
   * @param mode - Optional mode for the modal.
   */
  openBankAccountMappingModal(
    id: string,
    data: IBankAccountMappingData,
    isMapping: string,
    mode?: string
  ): void {
    const dialogRef: MatDialogRef<
      ZohoPayrollMapBankAccountModalComponent,
      {
        zohoPayrollId: string;
        data: IBankAccountMappingData;
        isMapping: string;
        mode?: string;
      }
    > = this._dialog.open(ZohoPayrollMapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        zohoPayrollId: id,
        data: data,
        mode: mode ? mode : '',
        isMapping: isMapping
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getMappedData();
      }
    });
  }

  /**
   * Get the unique ID for a bank account.
   * @param item - The bank account mapping data.
   */
  bankById(item: IBankAccountMappingData): string {
    return item.id;
  }

  /**
   * Open a confirmation alert dialog.
   * @param content - The content of the confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Open a success alert dialog.
   * @param content - The content of the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

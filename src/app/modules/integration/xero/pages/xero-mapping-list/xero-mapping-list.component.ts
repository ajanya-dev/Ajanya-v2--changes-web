import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { XeroMapBankAccountModalComponent } from '../../modals/xero-map-bank-account-modal/xero-map-bank-account-modal.component';
import {
  IConnectedThirdPartyData,
  IbankAccountList
} from '../../../model/integration';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * Component for mapping bank accounts in Xero.
 */
@Component({
  selector: 'app-xero-mapping-list',
  templateUrl: './xero-mapping-list.component.html',
  styleUrls: ['./xero-mapping-list.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, MatTooltip, FaIconComponent, NgClass]
})
export class XeroMappingListComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  bankAccountList: IbankAccountList[] = [];
  loading: string | undefined = undefined;
  dataLoaded = false;
  providerCode = 'xero' as const;
  isConnected: number;
  xeroData: IConnectedThirdPartyData;
  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    public __dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getMappedData();
    this.getXeroData();
  }

  /**
   * Retrieves Xero integration data.
   */
  getXeroData() {
    this.subscriptions.push(
      this._integrationService
        .getDetails(this.providerCode)
        .subscribe((res) => {
          if (res.success) {
            this.xeroData = res.data;
            this.isConnected = res.data.connected;
          }
        })
    );
  }

  /**
   * Retrieves mapped bank account data.
   */
  getMappedData(): void {
    this.dataLoaded = true;
    this.subscriptions.push(
      this._integrationService
        .getBankAccountMappingXero()
        .pipe(finalize(() => (this.dataLoaded = false)))
        .subscribe((res) => {
          if (res.success) {
            this.bankAccountList = res.data;
          }
        })
    );
  }

  /**
   * Initiates the import of bank accounts.
   */
  ImportBank() {
    const sendingData = {
      mode: 'Bank',
      companyList: this.xeroData?.companies
    };

    if (this.isConnected) {
      const dialogRef = this.__dialog.open(CompanySelectModalComponent, {
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
   * Imports bank accounts from a selected company.
   */
  importBankFromCompany(companyId: string) {
    this.subscriptions.push(
      this._integrationService
        .getImportXeroCompanies({
          importTime: 1,
          companyId: companyId,
          importBill: 5
        })
        .subscribe((res) => {
          if (res?.success) {
            this.openSuccessAlert(res.message);
            this.getMappedData();
          }
        })
    );
  }

  /**
   * Handles the deletion of a bank account.
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
   * Performs the deletion of a bank account.
   */
  onDeleteAction(bankId: string, i: number): void {
    this.loading = bankId;
    this.subscriptions.push(
      this._integrationService
        .deleteXeroMappedBank(bankId)
        .pipe(finalize(() => (this.loading = undefined)))
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Bank account deleted.');
            this.bankAccountList.splice(i, 1);
          }
        })
    );
  }

  /**
   * Maps a bank account to a specific Xero ID.
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
   * Opens the bank account mapping modal.
   */
  openBankAccountMappingModal(
    id: string,
    data: IbankAccountList,
    mode?: string
  ): void {
    const dialogRef = this.__dialog.open(XeroMapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: { xeroId: id, data: data, mode: mode ? mode : '' }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMappedData();
      }
    });
  }

  /**
   * Retrieves the ID of a bank account.
   */
  bankById(item: IbankAccountList): string {
    return item.id;
  }

  /**
   * Opens a confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Opens a success alert.
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

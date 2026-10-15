import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { MapBankAccountModalDesktopComponent } from '../../modals/map-bank-account-modal-desktop/map-bank-account-modal-desktop.component';
import {
  ICompanyBankAccounts,
  IQBCompanyData,
  IQbCompanyList
} from '../../../model/integration';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { faDownToLine, faSpinner } from '@fortawesome/pro-solid-svg-icons';

/**
 * Component for mapping QuickBooks Desktop bank accounts.
 */
@Component({
  selector: 'app-mapping-quick-book-desktop',
  templateUrl: './mapping-quick-book-desktop.component.html',
  styleUrls: ['./mapping-quick-book-desktop.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, MatTooltip, NgClass, FaIconComponent]
})
export class MappingQuickBookDesktopComponent implements OnInit, OnDestroy {
  toolTipContent =
    'If you have incorrectly mapped your bank account with Quickbooks bank account, You can delete it from here. when you will re-import, it will tell you to re-mapped again.';
  subscriptions: Subscription[] = [];
  loading: string | undefined = undefined;
  isdataLoading = false;
  faSpinner = faSpinner;
  faDownToLine = faDownToLine;
  
  /**
   * Loading states for different QuickBooks operations
   */
  quickBooksLoading = {
    bank: false,
    payee: false,
    category: false,
    class: false,
    location: false
  };
  companyData: IQbCompanyList[];
  isConnected: number;
  selectedID: string;
  companyBankAccountList: IQBCompanyData[] = [];
  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private __dialog: MatDialog
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this.getMappedData();
    this.loadCompanyData();
  }

  /**
   * Get mapped data for QuickBooks Desktop bank accounts.
   */
  getMappedData(): void {
    this.isdataLoading = true;
    this.subscriptions.push(
      this._integrationService
        .geQbDesktopBankMappedData()
        .pipe(finalize(() => (this.isdataLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.companyBankAccountList = res.data;
          }
        })
    );
  }

  /**
   * Handle the deletion of a bank account mapping.
   * @param {string} bankId - The ID of the bank account mapping to delete.
   * @param {number} i - Index of the mapping to remove from the list.
   * @param {ICompanyBankAccounts[]} companyBankAccounts - List of company bank accounts.
   */
  onDeleteBankAccount(
    bankId: string,
    i: number,
    companyBankAccounts: ICompanyBankAccounts[]
  ): void {
    const confirm = this.openConfirmAlert(
      `Are you sure you want to delete this bank account mapping?`
    );
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.onDeleteAction(bankId, i, companyBankAccounts);
      }
    });
  }

  /**
   * Delete a bank account mapping.
   * @param {string} bankId - The ID of the bank account mapping to delete.
   * @param {number} i - Index of the mapping to remove from the list.
   * @param {ICompanyBankAccounts[]} companyBankAccounts - List of company bank accounts.
   */
  onDeleteAction(
    bankId: string,
    i: number,
    companyBankAccounts: ICompanyBankAccounts[]
  ): void {
    this.loading = bankId;
    this.subscriptions.push(
      this._integrationService
        .deleteQbMappedBank(bankId)
        .pipe(finalize(() => (this.loading = undefined)))
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Bank account mapping deleted.');
            companyBankAccounts.splice(i, 1);
          }
        })
    );
  }

  /**
   * Map a bank account to QuickBooks Desktop.
   * @param {string} qbId - The QuickBooks Desktop ID.
   * @param {string} bankId - The bank account ID.
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
   * Open the bank account mapping modal.
   * @param {string} id - The QuickBooks Desktop ID.
   */
  openBankAccountMappingModal(id: string): void {
    const dialogRef = this.__dialog.open(MapBankAccountModalDesktopComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: { qbId: id, ismapping: 2 }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMappedData();
      }
    });
  }

  /**
   * Edit a bank account mapping by opening the mapping modal.
   * @param {string} id - The QuickBooks Desktop ID.
   */
  onEditRow(id: string) {
    const dialogRef = this.__dialog.open(MapBankAccountModalDesktopComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: { qbId: id, mode: 'edit', ismapping: 2 }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getMappedData();
      }
    });
  }

  /**
   * Get the ID of a bank item.
   * @param {Object} item - The bank item.
   * @returns {string} - The ID of the bank item.
   */
  bankById(item: { id: string }): string {
    return item.id;
  }

  // onWindowScroll(e: any) {

  //   if (e.path) {
  //     let element = document.querySelector('.ocw_table_wrapper')!;
  //     element.classList.add('sticky');
  //   } else {
  //     let element = document.querySelector('.ocw_table_wrapper')!;
  //     element.classList.remove('sticky');
  //   }
  // }

  /**
   * Open a confirmation alert dialog.
   * @param {string} content - The content of the confirmation alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Open a success alert dialog.
   * @param {string} content - The content of the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Load company data for QuickBooks Desktop.
   */
  loadCompanyData() {
    this.subscriptions.push(
      this._integrationService
        .getQuickbooksDesktopCompanies()
        .subscribe((res) => {
          if (res.success) {
            this.companyData = res.data.companies;
            this.isConnected = res.data?.companyCount;
          }
        })
    );
  }

  /**
   * Import bank accounts from QuickBooks Desktop.
   */
  ImportBank() {
    const sendingData = {
      mode: 'Bank',
      companyList: this.companyData
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
          this.importNewBankAccountsOfQBDCompany(res.id);
        }
      });
    } else {
      this._alertService.infoAlert({
        content: "We couldn't connect to any QuickBooks Desktop company",
        close: false
      });
    }
  }

  /**
   * Import new bank accounts of a QuickBooks Desktop company.
   * @param {string} companyId - The ID of the QuickBooks Desktop company.
   */
  importNewBankAccountsOfQBDCompany(companyId: string) {
    this.quickBooksLoading.bank = true;
    const sendingData = new FormData();
    sendingData.append('company_id', companyId);
    this.subscriptions.push(
      this._integrationService
        .importNewBankAccountsOfQBDCompany(sendingData)
        .pipe(finalize(() => {
          this.quickBooksLoading.bank = false;
        }))
        .subscribe((res) => {
          if (res.success) {
            this._alertService.successAlert({
              content:
                'Refresh the bank accounts list after one minute to view changes.',
              close: false
            });
          }
        })
    );
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { GustoMapBankAccountModalComponent } from '../../components/gusto-map-bank-account-modal/gusto-map-bank-account-modal.component';
import { IGustobankAccount } from '../../../model/integration';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * Component for Gusto Mapping management.
 */
@Component({
  selector: 'app-gusto-mapping',
  templateUrl: './gusto-mapping.component.html',
  styleUrls: ['./gusto-mapping.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, NgClass, MatTooltip, FaIconComponent]
})
export class GustoMappingComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  bankAccountList: IGustobankAccount[];
  loading: number | undefined = undefined;
  dataLoaded = false;
  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private __dialog: MatDialog
  ) {}

  /**
   * Initializes the component and fetches mapped bank account data.
   */
  ngOnInit(): void {
    this.getMappedData();
  }

  /**
   * Fetches mapped bank account data.
   * @param isItInitial - Flag indicating whether it's the initial data load.
   */
  getMappedData(isItInitial = true): void {
    if (isItInitial) {
      this.dataLoaded = true;
    }
    this.subscriptions.push(
      this._integrationService
        .geGustoBankMappedData()
        .pipe(finalize(() => (this.dataLoaded = false)))
        .subscribe((res) => {
          if (res.success) {
            this.bankAccountList = res.data;
          }
        })
    );
  }

  /**
   * Handles the deletion of a bank account mapping.
   * @param bankId - ID of the bank account to delete.
   * @param i - Index of the bank account in the list.
   */
  onDeleteBankAccount(bankId: string, i: number): void {
    const confirm = this.openConfirmAlert(
      `Are you sure you want to delete this bank account mapping?`
    );
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.onDeleteAction(bankId, i);
      }
    });
  }

  /**
   * Deletes a bank account mapping.
   * @param bankId - ID of the bank account to delete.
   * @param i - Index of the bank account in the list.
   */
  onDeleteAction(bankId: string, i: number): void {
    this.loading = i;
    this.subscriptions.push(
      this._integrationService
        .deleteGustoMappedBank(bankId)
        .pipe(finalize(() => (this.loading = undefined)))
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Bank account deleted.');
            this.bankAccountList[i].isMapped = 0;
          }
        })
    );
  }

  /**
   * Opens the bank account mapping modal dialog.
   * @param item - Bank account data.
   * @param editMode - Flag indicating whether it's in edit mode.
   */
  openBankAccountMappingModal(item: IGustobankAccount, editMode = false): void {
    if (!item.isMapped && editMode) {
      return;
    }
    const modal = this.__dialog.open(GustoMapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        bankId: item.id,
        companyName: item.companyName,
        editMode: editMode
      }
    });

    modal.afterClosed().subscribe((r) => {
      if (r.success) {
        this.getMappedData(false);
      }
    });
  }

  /**
   * Retrieves the ID of a bank account.
   * @param item - Bank account data.
   * @returns The ID of the bank account.
   */
  bankById(item: IGustobankAccount): string {
    return item.id;
  }

  /**
   * Opens a confirmation alert dialog.
   * @param content - Content to display in the alert.
   */
  openConfirmAlert(content: string) {
    const data = {
      content: content
    };
    return this._alertService.confirmAlert(data);
  }

  /**
   * Opens a success alert dialog.
   * @param content - Content to display in the alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPenToSquare, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { IQuickbooksPayrollBankMapping } from 'src/app/modules/integration/model/integration';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { QuickbooksPayrollMapBankModalComponent } from '../quickbooks-payroll-map-bank-modal/quickbooks-payroll-map-bank-modal.component';

/**
 * Bank account mapping page for the QuickBooks Payroll integration.
 */
@Component({
  selector: 'app-quickbooks-payroll-mapping',
  templateUrl: './quickbooks-payroll-mapping.component.html',
  styleUrls: ['./quickbooks-payroll-mapping.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, NgClass, MatTooltip, FaIconComponent]
})
export class QuickbooksPayrollMappingComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;

  /**
   * Mappings returned by the bank account mapping endpoint.
   */
  bankAccountList: IQuickbooksPayrollBankMapping[] = [];

  ngOnInit(): void {
    this.getBankMappings();
  }

  /**
   * Loads the company / bank account mappings.
   */
  getBankMappings(): void {
    this.integrationService
      .getQuickbooksPayrollBankMappings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.bankAccountList = res?.data ?? [];
      });
  }

  /**
   * Opens the bank account mapping modal and reloads the table once a mapping
   * is saved.
   * @param item Mapping row the bank account belongs to.
   * @param editMode True when opened from the edit icon.
   */
  openBankAccountMappingModal(
    item: IQuickbooksPayrollBankMapping,
    editMode = false
  ): void {
    if (!item.isMapped && editMode) {
      return;
    }
    this.dialog
      .open(QuickbooksPayrollMapBankModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: {
          id: item.id,
          companyName: item.companyName,
          editMode
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.success) {
          this.getBankMappings();
        }
      });
  }

  /**
   * Removes a mapping after confirmation and reloads the table.
   * @param item Mapping row to remove.
   */
  onDeleteBankAccount(item: IQuickbooksPayrollBankMapping): void {
    this.alertService
      .confirmAlert({
        content: `Are you sure you want to remove the mapping of ${item.companyName}?`,
        doneMsg: 'Yes',
        cancelMsg: 'No'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.deleteBankMapping(item.id);
      });
  }

  /**
   * Calls the delete endpoint and alerts with the message returned by the API.
   * @param id Mapping row id.
   */
  private deleteBankMapping(id: string): void {
    this.integrationService
      .deleteQuickbooksPayrollBankMapping(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message ?? '',
            close: true,
            timeout: 1200
          });
          this.getBankMappings();
        } else if (res?.errorMsg) {
          this.alertService.warningAlert({ content: res.errorMsg });
        }
      });
  }
}

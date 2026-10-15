import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { IBankAccountMappingData } from 'src/app/modules/integration/model/integration';
import { SuccessAlertComponent } from 'src/app/shared/alert/components/success-alert/success-alert.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from '../../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

/**
 * Component for mapping bank accounts in Zoho Payroll integration.
 */
@Component({
  selector: 'app-zoho-payroll-map-bank-account-modal',
  templateUrl: './zoho-payroll-map-bank-account-modal.component.html',
  styleUrls: ['./zoho-payroll-map-bank-account-modal.component.scss'],
  standalone: true,
  imports: [
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgIf
  ]
})
export class ZohoPayrollMapBankAccountModalComponent
  implements OnInit, OnDestroy
{
  subscriptions: Subscription[] = [];
  editMode = false;
  bankAccount = new FormControl('', Validators.required);
  loading = false;
  providerCode = 'zoho_payroll';
  isMapping: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public mappingData: {
      zohoPayrollId: string;
      zohoPayrollData: IBankAccountMappingData;
      mode: string;
      isMapping: string;
    },
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private _matDailogRef: MatDialogRef<ZohoPayrollMapBankAccountModalComponent>
  ) {}

  ngOnInit(): void {
    if (this.mappingData?.mode == 'edit') {
      this.editMode = true;
    }
    if (this.mappingData) {
      this.isMapping = this.mappingData?.isMapping;
    }
  }

  /**
   * Submits the bank account mapping form.
   */
  submit(): void {
    if (!this.loading) {
      this.bankAccount.markAsTouched();
      if (this.bankAccount.invalid || !this.bankAccount.value) {
        return;
      }
      const sendingData = {
        bank_account: this.bankAccount.value,
        id: this.mappingData.zohoPayrollId
      };
      this.loading = true;
      this.subscriptions.push(
        this._integrationService
          .mapBankAccount(sendingData, this.providerCode)
          .subscribe((res) => {
            if (res?.success) {
              this.openSuccessAlert('Bank account mapped successfully.');
              this._matDailogRef.close(true);
            }
          })
      );
    }
  }

  /**
   * Handles the change event of the bank dropdown.
   * @param event - The event object containing the selected bank.
   */
  bankDropDownChange(event: IBankDropdown): void {
    if (event?.id) {
      this.bankAccount.setValue(event?.id);
    } else {
      this.bankAccount.setValue('');
    }
  }

  /**
   * Opens a success alert with the given content.
   * @param content - The content to display in the success alert.
   * @returns A reference to the opened success alert dialog.
   */
  openSuccessAlert(
    content: string
  ): MatDialogRef<SuccessAlertComponent, boolean> {
    const alertMessage = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(alertMessage);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

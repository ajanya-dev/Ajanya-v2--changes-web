import { IBankDropdown } from 'src/app/models/bank';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { IMappingBankAccount } from 'src/app/modules/integration/model/integration';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from '../../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

/**
 * Component for mapping bank accounts in Sage Business.
 */
@Component({
  selector: 'app-sage-business-map-bank-account-modal',
  templateUrl: './sage-business-map-bank-account-modal.component.html',
  styleUrls: ['./sage-business-map-bank-account-modal.component.scss'],
  standalone: true,
  imports: [
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgIf
  ]
})
export class SageBusinessMapBankAccountModalComponent
  implements OnInit, OnDestroy
{
  /**
   * Indicates whether the component is in a loading state.
   */
  loading = false;

  /**
   * Form control for the bank account selection.
   */
  bankAccount = new UntypedFormControl('', Validators.required);

  /**
   * Flag to determine if the component is in edit mode.
   */
  editmode = false;

  /**
   * Array of subscriptions to manage cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Provider code for Sage Business integration.
   */
  providerCode = 'sage_business' as const;

  /**
   * Indicates whether the component is used for mapping or not.
   */
  ismapping: string;

  /**
   * Constructor for the Sage Business Map Bank Account Modal component.
   * @param {MAT_DIALOG_DATA} data - Data passed to the dialog.
   * @param {IntegrationService} _integrationService - The integration service.
   * @param {AlertService} _alertService - The alert service.
   * @param {MatDialogRef<SageBusinessMapBankAccountModalComponent>} __matDilogRef - Reference to the MatDialog.
   */
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      sageId: string;
      mappingData: IMappingBankAccount;
      mode: string;
      ismapping: string;
    },
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private __matDilogRef: MatDialogRef<SageBusinessMapBankAccountModalComponent>
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    if (this.data?.mode == 'edit') {
      this.editmode = true;
    }
    if (this.data) {
      this.ismapping = this.data?.ismapping;
    }
  }

  /**
   * Submit the mapped bank account.
   */
  submit(): void {
    if (!this.loading) this.bankAccount.markAllAsTouched();
    if (this.bankAccount.invalid) {
      return;
    }

    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .mapBankAccount(
          { bank_account: this.bankAccount.value, id: this.data.sageId },
          this.providerCode
        )
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Bank account mapped successfully.');
            this.__matDilogRef.close(true);
          }
        })
    );
  }

  /**
   * Handle the change event of the bank dropdown.
   * @param {IBankDropdown} event - The bank dropdown change event.
   */
  bankDropDownChange(event: IBankDropdown): void {
    if (event?.id) {
      this.bankAccount.setValue(event.id);
    } else {
      this.bankAccount.setValue('');
    }
  }

  /**
   * Open a success alert dialog.
   * @param {string} content - The content to display in the alert.
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

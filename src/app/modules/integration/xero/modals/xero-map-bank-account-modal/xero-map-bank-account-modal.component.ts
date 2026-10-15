import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IEvent } from 'src/app/modules/invoices/model/invoice';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from '../../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

/**
 * Component for mapping a bank account in Xero.
 */
@Component({
  selector: 'app-xero-map-bank-account-modal',
  templateUrl: './xero-map-bank-account-modal.component.html',
  styleUrls: ['./xero-map-bank-account-modal.component.scss'],
  standalone: true,
  imports: [
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgIf
  ]
})
export class XeroMapBankAccountModalComponent implements OnInit, OnDestroy {
  loading = false;
  subscriptions: Subscription[] = [];
  bankAccount = new UntypedFormControl('', Validators.required);
  editmode = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { xeroId: string; data: object; mode: string },

    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private __matDilogRef: MatDialogRef<XeroMapBankAccountModalComponent>
  ) {}

  ngOnInit(): void {
    if (this.data.mode == 'edit') {
      this.editmode = true;
    }
  }

  /**
   * Submits the bank account mapping request to Xero.
   * Checks for validation and sends the request.
   */
  submit(): void {
    if (!this.loading) {
      this.bankAccount.markAsTouched();
      if (this.bankAccount.invalid) {
        return;
      }

      this.loading = true;
      this.subscriptions.push(
        this._integrationService
          .mapXeroBankAcc({
            bank_account: this.bankAccount.value,
            id: this.data.xeroId
          })
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res?.success) {
              this.openSuccessAlert('Bank account mapped successfully.');
              this.__matDilogRef.close(true);
            }
          })
      );
    }
  }

  /**
   * Handles the change event of the bank dropdown selection.
   * @param ev - The change event object.
   */
  bankDropDownChange(ev: IEvent): void {
    if (ev?.id) {
      this.bankAccount.setValue(ev.id);
    } else {
      this.bankAccount.setValue('');
    }
  }

  /**
   * Opens a success alert dialog.
   * @param content - The content of the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Cleans up subscriptions and resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

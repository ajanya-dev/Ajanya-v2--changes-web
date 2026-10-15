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
import { ISuccessAlert } from 'src/app/models/alert';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from '../../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

@Component({
  selector: 'app-gusto-map-bank-account-modal',
  templateUrl: './gusto-map-bank-account-modal.component.html',
  styleUrls: ['./gusto-map-bank-account-modal.component.scss'],
  standalone: true,
  imports: [
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgIf
  ]
})
export class GustoMapBankAccountModalComponent implements OnInit, OnDestroy {
  loading = false;
  subscriptions: Subscription[] = [];
  bankAccount = new UntypedFormControl('', Validators.required);
  editmode = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { bankId: string; companyName: string; editMode: boolean },

    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private __matDilogRef: MatDialogRef<GustoMapBankAccountModalComponent>
  ) {}

  /**
   * Initializes the Gusto Map Bank Account modal.
   */
  ngOnInit(): void {
    if (this.data.editMode) {
      this.editmode = true;
    }
  }

  /**
   * Submits the Gusto bank account mapping or update.
   */
  submit(): void {
    /**
     * Handles Gusto bank account mapping.
     */
    const onMap = () => {
      this._integrationService
        .mapGustoBankAccount(postData)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            afterSuccess();
          }
        });
    };

    /**
     * Handles Gusto bank account update.
     */
    const onUpdate = () => {
      this._integrationService
        .updateGustoMappedBankAccount(postData)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            afterSuccess();
          }
        });
    };

    /**
     * Actions to perform after successful mapping or update.
     */
    const afterSuccess = () => {
      this.openSuccessAlert('Bank account mapped successfully.');
      this.__matDilogRef.close({ success: true });
    };

    // Prevent duplicate submissions
    if (this.loading) {
      return;
    }

    // Mark the bankAccount control as touched
    this.bankAccount.markAsTouched();
    if (this.bankAccount.invalid) {
      return;
    }

    // Check if bankAccount control is invalid
    const postData = {
      bankAccountId: this.bankAccount.value,
      id: this.data.bankId
    };

    // Set loading state and perform the appropriate action
    this.loading = true;
    if (this.editmode) {
      onUpdate();
    } else {
      onMap();
    }
  }

  /**
   * Handles the change event of the bank dropdown.
   * @param ev - The event containing the selected bank ID.
   */
  bankDropDownChange(ev: { id: string }): void {
    if (ev?.id) {
      this.bankAccount.setValue(ev.id);
    } else {
      this.bankAccount.setValue('');
    }
  }

  /**
   * Opens a success alert dialog with the given content.
   * @param content - The content to display in the alert.
   */
  openSuccessAlert(content: string) {
    const data: ISuccessAlert = {
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

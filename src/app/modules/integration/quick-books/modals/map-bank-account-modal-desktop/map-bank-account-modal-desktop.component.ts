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
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankComponent } from '../../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

/**
 * Component for mapping bank accounts for QuickBooks Desktop integration in a modal.
 */
@Component({
  selector: 'app-map-bank-account-modal-desktop',
  templateUrl: './map-bank-account-modal-desktop.component.html',
  styleUrls: ['./map-bank-account-modal-desktop.component.scss'],
  standalone: true,
  imports: [
    DropDownBankComponent,
    ControlMessageComponent,
    MatDialogActions,
    MatDialogClose,
    NgIf
  ]
})
export class MapBankAccountModalDesktopComponent implements OnInit, OnDestroy {
  loading = false;
  subscriptions: Subscription[] = [];
  bankAccount = new UntypedFormControl('', Validators.required);
  editmode = false;
  ismapping: string;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      qbId: string;
      data: unknown;
      mode: string;
      ismapping: string;
    },

    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private __matDilogRef: MatDialogRef<MapBankAccountModalDesktopComponent>
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    if (this.data.mode == 'edit') {
      this.editmode = true;
    }
    if (this.data) {
      this.ismapping = this.data?.ismapping;
    }
  }

  /**
   * Submit the bank account mapping.
   */
  submit(): void {
    if (!this.loading) {
      this.bankAccount.markAsTouched();
      if (this.bankAccount.invalid) {
        return;
      }

      if (this.editmode) {
        this.loading = true;
        this._integrationService
          .updateMapQBDesktopBankAcc(this.data.qbId, {
            bankAccountId: this.bankAccount.value
          })
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res?.success) {
              this.openSuccessAlert(res?.message);
              this.__matDilogRef.close(true);
            }
          });
      } else {
        this.loading = true;
        this._integrationService
          .mapQuickBooksDesktopBankAcc({
            bankAccountId: this.bankAccount.value,
            qbId: this.data.qbId
          })
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res?.success) {
              this.openSuccessAlert(res?.message);
              this.__matDilogRef.close(true);
            }
          });
      }
    }
  }

  /**
   * Handle the change in the bank account dropdown.
   * @param {Object} ev - The event object containing the selected bank account ID.
   */
  bankDropDownChange(ev: { id: string }): void {
    if (ev?.id) {
      this.bankAccount.setValue(ev.id);
    } else {
      this.bankAccount.setValue('');
    }
  }

  /**
   * Open a success alert dialog with the given content.
   * @param {string} content - The content to display in the success alert.
   */
  openSuccessAlert(content: string | undefined) {
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

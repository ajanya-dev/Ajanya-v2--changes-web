import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IBankData } from 'src/app/models/bank';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { NgIf } from '@angular/common';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-confirm-micro-deposit-modal',
  templateUrl: './confirm-micro-deposit-modal.component.html',
  styleUrls: ['./confirm-micro-deposit-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    ControlMessageComponent,
    MatDialogActions,
    NgIf
  ]
})
export class ConfirmMicroDepositModalComponent implements OnInit, OnDestroy {

  public data: IBankData | { encrypted_bankacc_id: string } = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  public dialogRef = inject(MatDialogRef<ConfirmMicroDepositModalComponent>);
  private gettingStartedService = inject(GettingStartedService);
  private v3DataTableService = inject(V3DataTableService);
  private commonOnInitService = inject(CommonOnInitService);

  confirmForm = this.fb.group({
    bankAccNumber: [''],
    amount1: ['', [Validators.required]],
    amount2: ['', [Validators.required]]
  });

  subscriptions: Subscription[] = [];
  btnDesable = false;
  attemptLeft = 3;

  ngOnInit(): void {
    this.getData();
  }

  /**
   * @description Retrieves data for confirming micro deposits.
   */
  getData() {
    this.subscriptions.push(
      this.bankAccService
        .getConfirmMicroDeposit(this.data.encrypted_bankacc_id)
        .subscribe((res) => {
          if (res.success === true) {
            this.attemptLeft = res.data.attemptLeft;
            this.confirmForm.patchValue({
              bankAccNumber: res.data.bankAccountNumber
            });
          }
        })
    );
  }

  /**
   * @description Creates the form body for confirming micro despoditd.
   * @returns {object} - The form body object.
   */
  formBody(): { bankAccountId: string; amount1: number; amount2: number } {
    const data = this.confirmForm.value;

    return {
      bankAccountId: this.data.encrypted_bankacc_id,
      amount1: Number(data.amount1),
      amount2: Number(data.amount2)
    };
  }

  /**
   *
   * @description Submits the confirmation of micro deposits.
   */
  submit() {
    const pocessedData = this.formBody();

    this.confirmForm.markAllAsTouched();

    if (this.confirmForm.invalid) {
      return;
    }
    this.btnDesable = true;

    this.subscriptions.push(
      this.bankAccService
        .confirmMicroDeposit(pocessedData)
        .pipe(
          catchError((err) => {
            if (err.error.success === false) {
              this.getData();
              this.dataTableService.setRefreshStatus(true);
              if(err.error.errorCode === 517){
                this.commonOnInitService.contactAlert('All attempts have been completed. Verification of your account has failed. Please contact our customer support for assistance.');
              }
            }
            this.v3DataTableService.refreshV3DataTable();
            return of(false);
          })
        )
        .subscribe((res) => {
          this.btnDesable = false;
          const response = res as { success: boolean; data: string };
          if (response.success) {
            this.dialogRef.close(true);
            this.v3DataTableService.refreshV3DataTable();
            this.dataTableService.setRefreshStatus(true);
            this.alertService.successAlert();
            this.gettingStartedService.updatedGettingStartedData = 3;
          }
        })
    );
  }

  /**
   * @description  Allows only numeric input in an event based on the key code.
   * @param {object} event - The event object containing the key code.
   * @param {number} event.which - The key code of the pressed key.
   * @param {number} event.keyCode - The key code of the pressed key.
   * @returns {boolean} - Returns true if the key press is a numeric value, otherwise returns false.
   */
  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscriptions) => {
      subscriptions.unsubscribe();
    });
  }
}

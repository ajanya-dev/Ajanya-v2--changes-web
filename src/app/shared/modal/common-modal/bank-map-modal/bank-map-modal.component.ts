import { Component, Inject, OnDestroy } from '@angular/core';
import { UntypedFormControl, FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { IApiResMesssage } from 'src/app/models/api';
import { IInvoiceRowData } from 'src/app/modules/invoices/model/invoice';
import { IBankSource } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { BankAcDropdownV3Component } from '../../../components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';

enum thirdpartyProviderCode {
  'xero' = 2,
  'zoho_books' = 3,
  'sage_business' = 5
}

interface IBankMapData {
  id: string;
  tableId: unknown;
  selectedRow: IInvoiceRowData;
}

/**
 * @description Modal component for mapping bank account.
 */
@Component({
  selector: 'app-bank-map-modal',
  templateUrl: './bank-map-modal.component.html',
  styleUrls: ['./bank-map-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    BankAcDropdownV3Component,
    FormsModule,
    ControlMessageComponent,
    NgClass
  ]
})
export class BankMapModalComponent implements OnDestroy {
  bankAccount: UntypedFormControl = new UntypedFormControl();
  subscriptions: Subscription[] = [];
  dataLoaded: boolean;
  selectedBankaccount: string;
  disable = true;
  selectedBankaccountId: string;
  selectedInvoiceId: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) private dialogueData: IBankMapData,
    private invoiceService: InvoiceService,
    private alertService: AlertService,
    private __dialogRef: MatDialogRef<BankMapModalComponent>,
    private _sharedService: SharedService
  ) {}

  /**
   *@description Method invoked when `selectionEvent` is triggered from child `app-drop-down-bank`.
   * Checks whether bank is mapped or not.
   * @param eventData - selectionEvent from child.
   */
  onChangeBank(eventData: IBankSource) {
    this.selectedBankaccountId = eventData.id;
    const providerType =
      this.dialogueData.selectedRow.third_party_invoice?.provider_type;
    if (eventData?.id) {
      if (this.dialogueData.selectedRow.status === 16) {
        this.disable = false;
      }

      if (
        this.dialogueData.selectedRow.third_party_invoice?.provider_type == 3 ||
        this.dialogueData.selectedRow.third_party_invoice?.provider_type == 2 ||
        this.dialogueData.selectedRow.third_party_invoice?.provider_type == 5
      ) {
        this.subscriptions.push(
          this.invoiceService
            .Bankchecking(
              eventData?.id,
              this.dialogueData?.selectedRow?.action,
              'invoice',
              thirdpartyProviderCode[providerType as number]
            )
            .pipe(
              finalize(() => {
                this.disable = false;
              }),
              catchError((error) => {
                if (error.error.errorCode == 600) {
                  const dialog = this.alertService.confirmAlert({
                    content: error.error.errorMsg
                  });
                  dialog.afterClosed().subscribe((res) => {
                    if (!res) {
                      this.disable = true;
                      this.selectedBankaccount = '';
                      this._sharedService.setNewBankCreatedData();
                    } else {
                      this.disable = false;
                      this.selectedBankaccount = eventData.id;
                    }
                  });
                }

                return of(false);
              })
            )
            .subscribe((res) => {
              const response = res as IApiResMesssage;
              if (response.success) {
                this.disable = false;
                this.selectedBankaccount = eventData.id;
              }
            })
        );
      } else {
        this.disable = false;
        this.selectedBankaccount = eventData.id;
      }
    } else {
      this.disable = true;
      this.selectedBankaccount = '';
    }
  }

  /**
   * @description Maps NetSuite account invoice or bank account invoice based on status of selectedRow of `this.dialogueData`.
   */
  update() {
    const accountStatusCodes = [15, 17];
    if (this.dialogueData.selectedRow.status === 16) {
      const sendingData = new FormData();
      sendingData.append('bankAccountId', this.selectedBankaccountId);
      sendingData.append('invoiceId', this.dialogueData.selectedRow.action);

      this.subscriptions.push(
        this.invoiceService
          .mapNetSuiteAccountInvoice(sendingData)
          .pipe(finalize(() => (this.dataLoaded = false)))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: 'Bank account mapped successfully.',
                close: true
              });
              this.__dialogRef.close({ success: true });
            }
          })
      );
    } else if (
      accountStatusCodes.includes(this.dialogueData.selectedRow.status)
    ) {
      const sendingData = new FormData();
      sendingData.append('bankAccountId', this.selectedBankaccountId);
      sendingData.append('invoiceId', this.dialogueData.selectedRow.action);

      this.subscriptions.push(
        this.invoiceService
          .mapAccountingInvoice(sendingData)
          .pipe(finalize(() => (this.dataLoaded = false)))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: 'Bank account mapped successfully.',
                close: true
              });
              this.__dialogRef.close({ success: true });
            }
          })
      );
    } else {
      const sendingData = new FormData();
      sendingData.append('bank_account', this.selectedBankaccount);
      sendingData.append('invoice_id', this.dialogueData.selectedRow.action);

      this.subscriptions.push(
        this.invoiceService
          .mapBankAccountInvoice(sendingData)
          .pipe(finalize(() => (this.dataLoaded = false)))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: 'Bank account mapped successfully.',
                close: true
              });
              this.__dialogRef.close({ success: true });
            }
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

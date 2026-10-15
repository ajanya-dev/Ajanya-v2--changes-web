import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ICloudTransactionTableRow } from '../../model/giftcard';

@Component({
  selector: 'app-cloud-transaction-view-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    TitleCasePipe,
    CommonModule
  ],
  templateUrl: './cloud-transaction-view-modal.component.html',
  styleUrl: './cloud-transaction-view-modal.component.scss'
})
export class CloudTransactionViewModalComponent implements OnInit {
  dialogData: ICloudTransactionTableRow = inject(MAT_DIALOG_DATA);
  Object = Object;

  transactionDetails = {} as {
    amount: string;
    status: string;
    transfer_type: string;
    payee?: string;
    payer?: string;
    description: string;
    transaction_date: string;
    transaction_type: string;
    fed_trace: string;
    imad: string;
  };

  ngOnInit(): void {
    this.transactionDetails.amount = this.dialogData.amount;
    this.transactionDetails.status = this.dialogData.status;
    if (this.dialogData.txn_type === 'credit') {
      this.transactionDetails.payer = this.dialogData.title;
    } else {
      this.transactionDetails.payee = this.dialogData.title;
    }
    this.transactionDetails.transfer_type = this.dialogData.transfer_type;
    this.transactionDetails.description = this.dialogData.description;
    this.transactionDetails.transaction_type = this.dialogData.txn_type;
    this.transactionDetails.transaction_date = this.dialogData.txn_date;
    if (
      this.dialogData.transfer_type === 'ACH' &&
      this.dialogData.fed_trace_number
    ) {
      this.transactionDetails.fed_trace = this.dialogData.fed_trace_number;
    }
    if (
      (this.dialogData.transfer_type === 'International Wire' ||
        this.dialogData.transfer_type === 'Domestic Wire') &&
      this.dialogData.imad
    ) {
      this.transactionDetails.imad = this.dialogData.imad;
    }
  }
}

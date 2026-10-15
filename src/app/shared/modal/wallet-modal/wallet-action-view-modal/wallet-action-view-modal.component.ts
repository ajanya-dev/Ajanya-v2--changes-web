import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { IWalletTransactionStatements } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { NgFor } from '@angular/common';

/**
 * @description Modal component for wallet action view.
 */
@Component({
  selector: 'app-wallet-action-view-modal',
  templateUrl: './wallet-action-view-modal.component.html',
  styleUrls: ['./wallet-action-view-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor]
})
export class WalletActionViewModalComponent implements OnInit, OnDestroy {
  subscription: Subscription;

  transactions: IWalletTransactionStatements;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: string },
    public dialogRef: MatDialogRef<WalletActionViewModalComponent>,
    private _walletService: WalletService
  ) {}

  ngOnInit(): void {
    if (this.data.id) {
      this.subscription = this._walletService
        .getTransactionStatements(this.data.id)
        .subscribe((data) => {
          if (data?.success) {
            this.transactions = data.data;
          }
        });
    }
  }

  /**
   * @description Closes the dialog.
   */
  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

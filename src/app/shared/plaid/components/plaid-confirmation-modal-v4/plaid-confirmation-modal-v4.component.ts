import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { IPlaidCallBackResAccount } from '../../service/plaid.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-plaid-confirmation-modal-v4',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
  ],
  templateUrl: './plaid-confirmation-modal-v4.component.html',
  styleUrl: './plaid-confirmation-modal-v4.component.scss'
})
export class PlaidConfirmationModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<PlaidConfirmationModalV4Component>);
  public injectedData: { accounts: IPlaidCallBackResAccount[] } = inject(MAT_DIALOG_DATA);
  private alertService = inject(V4AlertService);

  readonly XIcon = X;

  bankAccountHolderName = '';
  bankAccountName = '';

  confirming = false;

  ngOnInit(): void {
    this.bankAccountHolderName = this.injectedData.accounts[0].bank_account_account_name;
    this.bankAccountName = this.injectedData.accounts[0].account_nick_name;
  }

  onConfirm(): void {
    if (!this.bankAccountHolderName || !this.bankAccountName) {
      this.alertService.infoAlert({
        content: 'Please enter the bank account holder name and bank account name'
      });
      return;
    }

    if (
      ValidationService.personNameValidator(
        new FormControl(this.bankAccountHolderName)
      )
    ) {
      this.alertService.infoAlert({
        content:
          'Please enter a valid bank account holder name.'
      });
      return;
    }

    const accounts = this.injectedData.accounts.flatMap(account => ({
      ...account,
      bank_account_account_name: this.bankAccountHolderName,
      account_nick_name: this.bankAccountName
    }));
    this.dialogRef.close({
      action: 'confirm',
      confirmed: true,
      accounts
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

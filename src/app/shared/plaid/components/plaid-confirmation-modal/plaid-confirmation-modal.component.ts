import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faArrowLeft, faXmark, faCheckCircle, faBuildingColumns } from '@fortawesome/pro-solid-svg-icons';
import { FormControl, FormsModule } from '@angular/forms';
import { IPlaidCallBackResAccount } from '../../service/plaid.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-plaid-confirmation-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    FormsModule,
  ],
  templateUrl: './plaid-confirmation-modal.component.html',
  styleUrl: './plaid-confirmation-modal.component.scss'
})
export class PlaidConfirmationModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PlaidConfirmationModalComponent>);
  public injectedData: { accounts: IPlaidCallBackResAccount[] } = inject(MAT_DIALOG_DATA);
  private alertService = inject(AlertService);

  // FontAwesome icons
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faCheckCircle = faCheckCircle;
  faBuildingColumns = faBuildingColumns;

  bankAccountHolderName = '';
  bankAccountName = '';

  // Loading state for confirmation action
  confirming = false;

  ngOnInit(): void {
    this.bankAccountHolderName = this.injectedData.accounts[0].bank_account_account_name;
    this.bankAccountName = this.injectedData.accounts[0].account_nick_name;
  }

  /**
   * Handle confirm button click
   */
  onConfirm(): void {
    if(!this.bankAccountHolderName || !this.bankAccountName) {
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

}
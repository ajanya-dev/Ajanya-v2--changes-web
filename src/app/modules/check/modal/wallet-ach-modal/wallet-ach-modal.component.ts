import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ISuccessAlert } from 'src/app/models/alert';
import { AddPayeeBankModalComponent } from 'src/app/shared/modal/payee-bank-modal/add-payee-bank-modal/add-payee-bank-modal.component';
import { ISvbACHCompleteTransaction } from 'src/app/modules/check/model/check';
import { Subscription } from 'rxjs';
import {
  IPayeeBankDetails,
  IPayeeSingleBankAccount
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DropDownPayeeBankComponent } from '../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-wallet-ach-modal',
  templateUrl: './wallet-ach-modal.component.html',
  styleUrls: ['./wallet-ach-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    DropDownPayeeBankComponent,
    CommonButtonV35Component
  ]
})
export class WalletAchModalComponent implements OnInit, OnDestroy {
  public data: ISvbACHCompleteTransaction = inject(MAT_DIALOG_DATA);
  public dialog = inject(MatDialog);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private psbService = inject(PsbService);
  public dialogRef = inject(MatDialogRef<WalletAchModalComponent>);

  payeeBankDetails: IPayeeBankDetails[] = [];
  subscriptions: Subscription[] = [];
  defaultCDPayeeBank: IPayeeBankDetails;
  selectedPayeeBank: IPayeeSingleBankAccount;
  walletDetails: ISvbACHCompleteTransaction;
  loading = false;

  ngOnInit(): void {
    this.walletDetails = this.data;
    this.getPayeeBankAccounts(this.walletDetails?.payees[0]?.id);
  }

  getPayeeBankAccounts(id: string) {
    if (!id) {
      return;
    }
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(id).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
          this.defaultCDPayeeBank = res.data.filter(
            (e) => e.defaultCDAccount === 1
          )[0];
          if (this.defaultCDPayeeBank) {
            this.getPayeeSingleBankAccount(
              this.walletDetails?.payees[0]?.id,
              this.defaultCDPayeeBank.id
            );
          }
        }
      })
    );
  }

  getPayeeSingleBankAccount(id: string, bankId: string) {
    this.subscriptions.push(
      this.payeeService.getPayeeSingleBankData(id, bankId).subscribe((res) => {
        if (res.success) {
          this.selectedPayeeBank = res.data;
          this.walletDetails.payees[0].bankAccount = this.selectedPayeeBank.id;
        }
      })
    );
  }

  getSelectedPayeeBank(id: string | null) {
    if (id) {
      this.walletDetails.payees[0].bankAccount = id;
    } else {
      this.walletDetails.payees[0].bankAccount = null;
    }
  }

  addBankAccountToPayeeModal() {
    const dialog = this.dialog.open(AddPayeeBankModalComponent, {
      width: '600px',
      data: { payeeId: this.walletDetails?.payees[0]?.id, editMode: false }
    });
    dialog.afterClosed().subscribe((r) => {
      if (r) {
        this.openSuccessAlert('Bank account created');
        this.getPayeeBankAccounts(this.walletDetails?.payees[0]?.id);
      }
    });
  }

  openSuccessAlert(content?: string, _disable?: boolean, timeout?: number) {
    const data: ISuccessAlert = {
      title: 'Success!',
      content: content || 'Check created.',
      close: true,
      timeout: timeout || 2000
    };
    return this.alertService.successAlert(data);
  }

  onProcess() {
    this.loading = true;
    this.subscriptions.push(
      this.psbService
        .completeTransaction(this.walletDetails)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.openSuccessAlert('Successfully done.');
            this.dialogRef.close(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

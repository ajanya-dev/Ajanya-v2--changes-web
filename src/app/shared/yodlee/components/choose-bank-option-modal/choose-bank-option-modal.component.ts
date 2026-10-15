import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Optional,
  Output
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { YodleeParentModalComponent } from '../yodlee-parent-modal/yodlee-parent-modal.component';
import { IBankModalOptionData } from 'src/app/models/yodlee';
import { NgClass, NgIf, NgFor, SlicePipe } from '@angular/common';

interface bankAcItem {
  accountName: string;
  accountNickName: string;
  accountNumber: string;
  bankName: string;
  fullAccountNumber: string;
  hiddenAccountNumber: string;
  hiddenFullAccountNumber: string;
  providerId: string;
  routingNumber: string;
  ydId: string;
  isChecked?: boolean;
}

/**
 * @description Modal Component for bank account options through Yodlee.
 */
@Component({
  selector: 'app-choose-bank-option-modal',
  templateUrl: './choose-bank-option-modal.component.html',
  styleUrls: ['./choose-bank-option-modal.component.scss'],
  standalone: true,
  imports: [NgClass, NgIf, MatDialogClose, NgFor, SlicePipe]
})
export class ChooseBankOptionModalComponent implements OnInit {
  accountsArray: bankAcItem[] = [];
  @Input() accountsDataInput: any = false;
  @Output() selected = new EventEmitter();
  isModel: boolean;
  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public datas: IBankModalOptionData,
    private __dialog: MatDialog,
    @Optional() public dialogRef: MatDialogRef<ChooseBankOptionModalComponent>
  ) {}

  ngOnInit(): void {
    if (this.accountsDataInput) {
      this.accountsArray = this.accountsDataInput.data?.bankData ?? [];
    } else {
      this.isModel = true;
      this.accountsArray = this.datas.data?.bankData ?? [];
    }
  }

  /**
   * @description Method to connect new bank. Opens Yodlee dialog.
   */
  onConnectNewBankClicked() {
    const data = {
      mode: 'connect_new_bank'
    };
    if (this.isModel) {
      this.__dialog.open(YodleeParentModalComponent, {
        backdropClass: 'disbled-backdrop-yodlee',
        disableClose: true,
        autoFocus: false,
        data: data,
        panelClass: 'yodlee-modal-new'
      });
      this.dialogRef.close();
    } else {
      this.selected.emit(data);
    }
  }

  /**
   * @description Sets `isChecked` property of accounts in `this.accountsArray` to false.
   * Invokes `this.onAddFromConnectedBank` method to add from connected bank.
   */
  onAddFromConnectedBankClicked() {
    this.accountsArray.forEach((ele) => {
      ele.isChecked = false;
    });
    this.onAddFromConnectedBank();
  }

  /**
   * @description Method to connect old bank accounts.
   */
  onAddFromConnectedBank() {
    const data = {
      key: this.accountsDataInput?.data?.key ?? this.datas.data?.key,
      mode: 'connect_old_bank_accounts',
      unlinkedBankAccounts: this.accountsArray
    };
    if (this.isModel) {
      this.__dialog.open(YodleeParentModalComponent, {
        backdropClass: 'disbled-backdrop-yodlee',
        disableClose: true,
        autoFocus: true,
        data: data,
        panelClass: 'yodlee-modal-new'
      });
      this.dialogRef.close();
    } else {
      this.selected.emit(data);
    }
  }

  /**
   * @description Method invoked when bank account is selected. Sets `isChecked` property of selected account to true and all others to false.
   * @param item - selected account.
   */
  bankAcItemClicked(item: bankAcItem) {
    this.accountsArray.forEach((ele) => {
      ele.isChecked = false;
    });
    item.isChecked = true;
    this.onAddFromConnectedBank();
  }
}

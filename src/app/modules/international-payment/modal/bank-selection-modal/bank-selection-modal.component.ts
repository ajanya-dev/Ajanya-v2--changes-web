import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark, faPlus, faBuildingColumns } from '@fortawesome/pro-solid-svg-icons';
import { IInternationalPayeeAccount } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IInternationalCountry } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { finalize } from 'rxjs/operators';
import { AddRecipientModalComponent } from '../add-recipient-modal/add-recipient-modal.component';

interface BankSelectionModalData {
  bankList: IInternationalPayeeAccount[];
  currentSelectedBank?: IInternationalPayeeAccount;
  recipientName?: string;
  recipientType: 'business' | 'personal';
  recipientId: string;
  selectedCountry?: IInternationalCountry;
  recipient?: IPayeeDropdown;
  internationalAccounts?: IInternationalPayeeAccount[];
}

@Component({
  selector: 'app-bank-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FontAwesomeModule
  ],
  templateUrl: './bank-selection-modal.component.html',
  styleUrls: ['./bank-selection-modal.component.scss']
})
export class BankSelectionModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<BankSelectionModalComponent>);
  public data = inject(MAT_DIALOG_DATA) as BankSelectionModalData;
  private walletService = inject(WalletService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  // Icons
  faXmark = faXmark;
  faPlus = faPlus;
  faBuildingColumns = faBuildingColumns;

  // Component state
  bankList = signal<IInternationalPayeeAccount[]>([]);
  selectedBankId = signal<string | null>(null);
  isLoading = signal(false);
  recipientName = signal<string>('');

  ngOnInit(): void {
    if (this.data) {
      this.bankList.set(this.data.bankList || []);
      this.recipientName.set(this.data.recipientName ?? '');
      
      // Set currently selected bank if provided
      if (this.data.currentSelectedBank) {
        this.selectedBankId.set(this.data.currentSelectedBank.encrypted_id);
      } 
    }
  }

  selectBank(bank: IInternationalPayeeAccount): void {
    this.selectedBankId.set(bank.encrypted_id);
    // Auto-close modal when bank is selected 
    this.dialogRef.close({
      success: true,
      selectedBank: bank,
      action: 'select'
    });
  }

  setAsDefault(bank: IInternationalPayeeAccount, event: Event): void {
    this.isLoading.set(true);
    // Prevent the bank selection when clicking "Set as Default"
    event.stopPropagation();
    this.walletService.setDefaultBank({
      accountId: bank.encrypted_id,
      payeeId: this.data.recipientId,
      type: this.data.recipientType
    })
    .pipe(
    takeUntilDestroyed(this.destroyRef), 
    finalize(() => this.isLoading.set(false)))
    .subscribe((res) => {
      if(res.success) {
      const updatedBank = {
        ...bank,
        is_default_for_business: this.data.recipientType === 'business' ? 1 : 0,
        is_default_for_personal: this.data.recipientType === 'personal' ? 1 : 0
      };
        this.dialogRef.close({
          success: true,
          selectedBank: updatedBank,
          action: 'set_default'
        });
      }
    });
  }

  onAddNewBankAccount(): void {
    this.addNewRecipientBank();
  }

  // Helper methods
  addNewRecipientBank() {
    if (!this.data.recipientId) {
      return;
    }
    const dialogRef = this.dialog.open(AddRecipientModalComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        editMode: false,
        id: this.data.recipientId,
        recipientType: this.data.recipientType,
        recipientName: this.data.recipientName,
        recipientId: this.data.recipientId,
        bankAcId: undefined,
        mode: 'new-bank-account',
        countryCode: this.data.selectedCountry?.countryCode,
        currency: this.data.selectedCountry?.currency,
        payeeEmail: this.data.recipient?.email,
        payeePhone: this.data.recipient?.phone
      }
    });
    dialogRef.afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((result) => {
      if (result.success) {
        // Transform the response to match IInternationalPayeeAccount structure
      const newBank: IInternationalPayeeAccount = {
        payee_id: this.data.recipientId,
        bank_name: result.data.bankName,
        account_number: result.data.accountNumber,
        swift_or_bic: result.data.identifierCode,
        account_type: result.data.accountType,
        bank_identifier_type: result.data.identifierType,
        bank_identifier_code: result.data.identifierCode,
        encrypted_id: result.data.id,
        beneficiary: result.data.beneficiary,
        beneficiaryBankDetails: result.data.beneficiaryBankDetails,
        ifsc: result.data.ifsc,
        currency: this.data.selectedCountry?.currency,
        country: this.data.selectedCountry?.countryCode
      };

        this.dialogRef.close({
          success: true,
          action: 'add_new',
          recipientId: this.data.recipientId,
          recipientType: this.data.recipientType,
          selectedBank: newBank
        });
      }
    });
  }

  getLastFourDigits(accountNumber?: string): string {
    if (!accountNumber) return '0000';
    return accountNumber.slice(-4);
  }

  isDefaultBank(bank: IInternationalPayeeAccount): boolean {
    const { recipientType } = this.data;
    if (recipientType === 'business') {
      return bank.is_default_for_business === 1;
    } 
    if (recipientType === 'personal') {
      return bank.is_default_for_personal === 1;
    }
    return false;
  }

}
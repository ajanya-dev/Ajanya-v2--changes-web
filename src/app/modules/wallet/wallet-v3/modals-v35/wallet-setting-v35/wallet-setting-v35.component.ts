import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IWalletSettingForm, IWalletSettings } from 'src/app/models/wallet';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { BankAcDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';

@Component({
  selector: 'app-wallet-setting-v35',
  templateUrl: './wallet-setting-v35.component.html',
  styleUrls: ['./wallet-setting-v35.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    MatSlideToggle,
    BankAcDropdownV3Component,
    V35ControlMessageComponent,
    CommonButtonV35Component
  ]
})
export class WalletSettingV35Component implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<WalletSettingV35Component>);

  @ViewChild('bankAcDropDown')
  bankAcDropDownComponent: BankAcDropdownV3Component;

  selectedBankAccount: FormControl<IBankDropdown | null> = new FormControl(
    null,
    [Validators.required]
  );

  walletSettingForm: FormGroup<IWalletSettingForm> = this.fb.group({
    isWalletBypassingEnabled: [false],
    isAutoWithdrawalEnabled: [false],
    autoWithdrawalBankAccountId: [''],
    isAutoPullDisabled: [false]
  });

  subscriptions: Subscription[] = [];
  sessionKey: string;
  isLoading = false;
  settingData: IWalletSettings;
  bankAccount: IBankDropdown | undefined;

  walletBypassOffTooltip = `Payments come from your wallet if you have enough funds there.
Faster processing.
Only uses your bank account if your wallet doesn't have enough money.
Some customers, like those doing payroll, prefer to keep it OFF. They fund their wallet in advance for quicker payments.

Remember: Each bank account you add creates a matching wallet.`;

  walletBypassOnTooltip = `
Payments always come directly from your bank account.
Takes longer to process.
Ignores any money in your wallet.
  `;

  //   autoPullOnTooltip = `
  // 1. You can only send ACH payments if you have enough money in your wallet.
  // 2. You need to add money to your wallet before making payments.
  // 3. Benefit: Faster processing - allows for same-day ACH, wire, or instant payments.
  // 4. You are in full control of payments by having sufficient funds in your wallet ahead of time, ensuring quicker transactions.

  // When OFF, payments can come from your bank account if your wallet doesn't have enough funds.
  //   `;

  //   autoPullOffTooltip = `Payments can come from your bank account if your wallet doesn't have enough funds.`;

  autoWithdrawOnTooltip = `
1. This applies when you receive money from others.
2. Any payment you receive will automatically be sent to your linked bank account.
3. Example: If someone sends you $1000, it will go straight to your bank account (like Bank of America, Chase, or whichever bank you've linked).
4. You don't need to manually transfer the money from your wallet to your bank.
  `;

  autoWithdrawOffTooltip = `
1. Received funds will stay in your wallet until you choose to move them.
2. Many prefer to keep funds in the wallet to ensure they have sufficient money for future payouts.
3. This way, they don't have to wait to pre-fund the wallet for quick payments like wire transfers or real-time payments.
  `;

  ngOnInit(): void {
    this.getSettings();
    this.onCheckAutoWireEnable();
    this.onChangeBankAccount();
  }

  /**
   * @description Handles changes in the selected bank account.
   * Subscribes to value changes and updates the auto withdrawal bank account ID in the form.
   */
  onChangeBankAccount() {
    this.subscriptions.push(
      this.selectedBankAccount.valueChanges.subscribe((bankItem) => {
        if (bankItem === null || bankItem === undefined) return;
        if (bankItem !== this.bankAccount) {
          this.bankAccount = bankItem;
          this.changeBank(bankItem);
        }
      })
    );
  }

  changeBank(bank: IBankDropdown) {
    if (bank?.verified === 0) {
      const modal = this.alertService.warningAlert({
        content: 'Please verify your bank account',
        isCancel: true,
        doneMsg: 'Verify Now'
      });

      modal.afterClosed().subscribe((res) => {
        this.walletSettingForm.controls.autoWithdrawalBankAccountId.setValue(
          ''
        );
        this.clearBank();
        this.bankAccount = undefined;
        if (res) {
          this.openBankVerifyModal(bank?.id);
          this.dialogRef.close(false);
        }
      });
    } else {
      this.walletSettingForm.controls.autoWithdrawalBankAccountId.setValue(
        bank?.id
      );
    }
  }

  openBankVerifyModal(encrypted_bankacc_id: string) {
    this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id,returnUrl:'manage/wallet/transactions' },
      disableClose: true
    });
  }

  clearBank() {
    this.bankAcDropDownComponent.clearSelection();
  }

  /**
   * @description Retrieves wallet settings from the server and updates the component's state accordingly.
   */
  getSettings() {
    this.subscriptions.push(
      this.walletService.getWalletSettings().subscribe((data) => {
        if (data?.success) {
          this.settingData = data.data;
          this.setFormData(data.data);
        }
      })
    );
  }

  /**
   * @description Listens for changes in the "isAutoWithdrawalEnabled" control in the wallet setting form.
   * Updates bank validity based on the provided value.
   */
  onCheckAutoWireEnable() {
    this.subscriptions.push(
      this.walletSettingForm?.controls?.isAutoWithdrawalEnabled?.valueChanges.subscribe(
        (value) => {
          if (value !== null) {
            this.updateBankValidity(value);
          }
        }
      )
    );
  }

  /**
   * @description Sets the form data based on the provided wallet settings response.
   * @param {IWalletSettings} response - The wallet settings response object.
   */
  setFormData(response: IWalletSettings) {
    this.walletSettingForm.patchValue({
      isWalletBypassingEnabled: response.isWalletBypassingEnabled,
      isAutoWithdrawalEnabled: response.isAutoWithdrawalEnabled,
      autoWithdrawalBankAccountId: response.autoWithdrawalBankAccountId,
      isAutoPullDisabled: response.isAutoPullDisabled
    });
    this.updateBankValidity(response.isAutoWithdrawalEnabled);
  }

  /**
   * @description Used to show bank account in dropdown based on the `autoWithdrawalBankAccountId`.
   * @param {IV3DropDownOnReady} event - The event object triggered when the dropdown is ready
   */
  showBank(event: IV3DropDownOnReady) {
    if (event.setItemWithId) {
      event.setItemWithId(this.settingData.autoWithdrawalBankAccountId);
    }
  }

  /**
   * @description Updates the validation rules for the auto withdrawal bank account based on the `isAutoWithdrawalEnabled`.
   * @param {boolean} isEnable - Flag indicating whether auto withdrawal is enabled.
   */
  updateBankValidity(isEnable: boolean) {
    const bankControl =
      this.walletSettingForm.controls.autoWithdrawalBankAccountId;
    if (isEnable) {
      bankControl.setValidators(Validators.required);
    } else {
      bankControl.clearValidators();
    }
    bankControl.updateValueAndValidity();
  }

  /**
   * @description Constructs a data object for wallet settings based on the values in the form.
   * @returns {IWalletSettings} - The wallet settings data object.
   */
  formBody(): IWalletSettings {
    const data = this.walletSettingForm.value;
    return {
      isWalletBypassingEnabled: data.isWalletBypassingEnabled,
      isAutoWithdrawalEnabled: data.isAutoWithdrawalEnabled,
      autoWithdrawalBankAccountId: data.autoWithdrawalBankAccountId,
      isAutoPullDisabled: data.isAutoPullDisabled,
      session_key: this.sessionKey ? this.sessionKey : ''
    } as IWalletSettings;
  }

  /**
   * @description Submits the wallet setting form data to update settings on the server.
   */
  submit() {
    this.walletSettingForm.markAllAsTouched();
    if (this.walletSettingForm.invalid) {
      return;
    }
    if (
      this.walletSettingForm.value.isAutoWithdrawalEnabled &&
      this.selectedBankAccount.invalid
    ) {
      this.selectedBankAccount.markAllAsTouched();
    }

    this.isLoading = true;
    this.subscriptions.push(
      this.walletService
        .updateWalletSettings(this.formBody())
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.close();
              this.alertService.successAlert({
                title: 'Success',
                content: 'Wallet settings updated',
                close: true,
                timeout: 2000
              });
            }
          },
          error: (err: HttpErrorResponse) => {
            if (err.error.errorCode === '112') {
              this.sessionKey = err.error.session_key;
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: err.error
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.submit();
                }
              });
            }
          }
        })
    );
  }

  /**
   * @description Closes the dialog.
   */
  close(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

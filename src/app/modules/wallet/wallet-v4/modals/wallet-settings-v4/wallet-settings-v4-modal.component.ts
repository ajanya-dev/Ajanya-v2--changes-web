import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialog,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, X, HelpCircle } from 'lucide-angular';
import { finalize } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IWalletSettingForm, IWalletSettings } from 'src/app/models/wallet';
import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-wallet-settings-v4-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogModule,
    MatDialogClose,
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    CommonButtonV4Component,
    BankAcDropdownV4Component
  ],
  templateUrl: './wallet-settings-v4-modal.component.html',
  styleUrls: ['./wallet-settings-v4-modal.component.scss']
})
export class WalletSettingsV4ModalComponent implements OnInit {
  readonly XIcon = X;
  readonly HelpCircleIcon = HelpCircle;

  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<WalletSettingsV4ModalComponent>);
  private destroyRef = inject(DestroyRef);

  @ViewChild('bankDropdown') bankDropdownComponent: BankAcDropdownV4Component;

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

  loading = signal(false);
  sessionKey: string;
  settingData: IWalletSettings;
  bankAccount: IBankDropdown | undefined;

  walletBypassOffTooltip = `Payments come from your wallet if you have enough funds there.
Faster processing.
Only uses your bank account if your wallet doesn't have enough money.
Some customers, like those doing payroll, prefer to keep it OFF. They fund their wallet in advance for quicker payments.

Remember: Each bank account you add creates a matching wallet.`;

  walletBypassOnTooltip = `Payments always come directly from your bank account.
Takes longer to process.
Ignores any money in your wallet.`;

  autoWithdrawOnTooltip = `1. This applies when you receive money from others.
2. Any payment you receive will automatically be sent to your linked bank account.
3. Example: If someone sends you $1000, it will go straight to your bank account (like Bank of America, Chase, or whichever bank you've linked).
4. You don't need to manually transfer the money from your wallet to your bank.`;

  autoWithdrawOffTooltip = `1. Received funds will stay in your wallet until you choose to move them.
2. Many prefer to keep funds in the wallet to ensure they have sufficient money for future payouts.
3. This way, they don't have to wait to pre-fund the wallet for quick payments like wire transfers or real-time payments.`;

  get bypassTooltip(): string {
    return this.walletSettingForm.value.isWalletBypassingEnabled
      ? this.walletBypassOnTooltip
      : this.walletBypassOffTooltip;
  }

  get autoTransferTooltip(): string {
    return this.walletSettingForm.value.isAutoWithdrawalEnabled
      ? this.autoWithdrawOnTooltip
      : this.autoWithdrawOffTooltip;
  }

  ngOnInit(): void {
    this.getSettings();
    this.onCheckAutoWireEnable();
    this.onChangeBankAccount();
  }

  getSettings(): void {
    this.walletService
      .getWalletSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.success) {
          this.settingData = data.data;
          this.setFormData(data.data);
        }
      });
  }

  setFormData(response: IWalletSettings): void {
    this.walletSettingForm.patchValue({
      isWalletBypassingEnabled: response.isWalletBypassingEnabled,
      isAutoWithdrawalEnabled: response.isAutoWithdrawalEnabled,
      autoWithdrawalBankAccountId: response.autoWithdrawalBankAccountId,
      isAutoPullDisabled: response.isAutoPullDisabled
    });
    this.updateBankValidity(response.isAutoWithdrawalEnabled);
  }

  onCheckAutoWireEnable(): void {
    this.walletSettingForm.controls.isAutoWithdrawalEnabled.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value !== null) {
          this.updateBankValidity(value);
        }
      });
  }

  onChangeBankAccount(): void {
    this.selectedBankAccount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankItem) => {
        if (bankItem === null || bankItem === undefined) return;
        if (bankItem !== this.bankAccount) {
          this.bankAccount = bankItem;
          this.changeBank(bankItem);
        }
      });
  }

  updateBankValidity(isEnable: boolean): void {
    const bankControl =
      this.walletSettingForm.controls.autoWithdrawalBankAccountId;
    if (isEnable) {
      bankControl.setValidators(Validators.required);
    } else {
      bankControl.clearValidators();
    }
    bankControl.updateValueAndValidity();
  }

  showBank(event: IV3DropDownOnReady): void {
    if (event.setItemWithId && this.settingData?.autoWithdrawalBankAccountId) {
      event.setItemWithId(this.settingData.autoWithdrawalBankAccountId);
    }
  }

  changeBank(bank: IBankDropdown): void {
    if (bank?.verified === 0) {
      this.alertService
        .warningAlert({
          content: 'Please verify your bank account',
          isCancel: true,
          doneMsg: 'Verify Now'
        })
        .afterClosed()
        .subscribe((res) => {
          this.walletSettingForm.controls.autoWithdrawalBankAccountId.setValue(
            ''
          );
          this.clearBank();
          this.bankAccount = undefined;
          if (res) {
            this.openBankVerifyModal(bank);
            this.dialogRef.close(false);
          }
        });
    } else {
      this.walletSettingForm.controls.autoWithdrawalBankAccountId.setValue(
        bank?.id
      );
    }
  }

  openBankVerifyModal(bank: IBankDropdown): void {
    this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        bankId: bank?.id,
        bankDetails: { verifiedBy: bank?.verifiedBy, country: bank?.country }
      },
      disableClose: true
    });
  }

  clearBank(): void {
    this.bankDropdownComponent?.clearSelection();
  }

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

  submit(): void {
    this.walletSettingForm.markAllAsTouched();
    if (this.walletSettingForm.invalid) return;

    if (
      this.walletSettingForm.value.isAutoWithdrawalEnabled &&
      this.selectedBankAccount.invalid
    ) {
      this.selectedBankAccount.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.walletService
      .updateWalletSettings(this.formBody())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.dialogRef.close();
            this.alertService.successAlert({
              content: 'Wallet settings updated',
              close: true,
              timeout: 2000
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.error.errorCode === '112') {
            this.sessionKey = err.error.session_key;
            const dialog = this.dialog.open(OtpModalV4Component, {
              maxWidth: '410px',
              width: '100%',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) this.submit();
            });
          }
        }
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}

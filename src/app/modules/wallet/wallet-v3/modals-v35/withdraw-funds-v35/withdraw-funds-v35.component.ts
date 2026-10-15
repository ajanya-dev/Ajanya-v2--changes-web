import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  IWalletData,
  IWidthdrawFunds,
  IWithdrawFundFee,
  IWithdrawFundForm
} from 'src/app/models/wallet';
import { IBankDropdown } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import {
  Subscription,
  combineLatest,
  debounceTime,
  finalize,
  startWith
} from 'rxjs';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CurrencyPipe, NgClass } from '@angular/common';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip } from '@angular/material/tooltip';
import { MoEngageService } from 'src/app/core/services/moengage.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IOverallData } from 'src/app/models/user';
import { ScriptService } from 'src/app/core/services/script.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from '../../../../../shared/v3/common-input-field/common-input-field.component';
import { AmountInputComponent } from '../../../../../shared/components/amount-input/amount-input.component';
import { BankAcDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { WalletDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';

@Component({
  selector: 'app-withdraw-funds-v35',
  templateUrl: './withdraw-funds-v35.component.html',
  styleUrls: ['./withdraw-funds-v35.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    WalletDropdownV3Component,
    V35ControlMessageComponent,
    BankAcDropdownV3Component,
    AmountInputComponent,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    NgClass,
    MatRadioGroup,
    MatRadioButton,
    MatTooltip,
    CurrencyPipe
  ]
})
export class WithdrawFundsV35Component implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private headerService = inject(HeaderService);
  private dataTableService = inject(DataTableService);
  private authService = inject(AuthDataService);
  public wallet: IWalletData = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<WithdrawFundsV35Component>);
  private moengageService = inject(MoEngageService);
  private localStorageService = inject(LocalStorageService);
  private postHogService = inject(PostHogService);
  private scriptService = inject(ScriptService);
  private psbService = inject(PsbService);

  sameDayFeeAmount = 0;
  isSameDayFeeLoading = false;
  selectedWallet: FormControl<IWalletData> = new FormControl();
  selectedBankAccount: FormControl<IBankDropdown> = new FormControl();
  withdrawFundsForm: FormGroup<IWithdrawFundForm> = this.fb.group({
    fromWallet: ['', [Validators.required]],
    toBankAccountId: ['', [Validators.required]],
    amount: [null, [Validators.required]],
    comment: [null, [Validators.required]],
    isSameDay: [0],
    selectedWithdrawMethod: ['']
  }) as FormGroup<IWithdrawFundForm>;

  sessionKey: string;
  subscription: Subscription[] = [];
  isLoading = false;
  selectedBank: IBankDropdown;
  selectedWithdrawMethod = 'ach';
  withdrewOptions = [
    { id: 'ach', name: 'Regular ACH' },
    { id: 'sameDay', name: 'Same Day ACH' },
    { id: 'wire', name: 'Wire Transfer' },
    {
      id: 'instant-bank-transfer',
      name: 'RTP',
      tootTip: 'Instant fund transfer to your bank account'
    }
  ];

  faInfoCircle = faInfoCircle;
  withdrawFeeDetails: IWithdrawFundFee;
  showSectionFee = false;
  fetchingFeeDetails = false;
  showMinimumAmountError = false;
  transactionInitiatedTime = performance.now();
  isFirstTransaction = false;
  isTransactionSubmitted = false;
  otpSessionKey: string | undefined;
  isOtpDismissed = false;

  ngOnInit(): void {
    this.transactionInitiatedTime = performance.now();
    this.walletTransactionInitiated();
    this.dropdownChange();
    this.selectedWallet.setValue(this.wallet);
    this.handleAmountChange();
    this.fetchSameDayFee();
  }

  fetchSameDayFee(): void {
    this.isSameDayFeeLoading = true;
    this.subscription.push(
      this.psbService
        .getTransactionFee({
          featureCode: 'txn-zilpayment-ach-from-wallet',
          transactionAmount: 0,
          samedayFeatureCode: 'txn-zilpayment-sameday-ach-processing-fee'
        })
        .pipe(finalize(() => { this.isSameDayFeeLoading = false; }))
        .subscribe((res) => {
          if (res.success) {
            this.sameDayFeeAmount = Number(res.samedayFee) || 0;
          }
        })
    );
  }

  handleAmountChange() {
    combineLatest([
      this.withdrawFundsForm.controls.amount.valueChanges.pipe(
        debounceTime(300), // Wait for the user to finish typing the amount
        startWith(this.withdrawFundsForm.controls.amount.value) // Start with the initial value
      ),
      this.withdrawFundsForm.controls.selectedWithdrawMethod.valueChanges.pipe(
        startWith(this.withdrawFundsForm.controls.selectedWithdrawMethod.value) // Start with the initial value
      )
    ]).subscribe(([amount, selectedMethod]) => {
      this.showMinimumAmountError = false;

      if (
        amount !== null &&
        amount.toString().trim() !== '' &&
        selectedMethod === 'instant-bank-transfer'
      ) {
        if (amount < 10) {
          this.showMinimumAmountError = true;
          this.showSectionFee = false;
          return;
        }

        this.showMinimumAmountError = false;
        this.showSectionFee = true;
        this.triggerWithdrawFundFee(amount as number);
      } else {
        this.showSectionFee = false;
      }
    });
  }

  /**
   * @description Handles the change events for the dropdown selections.
   * Subscribes to value changes of both the selected wallet and selected bank account dropdowns.
   */
  dropdownChange() {
    this.selectedWallet.valueChanges.subscribe((walletItem) => {
      this.changeWallet(walletItem);
    });
    this.selectedBankAccount.valueChanges.subscribe((bankItem) => {
      if (bankItem !== this.selectedBank) {
        this.selectedBank = bankItem;
        this.changeBank(bankItem);
      }
    });
  }

  /**
   * @description Changes the selected wallet and updates the corresponding form control.
   * @param {IWalletData} wallet - The selected wallet data
   */
  changeWallet(wallet: IWalletData) {
    if (wallet === null || wallet === undefined) return;
    this.withdrawFundsForm.controls.fromWallet.setValue(wallet.uuId);
  }

  /**
   * @description Changes the selected bank and updates the corresponding form control.
   * @param {IBankDropdown} bank - The selected bank data.
   */
  changeBank(bank: IBankDropdown) {
    if (bank === null || bank === undefined) return;
    if (bank?.verified === 0) {
      const modal = this.alertService.warningAlert({
        content:
          'You should verify this bank account to withdraw into this account. Would you like to verify now?',
        isCancel: true,
        isOk: true
      });

      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.withdrawFundsForm.controls.toBankAccountId.setValue(null);
          this.openVerifyModal(bank.id);
        }
      });
    } else {
      this.withdrawFundsForm.controls.toBankAccountId.setValue(bank.id);
    }
  }

  /**
   * @description Opens a verification modal for a bank account.
   * @param {string} bankId - The encrypted ID of the bank account to be verified.
   */
  openVerifyModal(bankId: string) {
    const verifyModal = this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id: bankId },
      disableClose: true
    });

    verifyModal.afterClosed().subscribe((res) => {
      if (res && !res.phoneAndEmailVerified) {
        this.dialogRef.close();
      }
    });
  }

  /**
   * @description Handles changes in withdraw options.
   * @param {string} type - Selected withdraw method.
   */
  changeWithdrawOption(type: string) {
    this.selectedWithdrawMethod = type;
    if (type === 'sameDay') {
      this.withdrawFundsForm.controls.isSameDay.setValue(1);
    } else {
      this.withdrawFundsForm.controls.isSameDay.setValue(0);
    }
  }

  /**
   * @description Used to send with api.
   * @returns {IWidthdrawFunds} An object containing the withdrawal form data.
   */
  formBody(): IWidthdrawFunds {
    const data = this.withdrawFundsForm.value;
    return {
      fromWallet: data.fromWallet,
      toBankAccountId: data.toBankAccountId,
      amount: data.amount,
      comment: data.comment,
      isSameDay: data.isSameDay,
      session_key: this.sessionKey ? this.sessionKey : '',
      transfer_method:
        this.selectedWithdrawMethod === 'sameDay'
          ? 'ach'
          : this.selectedWithdrawMethod
    } as IWidthdrawFunds;
  }

  openCalculator() {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: { addAmountButton: true }
    });

    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.withdrawFundsForm.patchValue({ amount: calculatedValue });
      }
    });
  }

  /**
   * @description Handles the submission of the funds withdrawal form.
   */
  onSubmit() {
    const alertData = {
      title: 'Success!',
      content: 'Funds Withdrawn Successfully',
      close: true
    };

    this.withdrawFundsForm.markAllAsTouched();
    if (this.withdrawFundsForm.invalid || this.showMinimumAmountError) {
      return;
    }

    if(!this.otpSessionKey){
      this.transactionSubmitted();
    }
    this.isLoading = true;
    this.subscription.push(
      this.walletService
        .withdrawFunds(this.formBody())
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.otpSessionKey = undefined;
              this.setUserFirstTransactionFlag();
              this.dialog.closeAll();
              this.dataTableService.setRefreshStatus(true, 20);
              this.headerService.setHeaderValueChanged(true);
              this.alertService.successAlert(alertData);
            }
          },
          error: (err: HttpErrorResponse) => {
            this.otpSessionKey = err.error.session_key;
            if (err.error.errorCode === '112') {
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: err.error
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.onSubmit();
                } else {
                  this.isTransactionSubmitted = false;
                  this.isOtpDismissed = true;
                }
              });
            }
            if (err.error.errorCode === 631) {
              this.dialog.closeAll();
              this.authService.verifyEmailAndMobile(
                err.error.errorMsg,
                'Not Now'
              );
            }
          }
        })
    );
  }

  private triggerWithdrawFundFee(amount: number): void {
    const payload = {
      amount,
      transfer_method: 'instant-bank-transfer'
    };
    this.fetchingFeeDetails = true;
    this.subscription.push(
      this.walletService
        .withdrawFundFee(payload)
        .pipe(
          finalize(() => {
            this.fetchingFeeDetails = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.withdrawFeeDetails = res.data;
            }
          }
        })
    );
  }
  
  // MoEngage Tracking / Helper Functions

  /**
   * @description Tracks the wallet transaction initiated
   */
  walletTransactionInitiated() {
    const overallData = this.localStorageService.getItem('overallData') as IOverallData;
    this.isFirstTransaction = !overallData.hasWalletWithdrawal;
    this.moengageService.trackWalletPaymentInitiation({
      transaction_type: 'withdrawal',
      is_first_attempt: this.isFirstTransaction,
      bank_count: overallData.bankAccountCount
    });

    this.postHogService.trackTransactionInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'withdrawal',
      is_first_attempt: this.isFirstTransaction,
      // Always a number: the spec forbids null here.
      bank_count: overallData.bankAccountCount ?? 0
    });
  }

  /**
   * @description Tracks the transaction submitted
   */
  transactionSubmitted() {
    let fundingMethod: 'ach' | 'wire' | 'other';
    if (this.selectedWithdrawMethod === 'ach' || this.selectedWithdrawMethod === 'sameDay') {
      fundingMethod = 'ach';
    } else if (this.selectedWithdrawMethod === 'wire') {
      fundingMethod = 'wire';
    } else {
      fundingMethod = 'other';
    }
    const duration = performance.now() - this.transactionInitiatedTime;
    const amount = Number(this.withdrawFundsForm.value.amount);
    const walletBalanceBefore = Number(this.selectedWallet.value?.currentBalance ?? 0);
    this.moengageService.trackTransactionSubmitted({
      transaction_type: 'withdrawal',
      amount: this.moengageService.amountToNotionalValue(amount),
      currency: 'USD',
      funding_method: fundingMethod,
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before: this.moengageService.amountToNotionalValue(walletBalanceBefore),
      bank_account_id: null,
      source_wallet_id: this.selectedWallet.value?.uuId ?? null,
      destination_wallet_id: null,
      is_first_transaction: this.isFirstTransaction
    });

    // PostHog takes the real figures, and "first transaction of any type".
    const overallData = this.localStorageService.getItem(
      'overallData'
    ) as IOverallData | null;
    this.postHogService.trackTransactionSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'withdrawal',
      amount,
      currency: 'USD',
      funding_method: fundingMethod,
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before: walletBalanceBefore,
      bank_account_id:
        (this.withdrawFundsForm.value.toBankAccountId as string) || null,
      // Wallet ids belong to internal_transfer only.
      source_wallet_id: null,
      destination_wallet_id: null,
      is_first_transaction: !overallData?.hasTransacted
    });

    this.isTransactionSubmitted = true;
  }

  /**
   * @description Tracks the transaction abandoned
   */
  transactionAbandoned() {
    const duration = performance.now() - this.transactionInitiatedTime;
    const amount = Number(this.withdrawFundsForm.value.amount);
    this.moengageService.trackTransactionAbandoned({
      transaction_type: 'withdrawal',
      form_duration_seconds: Math.round(duration / 1000),
      amount_entered: this.moengageService.amountToNotionalValue(amount),
      funding_method: this.getFundingMethodForAbandoned(),
      exit_step: this.getExitStep(),
      exit_reason: this.isOtpDismissed ? 'otp_verification' : 'user_exit',
      bank_account_id: this.withdrawFundsForm.value.toBankAccountId as string || null
    });
  }

  /**
   * @description Gets the exit step for the transaction abandoned.
   */
  private getExitStep(): 'amount_entry' | 'method_selection' | 'review_confirm' | 'unknown' {
    const { amount, fromWallet, toBankAccountId, comment } = this.withdrawFundsForm.value;
    const hasAmount = amount && Number(amount) > 0;
    if (!hasAmount) return 'amount_entry';
    if (!fromWallet || !toBankAccountId || !comment) return 'method_selection';
    if (this.withdrawFundsForm.valid) return 'review_confirm';
    return 'unknown';
  }

  /**
   * @description Gets the funding method for the transaction abandoned.
   */
  private getFundingMethodForAbandoned(): 'ach' | 'wire' | 'unknown' {
    if (this.selectedWithdrawMethod === 'ach' || this.selectedWithdrawMethod === 'sameDay') return 'ach';
    if (this.selectedWithdrawMethod === 'wire') return 'wire';
    return 'unknown';
  }

  /**
  * @description Sets the user first transaction flag in MoEngage
  */
  setUserFirstTransactionFlag() {
    const overallData = this.localStorageService.getItem('overallData') as IOverallData;
    const isFirstTransaction = !overallData.hasTransacted;
    if (isFirstTransaction) {
      this.scriptService.moEngageSetUserAttributes({
        has_transacted : true
      });
    }
  }

  ngOnDestroy(): void {
    if (!this.isTransactionSubmitted) {
      this.transactionAbandoned();
    }
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

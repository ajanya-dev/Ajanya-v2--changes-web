import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { combineLatest, debounceTime, finalize, startWith, take } from 'rxjs';
import {
  IWalletData,
  IWidthdrawFunds,
  IWithdrawFundFee,
  IWithdrawFundForm
} from 'src/app/models/wallet';
import { IBankDropdown } from 'src/app/models/bank';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CurrencyPipe, NgClass } from '@angular/common';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import {
  LucideAngularModule,
  X,
  Calculator,
  Info,
  AlertCircle
} from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { IShippingTypes } from 'src/app/modules/business-tools/plexe/model/plexe';
import { IMailBulkShippingAddress } from 'src/app/modules/check/model/check';
import { AddMailAddressModalV4Component } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal-v4/add-mail-address-modal-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IOverallData } from 'src/app/models/user';

interface IWithdrawFundFormV4 extends IWithdrawFundForm {
  shippingType: FormControl<string | null>;
  customTo: FormControl<string | null>;
}

@Component({
  selector: 'app-withdraw-funds-v4-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogModule,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    WalletDropdownV4Component,
    V4ControlMessageComponent,
    BankAcDropdownV4Component,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    NgClass,
    MatRadioGroup,
    MatRadioButton,
    MatTooltip,
    V4CommonDropDownSelectorComponent,
    CurrencyPipe
  ],
  templateUrl: './withdraw-funds-v4-modal.component.html',
  styleUrls: ['./withdraw-funds-v4-modal.component.scss']
})
export class WithdrawFundsV4ModalComponent implements OnInit {
  readonly XIcon = X;
  readonly CalculatorIcon = Calculator;
  readonly InfoIcon = Info;
  readonly AlertCircleIcon = AlertCircle;

  customToDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select address',
    displayField: 'name',
    outputField: 'id',
    enableAddNew: true,
    addNewLabel: 'Add new address'
  };

  shippingTypeDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select shipping type',
    displayField: 'name',
    displaySubField: 'cost',
    outputField: 'carrier_code'
  };

  private fb = inject(FormBuilder);
  private v4AlertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private headerService = inject(HeaderService);
  private walletDataService = inject(WalletDataV35Service);
  private authService = inject(AuthDataService);
  private dialogRef = inject(MatDialogRef<WithdrawFundsV4ModalComponent>);
  private destroyRef = inject(DestroyRef);
  private checkService = inject(CheckService);
  private sharedService = inject(SharedService);
  private psbService = inject(PsbService);
  private postHogService = inject(PostHogService);
  private localStorageService = inject(LocalStorageService);

  /** Start of the form, for form_duration_seconds on submit/abandon. */
  transactionInitiatedTime = performance.now();

  /** Guards the abandonment event: a submitted form was not abandoned. */
  isTransactionSubmitted = false;

  sameDayFeeAmount = 0;
  isSameDayFeeLoading = false;

  wallet: IWalletData = inject(MAT_DIALOG_DATA);

  selectedWallet: FormControl<IWalletData> = new FormControl();
  selectedBankAccount: FormControl<IBankDropdown> = new FormControl();
  withdrawFundsForm: FormGroup<IWithdrawFundFormV4> = this.fb.group({
    fromWallet: ['', [Validators.required]],
    toBankAccountId: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    comment: [null, [Validators.required]],
    isSameDay: [0],
    selectedWithdrawMethod: [''],
    shippingType: [null],
    customTo: [null]
  }) as FormGroup<IWithdrawFundFormV4>;

  sessionKey: string;
  loading = signal(false);
  selectedBank: IBankDropdown;
  selectedWithdrawMethod = 'ach';
  withdrewOptions = [
    { id: 'ach', name: 'Regular ACH' },
    { id: 'sameDay', name: 'Same Day ACH' },
    { id: 'wire', name: 'Wire Transfer' },
    // {
    //   id: 'instant-bank-transfer',
    //   name: 'RTP',
    //   tootTip: 'Instant fund transfer to your bank account'
    // },
  ];

  shippingTypeList: IShippingTypes[] = [];
  shippingAddressTo: IMailBulkShippingAddress[] = [];
  customToId: string | null = null;
  isCustomToAddressLoading = signal(false);
  isShippingTypeLoading = signal(false);
  mailFee = '$0.00';

  withdrawFeeDetails: IWithdrawFundFee;
  showSectionFee = false;
  fetchingFeeDetails = false;
  showMinimumAmountError = false;
  private selectedWalletData: IWalletData | null = null;
  private isInsufficientBalanceAlertShowing = false;

  ngOnInit(): void {
    this.transactionInitiatedTime = performance.now();
    this.trackTransactionInitiated();
    this.dropdownChange();
    this.selectedWallet.setValue(this.wallet);
    this.handleAmountChange();
    this.watchShippingTypeFee();
    this.fetchSameDayFee();
  }

  fetchSameDayFee(): void {
    this.isSameDayFeeLoading = true;
    this.psbService
      .getTransactionFee({
        featureCode: 'txn-zilpayment-ach-from-wallet',
        transactionAmount: 0,
        samedayFeatureCode: 'txn-zilpayment-sameday-ach-processing-fee'
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.isSameDayFeeLoading = false; })
      )
      .subscribe((res) => {
        if (res.success) {
          this.sameDayFeeAmount = Number(res.samedayFee) || 0;
        }
      });
  }

  private watchShippingTypeFee(): void {
    this.withdrawFundsForm.controls.shippingType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) {
          const selected = this.shippingTypeList.find(
            (item) => item.carrier_code === value.toString()
          );
          this.mailFee = selected ? selected.cost : '$0.00';
        } else {
          this.mailFee = '$0.00';
        }
      });

    this.withdrawFundsForm.controls.customTo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.customToId = value ?? null;
      });
  }

  handleAmountChange() {
    combineLatest([
      this.withdrawFundsForm.controls.amount.valueChanges.pipe(
        debounceTime(300),
        startWith(this.withdrawFundsForm.controls.amount.value)
      ),
      this.withdrawFundsForm.controls.selectedWithdrawMethod.valueChanges.pipe(
        startWith(this.withdrawFundsForm.controls.selectedWithdrawMethod.value)
      )
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([amount, selectedMethod]) => {
        this.showMinimumAmountError = false;
        this.checkInsufficientBalance();
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

  dropdownChange() {
    this.selectedWallet.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((walletItem) => {
        this.changeWallet(walletItem);
      });
    this.selectedBankAccount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankItem) => {
        if (bankItem !== this.selectedBank) {
          this.selectedBank = bankItem;
          this.changeBank(bankItem);
        }
      });
  }

  changeWallet(wallet: IWalletData) {
    if (wallet === null || wallet === undefined) return;
    this.selectedWalletData = wallet;
    this.withdrawFundsForm.controls.fromWallet.setValue(wallet.uuId);
    this.checkInsufficientBalance();
  }

  changeBank(bank: IBankDropdown) {
    if (bank === null || bank === undefined) return;
    if (bank?.verified === 0) {
      const modal = this.v4AlertService.warningAlert({
        content:
          'You should verify this bank account to withdraw into this account. Would you like to verify now?',
        isCancel: true,
        isOk: true
      });
      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.withdrawFundsForm.controls.toBankAccountId.setValue(null);
          this.openVerifyModal(bank.id, bank);
        }
      });
    } else {
      this.withdrawFundsForm.controls.toBankAccountId.setValue(bank.id);
    }
  }

  openVerifyModal(bankId: string, bank?: IBankDropdown) {
    const verifyModal = this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        bankId,
        bankDetails: bank
          ? { verifiedBy: bank.verifiedBy, country: bank.country }
          : undefined
      },
      disableClose: true
    });
    verifyModal.afterClosed().subscribe((res) => {
      if (res?.phoneAndEmailVerified === false) {
        this.dialogRef.close();
      }
    });
  }

  changeWithdrawOption(type: string) {
    this.selectedWithdrawMethod = type;
    if (type === 'sameDay') {
      this.withdrawFundsForm.controls.isSameDay.setValue(1);
    } else {
      this.withdrawFundsForm.controls.isSameDay.setValue(0);
    }
    if (type === 'mail') {
      this.loadCheckMailData();
    } else {
      this.clearCheckMailData();
    }
  }

  private loadCheckMailData(): void {
    this.loadCustomToAddress();
    this.getShippingTypes();
    (['customTo', 'shippingType'] as const).forEach((name) => {
      const ctrl = this.withdrawFundsForm.controls[name];
      ctrl.addValidators([Validators.required]);
      ctrl.updateValueAndValidity();
    });
  }

  private clearCheckMailData(): void {
    this.customToId = null;
    this.mailFee = '$0.00';
    (['customTo', 'shippingType'] as const).forEach((name) => {
      const ctrl = this.withdrawFundsForm.controls[name];
      ctrl.clearValidators();
      ctrl.setValue(null);
      ctrl.updateValueAndValidity();
    });
  }

  private loadCustomToAddress(): void {
    this.isCustomToAddressLoading.set(true);
    this.checkService
      .getAddressTo()
      .pipe(
        finalize(() => this.isCustomToAddressLoading.set(false)),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.shippingAddressTo = res.data;
      });
  }

  private getShippingTypes(): void {
    this.isShippingTypeLoading.set(true);
    this.sharedService
      .getWalletShippingTypes()
      .pipe(
        finalize(() => this.isShippingTypeLoading.set(false)),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.shippingTypeList = res.data.map((item: IShippingTypes) => ({
          ...item,
          cost: `$${parseFloat(item.cost).toFixed(2)}`
        }));
      });
  }

  openAddMailAddressModal(): void {
    const ref = this.dialog.open(AddMailAddressModalV4Component, {
      maxWidth: '700px',
      width: '98%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        dataKey: 'mail-to',
        isForUpdate: this.customToId !== null,
        id: this.customToId,
        isWalletCheckCustomAddress: true
      }
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.id) {
          this.customToId = res.id;
          this.withdrawFundsForm.controls.customTo.setValue(res.id);
          this.loadCustomToAddress();
        }
      });
  }


  formBody(): IWidthdrawFunds {
    const data = this.withdrawFundsForm.value;
    const base = {
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

    if (this.selectedWithdrawMethod === 'mail') {
      return {
        ...base,
        customToAddressId: this.customToId,
        shippingType: data.shippingType
      };
    }
    return base;
  }

  private checkInsufficientBalance(): void {
    if (!this.selectedWalletData || this.isInsufficientBalanceAlertShowing) {
      return;
    }
    const amount =
      Number(this.withdrawFundsForm.controls.amount.value) || 0;
    const availableBalance =
      parseFloat(this.selectedWalletData.availableBalance) || 0;
    if (amount > 0 && amount > availableBalance) {
      this.isInsufficientBalanceAlertShowing = true;
      this.v4AlertService
        .warningAlert({
          content:
            'Insufficient balance on your wallet, please select another wallet.',
          doneMsg: 'OK'
        })
        .afterClosed()
        .subscribe(() => {
          this.isInsufficientBalanceAlertShowing = false;
          this.selectedWalletData = null;
          this.selectedWallet.reset();
          this.withdrawFundsForm.patchValue({ fromWallet: '' });
        });
    }
  }

  onSubmit(): void {
    this.withdrawFundsForm.markAllAsTouched();
    if (this.withdrawFundsForm.invalid || this.showMinimumAmountError) return;

    this.trackTransactionSubmitted();

    this.loading.set(true);
    this.walletService
      .withdrawFunds(this.formBody())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialog.closeAll();
            this.walletDataService
              .refreshWalletDataAndStore()
              .pipe(take(1))
              .subscribe();
            this.headerService.setHeaderValueChanged(true);
            this.v4AlertService.successAlert({
              content: 'Funds Withdrawn Successfully',
              close: true,
              timeout: 3000
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.error.errorCode === '112') {
            const dialog = this.dialog.open(OtpModalV4Component, {
              maxWidth: '410px',
              width: '100%',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) this.onSubmit();
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
      });
  }

  private triggerWithdrawFundFee(amount: number): void {
    const payload = { amount, transfer_method: 'instant-bank-transfer' };
    this.fetchingFeeDetails = true;
    this.walletService
      .withdrawFundFee(payload)
      .pipe(
        finalize(() => {
          this.fetchingFeeDetails = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.withdrawFeeDetails = res.data;
          }
        }
      });
  }

  /**
   * @description Records that the transfer flow was opened, before the form is
   * shown. capture() only: nothing is entered yet, so no profile state changes.
   */
  private trackTransactionInitiated(): void {
    const overallData = this.localStorageService.getItem(
      'overallData'
    ) as IOverallData | null;

    this.postHogService.trackTransactionInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'withdrawal',
      is_first_attempt: !overallData?.hasWalletWithdrawal,
      bank_count: overallData?.bankAccountCount ?? 0
    });
  }

  /**
   * @description Records the confirmed withdrawal, before the request is
   * dispatched. capture() only: the transaction is pending until the backend
   * answers, so no profile state has changed yet.
   */
  private trackTransactionSubmitted(): void {
    const overallData = this.localStorageService.getItem(
      'overallData'
    ) as IOverallData | null;
    const duration = performance.now() - this.transactionInitiatedTime;

    let fundingMethod: 'ach' | 'wire' | 'other';
    if (
      this.selectedWithdrawMethod === 'ach' ||
      this.selectedWithdrawMethod === 'sameDay'
    ) {
      fundingMethod = 'ach';
    } else if (this.selectedWithdrawMethod === 'wire') {
      fundingMethod = 'wire';
    } else {
      fundingMethod = 'other';
    }

    this.postHogService.trackTransactionSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'withdrawal',
      amount: Number(this.withdrawFundsForm.value.amount) || 0,
      currency: 'USD',
      funding_method: fundingMethod,
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before:
        Number(this.selectedWalletData?.availableBalance) || 0,
      bank_account_id:
        (this.withdrawFundsForm.value.toBankAccountId as string) || null,
      // Wallet ids belong to internal_transfer only.
      source_wallet_id: null,
      destination_wallet_id: null,
      is_first_transaction: !overallData?.hasTransacted
    });

    this.isTransactionSubmitted = true;
  }
}

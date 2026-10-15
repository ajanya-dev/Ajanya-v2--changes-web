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
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, finalize, take } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import {
  IFundWallet,
  IFundWalletForm,
  IFundWalletResponse,
  IFundWalletResponseData,
  IWalletData,
  ICryptoWalletFunding,
  ICryptoChainList
} from 'src/app/models/wallet';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import {
  MatRadioChange,
  MatRadioGroup,
  MatRadioButton
} from '@angular/material/radio';
import { CardPaymentModalComponent } from 'src/app/shared/modal/card-payment-modal/card-payment-modal/card-payment-modal.component';
import { WhiteLabel } from 'src/app/modules/dynamic-white-label/dynamic-white-label-data/dynamic-white-label-data';
import { environment } from 'src/environments/environment';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { NgFor, NgClass, NgIf, CurrencyPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { MoEngageService } from 'src/app/core/services/moengage.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IOverallData } from 'src/app/models/user';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { faCopy } from '@fortawesome/pro-solid-svg-icons';
import { MapSourceWithBusinessModalComponent } from 'src/app/modules/payments/shared/modal/map-source-with-business-modal/map-source-with-business-modal.component';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { ScriptService } from 'src/app/core/services/script.service';
import { WireTypeV35Component } from '../wire-type-v35/wire-type-v35.component';
import { DownloadWireTransferFormComponent } from '../../../wallet-v2/modals/download-wire-transfer-form/download-wire-transfer-form.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AmountInputComponent } from '../../../../../shared/components/amount-input/amount-input.component';
import { WalletDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { CommonInputFieldComponent } from '../../../../../shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { BankAcDropdownV3Component as BankAcDropdownV3Component_1 } from '../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-fund-your-wallet-v35',
  templateUrl: './fund-your-wallet-v35.component.html',
  styleUrls: ['./fund-your-wallet-v35.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    NgFor,
    MatRadioButton,
    MatTooltip,
    NgClass,
    NgIf,
    BankAcDropdownV3Component_1,
    V35ControlMessageComponent,
    CommonInputFieldComponent,
    WalletDropdownV3Component,
    AmountInputComponent,
    CommonButtonV35Component,
    CurrencyPipe,
    DemoVideoComponent
  ]
})
export class FundYourWalletV35Component implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private dataTableService = inject(DataTableService);
  public wallet: IWalletData = inject(MAT_DIALOG_DATA);
  private router = inject(Router);
  public dialogRef = inject(MatDialogRef<FundYourWalletV35Component>);
  private personaHelperService = inject(PersonaHelperService);
  private moengageService = inject(MoEngageService);
  private localStorageService = inject(LocalStorageService);
  private postHogService = inject(PostHogService);
  private scriptService = inject(ScriptService);

  @ViewChild('bankAcDropDown')
  bankAcDropDownComponent: BankAcDropdownV3Component;

  selectedWallet: FormControl<IWalletData> = new FormControl();
  selectedBankAccount: FormControl<IBankDropdown> = new FormControl();

  fundYourWalletForm: FormGroup<IFundWalletForm> = this.fb.group({
    bankAccount: [''],
    bankHolderName: [''],
    toWallet: ['', [Validators.required]],
    amount: [null, [Validators.required]],
    comment: ['', [Validators.required]],
    transactionType: ['ach'],
    accountType: ['Business'],
    totalAmount: [0],
    digitalSignature: [null],
    chain: [''],
    fromAddress: [''],
    receiving_crypto_address: [''],
    transactionHash: ['']
  }) as FormGroup<IFundWalletForm>;

  transferTypes = [
    { id: 'ach', name: 'ACH' },
    { id: 'wire', name: 'Wire Transfer' }
  ];

  fundingBankTypes = [
    { id: '1', head: 'Fund From Your Bank', tooltip: '' },
    {
      id: '2',
      head: 'Fund From Outside Bank',
      tooltip: `Receiving funds from other sources, such as your employer, customers, or clients, or from your unlinked bank accounts.`
    }
  ];

  accountTypes = [
    {
      id: 'Business',
      head: 'Business Account',
      tooltip:
        'Bank Accounts under your business name,  and it open by using your federal tax ID number, EIN number or TIN. The sole proprietary account also a business account even if you use your social security number to open, but it has a business name rather than your Personal Name.'
    },
    {
      id: 'Personal',
      head: 'Personal Account',
      tooltip:
        'A personal bank account is for an individual to keep and manage their own personal funds and other assets.  Usually it open by using your Social Security Number.'
    }
  ];

  selectedTransferType = 'ach';
  selectedFundingBank = '1';
  selectedWireType = 'domestic';
  selectedAccountType = 'Business';
  subscriptions: Subscription[] = [];
  minAmount = 20;
  isLoading = false;
  isSelectWire = false;
  selectedBank: IBankDropdown;
  dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();
  currentEnvironmentId = environment.env_id;
  bankAccount: IBankDropdown;
  cryptoChains: ICryptoChainList[] = [];
  selectedChainItem: ICryptoChainList | undefined;
  faCopy = faCopy;
  transactionInitiatedTime = performance.now();
  isFirstTransaction = false;
  isTransactionSubmitted = false;

  ngOnInit(): void {
    this.transactionInitiatedTime = performance.now();
    this.walletTransactionInitiated();
    this.dropdownChange();
    this.selectedWallet.setValue(this.wallet);
    this.setToolTip();
    if(this.wallet?.fundType === 'crypto'){
      this.fundingBankTypes.push({
        id: '3',
        head: 'Fund From Blockchain',
        tooltip: `Fund your wallet using blockchain payments from various supported digital currencies.`
      });
      this.getCryptoFundingSources();
    }
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
    this.fundYourWalletForm.controls.toWallet.setValue(wallet.uuId);
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
          'The bank account is not verified to fund wallet. Would you like to verify now?',
        isCancel: true,
        doneMsg: 'Verify Now'
      });

      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.fundYourWalletForm.controls.bankAccount.setValue('');
          this.clearBank();
          this.openVerifyModal(bank.id);
          this.dialogRef.close(false);
        }
      });
    } else {
      this.fundYourWalletForm.controls.bankAccount.setValue(bank.id);
      this.bankAccount = bank;
    }
  }

  /**
   * @description Opens a verification modal for a bank account.
   * @param {string} bankId - The encrypted ID of the bank account to be verified.
   */
  openVerifyModal(bankId: string) {
    this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id: bankId },
      disableClose: true
    });
  }

  /**
   * @description Change the selected transfer type and update form controls.
   * @param {string} id - The identifier of the transfer type.
   */
  changeTransferType(id: string) {
    if(id === 'ach' && this.selectedFundingBank === '2') return;

    if(this.selectedTransferType === 'wire' && id === 'ach'){
      this.fundYourWalletForm.controls.digitalSignature.clearValidators();
      this.fundYourWalletForm.controls.digitalSignature.updateValueAndValidity();
    }

    this.selectedTransferType = id;
    this.fundYourWalletForm.controls.transactionType.setValue(id);
    this.updateValidity();
    if (id === 'card') {
      this.minAmount = 30;
    } else {
      this.minAmount = 20;
    }
  }

  /**
   * @description Handle changes in the selected bank type.
   * @param {MatRadioChange} event - The event object containing information about the change.
   */
  onChangeBankType(event: MatRadioChange) {
    if (event.value === '2') {
      this.clearBank();
      this.selectedTransferType = 'wire';
    }
    if (event.value === '3') {
      this.clearBank();
    }
    if (event) {
      this.updateValidity();
    }
  }

  /**
   * @description Constructs a data object for funding the wallet, specifically used with wire or ach transfer types.
   * @param {string} fundingBank - The identifier for the funding bank.
   * @returns {IFundWallet} The funding body object.
   */
  formBody(fundingBank: string): IFundWallet {
    const data = this.fundYourWalletForm.value;
    const sendingData = {
      accountType: 'BUSINESS',
      amount: data.amount,
      comment: data.comment,
      toWallet: data.toWallet,
      transactionType: this.selectedTransferType,
      totalAmount: data.totalAmount,
      digitalSignature: data.digitalSignature
    } as IFundWallet;

    if (fundingBank === '1') {
      sendingData.bankAccount = data.bankAccount as string;
    } else {
      sendingData.bankHolderName = data.bankHolderName as string;
      if (this.selectedTransferType === 'wire') {
        sendingData.wireType = this.selectedWireType;
      }
    }
    return sendingData as IFundWallet;
  }

  /**
   * @description Constructs a data object for funding the wallet, specifically used when the selected transfer type is card.
   * @returns {IFundWallet} The funding body object for card transfers.
   */
  cardFormBody(): IFundWallet {
    const data = this.fundYourWalletForm.value;
    return {
      amount: data.amount,
      toWallet: data.toWallet,
      comment: data.comment,
      transactionType: this.selectedTransferType,
      totalAmount: data.totalAmount
    } as IFundWallet;
  }

  /**
   * @description Constructs a data object for funding the wallet using cryptocurrency.
   * @returns {ICryptoWalletFunding} The funding body object for crypto transfers.
   */
  cryptoFormBody(): ICryptoWalletFunding {
    const data = this.fundYourWalletForm.value;
    return {
      wallet_id: data.toWallet || '',
      amount: data.amount?.toString() || '',
      receiving_crypto_address: data.receiving_crypto_address || '',
      from_address: data.fromAddress || '',
      transaction_hash: data.transactionHash || ''
    } as ICryptoWalletFunding;
  }

  openCalculator() {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: {addAmountButton : true}
    });

    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.fundYourWalletForm.patchValue({ amount: calculatedValue });
      }
    });
  }

  /**
   * @description Update form field validators based on selected transfer type and funding bank.
   */
  updateValidity() {
    const bankaccountControl = this.fundYourWalletForm.controls.bankAccount;
    const bankholderControl = this.fundYourWalletForm.controls.bankHolderName;
    const signatureControl = this.fundYourWalletForm.controls.digitalSignature;
    const commentControl = this.fundYourWalletForm.controls.comment;
    const chainControl = this.fundYourWalletForm.controls.chain;
    const fromAddressControl = this.fundYourWalletForm.controls.fromAddress;
    const transactionHashControl = this.fundYourWalletForm.controls.transactionHash;

    // Clear all crypto validators first
    chainControl.clearValidators();
    fromAddressControl.clearValidators();
    transactionHashControl.clearValidators();
    chainControl.updateValueAndValidity();
    fromAddressControl.updateValueAndValidity();
    transactionHashControl.updateValueAndValidity();

    if (this.selectedFundingBank === '3') {
      // Set crypto validators
      chainControl.setValidators(Validators.required);
      fromAddressControl.setValidators(Validators.required);
      transactionHashControl.setValidators(Validators.required);
      chainControl.updateValueAndValidity();
      fromAddressControl.updateValueAndValidity();
      transactionHashControl.updateValueAndValidity();

      // Clear bank-related validators
      bankaccountControl.clearValidators();
      bankholderControl.clearValidators();
      signatureControl.clearValidators();
      commentControl.clearValidators();
      bankaccountControl.updateValueAndValidity();
      bankholderControl.updateValueAndValidity();
      signatureControl.updateValueAndValidity();
      commentControl.updateValueAndValidity();
    } else if (this.selectedTransferType !== 'card') {
      if (this.selectedFundingBank === '1') {
        bankaccountControl.setValidators(Validators.required);
        bankaccountControl.updateValueAndValidity();
        bankholderControl.setValue(null);
        bankholderControl.clearValidators();
        bankholderControl.updateValueAndValidity();
        if (this.selectedTransferType === 'wire') {
          signatureControl.setValidators(Validators.required);
          signatureControl.updateValueAndValidity();
        }
      } else {
        bankholderControl.setValidators([
          Validators.required,
          ValidationService.personNameValidator
        ]);
        bankholderControl.updateValueAndValidity();
        bankaccountControl.setValue(null);
        bankaccountControl.clearValidators();
        bankaccountControl.updateValueAndValidity();
        if (this.selectedTransferType === 'wire') {
          signatureControl.reset();
          signatureControl.clearValidators();
          signatureControl.updateValueAndValidity();
        }
      }
    } else {
      bankholderControl.clearValidators();
      bankholderControl.updateValueAndValidity();
      bankaccountControl.clearValidators();
      bankaccountControl.updateValueAndValidity();
      signatureControl.clearValidators();
      signatureControl.updateValueAndValidity();
    }
  }

  /**
   * @description Clear selected bank from dropdown.
   */
  clearBank() {
    this.bankAcDropDownComponent.clearSelection();
  }

  /**
   * @description Handles the submission of the wallet funding form.
   * If the form is valid and the amount is sufficient, it initiates the funding process.
   */
  onSubmit() {

    this.updateValidity();
    this.fundYourWalletForm.markAllAsTouched();
    if (
      this.fundYourWalletForm.invalid ||
      (this.fundYourWalletForm.value?.amount as number) < Number(this.minAmount)
    ) {
      return;
    }

    this.transactionSubmitted();
    if (
      this.selectedFundingBank === '1' ||
      this.selectedTransferType === 'card'
    ) {
      this.fundYourBank(this.selectedFundingBank);
    } else if (
      this.selectedFundingBank === '2' &&
      this.selectedTransferType !== 'card'
    ) {
      this.fundOutsideBank(this.selectedFundingBank);
    } else if (this.selectedFundingBank === '3') {
      this.fundCryptoWallet();
    }
  }

  /**
   * @description Initiates the process of funding the wallet through the user's bank account.
   * @param {string} fundingBank - The identifier for the funding bank.
   */
  fundYourBank(fundingBank: string) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422:
        this.bankAccount.achApplicationStatus === null ? 'true' : 'false'
    });
    this.isLoading = true;
    this.subscriptions.push(
      this.walletService
        .fundWallet(
          this.selectedTransferType !== 'card'
            ? this.formBody(fundingBank)
            : this.cardFormBody(),
          headerOptions
        )
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.setUserFirstTransactionFlag();
              // Capture values before form reset
              const walletId = this.fundYourWalletForm.get('toWallet')?.value;
              const amount = this.fundYourWalletForm.get('amount')?.value;
              
              this.fundYourWalletForm.reset();
              if (this.selectedTransferType === 'ach') {
                this.onSuccessAch(walletId, amount);
              } else {
                this.onOutsideBankSuccess(res.data, walletId, amount);
              }
            }
          },
          error: (err) => {
            if (err.error?.errorCode === 1) {
              this.openWarningToRedirectBankPageModal();
            } 
            else if (err.error?.errorCode === 780) {
              this.alertService.warningAlert({
                title: 'Error',
                content: 'Business verification is required to fund wallet. Would you like to verify now?',
                doneMsg: 'Verify Now',
                cancelMsg: 'Cancel',
                isCancel: true
              }).afterClosed().subscribe((res) => {
                if (res) {
                  this.forceBusinessVerification();
                }
              });
            }else if (err.error?.errorCode === 250) {
              this.alertService.warningAlert({
                title: 'Error',
                content: err.error.errorMsg,
                doneMsg: 'Map Now',
                cancelMsg: 'Cancel',
                isCancel: true
              }).afterClosed().subscribe((res) => {
                if (res) {
                  this.forceWalletBusinessMapping();
                }
              });
            }
          }
        })
    );
  }

  onSuccessAch(walletId?: string | null, amount?: number | null) {
    this.dialog.closeAll();
    this.successAlert('Wallet funded successfully');
    this.dataTableService.setRefreshStatus(true, 20);
  }

  successAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true,
      timeout: 2500
    };
    this.alertService.successAlert(data);
  }

  /**
   * @description Open warning alert and redirect to bank page.
   */
  openWarningToRedirectBankPageModal(): void {
    const data = {
      title: 'Error',
      content:
        'Selected bank account is not approved for ACH. Please check your bank list to see the status.',
      doneMsg: 'View bank list',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const alert = this.alertService.warningAlert(data);
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.closeAll();
        this.router.navigateByUrl('/manage/bank-accounts/index');
      }
    });
  }

  /**
   * @description Initiates the process of funding the wallet from an external bank account.
   * @param {string} fundingBank - The identifier for the funding bank.
   */
  fundOutsideBank(fundingBank: string) {
    if (this.selectedTransferType === 'wire' && !this.isSelectWire) {
      this.openWireTypeModal();
      return;
    }
    this.isLoading = true;
    this.subscriptions.push(
      this.walletService
        .fundWalletOutside(this.formBody(fundingBank))
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.setUserFirstTransactionFlag();
              // Capture values before form reset
              const walletId = this.fundYourWalletForm.get('toWallet')?.value;
              const amount = this.fundYourWalletForm.get('amount')?.value;
              this.isSelectWire = false;
              this.fundYourWalletForm.reset();
              this.onOutsideBankSuccess(res.data, walletId, amount);
            }
          },
          error: (err) => {
            if (err.error?.errorCode === 780) {
              this.alertService.warningAlert({
                title: 'Error',
                content: 'Business verification is required to fund wallet. Would you like to verify now?',
                doneMsg: 'Verify Now',
                cancelMsg: 'Cancel',
                isCancel: true
              }).afterClosed().subscribe((res) => {
                if (res) {
                  this.forceBusinessVerification();
                }
              });
            }else if (err.error?.errorCode === 250) {

              this.alertService.warningAlert({
                title: 'Error',
                content: err.error.errorMsg,
                doneMsg: 'Map Now',
                cancelMsg: 'Cancel',
                isCancel: true
              }).afterClosed().subscribe((res) => {
                if (res) {
                  this.forceWalletBusinessMapping(true);
                }
              });

            }
          }
        })
    );
  }

  /**
   * @description Handles actions after successfully funding the wallet from an external bank account.
   * @param {IFundWalletResponseData} response - The response data from the API.
   * @param walletId - Wallet ID (optional, for tracking)
   * @param amount - Funding amount (optional, for tracking)
   */
  onOutsideBankSuccess(response: IFundWalletResponseData, walletId?: string | null, amount?: number | null) {
    const selectedTransferType =
      this.selectedTransferType === 'ach' ? 'ACH' : 'Wire';
    this.dialog.closeAll();
    this.dataTableService.setRefreshStatus(true, 20);
    this.dialog.open(DownloadWireTransferFormComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        applicationUuid: response.applicationUniqueId,
        fundingBank: this.selectedFundingBank,
        transferType: selectedTransferType
      }
    });
  }

  /**
   * @description Initiates the process of funding the wallet using cryptocurrency.
   */
  fundCryptoWallet() {
    this.isLoading = true;
    const cryptoPayload = this.cryptoFormBody();
    
    this.subscriptions.push(
      this.walletService
        .cryptoWalletFundingSource(cryptoPayload)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.setUserFirstTransactionFlag();
              // Capture values before form reset
              const walletId = this.fundYourWalletForm.get('toWallet')?.value;
              const amount = this.fundYourWalletForm.get('amount')?.value;
              
              this.fundYourWalletForm.reset();
              this.onCryptoSuccess(walletId, amount);
            }
          }
        })
    );
  }

  /**
   * @description Handles actions after successfully funding the wallet with cryptocurrency.
   * @param walletId - Wallet ID (optional, for tracking)
   * @param amount - Funding amount (optional, for tracking)
   */
  onCryptoSuccess(walletId?: string | null, amount?: number | null) {
    this.dialog.closeAll();
    this.successAlert('Wallet funded successfully with cryptocurrency');
    this.dataTableService.setRefreshStatus(true, 20);
  }

  /**
   * @description Handles actions after successfully withdrawing funds from the wallet.
   * @param {IFundWalletResponse} response - The response data from the API.
   */
  onSuccess(response: IFundWalletResponse) {
    const alertData = {
      title: 'Success!',
      content: 'Funds Withdrawn Successfully',
      close: true
    };
    this.dialog.closeAll();
    this.alertService.successAlert(alertData);
    this.dataTableService.setRefreshStatus(true, 20);
    if (this.selectedTransferType === 'card') {
      this.dialog.open(CardPaymentModalComponent, {
        width: '600px',
        maxWidth: '95%',
        disableClose: true,
        data: response
      });
    }
  }

  /**
   * @description Opens a modal dialog to select a wire transfer type.
   */
  openWireTypeModal() {
    const wireTypeModal = this.dialog.open(WireTypeV35Component, {
      width: '250px',
      maxWidth: '93%',
      disableClose: true
    });
    wireTypeModal.afterClosed().subscribe((res: string) => {
      if (!res) {
        this.isSelectWire = false;
        return;
      }
      this.isSelectWire = true;
      this.selectedWireType = res;
      this.fundOutsideBank(this.selectedFundingBank);
    });
  }

  /**
   * @description Calculates the total amount to be withdrawn, including fees.
   * Updates the 'totalAmount' field in the wallet funding form.
   */
  totalAmountCal() {
    const amount = this.fundYourWalletForm.value.amount
      ? this.fundYourWalletForm.value.amount * 1
      : 0;
    if (amount > 0) {
      const fee = (amount + 0.5 + 1) * 0.03019 + 0.5 + 1;
      let totalAmount = amount + fee;
      totalAmount = parseFloat(totalAmount.toFixed(2));
      this.fundYourWalletForm.controls.totalAmount.setValue(totalAmount);
    } else {
      this.fundYourWalletForm.controls.totalAmount.setValue(0);
    }
  }

  /**
   * @description Set the tooltip for a funding bank type based on dynamic white label data.
   * If a matching bank name is found in the dynamic white label data, it will be used;
   * otherwise, it defaults to 'OnlineCheckWriter'.
   */
  setToolTip() {
    let whitlabelBankName;
    this.dynamicWhiteLabelData.forEach((whiteLabel) => {
      if (whiteLabel.environmentId === this.currentEnvironmentId) {
        whitlabelBankName = whiteLabel.attributes?.bankName;
      }
    });
    const bankName = whitlabelBankName ?? 'OnlineCheckWriter';
    const toolTip = `Initiate funding from the bank account that you've already linked to your ${bankName} account.`;
    this.fundingBankTypes[0].tooltip = toolTip;
  }

  getCryptoFundingSources(){
    this.walletService.getCryptoFundingSources()
    .pipe(take(1))
    .subscribe((res) => {
      if(res.success){
        this.cryptoChains = res.data;
      }
    });
  }

  onChangeChain(event: Event){
    const selectedChainId = (event.target as HTMLSelectElement).value;
    if(selectedChainId){
      this.selectedChainItem = this.cryptoChains.find(chain => chain.id.toString() === selectedChainId);
      if(this.selectedChainItem){
        this.fundYourWalletForm.controls.receiving_crypto_address.setValue(this.selectedChainItem.deposit_address);
      }
    }
  }

  copyCryptoAddress(){
    const receivingCryptoAddress = this.fundYourWalletForm.controls.receiving_crypto_address.value;
    if(receivingCryptoAddress){
      navigator.clipboard.writeText(receivingCryptoAddress);
      this.alertService.successAlert({
        title: 'Success',
        content: 'Crypto address copied to clipboard',
        close: true
      });
    }
  }

  openQRCodeModal(){
    this.dialog.open(QrCodeScannerModalComponent, {
      width: '322px',
      data: {
        link: this.selectedChainItem?.qr_code || '',
        address: this.selectedChainItem?.deposit_address || ''
      }
    });
  }

  forceBusinessVerification(){
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyc_kyb', CVSourceType.add_new_business);
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
    }
    this.dialogRef.close();
  }
  

  forceWalletBusinessMapping(isOutsideBank: boolean = false){
    const dialog = this.dialog.open(MapSourceWithBusinessModalComponent, {
      maxWidth: '430px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal',
      data: {
        type: 'wallet',
        wallet: this.selectedWallet.value,
        mapNow: true,
        source: 'wallet-funding'
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res.success) {
        if(isOutsideBank){
          this.fundOutsideBank(this.selectedFundingBank);
        }else{
          this.fundYourBank(this.selectedFundingBank);
        }
      }
    });
  }

  // MoEngage Tracking / Helper Functions

  /**
   * @description Tracks the wallet transaction initiated
   */
  walletTransactionInitiated() {
    const overallData = this.localStorageService.getItem('overallData') as IOverallData;
    this.isFirstTransaction = !overallData.hasWalletFunding;
    this.moengageService.trackWalletPaymentInitiation({
      transaction_type: 'wallet_funding',
      is_first_attempt: this.isFirstTransaction,
      bank_count: overallData.bankAccountCount
    });

    this.postHogService.trackTransactionInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'wallet_funding',
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
    if (this.selectedTransferType === 'ach') {
      fundingMethod = 'ach';
    } else if (this.selectedTransferType === 'wire') {
      fundingMethod = 'wire';
    } else {
      fundingMethod = 'other';
    }
    const duration = performance.now() - this.transactionInitiatedTime;
    const amount = Number(this.fundYourWalletForm.value.amount);
    const walletBalanceBefore = Number(this.selectedWallet.value?.currentBalance ?? 0);
    this.moengageService.trackTransactionSubmitted({
      transaction_type: 'wallet_funding',
      amount: this.moengageService.amountToNotionalValue(amount),
      currency: 'USD',
      funding_method: fundingMethod,
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before: this.moengageService.amountToNotionalValue(walletBalanceBefore),
      bank_account_id: this.fundYourWalletForm.value.bankAccount as string || null,
      source_wallet_id: null,
      destination_wallet_id: this.fundYourWalletForm.value.toWallet as string || null,
      is_first_transaction: this.isFirstTransaction
    });

    // PostHog takes the real figures, and "first transaction of any type".
    const overallData = this.localStorageService.getItem(
      'overallData'
    ) as IOverallData | null;
    this.postHogService.trackTransactionSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'wallet_funding',
      amount,
      currency: 'USD',
      funding_method: fundingMethod,
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before: walletBalanceBefore,
      bank_account_id:
        (this.fundYourWalletForm.value.bankAccount as string) || null,
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
    const amount = Number(this.fundYourWalletForm.value.amount);
    this.moengageService.trackTransactionAbandoned({
      transaction_type: 'wallet_funding',
      form_duration_seconds: Math.round(duration / 1000),
      amount_entered: this.moengageService.amountToNotionalValue(amount),
      funding_method: this.getFundingMethodForAbandoned(),
      exit_step: this.getExitStep(),
      exit_reason: 'user_exit',
      bank_account_id: this.fundYourWalletForm.value.bankAccount as string || null
    });
  }

  /**
   * @description Gets the exit step for the transaction abandoned.
   */
  private getExitStep(): 'amount_entry' | 'method_selection' | 'review_confirm' | 'unknown' {
    const { amount, toWallet, bankAccount, bankHolderName, comment } = this.fundYourWalletForm.value;
    const hasAmount = amount && Number(amount) > 0;
    if (!hasAmount) return 'amount_entry';
    const hasBankSource = this.selectedFundingBank === '1' ? !!bankAccount : !!bankHolderName;
    if (!toWallet || !hasBankSource || !comment) return 'method_selection';
    if (this.fundYourWalletForm.valid) return 'review_confirm';
    return 'unknown';
  }

  /**
   * @description Gets the funding method for the transaction abandoned.
   */
  private getFundingMethodForAbandoned(): 'ach' | 'wire' | 'unknown' {
    if (this.selectedTransferType === 'ach') return 'ach';
    if (this.selectedTransferType === 'wire') return 'wire';
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

  /**
   * @description Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (!this.isTransactionSubmitted) {
      this.transactionAbandoned();
    }
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

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
import { finalize, take } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import {
  IFundWallet,
  IFundWalletForm,
  IFundWalletResponseData,
  IWalletData,
  ICryptoWalletFunding,
  ICryptoChainList
} from 'src/app/models/wallet';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import {
  MatRadioChange,
  MatRadioGroup,
  MatRadioButton
} from '@angular/material/radio';
import { WhiteLabel } from 'src/app/modules/dynamic-white-label/dynamic-white-label-data/dynamic-white-label-data';
import { environment } from 'src/environments/environment';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgClass, CurrencyPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { MapSourceWithBusinessModalV4Component } from 'src/app/modules/payments/shared/modal/v4/map-source-with-business-modal-v4/map-source-with-business-modal-v4.component';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import {
  LucideAngularModule,
  X,
  Calculator,
  Copy,
  HelpCircle
} from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IOverallData } from 'src/app/models/user';
import { V4DownloadWireTransferFormComponent } from '../v4-download-wire-transfer-form/v4-download-wire-transfer-form.component';
import { WireTypeV4Component } from '../wire-type-v4/wire-type-v4.component';

@Component({
  selector: 'app-fund-your-wallet-v4-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogModule,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatRadioGroup,
    MatRadioButton,
    MatTooltip,
    NgClass,
    BankAcDropdownV4Component,
    V4ControlMessageComponent,
    WalletDropdownV4Component,
    CommonTabV4Component,
    CommonAmountInputV4Component,
    CommonButtonV4Component,
    CurrencyPipe,
    DemoVideoComponent,
    CommonInputFieldV4Component
  ],
  templateUrl: './fund-your-wallet-v4-modal.component.html',
  styleUrls: ['./fund-your-wallet-v4-modal.component.scss']
})
export class FundYourWalletV4ModalComponent implements OnInit {
  readonly XIcon = X;
  readonly CalculatorIcon = Calculator;
  readonly CopyIcon = Copy;
  readonly HelpCircleIcon = HelpCircle;

  private fb = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private headerService = inject(HeaderService);
  private walletDataV35Service = inject(WalletDataV35Service);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<FundYourWalletV4ModalComponent>);
  private destroyRef = inject(DestroyRef);
  private personaHelperService = inject(PersonaHelperService);
  private postHogService = inject(PostHogService);
  private localStorageService = inject(LocalStorageService);

  /** Start of the form, for form_duration_seconds on submit/abandon. */
  transactionInitiatedTime = performance.now();

  /** Guards the abandonment event: a submitted form was not abandoned. */
  isTransactionSubmitted = false;

  @ViewChild('bankAcDropDown')
  bankAcDropDownComponent: BankAcDropdownV4Component;

  wallet: IWalletData = inject(MAT_DIALOG_DATA);

  selectedWallet: FormControl<IWalletData> = new FormControl();
  selectedBankAccount: FormControl<IBankDropdown> = new FormControl();

  fundYourWalletForm: FormGroup<IFundWalletForm> = this.fb.group({
    bankAccount: [''],
    bankHolderName: [''],
    toWallet: ['', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
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

  get transferTypeTabs() {
    return this.transferTypes
      .filter((item) => {
        // Exclude ACH when funding from outside bank
        if (item.id === 'ach' && this.selectedFundingBank === '2') {
          return false;
        }
        return true;
      })
      .map((item) => ({
        label: item.name,
        value: item.id
      }));
  }

  fundingBankTypes = [
    { id: '1', head: 'Fund From Your Bank', tooltip: '' },
    {
      id: '2',
      head: 'Fund From Outside Bank',
      tooltip: `Receiving funds from other sources, such as your employer, customers, or clients, or from your unlinked bank accounts.`
    }
  ];

  selectedTransferType = 'ach';
  selectedFundingBank = '1';
  selectedWireType = 'domestic';
  loading = signal(false);
  minAmount = 20;
  isSelectWire = false;
  selectedBank: IBankDropdown;
  dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();
  currentEnvironmentId = environment.env_id;
  bankAccount: IBankDropdown;
  cryptoChains: ICryptoChainList[] = [];
  selectedChainItem: ICryptoChainList | undefined;

  ngOnInit(): void {
    this.transactionInitiatedTime = performance.now();
    this.trackTransactionInitiated();
    this.dropdownChange();
    this.selectedWallet.setValue(this.wallet);
    this.setToolTip();
    if (this.wallet?.fundType === 'crypto') {
      this.fundingBankTypes.push({
        id: '3',
        head: 'Fund From Blockchain',
        tooltip: `Fund your wallet using blockchain payments from various supported digital currencies.`
      });
      this.getCryptoFundingSources();
    }
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
    this.fundYourWalletForm.controls.toWallet.setValue(wallet.uuId);
  }

  changeBank(bank: IBankDropdown) {
    if (bank === null || bank === undefined) return;
    if (bank?.verified === 0) {
      const modal = this.alertService.warningAlert({
        content:
          'This bank account is not verified. Would you like to verify it now to fund your wallet?',
        isCancel: true,
        doneMsg: 'Verify Now'
      });
      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.fundYourWalletForm.controls.bankAccount.setValue('');
          this.clearBank();
          this.openVerifyModal(bank.id, bank);
        }
      });
    } else {
      this.fundYourWalletForm.controls.bankAccount.setValue(bank.id);
      this.bankAccount = bank;
    }
  }

  openVerifyModal(bankId: string, bank?: IBankDropdown) {
    this.dialog.open(BankVerificationModalV4Component, {
      panelClass: 'paddingless-modal-rounded',
      width: '448px',
      maxWidth: '95vw',
      data: {
        bankId,
        bankDetails: bank
          ? { verifiedBy: bank.verifiedBy, country: bank.country }
          : undefined
      },
      disableClose: true
    });
  }

  changeTransferType(id: string) {
    if (id === 'ach' && this.selectedFundingBank === '2') return;
    if (this.selectedTransferType === 'wire' && id === 'ach') {
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

  updateValidity() {
    const bankaccountControl = this.fundYourWalletForm.controls.bankAccount;
    const bankholderControl = this.fundYourWalletForm.controls.bankHolderName;
    const signatureControl = this.fundYourWalletForm.controls.digitalSignature;
    const commentControl = this.fundYourWalletForm.controls.comment;
    const chainControl = this.fundYourWalletForm.controls.chain;
    const fromAddressControl = this.fundYourWalletForm.controls.fromAddress;
    const transactionHashControl =
      this.fundYourWalletForm.controls.transactionHash;

    chainControl.clearValidators();
    fromAddressControl.clearValidators();
    transactionHashControl.clearValidators();
    chainControl.updateValueAndValidity();
    fromAddressControl.updateValueAndValidity();
    transactionHashControl.updateValueAndValidity();

    if (this.selectedFundingBank === '3') {
      chainControl.setValidators(Validators.required);
      fromAddressControl.setValidators(Validators.required);
      transactionHashControl.setValidators(Validators.required);
      chainControl.updateValueAndValidity();
      fromAddressControl.updateValueAndValidity();
      transactionHashControl.updateValueAndValidity();

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
        } else {
          signatureControl.clearValidators();
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

  clearBank() {
    this.bankAcDropDownComponent.clearSelection();
  }

  onSubmit() {
    this.updateValidity();
    this.fundYourWalletForm.markAllAsTouched();
    if (
      this.fundYourWalletForm.invalid ||
      (this.fundYourWalletForm.value?.amount as number) < Number(this.minAmount)
    ) {
      return;
    }
    this.trackTransactionSubmitted();
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

  fundYourBank(fundingBank: string) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422:
        this.bankAccount.achApplicationStatus === null ? 'true' : 'false'
    });
    this.loading.set(true);
    this.walletService
      .fundWallet(
        this.selectedTransferType !== 'card'
          ? this.formBody(fundingBank)
          : this.cardFormBody(),
        headerOptions
      )
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.fundYourWalletForm.reset();
            if (this.selectedTransferType === 'ach') {
              this.onSuccessAch();
            } else {
              this.onOutsideBankSuccess(res.data);
            }
          }
        },
        error: (err) => {
          if (err.error?.errorCode === 1) {
            this.openWarningToRedirectBankPageModal();
          } else if (err.error?.errorCode === 780) {
            this.alertService
              .warningAlert({
                title: 'Error',
                content:
                  'Business verification is required to fund wallet. Would you like to verify now?',
                doneMsg: 'Verify Now',
                cancelMsg: 'Cancel',
                isCancel: true
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) this.forceBusinessVerification();
              });
          } else if (err.error?.errorCode === 250) {
            this.alertService
              .warningAlert({
                title: 'Error',
                content: err.error.errorMsg,
                doneMsg: 'Map Now',
                cancelMsg: 'Cancel',
                isCancel: true
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) this.forceWalletBusinessMapping();
              });
          }
        }
      });
  }

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

  onSuccessAch() {
    this.dialog.closeAll();
    this.successAlert('Wallet funded successfully');
    this.headerService.setHeaderValueChanged(true);
    this.walletDataV35Service
      .refreshWalletDataAndStore()
      .pipe(take(1))
      .subscribe();
  }

  successAlert(content: string): void {
    this.alertService.successAlert({
      title: 'Success!',
      content,
      close: true,
      timeout: 2500
    });
  }

  openWarningToRedirectBankPageModal(): void {
    const alert = this.alertService.warningAlert({
      title: 'Error',
      content:
        'Selected bank account is not approved for ACH. Please check your bank list to see the status.',
      doneMsg: 'View bank list',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.closeAll();
        this.router.navigateByUrl('/v4/manage/bank-accounts/index');
      }
    });
  }

  fundOutsideBank(fundingBank: string) {
    if (this.selectedTransferType === 'wire' && !this.isSelectWire) {
      this.openWireTypeModal();
      return;
    }
    this.loading.set(true);
    this.walletService
      .fundWalletOutside(this.formBody(fundingBank))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.isSelectWire = false;
            this.fundYourWalletForm.reset();
            this.onOutsideBankSuccess(res.data);
          }
        },
        error: (err) => {
          if (err.error?.errorCode === 780) {
            this.alertService
              .warningAlert({
                title: 'Error',
                content:
                  'Business verification is required to fund wallet. Would you like to verify now?',
                doneMsg: 'Verify Now',
                cancelMsg: 'Cancel',
                isCancel: true
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) this.forceBusinessVerification();
              });
          } else if (err.error?.errorCode === 250) {
            this.alertService
              .warningAlert({
                title: 'Error',
                content: err.error.errorMsg,
                doneMsg: 'Map Now',
                cancelMsg: 'Cancel',
                isCancel: true
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) this.forceWalletBusinessMapping(true);
              });
          }
        }
      });
  }

  onOutsideBankSuccess(response: IFundWalletResponseData) {
    const selectedTransferType =
      this.selectedTransferType === 'ach' ? 'ACH' : 'Wire';
    this.dialog.closeAll();
    this.headerService.setHeaderValueChanged(true);
    this.walletDataV35Service
      .refreshWalletDataAndStore()
      .pipe(take(1))
      .subscribe();
    this.dialog.open(V4DownloadWireTransferFormComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        applicationUuid: response.applicationUniqueId,
        fundingBank: this.selectedFundingBank,
        transferType: selectedTransferType
      }
    });
  }

  fundCryptoWallet() {
    this.loading.set(true);
    this.walletService
      .cryptoWalletFundingSource(this.cryptoFormBody())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.fundYourWalletForm.reset();
            this.dialog.closeAll();
            this.successAlert('Wallet funded successfully with cryptocurrency');
            this.headerService.setHeaderValueChanged(true);
            this.walletDataV35Service
              .refreshWalletDataAndStore()
              .pipe(take(1))
              .subscribe();
          }
        }
      });
  }

  openWireTypeModal() {
    const wireTypeModal = this.dialog.open(WireTypeV4Component, {
      panelClass: 'paddingless-modal-rounded',
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

  setToolTip() {
    let whitlabelBankName: string | undefined;
    this.dynamicWhiteLabelData.forEach((whiteLabel) => {
      if (whiteLabel.environmentId === this.currentEnvironmentId) {
        whitlabelBankName = whiteLabel.attributes?.bankName;
      }
    });
    const bankName = whitlabelBankName ?? 'Zil Money';
    const toolTip = `Initiate funding from the bank account that you've already linked to your ${bankName} account.`;
    this.fundingBankTypes[0].tooltip = toolTip;
  }

  getCryptoFundingSources() {
    this.walletService
      .getCryptoFundingSources()
      .pipe(take(1))
      .subscribe((res) => {
        if (res.success) {
          this.cryptoChains = res.data;
        }
      });
  }

  onChangeChain(event: Event) {
    const selectedChainId = (event.target as HTMLSelectElement).value;
    if (selectedChainId) {
      this.selectedChainItem = this.cryptoChains.find(
        (chain) => chain.id.toString() === selectedChainId
      );
      if (this.selectedChainItem) {
        this.fundYourWalletForm.controls.receiving_crypto_address.setValue(
          this.selectedChainItem.deposit_address
        );
      }
    }
  }

  copyCryptoAddress() {
    const receivingCryptoAddress =
      this.fundYourWalletForm.controls.receiving_crypto_address.value;
    if (receivingCryptoAddress) {
      navigator.clipboard.writeText(receivingCryptoAddress);
      this.alertService.successAlert({
        title: 'Success',
        content: 'Crypto address copied to clipboard',
        close: true
      });
    }
  }

  openQRCodeModal() {
    this.dialog.open(QrCodeScannerModalComponent, {
      width: '322px',
      data: {
        link: this.selectedChainItem?.qr_code || '',
        address: this.selectedChainItem?.deposit_address || ''
      }
    });
  }

  forceBusinessVerification() {
    if (environment.isV4Persona) {
      this.personaHelperService.openModal(
        'kyc_kyb',
        CVSourceType.add_new_business
      );
    } else {
      this.router.navigateByUrl('/v4/manage/verification/index');
    }
    this.dialogRef.close();
  }

  forceWalletBusinessMapping(isOutsideBank: boolean = false) {
    const dialog = this.dialog.open(MapSourceWithBusinessModalV4Component, {
      maxWidth: '430px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        type: 'wallet',
        wallet: this.selectedWallet.value,
        mapNow: true,
        source: 'wallet-funding'
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res.success) {
        if (isOutsideBank) {
          this.fundOutsideBank(this.selectedFundingBank);
        } else {
          this.fundYourBank(this.selectedFundingBank);
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
      transaction_type: 'wallet_funding',
      is_first_attempt: !overallData?.hasWalletFunding,
      bank_count: overallData?.bankAccountCount ?? 0
    });
  }

  /**
   * @description Records the confirmed funding, before the request is
   * dispatched. capture() only: the transaction is pending until the backend
   * answers, so no profile state has changed yet.
   */
  private trackTransactionSubmitted(): void {
    const overallData = this.localStorageService.getItem(
      'overallData'
    ) as IOverallData | null;
    const duration = performance.now() - this.transactionInitiatedTime;

    let fundingMethod: 'ach' | 'wire' | 'other';
    if (this.selectedTransferType === 'ach') {
      fundingMethod = 'ach';
    } else if (this.selectedTransferType === 'wire') {
      fundingMethod = 'wire';
    } else {
      fundingMethod = 'other';
    }

    this.postHogService.trackTransactionSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'wallet_funding',
      amount: Number(this.fundYourWalletForm.value.amount) || 0,
      currency: 'USD',
      funding_method: fundingMethod,
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before:
        Number(this.selectedWallet.value?.currentBalance) || 0,
      bank_account_id:
        (this.fundYourWalletForm.value.bankAccount as string) || null,
      // Wallet ids belong to internal_transfer only.
      source_wallet_id: null,
      destination_wallet_id: null,
      is_first_transaction: !overallData?.hasTransacted
    });

    this.isTransactionSubmitted = true;
  }
}

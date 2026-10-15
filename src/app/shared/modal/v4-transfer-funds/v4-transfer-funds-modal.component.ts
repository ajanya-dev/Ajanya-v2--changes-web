import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
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
  MatDialogModule
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import { ICloudInternalTransferPayload } from 'src/app/data/data/cloud-bank';

import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { MapSourceWithBusinessModalV4Component } from 'src/app/modules/payments/shared/modal/v4/map-source-with-business-modal-v4/map-source-with-business-modal-v4.component';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CloudAccountDropdownV35Component } from 'src/app/shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';

import { LucideAngularModule, X, CircleArrowDown } from 'lucide-angular';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IOverallData } from 'src/app/models/user';

export interface IV4TransferFundsDialogData {
  transferFrom?: number;
  transferFromId?: string;
}

@Component({
  selector: 'app-v4-transfer-funds-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    CommonTabV4Component,
    V4ControlMessageComponent,
    WalletDropdownV4Component,
    BankAcDropdownV4Component,
    CloudAccountDropdownV35Component
  ],
  templateUrl: './v4-transfer-funds-modal.component.html'
})
export class V4TransferFundsModalComponent implements OnInit {
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private bankService = inject(BankService);
  private cloudService = inject(CloudBankService);
  private walletDataService = inject(WalletDataV35Service);
  private paymentsService = inject(PaymentsService);

  private dataTableService = inject(DataTableService);
  private headerService = inject(HeaderService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private postHogService = inject(PostHogService);
  private localStorageService = inject(LocalStorageService);

  /** Start of the form, for form_duration_seconds on submit/abandon. */
  transactionInitiatedTime = performance.now();

  /** Guards the abandonment event: a submitted form was not abandoned. */
  isTransactionSubmitted = false;

  data = inject<IV4TransferFundsDialogData>(MAT_DIALOG_DATA, {
    optional: true
  });

  readonly XIcon = X;
  readonly CircleArrowDownIcon = CircleArrowDown;

  // 1 = Bank Account, 2 = Wallet, 3 = Cloud Bank
  isFrom = signal<number>(2);
  isTo = signal<number>(2);
  isSubmitting = signal<boolean>(false);
  isAnyDropdownOpen = signal(false);
  private isHandlingBankVerification = false;
  private isFromBankNewlyCreated = false;
  private isToBankNewlyCreated = false;

  sessionKey = '';
  cloudBankFromId = '';
  cloudBankToId = '';
  transferFromId = '';
  totalAmount = 0;
  selectedFromWallet: { uuId: string; availableBalance: string } | null = null;
  isInsufficientBalanceAlertShowing = false;

  transferFundsForm!: FormGroup;

  // Separate CVA-compatible FormControls for V4 dropdowns
  fromWalletControl = new FormControl<IWalletData | null>(null);
  fromBankControl = new FormControl<IBankDropdown | null>(null);
  toWalletControl = new FormControl<IWalletData | null>(null);
  toBankControl = new FormControl<IBankDropdown | null>(null);
  selectedFromBank: IBankDropdown | null = null;
  selectedToBank: IBankDropdown | null = null;
  selectedToWallet: IWalletData | null = null;

  readonly transferFromTabs = [
    { label: 'Wallet', value: '2' },
    { label: 'Account', value: '1' },
    { label: 'Cloud Bank', value: '3', disabled: true }
  ];

  readonly transferToTabs = [
    { label: 'Wallet', value: '2' },
    { label: 'Account', value: '1' },
    { label: 'Cloud Bank', value: '3', disabled: true }
  ];

  activeFromTab = signal('2');
  activeToTab = signal('2');

  ngOnInit(): void {
    this.transactionInitiatedTime = performance.now();
    this.trackTransactionInitiated();
    this.initTransferForm();
    this.setupDropdownSubscriptions();

    const fromType = this.data?.transferFrom ?? 2;
    this.isFrom.set(fromType);
    this.activeFromTab.set(String(fromType));
    this.transferFromId = this.data?.transferFromId || '';
    if (this.isFrom() === 3) {
      this.setValidatorForCloudBankAmount();
    }
    const toType = fromType === 2 ? 1 : 2;
    this.isTo.set(toType);
    this.activeToTab.set(String(toType));
    if (fromType === 1 && this.transferFromId) {
      setTimeout(() => {
        const partialBank = { id: this.transferFromId } as IBankDropdown;
        this.fromBankControl.setValue(partialBank, { emitEvent: false });
        this.transferFundsForm.patchValue({ transferFrom: partialBank });
        this.selectedFromBank = partialBank;
      });
    }
  }

  private initTransferForm(): void {
    this.transferFundsForm = this.fb.group({
      transferFrom: [null, Validators.required],
      transferTo: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      comment: ['', [Validators.required, Validators.pattern(/.*\S/)]],
      isSameDay: [0],
      totalAmount: ['']
    });
  }

  private setupDropdownSubscriptions(): void {
    this.fromWalletControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wallet) => {
        if (this.selectedFromWallet?.uuId === wallet?.uuId) return;
        if (wallet) {
          this.selectedFromWallet = wallet;
          this.transferFundsForm.patchValue({ transferFrom: wallet });
          this.checkInsufficientBalance();
        } else {
          this.selectedFromWallet = null;
          this.transferFundsForm.patchValue({ transferFrom: null });
        }
      });

    this.fromBankControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank: IBankDropdown | null) => {
        if (this.selectedFromBank?.id === bank?.id) return;
        if (bank) {
          const isNewlyCreated = this.isFromBankNewlyCreated;
          this.isFromBankNewlyCreated = false;
          if (!bank.verified && !isNewlyCreated) {
            if (this.isHandlingBankVerification) return;
            this.isHandlingBankVerification = true;
            this.fromBankControl.reset();
            if (bank.country === 'Canada') {
              this.alertService.warningAlert({
                content:
                  'Verification for Canadian bank accounts is not permitted.'
              });
            } else {
              this.openBankVerifyModal(bank);
            }
            setTimeout(() => {
              this.isHandlingBankVerification = false;
              this.fromBankControl.reset();
            });
            return;
          }
          if (
            !isNewlyCreated &&
            !this.paymentsService.checkBankCanACHV4(bank)
          ) {
            this.fromBankControl.reset();
            return;
          }
          this.selectedFromBank = bank;
          this.transferFundsForm.patchValue({ transferFrom: bank });
        } else {
          this.selectedFromBank = null;
          this.transferFundsForm.patchValue({ transferFrom: null });
        }
      });

    this.toWalletControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wallet) => {
        if (this.selectedToWallet?.uuId === wallet?.uuId) return;
        if (wallet) {
          if (this.isSameWalletSelected(wallet.uuId)) {
            this.showSameWalletAlert();
            this.toWalletControl.reset();
            return;
          }
          this.selectedToWallet = wallet;
          this.transferFundsForm.patchValue({ transferTo: wallet });
        } else {
          this.selectedToWallet = null;
          this.transferFundsForm.patchValue({ transferTo: null });
        }
      });

    this.toBankControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank: IBankDropdown | null) => {
        if (this.selectedToBank?.id === bank?.id) return;
        if (bank) {
          const isNewlyCreated = this.isToBankNewlyCreated;
          this.isToBankNewlyCreated = false;
          if (!bank.verified && !isNewlyCreated) {
            if (this.isHandlingBankVerification) return;
            this.isHandlingBankVerification = true;
            this.toBankControl.reset();
            if (bank.country === 'Canada') {
              this.alertService.warningAlert({
                content:
                  'Verification for Canadian bank accounts is not permitted.'
              });
            } else {
              this.openBankVerifyModal(bank);
            }
            setTimeout(() => {
              this.isHandlingBankVerification = false;
              this.toBankControl.reset();
            });
            return;
          }
          this.selectedToBank = bank;
          this.transferFundsForm.patchValue({ transferTo: bank });
        } else {
          this.selectedToBank = null;
          this.transferFundsForm.patchValue({ transferTo: null });
        }
      });

    this.transferFundsForm.controls.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.checkInsufficientBalance());
  }

  autoPopulateWallet(
    ev: { setItemWithId: (id: string) => void },
    id: string
  ): void {
    if (ev?.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  onFromBankCreated(): void {
    this.isFromBankNewlyCreated = true;
  }

  onToBankCreated(): void {
    this.isToBankNewlyCreated = true;
  }

  onFromTabChange(val: string): void {
    if (val === '3') {
      this.activeFromTab.set(String(this.isFrom()));
      return;
    }
    this.isFrom.set(Number(val));
    this.activeFromTab.set(val);
    this.clearFromAccount();
    if (this.isFrom() === 3) {
      this.setValidatorForCloudBankAmount();
    } else {
      this.transferFundsForm.controls.amount.setValidators([
        Validators.required,
        Validators.min(0.01)
      ]);
      this.transferFundsForm.controls.amount.updateValueAndValidity();
    }
  }

  onToTabChange(val: string): void {
    if (val === '3') {
      this.activeToTab.set(String(this.isTo()));
      return;
    }
    this.isTo.set(Number(val));
    this.activeToTab.set(val);
    this.clearToAccount();
    this.setValidatorForCloudBankAmount();
  }

  private clearFromAccount(): void {
    this.selectedFromWallet = null;
    this.cloudBankFromId = '';
    this.fromWalletControl.reset();
    this.fromBankControl.reset();
    this.transferFundsForm.patchValue({ transferFrom: null });
  }

  private clearToAccount(): void {
    this.cloudBankToId = '';
    this.toWalletControl.reset();
    this.toBankControl.reset();
    this.transferFundsForm.patchValue({ transferTo: null });
  }

  cloudBankFromSelect(event: {
    id: string;
    ocwBankAccountId: string;
    localBankAccountId: string;
  }): void {
    this.transferFundsForm.patchValue({ transferFrom: event.id });
    this.cloudBankFromId = event?.localBankAccountId;
  }

  cloudBankToSelect(event: {
    id: string;
    ocwBankAccountId: string;
    localBankAccountId: string;
  }): void {
    this.transferFundsForm.patchValue({ transferTo: event.id });
    this.cloudBankToId = event?.localBankAccountId;
  }

  setValidatorForCloudBankAmount(): void {
    this.transferFundsForm.controls.amount.clearValidators();
    if (this.isTo() === 3) {
      this.transferFundsForm.controls.amount.setValidators([
        Validators.required,
        Validators.min(10.0)
      ]);
    } else if (this.isFrom() === 3 && this.isTo() === 2) {
      this.transferFundsForm.controls.amount.setValidators([
        Validators.required,
        Validators.min(20.0)
      ]);
    } else {
      this.transferFundsForm.controls.amount.setValidators([
        Validators.required,
        Validators.min(0.01)
      ]);
    }
    this.transferFundsForm.controls.amount.updateValueAndValidity();
  }

  totalAmountCal(): void {
    const amount = this.transferFundsForm.value.amount
      ? this.transferFundsForm.value.amount * 1
      : 0;
    if (amount > 0) {
      const fee = (amount + 0.5 + 1) * 0.03019 + 0.5 + 1;
      let totalAmount = amount + fee;
      totalAmount = parseFloat(totalAmount.toFixed(2));
      this.totalAmount = totalAmount;
      this.transferFundsForm.controls.totalAmount.setValue(totalAmount);
    } else {
      this.transferFundsForm.controls.totalAmount.setValue(0);
    }
  }

  private checkInsufficientBalance(): void {
    if (
      this.isFrom() !== 2 ||
      !this.selectedFromWallet ||
      this.isInsufficientBalanceAlertShowing
    ) {
      return;
    }
    const amount =
      parseFloat(this.transferFundsForm.controls.amount.value) || 0;
    const availableBalance =
      parseFloat(this.selectedFromWallet.availableBalance) || 0;
    if (amount > 0 && amount > availableBalance) {
      this.isInsufficientBalanceAlertShowing = true;
      this.alertService
        .warningAlert({
          content:
            'Insufficient balance on your wallet, please select another wallet.',
          doneMsg: 'OK'
        })
        .afterClosed()
        .subscribe(() => {
          this.isInsufficientBalanceAlertShowing = false;
          this.selectedFromWallet = null;
          this.fromWalletControl.reset();
          this.transferFundsForm.patchValue({ transferFrom: null });
        });
    }
  }

  private isSameWalletSelected(toWalletUuId: string): boolean {
    if (this.isFrom() !== 2 || !this.selectedFromWallet) return false;
    return this.selectedFromWallet.uuId === toWalletUuId;
  }

  private showSameWalletAlert(): void {
    this.alertService.warningAlert({
      content:
        'You cannot transfer funds to the same wallet. Please select a different wallet.',
      doneMsg: 'OK'
    });
  }

  onSubmit(): void {
    this.removeTrailingSpacesInForm();
    this.transferFundsForm.markAllAsTouched();
    this.totalAmountCal();
    if (this.transferFundsForm.invalid) return;

    this.trackTransactionSubmitted();

    this.isSubmitting.set(true);
    const from = this.isFrom();
    const to = this.isTo();

    if (from === 1) {
      if (to === 2) this.fromBankOrCloudToWalletTransfer();
      else if (to === 1) this.fromBankOrCloudToBankTransfer();
      else if (to === 3) this.fromBankToCloudTransfer();
    }
    if (from === 3) {
      if (to === 2) this.fromBankOrCloudToWalletTransfer();
      else if (to === 1) this.fromBankOrCloudToBankTransfer();
      else if (to === 3) this.fromCloudToCloudTransfer();
    }
    if (from === 2) {
      if (to === 2) this.fromWalletToWalletTransfer();
      else if (to === 1) this.fromWalletToBankOrCloudTransfer();
      else if (to === 3) this.fromWalletToBankOrCloudTransfer();
    }
  }

  private fromWalletToWalletTransfer(): void {
    this.walletService
      .transferFunds(this.fromWalletToWalletFormBody())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.onSuccess('Fund transferred successfully');
          } else {
            this.alertService.failedAlert({ content: 'Transfer failed' });
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.error.errorCode === 631) {
            this.dialog.closeAll();
            this.router.navigate(['/v4/manage/verification/index'], {
              queryParams: { openVerificationModal: true }
            });
          }
        }
      });
  }

  private fromBankOrCloudToWalletTransfer(): void {
    const bankAccount = this.transferFundsForm.controls.transferFrom.value;
    if (bankAccount?.verified === 1 && bankAccount?.achApplicationStatus !== 1) {
      this.openWarningToRedirectBankPageModal(
        'This bank account is not approved for ACH. Please check your bank list to see the status.'
      );
      this.isSubmitting.set(false);
      return;
    }
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.walletService
      .fundWallet(this.fromBankOrCloudToWalletFormBody(), headerOptions)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.onSuccess('Fund transferred successfully');
          } else {
            this.alertService.failedAlert({ content: 'Transfer failed' });
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.error.errorCode === 112) {
            this.alertService
              .warningAlert({
                content: err.error.errorMsg,
                doneMsg: 'Verify Now',
                isCancel: true,
                cancelMsg: 'Cancel'
              })
              .afterClosed()
              .subscribe((response: boolean | undefined) => {
                if (response) {
                  this.openBankVerifyModal(
                    this.fromBankOrCloudToWalletFormBody().bankAccount
                  );
                }
              });
          } else if (err.error.errorCode === 1) {
            this.openWarningToRedirectBankPageModal(err.error.errorMsg);
          } else if (err.error.errorCode === 106) {
            this.dialog.closeAll();
            this.router.navigate(['/v4/manage/verification/index'], {
              queryParams: { openVerificationModal: true }
            });
          } else if (err.error?.errorCode === 250) {
            this.alertService
              .warningAlert({
                title: 'Error',
                content: 'Please map your wallet with business',
                doneMsg: 'Map Now',
                cancelMsg: 'Cancel',
                isCancel: true
              })
              .afterClosed()
              .subscribe((res: boolean | undefined) => {
                if (res) this.forceWalletBusinessMapping();
              });
          } else if (err.error.errorCode !== 214) {
            this.alertService.warningAlert({ content: err.error.errorMsg });
          }
        }
      });
  }

  private fromWalletToBankOrCloudTransfer(): void {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.walletService
      .withdrawFunds(this.fromWalletToBankOrCloudFormBody(), headerOptions)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true, 20);
            this.headerService.setHeaderValueChanged(true);
            this.onSuccess('Funds transferred successfully');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.sessionKey = err.error.session_key;
          if (err.error.errorCode === 631) {
            this.dialog.closeAll();
            this.router.navigate(['/v4/manage/verification/index'], {
              queryParams: { openVerificationModal: true }
            });
          }
          if (parseInt(err.error.errorCode, 10) === 112) {
            this.dialog
              .open(OtpModalV4Component, {
                maxWidth: '410px',
                width: '100%',
                panelClass: 'paddingless-modal-rounded',
                disableClose: true,
                autoFocus: false,
                data: err.error
              })
              .afterClosed()
              .subscribe((result) => {
                if (result) this.onSubmit();
              });
          }
        }
      });
  }

  private fromBankToCloudTransfer(): void {
    this.bankService
      .bankToBankTransfer(this.fromBankToCloudFormBody())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.onSuccess('Fund transferred successfully');
        } else {
          this.alertService.failedAlert({ content: 'Transfer failed' });
        }
      });
  }

  private fromBankOrCloudToBankTransfer(): void {
    this.bankService
      .bankToBankTransfer(this.fromBankOrCloudToBankFormBody())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.onSuccess('Fund transferred successfully');
        } else {
          this.alertService.failedAlert({ content: 'Transfer failed' });
        }
      });
  }

  private fromCloudToCloudTransfer(): void {
    this.cloudService
      .cloudBankInternalTransfer(this.fromCloudToCloudFormBody())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.onSuccess('Fund transferred successfully');
        } else {
          this.alertService.failedAlert({ content: 'Transfer failed' });
        }
      });
  }

  // --- Form body builders ---

  private fromWalletToWalletFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromWallet: this.fromWalletControl.value?.uuId ?? '',
      toWallet: this.toWalletControl.value?.uuId ?? '',
      amount: data.amount,
      comment: data.comment
    };
  }

  private fromBankOrCloudToWalletFormBody() {
    const data = this.transferFundsForm.value;
    return {
      bankAccount:
        this.cloudBankFromId && this.isFrom() === 3
          ? this.cloudBankFromId
          : data.transferFrom?.id,
      toWallet: this.toWalletControl.value?.uuId,
      amount: data.amount,
      comment: data.comment,
      bankHolderName: '',
      transactionType: 'ach',
      accountType: 'BUSINESS',
      totalAmount: this.totalAmount,
      digitalSignature: ''
    };
  }

  private fromWalletToBankOrCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromWallet: this.fromWalletControl.value?.uuId ?? '',
      toBankAccountId: !this.cloudBankToId
        ? data.transferTo?.id
        : this.cloudBankToId,
      amount: data.amount,
      comment: data.comment,
      isSameDay: data.isSameDay,
      session_key: this.sessionKey ?? '',
      transfer_method: 'ach'
    };
  }

  private fromBankToCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromAccount: data.transferFrom?.id,
      toAccount: this.cloudBankToId,
      amount: data.amount,
      comment: data.comment
    };
  }

  private fromBankOrCloudToBankFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromAccount:
        this.cloudBankFromId && this.isFrom() === 3
          ? this.cloudBankFromId
          : data.transferFrom?.id,
      toAccount: data.transferTo?.id,
      amount: data.amount,
      comment: data.comment
    };
  }

  private fromCloudToCloudFormBody(): ICloudInternalTransferPayload {
    const data = this.transferFundsForm.value;
    return {
      fromAccount: data.transferFrom,
      toAccount: data.transferTo,
      amount: data.amount ?? 0,
      description: data.comment ?? ''
    } as ICloudInternalTransferPayload;
  }

  // --- Helpers ---

  private onSuccess(message: string): void {
    this.dialog.closeAll();
    this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
      this.walletDataService.transactionUpdated$.next(true);
    });
    this.alertService.successAlert({
      title: 'Success!',
      content: message,
      close: true
    });
  }

  private openBankVerifyModal(bank: IBankDropdown): void {
    this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        bankId: bank.id,
        bankDetails: { verifiedBy: bank.verifiedBy, country: bank.country }
      },
      disableClose: true
    });
  }

  private openWarningToRedirectBankPageModal(contentMsg: string): void {
    this.alertService
      .warningAlert({
        title: 'Error',
        content: contentMsg,
        doneMsg: 'View bank list',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((resEvent: boolean | undefined) => {
        if (resEvent) {
          this.dialog.closeAll();
          this.router.navigateByUrl('/v4/manage/bank-accounts/index');
        }
      });
  }

  private forceWalletBusinessMapping(): void {
    this.dialog
      .open(MapSourceWithBusinessModalV4Component, {
        maxWidth: '430px',
        width: '100%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal',
        data: {
          type: 'wallet',
          wallet: this.toWalletControl.value,
          mapNow: true,
          source: 'wallet-funding'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.success) this.fromBankOrCloudToWalletTransfer();
      });
  }

  private removeTrailingSpacesInForm(): void {
    const comment = this.transferFundsForm.controls.comment.value;
    if (comment) {
      this.transferFundsForm.controls.comment.setValue(comment.trim());
    }
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
      transaction_type: 'internal_transfer',
      is_first_attempt: !overallData?.hasWalletTransfer,
      bank_count: overallData?.bankAccountCount ?? 0
    });
  }

  /**
   * @description Records the confirmed transfer, before the request is
   * dispatched. capture() only: the transaction is pending until the backend
   * answers, so no profile state has changed yet.
   */
  private trackTransactionSubmitted(): void {
    const overallData = this.localStorageService.getItem(
      'overallData'
    ) as IOverallData | null;
    const duration = performance.now() - this.transactionInitiatedTime;

    // isFrom/isTo are signals here, unlike the V3 component's plain numbers.
    const from = this.transferFundsForm.value.transferFrom;
    const to = this.transferFundsForm.value.transferTo;

    this.postHogService.trackTransactionSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'internal_transfer',
      amount: Number(this.transferFundsForm.value.amount) || 0,
      currency: 'USD',
      // No method choice on a wallet-to-wallet move.
      funding_method: 'other',
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before:
        Number(this.selectedFromWallet?.availableBalance) || 0,
      // A bank id belongs to funding and withdrawal only.
      bank_account_id: null,
      source_wallet_id: this.isFrom() === 2 ? from?.uuId ?? null : null,
      destination_wallet_id: this.isTo() === 2 ? to?.uuId ?? null : null,
      is_first_transaction: !overallData?.hasTransacted
    });

    this.isTransactionSubmitted = true;
  }
}

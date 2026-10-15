import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { Router } from '@angular/router';
import { debounceTime, finalize } from 'rxjs/operators';
import { ITransferToItem } from 'src/app/modules/payments/model/payments';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { ICloudAccountDetails2 } from 'src/app/modules/cloud-bank/model/cloudbank';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { ICloudInternalTransferPayload } from 'src/app/data/data/cloud-bank';
import { HttpHeaders } from '@angular/common/http';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { MapSourceWithBusinessModalComponent } from 'src/app/modules/payments/shared/modal/map-source-with-business-modal/map-source-with-business-modal.component';
import { MoEngageService } from 'src/app/core/services/moengage.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { IOverallData } from 'src/app/models/user';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { OtpModalComponent } from '../../../cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { TransferData } from './transfers-data';
import { TransferDetailsService } from '../../services/transfer-details.service';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CloudAccountDropdownV35Component } from '../../../../shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { BankAcDropdownV3Component } from '../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-transfers-main',
  templateUrl: './transfers-main.component.html',
  styleUrls: ['./transfers-main.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    ControlMessageComponent,
    V35ControlMessageComponent,
    CdkTextareaAutosize,
    WalletDropdownV3Component,
    BankAcDropdownV3Component,
    CloudAccountDropdownV35Component,
    MatMenuTrigger,
    MatMenu,
    NgClass,
    NgOptimizedImage,
    FaIconComponent,
    CommonButtonV35Component
  ]
})
export class TransfersMainComponent implements OnInit, OnDestroy {
  /**
   * Injecting dependencies using inject method
   */
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dataTableService = inject(DataTableService);
  private headerService = inject(HeaderService);
  private bankService = inject(BankService);
  private transferDetailsService = inject(TransferDetailsService);
  private paymentsService = inject(PaymentsService);
  private cloudService = inject(CloudBankService);
  private authDataService = inject(AuthDataService);
  private walletDataService = inject(WalletDataV35Service);
  private moengageService = inject(MoEngageService);
  private localStorageService = inject(LocalStorageService);
  private postHogService = inject(PostHogService);
  private scriptService = inject(ScriptService);

  /**
   * Variables
   */
  transferFromId = '';
  transferFromName = '';
  transferToItems = TransferData.getTransferToItems();
  transferFundsForm: FormGroup;
  subscriptions: Subscription[] = [];
  submitting = false;
  disableTooltip: boolean;

  /**
   * - 1 : Bank Account
   * - 2 : Wallet
   * - 3 : Cloud Bank
   */
  isFrom = 2;
  /**
   * - 1 : Bank Account
   * - 2 : Wallet
   * - 3 : Cloud Bank
   */
  isTo = 2;
  fromComponent = ['', 'Account', 'Wallet', 'Cloud Bank'];
  selectedBank: string;
  Empty: string;
  sessionKey: string | undefined;
  totalAmount: number;
  cloudBankFromId = '';
  cloudBankToId = '';
  amountErrorLabel = false;
  accountArray: ICloudAccountDetails2[];
  previousPage = '';
  initialLoading: boolean;
  selectedBankData: IBankDropdown;
  selectedFromWallet: { uuId: string; availableBalance: string } | null = null;
  isInsufficientBalanceAlertShowing = false;
  transactionInitiatedTime = performance.now();
  isTransactionSubmitted = false;
  isOtpDismissed = false;

  ngOnInit(): void {
    this.initialLoading = true;
    this.subscriptions.push(
    this.transferDetailsService
      .getData()
      .pipe(
        finalize(() => {
          this.initialLoading = false;
        })
      )
      .subscribe((res) => {
        this.isFrom = res.transferFrom;
        this.transferFromName = res.displayName || '';
        this.transferFromId = res.transferFromId;
        this.cloudBankFromId = res.transferFromIdForCloud || '';
        this.initTransferForm();
        if(this.isFrom === 2) {
          this.walletTransactionInitiated();
        }
        if (this.isFrom === 3) {
          this.setValidatorForCloudBankAmount();
        }
      })
    );
    this.previousPage = '/manage/bank-accounts/index';
    if (this.isFrom === 2) {
      this.previousPage = '/manage/wallet/transactions';
    } else if (this.isFrom === 3) {
      this.previousPage = '/manage/cloud-bank/index';
    }
    this.getCloudBankAccounts();
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  getCloudBankAccounts() {}

  initTransferForm() {
    this.transferFundsForm = this.fb.group({
      transferFrom: [this.transferFromId, [Validators.required]],
      transferTo: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      totalAmount: [''],
      comment: ['', [Validators.required, Validators.pattern(/.*\S/)]],
      isSameDay: [0]
    });

    this.subscriptions.push(
      this.transferFundsForm.controls.amount.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => {
          this.checkInsufficientBalance();
        })
    );
  }

  setValidatorForCloudBankAmount() {
    this.transferFundsForm.controls.amount.clearValidators();
    if (this.isTo === 3) {
      this.transferFundsForm.controls.amount.setValidators([
        Validators.required,
        Validators.min(10.0)
      ]);
    } else if (this.isTo === 2) {
      this.transferFundsForm.controls.amount.setValidators([
        Validators.required,
        Validators.min(20.0)
      ]);
    } else if (this.isTo === 1) {
      this.transferFundsForm.controls.amount.setValidators([
        Validators.required,
        Validators.min(0.01)
      ]);
    }
    this.transferFundsForm.controls.amount.updateValueAndValidity();
  }

  transferTo(item: ITransferToItem) {
    if(item.transferComponent === 3) return;
    this.clearToAccount();
    this.cloudBankToId = '';
    this.isTo = item?.transferComponent;
    this.setValidatorForCloudBankAmount();
  }

  transferFrom(item: ITransferToItem) {
    if(item.transferComponent === 3) return;
    this.clearFromAccount();
    this.selectedFromWallet = null;
    this.transferFromName = '';
    this.cloudBankFromId = '';
    this.isFrom = item?.transferComponent;
    if (this.isFrom === 3) {
      this.setValidatorForCloudBankAmount();
    }
    if(this.isFrom === 2) {
      this.walletTransactionInitiated();
    }
  }

  clearFromAccount() {
    this.selectedFromWallet = null;
    this.transferFundsForm.controls.transferFrom.reset();
  }

  clearToAccount() {
    this.transferFundsForm.controls.transferTo.reset();
  }

  // Clicking Submit Button
  onSubmit() {
    this.removeTrailingSpacesInForm();
    this.transferFundsForm.markAllAsTouched();
    this.totalAmountCal();
    if (this.transferFundsForm.invalid) {
      return;
    }
    
    this.submitting = true;
    if (this.isFrom === 1) {
      if (this.isTo === 2) {
        this.fromBankOrCloudToWalletTransfer();
      } else if (this.isTo === 1) {
        this.fromBankOrCloudToBankTransfer();
      } else if (this.isTo === 3) {
        this.fromBankToCloudTransfer();
      }
    }
    if (this.isFrom === 3) {
      if (this.isTo === 2) {
        this.fromBankOrCloudToWalletTransfer();
      } else if (this.isTo === 1) {
        this.fromBankOrCloudToBankTransfer();
      } else if (this.isTo === 3) {
        this.fromCloudToCloudTransfer();
      }
    }
    if (this.isFrom === 2) {
      if (this.isTo === 2) {
        this.fromWalletToWalletTransfer();
      } else if (this.isTo === 1) {
        this.fromWalletToBankOrCloudTransfer();
      } else if (this.isTo === 3) {
        this.fromWalletToBankOrCloudTransfer();
      }
    }
  }

  fromBankOrCloudToWalletTransfer() {
    const bankAccount = this.transferFundsForm.controls.transferFrom.value;
    if (bankAccount.verified === 1 && bankAccount.achApplicationStatus !== 1) {
      this.openWarningToRedirectBankPageModal(
        'This bank account is not approved for ACH. Please check your bank list to see the status.'
      );
      this.submitting = false;
      return;
    }
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.walletService
        .fundWallet(this.fromBankOrCloudToWalletFormBody(), headerOptions)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialog.closeAll();
              this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
                // Emit transaction updated to notify components
                this.walletDataService.transactionUpdated$.next(true);
              });
              this.successAlert('Fund transferred successfully');
            } else {
              this.alertService.failedAlert({ content: 'Transfer failed' });
            }
          },
          error: (err) => {
            if (err.error.errorCode === 112) {
              const ref = this.alertService.warningAlert({
                content: err.error.errorMsg,
                doneMsg: 'Verify Now',
                isCancel: true,
                cancelMsg: 'Cancel'
              });

              ref.afterClosed().subscribe((response) => {
                if (response) {
                  this.openBankVerifyModal(
                    this.fromBankOrCloudToWalletFormBody().bankAccount
                  );
                }
              });
            } else if (err.error.errorCode === 1) {
              this.openWarningToRedirectBankPageModal(err.error.errorMsg);
            } else if (err.error.errorCode === 106) {              
              this.authDataService.verifyEmailAndMobile(err.error.errorMsg,undefined,'manage/transfers/index');
            } else if (err.error?.errorCode === 250) {
              this.alertService.warningAlert({
                title: 'Error',
                content: 'Please map your wallet with business',
                doneMsg: 'Map Now',
                cancelMsg: 'Cancel',
                isCancel: true
              }).afterClosed().subscribe((res) => {
                if (res) {
                  this.forceWalletBusinessMapping();
                }
              });

            } else if (err.error.errorCode !== 214) {
              this.alertService.warningAlert({ content: err.error.errorMsg });
            }
          }
        })
    );
  }

  forceWalletBusinessMapping(){
    const dialog = this.dialog.open(MapSourceWithBusinessModalComponent, {
      maxWidth: '430px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal',
      data: {
        type: 'wallet',
        wallet: this.transferFundsForm.value.transferTo,
        mapNow: true,
        source: 'wallet-funding'
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res.success) {
        this.fromBankOrCloudToWalletTransfer();
      }
    });
  }

  openBankVerifyModal(encrypted_bankacc_id: string) {
    this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id },
      disableClose: true
    });
  }

  fromWalletToWalletTransfer() {
    this.transactionSubmitted();
    this.subscriptions.push(
      this.walletService
        .transferFunds(this.fromWalletToWalletFormBody())
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              this.setUserFirstTransactionFlag();
              this.dialog.closeAll();
              this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
                // Emit transaction updated to notify components
                this.walletDataService.transactionUpdated$.next(true);
              });
              this.successAlert('Fund transferred successfully');
            } else {
              this.alertService.failedAlert({ content: 'Transfer failed' });
            }
          },
          (error) => {
            if (error.error.errorCode === 631) {
              this.authDataService.verifyEmailAndMobile(error.error.errorMsg,undefined,'manage/transfers/index');
            }
          }
        )
    );
  }

  fromWalletToBankOrCloudTransfer() {
    if(!this.sessionKey){
      this.transactionSubmitted();
    }
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.subscriptions.push(
      this.walletService
        .withdrawFunds(this.fromWalletToBankOrCloudFormBody(), headerOptions)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.sessionKey = undefined;
              this.setUserFirstTransactionFlag();
              this.dialog.closeAll();
              this.dataTableService.setRefreshStatus(true, 20);
              this.headerService.setHeaderValueChanged(true);
              this.walletDataService.refreshWalletDataAndStore().subscribe(() => {
                // Emit transaction updated to notify components
                this.walletDataService.transactionUpdated$.next(true);
              });
              this.successAlert('Funds transferred Successfully');
            }
          },
          error: (err) => {
            this.sessionKey = err.error.session_key;
            if (err.error.errorCode === 631) {
              this.dialog.closeAll();
              this.authDataService.verifyEmailAndMobile(err.error.errorMsg,undefined,'manage/transfers/index');
            }
            if (parseInt(err.error.errorCode, 10) === 112) {
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
          }
        })
    );
  }

  fromBankToCloudTransfer() {
    this.subscriptions.push(
      this.bankService
        .bankToBankTransfer(this.fromBankToCloudFormBody())
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialog.closeAll();
            this.successAlert('Fund transferred successfully');
          } else {
            this.alertService.failedAlert({ content: 'Transfer failed' });
          }
        })
    );
  }

  fromBankOrCloudToBankTransfer() {
    this.subscriptions.push(
      this.bankService
        .bankToBankTransfer(this.fromBankOrCloudToBankFormBody())
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialog.closeAll();
            this.successAlert('Fund transferred successfully');
          } else {
            this.alertService.failedAlert({ content: 'Transfer failed' });
          }
        })
    );
  }

  fromCloudToCloudTransfer() {
    this.subscriptions.push(
      this.cloudService
        .cloudBankInternalTransfer(this.fromCloudToCloudFormBody())
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialog.closeAll();
            this.successAlert('Fund transferred successfully');
          } else {
            this.alertService.failedAlert({ content: 'Transfer failed' });
          }
        })
    );
  }

  fromWalletToWalletFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromWallet: data.transferFrom.uuId,
      toWallet: data.transferTo.uuId,
      amount: data.amount,
      comment: data.comment
    };
  }

  fromWalletToBankOrCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromWallet: data.transferFrom.uuId,
      toBankAccountId: !this.cloudBankToId
        ? data.transferTo?.id
        : this.cloudBankToId,
      amount: data.amount,
      comment: data.comment,
      isSameDay: data.isSameDay,
      session_key: this.sessionKey ? this.sessionKey : '',
      transfer_method: 'ach'
    };
  }

  fromBankOrCloudToWalletFormBody() {
    const data = this.transferFundsForm.value;
    return {
      bankAccount:
        this.cloudBankFromId && this.isFrom === 3
          ? this.cloudBankFromId
          : data?.transferFrom?.id,
      toWallet: data.transferTo.uuId,
      amount: data.amount,
      comment: data.comment,
      bankHolderName: '',
      transactionType: 'ach',
      accountType: 'BUSINESS',
      totalAmount: this.totalAmount,
      digitalSignature: ''
    };
  }

  fromBankToCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromAccount: data?.transferFrom?.id,
      toAccount: this.cloudBankToId,
      amount: data.amount,
      comment: data.comment
    };
  }

  fromBankOrCloudToBankFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromAccount:
        this.cloudBankFromId && this.isFrom === 3
          ? this.cloudBankFromId
          : data?.transferFrom?.id,
      toAccount: data?.transferTo?.id,
      amount: data?.amount,
      comment: data?.comment
    };
  }

  fromCloudToCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromAccount: data?.transferFrom,
      toAccount: data?.transferTo,
      amount: data?.amount ?? 0,
      description: data?.comment ?? ''
    } as ICloudInternalTransferPayload;
  }

  // Alerts and Pop Ups
  successAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
    this.previousPage = '/manage/bank-accounts/index';
    if (this.isFrom === 2) {
      this.previousPage = '/manage/wallet/transactions';
    } else if (this.isFrom === 3) {
      this.previousPage = '/manage/cloud-bank/index';
    }
    this.router.navigate([this.previousPage]);
  }

  onBackButton() {
    this.router.navigate([this.previousPage]);
  }

  totalAmountCal() {
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

  bankSelect(event: IBankDropdown, transferType: number) {
    this.selectedBankData = event;
    const previousFromValue =
      this.transferFundsForm.controls.transferFrom.value;
    const previousToValue = this.transferFundsForm.controls.transferTo.value;
    if (event?.verified) {
      if (transferType === 2) {
        if (previousToValue !== event.id && previousToValue !== event) {
          this.transferFundsForm.patchValue({
            transferTo: event.id
          });
        }
        return;
      }
      if (this.paymentsService.checkBankCanACH(event)) {
        if (previousFromValue !== event.id && previousToValue !== event) {
          this.transferFundsForm.patchValue({
            transferFrom: event.id
          });
        }
      } else {
        this.transferFundsForm.controls.transferFrom.reset();
      }
    } else {
      if (transferType === 1) {
        this.transferFundsForm.controls.transferFrom.reset();
      } else if (transferType === 2) {
        this.transferFundsForm.controls.transferTo.reset();
      }
      this.paymentsService.verifyBankAccount(event.id);
    }
  }

  walletSelect(event: { uuId: string; availableBalance?: string }, transferType: number) {
    const previousFromValue =
      this.transferFundsForm.controls.transferFrom.value;
    const previousToValue = this.transferFundsForm.controls.transferTo.value;
    if (transferType === 1) {
      if (this.isFrom === 2) {
        this.selectedFromWallet = event as { uuId: string; availableBalance: string };
        this.checkInsufficientBalance();
        if (previousFromValue !== event?.uuId && previousFromValue !== event) {
          this.transferFundsForm.patchValue({
            transferFrom: event.uuId
          });
        }
      }
    } else if (this.isTo === 2) {
      if (this.isSameWalletSelected(event?.uuId)) {
        this.showSameWalletAlert();
        return;
      }
      if (previousToValue !== event?.uuId && previousToValue !== event) {
        this.transferFundsForm.patchValue({
          transferTo: event.uuId
        });
      }
    }
  }

  isSameWalletSelected(toWalletUuId: string): boolean {
    if (this.isFrom !== 2 || !this.selectedFromWallet) {
      return false;
    }
    return this.selectedFromWallet.uuId === toWalletUuId;
  }

  showSameWalletAlert(): void {
    this.alertService.warningAlert({
      content: 'You cannot transfer funds to the same wallet. Please select a different wallet.',
      doneMsg: 'OK'
    });
    this.transferFundsForm.controls.transferTo.reset();
  }

  checkInsufficientBalance(): void {
    if (this.isFrom !== 2 || !this.selectedFromWallet || this.isInsufficientBalanceAlertShowing) {
      return;
    }
    const amount = parseFloat(this.transferFundsForm.controls.amount.value) || 0;
    const availableBalance = parseFloat(this.selectedFromWallet.availableBalance) || 0;
    if (amount > 0 && amount > availableBalance) {
      this.isInsufficientBalanceAlertShowing = true;
      const alertRef = this.alertService.warningAlert({
        content: 'Insufficient balance on your wallet, please select another wallet.',
        doneMsg: 'OK'
      });

      alertRef.afterClosed().subscribe(() => {
        this.isInsufficientBalanceAlertShowing = false;
        this.clearFromWalletSelection();
      });
    }
  }

  clearFromWalletSelection(): void {
    this.selectedFromWallet = null;
    this.transferFundsForm.controls.transferFrom.reset();
  }

  cloudBankSelect(
    event: { id: string; ocwBankAccountId: string; localBankAccountId: string },
    transferType: number
  ) {
    if (transferType === 1) {
      this.transferFundsForm.patchValue({
        transferFrom: event.id
      });
      this.cloudBankFromId = event?.localBankAccountId;
      return;
    }
    this.transferFundsForm.patchValue({
      transferTo: event.id
    });
    this.cloudBankToId = event?.localBankAccountId;
  }

  openWarningToRedirectBankPageModal(contentMsg: string): void {
    const data = {
      title: 'Error',
      content: contentMsg,
      doneMsg: 'View bank list',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.alertService.warningAlert(data);
    res.afterClosed().subscribe((resEvent) => {
      if (resEvent) {
        this.router.navigateByUrl('/manage/bank-accounts/index');
      }
    });
  }

  openVerifyModal(encrypted_bankacc_id: string) {
    this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id },
      disableClose: true
    });
  }

  removeTrailingSpacesInForm() {
    if (this.transferFundsForm.controls.comment.value) {
      this.transferFundsForm.controls.comment.setValue(
        this.transferFundsForm.controls.comment.value.trim()
      );
    }
  }

  /**
   *
   * @param index index of the item
   * @param item The actual data
   * @returns value of the item
   */
  trackByFn(_index: number, item: ITransferToItem): string {
    return item.label;
  }

  // MoEngage Tracking / Helper Functions

  /**
   * @description Gets the exit step for the transaction abandoned.
   */
  private getExitStep(): 'amount_entry' | 'review_confirm' | 'unknown' {
    const { amount, transferFrom, transferTo, comment } = this.transferFundsForm?.value || {};
    const hasAmount = amount && Number(amount) > 0;
    if (!hasAmount) return 'amount_entry';
    if (!transferFrom || !transferTo || !comment) return 'unknown';
    if (this.transferFundsForm.valid) return 'review_confirm';
    return 'unknown';
  }

  /**
   * @description Tracks the wallet transaction initiated
   */
  walletTransactionInitiated() {
    this.transactionInitiatedTime = performance.now();
    const overallData = this.localStorageService.getItem('overallData') as IOverallData;
    const isFirstAttempt = !overallData.hasWalletTransfer;
    this.moengageService.trackWalletPaymentInitiation({
      transaction_type: 'internal_transfer',
      is_first_attempt: isFirstAttempt,
      bank_count: overallData.bankAccountCount
    });

    this.postHogService.trackTransactionInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'internal_transfer',
      is_first_attempt: isFirstAttempt,
      // Always a number: the spec forbids null here.
      bank_count: overallData.bankAccountCount ?? 0
    });
  }

  /**
   * @description Tracks the transaction submitted
   */
  transactionSubmitted() {
    const overallData = this.localStorageService.getItem('overallData') as IOverallData;
    const isFirstTransaction = !overallData.hasTransacted;
    const duration = performance.now() - this.transactionInitiatedTime;
    const sourceWalletId = this.isFrom === 2
      ? this.transferFundsForm.value.transferFrom?.uuId || this.transferFundsForm.value.transferFrom
      : null;
    const destinationWalletId = this.isTo === 2
      ? this.transferFundsForm.value.transferTo?.uuId || this.transferFundsForm.value.transferTo
      : null;
    const amount = Number(this.transferFundsForm.value.amount);
    const walletBalanceBefore = Number(this.selectedFromWallet?.availableBalance ?? 0);
    this.moengageService.trackTransactionSubmitted({
      transaction_type: 'internal_transfer',
      amount: this.moengageService.amountToNotionalValue(amount),
      currency: 'USD',
      funding_method: 'other',
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before: this.moengageService.amountToNotionalValue(walletBalanceBefore),
      bank_account_id: null,
      source_wallet_id: sourceWalletId,
      destination_wallet_id: destinationWalletId,
      is_first_transaction: isFirstTransaction
    });

    // PostHog takes the real figures; isFirstTransaction already reads
    // hasTransacted here, which is what the PostHog spec asks for.
    this.postHogService.trackTransactionSubmitted({
      ...this.postHogService.customerPayloadFromStorage(),
      transaction_type: 'internal_transfer',
      amount,
      currency: 'USD',
      // No method choice on a wallet-to-wallet move.
      funding_method: 'other',
      form_duration_seconds: Math.round(duration / 1000),
      wallet_balance_before: walletBalanceBefore,
      // A bank id belongs to funding and withdrawal only.
      bank_account_id: null,
      source_wallet_id: sourceWalletId,
      destination_wallet_id: destinationWalletId,
      is_first_transaction: isFirstTransaction
    });

    this.isTransactionSubmitted = true;
  }

  /**
   * @description Tracks the transaction abandoned
   */
  transactionAbandoned() {
    const duration = performance.now() - this.transactionInitiatedTime;
    const amount = Number(this.transferFundsForm.value.amount);
    this.moengageService.trackTransactionAbandoned({
      transaction_type: 'internal_transfer',
      form_duration_seconds: Math.round(duration / 1000),
      amount_entered: this.moengageService.amountToNotionalValue(amount),
      funding_method: 'unknown',
      exit_step: this.getExitStep(),
      exit_reason: this.isOtpDismissed ? 'otp_verification' : 'user_exit',
      bank_account_id: null
    });
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
    if (!this.isTransactionSubmitted && this.transferFundsForm && this.isFrom === 2) {
      this.transactionAbandoned();
    }
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}

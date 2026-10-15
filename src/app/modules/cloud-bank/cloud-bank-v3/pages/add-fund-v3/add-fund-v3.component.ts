import { BankService } from 'src/app/shared/service/bank/bank.service';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ICloudAccountDetails2 } from 'src/app/modules/cloud-bank/model/cloudbank';
import { IWalletData } from 'src/app/models/wallet';
import { TransferData } from 'src/app/modules/transfers/pages/transfers-main/transfers-data';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IBankDropdown } from 'src/app/models/bank';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { ITransferToItem } from 'src/app/modules/payments/model/payments';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { ICloudInternalTransferPayload } from 'src/app/data/data/cloud-bank';
import { OtpModalComponent } from '../../../cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CloudAccountDropdownV35Component } from '../../../../../shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { BankAcDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { NgFor, NgClass } from '@angular/common';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-add-fund-v3',
  templateUrl: './add-fund-v3.component.html',
  styleUrls: ['./add-fund-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    ControlMessageComponent,
    CdkTextareaAutosize,
    NgFor,
    NgClass,
    WalletDropdownV3Component,
    BankAcDropdownV3Component,
    CloudAccountDropdownV35Component,
    CommonButtonV35Component
  ]
})
export class AddFundV3Component implements OnInit, OnDestroy {
  /**
   *@description Injecting dependencies using inject method
   */
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dataTableService = inject(DataTableService);
  private headerService = inject(HeaderService);
  private cloudBankService = inject(CloudBankService);
  private paymentsService = inject(PaymentsService);
  private bankService = inject(BankService);

  /**
   * @description Variables
   */
  transferToId = '';
  transferFromName = '';
  transferToItems = TransferData.getTransferToItems();
  transferFundsForm: FormGroup;
  subscriptions: Subscription[] = [];
  submitting = false;
  walletList: IWalletData[];
  disableTooltip: boolean;
  /**
   * - 1 : Bank Account
   * - 2 : Wallet
   * - 3 : Cloud Bank
   */
  isTo = 3;
  selectedBank: string;
  Empty: string;
  sessionKey: string;
  totalAmount: number;
  amountErrorLabel = false;
  accountArray: ICloudAccountDetails2[];
  previousPage = '';
  selectedToId: string;
  selectedTransfertype = 1;
  previouslySelectedBankAccountId = '';
  cloudBankToId = '';

  ngOnInit(): void {
    this.initTransferForm();
    this.getWalletInformation();
    this.previousPage = '/manage/cloud-bank/index';
    this.getCloudBankAccounts();
    this.getSelectedAccountInfo();
  }

  /**
   * @description get cloud bank accounts list.
   */
  getCloudBankAccounts() {}

  /**
   * @description get selected bank account details.
   */
  getSelectedAccountInfo(): void {
    this.subscriptions.push(
      this.cloudBankService.selectedAccountData$.subscribe((res) => {
        if (res?.accountId) {
          this.transferToId = res?.accountId;
          this.cloudBankToId = res?.accountId;
          this.transferFundsForm?.patchValue({ transferTo: this.transferToId });
        }
        if (res?.transferToId) {
          this.transferToId = res?.transferToId;
          this.selectedToId = res?.transferToId;
          this.transferFundsForm?.patchValue({ transferTo: this.selectedToId });
        }
      })
    );
  }

  /**
   * @description initialize the form group.
   */
  initTransferForm() {
    this.transferFundsForm = this.fb.group({
      transferFrom: ['', [Validators.required]],
      wallet: [undefined],
      bank: [undefined],
      cloud: [undefined],
      cloudTo: [undefined],
      totalAmount: [''],
      transferTo: [this.transferToId, [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      comment: ['', [Validators.required, Validators.pattern(/.*\S/)]],
      isSameDay: [0]
    });
  }

  /**
   * @description sets the destination for the transfer.
   * @param item -1 for Bank account, 2 for wallet and 3 for cloud bank account.
   */
  transferTo(item: ITransferToItem) {
    this.isTo = item?.transferComponent;
  }

  /**
   * @description Get Wallet Information
   */
  getWalletInformation() {
    this.subscriptions.push(
      this.walletService.getWalletInformation().subscribe((res) => {
        if (res.success) {
          this.walletList = res.data.map((value) => {
            const wallet = value;
            wallet.displayName = `${value.walletName} (${value.availableBalance}) (${value.bankAccountNumber})`;
            return wallet;
          });
        }
      })
    );
  }

  /**
   * @description resets transferFrom formControl.
   */
  clearFromAccount() {
    this.transferFundsForm.controls.transferFrom.reset();
  }

  /**
   * @description resets transferTo formControl.
   */
  clearToAccount() {
    this.transferFundsForm.controls.transferTo.reset();
  }

  /**
   * @description based on selectedTransfertype and isTo calls different functions.
   */
  onSubmit() {
    this.removeTrailingSpacesInForm();
    this.transferFundsForm.markAllAsTouched();
    if (this.transferFundsForm.invalid) {
      return;
    }
    this.submitting = true;
    if (this.selectedTransfertype === 1 && this.isTo === 3) {
      this.fromCloudToCloudTransfer();
    } else if (this.selectedTransfertype === 2 && this.isTo === 2) {
      this.fromWalletToBankOrCloudTransfer();
    } else if (this.selectedTransfertype === 3 && this.isTo === 1) {
      this.fromBankToCloudTransfer();
    }
  }

  /**
   * @description transfers funds from wallet to bank account or cloud bank account.
   */
  fromWalletToBankOrCloudTransfer() {
    this.subscriptions.push(
      this.walletService
        .withdrawFunds(this.fromWalletToBankOrCloudFormBody())
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe(
          (res) => {
            if (res.success) {
              this.dialog.closeAll();
              this.dataTableService.setRefreshStatus(true, 20);
              this.headerService.setHeaderValueChanged(true);
              this.successAlert('Funds transferred Successfully');
            }
          },
          (err) => {
            this.sessionKey = err.error.session_key;
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
                }
              });
            }
          }
        )
    );
  }

  /**
   * @description transfers funds from bank to cloud bank account.
   */
  fromBankToCloudTransfer() {
    this.subscriptions.push(
      this.bankService
        .bankToBankTransfer(this.fromBankToCloudFormBody())
        .pipe(
          finalize(() => {
            this.submitting = false;
          }),
          catchError((err) => {
            const code = err.error.errorCode;
            if (code === 103 || code === 113 || code === 112 || code === 100) {
              const data = {
                content: err.error.errorMsg
              };
              this.alertService.failedAlert(data);
              if (code === 100) {
                this.amountErrorLabel = true;
              } else {
                this.amountErrorLabel = false;
              }
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (typeof res === 'boolean') return;
          if (res.success) {
            this.successAlert('Funding initiated successfully');
          }
        })
    );
  }

  /**
   * @description transfers funds from cloud bank account to cloud bank account.
   */
  fromCloudToCloudTransfer() {
    this.subscriptions.push(
      this.cloudBankService
        .cloudBankInternalTransfer(this.fromCloudToCloudFormBody())
        .pipe(
          finalize(() => {
            this.submitting = false;
          }),
          catchError((err) => {
            const code = err.error.errorCode;
            if (code === 103 || code === 113 || code === 112 || code === 100) {
              const data = {
                content: err.error.errorMsg
              };
              this.alertService.failedAlert(data);
              if (code === 100) {
                this.amountErrorLabel = true;
              } else {
                this.amountErrorLabel = false;
              }
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (typeof res === 'boolean') return;
          if (res.success) {
            this.successAlert('Funding initiated successfully');
          }
        })
    );
  }

  /**
   * @description creates formbody for from wallet to bank account or cloud bank account transfer.
   */
  fromWalletToBankOrCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromWallet: data.transferFrom,
      toBankAccountId: data?.transferTo,
      amount: data.amount,
      comment: data.comment,
      isSameDay: data.isSameDay,
      session_key: this.sessionKey ? this.sessionKey : '',
      transfer_method: 'ach'
    };
  }

  /**
   * @description creates formbody for from bank account to cloud bank account transfer.
   */
  fromBankToCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      amount: data.amount,
      comment: data.comment,
      fromAccount: data.transferFrom,
      toAccount: data.transferTo
    };
  }

  /**
   * @description creates formbody for from cloud bank account to cloud bank account transfer.
   */
  fromCloudToCloudFormBody() {
    const data = this.transferFundsForm.value;
    return {
      fromAccount: data?.transferFrom,
      toAccount: this.isTo === 3 ? this.cloudBankToId : data?.transferTo,
      amount: data?.amount,
      description: data?.comment
    } as ICloudInternalTransferPayload;
  }

  /**
   * @description shows success alert and sets value of previous page variable.
   * @param content - success alert message.
   */
  successAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
    this.previousPage = '/manage/cloud-bank/index';
    this.router.navigate([this.previousPage]);
  }

  /**
   *@description routes to path stored in previousPage variable.
   */
  onBackButton() {
    this.router.navigate([this.previousPage]);
  }

  /**
   * @description calculates total amount and sets the value in the formgroup.
   */
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

  /**
   * @description checks if the selected bank accont is ACH enabled and verified, then sets the value of the formControl.
   * @param event - selected bank details.
   * @param transferType - transferType sets the transfer from which account. 1 for Cloud bank account, 2 for Wallet and 3 for Bank account.
   */
  bankSelect(event: IBankDropdown, transferType: number) {
    if (
      this.previouslySelectedBankAccountId &&
      this.previouslySelectedBankAccountId === event.id
    ) {
      return;
    }
    this.previouslySelectedBankAccountId = event.id;
    if (
      this.transferFundsForm.controls.transferFrom.value === event?.id ||
      !event?.id
    ) {
      return;
    }
    this.selectedTransfertype = transferType;
    if (event.verified) {
      if (this.paymentsService.checkBankCanACH(event)) {
        this.transferFundsForm.patchValue({
          transferFrom: event.id
        });
      } else {
        this.transferFundsForm.controls.transferFrom.reset();
      }
    } else {
      this.paymentsService.verifyBankAccount(event.id);
    }
  }

  /**
   * @description sets the value of the formControl based on the selected wallet uuId.
   * @param event - selected wallet details.
   * @param transferType - transferType sets the transfer from which account. 1 for Cloud bank account, 2 for Wallet and 3 for Bank account.
   */
  walletSelect(event: { uuId: string }, transferType: number) {
    if (
      !event?.uuId ||
      event?.uuId === this.transferFundsForm.controls.transferFrom.value ||
      !event
    ) {
      return;
    }
    const walletId = event.uuId;
    this.selectedTransfertype = transferType;
    if (this.isTo === 2 && walletId) {
      this.transferFundsForm.patchValue({
        transferFrom: walletId
      });
    }
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description sets the value of the transferFrom formControl based on the selected cloud bank id.
   * @param event - selected cloud bank details.
   * @param transferType - transferType sets the transfer from which account. 1 for Cloud bank account, 2 for Wallet and 3 for Bank account.
   */
  cloudBankSelect(
    event: { id: string; ocwBankAccountId: string; localBankAccountId: string },
    transferType: number
  ) {
    if (
      !event?.id ||
      event.id === this.transferFundsForm.controls.transferFrom.value
    ) {
      return;
    }
    this.selectedTransfertype = transferType;
    this.transferFundsForm.patchValue({
      transferFrom: event.id
    });
  }

  /**
   * @description sets the value of the transferTo formControl based on the selected cloud bank id.
   * @param event - selected cloud bank details.
   */
  toCloudBankSelect(event: { id: string; localBankAccountId: string }) {
    if (
      !event?.localBankAccountId ||
      event.localBankAccountId ===
        this.transferFundsForm.controls.transferTo.value
    ) {
      return;
    }
    this.transferFundsForm.patchValue({
      transferTo: event.localBankAccountId
    });
    this.cloudBankToId = event.id;
  }

  /**
   * @description opens warning modal and redirects on closing the modal.
   * @param contentMsg - warning message string.
   */
  openWarningToRedirectBankPageModal(contentMsg: string): void {
    const data = {
      title: 'Error',
      content: contentMsg,
      doneMsg: 'View bank list',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const alert = this.alertService.warningAlert(data);
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigateByUrl('/manage/bankaccount/index');
      }
    });
  }

  /**
   * @description opens verify bank account modal.
   * @param encrypted_bankacc_id - encrypted bank account id.
   */
  openVerifyModal(encrypted_bankacc_id: string) {
    this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id },
      disableClose: true
    });
  }

  /**
   * @description removes trailing spaces from formControls.
   */
  removeTrailingSpacesInForm() {
    if (this.transferFundsForm.controls.comment.value) {
      this.transferFundsForm.controls.comment.setValue(
        this.transferFundsForm.controls.comment.value.trim()
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}

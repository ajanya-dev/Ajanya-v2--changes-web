import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { ICloudAccountDetails2 } from 'src/app/modules/cloud-bank/model/cloudbank';
import { Subscription } from 'rxjs';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogActions,
  MatDialogState,
  MatDialog
} from '@angular/material/dialog';
import { finalize, take } from 'rxjs/operators';
import { IConfirmAlert } from 'src/app/models/alert';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownCardComponent } from 'src/app/shared/components/drop-downs/drop-down-card/drop-down-card.component';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { Utils } from 'src/app/data/utils';
import {
  IAcc,
  IDefaultPayment,
  IPayAsItem,
  IPayFromItem
} from 'src/app/modules/payments/model/payments';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { CloudAccountDropdownV35Component } from 'src/app/shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { IBankDropdown } from 'src/app/models/bank';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { PaymentData } from '../../payments-main-v35/payments-data-v35';
import { CardsDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { CloudAccountDropdownV35Component as CloudAccountDropdownV35Component_1 } from '../../../../../../shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { WalletDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { BankAcDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MaintenanceAlertModalComponent } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal.component';
import { IHeaderData } from 'src/app/layout/model/header';

/**
 * @description this component is used to set a default payment methode
 */
@Component({
  selector: 'app-default-payment-v3',
  templateUrl: './default-payment-v3.component.html',
  styleUrls: ['./default-payment-v3.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    BankAcDropdownV3Component,
    WalletDropdownV3Component,
    CloudAccountDropdownV35Component_1,
    CardsDropdownV3Component,
    MatDialogActions,
    MatTooltipModule
  ]
})
export class DefaultPaymentV3Component implements OnInit, OnDestroy {
  /** dependancy injection using inject method */

  private paymentService = inject(PaymentsService);
  private localStorageService = inject(LocalStorageService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private matDialog = inject(MatDialogRef);
  cyberSourceService = inject(CybersourceService);
  private bankService = inject(BankAccountsService);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private dialogData: {
    defaultPayments: IDefaultPayment;
    disableMethods: string[];
  } = inject(MAT_DIALOG_DATA);

  @ViewChild('dropDownBank') dropDownBankComponent: DropDownBankComponent;
  @ViewChild('dropDownWallet') dropDownWalletComponent: DropDownWalletComponent;
  @ViewChild('dropDownCloud')
  dropDownZilbankComponent: CloudAccountDropdownV35Component;
  @ViewChild('dropDownCard') dropDownCardComponent: DropDownCardComponent;

  utils = Utils;
  faCircleQuestion=faCircleQuestion;

  payFromItems: IPayFromItem[] = this.utils.deepCopy(
    PaymentData.getPayFromItems()
  );
  subscriptions: Subscription[] = [];
  selectedPayFromItem: IPayFromItem | undefined;
  payAsItems: IPayAsItem[] = [];
  selectedPayAsItem: IPayAsItem | undefined;
  selectedBankAccount: IAcc | undefined;
  accountArray: ICloudAccountDetails2[];
  showDropDown = false;
  paymentAc: IAcc | undefined;
  memo = '';
  isAlertModalOpen = false;

  firstSelect = true;
  loading = false;
  submitLoading = false;
  resetLoading = false;
  payFrom = '';
  cardMaintenanceMessage = '';
  paymentForm: FormGroup = new FormGroup({
    paymentAcControl: new FormControl<IAcc | undefined>(undefined)
  });

  private warningAlertRef?: MatDialogRef<WarningAlertComponent, boolean>;
  
  constructor() {
    this.getHeaderData();
  }


  ngOnInit() {
    this.disablePayItems();
    this.paymentAc = this.dialogData?.defaultPayments?.paymentAc;
    this.getDefaultPayment();
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
  }

  /**
   * @description Disables specific pay items based on the provided disableMethods
   * Iterates through the payFromItems array.
   * If the disableMethods includes the payFromItem id, sets isDisable to true.
   * Iterates through the payOptions of each payFromItem
   * If the disableMethods includes the payAsItem id, sets isDisable to true.
   */
  disablePayItems() {
    this.payFromItems.forEach((payFromItem) => {
      if (this.dialogData?.disableMethods.includes(payFromItem.id)) {
        payFromItem.isDisable = true;
      }
      payFromItem.payOptions?.forEach((payAsItem) => {
        if (this.dialogData?.disableMethods.includes(payAsItem.id)) {
          payAsItem.isDisable = true;
        }
      });
    });
  }

  toggleDropDown() {
    this.showDropDown = !this.showDropDown;
  }

  getHeaderData() {
    this.subscriptions.push(
      this.headerService._headerData.subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.cardMaintenanceMessage = headerData.cardPaymentMaintananceMessage || '';
      })
    );
  }

  /**
   * @description Selects a pay from item based on the provided id and optionally selects a pay as item.
   *  Finds the pay from item with the matching id in the payFromItems array.
   *  Sets the selectedPayFromItem to the found item.
   *  Resets the selectedBankAccount to undefined.
   *  If the item has pay options, sets the payAsItems to the pay options.
   *  If a payAs parameter is provided, selects the corresponding pay as item.
   *  Otherwise, selects the first pay as item in the payAsItems array.
   * @param  id - The id of the pay from item to select.
   * @param  payAs - The id of the pay as item to select (optional).
   */
  payFromSelect(id: string, payAs = '') {

    if (
      id === 'card' &&
      this.localStorageService.getItem('isCreditCardPaymentEnabled') === 0
    ) {
      
      this.dialog.open(MaintenanceAlertModalComponent, {
        panelClass: 'plaid-modal',
        width: 'fit-content',
        data: {
          content: this.cardMaintenanceMessage
        }
      }).afterClosed().pipe(take(1)).subscribe(() => {
        this.payFromSelect('bankaccount');
      });
    }

    const item = this.payFromItems.find((e) => e.id === id);
    this.selectedPayFromItem = item;
    this.selectedBankAccount = undefined;
    if (item?.payOptions !== undefined) {
      this.payAsItems = this.sortActiveFirst(item.payOptions);
      if (payAs !== '') {
        this.payAsSelect(payAs);
      } else {
        this.payAsSelect(this.payAsItems[0]?.id);
      }
    }

    if (id === 'bankaccount') {
      this.payAsItems.forEach((payAsItem) => {
        if (payAsItem?.id === 'virtual-card') {
          payAsItem.isDisable = true;
        }

        if (payAsItem?.id === 'same-ach') {
          payAsItem.isDisable = true;
        }
      });
    }


    if (id === 'card') {
      this.payAsItems.forEach((payAsItem) => {
        if (payAsItem?.id === 'same-ach') {
          payAsItem.isDisable = true;
        }
      });
    }
    
  }

  payAsSelect(id: string) {
    const item = this.payAsItems.find((e) => e.id === id);
    this.selectedPayAsItem = item;
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  accSelect(item: IAcc) {
    const bankAcc = item as IBankDropdown;
    if (
      bankAcc &&
      bankAcc.name === 'Demo Bank Account 1' &&
      bankAcc.bankName === 'Chase Bank' &&
      bankAcc.nickName === 'Demo Bank Account-1'
    ) {
      if (
        !this.warningAlertRef ||
        this.warningAlertRef?.getState() === MatDialogState.CLOSED
      ) {
        this.warningAlertRef = this.alertService.warningAlert({
          content:
            "Demo bank account can't be used to set default payment. Please select a valid bank account."
        });
      }
      this.paymentForm.controls.paymentAcControl.setValue(undefined);
      return;
    }

    if (item !== this.paymentAc) {
      this.paymentAc = item;
    }
  }

  /**
   * @description Checks if selected bank account is approved for ACH.
   * @returns {boolean} Returns true if the bank account is approved for ACH, otherwise false.
   */
  isAchApprovedBank(): boolean {
    if (this.isAlertModalOpen) return false;
    const bank = this.paymentAc as IBankDropdown;
    const payFromSelect = this.selectedPayFromItem;
    const payAsSelect = this.selectedPayAsItem;
    const content =
      'This bank account is not approved for ACH. Please select an ACH approved bank account.';
    if (
     bank && payFromSelect?.id === 'bankaccount' &&
      (payAsSelect?.id === 'ach' || payAsSelect?.id === 'wire') &&
      !bank?.isItZil &&
      bank?.achApplicationStatus !== 1
    ) {
      this.isAlertModalOpen = true;
      this.alertService
        .warningAlert({ content })
        .afterClosed()
        .subscribe(() => {
          this.dropDownBankComponent.clearSelection();
          this.paymentAc = undefined;
          this.isAlertModalOpen = false;
        });
      return false;
    }
    return true;
  }

  /**
   * @description Submits the form data to set the default payment.
   * - Constructs the data object with the selected payFrom, payAs, paymentAc, and memo values.
   * - Calls the setDefaultPayment method of the payment service with the data object.
   * - If the response is successful, displays a success alert and closes the dialog.
   */
  submit() {
    if (!this.isAchApprovedBank()) return;
    this.submitLoading = true;
    const data: { defaultPayment: IDefaultPayment } = {
      defaultPayment: {
        payFrom: this.selectedPayFromItem,
        payAs: this.selectedPayAsItem,
        paymentAc: this.paymentAc,
        memo: this.memo
      }
    };
    this.subscriptions.push(
      this.paymentService
        .setDefaultPayment(data)
        .pipe(
          finalize(() => {
            this.submitLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success === true) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Default payment stored successfully',
                timeout: 3000
              });
              this.matDialog.close(data);
            }
          },
          error: () => {
            this.matDialog.close();
          }
        })
    );
  }

  /**
   * @description Retrieves the default payment details.
   * If defaultPayments is not provided in dialogData, makes an API call to get the default payment details.
   *    Calls the getDefaultPayment method of the payment service.
   * If defaultPayments is provided in dialogData, sets the selectedPayAsItem, selectedPayFromItem, selectedBankAccount, and memo based on the values.
   *    If both payFrom and payAs are available, calls payFromSelect with payFrom and payAs IDs.
   *    If not, selects the first payFrom item.
   */
  getDefaultPayment() {
    if (
      this.dialogData?.defaultPayments === undefined ||
      this.dialogData?.defaultPayments === null
    ) {
      this.loading = true;
      this.subscriptions.push(
        this.paymentService.getDefaultPayment()
        .pipe(finalize(() => {this.loading = false;}))
        .subscribe({
          next: (res) => {
            this.firstSelect = false;
            if (!res?.data?.default_payment_method.payFrom) {
              this.payFromSelect(this.payFromItems[0].id);
              return;
            }
            if (res?.data?.default_payment_method !== null) {
              const ac = res.data.default_payment_method.paymentAc;
              this.selectedPayAsItem = res.data.default_payment_method.payAs;
              if (
                res?.data?.default_payment_method.payFrom?.id === 'bankaccount' &&
                res?.data?.default_payment_method?.paymentAc
              ) {
                this.subscriptions.push(
                  this.bankService
                    .viewBank(res.data.default_payment_method?.paymentAc)
                    .subscribe(() => {
                      this.paymentAc = ac;
                      this.selectedBankAccount = ac;
                    })
                );
              } else {
                setTimeout(() => {
                  this.paymentAc = res.data.default_payment_method.paymentAc;
                  this.selectedBankAccount =
                    res.data.default_payment_method.paymentAc;
                }, 200);
              }

              this.selectedPayFromItem =
                res?.data?.default_payment_method.payFrom;
              if (res?.data?.default_payment_method.payAs) {
                this.payFromSelect(
                  res.data.default_payment_method.payFrom.id,
                  res.data.default_payment_method.payAs.id
                );
              }
              this.memo = res.data.default_payment_method.memo;
            } else {
              this.payFromSelect(this.payFromItems[0].id);
            }
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.payFromSelect(this.payFromItems[0].id);
          }
        })
      );
    } else {
      this.selectedPayAsItem = this.dialogData?.defaultPayments.payAs;
      this.selectedPayFromItem = this.dialogData?.defaultPayments.payFrom;
      this.selectedBankAccount = this.dialogData?.defaultPayments.paymentAc;
      if (
        this.dialogData?.defaultPayments.payFrom &&
        this.dialogData?.defaultPayments.payAs
      ) {
        this.payFromSelect(
          this.dialogData?.defaultPayments.payFrom.id,
          this.dialogData?.defaultPayments.payAs.id
        );
      } else {
        this.payFromSelect(this.payFromItems[0].id);
      }
      this.memo = this.dialogData?.defaultPayments.memo;
    }
  }

  /**
   * @description Resets ther default payment values.
   *  Creates a confirmation alert dialog with the title, content, cancel message, and done message.
   *   If the response is true, proceeds with the reset process.
   *   Clears the selection based on the selected payFromItem.
   *   Sets the selectedPayFromItem to the first payFromItem.
   *   Resets the memo, selectedBankAccount, and paymentAc values.
   *   If the response is successful, shows a success alert and closes the dialog.
   */
  reset() {
    const alertContent: IConfirmAlert = {
      title: 'Confirm',
      content: 'Are you sure you want to reset the settings?',
      cancelMsg: 'Cancel',
      doneMsg: 'Reset',
      isCancel: true,
      isOk: true
    };
    this.alertService
      .confirmAlert(alertContent)
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.resetLoading = true;
          if (this.selectedPayFromItem?.id === 'bankaccount') {
            this.dropDownBankComponent.clearSelection();
          } else if (this.selectedPayFromItem?.id === 'cloud') {
            this.dropDownZilbankComponent.clearValue();
          } else if (this.selectedPayFromItem?.id === 'wallet') {
            this.dropDownWalletComponent.clear();
          } else {
            this.dropDownCardComponent.clearSelection();
          }
          this.payFromSelect(this.payFromItems[0].id);
          (this.memo = ''), (this.selectedBankAccount = undefined);
          this.paymentAc = undefined;
          const data: { defaultPayment: IDefaultPayment } = {
            defaultPayment: {
              payFrom: this.selectedPayFromItem,
              payAs: this.selectedPayAsItem,
              paymentAc: this.paymentAc,
              memo: this.memo
            }
          };
          this.subscriptions.push(
            this.paymentService
              .setDefaultPayment(data)
              .pipe(
                finalize(() => {
                  this.resetLoading = false;
                })
              )
              .subscribe({
                next: (response) => {
                  if (response.success === true) {
                    this.alertService.successAlert({
                      title: 'Success',
                      content: 'Default payment reset successfully',
                      timeout: 2000
                    });
                    this.matDialog.close(data);
                  }
                },
                error: () => {
                  this.matDialog.close();
                }
              })
          );
        }
      });
  }

  /**
   * @description Sorts active items to appear first in the "Pay As" dropdown in the default payment pop-up.
   */

  sortActiveFirst<T extends {isDisable?:boolean,isSelectable?:boolean}>(items:T[]) : T[] {
    return items.slice().sort((a,b) => (a.isDisable ? 1 : 0) - (b.isDisable ? 1 : 0) || (b.isSelectable ? 1 : 0) - (a.isSelectable ? 1 : 0) );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

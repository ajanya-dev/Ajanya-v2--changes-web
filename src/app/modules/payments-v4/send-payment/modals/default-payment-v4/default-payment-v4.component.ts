import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Component, OnInit, inject, OnDestroy, ViewChild } from '@angular/core';
import { ICloudAccountDetails2 } from 'src/app/modules/cloud-bank/model/cloudbank';
import { Subscription } from 'rxjs';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
  MatDialogState,
  MatDialog
} from '@angular/material/dialog';
import { finalize, take } from 'rxjs/operators';
import { IConfirmAlert } from 'src/app/models/alert';
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
import { V4WarningAlertComponent } from 'src/app/shared/alert/v4-components/v4-warning-alert/v4-warning-alert.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PaymentData } from 'src/app/modules/payments/shared/components/payments-main-v35/payments-data-v35';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MaintenanceAlertModalV4Component } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal-v4.component';
import { IHeaderData } from 'src/app/layout/model/header';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { CardsDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/cards-dropdown-v4/cards-dropdown-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-default-payment-v4',
  templateUrl: './default-payment-v4.component.html',
  styleUrl: './default-payment-v4.component.scss',
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    V4CommonDropDownSelectorComponent,
    BankAcDropdownV4Component,
    WalletDropdownV4Component,
    CloudAccountDropdownV35Component,
    CardsDropdownV4Component,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class DefaultPaymentV4Component implements OnInit, OnDestroy {
  private paymentService = inject(PaymentsService);
  private localStorageService = inject(LocalStorageService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private matDialog = inject(MatDialogRef);
  cyberSourceService = inject(CybersourceService);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private dialogData: {
    defaultPayments: IDefaultPayment;
    disableMethods: string[];
  } = inject(MAT_DIALOG_DATA);

  @ViewChild('dropDownBank') dropDownBankComponent: BankAcDropdownV4Component;
  @ViewChild('dropDownWallet') dropDownWalletComponent: WalletDropdownV4Component;
  @ViewChild('dropDownCloud') dropDownZilbankComponent: CloudAccountDropdownV35Component;
  @ViewChild('dropDownCard') dropDownCardComponent: CardsDropdownV4Component;

  readonly XIcon = X;
  utils = Utils;
  faCircleQuestion = faCircleQuestion;

  payFromItems: IPayFromItem[] = this.utils.deepCopy(PaymentData.getPayFromItems()).filter((i: IPayFromItem) => i.id !== 'cloud');
  subscriptions: Subscription[] = [];
  selectedPayFromItem: IPayFromItem | undefined;
  selectedPayFromId = '';
  payAsItems: IPayAsItem[] = [];
  selectedPayAsItem: IPayAsItem | undefined;
  selectedPayAsId = '';

  // Cached filtered arrays to avoid returning new references every CD cycle,
  // which causes infinite loops with signal-input-based dropdown components.
  filteredPayFromItems: IPayFromItem[] = this.payFromItems.filter((i) => !i.isDisable);
  filteredPayAsItems: IPayAsItem[] = [];

  private updateFilteredLists(): void {
    this.filteredPayFromItems = this.payFromItems.filter((i) => !i.isDisable);
    this.filteredPayAsItems = this.payAsItems.filter((i) => !i.isDisable && i.isSelectable !== false);
  }

  readonly payFromDropdownConfig = { displayField: 'label', outputField: 'id', placeholder: 'Select Pay From' };
  readonly payAsDropdownConfig = { displayField: 'label', outputField: 'id', placeholder: 'Select Pay As' };
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
  paymentForm = new FormGroup({
    paymentAcControl: new FormControl<IAcc | undefined>(undefined)
  });

  private warningAlertRef?: MatDialogRef<V4WarningAlertComponent, boolean>;

  constructor() {
    this.getHeaderData();
  }

  ngOnInit() {
    this.disablePayItems();
    this.updateFilteredLists();
    this.paymentAc = this.dialogData?.defaultPayments?.paymentAc;
    this.getDefaultPayment();
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });

    this.subscriptions.push(
      this.paymentForm.controls.paymentAcControl.valueChanges.subscribe((value) => {
        if (value !== null && value !== undefined) {
          this.accSelect(value);
        }
      })
    );
  }

  disablePayItems() {
    // eslint-disable-next-line no-param-reassign
    this.payFromItems.forEach((payFromItem) => {
      if (this.dialogData?.disableMethods.includes(payFromItem.id)) {
        // eslint-disable-next-line no-param-reassign
        payFromItem.isDisable = true;
      }
      payFromItem.payOptions?.forEach((payAsItem) => {
        if (this.dialogData?.disableMethods.includes(payAsItem.id)) {
          // eslint-disable-next-line no-param-reassign
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
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.cardMaintenanceMessage = headerData.cardPaymentMaintananceMessage || '';
      })
    );
  }

  payFromSelect(id: string, payAs = '') {
    this.selectedPayFromId = id;
    if (
      id === 'card' &&
      this.localStorageService.getItem('isCreditCardPaymentEnabled') === 0
    ) {
      this.dialog.open(MaintenanceAlertModalV4Component, {
        panelClass: 'paddingless-modal-rounded',
        width: 'fit-content',
        data: { content: this.cardMaintenanceMessage }
      }).afterClosed().pipe(take(1)).subscribe(() => {
        this.payFromSelect('bankaccount');
      });
    }

    const item = this.payFromItems.find((e) => e.id === id);
    this.selectedPayFromItem = item;
    this.selectedBankAccount = undefined;
    this.paymentAc = undefined;
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
        // eslint-disable-next-line no-param-reassign
        if (payAsItem?.id === 'virtual-card') payAsItem.isDisable = true;
        // eslint-disable-next-line no-param-reassign
        if (payAsItem?.id === 'same-ach') payAsItem.isDisable = true;
      });
    }

    if (id === 'card') {
      this.payAsItems.forEach((payAsItem) => {
        // eslint-disable-next-line no-param-reassign
        if (payAsItem?.id === 'same-ach') payAsItem.isDisable = true;
      });
    }

    this.updateFilteredLists();
  }

  payAsSelect(id: string) {
    const item = this.payAsItems.find((e) => e.id === id);
    this.selectedPayAsItem = item;
    this.selectedPayAsId = item?.id ?? '';
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
          content: "Demo bank account can't be used to set default payment. Please select a valid bank account."
        });
      }
      this.paymentForm.controls.paymentAcControl.setValue(undefined);
      return;
    }

    if (item !== this.paymentAc) {
      this.paymentAc = item;
    }
  }

  isAchApprovedBank(): boolean {
    if (this.isAlertModalOpen) return false;
    const bank = this.paymentAc as IBankDropdown;
    const payFromSelect = this.selectedPayFromItem;
    const payAsSelect = this.selectedPayAsItem;
    const content = 'This bank account is not approved for ACH. Please select an ACH approved bank account.';
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
        .pipe(finalize(() => { this.submitLoading = false; }))
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
          error: () => { this.matDialog.close(); }
        })
    );
  }

  getDefaultPayment() {
    if (
      this.dialogData?.defaultPayments === undefined ||
      this.dialogData?.defaultPayments === null
    ) {
      this.loading = true;
      this.subscriptions.push(
        this.paymentService.getDefaultPayment().subscribe({
          next: (res) => {
            this.firstSelect = false;
            this.loading = false;
            if (!res?.data?.default_payment_method.payFrom) {
              this.payFromSelect(this.payFromItems[0].id);
              return;
            }
            if (res?.data?.default_payment_method !== null) {
              const defaults = res.data.default_payment_method;
              this.selectedPayAsItem = defaults.payAs;
              this.selectedPayFromItem = defaults.payFrom;

              if (defaults.payFrom && defaults.payAs) {
                this.payFromSelect(defaults.payFrom.id, defaults.payAs.id);
              }

              this.applyPaymentAccount(defaults.paymentAc);
              this.memo = defaults.memo;
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
      const defaults = this.dialogData?.defaultPayments;
      this.selectedPayAsItem = defaults.payAs;
      this.selectedPayFromItem = defaults.payFrom;
      if (defaults.payFrom && defaults.payAs) {
        this.payFromSelect(defaults.payFrom.id, defaults.payAs.id);
      } else {
        this.payFromSelect(this.payFromItems[0].id);
      }

      this.applyPaymentAccount(defaults.paymentAc);
      this.memo = defaults.memo;
    }
  }

  /**
   * Restores the payment account after payFromSelect resets it.
   * Uses the form control so the v4 dropdown's writeValue → setItemWithId handles population.
   */
  private applyPaymentAccount(account: IAcc | undefined): void {
    if (!account) return;
    this.paymentAc = account;
    this.selectedBankAccount = account;
    // Let Angular render the dropdown first, then set via form control
    setTimeout(() => {
      this.paymentForm.controls.paymentAcControl.setValue(account);
    });
  }

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
          this.memo = '';
          this.selectedBankAccount = undefined;
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
              .pipe(finalize(() => { this.resetLoading = false; }))
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
                error: () => { this.matDialog.close(); }
              })
          );
        }
      });
  }

  sortActiveFirst<T extends { isDisable?: boolean; isSelectable?: boolean }>(items: T[]): T[] {
    return items.slice().sort(
      (a, b) => (a.isDisable ? 1 : 0) - (b.isDisable ? 1 : 0) ||
                (b.isSelectable ? 1 : 0) - (a.isSelectable ? 1 : 0)
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

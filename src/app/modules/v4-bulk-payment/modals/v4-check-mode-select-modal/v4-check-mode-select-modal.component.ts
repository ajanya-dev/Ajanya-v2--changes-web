import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { filter, finalize, Subscription } from 'rxjs';
import { LucideAngularModule, X, Trash2 } from 'lucide-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';

import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import {
  IBankSource,
  IPayee,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';

interface IZilPaymentListsExtended extends IZilPyamentLists {
  PaymentMethode?: string;
}

@Component({
  selector: 'app-v4-check-mode-select-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    NgSelectModule,
    CommonButtonV4Component,
    MatTooltip
  ],
  templateUrl: './v4-check-mode-select-modal.component.html',
  styleUrl: './v4-check-mode-select-modal.component.scss'
})
export class V4CheckModeSelectModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<V4CheckModeSelectModalComponent>);
  private data: { tab?: string; paymentMode?: string } =
    inject(MAT_DIALOG_DATA);

  v3BulkPaymentService = inject(V3BulkPaymentService);
  private alertService = inject(V4AlertService);
  private checkService = inject(CheckService);
  private headerService = inject(HeaderService);

  /** Set from the header: this account is not offered Direct Deposit. */
  hidesDirectDeposit = signal(false);

  readonly XIcon = X;
  readonly Trash2Icon = Trash2;

  checkPaymentsData: IZilPaymentListsExtended[] = [];
  allSelectedCheckTypes?: string;
  paymentMode: 'all-payments' | 'group-mail' = 'all-payments';
  isProcessing = signal(false);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Reset all dropdown selections on every modal open
    this.v3BulkPaymentService.selectedCheckTypes = [];
    this.allSelectedCheckTypes = undefined;

    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData
        .pipe(filter((data): data is IHeaderData => data !== false))
        .subscribe((data) =>
          this.hidesDirectDeposit.set(data.isRegisteredAfterV2Launch === 1)
        )
    );

    if (this.data?.paymentMode === 'group-mail' || this.data?.tab === 'check') {
      this.paymentMode = 'group-mail';
    }
    this.getPaymentData();
  }

  /**
   * Gets bulk payment data and filters only CHECK + BANK payments.
   */
  getPaymentData(): void {
    this.subscriptions.push(
      this.v3BulkPaymentService.isBulkPaymentsApiReady$.subscribe({
        next: (res) => {
          if (res) {
            this.checkPaymentsData =
              this.v3BulkPaymentService.paymentListData?.filter(
                (obj) =>
                  obj.transferType === 'CHECK' && obj.sourceType === 'BANK'
              ) || [];

            if (this.checkPaymentsData.length) {
              this.checkPaymentsData.sort(
                (a, b) => Number(a.referenceNo) - Number(b.referenceNo)
              );
              this.v3BulkPaymentService.setIsCheckModeSelected(false);
            }

            // Auto-set all to Check Mail in group-mail mode
            if (this.paymentMode === 'group-mail') {
              this.updateAllCheckTypeDropdown('Check Mail');
            }
          }
        }
      })
    );
  }

  /**
   * Bulk update all check payment methods.
   */
  updateAllCheckTypeDropdown(event: string): void {
    const type = event.replace('Check', '');
    const blankChecks = this.checkPaymentsData.filter((item) => !item.payee.id);
    const zilBankChecks = this.checkPaymentsData.filter(
      (item) => (item.source as IBankSource).isItZil
    );
    const chimeBankChecks = this.checkPaymentsData.filter(
      (item) =>
        (item?.source as IBankSource)?.routingNumber === '103100195' ||
        (item?.source as IBankSource)?.routingNumber === '031101279' ||
        (item?.source as IBankSource)?.routingNumber === '084106768'
    );

    if (blankChecks.length && event !== 'Check Print') {
      this.alertService.failedAlert({
        content: `Blank check cannot be ${event === 'Check DD' ? 'Direct deposit' : type}ed, please update the check details.`
      });
    } else if (zilBankChecks.length && event !== 'Check DD') {
      this.alertService.warningAlert({
        content: `This check cannot be ${type}ed. Currently, the Zil account is only set up for ACH/Direct Deposit.`
      });
    } else if (chimeBankChecks.length && event !== 'Check DD') {
      this.alertService.warningAlert({
        content: `This check cannot be ${type}ed. Currently, the Chime account is only set up for ACH/Direct Deposit.`
      });
    }

    this.checkPaymentsData.forEach((check, i) => {
      this.onDropdownChange(
        event,
        i,
        check?.transferId,
        (check?.source as IBankSource)?.routingNumber,
        check.payee,
        false,
        (check?.source as IBankSource)?.isItZil
      );
      this.v3BulkPaymentService.selectedCheckTypes[i] = event;
    });
  }

  /**
   * Handles per-row payment method selection with validation.
   */
  onDropdownChange(
    event: string,
    index: number,
    _transferId: string,
    routingNumber: string,
    payee: IPayee,
    isSingleSelection: boolean,
    isItZil?: number
  ): void {
    if (event !== this.allSelectedCheckTypes) {
      this.allSelectedCheckTypes = undefined;
    }
    const type = event.replace('Check', '');

    // Neo-bank/Chime routing validation
    if (
      (routingNumber === '103100195' ||
        routingNumber === '031101279' ||
        routingNumber === '084106768') &&
      event !== 'Check DD'
    ) {
      if (isSingleSelection) {
        this.alertService.warningAlert({
          content: `This check cannot be ${type}ed. Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
        });
      }
      this.v3BulkPaymentService.selectedCheckTypes[index] = undefined;
      this.checkPaymentsData[index].PaymentMethode = undefined;
      return;
    }

    // Zil bank validation
    if (isItZil && event !== 'Check DD') {
      if (isSingleSelection) {
        this.alertService.warningAlert({
          content: `This check cannot be ${type}ed. Currently, the Zil account is only set up for ACH/Direct Deposit.`
        });
      }
      this.v3BulkPaymentService.selectedCheckTypes[index] = undefined;
      this.checkPaymentsData[index].PaymentMethode = undefined;
      return;
    }

    // Blank payee validation
    if (!payee.id && event !== 'Check Print') {
      if (isSingleSelection) {
        this.alertService.failedAlert({
          content: `Blank check cannot be ${type}ed, please update the check details`
        });
      }
      this.checkPaymentsData[index].PaymentMethode = undefined;
      this.v3BulkPaymentService.selectedCheckTypes[index] = undefined;
      return;
    }

    this.checkPaymentsData[index].PaymentMethode = event;
    this.v3BulkPaymentService.bulkPayChanges$.next(true);
  }

  /**
   * Validates and processes grouped payments — "Done" action.
   */
  payAsGroup(): void {
    this.v3BulkPaymentService.isBulkPayProcessing = true;
    this.v3BulkPaymentService.isBulkCheckProcessing = true;

    if (this.paymentMode === 'group-mail') {
      this.checkPaymentsData.forEach((_, i) => {
        this.checkPaymentsData[i].PaymentMethode = 'Check Mail';
      });
    }

    const noPaymentMethod = this.checkPaymentsData.some(
      (obj) => !obj.PaymentMethode || obj.PaymentMethode.trim() === ''
    );
    if (noPaymentMethod) {
      this.alertService.failedAlert({
        content: 'Please select a payment method for all checks.'
      });
      return;
    }

    this.isProcessing.set(true);

    const checkMailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Mail'
    );
    const checkEmailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Email'
    );
    const checkDDPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check DD'
    );

    if (checkMailPayments.length) {
      const checkUuidList = checkMailPayments
        .filter((r) => r.transferTypeCode === 'check')
        .map((r) => r.transferId);
      this.subscriptions.push(
        this.v3BulkPaymentService
          .getCheckMailDetails({ ids: checkUuidList, is_signature: 1 })
          .pipe(finalize(() => this.isProcessing.set(false)))
          .subscribe({
            next: () => {
              this.v3BulkPaymentService.isCheckPrintProcessing = true;
              this.v3BulkPaymentService.isCheckDDProcessing = true;
              this.groupPaymentsAndClose();
            }
          })
      );
    } else if (checkEmailPayments.length) {
      const checkEmailUuidList = checkEmailPayments
        .filter((r) => r.transferTypeCode === 'check')
        .map((r) => r.transferId);
      this.subscriptions.push(
        this.v3BulkPaymentService
          .getCheckEmailDetails({ ids: checkEmailUuidList })
          .pipe(finalize(() => this.isProcessing.set(false)))
          .subscribe({
            next: () => {
              this.groupPaymentsAndClose();
            }
          })
      );
      this.v3BulkPaymentService.isCheckPrintProcessing = true;
      this.v3BulkPaymentService.isCheckDDProcessing = true;
    } else if (checkDDPayments.length) {
      const checkDDUuidList = checkDDPayments
        .filter((r) => r.transferTypeCode === 'check')
        .map((r) => r.transferId);
      this.subscriptions.push(
        this.checkService
          .getDirectDepostModalData({ cheques: checkDDUuidList })
          .pipe(finalize(() => this.isProcessing.set(false)))
          .subscribe({
            next: () => {
              this.groupPaymentsAndClose();
            }
          })
      );
      this.v3BulkPaymentService.isCheckPrintProcessing = true;
      this.v3BulkPaymentService.isCheckDDProcessing = true;
    } else {
      this.v3BulkPaymentService.isCheckPrintProcessing = true;
      this.v3BulkPaymentService.isCheckDDProcessing = true;
      this.groupPaymentsAndClose();
    }
  }

  /**
   * Groups payments by method, emits to service subjects, and closes dialog.
   */
  private groupPaymentsAndClose(): void {
    const checkEmailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Email'
    );
    const checkMailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Mail'
    );
    const checkPrintPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Print'
    );
    const checkDDPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check DD'
    );

    if (checkEmailPayments.length) {
      this.v3BulkPaymentService.checkEmailPayments.next(checkEmailPayments);
    }
    if (checkMailPayments.length) {
      this.v3BulkPaymentService.checkMailPayments.next(checkMailPayments);
    }
    this.v3BulkPaymentService.checkPrintPayments.next(checkPrintPayments);
    this.v3BulkPaymentService.checkDDPayments.next(checkDDPayments);

    this.checkPaymentsData = [];
    this.v3BulkPaymentService.setIsCheckModeSelected(true);
    this.isProcessing.set(false);
    this.dialogRef.close(true);
  }

  /**
   * Handles X close button click.
   */
  onClose(): void {
    this.showCancelConfirmation();
  }

  /**
   * Handles Cancel button click.
   */
  onCancel(): void {
    this.showCancelConfirmation();
  }

  /**
   * Shows confirmation popup before closing the modal.
   */
  private showCancelConfirmation(): void {
    this.alertService
      .confirmAlert({
        title: 'Confirm',
        content:
          'If you delete or cancel this transaction, the associated payments will not be included.\nDo you want to continue with the remaining payments?',
        doneMsg: 'OK',
        cancelMsg: 'Cancel'
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.dialogRef.close(false);
        }
      });
  }

  /**
   * Removes a payment row. Shows confirmation when deleting the last item.
   */
  removePayment(index: number): void {
    if (this.checkPaymentsData.length === 1) {
      this.alertService
        .confirmAlert({
          title: 'Confirm',
          content:
            'If you delete or cancel this transaction, the associated payments will not be included.\nDo you want to continue with the remaining payments?',
          doneMsg: 'OK',
          cancelMsg: 'Cancel'
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.performRemoval(index);
          }
        });
      return;
    }

    this.performRemoval(index);
  }

  private performRemoval(index: number): void {
    const removedPayment = this.checkPaymentsData[index];
    const removedAmount = removedPayment.amount;

    this.checkPaymentsData.splice(index, 1);
    this.v3BulkPaymentService.selectedCheckTypes.splice(index, 1);

    if (this.v3BulkPaymentService.paymentListData) {
      this.v3BulkPaymentService.paymentListData =
        this.v3BulkPaymentService.paymentListData.filter(
          (p) => p.id !== removedPayment.id
        );
    }

    this.v3BulkPaymentService.totalPaymentAmount.update(
      (a) => a - Number(removedAmount)
    );
    this.v3BulkPaymentService.totalPaymentCount.update((c) => c - 1);

    if (!this.checkPaymentsData.length) {
      this.v3BulkPaymentService.setIsCheckModeSelected(true);
      this.dialogRef.close(false);
    }
  }

  /**
   * Formats date by removing the time portion.
   */
  formatDate(date: string): string {
    return date?.split('_')[0] || date;
  }

  /**
   * Checks if payment method is selected for a row.
   */
  isDropdownValid(index: number): boolean {
    return !!this.checkPaymentsData[index]?.PaymentMethode;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }
}

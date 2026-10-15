import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { CurrencyPipe, NgClass } from '@angular/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, X } from 'lucide-angular';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';

@Component({
  selector: 'app-payroll-summary-modal-v4',
  templateUrl: './payroll-summary-modal-v4.component.html',
  standalone: true,
  imports: [
    NgClass,
    CurrencyPipe,
    CommonButtonV4Component,
    MatDialogClose,
    LucideAngularModule
  ]
})
export class PayrollSummaryModalV4Component implements OnInit, OnDestroy {
  private dialogData = inject(MAT_DIALOG_DATA);
  private payrollService = inject(PayrollService);

  readonly XIcon = X;

  subscriptions: Subscription[] = [];
  paymentAmount = this.dialogData.amount;
  selectedBank = this.dialogData.selectedBank;
  rowData: ICommonTransactionTableData = this.dialogData.rowData;
  status: number;
  statusText: string;
  fee: string;
  grossPay: number | undefined;
  card: IExistingCreditCards | undefined;
  totalAmount: string;
  detailsLoading = true;
  loading = false;
  bankNickName: string;
  bankAccountNumber: string;
  additionalFee: number;
  creditCardFee: number;
  selectedPaymentMethod: number;
  imadNumber: string;

  transactionFeeLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.status = Number(this.rowData.status);
    this.getSelectedPaymentMethod();
    this.getStatusText();
    this.getDetails();
  }

  getSelectedPaymentMethod() {
    this.creditCardFee = this.payrollService.creditCardFee;
    this.subscriptions.push(
      this.payrollService.selectedPaymentMethod.subscribe((res) => {
        this.selectedPaymentMethod = res;
        this.getAdditionalFee(res);
      })
    );
  }

  getDetails() {
    if (this.rowData.transaction_id) {
      this.subscriptions.push(
        this.payrollService
          .getPayrollTransactionDetails(this.rowData.transaction_id)
          .pipe(
            finalize(() => {
              this.detailsLoading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.imadNumber = res.data.metaData.imad ?? '';
              this.card = {
                nickName: res.data.metaData.cardName,
                bgColor: '',
                cardId: '',
                card: '',
                cardMasked: res.data.metaData.cardNumber
              };
              if (this.selectedBank) {
                this.selectedBank.bankAccountNickName =
                  res.data.metaData.bankAccountName;
                this.selectedBank.bankAccountNumber =
                  res.data.metaData.bankAccountNumber;
              } else {
                this.bankNickName = res.data.metaData.bankAccountName;
                this.bankAccountNumber = res.data.metaData.bankAccountNumber;
              }
            }
          })
      );
    } else {
      this.card = this.payrollService.selectedCardId;
      this.detailsLoading = false;
    }
    this.grossPay = this.rowData.gross_pay;
  }

  getTotalAmount(paymentMethod: number) {
    if (
      this.status === 1 ||
      this.status === 2 ||
      this.status === 6
    ) {
      this.totalAmount = (
        Number(this.paymentAmount) + Number(this.rowData.service_fee)
      ).toFixed(2);
      this.fee = Number(this.rowData.service_fee || '0').toFixed(2);
    } else if (paymentMethod === 12) {
      this.fee = String(
        this.calculateRtpFee(Number(this.paymentAmount)).toFixed(2)
      );
      this.totalAmount = (
        Number(this.paymentAmount) + Number(this.fee)
      ).toFixed(2);
    } else {
      this.fee = String(
        (
          (this.paymentAmount * this.creditCardFee) / 100 +
          this.additionalFee
        ).toFixed(2)
      );
      this.totalAmount = (
        Number(this.paymentAmount) + Number(this.fee)
      ).toFixed(2);
    }
  }

  calculateRtpFee(transactionAmount: number): number {
    const percentage = 0.01;
    const minFee = 5.0;
    const maxFee = 30.0;
    const serviceFee = (Number(this.creditCardFee) / 100) * transactionAmount;
    let calculatedFee = transactionAmount * percentage;
    if (calculatedFee < minFee) {
      calculatedFee = minFee;
    } else if (calculatedFee > maxFee) {
      calculatedFee = maxFee;
    }
    return Number(calculatedFee + Number(serviceFee));
  }

  getAdditionalFee(paymentMethod: number) {
    this.transactionFeeLoading.set(true);
    const transferType =
      paymentMethod === 1 ? 'ach' : paymentMethod === 12 ? 'rtp' : 'wire';
    this.subscriptions.push(
      this.payrollService
        .getAdditionalFee({
          transfer_type: transferType,
          transaction_type: 4,
          transaction_amount: Number(this.paymentAmount)
        })
        .pipe(
          finalize(() => {
            this.transactionFeeLoading.set(false);
          })
        )
        .subscribe((res) => {
          this.additionalFee = res.transaction_fee;
          this.getTotalAmount(paymentMethod);
        })
    );
  }

  getStatusText() {
    switch (this.status) {
      case 1:
        this.statusText = 'Processing';
        break;
      case 2:
        this.statusText = 'Completed';
        break;
      case 4:
        this.statusText = 'Failed';
        break;
      case 5:
        this.statusText = 'Automatic Payment';
        break;
      case 6:
        this.statusText = 'Rejected';
        break;
      default:
        this.statusText = '';
    }
  }

  downloadPayment() {
    this.loading = true;
    this.subscriptions.push(
      this.payrollService
        .downloadTransaction(this.rowData.transaction_id as string)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            window.open(res?.data, '_blank');
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import {
  Component,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  signal
} from '@angular/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import {
  Subscription,
  of,
  debounceTime,
  distinctUntilChanged,
  switchMap
} from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { PayrollFeeV4Service } from './payroll-fee-v4.service';

@Component({
  standalone: true,
  selector: 'app-payroll-fee-v4',
  template: `
    @if (fieldType === 'fee') {
      <span>{{ totalFee | currency }}</span>
    } @else {
      <span>{{ totalAmount | currency }}</span>
    }
  `,
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollFeeV4Component
  implements AgRendererComponent, OnInit, OnDestroy
{
  amount: number;
  commonTransactionTableRowData: ICommonTransactionTableData;
  rowIndex: number | null;
  totalFee: number;
  subscriptions: Subscription[] = [];
  additionalFee: number;
  creditCardFee: number;
  status: number;
  fieldType: 'total' | 'fee';
  totalAmount: number;
  selectedPaymentMethod = signal(1);
  changedAmount = signal(0);
  additionalFeeLoading = signal(false);

  private payrollService = inject(PayrollService);
  private payrollFeeService = inject(PayrollFeeV4Service);
  private cdr = inject(ChangeDetectorRef);

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams & { type: 'total' | 'fee' }) {
    this.fieldType = params.type;
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
      this.amount = params.data.gross_pay;
      this.status = params.data.status;
      this.rowIndex = params.node.rowIndex;
      this.getSelectedPaymentMethod();
    }
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.payrollFeeService.newAmount$.subscribe((res) => {
        if (
          res.amount !== undefined &&
          res.rowId &&
          res.rowId === this.commonTransactionTableRowData.id
        ) {
          this.amount = res.amount;
          this.getSelectedPaymentMethod();
          this.cdr.detectChanges();
        }
      })
    );

    this.checkAmountChange();
  }

  getSelectedPaymentMethod() {
    this.creditCardFee = this.payrollService.creditCardFee;
    this.subscriptions.push(
      this.payrollService.selectedPaymentMethod.subscribe((res) => {
        this.selectedPaymentMethod.set(res);
        this.additionalFee =
          this.commonTransactionTableRowData.additional_fee || 0;
        this.calculatePayrollFee(res);
      })
    );
  }

  checkAmountChange() {
    this.subscriptions.push(
      this.payrollService.amountChangeSubject
        .pipe(
          debounceTime(1000),
          distinctUntilChanged(),
          switchMap((res) => {
            if (res.rowIndex === this.rowIndex) {
              this.additionalFeeLoading.set(true);
              this.changedAmount.set(res.amount);
              return this.payrollService.getAdditionalFee({
                transfer_type: this.getTransferType(
                  this.selectedPaymentMethod()
                ),
                transaction_type: 4,
                transaction_amount: Number(res.amount)
              });
            }
            return of(null);
          })
        )
        .subscribe((res) => {
          if (res) {
            this.additionalFee = res.transaction_fee;
            this.totalFee = parseFloat(
              (
                (this.changedAmount() * this.creditCardFee) / 100 +
                this.additionalFee
              ).toFixed(2)
            );
            this.totalAmount = Number(
              (Number(this.totalFee) + Number(this.changedAmount())).toFixed(2)
            );
            this.additionalFeeLoading.set(false);
            this.cdr.detectChanges();
          }
        })
    );
  }

  getTransferType(paymentMethod: number): string {
    switch (paymentMethod) {
      case 1:
        return 'ach';
      case 6:
        return 'wire';
      case 12:
        return 'rtp';
      default:
        return '';
    }
  }

  calculatePayrollFee(paymentMethod: number) {
    if (this.status === 1 || this.status === 2 || this.status === 6) {
      this.totalFee = this.commonTransactionTableRowData.service_fee
        ? parseFloat(this.commonTransactionTableRowData.service_fee)
        : 0;
      this.totalAmount =
        this.commonTransactionTableRowData.service_fee &&
        this.commonTransactionTableRowData.processed_amount
          ? parseFloat(this.commonTransactionTableRowData.service_fee) +
            parseFloat(this.commonTransactionTableRowData.processed_amount)
          : 0;
    } else if (paymentMethod === 12) {
      this.totalFee = this.calculateRtpFee(this.amount);
      this.totalAmount = Number(
        (Number(this.totalFee) + Number(this.amount)).toFixed(2)
      );
    } else {
      this.totalFee = parseFloat(
        ((this.amount * this.creditCardFee) / 100 + this.additionalFee).toFixed(
          2
        )
      );
      this.totalAmount = Number(
        (Number(this.totalFee) + Number(this.amount)).toFixed(2)
      );
    }
  }

  calculateRtpFee(transactionAmount: number): number {
    const percentage = 0.01; // 1% fee
    const minFee = 5.0; // Minimum fee
    const maxFee = 30.0; // Maximum fee

    // Calculate service fee
    const serviceFee = (Number(this.creditCardFee) / 100) * transactionAmount;
    // Calculate fee based on percentage
    let calculatedFee = transactionAmount * percentage;

    // Apply minimum and maximum limits
    if (calculatedFee < minFee) {
      calculatedFee = minFee;
    } else if (calculatedFee > maxFee) {
      calculatedFee = maxFee;
    }

    // Calculate total fee
    const fee = calculatedFee + Number(serviceFee);
    // Round to 2 decimal places and return
    return Number(fee);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

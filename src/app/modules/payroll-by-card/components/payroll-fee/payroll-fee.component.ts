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
import { debounceTime, distinctUntilChanged, of, Subscription, switchMap } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { PayrollService } from '../../services/payroll.service';
import { PayrollFeeService } from './payroll-fee.service';

@Component({
  standalone: true,
  selector: 'app-payroll-fee',
  template: `
  @if (additionalFeeLoading()) {
    <div class="skelton w-full h-6 my-2"></div>
  } @else {
    @if (fieldType === 'fee' ) {
      <p>{{ totalFee | currency }}</p>
      } @else {
        <p>{{ totalAmount | currency }}</p>
      }
    }
  `,
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollFeeComponent
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
  selectedPaymentMethod=signal<number>(0);
  changedAmount = signal<number>(0);
  additionalFeeLoading = signal<boolean>(false);
  isEditableInput = signal<boolean>(false);

  private payrollService = inject(PayrollService);
  private payrollFeeService = inject(PayrollFeeService);
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
      this.isEditableInput.set(params.data.status === 0 || params.data.status === 3);
    }
  }

  /**
   * Initializes the component and subscribes to the `newAmount$` observable
   * from `payrollFeeService`. When a new amount and rowId are emitted, it checks
   * if the `rowId` matches the current row's ID. If they match, it updates the amount,
   * fetches the selected payment method, and triggers change detection.
   */
  ngOnInit(): void {
    this.subscriptions.push(
      this.payrollFeeService.newAmount$.subscribe((res) => {
        if (
          res.amount !== undefined &&
          res.rowId &&
          res.rowId === this.commonTransactionTableRowData.id
        ) {
          this.getSelectedPaymentMethod();
          this.cdr.detectChanges();
        }
      })
    );

    this.checkAmountChange();
  }

  checkAmountChange() {
    this.subscriptions.push(
      this.payrollService.amountChangeSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap((res) => {
          this.amount = res.amount;
          if (res.rowIndex === this.rowIndex && this.isEditableInput()) {
            this.additionalFeeLoading.set(true);
            this.changedAmount.set(res.amount);
            return this.payrollService.getAdditionalFee({
              transfer_type: this.getTransferType(this.selectedPaymentMethod()),
              transaction_type: 4, // 4 is for payroll
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
          this.totalAmount = Number((Number(this.totalFee) + Number(this.changedAmount())).toFixed(2));
          this.additionalFeeLoading.set(false);
          this.cdr.detectChanges();
        }
      })
    );
  }

  /**
   * @description -The function determines the payment method being used and updates the payroll service fee accordingly.
   */
  getSelectedPaymentMethod() {
    this.creditCardFee = this.payrollService.creditCardFee;
    this.subscriptions.push(
      this.payrollService.selectedPaymentMethod.subscribe((res) => {
        this.selectedPaymentMethod.set(res);
        this.additionalFee = this.commonTransactionTableRowData.additional_fee || 0;
        this.calculatePayrollFee(res);
      })
    );
  }

  /**
   * @description -The function determines the payment method being used and updates the payroll service fee accordingly.
   */
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
      this.totalAmount = Number((Number(this.totalFee) + Number(this.amount)).toFixed(2));
    } else {
      this.totalFee = parseFloat(
        ((this.amount * this.creditCardFee) / 100 + this.additionalFee).toFixed(
          2
        )
      );
      this.totalAmount = Number((Number(this.totalFee) + Number(this.amount)).toFixed(2));
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


  getTransferType(paymentMethod: number) {
    switch(paymentMethod) {
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

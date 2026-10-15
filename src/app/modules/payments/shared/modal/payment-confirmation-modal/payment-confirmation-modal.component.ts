import { Component, inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { IRecurringDetails } from 'src/app/modules/payments/model/payments';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuildingColumns,
  faCircleInfo,
  faClockThree,
  faCreditCard,
  faMoneyCheck,
  faUser,
  faWallet,
  faRepeat
} from '@fortawesome/pro-regular-svg-icons';
import { faXmark, faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  standalone: true,
  selector: 'app-payment-confirmation-modal',
  templateUrl: './payment-confirmation-modal.component.html',
  styleUrls: ['./payment-confirmation-modal.component.scss'],
  imports: [FaIconComponent, MatDialogClose, CommonButtonV35Component]
})
export class PaymentConfirmationModalComponent implements OnInit {
  public data: {
    accNumber: string;
    bankName: string;
    payeeName: string;
    paymentMethod: string;
    amount: string | number;
    type?: string;
    shippingType?: string;
    recurringDetails?: IRecurringDetails;
    isPayeeBankVerified?: boolean;
  } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PaymentConfirmationModalComponent>);

  faCross = faXmark;
  faBank = faBuildingColumns;
  faUser = faUser;
  faCard = faCreditCard;
  faClock = faClockThree;
  faInfo = faCircleInfo;
  faWallet = faWallet;
  faCloudBank = faMoneyCheck;
  faRepeat = faRepeat;
  faWarning = faTriangleExclamation;

  paymentMethodTimings = [
    { method: 'USPS_FIRST_CLASS_MAIL', time: '1-5 business days' },
    { method: 'USPS_FIRST_CLASS_WITH_TRACKING', time: '1-5 business days' },
    { method: 'USPS_PRIORITY_MAIL', time: '1-3 business days' },
    { method: 'FEDEX_NEXT_DAY_PM', time: '1 business day' },
    { method: 'USPS_EXPRESS_MAIL', time: '2 business days' },
    { method: 'First Class Canada', time: '1-5 business days' },
    { method: 'Fed Ex Overnight', time: '1 business day' },
    { method: 'Fed Ex Overnight Canada', time: '1 business day' },
    { method: 'International Payment', time: '0-1 business day' },
    { method: 'ACH / Direct Deposit', time: '4-6 business days' },
    { method: 'ACH / ', time: '4-6 business days' },
    { method: 'Check Mail', time: 'Depending on the shipping type.' },
    {
      method: 'Same Day ACH',
      time: '0-1 business day (depending on if submitted before bank closing hours)'
    },
    {
      method: 'Wire',
      time: '0-1 business day (depending on if submitted before bank closing hours)'
    },
    { method: 'Virtual Card', time: 'Instant' },
    { method: 'Real Time Instant Payment', time: 'Instant' },
    { method: 'E-Check', time: 'Instant' },
    { method: 'Check Print', time: 'Instant' },
    { method: 'White Check Print', time: 'Instant' },
    { method: 'Let Vendor Decide', time: 'Instant' },
    { method: 'First class international', time: '7-21 business days' },
    { method: 'Fed Ex International', time: '3-5 business days' },
    {
      method: 'Credit card Rail',
      time: 'Same timing as above depending on how payment is chosen'
    }
  ];

  estimatedTime: string = '';
  shippingType: string = '';

  constructor() {}

  ngOnInit() {
    this.getEstimatedTime();
  }

  getEstimatedTime() {
    let paymentMethod;
    if (!this.data.shippingType) {
      paymentMethod = this.paymentMethodTimings.find(
        (item) => item.method === this.data.paymentMethod
      );
    } else {
      paymentMethod = this.paymentMethodTimings.find(
        (item) => item.method === this.data.shippingType
      );
      this.shippingType = this.data.shippingType!.replace(/_/g, ' ');
    }
    this.estimatedTime = paymentMethod?.time!;
  }

  get iconType() {
    switch (this.data?.type) {
      case 'card':
        return this.faCard;
      case 'wallet':
        return this.faWallet;
      default:
        return this.faBank;
    }
  }

  get paymentTypeLabel(): string {
    switch (this.data?.type) {
      case 'card':
        return 'Credit Card';
      case 'wallet':
        return 'Wallet';
      case 'cloud':
        return 'Cloud Bank';
      default:
        return 'Bank Account';
    }
  }

  get showUnverifiedBankWarning(): boolean {
    return this.data?.isPayeeBankVerified === false;
  }

  /**
   * ACH and Wire transfers are temporarily unavailable from June 23 to June 25
   * due to scheduled maintenance. Surface a notice for those payment methods so
   * the user is informed before confirming.
   */
  get showAchWireMaintenanceNotice(): boolean {
    // const method = this.data?.paymentMethod?.toLowerCase() ?? '';
    // return method.includes('ach') || method.includes('wire');
    return false;
  }

  get hasRecurringDetails(): boolean {
    return !!this.data?.recurringDetails?.is_recurring_value;
  }

  get formattedFrequency(): string {
    if (!this.data?.recurringDetails?.recurring?.frequency) return '';
    
    const frequency = this.data.recurringDetails.recurring.frequency;
    switch (frequency) {
      case '1': return 'Daily';
      case '2': return 'Weekly';
      case '3': return 'Monthly';
      case '5': return 'Biweekly';
      case '6': return 'Bimonthly';
      case '7': return 'Quarterly';
      default: return `Every ${frequency} days`;
    }
  }

  get formattedStartDate(): string {
    if (!this.data?.recurringDetails?.recurring?.start_date) return '';
    return new Date(this.data.recurringDetails.recurring.start_date).toLocaleDateString();
  }

  get formattedPayUntil(): string {
    if (!this.data?.recurringDetails?.recurring?.count || !this.data?.recurringDetails?.recurring?.end_select) return '';
    
    const count = parseInt(this.data.recurringDetails.recurring.count);
    const endSelect = this.data.recurringDetails.recurring.end_select;
    
    if (endSelect === '1') {
      return `${count} payment${count > 1 ? 's' : ''}`;
    } else {
      return 'No end date';
    }
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}

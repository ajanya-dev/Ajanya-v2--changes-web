import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';

/**
 * This component is built to simulate fee calculations based on specific transaction data by mirroring the calculations present in an Excel sheet.
 * To keep consistency and allow easy verification with Excel, variables retain their cell-like naming.
 * The calculations cover three main sections: total summaries, delivery fee computations (with and without subscriptions), and subscription-specific details.
 * Each section is divided into specific methods for improved readability and maintenance.
 *
 * Excel sheet used for calculations, attached on this task: https://zilmoney.atlassian.net/browse/OCW-8604
 */
@Component({
  selector: 'app-fee-calculator',
  standalone: true,
  imports: [CurrencyPipe, NgOptimizedImage, FaIconComponent, MatTooltip,CommonButtonV35Component],
  templateUrl: './fee-calculator.component.html',
  styleUrls: ['./fee-calculator.component.scss']
})
export class FeeCalculatorComponent {
  private alertService = inject(AlertService);

  faCircleExclamation = faCircleExclamation;
  // Define properties for input values (k4-k13, m4-m13) and output values (k15, m15, etc.)
  k4 = 0;
  k5 = 0;
  k6 = 0;
  k7 = 0;
  k8 = 0;
  k9 = 0;
  k11 = 0;
  k12 = 0;
  k13 = 0;
  m4 = 0;
  m5 = 0;
  m6 = 0;
  m7 = 0;
  m8 = 0;
  m9 = 0;
  m11 = 0;
  m12 = 0;
  m13 = 0;
  k15 = 0;
  m15 = 0;
  n15 = 0;
  o15 = 0;
  r4 = 0;
  r5 = 0;
  r6 = 0;

  // Define additional properties for results (n4-n13, o4-o13, r7-r33)
  n4 = 0;
  n5 = 0;
  n6 = 0;
  n7 = 0;
  n8 = 0;
  n9 = 0;
  n11 = 0;
  n12 = 0;
  n13 = 0;
  o4 = 0;
  o5 = 0;
  o6 = 0;
  o7 = 0;
  o8 = 0;
  o9 = 0;
  o11 = 0;
  o12 = 0;
  o13 = 0;
  r7 = 0;
  r8 = 0;
  r10 = 0;
  r11 = 0;
  r12 = 0;
  r13 = 0;
  r21 = 0;
  r22 = 0;
  r23 = 0;
  r24 = 0;
  r26 = 0;
  r27 = 0;
  r29 = 100;
  r30 = 0;
  r31 = 0;
  r32 = 0;
  r33 = 0;

  productName = environment.productName;
  websiteUrl = environment.website;
  environment = environment.env_id;
  processed = false;

  paymentMethods = [
    { id: 'ach',name: 'Approx. Number of ACH', id_count: 'k4', id_amount: 'm4' },
    { id: 'same-day-ach',name: 'Approx. Number of ACH: Same Day', id_count: 'k5', id_amount: 'm5' },
    // { id: 'rtp', name: 'Approx. Number of RTP', id_count: 'k6', id_amount: 'm6' },
    { id: 'wire', name: 'Approx. Number of Wire', id_count: 'k7', id_amount: 'm7' },
    { id: 'intl-wire', name: 'Approx. Number of International Wire', id_count: 'k8', id_amount: 'm8' },
    // { id: 'intl-ach', name: 'Approx. Number of International ACH', id_count: 'k9', id_amount: 'm9' },
    // {  id: 'ups', name: 'Approx. Number of UPS First Class', id_count: 'k11', id_amount: 'm11' },
    // { id: 'fast-check', name: 'Approx. Number of Fast Check 2 Day', id_count: 'k12', id_amount: 'm12' },
    // { id: 'fedex',name: 'Approx. Number of Fedex Next Day', id_count: 'k13', id_amount: 'm13' }
  ];

  mailOptions = [
    {  id: 'ups', name: 'Approx. Number of First-Class Mail', id_count: 'k11', id_amount: 'm11' },
    { id: 'fast-check', name: 'Approx. Number of Priority', id_count: 'k12', id_amount: 'm12' },
    { id: 'fedex',name: 'Approx. Number of FedEx Overnight', id_count: 'k13', id_amount: 'm13' }
  ];

  // Define features
  features = [
    { name: 'ACH', id_count: 'k4', id_amount: 'm4' },
    { name: 'Same Day ACH', id_count: 'k5', id_amount: 'm5' },
    { name: 'RTP', id_count: 'k6', id_amount: 'm6' },
    { name: 'Wire', id_count: 'k7', id_amount: 'm7' },
    { name: 'International Wire', id_count: 'k8', id_amount: 'm8' },
    { name: 'International ACH', id_count: 'k9', id_amount: 'm9' },
    { name: 'UPS First Class', id_count: 'k11', id_amount: 'm11' },
    { name: 'Fast Check 2 Day', id_count: 'k12', id_amount: 'm12' },
    { name: 'Fedex Next Day', id_count: 'k13', id_amount: 'm13' }
  ];

  // Define total summary
  totalSummaryItems = [
    { id: 'k15', name: 'Total Count', value: 0 },
    { id: 'm15', name: 'Total Amount', value: 0.0 },
    { id: 'n15', name: 'Delivery Fee (No Subscription)', value: 0.0 },
    { id: 'o15', name: 'Delivery Fee (Subscription)', value: 0.0 }
  ];

  // Define no subscription fee details
  noSubscriptionFeeDetails = [
    {
      id: 'r5',
      name: 'Total Amount to Deliver',
      value: 0,
      tooltip: 'Amount to be paid to anyone using your credit card'
    },
    {
      id: 'r6',
      name: 'Delivery Fee',
      value: 0,
      tooltip:
        "You may choose to send your beneficiary's payment via wire transfer, ACH, or paper check via USPS or FedEx after charging your credit card. You are responsible for paying this fee of ACH, WIre or Mail cost."
    },
    {
      id: 'r7',
      name: 'The processing fee (2.9%)',
      value: 0,
      tooltip:
        'This charge is imposed by the card network while your card is being processed in order to pay your beneficiaries from the card balance. You are responsible for paying this fee.'
    },
    {
      id: 'r8',
      name: 'Credit Card Rewards ($0.025 per point)',
      value: 0,
      tooltip: ''
    },
    {
      id: 'r10',
      name: 'Tax Write-Off (25% tax rate)',
      value: 0,
      tooltip:
        'The processing fee for your credit card can be deducted as an expense for your tax write-off.'
    },
    {
      id: 'r11',
      name: 'Value of Cash-flow on Hand (30 days, 4% Rebate)',
      value: 0,
      tooltip:
        'Based on the assumption that you pay off the credit card within 30 days, the value of the money received from the credit card'
    },
    {
      id: 'r12',
      name: 'Total Cost to process {$9000.00}',
      value: 0,
      tooltip: 'Card Processing Fee & Delivery Fee'
    },
    {
      id: 'r13',
      name: 'Total Savings',
      value: 0,
      tooltip: 'Earned from your reward + Tax Saving + Value of Cash-flow'
    },
    { id: 'r4', name: 'You Saved', value: 0, tooltip: '' } // This one will be bold
  ];

  // Define subscription fee details
  subscriptionFeeDetails = [
    {
      name: 'Total Amount to Deliver',
      id: 'r21',
      value: 0,
      tooltip: 'Amount to be paid to anyone using your credit card'
    },
    {
      name: 'Delivery Fee',
      id: 'r22',
      value: 0,
      tooltip:
        "You may choose to send your beneficiary's payment via wire transfer, ACH, or paper check via USPS or FedEx after charging your credit card. You are responsible for paying this fee of ACH, WIre or Mail cost."
    },
    {
      name: 'The processing fee (2.9%)',
      id: 'r23',
      value: 0,
      tooltip:
        'This charge is imposed by the card network while your card is being processed in order to pay your beneficiaries from the card balance. You are responsible for paying this fee.'
    },
    {
      name: 'Credit Card Rewards ($0.025 per point)',
      id: 'r24',
      value: 0,
      tooltip: ''
    },
    {
      name: 'Tax Write Off (25% tax rate)',
      id: 'r26',
      value: 0,
      tooltip:
        'The processing fee for your credit card can be deducted as an expense for your tax write-off.'
    },
    {
      name: 'Value of Cash-flow on Hand (30 days, 4% Rebate)',
      id: 'r27',
      value: 0,
      tooltip:
        'Based on the assumption that you pay off the credit card within 30 days, the value of the money received from the credit card'
    },
    { name: 'Platform Fee', id: 'r29', value: 0 },
    { name: 'Extra Credits', id: 'r30', value: 0 },
    {
      name: 'Total Cost to process {$9000.00}',
      id: 'r31',
      value: 0,
      tooltip: 'Card Processing Fee & Delivery Fee'
    },
    {
      name: 'Total Savings',
      id: 'r32',
      value: 0,
      tooltip: 'Earned from your reward + Tax Saving + Value of Cash-flow'
    },
    { name: 'You Saved', id: 'r33', value: 0, tooltip: '' } // This one will be bold
  ];

  /**
   * Validate the maximum value for input fields
   */
  validate(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const maxValue = 100000000;
    const inputValue = parseInt(inputElement.value, 10);
    if (inputValue > maxValue) {
      if (this.processed) {
        return;
      }
      this.processed = true;

      inputElement.value = maxValue.toString();
      this.alertService
        .infoAlert({
          content: `Maximum allowed: ${maxValue.toLocaleString()}`
        })
        .afterClosed()
        .subscribe(() => {
          this.processed = false;
        });
    }
  }

  validateCount(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = parseInt(inputElement.value, 10);
    inputElement.value = value > 0 ? Math.floor(value).toString() : '';
  }

  validateAmount(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const valid = /^\d*\.?\d{0,2}$/.test(inputElement.value);
    if (!valid) inputElement.value = inputElement.value.slice(0, -1);
  }

  /**
   * Perform calculations based on input values
   */
  calculate(event: Event, id: string): void {
    const inputElement = event.target as HTMLInputElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)[id] = Number(inputElement.value) || 0;

    this.calculateTotalSummary();
    this.calculateDeliveryFees();
    this.calculateSubscriptionFees();
    this.calculateTotal();
  }

  private calculateTotalSummary(): void {
    this.k15 =
      this.k4 +
      this.k5 +
      this.k6 +
      this.k7 +
      this.k8 +
      this.k9 +
      this.k11 +
      this.k12 +
      this.k13;
    this.m15 =
      this.m4 * this.k4 +
      this.m5 * this.k5 +
      this.m6 * this.k6 +
      this.m7 * this.k7 +
      this.m8 * this.k8 +
      this.m9 * this.k9 +
      this.m11 * this.k11 +
      this.m12 * this.k12 +
      this.m13 * this.k13;
  }

  private calculateDeliveryFees(): void {
    this.n4 = this.k4;
    this.n5 = Math.min(this.m5 * 0.004, 30) * this.k5;
    this.n6 = Math.min(this.m6 * 0.01, 40) * this.k6;
    this.n7 = (this.m7 * 0.001 + 12) * this.k7;
    this.n8 = (this.m8 * 0.001 + 35) * this.k8;
    this.n9 = this.k9 * 7.5;
    this.n11 = this.k11 * 1.5;
    this.n12 = this.k12 * 15;
    this.n13 = this.k13 * 30;
    this.n15 =
      this.n4 +
      this.n5 +
      this.n6 +
      this.n7 +
      this.n8 +
      this.n9 +
      this.n11 +
      this.n12 +
      this.n13;

    this.o5 = Math.min(this.m5 * 0.005, 12) * this.k5;
    this.o6 = Math.min(this.m6 * 0.005, 10) * this.k6;
    this.o7 = this.k7 * 8;
    this.o8 = this.k8 * 25;
    this.o9 = this.k9 * 5;
    this.o11 = this.k11 * 1.25;
    this.o12 = this.k12 * 12;
    this.o13 = this.k13 * 25;
    this.o15 =
      this.o4 +
      this.o5 +
      this.o6 +
      this.o7 +
      this.o8 +
      this.o9 +
      this.o11 +
      this.o12 +
      this.o13;
  }

  private calculateSubscriptionFees(): void {
    this.r5 = this.m15;
    this.r6 = this.n15;
    this.r7 = this.r5 * 0.029;
    this.r8 = (this.r7 + this.r5) * 0.025;
    this.r10 = this.r7 * 0.25 + this.r6 * 0.25;
    this.r11 = (this.r5 * 0.04) / 12;
    this.r12 = this.r6 + this.r7;
    this.r13 = this.r8 + this.r10 + this.r11;
    this.r4 = Math.round(Math.abs(this.r13 - this.r12));

    this.r21 = this.m15;
    this.r22 = Math.max(this.o15 - 100, 0);
    this.r23 = this.r21 * 0.029;
    this.r24 = (this.r23 + this.r21) * 0.025;
    this.r26 =
      (this.r23 || 0) === 0 && (this.r22 || 0) === 0
        ? 0
        : this.r23 * 0.25 + this.r22 * 0.25 + 100 * 0.25;
    this.r27 = (this.r21 * 0.04) / 12;
    this.r29 = this.k15 === 0 ? 0 : 100;
    this.r30 = Math.max(-(this.o15 - this.r29), 0);
    this.r31 = this.r29 + this.r23 + this.r22;
    this.r32 = this.r24 + this.r26 + this.r27 + this.r30;
    this.r33 = Math.round(Math.abs(this.r32 - this.r31));
  }

  calculateTotal(): void {
    this.totalSummaryItems[0].value = this.k15;
    this.totalSummaryItems[1].value = this.m15;
    this.totalSummaryItems[2].value = this.n15;
    this.totalSummaryItems[3].value = this.o15;

    this.noSubscriptionFeeDetails[0].value = this.r5;
    this.noSubscriptionFeeDetails[1].value = this.r6;
    this.noSubscriptionFeeDetails[2].value = this.r7;
    this.noSubscriptionFeeDetails[3].value = this.r8;
    this.noSubscriptionFeeDetails[4].value = this.r10;
    this.noSubscriptionFeeDetails[5].value = this.r11;
    this.noSubscriptionFeeDetails[6].value = this.r12;
    this.noSubscriptionFeeDetails[7].value = this.r13;
    this.noSubscriptionFeeDetails[8].value = this.r4;

    this.subscriptionFeeDetails[0].value = this.r21;
    this.subscriptionFeeDetails[1].value = this.r22;
    this.subscriptionFeeDetails[2].value = this.r23;
    this.subscriptionFeeDetails[3].value = this.r24;
    this.subscriptionFeeDetails[4].value = this.r26;
    this.subscriptionFeeDetails[5].value = this.r27;
    this.subscriptionFeeDetails[6].value = this.r29;
    this.subscriptionFeeDetails[7].value = this.r30;
    this.subscriptionFeeDetails[8].value = this.r31;
    this.subscriptionFeeDetails[9].value = this.r32;
    this.subscriptionFeeDetails[10].value = this.r33;
  }

  openLink(): void {
    window.open(this.websiteUrl, '_blank');
  }

  reset(){
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to reset? All changes will be lost.',
      doneMsg:'Yes'
    });
   alert.afterClosed().subscribe(res => {
     if(res){
       this.resetForm();
     }
   });
  }

  resetForm(): void {
    // Type-safe way to reset numeric properties
    const propertiesToReset = {
      k4: 0, k5: 0, k6: 0, k7: 0, k8: 0, k9: 0, k11: 0, k12: 0, k13: 0,
      m4: 0, m5: 0, m6: 0, m7: 0, m8: 0, m9: 0, m11: 0, m12: 0, m13: 0,
      k15: 0, m15: 0, n15: 0, o15: 0,
      r4: 0, r5: 0, r6: 0, r7: 0, r8: 0, r10: 0, r11: 0, r12: 0, r13: 0,
      r21: 0, r22: 0, r23: 0, r24: 0, r26: 0, r27: 0,
      r29: 100, // Special case
      r30: 0, r31: 0, r32: 0, r33: 0,
      n4: 0, n5: 0, n6: 0, n7: 0, n8: 0, n9: 0, n11: 0, n12: 0, n13: 0,
      o4: 0, o5: 0, o6: 0, o7: 0, o8: 0, o9: 0, o11: 0, o12: 0, o13: 0
    };
  
    // Reset all properties explicitly
    (Object.keys(propertiesToReset) as Array<keyof typeof propertiesToReset>).forEach(key => {
      this[key] = propertiesToReset[key];
    });
  
    // Clear all input fields
    const inputElements = this.getInputElements();
    inputElements.forEach(input => {
      // eslint-disable-next-line no-param-reassign
      input.value = '';
    });
  
    // Recalculate totals
    this.calculateTotalSummary();
    this.calculateDeliveryFees();
    this.calculateSubscriptionFees();
    this.calculateTotal();
  }
  
  private getInputElements(): HTMLInputElement[] {
    const paymentInputs = this.paymentMethods.flatMap(method => [
      document.getElementById(`${method.id}-count`) as HTMLInputElement,
      document.getElementById(`${method.id}-amount`) as HTMLInputElement
    ]);
    
    const mailInputs = this.mailOptions.flatMap(method => [
      document.getElementById(`${method.id}-count`) as HTMLInputElement,
      document.getElementById(`${method.id}-amount`) as HTMLInputElement
    ]);
  
    const cardAmountInput = document.getElementById('card-amount') as HTMLInputElement;
    
    return [cardAmountInput, ...paymentInputs, ...mailInputs].filter(Boolean);
  }

}

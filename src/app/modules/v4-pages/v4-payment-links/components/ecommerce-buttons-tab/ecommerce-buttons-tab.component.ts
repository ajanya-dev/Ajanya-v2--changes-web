import { Component, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { IPaymentButtons } from 'src/app/modules/payment-link/pages/payment-settings/paymentButtons.data';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { FormsModule } from '@angular/forms';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface ButtonStyle {
  label: string;
  bg: string;
}

@Component({
  selector: 'app-v4-ecommerce-buttons-tab',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltip,
    FormsModule,
    CommonAmountInputV4Component,
    CommonButtonV4Component
  ],
  templateUrl: './ecommerce-buttons-tab.component.html',
  styleUrls: ['./ecommerce-buttons-tab.component.scss']
})
export class EcommerceButtonsTabComponent {
  private clipboard = inject(Clipboard);

  buttons = input<IPaymentButtons[]>([]);
  selectedIndex = input(0);
  selectedButtonDetails = input<IPaymentButtons | undefined>(undefined);

  selectButton = output<number>();
  updateAmount = output<string | undefined>();

  amountValue = '';
  appliedAmount = signal('');
  copiedButton = signal(false);
  copiedWidget = signal(false);
  copiedSnippet = signal(false);

  buttonStyles: ButtonStyle[] = [
    { label: 'PAY NOW', bg: '#16a34a' },
    { label: 'PAY BY STRIPE', bg: '#635BFF' },
    { label: 'PAY BY CARD', bg: '#3C4858' },
    { label: 'PAY BY BITPAY', bg: '#1A3B5D' },
    { label: 'PAY BY CHECK', bg: '#0D7377' },
    { label: 'DONATE NOW', bg: '#2563EB' }
  ];

  tooltips = {
    button: 'Select the button on the right side to generate the code. When you copy and paste this code, a button will be displayed. Upon clicking it, a new window will open and the form will be displayed.',
    widget: 'Select the button on the right side to generate the code. Once you copy and paste this code, a button will be displayed. Click it to open a modal inside your website.',
    snippet: 'Use this JavaScript snippet to initialize the payment widget programmatically on your website.'
  } as const;

  onSelectButton(index: number) {
    this.selectButton.emit(index);
  }

  addAmount() {
    const val = this.amountValue.trim();
    if (!val) return;
    this.appliedAmount.set(val);
    this.updateAmount.emit(val);
  }

  clearAmount() {
    this.amountValue = '';
    this.appliedAmount.set('');
    this.updateAmount.emit(undefined);
  }

  copyCode(text: string, type: 'button' | 'widget' | 'snippet') {
    this.clipboard.copy(text);
    if (type === 'button') {
      this.copiedButton.set(true);
      setTimeout(() => this.copiedButton.set(false), 2000);
    } else if (type === 'widget') {
      this.copiedWidget.set(true);
      setTimeout(() => this.copiedWidget.set(false), 2000);
    } else {
      this.copiedSnippet.set(true);
      setTimeout(() => this.copiedSnippet.set(false), 2000);
    }
  }
}

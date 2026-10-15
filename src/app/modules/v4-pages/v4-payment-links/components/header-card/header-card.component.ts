import { Component, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { SelectedPaymentLink } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import {
  getPaymentLinkStatus,
  STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  PaymentLinksMethods
} from '../../models/v4-payment-links.model';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
@Component({
  selector: 'app-v4-header-card',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltip,
    CommonButtonV4Component
  ],
  templateUrl: './header-card.component.html',
  styleUrls: ['./header-card.component.scss']
})
export class HeaderCardComponent {
  link = input.required<SelectedPaymentLink>();
  isArchived = input<boolean>(false);
  busy = input<boolean>(false);

  edit = output<void>();
  preview = output<void>();
  duplicate = output<void>();
  share = output<void>();
  toggleStatus = output<boolean>();
  customizeNotification = output<void>();
  archive = output<void>();

  copied = signal(false);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  PAYMENT_METHOD_CONFIG = PAYMENT_METHOD_CONFIG;

  get fullUrl(): string {
    return `${this.staticWhiteLabelConditions.paymentShortLink}/${this.link().shortUrl}`;
  }

  get receivedToValue(): string {
    return (
      this.link().bankAccount?.bankAccountNickName ||
      this.link().bankAccount?.bankName ||
      ''
    );
  }

  get isActive(): boolean {
    return getPaymentLinkStatus(this.link()) === 'active';
  }

  get statusConfig() {
    return STATUS_CONFIG[getPaymentLinkStatus(this.link())];
  }

  get paymentMethods(): PaymentLinksMethods[] {
    const methods: PaymentLinksMethods[] = ['CHECK'];
    const opts = this.link().paymentOptionAsArray;
    if (!opts) {
      // If creditCardFormToken exists, credit card is globally enabled
      if (this.link().creditCardFormToken) methods.push('CREDIT_CARD');
      return methods;
    }

    for (const key of Object.keys(opts)) {
      const opt = opts[key as `${number}`];
      if (opt && (opt.status === 1 || opt.status === '1')) {
        const id = Number(key);
        if (id === 1) methods.push('CREDIT_CARD');
        else if (id === 2) methods.push('PAYPAL');
        else if (id === 3) methods.push('BITPAY');
        else if (id === 4) methods.push('STRIPE');
      }
    }

    // Ensure CREDIT_CARD is included if token exists but wasn't in paymentOptionAsArray
    if (this.link().creditCardFormToken && !methods.includes('CREDIT_CARD')) {
      methods.push('CREDIT_CARD');
    }

    return methods;
  }

  async copyUrl() {
    try {
      await navigator.clipboard.writeText(this.fullUrl);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch { /* noop */ }
  }

  onToggle(checked: boolean) {
    if (this.busy()) return;
    this.toggleStatus.emit(checked);
  }
}

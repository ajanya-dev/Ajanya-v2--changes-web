import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleLeft, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { PaymentLinksPreviewBannerComponent } from '../payment-links-preview-banner/payment-links-preview-banner.component';
import {
  BannerDataInput,
  PaymentLinksMethods,
  PaymentsDetailsInput
} from '../../models/payment-links.model';
import { PaymentLinksPreviewPaymentsComponent } from '../payment-links-preview-payments/payment-links-preview-payments.component';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-payment-links-preview',
  standalone: true,
  imports: [
    PaymentLinksPreviewBannerComponent,
    FaIconComponent,
    PaymentLinksPreviewPaymentsComponent,
    NgStyle
  ],
  templateUrl: './payment-links-preview.component.html',
  styleUrl: './payment-links-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentLinksPreviewComponent {
  baseSize = input<`${number}rem`>('1rem');

  faAngleLeft = faAngleLeft;
  faXmark = faXmark;

  config = input.required<
    | {
        companyName: string;
        paymentMethods: PaymentLinksMethods[];
        companyNameNeeded: boolean;
        logo?: File | string;
      }
    | undefined
  >();

  bannerData = computed<BannerDataInput | undefined>(() => {
    const inputData = this.config();
    if (!inputData) return undefined;

    return {
      amount: this.amount(),
      logo: inputData.logo,
      companyName: inputData.companyName
    };
  });

  amount = signal(0);

  paymentsConfig = computed<PaymentsDetailsInput | undefined>(() => {
    const inputData = this.config();
    if (!inputData) return undefined;

    return {
      card: inputData.paymentMethods.includes('DEBIT_CARD'),
      creditCard: inputData.paymentMethods.includes('CREDIT_CARD'),
      bitpay: inputData.paymentMethods.includes('BITPAY'),
      paypal: inputData.paymentMethods.includes('PAYPAL'),
      stripe: inputData.paymentMethods.includes('STRIPE'),
      companyNameNeeded: inputData.companyNameNeeded
    };
  });

  constructor() {
    effect(() => {});
  }

  updateAmount(amount: number) {
    this.amount.update(() => amount);
  }

  validatePayementMethode(
    data: PaymentLinksMethods[],
    method: PaymentLinksMethods
  ) {
    return data.includes(method);
  }
}

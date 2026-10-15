import { Component, input, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentLinksMethods
} from '../../models/v4-payment-links.model';

@Component({
  selector: 'app-v4-live-preview',
  standalone: true,
  imports: [LucideAngularModule, DecimalPipe],
  templateUrl: './live-preview.component.html',
  styleUrls: ['./live-preview.component.scss']
})
export class LivePreviewComponent {
  name = input('');
  companyName = input('');
  amount = input(0);
  logo = input<File | string | null>(null);
  paymentMethods = input<PaymentLinksMethods[]>(['CHECK']);

  PAYMENT_METHOD_CONFIG = PAYMENT_METHOD_CONFIG;
  logoPreview = signal<string | null>(null);

  constructor() {
    effect(() => {
      const l = this.logo();
      if (l instanceof File) {
        const reader = new FileReader();
        reader.onload = () => this.logoPreview.set(reader.result as string);
        reader.readAsDataURL(l);
      } else if (typeof l === 'string' && l) {
        this.logoPreview.set(l);
      } else {
        this.logoPreview.set(null);
      }
    });
  }
}

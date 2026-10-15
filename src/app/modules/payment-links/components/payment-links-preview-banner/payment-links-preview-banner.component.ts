import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import type { BannerDataInput } from '../../models/payment-links.model';

@Component({
  selector: 'app-payment-links-preview-banner',
  standalone: true,
  imports: [CurrencyPipe, NgOptimizedImage],
  templateUrl: './payment-links-preview-banner.component.html',
  styleUrl: './payment-links-preview-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentLinksPreviewBannerComponent {
  bannerData = input.required<BannerDataInput | undefined>();

  imageSrc = computed(() => {
    const logo = this.bannerData()?.logo;
    if (!logo) return undefined;

    if (typeof logo === 'string') return logo;

    return URL.createObjectURL(logo);
  });
}

import { Component, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SelectedPaymentLink } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { PaymentLinksPreviewComponent } from 'src/app/modules/payment-links/components/payment-links-preview/payment-links-preview.component';
import { PaymentLinksMethods } from 'src/app/modules/payment-links/models/payment-links.model';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-preview-drawer',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip, PaymentLinksPreviewComponent, CommonButtonV4Component],
  templateUrl: './preview-drawer.component.html',
  styleUrls: ['./preview-drawer.component.scss']
})
export class PreviewDrawerComponent {
  private clipboard = inject(Clipboard);
  private v4AlertService = inject(V4AlertService);

  link = input.required<SelectedPaymentLink>();

  close = output<void>();
  share = output<void>();

  copied = signal(false);

  get fullUrl(): string {
    return `${StaticWhiteLabelConditions.paymentShortLink}/${this.link().shortUrl}`;
  }

  get qrCodeUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=20319D&data=${encodeURIComponent(this.fullUrl)}`;
  }

  get previewConfig() {
    const link = this.link();
    const methods = this.getPaymentMethods();
    return {
      companyName: link.companyName || link.name,
      paymentMethods: methods,
      companyNameNeeded: false,
      logo: link.logoUrl ?? undefined
    };
  }

  private getPaymentMethods(): PaymentLinksMethods[] {
    const methods: PaymentLinksMethods[] = ['CHECK'];
    const opts = this.link().paymentOptionAsArray;

    if (opts) {
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
    }

    if (this.link().creditCardFormToken && !methods.includes('CREDIT_CARD')) {
      methods.push('CREDIT_CARD');
    }

    return methods;
  }

  copyUrl() {
    this.clipboard.copy(this.fullUrl);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  async downloadQr() {
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&color=20319D&data=${encodeURIComponent(this.fullUrl)}`;

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const sanitizedName = this.link().name
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase() || 'code';

      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-link-qr-${sanitizedName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.v4AlertService.successAlert({ content: 'QR code downloaded.' });
    } catch {
      window.open(downloadUrl, '_blank');
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('drawer-backdrop')) {
      this.close.emit();
    }
  }
}

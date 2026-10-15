import { Injectable, signal } from '@angular/core';

@Injectable()
export class ReceiveStateService {
  /** The lambda URL that draws the QR image. */
  readonly qrCodeDataUrl = signal<string | null>(null);
  /** The payment URL the QR encodes — what "copy link" hands out. */
  readonly paymentLink = signal<string | null>(null);
  readonly paymentId = signal<string | null>(null);
  readonly bankName = signal<string>('');

  // The field a blocked submit should focus and shake. The counter is what lets
  // a repeat submit on the same field fire again instead of comparing equal.
  readonly focusRequest = signal<{ key: string; seq: number } | null>(null);

  setQrCode(data: {
    qrCode: string;
    paymentLink: string;
    bank: string;
    paymentId: string;
  }): void {
    this.qrCodeDataUrl.set(data.qrCode);
    this.paymentLink.set(data.paymentLink);
    this.paymentId.set(data.paymentId);
    this.bankName.set(data.bank);
  }

  clearQrCode(): void {
    this.qrCodeDataUrl.set(null);
    this.paymentLink.set(null);
    this.paymentId.set(null);
    this.bankName.set('');
  }

  requestFieldFocus(key: string | null): void {
    if (!key) {
      return;
    }
    const seq = (this.focusRequest()?.seq ?? 0) + 1;
    this.focusRequest.set({ key, seq });
  }
}

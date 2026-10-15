import {
  Component,
  inject,
  input,
  signal,
  computed,
  Signal
} from '@angular/core';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { finalize, take } from 'rxjs';
import { DOUBLE_SIDE_PANEL_DATA } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { LucideAngularModule, QrCode, Printer, Copy } from 'lucide-angular';

export interface IQrCodePanelData {
  payeeName: Signal<string>;
  bankName: Signal<string>;
  amount: Signal<number | null>;
  qrCodeDataUrl: Signal<string | null>;
  paymentLink: Signal<string | null>;
  paymentId: Signal<string | null>;
}

@Component({
  selector: 'app-payment-qr-code-panel',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div
      class="flex flex-col h-full overflow-hidden rounded-xl border border-v4-border-color bg-v4-secondary-background-color"
    >
      <div
        class="flex items-center gap-3 p-4 bg-v4-badge-info-bg-color border-b border-v4-border-color"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-v4-primary-brand-color"
        >
          <i-lucide [img]="qrCode" [size]="18" class="text-white"></i-lucide>
        </div>
        <div class="flex flex-col">
          <span
            class="font-semibold text-sm block font-funnel text-v4-primary-brand-color"
            >Payment QR Code</span
          >
          <span class="text-xs block font-peridot text-v4-badge-info-text-color"
            >Share with payer to receive payment</span
          >
        </div>
      </div>
      <div
        class="flex-1 p-5 bg-v4-secondary-background-color flex flex-col items-center gap-3 font-peridot"
      >
        <span class="text-xs text-v4-tertiary-text-color">QR Code For</span>
        <span class="text-base font-semibold text-v4-main-text-color">{{
          bankName() || '—'
        }}</span>
        @if (qrCodeDataUrl()) {
          <div
            class="rounded-xl border border-v4-border-color bg-v4-secondary-background-color p-3 shadow-sm"
          >
            <img
              [src]="qrCodeDataUrl()"
              alt="Payment QR Code"
              class="w-[150px] h-[150px] object-contain"
            />
          </div>
        }
        <div class="flex w-full flex-col items-center gap-2 mt-2">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-v4-border-color bg-v4-secondary-background-color py-2.5 text-sm font-semibold text-v4-common-green-color transition-colors hover:bg-v4-tertiary-background-color disabled:opacity-60"
            [disabled]="printLoading()"
            (click)="onPrint()"
          >
            <i-lucide [img]="printerIcon" [size]="16"></i-lucide>
            {{ printLoading() ? 'Printing…' : 'Print' }}
          </button>
          @if (paymentLink()) {
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 bg-transparent border-none text-sm cursor-pointer py-1 hover:underline"
              [class]="linkCopied() ? 'text-v4-common-green-color' : 'text-v4-common-blue-color'"
              (click)="onCopyLink()"
            >
              <i-lucide [img]="copyIcon" [size]="14"></i-lucide>
              {{ linkCopied() ? 'Copied!' : 'Copy payment link' }}
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class PaymentQrCodePanelComponent {
  private paymentLinkService = inject(PaymentLinkService);
  private panelData = inject<IQrCodePanelData | null>(DOUBLE_SIDE_PANEL_DATA, {
    optional: true
  });

  // Inputs (for template-based usage)
  payeeNameInput = input('');
  bankNameInput = input('');
  amountInput = input<number | null>(null);
  qrCodeDataUrlInput = input<string | null>(null);
  paymentLinkInput = input<string | null>(null);
  paymentIdInput = input<string | null>(null);

  // Resolved values — injection takes precedence over inputs
  payeeName = computed(
    () => this.panelData?.payeeName?.() ?? this.payeeNameInput()
  );

  bankName = computed(
    () => this.panelData?.bankName?.() ?? this.bankNameInput()
  );

  amount = computed(() => this.panelData?.amount?.() ?? this.amountInput());

  qrCodeDataUrl = computed(
    () => this.panelData?.qrCodeDataUrl?.() ?? this.qrCodeDataUrlInput()
  );

  paymentLink = computed(
    () => this.panelData?.paymentLink?.() ?? this.paymentLinkInput()
  );

  paymentId = computed(
    () => this.panelData?.paymentId?.() ?? this.paymentIdInput()
  );

  printLoading = signal(false);
  linkCopied = signal(false);
  readonly qrCode = QrCode;
  readonly printerIcon = Printer;
  readonly copyIcon = Copy;

  onPrint(): void {
    const id = this.paymentId();
    if (!id) return;
    this.printLoading.set(true);
    this.paymentLinkService
      .getPrintPaymentLink(id)
      .pipe(
        finalize(() => this.printLoading.set(false)),
        take(1)
      )
      .subscribe((res) => {
        if (res?.success && res?.data?.printData) {
          const iframe = document.createElement('iframe');
          iframe.id = 'reqpay-print-iframe-modal';
          iframe.srcdoc = res.data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      });
  }

  onCopyLink(): void {
    const link = this.paymentLink();
    if (link && navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 2000);
      });
    }
  }
}

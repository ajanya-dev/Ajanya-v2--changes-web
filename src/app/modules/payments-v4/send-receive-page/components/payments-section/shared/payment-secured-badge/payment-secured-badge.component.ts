import { ChangeDetectionStrategy, Component } from '@angular/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-payment-secured-badge',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    @if (!isItWhiteLabel) {
      <div
        class="flex flex-wrap items-center justify-center gap-2 text-xs text-v4-primary-brand-bold-color"
      >
        <span class="flex items-center gap-1.5">
          <lucide-icon [img]="ShieldCheckIcon" [size]="14" class="shrink-0" />
          Payment secured by Zil Money
        </span>
        <span class="h-3 w-px bg-v4-border-color"></span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-v4-border-color bg-v4-tertiary-background-color px-2 py-0.5 text-[12px] font-semibold text-v4-primary-brand-bold-color"
        >
          <span
            class="h-1.5 w-1.5 rounded-full bg-v4-common-green-color"
          ></span>
          PCI DSS Compliant
        </span>
      </div>
    }
  `
})
export class PaymentSecuredBadgeComponent {
  readonly ShieldCheckIcon = ShieldCheck;

  /** Zil Money branding and the PCI DSS claim are ours, not a tenant's. */
  readonly isItWhiteLabel = environment.isItWhiteLabel;
}

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  CircleCheck,
  LucideAngularModule,
  LucideIconData,
  Shield,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IWalletFeature {
  icon: LucideIconData;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
}

interface IWalletStat {
  value: string;
  label: string;
}

/**
 * "Introducing Zil Money Wallet" promo: a brand card with three stats on the
 * left and a 2x2 grid of value cards on the right. Shared by the dashboard
 * and the Accounts page so the two stay identical.
 */
@Component({
  selector: 'app-zm-wallet-intro-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <!-- Left: brand card -->
      <div
        class="rounded-2xl bg-v4-cta-banner-bg-color border border-white/15 p-5 flex flex-col gap-3"
      >
        <div>
          <div class="flex items-stretch gap-3 mb-3">
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center bg-white/20 shrink-0"
            >
              <lucide-icon
                [img]="WalletIcon"
                [size]="20"
                class="text-v4-secondary-brand-color"
              />
            </div>
            <div class="flex flex-col justify-between">
              <span
                class="self-start inline-block text-[11px] font-bold font-peridot tracking-widest text-white bg-white/15 rounded-full px-2.5 py-0.5"
              >
                DIGITAL WALLET
              </span>
              <h2 class="text-xl font-bold text-white font-funnel m-0">
                Introducing Zil Money Wallet
              </h2>
            </div>
          </div>
          <p class="text-sm text-white/70 font-peridot m-0 mb-3">
            Keep your balance ready to send, skip the wait to collect funds,
            and make secure digital payments — all from one wallet.
          </p>
          <div>
            <app-common-button-v4
              text="Learn More"
              [type]="{ style: 'secondary', name: 'main' }"
              [customHeight]="'36px'"
              [backGroundInput]="'var(--v4-secondary-brand-color)'"
              [textColorInput]="'white'"
              lucideIcon="arrow-right"
              [lucideIconSize]="16"
              iconPosition="end"
              (clickEvent)="navigateToWallets()"
            />
          </div>
        </div>
        <!-- Bottom stats -->
        <div class="grid grid-cols-3 gap-2 mt-auto">
          @for (stat of walletStats; track stat.value) {
            <div class="bg-white/10 rounded-lg px-3 py-2">
              <p class="text-sm font-bold text-white font-funnel m-0">
                {{ stat.value }}
              </p>
              <p class="text-xs text-white/70 font-peridot m-0">
                {{ stat.label }}
              </p>
            </div>
          }
        </div>
      </div>

      <!-- Right: value cards -->
      <div class="grid grid-cols-2 auto-rows-fr gap-3">
        @for (feature of walletFeatures; track feature.title) {
          <div
            class="bg-v4-secondary-background-color border border-v4-border-color rounded-2xl p-3 flex flex-col gap-1.5"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center"
              [style.background-color]="feature.iconBgColor"
            >
              <lucide-icon
                [img]="feature.icon"
                [size]="18"
                [style.color]="feature.iconColor"
              />
            </div>
            <p class="text-base font-bold text-v4-main-text-color font-funnel m-0">
              {{ feature.title }}
            </p>
            <p class="text-sm text-v4-secondary-text-color font-peridot m-0">
              {{ feature.description }}
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class ZmWalletIntroV4Component {
  private readonly router = inject(Router);

  readonly WalletIcon = Wallet;

  readonly walletFeatures: IWalletFeature[] = [
    {
      icon: TrendingUp,
      title: 'Funds Ready',
      description: 'Your balance is on hand to send right away',
      iconBgColor:
        'color-mix(in srgb, var(--v4-insight-card-icon-green) 20%, transparent)',
      iconColor: 'var(--v4-insight-card-icon-green)'
    },
    {
      icon: Zap,
      title: 'Instant',
      description: 'Real-time transfers',
      iconBgColor:
        'color-mix(in srgb, var(--v4-insight-card-icon-blue) 20%, transparent)',
      iconColor: 'var(--v4-insight-card-icon-blue)'
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Bank-level encryption',
      iconBgColor:
        'color-mix(in srgb, var(--v4-insight-card-icon-purple) 20%, transparent)',
      iconColor: 'var(--v4-insight-card-icon-purple)'
    },
    {
      icon: CircleCheck,
      title: 'Easy',
      description: 'Simple to use',
      iconBgColor:
        'color-mix(in srgb, var(--v4-insight-card-icon-blue) 20%, transparent)',
      iconColor: 'var(--v4-insight-card-icon-blue)'
    }
  ];

  readonly walletStats: IWalletStat[] = [
    { value: 'Ready', label: 'to send now' },
    { value: '24/7', label: 'instant access' },
    { value: 'Bank-grade', label: 'encryption' }
  ];

  navigateToWallets(): void {
    this.router.navigate(['/v4/manage/wallets']);
  }
}

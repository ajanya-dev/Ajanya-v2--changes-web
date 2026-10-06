import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { V4DashboardService } from '../../services/v4-dashboard.service';
import { IScheduledPayment } from '../../models/v4-dashboard.models';
import { FundYourWalletV4ModalComponent } from 'src/app/modules/wallet/wallet-v4/modals/fund-your-wallet-v4/fund-your-wallet-v4-modal.component';
import { ComingSoonCardV4Component } from 'src/app/shared/V4/coming-soon-card-v4/coming-soon-card-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-overview-metrics',
  standalone: true,
  imports: [CurrencyPipe, LucideAngularModule, ComingSoonCardV4Component, CommonButtonV4Component],
  template: `
    @if (isLoading()) {
      <!-- Loading Shimmer Skeleton -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <!-- Wallet Balance Skeleton -->
        <div class="bg-v4-secondary-background-color border border-v4-border-color rounded-2xl p-4 flex flex-col">
          <div class="mb-4">
            <div class="h-4 w-24 rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
          </div>
          <div class="flex-1 flex flex-col justify-center">
            <div class="h-10 w-32 rounded mb-3 animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
            <div class="h-4 w-16 rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
          </div>
          <div class="h-10 flex items-center">
            <div class="h-8 w-full rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
          </div>
        </div>
        <!-- Upcoming Payments Skeleton -->
        <div class="bg-v4-secondary-background-color border border-v4-border-color rounded-2xl p-4 flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="h-4 w-48 rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
            <div class="h-6 w-20 rounded-md animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
          </div>
          <!-- Rows -->
          <div class="flex flex-col gap-2.5 flex-1">
            @for (r of [1, 2]; track r) {
              <div class="grid items-center gap-3 px-3 py-2.5 rounded-[10px]"
                style="grid-template-columns: 36px 1fr auto; background: var(--v4-tertiary-background-color);">
                <div class="w-9 h-9 rounded-[9px] animate-shimmer"
                  style="background: linear-gradient(90deg, var(--v4-border-color) 25%, var(--v4-secondary-background-color) 50%, var(--v4-border-color) 75%); background-size: 400px 100%;"></div>
                <div class="flex flex-col gap-1.5">
                  <div class="h-3.5 w-32 rounded animate-shimmer"
                    style="background: linear-gradient(90deg, var(--v4-border-color) 25%, var(--v4-secondary-background-color) 50%, var(--v4-border-color) 75%); background-size: 400px 100%;"></div>
                  <div class="h-3 w-20 rounded animate-shimmer"
                    style="background: linear-gradient(90deg, var(--v4-border-color) 25%, var(--v4-secondary-background-color) 50%, var(--v4-border-color) 75%); background-size: 400px 100%;"></div>
                </div>
                <div class="h-4 w-14 rounded animate-shimmer"
                  style="background: linear-gradient(90deg, var(--v4-border-color) 25%, var(--v4-secondary-background-color) 50%, var(--v4-border-color) 75%); background-size: 400px 100%;"></div>
              </div>
            }
          </div>
          <!-- Footer -->
          <div class="flex items-center justify-between mt-4">
            <div class="h-3.5 w-28 rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
            <div class="h-3.5 w-36 rounded animate-shimmer"
              style="background: linear-gradient(90deg, var(--v4-tertiary-background-color) 25%, var(--v4-border-color) 50%, var(--v4-tertiary-background-color) 75%); background-size: 400px 100%;"></div>
          </div>
        </div>
      </div>
    } @else if (error()) {
      <!-- Error State -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div
          class="bg-v4-secondary-background-color border border-v4-border-color rounded-2xl p-4 flex flex-col md:col-span-2"
        >
          <div class="flex items-center justify-center h-full">
            <p class="text-sm text-destructive">{{ error() }}</p>
          </div>
        </div>
      </div>
    } @else {
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <!-- Wallet Balance Card -->
        <div
          class="bg-v4-secondary-background-color rounded-2xl p-4 flex flex-col border border-v4-border-color"
        >
          <p class="text-sm text-v4-tertiary-text-color font-medium">
            Wallet Balance
          </p>
          <!-- Balance block: left-aligned, close under the title, change chip beneath -->
          <div class="flex-1 flex flex-col items-start justify-center gap-1.5 pt-1 pb-3">
            <p class="text-[30px] leading-none font-bold tracking-tight text-foreground">
              {{ walletBalance() | currency: 'USD' : 'symbol' : '1.2-2' }}
            </p>
            @if (hasChange()) {
              <div class="flex items-center">
                @if (isGrowth()) {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-v4-surface-success">
                    <lucide-icon
                      name="trending-up"
                      [size]="14"
                      class="text-v4-text-success"
                    ></lucide-icon>
                    <span class="text-sm font-semibold text-v4-text-success">
                      +{{ growthAmount() | currency: 'USD' : 'symbol' : '1.2-2' }} this month
                    </span>
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-v4-insight-card-background-red">
                    <lucide-icon
                      name="trending-down"
                      [size]="14"
                      class="text-v4-insight-card-icon-red"
                    ></lucide-icon>
                    <span class="text-sm font-semibold text-v4-insight-card-icon-red">
                      {{ growthAmount() | currency: 'USD' : 'symbol' : '1.2-2' }} this month
                    </span>
                  </span>
                }
              </div>
            }
          </div>
          <app-common-button-v4
            [type]="{ style: 'outline', name: 'main' }"
            [text]="'Top Up'"
            [lucideIcon]="'arrow-up'"
            [lucideIconSize]="14"
            [width]="'100%'"
            [customHeight]="'36px'"
            (clickEvent)="openFundYourWalletModal()"
          />
        </div>

        <div class="flex flex-col p-4 bg-v4-secondary-background-color rounded-2xl border border-v4-border-color">
          <!-- Header -->
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="text-sm font-medium text-v4-secondary-text-color">Upcoming payments</div>
            <span class="px-2.5 py-1 rounded text-[12px] font-bold text-v4-primary-brand-bold-color tracking-[.5px] shrink-0" style="background-color: color-mix(in srgb, var(--v4-primary-brand-bold-color) 15%, transparent)">{{ totalScheduledCount() }} SCHEDULED {{ totalScheduledCount() === 1 ? 'PAYMENT' : 'PAYMENTS' }}</span>
          </div>
          <!-- Rows -->
          <div class="flex flex-col gap-2.5 flex-1">
            @if (visibleScheduledPayments().length > 0) {
              @for (payment of visibleScheduledPayments(); track $index) {
                <div class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-v4-insight-card-background-blue">
                  <div class="w-9 h-9 rounded-[9px] bg-v4-secondary-background-color text-v4-primary-brand-bold-color grid place-items-center border border-v4-border-color flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[13.5px] font-semibold text-v4-main-text-color leading-tight truncate">{{ payment.payee_name }}</span>
                      <span class="text-[12.5px] font-bold text-v4-main-text-color tabular-nums whitespace-nowrap">{{ (+payment.amount) | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2 mt-0.5">
                      <span class="text-[12px] text-v4-tertiary-text-color">{{ payment.payment_type }}</span>
                      <span class="text-[12px] text-v4-tertiary-text-color whitespace-nowrap">{{ payment.end_date }}</span>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <!-- Empty state -->
              <div class="flex flex-col items-center justify-center flex-1 text-center py-1">
                <div
                  class="w-9 h-9 rounded-lg grid place-items-center mb-2 text-v4-primary-brand-bold-color"
                  style="background-color: color-mix(in srgb, var(--v4-primary-brand-bold-color) 12%, transparent)"
                >
                  <lucide-icon name="calendar-check" [size]="18"></lucide-icon>
                </div>
                <p class="text-[14px] font-bold text-v4-main-text-color mb-0.5">Nothing scheduled yet</p>
                <p class="text-[12.5px] text-v4-tertiary-text-color max-w-[280px] mb-3">
                  Schedule a payment and it'll send automatically on the date you choose.
                </p>
                <app-common-button-v4
                  [type]="{ style: 'primary', name: 'main' }"
                  [text]="'Schedule a payment'"
                  [lucideIcon]="'plus'"
                  [lucideIconSize]="16"
                  [textColorInput]="'#ffffff'"
                  [customHeight]="'34px'"
                  (clickEvent)="openSendModal()"
                />
              </div>
            }
          </div>
          <!-- Footer (only when payments exist) -->
          @if (visibleScheduledPayments().length > 0) {
            <div class="flex items-center justify-between mt-3">
              <a class="text-[12.5px] font-semibold text-v4-primary-brand-bold-color cursor-pointer" role="button" tabindex="0" (click)="navigateToScheduled()" (keyup.enter)="navigateToScheduled()">View all scheduled <span class="text-sm ml-0.5">›</span></a>
              <a class="text-[12.5px] font-semibold text-v4-primary-brand-bold-color cursor-pointer" role="button" tabindex="0" (click)="openSendModal()" (keyup.enter)="openSendModal()">Create Scheduled Payment</a>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class OverviewMetricsComponent implements OnInit {
  private dashboardService = inject(V4DashboardService);
  private companyService = inject(CompanyManagementService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  walletBalance = signal(0);
  growthAmount = signal(0);
  isGrowth = signal(true);
  isLoading = signal(true);
  error = signal<string | null>(null);
  hasChange = computed(() => this.growthAmount() !== 0);

  scheduledPayments = signal<IScheduledPayment[]>([]);
  totalScheduledCount = signal(0);
  visibleScheduledPayments = computed(() => this.scheduledPayments().slice(0, 2));

  ngOnInit(): void {
    this.fetchDashboardData();

    this.companyService
      .getCompanyChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchDashboardData());

    this.paymentsV4Service.paymentCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchDashboardData());
  }

  openSendModal(): void {
    this.router.navigate(['/v4/manage/payments/pay']);
  }

  navigateToScheduled(): void {
    this.router.navigate(['/v4/manage/payments-out/detailed/recurring']);
  }

  openFundYourWalletModal(): void {
    this.dialog.open(FundYourWalletV4ModalComponent, {
      width: '700px',
      maxWidth: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: null
    });
  }

  private fetchDashboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      wallet: this.dashboardService.getWalletDetails(),
      scheduled: this.dashboardService.getScheduledPaymentsCount()
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ wallet, scheduled }) => {
          if (wallet.success) {
            const balance = parseFloat(wallet.data.current_wallet_balance) || 0;
            const prev =
              parseFloat(wallet.data.growth_or_loss_percentage?.previous_balance) || 0;
            const curr =
              parseFloat(wallet.data.growth_or_loss_percentage?.current_balance) || 0;
            const diff = curr - prev;
            this.walletBalance.set(balance);
            this.growthAmount.set(diff);
            this.isGrowth.set(diff >= 0);
          }

          if (scheduled.success) {
            this.scheduledPayments.set(scheduled.data.scheduled_payments ?? []);
            this.totalScheduledCount.set(scheduled.data.total_scheduled_count ?? 0);
          }
        },
        error: () => {
          this.error.set('We’re having trouble loading your wallet. Please refresh the page or contact support if the problem persists.');
        }
      });
  }
}

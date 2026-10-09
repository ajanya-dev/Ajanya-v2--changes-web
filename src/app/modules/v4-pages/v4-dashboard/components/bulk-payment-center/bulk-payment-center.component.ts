import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';

@Component({
  selector: 'app-bulk-payment-center',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  template: `
    <div
      class="bg-v4-primary-brand-color rounded-2xl p-6 border-2 border-v4-primary-brand-color"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-3">
        <div
          class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"
        >
          <lucide-icon
            name="credit-card"
            [size]="20"
            class="text-white"
          ></lucide-icon>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white">Bulk Payment Center</h3>
          <p class="text-xs text-white/70 font-medium">
            Available for all users
          </p>
        </div>
      </div>

      <p class="text-sm text-white/80 mb-4">
        Process hundreds of payments at once - Manual Entry, Excel Import,
        and Saved Templates
      </p>

      <div
        class="flex flex-col 2xl:flex-row 2xl:items-start 2xl:justify-between gap-4"
      >
        <div class="flex-1 min-w-0">
          <!-- Info Grid -->
          <div class="grid grid-cols-3 gap-2 xl:gap-3 mb-3">
            <div
              class="p-2 xl:p-3 bg-[#3746a7] rounded-xl border border-white/20"
            >
              <div class="text-[12px] xl:text-xs font-bold text-white mb-1">Create Payment</div>
              <div class="text-[12px] xl:text-xs font-normal text-white/80 line-clamp-2 leading-snug">
                Enter payments manually or upload from Excel
              </div>
            </div>
            <div
              class="p-2 xl:p-3 bg-[#3746a7] rounded-xl border border-white/20"
            >
              <div class="text-[12px] xl:text-xs font-bold text-white mb-1">Saved Groups</div>
              @if (groupPaymentsCount() > 0) {
                <div class="text-sm font-normal text-white/90 leading-snug">
                  {{ groupPaymentsCount() }}
                </div>
              } @else {
                <div class="text-[12px] xl:text-xs font-normal text-white/80 line-clamp-2 leading-snug">
                  Save and reuse payment groups for faster processing
                </div>
              }
            </div>
            <div
              class="relative rounded-xl pointer-events-none select-none"
            >
              <div class="p-2 xl:p-3 bg-[#3746a7] rounded-xl border border-white/20 opacity-40 h-full">
                <div class="text-[12px] xl:text-xs font-bold text-white mb-1">Schedule</div>
                <div class="text-[12px] xl:text-xs font-normal text-white/80 line-clamp-2 leading-snug">
                  Schedule payments for future delivery
                </div>
              </div>
              <div class="absolute top-1.5 right-1.5">
                <span
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[12px] font-semibold bg-[#FEF9C3] text-[#A16207] border border-[#FDE047]"
                >
                  <lucide-icon name="clock" [size]="9"></lucide-icon>
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          <!-- Enterprise Line -->
          <div class="flex items-center gap-2 text-white/90">
            <lucide-icon
              name="building"
              [size]="14"
              class="text-v4-secondary-brand-color"
            ></lucide-icon>
            <span class="text-sm font-medium"
              >Enterprise Plans: Get access to APIs and custom integrations</span
            >
          </div>
        </div>

        <!-- Action Buttons (right side) -->
        <div class="flex-shrink-0 flex flex-col gap-2 2xl:ml-6">
          <app-common-button-v4
            [type]="{ style: 'neon', name: 'main' }"
            [text]="'Go to Bulk Payment Center'"
            [lucideIcon]="'credit-card'"
            [lucideIconSize]="16"
            [width]="'100%'"
            (clickEvent)="navigateToBulkPayments()"
          />
          <div class="grid grid-cols-3 gap-2 min-w-0">
            <app-common-button-v4
              [type]="{ style: 'secondary', name: 'main' }"
              [text]="'Create Payment'"
              [lucideIcon]="'credit-card'"
              [lucideIconSize]="14"
              [backGroundInput]="'#3746a7'"
              [textColorInput]="'white'"
              [width]="'100%'"
              [customClasses]="'border border-white/30'"
              (clickEvent)="navigateToCreate()"
            />
            <app-common-button-v4
              [type]="{ style: 'secondary', name: 'main' }"
              [text]="'Import Payments'"
              [lucideIcon]="'download'"
              [lucideIconSize]="14"
              [backGroundInput]="'#3746a7'"
              [textColorInput]="'white'"
              [width]="'100%'"
              [customClasses]="'border border-white/30'"
              (clickEvent)="navigateToImport()"
            />
            <app-common-button-v4
              [type]="{ style: 'secondary', name: 'main' }"
              [text]="'Manage Groups'"
              [lucideIcon]="'folder-open'"
              [lucideIconSize]="14"
              [backGroundInput]="'#3746a7'"
              [textColorInput]="'white'"
              [width]="'100%'"
              [customClasses]="'border border-white/30'"
              (clickEvent)="navigateToGroups()"
            />
          </div>
        </div>
      </div>
    </div>
  `
})
export class BulkPaymentCenterComponent implements OnInit {
  private router = inject(Router);
  private paymentsV4Service = inject(PaymentsV4Service);
  private destroyRef = inject(DestroyRef);

  groupPaymentsCount = signal<number>(0);

  ngOnInit(): void {
    this.paymentsV4Service
      .getPaymentOutQuickCards()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data) {
            this.groupPaymentsCount.set(Number(res.data.group_payments_count) || 0);
          }
        }
      });
  }

  navigateToBulkPayments(): void {
    this.router.navigate(['/v4/manage/bulk-payments']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/v4/manage/bulk-payments'], { queryParams: { tab: 'create', method: 'manual-entry' } });
  }

  navigateToImport(): void {
    this.router.navigate(['/v4/manage/bulk-payments'], { queryParams: { tab: 'create', method: 'import-excel' } });
  }

  navigateToGroups(): void {
    this.router.navigate(['/v4/manage/bulk-payments'], { queryParams: { tab: 'my-groups' } });
  }
}

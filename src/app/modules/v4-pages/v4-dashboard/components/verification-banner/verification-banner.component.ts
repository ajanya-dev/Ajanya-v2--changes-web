import { Component, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-verification-banner',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  template: `
    <div class="rounded-2xl overflow-hidden shadow-lg bg-v4-main-background-color">
      <!-- Main Banner -->
      <div class="bg-v4-badge-brand-navy-color p-8">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10"
              >
                <lucide-icon
                  name="sparkles"
                  [size]="24"
                  class="text-v4-secondary-brand-color"
                ></lucide-icon>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">
                  Welcome to {{ productName }}!
                </h3>
                <p class="text-white/70 text-sm">
                  Complete verification to unlock all features
                </p>
              </div>
            </div>
            <p class="text-white mb-6 max-w-xl">
              Verify your account to send and receive payments, access
              international transfers, issue virtual cards, and enjoy our
              complete suite of financial tools.
            </p>

            <!-- Verification Benefits -->
            <div class="grid grid-cols-2 gap-3 mb-6">
              <div
                class="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10"
              >
                <lucide-icon
                  name="check"
                  [size]="16"
                  class="text-v4-common-green-color"
                ></lucide-icon>
                <span class="text-sm text-white">
                  Send & Receive Payments
                </span>
              </div>
              <div
                class="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10"
              >
                <lucide-icon
                  name="check"
                  [size]="16"
                  class="text-v4-common-green-color"
                ></lucide-icon>
                <span class="text-sm text-white">
                  International Transfers
                </span>
              </div>
              <div
                class="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10"
              >
                <lucide-icon
                  name="check"
                  [size]="16"
                  class="text-v4-common-green-color"
                ></lucide-icon>
                <span class="text-sm text-white">
                  Issue Virtual Cards
                </span>
              </div>
              <div
                class="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/10"
              >
                <lucide-icon
                  name="check"
                  [size]="16"
                  class="text-v4-common-green-color"
                ></lucide-icon>
                <span class="text-sm text-white">
                  ACH & Wire Transfers
                </span>
              </div>
            </div>

            <app-common-button-v4
              [type]="{ style: 'neon', name: 'main' }"
              [text]="'Start Verification'"
              [lucideIcon]="'shield-check'"
              [lucideIconSize]="18"
              (clickEvent)="startVerification.emit()"
            />
          </div>

          <!-- Progress Indicator (desktop only) -->
          <div class="hidden lg:block ml-8">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 w-64">
              <p class="text-white/70 text-xs font-medium mb-3">
                VERIFICATION PROGRESS
              </p>
              <div class="space-y-3">
                @for (step of verificationSteps; track step.label) {
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold"
                    >
                      {{ step.step }}
                    </div>
                    <span class="text-white text-sm">{{ step.label }}</span>
                  </div>
                }
              </div>
              <p class="text-white/50 text-xs mt-4">Takes only 5-10 minutes</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Check Print Available Banner -->
      <div
        class="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t border-v4-common-green-color bg-white/10"
      >
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-v4-badge-success-bg-color"
            >
              <lucide-icon
                name="printer"
                [size]="20"
                class="text-v4-common-green-color"
              ></lucide-icon>
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1 sm:gap-2">
                <h4 class="font-bold text-v4-main-text-color text-sm sm:text-base">
                  Check Printing Available Now!
                </h4>
              </div>
              <p class="text-sm text-v4-secondary-text-color">
                Print checks on your own check stock while you complete
                verification
              </p>
            </div>
          </div>
          <div class="flex-shrink-0 w-full sm:w-auto">
            <app-common-button-v4
              [type]="{ style: 'primary', name: 'main' }"
              [text]="'Print Checks'"
              [lucideIcon]="'banknote'"
              [lucideIconSize]="18"
              [customClasses]="'w-full whitespace-nowrap'"
              (clickEvent)="printChecks.emit()"
            />
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerificationBannerComponent {
  startVerification = output<void>();
  printChecks = output<void>();

  productName = environment.productName;

  verificationSteps = [
    { step: 1, label: 'Email Verification' },
    { step: 2, label: 'Phone Verification' },
    { step: 3, label: 'Business Verification' },
    { step: 4, label: 'Connect Bank' },
  ];
}

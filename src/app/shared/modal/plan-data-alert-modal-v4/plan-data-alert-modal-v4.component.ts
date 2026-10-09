import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, Star, CircleCheck } from 'lucide-angular';
import { Router } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';
import { SubscriptionService } from '../../service/subscription/subscription.service';

@Component({
  selector: 'app-plan-data-alert-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CurrencyPipe, CommonButtonV4Component],
  template: `
    <div
      class="flex flex-col items-center gap-7 bg-v4-secondary-background-color rounded-2xl p-6"
    >
      @if (!afterPayment) {
        <div class="flex flex-col items-center gap-3">
          <h2
            class="text-center font-bold text-xl text-v4-main-text-color font-funnel m-0"
          >
            Get Bank Data Now
          </h2>
          <p
            class="text-center text-xs text-v4-secondary-text-color font-peridot m-0"
          >
            {{ dialogData.target === 'plans' ? planDesc : addonDesc }}
          </p>
        </div>

        <div
          class="relative w-[180px] h-44 rounded-xl border-2 border-v4-common-green-color bg-v4-surface-success-bold overflow-hidden flex flex-col items-center justify-center gap-5 p-3"
        >
          <div
            class="absolute -top-[26px] -right-1.5 h-[73px] w-9 -rotate-45 flex items-center justify-center pr-1.5 bg-v4-common-green-color"
          >
            <lucide-icon
              [img]="StarIcon"
              [size]="18"
              class="text-white -rotate-[27deg]"
            />
          </div>
          <div class="flex flex-col items-center">
            <h3
              class="text-center font-bold text-xl text-v4-main-text-color font-funnel m-0"
            >
              Bank Data
            </h3>
            <span
              class="text-center font-medium text-sm text-v4-main-text-color font-peridot"
            >
              {{ cost | currency }}/month
            </span>
          </div>
          <p
            class="text-center text-[12px] text-v4-main-text-color font-peridot m-0"
          >
            Track all your bank data in one place. Manage them easily.
          </p>
        </div>
      } @else {
        <lucide-icon
          [img]="CircleCheckIcon"
          [size]="64"
          class="text-v4-common-green-color"
        />
        <div class="flex flex-col items-center gap-3">
          <h2
            class="text-center font-bold text-xl text-v4-main-text-color font-funnel m-0"
          >
            Congrats!!!
          </h2>
          <p
            class="text-center text-xs text-v4-secondary-text-color font-peridot m-0"
          >
            You are done. Enjoy the bank data feature now!
          </p>
        </div>
      }

      <div class="flex gap-3 w-full">
        <app-common-button-v4
          class="flex-1"
          (clickEvent)="closeModal()"
          [width]="'100%'"
          [type]="{ style: 'outline', name: 'main' }"
          [text]="afterPayment ? 'Ok' : 'Cancel'"
        />
        @if (!afterPayment) {
          <app-common-button-v4
            class="flex-1"
            (clickEvent)="onBuy()"
            [width]="'100%'"
            [type]="{ style: 'primary', name: 'main' }"
            [text]="dialogData.target === 'plans' ? 'Subscribe Now' : 'Buy Now'"
            [loading]="paymentLoading"
          />
        }
      </div>
    </div>
  `
})
export class PlanDataAlertModalV4Component implements OnDestroy {
  private dialogRef = inject(MatDialogRef);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  dialogData = inject<{ target: 'plans' | 'addons' }>(MAT_DIALOG_DATA);

  readonly StarIcon = Star;
  readonly CircleCheckIcon = CircleCheck;
  cost = 6.99;

  afterPayment = false;
  paymentLoading = false;

  planDesc =
    'Subscribe now to start using the bank data feature immediately!';
  addonDesc =
    'Enhance your plan with the bank data feature today! Upgrade now to start using it immediately!';

  destroy$ = new Subject<boolean>();

  closeModal(): void {
    this.dialogRef.close();
  }

  onBuy(): void {
    if (this.dialogData.target === 'plans') {
      this.closeModal();
      this.router.navigate(['/v4/manage/subscription/plan/change']);
      return;
    }
    this.buyPlan();
  }

  private buyPlan(): void {
    this.paymentLoading = true;
    this.subscriptionService
      .buyAddon([{ featureCode: 'bankdata', quantity: 1 }])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.paymentLoading = false;
        })
      )
      .subscribe((val) => {
        if (val.success) {
          this.afterPayment = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

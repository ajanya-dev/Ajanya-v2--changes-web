import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { faStar } from '@fortawesome/pro-thin-svg-icons';
import { Router } from '@angular/router';
import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { Subject, finalize, takeUntil } from 'rxjs';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { SubscriptionService } from '../../service/subscription/subscription.service';

@Component({
  selector: 'app-plan-data-alert-modal',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CurrencyPipe,
    CommonButtonV35Component,
    NgOptimizedImage
  ],
  templateUrl: './plan-data-alert-modal.component.html',
  styleUrl: './plan-data-alert-modal.component.scss'
})
export class PlanDataAlertModalComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  public dialogData = inject<{ target: 'plans' | 'addons' }>(MAT_DIALOG_DATA);

  faStar = faStar;
  faCircleCheck = faCircleCheck;
  cost = 6.99;

  afterPayment = false;
  paymentLoading = false;

  planDesc = 'Subscribe now to start using the bank data feature immediately!';
  addonDesc =
    'Enhance your plan with the bank data feature today! Upgrade now to start using it immediately!';

  destroy$ = new Subject<boolean>();

  closeModal() {
    this.dialogRef.close();
  }

  onBuy() {
    if (this.dialogData.target === 'plans') {
      this.closeModal();
      this.router.navigate(['manage', 'subscription', 'plan', 'change']);
      return;
    }

    this.buyPlan();
  }

  buyPlan() {
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

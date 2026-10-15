import { Component, Inject, inject, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { LucideAngularModule, X, Check } from 'lucide-angular';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { subscriptionOffers } from 'src/app/data/data/subscription';
import { ISubscriptionOffers } from 'src/app/modules/subscription/model/subscription';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IAppState } from 'src/app/store/app-state.model';

@Component({
  selector: 'app-trial-period-offer-modal-v4',
  templateUrl: './trial-period-offer-modal-v4.component.html',
  styleUrls: ['./trial-period-offer-modal-v4.component.scss'],
  standalone: true,
  imports: [MatDialogClose, LucideAngularModule, CommonButtonV4Component, DecimalPipe]
})
export class TrialPeriodOfferModalV4Component implements OnInit, OnDestroy {
  readonly XIcon = X;
  readonly CheckIcon = Check;
  readonly BASE_ANNUAL_PRICE = 199;
  readonly features = [
    'ACH, wire & check payments',
    'Unlimited check creation',
    'Bulk pay with approvals',
    'Priority support'
  ];

  offer: ISubscriptionOffers = subscriptionOffers;
  currentOffer: { offerPerc: number; value: number };
  emailVerified: number;
  phoneVerified: number;
  hours = 23;
  minutes = 59;
  seconds = 59;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { remainingDays: number },
    private router: Router,
    private matDialogRef: MatDialogRef<TrialPeriodOfferModalV4Component>
  ) {}
  private store = inject(Store<IAppState>);

  get discountedPrice(): number {
    return Math.round(this.BASE_ANNUAL_PRICE * (1 - this.currentOffer.offerPerc / 100));
  }

  get savedAmount(): number {
    return this.BASE_ANNUAL_PRICE - this.discountedPrice;
  }

  ngOnInit(): void {
    this.currentOffer = this.offer[this.data.remainingDays];
    this.store.select(selectUserVerification).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.emailVerified = res?.email_verified ?? 0;
      this.phoneVerified = res?.phone_verified ?? 0;
    });

    let totalSeconds = 24 * 60 * 60 - 1;
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (totalSeconds <= 0) { this.destroy$.next(); return; }
      totalSeconds--;
      this.hours = Math.floor(totalSeconds / 3600);
      this.minutes = Math.floor((totalSeconds % 3600) / 60);
      this.seconds = totalSeconds % 60;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  grabDeal() {
    this.router.navigate(['manage/subscription/plan'], {
      state: { isFromTrial: this.currentOffer.value }
    });
    this.matDialogRef.close();
  }
}

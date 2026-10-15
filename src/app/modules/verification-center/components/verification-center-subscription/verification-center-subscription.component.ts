import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faCrown,
  faCalendarCheck,
  faCheck
} from '@fortawesome/pro-regular-svg-icons';
import { finalize, Subscription } from 'rxjs';
import { IHeaderData } from 'src/app/layout/model/header';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { RefillCreditRechargeModalComponent } from 'src/app/modules/refill-credit/modals/refill-credit-recharge-modal/refill-credit-recharge-modal.component';
import { ISubscriptionData } from 'src/app/modules/subscription/model/subscription';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
// import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-verification-center-subscription',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FontAwesomeModule,
    CurrencyPipe,
    CommonModule
  ],
  templateUrl: './verification-center-subscription-new.component.html',
  styleUrl: './verification-center-subscription.component.scss'
})
export class VerificationCenterSubscriptionComponent
  implements OnInit, OnDestroy
{
  @Input() verifications: IGettingStartedAPI;
  subscriptions: Subscription[] = [];

  // private localStorageService = inject(LocalStorageService);
  private subscriptionService = inject(SubscriptionService);
  private HeaderService = inject(HeaderService);
  private refillService = inject(RefillCreditService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  faCrown = faCrown;
  subscribed = false;
  subsciprtionSignal = signal(false);
  currentPlan: ISubscriptionData;
  subscription: Subscription[] = [];
  public dialog = inject(MatDialog);
  myCredits: string;
  isCreditLoading = false;
  loading = false;
  faCalendar = faCalendar;
  faCheck = faCheck;
  faCalendarCheck = faCalendarCheck;

  ngOnInit(): void {
    // this.subscribed = this.localStorageService.getItem('isSubscribed') === 1;
    // this.myCredits = this.localStorageService.getItem('myCredits');
    
    this.HeaderService._headerData.subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.myCredits = headerData.totalMailCredit?.credit;
        this.subscribed = headerData.isSubscribed===1;
        this.subsciprtionSignal.set(this.subscribed);
        if (this.subscribed) {
          this.getCurrentPlan();
        }
    });

    
  }

  getCurrentPlan(): void {
    this.subscription.push(
      this.subscriptionService.getCurrentlyUsedPlans().subscribe({
        next: (res) => {
          this.currentPlan = res.data;
        }
      })
    );
  }

  onClickEvent(): void {
    this.loading = true;
    this.router.navigateByUrl('manage/subscription/plan');
  }

  viewBilling(): void {
    this.router.navigateByUrl('manage/subscription/dashboard');
  }

  rechargeNow(): void {
    if (!this.subscribed) {
      const alertData = {
        content: 'Kindly subscribe to a plan.',
        isCancel: true,
        doneMsg: 'Subscribe Now',
        cancelMsg: 'Not Now'
      };
      const alert = this.alertService.warningAlert(alertData);
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.goToSubscription();
        }
      });
      return;
    }
    const dRef = this.dialog.open(RefillCreditRechargeModalComponent, {
      width: '450px',
      maxWidth: '93%',
      autoFocus: false,
      disableClose: true
    });

    dRef.afterClosed().subscribe((res) => {
      if (res?.add) {
        this.getCredit();
      }
    });
  }

  getCredit() {
    this.isCreditLoading = true;
    this.subscriptions.push(
      this.refillService
        .getCurrentCredit()
        .pipe(
          finalize(() => {
            this.isCreditLoading = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.myCredits = String(data.data.credit);
          }
        })
    );
  }

  goToSubscription(): void {
    this.router.navigate(['manage/subscription'], {
      state: { returnUrl: this.router.url }
    });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el.unsubscribe();
    });
  }
}

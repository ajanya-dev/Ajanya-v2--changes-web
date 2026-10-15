import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormControl,
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  IFeatureCreditList,
  RefillCreditService
} from 'src/app/shared/service/refill-credit/refill-credit.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { IUserVerification } from 'src/app/models/user';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { RefillCreditRechargeModalComponent } from '../../modals/refill-credit-recharge-modal/refill-credit-recharge-modal.component';
import { FeatureApplyCouponModalComponent } from '../../modals/feature-apply-coupon-modal/feature-apply-coupon-modal.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import {
  NgClass,
  NgStyle,
  CurrencyPipe,
  NgOptimizedImage
} from '@angular/common';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faHeadset,
  faInfoCircle,
  faMessage
} from '@fortawesome/pro-solid-svg-icons';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { faCircleDot } from '@fortawesome/pro-regular-svg-icons';
import {
  IPaymentType,
  ISubscriptionData
} from 'src/app/modules/subscription/model/subscription';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { HttpHeaders } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-refill-credit',
  templateUrl: './refill-credit.component.html',
  styleUrls: ['./refill-credit.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    AmountInputComponent,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgStyle,
    CurrencyPipe,
    CommonButtonV35Component,
    FontAwesomeModule,
    NgOptimizedImage,
    MatTooltipModule
  ]
})
export class RefillCreditComponent implements OnInit, OnDestroy {
  private refillService = inject(RefillCreditService);
  private alertService = inject(AlertService);
  public dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private subscriptionService = inject(SubscriptionService);

  subscriptions: Subscription[] = [];

  credit = '0000000000';
  autoRecharge = false;

  // auto recharge values
  threshold = new UntypedFormControl(null, [Validators.required]);
  amount = new UntypedFormControl(null, [
    Validators.min(30),
    Validators.max(999),
    Validators.required
  ]);

  autoRechargeLoading = false;
  autoRechargeUpdateSuccess = false;
  currentPlan: ISubscriptionData;
  expiryMonth: string;
  isPaymentDetailsLoading = true;
  isCreditLoading = true;

  faMessage = faMessage;
  faEnvelope = faEnvelope;
  faHeadSet = faHeadset;
  faCircleDot = faCircleDot;
  faInfoCircle = faInfoCircle;

  dbRechargeValue = { amount: 0, threshold: 0 };
  couponCode = new FormControl<string>('', [Validators.required]);
  featureCreditList: IFeatureCreditList[] = [];
  loading = false;
  applying = false;
  isSubscribed: number;
  isUserVerified: IUserVerification;
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  defaultPayment: IPaymentType = {
    paywith_check: 'check',
    paywith_wallet: 'wallet',
    authorize_net: 'Card',
    payflow_pro: 'Paypal'
  };

  utils = Utils;

  ngOnInit(): void {
    this.getCredit();
    this.getAutoRecharge();
    this.getFeatureCreditList();
    this.getHeaderData();
    this.verifyEmailPhone();
    this.getCurrentPlan();
  }

  /**
   * @description Used to check user is subscribed or not.
   */
  getHeaderData() {
    this.subscriptions.push(
      this.headerService._headerData.subscribe((res) => {
        const reponse = res as IHeaderData;
        this.isSubscribed = reponse.isSubscribed;
      })
    );
  }

  /**
   * @description Get the user email and phone number verification status.
   */
  verifyEmailPhone() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isUserVerified = res;
      })
    );
  }

  getCredit() {
    this.subscriptions.push(
      this.refillService
        .getCurrentCredit()
        .pipe(
          finalize(() => {
            this.removeLoadedSkelton();
            this.isCreditLoading = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.credit = String(data.data.credit);
          }
        })
    );
  }

  /**
   * Fetching all the credits list of the user from API (feature wise).
   */
  getFeatureCreditList() {
    this.loading = true;
    this.subscriptions.push(
      this.refillService
        .featureCreditList()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.featureCreditList = res.data;
          }
        })
    );
  }

  onUpdateCard(): void {
    this.router.navigate([
      '/manage/subscription/plan/change-payment/update-card'
    ]);
  }

  /**
   * Applying a coupon.
   * And shows details of the coupon applied in a modal if succeeded.
   */
  applyCoupon() {
    this.couponCode.markAsTouched();
    if (this.couponCode.invalid) {
      this.alertService.warningAlert({ content: 'Coupon Code is required!!' });
      return;
    }

    this.applying = true;
    this.subscriptions.push(
      this.refillService
        .featureApplyCoupon({ coupon_code: this.couponCode.value as string })
        .pipe(
          finalize(() => {
            this.applying = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const dialogRef = this.dialog.open(
              FeatureApplyCouponModalComponent,
              {
                disableClose: true,
                width: '420px',
                data: { ...res.data, type: 'refill' }
              }
            );
            dialogRef.afterClosed().subscribe(() => {
              this.couponCode.reset();
              this.getFeatureCreditList();
              this.getCredit();
              this.headerService.setHeaderValueChanged(true);
            });
          }
        })
    );
  }

  getAutoRecharge() {
    this.subscriptions.push(
      this.refillService.getAutoRecharge().subscribe((data) => {
        if (data?.success && data.data.threshold !== '' && data.data.amount) {
          this.threshold.setValue(data.data.threshold);
          this.amount.setValue(data.data.amount);
          this.dbRechargeValue = {
            amount: data.data.amount,
            threshold: data.data.threshold
          };
          this.autoRechargeUpdateSuccess = true;
          this.autoRecharge = true;
        }
      })
    );
  }

  addAutoRecharge() {
    this.autoRechargeLoading = true;

    this.subscriptions.push(
      this.refillService
        .addAutoRecharge(this.threshold.value, this.amount.value)
        .pipe(
          finalize(() => {
            this.autoRechargeLoading = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.autoRechargeUpdateSuccess = true;
            this.dbRechargeValue = {
              amount: this.amount.value,
              threshold: this.threshold.value
            };
            this.alertService.successAlert({
              content: 'Auto recharge enabled',
              close: true,
              timeout: 2000
            });
          }
        })
    );
  }

  deleteAutoRecharge() {
    this.autoRechargeLoading = true;

    this.subscriptions.push(
      this.refillService
        .deleteAutoRecharge()
        .pipe(
          finalize(() => {
            this.autoRechargeLoading = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              content: 'Auto recharge deleted',
              close: true,
              timeout: 2000
            });
            this.autoRechargeUpdateSuccess = false;
            this.amount.setValue(null);
            this.threshold.setValue(null);
          }
        })
    );
  }

  autoRechargeChange() {
    if (!this.autoRecharge && this.autoRechargeUpdateSuccess) {
      this.deleteAutoRecharge();
    }
  }

  saveAutoRechargeSetting() {
    if (!(this.threshold.valid && this.amount.valid)) {
      return;
    }
    this.addAutoRecharge();
  }

  openRechargeModal() {
    if (!this.isSubscribed) {
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
      disableClose: true,
    });

    dRef.afterClosed().subscribe((res) => {
      if(res?.add){
        this.getCredit();
      }
    });
  }

  /**
   * @description Navigates to the subscription page based on the user verification status.
   *
   * If both the email and phone are verified, it navigates to the subscription page.
   *
   * If either the email or phone is not verified, it navigates to the verify email and phone page.
   */
  goToSubscription(): void {
    if (
      this.isUserVerified.email_verified === 1 &&
      this.isUserVerified.phone_verified === 1
    ) {
      this.router.navigate(['manage/subscription'], {
        state: { returnUrl: this.router.url }
      });
    } else {
      this.router.navigate(['/manage/users/verify-email-phone'], {
        queryParams: { returnUrl: '/manage/refill-credit/show-refillform' }
      });
    }
  }


  removeLoadedSkelton() {
    const mainCommonModule: NodeListOf<HTMLElement> = document.querySelectorAll(
      '.main_common_module .skelton'
    )!;
    mainCommonModule.forEach((item) => item.classList.remove('skelton'));
  }

  /**
   * @description Method to redirect to payment method change page.
   */
  onChangePaymentMethod(): void {
    this.router.navigate(['/manage/subscription/plan/change-payment']);
  }

  /**
   * @description Method to open live chat
   */
  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * @description Method to get the currently used plan.
   */
  getCurrentPlan(): void {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.subscriptionService
        .getCurrentlyUsedPlans(headerOptions)
        .pipe(
          finalize(() => {
            this.isPaymentDetailsLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.currentPlan = res.data;
            if (this.currentPlan?.subscription?.cardExpireMonth) {
              if (
                this.currentPlan?.subscription?.cardExpireMonth.length === 1
              ) {
                this.expiryMonth = `0${this.currentPlan?.subscription?.cardExpireMonth}`;
              } else {
                this.expiryMonth =
                  this.currentPlan?.subscription?.cardExpireMonth;
              }
            }
          }
        })
    );
  }




  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}

import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  IFeatureCreditList,
  RefillCreditService
} from 'src/app/shared/service/refill-credit/refill-credit.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { RefillCreditRechargeModalV4Component } from 'src/app/modules/v4-refill-credit/modals/refill-credit-recharge-modal-v4/refill-credit-recharge-modal-v4.component';
import { NgClass, CurrencyPipe } from '@angular/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowsRotate, faGift } from '@fortawesome/pro-solid-svg-icons';
import {
  IPaymentType,
  ISubscriptionData
} from 'src/app/modules/subscription/model/subscription';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { HttpHeaders } from '@angular/common/http';
import {
  BellRing,
  Check,
  ChevronRight,
  CreditCard,
  DollarSign,
  Info,
  LucideAngularModule,
  RefreshCw,
  Sparkles,
  Wallet,
  Zap
} from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faBolt } from '@fortawesome/pro-regular-svg-icons';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { FinancialStatementListV4Component } from 'src/app/modules/financial-statement/v4-financial-statement/pages/financial-statement-list-v4/financial-statement-list-v4.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import {
  V4ChangePaymentMethodModalComponent,
  IChangePaymentModalData
} from 'src/app/modules/user-v4/modals/v4-change-payment-method-modal/v4-change-payment-method-modal.component';
import { V4MyCreditNewUserModalComponent } from '../../modals/v4-my-credit-new-user-modal/v4-my-credit-new-user-modal.component';
import { V4FeatureApplyCouponModalComponent } from '../../modals/v4-feature-apply-coupon-modal/v4-feature-apply-coupon-modal.component';

@Component({
  selector: 'app-v4-refill-credit',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    CurrencyPipe,
    CommonButtonV4Component,
    CommonAmountInputV4Component,
    V4ControlMessageComponent,
    FontAwesomeModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonInputFieldV4Component,
    FinancialStatementListV4Component
  ],
  templateUrl: './v4-refill-credit.component.html',
  styleUrl: './v4-refill-credit.component.scss'
})
export class V4RefillCreditComponent implements OnInit {
  private refillService = inject(RefillCreditService);
  private alertService = inject(V4AlertService);
  public dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private commonOnInitService = inject(CommonOnInitService);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);
  private destroyRef = inject(DestroyRef);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  @ViewChild(FinancialStatementListV4Component)
  private financialStatementList?: FinancialStatementListV4Component;

  credit = '0000000000';
  autoRecharge = false;

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

  faArrowsRotate = faArrowsRotate;
  faBolt = faBolt;
  faGift = faGift;
  readonly bellRingIcon = BellRing;
  readonly sparklesIcon = Sparkles;
  readonly dollarSignIcon = DollarSign;
  readonly zapIcon = Zap;
  readonly infoIcon = Info;
  readonly refreshCwIcon = RefreshCw;
  readonly creditCardIcon = CreditCard;
  readonly walletIcon = Wallet;
  readonly checkIcon = Check;
  readonly chevronRightIcon = ChevronRight;

  dbRechargeValue = { amount: 0, threshold: 0 };
  couponCode = new FormControl<string>('', [Validators.required]);
  featureCreditList: IFeatureCreditList[] = [];
  loading = signal(false);
  applying = false;
  isSubscribed: number;

  defaultPayment: IPaymentType = {
    paywith_check: 'check',
    paywith_wallet: 'wallet',
    authorize_net: 'Card',
    payflow_pro: 'Paypal'
  };

  ngOnInit(): void {
    this.getCredit();
    this.getAutoRecharge();
    this.getFeatureCreditList();
    this.getHeaderData();
    this.getCurrentPlan();
  }

  getHeaderData() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const response = res as IHeaderData;
        this.isSubscribed = response.isSubscribed;
        if (this.isSubscribed === 0) {
          this.openMyCreditModal();
        }
      });
  }

  openMyCreditModal() {
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');
    if (emailVerified === 1 && phoneVerified === 1) return;
    this.dialog
      .open(V4MyCreditNewUserModalComponent, {
        width: '510px',
        maxWidth: '93%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.addCredits) {
          this.openRechargeModal();
        }
      });
  }

  getCredit() {
    this.refillService
      .getCurrentCredit()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isCreditLoading = false;
        })
      )
      .subscribe((data) => {
        if (data?.success) {
          this.credit = String(data.data.credit);
        }
      });
  }

  getFeatureCreditList() {
    this.loading.set(true);
    this.refillService
      .featureCreditList()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.featureCreditList = res.data;
        }
      });
  }

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  applyCoupon() {
    this.couponCode.markAsTouched();
    if (this.couponCode.invalid) {
      this.alertService.warningAlert({ content: 'Coupon Code is required!!' });
      return;
    }

    this.applying = true;
    this.refillService
      .featureApplyCoupon({ coupon_code: this.couponCode.value as string })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.applying = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          const dialogRef = this.dialog.open(
            V4FeatureApplyCouponModalComponent,
            {
              disableClose: true,
              width: '440px',
              data: { ...res.data, type: 'refill' },
              panelClass: 'paddingless-modal-rounded'
            }
          );
          dialogRef.afterClosed().subscribe(() => {
            this.couponCode.reset();
            this.getFeatureCreditList();
            this.getCredit();
            this.headerService.setHeaderValueChanged(true);
          });
        }
      });
  }

  getAutoRecharge() {
    this.refillService
      .getAutoRecharge()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
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
      });
  }

  addAutoRecharge() {
    this.autoRechargeLoading = true;
    this.refillService
      .addAutoRecharge(this.threshold.value, this.amount.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
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
      });
  }

  deleteAutoRecharge() {
    this.autoRechargeLoading = true;
    this.refillService
      .deleteAutoRecharge()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
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
      });
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
    const dRef = this.dialog.open(RefillCreditRechargeModalV4Component, {
      width: '450px',
      maxWidth: '93%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res?.add) {
        this.getCredit();
        this.financialStatementList?.refresh();
        if (this.isWalletSource) {
          this.getCurrentPlan();
        }
      }
    });
  }

  private get isWalletSource(): boolean {
    return (
      this.defaultPayment[this.currentPlan?.subscription?.paymentMethod] ===
      'wallet'
    );
  }

  goToSubscription(): void {
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');
    if (emailVerified === 1 && phoneVerified === 1) {
      this.router.navigate(['/v4/manage/subscription'], {
        state: { returnUrl: this.router.url }
      });
    } else {
      const ref = this.alertService.warningAlert({
        content: this.verificationMessageService.getVerificationMessage({
          email_verified: emailVerified,
          phone_verified: phoneVerified
        }),
        doneMsg: 'Verify Now',
        isCancel: true,
        cancelMsg: 'Cancel'
      });
      ref.afterClosed().subscribe((res) => {
        if (res) {
          this.commonOnInitService.openEmailPhoneVerificationModal();
        }
      });
    }
  }

  onChangePaymentMethod(): void {
    this.dialog.open(V4ChangePaymentMethodModalComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { mode: 'change-payment' } as IChangePaymentModalData
    });
  }

  onUpdateCard(): void {
    this.dialog.open(V4ChangePaymentMethodModalComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { mode: 'update-card' } as IChangePaymentModalData
    });
  }

  getCurrentPlan(): void {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptionService
      .getCurrentlyUsedPlans(headerOptions)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isPaymentDetailsLoading = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.currentPlan = res.data;
          if (this.currentPlan?.subscription?.cardExpireMonth) {
            if (this.currentPlan?.subscription?.cardExpireMonth.length === 1) {
              this.expiryMonth = `0${this.currentPlan?.subscription?.cardExpireMonth}`;
            } else {
              this.expiryMonth =
                this.currentPlan?.subscription?.cardExpireMonth;
            }
          }
        }
      });
  }

  goToFinancialStatement(): void {
    this.router.navigate(['/v4/manage/financialstatement/index']);
  }
}

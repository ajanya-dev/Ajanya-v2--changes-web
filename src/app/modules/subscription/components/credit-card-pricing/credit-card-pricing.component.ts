import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  output,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  faAngleUp,
  faCircleCheck,
  faCircleExclamation,
  faMessage,
  faPhone,
  faPhoneArrowDownLeft,
  faChartSimple,
  faCircleInfo
} from '@fortawesome/pro-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BehaviorSubject, Subject, Subscription, take, takeUntil } from 'rxjs';
import { ScriptService } from 'src/app/core/services/script.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonCallMeComponent } from 'src/app/shared/v3/common-call-me/common-call-me.component';
import {
  CurrencyPipe,
  Location,
  NgClass,
  NgOptimizedImage,
  NgStyle,
  NgTemplateOutlet
} from '@angular/common';
import { CommonHelpButtonComponent } from 'src/app/layout/v3-layout/common-help-button/common-help-button.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import * as PlanData from './credit-card-plans.data';
import {
  IChoosePlan,
  ICurrentSubscriptionPlan,
  IPlanFeaturesAddonsListWithBill,
  IPlanWithFeatureList,
  SubscriptionPlanName
} from '../../model/subscription';

@Component({
  selector: 'app-credit-card-pricing',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NgStyle,
    NgClass,
    FontAwesomeModule,
    CommonHelpButtonComponent,
    MatTooltipModule,
    NgOptimizedImage,
    CurrencyPipe
  ],
  templateUrl: './credit-card-pricing.component.html',
  styleUrl: './credit-card-pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditCardPricingComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private scriptService = inject(ScriptService);
  private subscriptionService = inject(SubscriptionService);
  private changeDetector = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private localStorageService = inject(LocalStorageService);
  private clickTrackingService = inject(ClickTrackingService);
  private location = inject(Location);

  @Output() showAllPricingEvent = new EventEmitter();

  @Input({ required: true })
  currentPlanInput: BehaviorSubject<ICurrentSubscriptionPlan | undefined>;

  @Input({ required: true })
  planFeaturesInput: BehaviorSubject<
    IPlanFeaturesAddonsListWithBill | undefined
  >;

  selectPlan = output<IChoosePlan>();

  planFeatures = PlanData.planFeatures;
  planData?: Partial<Record<SubscriptionPlanName, IPlanWithFeatureList>>;
  availablePlans: SubscriptionPlanName[] = [];
  currentPlan?: SubscriptionPlanName;
  currentPlanDetails?: ICurrentSubscriptionPlan;
  showPayAsYouGo = signal<boolean>(false);
  subscriptions: Subscription[] = [];
  loading = false;

  faCircleCheck = faCircleCheck;
  faAngleUp = faAngleUp;
  faCircleExclamation = faCircleExclamation;
  faCircleInfo = faCircleInfo;
  faChartSimple = faChartSimple;
  faArrowRight = faArrowRight;

  supportNo = StaticWhiteLabelConditions.customerSupportNo;

  headerColors = [
    'var(--common-secondary-blue-color)',
    'var(--common-secondary-green-color)',
    'var(--common-secondary-violet-color)',
    'var(--common-secondary-yellow-color)',
    'var(--common-secondary-red-color)'
  ] as const;

  supportOptions = [
    { id: 'call', name: 'Call', icon: faPhone },
    { id: 'call_back', name: 'Callback', icon: faPhoneArrowDownLeft },
    { id: 'chat', name: 'Chat', icon: faMessage }
  ] as const;

  destroy$ = new Subject<boolean>();
  fromType: string | undefined;
  pageUrl: string | undefined;
  isOutside = false;
  enterPrisePlan: IPlanWithFeatureList[] = [];
  enterPrisePlanCode?: SubscriptionPlanName;
  screenWidth: number;
  loadigContent = false;
  autoClickOnPlan = false;
  outsidePage = false;
  savedAmount = 0;

  constructor() {
    if (this.router.url.includes('outside')) {
      this.outsidePage = true;
    }
  }

  ngOnInit(): void {
    this.currentPlan = this.localStorageService.getItem('currentPlan');
    this.autoClickOnPlan = this.localStorageService.getItem('autoClickPlan');
    this.scriptService.addZohoSrcipt();
    this.currentPlanInput.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      if (!val) return;
      this.currentPlanDetails = val;
      this.currentPlan = val.subscription.plan;
      this.changeDetector.detectChanges();
    });
    this.planFeaturesInput.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      if (!val) return;

      this.planData = val.plans.reduce<
        Partial<Record<SubscriptionPlanName, IPlanWithFeatureList>>
      >((obj, el) => {
        const item = obj;
        item[el.planCode] = el;
        return item;
      }, {});

      const monthlyPlan = this.planData?.['enterprise-custom-monthly-v2'];
      const yearlyPlan = this.planData?.['enterprise-custom-yearly-v2'];

      if (monthlyPlan) {
        this.enterPrisePlan.push(monthlyPlan);
      }

      if (yearlyPlan) {
        this.enterPrisePlan.push(yearlyPlan);
      }

      if (this.enterPrisePlan.length === 2) {
        const montlyAmount = this.enterPrisePlan?.[0]?.planPrice;
        const yealyWithoutOffer = Number(montlyAmount) * 12;
        const yealyWithOffer = this.enterPrisePlan?.[1]?.planPrice;

        this.savedAmount = yealyWithoutOffer - Number(yealyWithOffer);
      }

      this.availablePlans = [...val.plans.map((el) => el.planCode)];
      this.changeDetector.detectChanges();

      if (!this.outsidePage) {
        this.isShowPayAsYouGo();
      }
    });

    this.fromType = this.route.snapshot.queryParams?.from;
    this.pageUrl = this.route.snapshot.queryParams?.page;
    if (this.pageUrl && this.pageUrl.startsWith('/')) {
      this.pageUrl = this.pageUrl.substring(1);
    }

    if (this.fromType) {
      this.isOutside = true;
    }

    this.screenWidth = window.innerWidth;
    if (this.outsidePage) {
      this.isShowPayAsYouGo();
    }

    this.route.queryParams.subscribe((res) => {
      if (!res.type) {
        this.showAllPricingEvent.emit(true);
      }
    });
  }

  choosePlan(planCode?: SubscriptionPlanName) {
    if (this.router.url.includes('/outside/pricing-plan')) {
      if (!this.localStorageService.appToken) {
        this.handleNoAppToken();
        return;
      }
      this.loadigContent = true;
      this.localStorageService.setItem('autoClickPlan', 1);

      if (this.checkEmailPhoneVerified()) {
        return;
      }

      this.navigateToManageSubscriptionPlan();

      return;
    }

    if (planCode === 'free-plan') {
      this.router.navigateByUrl('manage/payments/main/pay/card/ach');
    }

    if (!planCode) return;

    if (this.checkEmailPhoneVerified()) {
      return;
    }

    const plan = this.planData?.[planCode];

    if (!plan) return;

    this.selectPlan.emit({
      success: true,
      data: {
        planCode: plan.planCode,
        intervelType: plan.billIntervalUnit ?? 'months',
        nextStep: 'addOns',
        currentPlan: this.currentPlanDetails,
        allData: this.planFeaturesInput.value,
        hideAddon: this.availablePlans.includes(plan.planCode)
      }
    });
  }

  checkEmailPhoneVerified(): boolean {
    const isRedirectedFromOutside = this.route.snapshot.queryParams?.redirected;
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');

    if (
      phoneVerified === 0 ||
      (emailVerified === 0 && isRedirectedFromOutside === '1')
    ) {
      this.router.navigateByUrl(
        'manage/users/verify-email-phone?returnUrl=manage/subscription/plan'
      );
      return true;
    }
    return false;
  }

  private handleNoAppToken() {
    if (this.fromType === 'zm') {
      window.location.href = 'https://app.zilmoney.com/register';
    } else if (this.fromType === 'ocw') {
      this.router.navigateByUrl('/register');
    }
  }

  private navigateToManageSubscriptionPlan() {
    const targetUrl = `/manage/subscription/plan?redirected=1&from=${
      this.fromType
    }&page=${this.pageUrl ?? ''}`;
    this.router.navigateByUrl(targetUrl);
  }

  isShowPayAsYouGo() {
    if (this.router.url.includes('outside')) {
      this.showPayAsYouGo.set(true);
      return;
    }

    this.showPayAsYouGo.set(
      this.localStorageService.getItem('showPayAsYouGo') === 1
    );

    this.subscriptions.push(
      this.subscriptionService.isShowPayAsYouGo().subscribe((res) => {
        if (res.data?.hidePayAsYouGo === 1) {
          this.showPayAsYouGo.set(false);
          this.localStorageService.setItem('showPayAsYouGo', 0);
        } else {
          this.showPayAsYouGo.set(true);
          this.localStorageService.setItem('showPayAsYouGo', 1);
          if (this.autoClickOnPlan) {
            this.choosePlan('pay-as-you-go-monthly-v3');
          }
        }
      })
    );
  }

  onSupportClick(id: (typeof this.supportOptions)[number]['id']) {
    if (id === 'call') {
      document.location.href = `tel:${StaticWhiteLabelConditions.customerSupportNo}`;
      return;
    }

    if (id === 'chat') {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
      return;
    }

    if (id === 'call_back') {
      this.openCallMeModal();
    }
  }

  /**
   * @description Open Call me now modal.
   */
  openCallMeModal(): void {
    const dialogRef = this.dialog.open(CommonCallMeComponent, {
      width: '350px',
      maxWidth: '90%',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            content: `Thank you for requesting a callback. We'll be in touch with you shortly. Expect a call from us soon.`,
            close: false,
            isOk: true
          });
          this.changeDetector.detectChanges();
        }
      });
  }

  onClose(): void {
    this.subscriptionService.closeSubscriptionPage();
  }

  goBack() {
    if (this.router.url.includes('/outside/pricing-plan')) {
      if (this.fromType === 'zm') {
        window.location.href = `https://zilmoney.com/${this.pageUrl ?? ''}`;
      } else if (this.fromType === 'ocw') {
        window.location.href = `https://onlinecheckwriter.com/${
          this.pageUrl ?? ''
        }`;
      }
    } else {
      this.location.back();
    }
  }

  /**
   * Handles the 'Book Now' button click event.
   *
   * This function checks the current URL and the value of `fromType` to determine
   * which Calendly link to open in a new window.
   */
  onBookNow(): void {
    // Track when clicked on book a demo.
    if (this.localStorageService.appToken) {
      this.clickTrackingService.trackBookDemoClick()?.pipe(take(1)).subscribe();
    }

    // Check if the current URL includes '/outside/pricing-plan'
    if (this.router.url.includes('/outside/pricing-plan')) {
      // Determine the source of the booking request based on 'fromType'
      if (this.fromType === 'ocw') {
        // Open Calendly link with 'ocwui' source parameter
        window.open('https://calendly.com/zmn/demo?utm_source=ocwui');
      } else if (this.fromType === 'zm') {
        // Open Calendly link with 'zmui' source parameter
        window.open('https://calendly.com/zmn/demo?utm_source=zmui');
      }
    } else {
      // Default behavior: Open Calendly link with 'ocwui' source parameter
      window.open('https://calendly.com/zmn/demo?utm_source=ocwui');
    }
  }

  bookDemo(): void {
    window.open('https://calendly.com/zmn/demo?utm_source=ocwu');
  }

  showAllPricing(): void {
    this.router.navigate(['manage/subscription/plan']);
  }

  onCalculateFee(): void {
    window.open('/outside/fee-calculator');
  }

  ngOnDestroy(): void {
    this.scriptService.hideZohoChat();
    this.destroy$.next(true);
  }
}

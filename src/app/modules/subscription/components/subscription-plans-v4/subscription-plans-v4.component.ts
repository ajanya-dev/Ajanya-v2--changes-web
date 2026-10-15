import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  output,
  signal
} from '@angular/core';
import { BehaviorSubject, Subject, Subscription, take, takeUntil } from 'rxjs';
import {
  CurrencyPipe,
  Location,
  NgClass,
  NgOptimizedImage,
  NgStyle,
  NgTemplateOutlet
} from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faAngleUp,
  faCircleCheck,
  faCheck,
  faCircleExclamation,
  faMessage,
  faPhone,
  faPhoneArrowDownLeft,
  faChartSimple,
  faCircleInfo
} from '@fortawesome/pro-solid-svg-icons';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonCallMeComponent } from 'src/app/shared/v3/common-call-me/common-call-me.component';
import { V4CallBackModalComponent } from 'src/app/shared/modal/v4-call-back-modal/v4-call-back-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { V4HelpButtonComponent } from 'src/app/shared/V4/v4-help-button/v4-help-button.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { EmailPhoneVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/email-phone-verification-modal-v4/email-phone-verification-modal-v4.component';
import { environment } from 'src/environments/environment';
import * as PlanData from '../subscription-plans-new/subscription-plans-new.data';
import {
  IChoosePlan,
  ICurrentSubscriptionPlan,
  IPlanFeaturesAddonsListWithBill,
  IPlanWithFeatureList,
  SubscriptionPlanName
} from '../../model/subscription';

@Component({
  selector: 'app-subscription-plans-v4',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NgStyle,
    NgClass,
    FontAwesomeModule,
    V4HelpButtonComponent,
    MatTooltipModule,
    NgOptimizedImage,
    CurrencyPipe
  ],
  templateUrl: './subscription-plans-v4.component.html',
  styleUrl: './subscription-plans-v4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionPlansV4Component implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private scriptService = inject(ScriptService);
  private subscriptionService = inject(SubscriptionService);
  private location = inject(Location);
  private changeDetector = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private localStorageService = inject(LocalStorageService);
  private readonly isV4 = this.localStorageService.getItem('isV4LayoutEnabled') === 1;
  private clickTrackingService = inject(ClickTrackingService);


  @ViewChild('plansSection') plansSection?: ElementRef<HTMLElement>;

  @Input({ required: true })
  currentPlanInput: BehaviorSubject<ICurrentSubscriptionPlan | undefined>;

  @Input({ required: true })
  planFeaturesInput: BehaviorSubject<
    IPlanFeaturesAddonsListWithBill | undefined
  >;

  selectPlan = output<IChoosePlan>();

  planFeatures = PlanData.planFeatures;
  additionalBenefits = PlanData.additionalBenefits;
  planData?: Partial<Record<SubscriptionPlanName, IPlanWithFeatureList>>;
  availablePlans: SubscriptionPlanName[] = [];
  currentPlan?: SubscriptionPlanName;
  currentPlanDetails?: ICurrentSubscriptionPlan;
  showPayAsYouGo = signal<boolean>(false);
  payAsYouGoResolved = signal<boolean>(false);
  subscriptions: Subscription[] = [];
  loading = false;
  isMonthlyPlan = signal(false);
  isYearlyPlan = signal(false);

  faCircleCheck = faCircleCheck;
  faCheck = faCheck;
  faAngleUp = faAngleUp;
  faCircleExclamation = faCircleExclamation;
  faCircleInfo = faCircleInfo;
  faChartSimple = faChartSimple;

  supportNo = StaticWhiteLabelConditions.customerSupportNo;


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
  enterPriseMonthlyPlanCode?: SubscriptionPlanName;
  enterPriseYearlyPlanCode?: SubscriptionPlanName;
  screenWidth: number;
  loadigContent = false;
  autoClickOnPlan = false;
  outsidePage = false;
  savedAmount = 0;

  isOlliePay = false;

  constructor() {
    if (this.router.url.includes('outside')) {
      this.outsidePage = true;
    }
  }

  ngOnInit(): void {
    if (environment.env_id === 'olliepay') {
      this.isOlliePay = true;
    }

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

      this.enterPrisePlan.forEach((el) => {
        if (el.planCode === 'enterprise-custom-monthly-v2') {
          this.enterPriseMonthlyPlanCode = el.planCode;
        } else {
          this.enterPriseYearlyPlanCode = el.planCode;
        }
      });

      if (this.enterPrisePlan.length === 2) {
        const montlyAmount = this.enterPrisePlan?.[0]?.planPrice;
        const yealyWithoutOffer = Number(montlyAmount) * 12;
        const yealyWithOffer = this.enterPrisePlan?.[1]?.planPrice;

        this.savedAmount = yealyWithoutOffer - Number(yealyWithOffer);
      }

      this.availablePlans = [...val.plans.map((el) => el.planCode)];
      if (this.availablePlans?.length) {
        this.isMonthlyPlan.set(this.availablePlans.includes('enterprise-custom-monthly-v2'));
        this.isYearlyPlan.set(this.availablePlans.includes('enterprise-custom-yearly-v2'));
      }
      this.changeDetector.detectChanges();

      if (!this.outsidePage) {
        this.isShowPayAsYouGo();
      }
    });

    this.fromType = this.route.snapshot.queryParams?.from;
    if (this.outsidePage && !this.fromType) {
      this.fromType = 'ocw';
    }
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
  }

  choosePlan(planCode?: SubscriptionPlanName) {
    if (this.router.url.includes('/outside/pricing-plan')) {
      if (!this.localStorageService.appToken) {
        this.handleNoAppToken();
        return;
      }
      this.loadigContent = true;
      this.localStorageService.setItem('autoClickPlan', 1);

      if (this.checkEmailPhoneVerified(() => this.navigateToManageSubscriptionPlan())) {
        return;
      }

      this.navigateToManageSubscriptionPlan();

      return;
    }

    if (!planCode) return;

    if (this.checkEmailPhoneVerified(() => this.choosePlan(planCode))) {
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

  checkEmailPhoneVerified(onVerified: () => void): boolean {
    const isRedirectedFromOutside = this.route.snapshot.queryParams?.redirected;
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');

    if (
      phoneVerified === 0 ||
      (emailVerified === 0 && isRedirectedFromOutside === '1')
    ) {
      if (this.isV4) {
        this.openVerificationModal(onVerified);
      } else {
        this.router.navigateByUrl(
          'manage/users/verify-email-phone?returnUrl=manage/subscription/plan'
        );
      }
      return true;
    }
    return false;
  }

  private openVerificationModal(onVerified: () => void): void {
    const dialogRef = this.dialog.open(EmailPhoneVerificationModalV4Component, {
      width: '550px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.emailVerified && result?.phoneVerified) {
        onVerified();
      }
    });
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

  /**
   * Single source of truth for whether the Pay As You Go card is rendered.
   * The layout (1- vs 2-column grid) and the card's own `@if` must use the
   * exact same condition, otherwise an enterprise-only plan set leaves a
   * two-column grid with a single child and the Enterprise card collapses.
   */
  get showPayAsYouGoCard(): boolean {
    return (
      (this.availablePlans.includes('pay-as-you-go-monthly-v3') ||
        !this.availablePlans.length) &&
      this.showPayAsYouGo()
    );
  }

  /**
   * Both async sources are done — plan features have loaded (or we're on an
   * outside page) AND the pay-as-you-go visibility decision has resolved.
   * Gating both cards on this prevents the Enterprise card from rendering
   * before the Pay As You Go card; they appear together once loading is done.
   */
  get plansReady(): boolean {
    return (
      (this.availablePlans.length > 0 || this.isOutside) &&
      this.payAsYouGoResolved()
    );
  }

  /**
   * Enterprise plan data is still in flight — show a loader in the pricebox
   * instead of the priced fallback (which would briefly render $0.00).
   * `isOutside` skips the loader since those pages render custom pricing
   * immediately without the in-app data fetch.
   */
  get isEnterpriseLoading(): boolean {
    return !this.availablePlans.length && !this.isOutside;
  }

  /**
   * Whether the Enterprise card should show the "Volume / Custom Pricing"
   * state — true for volume-type plans, outside pages, and when no priced
   * enterprise plan exists at all (only the custom text + phone is shown).
   */
  get isCustomEnterprise(): boolean {
    return (
      this.enterPrisePlan?.[0]?.planCategoryType === 4 ||
      this.isOutside ||
      !this.enterPrisePlan.length
    );
  }

  isShowPayAsYouGo() {
    if (this.router.url.includes('outside')) {
      this.showPayAsYouGo.set(true);
      this.payAsYouGoResolved.set(true);
      return;
    }
    this.subscriptions.push(
      this.subscriptionService.isShowPayAsYouGo().subscribe({
        next: (res) => {
          if (res.data?.hidePayAsYouGo === 1) {
            this.showPayAsYouGo.set(false);
          } else {
            this.showPayAsYouGo.set(true);
            if (this.autoClickOnPlan) {
              this.choosePlan('pay-as-you-go-monthly-v3');
            }
          }
          this.payAsYouGoResolved.set(true);
        },
        error: () => this.payAsYouGoResolved.set(true)
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
    if (this.isV4) {
      const dialogRef = this.dialog.open(V4CallBackModalComponent, {
        width: '540px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
      });
      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res?.success) {
            this.v4AlertService.successAlert({
              content: `Thank you for requesting a callback. We'll be in touch with you shortly. Expect a call from us soon.`,
              close: false
            });
          }
        });
    } else {
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
   * Smooth-scroll back up to the plan cards. Wired to the dark CTA footer's
   * primary action for already-authenticated in-app users.
   */
  scrollToPlans(): void {
    this.plansSection?.nativeElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
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

  onCalculateFee(): void {
    window.open('/outside/fee-calculator');
  }

  ngOnDestroy(): void {
    this.scriptService.hideZohoChat();
    this.destroy$.next(true);
  }
}

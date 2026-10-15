import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  output
} from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
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
  faMessage,
  faPhone,
  faPhoneArrowDownLeft
} from '@fortawesome/pro-solid-svg-icons';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CommonCallMeComponent } from 'src/app/shared/v3/common-call-me/common-call-me.component';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { CommonHelpButtonComponent } from 'src/app/layout/v3-layout/common-help-button/common-help-button.component';
import * as PlanData from './subscription-plans.data';
import {
  IChoosePlan,
  ICurrentSubscriptionPlan,
  IPlanFeaturesAddonsListWithBill,
  IPlanWithFeatureList,
  SubscriptionPlanName
} from '../../model/subscription';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    CurrencyPipe,
    NgStyle,
    NgClass,
    FontAwesomeModule,
    CommonHelpButtonComponent,
    NgOptimizedImage
  ],
  templateUrl: './subscription-plans.component.html',
  styleUrl: './subscription-plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionPlansComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private scriptService = inject(ScriptService);
  private subscriptionService = inject(SubscriptionService);
  private location = inject(Location);
  private changeDetector = inject(ChangeDetectorRef);

  @Input({ required: true })
  currentPlanInput: BehaviorSubject<ICurrentSubscriptionPlan | undefined>;

  @Input({ required: true })
  planFeaturesInput: BehaviorSubject<
    IPlanFeaturesAddonsListWithBill | undefined
  >;

  selectPlan = output<IChoosePlan>();

  planFeatures: typeof PlanData.planFeatures;
  planData?: Partial<Record<SubscriptionPlanName, IPlanWithFeatureList>>;
  planFeatureValues: typeof PlanData.planFeaturesValues;
  availablePlans: SubscriptionPlanName[] = [];
  currentPlan?: SubscriptionPlanName;
  currentPlanDetails?: ICurrentSubscriptionPlan;
  talkSalesOpen = false;

  loading = false;

  faCircleCheck = faCircleCheck;
  faAngleUp = faAngleUp;

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
    { id: 'call_back', name: 'Call Back', icon: faPhoneArrowDownLeft },
    { id: 'chat', name: 'Chat', icon: faMessage }
  ] as const;

  destroy$ = new Subject<boolean>();

  constructor() {
    this.planFeatures = PlanData.planFeatures;
    this.planFeatureValues = PlanData.planFeaturesValues;
  }

  ngOnInit(): void {
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

      this.availablePlans = [...val.plans.map((el) => el.planCode)];
      this.changeDetector.detectChanges();
    });
  }

  choosePlan(val: IPlanWithFeatureList) {
    if (val.planCategoryType === 4) {
      if (StaticWhiteLabelConditions.zohoSupportChat)
        window.location.replace(StaticWhiteLabelConditions.zohoSupportChat);
      else window.open(StaticWhiteLabelConditions?.helpWebsite, '_blank');
      return;
    }

    this.selectPlan.emit({
      success: true,
      data: {
        planCode: val.planCode,
        intervelType:
          val.billIntervalUnit ?? 'months',
        nextStep: 'addOns',
        currentPlan: this.currentPlanDetails,
        allData: this.planFeaturesInput.value,
        hideAddon: this.availablePlans.includes(val.planCode)
      }
    });
  }

  talkSalesChange() {
    this.talkSalesOpen = !this.talkSalesOpen;
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
            timeout: 2000
          });
          this.talkSalesOpen = false;
          this.changeDetector.detectChanges();
        }
      });
  }

  onClose(): void {
    this.subscriptionService.closeSubscriptionPage();
  }

  goBack() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.scriptService.hideZohoChat();
    this.destroy$.next(true);
  }
}

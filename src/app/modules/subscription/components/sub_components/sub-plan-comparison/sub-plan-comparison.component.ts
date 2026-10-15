import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  inject
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import {
  IChoosePlan,
  IComparisonData,
  IPlans,
  IFeatures,
  ISubscriptionPlanGroup
} from 'src/app/modules/subscription/model/subscription';
import { ScriptService } from 'src/app/core/services/script.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { NgFor, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-sub-plan-comparison',
  templateUrl: './sub-plan-comparison.component.html',
  styleUrls: ['./sub-plan-comparison.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, NgClass]
})
export class SubPlanComparisonComponent implements OnInit, OnDestroy {
  private scriptService = inject(ScriptService);

  @Input() comparison_data$: Observable<IComparisonData>;
  @Output() onChoosePlan = new EventEmitter<IChoosePlan>();

  subscriptions: Subscription[] = [];
  planslist: IPlans[];
  featureslist: IFeatures[];
  featureDetails?: ISubscriptionPlanGroup;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Comparison Table Data
    this.subscriptions.push(
      this.comparison_data$.subscribe((res) => {
        this.planslist = res?.plans;
        this.featureslist = res?.features;
        this.featureDetails = Object.prototype.hasOwnProperty.call(
          res,
          'plan-feature-info'
        )
          ? res['plan-feature-info']
          : undefined;
      })
    );
  }

  // =============> Choose Plan =============== //
  chooseComparisonPlan(
    planCode: string,
    plan: IPlans,
    buttonEl: HTMLButtonElement
  ) {
    if (plan?.planCategoryType === 4) {
      if (StaticWhiteLabelConditions.zohoSupportChat)
        window.location.replace(StaticWhiteLabelConditions.zohoSupportChat);
      else window.open(StaticWhiteLabelConditions?.helpWebsite, '_blank');
    } else if (plan?.planCategoryType !== 4) {
      this.emitSelectedData(planCode, plan?.billIntervalUnit);
    }

    this.elSelector('.comparison_choose_btn').forEach((el: Element) => {
      const item = el;
      item.classList.remove('active');
      item.innerHTML = 'Choose Plan';
    });

    const btnEl = buttonEl;

    btnEl.innerHTML = 'Selected';
    btnEl.classList.add('active');
  }

  /**  EMIT SELECTED DATA */
  emitSelectedData(planCode: string, type: 'months' | 'years'): void {
    this.onChoosePlan.emit({
      success: true,
      data: {
        planCode,
        intervelType: type,
        nextStep: 'addOns'
      }
    });
  }

  elSelector(foc: string): NodeListOf<Element> {
    return document.querySelectorAll(foc);
  }

  gtagScript(planCode: string) {
    this.scriptService.gtagEventScript('choose-plan', { planCode });
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

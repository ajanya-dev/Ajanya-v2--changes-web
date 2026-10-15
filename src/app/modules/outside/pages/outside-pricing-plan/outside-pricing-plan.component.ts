import { Component, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SubscriptionPlansNewComponent } from 'src/app/modules/subscription/components/subscription-plans-new/subscription-plans-new.component';
import {
  IPlanFeaturesAddonsListWithBill,
  SubscriptionPlanName
} from 'src/app/modules/subscription/model/subscription';
import { SubscriptionMainComponent } from 'src/app/modules/subscription/pages/subscription-main/subscription-main.component';
import { ActivatedRoute } from '@angular/router';
import { PricingHeaderOcwComponent } from '../pricing-page-header/pricing-header-ocw/pricing-header-ocw.component';
import { PricingHeaderZilmoneyComponent } from '../pricing-page-header/pricing-header-zilmoney/pricing-header-zilmoney.component';

@Component({
  selector: 'app-outside-pricing-plan',
  standalone: true,
  imports: [
    SubscriptionPlansNewComponent,
    SubscriptionMainComponent,
    PricingHeaderOcwComponent,
    PricingHeaderZilmoneyComponent,
  ],
  templateUrl: './outside-pricing-plan.component.html',
  styleUrl: './outside-pricing-plan.component.scss'
})
export class OutsidePricingPlanComponent{

  private route = inject(ActivatedRoute);

  planFeaturesInput: BehaviorSubject<
    IPlanFeaturesAddonsListWithBill | undefined
  >;

  currentPlan?: SubscriptionPlanName;
  redirectedFrom = this.route.snapshot.queryParams?.from ?? 'ocw';
}

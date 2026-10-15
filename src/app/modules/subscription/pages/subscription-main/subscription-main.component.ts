/* eslint-disable no-restricted-globals */

import { LocationStrategy } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { BehaviorSubject, forkJoin, Subscription } from 'rxjs';
import {
  IBillingAddress,
  IChoosePlan,
  ICurrentSubscriptionPlan,
  IPlanFeaturesAddonsList,
  IPlanFeaturesAddonsListWithBill,
  IPlanWithFeatureList,
  SubPageSteps
} from 'src/app/modules/subscription/model/subscription';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ScriptService } from 'src/app/core/services/script.service';
import {
  V4SubscriptionAddonsFlowModalComponent,
  IAddonFlowModalData
} from 'src/app/modules/user-v4/modals/v4-subscription-addons-flow-modal/v4-subscription-addons-flow-modal.component';
import { SubscriptionPaymentComponent } from '../../components/subscription-payment/subscription-payment.component';
import { SubBillingAddressComponent } from '../../components/sub-billing-address/sub-billing-address.component';
import { SubAddonComponent } from '../../components/sub-addon-list/sub-addon-list.component';
import { SubscriptionPlansNewComponent } from '../../components/subscription-plans-new/subscription-plans-new.component';
import { SubscriptionPlansV4Component } from '../../components/subscription-plans-v4/subscription-plans-v4.component';
import { CreditCardPricingComponent } from '../../components/credit-card-pricing/credit-card-pricing.component';
import { SubscriptionPlanNew2Component } from '../../components/subscription-plan-new2/subscription-plan-new2.component';

@Component({
  selector: 'app-subscription-main',
  templateUrl: './subscription-main.component.html',
  styleUrls: ['./subscription-main.component.scss'],
  standalone: true,
  imports: [
    SubAddonComponent,
    SubBillingAddressComponent,
    SubscriptionPaymentComponent,
    SubscriptionPlansNewComponent,
    SubscriptionPlansV4Component,
    CreditCardPricingComponent,
    SubscriptionPlanNew2Component
  ]
})
export class SubscriptionMainComponent implements OnInit, OnDestroy {
  private subscriptionService = inject(SubscriptionService);
  private locationStrategy = inject(LocationStrategy);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);

  pageId: SubPageSteps = 'pricing_table' as const;
  readonly isV4LayoutEnabled = this.localStorageService.getItem('isV4LayoutEnabled') === 1;

  subscriptions: Subscription[] = [];
  billingAddress: IBillingAddress;

  currentPlan = new BehaviorSubject<ICurrentSubscriptionPlan | undefined>(
    undefined
  );

  planFeatureAddonList = new BehaviorSubject<
    IPlanFeaturesAddonsListWithBill | undefined
  >(undefined);

  selected_plan_details: IChoosePlan;
  returnUrl: string;
  directPlancode: string; // If exisits then directly go to billing
  isFromTrial: number | undefined;

  isPathTrue = false;
  creditCardPlan = false;

  constructor() {
    this.loadCurrentUrl();
    this.isFromTrial =
      this.router.getCurrentNavigation()?.extras?.state?.isFromTrial;
      this.creditCardPlan =  this.route.snapshot.queryParams.type === 'cc';
  }

  ngOnInit(): void {
    this.directPlancode = this.route.snapshot.queryParams?.plancode;
    if (!this.router.url.includes('/outside/pricing-plan')) {
      this.loadPlanData();
    }
    this.preventBrowserBackButton();
  }

  loadCurrentUrl() {
    if (
      this.router.url === '/manage/subscription/plan/change-payment' ||
      this.router.url === '/v4/manage/subscription/plan/change-payment' ||
      this.router.url === '/manage/subscription/plan/change-payment/card' ||
      this.router.url === '/v4/manage/subscription/plan/change-payment/card' ||
      this.router.url === '/manage/subscription/plan/change-payment/update-card'||
      this.router.url === '/v4/manage/subscription/plan/change-payment/update-card'
    ) {
      this.pageId = 'payment';
    }

    if (this.router.url === '/manage/subscription/plan/change' || this.router.url === '/v4/manage/subscription/plan/change') {
      this.loadCurrentPlan();
    }

    this.returnUrl = history.state?.returnUrl;
  }

  // Disable browser back button
  preventBrowserBackButton(): void {
    history.pushState(null, '', location.href);
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', location.href);
    });
  }

  loadPlanData(): void {
    const planFeature = this.subscriptionService.planFeatures(this.isFromTrial);
    const billing = this.subscriptionService.getBillingAddress();

    const requestArray = [planFeature, billing] as const;

    this.subscriptions.push(
      forkJoin(requestArray).subscribe(([planFeatureRes, billingRes]) => {
        if (planFeatureRes?.success) {
          if (this.directPlancode) {
            planFeatureRes?.data?.plans?.forEach((plan) => {
              if (plan.planCode === this.directPlancode) {
                this.setChosenPlan(plan, planFeatureRes.data);
              }
            });
          }
        }

        if (billingRes?.success) {
          this.billingAddress = billingRes.data;
        }

        this.planFeatureAddonList.next({
          ...planFeatureRes.data,
          billingAddress: this.billingAddress
        });

        if (this.router.url === '/manage/subscription/plan/change-addon' || this.router.url === '/v4/manage/subscription/plan/change-addon') {
          this.isPathTrue = true;
          this.loadCurrentPlan();
        }
      })
    );
  }

  redirectToAddonPage() {
    if (this.router.url === '/manage/subscription/plan/change-addon' || this.router.url === '/v4/manage/subscription/plan/change-addon') {
      this.isPathTrue = false;
      const chosenPlan: IChoosePlan = {
        success: true,
        data: {
          planCode: this.currentPlan.value?.subscription.plan as string,
          intervelType: this.currentPlan.value?.subscription
            .intervalUnit as 'months',
          nextStep: 'addOns',
          allData: this.planFeatureAddonList.value,
          currentPlan: this.currentPlan.value
        }
      };
      this.onSelectedPlan(chosenPlan);
    }
  }

  setChosenPlan(plan: IPlanWithFeatureList, allData: IPlanFeaturesAddonsList) {
    const chosenPlan: IChoosePlan = {
      success: true,
      data: {
        planCode: plan.planCode,
        intervelType: plan.billIntervalUnit,
        nextStep: 'billingAddress',
        allData,
        grandTotal: Number(plan.planPrice)
      }
    };

    this.onSelectedPlan(chosenPlan);
  }

  loadCurrentPlan(): void {
    this.subscriptions.push(
      this.subscriptionService.getCurrentPlans().subscribe((res) => {
        if (res?.success) {
          this.currentPlan.next(res?.data);
          this.redirectToAddonPage();
        }
      })
    );
  }

  onSelectedPlan(emited: IChoosePlan): void {
    // V4 layout collapses the addOns → billing → payment pages into a single
    // multi-step modal. When the user picks a plan from the pricing table
    // (i.e. the only step that emits with a planCode), divert to that modal
    // instead of advancing through the legacy v3 pages.
    if (
      this.isV4LayoutEnabled &&
      this.pageId === 'pricing_table' &&
      emited.data.planCode
    ) {
      this.openV4AddonsFlow(emited);
      return;
    }
    this.pageId = emited.data.nextStep;
    this.selected_plan_details = emited;
  }

  private openV4AddonsFlow(emited: IChoosePlan): void {
    const dialogRef = this.dialog.open(V4SubscriptionAddonsFlowModalComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        isFromTrial: this.isFromTrial,
        initialPlanCode: emited.data.planCode,
        initialIntervalType: emited.data.intervelType,
        currentPlan: this.currentPlan.value,
        isFromPricingTable: true
      } as IAddonFlowModalData
    });
    this.subscriptions.push(
      dialogRef.afterClosed().subscribe(() => {
        // Modal handles its own success navigation
        // (`/v4/manage/subscription/completed`); on cancel we leave the user
        // on the pricing table.
      })
    );
  }

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    this.goBack();
  }

  goBack(): void {
    let url: string;
    if (this.returnUrl) {
      url = this.returnUrl;
    } else {
      url = this.isV4LayoutEnabled ? '/v4/manage/home' : 'manage/cheque';
    }

    const fromType = this.route.snapshot.queryParams?.from;
    const pageUrl = this.route.snapshot.queryParams?.page;
    const isRedirectedFromOutside = this.route.snapshot.queryParams?.redirected;

    if (
      this.router.url.includes('/outside/pricing-plan') ||
      isRedirectedFromOutside === '1'
    ) {
      if (fromType === 'zm') {
        window.location.href = `https://zilmoney.com/${pageUrl ?? ''}`;
      } else if (fromType === 'ocw') {
        window.location.href = `https://onlinecheckwriter.com/${pageUrl ?? ''}`;
      }
      return;
    }

    const alert = this.openConfirmAlert(
      'Are you sure you want to leave this page?'
    );
    alert.afterClosed().subscribe((r) => {
      if (r) {
        this.scriptService.gtagEventScript('upgrade-plan-exit');
        this.router.navigateByUrl(url);
      }
    });
  }

  openConfirmAlert(content: string) {
    const service = this.isV4LayoutEnabled ? this.v4AlertService : this.alertService;
    return service.confirmAlert({ content });
  }

  showAllPricingEvent(ev: boolean): void{
    if(ev){
      this.creditCardPlan = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

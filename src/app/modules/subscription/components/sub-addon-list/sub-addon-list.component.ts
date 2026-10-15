import { ActivatedRoute, Router } from '@angular/router';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  SelectedAddonCodes,
  SelectedPlanCodes
} from 'src/app/data/data/subscription';
import {
  IAddOns,
  IChoosePlan,
  ICurrentAddOns,
  ICurrentSubscriptionPlan,
  IPlanFeaturesAddonsList,
  ISelectedAddOns
} from 'src/app/modules/subscription/model/subscription';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SubBiilingCalculationComponent } from '../sub_components/sub-biiling-calculation/sub-biiling-calculation.component';
import { CommonHelpButtonComponent } from '../../../../layout/v3-layout/common-help-button/common-help-button.component';

@Component({
  selector: 'app-sub-addon-list',
  templateUrl: './sub-addon-list.component.html',
  styleUrls: ['./sub-addon-list.component.scss'],
  standalone: true,
  imports: [
    CommonHelpButtonComponent,
    MatTooltip,
    FaIconComponent,
    NgFor,
    NgIf,
    FormsModule,
    SubBiilingCalculationComponent,
    CurrencyPipe
  ]
})
export class SubAddonComponent implements OnInit, OnDestroy {
  @Input() selected_plan_details: IChoosePlan;
  @Output() onChoosePlan = new EventEmitter<IChoosePlan>();

  data_for_billing$ = new BehaviorSubject<IChoosePlan>({} as IChoosePlan);
  plan_feature_addon_list: IPlanFeaturesAddonsList | undefined;

  subscriptions: Subscription[] = [];
  selectedPlanCode: string;
  selectedAddOn: ISelectedAddOns[] = [];
  current_plan: ICurrentSubscriptionPlan | undefined;
  addOnsList: IAddOns[];
  dropDownList: number[] = [];
  checkRoutePath: string | undefined;
  isPath = false;
  addonCodeList: string[] = SelectedAddonCodes.addonCodeList();
  hideAddonsForSomePlansList: string[] = SelectedPlanCodes.planCodeList();
  hideAddon: boolean | undefined;
  addOnsItem: IAddOns[] | undefined;
  filteredAddOnList: IAddOns[] | undefined;
  hiddenTriggered = false;

  private localStorageService = inject(LocalStorageService);
  private alertService = inject(AlertService);
  constructor(
    private subscriptionService: SubscriptionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.routeConfig?.path !== 'plan/change-addon') {
      this.isPath = true;
    }
    this.loadData();
    this.loadDropDownList();
  }

  loadData(): void {
    this.checkRoutePath = this.route.snapshot.routeConfig?.path;
    for (let i = 0; i < this.hideAddonsForSomePlansList.length; i += 1) {
      const hideAddonsPlan = this.hideAddonsForSomePlansList[i];

      if (this.selected_plan_details.data.planCode === hideAddonsPlan) {
        this.hideAddon = true;
        this.hiddenTriggered = true;
      } else if (!this.hiddenTriggered) {
        this.hideAddon = false;
      }
    }

    if (this.selected_plan_details) {
      this.selectedPlanCode = this.selected_plan_details?.data?.planCode;
      if (!this.hiddenTriggered) {
        this.hideAddon = this.selected_plan_details?.data?.hideAddon;
      }
      this.plan_feature_addon_list = this.selected_plan_details.data?.allData;
      this.current_plan = this.selected_plan_details?.data?.currentPlan;
      this.setAddOnes(this.selected_plan_details?.data?.selectedAddon);
    }

    this.addOnsItem = this.selected_plan_details?.data?.allData?.addOns;
    this.filteredAddOnList = this.addOnsItem
      ?.slice()
      .filter((obj) => !this.addonCodeList.includes(obj.addonCode));
    if (this.selected_plan_details?.data?.intervelType === 'years') {
      // list addon list based on type(year/month)
      if (this.hideAddon) {
        if (this.filteredAddOnList) {
          this.addOnsList = this.filteredAddOnList.filter(
            (res: IAddOns) => res.intervalUnit === 'yearly'
          );
        }
      } else if (!this.hideAddon) {
        this.addOnsList =
          this.selected_plan_details?.data?.allData?.addOns.filter(
            (res: IAddOns) => res.intervalUnit === 'yearly'
          ) ?? [];
      }
    } else {
      if (this.hideAddon) {
        if (this.filteredAddOnList) {
          this.addOnsList = this.filteredAddOnList.filter(
            (res: IAddOns) => res.intervalUnit !== 'yearly'
          );
        }
      } else if (!this.hideAddon) {
        this.addOnsList =
          this.selected_plan_details?.data?.allData?.addOns.filter(
            (res: IAddOns) => res.intervalUnit !== 'yearly'
          ) ?? [];
      }
    }

    if (this.current_plan) {
      const currentAddOns: ICurrentAddOns[] = [];
      for (let i = 0; i < this.current_plan.subscription.addOn.length; i += 1) {
        const current = this.current_plan.subscription.addOn[i];

        for (let j = 0; j < this.addOnsList.length; j += 1) {
          const all = this.addOnsList[j];

          if (all.addonCode === current.addonCode) {
            currentAddOns.push(current);
          }
        }
      }
      this.setCurrentAddOnes(currentAddOns);
    }
    this.emitSelectedData();
  }

  setCurrentAddOnes(current: ICurrentAddOns[]): void {
    if (this.route.snapshot.routeConfig?.path === 'plan/change-addon') {
      this.setAddOnes();
    } else {
      const currentAddOns: ISelectedAddOns[] = [];
      for (let i = 0; i < current.length; i += 1) {
        const c = current[i];
        currentAddOns.push({
          details: c?.addOnDetails,
          quantity: Number(c?.qnt)
        });
      }
      this.setAddOnes(currentAddOns);
    }
  }

  setAddOnes(selected?: ISelectedAddOns[]): void {
    if (!selected) {
      return;
    }

    setTimeout(() => {
      for (let i = 0; i < selected.length; i += 1) {
        const sel = selected[i];

        const cardEl = this.querySelector(
          `#singleBox_${sel?.details?.addonCode}`
        );
        const btnEl = this.querySelector(`#${sel.details.addonCode}`);
        const selectBox = this.querySelector(
          `#quantity_${sel.details.addonCode}`
        );

        cardEl?.classList.add('active');

        if (btnEl) {
          btnEl.innerHTML = 'Add';
        }

        if (cardEl?.classList.contains('active')) {
          if (btnEl) btnEl.innerHTML = 'Added';
        }

        if (selectBox) {
          selectBox.value = sel?.quantity.toString();
        }
      }
    }, 100);
    this.selectedAddOn = selected;
    this.emitSelectedData();
  }

  onChooseAddOns(addOn: IAddOns, ButtonEl: HTMLDivElement): void {
    const q = document.getElementById(
      `quantity_${addOn?.addonCode}`
    ) as HTMLInputElement;
    const quantity = q?.value ? q?.value : 1;

    if (ButtonEl.classList.contains('active')) {
      if (
        this.selectedAddOn?.filter(
          (r: ISelectedAddOns) => r.details.addonCode !== addOn?.addonCode
        )
      ) {
        this.selectedAddOn.push({ details: addOn, quantity: Number(quantity) });
      }
    } else if (
      this.selectedAddOn?.filter(
        (r: ISelectedAddOns) => r.details.addonCode !== addOn?.addonCode
      )
    ) {
      // filter all ready selected addons
      this.selectedAddOn = this.selectedAddOn?.filter(
        (r: ISelectedAddOns) => r.details.addonCode !== addOn?.addonCode
      );
    }

    this.emitSelectedData();
  }

  onChangeDropDown(addonCode: string): void {
    const q = document.getElementById(
      `quantity_${addonCode}`
    ) as HTMLInputElement;
    const changedAddon = this.selectedAddOn?.filter(
      (a: ISelectedAddOns) => a?.details?.addonCode === addonCode
    );
    if (changedAddon.length) {
      changedAddon[0].quantity = Number(q?.value);
    }
    this.emitSelectedData();
  }

  /**  EMIT SELECTED DATA */
  emitSelectedData(): void {
    this.data_for_billing$.next({
      success: true,
      data: {
        planCode: this.selected_plan_details?.data?.planCode,
        intervelType: this.selected_plan_details?.data?.intervelType,
        nextStep: 'addOns',
        currentStep: 'addOns',
        selectedAddon: this.selectedAddOn?.length
          ? this.selectedAddOn
          : undefined,
        allData: this.plan_feature_addon_list,
        billingAddress: this.selected_plan_details?.data?.billingAddress,
        grandTotal: this.selected_plan_details?.data?.grandTotal
      }
    });
  }

  onClickProceedBtn(event: { isProceed: boolean; grandTotal: number }): void {
    if (!event.isProceed) {
      return;
    }

    const isChangeAddonFlow =
      this.route.snapshot.routeConfig?.path === 'plan/change-addon';
    if (isChangeAddonFlow && (event.grandTotal ?? 0) <= 0) {
      this.showNoAddonAlert();
      return;
    }

    this.onChoosePlan.emit({
      success: true,
      data: {
        planCode: this.selected_plan_details?.data?.planCode,
        intervelType: this.selected_plan_details?.data?.intervelType,
        nextStep: 'billingAddress',
        selectedAddon: this.selectedAddOn.length
          ? this.selectedAddOn
          : undefined,
        allData: this.plan_feature_addon_list,
        billingAddress: this.selected_plan_details?.data?.billingAddress,
        grandTotal: event?.grandTotal
      }
    });
  }

  showNoAddonAlert(): void {
    const alert = this.alertService.confirmAlert({
      title: 'Add-on Required',
      content:
        'No add-ons have been selected for the existing plan. Please select at least one add-on before proceeding to checkout.',
      doneMsg: 'OK',
      cancelMsg: 'Go to Dashboard',
      icon: 'warn'
    });
    alert.afterClosed().subscribe((confirmed) => {
      if (confirmed === false) {
        this.router.navigateByUrl('manage/subscription/dashboard');
      }
    });
  }

  goBack(): void {
    if (this.route.snapshot.routeConfig?.path === 'plan/change-addon') {
      this.router.navigateByUrl('manage/subscription/dashboard');
      return;
    }
    this.onChoosePlan.emit({
      success: true,
      data: {
        planCode: this.selected_plan_details?.data?.planCode,
        intervelType: this.selected_plan_details?.data?.intervelType,
        nextStep: 'pricing_table',
        selectedAddon: this.selectedAddOn?.length
          ? this.selectedAddOn
          : undefined,
        allData: this.plan_feature_addon_list,
        billingAddress: this.selected_plan_details?.data?.billingAddress,
        grandTotal: this.selected_plan_details?.data?.grandTotal
      }
    });
  }

  loadDropDownList(): void {
    for (let i = 1; i <= 100; i += 1) {
      this.dropDownList.push(i);
    }
  }

  activeAddon(
    cardEl: HTMLDivElement,
    btn: HTMLDivElement,
    event: MouseEvent,
    selectedAddOn: IAddOns
  ) {
    const targetElement = event.target as HTMLElement;
    const button = btn;

    if (targetElement?.classList[0] === 'input_style') {
      return;
    }

    cardEl.classList.toggle('active');
    button.innerHTML = 'Add';

    if (cardEl.classList.contains('active')) {
      button.innerHTML = 'Added';
      this.onChooseAddOns(selectedAddOn, cardEl); // set data
    } else {
      this.onChooseAddOns(selectedAddOn, cardEl);
    }
  }

  removeAddOn(
    cardEl: HTMLDivElement,
    btn: HTMLDivElement,
    event: MouseEvent,
    selectedAddOn: IAddOns
  ): void {
    const targetElement = event.target as HTMLElement;
    const button = btn;

    if (targetElement?.classList[0] === 'input_style') {
      return;
    }

    if (cardEl.classList.contains('active')) {
      cardEl.classList.remove('active');
      button.innerHTML = 'Add';
    }

    this.onChooseAddOns(selectedAddOn, cardEl); // set data
  }

  onClose(): void {
    this.subscriptionService.closeSubscriptionPage();
  }

  querySelector(element: string) {
    return document.querySelector(element) as HTMLInputElement;
  }

  ngOnDestroy(): void {
    this.localStorageService.removeItem('autoClickPlan');
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

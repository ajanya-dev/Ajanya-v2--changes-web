import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import {
  IChoosePlan,
  IPlanWithFeatureList,
  ISelectedAddOns
} from 'src/app/modules/subscription/model/subscription';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
@Component({
  selector: 'app-sub-biiling-calculation',
  templateUrl: './sub-biiling-calculation.component.html',
  styleUrls: ['./sub-biiling-calculation.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe]
})
export class SubBiilingCalculationComponent implements OnInit, OnDestroy {
  @Input() selected_plan_details$: Observable<IChoosePlan>;
  @Input() data_for_billing$: Observable<IChoosePlan>;
  @Input() selectedPlanCode: string;
  @Input() route: string;

  @Output() onProceed = new EventEmitter<{
    isProceed: boolean;
    grandTotal: number;
  }>();

  data_for_billing: IChoosePlan;
  subscriptions: Subscription[] = [];
  currentSlide: 'addOns' | 'billingAddress' | 'payment' | 'pricing_table';
  selectedPlan: IPlanWithFeatureList[];
  selectedAddons: ISelectedAddOns[];
  grandTotal = 0;
  changePlan = false;
  checkRoutePath?: string;
  isPathTrue: boolean;
  totalLast: number;

  /**
   * Constructor of the component.
   *
   * @param _route - The ActivatedRoute used to retrieve route information.
   */
  constructor(private _route: ActivatedRoute) {}

  /**
   * @description Initializes the component.
   * Determines the route path and loads data accordingly.
   */
  ngOnInit(): void {
    this.checkRoutePath = this._route.snapshot.routeConfig?.path;
    const snapshot = this._route.snapshot;
    if (snapshot.url[1]?.path === 'change-addon') {
      this.changePlan = true;
      this.isPathTrue = true;
      this.getCurrentAddonDetails();
    } else {
      this.loadData();
    }
  }

  /**
   * @description Fetches and processes current addon details.
   * Calculates and displays the total addon price.
   * @returns {void}
   */
  getCurrentAddonDetails(): void {
    this.subscriptions.push(
      this.data_for_billing$.subscribe((res) => {
        if (res) {
          this.data_for_billing = res;
          this.selectedAddons = this.data_for_billing?.data?.selectedAddon!;
          this.selectedPlan =
            this.data_for_billing?.data?.allData?.plans?.filter(
              (r: IPlanWithFeatureList) => {
                return r.planCode === this.selectedPlanCode;
              }
            )!;
          this.currentSlide = this.data_for_billing?.data?.currentStep!;
          this.addOnDisplay();
        }
      })
    );
  }

  /**
   * @description Calculates and displays the total price for selected addons.
   * The total price is computed based on the price and quantity of each selected addon.
   * @returns {void}
   */
  addOnDisplay(): void {
    this.totalLast = 0;
    this.selectedAddons = this.data_for_billing?.data?.selectedAddon!;
    const addOnTotal: number[] = this.selectedAddons?.map(
      (a: ISelectedAddOns) => {
        return Number(a?.details.price) * Number(a?.quantity);
      }
    );
    addOnTotal?.forEach((t) => (this.totalLast += t ? t : 0));
  }

  /**
   * @description Loads data for the component, including selected addons and plans.
   * Displays the data, including the grand total for billing.
   * @returns {void}
   */
  loadData(): void {
    this.subscriptions.push(
      this.data_for_billing$.subscribe((res) => {
        if (res) {
          this.data_for_billing = res;
          this.selectedAddons = this.data_for_billing?.data?.selectedAddon!;
          this.selectedPlan =
            this.data_for_billing?.data?.allData?.plans?.filter(
              (r: IPlanWithFeatureList) => {
                return r.planCode === this.selectedPlanCode;
              }
            )!;
          this.currentSlide = this.data_for_billing?.data?.currentStep!;
          this.displayData();
        }
      })
    );
  }

  /**
   * @description Calculates and displays the grand total for billing.
   * The grand total includes the selected plan and the total price of selected addons.
   * @returns {void}
   */
  displayData(): void {
    this.grandTotal = 0;
    this.selectedAddons = this.data_for_billing?.data?.selectedAddon!;
    const addOnTotal: number[] = this.selectedAddons?.map(
      (a: ISelectedAddOns) => {
        return Number(a?.details.price) * Number(a?.quantity);
      }
    );
    this.grandTotal += Number(this.selectedPlan[0].planPrice);
    addOnTotal?.forEach((t) => (this.grandTotal += t ? t : 0));
  }

  /**
   * @description Handles the "Proceed" button click event.
   * Emits the grand total for further processing.
   * @returns {void}
   */
  onClickProceed(): void {
    if (this.isPathTrue) {
      this.onProceed.next({
        isProceed: true,
        grandTotal: Number(this.totalLast.toFixed(2))
      });
      return;
    }
    this.onProceed.next({
      isProceed: true,
      grandTotal: Number(this.grandTotal.toFixed(2))
    });
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

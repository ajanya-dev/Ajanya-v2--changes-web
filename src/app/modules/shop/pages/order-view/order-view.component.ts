import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { ShopService } from 'src/app/shared/service/shop/shop.service';
import { Router } from '@angular/router';
import { IOrderData, IOrderDetails } from '../../model/shop';
import { NgFor, NgIf } from '@angular/common';
@Component({
  selector: 'app-order-view',
  templateUrl: './order-view.component.html',
  styleUrls: ['./order-view.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf]
})
export class OrderViewComponent implements OnInit, OnDestroy {
  orderId: string;
  subscriptions: Subscription[] = [];
  orderDetails: IOrderData;
  creditBalance: string;
  constructor(
    public shopService: ShopService,
    public activatedRoute: ActivatedRoute,
    private router: Router,
    private refillCreditService: RefillCreditService
  ) {}

  /**
   * Lifecycle hook that is called when the component is initialized.
   * Subscribes to changes in route parameters to retrieve the 'id' parameter and update 'orderId'.
   * Calls the 'getOrderDetails' and 'getCredit' methods to initialize component data.
   * @returns {void}
   */
  ngOnInit(): void {
    /**
     * Subscribes to changes in route parameters and updates 'orderId'.
     * @param {ParamMap} paramMap - The route parameter map.
     */
    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      /**
       * The unique identifier (ID) associated with the current route.
       * @type {string}
       */
      this.orderId = paramMap.get('id') as string;
    });
    this.getOrderDetails();
    this.getCredit();
  }

  /**
   * Retrieves order details and updates the 'orderDetails' property.
   * @returns {void}
   */
  getOrderDetails(): void {
    this.subscriptions.push(
      this.shopService
        .getOrderDetails(this.orderId)
        .subscribe((response: IOrderDetails) => {
          this.orderDetails = response.data;
        })
    );
  }

  /**
   * Retrieves the current credit balance and updates the 'creditBalance' property.
   * @returns {void}
   */
  getCredit(): void {
    this.subscriptions.push(
      this.refillCreditService.getCurrentCredit().subscribe((data) => {
        if (data?.success) {
          this.creditBalance = data.data.credit;
        }
      })
    );
  }

  /**
   * Navigates to the 'show-refillform' route for adding balance.
   * @returns {void}
   */
  addBalance(): void {
    this.router.navigate(['/manage/refill-credit/show-refillform']);
  }

  /**
   * Unsubscribes from all active subscriptions when the component is destroyed.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

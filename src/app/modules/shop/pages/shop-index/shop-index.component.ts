import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/shared/service/shop/shop.service';
import { IProducts } from '../../model/shop';
import { ShopItemCardComponent } from '../../components/shop-item-card/shop-item-card.component';
import { NgFor } from '@angular/common';
import { MatBadge } from '@angular/material/badge';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-shop-index',
  templateUrl: './shop-index.component.html',
  styleUrls: ['./shop-index.component.scss'],
  standalone: true,
  imports: [RouterLink, MatBadge, NgFor, ShopItemCardComponent]
})
export class ShopIndexComponent implements OnInit, OnDestroy {
  @Output() addToCartEvent = new EventEmitter();
  subscription: Subscription[] = [];
  productsList: IProducts[];
  cartCount = 0;
  cartProducts: { product_id: string; quantity: number }[] = [];

  /**
   * Create an instance of the ShoppingCartComponent.
   *
   * @param {ShopService} shopService - The service for shopping-related operations.
   */
  constructor(private shopService: ShopService) {}

  /**
   * Lifecycle hook that is called when the component is initialized.
   * It fetches all products and the cart count when the component is loaded.
   */
  ngOnInit(): void {
    this.getAllProducts();
    this.getCartCount();
  }

  /**
   * Fetch and update the list of all products.
   */
  getAllProducts(): void {
    this.subscription.push(
      this.shopService.getAllProducts().subscribe((response) => {
        this.productsList = response.data;
      })
    );
  }

  /**
   * Fetch and update the cart count.
   */
  getCartCount(): void {
    this.subscription.push(
      this.shopService.getCartCount().subscribe((response) => {
        this.cartCount = response.data;
      })
    );
  }

  /**
   * Handle changes in product count.
   *
   * @param {{ product_id: string, quantity: number }} event - The event containing product ID and quantity.
   */
  productCountHandler(event: { product_id: string; quantity: number }): void {
    this.cartProducts.push(event);
    this.cartCount += event.quantity * 1;
  }

  /**
   * Lifecycle hook called when the component is destroyed.
   * It unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

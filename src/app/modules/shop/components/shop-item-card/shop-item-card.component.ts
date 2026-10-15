import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IProducts } from 'src/app/modules/shop/model/shop';
import { ShopService } from 'src/app/shared/service/shop/shop.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import {
  MatCard,
  MatCardImage,
  MatCardContent,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardActions
} from '@angular/material/card';

@Component({
  selector: 'app-shop-item-card',
  templateUrl: './shop-item-card.component.html',
  styleUrls: ['./shop-item-card.component.scss'],
  standalone: true,
  imports: [
    MatCard,
    MatCardImage,
    MatCardContent,
    MatCardHeader,
    MatCardAvatar,
    MatCardTitle,
    MatCardActions,
    NgClass,
    FaIconComponent
  ]
})
export class ShopItemCardComponent implements OnInit, OnDestroy {
  @Input() product: IProducts;
  @Output() productCounts = new EventEmitter<{
    product_id: string;
    quantity: number;
  }>();
  subscriptions: Subscription[] = [];
  isDisable: boolean;
  isShowOutOfstock = false;
  utils = Utils;

  constructor(
    public shopService: ShopService,
    private route: Router
  ) {}

  /**
   * Initializes the component and calls the `showOutOfstock` method to check and set the `isShowOutOfstock` flag.
   * @returns {void}
   */
  ngOnInit(): void {
    this.showOutOfstock();
  }

  /**
   * Adds a product to the cart.
   *
   * @param {IProducts} product - The product to add to the cart.
   * @param {number} quantity - The quantity of the product to add (default is 1).
   * @returns {void}
   */
  addToCart(product: IProducts, quantity: number = 1): void {
    this.isDisable = true;
    const body = { product_id: product.enc_id, quantity };

    this.subscriptions.push(
      this.shopService
        .addToCart(body)
        .pipe(finalize(() => (this.isDisable = false)))
        .subscribe((response) => {
          if (response?.success) {
            this.productCounts.emit(body);
            this.route.navigate(['manage/shop/cart']);
          }
        })
    );
  }

  /**
   * Checks if the product is out of stock and sets the `isShowOutOfstock` flag accordingly.
   * @returns {void}
   */
  showOutOfstock(): void {
    if (this.product.stock_available) {
      this.isShowOutOfstock = false;
    } else {
      this.isShowOutOfstock = true;
    }
  }

  /**
   * Validates keyboard input to allow only numeric characters.
   *
   * @param {KeyboardEvent} event - The keyboard event object.
   * @returns {boolean} Returns `true` if the input is valid (numeric), otherwise `false`.
   */
  numberOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
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

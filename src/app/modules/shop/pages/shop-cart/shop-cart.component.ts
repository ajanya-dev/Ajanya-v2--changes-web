import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import {
  ICartProduct,
  IShippingAddress,
  IUserAddress
} from 'src/app/modules/shop/model/shop';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { RefillCreditService } from 'src/app/shared/service/refill-credit/refill-credit.service';
import { ShopService } from 'src/app/shared/service/shop/shop.service';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { AddShippingAddressComponent } from '../../modals/add-shipping-address/add-shipping-address.component';

@Component({
  selector: 'app-shop-cart',
  templateUrl: './shop-cart.component.html',
  styleUrls: ['./shop-cart.component.scss'],
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, NgClass, DecimalPipe]
})
export class ShopCartComponent implements OnInit, OnDestroy {
  utils = Utils;
  showAddress = false;
  subscriptions: Subscription[] = [];
  cartProducts: ICartProduct[];
  grandTotal: number;
  addressList: IUserAddress[];
  selectedAddress: IUserAddress;
  creditBalance: string;
  changeQtyTimer: Record<string, ReturnType<typeof setTimeout>> = {}; // object with product id
  product: ICartProduct;

  constructor(
    public dialog: MatDialog,
    public alertService: AlertService,
    private shopService: ShopService,
    private router: Router,
    private refillCreditService: RefillCreditService
  ) {}

  /**
   * @description Angular lifecycle hook called after component initialization.
   * It is used for initializing and fetching data.
   * @return {void}
   */
  ngOnInit(): void {
    this.getCredit();
    this.getCartProducts();
    this.getAllAddress();
  }

  /**
   * Retrieves the products in the shopping cart and updates component properties.
   * @return {void}
   */
  getCartProducts(): void {
    this.subscriptions.push(
      this.shopService.getCartProducts().subscribe((response) => {
        this.cartProducts = response.data.products;
        this.grandTotal = response.data.grand_total;
        if (this.cartProducts) {
          this.cartProducts.forEach((e) => {
            this.product = e;
          });
        }
      })
    );
  }

  /**
   * Opens a dialog to add a new shipping address.
   * Calls 'getAllAddress' when a new address is successfully added.
   * @return {void}
   */
  addAddress(): void {
    const dialogRef = this.dialog.open(AddShippingAddressComponent, {
      maxWidth: '700px',
      width: '93%',
      data: { mode: 'Add' }
    });

    dialogRef.afterClosed().subscribe((response) => {
      if (response.success) {
        this.getAllAddress();
      }
    });
  }

  /**
   * Opens a dialog to edit an existing shipping address.
   * Calls 'getAllAddress' when an address is successfully edited.
   *
   * @param {IShippingAddress} address - The address to be edited.
   * @return {void}
   */

  editAddress(address: IShippingAddress): void {
    const dialogRef = this.dialog.open(AddShippingAddressComponent, {
      maxWidth: '700px',
      width: '93%',
      data: { mode: 'Edit', address }
    });

    dialogRef.afterClosed().subscribe((response) => {
      if (response.success === true) {
        this.getAllAddress();
      }
    });
  }

  /**
   * Prompt for confirmation and delete an address.
   *
   * @param {string} addressID - The ID of the address to delete.
   * Prompts the user for confirmation before deleting the address. If
   * confirmed, it calls the 'deleteThisAddress' method to delete the address.
   * @return {void}
   */
  deleteAddress(addressID: string): void {
    const confirmation = this.alertService.confirmAlert({
      content: 'Are you sure to delete this address ?'
    });

    confirmation.afterClosed().subscribe((response) => {
      if (response) {
        this.deleteThisAddress(addressID);
      }
    });
  }

  /**
   * Delete a shipping address.
   *
   * @param {string} addressID - The ID of the address to delete.
   * Deletes the specified shipping address and updates the address list
   * if the deletion is successful.
   * @return {void}
   */
  deleteThisAddress(addressID: string): void {
    this.subscriptions.push(
      this.shopService.deleteAddress(addressID).subscribe((response) => {
        if (response.success) {
          this.getAllAddress();
        }
      })
    );
  }

  /**
   * @description Retrieve and update the list of all addresses.
   * Fetches the list of all shipping addresses and updates the 'addressList'
   * property. It also sets the first address in the list as the 'selectedAddress'.
   * @returns {void}
   */
  getAllAddress(): void {
    this.subscriptions.push(
      this.shopService.getAllAdresses().subscribe((response) => {
        this.addressList = response.data;
        this.selectedAddress = this.addressList[0];
      })
    );
  }

  /**
   * @description Select an address and make it active for use in the order.
   * @param {number} index - The index of the selected address.
   * @param {IUserAddress} address - The selected address.
   * Marks the selected address as active by applying a CSS class, and sets
   * it as the 'selectedAddress' for use in the order.
   * @return {void}
   */
  selectAddress(index: number, address: IUserAddress): void {
    const activeElements = document.querySelectorAll('.active_address');
    activeElements.forEach((element) => {
      if (element.classList.contains('active_address')) {
        element.classList.remove('active_address');
      }
    });
    const addressParentElement = document.querySelector(
      `#parentElement_${index}`
    ) as HTMLDivElement;
    addressParentElement.classList.add('active_address');

    this.selectedAddress = address;
  }

  /**
   * @description Proceed to make a purchase after selecting an address.
   * Checks if an address is selected and prompts the user for confirmation
   * before placing an order. If confirmed, it places the order with the selected
   * address and navigates to the order details page.
   * @return {void}
   */
  proceedToBuy(): void {
    if (!this.selectedAddress) {
      this.alertService.warningAlert({ content: 'Please select an address' });
    }

    const orderConfirmation = this.alertService.confirmAlert({
      content: `Are you sure to deliver to this address , ${this.selectedAddress.first_name} ${this.selectedAddress.last_name} , ${this.selectedAddress.address_line_1} ${this.selectedAddress.address_line_2}, ${this.selectedAddress.city}, ${this.selectedAddress.state}, ${this.selectedAddress.country}, ${this.selectedAddress.zip} `
    });

    orderConfirmation
      .afterClosed()
      .subscribe((response: boolean | undefined) => {
        if (response) {
          this.subscriptions.push(
            this.shopService
              .placeOrder({ ship_to: this.selectedAddress.enc_id })
              .subscribe((res) => {
                if (res.success) {
                  this.alertService.successAlert({
                    content: 'Order placed',
                    close: true
                  });
                  this.router.navigate([
                    `/manage/shop/order_details/${res.data}`
                  ]);
                }
              })
          );
        }
      });
  }

  /**
   * Change the quantity of a product in the shopping cart.
   *
   * @param {ICartProduct} product - The product to update.
   * @param {string} quantity - The new quantity.
   * @param {boolean} isNew - Whether the operation is for a new item.
   * Changes the quantity of a product in the shopping cart, and updates
   * the server with the new quantity. It uses a timer to avoid sending too
   * many requests in a short time.
   * @return {void}
   */
  changeQuantity(product: ICartProduct, quantity: string, isNew = false): void {
    if (!(product.quantity + parseInt(quantity) > 0)) {
      return;
    }
    if (isNew) {
      product.quantity = parseInt(quantity);
    } else {
      product.quantity += parseInt(quantity);
    }

    clearTimeout(this.changeQtyTimer[product.id]);

    this.changeQtyTimer[product.id] = setTimeout(() => {
      this.subscriptions.push(
        this.shopService
          .changeQuantity(product.id, { quantity: product.quantity })
          .subscribe((response) => {
            this.grandTotal = response.data.grand_total;
            this.cartProducts = response.data.products;
          })
      );
    }, 400);
  }

  /**
   * @description Navigate to the balance refill page.
   * Navigates to a page where the user can add funds to their account balance.
   * @returns {void}
   */
  addBalance(): void {
    this.router.navigate(['/manage/refill-credit/show-refillform']);
  }

  /**
   * @description Prompt for confirmation and remove a product from the cart.
   * @param {string} productId - The ID of the product to remove.
   * Prompts the user for confirmation before removing a product from the cart.
   * If confirmed, it sends a request to delete the product from the cart.
   * @return {void}
   */
  deleteFromCart(productId: string): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure to remove this item from cart ?'
    });
    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.shopService.deleteFromCart(productId).subscribe((data) => {
            if (data?.success) {
              this.getCartProducts();
            }
          })
        );
      }
    });
  }

  /**
   * @description Retrieve and update the user's current credit balance.
   * Fetches the current credit balance of the user and updates the 'creditBalance' property.
   * @return {void}
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
   * @description Unsubscribe from subscriptions to prevent memory leaks.
   * Iterates through all active subscriptions and unsubscribes from them to
   * prevent memory leaks when the component is destroyed.
   * @returns void
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

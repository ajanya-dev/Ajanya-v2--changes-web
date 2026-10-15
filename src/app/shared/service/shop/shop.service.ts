import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IApiRes,
  IApiResMesssage,
  IApiResSuccessOnly
} from 'src/app/models/api';
import {
  ICartDetails,
  IOrderDetails,
  IProducts,
  IShippingAddress,
  IUserAddress
} from 'src/app/modules/shop/model/shop';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  /**
   * The root URL for the shopping service.
   * @type {string}
   */
  ROOT_URL = environment.rootUrl;

  /**
   * Create a new instance of the ShoppingCartService.
   *
   * @param {HttpClient} http - The HttpClient used for making HTTP requests.
   */
  constructor(private http: HttpClient) {}

  /**
   * Fetch all the products from the server.
   * @returns {Observable<IApiRes<IProducts[]>>} An observable that emits the reponse data.
   */
  getAllProducts(): Observable<IApiRes<IProducts[]>> {
    return this.http.get<IApiRes<IProducts[]>>(
      `${this.ROOT_URL}/shop/products`
    );
  }

  /**
   * Add a product to the shopping cart.
   *
   * @param {Object} data - An object containing product details to be added to the cart.
   * @param {string} data.product_id - The ID of the product to add to the cart.
   * @param {number} data.quantity - The quantity of the product to add to the cart.
   * @returns {Observable<IApiResMesssage>} An observable that emits an API response message.
   */
  addToCart(data: {
    product_id: string;
    quantity: number;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(`${this.ROOT_URL}/shop/cart`, data);
  }

  /**
   * Fetch the cartcount from the server.
   * @returns {Observable<IApiRes<number>>} An observable that emits the response data.
   */
  getCartCount(): Observable<IApiRes<number>> {
    return this.http.get<IApiRes<number>>(
      `${this.ROOT_URL}/shop/products/count`,
      {}
    );
  }

  /**
   * Retrieves the products in the shopping cart.
   *
   * @returns {Observable<ICartData>} An observable that emits cart data as an `ICartData` object.
   */
  getCartProducts(): Observable<ICartDetails> {
    return this.http.get<ICartDetails>(`${this.ROOT_URL}/shop/cart`, {});
  }

  /**
   * Fetch all the address for shopping cart from the server.
   * @returns {Observable<IApiRes<IUserAddress[]>>} An observable that emits all the address of a user.
   */
  getAllAdresses(): Observable<IApiRes<IUserAddress[]>> {
    return this.http.get<IApiRes<IUserAddress[]>>(
      `${this.ROOT_URL}/shop/shipping-address`,
      {}
    );
  }

  /**
   * Deletes an address from the server based on an id.
   * @param {string} id Id of the address that needs to be deleted.
   * @returns {Observable<IApiResSuccessOnly>} Emits an observable with the success message upon deleting.
   */
  deleteAddress(id: string): Observable<IApiResSuccessOnly> {
    return this.http.delete<IApiResSuccessOnly>(
      `${this.ROOT_URL}/shop/shipping-address/${id}`,
      {}
    );
  }

  /**
   * Update a shipping address with the given ID.
   *
   * @param {string} id - The ID of the shipping address to update.
   * @param {IShippingAddress} data - The updated shipping address data.
   * @returns {Observable<IApiResSuccessOnly>} An Observable that emits the response data.
   */
  updateAddress(
    id: string,
    data: IShippingAddress
  ): Observable<IApiResSuccessOnly> {
    return this.http.put<IApiResSuccessOnly>(
      `${this.ROOT_URL}/shop/shipping-address/${id}`,
      data
    );
  }

  /**
   * Add a new shipping address.
   *
   * @param {IShippingAddress} data - The shipping address data to add.
   * @returns {Observable<IApiResSuccessOnly>} An Observable that emits the response data.
   */
  addAddress(data: IShippingAddress): Observable<IApiResSuccessOnly> {
    return this.http.post<IApiResSuccessOnly>(
      `${this.ROOT_URL}/shop/shipping-address/`,
      data
    );
  }

  /**
   * Place an order with the specified shipping details.
   *
   * @param {{ ship_to: string }} data - The shipping information for the order.
   * @returns {Observable<IApiRes<any>>} An Observable that emits the response data.
   */
  placeOrder(data: { ship_to: string }): Observable<IApiRes<any>> {
    return this.http.post<IApiRes<any>>(`${this.ROOT_URL}/shop/orders`, data);
  }

  /**
   * Change the quantity of a product in the shopping cart.
   *
   * @param {string} id - The ID of the product in the cart.
   * @param {{ quantity: number }} data - The new quantity for the product.
   * @returns {Observable<ICartDetails>} An Observable that emits the updated cart details.
   */
  changeQuantity(
    id: string,
    data: { quantity: number }
  ): Observable<ICartDetails> {
    return this.http.put<ICartDetails>(
      `${this.ROOT_URL}/shop/cart/${id}`,
      data
    );
  }

  /**
   * Retrieves order details for a specific order.
   *
   * @param {string} id - The ID of the order to retrieve details for.
   * @returns {Observable<IOrderDetails>} An observable that emits order details as an `IOrderDetails` object.
   */
  getOrderDetails(id: string): Observable<IOrderDetails> {
    return this.http.get<IOrderDetails>(`${this.ROOT_URL}/shop/orders/${id}`);
  }

  /**
   * Delete a product from the shopping cart.
   *
   * @param {string} productId - The ID of the product to remove from the cart.
   * @returns {Observable<IApiResSuccessOnly>} An Observable that emits the response data.
   */
  deleteFromCart(productId: string): Observable<IApiResSuccessOnly> {
    return this.http.delete<IApiResSuccessOnly>(
      `${this.ROOT_URL}/shop/cart/${productId}`
    );
  }
}

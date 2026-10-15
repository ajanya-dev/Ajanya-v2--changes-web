import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { ShopService } from 'src/app/shared/service/shop/shop.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IApiResSuccessOnly } from 'src/app/models/api';
import { NgIf } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { IShippingAddress, IUserAddress } from '../../model/shop';
import { GoogleAddressService } from "../../../../core/services/google-address.service";
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-add-shipping-address',
  templateUrl: './add-shipping-address.component.html',
  styleUrls: ['./add-shipping-address.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    MatDialogActions,
    NgIf
  ]
})
export class AddShippingAddressComponent implements OnInit, OnDestroy {

  private addressDialogRef = inject(MatDialogRef<AddShippingAddressComponent>);
  private shopService = inject(ShopService);
  public fb = inject(UntypedFormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  public data: { mode: string; address: IUserAddress } = inject(MAT_DIALOG_DATA);

  addressForm: UntypedFormGroup;
  addressValues: IUserAddress;
  subscription: Subscription[] = [];
  isForUpdate = false;
  first: string;

  utils = Utils;

  /**
   * Initializes the component and performs necessary setup based on the mode.
   * If the mode is 'Edit', it sets the form for update and patches the address values.
   * It also resets the Google Autocomplete API service.
   * @returns {void}
   */
  ngOnInit(): void {
    this.initAddressForm();
    if (this.data.mode === 'Edit') {
      this.isForUpdate = true;
      this.addressValues = this.data.address;
      this.patchValues();
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * Initializes the address form with default values and validation rules.
   * @returns {void}
   */
  initAddressForm(): void {
    this.addressForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      companyName: [''],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      phone: [
        '',
        [Validators.required, ValidationService.phoneNumberValidator]
      ],
      country: ['USA', Validators.required]
    });
  }

  /**
   * Populates the address form with values retrieved from the `addressValues` object.
   * This method is used for pre-filling the form when in 'Edit' mode.
   * @returns {void}
   */
  patchValues(): void {
    this.addressForm.patchValue({
      firstName: this.addressValues.first_name,
      lastName: this.addressValues.last_name,
      addressLine1: this.addressValues.address_line_1,
      addressLine2: this.addressValues.address_line_2,
      city: this.addressValues.city,
      state: this.addressValues.state,
      zip: this.addressValues.zip,
      phone: this.addressValues.phone,
      country: this.addressValues.country,
      companyName: this.addressValues.company_name
    });
  }

  /**
   * Creates and returns an address data object based on the values from the address form.
   * This method is used to format the data for sending or saving.
   *
   * @returns {IShippingAddress} An address data object.
   */
  createAddressBody(): IShippingAddress {
    const addressData = this.addressForm.value;

    return {
      first_name: addressData.firstName,
      last_name: addressData.lastName,
      company_name: addressData.companyName,
      address_line_1: addressData.addressLine1,
      address_line_2: addressData.addressLine2,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip,
      phone: addressData.phone,
      country: addressData.country
    };
  }

  /**
   * Adds an address by calling the shop service's `addAddress` method.
   * If the address is valid, it sends a request to add the address.
   * Closes the address dialog if the response is successful.
   * @returns {void}
   */
  addAddress(): void {
    if (!this.addressIsValid()) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.subscription.push(
      this.shopService
        .addAddress(this.createAddressBody())
        .subscribe((response: IApiResSuccessOnly) => {
          if (response.success) {
            this.addressDialogRef.close({ success: response.success });
          }
        })
    );
  }

  /**
   * Updates an address by calling the shop service's `updateAddress` method.
   * If the address is valid, it sends a request to update the address.
   * Closes the address dialog if the response is successful.
   * @returns {void}
   */
  updateAddress(): void {
    if (!this.addressIsValid()) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.subscription.push(
      this.shopService
        .updateAddress(this.addressValues.enc_id, this.createAddressBody())
        .subscribe((response: IApiResSuccessOnly) => {
          if (response.success) {
            this.addressDialogRef.close({ success: true });
          }
        })
    );
  }

  /**
   * Checks if the address form is valid.
   * @returns {boolean} True if the form is valid, false otherwise.
   */
  addressIsValid(): boolean {
    if (this.addressForm.valid) {
      return true;
    }
    return false;
  }

  /**
   * Loads Google Address API and updates the form fields based on the selected address.
   * @param {HTMLInputElement} address - The HTML input element used for address autocomplete.
   * @returns {void}
   */
  loadGoogleAddress(address: HTMLInputElement): void {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us']
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.addressForm.patchValue({
          addressLine1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * Allows only number inputs in an HTML input element.
   * @param {KeyboardEvent} event - The keyboard event.
   * @returns {boolean} True if the input is a number, false otherwise.
   */
  numberOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * Unsubscribes from all subscriptions when the component is destroyed.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

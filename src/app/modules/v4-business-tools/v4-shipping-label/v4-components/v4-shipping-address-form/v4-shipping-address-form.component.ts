import { Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';

/**
 * Address fields shared by the delivery address and from address steps of the
 * create shipping label wizard. The parent owns the form group and validators.
 */
@Component({
  selector: 'app-v4-shipping-address-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonInputFieldV4Component,
    CommonCountrySelectV4Component,
    CommonStateSelectV4Component,
    AddressAutocompleteV4Component
  ],
  templateUrl: './v4-shipping-address-form.component.html'
})
export class V4ShippingAddressFormComponent {
  /** Shipping labels are US only, so the country list is fixed rather than fetched. */
  readonly allowedCountries: { [code: string]: string } = {
    US: 'United States'
  };

  form = input.required<FormGroup>();

  get address1Control(): FormControl {
    return this.form().controls.address1 as FormControl;
  }

  /**
   * ISO2 code the state select loads its list from. The country control normally
   * already holds a code, but an address loaded from the API can carry a full
   * name, so resolve it here rather than letting the state select request states
   * for "United States" and come back empty.
   */
  get countryCode(): string {
    const value = String(this.form().controls.country.value ?? '').trim();
    if (!value) {
      return '';
    }
    const code = value.toUpperCase();
    if (this.allowedCountries[code]) {
      return code;
    }
    const matched = Object.keys(this.allowedCountries).find(
      (key) => this.allowedCountries[key].toLowerCase() === value.toLowerCase()
    );
    return matched ?? value;
  }

  onAddressSelected(address: IGoogleAddress): void {
    this.form().patchValue({
      address1: address.address,
      city: address.city,
      state: address.state,
      country: address.country,
      zip: address.zip
    });
  }
}

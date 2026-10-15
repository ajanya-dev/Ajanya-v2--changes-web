import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { Country } from 'src/app/data/data/country-list';
import { ICountryModel } from 'src/app/models/common';

@Component({
  standalone: true,
  selector: 'app-common-country-drop-down',
  templateUrl: './common-country-drop-down.component.html',
  styleUrls: ['./common-country-drop-down.component.scss'],
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonCountryDropDownComponent),
      multi: true
    }
  ]
})

/**
 * `CommonCountryDropDownComponent` Represents an input field for selecting countries.
 */
export class CommonCountryDropDownComponent
  implements OnInit, ControlValueAccessor
{
  /**
   * @description Allowed countries alpha code.
   * @type {string[]}
   * @default ['US','CA']
   */
  @Input() allowedCountry = ['US', 'CA'];
  /**
   * @description Field placeholder.
   * @type {string}
   * @default 'Country'
   */
  @Input() placeHolder = 'Country';
  /**
   * @description Determines whether the component is a v2 or v3 component. Based this boolean value, the component's styles are adjusted accordingly.
   * @type {boolean}
   * @default true
   */
  @Input() isV3Component = true;
  /**
   * @description Indicate the country is required or not.
   * @type {boolean}
   * @default false
   */
  @Input() isFieldRequired = false;

  /**  List of allowed countries with code and name.  */
  allowedCountries: { code: string; name: string }[] = [];
  /** Currently selected country. */
  selectedCountry = '';
  /** List of all countries. */
  countryList: ICountryModel[] = Country.countryList();
  /** List of allowed countries based on the provided alpha codes. */
  allowedCountryList: ICountryModel[];
  /** Indicates whether the input is invalid. */
  invalid = false;

  /**
   * @description Function to be called when the control value changes.
   */
  onChange: (value: string) => void = () => {};
  /**
   * @description Function to be called when the control is touched.
   */
  onTouched: (value: Event) => void = () => {};

  /**
   * @description Writes a new value to the element.
   * @param {string} value - The new value for the element.
   */
  writeValue(value: string): void {
    if (value !== '' && value !== undefined) {
      this.getCountryCode(value);
    }
  }

  /**
   * @description Registers a callback function to be executed when the control value changes.
   * @param {(value: string) => void} fn - The callback function to be registered.
   */
  registerOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  /**
   * @description Registers a callback function to be executed when the control is touched.
   * @param {(event?: Event) => void} fn - The callback function to be registered.
   */
  registerOnTouched(fn: (event?: Event) => void): void {
    this.onTouched = fn;
  }

  /**
   * @description Initializes the component.
   * Make the allowedCountries list based on allowedCountryList array.
   */
  ngOnInit(): void {
    this.allowedCountryList = this.countryList.filter((item) =>
      this.allowedCountry.some((allowedCode) => item.code.includes(allowedCode))
    );
    this.allowedCountryList.forEach((country) => {
      this.allowedCountries.push({ code: country.code, name: country.name });
    });
  }

  /**
   * @description Handles the change event when a country option is selected.
   * @param {Event} event - The change event triggered when a country option is selected.
   */
  onOptionChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.selectedCountry = selectedValue;
    if (this.onChange) {
      this.onChange(selectedValue);
    }
  }

  /**
   * @description Retrieves the country code based on the provided country name.
   * `addOtherCountries` - this function is called when provided country name is not found in the allowed countries.
   *
   * @param {string} countryName - The name of the country for which to retrieve the code.
   */
  getCountryCode(countryName: string) {
    this.invalid = false;
    let countryCode = '';
    if (countryName) {
      if (countryName.length > 2) {
        const convertedCountryName =
          countryName.charAt(0).toUpperCase() + countryName.slice(1);
        countryCode = this.allowedCountries.filter(
          (item) => item.name === convertedCountryName
        )[0]?.code;
      } else {
        countryCode = this.allowedCountries.filter(
          (item) => item.code === countryName.toUpperCase()
        )[0]?.code;
      }
      if (countryCode) {
        this.selectedCountry = countryCode;
        this.onChange(countryCode);
      } else {
        this.addOtherCountries(countryName);
      }
    }
  }

  /**
   * @description Adds a country to the list of allowed countries based on the provided country name.
   * @param {string} countryName - The name of the country to be added.
   */
  addOtherCountries(countryName: string) {
    let countryCode = '';
    let country;
    if (countryName.length > 2) {
      const convertedCountryName =
        countryName.charAt(0).toUpperCase() + countryName.slice(1);
      country = this.countryList.filter(
        (item) => item.name === convertedCountryName
      )[0];
      countryCode = country?.code;
    } else {
      country = this.countryList.filter(
        (item) => item.code === countryName.toUpperCase()
      )[0];
      countryCode = country?.code;
    }
    if (country) {
      this.allowedCountries.push({ code: country?.code, name: country?.name });
    }
    if (countryCode) {
      this.selectedCountry = countryCode;
      this.onChange(countryCode);
    } else {
      this.invalid = true;
    }
  }

  /**
   * @description Method for ngFor trackBy.
   * @param index - Index.
   * @returns Index.
   */
  trackByIndex(index: number) {
    return index;
  }
}

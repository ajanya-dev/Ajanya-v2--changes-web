import { Component, OnInit, effect, forwardRef, input } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Country } from 'src/app/data/data/country-list';
import { ICountryModel } from 'src/app/models/common';

@Component({
  standalone: true,
  selector: 'app-common-country-dropdown-v4',
  templateUrl: './common-country-dropdown-v4.component.html',
  styleUrls: ['./common-country-dropdown-v4.component.scss'],
  imports: [FormsModule, NgSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonCountryDropdownV4Component),
      multi: true
    }
  ]
})
export class CommonCountryDropdownV4Component
  implements OnInit, ControlValueAccessor
{
  allowedCountry = input(['US', 'CA']);
  placeholder = input('Select Country');
  fieldLabel = input('');
  isFieldRequired = input(false);

  allowedCountries: { code: string; name: string }[] = [];
  selectedCountry: string | null = null;

  private countryList: ICountryModel[] = Country.countryList();

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  private pendingValue: string | null = null;

  constructor() {
    effect(() => {
      const codes = this.allowedCountry();
      const allowedList = this.countryList.filter((item) =>
        codes.some((code) => item.code.includes(code))
      );
      this.allowedCountries = allowedList.map((c) => ({
        code: c.code,
        name: c.name
      }));
      if (this.pendingValue) {
        this.resolveCountryCode(this.pendingValue);
        this.pendingValue = null;
      }
    });
  }

  writeValue(value: string): void {
    if (value !== '' && value !== undefined && value !== null) {
      if (this.allowedCountries.length === 0) {
        this.pendingValue = value;
      } else {
        this.resolveCountryCode(value);
      }
    } else {
      this.selectedCountry = null;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnInit(): void {}

  onSelectionChange(code: string): void {
    this.selectedCountry = code;
    this.onChange(code);
    this.onTouched();
  }

  private resolveCountryCode(countryName: string): void {
    let found: { code: string; name: string } | undefined;

    if (countryName.length > 2) {
      const normalized =
        countryName.charAt(0).toUpperCase() + countryName.slice(1);
      found = this.allowedCountries.find((c) => c.name === normalized);
    } else {
      found = this.allowedCountries.find(
        (c) => c.code === countryName.toUpperCase()
      );
    }

    if (found) {
      this.selectedCountry = found.code;
      this.onChange(found.code);
    } else {
      this.addCountryFromFullList(countryName);
    }
  }

  private addCountryFromFullList(countryName: string): void {
    let country: ICountryModel | undefined;

    if (countryName.length > 2) {
      const normalized =
        countryName.charAt(0).toUpperCase() + countryName.slice(1);
      country = this.countryList.find((c) => c.name === normalized);
    } else {
      country = this.countryList.find(
        (c) => c.code === countryName.toUpperCase()
      );
    }

    if (country) {
      this.allowedCountries.push({ code: country.code, name: country.name });
      this.selectedCountry = country.code;
      this.onChange(country.code);
    }
  }
}

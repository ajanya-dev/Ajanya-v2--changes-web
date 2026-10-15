import { Subscription } from 'rxjs';
import {
  Component,
  OnInit,
  OnDestroy,
  forwardRef,
  inject,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ViewChild,
  input
} from '@angular/core';
import { Country } from 'src/app/data/data/country-list';
import { finalize } from 'rxjs/operators';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { ICountryModel } from 'src/app/models/common';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { Router } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import { CommonInputFieldV4Component } from '../common-input-field-v4/common-input-field.component-v4';
import { CloudBankService } from '../../service/cloud-bank/cloud-bank.service';
import { LocalStorageService } from '../../service/storage/local-storage.service';
import { V4ControlMessageComponent } from '../control-message-v4/control-message-v4.component';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PipesModule,
    OverlayModule,
    LucideAngularModule,
    V4ControlMessageComponent,
    CommonInputFieldV4Component
  ],
  selector: 'app-phone-input-v4',
  templateUrl: './v4-phone-input.component.html',
  styleUrls: ['./v4-phone-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputV4Component),
      multi: true
    },
    SearchFilterPipe
  ]
})
export class PhoneInputV4Component
  implements OnInit, OnDestroy, ControlValueAccessor
{
  private localStorageService = inject(LocalStorageService);
  private changeDetector = inject(ChangeDetectorRef);
  private router = inject(Router);
  cloudService = inject(CloudBankService);

  placeholder = input('Phone');
  isFieldRequired = input(true);
  isReadOnly = input(false);
  dropdownWidth = input('300px');
  control = input<AbstractControl>();
  showCountryDropdown = input(true);
  fieldHeight = input<'44px' | '32px'>('44px');

  /** 'compact' is the pay-compact field metric. The bordered box is the WRAPPER, not the
   *  inner input - styling the inner input produces a nested double-box, a stray divider
   *  and a 46px height, which is what the old global override sheet had to work around. */
  variant = input<'default' | 'compact'>('default');
  customMessages = input<{ [key: string]: string }>({});

  @Output() countryDropdown: EventEmitter<{
    isOpen: boolean;
    length?: { min: number | undefined; max: number | undefined };
    code?: string;
  }> = new EventEmitter();

  @Output() countryCodeEmit: EventEmitter<{
    /** The dial code, e.g. '+1' — named `code` for historical reasons. */
    code: string;
    updateLocalStorage?: boolean;
    /** Country name, e.g. 'United States'. */
    name?: string;
    /** ISO 3166-1 alpha-2, e.g. 'US' — what tells +1 US from +1 Canada. */
    iso?: string;
  }> = new EventEmitter();

  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;

  subscriptions: Subscription[] = [];
  onChange: (event?: string) => void = () => {};
  onTouched: (event?: Event) => void = () => {};
  countryList: ICountryModel[] = Country.countryList();
  selectedCountry: ICountryModel = this.countryList[0];
  currentCountryURL: string;
  currentCountryMask = '(000) 000-0000';
  currentDialCode: string;
  showDropDown = false;
  @ViewChild('searchInputRef') searchInputRef?: CommonInputFieldV4Component;
  searchInput: string;
  countryCode = this.countryList[0].code;
  dialCode = this.countryList[0].dial_code;
  phoneNumberWithCode = '';
  previousPhoneWithCode = '';
  phoneNumber = '';
  isPhoneValueLoading = false;
  isDisabled = false;

  selectDefaultCountry() {
    const dialCode = this.localStorageService.getItem('selected_dial_code');
    if (dialCode) {
      const defaultCountry = this.countryList.filter(
        (country) => country.dial_code === dialCode
      );
      if (defaultCountry.length) {
        this.countryDropdown.emit({
          isOpen: this.showDropDown,
          length: defaultCountry[0].length,
          code: defaultCountry[0].dial_code
        });
        this.dialCode = defaultCountry[0].dial_code;
        this.currentCountryMask = defaultCountry[0].mask;
        this.selectCountry(defaultCountry[0]);
      }
    }
    this.countryCodeEmit.emit({
      code: this.dialCode,
      updateLocalStorage: false,
      name: this.selectedCountry?.name,
      iso: this.selectedCountry?.code
    });
  }

  writeValue(phoneNumberWithCode: string): void {
    const forlookup = phoneNumberWithCode;
    if (!phoneNumberWithCode) {
      this.phoneNumber = '';
      this.previousPhoneWithCode = '';
      return;
    }
    const normalizedPhone = phoneNumberWithCode.replace(/[^0-9]/g, '');
    this.phoneNumberWithCode = normalizedPhone;
    if (normalizedPhone === this.previousPhoneWithCode) return;
    this.previousPhoneWithCode = normalizedPhone;

    if (!this.showCountryDropdown()) {
      this.phoneNumber = normalizedPhone.slice(-10);
      return;
    }
    const matchedCountry = this.countryList.find((c) =>
      normalizedPhone.startsWith(c.dial_code.replace('+', ''))
    );
    if (matchedCountry) {
      this.selectCountry(matchedCountry);
      this.phoneNumber = normalizedPhone.slice(
        matchedCountry.dial_code.replace('+', '').length
      );
    } else {
      this.phoneNumber = normalizedPhone.slice(-10);
    }
    this.setValue(this.dialCode + this.phoneNumber);

    const minLength = this.selectedCountry.length.min ?? 5;
    const excludedUrls = [
      '/outside/pricing-plan',
      '/outside/vcn/cardholder-form'
    ];
    const isExcludedUrl = excludedUrls.some((url) =>
      this.router.url.includes(url)
    );
    if (!isExcludedUrl && this.phoneNumber.length >= minLength) {
      this.phoneNumberLookup(forlookup);
    }
  }

  registerOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  setValue(phoneNumberWithCode: string): void {
    this.phoneNumberWithCode = phoneNumberWithCode;
    this.onChange(phoneNumberWithCode);
  }

  ngOnInit() {
    this.currentCountryURL = 'https://flagcdn.com/w320/us.png';
    this.selectDefaultCountry();
  }

  phoneNumberLookup(phoneWithCode: string) {
    this.isPhoneValueLoading = true;
    this.subscriptions.push(
      this.cloudService
        .phoneNumberLookup(phoneWithCode)
        .pipe(
          finalize(() => {
            this.isPhoneValueLoading = false;
            this.changeDetector.detectChanges();
          })
        )
        .subscribe({
          next: (lookupResponse) => {
            if (
              Object.keys(lookupResponse.data).length &&
              (lookupResponse.data.phoneNumber === phoneWithCode ||
                lookupResponse.data.phoneNumber.slice(1) === phoneWithCode)
            ) {
              this.countryCode = lookupResponse.data.countryCode;
              this.countryList.forEach((element) => {
                if (element.code === this.countryCode) {
                  this.dialCode = element.dial_code;
                  this.currentCountryURL = element.flage_url;
                  this.currentCountryMask = element.mask;
                  this.currentDialCode = element.dial_code;
                  this.countryDropdown.emit({
                    isOpen: this.showDropDown,
                    length: element.length,
                    code: element.dial_code
                  });
                }
              });
              const convertedPhoneNumber = (phoneWithCode as string).replace(
                this.dialCode,
                ''
              );
              this.phoneNumber = convertedPhoneNumber;
            } else {
              this.countryList.forEach((country) => {
                if (
                  country.dial_code ===
                    (this.localStorageService.getItem('selected_dial_code') ||
                      '+1') &&
                  country.code ===
                    (this.localStorageService.getItem(
                      'selected_country_code'
                    ) || 'US')
                ) {
                  this.countryCode = country.dial_code;
                  this.dialCode = country.dial_code;
                  this.currentCountryURL = country.flage_url;
                  this.currentDialCode = country.dial_code;
                  this.countryDropdown.emit({
                    isOpen: this.showDropDown,
                    length: country.length,
                    code: country.dial_code
                  });
                }
              });
              const dialCodes =
                this.localStorageService.getItem('selected_country_code') ??
                this.localStorageService.getItem('selected_dial_code');
              this.phoneNumber = phoneWithCode.split(dialCodes)[1];
            }
            this.onInput();
          }
        })
    );
  }

  onInput(): void {
    if (this.phoneNumber === '') {
      this.setValue('');
      return;
    }
    if (!this.showCountryDropdown()) {
      this.setValue(this.phoneNumber);
      return;
    }
    const phone =
      this.currentDialCode === undefined
        ? this.selectedCountry.dial_code + this.phoneNumber
        : this.currentDialCode + this.phoneNumber;
    this.setValue(phone);
  }

  toggleDropDown() {
    if (this.isReadOnly()) return;
    this.showDropDown = !this.showDropDown;
    if (this.showDropDown) {
      setTimeout(() => this.searchInputRef?.focus());
    }
    this.countryDropdown.emit({ isOpen: this.showDropDown });
  }

  selectCountry(country: ICountryModel) {
    this.selectedCountry = country;
    this.currentCountryURL = country.flage_url;
    this.currentDialCode = country.dial_code;
    this.currentCountryMask = country.mask;
    this.localStorageService.setItem(
      'selected_country_code',
      country.dial_code
    );
    this.showDropDown = false;
    this.countryDropdown.emit({
      isOpen: this.showDropDown,
      length: country.length,
      code: country.dial_code
    });
    this.countryCodeEmit.emit({
      code: country.dial_code,
      updateLocalStorage: true,
      name: country.name,
      iso: country.code
    });
    this.onInput();
    const numberToReduce =
      this.phoneNumber.length - (country.length.max as number);
    if (numberToReduce > 0) {
      this.phoneNumber = this.phoneNumber.substring(
        0,
        this.phoneNumber.length - numberToReduce
      );
    }
  }

  onPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      const numericOnly = pastedText.replace(/\D/g, '');
      setTimeout(() => {
        this.phoneNumber = numericOnly
          .toString()
          .slice(0, this.selectedCountry.length.max as number);
      }, 10);
    }
  }

  preventInvalidInput(event: KeyboardEvent) {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey) return;
    const k = event.key.charCodeAt(0);
    if (
      k < 48 ||
      k > 57 ||
      this.phoneNumber?.length >= (this.selectedCountry.length.max as number)
    ) {
      event.preventDefault();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}

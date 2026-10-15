import { Subscription } from 'rxjs';
import {
  Component,
  OnInit,
  OnDestroy,
  forwardRef,
  Input,
  inject,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  input,
} from '@angular/core';
import { Country } from 'src/app/data/data/country-list';
import { finalize } from 'rxjs/operators';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { ICountryModel } from 'src/app/models/common';
import { CommonModule, NgStyle } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { Router } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { CloudBankService } from '../../service/cloud-bank/cloud-bank.service';
import { LocalStorageService } from '../../service/storage/local-storage.service';

/**
 * @description Component for new phone input.
 */
@Component({
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NgxMaskDirective,
    PipesModule,
    NgxMaskPipe,
    NgStyle,
    OverlayModule
  ],
  selector: 'app-new-phone-input',
  templateUrl: './new-phone-input.component.html',
  styleUrls: ['./new-phone-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NewPhoneInputComponent),
      multi: true
    },
    SearchFilterPipe
  ]
})
export class NewPhoneInputComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  private localStorageService = inject(LocalStorageService);
  private changeDetector = inject(ChangeDetectorRef);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  @Input() showCountryFlag = true;
  @Input() inputHeight: string;
  @Input() dropDownHeight: string;
  @Input() inputWidth: string;
  @Input() inputFontSize: string;
  @Input() inputPadding: string;
  @Input() inputBorderRadius: string;
  @Input() isReadOnly = false;
  @Input() isRequiredField = false;
  @Input() placeholder?: string;
  @Input() dropdownWidth = '300px';
  @Input() changePosition = false;
  isTableField = input(false);
  fieldHeight = input('');

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

  cloudService = inject(CloudBankService);

  subscriptions: Subscription[] = [];
  onChange: (event?: string) => void = () => {};
  onTouched: (event?: Event) => void = () => {};
  lastInputTime: number;
  countryList: ICountryModel[] = Country.countryList();
  selectedCountry: ICountryModel = this.countryList[0];
  currentCountryURL: string;
  currentCountryMask: string = '(000) 000-0000';
  currentDialCode: string;
  showDropDown = false;
  @ViewChild('searchInputRef') searchInputRef?: ElementRef<HTMLInputElement>;
  searchInput: string;
  countryCode = this.countryList[0].code;
  dialCode = this.countryList[0].dial_code;
  phoneNumberWithCode = '';
  previousPhoneWithCode = '';
  phoneNumber = '';
  isPhoneValueLoading = false;
  isDisabled = false;
  dropdownPosition: 'bottom' | 'top' = 'bottom';
  parentHeight: number;

  /**
   * @description If localstorage contains selected_dial_code this method set that country as the default for the dropdown.
   */
  selectDefaultCountry() {
    const dialCode = this.localStorageService.getItem('selected_dial_code');
    if (dialCode) {
      const defaultCountry = this.countryList.filter((country) => {
        if (country.dial_code === dialCode) {
          return true;
        }
        return false;
      });

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
    // eslint-disable-next-line no-param-reassign
    phoneNumberWithCode = phoneNumberWithCode.replace(/[^0-9]/g, '');
    this.phoneNumberWithCode = phoneNumberWithCode;

    if (phoneNumberWithCode === this.previousPhoneWithCode) {
      return;
    }
    this.previousPhoneWithCode = phoneNumberWithCode;

    // Determine and strip dial code from number
    const matchedCountry = this.countryList.find(c =>
      phoneNumberWithCode.startsWith(c.dial_code.replace('+', ''))
    );

    if (matchedCountry) {
      this.selectCountry(matchedCountry);
      this.phoneNumber = phoneNumberWithCode.slice(
        matchedCountry.dial_code.replace('+', '').length
      );
    } else {
      this.phoneNumber = phoneNumberWithCode.slice(-10);
    }

    this.setValue(this.dialCode + this.phoneNumber);
    // Checks the current router URL and performs a phone number lookup if the URL is not '/outside/pricing-plan'.
    const minLength = this.selectedCountry.length.min ?? 5;
    const excludedUrls = ['/outside/pricing-plan','/outside/vcn/cardholder-form'];
    const isExcludedUrl = excludedUrls.some(url => this.router.url.includes(url));
    if(!isExcludedUrl && this.phoneNumber.length >= minLength) {
      this.phoneNumberLookup(forlookup);
    }
  }

  registerOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  /**
   * @description Sets phone number to `this.phoneNumberWithCode`.
   * @param phoneNumberWithCode - phone number with code.
   */
  setValue(phoneNumberWithCode: string): void {
    this.phoneNumberWithCode = phoneNumberWithCode;
    this.onChange(phoneNumberWithCode);
  }

  ngOnInit() {
    this.currentCountryURL = 'https://flagcdn.com/w320/us.png';
    this.selectDefaultCountry();
  }

  /**
   * @description Searches for given phone with code and coverts and updates `this.phoneNumber`.
   * @param phoneWithCode - phone number with code.
   */
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
                  // this.dialCode = element.dial_code.replace(/\+/g, '');
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
              const toConvertPhoneNumber = phoneWithCode as string;
              const convertedPhoneNumber = toConvertPhoneNumber.replace(
                this.dialCode,
                ''
              );
              this.phoneNumber = convertedPhoneNumber;
            } else {
              // Pre selecting country based on country code (eg: +1) before fetching phone lookup api
              this.countryList.forEach((country) => {
                if (
                  country.dial_code ===
                  (this.localStorageService.getItem('selected_dial_code') ||
                    '+1')
                  && country.code === (this.localStorageService.getItem('selected_country_code') || 'US')
                ) {
                  this.countryCode = country.dial_code;
                  // this.dialCode = element.dial_code.replace(/\+/g, '');
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
              const dialCodes = this.localStorageService.getItem('selected_country_code') ?? this.localStorageService.getItem('selected_dial_code');
              this.phoneNumber = phoneWithCode.split(dialCodes)[1];
            }
            this.onInput();
          }
        })
    );
  }

  /**
   * @description Updates phone number on input.
   */
  onInput(): void {
    if (this.phoneNumber === '') {
      this.setValue('');
      return;
    }
    let phone = '';
    if (this.currentDialCode === undefined) {
      phone = this.selectedCountry.dial_code + this.phoneNumber;
    } else if (this.currentDialCode !== undefined) {
      phone = this.currentDialCode + this.phoneNumber;
    }
    this.setValue(phone);
  }

  /**
   * @description Shows or hides dropdown.
   */
  toggleDropDown() {
    if (this.isReadOnly) {
      return;
    }
    this.showDropDown = !this.showDropDown;
    if (this.showDropDown) {
      setTimeout(() => {
        this.updateDropdownPosition();
        this.searchInputRef?.nativeElement.focus();
      }, 0);
    }
    this.countryDropdown.emit({ isOpen: this.showDropDown });
  }

  /**
   * @description Sets the selected country.
   * @param country - selected country.
   */
  selectCountry(country: ICountryModel) {
    this.selectedCountry = country;
    this.currentCountryURL = country.flage_url;
    this.currentDialCode = country.dial_code;
    this.currentCountryMask = country.mask;
    this.localStorageService.setItem('selected_country_code',country.dial_code);
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

  /**
   * @description - Removes any characters other than number from pasted value
   * @param event The clipboard event which contain pasted data
   */
  onPaste(event: ClipboardEvent) {
    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      // Filter out non-numeric characters
      const numericOnly = pastedText.replace(/\D/g, '');
      /**
       * Used setTimeout to create a dealy for updating the ngModel.
       */
      setTimeout(() => {
        this.phoneNumber = numericOnly
          .toString()
          .slice(0, this.selectedCountry.length.max as number);
      }, 10);
      // event.preventDefault();
    }
  }

  /**
   * @description -Prevents invalid keyboard input by allowing only numeric characters.
   * @param event -The keyboard event triggered when a key is pressed.
   */
  preventInvalidInput(event: KeyboardEvent) {
    if (event instanceof KeyboardEvent) {
      const k = event.key.charCodeAt(0);
      // Allow only numeric input (key codes 48-57 represent digits 0-9)
      if (
        k < 48 ||
        k > 57 ||
        this.phoneNumber?.length >= (this.selectedCountry.length.max as number)
      ) {
        event.preventDefault();
      }
    }
  }

  updateDropdownPosition() {
    const inputRect = this.elementRef.nativeElement.getBoundingClientRect();
    const bottomHeight = inputRect.bottom;
    let parent = this.elementRef.nativeElement.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'div') {
        this.parentHeight = parent.offsetHeight;
        if ((bottomHeight > this.parentHeight) && this.changePosition) {
          this.dropdownPosition = 'top';
        } else {
          this.dropdownPosition = 'bottom';
        }
        break;
      }
      parent = parent.parentElement;
    }

    if (!this.parentHeight || !parent) {
      this.dropdownPosition = 'bottom';
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}

import { Subscription } from 'dexie';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import countryData from 'src/app/data/data/country-list-json/country-list-code.json';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { CloudBankService } from '../../service/cloud-bank/cloud-bank.service';

export interface ICountry {
  name: string;
  dial_code: string;
  code: string;
  flage_url: string;
}

interface EmitValue {
  fullPhoneNo: string;
  dialCode: string;
  phone: string;
}

/**
 * @description Component for phone number input
 */
@Component({
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PipesModule
  ],
  selector: 'app-phone-input',
  templateUrl: './phone-input.component.html',
  styleUrls: ['./phone-input.component.scss']
})
export class PhoneInputComponent implements OnInit, OnDestroy {
  @Input() phoneNumber: string;
  @Input() dialCode: string;
  @Output() changeEvent = new EventEmitter<EmitValue>();
  @Output() outsideClickEvent = new EventEmitter<boolean>();
  @Input() showInvalidNumberErrorMessage = false;

  private cloudService = inject(CloudBankService);

  private countryCodeSubscription: Subscription | undefined;
  invalidPhoneNumber = false;
  countryList: ICountry[] = countryData;
  selectedCountry: ICountry = this.countryList[0];
  currentCountryURL: string;
  currentDialCode: string;
  showDropDown = false;
  searchInput: string;

  ngOnInit() {
    this.countryCodeSubscription =
      this.cloudService.phoneDetailsUpdater$.subscribe((res) => {
        if (res !== undefined) {
          this.phoneNumber = res.phone;
          this.countryList.forEach((element) => {
            if (element.code === res.countryCode) {
              this.currentCountryURL = element.flage_url;
              this.currentDialCode = element.dial_code;
            }
          });
        } else {
          this.currentCountryURL = 'https://flagcdn.com/w320/us.png';
        }
      });
  }

  preventInvalidInput(event: KeyboardEvent) {
    const k = event.key.charCodeAt(0);
    // Allow only numeric input (key codes 48-57 represent digits 0-9)
    if (k < 48 || k > 57) {
      event.preventDefault();
    }
  }

  /**
   * @description Shows or hides dropdown.
   */
  toggleDropDown() {
    this.showDropDown = !this.showDropDown;
  }

  /**
   * @description Sets the selected country.
   * @param country - selected country.
   */
  selectCountry(country: ICountry) {
    const phone: string = country.dial_code + this.phoneNumber;
    this.changeEvent.emit({
      fullPhoneNo: phone,
      dialCode: country.dial_code,
      phone: this.phoneNumber
    });
    this.selectedCountry = country;
    this.currentCountryURL = country.flage_url;
    this.currentDialCode = country.dial_code;
    this.showDropDown = false;
  }

  /**
   * @description Emits `onChange` event with phone number details object.
   */
  phoneChange() {
    if (this.phoneNumber.length < 10) {
      this.invalidPhoneNumber = true;
    } else {
      this.invalidPhoneNumber = false;
    }
    let phone = '';
    if (this.currentDialCode === undefined) {
      phone = this.selectedCountry.dial_code + this.phoneNumber;
      this.changeEvent.emit({
        fullPhoneNo: phone,
        dialCode: this.selectedCountry.dial_code,
        phone: this.phoneNumber
      });
    } else if (this.currentDialCode !== undefined) {
      phone = this.currentDialCode + this.phoneNumber;
      this.changeEvent.emit({
        fullPhoneNo: phone,
        dialCode: this.currentDialCode,
        phone: this.phoneNumber
      });
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
      this.phoneNumber = numericOnly;
      event.preventDefault();
    }
  }

  /**
   * @description Emits `outsideClickEvent` with `true` as value.
   */
  getChangeEvent(): void {
    this.outsideClickEvent.emit(true);
  }

  ngOnDestroy() {
    this.countryCodeSubscription?.unsubscribe();
  }
}

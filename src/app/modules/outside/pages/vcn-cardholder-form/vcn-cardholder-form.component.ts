import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { IPayeeStates } from 'src/app/modules/payee/payee-v2/model/payee';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { environment } from 'src/environments/environment';
import { ExternalBankComponent } from '../external-bank/external-bank.component';
import { IVcnCardHolderUpdatePayload } from '../../model/outside';
import { Country } from 'src/app/data/data/country-list';
import { ICountryModel } from 'src/app/models/common';

@Component({
  selector: 'app-vcn-cardholder-form',
  standalone: true,
  imports: [
    NgOptimizedImage,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    NewPhoneInputComponent,
    FormsModule,
    ReactiveFormsModule,
    ExternalBankComponent,
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './vcn-cardholder-form.component.html',
  styleUrl: './vcn-cardholder-form.component.scss'
})
export class VcnCardholderFormComponent implements OnInit, OnDestroy {
  public authV3Service = inject(AuthV3Service);
  private route = inject(ActivatedRoute);
  private googleAddressService = inject(GoogleAddressService);
  private outsideService = inject(OutsideService);
  private alertService = inject(AlertService);
  
  countryList = Country.countryList();
  private phoneAlertShown = false;

  logoPath = 'assets/main/app_logo.svg';
  transactionId: string;
  env = environment;
  countries: string[] = [];
  allowedcountries: { [key: string]: string } = {};
  payeeStates: IPayeeStates[] = [];
  newToken: string;
  isShowStateDropDown = signal(false);
  isLoading = signal(false);
  isSubmit = signal(false);
  payeeAdded = signal(false);
  isLinkExpired = signal(false);
  payeeType = signal('1');
  isCompassCustomer = signal(false);
  addPayeeBank = false;
  destroy$ = new Subject();

  payeeForm = new FormGroup({
    user_id: new FormControl(''),
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    phone: new FormControl('', [
      ValidationService.phoneMinLength,
      Validators.required
    ]),
    email: new FormControl('', [
      ValidationService.emailValidator,
      Validators.required
    ]),
    address_line1: new FormControl('', Validators.required),
    address_line2: new FormControl(''),
    city: new FormControl('', Validators.required),
    state: new FormControl('', Validators.required),
    country: new FormControl('', Validators.required),
    zip: new FormControl('', Validators.required)
  });

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.params?.id;

    this.getToken(this.transactionId);
    this.payeeForm.controls.user_id.setValue(this.transactionId);
    
    // Reset alert flag when user starts typing
    this.payeeForm.controls.phone.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.phoneAlertShown = false;
      });
    
    if (this.env.isItWhiteLabel) {
      this.logoPath = `assets/white_label/${this.env.env_id}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg';
    }
  }

  getToken(transactionId: string) {
    this.isLoading.set(true);
    this.outsideService
      .getVcnCardHolderDetail(transactionId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.payeeForm.controls.email.setValue(
              res?.data?.holder?.email as string
            );
            this.payeeForm.controls.firstName.setValue(
              res?.data?.holder?.first_name as string
            );
            this.payeeForm.controls.lastName.setValue(
              res?.data?.holder?.last_name as string
            );

            this.payeeForm.controls.phone.setValue(
              res?.data?.holder?.phone as string

            );

          }
        },
        error: () => {
          this.isLinkExpired.set(true);
        }
      });
  }

  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.payeeForm.patchValue({
          address_line1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  onSubmit() {
    this.payeeForm.markAllAsTouched();
    if (this.payeeForm.invalid) {
      return;
    }
    const formValue = this.payeeForm.value;

    // Construct the new payload with `payee_name` instead of `firstName` and `lastName`
    const modifiedPayload: IVcnCardHolderUpdatePayload = {
      first_name: formValue.firstName,
      last_name: formValue.lastName,
      phone: formValue.phone,
      email: formValue.email,
      address: formValue.address_line1,
      address2: formValue.address_line2,
      city: formValue.city,
      state: formValue.state,
      country: this.getCountryCode(formValue.country),
      zip_code: formValue.zip
    };
    
    this.isSubmit.set(true);
    this.outsideService
      .vcnCardHolderDetailUpdate(this.transactionId, modifiedPayload)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
            this.payeeAdded.set(true);
        }
      });
  }

  /**
   * @description Handles phone field blur event
   */
  onPhoneBlur(): void {
    const phoneValue = this.payeeForm.controls.phone.value;
    
    if (phoneValue && phoneValue.length >= 10 && !this.phoneAlertShown) {
      this.validatePhoneNumber(phoneValue);
    }
  }
  
  /**
   * @description Validates phone number and shows alert if invalid
   */
  private validatePhoneNumber(phoneWithCode: string): void {
    const numericPhone = phoneWithCode.replace(/[^0-9]/g, '');
    let isValid = false;    
    // Find country by dial code and validate
    for (const country of this.countryList) {
      const dialCodeDigits = country.dial_code.replace(/[^0-9]/g, '');
      
      if (numericPhone.startsWith(dialCodeDigits)) {
        const nationalNumber = numericPhone.slice(dialCodeDigits.length);
        
        if (this.isValidNationalNumber(nationalNumber, country)) {
          isValid = true;
          break;
        }
      }
    }
    // Show alert based on validation result
    if (!isValid) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      this.phoneAlertShown = true;
    }
  }

  /**
   * @description Validates national number length for country
   */
  private isValidNationalNumber(number: string, country: ICountryModel): boolean {
    const min = country.length?.min || 5;
    const max = country.length?.max || 15;
    return number.length >= min && number.length <= max;
  }

  private getCountryCode(country: string | null | undefined) {
    if (!country) {
      return '';
    }

    // If already a 2-character code, return as is
    if (country.length === 2) {
      return country.toUpperCase();
    }

    // Find country by name (case insensitive)
    const countryCode = this.countryList.find(c =>
      c.name.toLowerCase() === country.toLowerCase() ||
      c.code.toLowerCase() === country.toLowerCase()
    );

    // Return the country code if found, otherwise return original value
    return countryCode?.code || country;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

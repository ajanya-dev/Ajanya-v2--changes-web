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
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
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
import { IExternalPayeePayload } from '../../model/outside';

@Component({
  selector: 'app-external-payee',
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
  templateUrl: './external-payee.component.html',
  styleUrl: './external-payee.component.scss'
})
export class ExternalPayeeComponent implements OnInit, OnDestroy {
  public authV3Service = inject(AuthV3Service);
  private route = inject(ActivatedRoute);
  private googleAddressService = inject(GoogleAddressService);
  private appSettingService = inject(AppSettingsService);
  private outsideService = inject(OutsideService);
  private alertService = inject(AlertService);

  logoPath = signal('assets/main/app_logo.svg');
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
  companyName = signal('');
  addPayeeBank = signal(false);
  destroy$ = new Subject();
  currenCountryPhoneLength: { min: number; max: number };

  private readonly companyNameValidators = [
    Validators.maxLength(60),
    ValidationService.containsHtmlTag
  ];

  payeeForm = new FormGroup({
    user_id: new FormControl(''),
    firstName: new FormControl('', [
      Validators.required,
      Validators.maxLength(30),
      ValidationService.whitespaceValidator,
      ValidationService.containsHtmlTag,
      ValidationService.personNamePartValidator
    ]),
    lastName: new FormControl('', [
      Validators.required,
      Validators.maxLength(30),
      ValidationService.whitespaceValidator,
      ValidationService.containsHtmlTag,
      ValidationService.personNamePartValidator
    ]),
    payee_nick_name: new FormControl('', [Validators.maxLength(10), ValidationService.containsHtmlTag]),
    payee_phone: new FormControl('', [
      Validators.required,
      ValidationService.customMinLength(10)
    ]),
    customer_account_number: new FormControl(''),
    entityType: new FormControl(''),
    payee_company_name: new FormControl('', this.companyNameValidators),
    payee_email: new FormControl('', [ValidationService.emailValidator, Validators.required]),
    payee_address_line1: new FormControl('', [
      Validators.required,
      Validators.maxLength(150),
      ValidationService.addressValidator
    ]),
    payee_address_line2: new FormControl('', [
      Validators.maxLength(150),
      ValidationService.addressValidator
    ]),
    payee_city: new FormControl('', [
      Validators.required,
      Validators.maxLength(50),
      ValidationService.addressValidator
    ]),
    payee_state: new FormControl('',Validators.required),
    payee_country: new FormControl('',Validators.required),
    payee_zip: new FormControl('', [
      Validators.required,
      Validators.maxLength(10),
      ValidationService.zipValidator
    ]),
    employee_ssn_number: new FormControl('', [Validators.minLength(9)]),
    vendor_ein_number: new FormControl('', [Validators.minLength(9)]),
  });

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.params?.id;
    this.addPayeeBank.set(this.route.snapshot.queryParams?.add_bank === '1');
    
    this.getToken(this.transactionId);
    this.payeeForm.controls.user_id.setValue(this.transactionId);
    this.loadLogo();
  }

  private loadLogo(): void {
    if (this.env.isItWhiteLabel) {
      this.logoPath.set(
        `assets/white_label/${this.env.env_id}/assets/app_logo.png`
      );
      return;
    }

    this.appSettingService.appConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        if (!config) return;
        this.logoPath.set(
          config.websiteLogo || config.zilMoneyLogo || 'assets/main/app_logo.png'
        );
      });
  }

  getToken(transactionId: string) {
    this.isLoading.set(true);
    this.outsideService
      .getExternalPayeeToken(transactionId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.newToken = res.data?.token as string;
            this.payeeType.set(res.data?.payeeType as string);
            this.payeeForm.controls.payee_email.setValue(res?.data?.payeeEmail as string);
            if (res.data.payee) {
              const {payee} = res.data;
              this.payeeForm.patchValue({
                firstName: payee.payee_name ?? '',
                lastName: '',
                payee_nick_name: payee.payee_nick_name ?? '',
                payee_phone: payee.payee_phone ?? '',
                payee_address_line1: payee.payee_address_line_1 ?? '',
                payee_address_line2: payee.payee_address_line_2 ?? '',
                payee_city: payee.payee_city ?? '',
                payee_state: payee.payee_state ?? '',
                payee_country: payee.payee_country ?? '',
                payee_zip: payee.payee_zip ?? ''
              });
            }
            this.isCompassCustomer.set(res?.data?.plugins.includes('enterprise-compass'));
            this.companyName.set(res?.data?.senderCompanyName ?? '');
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
          payee_address_line1: res.address,
          payee_city: res.city,
          payee_state: res.state,
          payee_zip: res.zip,
          payee_country: res.country
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

    const country = formValue.payee_country;
    if (country === 'US' || country === 'United States') {
      if (formValue.payee_zip && /[A-Za-z]/.test(formValue.payee_zip)) {
        this.alertService.warningAlert({
          content: `Zip field only allow integer values for <br> United States`
        });
        return;
      }
    }

    let accountNumberField: 'customer_account_number' | 'vendor_account_number' | 'employee_account_number' = 'customer_account_number';
    if (this.payeeType() === '2') {
      accountNumberField = 'vendor_account_number';
    } else if (this.payeeType() === '3') {
      accountNumberField = 'employee_account_number';
    }

    // Construct the new payload with `payee_name` instead of `firstName` and `lastName`
    const modifiedPayload:IExternalPayeePayload = {
      ...formValue,
      add_payee_bank: 1,
      payee_name: `${formValue.firstName} ${formValue.lastName}`.trim() // Combine firstName and lastName
    };

    // Remove the individual `firstName` and `lastName`
    delete modifiedPayload.firstName;
    delete modifiedPayload.lastName;

    if (accountNumberField !== 'customer_account_number') {
      modifiedPayload[accountNumberField] = formValue.customer_account_number;
      delete modifiedPayload.customer_account_number;
    }

    this.isSubmit.set(true);
    this.outsideService
      .addExternalPayee(this.transactionId, modifiedPayload)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.newToken = res.token;
          if (this.addPayeeBank()) {
            this.payeeAdded.set(true);
          } else {
            this.alertService.infoAlert({
              title: 'How would you like to get paid?',
              content: '',
              isCancel: true,
              doneMsg: 'Add Bank',
              cancelMsg: 'Not Now'
            }).afterClosed().subscribe((resp) => {
              if (resp) {
                this.payeeAdded.set(true);
                this.addPayeeBank.set(true);
              } else {
                this.payeeAdded.set(true);
                this.addPayeeBank.set(false);
              }
            });
          }
        }
      });
  }

  get payeeLegalName(): string {
    const { firstName, lastName } = this.payeeForm.getRawValue();
    return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }

  get placeholderText() {
    return `${this.isCompassCustomer() ? 'Vendor' :'Payee'} ID/ Account Number`;
  }

  // Dynamic tooltip using computed property
  get tooltipText() {
    return `Please enter your unique ${this.isCompassCustomer() ? 'Vendor' :'Payee'} ID or Account Number`;
  }

  get payeeTypeLabel(): string {
    const type = this.payeeType();
    if (type === '2') return 'vendor';
    if (type === '3') return 'employee';
    return 'customer';
  }

  get isCompanyNameRequired(): boolean {
    return this.payeeForm.controls.entityType.value === 'business';
  }

  onEntityTypeChange(): void {
    const companyNameControl = this.payeeForm.controls.payee_company_name;
    if (this.payeeForm.controls.entityType.value === 'business') {
      companyNameControl.setValidators([
        Validators.required,
        ...this.companyNameValidators
      ]);
    } else {
      companyNameControl.setValidators(this.companyNameValidators);
    }
    companyNameControl.updateValueAndValidity();
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currenCountryPhoneLength = event.length;
    this.payeeForm.controls.payee_phone.setValidators([
      Validators.required,
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.payeeForm.controls.payee_phone.updateValueAndValidity();
  }

  get zipPlaceholder(): string {
    const country = this.payeeForm.controls.payee_country.value;
    return !country || country === 'US' || country === 'United States'
      ? 'Zip'
      : 'Postal Code';
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }
}

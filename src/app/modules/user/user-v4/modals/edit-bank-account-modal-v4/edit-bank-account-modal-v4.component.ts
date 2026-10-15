import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Validators,
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  IBankAccountEditDetails,
  IBankData,
  IBankDropdown,
  IBankEditForm
} from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgClass } from '@angular/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { LucideAngularModule, X, AlertCircle } from 'lucide-angular';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { resolveTransitNumber } from 'src/app/shared/utils/bank.util';

@Component({
  selector: 'app-edit-bank-account-modal-v4',
  templateUrl: './edit-bank-account-modal-v4.component.html',
  styleUrls: ['./edit-bank-account-modal-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    LucideAngularModule,
    V4CommonDropDownSelectorComponent,
    CommonCountrySelectV4Component
  ]
})
export class EditBankAccountModalV4Component implements OnInit {
  readonly X = X;
  readonly AlertCircle = AlertCircle;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<EditBankAccountModalV4Component>);
  public data: IBankData | IBankDropdown | { id: string; businessName?: string } = inject(
    MAT_DIALOG_DATA,
    { optional: true }
  );

  bankForm: FormGroup;
  isLoading = signal(false);
  isSubmit = signal(false);
  isVerifiedBank = signal(false);
  isCanadianBank = signal(false);
  /** True when the API returned separate transit + financial institute numbers for a Canadian bank. */
  hasSplitCanadianFields = signal(false);
  isRoutingNumberInitiallyChecked = signal(false);
  isMatchHolderName = signal(false);
  businessName = '';
  /** Country inferred from the numbers the API returned; null when undeterminable. */
  private detectedCountry = signal<string | null>(null);
  /** True when the API returned no usable country - unlocks the dropdown even for a verified account. */
  isCountryMissing = signal(false);

  readonly countryOptions: { [code: string]: string } = {
    US: 'United States',
    CA: 'Canada'
  };

  /**
   * Message shown when the picked country contradicts the account's own numbers. Held here
   * rather than inline in the template: the copy contains apostrophes that would terminate a
   * single-quoted template expression, and an inline object literal would be rebuilt on every
   * change-detection pass, re-triggering the signal `input()` (which compares by reference).
   */
  readonly countryMismatchMessage = {
    countryMismatch: "Country doesn't match this account's bank details."
  };

  private static readonly UNITED_STATES = 'United States';
  private static readonly CANADA = 'Canada';

  accountTypeList = [
    { label: 'Personal Checking', value: '5' },
    { label: 'Business Checking', value: '6' },
    { label: 'Personal Savings', value: '7' },
    { label: 'Business Savings', value: '8' }
  ];

  accountTypeDropdownConfig = {
    placeholder: 'Bank Account Type',
    displayField: 'label',
    outputField: 'value'
  };

  ngOnInit(): void {
    this.initFormGroup();
    this.setBankData();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.businessName = (this.data as { businessName?: string })?.businessName || '';
    this.setupHolderNameValidation();
  }

  setupHolderNameValidation(): void {
    if (!this.businessName) {
      this.isMatchHolderName.set(false);
      return;
    }

    const accHolderNameControl = this.bankForm.get('accHolderName');
    if (accHolderNameControl) {
      accHolderNameControl.addValidators(this.businessNameMatchValidator());
      accHolderNameControl.updateValueAndValidity();

      accHolderNameControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(value => {
          this.updateHolderNameWarning(value);
        });
    }
  }

  businessNameMatchValidator(): (control: AbstractControl) => { [key: string]: boolean } | null {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if (!this.businessName || !control.value) {
        return null;
      }

      const normalizedValue = control.value.trim().toLowerCase();
      const normalizedBusinessName = this.businessName.trim().toLowerCase();

      if (normalizedValue !== normalizedBusinessName) {
        return { businessNameMismatch: true };
      }

      return null;
    };
  }

  updateHolderNameWarning(value: string): void {
    if (!this.businessName || !value) {
      this.isMatchHolderName.set(false);
      return;
    }

    const normalizedValue = value.trim().toLowerCase();
    const normalizedBusinessName = this.businessName.trim().toLowerCase();

    this.isMatchHolderName.set(normalizedValue !== normalizedBusinessName);
  }

  initFormGroup() {
    this.bankForm = this.fb.group({
      accHolderName: ['', [Validators.required, ValidationService.personNameValidator]],
      AccountNickName: [
        '',
        [Validators.required, ValidationService.noWhitespaceValidator]
      ],
      AccountNumber: [
        '',
        [Validators.required, Validators.minLength(5), this.isAccountNoInvalid]
      ],
      ConfirmAccountNumber: [
        '',
        [
          Validators.required,
          ValidationService.isMatchingValidator(
            'AccountNumber',
            'Account number does not match'
          ),
          this.isAccountNoInvalid
        ]
      ],
      routingNumber: [''],
      transitNumber: [''],
      financialInstituteNumber: [''],
      phone: ['', [ValidationService.phoneNumberValidator]],
      AccountAddressLine1: ['', [Validators.required]],
      AccountAddressLine2: [''],
      city: [''],
      state: [''],
      zip: ['', ValidationService.zipValidator],
      country: ['', [Validators.required, this.countryMatchesBankNumbers()]],
      email: ['', [ValidationService.emailValidator]],
      nextCheckStartNo: [''],
      bankAccountType: [''],
      bankId: [''],
      bankName: [''],
      bankAddress1: [
        '',
        [Validators.required, ValidationService.noWhitespaceValidator]
      ],
      bankCity: [
        '',
        [Validators.required, ValidationService.noWhitespaceValidator]
      ],
      bankState: [
        '',
        [Validators.required, ValidationService.noWhitespaceValidator]
      ],
      bankZip: [
        '',
        [
          Validators.required,
          ValidationService.noWhitespaceValidator,
          ValidationService.zipValidator
        ]
      ]
    });
  }

  setBankData() {
    this.isLoading.set(true);
    this.bankAccService
      .viewBankById(
        (this.data as IBankData)?.encrypted_bankacc_id ||
          (this.data?.id as string)
      )
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
          const bankData = res.data;
          // The API can omit the country entirely. Fall back to what the account's own
          // numbers say, so the Routing vs Transit fields still render against real data,
          // and leave the dropdown empty so the user has to confirm the country.
          const normalizedCountry = this.normalizeCountry(
            bankData.bankAccountCountry
          );
          const detected = this.detectCountryFromBankNumbers(bankData);
          const countryMissing = !this.isKnownCountry(normalizedCountry);
          const resolvedCountry = countryMissing
            ? detected ?? ''
            : normalizedCountry;

          this.detectedCountry.set(detected);
          this.isCountryMissing.set(countryMissing);

          this.bankForm.patchValue({
            accHolderName: bankData.bankAccountName,
            AccountNickName: bankData.bankAccountNickName,
            AccountNumber: bankData.bankAccountNumber,
            phone: res.data.bankAccountPhone,
            AccountAddressLine1: bankData.bankAccountAddressLine1,
            AccountAddressLine2: bankData.bankAccountAddressLine2,
            city: bankData.bankAccountCity,
            state: bankData.bankAccountState,
            zip: bankData.bankAccountZip,
            country: countryMissing ? '' : normalizedCountry,
            email: bankData.bankAccountEmail,
            nextCheckStartNo: bankData.nextCheckNumber,
            bankAccountType: bankData?.bankAccountType != null ? String(bankData.bankAccountType) : null,
            bankId: bankData?.bankId
          });
          this.updateHolderNameWarning(bankData.bankAccountName);
          this.isVerifiedBank.set(!!bankData?.bankAccountVerified);
          if (this.bankForm.controls.AccountNumber.value != null)
            this.bankForm.controls.ConfirmAccountNumber.setValue(
              this.bankForm.controls.AccountNumber.value
            );
          const isCanada =
            resolvedCountry === EditBankAccountModalV4Component.CANADA;
          const transitNumber = bankData.transitNumber?.toString().trim();
          const financialInstituteNumber = bankData.financialInstituteNumber
            ?.toString()
            .trim();

          this.isCanadianBank.set(isCanada);
          this.hasSplitCanadianFields.set(
            isCanada && !!transitNumber && !!financialInstituteNumber
          );

          // Must run after the signals are set - the validators read them.
          this.updateValidation(resolvedCountry);

          if (this.hasSplitCanadianFields()) {
            this.bankForm.patchValue({
              transitNumber,
              financialInstituteNumber
            });
          } else {
            this.bankForm.controls.routingNumber.setValue(
              bankData.routingNumber
            );
            this.lookupRoutingNumber(String(bankData.routingNumber), true);
          }
        });
  }

  /**
   * @description Maps the country variants the API returns ('USA', 'US', 'CA') onto the exact
   * names used in the country JSON, so an option in the dropdown matches. Unknown values are
   * left untouched and simply show the placeholder.
   * @param country - The raw country value from the API or Google.
   * @returns The normalized country name.
   */
  private normalizeCountry(country: string): string {
    const value = country?.trim().toLowerCase();

    if (value === 'ca' || value === 'canada') {
      return EditBankAccountModalV4Component.CANADA;
    }
    if (value === 'us' || value === 'usa' || value === 'united states') {
      return EditBankAccountModalV4Component.UNITED_STATES;
    }
    return country;
  }

  /**
   * @description Whether a normalized country is one of the two the modal supports. Anything
   * else (null, '', or a country outside the dropdown) counts as missing.
   * @param country - A country value already put through `normalizeCountry`.
   * @returns True when the country is United States or Canada.
   */
  private isKnownCountry(country: string): boolean {
    return (
      country === EditBankAccountModalV4Component.UNITED_STATES ||
      country === EditBankAccountModalV4Component.CANADA
    );
  }

  /**
   * @description Infers the country from the identifiers the API returned, used when
   * `bankAccountCountry` is missing and to validate the user's pick against real data.
   *
   * Only US accounts carry a 9-digit routing number; Canadian accounts carry a transit +
   * financial institute pair, which legacy records store as a single `NNNNN-NNN` composite
   * inside `routingNumber` (see `resolveTransitNumber`), so a bare "has routingNumber"
   * check would wrongly read those as US.
   *
   * Deliberately does NOT treat a bare 8-digit value as Canadian, even though a stripped
   * `NNNNN-NNN` composite is 8 digits: `routingNumber` is typed `number`, so a US routing
   * number in Federal Reserve districts 01-12 (021000021, 011000015, ...) loses its leading
   * zero and also arrives as 8 digits. Misreading those very common accounts as Canadian is
   * far worse than returning null, which just means "inconclusive - let the user choose".
   * @param bankData - The bank account details returned by `viewBankById`.
   * @returns 'United States', 'Canada', or null when nothing conclusive is present.
   */
  private detectCountryFromBankNumbers(
    bankData: IBankAccountEditDetails
  ): string | null {
    const transitNumber = bankData.transitNumber?.toString().trim();
    const financialInstituteNumber = bankData.financialInstituteNumber
      ?.toString()
      .trim();

    if (transitNumber && financialInstituteNumber) {
      return EditBankAccountModalV4Component.CANADA;
    }

    const routingNumber = bankData.routingNumber?.toString().trim();
    if (!routingNumber) {
      return null;
    }

    if (routingNumber.includes('-')) {
      return EditBankAccountModalV4Component.CANADA;
    }
    if (routingNumber.replace(/\D/g, '').length === 9) {
      return EditBankAccountModalV4Component.UNITED_STATES;
    }

    return null;
  }

  /**
   * @description Validator that blocks a country selection contradicting the identifiers the
   * API returned - e.g. picking Canada on an account that holds a 9-digit routing number.
   *
   * Only applies when the API gave no country, i.e. when the user is the one supplying it.
   * A country the API did return is taken as-is, so a record whose stored country disagrees
   * with its numbers can still be edited instead of being blocked on open. Also stays silent
   * when the numbers are inconclusive, leaving those accounts free to pick either country.
   * @returns A ValidatorFn producing `{ countryMismatch: true }` on a contradiction.
   */
  private countryMatchesBankNumbers(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      this.hasCountryMismatch(control.value) ? { countryMismatch: true } : null;
  }

  /**
   * @description Whether a country contradicts the identifiers the API returned. See
   * `countryMatchesBankNumbers` for why this only applies to an API-missing country.
   * @param country - The country about to be applied.
   * @returns True when the country conflicts with the account's own numbers.
   */
  private hasCountryMismatch(country: string): boolean {
    const detected = this.detectedCountry();

    if (!this.isCountryMissing() || !detected || !country) {
      return false;
    }

    return country !== detected;
  }

  /**
   * @description Re-derives the Canada-specific state after the country changes, so the
   * Routing Number vs Transit + Financial Institute swap and their validators stay in sync.
   * @param country - The newly selected country name.
   */
  onCountryChange(country: string) {
    if (this.hasCountryMismatch(country)) {
      // Selection contradicts the numbers the API returned. `countryMatchesBankNumbers`
      // already flags it, so skip the field swap - `updateValidation` would otherwise
      // null out the routing number the user still needs.
      return;
    }

    this.isCanadianBank.set(
      country === EditBankAccountModalV4Component.CANADA
    );
    this.hasSplitCanadianFields.set(false);
    this.updateValidation(country);
  }

  updateValidation(country: string) {
    const controls = [
      'routingNumber',
      'bankName',
      'bankAddress1',
      'bankCity',
      'bankState',
      'bankZip'
    ];

    const isCanada = country === EditBankAccountModalV4Component.CANADA;

    controls.forEach((controlName) => {
      const control = this.bankForm.get(controlName);

      if (control) {
        if (isCanada) {
          control.setValue(null);
          control.clearValidators();
        } else {
          control.setValidators(this.getValidators(controlName));
        }

        control.updateValueAndValidity();
      }
    });

    this.updateCanadianSplitValidation();
  }

  /**
   * @description Applies validators to the Canadian transit / financial institute controls
   * only when they are visible, otherwise clears them so they can never block submit.
   */
  private updateCanadianSplitValidation() {
    const transit = this.bankForm.get('transitNumber');
    const financial = this.bankForm.get('financialInstituteNumber');

    if (this.hasSplitCanadianFields()) {
      transit?.setValidators([
        Validators.required,
        ValidationService.noWhitespaceValidator,
        Validators.pattern(/^\d{5}$/)
      ]);
      financial?.setValidators([
        Validators.required,
        ValidationService.noWhitespaceValidator,
        Validators.pattern(/^\d{3}$/)
      ]);
    } else {
      transit?.setValue('');
      financial?.setValue('');
      transit?.clearValidators();
      financial?.clearValidators();
    }

    transit?.updateValueAndValidity();
    financial?.updateValueAndValidity();
  }

  private getValidators(controlName: string) {
    const commonValidators = [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ];

    switch (controlName) {
      case 'routingNumber':
        return [
          ...commonValidators,
          Validators.minLength(9),
          Validators.pattern(
            this.isCanadianBank() ? /^\d{5}-\d{3}$/ : /^\d{9}$/
          ),
          ValidationService.routingNumberValidator
        ];
      case 'bankZip':
        return [...commonValidators, ValidationService.zipValidator];
      default:
        return commonValidators;
    }
  }

  lookupRoutingNumber(routingNumber: string, isInitialLoad: boolean) {
    if (this.isCanadianBank()) {
      const digitsOnly = routingNumber.replace(/\D/g, '');

      let formatted = digitsOnly;
      if (digitsOnly.length > 5) {
        formatted = `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}`;
      }
      if (this.bankForm.get('routingNumber')?.value !== formatted) {
        this.bankForm
          .get('routingNumber')
          ?.setValue(formatted, { emitEvent: false });
      }
      return;
    }

    this.isRoutingNumberInitiallyChecked.set(isInitialLoad);
    if (routingNumber === '' || routingNumber === null) return;
    if (routingNumber.length === 9 && !this.isCanadianBank()) {
      this.bankAccService
        .getroutingNumber(routingNumber)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res.success) {
            const bankDetails = res.data;
            this.bankForm.patchValue({
              bankName: bankDetails.name?.trim(),
              bankAddress1: bankDetails.address?.trim(),
              bankCity: bankDetails.city?.trim(),
              bankState: bankDetails.state?.trim(),
              bankZip: bankDetails.zip?.toString()
            });
          }
        });
    } else {
      this.bankForm.patchValue({
        bankName: '',
        bankAddress1: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
    }
  }

  createBankBody(): IBankEditForm {
    const data = this.bankForm.value;
    if (!data.nextCheckStartNo) {
      data.nextCheckStartNo = 1001;
    }
    return {
      bankAccountName: data.accHolderName,
      bankAccountNumber: data.AccountNumber,
      bankAccountNickName: data.AccountNickName,
      bankAccountAddressLine1: data.AccountAddressLine1,
      bankAccountAddressLine2: data.AccountAddressLine2,
      bankAccountCity: data.city,
      bankAccountState: data.state,
      bankAccountZip: data.zip,
      bankAccountCountry: data.country,
      bankAccountPhone: data.phone,
      bankAccountEmail: data.email,
      checkNumber: data.nextCheckStartNo,
      bankAccountType: data?.bankAccountType,
      bankId: data?.bankId,
      bankRoutingNumber: this.isCanadianBank() ? '' : data?.routingNumber,
      bankName: data?.bankName,
      bankAddress1: data?.bankAddress1,
      bankCity: data?.bankCity,
      bankState: data?.bankState,
      bankZip: data?.bankZip,
      transitNumber: resolveTransitNumber({
        isCanadianBank: this.isCanadianBank(),
        hasSplitFields: this.hasSplitCanadianFields(),
        routingNumber: data?.routingNumber,
        transitNumber: data?.transitNumber,
        financialInstituteNumber: data?.financialInstituteNumber
      })
    };
  }

  submit() {
    const processeData = this.createBankBody();
    const id = (this.data as IBankData)?.encrypted_bankacc_id || this.data?.id;
    this.bankForm.markAllAsTouched();

    if (this.bankForm.invalid) {
      return;
    }

    this.isSubmit.set(true);

    this.bankAccService
      .updateBankAccount(id as string, processeData)
      .pipe(
        finalize(() => {
          this.isSubmit.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const successRef = this.alertService.successAlert({
            title: 'Success',
            content: 'Bank account updated.',
            doneMsg: 'Ok',
            isCancel: false,
            close: false
          });
          successRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.dialogRef.close(processeData));
        }
      });
  }

  isAccountNoInvalid(
    control: AbstractControl
  ): { [key: string]: boolean } | boolean {
    if (!control.value) {
      return true;
    }
    if (String(control.value).substring(0, 1) === '-')
      return { invalidAccountNumber: true };
    return true;
  }

  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca']
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          AccountAddressLine1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip
        });
        this.applyGoogleCountry(res.country);
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Applies the country returned by Google Places. On a verified account this only
   * runs while the country is still missing - once it is set, its US/Canada routing rules are
   * locked and must not flip underneath it.
   * @param country - Country long name from Google (e.g. 'United States', 'Canada').
   */
  private applyGoogleCountry(country: string) {
    if (!country || (this.isVerifiedBank() && !this.isCountryMissing())) {
      return;
    }

    const normalized = this.normalizeCountry(country);
    if (normalized === this.bankForm.value.country) {
      return;
    }

    this.bankForm.patchValue({ country: normalized });
    // `patchValue` leaves the control untouched, and the inline message only renders once
    // touched - without this a Google-set country contradicting the numbers stays silent.
    this.bankForm.controls.country.markAsTouched();
    this.onCountryChange(normalized);
  }

  close(): void {
    this.dialogRef.close(false);
  }

}

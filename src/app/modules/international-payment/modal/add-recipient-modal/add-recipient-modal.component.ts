import { AfterViewInit, Component, computed, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialog
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, finalize, take } from 'rxjs/operators';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { IApiRes } from 'src/app/models/api';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { KeyValuePipe, NgClass } from '@angular/common';
import { faCircleExclamation, faXmark, faBuilding, faUser, faMapMarkerAlt, faAngleDown } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IBeneficiary } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { IAddress, IBeneficiaryDetails, ICountriesCache, IPayeeAddressDetails } from 'src/app/models/wallet';
import { CommonCountrySelectComponent } from 'src/app/shared/v3/common-country-select/common-country-select.component';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { Iv35ngSelectConfig } from 'src/app/shared/v3/v35-dropdown/models/v35-common-dropdown-selector.interface';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';

@Component({
  selector: 'app-new-international-account-v2',
  templateUrl: './add-recipient-modal.component.html',
  styleUrls: ['./add-recipient-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    KeyValuePipe,
    FaIconComponent,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    NgClass,
    NewPhoneInputComponent,
    CommonCountrySelectComponent,
    CommonStateSelectComponent,
    V35CommonDropDownSelectorComponent
  ]
})
export class AddRecipientModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<AddRecipientModalComponent>);
  private payeeService = inject(PayeeService);
  private googleAddressService = inject(GoogleAddressService);
  private cloudAccService = inject(CloudBankService);
  public data = inject(MAT_DIALOG_DATA);
  private walletService = inject(WalletService);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private localStorageService = inject(LocalStorageService);
  public walletDataService = inject(WalletDataV35Service);
  private dialog = inject(MatDialog);

  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;
  faBuilding = faBuilding;
  faUser = faUser;
  faMapMarkerAlt = faMapMarkerAlt;
  faAngleDown = faAngleDown;
  editMode: boolean;
  subscriptions: Subscription[] = [];
  private googleAddressSubscription: Subscription | null = null;
  countries: string[] = [];

  relationshipList = signal<{ value: string; name: string }[]>([]);

  relationshipDropdownConfig: Iv35ngSelectConfig = {
    placeholder: 'Beneficiary Relationship to Originator',
    displayField: 'name',
    outputField: 'value',
    searchMode: 'includes'
  };

  businessBanks: { label: string; value: string }[] = [];
  bicfiBanks: { label: string; value: string }[] = [];
  internationalPaymentsEnabledCountries = signal<ICountriesCache>({});
  
  // Organization ID Types for business
  organisationIdTypes = signal<{ value: string; label: string }[]>([]);
  
  // ID Document Types for personal
  beneficiaryIdDocumentTypes = signal<{ value: string; label: string }[]>([]);

  utils = Utils;
  internationalBankAcForm: FormGroup;
  beneficiaryForm: FormGroup;
  beneficiaryBankForm: FormGroup;

  isLoading = signal(false);
  isSubmit = signal(false);
  isRelationshipLoading = signal(false);
  allowedcountries: Record<string, string> = {};
  isShowIfsc = false;
  isInvalidIban = signal(false);
  isInvalidIfsc = signal(false);
  isIbanCountry = signal(false);
  ibanCheckingLoading = signal(false);
  isEnabledCountriesLoading = signal(false);
  isBusinessBanksLoading = signal(false);
  enabledCountryCode: string[] = [];
  isCountryChanged = signal(false);
  isUkCountry = signal(false);
  phoneErrorMessages: { [key: string]: string } = {};

  bankDetailsCollapsed = signal(false);
  beneficiaryDetailsCollapsed = signal(true);
  businessDetailsCollapsed = signal(true);
  addressDetailsCollapsed = signal(true);

  isAddressFromIFSCCheck = signal<boolean>(false);
  isAddressLoading = signal<boolean>(false);


  userHasBeneficiaryDetails = signal<boolean>(false);
  recipientId = signal<string>('');
  recipientBeneficiaryDetails = signal<IPayeeAddressDetails | undefined>(undefined);
  userHasMultipleBeneficiaryDetails = computed(() => this.recipientBeneficiaryDetails()?.is_existing);
  existingList = computed(() => this.recipientBeneficiaryDetails()?.existing_beneficiary_details);
  selectedDetails = signal<IBeneficiaryDetails | undefined>(undefined);
  selectedAddressId = new FormControl<number | null>(null);
  selectedAddress = signal<IAddress | undefined>(undefined);
  useExistingRecipientDetails = signal(false);
  detailsLoading = signal(false);

  private readonly COUNTRIES_BUSINESS_CACHE_KEY = 'international_countries_business_data';
  private readonly COUNTRIES_PERSONAL_CACHE_KEY = 'international_countries_personal_data';
  
  @ViewChild(V35CommonDropDownSelectorComponent)
  relationshipDropdown?: V35CommonDropDownSelectorComponent;

  fieldToInputIdMap: Record<string, string> = {
    ifsc: 'branchCode',
    zip: 'beneficiaryBankZip',
    accountNumber: 'accountNumber',
    city: 'beneficiaryBankCity',
    state: 'beneficiaryBankState',
    addressLine1: 'beneficiaryBankStreet1',
    addressLine2: 'beneficiaryBankStreet2',
    branchCode: 'branchCode',
    bankName: 'bankName',
    routingOrSortCode: 'routingOrSortCode',
    organisationIdNumber: 'organisationIdNumber'
  };

  ngOnInit(): void {
    this.initFormGroup();
    this.getAllowedCountries();
    this.editMode = this.data.editMode;
    this.recipientId.set(this.data.recipientId || '');
      // For add mode, get countries based on provided recipient type
    this.getEnabledPaymentCountries();

    if (this.editMode) {
      this.setBankData();
    } else {
      // For add mode, populate email and phone from injected data if available
      if (this.data?.payeeEmail && !this.beneficiaryForm.controls.payeeEmail.value) {
        this.beneficiaryForm.controls.payeeEmail.setValue(this.data.payeeEmail);
      }
      if (this.data?.payeePhone && !this.beneficiaryForm.controls.payeePhone.value) {
        this.beneficiaryForm.controls.payeePhone.setValue(this.data.payeePhone);
      }
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
    
    if(this.data?.mode === 'new-bank-account'){
      this.internationalBankAcForm.get('accountType')?.setValue(this.data.recipientType);
      this.updateBeneficiaryNameValidation();
      return;
    }

    // Set default account type based on recipient type    
    if (this.data.recipientType ) {
      this.updateBeneficiaryNameValidation();      
      // Fetch data list based on recipient type
      this.getInternationalPaymentDataList(this.data.recipientType);
    } else {
      // Default to business if no recipient type specified
      this.getInternationalPaymentDataList('business');
    }
  }

  getRealationShip() {
    this.isRelationshipLoading.set(true);
    this.subscriptions.push(
      this.walletService
        .getRelationship()
        .pipe(finalize(() => this.isRelationshipLoading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            const transformedData = res.data.map((item) => {
              const key = Object.keys(item)[0];
              return {
                value: key,
                name: item[key]
              };
            });
            this.relationshipList.set(transformedData);
          }
        })
    );
  }

  loadDataListAndPopulateForm(accountType: 'business' | 'personal', _jsonData: Record<string, unknown>) {
    // Load dropdown options first
    const countryCode = this.data?.countryCode || this.beneficiaryBankForm.controls.country.value;
    const payoutCurrencyCode = this.data?.currency || this.beneficiaryBankForm.controls.currency.value;
    this.isBusinessBanksLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getInternationalPaymentDataList(accountType, {
          countryCode,
          payoutCurrencyCode
        })
        .pipe(finalize(() => this.isBusinessBanksLoading.set(false)))
        .subscribe({
          next: (res) => {            
            if (res.success && res.data) {
              // Update dropdown options
              if (res.data.business_banks) {
                this.businessBanks = res.data.business_banks;
              }
              if (res.data.bicfi_banks) {
                this.bicfiBanks = res.data.bicfi_banks;
              }
              
              if (res.data.relationships && Array.isArray(res.data.relationships)) {
                const transformedRelationships = res.data.relationships.map(item => ({
                  value: item.value,
                  name: item.label
                }));
                this.relationshipList.set(transformedRelationships);
              }
              
              if (accountType === 'business' && res.data.beneficiary_document_types) {
                this.organisationIdTypes.set(res.data.beneficiary_document_types.map(item => ({
                  value: item.value,
                  label: item.label
                })));
              } else if (accountType === 'personal' && res.data.beneficiary_document_types) {
                this.beneficiaryIdDocumentTypes.set(res.data.beneficiary_document_types.map(item => ({
                  value: item.value,
                  label: item.label
                })));
              }
              
            }
          }
        })
    );
  }

  populateFormFields(accountType: 'business' | 'personal', jsonData: Record<string, unknown>) {
    if (accountType === 'business') {
      this.beneficiaryForm.patchValue({
        businessLegalName: jsonData.business_legal_name ?? null,
        organisationIdNumber: jsonData.organisation_id_number ?? null,
        organisationIdType: jsonData.id_type ?? null,
        dateOfIncorporation: jsonData.date_of_incorporation || null,
        countryOfIncorporation: jsonData.country_of_incorporation || null
      });

      this.beneficiaryBankForm.patchValue({
        routingOrSortCode: jsonData.routing_or_sort_code ?? null,
      });

    } else {
      
      // Personal account fields
      if (jsonData.beneficiary_given_name) {
        this.beneficiaryForm.controls.givenName.patchValue(
          jsonData.beneficiary_given_name
        );
      }
      if (jsonData.beneficiary_family_name) {
        this.beneficiaryForm.controls.familyName.patchValue(
          jsonData.beneficiary_family_name
        );
      }
      // For personal accounts, organisation_id_number maps to beneficiaryIdNumber
      this.beneficiaryForm.controls.beneficiaryIdNumber.patchValue(
        jsonData.organisation_id_number ?? null
      );
      this.beneficiaryForm.controls.beneficiaryIdDocumentType.patchValue(
        jsonData.id_type ?? null
      );
    }
    
    // Populate Philippines specific fields if present
    if (jsonData.payee_email) {
      this.beneficiaryForm.controls.payeeEmail.patchValue(jsonData.payee_email);
    } else if (this.data?.payeeEmail && !this.beneficiaryForm.controls.payeeEmail.value) {
      this.beneficiaryForm.controls.payeeEmail.patchValue(this.data.payeeEmail);
    }
    
    if (jsonData.payee_phone) {
      this.beneficiaryForm.controls.payeePhone.patchValue(jsonData.payee_phone);
    } else if (this.data?.payeePhone && !this.beneficiaryForm.controls.payeePhone.value) {
      this.beneficiaryForm.controls.payeePhone.patchValue(this.data.payeePhone);
    }
    
    if (jsonData.po_box) {
      this.beneficiaryForm.controls.poBox.patchValue(jsonData.po_box);
    }
    if (jsonData.date_of_birth) {
      this.beneficiaryForm.controls.dateOfBirth.patchValue(jsonData.date_of_birth);
    }
  }

  getInternationalPaymentDataList(type: 'business' | 'personal') {    
    // Use country info from modal data if available, otherwise use form values
    const countryCode = this.data?.countryCode || this.beneficiaryBankForm.controls.country.value;
    const payoutCurrencyCode = this.data?.currency || this.beneficiaryBankForm.controls.currency.value;
    if(!countryCode || !payoutCurrencyCode) return;
    this.isBusinessBanksLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getInternationalPaymentDataList(type, {
          countryCode,
          payoutCurrencyCode
        })
        .pipe(finalize(() => this.isBusinessBanksLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              // Update business banks for Philippines
              if (res.data.business_banks) {
                this.businessBanks = res.data.business_banks;
              }
              if (res.data.bicfi_banks) {
                this.bicfiBanks = res.data.bicfi_banks;
              }
              
              // Update relationships list if provided
              if (res.data.relationships && Array.isArray(res.data.relationships)) {
                const transformedRelationships = res.data.relationships.map(item => ({
                  value: item.value,
                  name: item.label
                }));
                this.relationshipList.set(transformedRelationships);
              } else {
                this.relationshipList.set([]);
              } 
              
              // Update organization ID types for business
              if (type === 'business' && res.data.beneficiary_document_types && Array.isArray(res.data.beneficiary_document_types)) {
                this.organisationIdTypes.set(res.data.beneficiary_document_types.map(item => ({
                  value: item.value,
                  label: item.label
                })));
              } else if (type === 'business') {
                this.organisationIdTypes.set([]);
              }
              
              // Update beneficiary ID document types for personal
              if (type === 'personal' && res.data.beneficiary_document_types && Array.isArray(res.data.beneficiary_document_types)) {
                this.beneficiaryIdDocumentTypes.set(res.data.beneficiary_document_types.map(item => ({
                  value: item.value,
                  label: item.label
                })));
              } else if (type === 'personal') {
                this.beneficiaryIdDocumentTypes.set([]);
              }
            }
          },
          error: () => {
            // Ensure signals remain as arrays even on error
            if (type === 'business') {
              this.organisationIdTypes.set([]);
            }
            if (type === 'personal') {
              this.beneficiaryIdDocumentTypes.set([]);
            }
            this.relationshipList.set([]);
          }
        })
    );
  }

  initFormGroup(): void {
    this.beneficiaryForm = new FormGroup({
      addressLine1: new FormControl('', [Validators.required, ValidationService.containsHtmlTag]),
      addressLine2: new FormControl('', [ValidationService.addressValidator]),
      city: new FormControl('', [Validators.required, ValidationService.addressValidator]),
      state: new FormControl('', [Validators.required]),
      zip: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        ValidationService.zipValidatorInternational
      ]),
      country: new FormControl('', [Validators.required]),
      // Business Fields
      businessLegalName: new FormControl(null),
      organisationIdNumber: new FormControl(null),
      organisationIdType: new FormControl(null),
      dateOfIncorporation: new FormControl(''),
      countryOfIncorporation: new FormControl(null),
      // Personal Fields
      givenName: new FormControl(''),
      familyName: new FormControl(''),
      beneficiaryIdDocumentType: new FormControl(null),
      beneficiaryIdNumber: new FormControl(null),
      // Philippines specific fields
      payeeEmail: new FormControl(''),
      payeePhone: new FormControl(''),
      poBox: new FormControl(''),
      dateOfBirth: new FormControl('', [ValidationService.dateOfBirthValidator])
    });

    this.beneficiaryBankForm = new FormGroup({
      addressLine1: new FormControl(null, [Validators.required, ValidationService.containsHtmlTag]),
      addressLine2: new FormControl(null, [ValidationService.addressValidator]),
      city: new FormControl(null, [Validators.required, ValidationService.addressValidator]),
      state: new FormControl(null, [Validators.required]),
      zip: new FormControl(null, [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        this.zipValidator.bind(this)
      ]),
      country: new FormControl(null, [Validators.required]),
      // New fields
      branchCode: new FormControl(null),
      identifierCode: new FormControl(null),
      currency: new FormControl(null, [Validators.required]),
      routingOrSortCode: new FormControl(null),
    });

    this.internationalBankAcForm = new FormGroup({
      id: new FormControl(null),
      accountNumber: new FormControl(null, [
        Validators.required,
        Validators.minLength(5)
      ]),
      accountType: new FormControl(null, [Validators.required]),
      bankName: new FormControl(null, [Validators.required]),
      ifsc: new FormControl(null),
      // New field
      type: new FormControl('ripple', [Validators.required]),
      relationship: new FormControl(null, [Validators.required]),
      beneficiary: this.beneficiaryForm,
      beneficiaryBankDetails: this.beneficiaryBankForm
    });
    this.changeIfsc();
    this.changeCountry();
    this.changeIban();
    this.changeAccountType();
    this.changeBeneficiaryAddress();
  }

  changeBeneficiaryAddress() {
    this.subscriptions.push(
      this.selectedAddressId.valueChanges.subscribe((id) => {
        if (id == null) {
          this.selectedDetails.set(undefined);
          return;
        }
        const beneficiaryData = this.existingList()?.find((item) => item.id === id);
        if (!beneficiaryData) {
          return;
        }
        this.selectedDetails.set(beneficiaryData);
        this.selectedAddress.set(beneficiaryData.address);
        this.setFormData();
      })
    );
  }

  changeIfsc() {
    this.isAddressFromIFSCCheck.set(false);
    this.subscriptions.push(
      this.beneficiaryBankForm.controls.branchCode?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((res) => {
          // IFSC -> auto-address only applies to India; leave address fields alone otherwise.
          if (this.beneficiaryBankForm.controls.country.value !== 'IN') {
            return;
          }
          if (res) {
            this.checkIfsc(res);
          } else {
            this.isAddressFromIFSCCheck.set(false);
            this.beneficiaryBankForm.patchValue({
              addressLine1: null,
              city: null,
              state: null,
              zip: null
            });
          }
        })
    );
  }

  changeIban() {
    this.subscriptions.push(
      this.internationalBankAcForm.controls.accountNumber?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((res) => {
          const beneficiaryCountry =
            this.beneficiaryBankForm.controls.country?.value;
          if (
            res &&
            beneficiaryCountry &&
            beneficiaryCountry !== 'IN' &&
            beneficiaryCountry !== 'PH' &&
            beneficiaryCountry !== 'GB'
          ) {
            this.checkIban(res);
          }
        })
    );
  }

  changeCountry() {
    this.subscriptions.push(
      this.beneficiaryBankForm.controls.country?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((res) => {
          // Skip validation if value is empty or if we're still loading countries
          if (!res || this.isEnabledCountriesLoading()) {
            return;
          }
          // Country changed: reset autocomplete so the bank-address field re-initializes with the new restriction.
          this.googleAddressService.resetGoogleAutocompleteAPI();
          const enabledCountries = this.internationalPaymentsEnabledCountries();
          // If countries haven't loaded yet, don't clear the value
          if (!enabledCountries || Object.keys(enabledCountries).length === 0) {
            return;
          }
          const foundCountry = Object.values(enabledCountries).find(
            (countryData) => countryData.countryCode === res
          );
          
          // Find country by countryCode and check IBAN requirement
          if (enabledCountries) {
            if(foundCountry?.is_enabled === 0){
              this.beneficiaryBankForm.controls.country.setValue(null);
              this.beneficiaryBankForm.controls.currency.setValue(null);
              this.alertService.infoAlert({
                content:'International payments to the selected country are not enabled. Contact support to have this option activated for your account',
                isOk: true,
                isCancel: true,
                doneMsg: 'Contact Now',
                cancelMsg: 'Not Now'
              }).afterClosed().subscribe((response) => {
                if(response){
                  this.dynamicWhiteLabelService.goToLiveChat();
                }
              });
              return;
            }
            if (foundCountry) {
              this.isIbanCountry.set(foundCountry.iban === 1);
            } else {
              this.isIbanCountry.set(false);
            }
          }
          if(res !== 'IN'){
            this.internationalBankAcForm.controls.ifsc.setValue(null);
            this.internationalBankAcForm.controls.ifsc.clearValidators();
            this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
          }
          if (res !== 'IN' && res !== 'PH' && res !== 'GB') {
            const iban =
              this.internationalBankAcForm.controls.accountNumber.value;
            this.checkIban(iban);
          } else {
            this.isInvalidIban.set(false);
          }
          if(res === 'GB'){
            this.isUkCountry.set(true);
          } else {
            this.isUkCountry.set(false);
          }
        })
    );
  }

  changeAccountType() {
    this.subscriptions.push(
      this.internationalBankAcForm.controls.accountType?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((accountType) => {
          this.updateBeneficiaryNameValidation();
          // Fetch data list when account type changes
          if (accountType) {
            this.getInternationalPaymentDataList(accountType);
            this.getRecipientAddressDetails();
          }
        })
    );
  }

  checkIfsc(ifsc: string) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.paymentsService.checkIfsc(ifsc, headerOptions).subscribe({
        next: (res) => {
          if (res.success) {
            this.isInvalidIfsc.set(false);
            this.internationalBankAcForm.controls.ifsc.setValue(ifsc);   
            this.getInternationalBankAddress(ifsc);
          }
        },
        error: () => {
          this.isInvalidIfsc.set(true);
          this.internationalBankAcForm.controls.ifsc.setValue(null);
        }
      })
    );
  }

  checkIban(iban: string) {
    if (!iban) return;
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.ibanCheckingLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .checkIban(iban, this.beneficiaryBankForm.controls.country.value, headerOptions)
        .pipe(finalize(() => this.ibanCheckingLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.isInvalidIban.set(false);
            }
          },
          error: () => {
            this.isInvalidIban.set(true);
          }
        })
    );
  }

  setBankData(): void {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.payeeService
        .getInternationalBank(this.data.id, this.data.bankAcId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            const jsonData = res.data.json_data ?? {};
            const accountType: 'business' | 'personal' = res.data.accountType === 'personal' ? 'personal' : 'business';
            this.populateFormFields(accountType, jsonData);
            
            // Set account type first
            this.internationalBankAcForm.controls.accountType.patchValue(accountType);
            
            // Store the country and currency to set after countries are loaded
            const countryToSet = res.data.beneficiaryBankDetails?.country;
            const currencyToSet = res.data.currency;
            
            // Check if we have cached country data
            const cachedData = this.getCachedCountriesData(accountType);
            
            if (cachedData) {
              // Countries are already cached, process them immediately
              this.processCountriesData(cachedData);
              
              // Now set the form values
              this.setFormDataAfterCountriesLoaded(jsonData, countryToSet, currencyToSet, accountType);
            } else {
              // Need to fetch countries first
              this.isEnabledCountriesLoading.set(true);
              
              const countriesApi$ = accountType === 'personal' 
                ? this.paymentsService.enabledInternationalPaymentCountriesPersonal()
                : this.paymentsService.enabledInternationalPaymentCountries();
              
              this.subscriptions.push(
                countriesApi$
                  .pipe(finalize(() => this.isEnabledCountriesLoading.set(false)))
                  .subscribe({
                    next: (response) => {
                      if (response.success && response.data && Object.keys(response.data).length) {
                        // Store in cache and process
                        this.storeCachedCountriesData(response.data, accountType);
                        this.processCountriesData(response.data);

                        // Now set the form values
                        this.setFormDataAfterCountriesLoaded(jsonData, countryToSet, currencyToSet, accountType);
                      } else {
                        // No countries enabled for this account type — surface it instead of an empty dropdown.
                        this.handleNoEnabledCountries(accountType);
                      }
                    }
                  })
              );
            }
            
            // Set main form data
            this.internationalBankAcForm.patchValue({
              accountNumber: res.data.accountNumber,
              accountType: res.data.accountType,
              bankName: res.data.bankName,
              ifsc: res.data.beneficiaryBankDetails.country === 'IN' ? res.data.ifsc : null,
              type: res.data.type || 'ripple',
              id: res.data.id
            });
            
            // Set beneficiary address fields
            if (res.data.beneficiary) {
              // Priority: json_data > injected data > beneficiary data
              const payeeEmail = jsonData.payee_email || this.data?.payeeEmail || res.data.beneficiary.payeeEmail || null;
              const payeePhone = jsonData.payee_phone || this.data?.payeePhone || res.data.beneficiary.payeePhone || null;
              
              this.beneficiaryForm.patchValue({
                addressLine1: res.data.beneficiary.addressLine1,
                addressLine2: res.data.beneficiary.addressLine2,
                city: res.data.beneficiary.city,
                state: res.data.beneficiary.state,
                zip: res.data.beneficiary.zip,
                country: res.data.beneficiary.country,
                payeeEmail,
                payeePhone,
                poBox: jsonData.po_box || res.data.beneficiary.poBox || null,
                dateOfBirth: jsonData.date_of_birth || res.data.beneficiary.dateOfBirth || null,
              });
              this.onBeneficiaryCountryChange();
            }

            // Set beneficiary bank address fields
            if (res.data.beneficiaryBankDetails) {
              this.beneficiaryBankForm.patchValue({
                addressLine1: res.data.beneficiaryBankDetails?.addressLine1 ?? null,
                addressLine2: res.data.beneficiaryBankDetails?.addressLine2 ?? null,
                city: res.data.beneficiaryBankDetails?.city ?? null,
                state: res.data.beneficiaryBankDetails?.state ?? null,
                zip: res.data.beneficiaryBankDetails?.zip ?? null,
              });
            }
            if (res.data?.bankIdentifierCode) {
              this.beneficiaryBankForm.controls.identifierCode.patchValue(
                res.data.bankIdentifierCode
              );
            }
            if (res.data.beneficiaryBankDetails.country && this.internationalPaymentsEnabledCountries()) {
              // eslint-disable-next-line no-restricted-syntax
              for (const [, countryData] of Object.entries(
                this.internationalPaymentsEnabledCountries()
              )) {
                if (
                  countryData.countryCode ===
                  res.data.beneficiaryBankDetails.country
                ) {
                  // Update currency if it matches the country (in case it wasn't set earlier)
                  if (!this.beneficiaryBankForm.controls.currency.value) {
                    this.beneficiaryBankForm.controls.currency.patchValue(
                      countryData.currency
                    );
                  }
                  break;
                }
              }
            }

            // Check if IFSC field should be shown
            if (
              res.data.beneficiaryBankDetails.country === 'IN'
            ) {
              this.isShowIfsc = true;
              this.beneficiaryBankForm.controls.branchCode.setValidators([
                Validators.required
              ]);
              this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
            } else {
              this.isShowIfsc = false;
              this.beneficiaryBankForm.controls.branchCode.setValidators([]);
              this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
            }
          }
        })
    );
  }

  updateInternationalPaymentBankAccount() {
    // Create a copy of the form value without the removed fields
    const formValue = {...this.internationalBankAcForm.value};
    const accountType = this.internationalBankAcForm.get('accountType')?.value;

    const modifiedBeneficiary=this.cleanBeneficiaryData(formValue.beneficiary,accountType);

    const identifierCode = formValue.beneficiaryBankDetails?.identifierCode || null;
    delete formValue.beneficiaryBankDetails?.identifierCode;

    const sendingData = {
      ...formValue,
      beneficiary: modifiedBeneficiary,
      payeeId: this.data.id,
      payeeEmail: formValue.beneficiary?.payeEmail || null,
      payeePhone: formValue.beneficiary?.payeePhone || null,
      identifierType: null,
      identifierCode
    };

    this.subscriptions.push(
      this.payeeService
        .updatePayeeInternationalBankAccount(
          this.internationalBankAcForm.value.id,
          sendingData
        )
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.dialogRef.close({
                success: response.success,
                data: sendingData
              });
            }
          },
          error: (error: HttpErrorResponse) => {
            const controlName = error.error?.errorField;
            if (controlName) {
              this.focusWhenDialogsClosed(controlName);
            }
            if (error.error.errorCode === '266') {
              const phoneControl = this.beneficiaryForm.controls['payeePhone'];
              this.phoneErrorMessages = { serverError: error.error.errorMsg };
              phoneControl.setErrors({ serverError: true });
              phoneControl.markAsTouched();
              const sub = phoneControl.valueChanges.pipe(take(1)).subscribe(() => {
                this.phoneErrorMessages = {};
                phoneControl.setErrors(null);
              });
              this.subscriptions.push(sub);
            }
          }
        })
    );
  }

  createInternationalPaymentBankAccount() {
    // Create a copy of the form value without the removed fields
    const formValue ={ ...this.internationalBankAcForm.value};
    const accountType = this.internationalBankAcForm.get('accountType')?.value;

    const modifiedBeneficiary=this.cleanBeneficiaryData(formValue.beneficiary,accountType);

    const identifierCode = formValue.beneficiaryBankDetails?.identifierCode || null;
    delete formValue.beneficiaryBankDetails?.identifierCode;

    const sendingData = {
      ...formValue,
      beneficiary: modifiedBeneficiary,
      payeeId: this.data.id,
      payeeEmail: formValue.beneficiary?.payeeEmail || null,
      payeePhone: formValue.beneficiary?.payeePhone || null,
      // Add default values for removed fields to maintain API compatibility
      identifierType: null,
      identifierCode
    };

    this.subscriptions.push(
      this.payeeService
        .addPayeeInternationalBankAccount(sendingData)
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe({
          next:(response: IApiRes<{ id: string }>) => {
            if (response.success) {
              this.dialogRef.close({
                success: response.success,
                data: { ...sendingData, id: response.data?.id }
              });
            }
          },
          error:(error: HttpErrorResponse) => {
            const controlName = error.error?.errorField;
            if(controlName){
              this.focusWhenDialogsClosed(controlName);
            }
            if(error.error.errorCode === '266'){
              const phoneControl = this.beneficiaryForm.controls['payeePhone'];
              this.phoneErrorMessages = { serverError: error.error.errorMsg };
              phoneControl.setErrors({ serverError: true });
              phoneControl.markAsTouched();
              const sub = phoneControl.valueChanges.pipe(take(1)).subscribe(() => {
                this.phoneErrorMessages = {};
                phoneControl.setErrors(null);
              });
              this.subscriptions.push(sub);
            }
          }
        })
    );
  }

  private focusWhenDialogsClosed(controlName: string) {
    const runFocus = () => {
      const inputId = this.fieldToInputIdMap[controlName];
      if (!inputId) return;
      setTimeout(() => {
        const el = document.getElementById(inputId) as HTMLElement | null;
        if (el) {
          this.applyTemporaryErrorHighlight(el);
        }
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    };
    const warningDialogRef = this.dialog.openDialogs.find(
      (dialogRef) => dialogRef.componentInstance instanceof WarningAlertComponent
    );

    if (!warningDialogRef) {
      runFocus();
      return;
    }

    warningDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => runFocus());
  }

  private applyTemporaryErrorHighlight(element: HTMLElement) {
    const targetElement = element;
    const previousBorderColor = targetElement.style.borderColor;
    const previousBoxShadow = targetElement.style.boxShadow;

    targetElement.style.borderColor = 'var(--common-red-color)';
    targetElement.style.boxShadow = '0 0 0 1px var(--common-red-color)';

    const clearHighlight = () => {
      targetElement.style.borderColor = previousBorderColor;
      targetElement.style.boxShadow = previousBoxShadow;
    };

    targetElement.addEventListener('input', clearHighlight, { once: true });
    targetElement.addEventListener('blur', clearHighlight, { once: true });
  }

  onSubmit() {
    // First, check if country is selected
    const selectedCountry = this.beneficiaryBankForm.get('country')?.value;
    if (!selectedCountry) {
      this.beneficiaryBankForm.get('country')?.markAsTouched();
      this.bankDetailsCollapsed.set(false);
      return;
    }

    // Mark all forms as touched to trigger validation messages
    this.internationalBankAcForm.markAllAsTouched();
    this.beneficiaryForm.markAllAsTouched();
    this.beneficiaryBankForm.markAllAsTouched();

    // Check if any core form is invalid
    const hasBasicFormErrors = this.internationalBankAcForm.invalid ||
                              this.beneficiaryForm.invalid ||
                              this.beneficiaryBankForm.invalid;

    if (hasBasicFormErrors) {
      // Expand all sections to show validation errors
      this.bankDetailsCollapsed.set(false);
      this.beneficiaryDetailsCollapsed.set(false);
      this.businessDetailsCollapsed.set(false);
      this.addressDetailsCollapsed.set(false);
      return;
    }

    this.internationalBankAcForm.markAllAsTouched();
    
    const accountType = this.internationalBankAcForm.get('accountType')?.value;
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;
    
    // Check validation based on account type
    let hasValidationErrors = false;
    
    if (accountType === 'business') {
      hasValidationErrors = 
        this.internationalBankAcForm.invalid ||
        this.isInvalidIfsc() ||
        this.beneficiaryForm.controls.businessLegalName.invalid ||
        this.beneficiaryForm.controls.organisationIdType.invalid ||
        this.beneficiaryForm.controls.organisationIdNumber.invalid ||
        this.beneficiaryForm.controls.dateOfIncorporation.invalid ||
        this.beneficiaryForm.controls.countryOfIncorporation.invalid ||
        this.ibanCheckingLoading();
      
      // Additional validation for Philippines Business
      if (bankCountry === 'PH') {
        hasValidationErrors = hasValidationErrors ||
          this.beneficiaryForm.controls.payeeEmail.invalid ||
          this.beneficiaryForm.controls.payeePhone.invalid ||
          this.beneficiaryForm.controls.poBox.invalid;
      }
    } else if (accountType === 'personal') {
      // Base validation for all personal accounts
      hasValidationErrors = 
        this.internationalBankAcForm.invalid ||
        this.isInvalidIfsc() ||
        this.beneficiaryForm.controls.beneficiaryIdDocumentType.invalid ||
        this.beneficiaryForm.controls.beneficiaryIdNumber.invalid ||
        this.ibanCheckingLoading();
      
      // Additional validation for India
      if (bankCountry === 'IN') {
        hasValidationErrors = hasValidationErrors ||
          this.beneficiaryForm.controls.givenName.invalid ||
          this.beneficiaryForm.controls.familyName.invalid;
      }
      
      // Additional validation for Philippines Personal
      if (bankCountry === 'PH') {
        hasValidationErrors = hasValidationErrors ||
          this.beneficiaryForm.controls.payeeEmail.invalid ||
          this.beneficiaryForm.controls.payeePhone.invalid ||
          this.beneficiaryForm.controls.poBox.invalid ||
          this.beneficiaryForm.controls.dateOfBirth.invalid;
      }
    } else {
      hasValidationErrors = this.internationalBankAcForm.invalid || this.ibanCheckingLoading();
    }
    
    if (hasValidationErrors) {
      return;
    }

    this.isSubmit.set(true);

    if (this.editMode) {
      this.updateInternationalPaymentBankAccount();
    } else {
      this.createInternationalPaymentBankAccount();
    }
  }

  loadGoogleAddress(address: HTMLInputElement) {
    // Reset first so the singleton service re-binds Google Autocomplete to this focused input.
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: undefined,
      displayShortName: true
    });

    this.googleAddressSubscription?.unsubscribe();
    this.googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.beneficiaryForm.controls.addressLine1.patchValue(res.address);
        this.beneficiaryForm.controls.city.patchValue(res.city);
        this.beneficiaryForm.controls.state.patchValue(res.state);
        this.beneficiaryForm.controls.zip.patchValue(res.zip);
        this.beneficiaryForm.controls.country.patchValue(res.country);

        this.onBeneficiaryCountryChange();
        this.googleAddressSubscription?.unsubscribe();
        this.googleAddressSubscription = null;
        this.googleAddressService.resetGoogleAutocompleteAPI();
      });
  }

  loadBeneficiaryBankAddress(address: HTMLInputElement) {
    // Reset first so the singleton service re-binds Google Autocomplete to this focused input.
    this.googleAddressService.resetGoogleAutocompleteAPI();
    // Restrict suggestions to the selected bank country (Google ignores the restriction beyond 5 countries).
    const selectedCountry = this.beneficiaryBankForm.controls.country.value as
      | string
      | null;
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: selectedCountry
        ? [selectedCountry.toLowerCase()]
        : this.enabledCountryCode,
      displayShortName: true
    });

    this.googleAddressSubscription?.unsubscribe();
    this.googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.beneficiaryBankForm.controls.addressLine1.patchValue(res.address);
        this.beneficiaryBankForm.controls.city.patchValue(res.city);
        this.beneficiaryBankForm.controls.state.patchValue(res.state);
        this.beneficiaryBankForm.controls.zip.patchValue(res.zip);
        this.beneficiaryBankForm.controls.country.patchValue(res.country);

        if (this.beneficiaryBankForm.controls.country.value === 'IN') {
          this.isShowIfsc = true;
          this.beneficiaryBankForm.controls.branchCode.setValidators([
            Validators.required
          ]);
          this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
        } else {
          this.isShowIfsc = false;
          this.beneficiaryBankForm.controls.branchCode.setValidators([]);
          this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
        }

        this.googleAddressSubscription?.unsubscribe();
        this.googleAddressSubscription = null;
        this.googleAddressService.resetGoogleAutocompleteAPI();
      });
  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudAccService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      })
    );
  }

  getEnabledPaymentCountries() {
    // Determine account type
    const accountType = this.data.recipientType || this.internationalBankAcForm.get('accountType')?.value || 'business';
    
    // Check localStorage first (ignore an empty cache so we re-fetch instead of showing an empty dropdown).
    const cachedData = this.getCachedCountriesData(accountType);

    if (cachedData && Object.keys(cachedData).length) {
      // Use cached data directly
      this.processCountriesData(cachedData);
      return;
    }

    // If no cache, fetch from API
    this.isEnabledCountriesLoading.set(true);

    // Choose API based on account type
    const countriesApi$ = accountType === 'personal'
      ? this.paymentsService.enabledInternationalPaymentCountriesPersonal()
      : this.paymentsService.enabledInternationalPaymentCountries();

    this.subscriptions.push(
      countriesApi$
        .pipe(finalize(() => this.isEnabledCountriesLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success && res.data && Object.keys(res.data).length) {
              // Store in cache
              this.storeCachedCountriesData(res.data, accountType);
              // Process the data
              this.processCountriesData(res.data);
            } else {
              // API responded but no countries enabled for this account type — surface it instead of an empty dropdown.
              this.handleNoEnabledCountries(accountType);
            }
          }
        })
    );
  }

  /** Alerts the user when the enabled-countries API returns no usable data (HTTP 200 with `success: false` or empty list, which the error interceptor ignores), instead of leaving the country dropdown silently empty. */
  private handleNoEnabledCountries(accountType: string): void {
    const typeLabel = accountType === 'personal' ? 'Personal' : 'Business';
    this.alertService
      .infoAlert({
        content: `${typeLabel} international payments are not enabled for this account. Please contact support to have this option activated.`,
        isOk: true,
        isCancel: true,
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now'
      })
      .afterClosed()
      .subscribe((response) => {
        if (response) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
  }
  
  private processCountriesData(data: ICountriesCache) {
    this.internationalPaymentsEnabledCountries.set(data);
    this.enabledCountryCode = Object.values(data).map(
      (country) => country.countryCode.toLowerCase()
    );
    this.onBankCountryChange();
  }
  
  private getCachedCountriesData(accountType: string): ICountriesCache | null {
    try {
      const cacheKey = accountType === 'personal' 
        ? this.COUNTRIES_PERSONAL_CACHE_KEY 
        : this.COUNTRIES_BUSINESS_CACHE_KEY;
      
      const cached = this.localStorageService.getItem(cacheKey as LocalStorageKeys);
      
      if (!cached) return null;
      
      return JSON.parse(cached) as ICountriesCache;
    } catch (error) {
      return null;
    }
  }
  
  private storeCachedCountriesData(data: ICountriesCache, accountType: string): void {
    const cacheKey = accountType === 'personal' 
      ? this.COUNTRIES_PERSONAL_CACHE_KEY 
      : this.COUNTRIES_BUSINESS_CACHE_KEY;
    
    this.localStorageService.setItem(
      cacheKey as LocalStorageKeys,
      JSON.stringify(data)
    );
  }

  /** Re-evaluates the IFSC requirement when the beneficiary country changes. */
  onBeneficiaryCountryChange(): void {
    this.checkIfscRequired();
  }

  checkIfscRequired(): void {
    const beneficiaryBankCountry =
      this.beneficiaryBankForm.controls.country.value;

    // Check if either beneficiary or beneficiary bank country is India
    if ( beneficiaryBankCountry === 'IN') {
      this.isShowIfsc = true;
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
    } else {
      this.isShowIfsc = false;
      this.beneficiaryBankForm.controls.branchCode.clearValidators();
    }

    // Update validators
    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
  }

  private updateBeneficiaryNameValidation(): void {
    const accountType = this.internationalBankAcForm.get('accountType')?.value;
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;

    // Business fields
    const businessLegalNameControl = this.beneficiaryForm.get('businessLegalName');
    const organisationIdNumberControl = this.beneficiaryForm.get('organisationIdNumber');
    const organisationIdTypeControl = this.beneficiaryForm.get('organisationIdType');
    const dateOfIncorporationControl = this.beneficiaryForm.get('dateOfIncorporation');
    const countryOfIncorporationControl = this.beneficiaryForm.get('countryOfIncorporation');
    
    // Personal fields
    const givenNameControl = this.beneficiaryForm.get('givenName');
    const familyNameControl = this.beneficiaryForm.get('familyName');
    const idDocumentTypeControl = this.beneficiaryForm.get('beneficiaryIdDocumentType');
    const idNumberControl = this.beneficiaryForm.get('beneficiaryIdNumber');
    
    // Philippines specific fields
    const payeeEmailControl = this.beneficiaryForm.get('payeeEmail');
    const payeePhoneControl = this.beneficiaryForm.get('payeePhone');
    const poBoxControl = this.beneficiaryForm.get('poBox');
    const dateOfBirthControl = this.beneficiaryForm.get('dateOfBirth');
    const isPhilippines = bankCountry === 'PH';

    if (accountType === 'business') {
      // Set validators for business fields
      businessLegalNameControl?.setValidators([Validators.required]);
      organisationIdNumberControl?.setValidators([Validators.required]);
      organisationIdTypeControl?.setValidators([Validators.required]);
      dateOfIncorporationControl?.setValidators([Validators.required]);
      countryOfIncorporationControl?.setValidators([Validators.required]);
      
      // Clear validators for personal fields
      givenNameControl?.clearValidators();
      familyNameControl?.clearValidators();
      idDocumentTypeControl?.clearValidators();
      idNumberControl?.clearValidators();
      dateOfBirthControl?.clearValidators();
      
      // Philippines Business: email, phone, PO Box required
      if (isPhilippines) {
        payeeEmailControl?.setValidators([Validators.required, ValidationService.emailValidator]);
        payeePhoneControl?.setValidators([Validators.required]);
        poBoxControl?.setValidators([Validators.required]);
      } else {
        payeeEmailControl?.clearValidators();
        payeePhoneControl?.clearValidators();
        poBoxControl?.clearValidators();
      }
    } else if (accountType === 'personal') {
      // For personal accounts, check if India specific fields are required
      if (bankCountry === 'IN') {
        // India specific validation for Given Name and Family Name
        givenNameControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]);
        familyNameControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]);
      } else {
        // For non-India countries, these fields are optional
        givenNameControl?.clearValidators();
        familyNameControl?.clearValidators();
      }
      
      // ID Document fields are always required for personal accounts
      idDocumentTypeControl?.setValidators([Validators.required]);
      idNumberControl?.setValidators([Validators.required]);
      
      // Clear validators for business fields
      businessLegalNameControl?.clearValidators();
      organisationIdNumberControl?.clearValidators();
      organisationIdTypeControl?.clearValidators();
      dateOfIncorporationControl?.clearValidators();
      countryOfIncorporationControl?.clearValidators();
      
      if (isPhilippines) {
        payeeEmailControl?.setValidators([Validators.required, ValidationService.emailValidator]);
        payeePhoneControl?.setValidators([Validators.required]);
        poBoxControl?.setValidators([Validators.required]);
        dateOfBirthControl?.setValidators([
          Validators.required,
          ValidationService.dateOfBirthValidator
        ]);
      } else {
        payeeEmailControl?.clearValidators();
        payeePhoneControl?.clearValidators();
        poBoxControl?.clearValidators();
        dateOfBirthControl?.clearValidators();
      }
    } else {
      // Clear all validators if account type is not set
      businessLegalNameControl?.clearValidators();
      organisationIdNumberControl?.clearValidators();
      organisationIdTypeControl?.clearValidators();
      dateOfIncorporationControl?.clearValidators();
      countryOfIncorporationControl?.clearValidators();
      givenNameControl?.clearValidators();
      familyNameControl?.clearValidators();
      idDocumentTypeControl?.clearValidators();
      idNumberControl?.clearValidators();
      payeeEmailControl?.clearValidators();
      payeePhoneControl?.clearValidators();
      poBoxControl?.clearValidators();
      dateOfBirthControl?.clearValidators();
    }

    // Update validity for all controls
    businessLegalNameControl?.updateValueAndValidity({ emitEvent: false });
    organisationIdNumberControl?.updateValueAndValidity({ emitEvent: false });
    organisationIdTypeControl?.updateValueAndValidity({ emitEvent: false });
    dateOfIncorporationControl?.updateValueAndValidity({ emitEvent: false });
    countryOfIncorporationControl?.updateValueAndValidity({ emitEvent: false });
    givenNameControl?.updateValueAndValidity({ emitEvent: false });
    familyNameControl?.updateValueAndValidity({ emitEvent: false });
    idDocumentTypeControl?.updateValueAndValidity({ emitEvent: false });
    idNumberControl?.updateValueAndValidity({ emitEvent: false });
    payeeEmailControl?.updateValueAndValidity({ emitEvent: false });
    payeePhoneControl?.updateValueAndValidity({ emitEvent: false });
    poBoxControl?.updateValueAndValidity({ emitEvent: false });
    dateOfBirthControl?.updateValueAndValidity({ emitEvent: false });
  }

  private resetCountrySpecificFields(): void {
    // Bank address auto-filled by IFSC lookup or Google autocomplete
    this.beneficiaryBankForm.patchValue({
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      zip: null,
      branchCode: null,        // IFSC (IN) or bank-list selection (PH)
      routingOrSortCode: null, // UK-specific
      identifierCode: null,    // PH-specific
    }, { emitEvent: false });

    // IFSC and relationship on main form — IFSC is IN-only; relationship list reloads per country+type
    this.internationalBankAcForm.patchValue({
      ifsc: null,
      relationship: null,
      bankName:null
    }, { emitEvent: false });

    // Stale validation states from the previous country
    this.isInvalidIban.set(false);
    this.isInvalidIfsc.set(false);
    this.isAddressFromIFSCCheck.set(false);

    // Country-specific bank/relationship lists (reloaded for the new country)
    this.businessBanks = [];
    this.bicfiBanks = [];
    this.relationshipList.set([]);

    // Philippines-specific beneficiary fields; restore injected payee defaults where available
    this.beneficiaryForm.patchValue({
      payeeEmail: this.data?.payeeEmail || null,
      payeePhone: this.data?.payeePhone || null,
      poBox: null,
      dateOfBirth: null,
    }, { emitEvent: false });
  }

  onBankCountryChange(): void {
    const selectedCountry = this.beneficiaryBankForm.controls.country.value;
    // Don't process if we don't have a country or if countries are still loading
    if (!selectedCountry || this.isEnabledCountriesLoading()) {
      return;
    }

    // Reset country-specific fields on every user-triggered country change.
    if (this.isCountryChanged()) {
      this.resetCountrySpecificFields();
    }    
    // Check if IFSC field should be shown
    if (selectedCountry === 'IN') {
      this.isShowIfsc = true;
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
    } else {
      this.isShowIfsc = false;
      this.beneficiaryBankForm.controls.branchCode.clearValidators();
      this.isInvalidIfsc.set(false);
    }
    if(selectedCountry === 'GB'){
      this.beneficiaryBankForm.controls.routingOrSortCode.setValidators([
        Validators.required
      ]);
      this.isUkCountry.set(true);
    } else {
      this.beneficiaryBankForm.controls.routingOrSortCode.clearValidators();
      this.isUkCountry.set(false);
    }
    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
    this.beneficiaryBankForm.controls.routingOrSortCode.updateValueAndValidity();

    // When country changes to IN, validate any existing branchCode value as IFSC
    if (selectedCountry === 'IN') {
      const existingBranchCode = this.beneficiaryBankForm.controls.branchCode.value;
      if (existingBranchCode) {
        this.checkIfsc(existingBranchCode);
      }
    }

    // For Philippines, branchCode (bank list) is required
    if (selectedCountry === 'PH') {
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
      this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
      this.beneficiaryBankForm.controls.identifierCode.setValidators([
        Validators.required
      ]);
    } else {
      this.beneficiaryBankForm.controls.identifierCode.clearValidators();
    }
    this.beneficiaryBankForm.controls.identifierCode.updateValueAndValidity();

    // Reset business banks when country changes
    this.businessBanks = [];

    // Update currency based on selected country
    if (selectedCountry && this.internationalPaymentsEnabledCountries()) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [, countryData] of Object.entries(
        this.internationalPaymentsEnabledCountries()
      )) {
        if (countryData.countryCode === selectedCountry) {
          this.beneficiaryBankForm.controls.currency.setValue(
            countryData.currency
          );
          const accountType = this.internationalBankAcForm.get('accountType')?.value || this.data?.recipientType || 'business';
          this.getInternationalPaymentDataList(accountType);
        }
      }
    }

    // Find country by countryCode and check IBAN requirement
    const enabledCountries = this.internationalPaymentsEnabledCountries();
    if (enabledCountries) {
      const foundCountry = Object.values(enabledCountries).find(
        (countryData) => countryData.countryCode === selectedCountry
      );
      if (foundCountry) {
        this.isIbanCountry.set(foundCountry.iban === 1);
      } else {
        this.isIbanCountry.set(false);
      }
    }
    setTimeout(() => {
      this.isCountryChanged.set(true);
    }, 0);

    this.updateBeneficiaryNameValidation();
    this.getRecipientAddressDetails();
  }

  /**
   * Handles the date of incorporation change event
   * @param event The date event from the date picker
   */
  onDateOfIncorporationChange(event: string) {
    if (event) {
      const dateValue = event.split(': ')[1];
      this.beneficiaryForm.controls.dateOfIncorporation.setValue(dateValue);
    }
  }

  // Custom zip validator function
  zipValidator(control: FormControl) {
    if (!control.value) {
      return null;
    }
    const country = this.beneficiaryBankForm?.get('country')?.value;
    const minLength = country === 'PH' ? 4 : 5;
    const zip = String(control.value);
    if (control.value == null || control.value === '') {
      return true;
    }
    if (control.value.length < minLength || control.value.length > 10) {
      return { invalidZip: false };
    }

    if (zip.match(/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/)) {
      return { invalidZip: false };
    }
    return true;
  }

  private setFormDataAfterCountriesLoaded(
    jsonData: Record<string, unknown>, 
    countryToSet: string | undefined, 
    currencyToSet: string | undefined,
    accountType: string
  ): void {
    // Common fields for both business and personal
    this.internationalBankAcForm.controls.relationship.patchValue(
      jsonData.relationship
    );
    this.beneficiaryBankForm.controls.branchCode.patchValue(
      jsonData.branch_code,
      { emitEvent: false }
    );
    
    // Set the country - now the validation should work correctly
    if (countryToSet) {
      this.beneficiaryBankForm.controls.country.patchValue(countryToSet);
    }
    
    // Set currency if available
    if (currencyToSet) {
      this.beneficiaryBankForm.controls.currency.patchValue(currencyToSet);
    }
    
    // Load dropdown options for the account type, then populate form
    this.loadDataListAndPopulateForm(accountType as 'business' | 'personal', jsonData);
  }

  private cleanBeneficiaryData(beneficiary: IBeneficiary,accountType: string) {
    // Common fields that are always included
    const cleanedBeneficiary : IBeneficiary = {
      addressLine1: beneficiary.addressLine1,
      addressLine2: beneficiary.addressLine2,
      city: beneficiary.city,
      state: beneficiary.state,
      zip: beneficiary.zip,
      country: beneficiary.country
    };

    if(accountType === 'business'){
      // Only include business-specific fields
      cleanedBeneficiary.businessLegalName = beneficiary.businessLegalName;
      cleanedBeneficiary.organisationIdNumber = beneficiary.organisationIdNumber;
      cleanedBeneficiary.dateOfIncorporation = beneficiary.dateOfIncorporation;
      cleanedBeneficiary.countryOfIncorporation = beneficiary.countryOfIncorporation;
      // Add idType from organisationIdType
      cleanedBeneficiary.idType = beneficiary.organisationIdType || '';
    }else if(accountType === 'personal'){
      // Only include personal-specific fields
      cleanedBeneficiary.givenName = beneficiary.givenName;
      cleanedBeneficiary.familyName = beneficiary.familyName;
      cleanedBeneficiary.organisationIdNumber = beneficiary.beneficiaryIdNumber;
      // Add idType from beneficiaryIdDocumentType
      cleanedBeneficiary.idType = beneficiary.beneficiaryIdDocumentType || '';
    }
    
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;
    if (bankCountry === 'PH') {
      cleanedBeneficiary.poBox = beneficiary.poBox;
      if (accountType === 'personal') {
        cleanedBeneficiary.dateOfBirth = beneficiary.dateOfBirth;
      }
    }
    
    return cleanedBeneficiary;
  }

  toggleCollapse(section: string){
    if(section === 'bankDetails'){
      this.bankDetailsCollapsed.set(!this.bankDetailsCollapsed());
    } else if(section === 'beneficiaryDetails'){
      this.beneficiaryDetailsCollapsed.set(!this.beneficiaryDetailsCollapsed());
    } else if(section === 'businessDetails'){
      this.businessDetailsCollapsed.set(!this.businessDetailsCollapsed());
    } else if(section === 'addressDetails'){
      this.addressDetailsCollapsed.set(!this.addressDetailsCollapsed());
    }
  }

  /**
   * Get maximum date for date of birth (18 years ago from today)
   * This ensures the person is at least 18 years old - they can't select dates more recent than 18 years ago
   */
  getMaxDateOfBirth(): string {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  }

  /**
   * Get minimum date for date of birth (120 years ago from today)
   * This ensures the date is not more than 120 years in the past
   */
  getMinDateOfBirth(): string {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 120);
    return today.toISOString().split('T')[0];
  }

  getInternationalBankAddress(ifsc:string){
    this.isAddressLoading.set(true);
    this.subscriptions.push(
      this.paymentsService.getInternationalBankAddress(ifsc)
      .pipe(finalize(() => this.isAddressLoading.set(false)))
      .subscribe((res) => {
        if(res.success){
          this.beneficiaryBankForm.patchValue({
            addressLine1: res?.address ?? '',
            city: res?.city ?? '',
            state: res?.state ?? '',
            zip: res?.zip ?? ''
          });
          this.internationalBankAcForm.controls.bankName.patchValue(res?.bank_name ?? '');
          this.isAddressFromIFSCCheck.set(true);
        }
      })
    );
  }

  getRecipientAddressDetails() {
    if(this.editMode) {
      return;
    }
    const countryCode = this.beneficiaryBankForm.controls.country.value;
    const accountType = this.data?.recipientType || this.internationalBankAcForm.controls.accountType.value;
    if(!this.recipientId() || !countryCode || !accountType) {
      return;
    }
    this.userHasBeneficiaryDetails.set(false);
    this.useExistingRecipientDetails.set(false);
    this.resetBeneficiaryForm();
    this.selectedAddressId.setValue(null, { emitEvent: false });
    this.detailsLoading.set(true);
    this.subscriptions.push(
      this.walletService.existingBeneficiaryDetails(countryCode, accountType, this.recipientId())
      .pipe(finalize(() => this.detailsLoading.set(false)))
      .subscribe((res) => {
        if(res.success) {
          this.recipientBeneficiaryDetails.set(res.data);
          this.selectedDetails.set(undefined);
          const payeeDetails=res.data.payee_details.address;
          const hasValidAddress =  Object.values(payeeDetails).some((value) => 
            value !== undefined && value !== null && value !== ''
          );
          if(hasValidAddress){
            this.selectedAddress.set(payeeDetails);
          }
          this.userHasBeneficiaryDetails.set(
            hasValidAddress ||
            res.data.existing_beneficiary_details.length > 0 ||
            !!res.data.payee_details?.payee_name?.trim()
          );
          if(res.data.existing_beneficiary_details.length > 0 && !res.data.is_existing){
            this.selectedAddress.set(res.data.existing_beneficiary_details[0].address);
            this.selectedDetails.set(res.data.existing_beneficiary_details[0]);
          }

          if(this.userHasBeneficiaryDetails()){
            this.useExistingRecipientDetails.set(true);
            this.toggleUseExistingRecipientDetails({target: {checked: true}} as unknown as Event);
          }
        }
      })
    );
  }

  toggleUseExistingRecipientDetails(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    this.useExistingRecipientDetails.set(isChecked);
    if(!isChecked){
      this.selectedAddressId.setValue(null, { emitEvent: false });
      this.resetBeneficiaryForm();
      return;
    }
    if(this.userHasMultipleBeneficiaryDetails()){
      return;
    }
    this.setFormData();
  }

  setFormData() {
    const payeeDetails = this.recipientBeneficiaryDetails()?.payee_details;
    const existingBeneficiaryDetails = this.selectedDetails();
    const address = this.selectedAddress();
    const isBusiness = this.data?.recipientType === 'business' || this.internationalBankAcForm.controls.accountType.value === 'business';
    const isPersonal = this.data?.recipientType === 'personal' || this.internationalBankAcForm.controls.accountType.value === 'personal';
    const isPH = this.beneficiaryBankForm.controls.country.value === 'PH';

    this.beneficiaryForm.patchValue(
      {
        businessLegalName: isBusiness ? existingBeneficiaryDetails?.json_data?.business_legal_name ?? payeeDetails?.payee_name ?? null : null,
        organisationIdNumber: (isBusiness || isPersonal) ? existingBeneficiaryDetails?.json_data?.organisation_id_number ?? null : null,
        organisationIdType: isBusiness ? existingBeneficiaryDetails?.json_data?.id_type ?? null : null,
        dateOfIncorporation: isBusiness ? existingBeneficiaryDetails?.json_data?.date_of_incorporation ?? null : null,
        countryOfIncorporation: isBusiness ? existingBeneficiaryDetails?.json_data?.country_of_incorporation ?? null : null,
        givenName: isPersonal ? existingBeneficiaryDetails?.json_data?.beneficiary_given_name ?? payeeDetails?.payee_name ?? null : null,
        familyName: isPersonal ? existingBeneficiaryDetails?.json_data?.beneficiary_family_name ?? null : null,
        beneficiaryIdNumber: isPersonal ? existingBeneficiaryDetails?.json_data?.organisation_id_number ?? null : null,
        beneficiaryIdDocumentType: isPersonal ? existingBeneficiaryDetails?.json_data?.id_type ?? null : null,
        poBox: isPH ? existingBeneficiaryDetails?.json_data?.po_box ?? null : null,
        dateOfBirth: isPH ? existingBeneficiaryDetails?.json_data?.date_of_birth ?? null : null,
        payeeEmail: isPH ? payeeDetails?.payee_email ?? null : null,
        payeePhone: payeeDetails?.payee_phone ?? null,
        addressLine1: address?.line1 ?? null,
        addressLine2: address?.line2 ?? null,
        city: address?.city ?? null,
        state: address?.state ?? null,
        zip: address?.zip ?? null,
        country: address?.country ?? null
      },
      { emitEvent: false }
    );

    this.onBeneficiaryCountryChange();
  }

  resetBeneficiaryForm() {
    this.beneficiaryForm.patchValue(
      {
        businessLegalName: null,
        organisationIdNumber: null,
        organisationIdType: null,
        dateOfIncorporation: null,
        countryOfIncorporation: null,
        givenName: null,
        familyName: null,
        beneficiaryIdDocumentType: null,
        beneficiaryIdNumber: null,
        poBox: null,
        dateOfBirth: null,
        payeeEmail: null,
        payeePhone: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zip: null,
        country: null
      },
      { emitEvent: false }
    );
  }

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.closeRelationshipDropdown, true);
  }

  closeRelationshipDropdown = (event: Event): void => {
    const ngSelect = this.relationshipDropdown?.ngSelectComponent;
    if (!ngSelect?.isOpen) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('ng-dropdown-panel')) {
      return;
    }
    ngSelect.close();
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.googleAddressSubscription?.unsubscribe();
    window.removeEventListener('scroll', this.closeRelationshipDropdown, true);
  }
}

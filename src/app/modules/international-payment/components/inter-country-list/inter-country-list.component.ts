import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { CurrencyPipe, DecimalPipe, KeyValuePipe, NgClass } from '@angular/common';
import { Component, inject, output, signal, OnInit, OnDestroy, ViewChild, computed, DestroyRef, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faBuilding, faBuildingColumns, faCheck, faCircleExclamation, faInfoCircle, faPlus, faUser, faUserGroup } from '@fortawesome/pro-solid-svg-icons';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import {
  debounceTime,
  finalize,
  take
} from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ICountriesCache, IInternationalCountry, IWalletData, IWalletInternationaPaymentAcceptPayload } from 'src/app/models/wallet';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Utils } from 'src/app/data/utils';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { Subject, takeUntil } from 'rxjs';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import {
  IInternationalBankAccountRequest,
  IInternationalPayeeAccount,
  IInternationalPayeeBankJsonData,
  IInternationalPayeeBankResponse
} from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { Store } from '@ngrx/store';
import {
  IpayeeTypeDetails,
  ITransactionLimits
} from 'src/app/modules/payments/model/payments';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { IApiRes } from 'src/app/models/api';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import {
  faEnvelope,
  faMessageMinus,
  faPhone
} from '@fortawesome/pro-thin-svg-icons';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { AddRecipientModalComponent } from '../../modal/add-recipient-modal/add-recipient-modal.component';
import { BankSelectionModalComponent } from '../../modal/bank-selection-modal/bank-selection-modal.component';


@Component({
  selector: 'app-inter-country-list',
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    MatTooltip,
    MatSelectModule,
    FormsModule,
    NgxMaskDirective,
    KeyValuePipe,
    PayeeDropdownV3Component,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    V35CommonDropDownSelectorComponent,
    MatCardModule,
    MatProgressBarModule,
    FontAwesomeModule,
    CurrencyPipe,
    DecimalPipe,
    NgSelectModule,
    WalletDropdownV3Component
  ],
  providers: [provideNgxMask()],
  templateUrl: './inter-country-list.component.html',
  styleUrl: './inter-country-list.component.scss'
})
export class InterCountryListComponent implements OnInit, OnDestroy {
  public walletDataService = inject(WalletDataV35Service);
  private paymentsService = inject(PaymentsService);
  private walletService = inject(WalletService);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private payeeModalService = inject(PayeeModalService);
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private clickTrackingService = inject(ClickTrackingService);
  private destroyRef = inject(DestroyRef);
  private staticWhiteLabelConditions = StaticWhiteLabelConditions;

  private readonly COUNTRIES_BUSINESS_CACHE_KEY =
    'international_countries_business_data';

  private readonly COUNTRIES_PERSONAL_CACHE_KEY =
    'international_countries_personal_data';

  @ViewChild('payeeBank') bankdropDown: V35CommonDropDownSelectorComponent;
  @ViewChild('walletDropdown') walletDropdown: WalletDropdownV3Component;
  complete = output<string>();
  back = output<string>();
  editPayee = output<void>();
  editBank = output<void>();
  paymentId = input<string>();
  onContinueClick = signal(false);
  faCircleExclamation = faCircleExclamation;
  showTooltip = signal(false);
  isEnabledCountriesLoading = signal(false);
  isLoading = signal(false);
  isSubmit = signal(false);
  isLoadBank = signal(false);
  isCalculatingReceived = signal(false);
  showExchangeRate = signal(false);
  isCalculatingExchangeRate = signal(false);
  isRecipientSelected = signal(false);
  noBanksAvailable = signal(false);
  isCalculatingSendAmount = signal(false);
  walletFundsErrorMsg = signal('');
  destroy$ = new Subject();
  receivedAmountChange$ = new Subject<string>();
  internationalPaymentsEnabledCountries = signal<{
    [key: string]: IInternationalCountry;
  }>({});

  utils = Utils;
  exchangeRate: number;
  exhangeRateUnParsed: string;
  sendAmount: string | null = null;
  receivedAmount: string | null = null;
  totalAmount: number = 5;
  selectedCountry: IInternationalCountry | null = null;
  selectedCountryName = signal('India');
  recipient: IPayeeDropdown;
  selectedRecipientBank: string | null = null;
  internationalAccounts = signal<IInternationalPayeeAccount[]>([]);
  payeeInternationalAccounts = signal<IInternationalPayeeAccount[]>([]);
  isReceivingAmount = signal(0);

  recipientTypes = signal<
    Array<{ value: string; label: string; icon: string[] }>
  >([
    { value: 'business', label: 'Business', icon: ['fas', 'building'] },
    { value: 'personal', label: 'Personal', icon: ['fas', 'user'] }
  ]);

  selectedRecipientType = signal<string | null>(null);
  monthlyLimit = signal<number>(0);
  monthlyUsage = signal<number>(0);
  isAnimating = signal(false);
  version=signal<string>('');

  /** Quote id from `getExchangeRate` that Continue reuses instead of creating a second quote; kept in lockstep with the displayed rate (cleared when the rate is hidden or the quote fails). */
  private currentQuoteId: string | null = null;

  private cloneBankId: string | null = null;
  private cloneCountryCode: string | null = null;

  transactionLimits = signal<ITransactionLimits | null>(null);
  isLoadingLimits = signal(false);
  isSendAmountLoading = signal('send');

  amountPercentage = computed(() => {
    const limits = this.transactionLimits();
    if (!limits) return 0;
    return Math.min(
      (limits.amount_spent_this_month / limits.monthly_amount_limit) * 100,
      100
    );
  });

  transactionPercentage = computed(() => {
    const limits = this.transactionLimits();
    if (!limits) return 0;
    return Math.min(
      (limits.transaction_count_this_month / limits.monthly_transaction_limit) *
        100,
      100
    );
  });

  faInfoCircle = faInfoCircle;
  faUserGroup = faUserGroup;
  faBuilding = faBuilding;
  faBuildingColumns = faBuildingColumns;
  faUser = faUser;
  faCheck = faCheck;
  faPlus = faPlus;

  featuresList = [
    {
      title: 'No Platform Fees',
      description: 'No hidden fees',
      icon: faCheck
    },
    {
      title: 'Faster Transfer',
      description: 'Funds delivered in minutes',
      icon: faCheck
    },
    {
      title: 'Secure & Safe',
      description: 'Bank-level security',
      icon: faCheck
    }
  ];

  helpList = [
    {
      id: 'call',
      title: 'Call Support',
      icon: faPhone,
      link: `tel:${this.staticWhiteLabelConditions.customerSupportNo}`,
      color: 'blue'
    },
    {
      id: 'email',
      title: 'Email Support',
      icon: faEnvelope,
      link: `mailto:${this.staticWhiteLabelConditions.customerSupportEmail}`,
      color: 'violet'
    },
    {
      id: 'chat',
      title: 'Message',
      icon: faMessageMinus,
      color: 'green'
    }
  ];

  readonly MIN_TRANSFER_AMOUNT = 10;

  initalForm = new FormGroup({
    bankId: new FormControl<string | null>(null, [Validators.required]),
    recipient: new FormControl<string | null>(null, [Validators.required]),
    country: new FormControl<string | null>(null, [Validators.required]),
    amount: new FormControl<string | null>(null, [
      Validators.required,
      Validators.min(this.MIN_TRANSFER_AMOUNT)
    ]),
    type: new FormControl<string | null>(null, Validators.required),
    wallet: new FormControl<IWalletData|null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.getWalletChange();
    this.changeAmount();
    this.changeReceivedAmount();

    // Set recipient type first if it exists
    const existingRecipientType =
      this.walletDataService.internationalPayment()?.recipientType;
    if (existingRecipientType) {
      this.selectedRecipientType.set(existingRecipientType);
      this.initalForm.get('type')?.setValue(existingRecipientType);

      // Only fetch limits if it's personal
      if (existingRecipientType === 'personal') {
        this.getTransactionLimits();
      }
    }

    // Now fetch countries (will use the correct API based on recipient type)
    this.getEnabledPaymentCountries();

    this.setPreviousAmount();

    // Check if country is already selected from previous navigation
    const existingCountry =
      this.walletDataService.interSelectedCurrencySignal();
    if (existingCountry && existingCountry.countryCode) {
      // Find the matching country in the current loaded countries
      const countriesData = this.internationalPaymentsEnabledCountries();
      const matchingCountry = Object.values(countriesData).find(
        (country) => country.countryCode === existingCountry.countryCode
      );

      if (matchingCountry) {
        this.selectedCountry = matchingCountry;
        // Also update the form control
        this.initalForm.get('country')?.setValue(matchingCountry.countryCode);
      } else {
        // If no match found, keep the default (India or first country)
        this.selectedCountry = existingCountry;
        this.initalForm.get('country')?.setValue(existingCountry.countryCode);
      }
    }

    // Set default recipient type if not already set
    if (!this.selectedRecipientType()) {
      this.selectedRecipientType.set('business');
      this.initalForm.get('type')?.setValue('business');
    }
    if (this.paymentId()) {
      this.getPaymentDetails();
    }
  }

  setPreviousAmount() {
    const sendAmount = this.walletDataService.interAmountSignal()?.amount;
    const receivingAmount =
      this.walletDataService.interAmountSignal()?.totalAmount;
    this.isReceivingAmount.set(
      this.walletDataService.interAmountSignal()?.isReceivingAmount || 0
    );
    if (sendAmount || receivingAmount) {
      this.initalForm
        .get('amount')
        ?.setValue(
          String(this.isReceivingAmount() === 0 ? sendAmount : receivingAmount)
        );
      if (this.isReceivingAmount() === 0) {
        this.sendAmount = String(sendAmount);
      } else {
        this.receivedAmount = String(receivingAmount);
      }
    }
  }

  changeAmount() {
    this.initalForm
      .get('amount')
      ?.valueChanges.pipe(
        debounceTime(1100),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.sendAmount = value;
        this.formatSendAmount();
        // Mark as touched to show validation error
        this.initalForm.get('amount')?.markAsTouched();
        const amount = parseFloat(value || '0');
        if (amount >= 10) {
          this.getExchangeRate(amount, this.isReceivingAmount());
        } else {
          // Hide exchange rate if amount is invalid
          this.showExchangeRate.set(false);
          this.currentQuoteId = null;
          if (this.isReceivingAmount() === 0) {
            this.sendAmount = null;
          } else {
            this.receivedAmount = null;
          }
        }
      });
  }

  changeReceivedAmount() {
    this.receivedAmountChange$
      .pipe(
        debounceTime(1100),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        const amount = parseFloat(value || '0');
        if (amount > 0 && this.selectedCountry) {
          this.isCalculatingSendAmount.set(true);
          this.getExchangeRate(amount, 1);
        }
      });
  }

  getInternationalPayeeBanksByType(recipientId: string) {
    // Validate inputs
    if (!recipientId) {
      return;
    }

    // Set loading state for bank dropdown
    this.isLoadBank.set(true);

    const recipientType = this.selectedRecipientType() || 'business';

    this.paymentsService
      .getInternationalBanksByRecipientType(
        recipientId,
        recipientType as 'business' | 'personal'
      )
      .pipe(
        finalize(() => this.isLoadBank.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (banks: IInternationalPayeeBankResponse[]) => {
          // Convert object to array if needed (API sometimes returns object with numeric keys)
          let banksArray: IInternationalPayeeBankResponse[] = [];
          if (banks) {
            if (Array.isArray(banks)) {
              banksArray = banks;
            } else if (typeof banks === 'object') {
              // Convert object with numeric keys to array
              banksArray = Object.values(banks);
            }
          }

          if (banksArray && banksArray.length > 0) {
            // Transform the API response to match expected structure
            const transformedBanks = banksArray.map(
              (bank: IInternationalPayeeBankResponse) => {
                // Parse json_data if it exists
                let parsedJsonData: IInternationalPayeeBankJsonData = {};
                const beneficiaryBankAddress = bank.beneficiaryBankDetails;
                if (bank.json_data) {
                  try {
                    parsedJsonData = JSON.parse(
                      bank.json_data
                    ) as IInternationalPayeeBankJsonData;
                  } catch (error) {
                    parsedJsonData = {};
                  }
                }

                // Map the API response to IInternationalPayeeAccount structure
                const transformedBank: IInternationalPayeeAccount = {
                  payee_id: bank.payee_id || recipientId,
                  bank_name: bank.bank_name,
                  account_number: bank.account_number,
                  account_type: bank.account_type,
                  swift_or_bic: bank.swift_or_bic,
                  encrypted_id: bank.encrypted_id,
                  bank_identifier_type: bank.bank_identifier_type || 'swift',
                  bank_identifier_code:
                    bank.swift_or_bic || bank.bank_identifier_code || '',
                  // Optional fields - convert null to undefined
                  routing_number: bank.routing_number ?? undefined,
                  payee_name: bank.payee_name ?? undefined,
                  payee_nationality: bank.payee_nationality ?? undefined,
                  currency: bank.currency ?? undefined,
                  payment_purpose: bank.payment_purpose ?? undefined,
                  country: bank.country ?? undefined,
                  location: bank.location ?? undefined,
                  pan: bank.pan ?? undefined,
                  ifsc: bank.ifsc ?? undefined,
                  contact_phone: bank.contact_phone ?? undefined,
                  purpose_code: bank.purpose_code ?? undefined,
                  // Create beneficiary from parsed json_data
                  beneficiary: {
                    addressLine1: parsedJsonData.address_line_1 || '',
                    addressLine2: parsedJsonData.address_line_2 || '',
                    city: parsedJsonData.city || '',
                    state: parsedJsonData.state || '',
                    zip: parsedJsonData.zip || '',
                    country: parsedJsonData.country || 'IN',
                    givenName: parsedJsonData.beneficiary_given_name || '',
                    familyName: parsedJsonData.beneficiary_family_name || '',
                    businessLegalName: parsedJsonData.business_legal_name || '',
                    organisationIdNumber:
                      parsedJsonData.organisation_id_number || '',
                    dateOfIncorporation:
                      parsedJsonData.date_of_incorporation || '',
                    countryOfIncorporation:
                      parsedJsonData.country_of_incorporation || ''
                  },
                  // Create beneficiaryBankDetails
                  beneficiaryBankDetails: beneficiaryBankAddress,
                  is_default_for_business: bank.is_default_for_business || 0,
                  is_default_for_personal: bank.is_default_for_personal || 0
                };

                return transformedBank;
              }
            );

            // Replace the old international_payee_accounts with transformed banks
            this.payeeInternationalAccounts.set(transformedBanks);
            this.noBanksAvailable.set(false);
            // Filter by selected country and set default
            this.setInternationalBankList();
          } else {
            // No banks for this recipient type
            this.clearBank();
            this.noBanksAvailable.set(true);
            this.showExchangeRate.set(false);
            this.fetchExchangeRate();
            const confirm = this.alertService.confirmAlert({
              content:
                'No international banks found for this recipient type. Do you want to add a new bank?',
              title: 'No Banks Found',
              doneMsg: 'Add Bank',
              cancelMsg: 'Cancel'
            });
            confirm
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((result) => {
                if (result) {
                  this.addNewRecipientBank(false);
                }
                // On Cancel: keep the recipient selected. The user can add
                // a bank via the inline button shown below the dropdown.
              });
          }
        },
        error: () => {
          this.isLoadBank.set(false);
          this.clearBank();
        }
      });
  }

  getTransactionLimits() {
    if (this.selectedRecipientType() !== 'personal') {
      return;
    }
    this.isLoadingLimits.set(true);
    this.paymentsService
      .getTransactionLimits()
      .pipe(
        finalize(() => this.isLoadingLimits.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.transactionLimits.set(res.data);
          }
        },
        error: () => {
          this.alertService.failedAlert({
            content: 'Failed to fetch transaction limits',
            title: 'Error',
            doneMsg: 'OK'
          });
          this.transactionLimits.set(null);
        }
      });
  }

  getEnabledPaymentCountries(preserveSelection = false, forceRefresh = false) {
    const recipientType = this.selectedRecipientType();

    // Store current selection if we need to preserve it
    const currentCountryCode = preserveSelection
      ? this.selectedCountry?.countryCode
      : null;

    // forceRefresh (e.g. recipient-type tab switch) skips the cache so the API is called for the newly selected type.
    const cachedData = forceRefresh ? null : this.getCachedCountriesData();

    if (cachedData) {
      // Use cached data directly
      this.internationalPaymentsEnabledCountries.set(cachedData);

      // Try to preserve the current country selection if requested
      if (preserveSelection && currentCountryCode) {
        const countriesArray = Object.values(
          cachedData
        ) as IInternationalCountry[];
        const matchingCountry = countriesArray.find(
          (country) => country.countryCode === currentCountryCode
        );
        if (matchingCountry) {
          this.selectedCountry = matchingCountry;
        } else {
          // Fallback to India if current country not available in new list
          this.selectedCountry = cachedData.India || countriesArray[0];
        }
      } else {
        // Default to India or first available country
        const countriesArray = Object.values(
          cachedData
        ) as IInternationalCountry[];
        this.selectedCountry = cachedData.India || countriesArray[0];
        // Update the country name when defaulting to India or first country
        const countryName =
          Object.entries(cachedData).find(
            ([_, value]) =>
              (value as IInternationalCountry).countryCode ===
              this.selectedCountry?.countryCode
          )?.[0] || 'India';
        this.selectedCountryName.set(countryName);
      }

      this.initalForm
        .get('country')
        ?.setValue(this.selectedCountry?.countryCode || null);
      this.walletDataService.internationalPayment.update((value) => ({
        ...value,
        selectedCurrency: this.selectedCountry
      }));
      const alreadySelectedBankCache = this.walletDataService.interSelectedRecipientSignal()?.bank as IInternationalPayeeAccount;
      if (alreadySelectedBankCache) {
        this.setRecipentCountry(alreadySelectedBankCache);
      }
      if (this.cloneCountryCode) {
        this.setCloneCountry(this.cloneCountryCode);
      }
      return;
    }

    this.isEnabledCountriesLoading.set(true);

    // Choose API based on recipient type
    const countriesApi$ =
      recipientType === 'personal'
        ? this.paymentsService.enabledInternationalPaymentCountriesPersonal()
        : this.paymentsService.enabledInternationalPaymentCountries();

    countriesApi$
      .pipe(
        finalize(() => this.isEnabledCountriesLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {

            this.storeCachedCountriesData(res.data);
            this.internationalPaymentsEnabledCountries.set(res.data);

            // Try to preserve the current country selection if requested
            if (preserveSelection && currentCountryCode) {
              const countriesArray = Object.values(
                res.data
              ) as IInternationalCountry[];
              const matchingCountry = countriesArray.find(
                (country) => country.countryCode === currentCountryCode
              );
              if (matchingCountry) {
                this.selectedCountry = matchingCountry;
              } else {
                // Fallback to India if current country not available in new list
                this.selectedCountry =
                  res.data.India || countriesArray[0];
              }
            } else {
              // Default to India or first available country
              const countriesArray = Object.values(
                res.data
              ) as IInternationalCountry[];
              this.selectedCountry =
                res.data.India || countriesArray[0];
              // Update the country name when defaulting to India or first country
              const countryName =
                Object.entries(res.data).find(
                  ([_, value]) =>
                    (value as IInternationalCountry).countryCode ===
                    this.selectedCountry?.countryCode
                )?.[0] || 'India';
              this.selectedCountryName.set(countryName);
            }

            this.initalForm
              .get('country')
              ?.setValue(this.selectedCountry?.countryCode);
            this.walletDataService.internationalPayment.update((value) => ({
              ...value,
              selectedCurrency: this.selectedCountry
            }));
            const alreadySelectedBankApi = this.walletDataService.interSelectedRecipientSignal()?.bank as IInternationalPayeeAccount;
            if (alreadySelectedBankApi) {
              this.setRecipentCountry(alreadySelectedBankApi);
            }
            if (this.cloneCountryCode) {
              this.setCloneCountry(this.cloneCountryCode);
            }
          }
        }
      });
  }

  private getCachedCountriesData() {
    try {
      const recipientType = this.selectedRecipientType();
      const cacheKey =
        recipientType === 'personal'
          ? this.COUNTRIES_PERSONAL_CACHE_KEY
          : this.COUNTRIES_BUSINESS_CACHE_KEY;

      const cached = this.localStorageService.getItem(
        cacheKey as LocalStorageKeys
      );

      if (!cached) return null;

      const parsedCache = JSON.parse(cached);      
      return parsedCache;
    } catch (error) {
      return null;
    }
  }

  onCountryChange(event: MatSelectChange) {
    if (!event.value) return;
    if (event.value.is_enabled === 0) {
      this.sendAmount = null;
      this.receivedAmount = null;
      this.selectedCountry = null;
      this.exchangeRate = 0;
      this.showExchangeRate.set(false);
      this.currentQuoteId = null;
      this.walletDataService.internationalPayment.update((value) => ({
        ...value,
        selectedCurrency: this.selectedCountry
      }));
      this.initalForm.get('country')?.setValue(null);
      this.initalForm.get('amount')?.setValue(null);
      this.alertService
        .infoAlert({
          content:
            'International payments to the selected country are not enabled. Contact support to have this option activated for your account',
          isOk: true,
          isCancel: true,
          doneMsg: 'Contact Now',
          cancelMsg: 'Not Now'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.dynamicWhiteLabelService.goToLiveChat();
          }
        });
      return;
    }
    this.selectedCountry = event.value;
    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedCurrency: this.selectedCountry
    }));
    this.initalForm
      .get('country')
      ?.setValue(this.selectedCountry?.countryCode || null);
    // Find the country name (key) based on the selected value
    const countryName =
      Object.entries(this.internationalPaymentsEnabledCountries()).find(
        ([_, value]) => value === event.value
      )?.[0] || '';
    this.selectedCountryName.set(countryName);
    this.setInternationalBankList();

    if (this.isRecipientSelected() && this.internationalAccounts().length === 0) {
      const confirm = this.alertService.confirmAlert({
        content: `No bank account found for this recipient for ${countryName}. Do you want to add a new bank?`,
        title: 'No Bank Account Found',
        doneMsg: 'Add Bank',
        cancelMsg: 'Cancel'
      });
      confirm
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result) {
            this.addNewRecipientBank(false);
          }
        });
    }

    // Fetch exchange rate only if there's a valid send amount
    const currentAmount = parseFloat(
      this.isReceivingAmount() === 0
        ? this.sendAmount || '0'
        : this.receivedAmount || '0'
    );
    if (currentAmount >= 10 && this.selectedCountry) {
      this.getExchangeRate(currentAmount, this.isReceivingAmount());
    } else {
      // Clear exchange rate display if amount is invalid
      this.showExchangeRate.set(false);
      this.currentQuoteId = null;
      if (this.isReceivingAmount() === 0) {
        this.sendAmount = null;
      } else {
        this.receivedAmount = null;
      }
    }
  }

  getExchangeRate(amount: number, isReceivingAmount: number = 0) {
    if (this.isCalculatingExchangeRate()) {
      return;
    }
    // Invalidate the previous quote until this one resolves so Continue can't reuse a stale quote.
    this.currentQuoteId = null;
   
    if (isReceivingAmount === 0 && this.isAmountOverWalletBalance(amount)) {
      this.setInsufficientBalanceError();
      this.exchangeRate = 0;
      this.showExchangeRate.set(false);
      this.receivedAmount = null;
      return;
    }
    const payload = {
      countryCode: this.selectedCountry?.countryCode || '',
      payoutCurrencyCode: this.selectedCountry?.currency || '',
      amount,
      type: this.selectedRecipientType() || '',
      isReceivingAmount
    };
    this.isSendAmountLoading.set(isReceivingAmount === 0 ? 'send' : 'receive');
    this.isLoading.set(true);
    this.isCalculatingExchangeRate.set(true);

    this.walletService
      .createQuote(payload)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.isCalculatingExchangeRate.set(false);
          this.isCalculatingSendAmount.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.walletFundsErrorMsg.set('');
            this.initalForm.get('wallet')?.updateValueAndValidity({
              emitEvent: false
            });
            this.exchangeRate = Number(
              parseFloat(res.data.customer_exchange_rate).toFixed(2)
            );
            // getting unparsed exchange rate
            this.exhangeRateUnParsed = res.data.customer_exchange_rate;
            this.showExchangeRate.set(true);
            // Persist this quote so Continue can reuse it instead of calling create-quote again.
            this.currentQuoteId = res.data.quote_id;
            this.version.set(res.data.version || 'v2');

            if (isReceivingAmount === 1) {
              // User entered receiving amount, calculate send amount
              this.sendAmount =
                res.data.sending_amount ||
                (amount / this.exchangeRate).toFixed(2);
              this.formatSendAmount();
              this.initalForm
                .get('amount')
                ?.setValue(this.sendAmount, { emitEvent: false });
              // The derived send amount may still exceed the wallet balance.
              if (
                this.isAmountOverWalletBalance(
                  Number(String(this.sendAmount).replace(/,/g, ''))
                )
              ) {
                this.setInsufficientBalanceError();
              }
            } else {
              // User entered send amount, calculate receiving amount
              this.isCalculatingReceived.set(true);
              this.receivedAmount = res.data.receiving_amount;
              this.formatReceivedAmount();
            }
            return;
          }
          this.handleQuoteFailure(res, isReceivingAmount);
        },
        error: (err: HttpErrorResponse) => {
          if (this.handleInsufficientWalletFunds(err)) {
            return;
          }
          this.clickTrackingService
            .trackInternationalPaymentTransactionNotDoneClick()
            .pipe(take(1))
            .subscribe();
          this.handleQuoteFailure(err?.error, isReceivingAmount);
        }
      });
  }

  private handleQuoteFailure(
    payload: unknown,
    isReceivingAmount: number
  ): void {
    this.exchangeRate = 0;
    this.currentQuoteId = null;
    if (isReceivingAmount === 1) {
      this.sendAmount = null;
    } else {
      this.receivedAmount = null;
    }
    this.showExchangeRate.set(false);

    const failure = payload as
      | { errorCode?: number; errorMsg?: string }
      | null
      | undefined;
    if (failure?.errorCode === 312) {
      this.alertService.warningAlert({
        content:
          failure?.errorMsg ||
          'Sending amount exceeds the allowed transaction limit.'
      });
    }
  }

  calculateReceivedAmount(): void {
    this.isReceivingAmount.set(0);
    if (!this.sendAmount) {
      this.receivedAmount = null;
      this.showExchangeRate.set(false);
    }
    this.syncAmountToForm();
  }

  calculateSendingAmount(): void {
    this.isReceivingAmount.set(1);
    if (!this.receivedAmount) {
      this.sendAmount = null;
      this.showExchangeRate.set(false);
      this.initalForm.get('amount')?.setValue(null, { emitEvent: false });
      return;
    }
    this.receivedAmountChange$.next(this.receivedAmount);
  }

  formatSendAmount(): void {
    if (this.sendAmount !== null && this.sendAmount !== '') {
      const formattedSendAmount = Number(this.sendAmount).toFixed(2);
      this.sendAmount = formattedSendAmount;
    }
  }

  formatReceivedAmount(): void {
    if (this.receivedAmount != null) {
      const formattedReceivedAmount = Number(this.receivedAmount).toFixed(2);
      this.receivedAmount = formattedReceivedAmount;
    }
  }

  selectRecipient(recipient: IPayeeDropdown) {
    this.isRecipientSelected.set(true);
    this.noBanksAvailable.set(false);
    if (recipient?.id) {
      // Check if this is the same recipient that's already selected to avoid duplicate calls
      const currentRecipientId =
        this.walletDataService.interSelectedRecipientSignal()?.encryptedId;
      if (
        currentRecipientId === recipient.id &&
        this.recipient?.id === recipient.id
      ) {
        return;
      }

      // Start animation
      this.isAnimating.set(true);

      // Update the recipient variable
      this.recipient = recipient;

      this.initalForm.get('recipient')?.setValue(recipient.id);
      this.internationalAccounts.set([]);
      this.selectedRecipientBank = null;
      this.getInternationalPayeeBanksByType(recipient.id);
      this.walletDataService.internationalPayment.update((value) => {
        const currentRecipient = value.selectedRecipient;
        return {
          ...value,
          selectedRecipient: {
            ...recipient,
            bank: currentRecipient?.bank as IInternationalPayeeAccount
          }
        };
      });

      // End animation after a short delay
      setTimeout(() => {
        this.isAnimating.set(false);
      }, 400);
    }
  }

  clearRecipient() {
    // Start animation
    this.isAnimating.set(true);

    this.recipient = null as unknown as IPayeeDropdown;
    this.internationalAccounts.set([]);
    this.selectedRecipientBank = null;
    this.noBanksAvailable.set(false);
    this.initalForm.get('recipient')?.setValue('');
    this.initalForm.get('bankId')?.setValue('');
    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedRecipient: null
    }));

    // End animation after a short delay
    setTimeout(() => {
      this.isRecipientSelected.set(false);
      this.isAnimating.set(false);
    }, 0);
  }

  setInternationalBankList() {
    if (
      this.payeeInternationalAccounts().length === 0 ||
      !this.isRecipientSelected()
    )
      return;

    // Get the selected country code
    const selectedCountryCode =
      (
        this.walletDataService.interSelectedCurrencySignal() as IInternationalCountry
      )?.countryCode || this.selectedCountry?.countryCode;

    // Filter banks by country if country is available
    let selectedCountryBanks = this.payeeInternationalAccounts();

    if (selectedCountryCode) {
      selectedCountryBanks = this.payeeInternationalAccounts().filter(
        (bank) => {
          // Check multiple possible country locations due to API response structure
          const bankCountry =
            bank.beneficiaryBankDetails?.country ||
            bank.country ||
            bank.beneficiary?.country ||
            'IN'; // Default to India if no country specified

          return bankCountry === selectedCountryCode;
        }
      );
    }

    if (selectedCountryBanks.length > 0) {
      const uniqueBanks = selectedCountryBanks.filter((bank, index, self) =>
        index === self.findIndex(b => b.encrypted_id === bank.encrypted_id)
      );
      this.internationalAccounts.set(uniqueBanks);
      const targetBankId = this.cloneBankId;
      this.cloneBankId = null;
      const defaultPayeeBank = targetBankId
        ? (uniqueBanks.find((b) => b.encrypted_id === targetBankId) ?? this.findDefaultBank(uniqueBanks))
        : this.findDefaultBank(uniqueBanks);
      this.setDefaultBank(defaultPayeeBank);
    } else if (selectedCountryCode) {
      // Country selected but no matching banks for this country.
      this.cloneBankId = null;
      this.clearBank();
      this.fetchExchangeRate();
    } else {
      // No country filter active — show all banks as fallback.
      const banks = this.payeeInternationalAccounts();
      this.internationalAccounts.set(banks);
      if (banks.length > 0) {
        const targetBankId = this.cloneBankId;
        this.cloneBankId = null;
        const defaultPayeeBank = targetBankId
          ? (banks.find((b) => b.encrypted_id === targetBankId) ?? this.findDefaultBank(banks))
          : this.findDefaultBank(banks);
        this.setDefaultBank(defaultPayeeBank);
      }
    }
  }

  clearBank() {
    this.internationalAccounts.set([]);
    this.selectedRecipientBank = null;
    this.initalForm.get('bankId')?.setValue(null);
    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedRecipient: {
        ...((value.selectedRecipient || {}) as IPayeeDropdown),
        bank: null
      }
    }));
  }

  changeBank(event: string) {
    // Event is now the encrypted_id of the selected bank
    let selectedBank: IInternationalPayeeAccount | null = null;

    if (event) {
      // Find the bank object from the internationalAccounts list
      selectedBank =
        this.internationalAccounts().find(
          (bank) => bank.encrypted_id === event
        ) || null;
    }

    if (selectedBank !== null) {
      this.selectedRecipientBank = selectedBank.encrypted_id;

      // Update wallet service with the full bank object
      this.walletDataService.internationalPayment.update((value) => ({
        ...value,
        selectedRecipient: {
          ...((value.selectedRecipient || {}) as IPayeeDropdown),
          bank: selectedBank
        }
      }));
      this.setRecipentCountry(selectedBank);
    } else {
      this.selectedRecipientBank = null;

      // Clear bank from wallet service
      this.walletDataService.internationalPayment.update((value) => ({
        ...value,
        selectedRecipient: {
          ...((value.selectedRecipient || {}) as IPayeeDropdown),
          bank: null
        }
      }));
    }
  }

  addNewRecipientBank(isEdit = false) {
    if (!this.walletDataService?.interSelectedRecipientSignal()?.encryptedId) {
      return;
    }
    const selectedRecipient = this.walletDataService?.interSelectedRecipientSignal();
    const dialogRef = this.dialog.open(AddRecipientModalComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        editMode: isEdit,
        id: this.walletDataService?.interSelectedRecipientSignal()?.encryptedId,
        recipientType: this.selectedRecipientType(),
        recipientName: this.recipient?.name,
        recipientId: this.recipient?.id,
        bankAcId: isEdit
          ? this.walletDataService?.interSelectedRecipientSignal()?.bank
              ?.encrypted_id
          : undefined,
        mode: 'new-bank-account',
        payeeEmail: selectedRecipient?.email,
        payeePhone: selectedRecipient?.phone
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((response: IApiRes<IInternationalBankAccountRequest>) => {
        if (response.success) {
          this.selectedRecipientBank = null;
          const newInternationalPayeeBancAc: IInternationalPayeeAccount = {
            payee_id:
              this.walletDataService?.interSelectedRecipientSignal()
                ?.encryptedId,
            bank_name: response.data.bankName,
            account_number: response.data.accountNumber,
            swift_or_bic: response.data.identifierCode,
            account_type: response.data.accountType,
            bank_identifier_type: response.data.identifierType,
            bank_identifier_code: response.data.identifierCode,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            encrypted_id: response.data.id!,
            beneficiary: response.data.beneficiary,
            beneficiaryBankDetails: response.data.beneficiaryBankDetails,
            ifsc: response.data.ifsc
          };

          if (isEdit) {
            this.payeeInternationalAccounts.update((currentAccounts) =>
              currentAccounts.map(account =>
                account.encrypted_id === newInternationalPayeeBancAc.encrypted_id
                  ? newInternationalPayeeBancAc
                  : account
              )
            );

            // Update the global state for the selected recipient
            this.walletDataService.internationalPayment.update((value) => ({
              ...value,
              selectedRecipient: {
                ...(value.selectedRecipient as IPayeeDropdown),
                phone: response.data.payeePhone || value.selectedRecipient?.phone,
                bank: newInternationalPayeeBancAc
              }
            }));
          } else {
            // ADD new bank in add mode (existing logic)
            this.internationalAccounts.update((currentAccounts) => [
              ...currentAccounts,
              newInternationalPayeeBancAc
            ]);
            this.walletDataService.internationalPayment.update((value) => ({
              ...value,
              selectedRecipient: {
                ...(value.selectedRecipient as IPayeeDropdown),
                phone: response.data.payeePhone || value.selectedRecipient?.phone,
                bank: newInternationalPayeeBancAc,
              }
            }));
          }

          this.handleNewBankAdded();
          this.alertService.successAlert({
            title: 'Success',
            content: `Bank account ${isEdit ? 'updated' : 'added'} successfully`,
            close: true
          });
        }
      });
  }

  setDefaultBank(selectedBank: IInternationalPayeeAccount) {
    if (!selectedBank) return;
    const currentBank =
      this.walletDataService.interSelectedRecipientSignal()?.bank;
    // Compare the selected bank with the current bank using JSON.stringify
    if (
      currentBank &&
      JSON.stringify(selectedBank) === JSON.stringify(currentBank)
    ) {
      this.selectedRecipientBank = currentBank.encrypted_id;
      this.initalForm.get('bankId')?.setValue(selectedBank?.encrypted_id);
      return;
    }

    // Set the encrypted_id as the value for the dropdown
    this.selectedRecipientBank = selectedBank.encrypted_id;

    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedRecipient: {
        ...((value.selectedRecipient || {}) as IPayeeDropdown),
        bank: selectedBank
      }
    }));
    this.initalForm.get('bankId')?.setValue(selectedBank?.encrypted_id);
    this.setRecipentCountry(selectedBank);
  }

  setRecipentCountry(selectedBank: IInternationalPayeeAccount) {
    const countriesData = this.internationalPaymentsEnabledCountries();
    const matchingCountryEntry = Object.entries(countriesData).find(
      ([countryName, countryData]) =>
        countryData.countryCode ===
        selectedBank?.beneficiaryBankDetails?.country
    );

    if (matchingCountryEntry) {
      const [countryName, countryData] = matchingCountryEntry;
      this.selectedCountry = countryData;
      this.selectedCountryName.set(countryName);
    }

    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedCurrency: this.selectedCountry
    }));
    this.initalForm
      .get('country')
      ?.setValue(this.selectedCountry?.countryCode || null);

      this.fetchExchangeRate();
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  onWalletDropdownOpen(isOpen: boolean): void {
    if (isOpen && this.walletDropdown) {
      // Cancel the pending wallet search to avoid redundant wallet list reloads on dropdown focus.
      setTimeout(() => clearTimeout(this.walletDropdown.searchTimeout));
    }
  }

  private handleInsufficientWalletFunds(err: HttpErrorResponse): boolean {
    const errorCode = err.error?.errorCode;
    if (errorCode !== 303 && errorCode !== '303') {
      return false;
    }
    this.walletFundsErrorMsg.set(err.error?.errorMsg || '');
    const walletControl = this.initalForm.get('wallet');
    walletControl?.setErrors({ walletFundsError: true });
    walletControl?.markAsTouched();
    this.exchangeRate = 0;
    this.showExchangeRate.set(false);
    return true;
  }

  /**
   * Checks if international payment is enabled for the selected recipient type
   * by reading values from localStorage
   */
  private checkInternationalPaymentEnabled(): boolean {
    const recipientType = this.selectedRecipientType();

    const keyMap: Record<string, string> = {
      business: 'rippleBusinessInternationalPaymentEnabled',
      personal: 'ripplePersonalInternationalPaymentEnabled'
    };

    const key = keyMap[recipientType as keyof typeof keyMap];
    return key
      ? this.localStorageService.getItem(key as LocalStorageKeys) === 1
      : false;
  }

  /**
   * Shows an alert when international payment is not enabled for the selected recipient type
   */
  private showContactSupportAlert(): void {
    const recipientTypeLabel =
      this.selectedRecipientType() === 'business' ? 'Business' : 'Personal';
    const data = {
      content: `${recipientTypeLabel} international payment is not enabled for this account. Please contact the support team to enable it.`,
      isOk: true,
      isCancel: true,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now'
    };

    const dialog = this.alertService.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  continue() {
    this.onContinueClick.set(true);
    this.initalForm.markAllAsTouched();
    if (this.noBanksAvailable() || (this.isRecipientSelected() && this.internationalAccounts().length === 0)) {
      this.alertService.warningAlert({
        content: 'No bank account found for this recipient. Please add a bank account to continue.'
      });
      return;
    }
    if (this.initalForm.invalid || !this.receivedAmount || !this.sendAmount ) return;
    if (this.hasInsufficientWalletBalance(this.initalForm.get('wallet')?.value)) {
      this.alertService.warningAlert({
        content: `Selected wallet has insufficient balance. A minimum balance of $${this.MIN_TRANSFER_AMOUNT}.00 is required.`
      });
      return;
    }
    if (
      this.isAmountOverWalletBalance(
        Number(String(this.sendAmount ?? '0').replace(/,/g, ''))
      )
    ) {
      this.setInsufficientBalanceError();
      this.alertService.warningAlert({
        content: 'Insufficient balance on wallet.'
      });
      return;
    }
    if (this.selectedRecipientType() === 'personal') {
      const limits = this.transactionLimits();
      if (limits) {
        // Check transaction count limit
        if (
          limits.transaction_count_this_month >=
          limits.monthly_transaction_limit
        ) {
          this.alertService.failedAlert({
            title: 'Transaction Limit Reached',
            content: `You have reached your monthly limit of ${limits.monthly_transaction_limit} transactions.`,
            close: true
          });
          return;
        }
      }
    }

    // CHECK if international payment is enabled for the selected recipient type
    const isPaymentEnabled = this.checkInternationalPaymentEnabled();

    if (!isPaymentEnabled) {
      this.showContactSupportAlert();
      return; // Stop here if payment is not enabled
    }

    // Reuse the quote created while entering the amount; only fall through to create-quote when none exists yet.
    if (this.currentQuoteId) {
      this.proceedToPayeeConfirm(this.currentQuoteId, this.version());
      return;
    }

    const payload = {
      countryCode: this.selectedCountry?.countryCode || '',
      payoutCurrencyCode: this.selectedCountry?.currency || '',
      amount: Number(this.sendAmount),
      type: this.selectedRecipientType() || '',
      isReceivingAmount: 0
    };

    this.isSubmit.set(true);
    this.walletService
      .createQuote(payload)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.currentQuoteId = res.data.quote_id;
            this.proceedToPayeeConfirm(
              res.data.quote_id,
              res.data.version || 'v2'
            );
          } else {
            this.clickTrackingService
              .trackInternationalPaymentTransactionNotDoneClick()
              .pipe(take(1))
              .subscribe();
            // Quote creation failed (e.g. errorCode 312 – amount exceeds limit): surface the backend error message.
            this.showQuoteCreateError(res);
          }
        },
        error: (err: HttpErrorResponse) => {
          if (this.handleInsufficientWalletFunds(err)) {
            return;
          }
          this.clickTrackingService
            .trackInternationalPaymentTransactionNotDoneClick()
            .pipe(take(1))
            .subscribe();
          this.showQuoteCreateError(err?.error);
        }
      });
  }

  /** Stores the chosen amount/quote in shared state and advances to payee-confirm; shared by the reuse-quote and create-quote paths in `continue`. */
  private proceedToPayeeConfirm(quoteId: string, version: string): void {
    this.version.set(version);
    const updatedAmount = {
      amount: Number(this.sendAmount),
      totalAmount: Number(this.receivedAmount),
      exchangeRate: this.exchangeRate,
      quoteId,
      isReceivingAmount: this.isReceivingAmount()
    };

    // Get the recipient type from the form
    const recipientType = this.initalForm.get('type')?.value as string;

    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedAmount: updatedAmount,
      recipientType,
      version: this.version()
    }));
    this.complete.emit('payee-confirm');
  }

  /** Shows the quote-create API's error message in the warning modal, falling back to a generic message when there is no `errorMsg`. */
  private showQuoteCreateError(failure: unknown): void {
    const error = failure as
      | { errorMsg?: string; errorCode?: number }
      | null
      | undefined;
    this.alertService.warningAlert({
      content:
        error?.errorMsg ||
        'Unable to continue with this payment. Please try again.'
    });
  }

  onEditPayee(): void {
    this.payeeModalService
      .openEditPayee(
        this.walletDataService?.interSelectedRecipientSignal()
          ?.encryptedId as string,
        undefined,
        {
          edit: true,
          id: this.walletDataService?.interSelectedRecipientSignal()
            ?.encryptedId as string
        }
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result) => {
              if (result?.id) {
                // Map the API response to the IPayeeDropdown structure
                const updatedPayee: IPayeeDropdown = {
                  id: result.id,
                  name: result.name,
                  nickName: result.nickName,
                  phone: result.phone,
                  addressLine1: result.addressLine1,
                  addressLine2: result.addressLine2,
                  city: result.city,
                  company: result.company,
                  country: result.country,
                  email: result.email,
                  encryptedId: result.id,
                  state: result.state,
                  zip: result.zip,
                  payeeIdNumber: result.payeeIdNumber,
                  payeeTypeId: result.payeeTypeId,
                  createdAt: '',
                  typeDetails: {} as IpayeeTypeDetails,
                  merchantCategory: result.merchantCategory
                };
                this.store.dispatch(
                  payeesActions.addUpdatedPayeeIntoPayees({
                    payee: updatedPayee
                  })
                );

                // Update the wallet data service with the new payee details
                // Keep the existing bank details if they exist
                this.recipient = updatedPayee;
                this.walletDataService.internationalPayment.update((value) => {
                  const currentRecipient = value.selectedRecipient;
                  return {
                    ...value,
                    selectedRecipient: {
                      ...updatedPayee,
                      bank: currentRecipient?.bank as IInternationalPayeeAccount
                    }
                  };
                });
              }

              // Refresh banks after Update Payee modal closes — covers add,
              // delete, and delete-all bank scenarios from within that modal.
              if (this.recipient?.id) {
                this.getInternationalPayeeBanksByType(this.recipient.id);
              }
            });
        }
      });
  }

  private storeCachedCountriesData(data: ICountriesCache) {
    const recipientType = this.selectedRecipientType();
    const cacheKey =
      recipientType === 'personal'
        ? this.COUNTRIES_PERSONAL_CACHE_KEY
        : this.COUNTRIES_BUSINESS_CACHE_KEY;

    this.localStorageService.setItem(
      cacheKey as LocalStorageKeys,
      JSON.stringify(data)
    );
  }

  syncAmountToForm(): void {
    const currentFormValue = this.initalForm.get('amount')?.value;
    if (currentFormValue !== this.sendAmount) {
      this.initalForm.get('amount')?.setValue(this.sendAmount);
      this.initalForm.get('amount')?.markAsTouched();
    }
  }

  onRecipientTypeChange(event: string) {
    this.selectedRecipientType.set(event);
    this.initalForm.get('type')?.setValue(event.toLocaleLowerCase());

    // Refetch countries for the new recipient type, defaulting to India; forceRefresh bypasses the cache so the API is hit on each tab switch.
    this.getEnabledPaymentCountries(false, true);

    if (event === 'personal') {
      // Fetch transaction limits when personal is selected
      this.getTransactionLimits();
    } else {
      // Clear transaction limits when switching away from personal
      this.transactionLimits.set(null);
    }

    // Refetch banks with new type if recipient is already selected
    const currentRecipient = this.recipient;
    if (currentRecipient?.id) {
      // Clear current bank selection
      this.selectedRecipientBank = null;
      this.internationalAccounts.set([]);
      this.payeeInternationalAccounts.set([]);
      this.bankdropDown?.clearSelection();

      // Fetch banks for the new recipient type
      this.getInternationalPayeeBanksByType(currentRecipient.id);
    }

    // Refetch exchange rate with new recipient type if valid amount exists
    const amount = parseFloat(
      this.isReceivingAmount() === 0
        ? this.sendAmount || '0'
        : this.receivedAmount || '0'
    );
    if (amount >= 10 && this.selectedCountry) {
      // Clear previous received amount to show fresh calculation
      if (this.isReceivingAmount() === 0) {
        this.receivedAmount = null;
      } else {
        this.sendAmount = null;
      }

      // No recipient means the bank-load chain won't fire; recalculate directly.
      if (!currentRecipient?.id) {
        this.getExchangeRate(amount, this.isReceivingAmount());
      }
    }
  }

  compareCountries(
    c1: IInternationalCountry | null,
    c2: IInternationalCountry | null
  ): boolean {
    return c1?.countryCode === c2?.countryCode;
  }

  onFieldBlur(fieldName: string): void {
    this.initalForm.get(fieldName)?.markAsTouched();
  }

  onHelpClick(helpId: string, link?: string): void {
    if (helpId === 'chat') {
      this.dynamicWhiteLabelService.goToLiveChat();
    } else if (link) {
      window.open(link, '_self');
    }
  }

  // Helper method to find default bank based on recipient type
  private findDefaultBank(
    banks: IInternationalPayeeAccount[]
  ): IInternationalPayeeAccount {
    const recipientType = this.selectedRecipientType();

    // Look for bank marked as default for current recipient type
    let defaultBank: IInternationalPayeeAccount | undefined;

    if (recipientType === 'business') {
      defaultBank = banks.find((bank) => bank.is_default_for_business === 1);
    } else if (recipientType === 'personal') {
      defaultBank = banks.find((bank) => bank.is_default_for_personal === 1);
    }
    // Fallback to first bank if no default found
    return (defaultBank as IInternationalPayeeAccount) || banks[0];
  }

  // Helper method to get the currently selected bank object
  getSelectedBank(): IInternationalPayeeAccount | null {
    if (!this.selectedRecipientBank) return null;
    return (
      this.internationalAccounts().find(
        (bank) => bank.encrypted_id === this.selectedRecipientBank
      ) || null
    );
  }

  //  Helper method to get last 4 digits of account number
  getLastFourDigits(accountNumber?: string): string {
    if (!accountNumber) return '0000';
    return accountNumber.slice(-4);
  }

  onChangeBankDetails(): void {
    if (!this.recipient?.id) {
      return;
    }
    // Open bank selection modal
    const dialogRef = this.dialog.open(BankSelectionModalComponent, {
      maxWidth: '600px',
      width: '90%',
      disableClose: true,
      data: {
        bankList: this.internationalAccounts(),
        currentSelectedBank: this.getSelectedBank(),
        recipientName: this.recipient.name || this.recipient.nickName,
        recipientType: this.selectedRecipientType(),
        recipientId: this.recipient.id,
        selectedCountry: this.selectedCountry,
        recipient: this.recipient,
        internationalAccounts: this.internationalAccounts()
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.success) {
          if (result.action === 'select' && result.selectedBank) {
            // Update the selected bank
            this.changeBank(result.selectedBank.encrypted_id);
          } else if (result.action === 'set_default') {
            this.getInternationalPayeeBanksByType(this.recipient.id);
            // Update the selected bank
            this.changeBank(result.selectedBank.encrypted_id);
          } else if (result.action === 'add_new') {
            // Open the add new bank modal
            this.handleNewBankAdded();
          }
        }
      });
  }

  onAddBankDetails(): void {
    if (!this.recipient?.id) {
      return;
    }
    // Open add new bank modal
    this.addNewRecipientBank(false); 
  }

  // Method handle new bank addition
  private handleNewBankAdded(): void {
    this.getInternationalPayeeBanksByType(this.recipient.id);
    // Show success message
    this.alertService.successAlert({
      title: 'Success',
      content: 'Bank account added successfully',
      close: true
    });
  }

  getWalletChange(){
    this.initalForm.get('wallet')?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe((value) => {
      this.initalForm.get('wallet')?.markAsTouched();
      this.walletFundsErrorMsg.set('');
      if (this.hasInsufficientWalletBalance(value)) {
        this.alertService.warningAlert({
          content: `Selected wallet has insufficient balance. A minimum balance of $${this.MIN_TRANSFER_AMOUNT}.00 is required.`
        });
        this.initalForm.get('wallet')?.reset(null, { emitEvent: false });
        return;
      }
      this.walletDataService.internationalPayment.update((res) => ({
        ...res,
        selectedWallet: value
      }));
      this.recalculateQuoteOnWalletChange(value);
    });
  }

  private hasInsufficientWalletBalance(wallet: IWalletData | null | undefined): boolean {
    if (!wallet) {
      return false;
    }
    const balance = Number(String(wallet.availableBalance).replace(/,/g, ''));
    return balance < this.MIN_TRANSFER_AMOUNT;
  }

  /**
   * True when the entered send amount (USD) exceeds the funding wallet's
   * available balance. Mirrors the v4 international flow so the quote and
   * submit guards stay in sync.
   */
  private isAmountOverWalletBalance(amount: number): boolean {
    const wallet = this.initalForm.get('wallet')?.value;
    if (!wallet || !amount || amount <= 0) {
      return false;
    }
    const balance = Number(
      String(wallet.availableBalance ?? '0').replace(/[$,]/g, '')
    );
    return !Number.isNaN(balance) && amount > balance;
  }

  /** Surfaces the insufficient-balance error under the wallet dropdown. */
  private setInsufficientBalanceError(): void {
    this.walletFundsErrorMsg.set('Insufficient balance on wallet.');
    const walletControl = this.initalForm.get('wallet');
    walletControl?.setErrors({ walletFundsError: true });
    walletControl?.markAsTouched();
  }

  /**
   * Re-requests a quote after the wallet changes, using whichever amount the
   * user actually entered (driven by `isReceivingAmount`) so we never send the
   * computed counterpart that may currently be zero.
   */
  private recalculateQuoteOnWalletChange(wallet: IWalletData | null): void {
    if (!wallet || !this.selectedCountry) {
      return;
    }
    const isReceiving = this.isReceivingAmount();
    const rawAmount = isReceiving === 0 ? this.sendAmount : this.receivedAmount;
    const amount = parseFloat(rawAmount || '0');
    const isValidAmount =
      isReceiving === 0 ? amount >= this.MIN_TRANSFER_AMOUNT : amount > 0;
    if (!isValidAmount) {
      return;
    }
    if (isReceiving === 1) {
      this.isCalculatingSendAmount.set(true);
    }
    this.getExchangeRate(amount, isReceiving);
  }

  getAmountCategoryForMoengage(amount: number): string {
    if(amount < 1000) return 'A';
    if(amount >= 1000 && amount < 5000) return 'B';
    if(amount >= 5000 && amount < 10000) return 'C';
    if(amount >= 10000 && amount < 50000) return 'D';
    return 'E';
  }

  getPaymentDetails() {
    if (!this.paymentId()) return;

    this.paymentsService
      .getPaymentDetails(this.paymentId() as string)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res.success || !res.data) return;

        const details = res.data;

        // 1. Recipient type (business / personal)
        const recipientType =
          details.transfer?.payee_info?.beneficiary_type || 'business';
        this.selectedRecipientType.set(recipientType);
        this.initalForm.get('type')?.setValue(recipientType);

        // 2. Send amount
        const sendAmount = String(
          details.transfer?.sending_amount || details.amount || ''
        );
        this.sendAmount = sendAmount;
        this.initalForm.get('amount')?.setValue(sendAmount);
        this.formatSendAmount();

        // 3. Source wallet
        if (details.source) {
          this.initalForm.get('wallet')?.setValue(details.source as IWalletData);
        }

        // 4. Country – set immediately if countries are already loaded; otherwise
        //    stash in cloneCountryCode and apply once getEnabledPaymentCountries resolves
        const countryCode =
          details.transfer?.payee_bank_info?.beneficiary_bank_country;
        if (countryCode) {
          this.setCloneCountry(countryCode);
        }

        // 5. Recipient + bank
        const payee = details.payee;
        if (payee) {
          const payeeId = payee.encryptedId || payee.id;
          // Remember the specific bank to select once banks are loaded
          this.cloneBankId =
            details.transfer?.international_payee_bank_id || null;

          // Update service state so the payee dropdown reflects the selection
          this.walletDataService.internationalPayment.update((value) => ({
            ...value,
            selectedRecipient: {
              ...payee,
              bank: null
            }
          }));
          this.recipient = payee;
          this.initalForm.get('recipient')?.setValue(payeeId);
          this.isRecipientSelected.set(true);

          // Trigger bank loading; setInternationalBankList will use cloneBankId
          this.getInternationalPayeeBanksByType(payeeId);
        }

        // 6. Source of cash
        const {source_of_cash} = details.transfer;
        if(source_of_cash) {
          this.walletDataService.internationalPaymentPayloadSignal.update((value) => ({
            ...(value as IWalletInternationaPaymentAcceptPayload),
            sourceOfCash: source_of_cash
          }));
        }

        // 7. Purpose
        const {purpose} = details.transfer;
        if(purpose) {
          this.walletDataService.internationalPaymentPayloadSignal.update((value) => ({
            ...(value as IWalletInternationaPaymentAcceptPayload),
            purpose
          }));
        }

        // 8. Memo
        const {memo} = details.transfer;
        if(memo) {
          this.walletDataService.internationalPaymentPayloadSignal.update((value) => ({
            ...(value as IWalletInternationaPaymentAcceptPayload),
            memo
          }));
        }

        // 9. source of cash name
        const {source_of_cash_name} = details.transfer;
        if(source_of_cash_name) {
          this.walletDataService.internationalPaymentPayloadSignal.update((value) => ({
            ...(value as IWalletInternationaPaymentAcceptPayload),
            sourceOfCashName: source_of_cash_name
          }));
        }
      });
  }

  /**
   * @description Applies a country selection by country code.
   * If the countries list is not yet loaded the code is stashed in cloneCountryCode
   * and applied once getEnabledPaymentCountries resolves.
   */
  private setCloneCountry(countryCode: string): void {
    const countriesData = this.internationalPaymentsEnabledCountries();
    const countriesArray = Object.values(countriesData) as IInternationalCountry[];
    const matchingCountry = countriesArray.find(
      (c) => c.countryCode === countryCode
    );

    if (matchingCountry) {
      const countryName =
        Object.entries(countriesData).find(
          ([_, v]) => (v as IInternationalCountry).countryCode === countryCode
        )?.[0] || '';
      this.selectedCountry = matchingCountry;
      this.selectedCountryName.set(countryName);
      this.initalForm.get('country')?.setValue(countryCode);
      this.walletDataService.internationalPayment.update((value) => ({
        ...value,
        selectedCurrency: this.selectedCountry
      }));
      this.cloneCountryCode = null;
    } else {
      // Countries not yet loaded – stash and apply once available
      this.cloneCountryCode = countryCode;
    }
  }

  fetchExchangeRate () {
    const amount = parseFloat(
      this.isReceivingAmount() === 0
        ? this.sendAmount || '0'
        : this.receivedAmount || '0'
    );
    if (amount >= 10 && this.selectedCountry) {
      this.getExchangeRate(amount, this.isReceivingAmount());
    }else{
      this.showExchangeRate.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

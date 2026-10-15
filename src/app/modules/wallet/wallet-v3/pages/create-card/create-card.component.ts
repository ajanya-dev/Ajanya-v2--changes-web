import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  effect,
  inject,
  Injector,
  model,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, Subject, Subscription, takeUntil, tap } from 'rxjs';
import { CardTimeInterval } from 'src/app/data/data/wallet';
import {
  IMCCCode,
  IRestrictionSettings,
  TimeRestriction,
  ICreateNewCard,
  ITime,
  ICreateGiftCard
} from 'src/app/models/wallet';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';

import {
  faAngleDown,
  faBuildings,
  faCalendar,
  faCircleQuestion,
  faClockEight,
  faCreditCardFront,
  faDollar,
  faGlobeAmericas,
  faHomeAlt,
  faInfoCircle,
  faMapLocation,
  faSearch,
  faStoreAlt,
  faTimes,
  faTruck
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ICountryModel } from 'src/app/models/common';
import { Country } from 'src/app/data/data/country-list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import {
  emailOrPhoneRequired,
  ValidationService
} from 'src/app/shared/service/validation/validation.service';
import { AddPayeeModalComponent } from 'src/app/shared/modal/payee-modal/add-payee-modal/add-payee-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CreateCardInfoComponent } from '../../modals-v35/create-card-info-v35/create-card-info/create-card-info.component';
import { faBox } from '@fortawesome/pro-regular-svg-icons';

export const SHIPPING_TYPES = [
  { label: 'Standard ', value: 'standard', price: 'Free' ,time:'5-7 business days'},
  { label: 'Express', value: 'express', price: '$15.00' ,time:'2-3 business days'},
];

export interface IPhysicalCardShippingDetails {
  card_material_cost: string; 
  delivery_time: string;
  is_first_physical_card: boolean;
  shipping_cost: string;
  shipping_country: string;
  shipping_method: string;
  shipping_type: string;
  total_cost: string;
}
interface StateModel {
  iso2: string;
  name: string;
  country_code: string;
}

@Component({
  selector: 'app-create-card',
  standalone: true,
  templateUrl: './create-card.component.html',
  styleUrl: './create-card.component.scss',
  imports: [
    CommonBackButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    MatTooltip,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    MatRadioGroup,
    MatRadioButton,
    MatSelectModule,
    MatFormFieldModule,
    CommonButtonV35Component,
    WalletDropdownV3Component,
    FontAwesomeModule,
    CommonModule,
    NgSelectModule,
    TruncatePipe,
    NewPhoneInputComponent,
    PayeeDropdownV3Component
  ]
})
export class CreateCardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private walletService = inject(WalletService);
  private walletDataService = inject(WalletDataV35Service);
  private fb = inject(FormBuilder);
  private injector = inject(Injector);
  private googleAddressService = inject(GoogleAddressService);
  private cloudBankService = inject(CloudBankService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  public dialog = inject(MatDialog);

  cardOptions: { value: string; name: string }[] = [
    { value: 'zilDebitCard', name: 'Visa Spend Card' },
    { value: 'giftCard', name: 'Visa Gift Card' }
  ];

  selectedCardOption = model<string>('zilDebitCard');
  payeeSelected: boolean = false;
  selectedPayee: IPayeeDropdown;
  destroy$ = new Subject<void>();

  giftCardForm: FormGroup = this.fb.group(
    {
      payee: ['', [Validators.required]],
      payeeEmail: [''],
      payeePhone: [''],
      limitAmount: ['', [Validators.required]],
      cardLimitType: ['onetime', [Validators.required]]
    },
    { validators: [emailOrPhoneRequired()] }
  );

  giftCardType: { value: string; name: string }[] = [
    { value: 'onetime', name: 'One Time' },
    { value: 'rechargeable', name: 'Rechargeable' }
  ];

  cardForm: FormGroup = this.fb.group({
    nameOnCard: ['', [Validators.required]],
    cardLabel: [''],
    spendingLimit: ['', [Validators.required]],
    cardLimitPeriod: ['monthly', [Validators.required]],
    cardType: ['virtual', [Validators.required]]
  });

  shippingForm: FormGroup = this.fb.group({
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    country: ['US', [Validators.required]],
    shippingType: ['standard', [Validators.required]]
  });

  billingForm: FormGroup = this.fb.group({
    addressLine1: ['', []],
    addressLine2: [''],
    city: ['', []],
    state: ['', []],
    zipCode: ['', []],
    country: ['US', []]
  });

  timePeriod: { name: string; value: string; checked: boolean }[] =
    CardTimeInterval.timeIntervalList();

  typeOfCard: { value: string; name: string }[] = [
    { value: 'virtual', name: 'Virtual' },
    { value: 'physical', name: 'Physical' }
  ];

  toolTips = {
    country:
      'Your card can be used only in these countries. \nTransactions outside the selected countries will be automatically declined.',
    merchantCategory:
      'Select the types of businesses where your card can be used. \nTransactions at merchants outside these selected categories will be declined for security and spending control.',
    merchantName:
      'Add up to 20 approved merchants where your card can be used. \nPurchases from unlisted merchants will be declined to ensure safe and authorized spending.',
    city: 'Add up to 20 cities where your card can be used. \nTransactions attempted in unlisted cities will be automatically declined.',
    validTill:
      ' Set an expiration date for your card. Transactions will be declined after this date.',
    time: 'Choose up to three specific time ranges  when transactions are allowed. \nPayments attempted outside these selected periods will be declined.',
    merchantId: 'Enter merchant IDs to restrict your card usage to approved merchants only. Purchases from any merchants not listed will be blocked for your security'
  };

  subscriptions: Subscription[] = [];

  walletId: string;
  cardId: string = '';
  loading: boolean = false;
  selectedBusinessId: string;
  isBillingAddressSameAsShipping: boolean = true;

  payeeStates: StateModel[] = [];
  isShowStateDropDown = true;
  allowedcountries: { [key: string]: string } = {};
  countries: string[] = [];

  rules: IRestrictionSettings = {
    allowed_merchant_country: [],
    allowed_merchant_category_code: [],
    allowed_merchant_names: [],
    allowed_merchant_city: [],
    allowed_merchant_id: [],
    allowed_time: {
      timezone: 'America/Chicago',
      times: []
    },
    valid_till: ''
  };

  selectedCountries: string[] = [];
  newMerchant = '';
  newMerchantId = '';
  newCity = '';
  newTimeFrom = '';
  newTimeTo = '';
  expandedRule: string | null = null;
  merchantCategories: IMCCCode[] = [];
  countryList: ICountryModel[] = [];
  mccLoading: boolean = false;
  showTimeError: boolean = false;
  showCardRestrictions: boolean = false;
  merchantCategorySearch: string = '';
  filteredMerchantCategories: IMCCCode[] = [];
  duplicateCountry: boolean = false;
  duplicateMerchantName: boolean = false;
  duplicateMerchantId: boolean = false;
  duplicateCity: boolean = false;
  duplicateTimes: boolean = false;
  isClearAllRestriction: boolean = false;
  hasRestrictions: boolean = false;
  isGiftCard: boolean = false;
  physicalCardShippingDetails: IPhysicalCardShippingDetails;
  isShippingDetailsLoading: boolean = false;
  currenCountryPhoneLength = {} as { min: number; max: number };
  currentCountryCode: string;

  faCreditCard = faCreditCardFront;
  faHome = faHomeAlt;
  faGlobe = faGlobeAmericas;
  faBuilding = faBuildings;
  faStore = faStoreAlt;
  faMapPin = faMapLocation;
  faClock = faClockEight;
  faDollar = faDollar;
  faAngleDown = faAngleDown;
  faCalendar = faCalendar;
  faSearch = faSearch;
  faTimes = faTimes;
  faInfoCircle = faInfoCircle;
  faHelpIcon = faCircleQuestion;
  faTruck = faTruck;
  faDelivery = faBox

  readonly SHIPPING_TYPES = SHIPPING_TYPES;

  ngOnInit(): void {
    this.countryList = Country.countryList();
    this.getAllowedCountries();
    this.getMerchantCategories();
    this.getShippingTypeDetails('standard')
    this.getStates('US', undefined, 'shipping');
    this.getStates('US', undefined, 'billing');
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.walletId = this.activatedRoute.snapshot.queryParams.walletId || '';
    this.cardId = this.activatedRoute.snapshot.queryParams.cardId || '';
    this.isGiftCard = this.activatedRoute.snapshot.queryParams.isGiftCard;
    this.selectedBusinessId =
      this.activatedRoute.snapshot.queryParams.businessId ||
      this.walletDataService.onBoardedBusinessSignal();
    if (this.isGiftCard) {
      this.selectedCardOption.set('giftCard');
    }
    if (!this.cardId && !this.walletDataService.onBoardingStatusSignal()) {
      this.walletDataService.cardOnBoardingStatus(undefined, this.walletId);
    }
    if (this.cardId) {
      if (!this.walletDataService.selectedCardSignal()?.id) {
        this.walletDataService.cardOnBoardingStatus(
          undefined,
          this.walletId,
          this.cardId
        );
      }
      effect(
        () => {
          this.cardForm.patchValue({
            nameOnCard: this.walletDataService.selectedCardSignal()?.nameOnCard,
            cardLabel: this.walletDataService.selectedCardSignal()?.label,
            spendingLimit:
              this.walletDataService.selectedCardSignal()?.limitAmount,
            cardLimitPeriod:
              this.walletDataService.selectedCardSignal()?.limitInterval,
            cardType: this.walletDataService.selectedCardSignal()?.cardType
          });
          this.rules.allowed_merchant_names =
            this.walletDataService.allowedMerchantNameSignal();
          this.rules.allowed_merchant_category_code =
            this.walletDataService.allowedMerchantCategoryCodeSignal();
          this.rules.allowed_merchant_country =
            this.walletDataService.allowedMerchantCountrySignal();
          this.rules.allowed_merchant_city =
            this.walletDataService.allowedMerchantCitySignal();
          this.rules.allowed_merchant_id =
            this.walletDataService.allowedMerchantIdSignal() || [];
          this.rules.allowed_time = this.walletDataService.allowedTimeSignal();
          this.rules.valid_till = this.walletDataService.validTillSignal();

          // Check if any restrictions exist and set showCardRestriction accordingly
          const hasRestrictions =
            (this.rules.allowed_merchant_names &&
              this.rules.allowed_merchant_names.length > 0) ||
            (this.rules.allowed_merchant_category_code &&
              this.rules.allowed_merchant_category_code.length > 0) ||
            (this.rules.allowed_merchant_country &&
              this.rules.allowed_merchant_country.length > 0) ||
            (this.rules.allowed_merchant_city &&
              this.rules.allowed_merchant_city.length > 0) ||
            (this.rules.allowed_merchant_id &&
              this.rules.allowed_merchant_id.length > 0) ||
            (this.rules.allowed_time &&
              this.rules.allowed_time?.times?.length > 0) ||
            !!this.rules.valid_till;

          if (hasRestrictions) {
            this.hasRestrictions = true;
            this.showCardRestrictions = true;
            this.filterMerchantCategories(this.merchantCategorySearch || '');
          }
        },
        { injector: this.injector }
      );
    } 

    this.listenForShipingTypeChange()
  }

  submit(): void {
    if (this.selectedCardOption() === 'giftCard') {
      this.submitGiftCard();
      return;
    }
    this.cardForm.markAllAsTouched();
    // For physical cards, also validate shipping and potentially billing forms
    if (this.cardForm.value.cardType === 'physical' && !this.cardId) {
      this.shippingForm.markAllAsTouched();

      // If billing is different from shipping, validate billing form
      if (!this.isBillingAddressSameAsShipping) {
        this.billingForm.markAllAsTouched();

        if (this.billingForm.invalid) {
          return;
        }
      }

      if (this.shippingForm.invalid) {
        return;
      }
    }
    if (this.cardForm.invalid) {
      return;
    }
    const formValue = this.cardForm.value;

    // Get the restriction settings with proper typing
    const restrictions: IRestrictionSettings = this.createRestrictionSettings();

    const cardDetails: ICreateNewCard = {} as ICreateNewCard;

    if (!this.cardId) {
      cardDetails.walletId = this.walletId;
      cardDetails.businessId = this.selectedBusinessId;
      cardDetails.nameOnCard = formValue.nameOnCard;
      cardDetails.label = formValue.cardLabel || formValue.nameOnCard;
      cardDetails.limitAmount = formValue.spendingLimit;
      cardDetails.limitInterval = formValue.cardLimitPeriod;
      cardDetails.cardType = formValue.cardType;
      cardDetails.programType = 2;
      cardDetails.restrictionSettings = restrictions;
    } else {
      cardDetails.label = formValue.cardLabel || formValue.nameOnCard;
      cardDetails.limitAmount = formValue.spendingLimit;
      cardDetails.limitInterval = formValue.cardLimitPeriod;
      cardDetails.programType = 2;
    }

    // Add shipping and billing details for physical cards
    if (formValue.cardType === 'physical' && !this.cardId) {
      // Add shipping address details
      cardDetails.shippingAddress = {
        line1: this.shippingForm.value.addressLine1,
        line2: this.shippingForm.value.addressLine2,
        city: this.shippingForm.value.city,
        state: this.shippingForm.value.state,
        postal_code: this.shippingForm.value.zipCode,
        country: this.shippingForm.value.country,
        method: this.shippingForm.value.shippingType
      };

      // Add billing address details
      if (this.isBillingAddressSameAsShipping) {
        // Use shipping address as billing address
        const { method: _METHOD, ...billingAddressDetails } =
          cardDetails.shippingAddress;
        cardDetails.billingAddress = billingAddressDetails;
      } else {
        // Use separate billing address
        cardDetails.billingAddress = {
          line1: this.billingForm.value.addressLine1,
          line2: this.billingForm.value.addressLine2,
          city: this.billingForm.value.city,
          state: this.billingForm.value.state,
          postal_code: this.billingForm.value.zipCode,
          country: this.billingForm.value.country
        };
      }
    }

    if (this.cardId) {
      this.submitEdited(cardDetails, restrictions);
      return;
    }

    this.loading = true;
    this.subscriptions.push(
      this.walletService
        .createCard(cardDetails)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success!',
              content:
                'Your card has been successfully created. Please check back after some time for confirmation.',
              close: true,
              timeout: 2000
            };
            this.alertService.successAlert(data);
            this.walletDataService.cardUpdatedOrAdded = true;
            this.walletDataService.getCardDetails('create', this.walletId);
            this.walletDataService.cardOnBoardingStatus(
              undefined,
              this.walletId
            );
            this.router.navigate(['/manage/wallet/transactions']);
          }
        })
    );
  }

  submitGiftCard() {
    this.giftCardForm.markAllAsTouched();
    if (
      this.giftCardForm.value.payeeEmail !== '' ||
      this.giftCardForm.value.payeePhone !== ''
    ) {
      this.giftCardForm.controls['payeeEmail'].clearValidators();
      this.giftCardForm.controls['payeeEmail'].updateValueAndValidity();
      this.giftCardForm.controls['payeePhone'].clearValidators();
      this.giftCardForm.controls['payeePhone'].updateValueAndValidity();
    }

    if (this.giftCardForm.invalid) return;
    const formValue = this.giftCardForm.value;
    const cardDetails: ICreateGiftCard = {
      walletId: this.walletId,
      cardType: 'virtual',
      limitAmount: formValue.limitAmount,
      cardLimitType: formValue.cardLimitType,
      payeeId: formValue.payee.id,
      payeeEmail: formValue.payeeEmail,
      payeePhone: formValue.payeePhone
    };
    this.loading = true;
    this.subscriptions.push(
      this.walletService
        .createGiftCard(cardDetails)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success!',
              content:
                'Your Visa Gift Card has been successfully created. Please check back after some time for confirmation.',
              close: true,
              timeout: 2000
            };
            this.alertService.successAlert(data);
            this.walletDataService.giftCardUpdatedOrAdded = true;
            this.walletDataService.getGiftCardDetails('create', this.walletId);
            this.walletDataService.cardOnBoardingStatus(
              undefined,
              this.walletId
            );
            this.router.navigate(['/manage/wallet/transactions']);
          }
        })
    );
  }

  submitEdited(
    cardDetails: ICreateNewCard,
    restrictions: IRestrictionSettings
  ) {
    this.loading = true;

    const updateCard = this.walletService.updateCardDetails(
      this.cardId,
      cardDetails
    );

    if (this.showCardRestrictions) {
      const updateRestrictions = this.walletService
        .updateCardRestriction(this.cardId, { settings: restrictions })
        .pipe(
          tap((val) => {
            if (val.success) {
              this.walletDataService.getCardRestrictionSettings(this.cardId);
            }
          })
        );

      const sub = forkJoin([updateCard, updateRestrictions])
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(([cardRes, restrictionRes]) => {
          if (!cardRes.success && !restrictionRes.success) {
            this.alertService.failedAlert({
              content: 'Failed to update the card'
            });
            return;
          }

          if (!cardRes.success) {
            this.alertService.warningAlert({
              content:
                'Card details update failed, but restrictions were updated successfully.'
            });
            return;
          }

          if (!restrictionRes.success) {
            this.alertService.warningAlert({
              content:
                'Card details were updated successfully, but restrictions update failed.'
            });
            return;
          }

          this.afterCardUpdate();
        });
      this.subscriptions.push(sub);
      return;
    }

    const sub = updateCard
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.afterCardUpdate();
        }
      });
    this.subscriptions.push(sub);
  }

  afterCardUpdate() {
    const data = {
      title: 'Success!',
      content: 'Card details updated.',
      close: true
    };

    this.loading = false;
    this.alertService.successAlert(data);
    this.walletDataService.cardUpdatedOrAdded = true;
    this.walletDataService.getCardDetails('edit', this.walletId);
    this.walletDataService.selectedWalletTab = { tab: 'card' };
    this.router.navigate(['/manage/wallet/transactions']);
  }

  submitCardRestriction(restrictions: IRestrictionSettings, id: string) {
    this.loading = true;
    this.subscriptions.push(
      this.walletService
        .updateCardRestriction(this.cardId, {
          settings: restrictions
        })
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((response) => {
          this.walletDataService.getCardRestrictionSettings(id);
          const data = {
            title: 'Success!',
            content: 'Card details updated.',
            close: true
          };
          if (response.success) {
            this.alertService.successAlert(data);
            this.walletDataService.cardUpdatedOrAdded = true;
            this.walletDataService.getCardDetails('edit', this.walletId);
            this.walletDataService.selectedWalletTab = {
              tab: 'card'
            };
            this.router.navigate(['/manage/wallet/transactions']);
          }
        })
    );
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currenCountryPhoneLength = event.length;
    this.giftCardForm.controls.payeePhone.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.giftCardForm.controls.payeePhone.updateValueAndValidity();
  }

  countryCodeChange(event: { code: string; updateLocalStorage: boolean }) {
    this.currentCountryCode = event.code;
  }

  editPayee() {
    const dialogRef = this.dialog.open(AddPayeeModalComponent, {
      maxWidth: '570px',
      width: '85%',
      disableClose: true,
      data: { edit: true, id: this.selectedPayee.id }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.giftCardForm.controls.payee.setValue(result);
        this.selectPayee(result);
      }
    });
  }

  isGiftCardEnabled() {
    return this.walletDataService.giftCardStatusSignal();
  }

  onCardOptionSelect(optionValue: string): void {
    if (optionValue === 'giftCard' && !this.isGiftCardEnabled()) {
      this.selectedCardOption.set('zilDebitCard');
      // // Show warning

      const action = this.dialog.open(CreateCardInfoComponent, {
        maxWidth: '420px',
        minWidth: '343px',
        width: '95%',
        data: {
          subTitle: 'Start creating your Gift Card now!',
          features: [
            {
              icon: 'faCreditCard',
              text: 'One-time use or rechargeable for convenience'
            },
            {
              icon: 'faShieldCheck',
              text: 'Cancel cards anytime for secure transactions'
            }
          ],
          message:
            'Please contact customer support to enable Gift Card creation from your wallet.'
        }
      });

      action.afterClosed().subscribe((res) => {
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
      return;
    }
    this.selectedCardOption.set(optionValue);
  }

  selectPayee(payee: IPayeeDropdown) {
    if (!payee || !payee?.id) {
      return;
    }
    this.payeeSelected = true;
    this.selectedPayee = payee;
    if (payee.email) {
      this.giftCardForm.controls.payeeEmail.setValue(payee?.email);
    } else {
      this.giftCardForm.controls.payeeEmail.setValue(null);
    }
    if (payee.phone) {
      this.giftCardForm.controls.payeePhone.setValue(payee?.phone);
    } else {
      this.giftCardForm.controls.payeePhone.setValue(null);
    }
  }
  clearPayee() {
    this.payeeSelected = false;
    this.giftCardForm.controls.payeeEmail.reset();
    this.giftCardForm.controls.payeePhone.reset();
  }

  toggleCardRestrictions() {
    this.showCardRestrictions = !this.showCardRestrictions;
  }

  private createRestrictionSettings(): IRestrictionSettings {
    const restrictions: IRestrictionSettings = {};

    // Add country restrictions if present
    if (
      Array.isArray(this.rules.allowed_merchant_country) &&
      this.rules.allowed_merchant_country.length > 0
    ) {
      restrictions.allowed_merchant_country =
        this.rules.allowed_merchant_country;
    }

    // Add merchant category restrictions if present
    if (
      Array.isArray(this.rules.allowed_merchant_category_code) &&
      this.rules.allowed_merchant_category_code.length > 0
    ) {
      restrictions.allowed_merchant_category_code =
        this.rules.allowed_merchant_category_code;
    }

    // Add merchant name restrictions if present
    if (
      Array.isArray(this.rules.allowed_merchant_names) &&
      this.rules.allowed_merchant_names.length > 0
    ) {
      restrictions.allowed_merchant_names = this.rules.allowed_merchant_names;
    }

    // Add merchant ID restrictions if present
    if (
      Array.isArray(this.rules.allowed_merchant_id) &&
      this.rules.allowed_merchant_id.length > 0
    ) {
      restrictions.allowed_merchant_id = this.rules.allowed_merchant_id;
    }

    // Add city restrictions if present
    if (
      Array.isArray(this.rules.allowed_merchant_city) &&
      this.rules.allowed_merchant_city.length > 0
    ) {
      restrictions.allowed_merchant_city = this.rules.allowed_merchant_city;
    }

    // Add time restrictions if present
    if (
      Array.isArray(this.rules.allowed_time?.times) &&
      this.rules.allowed_time.times.length > 0
    ) {
      restrictions.allowed_time = {
        timezone: 'America/Chicago', // Default timezone or use one from rules
        times: this.rules.allowed_time.times.map((time: ITime) => ({
          from: time.from,
          to: time.to
        }))
      };
    }

    // Add valid_till date if present
    if (this.rules.valid_till && this.rules.valid_till.trim() !== '') {
      restrictions.valid_till = this.rules.valid_till;
    }

    return restrictions;
  }

  watchBillingAddressToggle(): void {
    // Add or remove validators based on the checkbox state
    this.billingForm.valueChanges.subscribe(() => {
      this.updateBillingValidators();
    });

    // Initial setup of validators
    this.updateBillingValidators();
  }

  updateBillingValidators(): void {
    const controls = this.billingForm.controls;

    if (!this.isBillingAddressSameAsShipping) {
      // Add required validators when billing address is different
      controls['addressLine1'].setValidators([Validators.required]);
      controls['city'].setValidators([Validators.required]);
      controls['state'].setValidators([Validators.required]);
      controls['zipCode'].setValidators([Validators.required]);
      controls['country'].setValidators([Validators.required]);
    } else {
      // Remove validators when using shipping address
      controls['addressLine1'].clearValidators();
      controls['city'].clearValidators();
      controls['state'].clearValidators();
      controls['zipCode'].clearValidators();
      controls['country'].clearValidators();
    }

    // Update validation status
    Object.keys(controls).forEach((key) => {
      controls[key].updateValueAndValidity();
    });
  }

  // Toggle billing address same as shipping
  onBillingAddressToggle(): void {
    this.isBillingAddressSameAsShipping = !this.isBillingAddressSameAsShipping;
    this.updateBillingValidators();

    if (this.isBillingAddressSameAsShipping) {
      // Copy shipping address values to billing if needed
      this.billingForm.reset();
    }
  }

  /**
   * @description Loads google address for auto filling
   * @param address - payee first address input fields data
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca']
    });
    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.getStates(res.country);
        this.shippingForm.patchValue({
          addressLine1: res.address,
          city: res.city,
          state: this.getStateName(this.shippingForm, res.state),
          zipCode: res.zip,
          country: this.checkCountryName(res.country)
        });

        googleAddressSubscription.unsubscribe();
      });
  }
  loadGoogleBillingAddress(address: HTMLInputElement, addressInstance: number) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca'],
      addressInstance: addressInstance
    });
    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.getStates(res.country);
        this.billingForm.patchValue({
          addressLine1: res.address,
          city: res.city,
          state: this.getStateName(this.billingForm, res.state),
          zipCode: res.zip,
          country: this.checkCountryName(res.country)
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  getForm(value: string) {
    if (value === 'shipping') {
      return this.shippingForm;
    } else {
      return this.billingForm;
    }
  }

  // Get all allowed countries
  getAllowedCountries() {
    this.cloudBankService.allowedCountries.subscribe((res) => {
      this.allowedcountries = res;
      this.countries = Object.keys(this.allowedcountries);
    });
  }

  // Method to handle country selection change
  selectBenfCountry(
    beneficiaryCountry: HTMLElement,
    form: 'shipping' | 'billing'
  ) {
    beneficiaryCountry.classList.add('active');
    this.getStates(undefined, undefined, form);
  }

  // Method to get states based on country
  getStates(
    country?: string,
    state?: string,
    inputForm?: 'shipping' | 'billing'
  ) {
    const form = this.getForm(inputForm as string);
    const countryCode = country || form.controls.country.value;

    if (
      this.findCountryCode(countryCode) !== 'CA' &&
      this.findCountryCode(countryCode) !== 'US'
    ) {
      const hasState = this.getStateName(form, form.controls.state.value);
      if (hasState) {
        form.controls.state.setValue('');
      }
      this.isShowStateDropDown = false;
      return;
    }

    this.isShowStateDropDown = true;
    this.subscriptions.push(
      this.cloudBankService
        .getStates(this.findCountryCode(countryCode) as string)
        .subscribe((res) => {
          this.payeeStates = res.data;
          if (state) {
            this.getStateName(form, state);
          } else if (!form.controls.state.value) {
            form.controls.state.setValue(res.data[0].iso2);
          }
        })
    );
  }

  // Helper method to find country code
  findCountryCode(countryName: string): string | undefined {
    if (
      Object.prototype.hasOwnProperty.call(this.allowedcountries, countryName)
    ) {
      return countryName;
    }
    const countryCode = Object.keys(this.allowedcountries).find(
      (code) => this.allowedcountries[code] === countryName
    );
    return countryCode || undefined;
  }

  // Helper method to get state name
  getStateName(form: FormGroup, state?: string) {
    const stateDetails = this.payeeStates.find(
      (states) => states.iso2 === state || states.name === state
    );
    if (stateDetails) {
      form.controls.state.setValue(stateDetails?.iso2);
      return stateDetails?.iso2;
    }
    return state;
  }

  /**
   * @description This method checks if the payeeCountry is in shortForm (US) or expanded from (United States)
   * @param country payeeCountry
   * @returns payeeCountry
   */
  checkCountryName(country: string) {
    if (country === null || country === undefined || country === '') {
      return null;
    }
    const data = Object.entries(this.allowedcountries);
    let alphaNumericCode = '';
    data.forEach((res) => {
      if (res[0] === country || res[1] === country) {
        alphaNumericCode = res[0];
      }
    });
    return alphaNumericCode;
  }

  getFilteredShippingTypes() {
    if (this.shippingForm.value.country === 'US') {
      // Only set default value if no shipping type is selected yet
      if (
        !this.shippingForm.value.shippingType ||
        (this.shippingForm.value.shippingType !== 'standard' &&
          this.shippingForm.value.shippingType !== 'express')
      ) {
        this.shippingForm.patchValue({ shippingType: 'standard' });
      }

      // Filter to only show standard and express for US
      return SHIPPING_TYPES.filter(
        (type) => type.value === 'standard' || type.value === 'express'
      );
    } else {
      // Only set default value if shipping type is not already international
      if (this.shippingForm.value.shippingType !== 'international') {
        this.shippingForm.patchValue({ shippingType: 'international' });
      }

      // Show only international for non-US countries
      return SHIPPING_TYPES.filter((type) => type.value === 'international');
    }
  }

  getMerchantCategories() {
    this.mccLoading = true;
    this.subscriptions.push(
      this.walletService
        .getMCCcodes()
        .pipe(
          finalize(() => {
            this.mccLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.merchantCategories = res.data;
            this.filteredMerchantCategories = this.merchantCategories;
          }
        })
    );
  }

  validateZipCode(zipCode: string): boolean {
    return /^\d{5}(-\d{4})?$/.test(zipCode);
  }

  addCountries(): void {
    this.duplicateCountry = false;
    let atLeastOneAdded = false;

    if (this.selectedCountries && this.selectedCountries.length > 0) {
      // Initialize the array if it doesn't exist
      this.rules.allowed_merchant_country =
        this.rules.allowed_merchant_country || [];

      // Add each selected country that's not already in the list
      this.selectedCountries.forEach((countryCode) => {
        if (
          !this.rules.allowed_merchant_country?.includes(countryCode) &&
          /^[A-Z]{2}$/.test(countryCode)
        ) {
          this.rules.allowed_merchant_country?.push(countryCode);
          atLeastOneAdded = true;
        }
      });

      // Only set duplicateCountry to true if none were added
      if (!atLeastOneAdded) {
        this.duplicateCountry = true;
      }

      // Clear the selection after adding
      // this.selectedCountries = [];
    }
  }
  getChange(event: string[]) {
    if (event) {
      this.selectedCountries = event;
    }
    if (!event || event.length === 0) {
      this.duplicateCountry = false;
    }
  }

  addMerchantCategory(category: IMCCCode): void {
    if (
      !this.rules.allowed_merchant_category_code?.includes(category.mcc_code)
    ) {
      this.rules.allowed_merchant_category_code?.push(category.mcc_code);
    } else {
      this.rules.allowed_merchant_category_code =
        this.rules.allowed_merchant_category_code.filter(
          (merchantCategoryCode: string) =>
            merchantCategoryCode !== category.mcc_code
        );
    }

    // Re-apply the filtering to update the display order
    this.filterMerchantCategories(this.merchantCategorySearch || '');
  }

  addMerchantName(): void {
    this.duplicateMerchantName = false;
    const merchant = this.newMerchant.trim();

    // Initialize the array if it doesn't exist
    this.rules.allowed_merchant_names = this.rules.allowed_merchant_names ?? [];

    // Check if merchant name is not empty
    if (merchant) {
      // Check if it's a duplicate
      if (this.rules.allowed_merchant_names.includes(merchant)) {
        this.duplicateMerchantName = true;
      }
      // Check if we've reached the max limit
      else if (this.rules.allowed_merchant_names.length < 20) {
        this.rules.allowed_merchant_names.push(merchant);
        this.newMerchant = '';
      }
      // If we get here, we've reached the max limit but the message for that
      // is already handled by the template
    }
    // If merchant name is empty, we don't show any error
  }

  addMerchantId(): void {
    this.duplicateMerchantId = false;
    const merchantId = this.newMerchantId.trim();

    // Initialize the array if it doesn't exist
    this.rules.allowed_merchant_id = this.rules.allowed_merchant_id ?? [];

    // Check if merchant ID is not empty
    if (merchantId) {
      // Check if it's a duplicate
      if (this.rules.allowed_merchant_id.includes(merchantId)) {
        this.duplicateMerchantId = true;
      }
      // Check if we've reached the max limit
      else if (this.rules.allowed_merchant_id.length < 20) {
        this.rules.allowed_merchant_id.push(merchantId);
        this.newMerchantId = '';
      }
      // If we get here, we've reached the max limit but the message for that
      // is already handled by the template
    }
  }

  addCity(): void {
    this.duplicateCity = false;
    const city = this.newCity.trim();

    // Initialize the array if it doesn't exist
    this.rules.allowed_merchant_city = this.rules.allowed_merchant_city ?? [];

    // Check if city is not empty
    if (city) {
      // Check if it's a duplicate
      if (this.rules.allowed_merchant_city.includes(city)) {
        this.duplicateCity = true;
      }
      // Check if we've reached the max limit
      else if (this.rules.allowed_merchant_city.length < 20) {
        this.rules.allowed_merchant_city.push(city);
        this.newCity = '';
      }
      // If we get here, we've reached the max limit but the message for that
      // is already handled by the template
    }
    // If city is empty, we don't show any error
  }

  addTimeRestriction(): void {
    this.showTimeError = false;
    this.duplicateTimes = false;

    // Initialize the allowed_time object if it doesn't exist
    if (!this.rules.allowed_time) {
      this.rules.allowed_time = {
        timezone: 'America/Chicago', // default timezone
        times: []
      };
    }

    // Initialize the times array if it doesn't exist
    if (!this.rules.allowed_time.times) {
      this.rules.allowed_time.times = [];
    }

    if (
      this.newTimeFrom &&
      this.newTimeTo &&
      (this.rules.allowed_time?.times?.length ?? 0) < 3
    ) {
      const fromTime = new Date(`1970-01-01T${this.newTimeFrom}`);
      const toTime = new Date(`1970-01-01T${this.newTimeTo}`);

      // Check if this time range already exists
      const isDuplicate = this.rules.allowed_time.times.some(
        (time) => time.from === this.newTimeFrom && time.to === this.newTimeTo
      );

      if (isDuplicate) {
        this.duplicateTimes = true;
        return;
      }

      if (fromTime < toTime) {
        this.rules.allowed_time.times.push({
          from: this.newTimeFrom,
          to: this.newTimeTo
        });
        this.newTimeFrom = '';
        this.newTimeTo = '';
      } else {
        this.showTimeError = true;
      }
    }
  }

  removeItem(
    type: keyof IRestrictionSettings,
    index: number,
    isTimeRestriction = false
  ): void {
    // Handle time restrictions differently since they're in a nested array
    if (type === 'allowed_time' && isTimeRestriction) {
      if (this.rules.allowed_time && this.rules.allowed_time.times) {
        this.rules.allowed_time.times.splice(index, 1);
      }
      return;
    }

    // Handle other array properties as before
    if (Array.isArray(this.rules[type])) {
      (this.rules[type] as string[]).splice(index, 1);
    }
  }

  toggleRule(ruleName: string): void {
    this.expandedRule = this.expandedRule === ruleName ? null : ruleName;
  }

  isPhysicalCardEnabled(): boolean {
    return this.walletDataService.physicalCardStatusSignal();
  }

  isVirtualCardEnabled(): boolean {
    return this.walletDataService.virtualCardStatusSignal();
  }

  onCardTypeChange(): void {
    const selectedType = this.cardForm.get('cardType')?.value;

    if (selectedType === 'physical' && !this.isPhysicalCardEnabled()) {
      // Prevent selection
      this.cardForm.get('cardType')?.setValue('virtual');
      // // Show warning

      const action = this.dialog.open(CreateCardInfoComponent, {
        maxWidth: '420px',
        minWidth: '343px',
        width: '95%',
        data: {
          subTitle: 'Start creating your Physical Card now!',
          features: [
            {
              icon: 'faTriangleExclamation',
              text: 'Set spending limits and usage restrictions'
            },
            {
              icon: 'faArrowUpRightDots',
              text: 'Increase spending limits as needed'
            },
            {
              icon: 'faShieldCheck',
              text: 'Cancel cards anytime for secure transactions'
            }
          ],
          message:
            'Please contact customer support to enable Physical Card creation from your wallet.'
        }
      });

      action.afterClosed().subscribe((res) => {
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
      return;
    }

    if (selectedType === 'virtual' && !this.isVirtualCardEnabled()) {
      // Prevent selection
      this.cardForm.get('cardType')?.setValue('physical');
      // Show warning
      const action = this.alertService.infoAlert({
        content:
          'Virtual card creation is not enabled. Please contact the support team.',
        doneMsg: 'Contact Now',
        isCancel: true,
        cancelMsg: 'Not Now'
      });

      action.afterClosed().subscribe((res) => {
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
      return;
    }
  }

  filterMerchantCategories(event: string) {
    if (!this.merchantCategorySearch) {
      // Sort the entire list to show selected categories first
      this.filteredMerchantCategories = [...this.merchantCategories].sort(
        (a, b) => {
          const isFirstCategorySelected =
            this.rules.allowed_merchant_category_code?.includes(a.mcc_code);
          const isSecondCategorySelected =
            this.rules.allowed_merchant_category_code?.includes(b.mcc_code);

          if (isFirstCategorySelected && !isSecondCategorySelected) return -1; // firstCategory comes first
          if (!isFirstCategorySelected && isSecondCategorySelected) return 1; // secondCategory comes first
          return 0; // keep original order
        }
      );
      return;
    }

    const searchTerm = this.merchantCategorySearch.toLowerCase();

    // Filter categories based on search term
    const matchingCategories = this.merchantCategories.filter(
      (category) =>
        category.mcc_description.toLowerCase().includes(searchTerm) ||
        category.mcc_code.toString().includes(searchTerm)
    );

    // Sort the filtered results to prioritize selected categories
    this.filteredMerchantCategories = matchingCategories.sort((a, b) => {
      const isFirstCategorySelected =
        this.rules.allowed_merchant_category_code?.includes(a.mcc_code);
      const isSecondCategorySelected =
        this.rules.allowed_merchant_category_code?.includes(b.mcc_code);

      if (isFirstCategorySelected && !isSecondCategorySelected) return -1; // firstCategory comes first
      if (!isFirstCategorySelected && isSecondCategorySelected) return 1; // secondCategory comes first
      return 0; // keep original order
    });
  }

  resetSearch() {
    this.merchantCategorySearch = '';
    this.filterMerchantCategories(this.merchantCategorySearch || '');
  }

  clearRestrictions() {
    this.isClearAllRestriction = !this.isClearAllRestriction;
    if (this.isClearAllRestriction) {
      this.alertService
        .confirmAlert({
          content:
            'Are you sure you want to remove all existing restrictions on this card?',
          doneMsg: 'Confirm'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.rules = {
              allowed_merchant_country: [],
              allowed_merchant_category_code: [],
              allowed_merchant_names: [],
              allowed_merchant_city: [],
              allowed_merchant_id: [],
              allowed_time: {} as TimeRestriction,
              valid_till: ''
            };
            const data = {
              title: 'Success!',
              content: 'Restrictions cleared Successfully',
              close: true,
              timeout: 3000
            };
            this.alertService.successAlert(data);
          }
          this.isClearAllRestriction = false;
        });
    }
  }

  getMinValidTillDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  listenForShipingTypeChange(): void {  
    this.shippingForm.get('shippingType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.getShippingTypeDetails(value);
    });
  }

  getShippingTypeDetails(value: string): void {
    if (!value) {
      return;
    }

    this.isShippingDetailsLoading = true;
    const payload = value === 'standard' ? {country: "US", method: "standard"} : {country: "US", method: "express"}

    this.subscriptions.push(
      this.walletService.getShippingTypeDetailsForPhysicalCard(payload).pipe(finalize(() => {
        this.isShippingDetailsLoading = false;
      })).subscribe((res) => {
        this.physicalCardShippingDetails = res.data;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

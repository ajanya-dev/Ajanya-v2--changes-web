import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  LucideAngularModule,
  LucideIconData,
  ArrowLeft,
  Check,
  CircleCheckBig,
  Code,
  CreditCard,
  Database,
  FileText,
  Landmark,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Wallet,
  X,
  Info
} from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { CommonCountryDropdownV4Component } from 'src/app/shared/V4/common-country-dropdown-v4/common-country-dropdown-v4.component';
import { V4SelectDropdownComponent } from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { environment } from 'src/environments/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import { IAppConfig } from 'src/app/models/app_settings';
import { IWalletData } from 'src/app/models/wallet';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import {
  SelectedAddonCodes,
  SelectedPlanCodes
} from 'src/app/data/data/subscription';
import {
  IAddOns,
  IBillingAddress,
  ICurrentSubscriptionPlan,
  IPayloadAddonData,
  IPlanFeaturesAddonsList,
  IPlanWithFeatureList,
  ISelectedAddOns
} from 'src/app/modules/subscription/model/subscription';

export interface IAddonFlowModalData {
  isFromTrial?: number;
  /**
   * When provided, the modal treats this as the plan being subscribed to,
   * overriding the user's current subscription plan. Used for first-time plan
   * selection from the v3 pricing-table flow when the v4 layout is active.
   * Must be paired with `initialIntervalType`.
   */
  initialPlanCode?: string;
  /** Interval that pairs with `initialPlanCode`. */
  initialIntervalType?: 'months' | 'years';
  /** Current subscription plan — used to pre-select existing addons. */
  currentPlan?: ICurrentSubscriptionPlan;
  /** Whether to pre-select existing addons in the UI. Defaults to true. */
  preSelectAddons?: boolean;
  /** When true, hides the proration FAQ in the billing summary. */
  isFromPricingTable?: boolean;
  isFromProfile?:boolean;
}

export type AddonFlowStep = 'addons' | 'billing' | 'payment' | 'complete';

interface IV4QuantityOption {
  id: string;
  name: string;
  value: string;
}

@Component({
  selector: 'app-v4-subscription-addons-flow-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CurrencyPipe,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    AddressAutocompleteV4Component,
    CommonCountryDropdownV4Component,
    V4SelectDropdownComponent,
    V4ControlMessageComponent,
    WalletDropdownV4Component
  ],
  templateUrl: './v4-subscription-addons-flow-modal.component.html',
  styleUrl: './v4-subscription-addons-flow-modal.component.scss'
})
export class V4SubscriptionAddonsFlowModalComponent implements OnInit {
  private dialogRef = inject(
    MatDialogRef<V4SubscriptionAddonsFlowModalComponent>
  );

  private dialogData = inject<IAddonFlowModalData | null>(MAT_DIALOG_DATA, { optional: true });

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private sanitizer = inject(DomSanitizer);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private store = inject(Store);
  private cloudBankService = inject(CloudBankService);
  private localStorageService = inject(LocalStorageService);
  private scriptService = inject(ScriptService);
  private appSettingsService = inject(AppSettingsService);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  // White-label
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  appConfig: IAppConfig | undefined;

  isDarkMode = signal(false);

  brandLogoUrl(): string {
    if (this.isDarkMode()) {
      return (
        this.appConfig?.whiteLogo ||
        this.appConfig?.zilMoneyLogo ||
        'assets/white_label/zilmoney/assets/app_logo_white.svg'
      );
    }
    return this.appConfig?.zilMoneyLogo || 'assets/main/zil_Money_logo.svg';
  }

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly CheckIcon = Check;
  readonly CodeIcon = Code;
  readonly CreditCardIcon = CreditCard;
  readonly DatabaseIcon = Database;
  readonly FileTextIcon = FileText;
  readonly LandmarkIcon = Landmark;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly Trash2Icon = Trash2;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly WalletIcon = Wallet;
  readonly XIcon = X;
  readonly InfoIcon = Info;
  readonly CircleCheckBigIcon = CircleCheckBig;

  environment = environment;
  showBasePlan = this.dialogData?.preSelectAddons !== false;
  showProrationFaq = !!this.dialogData?.currentPlan?.subscription && !this.dialogData?.isFromPricingTable;

  // Flow state
  step = signal<AddonFlowStep>('addons');
  isInitLoading = signal(true);
  isPaymentLoading = signal(false);

  securedLoading = signal(false);

  // Data
  currentPlan: ICurrentSubscriptionPlan | undefined;
  planFeatureAddonList: IPlanFeaturesAddonsList | undefined;
  billingAddress: IBillingAddress | undefined;
  addOnsList: IAddOns[] = [];
  selectedPlanDetails: IPlanWithFeatureList | undefined;
  allowedCountries: string[] = [];

  // Addon selection state
  selectedAddons = signal<Record<string, ISelectedAddOns>>({});
  addonQuantities: Record<string, number> = {};

  // Payment state
  paymentMethod = signal<'Card' | 'Wallet'>('Card');
  cardLink: SafeResourceUrl = '';
  cardLoading = signal(false);
  isItDownGrade = false;
  builtAddonPayload: IPayloadAddonData[] = [];

  // Wallet id of the user's existing subscription, used to pre-select the
  // wallet dropdown in the addon flow.
  defaultWalletId = signal<string>('');

  // Addon icon mapping by featureCode or addonCode
  addonIconMap: Record<string, LucideIconData> = {
    bankdata: Database,
    'positive-pay': ShieldCheck,
    'api-basic': Code,
    'manual-ach': Landmark,
    'check-draft': FileText,
    'api-monthly-v2': Code,
    'manual-ach-monthly-v2': Landmark,
    'checkdraft-monthly-v2': FileText
  };

  // Quantity options for V4SelectDropdown
  quantityOptions: IV4QuantityOption[] = Array.from(
    { length: 100 },
    (_, i) => ({
      id: String(i + 1),
      name: String(i + 1),
      value: String(i + 1)
    })
  );

  // Computed values
  selectedAddonList = computed(() => {
    const addons = this.selectedAddons();
    return Object.values(addons);
  });

  addonTotal = computed(() =>
    this.selectedAddonList().reduce(
      (sum, a) => sum + Number(a.details.price) * a.quantity,
      0
    )
  );

  billingIntervalLabel = computed(() => {
    const intervalType = this.effectiveIntervalType;
    return intervalType === 'years' ? 'Billed Yearly' : 'Billed Monthly';
  });

  // Billing form
  billingForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    companyName: ['', [Validators.required]],
    phone: ['', [Validators.required, ValidationService.phoneNumberValidator]],
    address: ['', [Validators.required, Validators.minLength(3)]],
    city: ['', [Validators.required, ValidationService.noWhitespaceValidator]],
    state: ['', [Validators.required, ValidationService.noWhitespaceValidator]],
    zip: ['', [Validators.required, ValidationService.zipValidator]],
    country: ['', [Validators.required]]
  });

  // Wallet form — the dropdown writes the full wallet object; uuId is read at submit.
  walletForm = this.fb.group({
    wallet: this.fb.control<IWalletData | null>(null, [Validators.required])
  });

  // Plan restriction lists
  private hideAddonsForSomePlansList = SelectedPlanCodes.planCodeList();
  private addonCodeExcludeList = SelectedAddonCodes.addonCodeList();

  ngOnInit(): void {
    this.loadInitialData();
    this.loadAllowedCountries();
    this.loadAppSettings();
  }

  private fireAnalyticsScripts(
    amount: string,
    invoiceId: string,
    planCode: string,
    paymentMethod: string
  ): void {
    const userId = this.localStorageService.getItem('userId');
    const orderId = `odr-${userId}-${invoiceId}`;
    const methodMap: Record<string, string> = {
      1: 'pay-card',
      2: 'pay-wallet'
    };

    this.scriptService.gtagSubscriptionEvent(
      methodMap[paymentMethod] || 'pay-card',
      amount
    );
    this.scriptService.emitOutBrainEvent(
      `'track', 'PURCHASE', { orderValue: ${amount}, currency: 'USD' }`
    );
    this.scriptService.onRunAwinCode(amount, orderId, planCode);
    this.scriptService.affiliateScript(amount, orderId, planCode);
    // this.scriptService.trackMatomoEvent(
    //   'Subscription',
    //   'Subscription_success',
    //   'Subscription_success',
    //   userId,
    //   { planCode }
    // );
  }

  /**
   * Load plan features and billing address in parallel.
   * currentPlan is either pre-fetched from the caller or obtained later
   * in initiatePayment() for edit mode — matching v3 behavior.
   */
  private loadInitialData(): void {
    const planFeature$ = this.subscriptionService.planFeatures(
      this.dialogData?.isFromTrial
    );
    const billing$ = this.subscriptionService.getBillingAddress();

    forkJoin([planFeature$, billing$])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isInitLoading.set(false))
      )
      .subscribe(([planFeatureRes, billingRes]) => {
        if (planFeatureRes?.success) {
          this.planFeatureAddonList = planFeatureRes.data;
        }

        if (billingRes?.success) {
          this.billingAddress = billingRes.data;
          this.populateBillingForm(billingRes.data);
        }

        this.filterAndSetAddons();
      });
  }

  /**
   * Load allowed countries for billing address
   */
  private loadAllowedCountries(): void {
    this.cloudBankService.allowedCountries
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.allowedCountries = Object.keys(res);
      });

    // Fetch from API if not already loaded (v4 layout doesn't fetch on init like v3 header does)
    if (this.allowedCountries.length === 0) {
      this.cloudBankService.getAllowedCountries()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.data) {
            this.cloudBankService.allowedCountries.next(res.data);
          }
        });
    }
  }

  /**
   * Load app settings for white-label branding
   */
  private loadAppSettings(): void {
    this.appSettingsService.appConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      });

    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.themeService
      .getThemeSwitch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dark) => this.isDarkMode.set(dark));
  }

  /**
   * Filter addons based on plan code restrictions, addon code exclusions,
   * and billing interval (yearly/monthly) — exact v3 logic
   */
  private filterAndSetAddons(): void {
    if (!this.planFeatureAddonList) return;

    const planCode = this.effectivePlanCode;
    const intervalType = this.effectiveIntervalType;
    if (!planCode) return;

    // Check if addons should be hidden for this plan
    const hideAddon = this.hideAddonsForSomePlansList.includes(planCode);

    const allAddons = this.planFeatureAddonList.addOns;

    // Filter out excluded addon codes
    const filteredByCode = allAddons.filter(
      (a) => !this.addonCodeExcludeList.includes(a.addonCode)
    );

    // Filter by interval type
    if (intervalType === 'years') {
      if (hideAddon) {
        this.addOnsList = filteredByCode.filter(
          (a) => a.intervalUnit === 'yearly'
        );
      } else {
        this.addOnsList = allAddons.filter((a) => a.intervalUnit === 'yearly');
      }
    } else if (hideAddon) {
      this.addOnsList = filteredByCode.filter(
        (a) => a.intervalUnit !== 'yearly'
      );
    } else {
      this.addOnsList = allAddons.filter((a) => a.intervalUnit !== 'yearly');
    }

    // Initialize quantity map for all addons
    this.addOnsList.forEach((addon) => {
      this.addonQuantities[addon.addonCode] = 1;
    });

    // Find selected plan details for billing summary
    this.selectedPlanDetails = this.planFeatureAddonList.plans.find(
      (p) => p.planCode === planCode
    );

    // Pre-select existing addons from currentPlan (matching v3 behavior)
    if (this.dialogData?.preSelectAddons !== false && this.dialogData?.currentPlan?.subscription?.addOn) {
      const current: Record<string, ISelectedAddOns> = {};
      this.dialogData.currentPlan.subscription.addOn.forEach((existingAddon) => {
        const matchingAddon = this.addOnsList.find(
          (a) => a.addonCode === existingAddon.addonCode
        );
        if (matchingAddon) {
          current[matchingAddon.addonCode] = {
            details: matchingAddon,
            quantity: Number(existingAddon.qnt)
          };
          this.addonQuantities[matchingAddon.addonCode] = Number(existingAddon.qnt);
        }
      });
      this.selectedAddons.set(current);
    }
  }

  /**
   * Populate billing form from existing billing address
   */
  private populateBillingForm(address: IBillingAddress): void {
    let { country } = address;
    if (country === 'United States') {
      country = 'US';
    }

    this.billingForm.patchValue({
      firstName:
        address.firstName || this.localStorageService.getItem('username'),
      lastName: address.lastName,
      companyName: address.companyName,
      phone: address.phone,
      address: address.addressLine1,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country
    });
  }

  /**
   * Get icon for an addon based on its featureCode
   */
  getAddonIcon(addon: IAddOns): LucideIconData {
    return this.addonIconMap[addon.featureCode] ?? this.addonIconMap[addon.addonCode] ?? this.CreditCardIcon;
  }

  /**
   * Check if an addon is selected
   */
  isAddonSelected(addonCode: string): boolean {
    return !!this.selectedAddons()[addonCode];
  }

  /**
   * Toggle addon selection
   */
  toggleAddon(addon: IAddOns): void {
    const current = { ...this.selectedAddons() };
    if (current[addon.addonCode]) {
      delete current[addon.addonCode];
    } else {
      current[addon.addonCode] = {
        details: addon,
        quantity: this.addonQuantities[addon.addonCode] || 1
      };
    }
    this.selectedAddons.set(current);
  }

  /**
   * Remove an addon
   */
  removeAddon(addon: IAddOns): void {
    const current = { ...this.selectedAddons() };
    delete current[addon.addonCode];
    this.selectedAddons.set(current);
  }

  /**
   * Handle quantity change for an addon
   */
  onQuantityChange(addonCode: string, value: string): void {
    const quantity = Number(value);
    this.addonQuantities[addonCode] = quantity;
    const current = { ...this.selectedAddons() };
    if (current[addonCode]) {
      current[addonCode] = {
        ...current[addonCode],
        quantity
      };
      this.selectedAddons.set(current);
    }
  }

  /**
   * Get current quantity for display
   */
  getQuantity(addonCode: string): string {
    return String(this.addonQuantities[addonCode] || 1);
  }

  /**
   * Handle address autocomplete selection
   */
  onAddressSelected(address: IGoogleAddress): void {
    this.billingForm.patchValue({
      address: address.address,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country
    });
  }

  /**
   * Pre-select the user's existing subscription wallet once the dropdown is
   * ready. The dropdown lazily loads the wallet by id if it is not already in
   * the list — same mechanism as the v3 subscription-payment screen.
   */
  autoPopulateWallet(ev: IV3DropDownOnReady): void {
    if (ev.setItemWithId && this.defaultWalletId()) {
      ev.setItemWithId(this.defaultWalletId());
    }
  }

  // ==================== NAVIGATION ====================

  /**
   * Step metadata for header display
   */
  getStepMeta(): { title: string; description: string } {
    const stepMap = {
      addons: {
        title: 'Now, Choose the Add-ons That You Need',
        description:
          'Select one or more add-ons and review the estimated monthly billing before checkout.'
      },
      billing: {
        title: 'Great! Provide the Billing Information',
        description:
          'Your invoice for the subscription will be created on this billing address.'
      },
      payment: {
        title: 'Select Payment Method',
        description:
          'Choose your preferred payment method to complete the addon purchase.'
      },
      complete: {
        title: 'Subscription',
        description: 'Review the completed add-on subscription setup.'
      }
    };
    return stepMap[this.step()];
  }

  /**
   * Handle primary button click (Proceed / Submit)
   */
  handlePrimaryAction(): void {
    const currentStep = this.step();

    if (currentStep === 'complete') {
      this.closeWithRefresh();
      return;
    }

    if (currentStep === 'addons') {
      if (!this.showBasePlan && this.addonTotal() <= 0) {
        this.showNoAddonAlert();
        return;
      }
      this.step.set('billing');
      return;
    }

    if (currentStep === 'billing') {
      this.billingForm.markAllAsTouched();
      if (this.billingForm.invalid) return;
      this.step.set('payment');
      this.initiatePayment();
      return;
    }

    if (currentStep === 'payment') {
      if (this.paymentMethod() === 'Wallet') {
        this.submitWalletPayment();
      }
    }
  }

  /**
   * Handle back button
   */
  handleBack(): void {
    const currentStep = this.step();
    if (currentStep === 'billing') {
      this.step.set('addons');
    } else if (currentStep === 'payment') {
      this.step.set('billing');
    }
  }

  /**
   * Get primary button label
   */
  getPrimaryLabel(): string {
    const step = this.step();
    if (step === 'addons') return 'Proceed to Checkout';
    if (step === 'billing') return 'Proceed to Payment';
    if (step === 'payment' && this.paymentMethod() === 'Wallet')
      return 'Pay Now';
    return 'Done';
  }

  /**
   * Check if primary button should be disabled
   */
  isPrimaryDisabled(): boolean {
    const step = this.step();
    if (step === 'addons') return false;
    if (step === 'payment' && this.paymentMethod() === 'Wallet')
      return this.walletForm.invalid || this.isPaymentLoading();
    return false;
  }

  close(): void {
    if (this.step() === 'complete') {
      this.closeWithRefresh();
      return;
    }

    const hasSelections = this.selectedAddonList().length > 0;
    const isNotFirstStep = this.step() !== 'addons';

    if (hasSelections || isNotFirstStep) {
      const alert = this.alertService.confirmAlert({
        content: 'Are you sure you want to leave this page?'
      });
      alert.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.scriptService.gtagEventScript('upgrade-plan-exit');
          this.dialogRef.close(false);
        }
      });
      return;
    }

    this.dialogRef.close(false);
  }

  closeWithRefresh(): void {
    this.dialogRef.close(true);
  }

  // ==================== PAYMENT LOGIC ====================

  /**
   * Build billing address body from form
   */
  private createBillingBody(): IBillingAddress {
    const d = this.billingForm.value;
    return {
      firstName: d.firstName || '',
      lastName: d.lastName || '',
      companyName: d.companyName || '',
      phone: d.phone || '',
      addressLine1: d.address || '',
      city: d.city || '',
      state: d.state || '',
      zip: d.zip || '',
      country: d.country || ''
    };
  }

  /**
   * Build addon payload: merge existing addons + newly selected addons
   * This is critical for Zoho Subscriptions backend
   */
  private buildAddonPayload(): IPayloadAddonData[] {
    const payloadAddons: IPayloadAddonData[] = [];
    const tempAddons: IPayloadAddonData[] = [];

    // 1. Push existing addons from current subscription
    if (this.currentPlan?.subscription?.addOn) {
      payloadAddons.push(
        ...this.currentPlan.subscription.addOn.map((existing) => ({
          addonCode: existing.addonCode,
          name: existing.addOnDetails.addonName,
          price: existing.addOnDetails.price,
          quantity: existing.qnt
        }))
      );
    }

    // 2. Merge newly selected addons
    const selectedList = this.selectedAddonList();
    selectedList.forEach((selected) => {
      const match = payloadAddons.find(
        (e) => e.addonCode === selected.details.addonCode
      );
      if (match) {
        match.quantity += selected.quantity;
      } else {
        tempAddons.push({
          addonCode: selected.details.addonCode,
          name: selected.details.addonName,
          price: selected.details.price,
          quantity: selected.quantity
        });
      }
    });

    return [...payloadAddons, ...tempAddons];
  }

  /**
   * Initiate payment - fetch fresh current plan data (v3 parity: getCurrentQuantity),
   * build addon payload, then load card iframe
   */
  private initiatePayment(): void {
    this.securedLoading.set(true);
    setTimeout(() => this.securedLoading.set(false), 3000);

    // First-time selection has no existing subscription to merge addons against,
    // so skip the refresh and build the payload directly.
    const refresh$ = this.dialogData?.initialPlanCode
      ? of(null)
      : this.subscriptionService.getCurrentPlans().pipe(catchError(() => of(null)));

    if (this.dialogData?.currentPlan) {
      this.currentPlan = this.dialogData.currentPlan;
    }

    refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res.data) {
          this.currentPlan = res.data;
        }
        this.builtAddonPayload = this.buildAddonPayload();

        this.applyDefaultWalletPayment();

        if (this.paymentMethod() === 'Card') {
          this.loadCardPayment();
        }
      });
  }

  /**
   * In the addon flow, when the user's existing subscription is billed via
   * wallet, pre-select the Wallet payment method and capture the wallet id so
   * the wallet dropdown can auto-populate it once ready. Skipped for first-time
   * plan selection, which has no prior payment method.
   */
  private applyDefaultWalletPayment(): void {
    const subscription = this.currentPlan?.subscription;
    if (
      subscription?.paymentMethod !== 'paywith_wallet' ||
      !subscription.wallet_id
    ) {
      return;
    }

    this.defaultWalletId.set(subscription.wallet_id);
    this.paymentMethod.set('Wallet');
  }

  /**
   * Check if user has an existing subscription (edit mode)
   * Mirrors v3 editMode logic for change-addon route
   */
  private get editMode(): boolean {
    return (
      this.router.url === '/v4/manage/subscription/plan/change' ||
      this.router.url === '/v4/manage/subscription/plan/change-addon' ||
      this.dialogData?.isFromProfile as boolean
    );
  }

  /**
   * Warn when proceeding with a $0 add-on total. "Go to Dashboard" closes the
   * modal and routes to the subscription dashboard; "OK" keeps them on the
   * add-on step.
   */
  private showNoAddonAlert(): void {
    this.alertService.confirmAlert({
      title: 'Add-on Required',
      content:
        'No add-ons have been selected for the existing plan. Please select at least one add-on before proceeding to checkout.',
      doneMsg: 'OK',
      icon: 'warn',
      isCancel:false
    });
  }

  /**
   * Plan code the modal is operating on. Prefers the caller-supplied
   * `initialPlanCode` (first-time plan selection) and falls back to the user's
   * current subscription plan (existing-subscription "change addons" flow).
   */
  private get effectivePlanCode(): string | undefined {
    return (
      this.dialogData?.initialPlanCode ??
      this.currentPlan?.subscription?.plan
    );
  }

  /** Billing interval the modal is operating on. See `effectivePlanCode`. */
  private get effectiveIntervalType(): string | undefined {
    return (
      this.dialogData?.initialIntervalType ??
      this.currentPlan?.subscription?.intervalUnit
    );
  }

  /**
   * Load card payment iframe URL from API
   * Uses create for new subscriptions, update for existing (v3 parity)
   */
  loadCardPayment(): void {
    this.cardLoading.set(true);
    this.isItDownGrade = false;

    const payload = {
      planCode: this.effectivePlanCode,
      addOns: this.builtAddonPayload,
      successPageUrl: `https://${window.location.host}/v4/manage/subscription/completed`,
      billingAddress: this.createBillingBody(),
      isFromTrial: this.dialogData?.isFromTrial || 0
    };

    const card$ = this.editMode
      ? this.subscriptionService.updateSubscriptionCard(payload, true)
      : this.subscriptionService.createSubscriptionCard(payload, true);

    card$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cardLoading.set(false)),
        catchError((e) => {
          if (e.error?.errorCode === 200) {
            this.isItDownGrade = true;
          } else {
            this.alertService.failedAlert({
              content: e.error?.errorMsg || 'Payment failed. Please try again.'
            });
          }
          return of(false);
        })
      )
      .subscribe((res) => {
        if (res?.success || res?.message?.url) {
          // update returns url in res.message.url, create in res.data.url
          const url = this.editMode
            ? res?.message?.url || res?.data?.url
            : res?.data?.url || res?.message?.url;
          if (url) {
            this.cardLink = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          }
        }
      });
  }

  /**
   * Submit wallet payment
   * Uses create for new subscriptions, update for existing (v3 parity)
   */
  submitWalletPayment(): void {
    this.walletForm.markAllAsTouched();
    if (this.walletForm.invalid) return;

    this.isPaymentLoading.set(true);

    const payload = {
      planCode: this.effectivePlanCode,
      addOns: this.builtAddonPayload,
      billingAddress: this.createBillingBody(),
      wallet: this.walletForm.value.wallet?.uuId ?? ''
    };

    const wallet$ = this.editMode
      ? this.subscriptionService.updateSubscriptionWallet(payload, true)
      : this.subscriptionService.createSubscriptionWallet(payload, true);

    wallet$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isPaymentLoading.set(false)),
        catchError((e) => {
          this.alertService.failedAlert({
            content: e.error?.errorMsg || 'Payment failed. Please try again.'
          });
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.store.dispatch(WalletsActions.walletsReset());
          const amount = this.addonTotal().toString();
          const planCode = this.effectivePlanCode || '';
          this.fireAnalyticsScripts(amount, '', planCode, '2');
          this.headerService.setHeaderValueChanged(true);
          this.dialogRef.close(false);
          this.router.navigate(['/v4/manage/subscription/completed'], {
            queryParams: {
              amount,
              planCode,
              paymentMethod: '2'
            }
          });
        }
      });
  }

  /**
   * Switch payment method and reload card if needed
   */
  switchPaymentMethod(method: 'Card' | 'Wallet'): void {
    this.paymentMethod.set(method);
    if (method === 'Card' && !this.cardLink) {
      this.loadCardPayment();
    }
  }
}

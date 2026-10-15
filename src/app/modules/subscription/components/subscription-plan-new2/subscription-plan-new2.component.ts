import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  output,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBuilding,
  faCreditCard,
  faCheck,
  faMoneyBillTransfer,
  faGlobe,
  faFileInvoiceDollar,
  faStar,
  faCity,
  faEarthAmericas,
  faSquareCheck,
  faTrophy,
  faWallet,
  faPhone,
  faPhoneArrowDownLeft,
  faMessage,
  faArrowLeft,
  faXmark,
  faBuildingColumns
} from '@fortawesome/pro-solid-svg-icons';
import { 
  faWallet as faWalletRegular , 
  faBank as faBankRegular , 
  faCreditCard as faCreditCardRegular,
  faBuilding as faBuildingColumnsRegular,
  faShieldCheck
} from '@fortawesome/pro-regular-svg-icons';


import { BehaviorSubject, Subject, Subscription, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { CommonCallMeComponent } from 'src/app/shared/v3/common-call-me/common-call-me.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { environment } from 'src/environments/environment';
import { CommonHelpButtonComponent } from 'src/app/layout/v3-layout/common-help-button/common-help-button.component';
import {
  IChoosePlan,
  ICurrentSubscriptionPlan,
  IPlanFeaturesAddonsListWithBill,
  IPlanWithFeatureList,
  SubscriptionPlanName
} from '../../model/subscription';

interface PlanFeature {
  text: string;
  highlight?: string;
}

interface Plan {
  id: string;
  icon: IconDefinition;
  title: string;
  description: string;
  priceLabel: string;
  price: string;
  priceSubtext: string;
  features: PlanFeature[];
  buttonText: string;
  isBestValue?: boolean;
  isPrimary?: boolean;
}

interface ComparisonValue {
  text: string;
  highlight?: string;
  suffix?: string;
  isFree?: boolean;
  isBadge?: boolean;
  isCallForPricing?: boolean;
}

interface ComparisonRow {
  feature: string;
  bankAccount: ComparisonValue;
  zilWallet: ComparisonValue;
  creditCard: ComparisonValue;
  enterprise: ComparisonValue;
}

interface ComparisonSection {
  title: string;
  icon: IconDefinition;
  rows: ComparisonRow[];
}

@Component({
  selector: 'app-subscription-plan-new2',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FontAwesomeModule,
    MatDialogModule,
    MatTooltipModule,
    CommonHelpButtonComponent
  ],
  templateUrl: './subscription-plan-new2.component.html',
  styleUrl: './subscription-plan-new2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionPlanNew2Component implements OnInit, OnDestroy {
  // Inputs
  @Input({ required: true }) currentPlanInput!: BehaviorSubject<
    ICurrentSubscriptionPlan | undefined
  >;

  @Input({ required: true }) planFeaturesInput!: BehaviorSubject<
    IPlanFeaturesAddonsListWithBill | undefined
  >;

  // Outputs
  selectPlan = output<IChoosePlan>();

  // Services
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private localStorageService = inject(LocalStorageService);
  private subscriptionService = inject(SubscriptionService);
  private alertService = inject(AlertService);
  private scriptService = inject(ScriptService);
  private clickTrackingService = inject(ClickTrackingService);
  private location = inject(Location);

  // State
  currentPlan: SubscriptionPlanName | undefined;
  currentPlanDetails: ICurrentSubscriptionPlan | undefined;
  planData: Partial<Record<SubscriptionPlanName, IPlanWithFeatureList>> = {};
  availablePlans: SubscriptionPlanName[] = [];
  private destroy$ = new Subject<void>();
  subscriptions: Subscription[] = [];

  // Signals
  showPayAsYouGo = signal<boolean>(false);
  isMonthlyPlan = signal(false);
  isYearlyPlan = signal(false);

  // Enterprise Plans
  enterPrisePlan: IPlanWithFeatureList[] = [];
  enterPriseMonthlyPlanCode?: SubscriptionPlanName;
  enterPriseYearlyPlanCode?: SubscriptionPlanName;
  savedAmount = 0;

  // Page state
  fromType: string | undefined;
  pageUrl: string | undefined;
  isOutside = false;
  outsidePage = false;
  loadingContent = false;
  autoClickOnPlan = false;
  screenWidth: number = 0;
  isOlliePay = false;

  // Support
  supportNo = StaticWhiteLabelConditions.customerSupportNo;
  supportOptions = [
    { id: 'call', name: 'Call', icon: faPhone },
    { id: 'call_back', name: 'Callback', icon: faPhoneArrowDownLeft },
    { id: 'chat', name: 'Chat', icon: faMessage }
  ] as const;

  // Icons
  faCheck = faCheck;
  faStar = faStar;
  faCity = faCity;
  faEarthAmericas = faEarthAmericas;
  faSquareCheck = faSquareCheck;
  faBuilding = faBuilding;
  faTrophy = faTrophy;
  faWallet = faWallet;
  faPhone = faPhone;
  faPhoneArrowDownLeft = faPhoneArrowDownLeft;
  faMessage = faMessage;
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faBuildingColumns = faBuildingColumns;
  faBuildingColumnsRegular = faBuildingColumnsRegular;
  faShieldCheck = faShieldCheck;

  constructor() {
    if (this.router.url.includes('outside')) {
      this.outsidePage = true;
    }
  }

  plans: Plan[] = [
    {
      id: 'bank-account',
      icon: faBankRegular,
      title: 'Use Your Bank Account',
      description: 'Connect your bank account to originate or request payments',
      priceLabel: 'Initial Credit Purchase',
      price: '$30',
      priceSubtext: 'Then rechargeable',
      features: [
        { text: '3 Bank Accounts*****' },
        { text: '3 Users*****' },
        { text: 'Positive Pay: $199/account' },
        { text: 'Full Integration Suite' }
      ],
      buttonText: 'Get Started',
      isPrimary: false
    },
    {
      id: 'zil-wallet',
      icon: faWalletRegular,
      title: 'Zil Money Wallet',
      description:
        'Fund your wallet to originate and receive payments with zero fees on eligible transactions*',
      priceLabel: 'Transaction Fees',
      price: '$0*',
      priceSubtext: 'On eligible transactions',
      features: [
        { text: ' on deposits*', highlight: '2% Cash Back' },
        { text: ' Bank Accounts', highlight: 'Unlimited' },
        { text: ' Users', highlight: 'Unlimited' },
        { text: ' Positive Pay', highlight: 'Free' },
        { text: ' on cards', highlight: '1% Cash Back' },
        { text: ' (First 5 domestic / 2 intl)', highlight: 'Free Wires' }
      ],
      buttonText: 'Start Paying Zero Fees',
      isBestValue: true,
      isPrimary: true
    },
    {
      id: 'credit-card',
      icon: faCreditCardRegular,
      title: 'Use Your Credit Card',
      description:
        "Pay any business expense on your card —even if beneficiary doesn't accept cards**",
      priceLabel: 'Processing Fee',
      price: '2.9%',
      priceSubtext: '+ delivery method fees',
      features: [
        { text: 'Earn credit card rewards' },
        { text: '30-45 day cash flow extension' },
        { text: '3 Users*****' },
        { text: 'Full Integration Suite' }
      ],
      buttonText: 'Get Started',
      isPrimary: false
    },
    {
      id: 'enterprise',
      icon: faBuildingColumnsRegular,
      title: 'Enterprise',
      description:
        'Bespoke, white-label, and API-driven solutions with custom pricing',
      priceLabel: 'Custom Pricing',
      price: 'Call for Details',
      priceSubtext: '',
      features: [
        { text: 'Dedicated Account Manager' },
        { text: 'Payments/Banking API' },
        { text: 'White-label Capability' },
        { text: 'Own Server Option' }
      ],
      buttonText: 'Contact Sales',
      isPrimary: false
    }
  ];

  comparisonSections: ComparisonSection[] = [
    {
      title: 'CASH BACK',
      icon: faCreditCard,
      rows: [
        {
          feature: 'Cash Back on Deposits',
          bankAccount: { text: '—' },
          zilWallet: { text: '2%*', isBadge: true },
          creditCard: { text: '—' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Cash Back on Spending',
          bankAccount: { text: '—' },
          zilWallet: { text: '—' },
          creditCard: { text: 'Based on your credit card rewards' },
          enterprise: { text: '—' }
        }
      ]
    },
    {
      title: 'DOMESTIC TRANSFERS',
      icon: faMoneyBillTransfer,
      rows: [
        {
          feature: 'ACH / Direct Deposit',
          bankAccount: { text: '1% (Max $5.00)' },
          zilWallet: { text: 'FREE', isFree: true },
          creditCard: { text: '1% (Max $5.00)' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Same Day ACH / Direct Deposit',
          bankAccount: { text: '1% (Max $10.00)' },
          zilWallet: { text: 'FREE', isFree: true },
          creditCard: { text: '1% (Max $10.00)' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Instant Payment (RTP)',
          bankAccount: { text: 'Not Available' },
          zilWallet: { text: 'FREE', isFree: true },
          creditCard: { text: '1% (Max $20.00)' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Domestic Wire',
          bankAccount: { text: '$10.00' },
          zilWallet: {
            text: 'First 5 Free',
            highlight: 'First 5 Free',
            suffix: ' then $10.00'
          },
          creditCard: { text: '$10.00' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'International Wire',
          bankAccount: { text: '$25.00' },
          zilWallet: {
            text: 'First 2 Free',
            highlight: 'First 2 Free',
            suffix: ' then $25.00'
          },
          creditCard: { text: '$25.00' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        }
      ]
    },
    {
      title: 'CARD PAYMENTS',
      icon: faCreditCard,
      rows: [
        {
          feature: 'Virtual Card',
          bankAccount: { text: 'Free', isFree: true },
          zilWallet: { text: '1% Cash Back', isBadge: true },
          creditCard: { text: 'Free', isFree: true },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Physical Card',
          bankAccount: { text: 'Free', isFree: true },
          zilWallet: { text: '1% Cash Back', isBadge: true },
          creditCard: { text: 'Free', isFree: true },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Pay by Credit Card**',
          bankAccount: { text: '—' },
          zilWallet: { text: '—' },
          creditCard: { text: '2.9%' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        }
      ]
    },
    {
      title: 'CHECKS',
      icon: faFileInvoiceDollar,
      rows: [
        {
          feature: 'Check Creation - Print',
          bankAccount: { text: '$1.00' },
          zilWallet: { text: 'FREE', isFree: true },
          creditCard: { text: '—' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Check Creation - Email / eCheck',
          bankAccount: { text: '$1.00' },
          zilWallet: { text: 'FREE', isFree: true },
          creditCard: { text: '$1.00' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Check Creation - Mailing',
          bankAccount: { text: '$1.00 + Mailing Rate' },
          zilWallet: {
            text: 'FREE',
            highlight: 'FREE',
            suffix: ' + Mailing Rate'
          },
          creditCard: { text: '$1.00 + Mailing Rate' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: "Cashier's Check***",
          bankAccount: { text: 'Free', isFree: true },
          zilWallet: { text: 'FREE', isFree: true },
          creditCard: { text: '—' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        }
      ]
    },
    {
      title: 'CURRENCY & OTHER',
      icon: faGlobe,
      rows: [
        {
          feature: 'Currency Conversion',
          bankAccount: { text: 'Wholesale FX Rate + 0.50%' },
          zilWallet: {
            text: 'Wholesale FX Rate + 0.20%',
            highlight: 'Wholesale FX Rate + 0.20%'
          },
          creditCard: { text: 'Wholesale FX Rate + 0.20%' },
          enterprise: { text: 'Call for Pricing', isCallForPricing: true }
        },
        {
          feature: 'Let Vendor Decide******',
          bankAccount: { text: 'Vendor pays withdrawal rates' },
          zilWallet: { text: 'Vendor pays withdrawal rates' },
          creditCard: { text: 'Vendor pays withdrawal rates' },
          enterprise: { text: '—' }
        }
      ]
    }
  ];

  receiveMoneyRows: ComparisonRow[] = [
    {
      feature: 'ACH / Direct Deposit',
      bankAccount: { text: '1% (Max $5.00)' },
      zilWallet: { text: 'FREE', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Same Day ACH / Direct Deposit',
      bankAccount: { text: '1% (Max $10.00)' },
      zilWallet: { text: 'FREE', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Instant Payment (RTP)',
      bankAccount: { text: '1% (Max $30.00)' },
      zilWallet: { text: 'FREE', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Domestic Wire',
      bankAccount: { text: '$10.00' },
      zilWallet: { text: 'FREE', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'International Wire',
      bankAccount: { text: '$25.00' },
      zilWallet: { text: 'FREE', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Get Paid by Credit Card',
      bankAccount: { text: '2.9%' },
      zilWallet: { text: '2.9%' },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Check Draft',
      bankAccount: { text: '1% (Max $10.00)' },
      zilWallet: { text: 'FREE', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Currency Conversion',
      bankAccount: { text: 'Wholesale FX Rate + 0.50%' },
      zilWallet: {
        text: 'Wholesale FX Rate + 0.20%',
        highlight: 'Wholesale FX Rate + 0.20%'
      },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    }
  ];

  withdrawalRates: {
    name: string;
    rate: string;
    isFree?: boolean;
    suffix?: string;
  }[] = [
    { name: 'ACH / Direct Deposit', rate: 'FREE', isFree: true },
    { name: 'Same Day ACH', rate: '1% (Max $20)' },
    { name: 'Instant Payment (RTP)', rate: '1% (Max $30)' },
    { name: 'Domestic Wire', rate: '$10.00' },
    { name: 'International Wire', rate: '$25.00' },
    { name: 'Virtual Card', rate: 'FREE', isFree: true },
    { name: 'Physical Card', rate: 'FREE', isFree: true },
    { name: 'Check Print', rate: 'FREE', isFree: true },
    { name: 'Check Email / eCheck', rate: 'FREE', isFree: true },
    { name: 'Check Mail', rate: 'FREE', isFree: true, suffix: ' + Mailing' }
  ];

  domesticMailingRates: { name: string; price: string }[] = [
    { name: 'USPS First Class', price: '$1.25' },
    { name: 'First Class Canada', price: '$2.99' },
    { name: 'First Class with Tracking', price: '$7.50' },
    { name: 'Priority Mail USPS', price: '$12.99' },
    { name: 'FedEx Overnight', price: '$24.99' },
    { name: 'FedEx Overnight Canada', price: '$24.99' },
    { name: 'Express Mail', price: '$34.99' },
    { name: 'Document Attachment', price: '$1.00' }
  ];

  internationalMailingRates: { name: string; price: string }[] = [
    { name: 'First Class Canada', price: '$2.99' },
    { name: 'First Class International', price: '$4.99' },
    { name: 'FedEx Overnight Canada', price: '$24.99' },
    { name: 'FedEx International', price: '$59.99' }
  ];

  platformFeatures: ComparisonRow[] = [
    {
      feature: 'Attached Bank Accounts*****',
      bankAccount: { text: '3' },
      zilWallet: { text: 'Unlimited', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Users*****',
      bankAccount: { text: '3' },
      zilWallet: { text: 'Unlimited', isFree: true },
      creditCard: { text: '3' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    },
    {
      feature: 'Positive Pay (Per Account/Wallet)',
      bankAccount: { text: '$199' },
      zilWallet: { text: 'FREE', isFree: true },
      creditCard: { text: '—' },
      enterprise: { text: 'Call for Pricing', isCallForPricing: true }
    }
  ];

  includedInAllPlans: string[] = [
    'Full Integration Suite',
    'Accounting Software Integrations',
    'Receive Payment Links',
    'Recurring Payments (Send/Receive)',
    'Cloud Banking',
    'Bill & Invoice Management',
    'Vendor Credits & Credit Memos',
    'Business Tools',
    'Deposit Slip and Cash Expense',
    'Bank Data Aggregation'
  ];

  enterpriseOnlyFeatures: string[] = [
    'Check Draft / Manual ACH',
    'Dedicated Account Manager',
    'Payments/Banking API Access',
    'White-label Capability',
    'Embedded Payments',
    'Own Server Option',
    'Customized Email Templates',
    'Premium Check & Invoice Templates',
    'Custom Data Retention Policies'
  ];

  whyChooseWallet: string[] = [
    'Zero fees on most payment methods',
    '2% cash back on deposits*',
    'Unlimited users & bank accounts',
    'Free Positive Pay ($199 value)',
    '1% cash back on cards',
    'Lower FX rates (0.20% vs 0.50%)',
    'Free instant payments (RTP)',
    'Free check creation (all types)',
    'Free wires (first 5 domestic / 2 intl)'
  ];

  footnotes: { symbol: string; title: string; description: string }[] = [
    {
      symbol: '*',
      title: 'Cash Back on Deposits:',
      description:
        'Based on the beginning daily balance. The beginning balance will generate 2% cash back on an annualized rate, with incentives delivered monthly. $10,000 Average Monthly Balance Required.'
    },
    {
      symbol: '**',
      title: 'Pay by Credit Card:',
      description:
        '2.90% processing fee for the card + delivery fees based on the payment method chosen. Example: Bank Account Plan with ACH delivery = 2.90% + 1% delivery fee (Max $5.00).'
    },
    {
      symbol: '***',
      title: "Cashier's Checks:",
      description:
        "Zil Money pulls payment amount from outside account or wallet to provide a cashier's check."
    },
    {
      symbol: '****',
      title: 'Receive Payments:',
      description:
        'Any received payment can be charged to the payor instead of to your account.'
    },
    {
      symbol: '*****',
      title: 'Additional Accounts/Users:',
      description:
        'Can purchase more accounts/users. Not applicable to Wallet users who receive unlimited accounts and users.'
    },
    {
      symbol: '******',
      title: 'Let Vendor Decide:',
      description:
        'Vendor pays withdrawal delivery rates based on Wallet withdrawal rates shown above.'
    }
  ];

  disclosures: { title: string; description: string }[] = [
    {
      title: 'Important Disclosure:',
      description:
        'Zil Money is a financial technology company, not a bank or an FDIC member. Zil Money offers banking services through partnership with FDIC member banks Silicon Valley Bank and Texas National Bank. Customers are not directly insured by the FDIC but through the pass-through coverage of our partner banks, conditional on proper titling, record-keeping, and custodial arrangements.'
    },
    {
      title: '$0 Transaction Fees:',
      description:
        '$0 transaction fees on eligible payments only when using Zil Money Wallet. Cash back on qualifying transactions requires $10,000 average monthly balance; incentives delivered monthly. Credit card processing fees apply to vendor and payroll credit card payments. Terms apply. Visit zilmoney.com/terms'
    }
  ];

  ngOnInit(): void {
    if (environment.env_id === 'olliepay') {
      this.isOlliePay = true;
    }

    this.autoClickOnPlan = this.localStorageService.getItem('autoClickPlan');
    this.scriptService.addZohoSrcipt();
    this.screenWidth = window.innerWidth;

    // Subscribe to current plan
    this.currentPlanInput.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      if (!val) return;
      this.currentPlanDetails = val;
      this.currentPlan = val.subscription?.plan;
      this.cdr.markForCheck();
    });

    // Subscribe to plan features
    this.planFeaturesInput.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      if (!val) return;

      this.planData = val.plans.reduce<
        Partial<Record<SubscriptionPlanName, IPlanWithFeatureList>>
      >((obj, el) => {
        const item = obj;
        item[el.planCode] = el;
        return item;
      }, {});

      // Handle Enterprise Plans
      const monthlyPlan = this.planData?.['enterprise-custom-monthly-v2'];
      const yearlyPlan = this.planData?.['enterprise-custom-yearly-v2'];

      this.enterPrisePlan = [];
      if (monthlyPlan) {
        this.enterPrisePlan.push(monthlyPlan);
      }
      if (yearlyPlan) {
        this.enterPrisePlan.push(yearlyPlan);
      }

      this.enterPrisePlan.forEach((el) => {
        if (el.planCode === 'enterprise-custom-monthly-v2') {
          this.enterPriseMonthlyPlanCode = el.planCode;
        } else {
          this.enterPriseYearlyPlanCode = el.planCode;
        }
      });

      // Calculate saved amount for yearly vs monthly
      if (this.enterPrisePlan.length === 2) {
        const monthlyAmount = this.enterPrisePlan?.[0]?.planPrice;
        const yearlyWithoutOffer = Number(monthlyAmount) * 12;
        const yearlyWithOffer = this.enterPrisePlan?.[1]?.planPrice;
        this.savedAmount = yearlyWithoutOffer - Number(yearlyWithOffer);
      }

      this.availablePlans = [...val.plans.map((el) => el.planCode)];
      if (this.availablePlans?.length) {
        this.isMonthlyPlan.set(
          this.availablePlans.includes('enterprise-custom-monthly-v2')
        );
        this.isYearlyPlan.set(
          this.availablePlans.includes('enterprise-custom-yearly-v2')
        );
      }

      this.cdr.markForCheck();

      if (!this.outsidePage) {
        this.isShowPayAsYouGo();
      }
    });

    // Handle query params
    this.fromType = this.route.snapshot.queryParams?.from;
    this.pageUrl = this.route.snapshot.queryParams?.page;
    if (this.pageUrl && this.pageUrl.startsWith('/')) {
      this.pageUrl = this.pageUrl.substring(1);
    }

    if (this.fromType) {
      this.isOutside = true;
    }

    if (this.outsidePage) {
      this.isShowPayAsYouGo();
    }
  }

  /**
   * Check if Pay As You Go should be shown
   */
  isShowPayAsYouGo(): void {
    if (this.router.url.includes('outside')) {
      this.showPayAsYouGo.set(true);
      return;
    }
    this.subscriptions.push(
      this.subscriptionService.isShowPayAsYouGo().subscribe((res) => {
        if (res.data?.hidePayAsYouGo === 1) {
          this.showPayAsYouGo.set(false);
        } else {
          this.showPayAsYouGo.set(true);
          if (this.autoClickOnPlan) {
            this.choosePlan('pay-as-you-go-monthly-v3');
          }
        }
      })
    );
  }

  /**
   * Check if current plan is Pay As You Go
   * All 3 cards (Bank Account, Zil Wallet, Credit Card) share this plan
   */
  isPayAsYouGoPlan(): boolean {
    return this.currentPlan === 'pay-as-you-go-monthly-v3';
  }

  /**
   * Check email/phone verification before plan selection
   */
  checkEmailPhoneVerified(): boolean {
    const isRedirectedFromOutside = this.route.snapshot.queryParams?.redirected;
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');

    if (
      phoneVerified === 0 ||
      (emailVerified === 0 && isRedirectedFromOutside === '1')
    ) {
      this.router.navigateByUrl(
        'manage/users/verify-email-phone?returnUrl=manage/subscription/plan'
      );
      return true;
    }
    return false;
  }

  /**
   * Handle plan selection for Bank Account, Zil Wallet, and Credit Card
   * All three emit 'pay-as-you-go-monthly-v3' plan code
   */
  choosePlan(planCode?: SubscriptionPlanName): void {
    // Handle outside pricing page
    if (this.router.url.includes('/outside/pricing-plan')) {
      if (!this.localStorageService.appToken) {
        this.handleNoAppToken();
        return;
      }
      this.loadingContent = true;
      this.localStorageService.setItem('autoClickPlan', 1);

      if (this.checkEmailPhoneVerified()) {
        return;
      }

      this.navigateToManageSubscriptionPlan();
      return;
    }

    if (!planCode) return;

    // Check email/phone verification
    if (this.checkEmailPhoneVerified()) {
      return;
    }

    const plan = this.planData[planCode];
    if (!plan) return;

    this.selectPlan.emit({
      success: true,
      data: {
        planCode: plan.planCode,
        intervelType: plan.billIntervalUnit ?? 'months',
        nextStep: 'addOns',
        currentPlan: this.currentPlanDetails,
        allData: this.planFeaturesInput.value,
        hideAddon: this.availablePlans.includes(plan.planCode)
      }
    });
  }

  /**
   * Handle when there's no app token (not logged in)
   */
  private handleNoAppToken(): void {
    if (this.fromType === 'zm') {
      window.location.href = 'https://app.zilmoney.com/register';
    } else if (this.fromType === 'ocw') {
      this.router.navigateByUrl('/register');
    }
  }

  /**
   * Navigate to manage subscription plan page
   */
  private navigateToManageSubscriptionPlan(): void {
    const targetUrl = `/manage/subscription/plan?redirected=1&from=${
      this.fromType
    }&page=${this.pageUrl ?? ''}`;
    this.router.navigateByUrl(targetUrl);
  }

  /**
   * Handle plan selection from card click
   * Maps card ID to the appropriate plan code
   */
  onPlanSelect(plan: Plan): void {
    if (plan.id === 'enterprise') {
      this.onContactSales();
      return;
    }

    // Bank Account, Zil Wallet, and Credit Card all use pay-as-you-go-monthly-v3
    this.choosePlan('pay-as-you-go-monthly-v3');
  }

  /**
   * Handle support option clicks
   */
  onSupportClick(id: (typeof this.supportOptions)[number]['id']): void {
    if (id === 'call') {
      document.location.href = `tel:${StaticWhiteLabelConditions.customerSupportNo}`;
      return;
    }

    if (id === 'chat') {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
      return;
    }

    if (id === 'call_back') {
      this.openCallMeModal();
    }
  }

  /**
   * Open Call me now modal
   */
  openCallMeModal(): void {
    const dialogRef = this.dialog.open(CommonCallMeComponent, {
      width: '350px',
      maxWidth: '90%',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            content: `Thank you for requesting a callback. We'll be in touch with you shortly. Expect a call from us soon.`,
            close: false,
            isOk: true
          });
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Handle Enterprise "Contact Sales" button click
   * Opens the Call Me modal
   */
  onContactSales(): void {
    this.openCallMeModal();
  }

  /**
   * Handle Start Free Trial button click
   * Same as choosePlan with 'pay-as-you-go-monthly-v3'
   */
  onStartFreeTrial(): void {
    this.choosePlan('pay-as-you-go-monthly-v3');
  }

  /**
   * Handle Talk to Sales button click
   * Opens the Call Me modal
   */
  onTalkToSales(): void {
    this.onContactSales();
  }

  /**
   * Handles the 'Book Now' button click event
   */
  onBookNow(): void {
    // Track when clicked on book a demo
    if (this.localStorageService.appToken) {
      this.clickTrackingService.trackBookDemoClick()?.pipe(take(1)).subscribe();
    }

    if (this.router.url.includes('/outside/pricing-plan')) {
      if (this.fromType === 'ocw') {
        window.open('https://calendly.com/zmn/demo?utm_source=ocwui');
      } else if (this.fromType === 'zm') {
        window.open('https://calendly.com/zmn/demo?utm_source=zmui');
      }
    } else {
      window.open('https://calendly.com/zmn/demo?utm_source=ocwui');
    }
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    this.subscriptionService.closeSubscriptionPage();
  }

  /**
   * Handle go back navigation
   */
  goBack(): void {
    if (this.router.url.includes('/outside/pricing-plan')) {
      if (this.fromType === 'zm') {
        window.location.href = `https://zilmoney.com/${this.pageUrl ?? ''}`;
      } else if (this.fromType === 'ocw') {
        window.location.href = `https://onlinecheckwriter.com/${
          this.pageUrl ?? ''
        }`;
      }
    } else {
      this.location.back();
    }
  }

  /**
   * Open fee calculator
   */
  onCalculateFee(): void {
    window.open('/outside/fee-calculator');
  }

  /**
   * Choose enterprise plan (monthly or yearly)
   */
  chooseEnterprisePlan(type: 'monthly' | 'yearly'): void {
    if (type === 'monthly' && this.enterPriseMonthlyPlanCode) {
      this.choosePlan(this.enterPriseMonthlyPlanCode);
    } else if (type === 'yearly' && this.enterPriseYearlyPlanCode) {
      this.choosePlan(this.enterPriseYearlyPlanCode);
    }
  }

  /**
   * Check if enterprise plan is custom pricing type
   */
  isCustomPricing(): boolean {
    return this.enterPrisePlan?.[0]?.planCategoryType === 4 || this.isOutside;
  }

  ngOnDestroy(): void {
    this.scriptService.hideZohoChat();
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

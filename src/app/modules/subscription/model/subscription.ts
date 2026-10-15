export interface IPlans {
  billInterval: number;
  billIntervalUnit: 'months' | 'years';
  description: string;
  id: string;
  isActive: string;
  planCategoryType: number;
  planCode: string;
  planDescription: string;
  planName: string;
  planPrice: string;
  trialPeriodDays: number;
}
export interface IPlanList {
  id: string;
  planName: string;
  planCode: string;
  planPrice: string;
  billInterval: number;
  billIntervalUnit: string;
  description: string;
  trialPeriodDays: number;
  planDescription: string;
  planCategoryType: number;
  isActive: string;
}
export interface IPlanWithFeatureList {
  id: string;
  planName: string;
  planCode: SubscriptionPlanName;
  planPrice: string;
  anchorPrice: number;
  monthlyPrice: number;
  billIntervalUnit: 'months' | 'years';
  freeCredit: number;
  planCategoryType: number;
  planTransactionFee: string;
  planDynamicTexts?: ITextLines[];
  planFeatures?: IPlanFeatures[];
  freeAddonFeatures?: IPlanFeatures[];
}
export interface IPlanFeatures {
  featureName: string;
  featureCode: string;
  featureType: number;
  featureCategoryType: number;
  planFeatureTransactionFee: string;
  quantity?: number;
  featureDisplayText: string;
  featureDynamicTexts: ITextLines;
}

export interface IAddOns {
  addonCategoryType: number;
  addonCode: string;
  addonName: string;
  addonQuantityType: number;
  addonType: string;
  description: string;
  detailedDescription: string;
  featureCode: string;
  id: string;
  intervalUnit: string;
  price: string;
  pricingScheme: string;
  unitName: string;
}

export interface ICurrentSubscriptionPlan {
  amount: string;
  name: string;
  subscription: {
    cardExpireMonth: string;
    cardExpireYear: string;
    cardExpirezip: string;
    cardLastFour: string;
    currentTermEndsAt: string;
    currentTermStartsAt: string;
    endsAt: string;
    id: string;
    interval: number;
    intervalUnit: 'months' | 'years';
    name: string;
    paymentMethod:
      | 'paywith_check'
      | 'paywith_wallet'
      | 'authorize_net'
      | 'payflow_pro';
    paypalEmail: string;
    plan: SubscriptionPlanName;
    wallet: string;
    wallet_id: string;
    addOn: ICurrentAddOns[];
  };
}

export interface ICurrentAddOns {
  id: string;
  qnt: number;
  addonCode: string;
  plan: string;
  startDate: string;
  endAt: string;
  addOnDetails: {
    id: string;
    addonName: string;
    addonCode: string;
    addonDisplayText: string;
    price: string;
    anchorPrice: string;
    monthlyPrice: string;
    pricingScheme: string;
    unitName: string;
    addonType: string;
    intervalUnit: string;
    description: string;
    detailedDescription: string;
    addonQuantityType: number;
    addonCategoryType: number;
    featureCode: string;
    addonDynamicTexts: IAddonDynamicTexts;
  };
}

export interface IFeatures {
  detailsDescription: string;
  featureCode: string;
  featureName: string;
  featureStatus: number;
  featureType: number;
  id: string;
  shortDescription: string;
}

export interface ITextLines {
  textLine1: string;
  textLine2: string;
  textLine3: string;
  textLine4: string;
  textLine5: string;
}

export interface IBillingAddress {
  firstName: string;
  lastName: string;
  companyName: string;
  addressLine1: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
export interface IPlanFeaturesAddonsList {
  plans: IPlanWithFeatureList[];
  addOns: IAddOns[];
}

export interface IPlanFeaturesAddonsListWithBill
  extends IPlanFeaturesAddonsList {
  billingAddress: IBillingAddress;
}

export interface IComparisonData {
  plans: IPlans[];
  features: IFeatures[];
  'plan-feature-info': ISubscriptionPlanGroup;
}

export interface IChoosePlan {
  success: true;
  data: {
    planCode: string;
    intervelType: 'months' | 'years';
    nextStep: SubPageSteps;
    currentStep?: SubPageSteps;
    currentPlan?: ICurrentSubscriptionPlan;
    selectedAddon?: ISelectedAddOns[];
    allData?: IPlanFeaturesAddonsList;
    billingAddress?: IBillingAddress;
    grandTotal?: number;
    currentQnt?: unknown;
    hideAddon?: boolean;
    currentSlide?: SubPageSteps;
  };
}

export type SubPageSteps =
  | 'addOns'
  | 'billingAddress'
  | 'payment'
  | 'pricing_table';

export interface ISelectedAddOns {
  details: IAddOns;
  quantity: number;
}

export interface IPaymentType {
  [key: string]: string;
}

export interface IPaymentMethodList {
  [key: string]: string;
}

export interface ISubscriptionOffers {
  [key: number]: { offerPerc: number; value: number };
}

export interface ISubscriptionData {
  name: string;
  amount: string;
  subscription: ISubscription;
}

export interface ISubscription {
  id: string;
  name: string;
  endsAt: string;
  plan: string;
  status: number;
  paymentMethod: string;
  paypalEmail: unknown;
  cardLastFour: string;
  cardExpireMonth: string;
  cardExpirezip: string;
  cardExpireYear: string;
  currentTermStartsAt: string;
  currentTermEndsAt: string;
  interval: number;
  intervalUnit: string;
  wallet: string;
  addOn: IAddOn[];
  wallet_available_balance: string;
}

export interface IAddOn {
  id: string;
  qnt: number;
  addonCode: string;
  plan: string;
  startDate: string;
  endAt: string;
  addOnDetails: IAddOnDetails;
}

export interface IAddOnDetails {
  id: string;
  addonName: string;
  addonCode: string;
  addonDisplayText: string;
  price: string;
  anchorPrice: string;
  monthlyPrice: string;
  pricingScheme: string;
  unitName: string;
  addonType: string;
  intervalUnit: string;
  description: string;
  detailedDescription: string;
  addonQuantityType: number;
  addonCategoryType: number;
  featureCode: string;
  addonDynamicTexts: IAddonDynamicTexts;
}

export interface IAddonDynamicTexts {
  textLine1: string;
  textLine2: string;
}
export interface IPayloadAddonData {
  addonCode: string;
  name: string;
  price: string;
  quantity: number;
}

export type ISubscriptionPlanGroup = Record<
  SubscriptionPlanName,
  SubscriptionPlan
>;

export interface SubscriptionPlan {
  'check-create': string;
  'physical-mail': string;
  'bankaccount-create': string;
  'user-create': string;
  'emailcheck-create': string;
  'ach-create': string;
  'directdeposit-create': string;
  'own-mail-server-create': string;
  'custom-email-template-create': string;
  'api-basic': string;
  'positive-pay-create': string;
  bankdata: string;
  'own-mail-server': string;
  'custom-email-template': string;
}

export interface ISubscriptionPlanAddOn {
  id: string;
  addonName: string;
  addonCode: string;
  addonDisplayText: string;
  price: string;
  anchorPrice: string;
  monthlyPrice: string;
  pricingScheme: string;
  unitName: string;
  addonType: string;
  intervalUnit: string;
  description: string;
  detailedDescription: string;
  addonQuantityType: number;
  addonCategoryType: number;
  featureCode?: string;
  addonDynamicTexts: AddonDynamicTexts;
}

interface AddonDynamicTexts {
  textLine1: string;
  textLine2: string;
}

export type SubscriptionPlanName =
  | 'pay-as-you-go-monthly-v3'
  | 'basic-monthly-v3'
  | 'business-monthly-v3'
  | 'business-plus-monthly-v3'
  | 'enterprise-custom-monthly-v2'
  | 'enterprise-custom-yearly-v2'
  | 'free-plan';

export type PlanFeaturesStaticFields = {
  header: string;
  bgColor: string;
  subItems: {
    name: string;
    desc?: string;
  }[];
}[];

export type PlanFeaturesStaticValues = Record<
  SubscriptionPlanName,
  {
    fromWallet: {
      value: string;
      type: 'string';
      color?: boolean;
    }[];
    fromBank: {
      type: 'minMax' | 'string';
      value?: string;
      min?: string;
      max?: string;
      color?: boolean;
    }[];
    features: {
      value: string | boolean;
      type: 'check' | 'string';
      color?: boolean;
    }[];
    checkMailing: {
      value: string;
      type: 'string';
      color?: boolean;
    }[];
  }
>;

export interface ICheckRenewalStatus {
  hasPendingInvoice: boolean
  latestInvoice: ILatestInvoice
  renewalRequired: boolean
}

export interface ILatestInvoice {
  id: number | string
  invoice_id: string
  invoice_number: string
  amount: string
  due_date: string
  status: string
  mode: 'renew' | 'sync'
}

export interface IInvoiceRowData {
  id: string;
  inv_date: string;
  inv_due_date: string;
  inv_item_description: string;
  inv_no: string;
  inv_total: string;
  status: string;
  process_status: {
    code: string | null;
    description: string | null;
  };
  created_at: string;
}

export interface IRenewalPaymentResponse {
  url: string;
  hostedPageId: string;
  invoiceId: number;
  amount: string;
  invoiceNumber: string;
}
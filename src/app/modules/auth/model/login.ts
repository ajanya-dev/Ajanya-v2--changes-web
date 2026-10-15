export interface ILoginSlider {
  heading: {
    main: string;
    sub: string;
  };
  content: {
    main: string;
    sub: string;
  };
  image: {
    title: string;
    url: string;
    link: string;
  };
}
export interface ISocialIcon {
  name: string;
  image: string;
  url: string;
  styles?: {
    img?: { width: string; height: string };
    a?: { width: string };
    others?: string;
  };
}

export interface ILoginDetails {
  success: boolean;
  access_token: string;
  companies: ICompanies;
  companyInfo: ICompanyInfo;
  isTwoFactorEnabled: 0 | 1;
  isAdvancedTwoFactorEnabled: 0 | 1;
  'restore-date'?: string | null;
  accountClosed?: 1;
  email?: string;
  username?: string;
  isV3LayoutEnabled: number;
  isV4LayoutEnabled?: number;
  showNewUiSwitchModal?:number;
  showNeverShowAgainCheckbox?:number;
  isVerified: boolean;
  name: string;
  onBoardStatus: string;
  onBoardingLoginCount: number[];
  twoFactor: {
    success?: boolean;
    backupActivated?: boolean;
    errorMsg?: string | number;
  };
  isNewUser: number;
  pendingPolicy: 0 | 1; //0 : policy has been accepted, 1 : policy not yet accepted.
  landingPageUrl: string;
  cloudbankEnabledCompanyId: string | undefined;
  showDemoModal: number;
  userId: number;
  hideNotshowDemoBtn: number;
  showComplianceModal: number;
  showInternationalPaymentModal: number;
  showInternationalPaymentWelcomeModal: number;
  userAccountInfo: {
    account_status?: number;
    last_transaction_date?: string;
    last_transaction_method?: number;
    last_transaction_status?: string;
    user_plan_type?: string;
  };
  loginCount?: number;
  daysSinceLastLogin?: number;
}

interface ICompanies {
  invitedCompaniesCount: number;
  parentComapnyId: string;
  parentCompanyName: string;
  totalCompanies: number;
}
export interface ICompanyInfo {
  companyId: string;
  companyName: string;
  isItDefault: number;
  isOwnCompany: boolean;
  parentOnly: boolean;
}

export interface ISliderData {
  heading: ISliderHeading;
  content: ISliderContent;
  image: ISliderImage;
}
export interface ISliderHeading {
  main: string;
  sub: string;
}
export interface ISliderContent {
  main: string;
  sub: string;
}
export interface ISliderImage {
  title: string;
  url: string;
  link: string;
}
export interface ITwoFactorTimer {
  success: boolean;
  backupActivated: number;
  errorMsg: number;
  timer: number;
}
export interface IResendOtpRes {
  success: boolean;
  message?: string;
  errorMsg?: string;
  errorCode?: number;
  timer: number;
}
export interface ITwoFactorPayload {
  otpCode: string;
  rememberDevice: number;
  dateFrequency: number;
  deviceName: string;
  backupActivated: number;
  backupCode: number;
}

export interface IRewardData {
  id: string;
  amount: string;
  credit_type: number;
  features: IRewardFeature[];
  validity: number;
}

export interface IRewardFeature {
  feature: string;
  amount: string;
}

export interface IPlan {
  id: string;
  planName: string;
  planCode: string;
  planPrice: string;
  anchorPrice: number;
  monthlyPrice: string;
  billIntervalUnit: string;
  planCategoryType: number;
  planTransactionFee: string;
  planDynamicTexts: IPlanText;
  headingFeature: string;
  planFeatures: IPlanFeature[];
}

interface IPlanText {
  textLine1: string;
  textLine2: string;
  textLine3: string | null;
  textLine4: string | null;
  textLine5: string | null;
  textLine6: string | null;
}

interface IPlanFeature {
  name: string;
  more?: string;
}

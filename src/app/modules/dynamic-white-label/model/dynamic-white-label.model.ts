import { EnvironmentId } from 'src/app/models/environment';

export interface IDynamicWhiteLabel {
  environmentId: EnvironmentId;
  attributes: IDynamicWhiteLabelAttributes;
  flags: IDynamicWhiteLabelFlags;
}

export interface IDynamicWhiteLabelAttributes {
  /**
   * Shows the name depending
   * on the environment
   */
  name?: string;

  /**
   * Shows the text WALLET
   * or CASH ACCOUNT depending
   * on the environment
   */
  wallet?: string;

  /**
   * Shows the text Search your wallet
   * or Search your cash account depending
   * on the environment
   */
  searchYourWallet?: string;

  /**
   * Shows the bankName depending
   * on the environment
   */
  bankName?: string;

  /**
   * Shows the wallet migration video depending
   * on the environment
   */
  walletMigrationVideo?: string;

  /**
   * Benefitslist in leftsection register
   */
  registerPageBenefitsList?: string[];

  /**
   * Logo to be used in cloud bank welcome page
   */
  cloudAppLogo?: string;

  /**
   * Name to be used in cloud bank welcome page
   */
  cloudAppName?: string;
  /**
   *  Represents the desired word to replace the term 'Payee'.
   */
  payeeName?:string
}

export interface IDynamicWhiteLabelFlags {
  /**
   * This attribute includes the following
   * environments,
   * - staging
   * - staging_dev
   * - production
   */
  isApplicationInOCWMode?: boolean;

  /**
   * This attribute includes the following
   * environment
   * - zilMoney
   */
  isApplicationInZilMoneyMode?: boolean;

  /**
   * This attribute includes the following
   * environments,
   * - staging
   * - staging_dev
   * - production
   * - zilMoney
   */
  isSliderDescriptionHidden?: boolean;

  /**
   * If true, we are not allowing
   * this environment to login
   */
  isLoginRestricted?: boolean;

  /**
   * If false, we are not showing
   * this environment the documentation
   */
  isDocumentationShown?: boolean;

  /**
   * If false, we are not showing
   * this environment the webhook documentation
   */
  isWebhookDocumentationShown?: boolean;

  /**
   * If false, we are not showing
   * this environment the ZilBank ads
   */
  isZilBankAdShown?: boolean;

  /**
   * If true, we are not showing
   * this environment the Credit Cards
   */
  isAddCreditCardRestricted?: boolean;

  /**
   * If true, we are showing
   * a single side UI for
   * the registration process
   */
  isSingleSideUIEnabled?: boolean;

  /**
   * If true, we are showing
   * filtering card section from dropdown
   * from "V3PaymentsTableData"
   */
  isFilterCardFromDropdown?: boolean;
  /**
   * If true, we are hiding
   * shop
   * from "sidebar"
   */
  hideShop?: boolean;
  /**
   * If true, we are hiding
   * refer and earn
   */
  hideReferAndEarn?: boolean;
  /**
   * If true, we are hiding
   * centralReport
   */
  hideCentralReport?: boolean;
  /**
   * If true, we are hiding
   * ViewMore
   */
  hideViewMore?: boolean;
  /**
   * If true, we are hiding
   * subscription
   */
  subscriptionHide?: boolean;
  /**
   * If true, we are hiding
   * payments table from side bar
   */
  hidePaymentTable?: boolean;
  /**
   * If true, we are hiding
   * recievables from side bar
   */
  hideRecievables?: boolean;
  /**
   * If true, we are hiding
   * bills from side bar
   */
  hideBill?: boolean;
  /**
   * If true, we are hiding
   * third party apps from side bar
   */
  hideThirdPartyApps?: boolean;
  /**
   * If true, we are hiding
   * payroll from side bar
   */
  hidePayroll?: boolean;
  /**
   * If true, we are hiding
   * line of credit from side bar
   */
  hideWorkingCaptal?: boolean;
  /**
   * If true, we are hiding
   * integration from side bar
   */
  hideIntegration?: boolean;
  /**
   * If true, we are hiding
   * Business tools from side bar
   */
  hideBusinessTools?: boolean;

  /**
   *True for all white label
   */
  isThirdPartyImportEnabled?: boolean;

  /**
   * flag to show mobile app download page for small screens
   */
  isShowMobileAppDownloadScreen?: boolean;

  /**
   * If true, we can determine whether the
   * current environment is WhiteLabel or not.
   */
  isWhiteLabel?: boolean;

  /**
   * Used to show verification letter download button in cloud more info.
   */
  isShowVerificationLetter?: boolean;

  /**
   * If true, hide ocw terms and condition and show quickbank terms and condition.
   */
  quickbankTermsAndCondition?:boolean;

  /**
   * If true, apply compass requirements
   */
  isCompassRequirement?:boolean,

  /** To hide book a demo button in quick banner */
  hideDemoButton?: boolean,

  /** To hide banners in quick banner */
  hideNotificationBanner?: boolean

  /** To hide Live Chat icon */
  hideLiveChat?: boolean

  /** If true, apply compass requirements */
  isArcharina?: boolean

  /** To hide login page footer text */
  hideLoginPageFooterText?: boolean

  /** To hide virtual card */
  hideVirtualCard?: boolean
  
  /** If true, apply compass white label sidebar 
   *  this will hide certain items in the sidebar
   *  and remove them from the mobile navigation
  */
  isWhitelableSidebar?: boolean

  /** If true, apply CSNHC requirements */
  isCSNHCRequirement?: boolean

  /** If true, hide payment table filter */
  hidePaymentTableFilter?: boolean
}

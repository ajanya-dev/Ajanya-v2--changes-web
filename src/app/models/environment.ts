import { ICloudBankConfig, IOcwTrackers } from './white-label';

export type EnvironmentId =
  | 'production'
  | 'staging'
  | 'staging_dev'
  | 'sebipay'
  | 'blinkPay'
  | 'muhnee'
  | 'sandbox'
  | 'ameztech'
  | 'zilMoney'
  | 'fostersear-sandbox'
  | 'quickbanked-sandbox'
  | 'quickbanked'
  | 'compass-sandbox'
  | 'compass'
  | 'buckzy-sandbox'
  | 'buckzy'
  | 'olliepay'
  | 'archarina-sandbox'
  | 'archarina'
  | 'csnhc';
export interface IEnvironment {
  production: boolean;
  /**
   * @description
   * To check its development or not
   * @type {boolean}
   */
  isItDev: boolean;
  /**
   * @description
   * To check its white label service or not
   * @type { boolean}
   * @default false
   */

  isItWhiteLabel: boolean;
  /**
   * @description
   * Unique identification ID for the environment
   * @type { EnvironmentId}
   */
  env_id: EnvironmentId;
  /**
   * @description
   * Root url of the application
   * @type {string}
   */
  rootUrl: string;
  /**
  /**
  * @description
  * Root url of the mail master application
  * @type {string}
  */
  mailMasterUrl: string;
  /**
   * @description
   * Yoodle root APi
   * @type {string}
   */
  ocwapiurl: string;
  /**
   * @description
   * Product name
   * @type {string}
   */
  productName: string;
  /**
   * @description
   * Persona Template ID
   * @type {string}
   */
  PERSONA_TEMPLATE_ID: string;
  /**
   * @description
   * Persona Environment
   * @type {string}
   */
  PERSONA_ENVIRONMENT: string;
  /**
   * @description
   * VGS ID
   * @type {string}
   */
  VGS_VAULT_ID: string;
  /**
   * @description
   * VGS environment
   * @type {string}
   */
  VGS_ENVIRONMENT: string;
  /**
   * @description
   * Google address API
   * @type {string}
   */
  GOOGLE_API: string;
  /**
   * @description
   * Zoho support chat widgetcode.
   * @type {string}
   */
  zoho__support_chat?: string;
  /**
   * @description
   * Payment short link
   * @type {string}
   */
  payment_short_link?: string;
  pusher: { key: string; cluster: string };
  /**
   * @description
   *Google Recaptcha
   */
  recaptcha?: { siteKey: string };

  support_phone_number?: string;
  support_email?: string;
  support_website?: string;
  website?: string;
  terms_and_conditions?: string;
  help_website?: string;
  from_email?: string;
  api_documentation?: string;
  cloud_bank?: ICloudBankConfig;
  /**
   * @description
   * Enable or disable subscription module.
   * @type {boolean}
   * @default true 'Enabled for the white label services'
   */
  subscriptionVisible?: boolean;
  /**
   * @description
   * Show or hide Powered by zil money logo
   * @type {boolean}
   * @default false 'Disabled for the white label services'
   */
  zilMoneyLogoVisible?: boolean;
  /**
   * @description
   * Disable Help Vidoes Icons
   * @type {boolean}
   * @default false 'Disabled for the white label services'
   */
  helpVideoVisible?: boolean;
  /**
   * @description
   * Disable add attachment using phone option in check.
   * @type {boolean}
   * @default false 'Disabled for the white label services'
   */
  checkAddAttachmentFromPhone?: boolean;
  /**
   * @description
   * Disable Social logins.
   * @type {boolean}
   * @default false 'Disabled for the white label services'
   */
  socialLoginVisible?: boolean;
  /**
   * @description
   * Disable OCW intial loader.
   * @type {boolean}
   * @default false 'Disabled for the white label services'
   */
  showOcwInitialLoader?: boolean;
  /**
   * @description
   * Disable International payment options.
   * @type {boolean}
   * @default false 'Disabled for the white label services'
   */
  internationalPaymentVisible?: boolean;
  /**
   * @description
   * Get bank account details based on routing number
   * @type {boolean}
   * @default true
   */
  bankAccountDetailsUsingRoutingNo?: boolean;
  /**
   * @description
   * Enable or disable marketing scripts.
   */
  ocw_trackers?: IOcwTrackers;

  version: string;

  /** public id for loom */
  loomPublicId?: string;

  /** flag for checking new v4 Persona(now this only for OCW users, not for whitelabel   ) */
  isV4Persona?: boolean;

  /** flag for checking new v4 Persona(now this only for OCW users, not for whitelabel   ) */
  providerType?:string

}

/* eslint-disable @typescript-eslint/naming-convention */
import { ICloudBankConfig } from 'src/app/models/white-label';
import { environment } from 'src/environments/environment';

export const zoho_support_chat =
  'https://salesiq.zoho.com/signaturesupport.ls?widgetcode=f903324a76eafa8fc529ce86181cd28effd407c2d1dec74dd5d207aa2bc4053ced006e8f7453db8a5a8cf05af2086f4c';
export const support_email = 'support@onlinecheckwriter.com';
export const support_website =
  'https://support.onlinecheckwriter.com/portal/en/kb/online-check-writer-llc';
export const app_from_email = 'support@onlinecheckwriter.com';
export const payment_short_link = 'https://paybycheck.io';
export const support_no = '(408) 775-7720';
export const app_website = 'https://onlinecheckwriter.com';
export const terms_and_conditions =
  'https://onlinecheckwriter.com/terms-of-use';
export const api_documentation =
  'https://apiv3.onlinecheckwriter.com/?_ga=2.213450004.1293115439.1644816732-43713359.1639371874';
export const help_website = '';
export const cloud_bank: ICloudBankConfig = {
  id: 'cloudBank',
  label: 'cloud bank',
  terms_and_conditions: 'https://zilbank.com/disclosures/'
};

export class StaticWhiteLabelConditions {
  /** Hidden help video icons */
  static get helpVideoVisible(): boolean {
    if (!environment?.isItWhiteLabel) return true;
    return !!environment?.helpVideoVisible;
  }
  
  /** Hidden Zil Money logo */
  static get zilMoneyLogoVisible(): boolean {
    if (!environment?.isItWhiteLabel) return true;
    return !!environment?.zilMoneyLogoVisible;
  }

  /** Hidden Subscription Module */
  static get subscriptionVisible(): boolean {
    if (!environment?.isItWhiteLabel) return true;
    return !!environment?.subscriptionVisible;
  }

  /** Hidden social logins */
  static get socialLoginVisible(): boolean {
    if (!environment?.isItWhiteLabel && environment.env_id !== 'sandbox') return true;
    return !!environment?.socialLoginVisible;
  }

  /** Hidden OCW initial loader */
  static get showOcwInitialLoader(): boolean {
    // eslint-disable-next-line no-prototype-builtins
    if (environment?.hasOwnProperty('showOcwInitialLoader')) {
      return !!environment.showOcwInitialLoader;
    }
    if (environment?.isItWhiteLabel) return false;
    return true;
  }

  /** Hidden International Payment */
  static get internationalPaymentVisible(): boolean {
    if (!environment?.isItWhiteLabel) return true;
    return !!environment?.internationalPaymentVisible;
  }

  /** Hidden Add check attachment from phone */
  static get checkAddAttachmentFromPhone(): boolean {
    if (!environment?.isItWhiteLabel) return true;
    return !!environment?.checkAddAttachmentFromPhone;
  }

  /** Get bank account details using the routing number */
  static get bankAccountDetailsUsingRoutingNo(): boolean {
    return environment?.bankAccountDetailsUsingRoutingNo !== undefined
      ? environment.bankAccountDetailsUsingRoutingNo
      : true;
  }

  /** Zoho live chat */
  static get paymentShortLink(): string {
    if (environment?.payment_short_link) {
      return environment.payment_short_link;
    }
    return payment_short_link;
  }

  /** Zoho live chat */
  static get zohoSupportChat(): string | null {
    if (!environment.isItWhiteLabel) return zoho_support_chat;
    return environment?.zoho__support_chat
      ? environment?.zoho__support_chat
      : null;
  }

  /** Customer support email address */
  static get customerSupportEmail(): string {
    if (environment?.support_email) {
      return environment.support_email;
    }
    return support_email;
  }

  /** Customer support No */
  static get customerSupportNo(): string | null {
    if (!environment?.isItWhiteLabel) return support_no;
    return environment?.support_phone_number ?? null;
  }

  /** Support Website */
  static get supportWebsite(): string {
    if (environment?.support_website) {
      return environment.support_website;
    }
    return support_website;
  }

  /** Wbsite */
  static get website(): string {
    if (environment?.website) {
      return environment.website;
    }
    return app_website;
  }

  /** Support From email address */
  static get fromEmail(): string {
    if (environment?.from_email) {
      return environment.from_email;
    }
    return app_from_email;
  }

  /** Terms and Conditions */
  static get termsAndConditions(): string {
    if (environment?.terms_and_conditions) {
      return environment.terms_and_conditions;
    }
    return terms_and_conditions;
  }

  /** Help website */
  static get helpWebsite(): string {
    if (environment?.help_website) {
      return environment.help_website;
    }
    return help_website;
  }

  /** API Documentation */
  static get apiDocumentation(): string {
    if (environment?.api_documentation) {
      return environment.api_documentation;
    }
    return api_documentation;
  }

  /** Product Name */
  static get productName(): string {
    return environment?.productName;
  }

  /** Cloud Bank */
  static get cloudBank(): ICloudBankConfig {
    if (environment?.cloud_bank) {
      return {
        id: environment.cloud_bank?.id || cloud_bank.id,
        label: environment.cloud_bank?.label || cloud_bank.label,
        terms_and_conditions:
          environment.cloud_bank?.terms_and_conditions ||
          cloud_bank.terms_and_conditions
      };
    }
    return cloud_bank;
  }
}

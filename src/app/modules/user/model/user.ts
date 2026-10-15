export interface IUserAdvancedSettings {
  en_id: number;
  name: string;
  description: string;
  slug: string;
  status: number;
  bank_accounts?: string[];
}

export interface IBusinessIndustryTypes {
  id: number;
  value: string;
  name: string;
  isChecked?: boolean;
  shortdescriptions?:string
}

export interface IUserTabs {
  allTabs: IUserTab[];
  selectedTabs: IUserTab[];
  defaultOrientation: number;
  defaultCheckListTab: number;
}

export interface IUserTab {
  name: string;
  number: number;
}

export interface IUserEmailSettings {
  isQueueEnabled: number;
  isSmtpEnabled: number;
  allowChanges: boolean;
  enableSmtp: string;
  enableEmailTemplate: string;
  smtpSettings: ISmtpSettings[];
  URL: string;
  customerSupportURL: string;
}

export interface ISmtpSettings {
  id: string;
  host: string;
  port: number;
  fromAddress: string;
  fromName: string;
  isDefault: number;
  replyToAddress: string;
  encryptionType: string;
  username: string;
  password: string;
}

export interface IUserTemplateData {
  isTemplate: boolean;
  isSMTP: boolean;
  smtpSettings: ISmtpSettings[];
  QueueEnable: number;
  SMTPEnable: number;
  selectedSMTPid: string;
  url: string;
  customerSupport: string;
}

export interface IUserEmailTemplate {
  URL: IUserEmailURL;
}

export interface IUserEmailURL {
  echeck: string;
  physicalMail: string;
  directDeposit: string;
  directDepositActionRequired: string;
}

export interface IGeneralSettings {
  systemTimezone: string;
  serialFormatting: number;
  amountFormatting: number;
  payeeFormatting: number;
  amountWordingFormatting: number;
  systemDateFormat: string;
  userCurrency: string;
  userLanguage: string;
}

export interface ITimeZone {
  value: string;
  name: string;
}

export interface IUserNotificationSettings {
  settings: IUserNotificationSetting[];
}

export interface IUserNotificationSetting {
  id: string;
  name: string;
  description: string;
  slug: string;
  status: number | boolean;
}

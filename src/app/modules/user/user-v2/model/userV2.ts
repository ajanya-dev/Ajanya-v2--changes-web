export interface IGeneralSettingsForm {
  serialFormatting: string;
  systemTimezone: string;
  payeeFormatting: string;
  amountFormatting: string;
  amountWordingFormatting: string;
  userCurrency: string;
  systemDateFormat: string;
  userLanguage: string;
}

export interface IPersonaClient {
  open: () => void;
}

export interface IPersonaClientOptions {
  templateId: string;
  environment: string;
  onLoad: () => void;
  onComplete: (inquiryId: string) => void;
  onError: (err: { status: number; code: string }) => void;
}

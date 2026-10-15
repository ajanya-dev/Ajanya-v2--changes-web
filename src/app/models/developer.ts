export interface IActivityDataDeveloper_apiData {
  token: string;
  bankaccounts: Array<IBankAccounts>;
  webhookSettings: IWebhookSettings;
  getPaidByFormWebhook: IGetPaidByFormWebhook;
}
export interface IBankAccounts {
  id: string;
  bankAccountName: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  markAsVerified?: number;
  bankAccountNickName?: string;
}
export interface IWebhookSettings {
  webhookUrl: string;
  webhookSecret: string;
  enabledServices: Array<number>;
  webhookStatus: number;
}
export interface IGetPaidByFormWebhook {
  webhookUrl: string;
  secretKey: string;
  selectAnEvent: Array<string>;
  webhookStatus: number;
}

export interface IapiSettingsLog {
  current_page: number;
  data: Array<IapiSettingsLog_data>;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url?: string;
    label: any;
    active: boolean;
  }>;
  next_page_url: string;
  path: string;
  per_page: number;
  prev_page_url: any;
  to: number;
  total: number;
}

export interface IapiSettingsLog_data {
  id: number;
  ip_address: string;
  browser: string;
  user_id: number;
  full_url: string;
  http_method: string;
  request_body: string;
  response_body: string;
  response_status: string;
  api_endpoint: string;
  api_type: number;
  created_at: string;
  updated_at: string;
}

export interface IApiSettingsDetails {
  eventId: number;
  ip: string;
  endPoint: string;
  method: string;
  requestBody: string;
  responseBody: string;
  responseStatus: string;
  CreatedAt: string;
}

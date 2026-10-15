export type CloudBankId = 'cloudBank' | 'depositAccount';

export interface IOcwTrackers {
  site24_7?: { enabled: boolean; data?: any };
  faceBookPixel?: { enabled: boolean; data?: any };
  awinConverstionCode?: { enabled: boolean; data?: any };
  siftTracking?: { enabled: boolean; data?: any };
  trueConversionTracking?: { enabled: boolean; data?: any };
  outBrain?: { enabled: boolean; data?: any };
  cjSite?: { enabled: boolean; data?: any };
  gtagEvent?: { enabled: boolean; data?: any };
  dataLayerPush?: { enabled: boolean; data?: any };
  googleAnalytics?: { enabled: boolean; data?: { key: string } };
  googleTagManager?: { enabled: boolean; data?: { key: string } };
  zohoSupportChatWidget?: {
    enabled: boolean;
    data?: { widgetId: string; adpWidgetId?: string };
  };
  microsoftUET?: { enabled: boolean; data?: any };
  moEngage?: { enabled: boolean; data?: { appId: string } };
  postHog?: { enabled: boolean; data?: { id: string }};
}

export interface ICloudBankConfig {
  id?: CloudBankId;
  label?: 'cloud bank' | 'deposit account';
  terms_and_conditions: string;
}
